begin;
alter table public.mailbox_connections add column ai_last_requested_at timestamptz;
commit;
