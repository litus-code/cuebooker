begin;

-- Keep historical workspace/booking references when an artist leaves the active roster.
alter table public.workspace_artists
  add column roster_active boolean not null default true;

grant update (roster_active) on public.workspace_artists to authenticated;

create policy workspace_artists_update_roster_managers
on public.workspace_artists for update to authenticated
using (private.can_manage_workspace(workspace_id))
with check (private.can_manage_workspace(workspace_id));

-- Agency members must be able to identify the artists on their workspace roster.
create policy artists_select_workspace_roster
on public.artists for select to authenticated
using (exists (
  select 1 from public.workspace_artists wa
  where wa.artist_id = artists.id and private.is_workspace_member(wa.workspace_id)
));

create or replace function private.can_manage_roster_artist(target_artist_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.workspace_artists wa
    join public.workspaces w on w.id = wa.workspace_id and w.kind = 'agency'
    join public.workspace_members wm on wm.workspace_id = w.id
    where wa.artist_id = target_artist_id and wa.roster_active
      and wm.user_id = (select auth.uid()) and wm.role in ('owner', 'admin', 'manager')
  );
$$;
revoke all on function private.can_manage_roster_artist(uuid) from public, anon;
grant execute on function private.can_manage_roster_artist(uuid) to authenticated;

create policy artists_update_agency_managers
on public.artists for update to authenticated
using (private.can_manage_roster_artist(id))
with check (private.can_manage_roster_artist(id));

create policy artist_booking_profiles_select_agency
on public.artist_booking_profiles for select to authenticated
using (exists (
  select 1 from public.workspace_artists wa
  where wa.artist_id = artist_booking_profiles.artist_id and private.is_workspace_member(wa.workspace_id)
));
create policy artist_booking_profiles_insert_agency_managers
on public.artist_booking_profiles for insert to authenticated
with check (private.can_manage_roster_artist(artist_id));
create policy artist_booking_profiles_update_agency_managers
on public.artist_booking_profiles for update to authenticated
using (private.can_manage_roster_artist(artist_id))
with check (private.can_manage_roster_artist(artist_id));

-- The old organization relation is still an identity bridge. Booking Core's
-- workspace_artists is the operational roster; new artists must enter both.
create or replace function public.add_agency_artist(
  target_organization_id uuid,
  artist_name text,
  artist_slug text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  created_artist_id uuid;
  resolved_workspace_id uuid;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;
  if not private.can_manage_organization(target_organization_id) then
    raise exception 'organization_access_denied';
  end if;
  if not exists (select 1 from public.organizations where id = target_organization_id and type = 'agency') then
    raise exception 'agency_not_found';
  end if;
  if char_length(trim(coalesce(artist_name, ''))) < 1 then
    raise exception 'invalid_artist_name';
  end if;
  if artist_slug is null or artist_slug <> lower(artist_slug)
    or artist_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'invalid_artist_slug';
  end if;

  -- Existing agency workspaces are reused; only an owner may bootstrap one.
  resolved_workspace_id := private.ensure_booking_workspace(target_organization_id, null);

  insert into public.artists (stage_name, slug, created_by)
  values (trim(artist_name), artist_slug, current_user_id)
  returning id into created_artist_id;

  insert into public.organization_artists (organization_id, artist_id, created_by)
  values (target_organization_id, created_artist_id, current_user_id);

  insert into public.workspace_artists (workspace_id, artist_id, created_by)
  values (resolved_workspace_id, created_artist_id, current_user_id);

  return created_artist_id;
end;
$$;

revoke all on function public.add_agency_artist(uuid, text, text) from public, anon;
grant execute on function public.add_agency_artist(uuid, text, text) to authenticated;

commit;
