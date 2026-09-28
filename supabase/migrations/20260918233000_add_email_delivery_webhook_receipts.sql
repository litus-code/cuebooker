begin;

create table if not exists public.email_delivery_webhook_receipts (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  event_name text not null,
  normalized_status text,
  provider_message_id text,
  tag_email_id text,
  matched_email_id uuid references public.email_messages(id) on delete set null,
  match_method text not null default 'none'
    check (match_method in ('none','tag','provider_message_id')),
  processing_status text not null default 'received'
    check (processing_status in ('received','unmatched','persisted','error')),
  processed_at timestamptz
);

alter table public.email_delivery_webhook_receipts enable row level security;

revoke all on table public.email_delivery_webhook_receipts from anon;
revoke all on table public.email_delivery_webhook_receipts from authenticated;
grant select, insert, update on table public.email_delivery_webhook_receipts to service_role;

create index if not exists email_delivery_webhook_receipts_received_at_idx
  on public.email_delivery_webhook_receipts (received_at desc);

create index if not exists email_delivery_webhook_receipts_provider_message_idx
  on public.email_delivery_webhook_receipts (provider_message_id)
  where provider_message_id is not null;

comment on table public.email_delivery_webhook_receipts is
  'Operational metadata for authenticated transactional delivery callbacks. Stores no email body or webhook payload.';

commit;
