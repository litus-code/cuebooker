-- Disposable staging Agency tester. Metadata-only Storage/RPC permission test.
begin;
set local role authenticated;
do $$
declare w uuid:='37e3f326-86f8-4529-9648-67620c06d790'; u uuid:='84acf582-5fa1-4d8b-b3a4-184b3f87da4e'; p text; result jsonb; rejected boolean;
begin
 perform set_config('request.jwt.claim.sub',u::text,true);
 p:='agency/'||w||'/covers/'||gen_random_uuid()||'.png';
 insert into storage.objects(bucket_id,name) values('artist-media',p);
 result:=public.save_agency_catalog(w,jsonb_build_object('coverPath',p),false,'{}');
 if result->>'coverPath'<>p then raise exception 'media_path_not_saved'; end if;
 result:=public.save_agency_catalog(w,'{}',false,'{}');
 if result->>'coverPath'<>p then raise exception 'legacy_save_lost_media'; end if;
 rejected:=false;
 begin perform public.save_agency_catalog(w,jsonb_build_object('coverPath','agency/'||w||'/logos/'||gen_random_uuid()||'.png'),false,'{}'); exception when others then rejected:=SQLERRM='invalid_catalog_media'; end;
 if not rejected then raise exception 'wrong_slot_or_missing_file_accepted'; end if;
 perform set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
 if exists(select 1 from storage.objects where name=p) then raise exception 'foreign_principal_reads_draft_media'; end if;
 rejected:=false;
 begin insert into storage.objects(bucket_id,name) values('artist-media','agency/'||w||'/covers/'||gen_random_uuid()||'.png'); exception when insufficient_privilege then rejected:=true; end;
 if not rejected then raise exception 'foreign_principal_uploads'; end if;
 perform set_config('request.jwt.claim.sub',u::text,true);
 result:=public.save_agency_catalog(w,'{"coverPath":null}',false,'{}');
 if result->>'coverPath' is not null then raise exception 'media_removal_failed'; end if;
end $$;
select 'agency_media_rls_save_clear_rollback_passed' as result;
rollback;
