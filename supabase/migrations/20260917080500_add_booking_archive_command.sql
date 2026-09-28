begin;

create or replace function public.set_booking_archived(
  target_workspace_id uuid,
  target_booking_id uuid,
  target_archived boolean
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

  if (current_booking.archived_at is not null) = target_archived then
    return current_booking;
  end if;

  update public.bookings
  set archived_at = case when target_archived then now() else null end
  where workspace_id = target_workspace_id
    and id = target_booking_id
  returning * into updated_booking;

  insert into public.activities (
    workspace_id, booking_id, type, direction, actor_user_id,
    body, metadata, visibility, created_by
  ) values (
    target_workspace_id, target_booking_id, 'system', 'internal', current_user_id,
    null,
    jsonb_build_object('action', case when target_archived then 'archived' else 'restored' end),
    'workspace', current_user_id
  );

  return updated_booking;
end;
$$;

revoke all on function public.set_booking_archived(uuid, uuid, boolean) from public, anon;
grant execute on function public.set_booking_archived(uuid, uuid, boolean) to authenticated;

comment on function public.set_booking_archived(uuid, uuid, boolean)
is 'Archives or restores a booking without deleting history and appends a system Activity atomically.';

commit;
