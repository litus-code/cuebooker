begin;

create or replace function public.ingest_booking_email_message(
  target_workspace_id uuid,
  target_booking_id uuid,
  target_contact_id uuid,
  target_to_email text,
  target_from_email text,
  target_subject text,
  target_body_text text,
  target_provider text,
  target_provider_message_id text,
  target_received_at timestamptz,
  target_occurred_at timestamptz,
  target_created_by uuid,
  target_metadata jsonb default '{}'::jsonb
)
returns table (
  email_message_id uuid,
  email_created boolean,
  activity_created boolean
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  resolved_email_id uuid;
  did_create_email boolean := false;
  did_create_activity boolean := false;
  resolved_metadata jsonb;
begin
  if current_user <> 'service_role' then raise exception 'service_role_required'; end if;

  if target_workspace_id is null
     or target_booking_id is null
     or target_contact_id is null
     or nullif(trim(target_from_email), '') is null
     or nullif(trim(target_to_email), '') is null
     or nullif(trim(target_subject), '') is null
     or nullif(trim(target_body_text), '') is null
     or nullif(trim(target_provider), '') is null
     or nullif(trim(target_provider_message_id), '') is null
     or target_received_at is null
     or target_occurred_at is null then
    raise exception 'invalid_inbound_email_payload';
  end if;

  if char_length(trim(target_subject)) > 300
     or char_length(trim(target_body_text)) > 20000
     or char_length(trim(target_from_email)) > 320
     or char_length(trim(target_to_email)) > 320 then
    raise exception 'inbound_email_payload_too_large';
  end if;

  if jsonb_typeof(coalesce(target_metadata, '{}'::jsonb)) <> 'object' then
    raise exception 'invalid_inbound_email_metadata';
  end if;

  if not exists (
    select 1 from public.bookings b
    where b.workspace_id = target_workspace_id and b.id = target_booking_id
  ) then raise exception 'booking_not_found'; end if;

  if not exists (
    select 1 from public.bookings b
    where b.workspace_id = target_workspace_id
      and b.id = target_booking_id
      and b.primary_contact_id = target_contact_id
    union all
    select 1 from public.booking_contacts bc
    where bc.workspace_id = target_workspace_id
      and bc.booking_id = target_booking_id
      and bc.contact_id = target_contact_id
  ) then raise exception 'contact_not_linked_to_booking'; end if;

  insert into public.email_messages (
    workspace_id, booking_id, contact_id, direction, to_email, from_email,
    subject, body_text, status, provider, provider_message_id, received_at, created_by
  ) values (
    target_workspace_id, target_booking_id, target_contact_id, 'inbound', trim(target_to_email),
    lower(trim(target_from_email)), trim(target_subject), trim(target_body_text), 'received',
    lower(trim(target_provider)), trim(target_provider_message_id), target_received_at, target_created_by
  )
  on conflict (provider, provider_message_id)
    where provider is not null and provider_message_id is not null
  do nothing
  returning id into resolved_email_id;

  if resolved_email_id is null then
    select em.id into resolved_email_id
    from public.email_messages em
    where em.provider = lower(trim(target_provider))
      and em.provider_message_id = trim(target_provider_message_id)
    limit 1;
  else
    did_create_email := true;
  end if;

  if resolved_email_id is null then raise exception 'inbound_email_resolution_failed'; end if;

  resolved_metadata := coalesce(target_metadata, '{}'::jsonb)
    || jsonb_build_object(
      'email_message_id', resolved_email_id,
      'from_email', lower(trim(target_from_email)),
      'provider', lower(trim(target_provider)),
      'provider_message_id', trim(target_provider_message_id),
      'ingested_by', 'brevo_inbound'
    );

  if not exists (
    select 1 from public.activities a
    where a.workspace_id = target_workspace_id
      and a.booking_id = target_booking_id
      and a.type = 'email'
      and a.direction = 'inbound'
      and a.metadata->>'email_message_id' = resolved_email_id::text
  ) then
    insert into public.activities (
      workspace_id, booking_id, type, direction, contact_id, actor_user_id,
      body, metadata, visibility, occurred_at, created_by
    ) values (
      target_workspace_id, target_booking_id, 'email', 'inbound', target_contact_id, null,
      trim(target_body_text), resolved_metadata, 'workspace', target_occurred_at, target_created_by
    ) on conflict do nothing;
    did_create_activity := true;
  end if;

  return query select resolved_email_id, did_create_email, did_create_activity;
end;
$$;

revoke all on function public.ingest_booking_email_message(
  uuid, uuid, uuid, text, text, text, text, text, text,
  timestamptz, timestamptz, uuid, jsonb
) from public, anon, authenticated;

grant execute on function public.ingest_booking_email_message(
  uuid, uuid, uuid, text, text, text, text, text, text,
  timestamptz, timestamptz, uuid, jsonb
) to service_role;

commit;
