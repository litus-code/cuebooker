begin;
-- Outbound documents use the same private metadata and workspace authorization.
create or replace function private.verify_booking_email_attachment()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if new.email_message_id is not null and not exists (
   select 1 from public.email_messages em
   where em.id=new.email_message_id and em.workspace_id=new.workspace_id
   and em.booking_id=new.booking_id and em.direction in ('inbound','outbound')
   and (new.mailbox_connection_id is null or (
     em.provider='nylas:' || new.mailbox_connection_id::text
     and em.provider_message_id=new.provider_message_id
   ))
 ) then raise exception 'attachment_email_booking_mismatch'; end if;
 if new.mailbox_connection_id is not null and not exists (
   select 1 from public.mailbox_connections mc
   where mc.id=new.mailbox_connection_id and mc.workspace_id=new.workspace_id
 ) then raise exception 'attachment_mailbox_workspace_mismatch'; end if;
 return new;
end;
$$;
commit;
