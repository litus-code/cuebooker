begin;
-- No client grants change. Metadata stays service-only under existing RLS.
alter table public.mailbox_incoming_jobs
 add column processing_started_at timestamptz,
 add column next_attempt_at timestamptz not null default now(),
 add column analysis_attempts integer not null default 0 check(analysis_attempts>=0),
 add column retry_reason text check(retry_reason is null or retry_reason='rate_limit');
create index mailbox_incoming_jobs_ready on public.mailbox_incoming_jobs(next_attempt_at,created_at) where state='pending';

-- Register Google watch before this transaction, then save consent + its baseline
-- together. A worker cannot replace the baseline with a later start cursor.
create function public.start_gmail_mailbox_detection(target_workspace uuid,target_actor uuid,target_connection uuid,target_history text,target_expires timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.mailbox_connections; preference jsonb;
begin
 if target_history is null or target_history !~ '^[0-9]{1,30}$' or target_expires is null or target_expires<=now() or target_expires>now()+interval '8 days' then raise exception 'invalid_gmail_watch'; end if;
 if not exists(select 1 from public.workspace_members where workspace_id=target_workspace and user_id=target_actor and role in ('owner','admin','manager','editor')) then raise exception 'workspace_access_denied'; end if;
 select * into c from public.mailbox_connections where id=target_connection and workspace_id=target_workspace and user_id=target_actor and transport='gmail' for update;
 if not found then raise exception 'connection_not_found'; end if;
 if c.status<>'connected' then raise exception 'mailbox_reconnect_required'; end if;
 if c.background_analysis_enabled then
  return jsonb_build_object('enabled',true,'processor',c.background_analysis_processor,'since',c.background_analysis_since,'revision',c.background_analysis_revision);
 end if;
 preference:=public.set_mailbox_background_analysis(target_workspace,target_actor,target_connection,true,'groq-gpt-oss-20b-v1');
 insert into public.gmail_mailbox_watches(connection_id,history_id,watch_expires_at,consent_revision,state,updated_at)
 values(target_connection,target_history,target_expires,(preference->>'revision')::uuid,'ready',now())
 on conflict(connection_id) do update set history_id=excluded.history_id,pending_history_id=null,watch_expires_at=excluded.watch_expires_at,consent_revision=excluded.consent_revision,state='ready',lease_until=null,lease_token=null,updated_at=now();
 return preference;
end;$$;
revoke all on function public.start_gmail_mailbox_detection(uuid,uuid,uuid,text,timestamptz) from public,anon,authenticated;
grant execute on function public.start_gmail_mailbox_detection(uuid,uuid,uuid,text,timestamptz) to service_role;

create or replace function public.claim_mailbox_incoming()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare j public.mailbox_incoming_jobs; c public.mailbox_connections;
begin
 update public.mailbox_incoming_jobs job set state='ignored',completed_at=now()
 where job.state='pending' and not exists(select 1 from public.mailbox_connections connection join public.workspace_members m on m.workspace_id=connection.workspace_id and m.user_id=connection.user_id
 where connection.id=job.connection_id and connection.status='connected' and connection.background_analysis_enabled and connection.background_analysis_processor='groq-gpt-oss-20b-v1' and connection.background_analysis_revision=job.consent_revision and job.message_date>=connection.background_analysis_since and m.role in ('owner','admin','manager','editor'));
 select job.* into j from public.mailbox_incoming_jobs job where job.state='pending' and job.next_attempt_at<=now() order by job.next_attempt_at,job.created_at for update skip locked limit 1;
 if not found then return null; end if;
 select * into c from public.mailbox_connections where id=j.connection_id for update;
 if not c.background_analysis_enabled or c.background_analysis_revision is distinct from j.consent_revision or c.status<>'connected' then return null; end if;
 update public.mailbox_incoming_jobs set state='processing',analysis_attempts=analysis_attempts+1,processing_started_at=now(),retry_reason=null where id=j.id;
 return jsonb_build_object('id',j.id,'requestId',j.analysis_request_id,'connectionId',c.id,'workspaceId',c.workspace_id,'actorId',c.user_id,'grantId',c.grant_id,'email',c.email,'messageId',j.message_id,'threadId',j.thread_id,'since',c.background_analysis_since);
end;$$;


-- Only an explicit model rate-limit rejection is eligible. Other uncertain
-- failures stay failed, preserving both data and the operator review boundary.
create function public.defer_mailbox_incoming(target_job uuid)
returns boolean language plpgsql security invoker set search_path='' as $$
declare j public.mailbox_incoming_jobs;
begin
 select * into j from public.mailbox_incoming_jobs where id=target_job and state='processing' for update;
 if not found or not public.authorize_mailbox_incoming(target_job) then return false; end if;
 update public.mailbox_incoming_jobs set state='pending',processing_started_at=null,next_attempt_at=now()+make_interval(secs=>least(900,60*power(2,least(j.analysis_attempts,4)))::integer),retry_reason='rate_limit',analysis_request_id=gen_random_uuid(),completed_at=null where id=j.id;
 return true;
end;$$;
revoke all on function public.defer_mailbox_incoming(uuid) from public,anon,authenticated;
grant execute on function public.defer_mailbox_incoming(uuid) to service_role;
commit;
