begin;

alter table public.artists
  add column public_profile_enabled boolean not null default false;

comment on column public.artists.public_profile_enabled is
  'Whether the artist professional profile is intentionally published on Cuebooker public surfaces.';

grant update (public_profile_enabled) on public.artists to authenticated;

create table public.artist_booking_routes (
  artist_id uuid primary key references public.artists(id) on delete cascade,
  workspace_id uuid not null,
  accepting_requests boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, artist_id)
    references public.workspace_artists(workspace_id, artist_id) on delete cascade
);

create index artist_booking_routes_workspace_idx
  on public.artist_booking_routes(workspace_id, artist_id);

create trigger artist_booking_routes_preserve_identity
before update on public.artist_booking_routes
for each row execute function private.preserve_workspace_record_identity();

create trigger artist_booking_routes_set_updated_at
before update on public.artist_booking_routes
for each row execute function public.set_updated_at();

alter table public.artist_booking_routes enable row level security;

create policy artist_booking_routes_select_member
on public.artist_booking_routes for select
to authenticated
using (private.is_workspace_member(workspace_id));

create policy artist_booking_routes_insert_manager
on public.artist_booking_routes for insert
to authenticated
with check (
  private.can_manage_workspace(workspace_id)
  and private.can_manage_artist(artist_id)
  and created_by = (select auth.uid())
);

create policy artist_booking_routes_update_manager
on public.artist_booking_routes for update
to authenticated
using (
  private.can_manage_workspace(workspace_id)
  and private.can_manage_artist(artist_id)
)
with check (
  private.can_manage_workspace(workspace_id)
  and private.can_manage_artist(artist_id)
);

create policy artist_booking_routes_delete_manager
on public.artist_booking_routes for delete
to authenticated
using (
  private.can_manage_workspace(workspace_id)
  and private.can_manage_artist(artist_id)
);

revoke all on public.artist_booking_routes from anon;
grant select, insert, update, delete on public.artist_booking_routes to authenticated;

insert into public.artist_booking_routes (artist_id, workspace_id, created_by)
select wa.artist_id, wa.workspace_id, a.created_by
from public.workspace_artists wa
join public.artists a on a.id = wa.artist_id
where not exists (
  select 1
  from public.workspace_artists other
  where other.artist_id = wa.artist_id
    and other.workspace_id <> wa.workspace_id
)
on conflict (artist_id) do nothing;

alter table public.contacts alter column created_by drop not null;
alter table public.counterparties alter column created_by drop not null;
alter table public.contact_counterparties alter column created_by drop not null;
alter table public.bookings alter column created_by drop not null;
alter table public.booking_contacts alter column created_by drop not null;
alter table public.activities alter column created_by drop not null;

comment on column public.contacts.created_by is 'Authenticated creator when created interactively; null for explicitly privileged system/anonymous ingress.';
comment on column public.counterparties.created_by is 'Authenticated creator when created interactively; null for explicitly privileged system/anonymous ingress.';
comment on column public.bookings.created_by is 'Authenticated creator when created interactively; null for explicitly privileged system/anonymous ingress. Booking provenance is carried by origin_channel/capture_method.';
comment on column public.activities.created_by is 'Authenticated internal creator when applicable; null for privileged external/system events. actor_user_id remains null when no authenticated workspace actor exists.';

alter table public.bookings
  add column entry_source text
  check (
    entry_source is null
    or (
      char_length(entry_source) between 1 and 64
      and entry_source = lower(entry_source)
      and entry_source ~ '^[a-z0-9][a-z0-9_-]*$'
    )
  );

comment on column public.bookings.entry_source is
  'Optional public-entry attribution hint (for example instagram, website, qr). Not the booking origin channel.';

create index bookings_workspace_entry_source_idx
  on public.bookings(workspace_id, entry_source, created_at desc)
  where entry_source is not null;

create table public.public_booking_submissions (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null,
  workspace_id uuid not null,
  idempotency_key uuid not null,
  request_fingerprint text not null
    check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  booking_id uuid not null,
  entry_source text,
  created_at timestamptz not null default now(),
  unique (artist_id, idempotency_key),
  foreign key (workspace_id, artist_id)
    references public.workspace_artists(workspace_id, artist_id) on delete cascade,
  foreign key (workspace_id, booking_id)
    references public.bookings(workspace_id, id) on delete cascade,
  check (
    entry_source is null
    or (
      char_length(entry_source) between 1 and 64
      and entry_source = lower(entry_source)
      and entry_source ~ '^[a-z0-9][a-z0-9_-]*$'
    )
  )
);

create index public_booking_submissions_booking_idx
  on public.public_booking_submissions(workspace_id, booking_id);

