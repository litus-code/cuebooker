-- Staging only, existing Agency test workspace/owner. Run with SQL admin; always rollback.
begin;
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,created_at,updated_at) values
 ('11111111-1111-4111-8111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','agency-manager-smoke@example.invalid',now(),now(),now()),
 ('22222222-2222-4222-8222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','agency-viewer-smoke@example.invalid',now(),now(),now());
set local role authenticated;
do $$
declare w uuid := '45280eda-4606-4da8-b1ed-76ee67d4cbc3'; owner_id uuid := '6f810749-9502-46ec-86bd-c896b442b365'; m uuid := '11111111-1111-4111-8111-111111111111'; v uuid := '22222222-2222-4222-8222-222222222222'; invitation jsonb; response jsonb; rejected boolean; a uuid; b public.bookings;
begin
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 invitation := public.create_agency_invitation(w,'agency-manager-smoke@example.invalid','manager');
 perform set_config('request.jwt.claim.sub',v::text,true);
 rejected:=false;
 begin perform public.review_agency_invitation(invitation->>'token',true); exception when others then rejected := SQLERRM='invitation_email_mismatch'; end;
 if not rejected then raise exception 'wrong_email_not_rejected'; end if;
 perform set_config('request.jwt.claim.sub',m::text,true);
 response := public.review_agency_invitation(invitation->>'token',false);
 if (response->>'accepted')::boolean then raise exception 'review_created_membership'; end if;
 if exists(select 1 from public.workspace_members where workspace_id=w and user_id=m) then raise exception 'pre_accept_member'; end if;
 perform public.review_agency_invitation(invitation->>'token',true);
 if public.ensure_booking_workspace(target_organization_id=>(select organization_id from public.workspace_legacy_organizations where workspace_id=w))<>w then raise exception 'invited_member_bootstrap_failed'; end if;
 perform public.review_agency_invitation(invitation->>'token',true);
 select artist_id into a from public.workspace_artists where workspace_id=w and roster_active limit 1;
 b := public.create_smart_cue_booking(target_workspace_id=>w,target_artist_id=>a,event_name=>'Agency team smoke',initial_note=>'Rollback only');
 update public.artists set city=city where id=a;
 if not found then raise exception 'manager_profile_update_denied'; end if;
 if not private.can_edit_workspace(w) or private.can_manage_workspace(w) then raise exception 'manager_permissions_wrong'; end if;
 if not exists(select 1 from public.organization_members om join public.workspace_legacy_organizations l on l.organization_id=om.organization_id where l.workspace_id=w and om.user_id=m) then raise exception 'identity_bridge_missing'; end if;
 rejected:=false;
 begin perform public.create_agency_invitation(w,'agency-viewer-smoke@example.invalid','admin'); exception when others then rejected:=SQLERRM='workspace_access_denied'; end;
 if not rejected then raise exception 'manager_invite_not_rejected'; end if;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform public.manage_agency_member(w,m,'viewer');
 perform set_config('request.jwt.claim.sub',m::text,true);
 rejected:=false;
 begin perform public.create_smart_cue_booking(target_workspace_id=>w,target_artist_id=>a,event_name=>'Viewer denied'); exception when others then rejected:=true; end;
 if not rejected then raise exception 'viewer_booking_write_allowed'; end if;
 if private.can_edit_workspace(w) or not private.is_workspace_member(w) then raise exception 'viewer_permissions_wrong'; end if;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 perform public.manage_agency_member(w,m,null);
 perform set_config('request.jwt.claim.sub',m::text,true);
 if private.is_workspace_member(w) then raise exception 'removed_member_keeps_access'; end if;
 rejected:=false;
 begin perform public.review_agency_invitation(invitation->>'token',true); exception when others then rejected:=SQLERRM='invitation_unavailable'; end;
 if not rejected then raise exception 'consumed_token_rejoins'; end if;
 perform set_config('request.jwt.claim.sub',owner_id::text,true);
 invitation:=public.create_agency_invitation(w,'agency-viewer-smoke@example.invalid','viewer');
 perform public.revoke_agency_invitation((invitation->>'id')::uuid);
 perform set_config('request.jwt.claim.sub',v::text,true);
 rejected:=false;
 begin perform public.review_agency_invitation(invitation->>'token',true); exception when others then rejected:=SQLERRM='invitation_unavailable'; end;
 if not rejected then raise exception 'revoked_token_accepted'; end if;
end $$;
select 'agency_team_accept_retry_roles_remove_revoke_passed' as result;
rollback;
