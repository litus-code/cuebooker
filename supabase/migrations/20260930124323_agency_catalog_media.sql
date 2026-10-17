begin;
-- Uploaded agency identity is private, versioned and scoped to its workspace.
create function private.agency_workspace_from_storage_name(object_name text)
returns uuid language plpgsql immutable security invoker set search_path='' as $$
begin
 if object_name !~ '^agency/[0-9a-f-]{36}/(covers|logos)/[0-9a-f-]{36}\.(jpg|png|webp)$' then return null; end if;
 return split_part(object_name,'/',2)::uuid;
exception when invalid_text_representation then return null;
end; $$;
revoke all on function private.agency_workspace_from_storage_name(text) from public,anon;
grant execute on function private.agency_workspace_from_storage_name(text) to authenticated;
create policy agency_identity_media_select on storage.objects for select to authenticated
using (bucket_id='artist-media' and private.can_manage_workspace(private.agency_workspace_from_storage_name(name)));
create policy agency_identity_media_insert on storage.objects for insert to authenticated
with check (bucket_id='artist-media' and private.can_manage_workspace(private.agency_workspace_from_storage_name(name))
 and exists(select 1 from public.workspaces w where w.id=private.agency_workspace_from_storage_name(name) and w.kind='agency'));
-- No UPDATE/DELETE policy: replacement uses a new UUID and does not erase versions.
create or replace function private.agency_catalog_payload(target_workspace_id uuid, draft boolean default false)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('name',o.name,'slug',o.slug,'published',o.agency_public_enabled,
 'tagline',o.agency_public_config->>'tagline','bio',o.agency_public_config->>'bio',
 'coverUrl',o.agency_public_config->>'coverUrl','logoUrl',o.agency_public_config->>'logoUrl',
 'coverPath',o.agency_public_config->>'coverPath','logoPath',o.agency_public_config->>'logoPath','mediaWorkspaceId',target_workspace_id,
 'contactEmail',o.agency_public_config->>'contactEmail','city',o.agency_public_config->>'city',
 'instagramUrl',o.agency_public_config->>'instagramUrl','websiteUrl',o.agency_public_config->>'websiteUrl',
 'artists',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'name',a.stage_name,'slug',a.slug,'city',a.city,'genres',a.primary_genres,
 'imagePath',a.artist_image_path,'coverPath',a.cover_image_path,'catalogVisible',wa.catalog_visible,
 'eligible',a.public_profile_enabled and r.workspace_id=wa.workspace_id,
 'acceptingRequests',coalesce(r.accepting_requests,false)) order by a.stage_name,a.id)
 from public.workspace_artists wa join public.artists a on a.id=wa.artist_id
 left join public.artist_booking_routes r on r.artist_id=a.id
 where wa.workspace_id=target_workspace_id and wa.roster_active and
 (draft or (wa.catalog_visible and a.public_profile_enabled and r.workspace_id=wa.workspace_id))), '[]'::jsonb))
 from public.workspace_legacy_organizations l join public.organizations o on o.id=l.organization_id
 join public.workspaces w on w.id=l.workspace_id and w.kind='agency'
 where l.workspace_id=target_workspace_id and o.type='agency' and (draft or o.agency_public_enabled);
$$;
create or replace function private.save_agency_catalog(target_workspace_id uuid, settings jsonb, published boolean, visible_artist_ids uuid[])
returns jsonb language plpgsql security definer set search_path='' as $$
declare o uuid; k text; v text; clean jsonb:='{}';
begin
 if (select auth.uid()) is null or not private.can_manage_workspace(target_workspace_id) then raise exception 'workspace_access_denied'; end if;
 select org.id into o from public.workspace_legacy_organizations l join public.organizations org on org.id=l.organization_id and org.type='agency' join public.workspaces w on w.id=l.workspace_id and w.kind='agency' where l.workspace_id=target_workspace_id for update of org;
 if o is null then raise exception 'agency_not_found'; end if;
 if settings is null or jsonb_typeof(settings)<>'object' or published is null then raise exception 'invalid_catalog_settings'; end if;
 foreach k in array array['tagline','bio','coverUrl','logoUrl','contactEmail','city','instagramUrl','websiteUrl'] loop
  if settings ? k and jsonb_typeof(settings->k) not in ('string','null') then raise exception 'invalid_catalog_settings'; end if;
  v:=nullif(trim(settings->>k),'');
  if char_length(v)>(case when k='bio' then 4000 when k like '%Url' then 2048 else 254 end) then raise exception 'catalog_field_too_long'; end if;
  if k like '%Url' and v is not null and v !~ '^https://[^[:space:]]+$' then raise exception 'catalog_url_requires_https'; end if;
  if k='contactEmail' and v is not null and v !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'invalid_email'; end if;
  clean:=clean||jsonb_build_object(k,v);
 end loop;
 foreach k in array array['coverPath','logoPath'] loop
  if settings ? k and jsonb_typeof(settings->k) not in ('string','null') then raise exception 'invalid_catalog_media'; end if;
  v:=case when settings ? k then nullif(trim(settings->>k),'') else (select agency_public_config->>k from public.organizations where id=o) end;
  if v is not null and (v !~ ('^agency/'||target_workspace_id::text||'/'||(case when k='coverPath' then 'covers' else 'logos' end)||'/[0-9a-f-]{36}\.(jpg|png|webp)$') or not exists(select 1 from storage.objects where bucket_id='artist-media' and name=v)) then raise exception 'invalid_catalog_media'; end if;
  clean:=clean||jsonb_build_object(k,v);
 end loop;
 if exists(select 1 from unnest(coalesce(visible_artist_ids,'{}')) id where not exists(
  select 1 from public.workspace_artists wa join public.artists a on a.id=wa.artist_id join public.artist_booking_routes r on r.artist_id=a.id and r.workspace_id=wa.workspace_id
  where wa.workspace_id=target_workspace_id and wa.artist_id=id and wa.roster_active and a.public_profile_enabled
 )) then raise exception 'catalog_artist_not_ready'; end if;
 if published and (clean->>'bio' is null or clean->>'contactEmail' is null or cardinality(coalesce(visible_artist_ids,'{}'))=0) then raise exception 'catalog_publication_incomplete'; end if;
 update public.organizations set agency_public_config=clean,agency_public_enabled=published where id=o;
 update public.workspace_artists set catalog_visible=artist_id=any(coalesce(visible_artist_ids,'{}')) where workspace_id=target_workspace_id;
 return private.agency_catalog_payload(target_workspace_id,true);
end; $$;

commit;
