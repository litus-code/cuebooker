begin;

create table if not exists private.public_rate_limit_buckets (
  scope text not null,
  key_hash text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (scope, key_hash),
  check (char_length(scope) between 1 and 80),
  check (char_length(key_hash) = 64)
);

create index if not exists public_rate_limit_buckets_updated_idx
  on private.public_rate_limit_buckets(updated_at);

create or replace function public.consume_public_rate_limit(
  target_scope text,
  target_key_hash text,
  target_max_requests integer,
  target_window_seconds integer
)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  remaining integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_row private.public_rate_limit_buckets%rowtype;
  now_at timestamptz := now();
  window_interval interval;
begin
  if nullif(trim(coalesce(target_scope, '')), '') is null
     or char_length(target_scope) > 80
     or target_key_hash !~ '^[0-9a-f]{64}$'
     or target_max_requests < 1
     or target_max_requests > 10000
     or target_window_seconds < 1
     or target_window_seconds > 86400 then
    raise exception 'invalid_rate_limit_parameters';
  end if;

  window_interval := make_interval(secs => target_window_seconds);

  insert into private.public_rate_limit_buckets (
    scope, key_hash, window_started_at, request_count, updated_at
  ) values (
    target_scope, target_key_hash, now_at, 0, now_at
  )
  on conflict (scope, key_hash) do nothing;

  select *
  into current_row
  from private.public_rate_limit_buckets
  where scope = target_scope
    and key_hash = target_key_hash
  for update;

  if current_row.window_started_at + window_interval <= now_at then
    update private.public_rate_limit_buckets
    set window_started_at = now_at,
        request_count = 1,
        updated_at = now_at
    where scope = target_scope
      and key_hash = target_key_hash;

    return query select true, 0, greatest(target_max_requests - 1, 0);
    return;
  end if;

  if current_row.request_count >= target_max_requests then
    return query
    select
      false,
      greatest(
        ceil(extract(epoch from ((current_row.window_started_at + window_interval) - now_at)))::integer,
        1
      ),
      0;
    return;
  end if;

  update private.public_rate_limit_buckets
  set request_count = request_count + 1,
      updated_at = now_at
  where scope = target_scope
    and key_hash = target_key_hash
  returning * into current_row;

  return query
  select true, 0, greatest(target_max_requests - current_row.request_count, 0);
end;
$$;

revoke all on table private.public_rate_limit_buckets from public, anon, authenticated;
revoke all on function public.consume_public_rate_limit(text,text,integer,integer)
  from public, anon, authenticated;
grant execute on function public.consume_public_rate_limit(text,text,integer,integer)
  to service_role;

comment on table private.public_rate_limit_buckets is
  'Short-lived pseudonymous abuse-control counters for anonymous Cuebooker ingress. Raw IP/email/token values are never stored here.';

comment on function public.consume_public_rate_limit(text,text,integer,integer) is
  'Atomically consumes one fixed-window anonymous ingress budget. Service-role only.';

commit;
