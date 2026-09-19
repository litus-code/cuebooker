# Booking Core implementation status

Updated: 18 September 2026
Branch: `feature/app-visual-system`
Status: OPERATIONAL CORE VERTICAL SLICE WORKING ON STAGING

Read after:

1. `docs/WORK_HANDOFF_2026-09-16.md`
2. `docs/BOOKING_CORE_PRODUCT_VISION.md`
3. `docs/ARCHITECTURE_REFERENCE.md`
4. `docs/ARCHITECTURE_DECISION_REGISTER.md`

## Active product loop

```text
CUE -> Booking -> Activity -> Next Move -> Hold -> Calendar -> History
```

This loop is represented by real Booking Core data on staging. CUE ID / Passport / 3D remain intentionally downstream until the operational loop is stable enough to become the source of career truth.

## Current milestone

The real vertical slice now covers:

```text
legacy account
  -> idempotent workspace bootstrap
  -> selected-artist scoping inside agencies
  -> + CUE manual capture
  -> Contact / Counterparty resolution
  -> Booking
  -> edit Booking after capture
  -> quick Activity logging
  -> traced status changes
  -> Next Move
  -> Hold
  -> Overview attention queue
  -> Calendar projection
  -> real Search / Filters
  -> real History
  -> Archive / Restore
  -> conflict diagnostics
  -> Relationship Memory
  -> natural-language CUE extraction/review
  -> voice CUE input
  -> outbound/inbound email threading
```

The authenticated workspace no longer renders the legacy booking/history demo. Real Booking Core is the primary operational surface, including the real zero-booking state with `+ CUE` and real Activity/History. The standalone `/app` route remains an explicit optional functional demo and is not mixed into the authenticated product.

## Database foundation

Booking Core repository migrations include:

- `20260917011000_reconcile_booking_core_prototype.sql`
- `20260917011500_add_booking_core_foundation.sql`
- `20260917014500_add_booking_workspace_bootstrap.sql`
- `20260917015500_harden_booking_core_foundation.sql`
- `20260917020500_fix_workspace_owner_cascade_delete.sql`
- `20260917022000_add_manual_booking_capture.sql`
- `20260917023000_sync_legacy_workspace_memberships.sql`
- `20260917033000_add_next_moves_and_holds.sql`
- `20260917033500_add_booking_status_command.sql`
- `20260917034000_refine_booking_confirmation.sql`
- `20260917042000_add_update_booking_details.sql`
- `20260917080500_add_booking_archive_command.sql`
- `20260917081000_refine_booking_archive_cleanup.sql`
- `20260917081500_enforce_archived_booking_read_only.sql`

The migration filenames use deterministic version ordering. A duplicate `20260917033000` version discovered during implementation was corrected before production rollout.

These Booking Core changes have been applied and validated against `cuebooker-staging` Supabase. They have NOT been applied to production.

## Tenant and relationship model

Booking Core uses:

- `workspaces`
- `workspace_members`
- `workspace_artists`
- `contacts`
- `counterparties`
- `contact_counterparties`
- `bookings`
- `booking_contacts`
- `activities`
- `next_moves`
- `holds`

Workspace membership is the tenant boundary. Roles are owner, admin, manager, editor and viewer.

The legacy `public.organizations` table remains an identity/membership model. External venues, promoters, festivals, agencies and brands are represented by workspace-scoped `counterparties`; they are not forced into Cuebooker membership semantics.

Cross-workspace entity references use composite foreign keys where relevant, so application mistakes cannot link one tenant's booking to another tenant's contact/counterparty/artist mapping.

Agency workspaces now scope Bookings and Holds to the selected artist in the UI while keeping workspace membership as the authorization boundary.

## CUE manual capture

`public.create_manual_booking(...)` is the first production-domain CUE command.

One transaction can:

1. reuse or create a contact;
2. reuse or create a counterparty;
3. create a sparse/incomplete booking;
4. append its initial Activity;
5. link the booking contact.

The command has been exercised as an authenticated staging owner inside rollback validation transactions. No validation fixture data was left behind.

`app/components/CueCapturePanel.vue` exposes the first low-friction UI. It accepts channel, contact/entity, a short description of what happened and optional event/date/city/offer details. Missing information is intentionally allowed.

## Booking and Activity UI

