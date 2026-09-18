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

Attributed deep-link example:

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

## 4. Public-ingress foundation — STAGING ONLY

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

Real public-ingress smoke proved:

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

## 5. Public Booking Form V2 — IMPLEMENTED / PR PREVIEW

Functional implementation culminated at:

```text
cd54704b6aec843017252ce06b12f311aca7d30a
```

Files:

```text
app/components/PublicBookingForm.vue
app/components/PublicArtistProfile.vue
app/components/PublicBookingWidget.vue
app/pages/[slug].vue
```

Implemented behavior:

- native date/calendar input;
- malformed/past/unreasonably-future dates blocked client-side;
- 10-year future guardrail prevents accidental years such as `12026` reaching backend;
- inline validation for required name/email/proposal plus country/date/offer/currency;
- optional details auto-open when first invalid field lives there;
- focus moves to first invalid field;
- `aria-invalid` / `aria-describedby` relationships;
- form data preserved after backend failure;
- technical API errors translated into promoter-facing messages;
- success state distinguishes saved + confirmation email sent from saved + email delivery unavailable;
- public Booking reference surfaced when returned;
- same behavior shared by public profile and widget.

Validation:

```text
CI run 35276181812: tests + production build success
Deploy run 35276181813: PR preview success
```

Visual/mobile smoke of field-level states is still required before calling V2 UX fully closed.

## 6. Secure promoter follow-up — PROVEN ON STAGING

Product rule:

- secure link lets a promoter read a safe booking summary/status/conversation and reply;
- promoter cannot mutate internal `Booking.status`;
- external reply becomes inbound Activity in the same Booking Core;
- there is no second promoter booking model.

`public_booking_follow_up_access` stores only the SHA-256 hash of the secure bearer token. The raw token is not persisted in Booking Core, Activity or stored email body.

`/request?token=...` is the real promoter follow-up surface.

A real staging smoke proved:

```text
public form
 -> real Booking
 -> Brevo acknowledgement email
 -> secure follow-up link
 -> promoter reply on /request
 -> inbound Activity on same Booking
```

Observed Activity thread contained the initial public-form message, outbound acknowledgement email and secure-link inbound promoter reply.

## 7. Acknowledgement email — PROVEN ON STAGING

Staging has a working Brevo API key for `submit-booking-request`.

A real delivery smoke succeeded:

```text
email_messages.status = sent
provider = brevo
failure_code = null
from_email = bookings@cuebooker.com
provider_message_id = Brevo SMTP relay message id
```

Semantics:

- acknowledgement is system-origin with `created_by = null`;
- `purpose = public_acknowledgement`;
- provider failure never rolls back Booking;
- secure follow-up token is random 256-bit and only its hash persists;
- raw secure URL exists only in provider payload memory;
- Reply-To uses `booking+<reply_token>@reply.cuebooker.com`.

## 8. Direct email reply — PARTIALLY PROVEN, ONE GATE OPEN

Proven:

```text
Cuebooker acknowledgement
 -> Reply-To booking+<uuid>@reply.cuebooker.com
 -> Gmail sends to exact recipient
 -> Brevo inbound receives message
 -> Brevo marks received
 -> Brevo marks processed
```

Observed Brevo path then ends with:

```text
received -> processed -> webhookFailed
```

Inbound webhook:

```text
type = inbound
event = inboundEmailProcessed
domain = reply.cuebooker.com
endpoint = https://lycprjeuuynfzwskycwv.supabase.co/functions/v1/ingest-booking-email
header = x-cuebooker-webhook-secret
```

`reply.cuebooker.com` and Gmail/MX are therefore not the current investigation target. `ingest-booking-email` is ACTIVE and currently deployed with `verify_jwt = false`.

Exact next diagnostic when terminal access is available:

```text
1. use one webhook secret;
2. set exact same value in Supabase staging as CUEBOOKER_INBOUND_WEBHOOK_SECRET;
3. set same value in Brevo x-cuebooker-webhook-secret header;
4. POST directly to ingest-booking-email with {"items":[]};
5. expected: {"accepted":0,"ignored":0};
6. only then send a fresh Gmail reply and verify inbound email_messages + Activity.
```

Do not keep re-sending direct email replies before the handshake test passes.

Rotate exposed setup secrets before production readiness.

## 9. Distribution / Share UX — IMPLEMENTED ON BRANCH / PR PREVIEW

Latest functional commit:

```text
c336ebd946c9709f59524419fa3648471f3b0598
```

File:

```text
app/components/PublicProfilePublishingControls.vue
```

The previous technical wall of URLs has been replaced with use-case-driven distribution cards grouped as:

```text
Perfil
Solicitudes directas
Tu web
```

