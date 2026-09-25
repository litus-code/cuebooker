begin;

create or replace function private.normalize_email_delivery_acceptance()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.direction = 'outbound'
     and new.status = 'sent'
     and new.delivery_status is null then
    new.delivery_status := 'accepted';
    new.last_delivery_event_at := coalesce(new.sent_at, now());
  end if;

  return new;
end;
$$;

drop trigger if exists email_messages_normalize_delivery_acceptance on public.email_messages;

create trigger email_messages_normalize_delivery_acceptance
before insert or update of status, sent_at, delivery_status
on public.email_messages
for each row
execute function private.normalize_email_delivery_acceptance();

update public.email_messages
set
  delivery_status = 'accepted',
  last_delivery_event_at = coalesce(last_delivery_event_at, sent_at, created_at)
where direction = 'outbound'
  and status = 'sent'
  and delivery_status is null;

revoke all on function private.normalize_email_delivery_acceptance() from public, anon, authenticated;

comment on function private.normalize_email_delivery_acceptance()
is 'Normalizes successful outbound provider acceptance into email delivery tracking without overwriting later delivery events.';

commit;
