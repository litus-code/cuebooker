alter table public.artists
  add column visual_source text not null default 'portrait';

update public.artists
set visual_source = case
  when visual_mode = 'cue_id' then 'cue_id'
  else 'portrait'
end;

alter table public.artists
  add constraint artists_visual_source_check
  check (visual_source in ('portrait', 'cue_id'));

grant select (visual_source), insert (visual_source), update (visual_source)
on table public.artists
to authenticated;

comment on column public.artists.visual_source is
  'Authoritative visual source for artist presentation. Portrait treatment stays in artist_image_style; CUE ID uses cue_id_config.';
