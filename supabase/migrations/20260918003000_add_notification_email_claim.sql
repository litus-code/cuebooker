begin;

create index notification_email_deliveries_processing_idx
  on public.notification_email_deliveries(processing_started_at)
  where status = 'processing';

create or replace function public.claim_notification_email_deliveries(
  batch_size integer default 10
)
returns table (
  delivery_id uuid,
  notification_id uuid,
  recipient_user_id uuid,
  attempts integer
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user <> 'service_role' then
    raise exception 'service_role_required';
  end if;

  if batch_size < 1 or batch_size > 25 then
    raise exception 'invalid_batch_size';
  end if;

  return query
  with candidates as (
    select d.id
    from public.notification_email_deliveries d
    where d.attempts < 5
      and (
        (
          d.status in ('queued', 'failed')
          and d.next_attempt_at <= now()
        )
        or (
          d.status = 'processing'
          and d.processing_started_at < now() - interval '15 minutes'
        )
      )
    order by d.next_attempt_at asc, d.created_at asc
    for update skip locked
    limit batch_size
  )
  update public.notification_email_deliveries d
  set
    status = 'processing',
    attempts = d.attempts + 1,
    processing_started_at = now(),
    failed_at = null,
    last_error_code = null
  from candidates c
  where d.id = c.id
  returning d.id, d.notification_id, d.recipient_user_id, d.attempts;
end;
$$;

revoke all on function public.claim_notification_email_deliveries(integer)
  from public, anon, authenticated;
grant execute on function public.claim_notification_email_deliveries(integer)
  to service_role;

comment on function public.claim_notification_email_deliveries(integer) is
  'Service-role-only SKIP LOCKED claim for queued notification emails. Reclaims stale processing jobs after 15 minutes and caps attempts at five.';

commit;
