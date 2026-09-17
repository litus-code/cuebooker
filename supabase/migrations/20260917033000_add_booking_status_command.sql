begin;

create or replace function public.set_booking_status(
  target_workspace_id uuid,
  target_booking_id uuid,
  target_status public.booking_status
)
returns public.bookings
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_booking public.bookings;
  updated_booking public.bookings;
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.can_edit_workspace(target_workspace_id) then
    raise exception 'workspace_access_denied';
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
      'to_status', updated_booking.status
    ),
    'workspace',
    current_user_id
  );

  return updated_booking;
end;
$$;

revoke all on function public.set_booking_status(uuid, uuid, public.booking_status) from public, anon;
grant execute on function public.set_booking_status(uuid, uuid, public.booking_status) to authenticated;

comment on function public.set_booking_status(uuid, uuid, public.booking_status)
is 'Updates a Booking Core status under workspace RLS and appends a status_change activity in the same transaction.';

commit;