Current supported entry surfaces in the UI:

- public profile;
- direct booking;
- Instagram;
- WhatsApp Business;
- email;
- EPK;
- link-in-bio;
- QR-attributed link;
- website link;
- iframe widget code.

Each card explains where/why to use the entry point and shows attribution semantics rather than exposing a raw URL as the primary UX. Copy actions remain explicit (`Copiar enlace` / `Copiar código`). All attributed links still converge into the same public intake contract and preserve `entry_source`.

Important: the QR card currently copies a QR-attributed URL only. Actual QR image generation remains a separate future slice and is not falsely presented as implemented.

Validation:

```text
CI run 35277735399: tests + production build success
Deploy run 35277734983: PR preview success
```

Visual/mobile review of the expanded distribution panel is still required.

## 10. Inbound email observability foundation — IMPLEMENTED ON BRANCH

Operational hardening commits:

```text
b79af6c4785434721a270380ab2fc30165a36c11
4b3c5842294e1362190fdf6d04fc6249b998c0b0
```

Changes:

- `supabase/config.toml` now explicitly versions `[functions.ingest-booking-email] verify_jwt = false`, matching the deployed staging contract so future deploys do not depend on dashboard-only state;
- every inbound webhook invocation receives a Cuebooker request/correlation ID;
- responses expose that ID through `x-cuebooker-request-id` and response JSON;
- structured JSON log events distinguish method rejection, missing configuration, webhook auth failure, invalid JSON, empty batch, ignored-item reasons, accepted items, completed batch and failed batch;
- ignored reasons are explicit without logging message bodies, email addresses, webhook secrets or other high-risk payload content;
- accepted Activity metadata records `ingest_request_id` so future admin/support tooling can correlate a stored booking event with Edge Function logs;
- errors still return promoter/provider-safe codes while technical detail remains server-side.

Validation:

```text
CI run 35278941346: tests + production build success
Deploy/preview run 35278941375: preview build success; Cloudflare PR deployment initiated from same commit
```

This improves diagnosability of the existing inbound flow but does not replace the pending direct webhook-secret handshake. Production remains untouched.

## 11. Notification foundation — IMPLEMENTED ON STAGING

Migration / functional commit:

```text
485dd6dd624fc0d34417ecd8bca8ec517f086ca7
supabase/migrations/20260917232000_add_notification_foundation.sql
```

Staging migration applied successfully to:

```text
lycprjeuuynfzwskycwv
```

Current model:

- `public.notifications` is the shared user-facing notification event stream;
- current event kinds are `booking_request_received` and `promoter_reply_received`;
- one notification row is created per eligible workspace member (`owner/admin/manager/editor`), excluding passive `viewer` members;
- dedupe is enforced per workspace + recipient + event key;
- notifications reference the Booking and optional Activity instead of copying conversation content;
- metadata carries structured context only;
- RLS allows a signed-in user to read only their own notifications;
- authenticated clients receive only `SELECT` plus column-level `UPDATE(read_at)`, so notification identity/content cannot be rewritten by the browser;
- indexes cover recipient timeline, unread recipient timeline and booking lookup.

Automatic creation now happens at the domain boundary:

```text
new public_form Booking
 -> booking_request_received

external inbound Activity
 ingested_by = public_follow_up | brevo_inbound
 -> promoter_reply_received
```

The initial public-form Activity does not create a duplicate reply notification.

Validation:

```text
CI run 35279648215: success
Deploy Staging run 35279648389: success
staging RLS: enabled
recipient SELECT/UPDATE policies: present
recipient/unread/booking indexes: present
booking + external-reply triggers: present
```

No fake Booking was created solely for this validation. The next real public booking or promoter reply will exercise the triggers naturally.

This is intentionally channel-neutral. Email delivery, in-product notification center and future Web Push should consume this same notification event model rather than create separate booking logic.

## 12. Notification email templates + delivery queue — IMPLEMENTED ON STAGING

Functional commits:

```text
9862c9c7ac448fce9cfbe4c8b5370301dc2e6cc9
cd1de87b82893d115396d735fca91b03ea59150d
153bf42c3206877707f350e757ba7242c2358e39
```

Files:

```text
supabase/migrations/20260917234500_add_notification_email_delivery_queue.sql
supabase/functions/_shared/notificationEmailTemplates.ts
tests/notificationEmailTemplates.test.ts
```

Staging migration applied successfully to `lycprjeuuynfzwskycwv`.

Delivery model:

