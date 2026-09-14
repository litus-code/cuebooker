begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_organization_member(target_organization_id uuid)
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
  );
$$;

create or replace function private.can_manage_organization(target_organization_id uuid)
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
      and om.role in ('owner', 'admin')
  );
$$;

create or replace function private.is_organization_owner(target_organization_id uuid)
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

create or replace function private.is_artist_member(target_artist_id uuid)
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
  );
$$;

create or replace function private.can_manage_artist(target_artist_id uuid)
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
      and am.role in ('owner', 'manager')
  );
$$;

create or replace function private.is_artist_owner(target_artist_id uuid)
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

revoke all on function private.is_organization_member(uuid) from public;
revoke all on function private.can_manage_organization(uuid) from public;
revoke all on function private.is_organization_owner(uuid) from public;
revoke all on function private.is_artist_member(uuid) from public;
revoke all on function private.can_manage_artist(uuid) from public;
revoke all on function private.is_artist_owner(uuid) from public;

grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.can_manage_organization(uuid) to authenticated;
grant execute on function private.is_organization_owner(uuid) to authenticated;
grant execute on function private.is_artist_member(uuid) to authenticated;
grant execute on function private.can_manage_artist(uuid) to authenticated;
grant execute on function private.is_artist_owner(uuid) to authenticated;

drop policy if exists organizations_select_member on public.organizations;
drop policy if exists organizations_update_managers on public.organizations;
drop policy if exists organizations_delete_owner on public.organizations;
drop policy if exists organization_members_select_members on public.organization_members;
drop policy if exists organization_members_insert_owner on public.organization_members;
drop policy if exists organization_members_update_owner on public.organization_members;
drop policy if exists organization_members_delete_owner on public.organization_members;
drop policy if exists artists_select_members on public.artists;
drop policy if exists artists_update_managers on public.artists;
drop policy if exists artists_delete_owner on public.artists;
drop policy if exists artist_members_select_members on public.artist_members;
drop policy if exists artist_members_insert_owner on public.artist_members;
drop policy if exists artist_members_update_owner on public.artist_members;
drop policy if exists artist_members_delete_owner on public.artist_members;

create policy organizations_select_member
on public.organizations for select
to authenticated
using (
  created_by = (select auth.uid())
  or private.is_organization_member(id)
);

create policy organizations_update_managers
on public.organizations for update
to authenticated
using (private.can_manage_organization(id))
with check (private.can_manage_organization(id));

create policy organizations_delete_owner
on public.organizations for delete
to authenticated
using (private.is_organization_owner(id));

create policy organization_members_select_members
on public.organization_members for select
to authenticated
using (private.is_organization_member(organization_id));

create policy organization_members_insert_owner
on public.organization_members for insert
to authenticated
with check (private.is_organization_owner(organization_id));

create policy organization_members_update_owner
on public.organization_members for update
to authenticated
using (private.is_organization_owner(organization_id))
with check (private.is_organization_owner(organization_id));

create policy organization_members_delete_owner
on public.organization_members for delete
to authenticated
using (private.is_organization_owner(organization_id));

create policy artists_select_members
on public.artists for select
to authenticated
using (
  created_by = (select auth.uid())
  or private.is_artist_member(id)
);

create policy artists_update_managers
on public.artists for update
to authenticated
using (private.can_manage_artist(id))
with check (private.can_manage_artist(id));

create policy artists_delete_owner
on public.artists for delete
to authenticated
using (private.is_artist_owner(id));

create policy artist_members_select_members
on public.artist_members for select
to authenticated
using (private.is_artist_member(artist_id));

create policy artist_members_insert_owner
on public.artist_members for insert
to authenticated
with check (private.is_artist_owner(artist_id));

create policy artist_members_update_owner
on public.artist_members for update
to authenticated
using (private.is_artist_owner(artist_id))
with check (private.is_artist_owner(artist_id));

create policy artist_members_delete_owner
on public.artist_members for delete
to authenticated
using (private.is_artist_owner(artist_id));

drop function public.is_organization_member(uuid);
drop function public.can_manage_organization(uuid);
drop function public.is_organization_owner(uuid);
drop function public.is_artist_member(uuid);
drop function public.can_manage_artist(uuid);
drop function public.is_artist_owner(uuid);

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.add_organization_owner() from public, anon, authenticated;
revoke all on function public.add_artist_owner() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

commit;
