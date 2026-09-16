begin;

-- Booking Core foundation.
-- `public.organizations` is an existing identity/membership concept. Operational
-- external entities (venues, promoters, agencies, festivals, brands) are kept
-- separate as `counterparties` so tenant security does not depend on being a
-- member of the external organization.

create type public.workspace_member_role as enum ('owner', 'admin', 'manager', 'editor', 'viewer');
create type public.workspace_kind as enum ('solo', 'agency');
create type public.counterparty_kind as enum ('venue', 'promoter', 'agency', 'festival', 'brand', 'other');
create type public.booking_source as enum ('booking_form', 'phone', 'whatsapp', 'email', 'instagram', 'in_person', 'manager', 'manual', 'other');
create type public.booking_status as enum ('new', 'in_conversation', 'waiting_response', 'confirmed', 'rejected', 'cancelled');
create type public.activity_type as enum (
  'phone',
  'email',
  'whatsapp',
  'instagram',
  'note',
  'status_change',
  'hold_created',
  'hold_released',
  'hold_converted',
  'next_move_created',
  'next_move_completed',
  'system'
);
create type public.activity_direction as enum ('inbound', 'outbound', 'internal');
create type public.activity_visibility as enum ('workspace', 'private');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  kind public.workspace_kind not null default 'solo',
  name text not null check (char_length(trim(name)) between 1 and 120),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.workspace_member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table public.workspace_artists (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  artist_id uuid not null references public.artists(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (workspace_id, artist_id)
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  email text,
  phone text,
  role_label text,
  notes text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table public.counterparties (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  kind public.counterparty_kind not null default 'other',
  name text not null check (char_length(trim(name)) between 1 and 180),
  city text,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  website_url text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

create table public.contact_counterparties (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid not null,
  counterparty_id uuid not null,
  relationship_label text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (contact_id, counterparty_id),
  foreign key (workspace_id, contact_id)
    references public.contacts(workspace_id, id) on delete cascade,
  foreign key (workspace_id, counterparty_id)
    references public.counterparties(workspace_id, id) on delete cascade
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  artist_id uuid not null,
  primary_contact_id uuid,
  counterparty_id uuid,
  source public.booking_source not null default 'manual',
  status public.booking_status not null default 'new',
  event_name text,
  venue_name text,
  city text,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  event_date date,
  start_time time,
  end_time time,
  event_timezone text,
  offer_amount_minor bigint check (offer_amount_minor is null or offer_amount_minor >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  fee_basis text,
  archived_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, artist_id)
    references public.workspace_artists(workspace_id, artist_id) on delete restrict,
  foreign key (workspace_id, primary_contact_id)
    references public.contacts(workspace_id, id) on delete set null,
  foreign key (workspace_id, counterparty_id)
    references public.counterparties(workspace_id, id) on delete set null,
  check (start_time is null or event_date is not null),
  check (end_time is null or event_date is not null),
  check (end_time is null or start_time is null or end_time > start_time)
);

create table public.booking_contacts (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  booking_id uuid not null,
  contact_id uuid not null,
  role_label text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (booking_id, contact_id),
  foreign key (workspace_id, booking_id)
    references public.bookings(workspace_id, id) on delete cascade,
  foreign key (workspace_id, contact_id)
    references public.contacts(workspace_id, id) on delete cascade
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  booking_id uuid not null,
  type public.activity_type not null,
  direction public.activity_direction,
  contact_id uuid,
  actor_user_id uuid references auth.users(id) on delete set null,
  body text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  visibility public.activity_visibility not null default 'workspace',
  occurred_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, booking_id)
    references public.bookings(workspace_id, id) on delete cascade,
  foreign key (workspace_id, contact_id)
    references public.contacts(workspace_id, id) on delete set null
);

create index workspace_members_user_id_idx on public.workspace_members(user_id);
create index workspace_artists_artist_id_idx on public.workspace_artists(artist_id);
create index contacts_workspace_name_idx on public.contacts(workspace_id, lower(name));
create index contacts_workspace_email_idx on public.contacts(workspace_id, lower(email)) where email is not null;
create index counterparties_workspace_name_idx on public.counterparties(workspace_id, lower(name));
create index bookings_workspace_updated_idx on public.bookings(workspace_id, updated_at desc);
create index bookings_workspace_status_idx on public.bookings(workspace_id, status, updated_at desc);
create index bookings_workspace_artist_idx on public.bookings(workspace_id, artist_id, updated_at desc);
create index bookings_workspace_event_date_idx on public.bookings(workspace_id, event_date) where event_date is not null;
create index bookings_primary_contact_idx on public.bookings(workspace_id, primary_contact_id) where primary_contact_id is not null;
create index bookings_counterparty_idx on public.bookings(workspace_id, counterparty_id) where counterparty_id is not null;
create index activities_booking_occurred_idx on public.activities(workspace_id, booking_id, occurred_at desc);
create index activities_workspace_occurred_idx on public.activities(workspace_id, occurred_at desc);
create index activities_contact_idx on public.activities(workspace_id, contact_id, occurred_at desc) where contact_id is not null;

create or replace function private.preserve_workspace_record_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.workspace_id <> old.workspace_id then
    raise exception 'workspace_id_is_immutable';
  end if;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

create or replace function private.preserve_workspace_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger workspaces_preserve_identity
before update on public.workspaces
for each row execute function private.preserve_workspace_identity();

create trigger contacts_preserve_identity
before update on public.contacts
for each row execute function private.preserve_workspace_record_identity();

create trigger counterparties_preserve_identity
before update on public.counterparties
for each row execute function private.preserve_workspace_record_identity();

create trigger bookings_preserve_identity
before update on public.bookings
for each row execute function private.preserve_workspace_record_identity();

create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function public.set_updated_at();

create trigger counterparties_set_updated_at
before update on public.counterparties
for each row execute function public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create or replace function private.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_edit_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin', 'manager', 'editor')
  );
$$;

create or replace function private.can_manage_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role in ('owner', 'admin')
  );
