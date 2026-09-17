# Cuebooker living handoff

Updated: 17 September 2026  
Branch: `feature/app-visual-system`  
Status: ACTIVE BATON PASS

Read this immediately after `AGENTS.md`. This document records current implementation truth, not aspirations. Always query live branch HEAD before modifying code.

## 1. Product truth

Cuebooker manages booking demand that an artist, manager or agency already receives. It does not promise to find gigs.

All ingress mechanisms converge into the same Booking Core. Never create separate inboxes or booking models per channel.

```text
+CUE / public Artist Profile / widget / email import / future smart capture
 -> Contact / Counterparty
 -> Booking
 -> Activity
 -> Next Move
 -> Hold
 -> Overview attention
 -> Calendar projection
 -> History
```

CUE ID / Passport / 3D identity remain downstream.

The public-entry product direction is capability-driven rather than screen-driven:

```text
Input
 -> Normalize
 -> Interpret
 -> Validate
 -> Confirm
 -> Booking Core
 -> Activity
 -> Notify
```

Future voice/text/WhatsApp/email capture must reuse this pipeline rather than create parallel booking models.

## 2. Canonical public product

Canonical public identity:

```text
cuebooker.com/<artist-slug>
```

Attributed deep link example:

```text
/<artist-slug>?booking=1&src=instagram
```

The authenticated Profile preview and public visitor profile reuse the same `PublicArtistProfile` component. Do not reintroduce a separate bespoke preview.

The public Artist Profile is intended to become the artist's professional public landing surface, with booking as a capability inside it rather than a disconnected cold form.

Promoters do not need a Cuebooker account.

Publication controls remain separate:

```text
Perfil publicado / privado
Aceptar solicitudes / booking cerrado
```

Private booking terms, fee thresholds, contacts, internal notes, negotiation history, holds, Next Moves and private calendar data stay outside the public profile contract.

## 3. Provenance semantics

Keep separate:

```text
origin_channel  = where the opportunity/conversation originated
capture_method  = how it entered Cuebooker
entry_source    = public-link/form attribution when known
```

Example:

```text
Instagram bio -> public form
origin_channel = booking_form
capture_method = public_form
entry_source = instagram
```

Do not overload `origin_channel` with referral attribution.

## 4. Public-ingress database foundation — STAGING ONLY

Supabase staging:

```text
cuebooker-staging
project: lycprjeuuynfzwskycwv
```

Applied/versioned public-ingress migrations:

```text
20260917113205_add_public_booking_ingress_foundation.sql
20260917113340_harden_public_booking_submission_rls.sql
20260917113403_index_public_booking_ingress_foreign_keys.sql
20260917114038_reserve_public_artist_slugs.sql
20260917123613_add_public_booking_follow_up.sql
20260917123841_allow_system_origin_inbound_email_threads.sql
```

Real public-ingress smoke has proven:

```text
Public Artist Profile
 -> Booking Form
 -> submit-booking-request
 -> create_public_booking
 -> Contact / Counterparty
 -> Booking(status=new)
 -> inbound Activity
 -> authenticated Booking Core
```

Idempotent retry with the same request ID returns the same Booking rather than duplicating it.

Expected provenance was verified:

```text
status = new
origin_channel = booking_form
capture_method = public_form
entry_source = website / instagram depending link
created_by = null
```

## 5. Public Booking Form V2 — IMPLEMENTED ON BRANCH / PR PREVIEW

Functional implementation commits culminate at:

```text
cd54704b6aec843017252ce06b12f311aca7d30a
```

Files changed in this slice:

```text
app/components/PublicBookingForm.vue
app/components/PublicArtistProfile.vue
app/components/PublicBookingWidget.vue
app/pages/[slug].vue
```

Implemented behavior:

- native date/calendar field remains the date input surface;
- client-side date validation now rejects malformed dates before HTTP submission;
- event date cannot be in the past;
- event date is bounded to a generous ten-year future window so accidental years such as `12026` cannot reach the backend;
- inline field-level validation for required name, email and proposal plus country/date/offer/currency;
- collapsed optional details auto-open when one of their fields contains the first validation error;
- focus moves to the first invalid field;
- accessible `aria-invalid` / `aria-describedby` relationships are present;
- form data is preserved when the backend fails;
- backend error codes are translated into promoter-facing messages rather than exposing technical codes;
- success copy distinguishes `confirmationSent=true` from a saved Booking whose confirmation email could not be delivered;
- the public Booking reference is surfaced after successful submission when provided by the backend;
- behavior is shared by public profile and iframe widget.