`app/components/BookingCoreInbox.vue` is the authenticated Bookings surface. It renders real Booking Core records and, when there are none, a real zero-booking state with `+ CUE`.

The selected real booking exposes:

- source and state;
- date and optional timing;
- venue/counterparty;
- primary contact;
- offer;
- Activity history;
- editing after the initial CUE;
- quick Activity capture for notes/calls/WhatsApp/email/Instagram;
- operational Next Move and Hold controls;
- Archive / Restore;
- conflict diagnostics.

Status changes use `public.set_booking_status(...)`; the UI does not perform an untraced direct status update. Every real transition appends `status_change` Activity.

Booking details are updated through `public.update_booking_details(...)`, which validates date/time/money fields and appends one system Activity describing the fields changed. The command was exercised in a rollback validation transaction.

## Search, navigation and History

The real inbox supports:

- text search across booking/event/venue/contact/counterparty context;
- real status filtering;
- Active / Archived filtering;
- exact booking focus when navigating from another surface.

`BookingCoreHistory` is driven by real Activity rather than legacy `messages[]`. History and Calendar can navigate back to the exact real booking rather than merely opening the Bookings tab.

For agencies, these surfaces use the selected artist's booking set rather than mixing all artists in the workspace.

## Next Move

`next_moves` is separate from Booking and Activity.

Current invariant: at most one active Next Move per booking, enforced by a partial unique index. Replacing the current move completes the previous row and writes Activity. Completing a move also writes Activity.

`app/components/BookingCoreOperations.vue` can define/replace and complete the selected booking's Next Move.

`app/components/BookingCoreAttention.vue` aggregates active Next Moves and Holds in Overview so `Qué necesita tu atención` is operational data rather than placeholder content.

## Holds

`holds` is a first-class entity, not a Booking status.

A Hold can contain booking relation, date, optional start/end instants, timezone, optional expiry, optional priority and an active/released/converted lifecycle.

Creating, releasing and converting Holds append Activity.

Confirmation semantics are explicit:

- a booking cannot become `confirmed` without `event_date`;
- on confirmation, one active Hold matching that date is converted when present;
- remaining active Holds for that booking are released;
- hold conversion/release and booking status transition are all recorded in Activity.

This rule was validated in staging with a rollback test producing exactly one confirmed booking, one converted Hold, one released Hold, one `status_change`, one `hold_converted` and one `hold_released` event.

## Archive semantics

Archive is non-destructive and preserves the complete Activity trace.

`public.set_booking_archived(...)` is the authoritative command. Archiving atomically:

- sets `archived_at`;
- completes an active Next Move;
- releases active Holds;
- records one system Activity containing the cleanup counts.

Restoring clears `archived_at` but intentionally does not resurrect previous Next Moves or Holds.

Archived bookings are read-only at both UI and database layers. The UI exposes the historical booking + Activity + Restore. Database triggers reject direct changes to an archived booking, new/updated Next Moves or Holds, and normal Activity inserts while archived.

Staging rollback validation produced exactly one archived booking, one completed Next Move, one released Hold and one archive Activity. A second validation confirmed mutation rejection while archived and successful Restore.

Archived bookings are excluded from active Overview counts, attention and Calendar projection.

## Conflict diagnostics

`app/components/BookingCoreConflictNotice.vue` detects possible scheduling collisions for the selected real booking against:

- other active/non-archived bookings for the selected artist;
- active Holds;
- private `availability_blocks`.

Precise time ranges use interval overlap. Date-only records are conservatively treated as same-day conflicts because Cuebooker must not invent a free timeslot when the time is unknown.

Conflicts are warnings rather than blockers. Real booking work can legitimately contain alternative dates or deliberate overlapping Holds; Cuebooker surfaces the risk and leaves the decision to the user.

## Calendar projection

Calendar is a read/projection surface, not the owner of Booking/Hold truth.

The workspace calendar combines:

- private `availability_blocks`;
- active Booking Core Holds;
- confirmed, non-archived Booking Core bookings.

No Hold or confirmed booking is duplicated into `availability_blocks` merely to make it visible.

Date-only Holds/confirmed bookings are represented as day-level operational items rather than being assigned fake times. Timed Holds/confirmed bookings can appear on the 24-hour timeline.

This is intentionally an application projection for the current scale. It can later become a database read model/view when more scheduling sources such as travel and studio time are introduced.

## CUE natural language, voice and email

