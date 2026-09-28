begin;

create or replace function public.create_smart_cue_booking(
  target_workspace_id uuid,
  target_artist_id uuid,
  target_source public.booking_source default 'manual'::public.booking_source,
  existing_contact_id uuid default null,
  contact_name text default null,
  contact_email text default null,
  contact_phone text default null,
  existing_counterparty_id uuid default null,
  counterparty_kind public.counterparty_kind default 'other'::public.counterparty_kind,
  counterparty_name text default null,
  event_name text default null,
  venue_name text default null,
  event_city text default null,
  event_country_code text default null,
  event_date date default null,
  start_time time without time zone default null,
  end_time time without time zone default null,
  event_timezone text default null,
  offer_amount_minor bigint default null,
  offer_currency text default null,
  fee_basis text default null,
  initial_note text default null,
  initial_next_move text default null,
  initial_next_due_at timestamptz default null
)
returns public.bookings
language plpgsql
set search_path = ''
as $$
declare
  created_booking public.bookings;
begin
  created_booking := public.create_manual_booking(
    target_workspace_id => target_workspace_id,
    target_artist_id => target_artist_id,
    target_source => target_source,
    existing_contact_id => existing_contact_id,
    contact_name => contact_name,
    contact_email => contact_email,
    contact_phone => contact_phone,
    existing_counterparty_id => existing_counterparty_id,
    counterparty_kind => counterparty_kind,
    counterparty_name => counterparty_name,
    event_name => event_name,
    venue_name => venue_name,
    event_city => event_city,
    event_country_code => event_country_code,
    event_date => event_date,
    offer_amount_minor => offer_amount_minor,
    offer_currency => offer_currency,
    initial_note => initial_note
  );

  if start_time is not null
     or end_time is not null
     or nullif(trim(coalesce(event_timezone, '')), '') is not null
     or nullif(trim(coalesce(fee_basis, '')), '') is not null then
    created_booking := public.update_booking_details(
      target_workspace_id => target_workspace_id,
      target_booking_id => created_booking.id,
      next_event_name => event_name,
      next_venue_name => venue_name,
      next_city => event_city,
      next_country_code => event_country_code,
      next_event_date => event_date,
      next_start_time => start_time,
      next_end_time => end_time,
      next_event_timezone => event_timezone,
      next_offer_amount_minor => offer_amount_minor,
      next_currency => offer_currency,
      next_fee_basis => fee_basis
    );
  end if;

  if nullif(trim(coalesce(initial_next_move, '')), '') is not null then
    perform public.set_booking_next_move(
      target_workspace_id => target_workspace_id,
      target_booking_id => created_booking.id,
      next_label => trim(initial_next_move),
      next_due_at => initial_next_due_at,
      next_assignee_user_id => null
    );
  end if;

  return created_booking;
end;
$$;

revoke all on function public.create_smart_cue_booking(
  uuid,uuid,public.booking_source,uuid,text,text,text,uuid,public.counterparty_kind,text,
  text,text,text,text,date,time,time,text,bigint,text,text,text,text,timestamptz
) from public;

grant execute on function public.create_smart_cue_booking(
  uuid,uuid,public.booking_source,uuid,text,text,text,uuid,public.counterparty_kind,text,
  text,text,text,text,date,time,time,text,bigint,text,text,text,text,timestamptz
) to authenticated;

comment on function public.create_smart_cue_booking(
  uuid,uuid,public.booking_source,uuid,text,text,text,uuid,public.counterparty_kind,text,
  text,text,text,text,date,time,time,text,bigint,text,text,text,text,timestamptz
) is 'Extended atomic CUE booking creation for Smart Capture, preserving schedule, fee basis and next-action due time.';

commit;