Validation for this slice:

```text
CI run: 35276181812
Run tests: success
Generate production build: success

Deploy Staging / PR preview run: 35276181813
Generate preview build: success
Deploy PR preview to Cloudflare Pages: success
```

Visual/mobile smoke of the new field-level states is still required before calling the V2 UX closed.

## 6. Secure promoter follow-up — PROVEN ON STAGING

Product rule:

- secure link lets a promoter read a safe booking summary/status/conversation and reply;
- promoter cannot directly mutate internal `Booking.status`;
- external reply becomes inbound Activity in the same Booking Core;
- there is no second promoter booking model.

`public_booking_follow_up_access` stores only the SHA-256 hash of the secure bearer token. The raw token is not persisted in Booking Core, Activity or stored email body.

`/request?token=...` is the real promoter follow-up surface.

A real staging smoke on 17 September proved:

```text
public form
 -> real Booking
 -> Brevo acknowledgement email
 -> secure follow-up link
 -> promoter reply on /request
 -> inbound Activity on same Booking
```

Observed Activity thread contained:

- initial public-form inbound Activity;
- outbound acknowledgement email Activity;
- secure-link inbound promoter reply Activity.

Retry-safe follow-up idempotency had already been proven separately.

## 7. Acknowledgement email — PROVEN ON STAGING

Staging now has a working Brevo API key for `submit-booking-request`.

A real delivery smoke succeeded:

```text
email_messages.status = sent
provider = brevo
failure_code = null
from_email = bookings@cuebooker.com
provider_message_id = Brevo SMTP relay message id
```

The public API returned a successful Booking while Brevo accepted the acknowledgement message.

Semantics remain:

- acknowledgement is a system action with `created_by = null`;
- `purpose = public_acknowledgement`;
- provider failure never rolls back the Booking;
- secure follow-up token is 256-bit random and only its hash is persisted;
- raw secure URL exists only in the provider payload in memory;
- Reply-To uses `booking+<reply_token>@reply.cuebooker.com`.

## 8. Direct email reply — PARTIALLY PROVEN, ONE GATE OPEN

The direct Gmail reply path has been narrowed precisely.

Proven:

```text
Cuebooker acknowledgement
 -> Reply-To booking+<uuid>@reply.cuebooker.com
 -> Gmail sends to that exact recipient
 -> Brevo inbound receives the message
 -> Brevo marks it received
 -> Brevo marks it processed
```

Brevo inbound event observed:

```text
recipient = booking+<reply_token>@reply.cuebooker.com
logs = received -> processed -> webhookFailed
```

The inbound webhook exists with:

```text
type = inbound
event = inboundEmailProcessed
domain = reply.cuebooker.com
endpoint = https://lycprjeuuynfzwskycwv.supabase.co/functions/v1/ingest-booking-email
header = x-cuebooker-webhook-secret
```

`reply.cuebooker.com` is configured for inbound reception and Brevo demonstrably receives the mail, so do not reopen Gmail/Reply-To/MX investigation unless new evidence contradicts this.

`ingest-booking-email` is ACTIVE on staging and currently reports `verify_jwt = false`; custom webhook secret validation happens in the function body.

Exact next diagnostic when a Mac/terminal is available:

```text
1. generate/choose one webhook secret;
2. set the exact same value in Supabase staging as CUEBOOKER_INBOUND_WEBHOOK_SECRET;
3. set the exact same value in Brevo webhook header x-cuebooker-webhook-secret;
4. POST directly to ingest-booking-email with {"items":[]} and that header;
5. expected response: {"accepted":0,"ignored":0};
6. only after this succeeds, send a fresh Gmail reply and verify inbound email_messages + Activity.
```

Do not keep re-sending email replies before the direct secret handshake test passes.

Security note: webhook/API secret values were exposed during interactive setup. Rotate secrets before production readiness even if staging testing continues with the current values temporarily.

## 9. Share links and widget — IMPLEMENTED FOUNDATION

