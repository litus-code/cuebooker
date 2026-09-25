begin;

alter table public.artists
  add column passport_public_enabled boolean not null default true;

comment on column public.artists.passport_public_enabled is
  'Whether the artist CUE Passport summary is included on the public artist profile.';

grant update (passport_public_enabled) on public.artists to authenticated;

commit;
