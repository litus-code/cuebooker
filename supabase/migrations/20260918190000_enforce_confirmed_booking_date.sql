begin;

alter table public.bookings
  drop constraint if exists bookings_confirmed_requires_event_date;

alter table public.bookings
  add constraint bookings_confirmed_requires_event_date
  check (status <> 'confirmed' or event_date is not null);

comment on constraint bookings_confirmed_requires_event_date on public.bookings is
  'A confirmed booking must always retain an event date so Calendar projection cannot silently disappear.';

commit;
