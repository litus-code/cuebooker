# Cuebooker living handoff

Updated: 17 September 2026
Branch: `feature/app-visual-system`
Status: ACTIVE BATON PASS

This is the first file a new agent should read after `AGENTS.md`.

It records current implementation truth, not aspirations. Re-check branch HEAD before modifying code because this file itself is committed after the revisions it describes.

## 1. Revision anchors

Last known functional Booking Core cleanup commit before the agent-workflow documentation block:

```text
2c6337aff199caa550317b642585fe2b8b283e5b
Remove completed Booking Core migration helpers
```

Documentation/bootstrap commits created on 17 September 2026 include:

```text
8e28c0b7b0cb72b2dc5ffcc7b9b2fd9277a9f8d1  Document Cuebooker agent architecture
0f76e204539e85c711f682f759fc00a8d3c3c601  Document Cuebooker agent workflow
e2f196c626e5346989f2c896652b9dd39626ffc3  Define Cuebooker booking ingress product
70d3f918cd804d3f9f2f0dc12e8a3dabd8cbb99c  Make Cuebooker agent guide the canonical entry point
c5d176c56371391c081ec75b27012bbe6e38be1c  Record public booking ingress architecture decisions
```

Always query the live branch HEAD before making a change; do not assume the last hash printed here is current.

## 2. Current product milestone

The deterministic private Booking Core vertical slice exists and is the operational foundation.

Current real loop:

```text
+CUE
 -> Contact / Counterparty
 -> Booking
 -> Activity
 -> Next Move
 -> Hold
 -> Overview attention
 -> Calendar projection
 -> History
```

Real Search/Filters, Archive/Restore and conflict diagnostics are also present.

CUE ID / Passport / 3D/identity layers are intentionally downstream.

## 3. Authenticated workspace state

The legacy browser-demo booking/history surface was removed from beneath the authenticated real Booking Core workspace in the functional commit preceding this documentation block.

Current expectations:

- real `BookingCoreInbox` is the operational Bookings surface;
- real Activity drives History;
- authenticated workspace no longer needs `useBookingDemo()` as product truth;
- guided tour targets real Booking Core surfaces and is disabled when no active real booking exists;
- zero-state should remain truthful rather than creating fake bookings.

`useBookingDemo()` may still exist because explicit public/demo surfaces continue to use it. Do not delete it until those routes are intentionally migrated.

## 4. Public artist/request state

Important: the public artist/request flow is NOT yet wired into real Booking Core.

Current `app/pages/artist.vue` is a fictional Nara Voss demo surface. It calls `useBookingDemo()` and stores the simulated booking in browser-local demo state.

Current `app/pages/request.vue` is also part of the promoter-side demo/follow-up simulation.

Therefore a request submitted through the current demo public form does not create the real Booking that the authenticated board reads.

This is the immediate product gap.

## 5. Newly fixed product direction: public Artist Profile + booking ingress

Canonical definition: `docs/BOOKING_INGRESS_PRODUCT.md`.

Key decisions now locked in the ADR register:

1. All ingress mechanisms converge into the same Booking Core.
2. The canonical artist public surface is intended to be `cuebooker.com/<artist-slug>`.
3. Booking capability lives inside that Artist Profile.
4. “Vista previa de mi perfil” should preview the same public profile contract/layout rather than a second design.
5. Focused/source-tagged links may use query parameters such as `?booking=1&src=instagram`.
6. The embedded widget reuses the same intake contract and backend; it is not another inbox/model.
7. `origin_channel`, `capture_method` and public entry attribution represent different facts and must remain separate.
8. A promoter does not need a Cuebooker account for the first enquiry.
9. Anonymous public intake is server/edge-side and must not write private Booking Core tables directly from the browser.
10. Anonymous intake must not impersonate the workspace owner merely to satisfy `created_by` constraints.

## 6. Entry routes covered by the product model

The model is intended to cover:

```text
Public Artist Profile form
Embedded website widget
Instagram/WhatsApp/TikTok/SoundCloud/Linktree/EPK/email/QR links -> public profile/form
Manual +CUE from WhatsApp
Manual +CUE from Instagram DM
Manual +CUE from phone / in-person / manager conversation
Automatic email import
Future share extension
Future voice/AI capture
Future API/integration adapters
```

These are not separate booking types.

## 7. Provenance semantics already in branch

Current domain/database split includes:

```text
origin_channel
capture_method
```

Known values include:

```text
origin_channel:
phone | whatsapp | email | instagram | in_person | booking_form | other

capture_method:
manual | public_form | email_import | share_extension | api | ai_capture | system
```

Legacy `source` remains for compatibility. New logic should prefer the split concepts.

Entry/referral attribution such as `instagram`, `website`, `qr` is product-defined but its final persistence shape has NOT yet been implemented. Do not overload `origin_channel` to store this referral information.

## 8. Existing identity support relevant to public profiles

Current `public.artists` already has a globally unique `slug` with normalized slug constraints.

That gives the desired public route a good identity foundation.

However root-level dynamic artist routes require a maintained reserved-slug list so application paths cannot be claimed by an artist.

Examples to reserve include:

```text
workspace
access
onboarding
app
request
api
cue-id
admin
settings
login
signup
account
auth
book
booking
artists
```

The exact list belongs in one central validation rule, not duplicated across components.

## 9. Hosting constraint discovered

Current `nuxt.config.ts` uses:

```text
nitro preset = static (unless overridden)
```

Cloudflare staging currently deploys generated `.output/public` assets.

Therefore desired arbitrary URLs like:

```text
/litus
/<any-published-artist-slug>
```