- notification events and email delivery attempts are separate records;
- every new notification automatically enqueues one `notification_email_deliveries` row;
- delivery state supports `queued / processing / sent / failed`;
- attempts, provider IDs, error code, retry timestamp and sent/failed timestamps are tracked;
- one delivery row per notification prevents retry duplication;
- queue indexes support ready/retry scans and recipient diagnostics;
- the queue is service-role-only; no browser RLS policy exposes operational delivery state.

Template layer:

- two initial templates: `booking_request_received` and `promoter_reply_received`;
- ES/EN copy;
- subject + preheader + plain-text fallback + branded HTML;
- contextual artist/contact/event/venue/city/date values;
- CTA points back to the Booking rather than reproducing the conversation;
- dynamic HTML content is escaped;
- promoter message body is intentionally not copied into notification email templates.

Current visual language is deliberately restrained: dark Cuebooker shell, lime accent, one clear CTA, short contextual copy.

Validation:

```text
CI run 35281897382: tests + production build success
notification template unit tests: success
staging queue RLS: enabled
notifications_enqueue_email_delivery trigger: present
ready + recipient queue indexes: present
```

No delivery dispatcher/cron is wired yet, so queued rows are not claimed/sent automatically in this slice. The next backend step is an idempotent dispatcher that resolves recipient email + Booking context, renders these templates, sends through Brevo and updates the delivery row. Do not send directly from the notification trigger.

## 13. Notification email dispatcher — IMPLEMENTED ON STAGING

Functional commits:

```text
5fad91b84d7dbb98b7e0e0c6c081d2e2a31a7e5d
bf7a42900153af1d74b6bb96a048337d8d6038a5
c0a09f3ac18ce803855facd40449edbcce1ccb72
5e8d5d7b8cbcdefa843a3bbcb2aaa1f47e7f2a6f
```

Files:

```text
supabase/migrations/20260918003000_add_notification_email_claim.sql
supabase/functions/dispatch-notification-emails/index.ts
supabase/config.toml
app/pages/workspace.vue
```

Staging state:

- service-role-only `claim_notification_email_deliveries(batch_size)` uses `FOR UPDATE SKIP LOCKED`;
- jobs can be reclaimed after 15 minutes in stale `processing`;
- max delivery attempts = 5;
- retry backoff is handled by dispatcher;
- Brevo delivery writes provider message ID and `sent/failed` operational state;
- recipient email is resolved from Supabase Auth server-side;
- recipient display name comes from `profiles`;
- booking/artist/contact/counterparty context is resolved server-side;
- email locale currently reads Auth metadata when present and otherwise falls back to ES;
- dispatcher never accepts arbitrary recipient/content from the caller;
- dispatcher endpoint requires the existing service-role bearer token in function code even though Supabase JWT gateway verification is disabled;
- `dispatch-notification-emails` is ACTIVE on staging, version 1;
- `supabase/config.toml` versions `verify_jwt = false` because custom service-role authentication happens inside the function.

Booking CTA deep-link support was added:

```text
/workspace?artist=<artist-id>&booking=<booking-id>
```

The workspace now honors both query params, selects the requested artist when accessible and opens the real Booking after Booking Core has loaded.

Validation:

```text
Edge Function deployment: ACTIVE v1
CI run 35283306204: tests + production build success
Deploy Staging / PR preview run 35283306104: success
processing/ready/recipient delivery indexes: present on staging
```

Automatic first-attempt activation is now wired server-to-server from the existing ingress Edge Functions:

- `submit-booking-request` dispatches only when a new public Booking was actually created;
- `booking-follow-up` dispatches only when a new external follow-up Activity was actually created;
- `ingest-booking-email` dispatches only when at least one inbound email item was accepted;
- each invocation authenticates to `dispatch-notification-emails` with the already-existing service-role secret held in Edge Function environment;
- calls run through `EdgeRuntime.waitUntil`, so promoter-facing responses are not blocked by notification email delivery;
- idempotent retries that do not create a new domain event do not trigger duplicate notification sends.

Deployment state:

```text
submit-booking-request ACTIVE v14
booking-follow-up ACTIVE v13
ingest-booking-email ACTIVE v15
dispatch-notification-emails ACTIVE v1
```

Validation:

```text
CI run 35284305515: tests + production build success
```

Periodic retry draining is now enabled on staging without persisting service-role or Brevo credentials in cron SQL.

Implementation:

- `pg_cron` + `pg_net` enabled on staging;
- cron job `cuebooker-notification-email-retry` runs every 5 minutes;
- each cron invocation generates a 256-bit one-time token through `private.issue_notification_dispatch_token()`;
- only the SHA-256 hash is stored in `private.notification_dispatch_tokens`;
- tokens expire after 2 minutes and are single-use;
- the dispatcher accepts either internal service-role authentication or a valid one-time scheduler token;
- token validation happens through service-role-only `consume_notification_dispatch_token()`;
- no service-role JWT, Brevo key or long-lived dispatcher secret is stored in the cron command.

