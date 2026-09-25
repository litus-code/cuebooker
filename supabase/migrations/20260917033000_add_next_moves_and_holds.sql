begin;

create type public.hold_status as enum ('active', 'released', 'converted');

create table public.next_moves (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  booking_id uuid not null,
  label text not null check (char_length(trim(label)) between 1 and 240),
  due_at timestamptz,
  assignee_user_id uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, booking_id)
    references public.bookings(workspace_id, id) on delete cascade
);

create unique index next_moves_one_active_per_booking_idx
  on public.next_moves(workspace_id, booking_id)
  where completed_at is null;

create index next_moves_workspace_due_idx
  on public.next_moves(workspace_id, due_at)
  where completed_at is null and due_at is not null;

create index next_moves_assignee_idx
  on public.next_moves(assignee_user_id)
  where assignee_user_id is not null and completed_at is null;

create index next_moves_created_by_idx
  on public.next_moves(created_by);

create table public.holds (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  booking_id uuid not null,
  event_date date not null,
  starts_at timestamptz,
  ends_at timestamptz,
  event_timezone text,
  expires_at timestamptz,
  priority smallint check (priority is null or priority between 1 and 9),
  status public.hold_status not null default 'active',
  released_at timestamptz,
  converted_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, booking_id)
    references public.bookings(workspace_id, id) on delete cascade,
  check ((starts_at is null and ends_at is null) or (starts_at is not null and ends_at is not null)),
  check (ends_at is null or ends_at > starts_at),
  check (status = 'released' or released_at is null),
  check (status = 'converted' or converted_at is null)
);

create index holds_workspace_date_idx
  on public.holds(workspace_id, event_date, status);

create index holds_booking_idx
  on public.holds(workspace_id, booking_id, created_at desc);

create index holds_active_expiry_idx
  on public.holds(workspace_id, expires_at)
  where status = 'active' and expires_at is not null;

create index holds_created_by_idx
  on public.holds(created_by);

create trigger next_moves_set_updated_at
before update on public.next_moves
for each row execute function public.set_updated_at();

create trigger holds_set_updated_at
before update on public.holds
for each row execute function public.set_updated_at();

create or replace function private.preserve_next_move_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.workspace_id <> old.workspace_id or new.booking_id <> old.booking_id then
    raise exception 'next_move_identity_is_immutable';
  end if;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

create or replace function private.preserve_hold_identity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.workspace_id <> old.workspace_id or new.booking_id <> old.booking_id then
    raise exception 'hold_identity_is_immutable';
  end if;
  new.created_by := old.created_by;
  new.created_at := old.created_at;
  return new;
end;
$$;

create trigger next_moves_preserve_identity
before update on public.next_moves
for each row execute function private.preserve_next_move_identity();

create trigger holds_preserve_identity
before update on public.holds
for each row execute function private.preserve_hold_identity();

alter table public.next_moves enable row level security;
alter table public.holds enable row level security;

create policy next_moves_select_member
on public.next_moves for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy next_moves_insert_editor
on public.next_moves for insert
to authenticated
with check (
  private.can_edit_workspace(workspace_id)
  and created_by = (select auth.uid())
  and (
    assignee_user_id is null
    or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = next_moves.workspace_id
        and wm.user_id = next_moves.assignee_user_id
    )
  )
);

create policy next_moves_update_editor
on public.next_moves for update
to authenticated
using (private.can_edit_workspace(workspace_id))
with check (
  private.can_edit_workspace(workspace_id)
  and (
    assignee_user_id is null
    or exists (
      select 1 from public.workspace_members wm
      where wm.workspace_id = next_moves.workspace_id
        and wm.user_id = next_moves.assignee_user_id
    )
  )
);

create policy next_moves_delete_managers
on public.next_moves for delete
to authenticated
using (private.can_manage_workspace(workspace_id));

create policy holds_select_member
on public.holds for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy holds_insert_editor
on public.holds for insert
to authenticated
with check (private.can_edit_workspace(workspace_id) and created_by = (select auth.uid()));

create policy holds_update_editor
on public.holds for update
to authenticated
using (private.can_edit_workspace(workspace_id))
with check (private.can_edit_workspace(workspace_id));

create policy holds_delete_managers
on public.holds for delete
to authenticated
using (private.can_manage_workspace(workspace_id));

revoke all on table public.next_moves from anon, authenticated;
revoke all on table public.holds from anon, authenticated;

