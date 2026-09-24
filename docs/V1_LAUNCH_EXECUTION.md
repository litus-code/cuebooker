# Cuebooker V1 launch execution plan

Updated: 24 September 2026  
Status: ACTIVE EXECUTION PLAN  
Branch: `feature/app-visual-system`  
Production: DO NOT TOUCH

## Objective

Move Cuebooker from broad feature development into a coherent product that can be demonstrated, priced, sold and measured.

The execution mode for V1 is:

```text
CLOSE PRODUCT
→ PRESENT VALUE
→ ENABLE PAYMENT
→ MEASURE
→ ITERATE
```

New speculative product areas should not interrupt this sequence unless they remove a launch blocker.

## Product spine

The V1 product must preserve one understandable loop:

```text
REQUEST
→ CONVERSATION
→ HOLD
→ DECISION
→ BOOKING
→ EVENT
→ CUE PASSPORT
```

Booking Core is the operational product. Artist Profile is the professional presentation layer. CUE Passport turns confirmed activity into trajectory. CUE ID remains optional.

## Execution order

### 1. Close CUE Passport V1

Status: CODE COMPLETE · BACKEND APPLY + VISUAL VALIDATION PENDING

Deliver:

- compact 2D constellation;
- country → city → venue → booking hierarchy;
- city-node interaction;
- contextual city tooltip;
- venues and event dates inside the selected city;
- linked event media via `BOOKING → MEDIA`;
- Stickers collection;
- Timeline;
- Free / Pro commercial classification;
- mobile and reduced-layout review.

V1 does not require:

- ThreeJS Passport;
- automatic Instagram connection;
- public social graph;
- promoter verification network.

The data contract must allow those layers later.

Exit criteria:

- no overlapping legacy UI;
- no excessive empty vertical space;
- one selected city can reveal its venues/dates without leaving the map;
- linked media can render when present;
- empty states do not fabricate artist history;
- Passport remains usable without media or CUE ID.

### 2. Move Profile Lab into the real Profile

Status: IN PROGRESS · CORE MIGRATION COMPLETE

Replace the old admin-style Profile workspace presentation with the approved portfolio/landing direction from `/profile-lab`.

Deliver:

- real artist hero;
- cover editing;
- portrait / CUE ID visual selection;
- inline/block editing;
- sound;
- links / embeds;
- booking CTA;
- public visibility controls;
- coherent navigation to dedicated CUE ID;
- summarized public CUE Passport with independent visibility control;
- centered booking modal on desktop and fullscreen booking sheet on mobile;
- side-panel editing on desktop and fullscreen editing on mobile;
- mobile pass.

The final Profile must remain usable without CUE ID.

### 3. Apply commercial presentation

Status: IN PROGRESS

Source of truth:

- `docs/MONETIZATION_STRATEGY.md`
- `docs/ENTITLEMENTS_V1.md`
- `app/domain/entitlements.ts`

Deliver reusable presentation primitives for:

- `PRO`;
- `AGENCY`;
- capability unavailable state;
- capacity limit state;
- upgrade prompt.

Do not scatter direct plan-name checks through feature components.

Premium capabilities should generally remain visible so a Free user can understand their value.

Implemented so far:

- reusable entitlement composable;
- reusable PRO / AGENCY badge;
- staging/demo plan override, disabled in production;
- Passport Event Media capability gating;
- Smart Capture extended-capacity presentation.

### 4. Close Artist Pro automation value

Status: PARTIALLY IMPLEMENTED

Prioritize the paid capabilities that save operational work:

- advanced follow-up;
- Smart Capture allowance / advanced capture;
- email ingress and threading;
- operational reminders;
- suggested next actions;
- repeatable automation rules where product behaviour is predictable.

Final booking decisions remain artist-controlled.

### 5. Commercial site and Pricing

Status: PENDING

The commercial site should explain the product in this order:

```text
Receive bookings
→ Manage the work
→ Build your trajectory
```

Show:

- Free;
- Artist Pro;
- Agency;
- Founding Artist offer where active.

Do not lead with CUE ID or a future marketplace.

### 6. Billing and entitlements

Status: FOUNDATION EXISTS, ENFORCEMENT PENDING

Integrate real billing only after UI entitlements and pricing presentation are coherent.

Expected launch pricing hypothesis:

- Free: EUR 0;
- Artist Pro: EUR 9.99/month or EUR 99/year;
- Agency: EUR 39/month or EUR 390/year;
- Founding Artist Pro: EUR 7.99/month or EUR 79/year for an early defined cohort.

The existing `workspace_billing` foundation must be reconciled with permanent Free before enforcement.

### 7. Commercial analytics

Status: PENDING

Instrument:

```text
signup
→ profile published
→ booking entry shared
→ first request/capture
→ first response
→ first confirmed booking
→ first Passport event
→ upgrade prompt
→ upgrade started
→ subscription started
```

Also record which entitlement or capacity boundary triggered an upgrade interaction.

Do not use raw daily logins as the main retention metric.

### 8. External beta

Status: PENDING

Initial target:

- 10–20 independent DJs;
- a small number of managers;
- real booking activity;
- users currently working across Instagram, WhatsApp and email.

Measure product behaviour and willingness to pay at the same time.

## Explicitly deferred until after V1 evidence

- 3D Passport constellation;
- automatic Instagram media ingestion;
- DJ discovery marketplace;
- promoter/venue network;
- verified cross-party history;
- large social layer;
- broad generic CRM scope.

These may remain technically prepared but must not displace the V1 execution order.

## Decision rule for new work

Before implementing a new feature, classify it as one of:

1. V1 launch blocker;
2. Free activation;
3. Artist Pro conversion;
4. Agency value;
5. post-V1 exploration.

If it is category 5, it should normally wait until the current execution sequence is complete.
