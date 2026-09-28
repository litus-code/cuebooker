begin;

alter table public.email_messages
  add column received_at timestamptz;

alter table public.email_messages
  drop constraint if exists email_messages_status_check;

alter table public.email_messages
  add constraint email_messages_status_check
  check (status in ('queued', 'sending', 'sent', 'failed', 'received'));

alter table public.email_messages
  add constraint email_messages_received_state_check
  check (
    (status = 'received' and direction = 'inbound' and received_at is not null)
    or (status <> 'received' and direction <> 'inbound')
  );

create unique index email_messages_provider_message_unique_idx
  on public.email_messages(provider, provider_message_id)
  where provider is not null and provider_message_id is not null;

commit;