$$;

create or replace function private.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = (select auth.uid())
      and wm.role = 'owner'
  );
$$;

create or replace function public.add_workspace_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger workspaces_add_owner
after insert on public.workspaces
for each row execute function public.add_workspace_owner();

create or replace function public.protect_workspace_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  remaining_owners integer;
begin
  if old.role <> 'owner' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.role = 'owner' then
    return new;
  end if;

  select count(*) into remaining_owners
  from public.workspace_members wm
  where wm.workspace_id = old.workspace_id
    and wm.role = 'owner'
    and wm.user_id <> old.user_id;

  if remaining_owners = 0 then
    raise exception 'workspace_requires_owner';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger workspace_members_protect_last_owner
before update or delete on public.workspace_members
for each row execute function public.protect_workspace_last_owner();

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_artists enable row level security;
alter table public.contacts enable row level security;
alter table public.counterparties enable row level security;
alter table public.contact_counterparties enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_contacts enable row level security;
alter table public.activities enable row level security;

create policy workspaces_select_member
on public.workspaces for select
to authenticated
using (created_by = (select auth.uid()) or private.is_workspace_member(id));

create policy workspaces_insert_creator
on public.workspaces for insert
to authenticated
with check (created_by = (select auth.uid()));

create policy workspaces_update_managers
on public.workspaces for update
to authenticated
using (private.can_manage_workspace(id))
with check (private.can_manage_workspace(id));

create policy workspaces_delete_owner
on public.workspaces for delete
to authenticated
using (private.is_workspace_owner(id));

create policy workspace_members_select_member
on public.workspace_members for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy workspace_members_insert_managers
on public.workspace_members for insert
to authenticated
with check (
  (role = 'owner' and private.is_workspace_owner(workspace_id))
  or (role <> 'owner' and private.can_manage_workspace(workspace_id))
);

create policy workspace_members_update_managers
on public.workspace_members for update
to authenticated
using (
  (role = 'owner' and private.is_workspace_owner(workspace_id))
  or (role <> 'owner' and private.can_manage_workspace(workspace_id))
)
with check (
  (role = 'owner' and private.is_workspace_owner(workspace_id))
  or (role <> 'owner' and private.can_manage_workspace(workspace_id))
);

create policy workspace_members_delete_managers
on public.workspace_members for delete
to authenticated
using (
  (role = 'owner' and private.is_workspace_owner(workspace_id))
  or (role <> 'owner' and private.can_manage_workspace(workspace_id))
);

create policy workspace_artists_select_member
on public.workspace_artists for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy workspace_artists_insert_managers
on public.workspace_artists for insert
to authenticated
with check (
  private.can_manage_workspace(workspace_id)
  and private.can_manage_artist(artist_id)
  and created_by = (select auth.uid())
);

create policy workspace_artists_delete_managers
on public.workspace_artists for delete
to authenticated
using (private.can_manage_workspace(workspace_id));

create policy contacts_select_member
on public.contacts for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy contacts_insert_editor
on public.contacts for insert
to authenticated
with check (private.can_edit_workspace(workspace_id) and created_by = (select auth.uid()));

create policy contacts_update_editor
on public.contacts for update
to authenticated
using (private.can_edit_workspace(workspace_id))
with check (private.can_edit_workspace(workspace_id));

