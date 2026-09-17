# Booking Core implementation status

Updated: 17 September 2026
Branch: `feature/app-visual-system`
Status: OPERATIONAL CORE VERTICAL SLICE WORKING ON STAGING

Read after:

1. `docs/WORK_HANDOFF_2026-09-16.md`
2. `docs/BOOKING_CORE_PRODUCT_VISION.md`
3. `docs/ARCHITECTURE_REFERENCE.md`
4. `docs/ARCHITECTURE_DECISION_REGISTER.md`

## Active product loop

```text
CUE -> Booking -> Activity -> Next Move -> Hold -> Calendar
```

This loop is now represented by real Booking Core data on staging. CUE ID / Passport / 3D remain intentionally downstream until the operational loop is stable enough to become the source of career truth.

## Current milestone

The real vertical slice now covers:

```text
legacy account
  -> idempotent workspace bootstrap
  -> + CUE manual capture
  -> Contact / Counterparty resolution
  -> Booking
  -> Activity
  -> traced status changes
  -> Next Move
  -> Hold
  -> Overview attention queue
  -> Calendar projection
```

The old browser demo remains below the real booking inbox temporarily. It is a migration aid, not the new source of truth.

## Database foundation

Booking Core repository migrations:

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

The migration filenames now have a deterministic version order. A duplicate `20260917033000` version discovered during implementation was corrected before production rollout.

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

`app/components/BookingCoreInbox.vue` shows real Booking Core records before the legacy demo.

The selected real booking exposes:

- source and state;
- date;
- venue/counterparty;
- primary contact;
- offer;
- Activity history;
- operational Next Move and Hold controls.

Status changes use `public.set_booking_status(...)`; the UI does not perform an untraced direct status update. Every real transition appends `status_change` Activity.

## Next Move

`next_moves` is separate from Booking and Activity.

Current invariant: at most one active Next Move per booking, enforced by a partial unique index. Replacing the current move completes the previous row and writes Activity. Completing a move also writes Activity.

`app/components/BookingCoreOperations.vue` can define/replace and complete the selected booking's Next Move.

`app/components/BookingCoreAttention.vue` aggregates active Next Moves and Holds in Overview so `Qué necesita tu atención` is now operational data rather than placeholder content.

## Holds

`holds` is a first-class entity, not a Booking status.

A Hold can contain:

- booking relation;
- date;
- optional start/end instants;
- timezone;
- optional expiry;
- optional priority;
- active / released / converted lifecycle.

Creating, releasing and converting Holds append Activity.

Confirmation semantics are now explicit:

- a booking cannot become `confirmed` without `event_date`;
- on confirmation, one active Hold matching that date is converted when present;
- remaining active Holds for that booking are released;
- hold conversion/release and booking status transition are all recorded in Activity.

This rule was validated in staging with a rollback test producing exactly one confirmed booking, one converted Hold, one released Hold, one `status_change`, one `hold_converted` and one `hold_released` event.

## Calendar projection

Calendar is still a read/projection surface, not the owner of Booking/Hold truth.

The workspace calendar now combines:

- legacy/private `availability_blocks`;
- active Booking Core Holds;
- confirmed Booking Core bookings.

No Hold or confirmed booking is duplicated into `availability_blocks` merely to make it visible.

Date-only Holds/confirmed bookings are represented as day-level operational items rather than being assigned fake times. Timed Holds/confirmed bookings can appear on the 24-hour timeline.

This is intentionally an application projection for the current scale. It can later become a database read model/view when more scheduling sources such as travel and studio time are introduced.

## Application layer

Booking Core code boundaries:

- `app/domain/bookingCore.ts`
- `app/services/bookingCoreApi.ts`
- `app/composables/useBookingCore.ts`

UI components consume domain/application commands rather than embedding PostgREST table logic.

The application API currently covers workspace resolution, contacts, counterparties, bookings, Activity, CUE capture, Next Moves, Holds and traced booking-state changes.

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
- Activity generated by operational commands.

Supabase security advisors currently identify no Booking Core schema warning. The remaining project-level warning is Auth leaked-password protection being disabled; resolve it before production launch.

Performance advisor `unused_index` notices are expected on a fresh staging schema without representative workload and are not evidence that those indexes should be removed.

## Repository hygiene

Historical one-shot `TEMP` GitHub workflows for booking-toolbar/sidebar/scroll patches were removed. Their orphaned Python patch scripts were removed as well. New temporary patch workflows used during this migration are deleted immediately after use.

This matters because old push-triggered workflows had been creating noisy bot commits and could have mutated CSS after unrelated Booking Core changes.

## Still deliberately pending

The operational spine exists, but V1 is not finished. Important next work includes:

- edit real booking details after initial CUE capture;
- real booking search/filter/archive replacing demo equivalents;
- quick Activity actions (`Log call`, `Add note`, later email/WhatsApp logging);
- tighter navigation from Calendar/Overview directly to the selected real booking;
- conflict/overlap rules that include real Holds and confirmed bookings;
- production-ready History based on real Activity rather than demo `messages[]`;
- remove demo persistence only after equivalent real capabilities exist;
- natural-language CUE extraction;
- voice capture;
- email ingestion/reply threading;
- later WhatsApp/share surfaces;
- Relationship Memory;
- production migration and launch hardening.

The commercial website narrative also needs to be rewritten around the new product truth: Cuebooker does not replace phone, WhatsApp, email or Instagram; it prevents the booking context and next action from being lost between them.

## Production gate

Do not apply Booking Core migrations to production until:

- the complete repository migration chain replays cleanly in order;
- RLS and command tests remain green;
- current PR preview is smoke-tested on desktop and mobile with a real staging account;
- CUE -> Booking -> Activity -> Next Move/Hold -> Calendar is manually exercised end-to-end;
- backup/rollback procedure is confirmed;
- project-level Auth leaked-password protection decision is resolved;
- staging and production credentials/config are verified independently.

## Next implementation block

Prioritize replacing the remaining demo-only operational behavior rather than adding new speculative scope:

```text
Edit Booking
-> Quick Activity
-> real Search / Filters / History
-> conflict detection
-> remove demo dependency
```

Natural-language/voice CUE should follow once these deterministic commands are stable, so AI proposes data into a reliable domain rather than becoming the domain itself.

## Development principle

Build vertical slices, preserve current working capability during migration, and keep the domain simple enough that future integrations/AI workers can be added behind adapters. Do not introduce Python, microservices, Kafka, a vector database or other infrastructure merely because Cuebooker may need them at a later scale.
