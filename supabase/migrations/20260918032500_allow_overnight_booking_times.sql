begin;

create or replace function public.update_booking_details(
  target_workspace_id uuid,
  target_booking_id uuid,
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
language plpgsql
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_booking public.bookings;
  updated_booking public.bookings;
  changed_fields text[] := array[]::text[];
  normalized_country text := nullif(upper(trim(coalesce(next_country_code, ''))), '');
  normalized_currency text := nullif(upper(trim(coalesce(next_currency, ''))), '');
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

  if normalized_country is not null and normalized_country !~ '^[A-Z]{2}$' then
    raise exception 'invalid_country_code';
  end if;

  if normalized_currency is not null and normalized_currency !~ '^[A-Z]{3}$' then
    raise exception 'invalid_currency';
  end if;

  if next_offer_amount_minor is not null and next_offer_amount_minor < 0 then
    raise exception 'invalid_offer_amount';
  end if;

  if next_event_date is null and (next_start_time is not null or next_end_time is not null) then
    raise exception 'booking_time_requires_date';
  end if;

  -- DJ bookings commonly cross midnight (e.g. 23:30 -> 01:00).
  -- End times earlier than or equal to start times are therefore interpreted
  -- as ending on the following calendar day rather than being rejected.

  if current_booking.event_name is distinct from nullif(trim(coalesce(next_event_name, '')), '') then changed_fields := array_append(changed_fields, 'event_name'); end if;
  if current_booking.venue_name is distinct from nullif(trim(coalesce(next_venue_name, '')), '') then changed_fields := array_append(changed_fields, 'venue_name'); end if;
  if current_booking.city is distinct from nullif(trim(coalesce(next_city, '')), '') then changed_fields := array_append(changed_fields, 'city'); end if;
  if current_booking.country_code is distinct from normalized_country then changed_fields := array_append(changed_fields, 'country_code'); end if;
  if current_booking.event_date is distinct from next_event_date then changed_fields := array_append(changed_fields, 'event_date'); end if;
  if current_booking.start_time is distinct from next_start_time then changed_fields := array_append(changed_fields, 'start_time'); end if;
  if current_booking.end_time is distinct from next_end_time then changed_fields := array_append(changed_fields, 'end_time'); end if;
  if current_booking.event_timezone is distinct from nullif(trim(coalesce(next_event_timezone, '')), '') then changed_fields := array_append(changed_fields, 'event_timezone'); end if;
  if current_booking.offer_amount_minor is distinct from next_offer_amount_minor then changed_fields := array_append(changed_fields, 'offer_amount_minor'); end if;
  if current_booking.currency is distinct from normalized_currency then changed_fields := array_append(changed_fields, 'currency'); end if;
  if current_booking.fee_basis is distinct from nullif(trim(coalesce(next_fee_basis, '')), '') then changed_fields := array_append(changed_fields, 'fee_basis'); end if;

  if coalesce(array_length(changed_fields, 1), 0) = 0 then
    return current_booking;
  end if;

  update public.bookings
  set
    event_name = nullif(trim(coalesce(next_event_name, '')), ''),
    venue_name = nullif(trim(coalesce(next_venue_name, '')), ''),
    city = nullif(trim(coalesce(next_city, '')), ''),
    country_code = normalized_country,
    event_date = next_event_date,
    start_time = next_start_time,
    end_time = next_end_time,
    event_timezone = nullif(trim(coalesce(next_event_timezone, '')), ''),
    offer_amount_minor = next_offer_amount_minor,
    currency = normalized_currency,
    fee_basis = nullif(trim(coalesce(next_fee_basis, '')), '')
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
    'system',
    'internal',
    current_user_id,
    null,
    jsonb_build_object(
      'event', 'booking_details_updated',
      'changed_fields', to_jsonb(changed_fields)
    ),
    'workspace',
    current_user_id
  );

  return updated_booking;
end;
$$;

comment on function public.update_booking_details(
  uuid,uuid,text,text,text,text,date,time,time,text,bigint,text,text
) is 'Updates booking details. Time ranges may cross midnight; end_time <= start_time means the following calendar day.';

commit;