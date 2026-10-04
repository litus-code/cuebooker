-- Staging only. SQL administrator creates disposable fixtures, then uses actual service-role commands. No email/provider calls. Always rollback.
begin;
create temporary table beta_access_fixture(user_id uuid,other_id uuid,unverified_id uuid,workspace_id uuid);
insert into beta_access_fixture values(gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid());
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,created_at,updated_at)
select user_id,'00000000-0000-0000-0000-000000000000'::uuid,'authenticated','authenticated','beta-test-'||user_id||'@example.invalid',now(),now(),now() from beta_access_fixture
union all select other_id,'00000000-0000-0000-0000-000000000000'::uuid,'authenticated','authenticated','beta-test-'||other_id||'@example.invalid',now(),now(),now() from beta_access_fixture
union all select unverified_id,'00000000-0000-0000-0000-000000000000'::uuid,'authenticated','authenticated','beta-test-'||unverified_id||'@example.invalid',null,now(),now() from beta_access_fixture;
insert into public.workspaces(id,name,kind,created_by) select workspace_id,'Disposable beta access test','solo',user_id from beta_access_fixture;
insert into public.workspace_members(workspace_id,user_id,role) select workspace_id,unverified_id,'editor' from beta_access_fixture;
grant select on beta_access_fixture to service_role;
set local role service_role;
do $$
declare f record; result jsonb; notice uuid; email text;
begin
 select * into f from beta_access_fixture; email:='mailbox-'||f.user_id||'@example.invalid';
 if has_table_privilege('anon','public.mailbox_beta_notifications','SELECT') or has_table_privilege('authenticated','public.mailbox_beta_waitlist','UPDATE') or has_function_privilege('authenticated','public.review_mailbox_beta_access(uuid,uuid,text,boolean)','EXECUTE') or has_function_privilege('anon','public.request_mailbox_beta_access(uuid,uuid,text,text)','EXECUTE') then raise exception 'client_privileges_exposed'; end if;
 result:=public.mailbox_beta_command('status',f.workspace_id,f.user_id);
 if result->>'status'<>'not_requested' or result->>'approvalRequired'<>'true' then raise exception 'initial_status_failed'; end if;
 result:=public.mailbox_beta_command('reserve',f.workspace_id,f.user_id,email,'google',repeat('a',64));
 if result->>'error'<>'mailbox_beta_approval_required' then raise exception 'unapproved_reservation_allowed'; end if;
 begin perform public.request_mailbox_beta_access(f.workspace_id,f.other_id,email,'es'); raise exception 'foreign_member_allowed'; exception when others then if SQLERRM<>'workspace_access_denied' then raise; end if; end;
 begin perform public.request_mailbox_beta_access(f.workspace_id,f.unverified_id,email,'es'); raise exception 'unverified_allowed'; exception when others then if SQLERRM<>'verified_email_required' then raise; end if; end;
 result:=public.request_mailbox_beta_access(f.workspace_id,f.user_id,email,'en');notice:=(result->>'notificationId')::uuid;
 if result->>'status'<>'pending' or notice is null then raise exception 'request_failed'; end if;
 perform public.request_mailbox_beta_access(f.workspace_id,f.user_id,email,'en');
 if (select count(*) from public.mailbox_beta_notifications where workspace_id=f.workspace_id and user_id=f.user_id)<>1 then raise exception 'duplicate_notification'; end if;
 begin perform public.request_mailbox_beta_access(f.workspace_id,f.user_id,'different@example.invalid','en'); raise exception 'email_change_allowed'; exception when others then if SQLERRM<>'beta_request_email_locked' then raise; end if; end;
 result:=public.claim_mailbox_beta_notification(notice);
 if result->>'claimed'<>'true' or result->>'email'<>email or result->>'recipient'=email then raise exception 'notification_claim_failed'; end if;
 if public.claim_mailbox_beta_notification(notice)->>'claimed'<>'false' then raise exception 'notification_replay'; end if;
 begin perform public.review_mailbox_beta_access(f.workspace_id,f.user_id,'approved',false); raise exception 'google_confirmation_bypassed'; exception when others then if SQLERRM<>'google_test_user_confirmation_required' then raise; end if; end;
 result:=public.review_mailbox_beta_access(f.workspace_id,f.user_id,'approved',true);
 if result->>'status'<>'approved' or result->>'notificationId' is null then raise exception 'approval_failed'; end if;
 perform public.review_mailbox_beta_access(f.workspace_id,f.user_id,'approved',true);
 if (select count(*) from public.mailbox_beta_notifications where workspace_id=f.workspace_id and user_id=f.user_id and kind='approved')<>1 then raise exception 'duplicate_approval_notification'; end if;
 result:=public.mailbox_beta_command('reserve',f.workspace_id,f.user_id,'different@example.invalid','google',repeat('a',64));
 if result->>'error'<>'mailbox_beta_email_not_approved' then raise exception 'wrong_mailbox_allowed'; end if;
 result:=public.mailbox_beta_command('reserve',f.workspace_id,f.user_id,email,'google',repeat('a',64));
 if result->>'reserved'<>'true' then raise exception 'approved_reserve_failed'; end if;
 result:=public.mailbox_beta_command('claim',f.workspace_id,f.user_id,null,null,repeat('a',64));
 if result->>'expected_email'<>email then raise exception 'approved_claim_failed'; end if;
 result:=public.mailbox_beta_command('complete',f.workspace_id,f.user_id,email,'google',repeat('a',64),'fictional-beta-grant-'||f.user_id);
 if result->>'connected'<>'true' then raise exception 'completion_failed'; end if;
 result:=public.mailbox_beta_command('status',f.workspace_id,f.user_id);
 if result->>'status'<>'approved' then raise exception 'approval_removed_on_complete'; end if;
 perform public.review_mailbox_beta_access(f.workspace_id,f.user_id,'rejected',false);
 result:=public.mailbox_beta_command('reserve',f.workspace_id,f.user_id,email,'google',repeat('b',64));
 if result->>'error'<>'mailbox_beta_approval_required' then raise exception 'rejected_allowed'; end if;
end; $$;
reset role;
select 'mailbox_beta_access_rollback_passed' as result;
rollback;
