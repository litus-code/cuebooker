begin;

create index if not exists email_delivery_webhook_receipts_matched_email_idx
  on public.email_delivery_webhook_receipts (matched_email_id)
  where matched_email_id is not null;

commit;
