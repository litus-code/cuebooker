begin;

create or replace function public.consume_notification_dispatch_token(
  target_token_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  consumed boolean := false;
begin
  update private.notification_dispatch_tokens
  set consumed_at = now()
  where token_hash = lower(trim(target_token_hash))
    and consumed_at is null
    and expires_at > now();

  consumed := found;
  return consumed;
end;
$$;

revoke all on function public.consume_notification_dispatch_token(text)
  from public, anon, authenticated;
grant execute on function public.consume_notification_dispatch_token(text)
  to service_role;

comment on function public.consume_notification_dispatch_token(text) is
  'Consumes a short-lived one-time scheduler token. SECURITY DEFINER is required because service_role has no direct access to the private token table; EXECUTE remains service-role-only.';

commit;
