# Cuebooker living handoff

Updated: 17 September 2026  
Branch: `feature/app-visual-system`  
Status: ACTIVE BATON PASS

Read this immediately after `AGENTS.md`. This document records current implementation truth, not aspirations. Always query the live branch HEAD before modifying code.

## 1. Current revision anchors

Booking Core cleanup anchor:

```text
2c6337aff199caa550317b642585fe2b8b283e5b
Remove completed Booking Core migration helpers
```

Workspace/public-profile integration:

```text
4a7888c63d5c57deaa6885d299c17231406d650b
Integrate public artist profile into workspace
```

Cloudflare root-artist routing fix:

```text
f32df1d4284db04ee5124af98def1b296bb7d67e
Fix public artist Pages Function asset routing
```

Temporary validation workflow removal:

```text
10cd607fb3ec51c33239cb98e5f1ea4474682b63
Remove temporary public ingress validation workflow
```

A documentation commit can exist after these hashes. Inspect live HEAD before coding.

## 2. Product truth

Cuebooker manages booking demand that an artist, manager or agency already receives. It does not promise to find gigs.

All ingress mechanisms converge into the same Booking Core. Never create separate inboxes or booking models per channel.

```text
+CUE / public profile / widget / email import / future share capture
 -> Contact / Counterparty
 -> Booking
 -> Activity
 -> Next Move
 -> Hold
 -> Overview attention
 -> Calendar projection
 -> History
```

CUE ID / Passport / 3D identity work remains downstream.

## 3. Public entry product

Canonical public identity:

```text
cuebooker.com/<artist-slug>
```

Example attributed deep link:

```text
/<artist-slug>?booking=1&src=instagram
```

Public flow:

```text
Public Artist Profile
 -> Booking Form
 -> submit-booking-request
 -> create_public_booking
 -> Contact / Counterparty
 -> Booking(status=new)
 -> inbound Activity
 -> authenticated Booking Core board
```

The promoter does not need a Cuebooker account for the first enquiry.

The future embedded website widget must reuse this same contract/backend. It is not another inbox.

## 4. Provenance semantics

Keep these facts separate:

```text
origin_channel  = where the opportunity/conversation originated
capture_method  = how it entered Cuebooker
entry_source    = public-link/form attribution when known
```

Examples:

```text
Instagram bio -> public form
origin_channel = booking_form
capture_method = public_form
entry_source = instagram

WhatsApp conversation -> +CUE manual capture
origin_channel = whatsapp
capture_method = manual

Direct email -> future automatic import
origin_channel = email
capture_method = email_import
```

Do not overload `origin_channel` with referral attribution.

## 5. Public-ingress database foundation — STAGING ONLY

Supabase staging:

```text
cuebooker-staging
project id: lycprjeuuynfzwskycwv
```

Versioned migrations applied on staging:

```text
20260917113205_add_public_booking_ingress_foundation.sql
20260917113340_harden_public_booking_submission_rls.sql
20260917113403_index_public_booking_ingress_foreign_keys.sql
20260917114038_reserve_public_artist_slugs.sql
```

Foundation includes:

- public-profile enablement;
- artist -> Booking Core workspace routing;
- entry attribution;
- idempotency storage;
- truthful system/anonymous actor semantics;
- atomic `create_public_booking` command;
- strict private Booking Core RLS;
- reserved product/application slugs.

`create_public_booking` is executable by `service_role` only. `anon` and ordinary `authenticated` users cannot call it directly.

## 6. Public Edge Functions — STAGING ONLY

Active:

```text
get-public-artist-profile
submit-booking-request
```

They intentionally use `verify_jwt = false` because they are public entry endpoints. Their security boundary is implemented in the function/database design:

- public-safe artist projection only;
- no arbitrary caller-supplied `workspace_id` authorization;
- service-role credentials remain server-side;
- payload validation and size limits;
- honeypot baseline;
- DB idempotency;
- private fees/calendar/contacts/internal notes are not exposed.

A stronger rate-limit/abuse-control layer is still a pre-production requirement.

## 7. Public frontend now in branch

Key files:

```text
app/domain/publicArtistProfile.ts
app/composables/usePublicBooking.ts
app/composables/usePublicArtistPublishing.ts
app/components/PublicBookingForm.vue
app/components/PublicArtistProfile.vue
app/components/PublicProfilePublishingControls.vue
app/pages/[slug].vue
functions/[slug].js
```

`PublicBookingForm.vue` is deliberately low-friction. Sparse requests are valid; do not turn it into a CRM-length form.

The authenticated Profile preview and the public visitor profile use the same reusable `PublicArtistProfile` component. Do not reintroduce a second bespoke preview design.

Private booking terms, fees, internal notes, contacts, negotiation history and private calendar data must stay outside the public profile contract.

## 8. Workspace publication controls

The authenticated Profile surface now separates:

