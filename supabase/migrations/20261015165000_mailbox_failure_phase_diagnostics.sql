-- Failed jobs retain a bounded, non-sensitive failure phase for support triage.
create or replace function public.complete_mailbox_incoming(
 target_job uuid, target_state text, target_kind text default null, target_reason text default null
) returns boolean
language plpgsql set search_path to ''
as $function$
declare changed uuid;
begin
 if target_state is null or target_state not in ('completed','ignored','failed') then
  raise exception 'invalid_mailbox_job_completion';
 end if;
 if target_state = 'completed' and
    (target_kind is null or target_kind not in ('booking','review','other') or target_reason is null or length(target_reason)>240)
 then raise exception 'invalid_mailbox_job_completion'; end if;
 if target_state = 'ignored' and (target_kind is not null or target_reason is not null)
 then raise exception 'invalid_mailbox_job_completion'; end if;
 if target_state = 'failed' and
    (target_kind is not null or (target_reason is not null and target_reason not in
    ('authorization','provider_read','inbox_check','reply_matching','conversation_sync','classification','booking_creation','completion')))
 then raise exception 'invalid_mailbox_job_completion'; end if;
 update public.mailbox_incoming_jobs
 set state=target_state,classification_kind=target_kind,classification_reason=target_reason,completed_at=now()
 where id=target_job and state='processing'
 returning id into changed;
 return changed is not null;
end;
$function$;