Share/distribution is not a separate booking model. Existing attributed surfaces include Instagram, WhatsApp, website, EPK, QR context, email and link-in-bio URLs.

The iframe widget reuses the same public route/component/intake endpoint, e.g. conceptually:

```text
/<slug>?embed=1&booking=1&src=website
```

Product direction for the next distribution iteration:

- explain use cases rather than presenting a wall of URLs;
- make Instagram and WhatsApp Business destinations explicit;
- preserve `entry_source` attribution;
- public Artist Profile remains the canonical landing surface;
- widget/profile/button variants must all feed the same intake contract.

## 10. Product direction captured, NOT FOR IMMEDIATE IMPLEMENTATION

These are strategic constraints for future sequencing, not permission to open parallel workstreams now.

### Smart Capture / interpretation

Voice and free text should become one Capture Engine rather than separate novelty features.

Future inputs may include:

- typed free text;
- dictated voice;
- pasted WhatsApp message;
- pasted/imported email.

The engine should propose structured booking fields, show uncertainty/missing information and require human confirmation before writing Booking Core. AI must not silently invent booking facts.

### Notification layer

A booking product cannot rely on users opening the app to discover new demand.

Preferred sequencing:

```text
email notifications first
 -> in-product notification center
 -> Web Push/PWA where justified
```

Useful events include new booking request, promoter reply and meaningful unresolved follow-up.

### Internal Cuebooker admin / back office

Future internal admin should cover:

- platform/user/workspace health;
- support/incidents;
- operational KPIs;
- email/webhook delivery;
- logs and correlation IDs;
- error diagnostics;
- abuse/rate limiting;
- alerts requiring intervention;
- audited admin actions.

Observability data should be captured incrementally now even though the admin UI is deferred.

### Friendly system feedback

Treat human feedback as a cross-product rule, not a one-off feature:

- field error -> explain the field problem;
- save success -> confirm clearly;
- send success -> confirm clearly;
- retryable failure -> preserve user work and explain the next action;
- technical/provider detail -> logs/admin, not promoter-facing copy.

## 11. Root routing and static deployment

Root artist URLs under static Nuxt are resolved by `functions/[slug].js` on Cloudflare Pages. `ASSETS.fetch()` must use the pretty `/200` path rather than `/200.html`.

Previously validated:

- real artist slug -> HTTP 200 + artist metadata + Nuxt shell;
- missing slug -> 404;
- reserved `/workspace` -> application route, never artist resolution.

PR #75 remains the staging preview vehicle.

## 12. Security / operational follow-up

Before production:

- rotate Brevo API/webhook secrets that were exposed during setup;
- finish direct inbound email webhook smoke;
- strengthen anonymous rate/abuse protection for public intake and follow-up;
- perform visual desktop/mobile smoke of public profile, form, request page and widget;
- review CSP/frame policy for widget on external origins;
- run Supabase security/performance advisors;
- explicitly review production migrations/functions/deployment.

Existing Supabase project-level security warning remains:

```text
Leaked Password Protection Disabled
```

Existing Edge Functions still use legacy `SUPABASE_SERVICE_ROLE_KEY`; migrate to Supabase's current secret-key model as a deliberate infrastructure task, not mixed into a product slice.

## 13. Exact next product work

Current block order is intentional. Do not jump ahead because downstream ideas are documented.

```text
1. visually smoke Public Booking Form V2 on desktop/mobile PR preview;
2. fix any V2 UX regressions found in that smoke;
3. complete direct email reply webhook handshake when terminal access is available;
4. close/gate Public Booking Form V2;
5. then open Smart Capture text + voice as the next distinct feature block;
6. after Capture Engine, continue Public Artist Profile / distribution refinement;
7. commercial homepage/marketing redesign remains downstream of operational product truth.
```

## 14. Documentation workflow rule

Every meaningful implementation block must finish by updating this handoff with:

- live functional commit;
- actual implementation state;
- validation and environment;
- remaining unverified work;
- exact next step;
- production state.

## 15. Production gate

Production Supabase:

```text
qlocooqfdzehogbwcbhr
```

No migration, Edge Function deployment, publication toggle or Cloudflare production release from this public-entry/follow-up work has been performed on production.

Remain staging-only until public-entry UX, direct inbound reply, abuse controls and explicit production review are complete.
