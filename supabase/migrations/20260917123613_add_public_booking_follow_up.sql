begin;

alter table public.email_messages alter column created_by drop not null;
alter table public.email_messages add column purpose text not null default 'conversation';
alter table public.email_messages add constraint email_messages_purpose_check check (purpose in ('conversation','public_acknowledgement'));

drop policy if exists email_messages_insert_editor on public.email_messages;
create policy email_messages_insert_editor
on public.email_messages for insert
to authenticated
with check (
  private.can_edit_workspace(workspace_id)
  and created_by = (select auth.uid())
  and direction = 'outbound'
  and status = 'queued'
  and purpose = 'conversation'
  and provider is null
  and provider_message_id is null
  and sent_at is null
  and failed_at is null
  and failure_code is null
);

create unique index email_messages_public_acknowledgement_unique_idx
  on public.email_messages(workspace_id, booking_id)
  where purpose = 'public_acknowledgement';

create unique index activities_email_message_unique_idx
  on public.activities((metadata->>'email_message_id'))
  where type = 'email' and metadata ? 'email_message_id';

create table public.public_booking_follow_up_access (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  booking_id uuid not null,
  contact_id uuid not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, booking_id) references public.bookings(workspace_id, id) on delete cascade,
  foreign key (workspace_id, contact_id) references public.contacts(workspace_id, id) on delete restrict,
  check (expires_at > created_at)
);

create index public_booking_follow_up_access_booking_idx
  on public.public_booking_follow_up_access(workspace_id, booking_id, created_at desc);
create index public_booking_follow_up_access_contact_idx
  on public.public_booking_follow_up_access(workspace_id, contact_id, created_at desc);
create unique index public_booking_follow_up_access_active_idx
  on public.public_booking_follow_up_access(workspace_id, booking_id, contact_id)
  where revoked_at is null;

alter table public.public_booking_follow_up_access enable row level security;
create policy public_booking_follow_up_access_no_client_access
on public.public_booking_follow_up_access for all
to anon, authenticated
using (false)
with check (false);
revoke all on public.public_booking_follow_up_access from anon, authenticated;
grant select, insert, update on public.public_booking_follow_up_access to service_role;

create table public.public_booking_follow_up_submissions (
  id uuid primary key default gen_random_uuid(),
  access_id uuid not null references public.public_booking_follow_up_access(id) on delete cascade,
  idempotency_key uuid not null,
  request_fingerprint text not null check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  activity_id uuid not null,
  created_at timestamptz not null default now(),
  unique(access_id, idempotency_key)
);

create index public_booking_follow_up_submissions_activity_idx
  on public.public_booking_follow_up_submissions(activity_id);

alter table public.public_booking_follow_up_submissions enable row level security;
create policy public_booking_follow_up_submissions_no_client_access
on public.public_booking_follow_up_submissions for all
to anon, authenticated
using (false)
with check (false);
revoke all on public.public_booking_follow_up_submissions from anon, authenticated;
grant select, insert on public.public_booking_follow_up_submissions to service_role;

create or replace function private.guard_archived_booking_activity_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.bookings b
    where b.workspace_id = new.workspace_id
      and b.id = new.booking_id
      and b.archived_at is not null
  ) then
    return new;
  end if;

  if new.type = 'system' and new.metadata->>'action' = 'archived' then
    return new;
  end if;

  if current_user = 'service_role'
     and new.direction = 'inbound'
     and (
       (new.type = 'email' and new.metadata->>'ingested_by' = 'brevo_inbound')
       or (new.type = 'note' and new.metadata->>'ingested_by' = 'public_follow_up')
     ) then
    return new;
  end if;

  raise exception 'archived_booking_read_only';
end;
$$;

