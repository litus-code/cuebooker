# Booking Core implementation status

Updated: 17 September 2026
Branch: `feature/app-visual-system`
Status: FOUNDATION IN PROGRESS

Read after:

1. `docs/WORK_HANDOFF_2026-09-16.md`
2. `docs/BOOKING_CORE_PRODUCT_VISION.md`
3. `docs/ARCHITECTURE_REFERENCE.md`
4. `docs/ARCHITECTURE_DECISION_REGISTER.md`

## Active product loop

```text
CUE -> Booking -> Activity -> Next Move -> Calendar
```

CUE ID / Passport / 3D remain intentionally behind this operational core until the loop above is strong.

## Implemented foundation

Migration:

`supabase/migrations/20260917011500_add_booking_core_foundation.sql`

The migration is additive and does not replace the current workspace UI/demo model yet.

### Tenant boundary

Added:

- `workspaces`
- `workspace_members`
- `workspace_artists`

Roles:

- owner
- admin
- manager
- editor
- viewer

Workspace membership is the authorization boundary for new Booking Core operational data.

### Operational relationship data

Added:

- `contacts`
- `counterparties`
- `contact_counterparties`

`counterparties` represents workspace-scoped external professional entities such as venue, promoter, agency, festival or brand.

Important transition decision: the pre-existing `public.organizations` table is currently an identity/membership model used by the existing agency/promoter implementation. It must NOT be reused directly as the Booking Core external CRM entity because its RLS semantics require organization membership. Requiring a Cuebooker user to be a member of an external venue/promoter organization would be incorrect.

For now, Booking Core therefore uses `counterparties`. The legacy identity organization model can later be migrated/renamed deliberately after application code has moved to `workspaces`.

### Booking domain

Added:

- `bookings`
- `booking_contacts`

Bookings are workspace-scoped and reference an artist through `workspace_artists`.

Initial sources:

- booking_form
- phone
- whatsapp
- email
- instagram
- in_person
- manager
- manual
- other

Initial states:

- new
- in_conversation
- waiting_response
- confirmed
- rejected
- cancelled

Commercial amount is represented as integer minor units plus ISO currency. No floating-point money.

Event date can exist before exact start/end times, matching real booking negotiation where incomplete information is valid.

### Activity stream

Added `activities` as an append-oriented operational history.

Initial types include:

- phone
- email
- whatsapp
- instagram
- note
- status_change
- hold_created / released / converted
- next_move_created / completed
- system

Authenticated product users only receive SELECT + INSERT on `activities` in this foundation. UPDATE/DELETE is deliberately not granted so imported/system history is not casually mutated.

### Tenant integrity

Cross-workspace references are protected structurally as well as through RLS.

Important FKs use `(workspace_id, entity_id)` rather than only entity ID. This prevents a booking in Workspace A from referencing a contact, counterparty or artist mapping in Workspace B even if application code is wrong.

`workspace_id`, `created_by` and `created_at` are protected on mutable tenant records. Records cannot be moved between workspaces through a normal UPDATE.

Historical references from bookings/activities to contacts/counterparties use restrictive deletion instead of silently nulling identity/history.

### RLS and permissions

New tenant-owned tables have RLS enabled.

Baseline rules:

- members can read workspace operational data;
- editor and above can mutate normal Booking Core operational data;
- admin/owner manage workspace membership and artist mappings;
- only an existing owner can grant/promote another member to owner;
- admins cannot promote themselves to owner;
- the final workspace owner cannot be demoted or deleted;
- private activities are visible only to their creator in this initial model;
- service credentials remain server-only.

## Deliberately NOT implemented yet

The foundation does not yet wire the current workspace screen to these tables.

Not implemented in this slice:

- automatic workspace creation/backfill for existing Cuebooker accounts;
- repositories/services for the new Postgres Booking Core;
- `+ CUE` UI;
- natural-language/AI parsing;
- Next Move table/service;
- Hold table/service;
- Calendar projection;
- email ingestion/threading;
- WhatsApp/share integrations;
- voice capture;
- Relationship Memory projections.

## Required next slice

Before exposing `+ CUE`, create a safe workspace bootstrap/migration path for current accounts.

The next slice should:

1. define how each existing solo artist and agency maps to a workspace;
2. create/bootstrap that workspace without duplicate creation on retry;
3. link existing artists through `workspace_artists`;
4. preserve the current organization/artist membership behaviour while the UI migrates;
5. provide application repositories/services for Workspace, Contact, Counterparty, Booking and Activity;
6. test tenant isolation and role boundaries;
7. only then wire the first manual CUE creation flow.

## Validation rule

Do not apply structural SQL to production merely because CI builds the Nuxt application. The migration must be validated against a disposable/local or staging Supabase database first, including explicit RLS tests with at least two different users/workspaces.

Minimum security test cases before production migration:

- Workspace A member cannot select Workspace B contacts/bookings/activities.
- Cross-workspace composite references fail at FK level.
- viewer cannot create/update Booking Core data.
- editor can create booking/activity but cannot manage membership.
- admin cannot promote self to owner.
- final owner cannot be demoted/deleted.
- deleting a referenced contact/counterparty is rejected rather than erasing history.
- anonymous role has no access to private Booking Core tables.

## Development principle

Implement vertical slices against this foundation. Do not rebuild the current product from scratch and do not add infrastructure for hypothetical scale. Keep the operational domain clean enough that external workers/services can be extracted later without changing Booking Core semantics.
