begin;
-- Reuse the actor/workspace waitlist; no second admission model.
alter table public.mailbox_beta_settings add column approval_required boolean not null default true;
alter table public.mailbox_beta_waitlist
 add column status text not null default 'pending' check (status in ('pending','approved','rejected')),
 add column requested_email text check (requested_email is null or (requested_email=lower(requested_email) and char_length(requested_email)<=254 and requested_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')),
 add column locale text not null default 'es' check (locale in ('es','en')),
 add column google_test_user_added boolean not null default false,
 add column reviewed_at timestamptz,
 add constraint mailbox_beta_approval_confirmed check (status<>'approved' or (requested_email is not null and google_test_user_added and reviewed_at is not null));
-- Old waiting entries remain pending and must supply their intended Google address.
create table public.mailbox_beta_notifications (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null,
 user_id uuid not null,
 kind text not null check (kind in ('requested','approved')),
 state text not null default 'queued' check (state in ('queued','sending','sent','failed','uncertain','cancelled')),
 created_at timestamptz not null default now(),
 attempted_at timestamptz,
 completed_at timestamptz,
 foreign key (workspace_id,user_id) references public.mailbox_beta_waitlist(workspace_id,user_id) on delete cascade,
 unique(workspace_id,user_id,kind)
);
alter table public.mailbox_beta_notifications enable row level security;
revoke all on public.mailbox_beta_notifications from public,anon,authenticated;
grant select,insert,update,delete on public.mailbox_beta_notifications to service_role;
create index mailbox_beta_notifications_queue on public.mailbox_beta_notifications(created_at) where state='queued';

-- Normal writes use narrow service-only commands. Direct operator SQL changes
-- also queue notifications transactionally; the privileged dispatcher delivers them.
create function public.queue_mailbox_beta_notification() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.requested_email is not null then
  if TG_OP='INSERT' then
   if new.status='pending' then insert into public.mailbox_beta_notifications(workspace_id,user_id,kind) values(new.workspace_id,new.user_id,'requested') on conflict do nothing; end if;
  elsif old.requested_email is null and new.status='pending' then
   insert into public.mailbox_beta_notifications(workspace_id,user_id,kind) values(new.workspace_id,new.user_id,'requested') on conflict do nothing;
  end if;
  if new.status='approved' then
   insert into public.mailbox_beta_notifications(workspace_id,user_id,kind) values(new.workspace_id,new.user_id,'approved') on conflict do nothing;
  end if;
 end if;
 return new;
end; $$;
revoke all on function public.queue_mailbox_beta_notification() from public,anon,authenticated;
create trigger mailbox_beta_notification after insert or update on public.mailbox_beta_waitlist for each row execute function public.queue_mailbox_beta_notification();

create function public.request_mailbox_beta_access(target_workspace uuid,target_actor uuid,target_email text,target_locale text default 'es') returns jsonb language plpgsql security invoker set search_path='' as $$
declare entry public.mailbox_beta_waitlist%rowtype; notice uuid;
begin
 if not exists(select 1 from public.workspace_members where workspace_id=target_workspace and user_id=target_actor and role in ('owner','admin','manager','editor')) then raise exception 'workspace_access_denied'; end if;
 if target_email is null or char_length(target_email)>254 or target_email<>lower(target_email) or target_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or target_locale is null or target_locale not in ('es','en') then raise exception 'invalid_beta_request'; end if;
 if not exists(select 1 from auth.users where id=target_actor and email_confirmed_at is not null) then raise exception 'verified_email_required'; end if;
 -- Serialize against connection/approval commands as well as duplicate requests.
 perform 1 from public.mailbox_beta_settings where id for update;
 select * into entry from public.mailbox_beta_waitlist where workspace_id=target_workspace and user_id=target_actor for update;
 if entry.user_id is null then
  insert into public.mailbox_beta_waitlist(workspace_id,user_id,requested_email,locale) values(target_workspace,target_actor,target_email,target_locale) returning * into entry;
 elsif entry.requested_email is null then
  update public.mailbox_beta_waitlist set requested_email=target_email,locale=target_locale where workspace_id=target_workspace and user_id=target_actor returning * into entry;
 elsif entry.requested_email<>target_email then raise exception 'beta_request_email_locked';
 end if;
 select id into notice from public.mailbox_beta_notifications where workspace_id=target_workspace and user_id=target_actor and kind='requested';
 return jsonb_build_object('waitlisted',true,'status',entry.status,'requestedEmail',entry.requested_email,'notificationId',notice);
end; $$;
revoke all on function public.request_mailbox_beta_access(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.request_mailbox_beta_access(uuid,uuid,text,text) to service_role;

create function public.review_mailbox_beta_access(target_workspace uuid,target_actor uuid,target_status text,target_google_added boolean default false) returns jsonb language plpgsql security invoker set search_path='' as $$
declare entry public.mailbox_beta_waitlist%rowtype; notice uuid;
begin
 if target_status is null or target_status not in ('approved','rejected') then raise exception 'invalid_beta_review'; end if;
 if not exists(select 1 from public.workspace_members where workspace_id=target_workspace and user_id=target_actor and role in ('owner','admin','manager','editor')) then raise exception 'workspace_access_denied'; end if;
 perform 1 from public.mailbox_beta_settings where id for update;
 select * into entry from public.mailbox_beta_waitlist where workspace_id=target_workspace and user_id=target_actor for update;
 if entry.user_id is null or entry.requested_email is null then raise exception 'beta_request_not_found'; end if;
 if target_status='approved' and target_google_added is distinct from true then raise exception 'google_test_user_confirmation_required'; end if;
 if entry.status='rejected' and target_status='approved' then raise exception 'beta_review_locked'; end if;
 update public.mailbox_beta_waitlist set status=target_status,google_test_user_added=(target_status='approved'),reviewed_at=now() where workspace_id=target_workspace and user_id=target_actor;
 if target_status='rejected' then
  delete from public.mailbox_oauth_states where workspace_id=target_workspace and user_id=target_actor;
  update public.mailbox_beta_notifications set state='cancelled' where workspace_id=target_workspace and user_id=target_actor and state='queued';
 end if;
 select id into notice from public.mailbox_beta_notifications where workspace_id=target_workspace and user_id=target_actor and kind='approved';
 return jsonb_build_object('status',target_status,'notificationId',case when target_status='approved' then notice else null end);
end; $$;
revoke all on function public.review_mailbox_beta_access(uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.review_mailbox_beta_access(uuid,uuid,text,boolean) to service_role;

create function public.claim_mailbox_beta_notification(target_notification uuid) returns jsonb language plpgsql security invoker set search_path='' as $$
declare notice public.mailbox_beta_notifications%rowtype; entry public.mailbox_beta_waitlist%rowtype; recipient text;
begin
 select * into notice from public.mailbox_beta_notifications where id=target_notification and state='queued' for update;
 if notice.id is null then return jsonb_build_object('claimed',false); end if;
 select * into entry from public.mailbox_beta_waitlist where workspace_id=notice.workspace_id and user_id=notice.user_id;
 select email into recipient from auth.users where id=notice.user_id and email_confirmed_at is not null;
 if entry.requested_email is null or recipient is null or (notice.kind='requested' and entry.status<>'pending') or (notice.kind='approved' and entry.status<>'approved') or not exists(select 1 from public.workspace_members where workspace_id=notice.workspace_id and user_id=notice.user_id and role in ('owner','admin','manager','editor')) then
  update public.mailbox_beta_notifications set state='cancelled' where id=notice.id;
  return jsonb_build_object('claimed',false);
 end if;
 update public.mailbox_beta_notifications set state='sending',attempted_at=now() where id=notice.id;
 return jsonb_build_object('claimed',true,'id',notice.id,'kind',notice.kind,'email',entry.requested_email,'recipient',recipient,'locale',entry.locale,'workspaceId',notice.workspace_id,'userId',notice.user_id);
end; $$;
revoke all on function public.claim_mailbox_beta_notification(uuid) from public,anon,authenticated;
grant execute on function public.claim_mailbox_beta_notification(uuid) to service_role;
create function public.mailbox_beta_capacity_command(
 target_action text, target_workspace uuid, target_actor uuid,
 target_email text default null, target_provider text default null,
 target_state text default null, target_grant text default null
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
 max_accounts integer;
 used_accounts integer;
 pending public.mailbox_oauth_states%rowtype;
begin
 if not exists(select 1 from public.workspace_members where workspace_id=target_workspace and user_id=target_actor and role in ('owner','admin','manager','editor')) then
  raise exception 'workspace_access_denied';
 end if;
 select capacity into max_accounts from public.mailbox_beta_settings where id for update;
 if max_accounts is null then raise exception 'mailbox_not_configured'; end if;
 delete from public.mailbox_oauth_states where expires_at<=now();
 select count(*) into used_accounts from (
  select workspace_id,user_id,email from public.mailbox_connections where status='connected'
  union
  select workspace_id,user_id,expected_email from public.mailbox_oauth_states where expires_at>now()
 ) occupied;
 if target_action='status' then
  return jsonb_build_object('available',used_accounts<max_accounts,'waitlisted',exists(select 1 from public.mailbox_beta_waitlist where workspace_id=target_workspace and user_id=target_actor));
 elsif target_action='waitlist' then
  insert into public.mailbox_beta_waitlist(workspace_id,user_id) values(target_workspace,target_actor) on conflict do nothing;
  return jsonb_build_object('waitlisted',true);
 elsif target_action='reserve' then
  if target_email is null or char_length(target_email)>254 or target_email<>lower(target_email) or target_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or target_provider is null or target_provider not in ('google','microsoft','imap') or target_state is null or target_state !~ '^[0-9a-f]{64}$' then
   raise exception 'invalid_oauth_state';
  end if;
  if used_accounts>=max_accounts and not exists(select 1 from public.mailbox_connections where workspace_id=target_workspace and user_id=target_actor and email=target_email and status='connected') then
   return jsonb_build_object('error','mailbox_beta_full');
  end if;
  -- One pending authorization per actor. No repeated detection/provider calls.
  if exists(select 1 from public.mailbox_oauth_states where workspace_id=target_workspace and user_id=target_actor) then
   return jsonb_build_object('error','mailbox_attempt_limit');
  end if;
  insert into public.mailbox_oauth_states(state_hash,workspace_id,user_id,expected_email,provider,expires_at)
  values(target_state,target_workspace,target_actor,target_email,target_provider,now()+interval '10 minutes');
  return jsonb_build_object('reserved',true);
 elsif target_action='claim' then
  update public.mailbox_oauth_states set claimed_at=now(),expires_at=now()+interval '10 minutes'
  where state_hash=target_state and user_id=target_actor and workspace_id=target_workspace and claimed_at is null and expires_at>now()
  returning * into pending;
  if pending.state_hash is null then return jsonb_build_object('error','invalid_oauth_state'); end if;
  return to_jsonb(pending);
 elsif target_action='complete' then
  select * into pending from public.mailbox_oauth_states where state_hash=target_state and user_id=target_actor and workspace_id=target_workspace and claimed_at is not null and expires_at>now();
  if pending.state_hash is null or target_grant is null or char_length(target_grant) not between 1 and 512 then
   return jsonb_build_object('error','invalid_oauth_state');
  end if;
  if pending.expected_email<>target_email or pending.provider<>target_provider then
   return jsonb_build_object('error','account_mismatch');
  end if;
  insert into public.mailbox_connections(workspace_id,user_id,email,provider,grant_id,status,connected_at)
  values(target_workspace,target_actor,target_email,target_provider,target_grant,'connected',now())
  on conflict(workspace_id,user_id,email) do update set provider=excluded.provider,grant_id=excluded.grant_id,status='connected',connected_at=excluded.connected_at;
  delete from public.mailbox_oauth_states where state_hash=target_state;
  return jsonb_build_object('connected',true);
 end if;
 raise exception 'invalid_action';
end;
$$;

revoke all on function public.mailbox_beta_capacity_command(text,uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.mailbox_beta_capacity_command(text,uuid,uuid,text,text,text,text) to service_role;
create or replace function public.mailbox_beta_command(target_action text,target_workspace uuid,target_actor uuid,target_email text default null,target_provider text default null,target_state text default null,target_grant text default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare entry public.mailbox_beta_waitlist%rowtype; required boolean; expected text; result jsonb;
begin
 if not exists(select 1 from public.workspace_members where workspace_id=target_workspace and user_id=target_actor and role in ('owner','admin','manager','editor')) then raise exception 'workspace_access_denied'; end if;
 select approval_required into required from public.mailbox_beta_settings where id for update;
 select * into entry from public.mailbox_beta_waitlist where workspace_id=target_workspace and user_id=target_actor;
 if target_action in ('reserve','claim','complete') and required then
  if entry.status is distinct from 'approved' then return jsonb_build_object('error','mailbox_beta_approval_required'); end if;
  expected:=target_email;
  if target_action in ('claim','complete') then select expected_email into expected from public.mailbox_oauth_states where state_hash=target_state and workspace_id=target_workspace and user_id=target_actor; end if;
  if expected is distinct from entry.requested_email then return jsonb_build_object('error','mailbox_beta_email_not_approved'); end if;
 end if;
 result:=public.mailbox_beta_capacity_command(target_action,target_workspace,target_actor,target_email,target_provider,target_state,target_grant);
 if target_action='status' then result:=result||jsonb_build_object('approvalRequired',required,'status',case when entry.requested_email is null then 'not_requested' else entry.status end,'requestedEmail',entry.requested_email); end if;
 return result;
end; $$;
revoke all on function public.mailbox_beta_command(text,uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.mailbox_beta_command(text,uuid,uuid,text,text,text,text) to service_role;
commit;
