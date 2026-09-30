begin;
create table public.mailbox_booking_threads (
 connection_id uuid not null references public.mailbox_connections(id) on delete cascade,
 thread_id text not null check(char_length(thread_id) between 1 and 512),
 workspace_id uuid not null,
 booking_id uuid not null,
 primary key(connection_id,thread_id),
 foreign key(workspace_id,booking_id) references public.bookings(workspace_id,id) on delete cascade
);
create index mailbox_booking_threads_booking on public.mailbox_booking_threads(workspace_id,booking_id);
alter table public.mailbox_booking_threads enable row level security;
revoke all on public.mailbox_booking_threads from public,anon,authenticated;
grant select,insert,update,delete on public.mailbox_booking_threads to service_role;

-- Only verified server messages can enter this transaction. Actor access is rechecked
-- here, and locking the connection serializes import/retry races.
create function public.ingest_mailbox_thread(target_connection uuid,target_actor uuid,target_thread text,target_messages jsonb,target_artist uuid default null,target_booking uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare c public.mailbox_connections; b public.bookings; m jsonb; eid uuid; sender text; recipient text; direction public.activity_direction; occurred timestamptz;
begin
 select * into c from public.mailbox_connections where id=target_connection and user_id=target_actor and status='connected' for update;
 if c.id is null or not exists(select 1 from public.workspace_members where workspace_id=c.workspace_id and user_id=target_actor and role::text in ('owner','admin','manager','editor')) then raise exception 'workspace_access_denied'; end if;
 if target_thread is null or length(target_thread) not between 1 and 512 or jsonb_typeof(target_messages)<>'array' or jsonb_array_length(target_messages) not between 1 and 20 then raise exception 'invalid_thread'; end if;
 select bk.* into b from public.mailbox_booking_threads t join public.bookings bk on bk.id=t.booking_id and bk.workspace_id=t.workspace_id where t.connection_id=c.id and t.thread_id=target_thread;
 if b.id is not null and target_booking is not null and b.id<>target_booking then raise exception 'thread_already_linked'; end if;
 if b.id is null and target_booking is not null then
  select * into b from public.bookings where workspace_id=c.workspace_id and id=target_booking;
  if b.id is null then raise exception 'booking_not_found'; end if;
 end if;
 if b.id is null then
  if target_artist is null then raise exception 'artist_required'; end if;
  m:=target_messages->0;
  sender:=lower(m->>'from');
  if sender=c.email then raise exception 'incoming_message_required'; end if;
  perform set_config('request.jwt.claim.sub',target_actor::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',target_actor,'role','authenticated')::text,true);
  b:=public.create_manual_booking(target_workspace_id=>c.workspace_id,target_artist_id=>target_artist,target_source=>'email',contact_name=>coalesce(nullif(m->>'senderName',''),sender),contact_email=>sender,event_name=>left(coalesce(nullif(m->>'subject',''),'Solicitud por correo'),300));
  update public.bookings set capture_method='email_import' where id=b.id;
 end if;
 if b.archived_at is not null then raise exception 'archived_booking_read_only'; end if;
 if b.primary_contact_id is null then raise exception 'booking_contact_required'; end if;
 insert into public.mailbox_booking_threads values(c.id,target_thread,c.workspace_id,b.id) on conflict do nothing;
 for m in select value from jsonb_array_elements(target_messages) loop
  if m->>'threadId' is distinct from target_thread or nullif(m->>'id','') is null then raise exception 'invalid_message'; end if;
  sender:=lower(m->>'from'); recipient:=lower(m->>'to');
  direction:=case when sender=c.email then 'outbound'::public.activity_direction else 'inbound'::public.activity_direction end;
  occurred:=(m->>'date')::timestamptz;
  insert into public.email_messages(workspace_id,booking_id,contact_id,direction,to_email,from_email,subject,body_text,status,provider,provider_message_id,created_by,sent_at,received_at)
  values(c.workspace_id,b.id,b.primary_contact_id,direction,recipient,sender,left(coalesce(nullif(m->>'subject',''),'(Sin asunto)'),300),left(coalesce(nullif(m->>'body',''),'(Mensaje sin texto)'),20000),case when direction='outbound' then 'sent' else 'received' end,'nylas:'||c.id,m->>'id',target_actor,case when direction='outbound' then occurred end,case when direction='inbound' then occurred end)
  on conflict(provider,provider_message_id) where provider is not null and provider_message_id is not null do nothing returning id into eid;
  if eid is not null then
   insert into public.activities(workspace_id,booking_id,type,direction,contact_id,actor_user_id,body,metadata,visibility,occurred_at,created_by)
   values(c.workspace_id,b.id,'email',direction,b.primary_contact_id,target_actor,left(coalesce(nullif(m->>'body',''),'(Mensaje sin texto)'),20000),jsonb_build_object('email_message_id',eid,'subject',m->>'subject','from_email',sender,'to_email',recipient,'provider','nylas','provider_message_id',m->>'id'),'workspace',occurred,target_actor);
  end if;
 end loop;
 return b.id;
end;$$;
revoke all on function public.ingest_mailbox_thread(uuid,uuid,text,jsonb,uuid,uuid) from public,anon,authenticated;
grant execute on function public.ingest_mailbox_thread(uuid,uuid,text,jsonb,uuid,uuid) to service_role;
create table public.mailbox_send_attempts (
 id uuid primary key,
 connection_id uuid not null references public.mailbox_connections(id) on delete cascade,
 workspace_id uuid not null,
 booking_id uuid not null,
 user_id uuid not null references auth.users(id),
 state text not null default 'pending' check(state in ('pending','sent','uncertain')),
 provider_message_id text,
 created_at timestamptz not null default now(),
 foreign key(workspace_id,booking_id) references public.bookings(workspace_id,id)
);
create index mailbox_send_attempts_connection on public.mailbox_send_attempts(connection_id);
create index mailbox_send_attempts_booking on public.mailbox_send_attempts(workspace_id,booking_id);
create index mailbox_send_attempts_user on public.mailbox_send_attempts(user_id);
alter table public.mailbox_send_attempts enable row level security;
revoke all on public.mailbox_send_attempts from public,anon,authenticated;
grant select,insert,update on public.mailbox_send_attempts to service_role;
commit;
