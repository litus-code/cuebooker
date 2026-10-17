begin;
-- Preserve Nylas connection IDs and their existing Booking thread mappings.
alter table public.mailbox_connections add column transport text not null default 'nylas' check(transport in ('nylas','gmail'));
alter table public.mailbox_connections drop constraint mailbox_connections_workspace_id_user_id_email_key;
alter table public.mailbox_connections add unique(workspace_id,user_id,email,transport);
alter table public.mailbox_oauth_states add column transport text not null default 'nylas' check(transport in ('nylas','gmail')), add column verifier_ciphertext text;
create table public.gmail_mailbox_credentials(
 connection_id uuid primary key references public.mailbox_connections(id) on delete cascade,
 token_ciphertext text not null check(char_length(token_ciphertext) between 30 and 20000),
 access_expires_at timestamptz not null,
 reauth_at timestamptz not null,
 reauth_required boolean not null default false
);
alter table public.gmail_mailbox_credentials enable row level security;
revoke all on public.gmail_mailbox_credentials from public,anon,authenticated;
grant select,insert,update,delete on public.gmail_mailbox_credentials to service_role;
create table public.gmail_mailbox_watches(
 connection_id uuid primary key references public.mailbox_connections(id) on delete cascade,
 history_id text check(history_id ~ '^[0-9]+$'),
 pending_history_id text check(pending_history_id ~ '^[0-9]+$'),
 watch_expires_at timestamptz,
 lease_until timestamptz,
 lease_token uuid,
 consent_revision uuid,
 state text not null default 'ready' check(state in ('ready','resync_required')),
 updated_at timestamptz not null default now()
);
alter table public.gmail_mailbox_watches enable row level security;
revoke all on public.gmail_mailbox_watches from public,anon,authenticated;
grant select,insert,update,delete on public.gmail_mailbox_watches to service_role;
create or replace function public.mailbox_beta_capacity_command(
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
  if pending.transport<>'nylas' or pending.state_hash is null or target_grant is null or char_length(target_grant) not between 1 and 512 then
   return jsonb_build_object('error','invalid_oauth_state');
  end if;
  if pending.expected_email<>target_email or pending.provider<>target_provider then
   return jsonb_build_object('error','account_mismatch');
  end if;
  insert into public.mailbox_connections(workspace_id,user_id,email,provider,grant_id,status,connected_at)
  values(target_workspace,target_actor,target_email,target_provider,target_grant,'connected',now())
  on conflict(workspace_id,user_id,email,transport) do update set provider=excluded.provider,grant_id=excluded.grant_id,status='connected',connected_at=excluded.connected_at;
  delete from public.mailbox_oauth_states where state_hash=target_state;
  return jsonb_build_object('connected',true);
 end if;
 raise exception 'invalid_action';
end;
$$;

revoke all on function public.mailbox_beta_capacity_command(text,uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.mailbox_beta_capacity_command(text,uuid,uuid,text,text,text,text) to service_role;

-- Approval, claimed state, mailbox row and encrypted credentials commit together.
create function public.complete_gmail_mailbox(target_workspace uuid,target_actor uuid,target_state text,target_email text,target_ciphertext text,target_access_expires timestamptz,target_reauth_at timestamptz) returns jsonb language plpgsql security invoker set search_path='' as $$
declare pending public.mailbox_oauth_states%rowtype; connection uuid; required boolean;
begin
 if not exists(select 1 from public.workspace_members where workspace_id=target_workspace and user_id=target_actor and role in ('owner','admin','manager','editor')) then raise exception 'workspace_access_denied'; end if;
 select approval_required into required from public.mailbox_beta_settings where id for update;
 if required and not exists(select 1 from public.mailbox_beta_waitlist where workspace_id=target_workspace and user_id=target_actor and status='approved' and google_test_user_added and requested_email=target_email) then raise exception 'mailbox_beta_approval_required'; end if;
 select * into pending from public.mailbox_oauth_states where state_hash=target_state and workspace_id=target_workspace and user_id=target_actor and claimed_at is not null and expires_at>now() for update;
 if pending.state_hash is null or pending.transport<>'gmail' or pending.provider<>'google' or pending.expected_email<>target_email then raise exception 'invalid_oauth_state'; end if;
 if target_ciphertext is null or char_length(target_ciphertext) not between 30 and 20000 or target_access_expires<=now() or target_reauth_at<=now() or target_reauth_at>now()+interval '7 days 1 minute' then raise exception 'invalid_gmail_credentials'; end if;
 insert into public.mailbox_connections(workspace_id,user_id,email,provider,grant_id,transport,status,connected_at)
 values(target_workspace,target_actor,target_email,'google','gmail:'||gen_random_uuid()::text,'gmail','connected',now())
 on conflict(workspace_id,user_id,email,transport) do update set status='connected',connected_at=excluded.connected_at returning id into connection;
 insert into public.gmail_mailbox_credentials(connection_id,token_ciphertext,access_expires_at,reauth_at) values(connection,target_ciphertext,target_access_expires,target_reauth_at)
 on conflict(connection_id) do update set token_ciphertext=excluded.token_ciphertext,access_expires_at=excluded.access_expires_at,reauth_at=excluded.reauth_at,reauth_required=false;
 insert into public.gmail_mailbox_watches(connection_id) values(connection) on conflict do nothing;
 delete from public.mailbox_oauth_states where state_hash=target_state;
 return jsonb_build_object('connected',true,'connectionId',connection);
end; $$;
revoke all on function public.complete_gmail_mailbox(uuid,uuid,text,text,text,timestamptz,timestamptz) from public,anon,authenticated;
grant execute on function public.complete_gmail_mailbox(uuid,uuid,text,text,text,timestamptz,timestamptz) to service_role;

-- Push payload carries only email/history metadata. Fresh consent and membership gate it.
create function public.enqueue_gmail_history(target_email text,target_history text) returns integer language plpgsql security invoker set search_path='' as $$
declare affected integer;
begin
 if target_history is null or target_history !~ '^[0-9]{1,30}$' then raise exception 'invalid_history'; end if;
 update public.gmail_mailbox_watches w set pending_history_id=case when w.pending_history_id is null or target_history::numeric>w.pending_history_id::numeric then target_history else w.pending_history_id end,updated_at=now()
 from public.mailbox_connections c where c.id=w.connection_id and c.email=target_email and c.transport='gmail' and c.status='connected' and c.background_analysis_enabled
 and exists(select 1 from public.workspace_members m where m.workspace_id=c.workspace_id and m.user_id=c.user_id and m.role in ('owner','admin','manager','editor'));
 get diagnostics affected=row_count;return affected;
end; $$;
revoke all on function public.enqueue_gmail_history(text,text) from public,anon,authenticated;
grant execute on function public.enqueue_gmail_history(text,text) to service_role;

create function public.claim_gmail_watch() returns jsonb language plpgsql security invoker set search_path='' as $$
declare item public.gmail_mailbox_watches%rowtype; connection public.mailbox_connections%rowtype;
begin
 select w.* into item from public.gmail_mailbox_watches w join public.mailbox_connections c on c.id=w.connection_id join public.gmail_mailbox_credentials g on g.connection_id=c.id
 where c.transport='gmail' and c.status='connected' and c.background_analysis_enabled and not g.reauth_required and g.reauth_at>now() and (w.state='ready' or w.consent_revision is distinct from c.background_analysis_revision) and (w.lease_until is null or w.lease_until<now())
 and (w.history_id is null or w.pending_history_id is not null or w.watch_expires_at is null or w.watch_expires_at<now()+interval '1 day' or w.updated_at<now()-interval '1 hour' or w.consent_revision is distinct from c.background_analysis_revision)
 and exists(select 1 from public.workspace_members m where m.workspace_id=c.workspace_id and m.user_id=c.user_id and m.role in ('owner','admin','manager','editor'))
 order by w.updated_at limit 1 for update of w skip locked;
 if item.connection_id is null then return null; end if;
 select * into connection from public.mailbox_connections where id=item.connection_id;
 update public.gmail_mailbox_watches set lease_until=now()+interval '5 minutes',lease_token=gen_random_uuid(),state=case when consent_revision is distinct from connection.background_analysis_revision then 'ready' else state end,history_id=case when consent_revision is distinct from connection.background_analysis_revision then null else history_id end,consent_revision=connection.background_analysis_revision where connection_id=item.connection_id returning * into item;
 select * into connection from public.mailbox_connections where id=item.connection_id;
 return jsonb_build_object('connection',to_jsonb(connection),'watch',to_jsonb(item));
end; $$;
revoke all on function public.claim_gmail_watch() from public,anon,authenticated;
grant execute on function public.claim_gmail_watch() to service_role;
create function public.authorize_gmail_watch(target_connection uuid,target_revision uuid) returns boolean language sql security invoker set search_path='' as $$
 select exists(select 1 from public.mailbox_connections c where c.id=target_connection and c.transport='gmail' and c.status='connected' and c.background_analysis_enabled and c.background_analysis_revision=target_revision and exists(select 1 from public.workspace_members m where m.workspace_id=c.workspace_id and m.user_id=c.user_id and m.role in ('owner','admin','manager','editor')));
$$;
revoke all on function public.authorize_gmail_watch(uuid,uuid) from public,anon,authenticated;
grant execute on function public.authorize_gmail_watch(uuid,uuid) to service_role;
create function public.complete_gmail_watch(target_connection uuid,target_revision uuid,target_lease uuid,target_patch jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare item public.gmail_mailbox_watches%rowtype; next_history text;
begin
 select * into item from public.gmail_mailbox_watches where connection_id=target_connection and lease_token=target_lease and lease_until>now() for update;
 if item.connection_id is null or not public.authorize_gmail_watch(target_connection,target_revision) then raise exception 'mailbox_consent_withdrawn'; end if;
 next_history:=coalesce(target_patch->>'history_id',item.history_id);
 if next_history is not null and next_history !~ '^[0-9]{1,30}$' then raise exception 'invalid_history'; end if;
 if item.history_id is not null and next_history::numeric<item.history_id::numeric then raise exception 'invalid_history'; end if;
 update public.gmail_mailbox_watches set history_id=next_history,
 pending_history_id=case when pending_history_id::numeric<=next_history::numeric then null else pending_history_id end,
 watch_expires_at=coalesce((target_patch->>'watch_expires_at')::timestamptz,watch_expires_at),
 state=coalesce(target_patch->>'state',state),lease_until=null,lease_token=null,updated_at=now() where connection_id=target_connection;
end; $$;
revoke all on function public.complete_gmail_watch(uuid,uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.complete_gmail_watch(uuid,uuid,uuid,jsonb) to service_role;
-- Configured privately by the operator; install paused like the existing worker.
select cron.alter_job(job_id := cron.schedule(
 'cuebooker-gmail-history','* * * * *',
 $command$
 select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name='cuebooker_gmail_history_worker_url'),
  headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='cuebooker_mailbox_worker_secret')),
  body := '{}'::jsonb,timeout_milliseconds := 30000
 ) where exists(select 1 from public.mailbox_connections where transport='gmail' and status='connected' and background_analysis_enabled)
 and exists(select 1 from vault.secrets where name='cuebooker_gmail_history_worker_url')
 and exists(select 1 from vault.secrets where name='cuebooker_mailbox_worker_secret');
 $command$
),active:=false);
commit;
