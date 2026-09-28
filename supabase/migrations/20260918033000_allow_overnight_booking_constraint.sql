begin;

alter table public.bookings
  drop constraint if exists bookings_check2;

comment on column public.bookings.end_time is
  'Local booking end time. When end_time <= start_time, the end occurs on the following calendar day.';

commit;