begin;
alter policy agency_identity_media_insert on storage.objects
with check (bucket_id='artist-media'
 and private.can_manage_workspace(private.agency_workspace_from_storage_name(storage.objects.name))
 and exists(select 1 from public.workspaces w where w.id=private.agency_workspace_from_storage_name(storage.objects.name) and w.kind='agency'));
commit;
