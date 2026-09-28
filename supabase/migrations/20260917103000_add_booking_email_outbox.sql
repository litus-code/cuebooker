begin;

create table public.email_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  booking_id uuid not null,
  contact_id uuid not null,
  direction public.activity_direction not null default 'outbound',
  to_email text not null check (char_length(trim(to_email)) between 3 and 320),
  from_email text,
  subject text not null check (char_length(trim(subject)) between 1 and 300),
  body_text text not null check (char_length(trim(body_text)) between 1 and 20000),
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed')),
  provider text,
  provider_message_id text,
  reply_token uuid not null default gen_random_uuid(),
  sent_at timestamptz,
  failed_at timestamptz,
  failure_code text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (reply_token),
  foreign key (workspace_id, booking_id)
    references public.bookings(workspace_id, id) on delete cascade,
  foreign key (workspace_id, contact_id)
    references public.contacts(workspace_id, id) on delete restrict,
  check ((status = 'sent' and sent_at is not null) or status <> 'sent'),
  check ((status = 'failed' and failed_at is not null) or status <> 'failed')
);

create index email_messages_booking_created_idx
  on public.email_messages(workspace_id, booking_id, created_at desc);
create index email_messages_workspace_status_idx
  on public.email_messages(workspace_id, status, created_at desc);
create index email_messages_contact_created_idx
  on public.email_messages(workspace_id, contact_id, created_at desc);

create trigger email_messages_preserve_identity
before update on public.email_messages
for each row execute function private.preserve_workspace_record_identity();

create trigger email_messages_set_updated_at
before update on public.email_messages
for each row execute function public.set_updated_at();

alter table public.email_messages enable row level security;

create policy email_messages_select_member
on public.email_messages for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy email_messages_insert_editor
on public.email_messages for insert
to authenticated
with check (
  private.can_edit_workspace(workspace_id)
  and created_by = (select auth.uid())
  and direction = 'outbound'
  and status = 'queued'
  and provider is null
  and provider_message_id is null
  and sent_at is null
  and failed_at is null
  and failure_code is null
);

-- Delivery fields are intentionally not writable through authenticated client RLS.
-- The email Edge Function owns provider/status transitions with the service role
-- only after independently validating the caller and booking/workspace relation.

commit;