Security note: `consume_notification_dispatch_token()` is `SECURITY DEFINER` because `service_role` intentionally has no direct access to the private token table; EXECUTE remains granted only to `service_role`.

Staging smoke:

```text
manual pg_net scheduler request -> HTTP 200
dispatcher response -> {"claimed":0,"sent":0,"failed":0}
cron job active -> */5 * * * *
```

The earlier scheduler-auth 403 was traced to the private-table permission boundary and fixed in migration `20260918012000_fix_scheduler_token_consume_permissions.sql`.

## 14. Notification read API foundation — IMPLEMENTED ON BRANCH

Functional commits:

```text
18c10ad32a235b4028c55c7cdeec724f631fa6d0
0285611c4ad4083e1bcf6d69fa7bfa3f5add5aa3
a6914dcfee527cf6e5c0a8f438b3825408e4cf2c
```

Files:

```text
app/domain/notification.ts
app/services/notificationApi.ts
app/composables/useNotifications.ts
```

Available client operations, all relying on existing notification RLS:

- list recent notifications;
- exact unread count through PostgREST count semantics;
- mark one notification as read;
- mark all visible unread notifications as read.

The browser does not receive delivery-queue access and cannot mutate notification identity/content. The existing column-level `UPDATE(read_at)` grant remains the only client-side notification mutation.

No notification-center UI was introduced in this slice. The intent is to make the future bell/panel a thin presentation layer over an already-defined domain/API contract.

Validation at time of handoff update:

```text
CI run 35284465373: tests success; production build running
PR preview run 35284465308: preview build success; deploy running
```

## 15. Notification delivery E2E + notification center — IMPLEMENTED ON STAGING / BRANCH

Additional functional commits:

```text
72080374718db2971933aa9d87ca5831b1b49a94
805eae97674d1b9c431466868d5ae51d8c94b533
5da673a870506a0c853b4c5dd1b1bdd2975276c7
```

### Delivery smoke

A real existing staging Booking was reused for an explicitly marked notification smoke instead of creating another fake Booking.

Smoke notification:

```text
booking_id: 214d912e-f4f1-414f-9d8d-eda2f50be115
kind: booking_request_received
metadata.smoke_test: true
recipient: workspace owner
```

The first dispatcher attempt exposed missing service-role SELECT grants on `notifications` and `profiles`:

```text
claimed=1
sent=0
failed=1
last_error_code=supabase_403
```

Migration `20260918013500_grant_notification_dispatch_context.sql` grants only the server-side reads required for delivery. Browser RLS/grants are unchanged.

Retry smoke after the migration:

```text
dispatcher HTTP 200
claimed=1
sent=1
failed=0
provider=brevo
provider_message_id=<202609172309.81894022181@smtp-relay.mailin.fr>
attempts=2
```

The periodic cron itself is also running successfully on staging at 5-minute intervals.

Scheduler configuration is now versioned through `private.configure_notification_email_retry(dispatch_url, schedule)` in migration `20260918015000_add_notification_retry_configurator.sql`. The shared migration never hard-codes a staging URL; each environment installs the same job with its own dispatcher endpoint. Staging has been reconfigured through this function and currently uses job id 2.

### Notification center

A first functional notification-center UI now exists on the branch:

```text
app/components/WorkspaceNotifications.vue
```

It is integrated into the workspace header and uses the existing RLS-backed notification API.

Current behavior:

- bell icon with unread badge;
- recent-notification list;
- distinct copy for new booking vs promoter reply;
- read/unread state;
- mark one as read by opening it;
- mark all as read;
- notification click resolves the Booking, switches artist when needed, opens the real Booking view and persists `artist` + `booking` query params;
- desktop uses an anchored panel;
- mobile uses a vertical bottom sheet rather than a horizontal notification rail;
- Escape/outside-click closes the panel;
- inline SVG only, no emoji/icon inconsistency.

Visual desktop/mobile smoke is still required before considering the notification-center presentation final.

Current smoke notification is intentionally left unread on staging so the bell badge and notification-center read flow can be visually verified without creating another test event.

Additional notification UX hardening:

- UI locale is now synchronized into Supabase Auth user metadata as `cuebooker_locale`, so notification emails can honor ES/EN instead of always falling back to ES;
- local preference remains immediate/offline-friendly through `localStorage`;
- notification center loads an exact unread count independently from the 40-item list;
- unread badge refreshes every 60 seconds while the app is visible;
- focus/visibility return triggers an immediate refresh;
- when the panel is open, refresh updates both list and count.

