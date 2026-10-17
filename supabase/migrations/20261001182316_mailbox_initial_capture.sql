begin;
CREATE OR REPLACE FUNCTION public.ingest_mailbox_thread(target_connection uuid, target_actor uuid, target_thread text, target_messages jsonb, target_artist uuid DEFAULT NULL::uuid, target_booking uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare c public.mailbox_connections; b public.bookings; m jsonb; eid uuid; sender text; recipient text; direction public.activity_direction; occurred timestamptz; review jsonb; contact_id uuid;
begin
 select * into c from public.mailbox_connections where id=target_connection and user_id=target_actor and status='connected' for update;
 if c.id is null or not exists(select 1 from public.workspace_members where workspace_id=c.workspace_id and user_id=target_actor and role::text in ('owner','admin','manager','editor')) then raise exception 'workspace_access_denied'; end if;
 if target_thread is null or length(target_thread) not between 1 and 512 or jsonb_typeof(target_messages)<>'array' or jsonb_array_length(target_messages) not between 1 and 20 then raise exception 'invalid_thread'; end if;
 select bk.* into b from public.mailbox_booking_threads t join public.bookings bk on bk.id=t.booking_id and bk.workspace_id=t.workspace_id where t.connection_id=c.id and t.thread_id=target_thread for update of bk;
 if b.id is not null and target_booking is not null and b.id<>target_booking then raise exception 'thread_already_linked'; end if;
 if b.id is null and target_booking is not null then
  select * into b from public.bookings where workspace_id=c.workspace_id and id=target_booking;
  if b.id is null then raise exception 'booking_not_found'; end if;
 end if;
 review:=(target_messages->0)->'reviewedDetails';
 if ((target_messages->0)->'applyReviewedToExisting')='true'::jsonb and (b.id is null or b.updated_at is distinct from (((target_messages->0)->>'expectedUpdatedAt')::timestamptz)) then raise exception 'booking_review_stale'; end if;
 if b.archived_at is not null then raise exception 'archived_booking_read_only'; end if;
 if b.id is not null and ((target_messages->0)->'applyReviewedToExisting')='true'::jsonb then
  if review is null or jsonb_typeof(review)<>'object' or exists(select 1 from jsonb_object_keys(review) k where k not in ('eventDate','startTime','endTime','venue','city','offerAmountMinor','currency','contactPhone','contactName','eventTimezone')) then raise exception 'invalid_booking_draft'; end if;
  perform set_config('request.jwt.claim.sub',target_actor::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',target_actor,'role','authenticated')::text,true);
  perform public.update_booking_details(
   target_workspace_id=>c.workspace_id,target_booking_id=>b.id,next_event_name=>b.event_name,
   next_venue_name=>coalesce(nullif(review->>'venue',''),b.venue_name),next_city=>coalesce(nullif(review->>'city',''),b.city),next_country_code=>b.country_code,
   next_event_date=>coalesce((review->>'eventDate')::date,b.event_date),
   next_start_time=>coalesce((review->>'startTime')::time,b.start_time),next_end_time=>coalesce((review->>'endTime')::time,b.end_time),
   next_event_timezone=>coalesce(nullif(review->>'eventTimezone',''),b.event_timezone),next_offer_amount_minor=>coalesce((review->>'offerAmountMinor')::bigint,b.offer_amount_minor),
   next_currency=>coalesce(nullif(review->>'currency',''),b.currency),next_fee_basis=>b.fee_basis
  );
 end if;
 if b.id is null then
  if target_artist is null then raise exception 'artist_required'; end if;
  m:=target_messages->0;
  sender:=lower(m->>'from');
  review:=m->'reviewedDetails';
  select id into contact_id from public.contacts where workspace_id=c.workspace_id and lower(email)=sender order by created_at,id limit 1;
  if sender=c.email then raise exception 'incoming_message_required'; end if;
  perform set_config('request.jwt.claim.sub',target_actor::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',target_actor,'role','authenticated')::text,true);
  b:=public.create_manual_booking(target_workspace_id=>c.workspace_id,target_artist_id=>target_artist,target_source=>'email',existing_contact_id=>contact_id,contact_name=>coalesce(nullif(review->>'contactName',''),nullif(m->>'senderName',''),sender),contact_email=>sender,contact_phone=>review->>'contactPhone',event_name=>left(coalesce(nullif(m->>'subject',''),'Solicitud por correo'),300));
  if review is not null then
   if jsonb_typeof(review)<>'object' or exists(select 1 from jsonb_object_keys(review) k where k not in ('eventDate','startTime','endTime','venue','city','offerAmountMinor','currency','contactPhone','contactName','eventTimezone')) then raise exception 'invalid_booking_draft'; end if;
   if nullif(review->>'eventDate','') is null and (nullif(review->>'startTime','') is not null or nullif(review->>'endTime','') is not null) then raise exception 'booking_time_requires_date'; end if;
   if review->>'offerAmountMinor' is not null and ((review->>'offerAmountMinor')::bigint<0 or review->>'currency' is null) then raise exception 'invalid_offer_amount'; end if;
   update public.bookings set
    event_date=(review->>'eventDate')::date,start_time=(review->>'startTime')::time,end_time=(review->>'endTime')::time,
    venue_name=nullif(review->>'venue',''),city=nullif(review->>'city',''),
    offer_amount_minor=(review->>'offerAmountMinor')::bigint,currency=nullif(review->>'currency',''),event_timezone=nullif(review->>'eventTimezone','')
   where id=b.id and workspace_id=c.workspace_id;
   insert into public.activities(workspace_id,booking_id,type,direction,actor_user_id,metadata,visibility,created_by)
   values(c.workspace_id,b.id,'system','internal',target_actor,jsonb_build_object('event','mailbox_details_reviewed'),'workspace',target_actor);
  end if;
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
   values(c.workspace_id,b.id,'email',direction,b.primary_contact_id,target_actor,left(coalesce(nullif(m->>'body',''),'(Mensaje sin texto)'),20000),jsonb_build_object('capture',m->>'capture','email_message_id',eid,'subject',m->>'subject','from_email',sender,'to_email',recipient,'provider','nylas','provider_message_id',m->>'id'),'workspace',occurred,target_actor);
  end if;
 end loop;
 return b.id;
end;$function$;

CREATE OR REPLACE FUNCTION private.sync_booking_status_from_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  current_status public.booking_status;
  next_status public.booking_status;
  capture_kind text := coalesce(new.metadata->>'capture', '');
begin
  -- Initial capture establishes the booking as NEW; it is not a conversation transition.
  if capture_kind in ('public_form', 'cue_manual', 'mailbox_initial') then
    return new;
  end if;

  -- Internal/system activity never drives conversational workflow state.
  if new.direction is null or new.direction = 'internal' then
    return new;
  end if;

  if new.direction = 'inbound' then
    next_status := 'in_conversation';
  elsif new.direction = 'outbound' then
    next_status := 'waiting_response';
  else
    return new;
  end if;

  select b.status
    into current_status
  from public.bookings b
  where b.id = new.booking_id
    and b.workspace_id = new.workspace_id
  for update;

  if current_status is null then
    return new;
  end if;

  -- Decision states are terminal for automatic workflow transitions.
  if current_status in ('confirmed', 'rejected', 'cancelled') then
    return new;
  end if;

  if current_status = next_status then
    return new;
  end if;

  update public.bookings
  set status = next_status
  where id = new.booking_id
    and workspace_id = new.workspace_id;

  insert into public.activities (
    workspace_id,
    booking_id,
    type,
    direction,
    contact_id,
    actor_user_id,
    body,
    metadata,
    visibility,
    occurred_at,
    created_by
  ) values (
    new.workspace_id,
    new.booking_id,
    'status_change',
    'internal',
    new.contact_id,
    new.actor_user_id,
    null,
    jsonb_build_object(
      'from_status', current_status,
      'to_status', next_status,
      'automatic', true,
      'reason', case
        when new.direction = 'inbound' then 'external_activity_received'
        else 'external_activity_sent'
      end,
      'trigger_activity_id', new.id
    ),
    'workspace',
    new.occurred_at,
    new.created_by
  );

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION private.complete_next_move_from_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  current_move public.next_moves;
  capture_kind text := coalesce(new.metadata->>'capture', '');
begin
  if new.direction <> 'inbound' then
    return new;
  end if;

  if capture_kind in ('public_form', 'cue_manual', 'mailbox_initial') then
    return new;
  end if;

  select *
    into current_move
  from public.next_moves nm
  where nm.workspace_id = new.workspace_id
    and nm.booking_id = new.booking_id
    and nm.completed_at is null
    and nm.completion_trigger = 'inbound_activity'
    and new.occurred_at >= nm.created_at
  limit 1
  for update;

  if not found then
    return new;
  end if;

  update public.next_moves
  set completed_at = new.occurred_at
  where id = current_move.id
    and completed_at is null;

  if not found then
    return new;
  end if;

  insert into public.activities (
    workspace_id,
    booking_id,
    type,
    direction,
    contact_id,
    actor_user_id,
    body,
    metadata,
    visibility,
    occurred_at,
    created_by
  ) values (
    new.workspace_id,
    new.booking_id,
    'next_move_completed',
    'internal',
    new.contact_id,
    new.actor_user_id,
    current_move.label,
    jsonb_build_object(
      'next_move_id', current_move.id,
      'automatic', true,
      'reason', 'inbound_activity_received',
      'completion_trigger', current_move.completion_trigger,
      'trigger_activity_id', new.id
    ),
    'workspace',
    new.occurred_at,
    new.created_by
  );

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.create_automatic_mailbox_request(target_job uuid, target_message jsonb, target_classification jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
 bid:=public.ingest_mailbox_thread(c.id,c.user_id,j.thread_id,jsonb_build_array(case when is_new then target_message||jsonb_build_object('capture','mailbox_initial') else target_message end),null,b.id);
 update public.mailbox_incoming_jobs set booking_id=bid,state='completed',classification_kind='booking',
  classification_reason=target_classification->>'reason',completed_at=now() where id=j.id;
 if is_new then
  insert into public.activities(workspace_id,booking_id,type,direction,actor_user_id,metadata,visibility,created_by)
  values(c.workspace_id,bid,'system','internal',c.user_id,jsonb_build_object('event','mailbox_request_created','warnings',d->'warnings'),'workspace',c.user_id);
  perform private.enqueue_workspace_notification(c.workspace_id,bid,null,'booking_request_received','mailbox-request:'||bid::text,
   jsonb_build_object('channel','in_app','capture_method','ai_capture','subject',b.event_name,'contact_name',target_message->>'senderName'));
 end if;
 return bid;
end;$function$;

commit;
