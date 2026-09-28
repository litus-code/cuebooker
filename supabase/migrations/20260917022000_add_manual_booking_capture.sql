begin;

create function public.create_manual_booking(
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
  initial_note text default null
)
returns public.bookings
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  resolved_contact_id uuid := existing_contact_id;
  resolved_counterparty_id uuid := existing_counterparty_id;
  created_booking public.bookings;
  initial_activity_type public.activity_type := 'note';
  initial_direction public.activity_direction := 'internal';
begin
  if current_user_id is null then
    raise exception 'authentication_required';
  end if;

  if not private.can_edit_workspace(target_workspace_id) then
    raise exception 'workspace_access_denied';
  end if;

  if not exists (
    select 1 from public.workspace_artists wa
    where wa.workspace_id = target_workspace_id
      and wa.artist_id = target_artist_id
  ) then
    raise exception 'artist_not_in_workspace';
  end if;

  if event_country_code is not null and upper(trim(event_country_code)) !~ '^[A-Z]{2}$' then
    raise exception 'invalid_country_code';
  end if;

  if offer_currency is not null and upper(trim(offer_currency)) !~ '^[A-Z]{3}$' then
    raise exception 'invalid_currency';
  end if;

  if offer_amount_minor is not null and offer_amount_minor < 0 then
    raise exception 'invalid_offer_amount';
  end if;

  if resolved_contact_id is null and nullif(trim(coalesce(contact_name, '')), '') is not null then
    insert into public.contacts (
      workspace_id, name, email, phone, created_by
    ) values (
      target_workspace_id,
      trim(contact_name),
      nullif(trim(coalesce(contact_email, '')), ''),
      nullif(trim(coalesce(contact_phone, '')), ''),
      current_user_id
    ) returning id into resolved_contact_id;
  end if;

  if resolved_counterparty_id is null and nullif(trim(coalesce(counterparty_name, '')), '') is not null then
    insert into public.counterparties (
      workspace_id, kind, name, city, country_code, created_by
    ) values (
      target_workspace_id,
      counterparty_kind,
      trim(counterparty_name),
      nullif(trim(coalesce(event_city, '')), ''),
      case
        when nullif(trim(coalesce(event_country_code, '')), '') is null then null
        else upper(trim(event_country_code))
      end,
      current_user_id
    ) returning id into resolved_counterparty_id;
  end if;

  insert into public.bookings (
    workspace_id,
    artist_id,
    primary_contact_id,
    counterparty_id,
    source,
    status,
    event_name,
    venue_name,
    city,
    country_code,
    event_date,
    offer_amount_minor,
    currency,
    created_by
  ) values (
    target_workspace_id,
    target_artist_id,
    resolved_contact_id,
    resolved_counterparty_id,
    target_source,
    'new',
    nullif(trim(coalesce(event_name, '')), ''),
    nullif(trim(coalesce(venue_name, '')), ''),
    nullif(trim(coalesce(event_city, '')), ''),
    case
      when nullif(trim(coalesce(event_country_code, '')), '') is null then null
      else upper(trim(event_country_code))
    end,
    event_date,
    offer_amount_minor,
    case
      when nullif(trim(coalesce(offer_currency, '')), '') is null then null
      else upper(trim(offer_currency))
    end,
    current_user_id
  ) returning * into created_booking;

  if target_source = 'phone' then
    initial_activity_type := 'phone';
    initial_direction := 'inbound';
  elsif target_source = 'whatsapp' then
    initial_activity_type := 'whatsapp';
    initial_direction := 'inbound';
  elsif target_source = 'email' then
    initial_activity_type := 'email';
    initial_direction := 'inbound';
  elsif target_source = 'instagram' then
    initial_activity_type := 'instagram';
    initial_direction := 'inbound';
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
    created_by
  ) values (
    target_workspace_id,
    created_booking.id,
    initial_activity_type,
    initial_direction,
    resolved_contact_id,
    current_user_id,
    nullif(trim(coalesce(initial_note, '')), ''),
    jsonb_build_object('capture', 'cue_manual', 'source', target_source),
    'workspace',
    current_user_id
  );

  if resolved_contact_id is not null then
    insert into public.booking_contacts (
      workspace_id, booking_id, contact_id, role_label, created_by
    ) values (
      target_workspace_id, created_booking.id, resolved_contact_id, 'primary', current_user_id
    ) on conflict (booking_id, contact_id) do nothing;
  end if;

  return created_booking;
end;
$$;

revoke all on function public.create_manual_booking(
  uuid, uuid, public.booking_source, uuid, text, text, text, uuid,
  public.counterparty_kind, text, text, text, text, text, date, bigint, text, text
) from public, anon;

grant execute on function public.create_manual_booking(
  uuid, uuid, public.booking_source, uuid, text, text, text, uuid,
  public.counterparty_kind, text, text, text, text, text, date, bigint, text, text
) to authenticated;

comment on function public.create_manual_booking(
  uuid, uuid, public.booking_source, uuid, text, text, text, uuid,
  public.counterparty_kind, text, text, text, text, text, date, bigint, text, text
) is 'Atomic CUE/manual capture. Creates optional contact/counterparty, booking, initial activity and booking-contact link in one transaction under RLS.';

commit;