need an explicit delivery strategy before implementation is considered complete.

Possible strategies must be evaluated against current hosting (for example publish-time prerendering or a runtime public-profile route). Do not assume a dynamic Nuxt page alone will work on the static deployment.

This is part of the next architecture/impact phase.

## 10. Security/schema blocker discovered for anonymous public intake

Booking Core tables such as `bookings`, `contacts`, `counterparties`, `activities` and relationship rows currently use non-null `created_by` UUIDs linked to `auth.users`.

Current RLS insert policies are also designed around authenticated users/workspace membership.

That is correct for private workspace operations but not sufficient for a promoter submitting anonymously.

Do NOT solve this by attributing the booking/contact/activity to the owner/manager.

The next implementation must design truthful system/anonymous actor semantics and a narrow privileged command boundary.

## 11. Existing integration infrastructure that can be reused

The branch already contains Booking email infrastructure, including:

- outbound booking email support;
- inbound booking email ingestion Edge Function;
- atomic inbound email command migration;
- reply-token/threading support;
- service-role grants scoped to the email flow.

Do not conflate email reply ingestion with the new public-form ingress. Reuse common patterns/adapters where sensible, but keep the ingress semantics explicit.

## 12. Current Supabase environments

Known projects:

```text
cuebooker-staging    lycprjeuuynfzwskycwv
cuebooker-production qlocooqfdzehogbwcbhr
```

Booking Core work has been validated on staging. It has not been declared ready for production migration in this handoff.

No public-ingress schema/function migration was applied during the documentation block that created this handoff.

Do not touch production for the next ingress implementation slice.

## 13. Documentation/workflow change completed

The user supplied agent architecture/workflow documents from an unrelated professional project as a process reference.

Their useful working principles were distilled into Cuebooker-native documents:

- `docs/AGENT_ARCHITECTURE.md`
- `docs/AGENT_WORKFLOW.md`
- revised `AGENTS.md`

All Tridion/SDL/Radisson-specific rules and implementation patterns were intentionally excluded.

Important preserved principles include:

- architecture by necessity, not ceremony;
- understand product semantics before coding;
- inspect impact/contracts/debt before large implementation;
- secure/domain foundations before UI shortcuts;
- validate, do not assume;
- keep production as a separate gate;
- leave a repository handoff after meaningful work.

## 14. Immediate next implementation block

Do NOT jump to homepage redesign, CUE ID or broad AI automation.

Next block is:

```text
Public Artist Profile / Booking ingress foundation
```

Recommended execution order:

### Step A — Impact/schema design

- decide public-profile publication/read projection;
- define reserved artist slug validation;
- decide dynamic-route delivery strategy under current Cloudflare/static setup;
- define public booking intake payload;
- define entry attribution persistence;
- define truthful anonymous/system actor semantics;
- define idempotency storage/constraint;
- define artist -> active booking workspace routing, including agency behavior;
- define public-intake configuration/enablement if needed.

### Step B — Database/command boundary on staging only

- versioned migration(s);
- constraints/indexes;
- RLS preserved for private data;
- narrow service-role/internal command for public intake;
- atomic Contact/Counterparty/Booking/Activity creation;
- retry/idempotency validation;
- cross-tenant negative validation;
- advisors.

### Step C — Public edge boundary

- add public booking intake Edge Function or equivalent protected runtime;
- strict validation/length limits;
- slug resolution server-side;
- no arbitrary client `workspace_id` authorization;
- rate/abuse protection baseline;
- minimal response;
- service-role remains server-side.

### Step D — Real public Artist Profile

- replace/isolate fictional `artist.vue` demo with a real reusable public-profile surface;
- connect “Vista previa de mi perfil” to the same profile contract/layout;
- Booking CTA/form inside profile;
- low-friction fields;
- source/deep-link behavior;
- success/error/loading states;
- no local `useBookingDemo()` in the production path.

### Step E — Board proof

- submit unauthenticated request on staging;
- verify real Booking status `new`;
- verify provenance;
- verify Activity/Contact/Counterparty;
- verify the booking appears in the authenticated real board;
- verify retry does not duplicate;
- verify another tenant cannot read it;
- desktop/mobile smoke.

### Step F — Follow-up product

After the real intake slice is solid:

- promoter acknowledgement email;
- secure promoter follow-up link;
- share-link generator / QR;
- embedded widget using the same intake;
- then additional capture automation.

## 15. Homepage/marketing work intentionally deferred

The user wants the commercial site revisited because the current page/headline does not yet communicate enough power, emotion or authenticity.

That work is explicitly deferred until the entry product above is defined/implemented enough to ground the message in reality.

When it starts, evaluate it through:

- product positioning;
- ethical persuasion/decision psychology;
- marketing and advertising impact;
- emotional clarity;
- accessibility;
- authentic club/electronic-music culture;
- credibility for established and emerging DJs;
- avoidance of generic AI/SaaS language;
- strong but truthful claims.

Do not market unconnected integrations as if they are already operational.

## 16. Known stale documentation warning

`docs/BOOKING_CORE_IMPLEMENTATION_STATUS.md` was written before the latest authenticated demo cleanup and still contains language saying the old browser demo remains beneath the real workspace and that removing it is the next block.

That statement is stale.

Current truth is this handoff: authenticated workspace demo coupling was removed; the next strategic block is real public Artist Profile + public booking ingress.

A later documentation hygiene pass should reconcile the older implementation-status document without deleting its useful historical validation detail.

## 17. Production status

No production deployment/migration was performed as part of this documentation/workflow block.

The next public-ingress implementation should remain staging-only until its own production gate is explicitly satisfied.