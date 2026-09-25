alter table public.artists
  drop constraint if exists artists_visual_mode_check;

alter table public.artists
  drop column visual_mode;
