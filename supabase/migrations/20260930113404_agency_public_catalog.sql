begin;
-- Public presentation belongs to the existing Organization; catalogue visibility
-- belongs to the existing operational roster. No new Agency/Artist relation.
alter table public.organizations add column agency_public_enabled boolean not null default false,
 add column agency_public_config jsonb not null default '{}'::jsonb
 check(jsonb_typeof(agency_public_config)='object' and char_length(agency_public_config::text)<=16000);
alter table public.workspace_artists add column catalog_visible boolean not null default false;

create function private.agency_catalog_payload(target_workspace_id uuid, draft boolean default false)
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('name',o.name,'slug',o.slug,'published',o.agency_public_enabled,
 'tagline',o.agency_public_config->>'tagline','bio',o.agency_public_config->>'bio',
 'coverUrl',o.agency_public_config->>'coverUrl','logoUrl',o.agency_public_config->>'logoUrl',
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
revoke all on function private.agency_catalog_payload(uuid,boolean) from public,anon,authenticated;

create function private.get_agency_catalog(target_workspace_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if (select auth.uid()) is null or not private.can_manage_workspace(target_workspace_id) then raise exception 'workspace_access_denied'; end if;
 return private.agency_catalog_payload(target_workspace_id,true);
end; $$;
create function public.get_agency_catalog(target_workspace_id uuid)
returns jsonb language sql stable security invoker set search_path='' as $$ select private.get_agency_catalog(target_workspace_id); $$;

create function private.save_agency_catalog(target_workspace_id uuid, settings jsonb, published boolean, visible_artist_ids uuid[])
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
 if exists(select 1 from unnest(coalesce(visible_artist_ids,'{}')) id where not exists(
  select 1 from public.workspace_artists wa join public.artists a on a.id=wa.artist_id join public.artist_booking_routes r on r.artist_id=a.id and r.workspace_id=wa.workspace_id
  where wa.workspace_id=target_workspace_id and wa.artist_id=id and wa.roster_active and a.public_profile_enabled
 )) then raise exception 'catalog_artist_not_ready'; end if;
 if published and (clean->>'bio' is null or clean->>'contactEmail' is null or cardinality(coalesce(visible_artist_ids,'{}'))=0) then raise exception 'catalog_publication_incomplete'; end if;
 update public.organizations set agency_public_config=clean,agency_public_enabled=published where id=o;
 update public.workspace_artists set catalog_visible=artist_id=any(coalesce(visible_artist_ids,'{}')) where workspace_id=target_workspace_id;
 return private.agency_catalog_payload(target_workspace_id,true);
end; $$;
create function public.save_agency_catalog(target_workspace_id uuid, settings jsonb, published boolean, visible_artist_ids uuid[])
returns jsonb language sql security invoker set search_path='' as $$ select private.save_agency_catalog(target_workspace_id,settings,published,visible_artist_ids); $$;

-- Called only by the existing public Edge boundary. It returns a narrow allowlist,
-- never team, fees, bookings, notes, contacts or unpublished artist records.
create function private.get_public_agency_profile(agency_slug text)
returns jsonb language sql stable security definer set search_path='' as $$
 select private.agency_catalog_payload(l.workspace_id,false) from public.organizations o join public.workspace_legacy_organizations l on l.organization_id=o.id where o.type='agency' and o.slug=agency_slug and o.agency_public_enabled;
$$;
create function public.get_public_agency_profile(agency_slug text)
returns jsonb language sql stable security invoker set search_path='' as $$ select private.get_public_agency_profile(agency_slug); $$;
revoke all on function private.get_public_agency_profile(text),public.get_public_agency_profile(text) from public,anon,authenticated;
grant execute on function private.get_public_agency_profile(text),public.get_public_agency_profile(text) to service_role;
revoke all on function private.get_agency_catalog(uuid),public.get_agency_catalog(uuid),private.save_agency_catalog(uuid,jsonb,boolean,uuid[]),public.save_agency_catalog(uuid,jsonb,boolean,uuid[]) from public,anon;
grant execute on function private.get_agency_catalog(uuid),public.get_agency_catalog(uuid),private.save_agency_catalog(uuid,jsonb,boolean,uuid[]),public.save_agency_catalog(uuid,jsonb,boolean,uuid[]) to authenticated;
commit;
