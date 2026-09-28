begin;

create index passport_media_created_by_idx
on public.passport_media(created_by);

commit;
