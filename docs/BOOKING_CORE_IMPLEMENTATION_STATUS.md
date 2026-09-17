# Booking Core implementation status

Updated: 17 September 2026
Branch: `feature/app-visual-system`
Status: FIRST REAL VERTICAL SLICE WORKING ON STAGING

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

## Current milestone

The first real operational slice now exists on staging:

```text
legacy account
  -> workspace bootstrap
  -> + CUE
  -> atomic manual capture
  -> Booking
  -> initial Activity
  -> real booking inbox/detail
```

The existing demo inbox is intentionally still present below the real inbox while the remaining real booking actions are migrated.

## Database foundation

Core migrations in the repository include:

- `20260917011000_reconcile_booking_core_prototype.sql`
- `20260917011500_add_booking_core_foundation.sql`
- `20260917014500_add_booking_workspace_bootstrap.sql`
- `20260917015500_harden_booking_core_foundation.sql`
- `20260917020500_fix_workspace_owner_cascade_delete.sql`
- `20260917022000_add_manual_booking_capture.sql`
- `20260917023000_sync_legacy_workspace_memberships.sql`

These migrations have been applied and validated on `cuebooker-staging` Supabase.

They have NOT been applied to production yet.

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

Legacy artist/agency ownership and memberships can bootstrap into this model idempotently. Creating a new workspace remains owner-controlled; legitimate members can resolve an already-created workspace.

### Operational relationship data

Added:

- `contacts`
- `counterparties`
- `contact_counterparties`

`counterparties` represents external venues, promoters, agencies, festivals, brands and other professional entities.

Important transition decision: the pre-existing `public.organizations` table remains an identity/membership model for the legacy agency implementation. It is not reused as an external booking counterparty because its RLS semantics require organization membership.

### Booking domain

Added:

- `bookings`
- `booking_contacts`

Bookings are workspace-scoped and reference artists through `workspace_artists`.

Sources include:

- booking_form
- phone
- whatsapp
- email
- instagram
- in_person
- manager
- manual
- other

States include:

- new
- in_conversation
- waiting_response
- confirmed
- rejected
- cancelled

Money uses integer minor units plus ISO currency. Event/date information is intentionally nullable so an incomplete real-world opportunity can exist before exact details are known.

### Activity stream

`activities` is append-oriented operational history.

Initial types include phone, email, WhatsApp, Instagram, note, status changes, hold events, Next Move events and system events.

Authenticated application users have SELECT + INSERT on Activity in this slice. Ordinary UPDATE/DELETE is deliberately not granted.

## CUE manual capture

Implemented `public.create_manual_booking(...)` as one database transaction.

One CUE action can atomically:

1. reuse or create a contact;
2. reuse or create a counterparty;
3. create the booking;
4. create its initial Activity;
5. create the booking-contact relation.

If any operation fails, the complete transaction rolls back. Vue does not orchestrate partial record creation.

The command has been executed as an authenticated staging owner inside a validation transaction and returned a real booking row. The validation transaction was rolled back, leaving no test data.

## Application layer

Added:

- `app/domain/bookingCore.ts`
- `app/services/bookingCoreApi.ts`
- `app/composables/useBookingCore.ts`

The UI does not contain direct Booking Core table semantics. Supabase/PostgREST interaction is behind the application API layer.

Current API supports:

- workspace bootstrap/resolution;
- workspace memberships/artists;
- contacts;
- counterparties;
- bookings;
- activities;
- atomic manual CUE creation.

## UI implemented

### `+ CUE`

Added `app/components/CueCapturePanel.vue`.

The first capture experience is intentionally low-friction:

- channel/source;
- existing or new contact;
- existing or new venue/promoter/counterparty;
- note describing what happened;
- optional event/date/city/offer details.

The form permits incomplete bookings. The product should not require CRM-style completeness before a real opportunity can be saved.

### Real booking inbox

Added `app/components/BookingCoreInbox.vue`.

The Bookings screen now shows real bookings created through Booking Core before the existing demo area. Selecting a real booking shows:

- status;
- source;
- date;
- venue/counterparty;
- primary contact;
- offer;
- Activity timeline.

The demo remains temporarily below it so existing functionality and guided-tour coverage are not removed while real actions are migrated.

### Overview

The Overview real-booking KPI now uses actual Booking Core records instead of always displaying a placeholder.

## Security validation completed on staging

Explicit tests completed:

- authenticated owner can see their workspace;
- unrelated authenticated identity sees zero rows through RLS;
- cross-workspace entity references are rejected by composite FKs;
- owner bootstrap is idempotent;
- final-owner protection was tested and corrected so manual owner removal is blocked without preventing workspace cascade deletion;
- public `SECURITY DEFINER` bootstrap exposure was removed: privileged implementation is private with an invoker-facing wrapper;
- Supabase security advisor is clean for Booking Core.

The remaining Supabase security advisor warning is project-level Auth leaked-password protection being disabled. This is not a Booking Core schema defect, but it should be enabled before production launch.

Performance advisors originally identified uncovered FKs. Covering indexes were added. Current unused-index notices are expected on a new staging schema with effectively no workload and should not be used to remove indexes yet.

## CI / preview status

Current clean integration HEAD at time of this update is based on the Booking Core inbox integration and temporary integration scripts/workflows have been removed.

Nuxt production generation passes in CI and the PR preview deploy passes.

Do not claim `staging.cuebooker.com` itself was updated unless the deploy workflow explicitly ran that job; current branch workflow primarily deploys the PR preview.

## Deliberately not implemented yet

The following are intentionally next, not missing by accident:

- real status-transition commands/UI;
- generalized Activity creation UI beyond initial CUE capture;
- Next Move table/service/UI;
- Hold table/service/UI;
- Calendar projection from Hold/confirmed Booking;
- real booking filtering/search replacing demo filters;
- email ingestion/threading;
- WhatsApp/share integration;
- voice capture/transcription;
- AI extraction for natural-language CUE;
- Relationship Memory projections;
- production migration.

## Next slice

Next product/architecture block:

```text
Booking -> Activity actions -> Next Move -> Hold -> Calendar projection
```

Recommended order:

1. add explicit domain commands for booking status transitions and Activity creation;
2. introduce `next_moves` with one active Next Move per booking at product level;
3. introduce `holds` separately from Booking status;
4. project Hold/confirmed bookings into Calendar without making Calendar source of truth;
5. make Overview `Qué necesita tu atención` read from real Next Moves/Holds;
6. then expand CUE with natural-language extraction and later voice/share surfaces.

## Production gate

Do not apply Booking Core migrations to production until:

- the final staging migration chain is replayed cleanly;
- RLS tests remain green;
- CUE and real inbox are manually smoke-tested using the staging application;
- production backup/rollback procedure is confirmed;
- project-level Auth leaked-password protection decision is resolved;
- staging and production environment configuration is verified separately.

## Development principle

Build vertical slices against this foundation. Preserve current working capability while migrating it. Do not rebuild the product from scratch and do not introduce infrastructure for hypothetical scale. Keep domain boundaries strong enough that integrations, AI workers or other services can later be extracted without changing Booking Core semantics.
