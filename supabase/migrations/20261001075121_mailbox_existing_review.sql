begin;
create or replace function public.ingest_mailbox_thread(target_connection uuid,target_actor uuid,target_thread text,target_messages jsonb,target_artist uuid default null,target_booking uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
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
   values(c.workspace_id,b.id,'email',direction,b.primary_contact_id,target_actor,left(coalesce(nullif(m->>'body',''),'(Mensaje sin texto)'),20000),jsonb_build_object('email_message_id',eid,'subject',m->>'subject','from_email',sender,'to_email',recipient,'provider','nylas','provider_message_id',m->>'id'),'workspace',occurred,target_actor);
  end if;
 end loop;
 return b.id;
end;$$;
revoke all on function public.ingest_mailbox_thread(uuid,uuid,text,jsonb,uuid,uuid) from public,anon,authenticated;
grant execute on function public.ingest_mailbox_thread(uuid,uuid,text,jsonb,uuid,uuid) to service_role;


commit;
