# Cuebooker agent guide

Updated: 17 September 2026
Status: CANONICAL ENTRY POINT

Read this file before changing Cuebooker.

A chat transcript is not project memory. Repository documentation is the source of continuity between agents.

## 1. Read order

For any significant product/engineering task, read in this order:

1. `AGENTS.md`
2. `docs/HANDOFF.md`
3. `docs/AGENT_WORKFLOW.md`
4. `docs/AGENT_ARCHITECTURE.md`
5. the product-specific document for the feature
6. `docs/ARCHITECTURE_REFERENCE.md`
7. `docs/ARCHITECTURE_DECISION_REGISTER.md`
8. implementation status docs relevant to the area

For the current Booking ingress/public-profile block, also read:

- `docs/BOOKING_INGRESS_PRODUCT.md`
- `docs/BOOKING_CORE_PRODUCT_VISION.md`
- `docs/BOOKING_CORE_IMPLEMENTATION_STATUS.md`
- `docs/BOOKING_EMAIL_THREADING_STATUS.md` when email/follow-up is involved

## 2. Product in one sentence

Cuebooker is an operational booking workspace for independent DJs, managers and agencies that turns opportunities arriving through many real-world channels into one trackable Booking Core.

The product does not require bookings to start inside Cuebooker. It prevents booking context, relationships and next actions from being lost between Instagram, WhatsApp, email, phone, websites and offline conversations.

## 3. Product boundaries

The initial product manages demand an artist/agency already receives. It does not promise to find gigs.

A promoter can send the first booking enquiry without creating a Cuebooker account.

Private fees, contacts, negotiation history, notes, Holds, Next Moves and private calendar details stay private unless an explicit product decision publishes something.

A public artist/network/discovery layer may grow later. Operational truth comes first.

CUE ID / Passport / identity/gamification concepts remain downstream of real Booking Core truth.

## 4. Current public-entry product direction

The canonical public artist surface is intended to be:

```text
https://cuebooker.com/<artist-slug>
```

The workspace's “Vista previa de mi perfil” should preview the same public Artist Profile, not a separate mock product.

The booking form/capability lives inside this public profile. Focused/deep links can open it directly, for example:

```text
/<artist-slug>?booking=1&src=instagram
```

Artists without a personal website can use the Cuebooker profile as their professional booking entry point. Artists with a website may later embed a widget that uses the exact same public intake backend.

Everything converges into the same Booking Core. There is no separate widget/Instagram/public-form inbox model.

See `docs/BOOKING_INGRESS_PRODUCT.md` for the canonical definition.

## 5. Current operational product loop

```text
Ingress / + CUE
 -> Contact / Counterparty
 -> Booking
 -> Activity
 -> Next Move
 -> Hold
 -> Calendar
 -> History
```

Keep `origin_channel`, `capture_method` and public entry attribution conceptually separate.

Examples:

```text
WhatsApp + manual CUE
origin_channel = whatsapp
capture_method = manual

Instagram bio -> Cuebooker public form
origin_channel = booking_form
capture_method = public_form
entry attribution = instagram
```

## 6. Working rules

- Follow `docs/AGENT_WORKFLOW.md` for significant changes.
- Follow `docs/AGENT_ARCHITECTURE.md` for Cuebooker-specific architecture.
- Do not import rules, terminology or implementation patterns from Radisson/Tridion/SDL or any unrelated codebase.
- Architecture is created by necessity, not ceremony.
- Preserve a single Booking model across ingress channels.
- Do not require promoter registration for the first enquiry.
- Do not claim a simulated/demo feature is connected.
- Do not seed fake product data to hide real empty states.
- Apply database changes through versioned Supabase migrations.
- RLS remains enabled/enforced for private exposed tenant data.
- Service-role/private keys never reach browser code.
- Privileged/webhook/public anonymous operations belong server/edge-side.
- Staging and production are separate environments and separate decisions.
- Mobile is first-class. Check around 390 px plus desktop for meaningful UI work.
- Preserve accessibility, keyboard/focus basics and readable contrast/density.
- Do not use emoji arrows as interface replacements; use the established Cuebooker visual system.
- Do not introduce vanity rankings, follower scoring or synthetic DJ credibility metrics into core product decisions.

## 7. Git and deployment safety

Default rule: agents do not commit/push unless the user explicitly asks the current agent to apply the agreed changes directly to the connected repository.

Direct-repository authorization is scoped to the current agreed work. It is not blanket permission to merge PRs or deploy production.

Never:

- force-push/rewrite history casually;
- merge production work merely because CI is green;
- apply production database migrations because staging passed;
- call a PR preview `staging.cuebooker.com` unless it actually is that deployment;
- assume a repository Edge Function is deployed because its file exists.

## 8. Repository map

Important current areas:

- `app/pages/workspace.vue`: authenticated operational workspace shell.
- `app/components/BookingCoreInbox.vue`: real Booking Core inbox/detail surface.
- `app/components/BookingCoreOperations.vue`: Next Move + Hold operations.
- `app/components/BookingActivityComposer.vue`: operational Activity capture/outbound email path.
- `app/components/CueCapturePanel.vue`: private low-friction `+ CUE` capture.
- `app/pages/artist.vue`: current fictional/demo artist public entry surface; not yet the final real public slug implementation.
- `app/pages/request.vue`: current promoter-side demo/follow-up surface.
- `app/composables/useBookingDemo.ts`: browser-local demo support only; must not become production truth.
- `app/domain/bookingCore.ts`: Booking Core application types.
- `app/services/bookingCoreApi.ts`: Booking Core application API boundary.
- `app/services/bookingEmailApi.ts`: booking email boundary.
- `supabase/migrations/`: versioned schema/RLS/domain commands.
- `supabase/functions/`: privileged integration/webhook functions.
- `.github/workflows/`: CI and environment deployment workflows.

## 9. Current source-of-truth docs

- `docs/HANDOFF.md`: current baton pass and exact next step.
- `docs/AGENT_WORKFLOW.md`: how agents should work.
- `docs/AGENT_ARCHITECTURE.md`: Cuebooker-specific engineering rules.
- `docs/BOOKING_INGRESS_PRODUCT.md`: public Artist Profile + all booking ingress routes.
- `docs/BOOKING_CORE_PRODUCT_VISION.md`: operational Booking Core product semantics.
- `docs/ARCHITECTURE_REFERENCE.md`: complete reference architecture.
- `docs/ARCHITECTURE_DECISION_REGISTER.md`: accepted structural decisions.
- `docs/BOOKING_CORE_IMPLEMENTATION_STATUS.md`: detailed Booking Core implementation state; check `HANDOFF.md` for newer corrections.
- `docs/BOOKING_EMAIL_THREADING_STATUS.md`: email threading state.

## 10. Handoff is mandatory

After a significant block, update `docs/HANDOFF.md` with:

- date;
- branch + exact HEAD;
- what changed;
- what was actually validated;
- which environment was validated;
- known caveats;
- schema/migrations/functions introduced;
- production status;
- exact next implementation block.

Future agents must be able to resume from repository docs without relying on previous chat memory.