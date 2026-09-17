# Cuebooker living handoff

Updated: 17 September 2026  
Branch: `feature/app-visual-system`  
Status: ACTIVE BATON PASS

Read this immediately after `AGENTS.md`. This document records current implementation truth, not aspirations. Always query live branch HEAD before modifying code.

## 1. Product truth

Cuebooker manages booking demand that an artist, manager or agency already receives. It does not promise to find gigs.

All ingress mechanisms converge into the same Booking Core. Never create separate inboxes or booking models per channel.

```text
+CUE / public Artist Profile / widget / email import / future share capture
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

## 2. Public entry product — implemented on staging

Canonical public identity:

```text
cuebooker.com/<artist-slug>
```

Attributed deep link example:

```text
/<artist-slug>?booking=1&src=instagram
```

Real public flow:

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

Promoters do not need a Cuebooker account.

The future embedded widget must reuse this same intake contract/backend. It is not another inbox or booking type.

## 3. Provenance semantics

Keep separate:

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
```

Do not overload `origin_channel` with referral attribution.

## 4. Public profile and workspace integration

The authenticated Profile preview and the public visitor profile use the same `PublicArtistProfile` component. Do not reintroduce a separate bespoke preview.

Publication controls are separate:

```text
Perfil publicado / privado
Aceptar solicitudes / booking cerrado
```

Private booking terms, fee thresholds, contacts, internal notes, negotiation history, holds, Next Moves and private calendar data stay outside the public profile contract.

Root artist URLs under static Nuxt are resolved by `functions/[slug].js` on Cloudflare Pages. The important routing fix is that `ASSETS.fetch()` uses the pretty `/200` path rather than `/200.html`.

Validated previously on PR preview:

- real artist slug -> HTTP 200 + artist metadata + Nuxt shell;
- missing slug -> 404;
- reserved `/workspace` -> application route, never artist resolution.

## 5. Public-ingress database foundation — STAGING ONLY

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
```

The deployed public-ingress path has already been HTTP-smoked end to end. A first request created a real Booking and the same idempotency key returned the same Booking without duplication.

Expected provenance was verified:

```text
status = new
origin_channel = booking_form
capture_method = public_form
entry_source = instagram
created_by = null
```

The resulting Booking was readable through the authenticated workspace RLS path used by `BookingCoreInbox`.

## 6. Secure promoter follow-up — IMPLEMENTED ON STAGING

Product decision:

- the secure link lets a promoter read a safe booking summary/status/conversation and reply;
- it does **not** let a promoter directly set internal `Booking.status`;
- an external reply becomes an inbound Activity in the same Booking Core;
- no second promoter-side booking model exists.

New applied/versioned migrations:

```text
20260917123613_add_public_booking_follow_up.sql
20260917123841_allow_system_origin_inbound_email_threads.sql
```

### Secure-link model

`public_booking_follow_up_access` stores:

- workspace/booking/contact relation;
- only SHA-256 of the bearer token;
- expiry;
- revoked/last-used timestamps.

The raw token is never persisted in Booking Core, Activity or `email_messages`.

Current validity for generated acknowledgement links is 180 days.

`public_booking_follow_up_submissions` provides reply idempotency.

Both tables have RLS enabled and explicit no-client-access policies; service role is the narrow server boundary.

### Public follow-up RPCs

`get_public_booking_follow_up(token_hash)` returns only a safe projection:

- artist stage name + slug;
- promoter contact name;
- booking public status/event/venue/location/date/current offer;
- conversation items safe for the promoter.

It does not expose workspace IDs, internal notes, private fee policy, calendar, holds or operational Next Moves.

`append_public_booking_follow_up_reply(...)`:

- validates active/unexpired token;
- is idempotent by access + request UUID;
- creates only inbound Activity;
- uses `created_by = null` / no fake user;
- does not mutate booking status.

Archived Booking Core protection was refined narrowly so trusted `service_role` inbound public-follow-up Activity can still preserve an external reply, alongside the existing trusted inbound-email path.

## 7. Promoter follow-up Edge/API — STAGING ONLY

New deployed Edge Function:

```text
booking-follow-up
```

It intentionally has `verify_jwt = false` because the secure bearer token is the authorization mechanism.

Behavior:

```text
GET  /booking-follow-up?token=<raw>
 -> SHA-256 in edge function
 -> safe follow-up projection

POST /booking-follow-up
 { token, requestId, bodyText }
 -> hashed token + idempotency fingerprint
 -> inbound Activity
 -> refreshed safe thread
