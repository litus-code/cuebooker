begin;
-- Global application budget, not an entitlement per DJ or workspace.
-- Increase to 10 only after the operator activates Nylas Essentials.
create table public.mailbox_beta_settings (
 id boolean primary key default true check (id),
 capacity integer not null default 5 check (capacity between 0 and 10)
);
insert into public.mailbox_beta_settings(id) values(true);
create table public.mailbox_beta_waitlist (
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(workspace_id,user_id)
);
alter table public.mailbox_beta_settings enable row level security;
alter table public.mailbox_beta_waitlist enable row level security;
revoke all on public.mailbox_beta_settings,public.mailbox_beta_waitlist from public,anon,authenticated;
grant select,insert,update,delete on public.mailbox_beta_settings,public.mailbox_beta_waitlist to service_role;
alter table public.mailbox_oauth_states add column claimed_at timestamptz;

-- Edge authenticates the actor first. Invoker command is service-role only.
-- The singleton row lock serializes reservations and finalization across tenants.
create function public.mailbox_beta_command(
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
  delete from public.mailbox_beta_waitlist where workspace_id=target_workspace and user_id=target_actor;
  return jsonb_build_object('connected',true);
 end if;
 raise exception 'invalid_action';
end;
$$;
revoke all on function public.mailbox_beta_command(text,uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.mailbox_beta_command(text,uuid,uuid,text,text,text,text) to service_role;
commit;
