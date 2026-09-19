# Cuebooker Reference Architecture

Updated: 16 September 2026
Status: ACTIVE ARCHITECTURE BASELINE
Scope: product architecture, data, security, performance, AI, integrations and scale

This document defines the technical direction for Cuebooker while the product focuses on the operational loop:

```text
CUE -> Booking -> Activity -> Next Move -> Calendar
```

It is a baseline, not a prison. Decisions below should remain stable until measurable product or operational evidence justifies changing them.

The goal is to build a system that can begin small, remain understandable, and scale into a serious multi-artist / multi-agency platform without forcing an early rewrite.

---

## 1. Architectural principles

1. **Simple core, explicit boundaries.** Avoid premature microservices, but keep domain, application, persistence and integrations separated so services can later be extracted.
2. **Postgres is the source of truth.** Browser storage is demo/cache/offline support only, never the canonical production record.
3. **Multi-tenant from the beginning.** Every private operational record belongs to a workspace. Artists, agencies and collaborators are represented through workspace membership and scoped relationships.
4. **RLS is part of the data model.** Security is not added later at the UI layer.
5. **Activities are append-oriented.** The operational history should be reconstructable and auditable.
6. **Calendar is a projection, not the owner of booking truth.** Holds and confirmed bookings create/update calendar projections.
7. **CUE is an input surface, not a domain entity.** Text, voice, email, WhatsApp share or other sources normalize into the same domain commands.
8. **External systems enter through adapters.** Email, messaging, calendars and AI providers must not leak vendor-specific logic into the domain.
9. **Async by default for slow/unreliable external work.** Webhooks, email sync, AI enrichment and media processing must not block critical user actions.
10. **Privacy by default.** Commercial conditions, contacts, notes, negotiations and private history are never public unless explicitly designed otherwise.
11. **Measure before replacing technology.** A technology change needs a concrete constraint, not fashion.

---

## 2. Current stack assessment

Current project stack:

- Nuxt 4
- Vue 3
- TypeScript / ESM
- Node >= 22 for tooling/build
- Supabase/Postgres already present
- Supabase Auth and Storage usage already present in the product
- Cloudflare-based staging/hosting workflow
- current Nuxt production preset defaults to static generation

### Decision

**Keep Nuxt 4 + Vue 3 + TypeScript.**

There is no current product or scale reason to migrate to React, Next, another SPA framework, or a separate backend language.

### Why

- the product already has substantial Nuxt/Vue implementation;
- Nuxt supports public SSR/static pages and private application surfaces;
- TypeScript can be shared across UI, domain schemas and server/edge handlers;
- changing frontend framework now would create migration cost without improving the booking core;
- performance problems should be solved through architecture, payload discipline and rendering strategy rather than framework churn.

---

## 3. Target platform topology

Recommended near-term topology:

```text
                    PUBLIC WEB / WORKSPACE
                      Nuxt 4 + Vue 3
                             |
              --------------------------------
              |                              |
      Browser Supabase client        Server/Edge operations
              |                              |
              |                    Supabase Edge Functions
              |                    and/or Cloudflare Workers
              |                              |
              ----------- SUPABASE -----------
                             |
          Auth + Postgres + Storage + Realtime
                             |
                   asynchronous jobs/events
                             |
              external integration adapters
                 email / AI / calendars / etc.
```

### Hosting decision

Keep Cloudflare for web delivery/CDN while it remains operationally convenient.

The current static Nuxt preset is acceptable for public/static application delivery, but **privileged business operations, inbound webhooks and secrets must not live in static client code**.

Near-term server responsibilities should live in Supabase Edge Functions and/or narrowly scoped Cloudflare Workers.

Do not introduce a permanent Node server only to have a backend. Add one when workloads genuinely need long-running processes, specialised networking, persistent workers or runtime capabilities that edge functions cannot provide efficiently.

---

## 4. Domain architecture

The primary domain model should evolve toward:

```text
Workspace
├── Members
├── Artists
├── Contacts
├── Organizations
├── Bookings
│   ├── booking contacts
│   ├── commercial terms
│   └── event/date information
├── Activities
├── Next Moves
├── Holds
├── Calendar Blocks
└── Attachments
```

### Workspace

`workspace` is the tenant boundary.

A solo DJ can have one workspace and one artist.
An agency can have one workspace and many artists/members.

