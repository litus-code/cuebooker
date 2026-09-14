begin;

create extension if not exists pgcrypto with schema extensions;

create type public.organization_type as enum ('agency', 'promoter');
create type public.organization_member_role as enum ('owner', 'admin', 'member');
create type public.artist_member_role as enum ('owner', 'manager', 'editor');

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  type public.organization_type not null,
  name text not null check (char_length(trim(name)) between 2 and 120),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.artists (
  id uuid primary key default gen_random_uuid(),
  stage_name text not null check (char_length(trim(stage_name)) between 1 and 120),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  bio text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artist_members (
  artist_id uuid not null references public.artists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.artist_member_role not null default 'editor',
  created_at timestamptz not null default now(),
  primary key (artist_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members(user_id);
create index artist_members_user_id_idx on public.artist_members(user_id);
create index organizations_created_by_idx on public.organizations(created_by);
create index artists_created_by_idx on public.artists(created_by);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

create trigger artists_set_updated_at
before update on public.artists
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_organization_member(target_organization_id uuid)
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

create or replace function public.can_manage_organization(target_organization_id uuid)
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

create or replace function public.is_artist_member(target_artist_id uuid)
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

create or replace function public.can_manage_artist(target_artist_id uuid)
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

create or replace function public.add_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger organizations_add_owner
after insert on public.organizations
for each row execute function public.add_organization_owner();

create or replace function public.add_artist_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.artist_members (artist_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger artists_add_owner
after insert on public.artists
for each row execute function public.add_artist_owner();

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.artists enable row level security;
alter table public.artist_members enable row level security;

create policy profiles_select_self
on public.profiles for select
to authenticated
using (user_id = (select auth.uid()));

create policy profiles_update_self
on public.profiles for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy organizations_select_member
on public.organizations for select
to authenticated
using (
  created_by = (select auth.uid())
  or public.is_organization_member(id)
);

create policy organizations_insert_creator
on public.organizations for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy organizations_update_managers
on public.organizations for update
to authenticated
using (public.can_manage_organization(id))
with check (public.can_manage_organization(id));

create policy organizations_delete_owner
on public.organizations for delete
to authenticated
using (
  exists (
    select 1
    from public.organization_members om
    where om.organization_id = organizations.id
      and om.user_id = (select auth.uid())
      and om.role = 'owner'
  )
);

create policy organization_members_select_members
on public.organization_members for select
to authenticated
using (public.is_organization_member(organization_id));

create policy organization_members_insert_managers
on public.organization_members for insert
to authenticated
with check (public.can_manage_organization(organization_id));

create policy organization_members_update_managers
on public.organization_members for update
to authenticated
using (public.can_manage_organization(organization_id))
with check (public.can_manage_organization(organization_id));

create policy organization_members_delete_managers
on public.organization_members for delete
to authenticated
using (public.can_manage_organization(organization_id));

create policy artists_select_members
on public.artists for select
to authenticated
using (
  created_by = (select auth.uid())
  or public.is_artist_member(id)
);

create policy artists_insert_creator
on public.artists for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy artists_update_managers
on public.artists for update
to authenticated
using (public.can_manage_artist(id))
with check (public.can_manage_artist(id));

create policy artists_delete_owner
on public.artists for delete
to authenticated
using (
  exists (
    select 1
    from public.artist_members am
    where am.artist_id = artists.id
      and am.user_id = (select auth.uid())
      and am.role = 'owner'
  )
);

create policy artist_members_select_members
on public.artist_members for select
to authenticated
using (public.is_artist_member(artist_id));

create policy artist_members_insert_managers
on public.artist_members for insert
to authenticated
with check (public.can_manage_artist(artist_id));

create policy artist_members_update_managers
on public.artist_members for update
to authenticated
using (public.can_manage_artist(artist_id))
with check (public.can_manage_artist(artist_id));

create policy artist_members_delete_managers
on public.artist_members for delete
to authenticated
using (public.can_manage_artist(artist_id));

revoke all on public.profiles from anon;
revoke all on public.organizations from anon;
revoke all on public.organization_members from anon;
revoke all on public.artists from anon;
revoke all on public.artist_members from anon;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.organization_members to authenticated;
grant select, insert, update, delete on public.artists to authenticated;
grant select, insert, update, delete on public.artist_members to authenticated;

revoke all on function public.is_organization_member(uuid) from public;
revoke all on function public.can_manage_organization(uuid) from public;
revoke all on function public.is_artist_member(uuid) from public;
revoke all on function public.can_manage_artist(uuid) from public;

grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.can_manage_organization(uuid) to authenticated;
grant execute on function public.is_artist_member(uuid) to authenticated;
grant execute on function public.can_manage_artist(uuid) to authenticated;

commit;