grant select, insert, update, delete on table public.next_moves to authenticated;
grant select, insert, update, delete on table public.holds to authenticated;

revoke all on function private.preserve_next_move_identity() from public, anon, authenticated;
revoke all on function private.preserve_hold_identity() from public, anon, authenticated;

create or replace function public.set_booking_next_move(
  target_workspace_id uuid,
  target_booking_id uuid,
  next_label text,
  next_due_at timestamptz default null,
  next_assignee_user_id uuid default null
)
returns public.next_moves
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  previous_move public.next_moves;
  created_move public.next_moves;
  activity_time timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.can_edit_workspace(target_workspace_id) then
    raise exception 'workspace_access_denied';
  end if;

  if char_length(trim(coalesce(next_label, ''))) < 1
    or char_length(trim(next_label)) > 240 then
    raise exception 'invalid_next_move_label';
  end if;

  if not exists (
    select 1 from public.bookings b
    where b.workspace_id = target_workspace_id
      and b.id = target_booking_id
  ) then
    raise exception 'booking_not_found';
  end if;

  if next_assignee_user_id is not null and not exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = next_assignee_user_id
  ) then
    raise exception 'assignee_not_in_workspace';
  end if;

  select * into previous_move
  from public.next_moves nm
  where nm.workspace_id = target_workspace_id
    and nm.booking_id = target_booking_id
    and nm.completed_at is null
  for update;

  if found then
    update public.next_moves
    set completed_at = activity_time
    where id = previous_move.id;

    insert into public.activities (
      workspace_id, booking_id, type, direction, actor_user_id,
      body, metadata, visibility, occurred_at, created_by
    ) values (
      target_workspace_id, target_booking_id, 'next_move_completed', 'internal', current_user_id,
      previous_move.label,
      jsonb_build_object('next_move_id', previous_move.id, 'reason', 'replaced'),
      'workspace', activity_time, current_user_id
    );
  end if;

  insert into public.next_moves (
    workspace_id, booking_id, label, due_at, assignee_user_id, created_by
  ) values (
    target_workspace_id, target_booking_id, trim(next_label), next_due_at, next_assignee_user_id, current_user_id
  ) returning * into created_move;

  insert into public.activities (
    workspace_id, booking_id, type, direction, actor_user_id,
    body, metadata, visibility, occurred_at, created_by
  ) values (
    target_workspace_id, target_booking_id, 'next_move_created', 'internal', current_user_id,
    created_move.label,
    jsonb_build_object('next_move_id', created_move.id, 'due_at', created_move.due_at, 'assignee_user_id', created_move.assignee_user_id),
    'workspace', activity_time, current_user_id
  );

  return created_move;
end;
$$;

create or replace function public.complete_booking_next_move(
  target_workspace_id uuid,
  target_next_move_id uuid
)
returns public.next_moves
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_move public.next_moves;
  activity_time timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.can_edit_workspace(target_workspace_id) then
    raise exception 'workspace_access_denied';
  end if;

  select * into current_move
  from public.next_moves nm
  where nm.workspace_id = target_workspace_id
    and nm.id = target_next_move_id
  for update;

  if not found then
    raise exception 'next_move_not_found';
  end if;

  if current_move.completed_at is null then
    update public.next_moves
    set completed_at = activity_time
    where id = current_move.id
    returning * into current_move;

    insert into public.activities (
      workspace_id, booking_id, type, direction, actor_user_id,
      body, metadata, visibility, occurred_at, created_by
    ) values (
      target_workspace_id, current_move.booking_id, 'next_move_completed', 'internal', current_user_id,
      current_move.label,
      jsonb_build_object('next_move_id', current_move.id),
      'workspace', activity_time, current_user_id
    );
  end if;

  return current_move;
end;
$$;