Do not encode agency vs independent-user assumptions inside Booking.

Every private operational table should normally include:

```text
id
workspace_id
created_at
updated_at
created_by (where meaningful)
```

### Booking

Booking is the central commercial opportunity/engagement.

It may exist with incomplete information. A phone call that only establishes a contact and approximate month is still a valid booking opportunity.

Booking should not contain an embedded message history.

Representative fields:

```text
id
workspace_id
artist_id
organization_id?
primary_contact_id?
source
event_name?
venue_name?
city?
country_code?
event_date?
start_time?
end_time?
status
offer_amount?
currency?
fee_basis?
archived_at?
created_at
updated_at
```

### Booking source

Canonical source values should support at least:

```text
booking_form
phone
whatsapp
email
instagram
in_person
manager
manual
other
```

Source should describe origin/capture, not current communication channel.

### Contact

A promoter/person is a reusable entity, not duplicated text inside every booking.

Contacts can be linked to zero or more organizations and many bookings.

### Organization

Represents venue, promoter company, agency, festival/brand or other professional entity.

Do not force a contact to have exactly one organization.

### Relationship Memory

Do not initially persist a separate score or relationship object.

Relationship facts should be derived from bookings + activities + contact/organization links:

- bookings together;
- confirmed bookings;
- last contact;
- last fee where authorised;
- venues/cities involved;
- repeat collaboration.

If these queries become expensive, introduce materialized projections later.

---

## 5. Activity model

Activity is the unified operational history.

Instead of `booking.messages[]`, use append-oriented activity rows.

Representative shape:

```text
activity
- id
- workspace_id
- booking_id
- type
- channel?
- direction?
- contact_id?
- actor_user_id?
- body?
- metadata jsonb
- visibility
- occurred_at
- created_at
- created_by
```

Initial activity types:

```text
phone
email
whatsapp
instagram
note
status_change
hold_created
hold_released
hold_converted
next_move_created
next_move_completed
system
```

### Append-oriented does not mean immutable forever

Operational corrections may be allowed for human-entered notes, but destructive edits should be traceable when the product reaches production maturity.

Email/provider records and system events should generally preserve original provider identifiers and timestamps.

### JSONB rule

Use typed relational columns for fields used frequently for permissions, joins, filtering, ordering or integrity.

Use `metadata jsonb` only for event-specific/provider-specific payload fragments.

Do not turn Postgres into an untyped document database.

---

## 6. Next Move

Activity answers: **what happened?**
Next Move answers: **what should happen next?**

Model it independently.

Initial rule: one active Next Move per booking in the UI, while the schema may allow historical/completed rows.

Representative fields:

```text
id
workspace_id
booking_id
label
type?
due_at?
assignee_user_id?
completed_at?
created_at
created_by
```

Completing a Next Move should generate an Activity event.

Do not make Next Move an arbitrary task-management product. It exists to keep booking movement obvious.

---

## 7. Holds

Hold is not merely a booking status.

A booking can be in negotiation and simultaneously hold a date.

Representative model:

```text
hold
- id
- workspace_id
- booking_id
- starts_at
- ends_at?
- expires_at?
- priority?
- status: active | released | converted
- created_at
- created_by
```

This leaves room for first/second holds, expiry and conversion without corrupting Booking status semantics.

---

## 8. Calendar architecture

Calendar is a time projection.

It may contain:

- confirmed booking;
- booking hold;
- private availability;
- travel;
- studio;
- unavailable time;
- other private block.

A calendar block can link back to its source:

```text
source_type
source_id
```

Examples:

```text
source_type = booking
source_id = booking UUID
```

```text
source_type = hold
source_id = hold UUID
```

The booking/hold remains source truth. Calendar provides an efficient operational view.

Avoid uncontrolled duplication: updates should be transactional or performed through one application command so booking/hold and projection cannot silently diverge.

---

## 9. CUE capture architecture

CUE is a universal capture interface.

Potential input sources:

- typed text;
- voice/transcription;
- pasted message;
- share extension;
- booking form;
- forwarded email;
- integration webhook;
- API.

All inputs pass through the same conceptual pipeline:

```text
Capture
  ↓
Normalize
  ↓
Extract / interpret
  ↓
Resolve Contact / Organization
  ↓
Preview proposed changes
  ↓
User confirms when required
  ↓
Domain commands
  ↓
Booking + Activity + Next Move + Hold
```