Commits:

```text
b4c0e187ee0027311b16c3c689a810d3e6c59595
0cae9991d1c81fcb1879ef64a357fd0cd940bc02
88ce55ef3be396d00f48a9cff97908068252e1c5
```

## 16. Automated booking workflow states + mobile UX clarification — IMPLEMENTED ON STAGING / BRANCH

Functional commits:

```text
62ee0c97fc3690ea4a05b3a8e0b8eac1bc257efd
318985bbef01465d853c70c298f1fdfb34845720
16952b1d5c4b755a104bae9725c2aa5db2554bf1
ea8874c1fafcc219f5b88b8a9b88418e9929c9f8
6b4d736b6e87bfb5d30fbcda240aa6cac695894d
```

### Booking state model

Operational states are now derived from Activity instead of being manually selected:

- new: initial state when a Booking is captured;
- in_conversation: automatic after a later inbound interaction;
- waiting_response: automatic after a later outbound interaction;
- confirmed / rejected / cancelled: explicit human decisions only.

Initial capture Activity is excluded using its existing metadata:

```text
capture=public_form
capture=cue_manual
```

Therefore creating a Booking does not immediately move it out of `new`.

Decision states are terminal for automatic transitions. `set_booking_status` now rejects manual writes to operational states with `operational_status_is_automatic`.

Every automatic transition writes an internal `status_change` Activity with:

```text
automatic=true
reason=external_activity_received | external_activity_sent
trigger_activity_id=<activity id>
```

A transaction/ROLLBACK smoke proved:

```text
new + outbound whatsapp
-> waiting_response
-> automatic status_change Activity written
-> rollback restored original booking to new
```

### Inbox UX

- removed manual status select;
- current state is displayed as an informational semantic-color chip;
- explicit decision actions are Confirm / Reject / Cancel;
- filters use semantic colors for New / In conversation / Waiting response / Confirmed / Rejected / Cancelled;
- mobile state filters are a visible grid instead of a hidden horizontal rail;
- booking selection restores auto-scroll to the booking detail;
- Activity section is renamed to Activity history;
- interaction composer explains that inbound/outbound interactions drive state automatically.

### CUE / capture

CUE now explains its product result explicitly:

```text
Capture an opportunity
-> voice or text
-> interpret details
-> create a new Booking
```

The existing functional voice input and interpreter were moved near the top of the flow instead of being hidden below contact/entity fields. CTA is now `Create booking` / `Crear booking`.

### Next action

The ambiguous `Siguiente paso` wording is now `Próxima acción`, with helper copy explaining that it is an operational reminder/to-do and does not change Booking status.

Visual mobile validation is still required after the preview deploy.

## 17. Mobile booking-detail simplification + voice capture correction — IMPLEMENTED ON BRANCH

Functional commits:

```text
73f1ce6bf708e4aa07a7714cce3901828b930352
3a739cedea0595e3c961f6718fd63a98f665ac0a
b0ea374a480f2c5d35c322ccea16c4744d8c5284
618bda23ca12c3c1272aea8bc101af6df96aef46
bcdd8ec342e774e5c72fa348afc49d6cba06798b
2c78c2fd5cc53586c76ed1f66b9551d0024ddb79
```

### Voice

The existing browser SpeechRecognition capture was stopping too early because it used `continuous=false` and rebuilt transcript from each event.

It now:

- uses continuous recognition;
- keeps committed final chunks separately from interim text;
- keeps listening until the user presses Stop;
- attempts to restart recognition after browser-level end events while capture is still active;
- preserves prior typed text;
- emits one final captured transcript when stopped.

This remains browser speech recognition, not server-grade transcription. Browser/iOS support and behavior can still vary.

### Text interpretation

The current `cueInterpreter.ts` is a deterministic local parser, not semantic AI. It currently extracts a limited set of patterns for:

- channel;
- contact/counterparty names in specific phrases;
- date;
- money/currency;
- next action.

The UI no longer presents it as an intelligent semantic interpreter. Copy now says `Detectar datos del texto` / `Detect details from text` and explicitly labels it basic detection. A future Smart Capture block should use a structured semantic extractor with confidence, evidence and missing-field handling before applying suggestions.

### Booking detail hierarchy

Mobile review showed that the booking detail contained too many competing concepts. Changes:

