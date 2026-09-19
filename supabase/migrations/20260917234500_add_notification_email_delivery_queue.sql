begin;

create type public.notification_delivery_status as enum (
  'queued',
  'processing',
  'sent',
  'failed'
);

create table public.notification_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.notifications(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  status public.notification_delivery_status not null default 'queued',
  attempts integer not null default 0 check (attempts >= 0),
  provider text,
  provider_message_id text,
  last_error_code text,
  next_attempt_at timestamptz not null default now(),
  processing_started_at timestamptz,
  sent_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notification_email_deliveries_ready_idx
  on public.notification_email_deliveries(next_attempt_at, created_at)
  where status in ('queued', 'failed');

create index notification_email_deliveries_recipient_idx
  on public.notification_email_deliveries(recipient_user_id, created_at desc);

create trigger notification_email_deliveries_set_updated_at
before update on public.notification_email_deliveries
for each row execute function public.set_updated_at();

alter table public.notification_email_deliveries enable row level security;

revoke all on table public.notification_email_deliveries from anon, authenticated;
grant select, insert, update, delete on table public.notification_email_deliveries to service_role;

create or replace function private.enqueue_notification_email_delivery()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notification_email_deliveries (
    notification_id,
    recipient_user_id
  ) values (
    new.id,
    new.recipient_user_id
  )
  on conflict (notification_id) do nothing;

  return new;
end;
$$;

create trigger notifications_enqueue_email_delivery
after insert on public.notifications
for each row execute function private.enqueue_notification_email_delivery();

comment on table public.notification_email_deliveries is
  'Email delivery queue for notification events. Delivery state is deliberately separate from the user-facing notification event so retries never duplicate domain events.';

commit;
