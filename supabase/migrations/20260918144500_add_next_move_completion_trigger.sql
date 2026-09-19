begin;

alter table public.next_moves
  add column if not exists completion_trigger text not null default 'manual';

alter table public.next_moves
  drop constraint if exists next_moves_completion_trigger_check;

alter table public.next_moves
  add constraint next_moves_completion_trigger_check
  check (completion_trigger in ('manual', 'inbound_activity'));

create index if not exists next_moves_active_completion_trigger_idx
  on public.next_moves(workspace_id, booking_id, completion_trigger)
  where completed_at is null and completion_trigger <> 'manual';

drop function if exists public.set_booking_next_move(uuid, uuid, text, timestamptz, uuid);

create or replace function public.set_booking_next_move(
  target_workspace_id uuid,
  target_booking_id uuid,
  next_label text,
  next_due_at timestamptz default null,
  next_assignee_user_id uuid default null,
  next_completion_trigger text default 'manual'
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
  normalized_completion_trigger text := lower(trim(coalesce(next_completion_trigger, 'manual')));
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

  if normalized_completion_trigger not in ('manual', 'inbound_activity') then
    raise exception 'invalid_next_move_completion_trigger';
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
      jsonb_build_object(
        'next_move_id', previous_move.id,
        'reason', 'replaced',
        'automatic', false
      ),
      'workspace', activity_time, current_user_id
    );
  end if;

  insert into public.next_moves (
    workspace_id,
    booking_id,
    label,
    due_at,
    assignee_user_id,
    completion_trigger,
    created_by
  ) values (
    target_workspace_id,
    target_booking_id,
    trim(next_label),
    next_due_at,
    next_assignee_user_id,
    normalized_completion_trigger,
    current_user_id
  ) returning * into created_move;

  insert into public.activities (
    workspace_id, booking_id, type, direction, actor_user_id,
    body, metadata, visibility, occurred_at, created_by
  ) values (
    target_workspace_id, target_booking_id, 'next_move_created', 'internal', current_user_id,
    created_move.label,
    jsonb_build_object(
      'next_move_id', created_move.id,
      'due_at', created_move.due_at,
      'assignee_user_id', created_move.assignee_user_id,
      'completion_trigger', created_move.completion_trigger
    ),
    'workspace', activity_time, current_user_id
  );

  return created_move;
end;
$$;

revoke all on function public.set_booking_next_move(uuid, uuid, text, timestamptz, uuid, text)
  from public, anon;
grant execute on function public.set_booking_next_move(uuid, uuid, text, timestamptz, uuid, text)
  to authenticated;

create or replace function private.complete_next_move_from_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_move public.next_moves;
  capture_kind text := coalesce(new.metadata->>'capture', '');
begin
  if new.direction <> 'inbound' then
    return new;
  end if;

  if capture_kind in ('public_form', 'cue_manual') then
    return new;
  end if;

  select *
    into current_move
  from public.next_moves nm
  where nm.workspace_id = new.workspace_id
    and nm.booking_id = new.booking_id
    and nm.completed_at is null
    and nm.completion_trigger = 'inbound_activity'
    and new.occurred_at >= nm.created_at
  limit 1
  for update;

  if not found then
    return new;
  end if;

  update public.next_moves
  set completed_at = new.occurred_at
  where id = current_move.id
    and completed_at is null;

  if not found then
    return new;
  end if;

  insert into public.activities (
    workspace_id,
    booking_id,
    type,
    direction,
    contact_id,
    actor_user_id,
    body,
    metadata,
    visibility,
    occurred_at,
    created_by
  ) values (
    new.workspace_id,
    new.booking_id,
    'next_move_completed',
    'internal',
    new.contact_id,
    new.actor_user_id,
    current_move.label,
    jsonb_build_object(
      'next_move_id', current_move.id,
      'automatic', true,
      'reason', 'inbound_activity_received',
      'completion_trigger', current_move.completion_trigger,
      'trigger_activity_id', new.id
    ),
    'workspace',
    new.occurred_at,
    new.created_by
  );

  return new;
end;
$$;

drop trigger if exists activities_complete_waiting_next_move
  on public.activities;

create trigger activities_complete_waiting_next_move
after insert on public.activities
for each row
execute function private.complete_next_move_from_activity();

revoke all on function private.complete_next_move_from_activity()
  from public, anon, authenticated;

comment on column public.next_moves.completion_trigger is
  'Optional deterministic completion rule. inbound_activity closes this Next Move when a later inbound Activity arrives for the same Booking.';

comment on function private.complete_next_move_from_activity() is
  'Completes only explicitly automation-enabled Next Moves from later inbound Activity. Initial capture does not count as a reply and no commercial Booking decision is changed.';

commit;
