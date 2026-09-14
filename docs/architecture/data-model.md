# Data Model

Status: conceptual model, schema not yet implemented

## Core modelling rules

- PostgreSQL is the target relational store.
- Primary keys use UUIDs.
- Public slugs are unique identifiers for URLs, never primary keys.
- `created_at` and `updated_at` are stored in UTC.
- Business timestamps use `timestamptz`; event-local timezone is stored explicitly when relevant.
- Money is never stored as floating point. Use integer minor units plus ISO currency, or an exact numeric type with a documented invariant.
- Destructive deletion is exceptional. Business records normally use lifecycle/archive fields. GDPR erasure is a separate controlled workflow.
- Foreign keys, uniqueness constraints and check constraints enforce invariants where possible.
- State transitions are explicit and auditable.

## Identity

`auth.users` is owned by Supabase Auth. Application tables reference its UUID; application code must not duplicate password/credential data.

```text
profiles
  id uuid PK
  user_id uuid UNIQUE -> auth.users
  display_name
  avatar_path nullable
  locale
  timezone
  created_at
  updated_at
```

## Organizations and membership

```text
organizations
  id uuid PK
  type agency | promoter | venue
  name
  slug UNIQUE
  status
  created_at
  updated_at

organization_members
  organization_id -> organizations
  user_id -> auth.users
  role owner | admin | member
  status invited | active | suspended
  created_at
  UNIQUE (organization_id, user_id)
```

Organization membership is the basis for organization-scoped authorization.

## Artists

An artist is not a user account.

```text
artists
  id uuid PK
  name
  slug UNIQUE
  city nullable
  country_code nullable
  timezone nullable
  status draft | active | archived
  created_at
  updated_at
  deleted_at nullable

artist_members
  artist_id -> artists
  user_id -> auth.users
  role owner | manager | editor
  created_at
  UNIQUE (artist_id, user_id)

artist_organization_links
  artist_id -> artists
  organization_id -> organizations
  relationship management | booking
  status pending | active | ended
  starts_at nullable
  ends_at nullable
```

Supporting tables such as `artist_genres`, `artist_links` and `artist_media` should be normalized where querying/integrity matters. Avoid large unvalidated JSON blobs for core business data.

## Discovery

Discovery is opt-in and intentionally separated from the private artist record.

```text
artist_discovery_settings
  artist_id PK -> artists
  enabled boolean
  show_availability boolean
  show_city boolean
  show_booking_contact boolean
  published_at nullable
  updated_at
```

Only fields explicitly allowed for public exposure are returned by public endpoints/views.

## Availability

```text
availability_periods
  id uuid PK
  artist_id -> artists
  starts_at
  ends_at
  status available | unavailable | tentative
  source manual | booking | integration
  source_id nullable
  created_by -> auth.users
  created_at
  updated_at
```

Overlaps and booking conflicts require a documented policy before enforcement. Do not silently overwrite periods.

## Booking

The initial production model should separate the booking aggregate from conversation/history.

```text
booking_requests
  id uuid PK
  artist_id -> artists
  promoter_organization_id nullable -> organizations
  requester_user_id nullable -> auth.users
  requester_name
  requester_email
  event_name
  venue_name
  city
  event_timezone
  starts_at
  ends_at nullable
  offer_amount_minor nullable
  offer_currency nullable
  status
  source booking_link | discovery | manual
  created_at
  updated_at
  archived_at nullable

booking_messages
  id uuid PK
  booking_request_id -> booking_requests
  sender_user_id nullable -> auth.users
  sender_type artist | promoter | system
  body
  created_at

booking_status_history
  id uuid PK
  booking_request_id -> booking_requests
  from_status nullable
  to_status
  actor_user_id nullable -> auth.users
  reason nullable
  created_at
```

### Initial state machine

```text
new -> in_review
in_review -> waiting_promoter | confirmed | rejected
waiting_promoter -> in_review | confirmed | rejected
confirmed -> cancelled (future explicit cancellation flow)
rejected -> terminal unless a deliberate reopen use case is defined
```

The current prototype status names may evolve before the first migration. Once persisted in production, changes require data migrations and compatibility consideration.

## Acquisition

Referral attribution must survive beyond the browser session and attach to the created account.

```text
acquisition_sources
  id uuid PK
  code UNIQUE
  name
  type academy | collective | label | agency | campaign | direct
  active
  created_at

acquisition_touches
  id uuid PK
  anonymous_id nullable
  user_id nullable -> auth.users
  source_id -> acquisition_sources
  landing_path
  occurred_at
  metadata jsonb nullable
```

Do not store arbitrary sensitive URL/query data in metadata.

## Audit

```text
audit_logs
  id uuid PK
  actor_user_id nullable
  action
  entity_type
  entity_id uuid nullable
  request_id nullable
  metadata jsonb nullable
  created_at
```

Audit records are append-only to normal application roles. Sensitive values, tokens and message bodies should not be copied into audit metadata by default.

## Indexing baseline

Add indexes based on query paths, not speculation. Expected early candidates include foreign keys, `artists.slug`, booking `(artist_id, status, updated_at)`, availability `(artist_id, starts_at, ends_at)`, membership `(user_id, organization_id)` and acquisition source code.

## Migration policy

All production schema changes are forward migrations committed to Git. Migrations must be tested against an empty database and a representative existing schema. Destructive changes use expand/migrate/contract rather than one-step breaking changes.