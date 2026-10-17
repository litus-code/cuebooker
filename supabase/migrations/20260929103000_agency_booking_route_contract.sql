begin;

-- The route is the single booking destination for an artist. Agency roster
-- membership alone never transfers an existing independent artist's route.
create or replace function private.can_manage_agency_booking_route(target_workspace_id uuid, target_artist_id uuid)
returns boolean language sql stable security definer set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.workspace_artists wa
    join public.workspaces w on w.id = wa.workspace_id and w.kind = 'agency'
    join public.workspace_members wm on wm.workspace_id = w.id
    where wa.workspace_id = target_workspace_id and wa.artist_id = target_artist_id
      and wa.roster_active and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'manager')
  );
$$;
revoke all on function private.can_manage_agency_booking_route(uuid, uuid) from public, anon;
grant execute on function private.can_manage_agency_booking_route(uuid, uuid) to authenticated;

create policy artist_booking_routes_insert_agency
on public.artist_booking_routes for insert to authenticated
with check (
  private.can_manage_agency_booking_route(workspace_id, artist_id)
  and created_by = (select auth.uid())
);
create policy artist_booking_routes_update_agency
on public.artist_booking_routes for update to authenticated
using (private.can_manage_agency_booking_route(workspace_id, artist_id))
with check (private.can_manage_agency_booking_route(workspace_id, artist_id));

-- Retirement must close public enquiries before the active-roster policy
-- ceases to permit route updates. Historical bookings and the route remain.
create or replace function private.close_retired_agency_booking_route()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.roster_active and not new.roster_active
    and exists (select 1 from public.workspaces w where w.id = new.workspace_id and w.kind = 'agency') then
    update public.artist_booking_routes
    set accepting_requests = false
    where workspace_id = new.workspace_id and artist_id = new.artist_id;
  end if;
  return new;
end;
$$;
revoke all on function private.close_retired_agency_booking_route() from public, anon, authenticated;
create trigger close_retired_agency_booking_route
before update of roster_active on public.workspace_artists
for each row execute function private.close_retired_agency_booking_route();

-- Newly created agency artists start with a closed route to their agency.
-- On an existing artist, this RPC never runs: no silent route transfer.
create or replace function public.add_agency_artist(
  target_organization_id uuid,
  artist_name text,
  artist_slug text
)
returns uuid language plpgsql security invoker set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  created_artist_id uuid;
  resolved_workspace_id uuid;
begin
  if current_user_id is null then raise exception 'authentication_required'; end if;
  if not private.can_manage_organization(target_organization_id) then raise exception 'organization_access_denied'; end if;
  if not exists (select 1 from public.organizations where id = target_organization_id and type = 'agency') then
    raise exception 'agency_not_found';
  end if;
  if char_length(trim(coalesce(artist_name, ''))) < 1 then raise exception 'invalid_artist_name'; end if;
  if artist_slug is null or artist_slug <> lower(artist_slug)
    or artist_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'invalid_artist_slug'; end if;

  resolved_workspace_id := private.ensure_booking_workspace(target_organization_id, null);
  insert into public.artists (stage_name, slug, created_by)
  values (trim(artist_name), artist_slug, current_user_id)
  returning id into created_artist_id;
  insert into public.organization_artists (organization_id, artist_id, created_by)
  values (target_organization_id, created_artist_id, current_user_id);
  insert into public.workspace_artists (workspace_id, artist_id, created_by)
  values (resolved_workspace_id, created_artist_id, current_user_id);
  insert into public.artist_booking_routes (artist_id, workspace_id, created_by)
  values (created_artist_id, resolved_workspace_id, current_user_id);
  return created_artist_id;
end;
$$;
revoke all on function public.add_agency_artist(uuid, text, text) from public, anon;
grant execute on function public.add_agency_artist(uuid, text, text) to authenticated;

-- Backfill only unambiguous agency-only artists without a route.
insert into public.artist_booking_routes (artist_id, workspace_id, created_by)
select wa.artist_id, wa.workspace_id, a.created_by
from public.workspace_artists wa
join public.workspaces w on w.id = wa.workspace_id and w.kind = 'agency'
join public.artists a on a.id = wa.artist_id
where wa.roster_active
  and not exists (select 1 from public.artist_booking_routes r where r.artist_id = wa.artist_id)
  and (select count(*) from public.workspace_artists other where other.artist_id = wa.artist_id) = 1
on conflict (artist_id) do nothing;

update public.artist_booking_routes r set accepting_requests = false
from public.workspace_artists wa, public.workspaces w
where r.workspace_id = wa.workspace_id and r.artist_id = wa.artist_id
  and w.id = wa.workspace_id and w.kind = 'agency'
  and not wa.roster_active and r.accepting_requests;

commit;
