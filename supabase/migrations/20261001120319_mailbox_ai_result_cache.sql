-- Private derived proposals, never raw email bodies. Access remains edge-only.
create table public.mailbox_ai_results (
 connection_id uuid not null references public.mailbox_connections(id) on delete cascade,
 message_id text not null check (length(message_id) between 1 and 512),
 extract_draft boolean not null,
 input_hash text not null check (input_hash ~ '^[0-9a-f]{64}$'),
 classification jsonb not null check (jsonb_typeof(classification) = 'object'),
 expires_at timestamptz not null,
 primary key (connection_id, message_id, extract_draft)
);
create index mailbox_ai_results_lookup on public.mailbox_ai_results(connection_id, input_hash);
alter table public.mailbox_ai_results enable row level security;
revoke all on public.mailbox_ai_results from public, anon, authenticated;
grant select, insert, update, delete on public.mailbox_ai_results to service_role;
comment on table public.mailbox_ai_results is 'Edge-only validated AI proposals; reusable for 24 hours. Expired rows pruned when this mailbox next writes an analysis.';
