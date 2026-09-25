begin;

create or replace function private.sync_booking_status_from_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_status public.booking_status;
  next_status public.booking_status;
  capture_kind text := coalesce(new.metadata->>'capture', '');
begin
  -- Initial capture establishes the booking as NEW; it is not a conversation transition.
  if capture_kind in ('public_form', 'cue_manual') then
    return new;
  end if;

  -- Internal/system activity never drives conversational workflow state.
  if new.direction is null or new.direction = 'internal' then
    return new;
  end if;

  if new.direction = 'inbound' then
    next_status := 'in_conversation';
  elsif new.direction = 'outbound' then
    next_status := 'waiting_response';
  else
    return new;
  end if;

  select b.status
    into current_status
  from public.bookings b
  where b.id = new.booking_id
    and b.workspace_id = new.workspace_id
  for update;

  if current_status is null then
    return new;
  end if;

  -- Decision states are terminal for automatic workflow transitions.
  if current_status in ('confirmed', 'rejected', 'cancelled') then
    return new;
  end if;

  if current_status = next_status then
    return new;
  end if;

  update public.bookings
  set status = next_status
  where id = new.booking_id
    and workspace_id = new.workspace_id;

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
    'status_change',
    'internal',
    new.contact_id,
    new.actor_user_id,
    null,
    jsonb_build_object(
      'from_status', current_status,
      'to_status', next_status,
      'automatic', true,
      'reason', case
        when new.direction = 'inbound' then 'external_activity_received'
        else 'external_activity_sent'
      end,
      'trigger_activity_id', new.id
    ),
    'workspace',
    new.occurred_at,
    new.created_by
  );

  return new;
end;
$$;

drop trigger if exists activities_sync_booking_status on public.activities;
create trigger activities_sync_booking_status
after insert on public.activities
for each row
execute function private.sync_booking_status_from_activity();

create or replace function public.set_booking_status(
  target_workspace_id uuid,
  target_booking_id uuid,
  target_status public.booking_status
)
returns public.bookings
language plpgsql
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_booking public.bookings;
  updated_booking public.bookings;
  matching_hold_id uuid;
  changed_hold public.holds;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.can_edit_workspace(target_workspace_id) then
    raise exception 'workspace_access_denied';
  end if;

  if target_status not in ('confirmed', 'rejected', 'cancelled') then
    raise exception 'operational_status_is_automatic';
  end if;

  select * into current_booking
  from public.bookings b
  where b.workspace_id = target_workspace_id
    and b.id = target_booking_id
  for update;

  if not found then
    raise exception 'booking_not_found';
  end if;

  if current_booking.status = target_status then
    return current_booking;
  end if;

  if target_status = 'confirmed' and current_booking.event_date is null then
    raise exception 'confirmed_booking_requires_date';
  end if;

  if target_status = 'confirmed' then
    select h.id into matching_hold_id
    from public.holds h
    where h.workspace_id = target_workspace_id
      and h.booking_id = target_booking_id
      and h.status = 'active'
      and h.event_date = current_booking.event_date
    order by h.priority asc nulls last, h.created_at asc
    limit 1
    for update;

    if matching_hold_id is not null then
      update public.holds
      set status = 'converted', converted_at = now()
      where id = matching_hold_id
      returning * into changed_hold;

      insert into public.activities (
        workspace_id, booking_id, type, direction, actor_user_id,
        metadata, visibility, created_by
      ) values (
        target_workspace_id, target_booking_id, 'hold_converted', 'internal', current_user_id,
        jsonb_build_object('hold_id', changed_hold.id, 'reason', 'booking_confirmed'),
        'workspace', current_user_id
      );
    end if;

    for changed_hold in
      update public.holds
      set status = 'released', released_at = now()
      where workspace_id = target_workspace_id
        and booking_id = target_booking_id
        and status = 'active'
        and (matching_hold_id is null or id <> matching_hold_id)
      returning *
    loop
      insert into public.activities (
        workspace_id, booking_id, type, direction, actor_user_id,
        metadata, visibility, created_by
      ) values (
        target_workspace_id, target_booking_id, 'hold_released', 'internal', current_user_id,
        jsonb_build_object('hold_id', changed_hold.id, 'reason', 'booking_confirmed'),
        'workspace', current_user_id
      );
    end loop;
  end if;

  update public.bookings
  set status = target_status
  where workspace_id = target_workspace_id
    and id = target_booking_id
  returning * into updated_booking;

  insert into public.activities (
    workspace_id,
    booking_id,
    type,
    direction,
    actor_user_id,
    body,
    metadata,
    visibility,
    created_by
  ) values (
    target_workspace_id,
    target_booking_id,
    'status_change',
    'internal',
    current_user_id,
    null,
    jsonb_build_object(
      'from_status', current_booking.status,
      'to_status', updated_booking.status,
      'automatic', false,
      'reason', 'manual_decision'
    ),
    'workspace',
    current_user_id
  );

  return updated_booking;
end;
$$;

comment on function private.sync_booking_status_from_activity() is
  'Derives operational booking status from non-initial external activity: inbound -> in_conversation, outbound -> waiting_response. Decision states remain manual and terminal for automation.';

comment on function public.set_booking_status(uuid, uuid, public.booking_status) is
  'Manual booking decision transition. Only confirmed/rejected/cancelled are accepted; operational states are derived from activity.';

commit;