### Critical rule

AI must propose structured data. **The model is not the database transaction.**

The model output must be validated against a strict schema and then passed to normal application/domain commands.

For consequential changes such as date, fee, recipient or destructive action, require deterministic validation and appropriate user confirmation.

---

## 10. AI strategy and language decision

### Current decision

**Do not introduce Python solely because Cuebooker uses AI.**

Initial AI orchestration should be implemented server-side in TypeScript.

Use cases:

- parse a CUE text entry;
- classify channel/source;
- extract contact, venue, date, offer, currency and next action;
- summarize a booking thread;
- draft an email;
- identify missing booking information.

### Why TypeScript initially

- shared type/schema definitions with product domain;
- fewer deploy/runtime surfaces;
- easier observability and security management;
- provider SDKs and structured-output APIs are available in JS/TS;
- most initial AI work is orchestration, not machine-learning research.

### When Python becomes justified

Introduce a separate Python service/worker only if we have measurable requirements such as:

- custom ML/training/evaluation pipelines;
- heavy audio/DSP processing;
- large-scale embedding/data-science pipelines;
- libraries that are materially better/only available in Python;
- batch processing where Python ecosystem productivity is clearly superior.

If introduced, Python should be a bounded service behind a queue/API contract, not a second implementation of the product domain.

### Model-provider strategy

Keep provider calls behind an `AIProvider`/application adapter.

Do not bind domain entities to one model vendor.

Store:

- model/provider identifier where needed for audit/evaluation;
- prompt/template version;
- structured result;
- latency/cost metadata where useful;

Do not persist raw sensitive context unnecessarily.

### AI privacy

Before sending content to an external AI provider:

- minimise fields;
- exclude secrets/auth tokens;
- avoid unrelated private history;
- clearly separate private notes from data that may be used for a drafted outbound message;
- document provider retention/training settings before production use.

---

## 11. Application/service boundaries

Target code shape:

```text
app/domain/
  booking/
  activity/
  contact/
  organization/
  nextMove/
  hold/
  calendar/

app/services/
  bookingService.ts
  cueCaptureService.ts
  activityService.ts
  nextMoveService.ts
  holdService.ts

app/repositories/
  bookingRepository.ts
  activityRepository.ts
  contactRepository.ts
  ...

app/integrations/
  ai/
  email/
  calendar/
  messaging/
```

Vue composables coordinate UI state and application calls. They should not become the permanent home for domain rules.

Repositories define persistence contracts so IndexedDB demo repositories and Supabase production repositories can coexist temporarily.

---

## 12. Database strategy

### Decision

PostgreSQL through Supabase remains the production database.

Reasons:

- relational domain with strong integrity requirements;
- excellent indexing/querying;
- JSONB available where controlled flexibility is useful;
- transactions are important for booking/calendar transitions;
- RLS supports tenant security;
- mature tooling and migration path;
- sufficient scale for foreseeable Cuebooker growth.

Do not introduce MongoDB/Firestore for booking core.

### IDs

Use UUIDs for externally visible primary keys unless a strong reason emerges otherwise.

Do not encode business meaning in IDs.

### Timestamps

Persist authoritative timestamps as timezone-aware instants (`timestamptz`).

Keep event timezone separately where local event semantics matter.

Never rely on browser locale/timezone as canonical booking time.

### Money

Never use binary floating point for money.

Prefer integer minor units (`amount_minor`) + ISO currency, or Postgres numeric with disciplined application mapping.

A long-term commercial schema should support currency explicitly on every amount.

### Search

Start with indexed relational filters and Postgres full-text/trigram where needed.

Do not introduce Elasticsearch/OpenSearch until query volume/features demonstrate a need.

### Vector search

Do not create a vector database merely because AI exists.

If semantic retrieval becomes valuable, evaluate `pgvector` first so access controls and operational data remain close to Postgres.

---

## 13. Multi-tenancy and authorization

Every tenant-owned record must have an unambiguous workspace boundary.

### RLS baseline

- enable RLS on every private tenant table;
- deny by default;
- policies must derive access from authenticated membership, not user-supplied workspace IDs alone;
- use separate read/write policies where permissions differ;
- service-role credentials must never reach the browser;
- privileged functions should expose the smallest possible operation.

