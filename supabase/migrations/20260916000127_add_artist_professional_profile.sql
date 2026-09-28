begin;

alter table public.artists
  add column city text check (city is null or char_length(trim(city)) between 1 and 120),
  add column country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  add column timezone text check (timezone is null or char_length(trim(timezone)) between 1 and 80),
  add column languages text[] not null default '{}',
  add column primary_genres text[] not null default '{}',
  add column secondary_genres text[] not null default '{}',
  add column performance_formats text[] not null default '{}',
  add column event_types text[] not null default '{}',
  add column years_active integer check (years_active is null or years_active between 0 and 80),
  add column website_url text,
  add column instagram_url text,
  add column soundcloud_url text,
  add column mixcloud_url text,
  add column youtube_url text,
  add column spotify_url text,
  add constraint artists_languages_limit check (cardinality(languages) <= 8),
  add constraint artists_primary_genres_limit check (cardinality(primary_genres) <= 3),
  add constraint artists_secondary_genres_limit check (cardinality(secondary_genres) <= 8),
  add constraint artists_performance_formats_limit check (cardinality(performance_formats) <= 6),
  add constraint artists_event_types_limit check (cardinality(event_types) <= 10);

create table public.artist_booking_profiles (
  artist_id uuid primary key references public.artists(id) on delete cascade,
  fee_basis text check (fee_basis is null or fee_basis in ('event', 'set', 'hour')),
  fee_min numeric(12, 2) check (fee_min is null or fee_min >= 0),
  fee_typical numeric(12, 2) check (fee_typical is null or fee_typical >= 0),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  set_duration_minutes integer check (set_duration_minutes is null or set_duration_minutes between 15 and 1440),
  accepts_travel boolean not null default false,
  travel_regions text[] not null default '{}',
  equipment_notes text,
  technical_rider_url text,
  hospitality_rider_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint artist_booking_profiles_travel_regions_limit check (cardinality(travel_regions) <= 20),
  constraint artist_booking_profiles_fee_order check (
    fee_min is null or fee_typical is null or fee_typical >= fee_min
  )
);

create trigger artist_booking_profiles_set_updated_at
before update on public.artist_booking_profiles
for each row execute function public.set_updated_at();

alter table public.artist_booking_profiles enable row level security;

create policy artist_booking_profiles_select_members
on public.artist_booking_profiles for select
to authenticated
using (private.is_artist_member(artist_id));

create policy artist_booking_profiles_insert_managers
on public.artist_booking_profiles for insert
to authenticated
with check (private.can_manage_artist(artist_id));

create policy artist_booking_profiles_update_managers
on public.artist_booking_profiles for update
to authenticated
using (private.can_manage_artist(artist_id))
with check (private.can_manage_artist(artist_id));

revoke all on public.artist_booking_profiles from anon;
grant select, insert, update on public.artist_booking_profiles to authenticated;

grant update (
  city,
  country_code,
  timezone,
  languages,
  primary_genres,
  secondary_genres,
  performance_formats,
  event_types,
  years_active,
  website_url,
  instagram_url,
  soundcloud_url,
  mixcloud_url,
  youtube_url,
  spotify_url
) on public.artists to authenticated;

commit;
