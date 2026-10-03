begin;

-- Booking Core membership also grants the agency its artist calendar and
-- private media; the legacy artist_members ACL remains valid for solo DJs.
create policy availability_blocks_select_agency_roster
on public.availability_blocks for select to authenticated
using (exists (
  select 1 from public.workspace_artists wa
  where wa.artist_id = availability_blocks.artist_id
    and private.is_workspace_member(wa.workspace_id)
));
create policy availability_blocks_insert_agency_managers
on public.availability_blocks for insert to authenticated
with check (created_by = (select auth.uid()) and private.can_manage_roster_artist(artist_id));
create policy availability_blocks_update_agency_managers
on public.availability_blocks for update to authenticated
using (private.can_manage_roster_artist(artist_id))
with check (private.can_manage_roster_artist(artist_id));
create policy availability_blocks_delete_agency_managers
on public.availability_blocks for delete to authenticated
using (private.can_manage_roster_artist(artist_id));

create policy artist_media_select_agency_roster
on storage.objects for select to authenticated
using (
  bucket_id = 'artist-media'
  and exists (
    select 1 from public.workspace_artists wa
    where wa.artist_id = private.artist_id_from_storage_name(name)
      and private.is_workspace_member(wa.workspace_id)
  )
);
create policy artist_media_insert_agency_managers
on storage.objects for insert to authenticated
with check (
  bucket_id = 'artist-media'
  and private.can_manage_roster_artist(private.artist_id_from_storage_name(name))
);
create policy artist_media_update_agency_managers
on storage.objects for update to authenticated
using (
  bucket_id = 'artist-media'
  and private.can_manage_roster_artist(private.artist_id_from_storage_name(name))
)
with check (
  bucket_id = 'artist-media'
  and private.can_manage_roster_artist(private.artist_id_from_storage_name(name))
);
create policy artist_media_delete_agency_managers
on storage.objects for delete to authenticated
using (
  bucket_id = 'artist-media'
  and private.can_manage_roster_artist(private.artist_id_from_storage_name(name))
);

commit;