CUE now has deterministic Booking Core persistence plus richer capture adapters:

- natural-language interpretation proposes structured booking fields before persistence;
- voice input feeds the same capture/review path rather than creating a second booking model;
- outbound email is written back into Booking Activity;
- inbound replies are correlated through a tokenized Reply-To address and persisted into the same booking thread;
- staging has completed a real outbound -> Gmail reply -> Brevo inbound -> Activity roundtrip.

These adapters do not own booking truth. They feed the same Booking Core commands and Activity model.

## Relationship Memory

`app/components/BookingRelationshipMemory.vue` derives professional context from real Booking Core data rather than a synthetic score. It remains downstream of bookings/activities and does not replace Contact or Counterparty truth.

## Application layer

Booking Core boundaries:

- `app/domain/bookingCore.ts`
- `app/services/bookingCoreApi.ts`
- `app/composables/useBookingCore.ts`

UI components consume domain/application commands rather than embedding PostgREST table logic.

The application API currently covers workspace resolution, contacts, counterparties, bookings, Activity, CUE capture, editing, status changes, archive/restore, Next Moves and Holds.

## Security and integrity validation completed on staging

Validated so far:

- owner workspace bootstrap;
- bootstrap idempotency;
- non-member RLS isolation;
- cross-workspace composite FK rejection;
- membership role constraints;
- final-owner protection without blocking workspace cascade deletion;
- private privileged bootstrap implementation with invoker-facing API;
- atomic manual CUE capture;
- one-active-Next-Move invariant;
- Next Move replacement history;
- Hold lifecycle commands;
- booking confirmation closing active Holds coherently;
- Activity generated by operational commands;
- archive cleanup semantics;
- archived-booking database read-only enforcement;
- Restore path after archive.

Supabase security advisors currently identify no Booking Core schema warning. The remaining project-level warning is Auth leaked-password protection being disabled; resolve it before production launch. See https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

Performance advisor `unused_index` notices are expected on a fresh staging schema without representative workload and are not evidence that those indexes should be removed.

## Repository hygiene

Historical one-shot `TEMP` GitHub workflows and their patch scripts are removed immediately after use. They are not part of the application architecture.

This matters because old push-triggered workflows had been creating noisy bot commits and could mutate `workspace.vue` after unrelated Booking Core changes.

## Still deliberately pending

The deterministic operational spine exists, but V1 is not finished. Important next work includes:

- manually smoke-test the real preview on desktop and mobile with a staging account;
- manually exercise the complete CUE -> Booking -> Activity -> Next Move/Hold -> Calendar -> History path;
- manually exercise Archive / Restore and conflict warnings in preview;
- duplicate-provider and archived-booking email hardening checks;
- later WhatsApp/share surfaces;
- product analytics/observability and launch hardening;
- production migration only after the gate below.

The commercial website narrative also needs to be rewritten around the new product truth: Cuebooker does not replace phone, WhatsApp, email or Instagram; it prevents the booking context and next action from being lost between them.

## Production gate

Do not apply Booking Core migrations to production until:

- the complete repository migration chain replays cleanly in order;
- RLS and command tests remain green;
- current PR preview is smoke-tested on desktop and mobile with a real staging account;
- CUE -> Booking -> Activity -> Next Move/Hold -> Calendar -> History is manually exercised end-to-end;
- archive/restore and conflict warnings are manually exercised in preview;
- backup/rollback procedure is confirmed;
- project-level Auth leaked-password protection decision is resolved;
- staging and production credentials/config are verified independently.

## Next implementation block

The authenticated demo-removal block is complete:

```text
real zero-booking state with + CUE
-> real inbox is the primary/only authenticated booking surface
-> real History is primary
-> standalone /app remains an explicit optional demo
-> obsolete workspace demo copy/styles removed
```

Immediate priority is verification rather than another feature layer:

```text
desktop/mobile staging smoke
-> CUE -> Booking -> Activity -> Next Move/Hold -> Calendar -> History
-> Archive / Restore
-> conflict diagnostics
-> CI / preview green
```

Do not apply Booking Core migrations to production during this verification block.

## Development principle

Build vertical slices, preserve working capability during migration, and keep the domain simple enough that future integrations/AI workers can be added behind adapters. Do not introduce Python, microservices, Kafka, a vector database or other infrastructure merely because Cuebooker may need them at a later scale.
