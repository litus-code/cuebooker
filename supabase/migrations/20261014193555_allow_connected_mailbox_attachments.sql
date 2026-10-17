begin;
-- Connected Mailbox can create a booking without an email_messages row.
alter table public.booking_email_attachments
  alter column email_message_id drop not null,
  add column mailbox_connection_id uuid,
  add column provider_message_id text;
alter table public.booking_email_attachments
  add constraint attachment_source_required check (
    (email_message_id is not null and mailbox_connection_id is null and provider_message_id is null)
    or (email_message_id is null and mailbox_connection_id is not null and nullif(trim(provider_message_id),'') is not null)
  );
alter table public.booking_email_attachments
  add constraint attachment_mailbox_connection_fk
  foreign key (mailbox_connection_id) references public.mailbox_connections(id) on delete cascade;
create unique index booking_email_attachments_mailbox_dedup
  on public.booking_email_attachments(mailbox_connection_id,provider_message_id,attachment_index)
  where mailbox_connection_id is not null;
create or replace function private.verify_booking_email_attachment()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if new.email_message_id is not null then
   if not exists (
     select 1 from public.email_messages em where em.id=new.email_message_id
     and em.workspace_id=new.workspace_id and em.booking_id=new.booking_id
     and em.direction='inbound'
   ) then raise exception 'attachment_email_booking_mismatch'; end if;
 else
   if not exists (
     select 1 from public.mailbox_connections mc where mc.id=new.mailbox_connection_id
     and mc.workspace_id=new.workspace_id
   ) then raise exception 'attachment_mailbox_workspace_mismatch'; end if;
 end if;
 return new;
end;
$$;
commit;