create or replace function public.create_booking_hold(
  target_workspace_id uuid,
  target_booking_id uuid,
  hold_event_date date,
  hold_starts_at timestamptz default null,
  hold_ends_at timestamptz default null,
  hold_event_timezone text default null,
  hold_expires_at timestamptz default null,
  hold_priority smallint default null
)
returns public.holds
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  created_hold public.holds;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.can_edit_workspace(target_workspace_id) then
    raise exception 'workspace_access_denied';
  end if;

  if not exists (
    select 1 from public.bookings b
    where b.workspace_id = target_workspace_id
      and b.id = target_booking_id
  ) then
    raise exception 'booking_not_found';
  end if;

  insert into public.holds (
    workspace_id, booking_id, event_date, starts_at, ends_at,
    event_timezone, expires_at, priority, created_by
  ) values (
    target_workspace_id, target_booking_id, hold_event_date, hold_starts_at, hold_ends_at,
    nullif(trim(coalesce(hold_event_timezone, '')), ''), hold_expires_at, hold_priority, current_user_id
  ) returning * into created_hold;

  insert into public.activities (
    workspace_id, booking_id, type, direction, actor_user_id,
    body, metadata, visibility, created_by
  ) values (
    target_workspace_id, target_booking_id, 'hold_created', 'internal', current_user_id,
    null,
    jsonb_build_object(
      'hold_id', created_hold.id,
      'event_date', created_hold.event_date,
      'starts_at', created_hold.starts_at,
      'ends_at', created_hold.ends_at,
      'expires_at', created_hold.expires_at,
      'priority', created_hold.priority
    ),
    'workspace', current_user_id
  );

  return created_hold;
end;
$$;

create or replace function public.release_booking_hold(
  target_workspace_id uuid,
  target_hold_id uuid
)
returns public.holds
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_hold public.holds;
  activity_time timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.can_edit_workspace(target_workspace_id) then
    raise exception 'workspace_access_denied';
  end if;

  select * into current_hold
  from public.holds h
  where h.workspace_id = target_workspace_id
    and h.id = target_hold_id
  for update;

  if not found then
    raise exception 'hold_not_found';
  end if;

  if current_hold.status = 'converted' then
    raise exception 'converted_hold_cannot_be_released';
  end if;

  if current_hold.status = 'active' then
    update public.holds
    set status = 'released', released_at = activity_time
    where id = current_hold.id
    returning * into current_hold;

    insert into public.activities (
      workspace_id, booking_id, type, direction, actor_user_id,
      metadata, visibility, occurred_at, created_by
    ) values (
      target_workspace_id, current_hold.booking_id, 'hold_released', 'internal', current_user_id,
      jsonb_build_object('hold_id', current_hold.id), 'workspace', activity_time, current_user_id
    );
  end if;

  return current_hold;
end;
$$;

create or replace function public.convert_booking_hold(
  target_workspace_id uuid,
  target_hold_id uuid
)
returns public.holds
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_hold public.holds;
  activity_time timestamptz := now();
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.can_edit_workspace(target_workspace_id) then
    raise exception 'workspace_access_denied';
  end if;

  select * into current_hold
  from public.holds h
  where h.workspace_id = target_workspace_id
    and h.id = target_hold_id
  for update;

  if not found then
    raise exception 'hold_not_found';
  end if;

  if current_hold.status = 'released' then
    raise exception 'released_hold_cannot_be_converted';
  end if;

  if current_hold.status = 'active' then
    update public.holds
    set status = 'converted', converted_at = activity_time
    where id = current_hold.id
    returning * into current_hold;

    insert into public.activities (
      workspace_id, booking_id, type, direction, actor_user_id,
      metadata, visibility, occurred_at, created_by
    ) values (
      target_workspace_id, current_hold.booking_id, 'hold_converted', 'internal', current_user_id,
      jsonb_build_object('hold_id', current_hold.id), 'workspace', activity_time, current_user_id
    );
  end if;

  return current_hold;
end;
$$;

revoke all on function public.set_booking_next_move(uuid, uuid, text, timestamptz, uuid) from public, anon;
revoke all on function public.complete_booking_next_move(uuid, uuid) from public, anon;
revoke all on function public.create_booking_hold(uuid, uuid, date, timestamptz, timestamptz, text, timestamptz, smallint) from public, anon;
revoke all on function public.release_booking_hold(uuid, uuid) from public, anon;
revoke all on function public.convert_booking_hold(uuid, uuid) from public, anon;

grant execute on function public.set_booking_next_move(uuid, uuid, text, timestamptz, uuid) to authenticated;
grant execute on function public.complete_booking_next_move(uuid, uuid) to authenticated;
grant execute on function public.create_booking_hold(uuid, uuid, date, timestamptz, timestamptz, text, timestamptz, smallint) to authenticated;
grant execute on function public.release_booking_hold(uuid, uuid) to authenticated;
grant execute on function public.convert_booking_hold(uuid, uuid) to authenticated;

comment on table public.next_moves is 'Booking-specific operational next actions. Product exposes at most one active move per booking.';
comment on table public.holds is 'Date holds attached to bookings. Hold state is separate from booking status.';

commit;