```

CORS is restricted to Cuebooker production/staging/Pages preview origins plus localhost development.

Frontend contract/files:

```text
app/domain/publicBookingFollowUp.ts
app/services/publicBookingFollowUpApi.ts
app/pages/request.vue
```

`/request?token=...` is now the real promoter follow-up surface. The old `useBookingDemo()` promoter simulation has been removed from this route.

The page includes:

- public status language;
- safe event summary;
- conversation thread;
- reply composer;
- retry-safe reply request IDs;
- invalid/expired link states;
- ES/EN;
- `noindex,nofollow,noarchive` and no-referrer metadata;
- link back to the artist profile.

It intentionally contains no external “confirm/reject booking” action.

## 8. Acknowledgement email after public enquiry

`submit-booking-request` now attempts an automatic acknowledgement after Booking creation/reuse.

New semantics:

- acknowledgement email is a **system** message with `created_by = null`;
- authenticated/manual outbound messages still require `created_by = auth.uid()` and `purpose = conversation`;
- acknowledgement has `purpose = public_acknowledgement`;
- at most one acknowledgement email record exists per Booking;
- a 256-bit random follow-up token is generated; only its hash is stored;
- the raw secure URL exists only in the provider payload in memory;
- the stored email/Activity body does not contain the bearer secret;
- Reply-To continues to use the existing `booking+<reply_token>@...` email-thread mechanism;
- direct email replies to a system-origin acknowledgement now preserve `created_by = null` end to end rather than impersonating an owner.

`PublicBookingForm` and the public Artist Profile now consume `confirmationSent` explicitly:

- `true`: tell the promoter a confirmation email with secure follow-up link was sent;
- `false`: truthfully say the booking is registered even though confirmation delivery was unavailable.

A provider/email failure never rolls back the Booking.

## 9. Validation performed for secure follow-up

### Database/service-role contract

A disposable staging Booking and known test token were used.

Validated:

- token hash resolves to safe projection;
- initial public-form message is visible;
- secure-link reply creates inbound Activity;
- refreshed thread contains that reply;
- retry with the same reply request ID does not create a duplicate.

### Real HTTP public submit

Temporary GitHub workflow `Temp public follow-up smoke` performed real public HTTP calls against deployed staging `submit-booking-request`.

Observed:

```text
first request -> 201
accepted = true
created = true

same request ID retry -> 200
accepted = true
created = false
same Booking reference
```

The temporary workflow completed successfully and has been removed from the branch.

### Staging email-provider result

The smoke returned:

```text
confirmationSent = false
```

Database diagnosis:

```text
email purpose = public_acknowledgement
status = failed
failure_code = provider_not_configured
created_by = null
```

This means the new acknowledgement path reached the provider gate correctly, but the deployed `submit-booking-request` function does not currently receive `BREVO_API_KEY` in staging.

The unusable secure access generated for that failed delivery was revoked automatically.

Do not claim acknowledgement email delivery is end-to-end proven until staging is given the provider secret and a safe delivery smoke succeeds.

## 10. Staging cleanup — COMPLETED

All disposable secure-follow-up and HTTP-smoke Bookings/Contacts were deleted.

The fixture artist is restored to:

```text
slug = lits
public_profile_enabled = false
accepting_requests = false
```

Do not leave staging fixtures publicly enabled after future smoke tests.

## 11. Security/advisors

Latest staging Security Advisor adds no new schema warning. Existing project-level warning remains:

```text
Leaked Password Protection Disabled
```

Performance advisor reports unused indexes on the young staging schema; do not remove them without real workload evidence.

Never expose service-role credentials or weaken RLS to simplify public follow-up.

Technical follow-up: existing Edge Functions still use legacy `SUPABASE_SERVICE_ROLE_KEY`. Migrate the project to the current Supabase secret-key model as a deliberate infrastructure task rather than mixing it into this product slice.

## 12. Exact next product work

Finish/gate the current follow-up block before production:

1. make Brevo/provider secret available to the staging acknowledgement runtime and run one safe delivery smoke;
2. visually smoke `/request?token=...` on desktop/mobile through the PR preview;
3. add stronger rate/abuse protection to anonymous public intake and follow-up reply endpoints;
4. explicit production-readiness review.

After that, continue the public-entry product in this order:

1. share-link generator with explicit Instagram / WhatsApp / website / EPK / QR attribution;
2. QR generation;
3. embeddable widget using the exact same intake contract;
4. additional email/share/AI capture automation.

Do not create a new Booking Core model for any of these.

## 13. Homepage/marketing redesign remains deferred

The user wants the commercial home/headline revisited because it still lacks product power, emotional impact and authentic electronic-music identity.

Do this after the entry/follow-up product is sufficiently operational to market truthfully. Evaluate through product positioning, ethical persuasion/decision psychology, emotional clarity, accessibility, advertising impact and authentic club culture. Avoid generic AI/SaaS language and vanity-metric framing.

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

No migration, Edge Function deployment, publication toggle or Cloudflare production release from the public follow-up block has been performed on production.

Remain staging-only until provider delivery, visual follow-up UX, abuse controls and explicit production review are complete.