### Membership

Separate membership from domain records:

```text
workspace_members
- workspace_id
- user_id
- role
- status
```

Recommended role direction:

```text
owner
admin
manager
editor
viewer
```

Artist-level assignment can be a separate mapping where agencies need scoped roster access.

### Authorization rule

The UI may hide unavailable actions for usability, but the database/API must enforce permissions independently.

---

## 14. Security baseline

Security work is continuous, not a pre-launch checklist.

### Secrets

- no service role/API private keys in client bundles;
- no secrets committed to Git;
- staging and production use separate credentials;
- rotate compromised credentials immediately;
- prefer provider secret stores/environment bindings.

### Public booking forms

Treat all public input as hostile:

- schema validation;
- length limits;
- rate limiting;
- bot/abuse controls as traffic grows;
- attachment MIME/type/size validation;
- do not trust filename extensions;
- sanitize output where HTML can be rendered.

### Webhooks

For email/payment/integration webhooks:

- verify provider signatures;
- record provider event ID;
- enforce idempotency;
- reject stale/invalid events where protocol allows;
- process expensive work asynchronously.

### Files

Private riders/contracts/attachments belong in private storage buckets.

Serve with authenticated/signed short-lived URLs.

Public artist media should live in explicitly public or transformed media paths, separate from private booking files.

### Audit

High-value actions should eventually be auditable:

- member/role changes;
- booking commercial changes;
- status transitions;
- contract/document operations;
- exports/deletions;
- integration connection changes.

Do not log passwords, tokens or full secrets.

---

## 15. Data privacy and retention

Cuebooker will contain contact details, negotiation history and potentially contracts/commercial terms.

Design for GDPR-style rights from the beginning:

- identify data controller/processor responsibilities before commercial launch;
- maintain a data inventory;
- support account/workspace export;
- support deletion/anonymisation workflows where legally appropriate;
- define retention periods for inbound raw payloads/logs;
- distinguish operational records from telemetry;
- avoid copying personal data into analytics tools unnecessarily.

### Soft delete vs hard delete

Use soft deletion where operational recovery/audit requires it, but do not use soft delete as an excuse to retain personal data forever.

A later retention job should permanently remove records that are eligible for hard deletion.

---

## 16. Asynchronous jobs and queues

Do not make users wait for unreliable external systems.

Candidate async workloads:

- inbound email processing;
- outbound email delivery;
- AI parsing/summarisation;
- attachment processing;
- calendar sync;
- relationship/stat projection refresh;
- notifications;
- import/export.

### Initial strategy

Use a small persistent jobs/outbox pattern backed by Postgres plus scheduled/edge processing if volume is low.

Every job should have:

```text
id
workspace_id?
type
payload/reference
status
attempt_count
available_at
locked_at?
last_error?
created_at
completed_at?
```

External side effects require idempotency keys.

### Scale trigger

Move to a dedicated managed queue/worker infrastructure when sustained throughput, retry complexity, scheduling precision or long-running work exceeds the simple DB/outbox model.

Do not adopt Kafka/event streaming at startup.

---

## 17. Email architecture

Email is an integration, not the Booking domain itself.

Recommended model:

```text
email_message
  ↓ creates/references
activity
  ↓ belongs to
booking
```

Keep provider fields separately:

```text
provider
provider_message_id
provider_thread_id
in_reply_to
from
to
subject
sent_at/received_at
```

### MVP sender identity

Cuebooker can initially send on behalf of the artist with a clear display identity, e.g. artist name + Cuebooker, while preserving reply routing to the correct booking.

Longer term allow connected Gmail/Outlook/custom-domain sending through adapters without changing Booking/Activity.

---

## 18. Integrations architecture

Define ports/adapters such as:

```text
EmailProvider
AIProvider
CalendarProvider
MessagingProvider
StorageProvider
NotificationProvider
```

Provider implementation details stay outside the domain.

Every integration should support:

- connection status;
- scoped credentials/tokens;
- token refresh where applicable;
- revocation;
- provider account identity;
- failure/retry visibility;
- least-privilege scopes.

---

## 19. Performance strategy

### Frontend

