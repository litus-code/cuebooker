begin;

create or replace function private.ensure_booking_workspace(
  target_organization_id uuid default null,
  target_artist_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  resolved_workspace_id uuid;
  resolved_name text;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if (target_organization_id is null and target_artist_id is null)
    or (target_organization_id is not null and target_artist_id is not null) then
    raise exception 'exactly_one_legacy_identity_required';
  end if;

  if target_organization_id is not null then
    select wlo.workspace_id into resolved_workspace_id
    from public.workspace_legacy_organizations wlo
    where wlo.organization_id = target_organization_id;

    if resolved_workspace_id is not null then
      if not private.is_organization_member(target_organization_id) then
        raise exception 'organization_access_denied';
      end if;
      return resolved_workspace_id;
    end if;

    if not private.is_organization_owner(target_organization_id) then
      raise exception 'organization_owner_required';
    end if;

    select o.name into resolved_name
    from public.organizations o
    where o.id = target_organization_id
      and o.type = 'agency';

    if resolved_name is null then
      raise exception 'agency_not_found';
    end if;

    insert into public.workspaces (kind, name, created_by)
    values ('agency', resolved_name, current_user_id)
    returning id into resolved_workspace_id;

    insert into public.workspace_legacy_organizations (organization_id, workspace_id)
    values (target_organization_id, resolved_workspace_id);

    insert into public.workspace_members (workspace_id, user_id, role)
    select resolved_workspace_id,
           om.user_id,
           case om.role
             when 'owner' then 'owner'::public.workspace_member_role
             when 'admin' then 'admin'::public.workspace_member_role
             else 'viewer'::public.workspace_member_role
           end
    from public.organization_members om
    where om.organization_id = target_organization_id
    on conflict (workspace_id, user_id) do update set role = excluded.role;

    insert into public.workspace_artists (workspace_id, artist_id, created_by)
    select resolved_workspace_id, oa.artist_id, current_user_id
    from public.organization_artists oa
    where oa.organization_id = target_organization_id
    on conflict (workspace_id, artist_id) do nothing;

    return resolved_workspace_id;
  end if;

  select wla.workspace_id into resolved_workspace_id
  from public.workspace_legacy_artists wla
  where wla.artist_id = target_artist_id;

  if resolved_workspace_id is not null then
    if not private.is_artist_member(target_artist_id) then
      raise exception 'artist_access_denied';
    end if;
    return resolved_workspace_id;
  end if;

  if not private.is_artist_owner(target_artist_id) then
    raise exception 'artist_owner_required';
  end if;

  select a.stage_name into resolved_name
  from public.artists a
  where a.id = target_artist_id;

  if resolved_name is null then
    raise exception 'artist_not_found';
  end if;

  insert into public.workspaces (kind, name, created_by)
  values ('solo', resolved_name, current_user_id)
  returning id into resolved_workspace_id;

  insert into public.workspace_legacy_artists (artist_id, workspace_id)
  values (target_artist_id, resolved_workspace_id);

  insert into public.workspace_members (workspace_id, user_id, role)
  select resolved_workspace_id,
         am.user_id,
         case am.role
           when 'owner' then 'owner'::public.workspace_member_role
           when 'manager' then 'manager'::public.workspace_member_role
           else 'editor'::public.workspace_member_role
         end
  from public.artist_members am
  where am.artist_id = target_artist_id
  on conflict (workspace_id, user_id) do update set role = excluded.role;

  insert into public.workspace_artists (workspace_id, artist_id, created_by)
  values (resolved_workspace_id, target_artist_id, current_user_id)
  on conflict (workspace_id, artist_id) do nothing;

  return resolved_workspace_id;
end;
$$;

revoke all on function private.ensure_booking_workspace(uuid, uuid) from public, anon;
grant execute on function private.ensure_booking_workspace(uuid, uuid) to authenticated;

-- Reconcile already bootstrapped workspaces in staging/early environments.
insert into public.workspace_members (workspace_id, user_id, role)
select wla.workspace_id,
       am.user_id,
       case am.role
         when 'owner' then 'owner'::public.workspace_member_role
         when 'manager' then 'manager'::public.workspace_member_role
         else 'editor'::public.workspace_member_role
       end
from public.workspace_legacy_artists wla
join public.artist_members am on am.artist_id = wla.artist_id
on conflict (workspace_id, user_id) do update set role = excluded.role;

insert into public.workspace_members (workspace_id, user_id, role)
select wlo.workspace_id,
       om.user_id,
       case om.role
         when 'owner' then 'owner'::public.workspace_member_role
         when 'admin' then 'admin'::public.workspace_member_role
         else 'viewer'::public.workspace_member_role
       end
from public.workspace_legacy_organizations wlo
join public.organization_members om on om.organization_id = wlo.organization_id
on conflict (workspace_id, user_id) do update set role = excluded.role;

commit;
