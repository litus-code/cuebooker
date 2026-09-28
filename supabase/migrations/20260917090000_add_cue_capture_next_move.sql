begin;

create or replace function public.create_cue_booking(
  target_workspace_id uuid,
  target_artist_id uuid,
  target_source public.booking_source default 'manual',
  existing_contact_id uuid default null,
  contact_name text default null,
  contact_email text default null,
  contact_phone text default null,
  existing_counterparty_id uuid default null,
  counterparty_kind public.counterparty_kind default 'other',
  counterparty_name text default null,
  event_name text default null,
  venue_name text default null,
  event_city text default null,
  event_country_code text default null,
  event_date date default null,
  offer_amount_minor bigint default null,
  offer_currency text default null,
  initial_note text default null,
  initial_next_move text default null
)
returns public.bookings
language plpgsql
security invoker
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

  if nullif(trim(coalesce(initial_next_move, '')), '') is not null then
    perform public.set_booking_next_move(
      target_workspace_id => target_workspace_id,
      target_booking_id => created_booking.id,
      next_label => trim(initial_next_move),
      next_due_at => null,
      next_assignee_user_id => null
    );
  end if;

  return created_booking;
end;
$$;

revoke all on function public.create_cue_booking(
  uuid, uuid, public.booking_source, uuid, text, text, text, uuid,
  public.counterparty_kind, text, text, text, text, text, date, bigint, text, text, text
) from public, anon;

grant execute on function public.create_cue_booking(
  uuid, uuid, public.booking_source, uuid, text, text, text, uuid,
  public.counterparty_kind, text, text, text, text, text, date, bigint, text, text, text
) to authenticated;

comment on function public.create_cue_booking(
  uuid, uuid, public.booking_source, uuid, text, text, text, uuid,
  public.counterparty_kind, text, text, text, text, text, date, bigint, text, text, text
) is 'Atomic CUE capture. Creates the booking context and, when supplied, its initial Next Move in the same database transaction.';

commit;