- keep booking core JS small;
- lazy-load heavy identity/3D code;
- paginate/cursor large booking/history sets;
- virtualize only when measurement shows it is needed;
- avoid huge reactive arrays for full history;
- use server/database filtering rather than client-side filtering once real data scale begins;
- cache stable profile/reference data where safe;
- do not block interaction on non-essential analytics/AI.

### Database

Indexes should follow access patterns, not speculation.

Expected early indexes include combinations around:

```text
workspace_id
artist_id
booking status
updated_at
activity booking_id + occurred_at
next_move booking_id / due_at
hold booking_id / starts_at
calendar artist_id + starts_at
contact normalized email/phone where appropriate
```

Use `EXPLAIN ANALYZE` and real slow-query telemetry before adding exotic infrastructure.

### N+1 discipline

Workspace overview and booking detail should use bounded queries/views/RPCs rather than dozens of per-row browser calls.

---

## 20. Memory and caching

There are three different meanings of memory and they must not be mixed.

### Product memory

Relationship Memory comes from durable domain data in Postgres.

### Application cache

Browser/edge cache accelerates reads but is disposable.

IndexedDB may support demo/offline/cache scenarios but is not authoritative production state.

### AI conversational memory

Do not create an unlimited AI transcript store.

For AI features, prefer retrieving only relevant booking/contact/activity context with strict limits and explicit scopes.

Summaries can be cached/versioned if they save cost, but raw history remains the source of truth.

---

## 21. Observability

Before meaningful production scale, implement:

- structured server logs;
- correlation/request IDs;
- error tracking;
- latency/error metrics for external providers;
- background job failure visibility;
- DB slow-query monitoring;
- deployment/version identification;
- client performance/Core Web Vitals for public surfaces.

Logs should include IDs and technical context, not unnecessary message bodies/private commercial content.

### Product analytics

Track product behaviour with minimum necessary data.

Useful examples:

- CUE opened;
- capture submitted;
- proposed booking confirmed/cancelled;
- booking created;
- next move completed;
- hold converted;

Do not send private note text, fees or contact PII to generic analytics by default.

---

## 22. Reliability and consistency

### Transactions

Use DB transactions/RPC/application commands for operations that must stay consistent, for example:

- convert hold -> confirmed booking + calendar projection;
- create booking + initial activity;
- create booking + contact link;
- role/membership mutation with invariants.

### Idempotency

Inbound webhooks and retryable commands need provider event IDs/idempotency keys so duplicates do not create duplicate Activity/Booking records.

### Optimistic UI

Use optimistic UI only when rollback is clear. Commercial/status changes should not appear permanently successful until authoritative persistence succeeds.

---

## 23. Backups, migrations and recovery

Database schema changes must be migration-driven and committed to the repository.

Rules:

- never edit production schema manually without capturing an equivalent migration;
- prefer additive/backward-compatible changes first;
- backfill separately for large data changes;
- remove old columns only after application migration is complete;
- test migrations against staging data;
- define restore procedures before the product stores irreplaceable customer data.

Before commercial launch, document Supabase backup/PITR capabilities selected for the paid plan and run at least one restore exercise.

---

## 24. Environments

Maintain strict separation:

```text
local
dev/staging
production
```

Each environment must have distinct:

- database/project;
- storage;
- auth redirect configuration;
- email credentials/domains where practical;
- webhook endpoints/secrets;
- AI/integration credentials or scoped test credentials.

Never test destructive migrations or real email flows against production by convenience.

---

## 25. Testing strategy

The current project needs a formal test layer as the booking core moves out of prototype mode.

Recommended pyramid:

### Domain/unit

Fast tests for:

- booking state transitions;
- hold rules;
- next-move behaviour;
- CUE normalization/validation;
- permission helpers;
- money/date parsing.

### Database/security

Automated tests for:

- RLS isolation between workspaces;
- role permissions;
- inability to mutate another tenant;
- privileged RPC invariants;
- migration correctness.

### Integration

Provider adapters with test/sandbox fixtures for:

- email webhooks;
- AI structured parsing;
- storage;
- external calendars later.

### E2E

Critical user journeys:

```text
CUE -> booking created
booking -> activity added
booking -> hold -> calendar
hold -> confirmed
member cannot access another workspace
```

Do not rely on screenshot/manual staging validation as the only regression defence.

---

## 26. API/versioning strategy

Internal browser-to-Supabase contracts can evolve with the app while the product is private/early.

