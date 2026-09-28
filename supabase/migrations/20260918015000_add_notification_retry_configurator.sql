begin;

create or replace function private.configure_notification_email_retry(
  target_dispatch_url text,
  target_schedule text default '*/5 * * * *'
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_job_id bigint;
  scheduled_job_id bigint;
  normalized_url text := trim(coalesce(target_dispatch_url, ''));
  normalized_schedule text := trim(coalesce(target_schedule, ''));
begin
  if normalized_url = ''
     or normalized_url !~ '^https://[a-z0-9.-]+/functions/v1/dispatch-notification-emails$' then
    raise exception 'invalid_notification_dispatch_url';
  end if;

  if normalized_schedule = '' or char_length(normalized_schedule) > 80 then
    raise exception 'invalid_notification_dispatch_schedule';
  end if;

  select jobid
    into existing_job_id
  from cron.job
  where jobname = 'cuebooker-notification-email-retry'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  select cron.schedule(
    'cuebooker-notification-email-retry',
    normalized_schedule,
    format(
      $command$
        select net.http_post(
          url := %L,
          body := '{"limit":10}'::jsonb,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cuebooker-dispatch-token', private.issue_notification_dispatch_token()
          ),
          timeout_milliseconds := 10000
        );
      $command$,
      normalized_url
    )
  )
  into scheduled_job_id;

  return scheduled_job_id;
end;
$$;

revoke all on function private.configure_notification_email_retry(text, text)
  from public, anon, authenticated;

comment on function private.configure_notification_email_retry(text, text) is
  'Environment-specific scheduler installer for notification email retries. The dispatch URL is supplied at deployment time so staging/prod URLs are never hard-coded into shared migrations.';

commit;
