begin;

alter table public.artists
  add constraint artists_slug_reserved_check
  check (slug <> all (array[
    'access','account','admin','api','app','artist','artists','auth','book','booking',
    'cue-id','login','onboarding','request','settings','signup','workspace'
  ]::text[]));

commit;
