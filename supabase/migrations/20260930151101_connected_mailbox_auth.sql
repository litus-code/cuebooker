begin;
-- Server-only capabilities. No client reads, even for the owning user.
create table public.mailbox_connections (
 id uuid primary key default gen_random_uuid(),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 email text not null check (char_length(email) between 3 and 254 and email = lower(email)),
 provider text not null check (provider in ('google','microsoft','imap')),
 grant_id text not null unique,
 status text not null default 'connected' check (status in ('connected','disconnected')),
 connected_at timestamptz not null default now(),
 unique(workspace_id,user_id,email)
);
create index mailbox_connections_owner on public.mailbox_connections(user_id,workspace_id);
create table public.mailbox_oauth_states (
 state_hash text primary key check (char_length(state_hash)=64),
 workspace_id uuid not null references public.workspaces(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 expected_email text not null,
 provider text not null check (provider in ('google','microsoft','imap')),
 expires_at timestamptz not null,
 created_at timestamptz not null default now()
);
create index mailbox_oauth_states_owner on public.mailbox_oauth_states(user_id,workspace_id,expires_at);
alter table public.mailbox_connections enable row level security;
alter table public.mailbox_oauth_states enable row level security;
revoke all on public.mailbox_connections,public.mailbox_oauth_states from public,anon,authenticated;
grant select,insert,update,delete on public.mailbox_connections,public.mailbox_oauth_states to service_role;
commit;
