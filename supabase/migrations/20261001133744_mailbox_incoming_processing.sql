begin;
alter table public.mailbox_incoming_jobs add column classification_kind text check(classification_kind in ('booking','review','other')),add column classification_reason text check(length(classification_reason)<=240),add column completed_at timestamptz;
create function public.claim_mailbox_incoming()
returns jsonb language plpgsql security invoker set search_path='' as $$
declare j public.mailbox_incoming_jobs; c public.mailbox_connections;
begin
 update public.mailbox_incoming_jobs job set state='ignored',completed_at=now()
 where job.state='pending' and not exists(select 1 from public.mailbox_connections connection join public.workspace_members m on m.workspace_id=connection.workspace_id and m.user_id=connection.user_id
 where connection.id=job.connection_id and connection.status='connected' and connection.background_analysis_enabled and connection.background_analysis_processor='groq-gpt-oss-20b-v1' and connection.background_analysis_revision=job.consent_revision and job.message_date>=connection.background_analysis_since and m.role in ('owner','admin','manager','editor'));
 select job.* into j from public.mailbox_incoming_jobs job where job.state='pending' order by job.created_at for update skip locked limit 1;
 if not found then return null; end if;
 select * into c from public.mailbox_connections where id=j.connection_id for update;
 if not c.background_analysis_enabled or c.background_analysis_revision is distinct from j.consent_revision or c.status<>'connected' then return null; end if;
 update public.mailbox_incoming_jobs set state='processing' where id=j.id;
 return jsonb_build_object('id',j.id,'connectionId',c.id,'workspaceId',c.workspace_id,'actorId',c.user_id,'grantId',c.grant_id,'email',c.email,'messageId',j.message_id,'threadId',j.thread_id,'since',c.background_analysis_since);
end;
$$;
create function public.authorize_mailbox_incoming(target_job uuid)
returns boolean language sql security invoker set search_path='' as $$
 select exists(select 1 from public.mailbox_incoming_jobs j join public.mailbox_connections c on c.id=j.connection_id join public.workspace_members m on m.workspace_id=c.workspace_id and m.user_id=c.user_id
 where j.id=target_job and j.state='processing' and c.status='connected' and c.background_analysis_enabled and c.background_analysis_processor='groq-gpt-oss-20b-v1' and c.background_analysis_revision=j.consent_revision and j.message_date>=c.background_analysis_since and m.role in ('owner','admin','manager','editor'));
$$;
create function public.complete_mailbox_incoming(target_job uuid,target_state text,target_kind text default null,target_reason text default null)
returns boolean language plpgsql security invoker set search_path='' as $$
declare changed uuid;
begin
 if target_state not in ('completed','ignored','failed') or target_state is null
  or (target_state='completed' and (target_kind is null or target_kind not in ('booking','review','other') or target_reason is null or length(target_reason)>240))
  or (target_state<>'completed' and (target_kind is not null or target_reason is not null)) then raise exception 'invalid_mailbox_job_completion'; end if;
 update public.mailbox_incoming_jobs set state=target_state,classification_kind=target_kind,classification_reason=target_reason,completed_at=now() where id=target_job and state='processing' returning id into changed;
 return changed is not null;
end;
$$;
revoke all on function public.claim_mailbox_incoming(),public.authorize_mailbox_incoming(uuid),public.complete_mailbox_incoming(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.claim_mailbox_incoming(),public.authorize_mailbox_incoming(uuid),public.complete_mailbox_incoming(uuid,text,text,text) to service_role;
commit;
