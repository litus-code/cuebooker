begin;

alter table public.artists
  add column passport_public_milestone_ids text[] default null,
  add column passport_public_media_ids uuid[] not null default '{}';

comment on column public.artists.passport_public_milestone_ids is
  'Public Passport milestone selection. Null keeps automatic V1 selection; an empty array intentionally hides all milestones.';
comment on column public.artists.passport_public_media_ids is
  'Explicit opt-in list of linked Passport media IDs allowed on the public artist profile.';

grant update (
  passport_public_milestone_ids,
  passport_public_media_ids
) on public.artists to authenticated;

commit;
