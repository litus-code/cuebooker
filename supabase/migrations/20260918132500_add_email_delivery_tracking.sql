alter table public.email_messages
  add column if not exists delivery_status text,
  add column if not exists delivered_at timestamptz,
  add column if not exists bounced_at timestamptz,
  add column if not exists opened_at timestamptz,
  add column if not exists last_delivery_event_at timestamptz,
  add column if not exists delivery_failure_code text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.email_messages'::regclass
      and conname='email_messages_delivery_status_check'
  ) then
    alter table public.email_messages
      add constraint email_messages_delivery_status_check
      check (
        delivery_status is null or delivery_status = any (
          array['accepted','delivered','deferred','soft_bounce','hard_bounce','blocked','spam','invalid']
        )
      );
  end if;
end $$;

update public.email_messages
set delivery_status='accepted',
    last_delivery_event_at=coalesce(sent_at, created_at)
where direction='outbound'
  and status='sent'
  and delivery_status is null;

create index if not exists email_messages_provider_message_id_idx
  on public.email_messages(provider_message_id)
  where provider_message_id is not null;
