begin;
do $$
declare c public.mailbox_connections; j uuid:=gen_random_uuid(); bid uuid; again uuid; m jsonb; cl jsonb; rejected boolean:=false;
begin
 select * into c from public.mailbox_connections where workspace_id='37e3f326-86f8-4529-9648-67620c06d790' and background_analysis_enabled limit 1;
 if c.id is null then raise exception 'test_connection_missing'; end if;
 insert into public.mailbox_incoming_jobs(id,connection_id,message_id,event_id,thread_id,message_date,consent_revision,state)
 values(j,c.id,'auto-smoke-'||j,'auto-event-'||j,'auto-thread-'||j,now(),c.background_analysis_revision,'processing');
 m:=jsonb_build_object('id','auto-smoke-'||j,'threadId','auto-thread-'||j,'from','synthetic-auto@example.invalid','to',c.email,'senderName','Contacto de prueba','date',now(),'subject','Prueba de solicitud para varios artistas','body','Consulta ficticia para dos artistas. Presupuesto total 2200 EUR. No es una contratación.');
 cl:=jsonb_build_object('id','auto-smoke-'||j,'kind','booking','reason','Consulta para varios artistas',
 'draft',jsonb_build_object('eventDate',null,'startTime',null,'endTime',null,'venue',null,'city',null,'offerAmountMinor',220000,'currency','EUR','artistName',null,'contactPhone',null,'warnings',jsonb_build_array('Revisa la fecha.')));
 bid:=public.create_automatic_mailbox_request(j,m,cl);
 again:=public.create_automatic_mailbox_request(j,m,cl);
 if bid<>again or (select count(*) from public.mailbox_booking_threads where connection_id=c.id and thread_id='auto-thread-'||j)<>1 then raise exception 'duplicate_request'; end if;
 if not exists(select 1 from public.bookings where id=bid and artist_id is null and status='new' and offer_amount_minor=220000 and event_date is null) then raise exception 'invalid_request_data'; end if;
 if (select count(*) from public.email_messages where booking_id=bid)<>1 then raise exception 'duplicate_email'; end if;
 if not exists(select 1 from public.notifications where booking_id=bid and recipient_user_id=c.user_id and kind='booking_request_received') then raise exception 'notification_missing'; end if;
 if exists(select 1 from public.notification_email_deliveries q join public.notifications n on n.id=q.notification_id where n.booking_id=bid) then raise exception 'unsolicited_notification_email'; end if;
 if has_function_privilege('authenticated','public.create_automatic_mailbox_request(uuid,jsonb,jsonb)','execute') or has_function_privilege('anon','public.create_automatic_mailbox_request(uuid,jsonb,jsonb)','execute') then raise exception 'public_worker_rpc'; end if;
 -- Revocation must win before a second capture; no model/provider call is made here.
 j:=gen_random_uuid();
 insert into public.mailbox_incoming_jobs(id,connection_id,message_id,event_id,thread_id,message_date,consent_revision,state)
 values(j,c.id,'revoked-'||j,'revoked-event-'||j,'revoked-thread-'||j,now(),c.background_analysis_revision,'processing');
 update public.mailbox_connections set background_analysis_enabled=false,background_analysis_processor=null,background_analysis_since=null,background_analysis_revision=null where id=c.id;
 begin perform public.create_automatic_mailbox_request(j,m,cl); exception when others then if sqlerrm='mailbox_consent_withdrawn' then rejected:=true; else raise; end if; end;
 if not rejected then raise exception 'revoked_capture_allowed'; end if;
end;$$;
rollback;

begin;
do $$
declare c public.mailbox_connections; sc public.mailbox_connections; w uuid:=gen_random_uuid(); j uuid:=gen_random_uuid(); bid uuid; aid uuid; m jsonb; cl jsonb;
begin
 select * into c from public.mailbox_connections where workspace_id='37e3f326-86f8-4529-9648-67620c06d790' and background_analysis_enabled limit 1;
 select artist_id into aid from public.workspace_artists where workspace_id=c.workspace_id and roster_active limit 1;
 insert into public.workspaces(id,kind,name,created_by) values(w,'solo','Prueba transaccional DJ',c.user_id);
 insert into public.workspace_members(workspace_id,user_id,role) values(w,c.user_id,'owner') on conflict do nothing;
 insert into public.workspace_artists(workspace_id,artist_id,created_by) values(w,aid,c.user_id);
 sc:=jsonb_populate_record(null::public.mailbox_connections,to_jsonb(c)||jsonb_build_object('id',gen_random_uuid(),'workspace_id',w,'grant_id','solo-smoke-'||w));
 insert into public.mailbox_connections select sc.*;
 insert into public.mailbox_incoming_jobs(id,connection_id,message_id,event_id,thread_id,message_date,consent_revision,state)
 values(j,sc.id,'solo-mail-'||j,'solo-event-'||j,'solo-thread-'||j,now(),sc.background_analysis_revision,'processing');
 m:=jsonb_build_object('id','solo-mail-'||j,'threadId','solo-thread-'||j,'from','synthetic-dj@example.invalid','to',sc.email,'senderName','Promotor ficticio','date',now(),'subject','Prueba para un DJ','body','Consulta ficticia para el 4 de noviembre de 2026. 500 EUR.');
 cl:=jsonb_build_object('id','solo-mail-'||j,'kind','booking','reason','Consulta para DJ','draft',jsonb_build_object('eventDate','2026-11-04','startTime',null,'endTime',null,'venue',null,'city',null,'offerAmountMinor',50000,'currency','EUR','artistName',null,'contactPhone',null,'warnings','[]'::jsonb));
 bid:=public.create_automatic_mailbox_request(j,m,cl);
 if not exists(select 1 from public.bookings where id=bid and artist_id=aid and status='new' and offer_amount_minor=50000 and event_date='2026-11-04') then raise exception 'solo_capture_invalid'; end if;
end;$$;
rollback;
