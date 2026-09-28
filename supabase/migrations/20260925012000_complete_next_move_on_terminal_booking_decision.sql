begin;

create or replace function private.complete_next_move_after_terminal_booking_decision()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_move public.next_moves;
  actor_id uuid := (select auth.uid());
  activity_time timestamptz := now();
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status not in ('confirmed', 'rejected', 'cancelled') then
    return new;
  end if;

  select *
  into current_move
  from public.next_moves nm
  where nm.workspace_id = new.workspace_id
    and nm.booking_id = new.id
    and nm.completed_at is null
  limit 1
  for update;

  if not found then
    return new;
  end if;

  update public.next_moves
  set completed_at = activity_time
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
    actor_user_id,
    body,
    metadata,
    visibility,
    occurred_at,
    created_by
  ) values (
    new.workspace_id,
    new.id,
    'next_move_completed',
    'internal',
    actor_id,
    current_move.label,
    jsonb_build_object(
      'next_move_id', current_move.id,
      'automatic', true,
      'reason',
        case new.status
          when 'confirmed' then 'booking_confirmed'
          when 'rejected' then 'booking_rejected'
          else 'booking_cancelled'
        end,
      'completion_trigger', current_move.completion_trigger
    ),
    'workspace',
    activity_time,
    actor_id
  );

  return new;
end;
$$;

drop trigger if exists bookings_complete_next_move_after_terminal_decision
  on public.bookings;

create trigger bookings_complete_next_move_after_terminal_decision
after update of status on public.bookings
for each row
execute function private.complete_next_move_after_terminal_booking_decision();

revoke all on function private.complete_next_move_after_terminal_booking_decision()
  from public, anon, authenticated;

comment on function private.complete_next_move_after_terminal_booking_decision() is
  'Completes any active Next Move after a human confirms, rejects or cancels a Booking and records Activity. It never changes the Booking decision itself.';

commit;
