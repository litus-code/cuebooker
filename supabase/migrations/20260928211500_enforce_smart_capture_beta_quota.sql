-- Enforce a hard monthly Smart Capture AI allowance server-side.
-- This protects the OpenAI-backed beta feature from unbounded usage.

create table if not exists public.smart_capture_monthly_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  uses integer not null default 0 check (uses >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start)
);

alter table public.smart_capture_monthly_usage enable row level security;
revoke all on public.smart_capture_monthly_usage from anon, authenticated;

create or replace function public.reserve_smart_capture_monthly_use(monthly_limit integer default 10)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid := auth.uid();
  period date := date_trunc('month', now() at time zone 'utc')::date;
  next_period date := (date_trunc('month', now() at time zone 'utc') + interval '1 month')::date;
  current_uses integer;
begin
  if uid is null then
    raise exception 'authentication_required';
  end if;

  monthly_limit := greatest(1, least(coalesce(monthly_limit, 10), 100));

  insert into public.smart_capture_monthly_usage(user_id, period_start, uses, updated_at)
  values (uid, period, 1, now())
  on conflict (user_id, period_start)
  do update
    set uses = public.smart_capture_monthly_usage.uses + 1,
        updated_at = now()
    where public.smart_capture_monthly_usage.uses < monthly_limit
  returning uses into current_uses;

  if current_uses is null then
    select uses into current_uses
    from public.smart_capture_monthly_usage
    where user_id = uid and period_start = period;

    return jsonb_build_object(
      'allowed', false,
      'used', coalesce(current_uses, monthly_limit),
      'limit', monthly_limit,
      'remaining', 0,
      'reset_at', next_period
    );
  end if;

  return jsonb_build_object(
    'allowed', true,
    'used', current_uses,
    'limit', monthly_limit,
    'remaining', greatest(0, monthly_limit - current_uses),
    'reset_at', next_period
  );
end;
$$;

revoke all on function public.reserve_smart_capture_monthly_use(integer) from public;
grant execute on function public.reserve_smart_capture_monthly_use(integer) to authenticated;
