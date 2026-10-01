begin;
do $$
declare c public.mailbox_connections; a uuid; bid uuid; retry uuid; contact uuid; msg jsonb; draft jsonb; thread text:='draft-smoke-'||gen_random_uuid();
begin
 select mc.* into c from public.mailbox_connections mc join public.mailbox_booking_threads t on t.connection_id=mc.id where t.booking_id='98e1d5c2-8787-4302-a2c4-40ce1fd8eaa1' limit 1;
 if c.id is null then raise exception 'test_connection_missing'; end if;
 select artist_id into a from public.bookings where id='98e1d5c2-8787-4302-a2c4-40ce1fd8eaa1';
 draft:=jsonb_build_object('eventDate','2026-10-24','startTime','23:00','endTime','01:00','venue','Sala ficticia','city','Barcelona','offerAmountMinor',50000,'currency','EUR','contactName','Contacto ficticio','contactPhone','+34930000000','eventTimezone','Europe/Madrid');
 msg:=jsonb_build_object('id',gen_random_uuid(),'threadId',thread,'from','draft-smoke@example.invalid','to',c.email,'senderName','Contacto ficticio','subject','Prueba reversible','body','Mensaje ficticio de prueba','date',now(),'reviewedDetails',draft);
 bid:=public.ingest_mailbox_thread(c.id,c.user_id,thread,jsonb_build_array(msg),a);
 if not exists(select 1 from public.bookings where id=bid and status not in ('confirmed','rejected','cancelled') and event_date='2026-10-24' and start_time='23:00' and end_time='01:00' and city='Barcelona' and venue_name='Sala ficticia' and offer_amount_minor=50000 and currency='EUR') then raise exception 'draft_fields_or_manual_decision_failed'; end if;
 select primary_contact_id into contact from public.bookings where id=bid;
 if not exists(select 1 from public.contacts where id=contact and email='draft-smoke@example.invalid' and phone='+34930000000' and name='Contacto ficticio') then raise exception 'verified_sender_contact_failed'; end if;
 retry:=public.ingest_mailbox_thread(c.id,c.user_id,thread,jsonb_build_array(msg||jsonb_build_object('reviewedDetails',draft||jsonb_build_object('offerAmountMinor',90000))),a);
 if retry<>bid or (select offer_amount_minor from public.bookings where id=bid)<>50000 or (select count(*) from public.email_messages where booking_id=bid)<>1 then raise exception 'retry_changed_data_or_duplicated_mail'; end if;
 retry:=public.ingest_mailbox_thread(c.id,c.user_id,thread,jsonb_build_array(msg||jsonb_build_object('applyReviewedToExisting',true,'expectedUpdatedAt',(select updated_at from public.bookings where id=bid),'reviewedDetails',draft||jsonb_build_object('offerAmountMinor',60000,'city',null))),a);
 if retry<>bid or not exists(select 1 from public.bookings where id=bid and offer_amount_minor=60000 and city='Barcelona' and status not in ('confirmed','rejected','cancelled')) then raise exception 'explicit_review_failed'; end if;
 begin
  perform public.ingest_mailbox_thread(c.id,c.user_id,thread,jsonb_build_array(msg||jsonb_build_object('applyReviewedToExisting',true,'expectedUpdatedAt','2000-01-01T00:00:00Z')),a);
  raise exception 'stale_review_allowed';
 exception when others then if sqlerrm<>'booking_review_stale' then raise; end if; end;
 perform public.set_booking_status(c.workspace_id,bid,'confirmed');
 perform public.ingest_mailbox_thread(c.id,c.user_id,thread,jsonb_build_array(msg||jsonb_build_object('applyReviewedToExisting',true,'expectedUpdatedAt',(select updated_at from public.bookings where id=bid),'reviewedDetails',draft||jsonb_build_object('offerAmountMinor',70000))),a);
 if not exists(select 1 from public.bookings where id=bid and offer_amount_minor=70000 and status='confirmed') then raise exception 'human_decision_not_preserved'; end if;
 if (select count(*) from public.email_messages where booking_id=bid)<>1 then raise exception 'review_duplicated_email'; end if;
 thread:='second-smoke-'||gen_random_uuid();
 retry:=public.ingest_mailbox_thread(c.id,c.user_id,thread,jsonb_build_array(msg||jsonb_build_object('id',gen_random_uuid(),'threadId',thread)),a);
 if (select primary_contact_id from public.bookings where id=retry)<>contact then raise exception 'contact_not_reused'; end if;
 begin
  perform public.ingest_mailbox_thread(c.id,gen_random_uuid(),thread,jsonb_build_array(msg),a);
  raise exception 'foreign_actor_allowed';
 exception when others then if sqlerrm<>'workspace_access_denied' then raise; end if; end;
 begin
  thread:='bad-smoke-'||gen_random_uuid();
  perform public.ingest_mailbox_thread(c.id,c.user_id,thread,jsonb_build_array(msg||jsonb_build_object('id',gen_random_uuid(),'threadId',thread,'reviewedDetails',draft||jsonb_build_object('status','confirmed'))),a);
  raise exception 'injected_confirmation_allowed';
 exception when others then if sqlerrm<>'invalid_booking_draft' then raise; end if; end;
 if has_function_privilege('anon','public.ingest_mailbox_thread(uuid,uuid,text,jsonb,uuid,uuid)','execute') or has_function_privilege('authenticated','public.ingest_mailbox_thread(uuid,uuid,text,jsonb,uuid,uuid)','execute') then raise exception 'public_execute_exposed'; end if;
end $$;
rollback;
