begin;

-- Keep the existing details command and its callers compatible. This command
-- saves the person and booking together under the caller's existing RLS.
create function public.update_booking_details_with_contact(
  target_workspace_id uuid,
  target_booking_id uuid,
  expected_contact_id uuid,
  next_contact_name text,
  next_contact_email text,
  next_contact_phone text,
  next_event_name text default null,
  next_venue_name text default null,
  next_city text default null,
  next_country_code text default null,
  next_event_date date default null,
  next_start_time time without time zone default null,
  next_end_time time without time zone default null,
  next_event_timezone text default null,
  next_offer_amount_minor bigint default null,
  next_currency text default null,
  next_fee_basis text default null
)
returns public.bookings
language plpgsql security invoker
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  current_booking public.bookings;
  updated_booking public.bookings;
  person public.contacts;
  person_id uuid;
  contact_changed boolean := false;
  person_name text := nullif(trim(next_contact_name), '');
  person_email text := nullif(lower(trim(next_contact_email)), '');
  person_phone text := nullif(trim(next_contact_phone), '');
begin
  if actor is null then raise exception 'authentication_required'; end if;
  if not private.can_edit_workspace(target_workspace_id) then
    raise exception 'workspace_access_denied';
  end if;
  select * into current_booking from public.bookings
    where workspace_id = target_workspace_id and id = target_booking_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if current_booking.archived_at is not null then raise exception 'booking_archived'; end if;
  if current_booking.primary_contact_id is distinct from expected_contact_id then
    raise exception 'booking_contact_changed';
  end if;
  if person_name is null and (expected_contact_id is not null or person_email is not null or person_phone is not null) then
    raise exception 'contact_name_required';
  end if;
  if char_length(person_name) > 160 or char_length(person_email) > 254 or char_length(person_phone) > 80 then
    raise exception 'invalid_contact_length';
  end if;
  if person_email is not null and person_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'invalid_contact_email';
  end if;

  -- Validate/persist booking fields first. Any later contact error rolls back
  -- this write and its activity/calendar effects in the same transaction.
  updated_booking := public.update_booking_details(
    target_workspace_id, target_booking_id, next_event_name, next_venue_name,
    next_city, next_country_code, next_event_date, next_start_time, next_end_time,
    next_event_timezone, next_offer_amount_minor, next_currency, next_fee_basis
  );
  person_id := current_booking.primary_contact_id;
  if person_id is not null then
    select * into person from public.contacts
      where workspace_id = target_workspace_id and id = person_id for update;
    if not found then raise exception 'contact_not_found'; end if;
    if (person.name, person.email, person.phone) is distinct from (person_name, person_email, person_phone) then
      update public.contacts set name = person_name, email = person_email, phone = person_phone
        where workspace_id = target_workspace_id and id = person_id returning * into person;
      if not found then raise exception 'workspace_access_denied'; end if;
      contact_changed := true;
    end if;
  elsif person_name is not null then
    insert into public.contacts(workspace_id, name, email, phone, created_by)
      values(target_workspace_id, person_name, person_email, person_phone, actor)
      returning id into person_id;
    update public.bookings set primary_contact_id = person_id
      where workspace_id = target_workspace_id and id = target_booking_id
      returning * into updated_booking;
    if not found then raise exception 'workspace_access_denied'; end if;
    insert into public.booking_contacts(workspace_id, booking_id, contact_id, created_by)
      values(target_workspace_id, target_booking_id, person_id, actor);
    contact_changed := true;
  end if;
  if contact_changed then
    insert into public.activities(workspace_id, booking_id, type, direction, actor_user_id, metadata, visibility, created_by)
      values(target_workspace_id, target_booking_id, 'system', 'internal', actor,
        jsonb_build_object('event', 'booking_contact_updated'), 'workspace', actor);
  end if;
  return updated_booking;
end;
$$;

revoke all on function public.update_booking_details_with_contact(uuid,uuid,uuid,text,text,text,text,text,text,text,date,time,time,text,bigint,text,text) from public, anon, authenticated, service_role;
grant execute on function public.update_booking_details_with_contact(uuid,uuid,uuid,text,text,text,text,text,text,text,date,time,time,text,bigint,text,text) to authenticated;
comment on function public.update_booking_details_with_contact(uuid,uuid,uuid,text,text,text,text,text,text,text,date,time,time,text,bigint,text,text)
  is 'Atomically edit booking facts and its contact under workspace RLS; archived and stale contact links are rejected.';
commit;