alter table public.public_booking_submissions enable row level security;
revoke all on public.public_booking_submissions from anon, authenticated;

create or replace function public.create_public_booking(
  target_artist_slug text,
  target_idempotency_key uuid,
  target_request_fingerprint text,
  contact_name text,
  contact_email text,
  contact_phone text default null,
  organization_name text default null,
  event_name text default null,
  venue_name text default null,
  event_city text default null,
  event_country_code text default null,
  event_date date default null,
  offer_amount_minor bigint default null,
  offer_currency text default null,
  initial_message text default null,
  entry_source text default null
)
returns table(booking_id uuid, created boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  resolved_artist_id uuid;
  resolved_workspace_id uuid;
  resolved_contact_id uuid;
  resolved_counterparty_id uuid;
  existing_booking_id uuid;
  existing_fingerprint text;
  new_booking_id uuid;
  normalized_slug text := lower(trim(coalesce(target_artist_slug, '')));
  normalized_contact_name text := nullif(trim(coalesce(contact_name, '')), '');
  normalized_contact_email text := lower(trim(coalesce(contact_email, '')));
  normalized_contact_phone text := nullif(trim(coalesce(contact_phone, '')), '');
  normalized_organization_name text := nullif(trim(coalesce(organization_name, '')), '');
  normalized_event_name text := nullif(trim(coalesce(event_name, '')), '');
  normalized_venue_name text := nullif(trim(coalesce(venue_name, '')), '');
  normalized_city text := nullif(trim(coalesce(event_city, '')), '');
  normalized_country text := nullif(upper(trim(coalesce(event_country_code, ''))), '');
  normalized_currency text := nullif(upper(trim(coalesce(offer_currency, ''))), '');
  normalized_message text := nullif(trim(coalesce(initial_message, '')), '');
  normalized_entry_source text := nullif(lower(trim(coalesce(entry_source, ''))), '');
begin
  if normalized_slug = '' or char_length(normalized_slug) > 120 then
    raise exception 'invalid_artist_slug';
  end if;

  if target_idempotency_key is null then
    raise exception 'idempotency_key_required';
  end if;

  if target_request_fingerprint is null or target_request_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_request_fingerprint';
  end if;

  if normalized_contact_name is null or char_length(normalized_contact_name) > 160 then
    raise exception 'invalid_contact_name';
  end if;

  if normalized_contact_email = ''
     or char_length(normalized_contact_email) > 320
     or normalized_contact_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'invalid_contact_email';
  end if;

  if normalized_contact_phone is not null and char_length(normalized_contact_phone) > 50 then
    raise exception 'invalid_contact_phone';
  end if;

  if normalized_organization_name is not null and char_length(normalized_organization_name) > 180 then
    raise exception 'invalid_organization_name';
  end if;

  if normalized_event_name is not null and char_length(normalized_event_name) > 180 then
    raise exception 'invalid_event_name';
  end if;

  if normalized_venue_name is not null and char_length(normalized_venue_name) > 180 then
    raise exception 'invalid_venue_name';
  end if;

  if normalized_city is not null and char_length(normalized_city) > 120 then
    raise exception 'invalid_event_city';
  end if;

  if normalized_country is not null and normalized_country !~ '^[A-Z]{2}$' then
    raise exception 'invalid_country_code';
  end if;

  if normalized_currency is not null and normalized_currency !~ '^[A-Z]{3}$' then
    raise exception 'invalid_currency';
  end if;

  if offer_amount_minor is not null and offer_amount_minor < 0 then
    raise exception 'invalid_offer_amount';
  end if;

  if normalized_message is not null and char_length(normalized_message) > 10000 then
    raise exception 'message_too_long';
  end if;

  if normalized_entry_source is not null and (
    char_length(normalized_entry_source) > 64
    or normalized_entry_source !~ '^[a-z0-9][a-z0-9_-]*$'
  ) then
    raise exception 'invalid_entry_source';
  end if;

  if normalized_event_name is null
     and normalized_venue_name is null
     and event_date is null
     and normalized_message is null then
    raise exception 'booking_context_required';
  end if;

  select a.id, route.workspace_id
    into resolved_artist_id, resolved_workspace_id
  from public.artists a
  join public.artist_booking_routes route on route.artist_id = a.id
  where a.slug = normalized_slug
    and a.public_profile_enabled = true
    and route.accepting_requests = true
  limit 1;

  if resolved_artist_id is null or resolved_workspace_id is null then
    raise exception 'public_booking_unavailable';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(resolved_artist_id::text || ':' || target_idempotency_key::text, 0)
  );

  select submission.booking_id, submission.request_fingerprint
    into existing_booking_id, existing_fingerprint
  from public.public_booking_submissions submission
  where submission.artist_id = resolved_artist_id
    and submission.idempotency_key = target_idempotency_key;

  if existing_booking_id is not null then
    if existing_fingerprint <> target_request_fingerprint then
      raise exception 'idempotency_key_reused';
    end if;

    return query select existing_booking_id, false;
    return;
  end if;

  select contact.id
    into resolved_contact_id
  from public.contacts contact
  where contact.workspace_id = resolved_workspace_id
    and contact.email is not null
    and lower(contact.email) = normalized_contact_email
  order by contact.created_at asc
  limit 1;

  if resolved_contact_id is null then
    insert into public.contacts (
      workspace_id, name, email, phone, created_by
    ) values (
      resolved_workspace_id,
      normalized_contact_name,
      normalized_contact_email,
      normalized_contact_phone,
      null
    ) returning id into resolved_contact_id;
  end if;

  if normalized_organization_name is not null then
    select counterparty.id
      into resolved_counterparty_id
    from public.counterparties counterparty
    where counterparty.workspace_id = resolved_workspace_id
      and counterparty.kind = 'promoter'
      and lower(counterparty.name) = lower(normalized_organization_name)
    order by counterparty.created_at asc
    limit 1;

    if resolved_counterparty_id is null then
      insert into public.counterparties (
        workspace_id, kind, name, city, country_code, created_by
      ) values (
        resolved_workspace_id,
        'promoter',
        normalized_organization_name,
        normalized_city,
        normalized_country,
        null
      ) returning id into resolved_counterparty_id;
    end if;
  end if;

  insert into public.bookings (
    workspace_id,
    artist_id,
    primary_contact_id,
    counterparty_id,
    source,
    origin_channel,
    capture_method,
    entry_source,
    status,
    event_name,
    venue_name,
    city,
    country_code,
    event_date,
    offer_amount_minor,
    currency,
    created_by
  ) values (
    resolved_workspace_id,
    resolved_artist_id,
    resolved_contact_id,
    resolved_counterparty_id,
    'booking_form',
    'booking_form',
    'public_form',
    normalized_entry_source,
    'new',
    normalized_event_name,
    normalized_venue_name,
    normalized_city,
    normalized_country,
    event_date,
    offer_amount_minor,
    normalized_currency,
    null
  ) returning id into new_booking_id;

  insert into public.activities (
    workspace_id,
    booking_id,
    type,
    direction,
    contact_id,
    actor_user_id,
    body,
    metadata,
    visibility,
    created_by
  ) values (
    resolved_workspace_id,
    new_booking_id,
    'note',
    'inbound',
    resolved_contact_id,
    null,
    normalized_message,
    jsonb_strip_nulls(jsonb_build_object(
      'capture', 'public_form',
      'origin_channel', 'booking_form',
      'entry_source', normalized_entry_source,
      'submitted_contact_name', normalized_contact_name
    )),
    'workspace',
    null
  );

  insert into public.booking_contacts (
    workspace_id, booking_id, contact_id, role_label, created_by
  ) values (
    resolved_workspace_id,
    new_booking_id,
    resolved_contact_id,
    'primary',
    null
  );

  if resolved_counterparty_id is not null then
    insert into public.contact_counterparties (
      workspace_id, contact_id, counterparty_id, relationship_label, created_by
    ) values (
      resolved_workspace_id,
      resolved_contact_id,
      resolved_counterparty_id,
      'promoter',
      null
    ) on conflict (contact_id, counterparty_id) do nothing;
  end if;

  insert into public.public_booking_submissions (
    artist_id,
    workspace_id,
    idempotency_key,
    request_fingerprint,
    booking_id,
    entry_source
  ) values (
    resolved_artist_id,
    resolved_workspace_id,
    target_idempotency_key,
    target_request_fingerprint,
    new_booking_id,
    normalized_entry_source
  );

  return query select new_booking_id, true;
end;
$$;

revoke all on function public.create_public_booking(
  text, uuid, text, text, text, text, text, text, text, text, text,
  date, bigint, text, text, text
) from public, anon, authenticated;

grant execute on function public.create_public_booking(
  text, uuid, text, text, text, text, text, text, text, text, text,
  date, bigint, text, text, text
) to service_role;

grant select on public.artists, public.workspace_artists, public.artist_booking_routes to service_role;
grant select, insert on public.contacts, public.counterparties, public.contact_counterparties,
  public.bookings, public.booking_contacts, public.activities, public.public_booking_submissions to service_role;

comment on function public.create_public_booking(
  text, uuid, text, text, text, text, text, text, text, text, text,
  date, bigint, text, text, text
) is 'Atomic service-role-only public booking intake. Resolves artist booking route server-side, enforces idempotency, creates/reuses relationship records, writes Booking provenance and initial inbound Activity without impersonating a workspace user.';

commit;
