begin;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create table private.notification_dispatch_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

revoke all on table private.notification_dispatch_tokens from public, anon, authenticated;

create or replace function private.issue_notification_dispatch_token()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  raw_token text;
  hashed_token text;
begin
  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  hashed_token := encode(extensions.digest(raw_token, 'sha256'), 'hex');

  insert into private.notification_dispatch_tokens(token_hash, expires_at)
  values (hashed_token, now() + interval '2 minutes');

  delete from private.notification_dispatch_tokens
  where expires_at < now() - interval '1 day'
     or consumed_at < now() - interval '1 day';

  return raw_token;
end;
$$;

create or replace function public.consume_notification_dispatch_token(
  target_token_hash text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  consumed boolean := false;
begin
  if current_user <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  update private.notification_dispatch_tokens
  set consumed_at = now()
  where token_hash = lower(trim(target_token_hash))
    and consumed_at is null
    and expires_at > now();

  consumed := found;
  return consumed;
end;
$$;

revoke all on function private.issue_notification_dispatch_token()
  from public, anon, authenticated;
revoke all on function public.consume_notification_dispatch_token(text)
  from public, anon, authenticated;
grant execute on function public.consume_notification_dispatch_token(text)
  to service_role;

comment on table private.notification_dispatch_tokens is
  'Short-lived one-time scheduler tokens for waking the notification email dispatcher without persisting service-role or provider credentials in cron SQL.';

commit;
