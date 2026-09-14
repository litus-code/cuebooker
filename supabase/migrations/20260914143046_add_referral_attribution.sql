begin;

create table public.referral_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  source_type text not null default 'other',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint referral_sources_code_format check (
    code = lower(code)
    and code ~ '^[a-z0-9][a-z0-9_-]{1,63}$'
  ),
  constraint referral_sources_label_length check (char_length(trim(label)) between 2 and 120),
  constraint referral_sources_source_type check (
    source_type in ('academy', 'collective', 'label', 'artist', 'partner', 'campaign', 'other')
  )
);

create table public.referral_attributions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  source_id uuid references public.referral_sources(id) on delete set null,
  raw_ref text,
  landing_path text,
  first_seen_at timestamptz not null,
  registered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint referral_attributions_raw_ref_length check (
    raw_ref is null or char_length(raw_ref) <= 128
  ),
  constraint referral_attributions_landing_path_length check (
    landing_path is null or char_length(landing_path) <= 512
  )
);

create index referral_attributions_source_id_idx
  on public.referral_attributions(source_id);

create trigger referral_sources_set_updated_at
before update on public.referral_sources
for each row execute function public.set_updated_at();

alter table public.referral_sources enable row level security;
alter table public.referral_attributions enable row level security;

create policy referral_sources_select_active
on public.referral_sources for select
to anon, authenticated
using (active = true);

create policy referral_attributions_select_own
on public.referral_attributions for select
to authenticated
using (user_id = (select auth.uid()));

create policy referral_attributions_insert_own
on public.referral_attributions for insert
to authenticated
with check (user_id = (select auth.uid()));

revoke all on public.referral_sources from anon, authenticated;
revoke all on public.referral_attributions from anon, authenticated;

grant select on public.referral_sources to anon, authenticated;
grant select, insert on public.referral_attributions to authenticated;

insert into public.referral_sources (code, label, source_type)
values
  ('plastic', 'Plastic Academia', 'academy'),
  ('ontempo', 'On Tempo DJ School', 'academy'),
  ('sonopro', 'Sonopro Barcelona', 'academy'),
  ('beside', 'BeSide School Barcelona', 'academy'),
  ('microfusa', 'microFusa', 'academy'),
  ('bahn', 'BAHN', 'collective'),
  ('sociedadgroove', 'Sociedad Groove', 'label'),
  ('merien', 'MERIEN', 'label'),
  ('pavolar', 'Pa''volar Records', 'label'),
  ('moveonup', 'Move On Up Collective', 'collective'),
  ('airfryer', 'Airfryer Collective', 'collective')
on conflict (code) do nothing;

commit;
