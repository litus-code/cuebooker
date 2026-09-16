begin;

alter table public.artists
  add column artist_cutout_path text check (
    artist_cutout_path is null or char_length(artist_cutout_path) between 1 and 500
  );

grant update (artist_cutout_path)
on public.artists to authenticated;

commit;
