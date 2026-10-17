begin;
create table public.mailbox_incoming_jobs (
 id uuid primary key default gen_random_uuid(),
 connection_id uuid not null references public.mailbox_connections(id) on delete cascade,
 message_id text not null check(length(message_id) between 1 and 512),
 event_id text not null check(length(event_id) between 1 and 512),
 thread_id text not null check(length(thread_id) between 1 and 512),
 message_date timestamptz not null,
 consent_revision uuid not null,
 created_at timestamptz not null default now(),
 state text not null default 'pending' check(state in ('pending','processing','completed','ignored','failed')),
 unique(connection_id,message_id),
 unique(connection_id,event_id)
);
create index mailbox_incoming_jobs_pending on public.mailbox_incoming_jobs(connection_id,created_at) where state='pending';
alter table public.mailbox_incoming_jobs enable row level security;
revoke all on public.mailbox_incoming_jobs from public,anon,authenticated;
grant select,insert,update,delete on public.mailbox_incoming_jobs to service_role;

create function public.enqueue_mailbox_incoming(target_grant text,target_event text,target_message text,target_thread text,target_date timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare c public.mailbox_connections; inserted uuid;
begin
 if target_grant is null or length(target_grant) not between 1 and 512
  or target_event is null or length(target_event) not between 1 and 512
  or target_message is null or length(target_message) not between 1 and 512
  or target_thread is null or length(target_thread) not between 1 and 512
  or target_date is null or target_date>clock_timestamp()+interval '5 minutes' then
  raise exception 'invalid_mailbox_notification';
 end if;
 -- Serialize admission with consent changes, reconnects and the per-mailbox queue cap.
 select * into c from public.mailbox_connections where grant_id=target_grant for update;
 if not found then return jsonb_build_object('accepted',false); end if;
 if c.status<>'connected' or not c.background_analysis_enabled or c.background_analysis_processor is distinct from 'groq-gpt-oss-20b-v1'
  or c.background_analysis_revision is null or c.background_analysis_since is null or target_date<c.background_analysis_since
  or not exists(select 1 from public.workspace_members where workspace_id=c.workspace_id and user_id=c.user_id and role in ('owner','admin','manager','editor')) then
  return jsonb_build_object('accepted',false);
 end if;
 if exists(select 1 from public.mailbox_incoming_jobs where connection_id=c.id and (message_id=target_message or event_id=target_event)) then
  return jsonb_build_object('accepted',true,'duplicate',true);
 end if;
 if (select count(*) from public.mailbox_incoming_jobs where connection_id=c.id and state='pending')>=1000 then
  return jsonb_build_object('error','mailbox_incoming_queue_full');
 end if;
 insert into public.mailbox_incoming_jobs(connection_id,message_id,event_id,thread_id,message_date,consent_revision)
 values(c.id,target_message,target_event,target_thread,target_date,c.background_analysis_revision)
 on conflict do nothing returning id into inserted;
 return jsonb_build_object('accepted',true,'duplicate',inserted is null);
end;
$$;
revoke all on function public.enqueue_mailbox_incoming(text,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.enqueue_mailbox_incoming(text,text,text,text,timestamptz) to service_role;
commit;
