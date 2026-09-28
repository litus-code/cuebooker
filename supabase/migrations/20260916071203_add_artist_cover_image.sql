begin;

alter table public.artists
  add column cover_image_path text check (
    cover_image_path is null or char_length(cover_image_path) between 1 and 500
  ),
  add column cover_position_y integer not null default 50 check (
    cover_position_y between 0 and 100
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artist-media',
  'artist-media',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.artist_id_from_storage_name(object_name text)
returns uuid
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  return split_part(object_name, '/', 1)::uuid;
exception
  when invalid_text_representation then return null;
end;
$$;

revoke all on function private.artist_id_from_storage_name(text) from public;
grant execute on function private.artist_id_from_storage_name(text) to authenticated;

create policy artist_media_select_members
on storage.objects for select
to authenticated
using (
  bucket_id = 'artist-media'
  and private.is_artist_member(private.artist_id_from_storage_name(name))
);

create policy artist_media_insert_managers
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'artist-media'
  and private.can_manage_artist(private.artist_id_from_storage_name(name))
);

create policy artist_media_update_managers
on storage.objects for update
to authenticated
using (
  bucket_id = 'artist-media'
  and private.can_manage_artist(private.artist_id_from_storage_name(name))
)
with check (
  bucket_id = 'artist-media'
  and private.can_manage_artist(private.artist_id_from_storage_name(name))
);

create policy artist_media_delete_managers
on storage.objects for delete
to authenticated
using (
  bucket_id = 'artist-media'
  and private.can_manage_artist(private.artist_id_from_storage_name(name))
);

grant update (cover_image_path, cover_position_y)
on public.artists to authenticated;

commit;
