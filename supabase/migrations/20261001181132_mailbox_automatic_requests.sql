begin;
alter table public.bookings alter column artist_id drop not null;
alter table public.bookings add column mailbox_draft jsonb
 check(mailbox_draft is null or (jsonb_typeof(mailbox_draft)='object' and octet_length(mailbox_draft::text)<=8000));
alter table public.bookings add constraint bookings_agency_email_request
 check(artist_id is not null or (source='email' and capture_method='ai_capture'));
create function private.guard_agency_email_request()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.artist_id is null and not exists(select 1 from public.workspaces where id=new.workspace_id and kind='agency') then
  raise exception 'artist_required';
 end if;
 return new;
end;$$;
revoke all on function private.guard_agency_email_request() from public,anon,authenticated;
create trigger bookings_guard_agency_email_request before insert or update on public.bookings
for each row execute function private.guard_agency_email_request();

alter table public.mailbox_incoming_jobs
 add column booking_id uuid references public.bookings(id) on delete set null,
 add column analysis_request_id uuid not null default gen_random_uuid();

create or replace function public.claim_mailbox_incoming()
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
 return jsonb_build_object('id',j.id,'requestId',j.analysis_request_id,'connectionId',c.id,'workspaceId',c.workspace_id,'actorId',c.user_id,'grantId',c.grant_id,'email',c.email,'messageId',j.message_id,'threadId',j.thread_id,'since',c.background_analysis_since);
end;$$;

-- In-app alerts for mailbox capture do not generate unsolicited outbound email.
create or replace function private.enqueue_notification_email_delivery()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.metadata->>'channel'='in_app' then return new; end if;
 insert into public.notification_email_deliveries(notification_id,recipient_user_id)
 values(new.id,new.recipient_user_id) on conflict(notification_id) do nothing;
 return new;
end;$$;
revoke all on function private.enqueue_notification_email_delivery() from public,anon,authenticated;

create function public.create_automatic_mailbox_request(target_job uuid,target_message jsonb,target_classification jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare j public.mailbox_incoming_jobs; c public.mailbox_connections; b public.bookings;
 cid uuid; aid uuid; wid_kind public.workspace_kind; d jsonb; bid uuid; is_new boolean:=false;
begin
 select connection.* into c from public.mailbox_connections connection join public.mailbox_incoming_jobs job on job.connection_id=connection.id where job.id=target_job for update of connection;
 select * into j from public.mailbox_incoming_jobs where id=target_job for update;
 if j.id is null or c.status<>'connected' or not c.background_analysis_enabled
  or c.background_analysis_processor<>'groq-gpt-oss-20b-v1'
  or c.background_analysis_revision is distinct from j.consent_revision
  or j.message_date<c.background_analysis_since
  or not exists(select 1 from public.workspace_members where workspace_id=c.workspace_id and user_id=c.user_id and role in ('owner','admin','manager','editor')) then
  raise exception 'mailbox_consent_withdrawn';
 end if;
 if j.booking_id is not null then return j.booking_id; end if;
 if j.state<>'processing' or target_classification->>'kind' is distinct from 'booking'
  or target_classification->>'id' is distinct from j.message_id
  or target_message->>'id' is distinct from j.message_id or target_message->>'threadId' is distinct from j.thread_id
  or coalesce(target_message->>'from','')='' or lower(target_message->>'from')=lower(c.email)
  or length(coalesce(target_classification->>'reason',''))>240 then raise exception 'invalid_mailbox_request'; end if;
 d:=target_classification->'draft';
 if d is null or jsonb_typeof(d)<>'object' or octet_length(d::text)>8000
  or jsonb_typeof(d->'warnings')<>'array' then raise exception 'invalid_booking_draft'; end if;
 select bk.* into b from public.mailbox_booking_threads t join public.bookings bk on bk.id=t.booking_id and bk.workspace_id=t.workspace_id where t.connection_id=c.id and t.thread_id=j.thread_id for update of bk;
 if b.id is null then
  select kind into wid_kind from public.workspaces where id=c.workspace_id;
  if wid_kind='solo' then
   select artist_id into aid from public.workspace_artists where workspace_id=c.workspace_id and roster_active order by artist_id limit 1;
   if aid is null or (select count(*) from public.workspace_artists where workspace_id=c.workspace_id and roster_active)<>1 then raise exception 'artist_required'; end if;
  end if;
  select id into cid from public.contacts where workspace_id=c.workspace_id and lower(email)=lower(target_message->>'from') order by created_at,id limit 1;
  if cid is null then
   insert into public.contacts(workspace_id,name,email,phone,created_by)
   values(c.workspace_id,left(coalesce(nullif(target_message->>'senderName',''),target_message->>'from'),200),lower(target_message->>'from'),nullif(d->>'contactPhone',''),c.user_id) returning id into cid;
  end if;
  insert into public.bookings(workspace_id,artist_id,primary_contact_id,source,origin_channel,capture_method,status,
   event_name,venue_name,city,event_date,start_time,end_time,offer_amount_minor,currency,mailbox_draft,created_by)
  values(c.workspace_id,aid,cid,'email','email','ai_capture','new',
   left(coalesce(nullif(target_message->>'subject',''),'Solicitud por correo'),300),nullif(d->>'venue',''),nullif(d->>'city',''),
   nullif(d->>'eventDate','')::date,nullif(d->>'startTime','')::time,nullif(d->>'endTime','')::time,(d->>'offerAmountMinor')::bigint,nullif(d->>'currency',''),d,c.user_id)
  returning * into b;
  insert into public.booking_contacts(workspace_id,booking_id,contact_id,created_by) values(c.workspace_id,b.id,cid,c.user_id);
  is_new:=true;
 end if;
 bid:=public.ingest_mailbox_thread(c.id,c.user_id,j.thread_id,jsonb_build_array(target_message),null,b.id);
 update public.mailbox_incoming_jobs set booking_id=bid,state='completed',classification_kind='booking',
  classification_reason=target_classification->>'reason',completed_at=now() where id=j.id;
 if is_new then
  insert into public.activities(workspace_id,booking_id,type,direction,actor_user_id,metadata,visibility,created_by)
  values(c.workspace_id,bid,'system','internal',c.user_id,jsonb_build_object('event','mailbox_request_created','warnings',d->'warnings'),'workspace',c.user_id);
  perform private.enqueue_workspace_notification(c.workspace_id,bid,null,'booking_request_received','mailbox-request:'||bid::text,
   jsonb_build_object('channel','in_app','capture_method','ai_capture','subject',b.event_name,'contact_name',target_message->>'senderName'));
 end if;
 return bid;
end;$$;
revoke all on function public.create_automatic_mailbox_request(uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.create_automatic_mailbox_request(uuid,jsonb,jsonb) to service_role;
comment on column public.bookings.mailbox_draft is 'Unconfirmed extracted values and uncertainty from the incoming email. Never a booking decision.';
commit;