- empty Relationship Memory is hidden completely;
- relationship history only appears when there is actual prior history with the same counterparty/contact;
- label becomes `Historial con` instead of `Relación / Memoria`;
- Hold management is collapsed into a contextual `Reservar fecha (hold)` tool with helper copy;
- booking detail editing moves next to the facts as pencil + `Editar datos`;
- missing booking facts are visually marked;
- Conversation is promoted above follow-up/hold tools;
- body-bearing external/internal interactions are rendered as a chronological conversation thread;
- inbound/outbound/internal entries are visually differentiated;
- technical status/hold system events do not compete in that conversation thread;
- status filters retain semantic letter + border color even when inactive;
- mobile booking header/actions stack vertically so long titles/status actions cannot overflow the viewport.

Visual mobile smoke is required after preview deploy.

## 18. Smart Capture V1 foundation — IMPLEMENTED ON BRANCH / EDGE FUNCTION DEPLOYED TO STAGING

Smart Capture is now treated as a first-class product capability, not as the old regex parser.

Functional commits:

```text
ff2a04910c86be99c9db0f741547999bf56ca501
07b10d35d1eb9fc37f1cb33d45f89b69d5d60332
e52b241f643575bb511ff038ccc26b84d6781464
9643dd74eb86dab146ef2618a24372047123a43a
6c6e3c70053aad18532b56f9a7c81047c812665d
f7f2d09603c9a6b7fbfcfae72cc4056b12ee0c72
d1981b7164697960e7044502f07c39d5669a06df
3866ff3133ddb992e63a2f8472303bb6e8678987
d2c59efe10242724392b0d87a4bdf691240939f7
d1467ec54802f80bedb2ae2a7122b997b2065ec5
481cae9d61d7e87cbd7ec16f70db5168554c89fc
b18797d9f4564bcee42af7f5689065279ce0f4ff
59fa0d900bab4fdf67368d093bddc9a9720a5d96
```

### Architecture

The primary flow is now:

```text
voice or text
-> authenticated smart-capture Edge Function
-> audio transcription when needed
-> strict structured semantic extraction
-> confidence + evidence + warnings + missing fields
-> human review
-> apply selected result
-> create Smart CUE booking
-> Booking Core
```

The Edge Function:

- requires an authenticated user;
- verifies editable workspace membership;
- verifies the artist belongs to the workspace;
- does not persist transcript or extracted data;
- accepts text or multipart audio;
- limits audio to 20 MB;
- uses server-side transcription for audio;
- uses strict JSON-schema extraction;
- never receives provider credentials from the browser.

Provider configuration is server-side through:

```text
OPENAI_API_KEY
CUEBOOKER_TRANSCRIPTION_MODEL (optional; default gpt-4o-transcribe)
CUEBOOKER_SMART_CAPTURE_MODEL (optional; default gpt-5-mini)
```

If the provider is unavailable/unconfigured, text Smart Capture falls back explicitly to the existing local deterministic parser and tells the user that the result is basic detection. It must never claim semantic AI ran when it did not.

### Structured extraction

Smart Capture returns:

- transcript;
- summary;
- source/channel;
- contact name/email/phone;
- counterparty name/type;
- event name/venue/city/country/date/start/end/timezone;
- offer amount/currency/fee basis;
- next action + due date;
- hotel/travel/hospitality/technical/other conditions;
- missing fields;
- warnings.

Every primary field contains:

```text
value
confidence = high | medium | low | unknown
evidence
```

Evidence is kept short and derived from the source text. Nothing is applied automatically.

### Review UX

`SmartCaptureReview.vue` renders:

- interpreted summary;
- field-by-field values;
- confidence labels;
- source evidence;
- detected conditions;
- missing fields;
- warnings;
- Apply / Discard.

### Voice

Browser SpeechRecognition is no longer the primary capture path.

On capable browsers, CUE now:

- records microphone audio with MediaRecorder;
- uses noise suppression / echo cancellation / auto gain when available;
- supports up to 5 minutes per capture;
- sends the recorded audio to Smart Capture;
- transcribes server-side;
- places the returned transcript into the CUE;
- returns the semantic review in the same operation.

Browser dictation remains only as a compatibility fallback where MediaRecorder/getUserMedia is unavailable.

### Smart CUE persistence

Migration:

```text
20260918031500_add_smart_cue_booking_rpc.sql
```

adds `create_smart_cue_booking(...)`, preserving:

- country;
- date;
- start/end times;
- timezone;
- fee/currency/fee basis;
- initial transcript/note;
- next action;
- next-action due date.

A transaction + rollback smoke proved that the RPC persists the extended data without leaving test rows.

### Overnight club bookings

The smoke exposed a legacy domain assumption that required `end_time > start_time`, which incorrectly rejected normal DJ sets such as:

```text
23:30 -> 01:00
```

Migrations:

```text
20260918032500_allow_overnight_booking_times.sql
20260918033000_allow_overnight_booking_constraint.sql
```

now define `end_time <= start_time` as ending on the following calendar day.