```text
Perfil publicado / privado
Aceptar solicitudes / booking cerrado
```

Behavior:

- publication state loads via `usePublicArtistPublishing()`;
- unpublishing closes public booking acceptance first;
- opening booking uses the real Booking Core workspace route;
- preview/copy/open actions use the selected artist slug;
- staging/PR preview links use the current browser origin;
- managed-artist switching clears stale public/workspace route state before reloading;
- authenticated media is reused for preview without exposing private Booking Core fields.

## 9. Cloudflare Pages root artist routing

The Nuxt app is still generated as static output. Root artist URLs are handled by `functions/[slug].js`.

Important implementation detail discovered during smoke testing: Cloudflare `ASSETS.fetch()` must request the pretty path (`/200`, fallback `/`) rather than physical asset names such as `/200.html` / `/index.html` inside the Pages Function.

The broken version produced a valid Nuxt shell with HTTP 404. Commit `f32df1d...` fixed this.

Validated on the deployed PR preview while the staging artist was temporarily published:

- `/<slug>` returned HTTP 200;
- artist title metadata was injected;
- Nuxt shell loaded;
- nonexistent artist slug returned 404;
- reserved `/workspace` continued to the normal application route rather than being treated as an artist profile.

## 10. End-to-end public booking proof — COMPLETED ON STAGING

Staging fixture used only for the smoke:

```text
artist_id: 5a89bb6b-48a1-449e-9ead-b44094be6287
slug: lits
workspace_id: 81c84e12-b895-43f4-84ac-5ca417ed8067
```

A real HTTP request was sent through deployed `submit-booking-request` with `entry_source=instagram`.

Observed result:

```text
first request -> 201, created=true
same idempotency key retry -> 200, created=false
same Booking reference returned both times
```

Database verification showed exactly one real Booking with:

```text
status = new
source = booking_form
origin_channel = booking_form
capture_method = public_form
entry_source = instagram
created_by = null
```

The request also created the expected Contact, Counterparty and exactly one inbound Activity. The Booking was readable under the workspace owner's authenticated RLS path, which is the same data path used by the real `BookingCoreInbox`.

Therefore the deployed ingress chain is proven through to real Booking Core persistence and board-readable data.

The smoke Booking/submission/contact/counterparty fixture was then removed.

## 11. Staging cleanup — COMPLETED

The test artist was restored after the smoke to:

```text
public_profile_enabled = false
accepting_requests = false
```

Do not leave staging artist fixtures published after future smoke tests.

## 12. CI / preview validation

Normal PR workflows have passed after the integration and routing fix.

Latest clean pre-documentation HEAD validated:

```text
10cd607fb3ec51c33239cb98e5f1ea4474682b63
```

For that revision:

- PR `CI`: success;
- PR `Deploy Staging`: success;
- temporary public-ingress validation workflow had already been removed;
- no production deployment was performed.

PR preview alias remains:

```text
https://pr-75.cuebooker-staging.pages.dev
```

Always resolve the live HEAD and latest workflow run before relying on this hash.

## 13. Supabase security status

Current staging security advisor warning:

```text
Leaked Password Protection Disabled
```

This is a project-level Auth configuration warning and predates the public-ingress slice. The public-ingress schema work itself did not introduce a new advisor warning.

Do not weaken RLS or expose service-role credentials to resolve public-entry issues.

## 14. Exact next product block

The original public Artist Profile -> real Booking Core ingress proof is now complete on staging.

Next work should be one of the deliberate follow-ups, in this order unless product priorities change:

1. promoter acknowledgement email after successful public enquiry;
2. secure promoter follow-up link/thread view;
3. share-link generator with explicit Instagram / WhatsApp / website / EPK / QR attribution;
4. embeddable widget using the exact same public intake contract;
5. additional email/share/AI capture automation.

Before production, also add stronger abuse/rate limiting for anonymous intake and perform an explicit production-readiness review.

Do not jump to CUE ID/3D work as a substitute for finishing operational entry/follow-up.

## 15. Homepage/marketing redesign remains deferred

The commercial home/headline still needs a later redesign for stronger product positioning, emotional clarity and authentic club/electronic-music culture.

Do that only when claims can be grounded in real shipped behavior. Avoid generic AI/SaaS language and vanity-metric framing.

## 16. Documentation workflow rule

Meaningful implementation blocks must finish by updating this handoff with:

- live functional commit;
- what is actually implemented;
- what was validated and where;
- what remains unverified;
- exact next step;
- production state.

## 17. Production gate

Production Supabase:

```text
qlocooqfdzehogbwcbhr
```

No public-ingress migration, Edge Function deployment, publication toggle or Cloudflare production release from this block was authorized or performed on production.

Remain staging-only until abuse controls, acknowledgement/follow-up decisions, final UX smoke and explicit production review are complete.
