begin;

create or replace function public.is_organization_owner(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = target_organization_id
      and om.user_id = (select auth.uid())
      and om.role = 'owner'
  );
$$;

create or replace function public.is_artist_owner(target_artist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.artist_members am
    where am.artist_id = target_artist_id
      and am.user_id = (select auth.uid())
      and am.role = 'owner'
  );
$$;

drop policy if exists organization_members_insert_managers on public.organization_members;
drop policy if exists organization_members_update_managers on public.organization_members;
drop policy if exists organization_members_delete_managers on public.organization_members;

create policy organization_members_insert_owner
on public.organization_members for insert
to authenticated
with check (public.is_organization_owner(organization_id));

create policy organization_members_update_owner
on public.organization_members for update
to authenticated
using (public.is_organization_owner(organization_id))
with check (public.is_organization_owner(organization_id));

create policy organization_members_delete_owner
on public.organization_members for delete
to authenticated
using (public.is_organization_owner(organization_id));

drop policy if exists artist_members_insert_managers on public.artist_members;
drop policy if exists artist_members_update_managers on public.artist_members;
drop policy if exists artist_members_delete_managers on public.artist_members;

create policy artist_members_insert_owner
on public.artist_members for insert
to authenticated
with check (public.is_artist_owner(artist_id));

create policy artist_members_update_owner
on public.artist_members for update
to authenticated
using (public.is_artist_owner(artist_id))
with check (public.is_artist_owner(artist_id));

create policy artist_members_delete_owner
on public.artist_members for delete
to authenticated
using (public.is_artist_owner(artist_id));

revoke update on public.profiles from authenticated;
revoke update on public.organizations from authenticated;
revoke update on public.organization_members from authenticated;
revoke update on public.artists from authenticated;
revoke update on public.artist_members from authenticated;

grant update (display_name, onboarding_completed) on public.profiles to authenticated;
grant update (type, name, slug) on public.organizations to authenticated;
grant update (role) on public.organization_members to authenticated;
grant update (stage_name, slug, bio) on public.artists to authenticated;
grant update (role) on public.artist_members to authenticated;

revoke all on function public.is_organization_owner(uuid) from public;
revoke all on function public.is_artist_owner(uuid) from public;
grant execute on function public.is_organization_owner(uuid) to authenticated;
grant execute on function public.is_artist_owner(uuid) to authenticated;

commit;
