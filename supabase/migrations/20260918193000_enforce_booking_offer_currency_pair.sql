begin;

alter table public.bookings
  drop constraint if exists bookings_offer_currency_pair_check;

alter table public.bookings
  add constraint bookings_offer_currency_pair_check
  check (
    (offer_amount_minor is null and currency is null)
    or
    (offer_amount_minor is not null and currency is not null)
  );

comment on constraint bookings_offer_currency_pair_check on public.bookings is
  'Offer amount and currency are one commercial fact: both must be present or both absent.';

commit;
