begin;

create table public.workspace_legacy_organizations (
  organization_id uuid primary key references public.organizations(id) on delete restrict,
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.workspace_legacy_artists (
  artist_id uuid primary key references public.artists(id) on delete restrict,
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.workspace_legacy_organizations enable row level security;
alter table public.workspace_legacy_artists enable row level security;

create policy workspace_legacy_organizations_select_member
on public.workspace_legacy_organizations for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy workspace_legacy_artists_select_member
on public.workspace_legacy_artists for select
to authenticated
using (private.is_workspace_member(workspace_id));

revoke all on table public.workspace_legacy_organizations from anon, authenticated;
revoke all on table public.workspace_legacy_artists from anon, authenticated;
grant select on table public.workspace_legacy_organizations to authenticated;
grant select on table public.workspace_legacy_artists to authenticated;

create or replace function public.ensure_booking_workspace(
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
    if not private.is_organization_owner(target_organization_id) then
      raise exception 'organization_owner_required';
    end if;

    select o.name
    into resolved_name
    from public.organizations o
    where o.id = target_organization_id
      and o.type = 'agency';

    if resolved_name is null then
      raise exception 'agency_not_found';
    end if;

    select wlo.workspace_id
    into resolved_workspace_id
    from public.workspace_legacy_organizations wlo
    where wlo.organization_id = target_organization_id;

    if resolved_workspace_id is not null then
      return resolved_workspace_id;
    end if;

    insert into public.workspaces (kind, name, created_by)
    values ('agency', resolved_name, current_user_id)
    returning id into resolved_workspace_id;

    insert into public.workspace_legacy_organizations (organization_id, workspace_id)
    values (target_organization_id, resolved_workspace_id);

    insert into public.workspace_artists (workspace_id, artist_id, created_by)
    select resolved_workspace_id, oa.artist_id, current_user_id
    from public.organization_artists oa
    where oa.organization_id = target_organization_id
    on conflict (workspace_id, artist_id) do nothing;

    return resolved_workspace_id;
  end if;

  if not private.is_artist_owner(target_artist_id) then
    raise exception 'artist_owner_required';
  end if;

  select a.stage_name
  into resolved_name
  from public.artists a
  where a.id = target_artist_id;

  if resolved_name is null then
    raise exception 'artist_not_found';
  end if;

  select wla.workspace_id
  into resolved_workspace_id
  from public.workspace_legacy_artists wla
  where wla.artist_id = target_artist_id;

  if resolved_workspace_id is not null then
    return resolved_workspace_id;
  end if;

  insert into public.workspaces (kind, name, created_by)
  values ('solo', resolved_name, current_user_id)
  returning id into resolved_workspace_id;

  insert into public.workspace_legacy_artists (artist_id, workspace_id)
  values (target_artist_id, resolved_workspace_id);

  insert into public.workspace_artists (workspace_id, artist_id, created_by)
  values (resolved_workspace_id, target_artist_id, current_user_id)
  on conflict (workspace_id, artist_id) do nothing;

  return resolved_workspace_id;
end;
$$;

revoke all on function public.ensure_booking_workspace(uuid, uuid) from public, anon;
grant execute on function public.ensure_booking_workspace(uuid, uuid) to authenticated;

comment on function public.ensure_booking_workspace(uuid, uuid) is
  'Idempotently creates the new Booking Core workspace for one legacy agency or solo artist owner.';

commit;