This is deliberate club/booking domain behavior, not a validation relaxation by accident.

### Remaining gate

Before calling Smart Capture production-ready:

1. confirm the provider key/models are configured in staging;
2. run a real authenticated text extraction;
3. run a real iPhone audio capture/transcription;
4. review extraction quality with natural Spanish/Catalan/English booking speech;
5. add rate/cost protection before production;
6. keep the old regex parser only as explicit fallback.

## 19. Smart Capture audio hardening + public profile/home + trial foundation — IMPLEMENTED ON BRANCH / STAGING

Functional commits:

```text
e23deca061337a1648ea6b395a36c3efca7e07ee
aad16d916346ebe6fd744a82e9e47c41929c04e7
d7c1741a76b46ad376c8525aefd5c41043387e78
594993ff04d5bddb59c6cac420da51f573dc978a
046583874c20f3e276aa04ec53b4fee648e976a9
4428a516c927590c755017870ca267a506b597a0
```

### Smart Capture audio

The real iPhone test proved that text semantic capture worked while recorded audio returned the generic Smart Capture audio failure.

The `smart-capture` Edge Function was hardened and redeployed to staging v2:

- default transcription model is now `gpt-transcribe`;
- Safari/iPhone MIME types are normalized by stripping codec suffixes;
- the uploaded recording is rebuilt with a clean filename/MIME combination before provider upload;
- transcription-provider and extraction-provider failures now return separate safe error codes.

The next required smoke is another real iPhone audio capture. If it still fails, use the new safe failure code to isolate the provider/file issue instead of guessing.

### Public artist profile

The current staging artist `lits` has:

```text
cover_image_path = null
artist_image_path = <portrait path>
```

So the public profile was correctly rendering the fallback cover; no persisted cover existed for that artist.

The public mobile profile hero was redesigned:

- cover + artist + identity are one composition rather than separate tall blocks;
- if no cover exists, the artist portrait produces a blurred/darkened visual background instead of the empty abstract fallback;
- the portrait remains a separate foreground layer;
- stage name, genres and request CTA sit inside the same mobile hero;
- mobile hero height and downstream spacing are reduced;
- a real uploaded cover still takes precedence automatically.

### Commercial home messaging

Spanish and English home content was reframed around the core product promise:

```text
Tell it / Cuéntalo
-> Cuebooker organises the context
-> review
-> follow the booking
```

The homepage now avoids leading with internal vocabulary such as Activity/Next Move/Hold before the value is understood. Smart Capture, conversation continuity, automatic operational status and date context are the main narrative.

### 30-day trial foundation

Migration:

```text
20260918035000_add_workspace_trial_foundation.sql
```

adds non-enforcing `public.workspace_billing`.

New workspaces automatically receive:

```text
plan_code = solo
status = trialing
trial_started_at = now()
trial_ends_at = now() + 30 days
```

Existing staging workspaces were backfilled with a fresh 30-day trial. The current Lits workspace has an active trial ending 30 days after migration application.

The table also reserves future Stripe provider/customer/subscription/current-period/cancel-at-period-end fields.

Important:

- no paywall or entitlement enforcement exists yet;
- no Stripe customer/subscription is created yet;
- payment integration comes after validating onboarding/trial/activation;
- production remains untouched.

## 20. Trial value messaging + analytics instrumentation — IMPLEMENTED ON BRANCH

Functional commits:

```text
b7eb0f33431004af28e49fbe5979397af4e5cb90
705b067106bf96466c18bd3fdc7b7bf48163d0a4
79b05f23fd2376221d6328fbfa1903016b63c083
57ab3bb54c0c2b34f294a222c149e043b51514d4
b2a823b4148a4d1194aba67ca81720d0760ebf51
eea56b5b3112bd04b3e40a652a24950cb8997c02
5049c3a41a2bb9a165fc350003e0dfc4984270a1
b9d4d288166aa9ee7861306f7754dc617dda638f
```

### Home / early-access value

The commercial home now contains a dedicated 30-day trial block that separates:

- value available from day one;
- coming-next capabilities;
- the reason to join early.

The 30-day trial is presented as no-card early access and points to the existing signup flow. Stripe/payment is intentionally deferred.

### Analytics

Cuebooker already had a consent-aware GTM/dataLayer foundation. This block instruments it instead of adding another analytics stack.

Tracking remains disabled until optional analytics consent is granted and a GTM ID is configured.

Core events now include:

```text
page_view
section_view
cta_click
signup_click
login_click
role_select
discovery_simulate
public_booking_open
cue_open
smart_capture_start
smart_capture_result
smart_capture_apply
booking_created
```