When Cuebooker exposes a public/integration API:

- version public contracts;
- use stable resource IDs;
- define pagination/cursors;
- enforce workspace-scoped API permissions;
- rate limit;
- provide idempotency for create operations;
- never expose database schema accidentally as the public contract.

---

## 27. Scaling stages

### Stage A: current / early product

- Nuxt/Vue frontend
- Supabase Auth/Postgres/Storage
- Supabase/edge privileged operations
- IndexedDB only for demo/local prototype
- Postgres filtering/pagination
- TypeScript AI orchestration
- simple Postgres jobs/outbox if needed

### Stage B: active paying usage

Add:

- production booking/activity repositories;
- server-side pagination/search;
- worker/job monitoring;
- email integration;
- rate limiting/abuse protection;
- error/performance monitoring;
- backup/restore drill;
- stronger test suite;
- query/index tuning based on real load.

### Stage C: agencies / high activity

Evaluate based on evidence:

- dedicated background workers;
- managed queue;
- read replicas/caching where queries justify them;
- derived/materialized relationship projections;
- integration-specific scaling;
- dedicated API service if edge/serverless limits become material.

### Stage D: very large ecosystem

Only then evaluate:

- service extraction by bounded context;
- event streaming;
- dedicated search infrastructure;
- specialist ML/Python workloads;
- regional/data-residency architecture.

Do not design Stage D infrastructure into Stage A operations prematurely. Design clean boundaries so Stage D remains possible.

---

## 28. Explicit technology decisions

### Keep

- Nuxt 4
- Vue 3
- TypeScript
- Postgres/Supabase
- Supabase Auth/Storage
- Cloudflare as current delivery platform where useful

### Introduce now conceptually

- workspace tenant boundary everywhere
- domain/application/repository/integration separation
- Activity event history
- Contact + Organization entities
- Next Move
- Hold entity
- calendar projections
- server-side/edge privileged commands
- strict RLS and tenant tests

### Do NOT introduce now

- Python main backend
- microservices
- MongoDB/Firestore for booking core
- Elasticsearch/OpenSearch
- Kafka/event streaming
- separate vector database
- Kubernetes
- custom ML stack

Each item above may become appropriate later, but only against a documented constraint.

---

## 29. Triggers for architectural change

A technology change must state the symptom and evidence.

Examples:

### Add dedicated backend service when

- edge/serverless execution limits block required workloads;
- long-lived connections/processes are required;
- privileged application logic becomes too fragmented across functions;
- operational debugging/deployment of functions becomes materially costly.

### Add dedicated queue when

- DB/outbox worker cannot meet throughput/retry/scheduling requirements;
- external integrations generate sustained asynchronous volume;
- isolation/backpressure between job classes becomes necessary.

### Add Python when

- a bounded ML/data workload objectively benefits from Python ecosystem/runtime.

### Add dedicated search when

- Postgres search cannot meet measured latency/features/scale.

### Add caching/Redis-like layer when

- DB/query telemetry shows repeated hot reads that cannot be solved with indexes/query design;
- distributed rate-limit/session/job coordination needs it.

### Split services when

- team/traffic/failure isolation benefits outweigh deployment and consistency complexity.

---

## 30. Implementation migration from current prototype

Do not delete the current booking demo in one rewrite.

Recommended migration:

1. Define production domain types/contracts alongside current demo.
2. Introduce repository interfaces.
3. Create Supabase schema for Contacts, Organizations, Bookings and Activities with RLS.
4. Build one vertical production flow: manual CUE -> Booking + initial Activity.
5. Make current UI consume the new repository/application service for that flow.
6. Add Next Move.
7. Add Hold + Calendar projection.
8. Migrate conversation/history to Activity.
9. Remove obsolete embedded `messages[]` and demo-only persistence only after replacement is validated.

Every step should leave the application runnable.

---

## 31. Architectural north star

The system should eventually be able to ingest:

```text
phone / WhatsApp / email / Instagram / form / manager / API
```

and turn those inputs into a coherent professional history without forcing the user to reorganize their life around Cuebooker.

Operational truth then feeds:

```text
Booking history
   ↓
Relationship Memory
   ↓
Career trajectory
   ↓
CUE Passport / identity layers
```

This is how the broader Cuebooker world should emerge from real work rather than artificial gamification.
