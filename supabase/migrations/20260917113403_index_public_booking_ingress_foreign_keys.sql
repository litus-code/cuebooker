begin;

create index artist_booking_routes_created_by_idx
  on public.artist_booking_routes(created_by);

create index public_booking_submissions_workspace_artist_idx
  on public.public_booking_submissions(workspace_id, artist_id);

commit;