Homepage section views are tracked once per page load when at least 30% visible and consent is granted.

CTA events include placement/destination so hero/header/final/trial conversion can be compared.

Smart Capture events track funnel metadata but do not send the transcript, booking message body, contact data or other captured content to analytics.

Route page views are standardized through `useAnalytics.trackPageView()`.

## 21. Pricing / monetization direction — HYPOTHESIS, NOT IMPLEMENTED

Current launch hypothesis:

```text
30-day free trial
 -> one simple Solo plan around €15/month as an initial/founder price
 -> core booking workflow + public profile + links + widget + notifications included
```

Do not split Instagram links, WhatsApp links, widget or public profile into separate paid add-ons at launch. These are acquisition/distribution surfaces that increase the value of the same booking engine.

A future Manager/Agency plan can be priced around workspace/roster/artist scale once real usage data exists.

AI/voice limits should not be hard-coded into pricing before real usage/cost evidence exists.

No billing, trial enforcement or Stripe integration is implemented yet.

## 22. Product direction captured, NOT FOR IMMEDIATE PARALLEL IMPLEMENTATION

### Smart Capture / interpretation

Voice and free text should become one Capture Engine rather than separate novelty features.

Future inputs may include typed free text, dictated voice, pasted WhatsApp text and pasted/imported email.

The engine should propose structured booking fields, show uncertainty/missing information and require human confirmation before writing Booking Core. AI must not silently invent booking facts.

### Notification delivery

The shared notification event stream now exists on staging. Delivery remains deliberately separate.

Preferred sequencing:

```text
email delivery from notifications
 -> in-product notification center using the same rows
 -> Web Push/PWA where justified
```

Do not emit independent email-only or push-only booking events.

### Internal Cuebooker admin / back office

Future internal admin should cover platform/user/workspace health, support/incidents, operational KPIs, email/webhook delivery, logs/correlation IDs, error diagnostics, abuse/rate limiting, alerts and audited admin actions.

Observability data should be captured incrementally now even though the admin UI is deferred.

### Friendly system feedback

Treat human feedback as a cross-product rule:

- field error -> explain the field problem;
- save/send success -> confirm clearly;
- retryable failure -> preserve work and explain next action;
- technical/provider detail -> logs/admin, not promoter-facing copy.

## 23. Root routing and static deployment

Root artist URLs under static Nuxt are resolved by `functions/[slug].js` on Cloudflare Pages. `ASSETS.fetch()` must use the pretty `/200` path rather than `/200.html`.

Previously validated:

- real artist slug -> HTTP 200 + artist metadata + Nuxt shell;
- missing slug -> 404;
- reserved `/workspace` -> application route, never artist resolution.

PR #75 remains the staging preview vehicle.

## 24. Security / operational follow-up

Before production:

- rotate Brevo API/webhook secrets exposed during setup;
- finish direct inbound email webhook smoke;
- strengthen anonymous rate/abuse protection for public intake and follow-up;
- perform visual desktop/mobile smoke of public profile, form, request page, distribution panel and widget;
- review CSP/frame policy for widget on external origins;
- run Supabase security/performance advisors;
- explicitly review production migrations/functions/deployment.

Existing project-level warning remains:

```text
Leaked Password Protection Disabled
```

Existing Edge Functions still use legacy `SUPABASE_SERVICE_ROLE_KEY`; migrate to the current Supabase secret-key model as a deliberate infrastructure task, not mixed into a product slice.

## 25. Exact next product work

Current sequencing is intentional:

```text
1. visually smoke Public Booking Form V2 desktop/mobile;
2. visually smoke new Distribution panel desktop/mobile;
3. fix UX regressions found in those smokes;
4. complete direct email reply webhook handshake when terminal access returns;
5. close/gate the public-entry block;
6. then open Smart Capture text + voice as a distinct feature block;
7. notification delivery E2E is proven on staging; visually smoke the notification center and real email presentation desktop/mobile;
8. commercial homepage/marketing redesign after operational product truth is strong enough to market honestly;
9. billing/trial enforcement after first external beta feedback, unless launch timing requires it earlier.
```

Do not jump ahead because downstream ideas are documented.

## 26. Documentation workflow rule

Every meaningful implementation block must finish by updating this handoff with:

- live functional commit;
- actual implementation state;
- validation and environment;
- remaining unverified work;
- exact next step;
- production state.

## 27. Production gate

Production Supabase:

```text
qlocooqfdzehogbwcbhr
```

No migration, Edge Function deployment, publication toggle or Cloudflare production release from this public-entry/follow-up work has been performed on production.

Remain staging-only until public-entry UX, direct inbound reply, abuse controls and explicit production review are complete.