create policy contacts_delete_editor
on public.contacts for delete
to authenticated
using (private.can_edit_workspace(workspace_id));

create policy counterparties_select_member
on public.counterparties for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy counterparties_insert_editor
on public.counterparties for insert
to authenticated
with check (private.can_edit_workspace(workspace_id) and created_by = (select auth.uid()));

create policy counterparties_update_editor
on public.counterparties for update
to authenticated
using (private.can_edit_workspace(workspace_id))
with check (private.can_edit_workspace(workspace_id));

create policy counterparties_delete_editor
on public.counterparties for delete
to authenticated
using (private.can_edit_workspace(workspace_id));

create policy contact_counterparties_select_member
on public.contact_counterparties for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy contact_counterparties_insert_editor
on public.contact_counterparties for insert
to authenticated
with check (private.can_edit_workspace(workspace_id) and created_by = (select auth.uid()));

create policy contact_counterparties_delete_editor
on public.contact_counterparties for delete
to authenticated
using (private.can_edit_workspace(workspace_id));

create policy bookings_select_member
on public.bookings for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy bookings_insert_editor
on public.bookings for insert
to authenticated
with check (private.can_edit_workspace(workspace_id) and created_by = (select auth.uid()));

create policy bookings_update_editor
on public.bookings for update
to authenticated
using (private.can_edit_workspace(workspace_id))
with check (private.can_edit_workspace(workspace_id));

create policy bookings_delete_editor
on public.bookings for delete
to authenticated
using (private.can_edit_workspace(workspace_id));

create policy booking_contacts_select_member
on public.booking_contacts for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy booking_contacts_insert_editor
on public.booking_contacts for insert
to authenticated
with check (private.can_edit_workspace(workspace_id) and created_by = (select auth.uid()));

create policy booking_contacts_delete_editor
on public.booking_contacts for delete
to authenticated
using (private.can_edit_workspace(workspace_id));

create policy activities_select_member
on public.activities for select
to authenticated
using (
  private.is_workspace_member(workspace_id)
  and (
    visibility = 'workspace'
    or created_by = (select auth.uid())
  )
);

create policy activities_insert_editor
on public.activities for insert
to authenticated
with check (
  private.can_edit_workspace(workspace_id)
  and created_by = (select auth.uid())
  and (actor_user_id is null or actor_user_id = (select auth.uid()))
);

revoke all on table public.workspaces from anon, authenticated;
revoke all on table public.workspace_members from anon, authenticated;
revoke all on table public.workspace_artists from anon, authenticated;
revoke all on table public.contacts from anon, authenticated;
revoke all on table public.counterparties from anon, authenticated;
revoke all on table public.contact_counterparties from anon, authenticated;
revoke all on table public.bookings from anon, authenticated;
revoke all on table public.booking_contacts from anon, authenticated;
revoke all on table public.activities from anon, authenticated;

grant select, insert, update, delete on table public.workspaces to authenticated;
grant select, insert, update, delete on table public.workspace_members to authenticated;
grant select, insert, delete on table public.workspace_artists to authenticated;
grant select, insert, update, delete on table public.contacts to authenticated;
grant select, insert, update, delete on table public.counterparties to authenticated;
grant select, insert, delete on table public.contact_counterparties to authenticated;
grant select, insert, update, delete on table public.bookings to authenticated;
grant select, insert, delete on table public.booking_contacts to authenticated;
grant select, insert on table public.activities to authenticated;

revoke all on function private.is_workspace_member(uuid) from public, anon;
revoke all on function private.can_edit_workspace(uuid) from public, anon;
revoke all on function private.can_manage_workspace(uuid) from public, anon;
revoke all on function private.is_workspace_owner(uuid) from public, anon;
revoke all on function private.preserve_workspace_record_identity() from public, anon, authenticated;
revoke all on function private.preserve_workspace_identity() from public, anon, authenticated;
revoke all on function public.add_workspace_owner() from public, anon, authenticated;
revoke all on function public.protect_workspace_last_owner() from public, anon, authenticated;

grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.can_edit_workspace(uuid) to authenticated;
grant execute on function private.can_manage_workspace(uuid) to authenticated;
grant execute on function private.is_workspace_owner(uuid) to authenticated;

comment on table public.workspaces is 'Tenant boundary for Cuebooker operational data.';
comment on table public.counterparties is 'Workspace-scoped external professional entities used by Booking Core. Kept separate from legacy identity organizations.';
comment on table public.activities is 'Append-oriented booking activity stream. Authenticated users have no UPDATE/DELETE grant by design.';

commit;
