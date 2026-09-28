begin;

create or replace function private.prune_public_rate_limit_buckets(
  target_max_age interval default interval '48 hours'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_count integer;
begin
  if target_max_age < interval '1 hour'
     or target_max_age > interval '30 days' then
    raise exception 'invalid_rate_limit_retention';
  end if;

  delete from private.public_rate_limit_buckets
  where updated_at < now() - target_max_age;

  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function private.prune_public_rate_limit_buckets(interval)
  from public, anon, authenticated;

comment on function private.prune_public_rate_limit_buckets(interval) is
  'Deletes stale pseudonymous public-ingress rate-limit buckets. Default retention is 48 hours.';

do $$
declare
  existing_job_id bigint;
begin
  select jobid
  into existing_job_id
  from cron.job
  where jobname = 'cuebooker-prune-public-rate-limits'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'cuebooker-prune-public-rate-limits',
    '17 */6 * * *',
    'select private.prune_public_rate_limit_buckets(interval ''48 hours'');'
  );
end;
$$;

commit;
