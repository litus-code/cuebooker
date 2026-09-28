begin;

create or replace function private.sync_booking_status_from_email_delivery()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  latest_outbound_id uuid;
  current_status public.booking_status;
  current_archived_at timestamptz;
  event_at timestamptz;
begin
  if new.direction <> 'outbound' then
    return new;
  end if;

  if new.delivery_status is not distinct from old.delivery_status then
    return new;
  end if;

  if new.delivery_status not in ('soft_bounce', 'hard_bounce', 'blocked', 'spam', 'invalid', 'error') then
    return new;
  end if;

  select em.id
    into latest_outbound_id
  from public.email_messages em
  where em.workspace_id = new.workspace_id
    and em.booking_id = new.booking_id
    and em.direction = 'outbound'
  order by em.created_at desc, em.id desc
  limit 1;

  if latest_outbound_id is distinct from new.id then
    return new;
  end if;

  select b.status, b.archived_at
    into current_status, current_archived_at
  from public.bookings b
  where b.workspace_id = new.workspace_id
    and b.id = new.booking_id
  for update;

  if current_status is null
     or current_archived_at is not null
     or current_status <> 'waiting_response' then
    return new;
  end if;

  update public.bookings
  set status = 'in_conversation'
  where workspace_id = new.workspace_id
    and id = new.booking_id
    and status = 'waiting_response'
    and archived_at is null;

  if not found then
    return new;
  end if;

  event_at := coalesce(new.last_delivery_event_at, new.bounced_at, now());

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
    null,
    null,
    jsonb_build_object(
      'from_status', 'waiting_response',
      'to_status', 'in_conversation',
      'automatic', true,
      'reason', 'outbound_delivery_failed',
      'delivery_status', new.delivery_status,
      'email_message_id', new.id
    ),
    'workspace',
    event_at,
    new.created_by
  );

  return new;
end;
$function$;

revoke all on function private.sync_booking_status_from_email_delivery() from public;
revoke all on function private.sync_booking_status_from_email_delivery() from anon;
revoke all on function private.sync_booking_status_from_email_delivery() from authenticated;

drop trigger if exists email_messages_sync_booking_status_from_delivery on public.email_messages;

create trigger email_messages_sync_booking_status_from_delivery
after update of delivery_status on public.email_messages
for each row
execute function private.sync_booking_status_from_email_delivery();

comment on function private.sync_booking_status_from_email_delivery() is
  'Returns the latest waiting-response Booking to in-conversation when the latest outbound email cannot be delivered, including soft bounce.';

commit;
