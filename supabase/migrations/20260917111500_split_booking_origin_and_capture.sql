begin;

create type public.booking_origin_channel as enum (
  'phone',
  'whatsapp',
  'email',
  'instagram',
  'in_person',
  'booking_form',
  'other'
);

create type public.booking_capture_method as enum (
  'manual',
  'public_form',
  'email_import',
  'share_extension',
  'api',
  'ai_capture',
  'system'
);

alter table public.bookings
  add column origin_channel public.booking_origin_channel,
  add column capture_method public.booking_capture_method;

update public.bookings
set
  origin_channel = case source
    when 'phone' then 'phone'::public.booking_origin_channel
    when 'whatsapp' then 'whatsapp'::public.booking_origin_channel
    when 'email' then 'email'::public.booking_origin_channel
    when 'instagram' then 'instagram'::public.booking_origin_channel
    when 'in_person' then 'in_person'::public.booking_origin_channel
    when 'booking_form' then 'booking_form'::public.booking_origin_channel
    else 'other'::public.booking_origin_channel
  end,
  capture_method = case source
    when 'booking_form' then 'public_form'::public.booking_capture_method
    else 'manual'::public.booking_capture_method
  end
where origin_channel is null or capture_method is null;

create or replace function private.default_booking_origin_capture()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.origin_channel is null then
    new.origin_channel := case new.source
      when 'phone' then 'phone'::public.booking_origin_channel
      when 'whatsapp' then 'whatsapp'::public.booking_origin_channel
      when 'email' then 'email'::public.booking_origin_channel
      when 'instagram' then 'instagram'::public.booking_origin_channel
      when 'in_person' then 'in_person'::public.booking_origin_channel
      when 'booking_form' then 'booking_form'::public.booking_origin_channel
      else 'other'::public.booking_origin_channel
    end;
  end if;

  if new.capture_method is null then
    new.capture_method := case new.source
      when 'booking_form' then 'public_form'::public.booking_capture_method
      else 'manual'::public.booking_capture_method
    end;
  end if;

  return new;
end;
$$;

create trigger bookings_default_origin_capture
before insert on public.bookings
for each row execute function private.default_booking_origin_capture();

alter table public.bookings
  alter column origin_channel set not null,
  alter column capture_method set not null;

comment on column public.bookings.source is
  'Legacy compatibility field. New product logic should distinguish origin_channel from capture_method.';
comment on column public.bookings.origin_channel is
  'Channel where the booking opportunity or conversation originated.';
comment on column public.bookings.capture_method is
  'Mechanism used to capture the booking into Cuebooker.';

-- Existing browser CRUD permissions on bookings must include the new columns.
grant select, insert, update on public.bookings to authenticated;
grant select on public.bookings to service_role;

commit;
