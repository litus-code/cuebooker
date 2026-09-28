begin;

alter table public.artists
  add column artist_image_path text check (
    artist_image_path is null or char_length(artist_image_path) between 1 and 500
  ),
  add column artist_image_style text not null default 'artwork' check (
    artist_image_style in ('photo', 'artwork', 'duotone')
  ),
  add column artist_image_position_x integer not null default 50 check (
    artist_image_position_x between 0 and 100
  ),
  add column artist_image_position_y integer not null default 50 check (
    artist_image_position_y between 0 and 100
  ),
  add column artist_image_scale numeric(4,2) not null default 1.00 check (
    artist_image_scale between 0.60 and 1.80
  );

grant update (
  artist_image_path,
  artist_image_style,
  artist_image_position_x,
  artist_image_position_y,
  artist_image_scale
)
on public.artists to authenticated;

commit;
