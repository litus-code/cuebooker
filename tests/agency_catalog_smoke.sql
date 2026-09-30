-- Disposable Agency tester in staging only. All presentation changes rollback.
begin;
set local role authenticated;
do $$
declare w uuid:='37e3f326-86f8-4529-9648-67620c06d790'; u uuid:='84acf582-5fa1-4d8b-b3a4-184b3f87da4e'; a uuid:='2fa912be-d78d-44b9-b6f9-a013bb1358cc'; b uuid:='7d9fd811-c672-46f0-9790-96d772c01bb7'; result jsonb; rejected boolean; config jsonb:='{"bio":"Test agency","contactEmail":"booking@example.invalid"}';
begin
 perform set_config('request.jwt.claim.sub',u::text,true);
 result:=public.get_agency_catalog(w);
 if jsonb_array_length(result->'artists')<>2 or (result->>'published')::boolean then raise exception 'initial_draft_incorrect'; end if;
 rejected:=false;
 begin perform public.save_agency_catalog(w,config,true,array[a]); exception when others then rejected:=SQLERRM='catalog_artist_not_ready'; end;
 if not rejected then raise exception 'unpublished_artist_accepted'; end if;
 update public.artists set public_profile_enabled=true where id=a;
 update public.artist_booking_routes set accepting_requests=true where artist_id=a and workspace_id=w;
 result:=public.save_agency_catalog(w,config,true,array[a]);
 if not (result->>'published')::boolean then raise exception 'publication_failed'; end if;
 rejected:=false;
 begin perform public.save_agency_catalog(w,config||'{"coverUrl":"javascript:alert(1)"}'::jsonb,true,array[a]); exception when others then rejected:=SQLERRM='catalog_url_requires_https'; end;
 if not rejected then raise exception 'unsafe_url_accepted'; end if;
 perform set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);
 rejected:=false;
 begin perform public.get_agency_catalog(w); exception when others then rejected:=SQLERRM='workspace_access_denied'; end;
 if not rejected then raise exception 'nonmember_draft_read'; end if;
 rejected:=false;
 begin perform public.save_agency_catalog(w,config,true,array[a]); exception when others then rejected:=SQLERRM='workspace_access_denied'; end;
 if not rejected then raise exception 'nonmember_publish'; end if;
end $$;
reset role;
set local role service_role;
do $$
declare result jsonb;
begin
 result:=public.get_public_agency_profile('cue-agency-test-20260930');
 if jsonb_array_length(result->'artists')<>1 or result->'artists'->0->>'name'<>'TEST Artista A' then raise exception 'public_roster_leak'; end if;
 if result::text like '%workspace_id%' or result::text like '%offer_amount%' or result::text like '%booking_id%' then raise exception 'private_field_leak'; end if;
end $$;
reset role;
update public.artists set public_profile_enabled=false where id='2fa912be-d78d-44b9-b6f9-a013bb1358cc';
set local role service_role;
do $$ begin if jsonb_array_length(public.get_public_agency_profile('cue-agency-test-20260930')->'artists')<>0 then raise exception 'disabled_artist_visible'; end if; end $$;
reset role;
update public.organizations set agency_public_enabled=false where slug='cue-agency-test-20260930';
set local role service_role;
do $$ begin if public.get_public_agency_profile('cue-agency-test-20260930') is not null then raise exception 'unpublished_agency_visible'; end if; end $$;
select 'agency_catalog_smoke_passed' as result;
rollback;