create or replace function public.get_public_booking_follow_up(target_token_hash text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  resolved_access_id uuid;
  resolved_workspace_id uuid;
  resolved_booking_id uuid;
  resolved_contact_id uuid;
  resolved_contact_name text;
  resolved_artist_name text;
  resolved_artist_slug text;
  resolved_status text;
  resolved_event_name text;
  resolved_venue_name text;
  resolved_city text;
  resolved_country_code text;
  resolved_event_date date;
  resolved_offer_amount bigint;
  resolved_currency text;
  resolved_archived boolean;
  resolved_messages jsonb;
begin
  if current_user <> 'service_role' then raise exception 'service_role_required'; end if;
  if target_token_hash is null or target_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_follow_up_token'; end if;

  select access.id, access.workspace_id, access.booking_id, access.contact_id,
         contact.name, artist.stage_name, artist.slug, booking.status::text,
         booking.event_name, booking.venue_name, booking.city, booking.country_code,
         booking.event_date, booking.offer_amount_minor, booking.currency,
         (booking.archived_at is not null)
    into resolved_access_id, resolved_workspace_id, resolved_booking_id, resolved_contact_id,
         resolved_contact_name, resolved_artist_name, resolved_artist_slug, resolved_status,
         resolved_event_name, resolved_venue_name, resolved_city, resolved_country_code,
         resolved_event_date, resolved_offer_amount, resolved_currency, resolved_archived
  from public.public_booking_follow_up_access access
  join public.bookings booking on booking.workspace_id = access.workspace_id and booking.id = access.booking_id
  join public.contacts contact on contact.workspace_id = access.workspace_id and contact.id = access.contact_id
  join public.artists artist on artist.id = booking.artist_id
  where access.token_hash = target_token_hash and access.revoked_at is null and access.expires_at > now()
  limit 1;

  if resolved_access_id is null then raise exception 'follow_up_link_invalid'; end if;

  update public.public_booking_follow_up_access set last_used_at = now() where id = resolved_access_id;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', activity.id,
      'direction', activity.direction,
      'channel', case
        when activity.metadata->>'capture' = 'public_form' then 'booking_form'
        when activity.type = 'email' then 'email'
        when activity.metadata->>'ingested_by' = 'public_follow_up' then 'secure_link'
        else 'message'
      end,
      'body', activity.body,
      'occurredAt', coalesce(activity.occurred_at, activity.created_at)
    ) order by coalesce(activity.occurred_at, activity.created_at), activity.created_at
  ), '[]'::jsonb)
  into resolved_messages
  from public.activities activity
  where activity.workspace_id = resolved_workspace_id
    and activity.booking_id = resolved_booking_id
    and nullif(trim(coalesce(activity.body, '')), '') is not null
    and (
      (activity.direction = 'inbound' and activity.metadata->>'capture' = 'public_form')
      or (activity.type = 'email' and activity.contact_id = resolved_contact_id)
      or (activity.direction = 'inbound' and activity.metadata->>'ingested_by' = 'public_follow_up')
    );

  return jsonb_build_object(
    'artist', jsonb_build_object('stageName', resolved_artist_name, 'slug', resolved_artist_slug),
    'contact', jsonb_build_object('name', resolved_contact_name),
    'booking', jsonb_strip_nulls(jsonb_build_object(
      'status', resolved_status,
      'eventName', resolved_event_name,
      'venueName', resolved_venue_name,
      'city', resolved_city,
      'countryCode', resolved_country_code,
      'eventDate', resolved_event_date,
      'offerAmountMinor', resolved_offer_amount,
      'currency', resolved_currency,
      'archived', resolved_archived
    )),
    'messages', resolved_messages
  );
end;
$$;

revoke all on function public.get_public_booking_follow_up(text) from public, anon, authenticated;
grant execute on function public.get_public_booking_follow_up(text) to service_role;

create or replace function public.append_public_booking_follow_up_reply(
  target_token_hash text,
  target_idempotency_key uuid,
  target_request_fingerprint text,
  target_body_text text
)
returns table(activity_id uuid, created boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  resolved_access_id uuid;
  resolved_workspace_id uuid;
  resolved_booking_id uuid;
  resolved_contact_id uuid;
  existing_activity_id uuid;
  existing_fingerprint text;
  new_activity_id uuid;
  normalized_body text := nullif(trim(coalesce(target_body_text, '')), '');
begin
  if current_user <> 'service_role' then raise exception 'service_role_required'; end if;
  if target_token_hash is null or target_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid_follow_up_token'; end if;
  if target_idempotency_key is null then raise exception 'idempotency_key_required'; end if;
  if target_request_fingerprint is null or target_request_fingerprint !~ '^[0-9a-f]{64}$' then raise exception 'invalid_request_fingerprint'; end if;
  if normalized_body is null or char_length(normalized_body) > 10000 then raise exception 'invalid_follow_up_message'; end if;

  select access.id, access.workspace_id, access.booking_id, access.contact_id
    into resolved_access_id, resolved_workspace_id, resolved_booking_id, resolved_contact_id
  from public.public_booking_follow_up_access access
  where access.token_hash = target_token_hash and access.revoked_at is null and access.expires_at > now()
  limit 1;
  if resolved_access_id is null then raise exception 'follow_up_link_invalid'; end if;

  perform pg_advisory_xact_lock(hashtextextended(resolved_access_id::text || ':' || target_idempotency_key::text, 0));

  select submission.activity_id, submission.request_fingerprint
    into existing_activity_id, existing_fingerprint
  from public.public_booking_follow_up_submissions submission
  where submission.access_id = resolved_access_id and submission.idempotency_key = target_idempotency_key;

  if existing_activity_id is not null then
    if existing_fingerprint <> target_request_fingerprint then raise exception 'idempotency_key_reused'; end if;
    return query select existing_activity_id, false;
    return;
  end if;

  insert into public.activities (
    workspace_id, booking_id, type, direction, contact_id, actor_user_id,
    body, metadata, visibility, occurred_at, created_by
  ) values (
    resolved_workspace_id, resolved_booking_id, 'note', 'inbound', resolved_contact_id, null,
    normalized_body,
    jsonb_build_object('ingested_by','public_follow_up','public_reply_id',target_idempotency_key,'access_id',resolved_access_id),
    'workspace', now(), null
  ) returning id into new_activity_id;

  insert into public.public_booking_follow_up_submissions(access_id,idempotency_key,request_fingerprint,activity_id)
  values(resolved_access_id,target_idempotency_key,target_request_fingerprint,new_activity_id);

  update public.public_booking_follow_up_access set last_used_at = now() where id = resolved_access_id;
  return query select new_activity_id, true;
end;
$$;

revoke all on function public.append_public_booking_follow_up_reply(text, uuid, text, text) from public, anon, authenticated;
grant execute on function public.append_public_booking_follow_up_reply(text, uuid, text, text) to service_role;

commit;
