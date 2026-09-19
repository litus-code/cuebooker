begin;

create type public.notification_kind as enum (
  'booking_request_received',
  'promoter_reply_received'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  booking_id uuid not null,
  activity_id uuid references public.activities(id) on delete cascade,
  kind public.notification_kind not null,
  dedupe_key text not null check (char_length(dedupe_key) between 1 and 180),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, booking_id)
    references public.bookings(workspace_id, id) on delete cascade,
  unique (workspace_id, recipient_user_id, dedupe_key)
);

create index notifications_recipient_created_idx
  on public.notifications(recipient_user_id, created_at desc);

create index notifications_recipient_unread_idx
  on public.notifications(recipient_user_id, created_at desc)
  where read_at is null;

create index notifications_workspace_booking_idx
  on public.notifications(workspace_id, booking_id, created_at desc);

alter table public.notifications enable row level security;

create policy notifications_select_recipient
on public.notifications for select
to authenticated
using (
  recipient_user_id = (select auth.uid())
  and private.is_workspace_member(workspace_id)
);

create policy notifications_update_recipient
on public.notifications for update
to authenticated
using (
  recipient_user_id = (select auth.uid())
  and private.is_workspace_member(workspace_id)
)
with check (
  recipient_user_id = (select auth.uid())
  and private.is_workspace_member(workspace_id)
);

revoke all on table public.notifications from anon, authenticated;
grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

create or replace function private.enqueue_workspace_notification(
  target_workspace_id uuid,
  target_booking_id uuid,
  target_activity_id uuid,
  target_kind public.notification_kind,
  target_dedupe_key text,
  target_metadata jsonb default '{}'::jsonb
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_count integer := 0;
begin
  if target_workspace_id is null
     or target_booking_id is null
     or target_kind is null
     or nullif(trim(target_dedupe_key), '') is null then
    raise exception 'invalid_notification_event';
  end if;

  if jsonb_typeof(coalesce(target_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'invalid_notification_metadata';
  end if;

  insert into public.notifications (
    workspace_id,
    recipient_user_id,
    booking_id,
    activity_id,
    kind,
    dedupe_key,
    metadata
  )
  select
    wm.workspace_id,
    wm.user_id,
    target_booking_id,
    target_activity_id,
    target_kind,
    trim(target_dedupe_key),
    coalesce(target_metadata, '{}'::jsonb)
  from public.workspace_members wm
  where wm.workspace_id = target_workspace_id
    and wm.role in ('owner', 'admin', 'manager', 'editor')
  on conflict (workspace_id, recipient_user_id, dedupe_key) do nothing;

  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

revoke all on function private.enqueue_workspace_notification(
  uuid, uuid, uuid, public.notification_kind, text, jsonb
) from public, anon, authenticated;

create or replace function private.notify_new_public_booking()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.capture_method = 'public_form' then
    perform private.enqueue_workspace_notification(
      new.workspace_id,
      new.id,
      null,
      'booking_request_received',
      'booking_request:' || new.id::text,
      jsonb_strip_nulls(jsonb_build_object(
        'artist_id', new.artist_id,
        'entry_source', new.entry_source,
        'event_date', new.event_date,
        'venue_name', new.venue_name,
        'city', new.city
      ))
    );
  end if;

  return new;
end;
$$;

create trigger bookings_notify_new_public_booking
after insert on public.bookings
for each row execute function private.notify_new_public_booking();

create or replace function private.notify_external_booking_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ingest_source text;
begin
  ingest_source := coalesce(new.metadata->>'ingested_by', '');

  if new.direction = 'inbound'
     and new.created_by is null
     and ingest_source in ('public_follow_up', 'brevo_inbound') then
    perform private.enqueue_workspace_notification(
      new.workspace_id,
      new.booking_id,
      new.id,
      'promoter_reply_received',
      'promoter_reply:' || new.id::text,
      jsonb_strip_nulls(jsonb_build_object(
        'activity_type', new.type,
        'ingested_by', ingest_source,
        'contact_id', new.contact_id,
        'occurred_at', new.occurred_at
      ))
    );
  end if;

  return new;
end;
$$;

create trigger activities_notify_external_booking_reply
after insert on public.activities
for each row execute function private.notify_external_booking_reply();

comment on table public.notifications is
  'User-facing notification event stream. Email, in-product and future push delivery should derive from this shared domain event rather than create channel-specific booking logic.';

comment on column public.notifications.dedupe_key is
  'Stable event-level idempotency key scoped to workspace + recipient.';

commit;
