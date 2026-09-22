# Cuebooker living handoff

Updated: 19 September 2026  
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

## 21. Product-rounding P0: voice resilience, hero proof, skeletons and list scaling — IMPLEMENTED ON BRANCH / AUDIO EDGE DEPLOYED TO STAGING

Functional commits:

```text
1015889b44bf9790690b8201ed80e6f6d28d128c
423040a4abc76849c79b8ee8b3d17455db6daf86
fbe9235a44fd7b3696e2defe156e62e17eb2185e
37739ba4f0dc879c19c4417c0257406514819782
7b4794f4cb54778ae3992a0b1d7174bf2beee7a4
06852a669cc6e299b484efbe0623162d5523c34e
5f111c440805c44340198d5ac382468169163ae5
596cdd535d860d9bee31bcd1587d1fb4c0e5fb87
```

### Smart Capture audio resilience

The staging Smart Capture Edge Function is now ACTIVE v3.

The audio path no longer depends on one transcription attempt. It:

- normalizes Safari/iPhone MIME types and file extension;
- accepts common AAC/MP4/M4A/WebM/OGG/WAV/MPEG audio families;
- tries the configured model first when present;
- then falls back through `gpt-transcribe` and `gpt-4o-transcribe`;
- logs only safe operational metadata on failed provider attempts: model, provider status, MIME and byte size;
- never logs or persists audio/transcript contents in these diagnostics.

A fresh real iPhone smoke is still required.

### Bookings and history scaling

Booking inbox:

```text
10 initially
-> Load 10 more
-> repeat
```

Filtering/search/archive changes reset the visible window to 10.

Operational history uses the same 10-at-a-time pattern.

This is intentionally progressive loading UX rather than classic numbered pagination. The current client still has the already-loaded collection; true cursor/server pagination can replace the backing query when data volume requires it without changing the UX contract.

### Workspace loading

The previous top-level `Cargando workspace…` text has been removed.

Workspace loading now preserves spatial continuity with:

- heading skeleton;
- KPI/card skeletons;
- primary/secondary panel skeletons;
- mobile responsive skeleton layout;
- reduced visual jump when real workspace content arrives.

### Commercial hero

The homepage hero was deliberately simplified.

New message:

```text
NO PIERDAS
EL BOOKING.
```

The previous abstract network visualization is no longer the primary hero proof. The hero now demonstrates the product:

```text
messy WhatsApp booking context
-> Smart Capture
-> structured Booking
-> date / fee / hotel / missing schedule
-> operational status
```

The purpose is to show the differentiating workflow before explaining feature vocabulary.

Visual mobile/desktop review remains required after preview deployment.

## 22. Demo-readiness product pass — IMPLEMENTED ON BRANCH

This pass responds to the first full desktop review of the real workspace and public profile.

Functional commits include:

```text
2f32c27ba48f0c1c70248390e1d0cb6cb15cd282
029b5ff6f0bccd3b3d7f371f7c45eb6583f9af54
ea58a1c1f01f5b2e0b9eccf3b5efec0a53f67a4b
d1eabb6e294237babf409b742c149f3039e716f1
411a5e6f73ff3e516429f5fa5c1dcf83558c2bdc
cc745c47f819f7152741027038572a635a2aef75
fcdbdf667ce3772fe6ef774bfb307736de41133a
5c082cbdc1474e96077abeaba97bd0643d511b78
b11677c32de674a8829a7dabb03c5a08d8ea1ac0
e6cd9c026ef3998e0f66caa2af53a29fa438cfbf
02dc985abffb008b787a50643a5ffb913cce3b96
```

### Notifications

Desktop notifications now use a labelled trigger and a fixed right-side drawer with an internally scrollable list rather than an anchored popover that could overlap/crop against workspace navigation.

Mobile keeps the compact bell trigger and bottom-sheet pattern.

### CUE / Smart Capture voice resilience

MediaRecorder audio capture now also attempts browser speech recognition in parallel when the browser exposes it.

The fallback transcript is not the primary path. The sequence is:

```text
MediaRecorder audio
 -> server Smart Capture audio transcription
 -> semantic extraction

if audio transcription fails AND browser transcript exists:
 browser transcript
 -> server Smart Capture text extraction

if semantic extraction also fails:
 browser transcript
 -> local basic parser / editable text
```

The intent is graceful degradation rather than a dead-end error.

A fresh desktop + iPhone smoke is still required. Do not call voice closed until both are proven.

### Booking operational mental model

Cuebooker now communicates the product contract more explicitly:

```text
CUE
 -> quickly creates the booking from something that just happened

Booking
 -> continues conversation, next action, hold and decision

Next action
 -> work reminder only; does not alter status or reserve calendar

Hold
 -> provisional booking-linked date reservation; appears in Calendar

Confirm booking
 -> human booking decision; matching hold converts and booking appears in Calendar

Manual calendar block
 -> travel / studio / unavailability not created by a booking
```

The hold UI no longer exposes a misleading independent "Confirm booking" action. Booking confirmation stays at the booking decision level, matching the current database command semantics.

### Calendar conflict behaviour

The existing booking conflict notice already checks:

- other bookings;
- active holds;
- manual availability blocks.

Manual calendar block creation now also warns when overlapping:

- another manual block;
- an active hold;
- a confirmed booking.

These are currently product/UI warnings, not a database-level exclusion guarantee.

### Bookings vs Activity

To remove the previous "Active / Archived / History" ambiguity:

- Bookings uses **En curso / Archivados**;
- archived bookings remain recoverable under Bookings;
- workspace **Historial** is renamed **Actividad**;
- Activity remains the chronological cross-booking event stream.

### Distribution

"Copiar booking directo" is now "Copiar enlace de solicitud".

Distribution groups receive stronger lime hierarchy and compact visual channel markers. The direct enquiry copy now explains that the link is for turning an existing promoter conversation into a structured request.

### Profile and public presentation

The profile editor already has a sticky save bar with completion percentage and save action.

Public profile fallback presentation is now consistent with the editor contract:

- uploaded cover wins when one exists;
- otherwise the Cuebooker default cover artwork is used;
- the artist portrait remains foreground content.

The current staging artist `lits` still has no persisted custom cover, so the default artwork is expected until one is uploaded.

## 23. Madrid demo hotfix pass — IMPLEMENTED ON BRANCH

Follow-up fixes from the live desktop smoke:

Functional commits:

```text
e32b0034167d92b270b3892a05606ee7c12e6d5e
df94d9194b4734927ac668217b183afccb756203
407f58ae6e778fefc31439cdd5e31ed4d1914ca0
f89247c21538171c51e5f49a2aef2c9787bbea7d
941651d43c7406b79f00afb418c1f53300c3b3b6
137fc09d6ebb629fe8f84ff6d8cbbd00f81d369d
```

### Voice fallback

> **Superseded provider-state note (2026-09-18):** The paragraph below describing `smart_capture_provider_not_configured` reflects an earlier staging state. Current staging Smart Capture uses the configured OpenAI provider/model strategy and text capture is proven. Keep the browser SpeechRecognition fallback as resilience, but do not treat provider configuration as the active blocker. The remaining voice gate is a fresh real desktop + iPhone capture smoke.

Staging currently reports `smart_capture_provider_not_configured` from the Smart Capture server provider path.

For demo resilience, browsers exposing SpeechRecognition/WebkitSpeechRecognition now prefer live dictation instead of MediaRecorder. When dictation stops:

```text
voice -> browser transcript -> Smart Capture text
                          -> local parser when server provider is unavailable
```

The user-visible provider/internal error code is no longer surfaced.

This is a graceful fallback, not a replacement for restoring the server-side provider configuration before production.

### Booking decision modal

Native `window.confirm` / technical error behaviour for booking decisions has been replaced with a Cuebooker modal.

Confirmation now validates the booking date before calling `set_booking_status`.

The 400 observed in the desktop smoke was expected database protection:

```text
confirmed_booking_requires_date
```

The tested booking visibly had no date. The UI now explains this and disables confirmation until a date exists instead of making a failing RPC.

### Visual polish

- calendar "Añadir bloqueo" control uses the Cuebooker accent system;
- confirmed calendar legend dot uses an explicit green token;
- profile cover upload CTA has a smaller, balanced plus icon and typography;
- Distribution no longer reserves an empty left column below its intro;
- Distribution channel cards now use recognizable pictograms rather than text abbreviations.

## 24. Smart Capture extraction quality pass — IMPLEMENTED ON BRANCH / EDGE DEPLOYED TO STAGING

Functional commits:

```text
cbf41934b4310fea7e74481957f6e1783f6180dd
28fe87924288002dcfd83f7a26d428a27e1a8f88
3f77a39de19f6d81d5c23dc755d60395a8c35922
8a5635183812e12706b7e0d7058c075aefc5b064
```

Staging `smart-capture` is ACTIVE v5.

### Semantic provider resilience

Semantic extraction no longer depends on the previous single default model. The function now tries:

```text
CUEBOOKER_SMART_CAPTURE_MODEL (when configured)
-> gpt-5.6-luna
-> gpt-5.6-terra
```

and logs only safe operational model/status metadata when an attempt fails.

### Local fallback quality

The deterministic fallback now additionally extracts common spoken booking details:

- plural conversation forms such as “hemos hablado con …”;
- venue names introduced as Sala / Club / Venue;
- explicit time ranges such as “de 3 a 4”;
- Spanish verbal EUR amounts such as “tres mil euros”;
- venue, start and end times are now shown in review and applied into the CUE draft.

A regression test covers the real spoken-style case:

```text
Héctor
Sala Apolo
24 de diciembre
de 3 a 4
tres mil euros
```

Expected fallback fields:

```text
contact = Héctor
venue/counterparty = Apolo
date = 2026-12-24
start = 03:00
end = 04:00
fee = 3000 EUR
```

Server semantic extraction remains the preferred path. Local parsing is only resilience.

## 25. Booking persistence + semantic model quality — IMPLEMENTED ON BRANCH / EDGE DEPLOYED TO STAGING

Functional commits:

```text
6341388bff8657c6a75d586dc0273a8dfb8c7c53
703d785b8f0fc1b0c10d3af101d2abb2b985ff23
7d67a54b4687bb989cda60d76ad680715592f68c
5097fac7e31cc36fe0115de18867fafa391e4afa
```

### Composite RPC response fix

Several Postgres RPCs return a single composite row rather than an array. The client previously typed those responses as arrays and read `rows[0]`, causing false failures after successful database operations.

The API client now normalizes either shape:

```text
T | T[] -> T
```

Covered RPC flows include:

- create Smart CUE booking;
- update booking details;
- booking status changes;
- archive/unarchive;
- hold create/release/convert.

### Semantic user-facing errors

Technical codes such as `manual_booking_create_failed` and `booking_details_update_failed` are no longer intended to surface directly.

Creation/edit flows map known validation cases to product language, including:

- missing date when schedule exists;
- invalid country code;
- invalid currency;
- invalid offer amount;
- workspace permission errors;
- booking not found.

### Smart Capture model strategy

Staging `smart-capture` is ACTIVE v6.

Semantic extraction now prefers:

```text
CUEBOOKER_SMART_CAPTURE_MODEL (if explicitly configured)
-> gpt-5.6-terra
-> gpt-5.6-sol
-> gpt-5.6-luna
```

Terra is the default quality/cost balance. Sol is the high-capability fallback; Luna remains a cost-sensitive fallback.

## 26. Editable contact details from booking — IMPLEMENTED ON BRANCH

The booking detail now treats contact data as its own reusable entity instead of mixing it into booking-specific fields.

Functional commits:

```text
b52aa7d0d1216788362356d959d8b5c98384eee4
af2cf282956c6e7145a362bc50620981d05e1949
```

### Product model

```text
Booking data
-> date / venue / city / schedule / offer / fee basis

Contact data
-> name / email / phone / role / notes
```

Contact edits update the shared `contacts` row under existing workspace RLS, so the improved contact is reused by future bookings that reference the same person.

The booking detail displays email/phone when available and exposes an **Editar contacto** action next to the contact summary.

No new database migration was required; current contacts UPDATE RLS already allows workspace editors.

## 27. Conversation simplification + transactional email delivery tracking — IMPLEMENTED ON BRANCH / STAGING FOUNDATION

Functional commits:

```text
da97aeca323e2f7e208ec7ffa16d19d71b83e27a
9b4347512f20d4f1497da95fd717f3d1a5d25e52
48990c9e7ab1653269752ca689b55720e648787f
a9140517647386b0ce98bf0e2f65473c5d6891f8
f313465ad7ea65ad36c4e164546d5067c90107b2
91b88802b1b961e0b978af6fbf01681090872262
dd26b74ecd79c9fb15715c1fe0219f4b4600f525
```

### Interaction composer

The composer now hides transport jargon where it is not useful:

- Note = internal memory, no direction;
- Email = always sends from Cuebooker, direction fixed outbound;
- Call / WhatsApp / Instagram = user chooses human wording: "Me contactaron" / "Contacté yo".

Conversation thread direction is rendered as:

```text
Héctor -> Tú
Tú -> Héctor
Nota interna
```

rather than inbound/outbound labels.

### Outbound sender identity

`send-booking-email` staging is upgraded so sender display name is derived from the booking artist when possible:

```text
Lits via Cuebooker <bookings@cuebooker.com>
```

Outbound Brevo requests also carry tags:

```text
cuebooker
cuebooker_email_<email_message_id>
```

to correlate delivery events reliably.

### Delivery tracking foundation

Staging migration `20260918132500_add_email_delivery_tracking.sql` is applied.

`email_messages` now stores:

- delivery_status;
- delivered_at;
- bounced_at;
- opened_at;
- last_delivery_event_at;
- delivery_failure_code.

Existing sent outbound messages are backfilled as `accepted` because provider acceptance is all Cuebooker can prove without a delivery webhook.

A new Edge Function `brevo-transactional-events` is ACTIVE in staging with `verify_jwt=false`. It expects a private header:

```text
x-cuebooker-webhook-secret
```

matching environment secret:

```text
BREVO_TRANSACTIONAL_WEBHOOK_SECRET
```

It maps Brevo delivery events by Cuebooker tag first, then provider_message_id fallback.

The UI reads email delivery state and can show:

- Aceptado;
- Entregado;
- En espera;
- Rebote temporal;
- Rebotado;
- Bloqueado;
- Spam;
- Email inválido.

### Current real smoke finding

The outbound message sent at 2026-09-18 13:11 local to `litulandio@gmail.com` was successfully accepted by Brevo and received a provider message id. No final delivery event is currently available because the transactional delivery webhook has not yet been registered in Brevo.

### Branded direct booking email

Direct booking emails were still using Brevo `textContent` only, which rendered as an unstyled plain email in Gmail. This has now been corrected on branch and deployed to staging `send-booking-email` v16.

New direct booking delivery uses both:

```text
htmlContent -> Cuebooker dark/lime branded shell
textContent -> plain-text fallback
```

Shared renderer:

```text
supabase/functions/_shared/bookingConversationEmailTemplate.ts
```

CI and staging deployment passed for the implementation commits.

### Inbound reply smoke

The previously failing Gmail -> Brevo -> Cuebooker path is now verified end to end on staging.

Root cause was a mismatch between the Brevo webhook header value and Supabase `CUEBOOKER_INBOUND_WEBHOOK_SECRET`. After synchronizing them, a fresh reply to subject `prueba cuebooker` created:

- one inbound `email_messages` row with `status = received`;
- one inbound email Activity on the same booking;
- the Gmail provider message id and `InReplyTo` metadata were preserved.

Verified booking:

```text
dc2145dd-1625-4e3b-bc33-50f7e9b36840
```

The real staging roundtrip gate is therefore closed.
## 28. Pricing / monetization direction — HYPOTHESIS, NOT IMPLEMENTED

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

## 29. Product direction captured, NOT FOR IMMEDIATE PARALLEL IMPLEMENTATION

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

## 30. Root routing and static deployment

Root artist URLs under static Nuxt are resolved by `functions/[slug].js` on Cloudflare Pages. `ASSETS.fetch()` must use the pretty `/200` path rather than `/200.html`.

Previously validated:

- real artist slug -> HTTP 200 + artist metadata + Nuxt shell;
- missing slug -> 404;
- reserved `/workspace` -> application route, never artist resolution.

PR #75 remains the staging preview vehicle.

## 31. Security / operational follow-up

Before production:

- rotate Brevo API/webhook secrets exposed during setup;
- keep the now-verified direct inbound email path covered during production rollout;
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

## 32. Exact next product work

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

## 33. Documentation workflow rule

Every meaningful implementation block must finish by updating this handoff with:

- live functional commit;
- actual implementation state;
- validation and environment;
- remaining unverified work;
- exact next step;
- production state.

## 34. Production gate

Production Supabase:

```text
qlocooqfdzehogbwcbhr
```

No migration, Edge Function deployment, publication toggle or Cloudflare production release from this public-entry/follow-up work has been performed on production.

Remain staging-only until public-entry UX, direct inbound reply, abuse controls and explicit production review are complete.


## 35. Automation boundary + derived attention — IMPLEMENTED ON BRANCH

Product rule:

```text
facts / derived state / reminders / projections / ingestion
-> automate

accept / reject / cancel / send consequential communication / commit commercial choice
-> human decision
```

Cuebooker should do the repetitive operational work automatically whenever the action can be derived safely from existing truth. The artist should spend attention on decisions, negotiation and creative/professional judgment rather than maintaining system state by hand.

Current examples already following this rule:

- inbound/outbound Activity drives `in_conversation` / `waiting_response`;
- email replies are ingested and attached to the correct Booking automatically;
- holds and confirmed bookings project into Calendar automatically;
- delivery state updates from provider events;
- Overview derives attention signals from Booking/Activity/Next Move/Hold data.

New derived attention behavior:

- `new` Booking -> automatic **Review new booking** signal;
- `in_conversation` -> automatic **New reply** signal;
- `waiting_response` with no reply for 72 hours -> automatic **Follow-up** signal;
- overdue/today Next Moves and Holds keep their existing attention semantics;
- derived signals never mutate Booking commercial decisions and only open the relevant Booking;
- explicit user Next Moves remain first-class user-owned tasks.

The workspace now refreshes Booking Core in the background every 30 seconds while visible, plus immediately on focus/visibility return, so external email/webhook changes can reach Overview and Booking status without requiring a full page reload.

Pure derivation logic lives in:

```text
app/services/bookingAttention.ts
tests/bookingAttention.test.ts
```

The 72-hour stale-waiting threshold is an initial product default, not a permanent business rule. It can become workspace/user configurable after beta evidence.

ADR-039 records the automation boundary.


## 36. Automatic hold lifecycle — IMPLEMENTED ON STAGING

Functional migration:

```text
20260918143000_automate_hold_lifecycle.sql
```

Hold cleanup now follows the automation boundary from ADR-039.

### Explicit expiry

An active Hold with `expires_at` is automatically released after its deadline.

Implementation:

- `private.release_expired_holds(batch_size)` claims expired active Holds with `FOR UPDATE SKIP LOCKED`;
- release is idempotent because only `status = active` rows are eligible;
- system Activity is written as `hold_released`;
- metadata records `automatic = true`, `reason = hold_expired`, the Hold id and original expiry;
- Booking commercial status is never changed by expiry;
- cron job `cuebooker-expire-holds` runs every 5 minutes on staging.

### Human terminal decision -> automatic Hold cleanup

When the artist explicitly chooses:

```text
Rejected
Cancelled
```

active Holds for that Booking are automatically released in the same database transaction boundary through a Booking status trigger.

The decision remains human. Cuebooker only performs the mechanical consequence.

Activity metadata records:

```text
automatic = true
reason = booking_rejected | booking_cancelled
```

Confirmed Booking behavior remains unchanged: the matching Hold is converted and remaining active Holds are released by the existing confirmation command.

### Validation

Staging rollback smokes proved both paths without leaving fixture data:

```text
expired active Hold
-> private.release_expired_holds()
-> released
-> hold_released Activity(reason=hold_expired)
-> ROLLBACK

in_conversation Booking + active Hold
-> Booking status rejected
-> Hold released automatically
-> hold_released Activity(reason=booking_rejected)
-> ROLLBACK
```

Post-smoke verification:

- fixture Holds = 0;
- fixture Activities = 0;
- real test Booking restored to `in_conversation`;
- cron job active every 5 minutes.

No production migration has been applied.


## 37. Deterministic Next Action completion + calm attention — IMPLEMENTED ON STAGING

Functional migration:

```text
20260918144500_add_next_move_completion_trigger.sql
```

Next Actions can now opt into one explicit deterministic completion rule:

```text
manual
inbound_activity
```

The UI exposes this as human language:

```text
Marcar como hecha cuando llegue una respuesta
```

When enabled:

```text
later real inbound Activity
-> active Next Action completed automatically
-> next_move_completed Activity written
-> automatic = true
-> reason = inbound_activity_received
-> trigger_activity_id preserved
```

Safety boundaries:

- the rule is opt-in per Next Action;
- initial public-form/CUE capture does not count as a reply;
- only an inbound Activity later than the Next Action creation can complete it;
- no Booking commercial decision is changed;
- free-text Next Action content is never guessed/interpreted to decide completion;
- manual Next Actions remain manual.

A rollback smoke proved:

```text
auto-enabled Next Action
-> initial cue_manual inbound Activity
-> remains active

later inbound email Activity
-> Next Action completed
-> traced automatic completion Activity
-> ROLLBACK
```

No fixture rows remained and the real Booking state was restored.

### Calm attention rule

Overview attention now deduplicates by Booking and surfaces only the highest-priority current item for each Booking.

This avoids showing the artist multiple simultaneous warnings for the same piece of work. The full Booking still contains all Holds, Next Actions and conversation context.

Current priority shape:

```text
overdue explicit operation
-> new reply
-> new Booking
-> due today
-> stale waiting response
-> normal explicit operation
```

The intent is an assistant-like triage surface rather than a dashboard that creates notification pressure.

Staging schema and trigger presence were verified after migration. Existing project-level advisor warnings remain unchanged; no new security warning was introduced by this block.

Production remains untouched.


## 38. Calm review/read semantics + attention budget — IMPLEMENTED ON BRANCH

The assistant model is now reflected in notification/read behavior as well as automation.

### Reviewing a Booking clears its noise

When the user deliberately opens a Booking:

- unread notifications for that Booking are marked read through existing notification RLS;
- this also applies when opening from Overview/Calendar/History/deep-link flows that use `openRealBooking`;
- direct row selection inside the real Booking inbox emits `bookingOpened` so the same rule applies there;
- the notification badge refreshes immediately through a lightweight client event;
- failure to synchronize read state never blocks Booking navigation.

This avoids the common product anti-pattern where the user has already reviewed the work but the app continues displaying a red/unread badge.

### Overview uses unread event truth for new/reply attention

Immediate attention for:

```text
new public Booking
new promoter reply
```

is now driven by unread notification rows rather than only by Booking status.

Therefore:

```text
event arrives
-> unread notification
-> Overview attention

user opens Booking
-> notification becomes read
-> immediate attention clears
```

Manual CUE capture does not generate artificial "new booking" pressure for something the user just created themselves.

Stale waiting-response detection remains derived from Booking + Activity because it represents elapsed operational state rather than unread UI state.

### Attention budget

Overview is intentionally a triage surface, not a complete task dump.

Current quieting rules:

- at most one primary attention item per Booking;
- maximum 8 visible attention items;
- explicit future Next Actions are hidden until they enter a 48-hour attention window;
- Holds without an explicit expiry are not presented as urgent attention;
- expiring Holds enter attention within 48 hours, then disappear automatically after expiry when the hold lifecycle job releases them;
- undated explicit Next Actions remain visible because there is no other deadline Cuebooker can safely infer.

The 48-hour window is an initial product default. It should be tuned from beta behavior rather than multiplied into more notifications.

Production remains untouched.

## 39. Conversation/email tracking closure + operational loop smoke — STAGING

> **Superseded diagnostic note (2026-09-18):** Earlier text in this section attributes the missing final delivery state to an unregistered/misconfigured Brevo transactional webhook. Do not treat that as established fact. Brevo outbound sending works, real emails arrive, provider_message_id is persisted, and inbound replies through Brevo are proven. The remaining diagnostic is narrower: trace the real final delivery event through `Brevo event -> brevo-transactional-events -> correlation -> email_messages persistence -> UI` and prove exactly where it is lost, ignored or not persisted before changing Brevo configuration.


Repository hardening commit:

```text
3917bb92233ce89aea60e5fb9291a845fb69051b
```

`supabase/config.toml` now explicitly versions:

```toml
[functions.brevo-transactional-events]
verify_jwt = false
```

This matches the already-active staging Edge Function contract and prevents a future repo-driven redeploy from accidentally putting Supabase JWT verification in front of the Brevo webhook's own shared-secret authentication.

Validation for that commit:

```text
CI run 35371187552: success
Deploy Staging run 35371187557: success
```

Staging currently has:

```text
brevo-transactional-events ACTIVE v2
verify_jwt = false
20260918132500_add_email_delivery_tracking applied
```

The direct Conversation UI already uses human direction language and reads `email_messages.delivery_status` for outbound email delivery labels.

The remaining external delivery-tracking gate is not code: Brevo still needs the transactional-event webhook registered against `brevo-transactional-events` with the same `x-cuebooker-webhook-secret` value as `BREVO_TRANSACTIONAL_WEBHOOK_SECRET`. Until Brevo sends a real callback, Cuebooker can prove provider acceptance but not final Gmail delivery/bounce.

A full deterministic Booking Core loop was exercised on staging inside one transaction and then rolled back:

```text
Smart CUE booking
-> edit booking facts/date/schedule/offer
-> inbound WhatsApp Activity
-> Hold
-> Confirm booking
-> matching Hold converted
-> Activity trace verified
-> ROLLBACK
```

Observed before rollback:

```text
booking_status = confirmed
event_date = 2026-12-31
schedule = 22:00-23:30
offer = 1200 EUR
hold_status = converted
status_change events = 2
hold_created events = 1
hold_converted events = 1
conversation events = 1
```

No smoke fixture remains.

Production remains untouched.

## 40. Outbound email acceptance invariant — IMPLEMENTED ON STAGING

> **Superseded diagnostic note (2026-09-18):** Earlier text in this section attributes the missing final delivery state to an unregistered/misconfigured Brevo transactional webhook. Do not treat that as established fact. Brevo outbound sending works, real emails arrive, provider_message_id is persisted, and inbound replies through Brevo are proven. The remaining diagnostic is narrower: trace the real final delivery event through `Brevo event -> brevo-transactional-events -> correlation -> email_messages persistence -> UI` and prove exactly where it is lost, ignored or not persisted before changing Brevo configuration.


Functional commits:

```text
0587f8c3e9440f2b7ddf2b005eb6e0f5207caef3
a2efce9c893a6562e6ae69a1237321cc62e21608
ebd0ad38094dd5f6c76a65363ee96ae11216f17c
```

Staging `send-booking-email` is ACTIVE v18.

When Brevo returns a successful transactional send response, Cuebooker now persists provider acceptance immediately:

```text
status = sent
delivery_status = accepted
last_delivery_event_at = sent_at
```

Migration:

```text
20260918193000_normalize_email_delivery_acceptance.sql
```

adds a database-level normalization trigger so any future outbound path that legitimately reaches `status = sent` cannot leave delivery tracking empty. The trigger only fills missing provider-acceptance state and never overwrites later delivered/bounce/open events.

The migration also backfilled the real staging outbound email that had been sent after the original tracking migration and was still `delivery_status = null`. Verification showed the latest outbound sent rows consistently at `accepted` with matching `last_delivery_event_at`.

Conversation UI now shows a delivery label only when the Activity is linked to a real `email_messages` record. Old/manual email Activity is no longer falsely labelled as provider-accepted.

Validation:

```text
CI run 35371633756: success
Deploy Staging run 35371633745: success
Supabase security advisors: no new warning introduced
```

The remaining final-delivery gate is still external Brevo configuration: register the transactional webhook against `brevo-transactional-events` with the configured private header. Production remains untouched.

## 41. Public ingress abuse protection — IMPLEMENTED ON STAGING

Functional commits:

```text
623b26f89af672596665c1b1e5419cd640be71fe
80efdbe242b3cb8821287cc7d68a9bd01c658d20
46f9dbb8c5c2f9051fae32dbe05b4208ecb5bcfa
65f31818998d2a8036f1a1fb1ecf0461f90a5d5f
86da82480cc5dc6b443e0dec50d4638f8124686f
bd08b210c5bd3ef3e421456e492c7aef05964e0a
c6fe9717e0eaef1e78af666d12442d7d3a673c66
f438c5ac420e042d4df98a1f78ffb7c04305299f
71aed7a2cf661b7ae78f3e17f799f418856308c7
f03bd455211035b1dc4de7e50202e73ef6546e14
```

Staging Edge Functions:

```text
submit-booking-request ACTIVE v19
booking-follow-up ACTIVE v18
```

Public intake now uses atomic fixed-window budgets in Postgres through a service-role-only RPC. The private bucket table stores only:

```text
scope
HMAC-SHA256 key
window start
request count
timestamps
```

Raw IP addresses, promoter emails and follow-up tokens are never persisted in the limiter.

Current initial budgets:

```text
Public booking form
- client: 20 / 10 minutes
- artist: 120 / hour
- same artist + contact email: 5 / hour

Secure follow-up reply
- client: 30 / 10 minutes
- secure token: 12 / 10 minutes
```

Client budget is evaluated first. A client already blocked by its own budget does not consume the artist/contact/token budget, preventing one abusive source from burning shared capacity.

Rate-limit identities are HMACed server-side. `CUEBOOKER_RATE_LIMIT_SECRET` is used when configured; the server-only service credential is the staging fallback. A dedicated rate-limit secret should be configured deliberately before production.

`X-Forwarded-For` processing uses the gateway-nearest non-empty address rather than trusting a caller-prepended first value. Cloudflare/X-Real-IP headers are fallback inputs.

Rate-limited requests return HTTP 429 + `Retry-After`. Product UI preserves entered text and shows human copy rather than the internal `rate_limited` code.

Database validation proved:

```text
request 1 -> allowed, 1 remaining
request 2 -> allowed, 0 remaining
request 3 -> blocked, Retry-After returned
```

The smoke bucket was deleted afterward and no fixture bucket remains.

Retention:

```text
cuebooker-prune-public-rate-limits
every 6 hours
delete inactive buckets older than 48 hours
```

Permission validation:

```text
anon execute = false
authenticated execute = false
service_role execute = true
```

Supabase advisors introduced no new security warning. The existing leaked-password warning remains. The previously reported unindexed `notifications.activity_id` foreign key is now covered by `notifications_activity_id_idx`.

Production remains untouched.

## 42. Branded public booking acknowledgement — IMPLEMENTED ON STAGING

> **Superseded diagnostic note (2026-09-18):** Earlier text in this section attributes the missing final delivery state to an unregistered/misconfigured Brevo transactional webhook. Do not treat that as established fact. Brevo outbound sending works, real emails arrive, provider_message_id is persisted, and inbound replies through Brevo are proven. The remaining diagnostic is narrower: trace the real final delivery event through `Brevo event -> brevo-transactional-events -> correlation -> email_messages persistence -> UI` and prove exactly where it is lost, ignored or not persisted before changing Brevo configuration.


Functional commits:

```text
7c30d0a7c0ea2882b588333a9f523c02cde9259f
ef715a27ca65425375f0825fd24bf234e0aadb8a
```

Staging:

```text
submit-booking-request ACTIVE v20
send-booking-email ACTIVE v19
CI run 35372755327: success
Deploy Staging run 35372755378: success
```

The automatic acknowledgement sent after a public booking form now uses the same Cuebooker dark/lime email renderer as booking conversation email.

It includes:

- branded HTML;
- plain-text fallback;
- artist context;
- localized ES/EN footer;
- a visible CTA to the secure booking follow-up URL;
- Reply-To continuing to route into the booking email thread.

The shared renderer remains backwards-compatible for normal booking conversation email.

The only remaining delivery-tracking gap is external configuration in Brevo: register the transactional-event webhook against `brevo-transactional-events` with the private `x-cuebooker-webhook-secret` header. Code, staging schema and callback function are ready.

Production remains untouched.

## 43. Transactional delivery tracking hardening — IMPLEMENTED ON STAGING

> **Superseded diagnostic note (2026-09-18):** Earlier text in this section attributes the missing final delivery state to an unregistered/misconfigured Brevo transactional webhook. Do not treat that as established fact. Brevo outbound sending works, real emails arrive, provider_message_id is persisted, and inbound replies through Brevo are proven. The remaining diagnostic is narrower: trace the real final delivery event through `Brevo event -> brevo-transactional-events -> correlation -> email_messages persistence -> UI` and prove exactly where it is lost, ignored or not persisted before changing Brevo configuration.


Functional commits:

```text
be2ca1f1a518ba15ee47f39aa9ce4bd97de6cbfc
b358e07629da8fdd53c5b52d69cdcb2458d632ba
fe7ea7995c65d015a9019dec5accd6813ca73a7e
ad741fd29033d0fc1ef2d37f3dd6cabe184f1745
723c7552f4d3f7bab51ad4675d0f9aa30071457b
```

The Brevo transactional callback now uses a tested shared event normalizer:

```text
supabase/functions/_shared/brevoTransactionalEvent.ts
tests/brevoTransactionalEvent.test.ts
```

Tracked delivery states now include:

```text
accepted
delivered
deferred
soft_bounce
hard_bounce
blocked
spam
invalid
error
```

Brevo `error` is therefore represented as a real final delivery failure rather than silently leaving the message at `accepted`. Proxy-open and unique-proxy-open events also update `opened_at`.

Repository migration:

```text
20260918201500_add_email_delivery_error_status.sql
```

Staging migration was applied and rollback validation proved `delivery_status = error` satisfies the database constraint without leaving fixture changes.

Staging Edge Function:

```text
brevo-transactional-events ACTIVE v3
verify_jwt = false
custom x-cuebooker-webhook-secret authentication remains required
```

Validation for commit `723c7552f4d3f7bab51ad4675d0f9aa30071457b`:

```text
CI run 35379699885: success
tests: success
Nuxt production generation: success
Deploy Staging / PR preview run 35379699864: success
Preview: https://pr-75.cuebooker-staging.pages.dev
```

Supabase advisors show no security regression from this change. The existing Auth leaked-password warning remains, and the service-only `notification_email_deliveries` table continues to intentionally expose no browser RLS policies.

### Remaining real delivery gate

The latest real outbound booking emails in staging have:

```text
status = sent
provider = brevo
provider_message_id = present
delivery_status = accepted
delivered_at = null
bounced_at = null
```

This means Cuebooker currently proves provider acceptance, not mailbox delivery. Code, schema and staging Edge Function are ready.

The remaining gate is external Brevo configuration: register a transactional webhook pointing to:

```text
https://lycprjeuuynfzwskycwv.supabase.co/functions/v1/brevo-transactional-events
```

with the configured private `x-cuebooker-webhook-secret` matching `BREVO_TRANSACTIONAL_WEBHOOK_SECRET`, and enable at least delivered, deferred, soft bounce, hard bounce, blocked, spam, invalid email, error and opening events.

After that configuration, send one fresh booking email and verify the same `email_messages` row moves from `accepted` to `delivered` or the appropriate failure state. Do not infer delivery from Brevo send acceptance.

Production remains untouched.

## 44. Email delivery failure attention — IMPLEMENTED ON BRANCH

Cuebooker now treats real provider delivery failures as derived operational attention rather than leaving them buried inside the Booking conversation.

Current failure states:

```text
soft_bounce
hard_bounce
blocked
spam
invalid
error
```

Behavior:

```text
Brevo/provider delivery failure
-> email_messages delivery state
-> Overview attention signal for that Booking
-> artist opens Booking and decides what to do
```

This follows the automation boundary:

- Cuebooker detects and surfaces the mechanical failure automatically;
- it does not resend automatically;
- it does not change Booking commercial status;
- it does not create or complete user-owned Next Actions;
- it does not infer a replacement communication channel.

Overview deduplicates delivery failures per Booking and keeps only the latest relevant failure before the existing per-Booking attention budget is applied.

Implementation:

```text
app/services/bookingAttention.ts
tests/bookingAttention.test.ts
app/services/bookingCoreApi.ts
app/components/BookingCoreAttention.vue
```

CI for functional HEAD `0492360caded96d022ac6820f3fa14f06552cd0e` passed tests and Nuxt production generation.

Production remains untouched.

## 45. Assisted stale follow-up draft — IMPLEMENTED ON BRANCH

Cuebooker now closes one more repetitive operational gap without crossing the human-decision boundary.

When all of these are true:

```text
Booking.status = waiting_response
latest directional Activity = outbound
72 hours have elapsed
contact has a real email
```

the Conversation composer offers:

```text
Preparar seguimiento
```

The action is intentionally assistive, not autonomous:

```text
stale waiting detected
-> Cuebooker builds contextual draft
-> artist clicks Preparar seguimiento
-> Email composer is prefilled
-> artist reviews/edits
-> artist explicitly clicks Enviar email
```

Cuebooker never sends the follow-up automatically.

The deterministic draft reuses existing Booking truth:

- contact name;
- event or venue context;
- event date when known;
- previous outbound email subject when available.

If the previous subject exists, the draft keeps the thread with `Re:`. No generative model is required for this first Booking Core version, so there is no hidden AI decision, latency or extra failure mode in the demo-critical path.

Safety/product boundaries:

- no contact email -> no email follow-up suggestion;
- a later inbound interaction removes the stale condition;
- archived/terminal/non-waiting bookings do not get this suggestion;
- the draft never changes Booking status;
- it never creates/completes a Next Action;
- it never chooses another channel automatically;
- final wording and sending remain human-owned.

Implementation:

```text
app/services/followUpDraft.ts
tests/followUpDraft.test.ts
app/components/BookingActivityComposer.vue
app/components/BookingCoreInbox.vue
```

Functional HEAD before this documentation update:

```text
624aaad9ca4bac4614b171c61bf49db1e5f8545e
```

CI tests for the functional HEAD passed. Production remains untouched.

## 46. Assistant loop friction reduction — IMPLEMENTED ON BRANCH

Three assistant-model refinements were added after the assisted follow-up block.

### Delivery failure resolves after a real retry

Delivery attention now evaluates the latest outbound email attempt per Booking rather than the latest historical failure.

Therefore:

```text
old hard bounce
-> artist retries
-> newer outbound accepted/delivered
-> old delivery warning disappears automatically
```

This prevents stale provider errors from creating permanent attention noise.

Implementation:

```text
app/services/bookingAttention.ts
tests/bookingAttention.test.ts
app/services/bookingCoreApi.ts
```

Functional commits:

```text
87ff7c161f7f83d8f0c23728857405c21d016a5b
92f34fa382f303b30b105a21017972fa00feb8c5
b48de508a3dec898d711374de6a30eae4c758d9d
```

### CUE opens the Booking it just created

`CueCapturePanel` already returned the newly created `CoreBooking`, but the workspace previously only refreshed the list.

Now:

```text
CUE create
-> refresh Booking Core
-> switch to Bookings
-> focus/open the exact newly created Booking
```

No extra search/click is required before continuing conversation, next action, hold or decision.

Functional commit:

```text
e860577ebb83eccd1df4bf6cf5041d7796c2086b
```

### Booking date / Hold drift is detected, not silently mutated

If a Booking date is edited while that Booking still has an active Hold on a different date, Cuebooker now surfaces the mismatch in the schedule/conflict notice.

The system deliberately does not move or release the Hold automatically.

```text
Booking date changes
-> active own Hold remains on old date
-> Cuebooker detects mismatch
-> artist reviews and chooses the correct action
```

This preserves artist control while preventing silent operational drift.

Functional commit:

```text
43fcf54645508e81a67817428befdf5fb47d8f51
```

No production changes were made.

## 47. Booking schedule synchronization invariants — IMPLEMENTED ON STAGING / BRANCH

This block tightens the boundary between derived synchronization and artist-owned decisions.

### Calendar remains a projection

Confirmed bookings continue to project directly from Booking truth. Editing a confirmed Booking date or schedule therefore updates Calendar without copying/synchronizing a separate calendar record.

No new calendar persistence layer was introduced.

### Confirmed Booking must retain an event date

A domain inconsistency was found:

```text
confirmed Booking
-> edit details
-> remove event_date
-> Booking remains confirmed
-> Calendar projection silently disappears
```

This is now prevented in two layers.

UI:

```text
BookingCoreEditor
-> confirmed + empty event date
-> save blocked with human copy
```

Database invariant:

```text
status = confirmed
=> event_date IS NOT NULL
```

Repository migration:

```text
20260918190000_enforce_confirmed_booking_date.sql
```

Staging had zero invalid confirmed bookings before applying the constraint.

A staging verification attempted to clear the date of a confirmed Booking inside a PL/pgSQL exception subtransaction. The database raised a check violation as expected and preserved the original row.

No new Supabase security advisor regression was introduced.

### Hold proposal follows Booking date safely

The new-Hold form now follows Booking.event_date when:

- the Hold date field is empty; or
- it still contains the previous Booking date.

If the artist deliberately chose another Hold date, Cuebooker preserves that explicit value.

This avoids silently reintroducing an old Booking date after editing the Booking.

### Hold schedule drift detection

Own active Holds are now checked against current Booking truth.

Cuebooker surfaces a review warning when:

- Hold date differs from Booking date; or
- a timed Hold is on the same date but its explicit time range no longer matches the Booking schedule.

An all-day Hold on the same Booking date remains valid; Cuebooker does not invent a time mismatch.

Timed Hold comparison is timezone-aware. Provider/Postgres timestamps may arrive normalized to UTC, so Cuebooker converts the Hold instant through `hold.event_timezone` (or Booking timezone fallback) before comparing it to Booking local start/end time. This prevents false drift such as `20:00Z` being treated as different from `22:00 Europe/Madrid`.

The system does not move, release or recreate the Hold automatically. That remains an artist decision.

Pure alignment logic + tests:

```text
app/services/bookingHoldAlignment.ts
tests/bookingHoldAlignment.test.ts
```

Relevant functional commits:

```text
796466201145d496b955723394b3f771f44d45bc
d1ad9dd6179763836b8ea02cdcab999e3bfd8d9c
15abf4e1772f4b8669c9316b775ef3566450cc84
be1c98751392d50320e5f72025eb6e5adfa6477f
55c67be1e98f0fda1d3cb3ea506bc9dbf1e5c5ee
e544d7fc65b0df0eaccb53729fdad9423319e97c
1cc581ae3a193b17d7bb9e520aa7038917b04ac1
0c40d843c5f4874b52461b5f3fccabd0693909a8
f1d418851a8fbcf4f390e9c18748a7842a32a840
```

Production remains untouched.

## 48. Assisted email retry + human Activity memory — IMPLEMENTED ON BRANCH

This block continues the assistant rule:

```text
detect mechanical failure
-> recover useful context
-> prepare the next action
-> human reviews
-> human sends
```

### Failed email retry is assisted, never automatic

When the latest real outbound email attempt for a Booking has one of these provider states:

```text
soft_bounce
hard_bounce
blocked
spam
invalid
error
```

Cuebooker now looks up the exact outbound Activity linked through:

```text
Activity.metadata.email_message_id
-> email_messages.id
```

If that Activity has a real subject + body, Conversation offers:

```text
Preparar reintento
```

The action restores the exact previous subject/body into the normal Email composer.

Safety boundaries:

- only the latest real provider-tracked attempt is considered;
- a later accepted/delivered attempt suppresses the retry suggestion;
- no linked outbound Activity -> no invented retry draft;
- missing current contact email -> no retry suggestion;
- failed delivery retry takes precedence over the stale 72-hour follow-up suggestion;
- Cuebooker never resends automatically;
- current contact email is used by the normal send path, so corrected contact data is respected.

Implementation:

```text
app/services/emailRetryDraft.ts
tests/emailRetryDraft.test.ts
app/components/BookingActivityComposer.vue
app/components/BookingCoreInbox.vue
```

### Activity detail changes use human language

`booking_details_updated` already records `changed_fields` in Activity.

The Activity UI now translates those database field names into product language.

Example:

```text
Before:
Booking actualizado · offer_amount_minor, event_date, start_time

Now:
Booking actualizado
Cambió: oferta, fecha, hora de inicio
```

No technical database column names need to leak into the artist-facing operational history.

Functional commits:

```text
7afcfc725920149ce77452f98a2537cde1ffa790
44c4004c77228cbdff8b8429305882a9bad0fd95
0a04408ddfd1031fc106db67e2fde9238835edce
9667ca3671a57656107f033d2c8f692977defd7d
0bfc0aa2649b8460216a00e80db55b25ea0dbcfc
```

Production remains untouched.

## 49. Commercial fact invariant — IMPLEMENTED ON STAGING / BRANCH

Cuebooker now treats Booking offer amount + currency as one atomic commercial fact.

Before adding the invariant, staging validation showed:

```text
currency without amount = 0
amount without currency = 0
negative amounts = 0
```

The current product paths were already behaving consistently, so the convention is now protected at database level for future ingress paths.

Invariant:

```text
offer_amount_minor IS NULL <=> currency IS NULL
```

Valid:

```text
no offer + no currency
120000 + EUR
```

Invalid:

```text
no amount + EUR
120000 + no currency
```

Repository migration:

```text
20260918193000_enforce_booking_offer_currency_pair.sql
```

Staging verification forced an invalid update inside an exception subtransaction. Postgres raised a check violation and preserved the original Booking.

The existing amount non-negative and ISO-like uppercase currency constraints remain in place.

Supabase security advisors show no regression from this invariant.

Production remains untouched.

## 50. Relationship Memory semantic hardening — IMPLEMENTED ON BRANCH

Relationship Memory now distinguishes relationship history from confirmed commercial outcome.

The relationship grouping remains identity-based:

```text
counterparty_id when present
otherwise primary_contact_id
```

All related Bookings still contribute to relationship history, including rejected/cancelled opportunities, because they are still part of the real relationship.

However:

```text
Último caché / Last fee
```

now comes only from the latest historically previous Booking that is:

```text
status = confirmed
offer_amount_minor present
currency present
```

An unconfirmed negotiation offer is no longer presented as historical cachet.

When the current Booking has an event date, `Última fecha` also uses only relationship Bookings with an earlier event date, so a later future Booking cannot be mislabelled as the previous date.

Pure derivation + tests:

```text
app/services/relationshipMemory.ts
tests/relationshipMemory.test.ts
app/components/BookingRelationshipMemory.vue
```

Functional commits:

```text
07136055ca84ca94d3b974f799dd87576962356f
529857a228f95272455b3fc7fdd940dda6b2adb0
b02d321f6915a35ebfd325903e2ea45a7e56ef4e
```

Production remains untouched.


## 51. Final email failure restores operational truth — IMPLEMENTED ON STAGING / BRANCH

Outbound conversational Activity automatically moves a non-terminal Booking to:

```text
waiting_response
```

A final provider delivery failure means that state is no longer operationally true.

Cuebooker now applies this deterministic correction only when all guards pass:

```text
email is outbound
delivery_status changed
delivery_status is final failure:
  hard_bounce
  blocked
  spam
  invalid
  error
email is the latest outbound attempt for that Booking
Booking.status = waiting_response
Booking is not archived
```

Then:

```text
waiting_response
-> in_conversation
```

and Cuebooker writes a traced internal `status_change` Activity with:

```text
automatic = true
reason = outbound_delivery_failed
delivery_status
email_message_id
```

Conservative exclusions:

- `deferred` does not change Booking status;
- `soft_bounce` does not change Booking status;
- a callback arriving late for an older email cannot overwrite the state created by a newer attempt;
- terminal commercial states are never changed;
- archived Bookings are never changed.

Repository migration:

```text
20260918213000_sync_booking_status_from_email_delivery.sql
```

Staging rollback smoke verified:

```text
older email hard-bounces
-> Booking remains waiting_response

latest email hard-bounces
-> Booking becomes in_conversation
-> exactly 1 automatic status_change Activity
-> ROLLBACK
```

No smoke rows remained after rollback.

Functional commit:

```text
8269560f00aa4b4bc1faf46154744636821ff722
```

Supabase security/performance advisors introduced no new regression.

Production remains untouched.

## 52. Retry assistant respects corrected contact email — IMPLEMENTED ON BRANCH

The failed-email retry assistant now compares:

```text
failed email_messages.to_email
vs
current Contact.email
```

If the Contact email was corrected after the failed send, Cuebooker tells the artist that the retry will use the updated address.

The assistant still restores the exact previous subject/body from the failed outbound Activity.

Behavior:

```text
email to old address fails
-> Contact email is corrected
-> Prepare retry appears
-> Cuebooker explains that the recipient changed
-> composer uses current Contact.email
-> artist reviews
-> artist explicitly sends
```

No resend is automatic and no historical email recipient is rewritten.

Implementation:

```text
app/services/bookingCoreApi.ts
app/services/emailRetryDraft.ts
tests/emailRetryDraft.test.ts
app/components/BookingCoreInbox.vue
app/components/BookingActivityComposer.vue
```

Functional commits:

```text
9b39831ea1c33664201644fce18b3658a4dd579a
28d90e950bfc87abd856152ee22e956a89ea7b4d
580a2c3e54e45401b67d648647328befc6d6d194
729833b77d1f7abb4461181bb6a46ea4b490a95b
3ed7c2275428e1d8ca12b49a5be3e18a8504fede
```

Production remains untouched.

## 53. Conversation contact attribution — IMPLEMENTED ON BRANCH

Conversation Activity already stores its own `contact_id`, but the thread UI previously labelled every inbound/outbound item using the Booking's current primary Contact.

That could misattribute historical communication if:

- another contact participated in the Booking;
- the primary contact changed later;
- imported communication referenced a different linked contact.

The thread now resolves each Activity through its own `contact_id` first.

Fallback:

```text
Activity.contact_id -> matching Contact.name
else -> current primary Contact
else -> generic Contact
```

This preserves historical communication attribution while keeping the current primary Contact as the sending target for new email.

Visible Activity type labels are also humanized:

```text
phone -> Llamada / Call
note -> Nota / Note
whatsapp -> WhatsApp
instagram -> Instagram
email -> Email
```

Functional commit:

```text
fb8f048aae9d95c90f27e0b884bbd7a30060c4bc
```

Production remains untouched.

## 54. Confirmation converts the correct Hold — IMPLEMENTED ON STAGING / BRANCH

A confirmation edge case was fixed in `set_booking_status`.

Previously, when several active Holds existed on the same Booking date, confirmation selected the Hold only by:

```text
event_date
priority
created_at
```

A higher-priority Hold with the wrong time range could therefore be converted even when the Booking already had a precise schedule.

Confirmation now keeps the same human decision flow but selects the Hold more precisely.

Rules:

```text
same Booking
active Hold
same event_date

if Booking has no complete start/end:
  same-date Hold can match

if Booking has complete start/end:
  all-day Hold can match
  OR timed Hold must match Booking local start/end
```

Timed comparison is timezone-aware through the Hold timezone with Booking timezone fallback.

When several Holds match, an exact timed Hold is preferred over an all-day Hold, then normal priority/creation ordering applies.

All remaining active Holds for the Booking are released automatically after confirmation, exactly as before.

Staging rollback smoke:

```text
Booking 22:00–23:30 Europe/Madrid

Hold A
priority 1
20:00–21:00 local
-> released

Hold B
priority 5
22:00–23:30 local
-> converted

Booking
-> confirmed

hold_converted Activity = 1
hold_released Activity = 1
-> ROLLBACK
```

No smoke Booking remained after rollback.

Repository migration:

```text
20260918214500_match_hold_schedule_on_confirmation.sql
```

Functional commit:

```text
632d61a586b689d404bb6c23a5a5a739bcbf61d0
```

Supabase advisors introduced no new regression.

Production remains untouched.

## 55. Full Booking Core loop revalidated — STAGING

After the latest automation/invariant hardening, the core operational loop was re-run in staging using the actual domain RPCs and Activity triggers inside a transaction with rollback.

Flow:

```text
Smart CUE booking
-> edit Booking details
-> outbound WhatsApp Activity
-> automatic waiting_response
-> Next Action with inbound_activity completion trigger
-> inbound WhatsApp Activity
-> automatic in_conversation
-> Next Action auto-completed
-> timed Hold created
-> manual Confirm decision
-> matching Hold converted
-> Booking confirmed
-> Activity/Calendar projection verified
-> ROLLBACK
```

Observed state before rollback:

```text
booking_status = confirmed
event_date = 2026-12-31
schedule = 22:00–23:30
offer = 1200 EUR
hold_status = converted
next_move_completed = true
conversation Activity = 2
status_change Activity = 3
booking_details_updated Activity = 2
automatic Next Action completion = 1
hold_converted Activity = 1
```

The three status changes are the expected:

```text
new/in_conversation path -> waiting_response after outbound
waiting_response -> in_conversation after inbound
in_conversation -> confirmed after explicit human decision
```

Rollback cleanup verification:

```text
smoke Bookings remaining = 0
```

Validation for functional HEAD `a2437b80ab0684325397bfb9c05ee287c9ac95b3`:

```text
CI run 35386567522 = success
Deploy Staging / PR preview run 35386567552 = success
```

This SQL smoke starts after Smart Capture has produced structured CUE data. Voice transcription/interpretation remains a separate ingress layer already connected to the same Smart CUE command.

Production remains untouched.

## 56. Static responsive/accessibility smoke — IMPLEMENTED ON BRANCH

A code-level responsive/accessibility smoke was run across the current Booking Core loop because the authenticated Cloudflare preview is not interactable from the current browser tool.

This is explicitly not a substitute for final visual QA in staging.

Reviewed surfaces:

```text
CUE capture
Booking list/detail
Conversation composer
Follow-up/retry suggestions
Booking decisions
Next Action / Hold operations
Conflict notice
Workspace mobile navigation
Calendar controls
```

### Mobile touch targets

Several important controls were functionally correct but too small for comfortable mobile use:

```text
conversation type buttons ~28px
booking decisions ~31px
booking filters ~36px
CUE channel buttons ~31px
workspace nav ~34px
```

On mobile these key interactive targets now use approximately 44px minimum height while desktop density remains unchanged.

Updated:

```text
app/components/BookingActivityComposer.vue
app/components/BookingCoreInbox.vue
app/components/BookingCoreOperations.vue
app/components/CueCapturePanel.vue
app/pages/workspace.vue
```

### Keyboard focus visibility

Workspace/CUE inputs removed the native outline, but there was no complete replacement focus-visible system.

Keyboard focus is now restored using the Cuebooker accent:

```text
button:focus-visible
a:focus-visible
input:focus-visible
select:focus-visible
textarea:focus-visible
```

Mouse/touch appearance is unchanged; keyboard navigation now has a visible focus indicator.

Functional commits:

```text
2af7befed0c6ab038e100b4e9c3bd3f445ad4ce2
9f6171b2249b1f1fbd7cc4fd8adfc510e562421c
16df001c76ea449a739376e36f155a4c44010776
04be59e29da9b40dea4a712fe8160858dd606b6c
5afdc110ed94ce33615c195f387c5529d61424d8
d9e1508ad05b7454f9a253b5dc58b6e8363cd55c
5f703fc3ef0d30eb73a87784e41b049da5236031
```

Production remains untouched.

## 57. UX navigation closure — IMPLEMENTED ON BRANCH

A final non-visual UX pass focused on interaction semantics rather than further layout changes.

### Conversation zero state is actionable

The empty thread no longer stops at “no activity”. It now tells the artist how to start the operational thread:

```text
Nota
Llamada
WhatsApp
Instagram
Email
```

This matches the composer directly below and avoids a dead empty state.

### Opened Booking receives accessible focus

Opening a Booking from list/Calendar/History/Overview already scrolled the detail into view, but keyboard/screen-reader focus could remain on the previous trigger.

The Booking detail is now programmatically focusable (`tabindex=-1`) and receives focus with `preventScroll` after the normal scroll alignment.

### Booking deep-link state is consistent

Notifications already persisted the opened Booking in the workspace query string, while Calendar/History/Overview did not.

All Booking entry points now converge on:

```text
openRealBooking(bookingId)
-> activeView = bookings
-> notification read sync
-> ?booking=<id> persisted with router.replace
```

When navigating away from Bookings, the stale `booking` query parameter is removed so reload cannot unexpectedly force the user back into an old Booking.

Functional commits:

```text
7d0240cdaced4f45bca316032204fc4b62416144
b0c7922e4c3a4a1bee365996340ebf11b3340a36
ff563fa72a92b7ad73b79453fcf7a493069645f0
6e69be2263d989e6ccda248474bc6c8ec36611c0
```

Final visual QA on the authenticated staging workspace remains a human/browser-render verification step; no further layout changes should be made without seeing an actual rendering issue.

Production remains untouched.

## 58. Voice capture priority restored — IMPLEMENTED ON BRANCH

An old resilience decision was still active in `CueVoiceInput`: browsers exposing SpeechRecognition preferred live browser dictation even when MediaRecorder was available.

That preference was introduced while the staging Smart Capture provider path was unavailable, but it no longer matches the current staging state.

Current order is now restored to:

```text
if MediaRecorder + getUserMedia are available:
  record audio
  -> Smart Capture server transcription
  -> semantic extraction
  + run SpeechRecognition in parallel only as fallback transcript

if audio/server path fails and browser transcript exists:
  browser transcript
  -> Smart Capture text extraction
  -> local parser if needed

if MediaRecorder is unavailable but SpeechRecognition exists:
  browser dictation remains the primary fallback mode
```

Recorder error cleanup now also stops the shadow SpeechRecognition instance, stops tracks, clears chunks and releases the recorder reference so a failed audio attempt cannot leave background capture running.

The voice button minimum target is also 44px.

Functional commits:

```text
72a51d06d6390758c608cb9bc3cdc91933172329
07db5eab5841f038cffa51438dc16130cb1f1eac
```

Remaining gate:

```text
fresh real desktop microphone smoke
fresh real iPhone microphone smoke
```

Do not call voice fully closed until both physical-device paths are proven.

Production remains untouched.

## 59. Delivery webhook observability — IMPLEMENTED ON STAGING / BRANCH

Final Brevo delivery tracking previously had one diagnostic blind spot:

```text
email_messages remains accepted
but we cannot tell whether:
  Brevo never called the webhook
  the webhook was called but could not correlate the message
  the webhook correlated but persistence failed
```

Cuebooker now records one minimal receipt for every authenticated transactional callback.

The receipt intentionally stores no email body and no full webhook payload.

Stored operational metadata:

```text
received_at
event_name
normalized_status
provider_message_id
tag_email_id
matched_email_id
match_method = none | tag | provider_message_id
processing_status = received | unmatched | persisted | error
processed_at
```

Table:

```text
public.email_delivery_webhook_receipts
```

Security:

```text
RLS enabled
anon SELECT = false
authenticated SELECT = false
service_role SELECT = true
no browser policies by design
```

The existing custom webhook secret remains the request authentication boundary.

The observability write is best-effort: if recording the receipt itself fails, email delivery processing continues.

The callback then updates the same receipt after processing:

```text
no email match -> unmatched
email match + email_messages update -> persisted
processing exception after receipt creation -> error
```

Repository migrations:

```text
20260918233000_add_email_delivery_webhook_receipts.sql
20260918233500_index_email_delivery_webhook_receipt_match.sql
```

Staging Edge Function:

```text
brevo-transactional-events ACTIVE v4
verify_jwt = false
custom x-cuebooker-webhook-secret still required
```

Initial receipt count after deployment:

```text
0
```

This is expected because no real authenticated Brevo callback has occurred after v4 deployment yet.

How to interpret the next real callback:

```text
no receipt row
-> no authenticated callback reached v4

receipt processing_status = unmatched
-> webhook reached Cuebooker but tag/message-id correlation failed

receipt processing_status = error
-> callback reached Cuebooker and failed during processing

receipt processing_status = persisted
-> callback reached Cuebooker, correlated and updated email_messages
```

Do not infer a Brevo configuration problem until this receipt evidence is checked.

Related functional commits:

```text
b74bbf8f855294e4702ba9b637ca6087a07b98cb
b24054d540aa90aa3e54a347fca9c55bd2fa6617
fef030a8e8db873da7f3380b817b4e20b139373b
```

Production remains untouched.

Voice capture mode policy is now unit-tested:

```text
app/services/voiceCaptureMode.ts
tests/voiceCaptureMode.test.ts
```

The tests lock the intended priority:

```text
MediaRecorder + SpeechRecognition -> recorder
SpeechRecognition only -> speech fallback
neither -> no voice mode
```

Functional commits:

```text
9209559c0fce8de9320fbaefd80b78a4871e1cc5
5227d1dce36f2b50aa7be9c955cedefdc5d849b4
85c8695c206e67bbfc29717dba537a52d329f7d6
```

## 60. Staging automation health check — VERIFIED

A direct staging health check was run after the latest automation work.

Current derived-operation state:

```text
expired active Holds = 0
unsent notification email deliveries = 0
delivery webhook receipts = 0
```

The zero webhook receipt count is expected immediately after deploying callback observability v4 because no new authenticated Brevo callback has occurred yet.

Both scheduled automation jobs are active every five minutes:

```text
cuebooker-expire-holds
schedule = */5 * * * *

cuebooker-notification-email-retry
schedule = */5 * * * *
```

Recent `cron.job_run_details` entries for both jobs repeatedly report:

```text
status = succeeded
return_message = 1 row
```

Therefore the automation layer is not merely configured; the schedulers are executing successfully in staging.

Production remains untouched.

## 61. Real attributed QR distribution — IMPLEMENTED ON BRANCH

The Distribution panel no longer stops at a QR-attributed URL.

Cuebooker now generates the QR locally from:

```text
/<artist-slug>?booking=1&src=qr
```

Behavior:

```text
Distribution
-> QR card
-> real QR preview
-> Download QR
-> SVG file generated locally
-> Copy link remains available
```

The QR is generated entirely client-side with `qrcode-generator` 1.4.4.

No external QR API receives the artist URL.

Downloaded filename:

```text
cuebooker-<slug>-booking-qr.svg
```

The QR keeps the same `src=qr` attribution contract, so scans still converge into the existing public intake / Booking Core pipeline.

Files:

```text
app/services/bookingQr.ts
tests/bookingQr.test.ts
app/components/PublicProfilePublishingControls.vue
package.json
package-lock.json
```

Validation:

```text
CI run 35400166808 = success
tests = success
Nuxt generate = success
```

Preview publication was still in progress at the time of this documentation commit.

Functional commits:

```text
51187db7164f95df3637ccbe7ef7b1c4da603935
d3c68386d189b2cc70c886c2214314cc6a74068e
726e99133a8e56a987c4c240b0825d7a927bee24
966242f103e3957bbac7997ac8d88dfb61df2c3d
fd2ed94f559e35239f8c203fa2cb27d4ed9d40c4
01c57a48c1389a4d6364774670c6c9522a7e2b94
```

Production remains untouched.

## 62. Unified Capture Engine — FIRST SLICE IMPLEMENTED ON BRANCH

CUE no longer owns separate Smart Capture/fallback policies for text and audio.

A single Capture Engine now owns:

```text
text -> Smart Capture -> SmartCaptureResult
text provider failure -> local parser -> SmartCaptureResult

audio -> server transcription + Smart Capture -> SmartCaptureResult
audio failure + browser transcript -> text Smart Capture -> SmartCaptureResult
audio + text provider failure -> local parser -> SmartCaptureResult
audio failure without fallback transcript -> retry/type message
```

The former `interpretationPreview` branch has been removed from CUE.

All successful/recoverable capture paths now converge into the same:

```text
SmartCaptureReview
-> confidence
-> evidence
-> warnings
-> explicit human Apply / Discard
```

Local fallback results are normalized into the same contract with limited confidence and a human review warning instead of a second UI.

Implementation:

```text
app/services/captureEngine.ts
app/composables/useCaptureEngine.ts
tests/captureEngine.test.ts
app/components/CueCapturePanel.vue
```

Validation:

```text
CI run 35400422315 = success
tests = success
Nuxt generate = success
```

This is the architectural first slice for future pasted WhatsApp/email/imported content. Do not create parallel capture models.

Production remains untouched.

## 63. Commercial website redesign direction — PROTOTYPE BEFORE CODE

The next commercial-home phase must not begin as another incremental CSS/content patch.

Product direction agreed:

```text
first design the website as a prototype
-> validate narrative, identity and impact
-> only then apply implementation code
```

The redesign must explain:

```text
what Cuebooker is
why it exists
what administrative friction it removes
what the artist remains in control of
how capture -> context -> next action works
why it is rooted in real booking/club work rather than vanity metrics
```

The home should sell benefits and operational relief before internal product terminology.

Visual direction should feel distinctive, credible and culturally connected to electronic music / club work without becoming a superficial nightlife caricature.

Do not implement the redesigned home in Nuxt until the prototype itself feels convincing.


## 64. CUE ID foundation — PRODUCT/ARCHITECTURE CONTRACT ADDED

CUE ID has now moved from broad product direction into a concrete V1 foundation before implementation.

New document:

```text
docs/CUE_ID_FOUNDATION.md
```

Foundation decisions:

- CUE ID remains inside the single Artist Profile;
- Photo / Artwork / CUE ID are presentation modes, not separate profiles;
- first family is deliberately constrained to `Club Minimal`;
- V1 persists semantic identity choices, never Three.js scene internals;
- static representation is first-class for immediate render, low-power devices, WebGL failure and future sharing;
- Three/Tres stays behind a lazy client boundary;
- booking/calendar/CUE capture critical paths must never depend on 3D;
- first editor is a bounded identity studio, not a Sims/game inventory;
- no XP, rarity, unlocks, genre-to-costume mapping or popularity mechanics;
- PASSPORT and SIGNAL are architecturally considered but explicitly excluded from the first CUE ID schema/slice;
- public/private boundaries inherit Artist Profile publication and artist-management permissions;
- appearance configuration should not be sent wholesale to generic analytics;
- first credible humanoid is downstream of editor-shell and persistence inspection, not the first implementation step.

`docs/CUE_ID_PRODUCT_VISION.md` was aligned with this V1 contract and now references the foundation explicitly.

Documentation commits:

```text
a1e4c1b890ce9f91ed2e18cd5b17a4d3fdb964f3
85b7379d9b0331e165fb6bed128c18ea7787d6ef
```

### Immediate next CUE ID task

Do not select/buy/build a humanoid asset yet.

First inspect actual current code/schema for:

```text
Artist Profile tables/fields
Artist Profile editor
PublicArtistProfile / Preview
/cue-id visual lab
artist-media storage + RLS
current visual-mode assumptions
```

Then define the smallest versioned persistence contract and typed asset catalogue that can support:

```text
Artist Profile
-> Photo / Artwork / CUE ID selector
-> CueIdStage static-first shell
-> semantic CUE ID config
-> later one Club Minimal humanoid family
```

Only after that foundation is proven should the real GLB/Tres renderer be integrated.

Commercial-home prototyping remains separate from production code. Its emerging visual language may anticipate CUE ID / PASSPORT / SIGNAL, but the website must not present those future layers as already available.

Production remains untouched.


## 65. CUE ID static editor shell — IMPLEMENTED ON BRANCH

The first implementation block now exists without persistence or Three.js.

Implemented:

```text
app/domain/cueId.ts
app/components/CueIdStage.vue
app/components/CueIdControls.vue
app/pages/cue-id.vue
```

### Domain contract

`app/domain/cueId.ts` defines the versioned semantic V1 config and the first typed catalogue.

Current first family:

```text
club_minimal
```

Current bounded choices:

```text
base
  masculine
  feminine
  neutral

build
  slim
  regular
  strong

outfit
  tank
  tee
  hoodie
  bomber

accessory
  none
  headphones
  cap
  glasses

pose
  neutral
  relaxed
  focused
  editorial

material
  matte
  satin

accent
  lime
  red
  none
```

This is intentionally small. It is a semantic product catalogue, not a renderer asset manifest yet.

### Static-first stage

`CueIdStage.vue` provides the immediate non-WebGL representation and already responds to the semantic config.

It supports:

- base/body differences;
- build differences;
- outfit treatment;
- accessory cues;
- pose;
- matte/satin treatment;
- lime/red accent;
- reduced-motion-aware animation;
- responsive mobile composition.

This remains a CSS/static foundation. It is not being presented as final 3D.

### Semantic controls

`CueIdControls.vue` exposes the same config through accessible buttons with visible selected state and keyboard focus.

The editor currently runs only in the non-indexed `/cue-id` laboratory.

The laboratory now shows:

```text
CueIdStage
-> CueIdControls
-> immediate local preview
```

Reset restores `DEFAULT_CUE_ID_CONFIG`.

Important:

- configuration is NOT persisted yet;
- no database migration has been added;
- no GLB/TresJS dependency has been added;
- no production/public Artist Profile is using CUE ID yet;
- PASSPORT/SIGNAL remain conceptual/future layers.

This is deliberate. The shell validates semantic choices, hierarchy and visual language before DB and renderer integration.

### Existing Artist Profile facts confirmed before implementation

Current profile persistence already lives on `public.artists` plus `artist_booking_profiles`.

Current visual profile fields include:

```text
cover_image_path
cover_position_y
artist_image_path
artist_cutout_path
artist_image_style
artist_image_position_x
artist_image_position_y
artist_image_scale
```

Current private media bucket:

```text
artist-media
```

with artist-scoped Storage policies.

Current authorization helpers:

```text
private.is_artist_member(artist_id)
private.can_manage_artist(artist_id)
```

Therefore CUE ID should reuse the existing artist permission boundary rather than invent a parallel authorization model.

### Validation state

Current branch HEAD:

```text
c7d171f36af97b8c082c335c581ad4c88cf71610
```

GitHub Actions at documentation time:

```text
CI = pending
Deploy Staging = in progress
```

Do not call the editor validated until CI/build finishes successfully and the rendered `/cue-id` lab is visually reviewed.

Implementation commits:

```text
6fa580b1d6f180381da7bfe44961c0d583a09352
ad4bc7cf855a39b00de0ae0f8f60a4146a475077
45f0265d1bd1a3710ec046ed48687f646bf6cfaf
c7d171f36af97b8c082c335c581ad4c88cf71610
```

### Next CUE ID block

After CI/build succeeds:

1. visually inspect `/cue-id` desktop + mobile;
2. refine semantic controls only if the lab exposes a UX problem;
3. define persistence against the existing artist boundary;
4. add RLS/grants tests before exposing persistence through the Data API;
5. integrate CUE ID presentation mode into Artist Profile;
6. only then introduce the first real GLB/TresJS renderer.

Production remains untouched.


## 66. CUE ID V1 persistence + Artist Profile editor — IMPLEMENTED ON STAGING / BRANCH

CUE ID now has a persisted V1 contract on staging and an integrated editor inside Artist Profile.

### Database

Staging migrations applied:

```text
20260919105051_add_cue_id_v1_persistence
20260919105231_harden_cue_id_v1_config
```

Repository files:

```text
supabase/migrations/20260919105051_add_cue_id_v1_persistence.sql
supabase/migrations/20260919105231_harden_cue_id_v1_config.sql
```

New `public.artists` columns:

```text
visual_mode
  photo
  artwork
  cue_id

cue_id_config jsonb
```

The JSON contract is versioned and constrained to the first `club_minimal` family.

Required V1 keys:

```text
schemaVersion
enabled
family
base
build
outfit
accessory
pose
material
accent
```

The database validates allowed V1 values and nullability for optional accessory/accent.

Authorization:

- existing `artists` RLS remains authoritative;
- existing artist membership/manage policies are reused;
- authenticated users receive UPDATE grant only for the new columns in addition to existing column grants;
- no new authorization model or public table was introduced.

Supabase advisors after migration reported no CUE ID-specific security/performance regression. Existing project advisories remain unchanged.

### Client persistence

`app/composables/useArtistProfile.ts` now:

- loads `visual_mode` and `cue_id_config`;
- keeps those fields out of the general Artist Profile form input;
- exposes `saveCueIdPresentation()` as the dedicated CUE ID persistence operation.

This keeps professional-profile editing and visual-identity persistence separate.

### Artist Profile editor

New component:

```text
app/components/CueIdProfileEditor.vue
```

Integrated into:

```text
app/pages/workspace.vue
-> Perfil
-> Identidad y ubicación
-> visual presentation editor
```

Current behavior:

```text
Photo
Artwork
CUE ID
```

Photo/Artwork remain available and their existing media configuration is not deleted.

When CUE ID is selected:

```text
CueIdStage
-> CueIdControls
-> explicit Save visual identity
-> public.artists.visual_mode + cue_id_config
```

The editor clearly states that CUE ID config remains private until the public projection is intentionally enabled.

No public Artist Profile behavior has been changed yet.

### Domain tests

Added:

```text
tests/cueId.test.ts
```

Coverage currently locks:

- V1 default config belongs to the typed Club Minimal catalogue;
- config cloning does not mutate the default contract;
- first catalogue breadth remains deliberately bounded.

### Current implementation commits

```text
288b0f91179b4bfd63d085a22474d6715eca48c5
1423f8bddac565a48712801748554473938f94b0
eb882fe4326dd862857e86efe9efb2b669f9214c
87704e861118464a905ddcceb2de5392a76e1988
a1792e4b5e227f79c2c140c0064c589bbbfe496f
9d0b8228b1fb24ba08ced79f1c6ca6ec9a6d9484
d868ac6c55ea48b2ce7a271ad08fa7e75df7dca5
```

Current branch HEAD at handoff:

```text
d868ac6c55ea48b2ce7a271ad08fa7e75df7dca5
```

Validation at documentation time:

```text
CI = in progress
Deploy Staging / PR preview = in progress
```

Do not call this slice fully validated until those runs finish successfully and the authenticated Artist Profile + `/cue-id` lab are visually checked.

### Important boundary

The public profile Edge Function currently projects only the existing photo/artwork fields.

It does NOT yet expose:

```text
visual_mode
cue_id_config
```

This is deliberate. Do not silently expose the raw private JSON config.

### Next CUE ID slice

After CI/build is green:

1. visually verify Artist Profile editor on desktop/mobile;
2. define the sanitized public CUE ID projection;
3. decide whether public rendering receives a sanitized semantic config or a pre-rendered static asset;
4. update `get-public-artist-profile` only with explicitly public fields;
5. make `PublicArtistProfile` honor Photo / Artwork / CUE ID;
6. keep static-first rendering;
7. only after that introduce the first real GLB/Tres renderer.

Production remains untouched.

## 67. Public CUE ID projection — IMPLEMENTED / EDGE FUNCTION V15

CUE ID now has an explicit public projection contract.

### Public domain

`app/domain/publicArtistProfile.ts` now exposes:

```text
visualMode?: 'photo' | 'artwork' | 'cue_id'
cueId?: PublicCueIdConfig | null
```

`PublicCueIdConfig` deliberately contains only:

```text
schemaVersion
family
base
build
outfit
accessory
pose
material
accent
```

It does NOT expose `enabled`, editor-only flags, renderer internals, private profile fields or booking/commercial data.

A shared `toPublicCueIdConfig()` helper is used by authenticated preview code so private preview and the public contract stay aligned.

### Public profile rendering

`PublicArtistProfile.vue` now supports `photo`, `artwork` and `cue_id`.

- missing `visualMode` stays backward-compatible and renders photo;
- `artwork` applies the Cuebooker portrait treatment;
- `cue_id` renders `CueIdStage` as the static-first identity;
- existing booking CTA, story and links remain unchanged;
- portrait and CUE ID are mutually exclusive inside the hero;
- no WebGL/Three renderer is loaded by this public path yet.

### Public Edge Function

`supabase/functions/get-public-artist-profile/index.ts` now reads `visual_mode` and `cue_id_config` but never returns raw `cue_id_config`.

The function sanitizes every public CUE ID field against the V1 catalogue before returning it.

If `visual_mode = cue_id` but the stored config is invalid, the public endpoint degrades to:

```text
visualMode = photo
cueId = null
```

Staging Edge Function:

```text
get-public-artist-profile
version 15
status ACTIVE
verify_jwt false
```

`verify_jwt=false` remains intentional because this is the existing public profile endpoint. Publication remains gated by `public_profile_enabled=true` inside the function.

At implementation time the published staging artist remains:

```text
slug = lits
visual_mode = photo
cue family = club_minimal
```

No artist data was modified to force a CUE ID smoke test.

### Tests

`tests/cueId.test.ts` now also verifies that the application-side public projection excludes `enabled` and contains only the intended safe keys.

### Implementation commits

```text
fa7aecf0a5de0223593e980c13c38721e40957c7
90b14ad47b9f5d06616b44e2881cc1d395492dff
d0b25964919c0183481b8b5feeebd4d828d7f0b5
71220346aabfb38a2129c81aba9c08537cc1e5d5
c0542543c8b6d8fb3146a786d9a64c53977c4e52
f1ec27a0d23f2d34a8ade4961b6d8744d2403326
```

### Validation boundary

The Edge Function deployment succeeded.

The available runtime could not directly curl the staging Supabase hostname, so a real HTTP payload smoke has not been claimed here.

### Next CUE ID block

After CI/build is green:

1. visually validate private preview and public profile on desktop/mobile;
2. choose the first real 3D runtime integration;
3. preserve `CueIdStage` as immediate/static fallback;
4. introduce a lazy client-only renderer;
5. begin with one procedural/placeholder 3D scene before committing to final humanoid assets;
6. measure bundle/runtime cost before adding GLB catalogue breadth.

Current research confirms the official TresJS Nuxt integration exists and is the preferred Vue/Nuxt-native route, but no 3D dependencies have been added yet.

Production remains untouched.

## 68. CUE ID interactive runtime proof — IMPLEMENTED

The first real interactive 3D runtime proof now exists without adding Three/Tres dependencies.

New runtime component:

```text
app/components/CueIdRuntime.client.vue
```

Integrated through:

```text
CueIdStage.vue
-> static fallback
-> preload-margin IntersectionObserver
-> dynamic client-only runtime import
-> native WebGL procedural Club Minimal figure
```

### Why native WebGL first

`package-lock.json` contains neither `three`, `@tresjs/core` nor `@tresjs/nuxt`.

Instead of editing package metadata without a correctly regenerated lockfile, the first runtime proof validates lifecycle and performance boundaries with browser-native WebGL.

This procedural figure is NOT final art direction and is explicitly replaceable.

### Runtime behavior

- static CUE ID renders immediately;
- runtime chunk is requested only near the viewport;
- CSS fallback disappears only after WebGL emits ready;
- render work pauses while offscreen or document is hidden;
- reduced-motion renders a still frame instead of a permanent idle loop;
- DPR is capped at 1.5;
- low-power context preference is requested;
- WebGL creation failure leaves static fallback active;
- `webglcontextlost` restores static fallback;
- runtime responds to semantic config (build, pose, outfit, accessory, material, accent);
- no booking/profile persistence logic exists inside the renderer.

### Renderer analytics

Consent-aware technical events:

```text
cue_id_renderer_ready
cue_id_renderer_failed
cue_id_static_fallback_used
```

`cue_id_renderer_ready` includes only:

```text
renderer
reduced_motion
init_ms
dpr_cap
```

No body/base/outfit/accessory/pose or appearance selections are sent.

### Current commits

```text
143889c4ff9a00dd3f7661a3904b1d30d23105a1
d1caf2df714737ad6ac4194324647ff9fccdf846
755bddf3098ab8aafcd71fe0b9e2daf6531205e8
1952b3deccb08836449b6743cd6dd1b643f68eb9
be180deaa69716a55a5d44bb12a8e2b65d11fd0a
9a94dfc25b51b96f9e69d7472cb4ccae038e18a1
```

`docs/CUE_ID_PERFORMANCE.md` now records this runtime proof and its replacement contract.

### Next runtime decision

Do not expand the procedural renderer into a custom engine.

Once this proof is visually/performance validated, replace the interactive implementation behind `CueIdStage` with the real TresJS/Three renderer and first GLB asset family.

Required next checks:

1. CI/build green;
2. `/cue-id` desktop and mobile visual review;
3. Artist Profile CUE ID editor review;
4. public profile with CUE ID selected on a staging test artist;
5. collect first `init_ms` data / local device observations;
6. then add TresJS using a correctly regenerated lockfile;
7. preserve all current fallback/lifecycle behavior.

Production remains untouched.

## 69. CUE ID runtime boundary hardening

Two runtime-boundary corrections were added after the first WebGL proof.

### Public profile remains static-first

`PublicArtistProfile.vue` now passes:

```text
:interactive="false"
```

to `CueIdStage`.

This means selecting `visual_mode = cue_id` on a published profile does NOT yet load the WebGL runtime.

Public rendering remains:

```text
sanitized public config
-> static CUE ID representation
-> no WebGL dependency
```

Interactive WebGL remains limited to controlled CUE ID editor/lab surfaces until runtime cost and visual quality are validated.

### Constrained-device gate

`CueIdStage.vue` now skips the interactive runtime when the browser reports:

```text
Save-Data enabled
or
deviceMemory <= 2 GB
```

In those cases the static fallback remains the full product representation.

A consent-aware technical event is emitted:

```text
cue_id_static_fallback_used
reason = save_data | low_device_memory
```

No appearance configuration is included.

### Commits

```text
3264719ff34c71d669aadc043f853f0ee3458cfd
5b6e5f438d1d204d858bd318341a995bb94ad036
```

### Next step

Do not make the public profile interactive until:

1. editor/lab runtime passes CI and staging;
2. desktop/mobile visual QA is complete;
3. runtime init and device behaviour are measured;
4. a real art-directed GLB/Tres renderer replaces the procedural proof;
5. public-profile performance comparison shows no unacceptable regression.

Production remains untouched.

## 70. CUE ID device tiers — ANDROID / MOBILE / DESKTOP

Performance policy is now explicit in both documentation and runtime code.

### Device tiers

Tier A — full interactive:
- capable recent mobile/desktop hardware;
- DPR cap up to 1.5;
- idle animation allowed;
- restrained effects only.

Tier B — reduced interactive:
- representative mobile / moderate-memory hardware;
- DPR cap 1.0;
- continuous idle animation disabled;
- event-driven / still rendering preferred;
- no heavy post-processing.

Tier C — static-first only:
- Save-Data enabled;
- deviceMemory <= 2 GB;
- WebGL unavailable/context lost;
- future measured threshold breach.

### Current runtime behavior

`CueIdStage.vue` blocks runtime import for Tier C detection before WebGL initialization.

`CueIdRuntime.client.vue` currently marks reduced quality when:

```text
deviceMemory <= 4 GB
or
viewport width <= 900px
```

In reduced quality:

```text
DPR cap = 1
idle loop = off
still/event-driven render = on
```

Public Artist Profile remains explicitly static-first with `:interactive="false"`.

### Android acceptance rule

Android is a first-class target. Before GLB/Tres production acceptance, validate:

- low/constrained Android;
- representative mid-range Android;
- recent high-end Android;
- Chrome;
- Samsung Internet where practical;
- DPR behavior;
- scroll responsiveness;
- background/screen-lock recovery;
- context loss;
- portrait/landscape canvas resize;
- memory pressure behavior.

If mid-range Android cannot maintain acceptable product interaction, quality must degrade before shipping.

### Tests

`tests/cueId.test.ts` now locks:

- public profile static-first behavior;
- Save-Data gate;
- <= 2 GB static-only gate;
- <= 4 GB / <= 900px reduced-quality gate;
- DPR reduction from 1.5 to 1.0.

### Commits

```text
270b6f4563d821b10dc6ecbac7ccf2ce8feace75
aa4ed5e7ecc1b76cdf480e5205e81529820ebeef
d15b4e9a79b6483974ae5380a620361d95ca12eb
```

Production remains untouched.

## 71. CUE ID asset admission pipeline — IMPLEMENTED

The first real 3D asset gate now exists before any GLB is accepted.

New domain file:

```text
app/domain/cueIdAssets.ts
```

It defines:

- device tiers (`full`, `reduced`, `static`);
- per-kind budgets for base/outfit/accessory assets;
- asset metadata required before admission;
- validation errors for size, triangles, materials, texture count, texture dimensions and invalid tier targeting;
- an intentionally empty `CUE_ID_ASSETS` catalogue.

Current base budget:

```text
compressed GLB <= 1,000,000 bytes
triangles <= 35,000
materials <= 4
textures <= 6
largest texture dimension <= 2048
```

Outfit and accessory budgets are stricter.

New tests:

```text
tests/cueIdAssets.test.ts
```

The tests prove that:

- a compliant base asset is accepted;
- oversized bytes/triangles/materials/textures are rejected;
- oversized textures are rejected;
- a GLB cannot target the static-only tier.

Research note:

```text
docs/CUE_ID_ASSET_RESEARCH.md
```

Technical benchmark candidates were identified from CC0 sources, including a Quaternius Casual Character (~3.35k triangles / ~322 KB) and a very light standing civilian (~1.2k triangles).

These are explicitly NOT accepted as final CUE ID art direction because they read as generic game/low-poly assets.

`CUE_ID_ASSETS` remains empty until a real art-directed humanoid passes both cultural/visual review and the runtime budgets.

Commits:

```text
324496775579997b704e97042cdcfb0b92f03e64
38571cca5e174311960ec4b0bb051df5f78f1ccb
516d64378af613c13c5dfc3bce151725408e0fcc
04fa9099e0e1fab1511c4b8800eb7c7cb1cf5d82
```

Next implementation block:

1. wait for CI/staging on this asset-gate slice;
2. add a real GLB loader only with a correctly regenerated dependency lockfile;
3. use a CC0 benchmark asset strictly for load/decode/Android measurement;
4. keep benchmark assets out of the selectable CUE ID catalogue;
5. replace benchmark with the first original/art-directed humanoid once the loader path is proven.

Production remains untouched.

## 72. Minimal TresJS integration — CORE ONLY

The 3D dependency decision is now implemented.

### Dependency choice

The first generated dependency lock compared:

```text
@tresjs/core + @tresjs/nuxt + three
vs
@tresjs/core + three
```

The Nuxt module variant pulled additional Nuxt UI/font/icon/tooling dependencies that are not required by Cuebooker's client-only CUE ID renderer.

Decision:

```text
KEEP: @tresjs/core ^5.9.0
KEEP: three ^0.186.0
DO NOT ADD: @tresjs/nuxt
```

`package.json` and `package-lock.json` were regenerated by npm inside a temporary GitHub Actions workflow and committed automatically to the feature branch.

The temporary workflow was removed immediately after the reproducible lock was committed.

### Manual Nuxt compiler integration

`nuxt.config.ts` now imports:

```text
templateCompilerOptions from @tresjs/core
```

and passes them through `vite.vue`.

This follows the manual TresJS core setup while avoiding the heavier Nuxt module.

### First Tres scene

New component:

```text
app/components/CueIdScene.client.vue
```

It currently renders the same procedural human-direction proof using Tres primitives.

Performance defaults:

```text
renderMode = on-demand
DPR = device-tier decision
antialias = full tier only
failIfMajorPerformanceCaveat = true
reduced tier powerPreference = low-power
no shadows
no post-processing
no continuous idle loop
```

`CueIdStage.vue` now lazy-loads `CueIdScene.client.vue` instead of the native WebGL proof.

The public Artist Profile remains static-first and does not load TresJS.

### GLB loader boundary

`app/services/cueIdAssetLoader.ts` now provides a bounded binary GLB v2 loader before renderer handoff.

It enforces catalogue byte limits, HTTP errors, timeout/abort, GLB magic/version and declared-length validation.

Tests:

```text
tests/cueIdAssetLoader.test.ts
tests/cueIdRuntime.test.ts
```

### Important

The old `CueIdRuntime.client.vue` native WebGL proof is temporarily retained only as a comparison/reference implementation until the TresJS scene passes CI/staging and visual validation.

Do not extend the native renderer further.

Production remains untouched.

## 73. Real GLB benchmark path — IMPLEMENTED IN LAB ONLY

The CUE ID lab now exercises a real GLB through the bounded asset pipeline.

Benchmark asset:

```text
public/cue-id/benchmarks/rigged-figure.glb
size = 50,116 bytes
source = KhronosGroup/glTF-Sample-Assets / RiggedFigure
copyright = 2017 Cesium
license = CC BY 4.0
```

Attribution is stored next to the benchmark asset in:

```text
public/cue-id/benchmarks/README.md
```

The benchmark is intentionally excluded from `CUE_ID_ASSETS` and is not selectable by users.

### Runtime path

```text
/cue-id lab
-> CueIdStage benchmark mode
-> device tier decision
-> lazy CueIdScene.client.vue
-> loadCueIdGlbBuffer()
-> byte ceiling + GLB v2 validation
-> GLTFLoader.parseAsync(ArrayBuffer)
-> normalize scene bounds
-> TresJS primitive
-> first rendered frame metric
```

The renderer does NOT bypass the bounded loader with a direct Three.js URL fetch.

### Metrics

`cue_id_glb_benchmark_loaded` now records only technical data:

```text
bytes
load_ms
parse_ms
first_frame_ms
runtime_tier
```

No appearance choices or user-identifying data are included.

### Isolation

- benchmark mode is enabled only on `/cue-id`;
- Artist Profile editor does not request the benchmark asset;
- public Artist Profile remains static-first;
- the benchmark is not a product catalogue entry;
- the native WebGL proof component has been removed.

### Purpose

This benchmark exists only to validate:

- real GLB transfer;
- binary budget enforcement;
- Three GLTF parsing;
- TresJS scene insertion;
- first-frame timing;
- Android/mobile/desktop device-tier behavior.

It is NOT the final CUE ID visual language.

Next step after CI/staging validation:

1. record benchmark timings on representative desktop/mobile/Android devices;
2. compare Tier A vs Tier B;
3. refine thresholds if required;
4. then integrate the first original/art-directed humanoid behind the same loader and scene boundary.

Production remains untouched.

## 74. Club Minimal V1 production art-direction contract

The first shippable CUE ID humanoid now has an explicit visual and technical acceptance contract.

New document:

```text
docs/CUE_ID_CLUB_MINIMAL_ART_DIRECTION.md
```

It defines:

- silhouette and proportion rules;
- restrained head/face treatment;
- slim / regular / strong body semantics;
- masculine / feminine / neutral bases as visual starting points only;
- V1 tank / tee / hoodie / bomber wardrobe direction;
- professional DJ headphone / cap / glasses rules;
- neutral / relaxed / focused / editorial poses;
- matte / satin material language;
- lime / red / none accents as signals, not costume;
- low-cost lighting and camera rules;
- mobile-first geometry/texture targets;
- Tier A / B / C behavior;
- a 12-point visual/product acceptance checklist.

Preferred production target is intentionally stricter than the hard performance ceiling:

```text
triangles: 18k–28k preferred / 35k hard ceiling
materials: 2–4
textures: 2–4 preferred / 6 max
texture dimension: 1024 preferred / 2048 max
compressed GLB: 450–850 KB preferred / 1 MB max
```

### Asset descriptor hardening

`app/domain/cueIdAssets.ts` now requires every asset to declare:

```text
purpose: production | benchmark
artDirection: club_minimal_v1 | external_benchmark
optional attribution metadata
```

Production assets must use `club_minimal_v1`.

The Khronos RiggedFigure remains explicitly:

```text
purpose = benchmark
artDirection = external_benchmark
creator = Cesium
license = CC-BY-4.0
```

and remains outside `CUE_ID_ASSETS`.

Tests now prevent:

- an external benchmark from being treated as production art direction;
- benchmark attribution from becoming implicit/undocumented;
- the benchmark asset entering the selectable catalogue.

Commits:

```text
e7ad8c8975df69f329d302d16674562b5ae5f4b5
3d4b0c21e733c3f1c89adc71f7bf050def988731
533d6805dc3dbfbd49af576aa5be3b395c0e14fd
```

Next block:

1. wait for CI/staging on this contract slice;
2. create/select the first genuinely art-directed Club Minimal humanoid candidate;
3. record real geometry/material/texture/GLB metadata;
4. run the asset gate;
5. benchmark Tier A and Tier B;
6. reject it if it reads as game/avatar/metaverse even when technically compliant;
7. only after both visual and performance acceptance add it to `CUE_ID_ASSETS`.

Production remains untouched.

## 75. First original Club Minimal candidate — GENERATED / LAB ONLY

The first original Cuebooker humanoid candidate now exists as a reproducible GLB.

Generator:

```text
scripts/generate-cue-id-club-minimal-candidate.py
```

Generated files:

```text
public/cue-id/candidates/club-minimal-candidate-v1.glb
public/cue-id/candidates/club-minimal-candidate-v1.json
```

Current generated metadata:

```text
bytes = 33,164
triangles = 1,320
vertices = 692
materials = 4
textures = 0
artDirection = club_minimal_v1
status = candidate_not_production
```

The candidate is intentionally far below the hard mobile budget. This leaves headroom for future art-direction refinement, rigging and higher-quality geometry.

### Visual review correction

The first generator iteration revealed an axis error: trimesh cylinders are Z-axis by default while the CUE ID scene uses Y-up.

This caused disconnected-looking arms/legs/neck in the first internal silhouette review.

The generator was corrected to:

- rotate cylindrical limbs to Y-up;
- reduce head scale;
- tighten torso proportions;
- reconnect arm/leg silhouette;
- retain restrained headphones-around-neck cue;
- preserve the lime seam as a small signal rather than costume.

The corrected asset was regenerated and passed the automated budget gate.

### Product status

The candidate is registered as:

```text
purpose = candidate
artDirection = club_minimal_v1
```

It is NOT present in `CUE_ID_ASSETS` and is NOT production-approved.

`/cue-id` now previews this candidate through the same bounded GLB loader + TresJS pipeline used for the benchmark.

The Khronos benchmark remains available as technical reference but the lab defaults to the original Club Minimal candidate.

### Runtime telemetry

Lab asset metrics now use a generalized event:

```text
cue_id_glb_lab_asset_loaded
```

with:

```text
asset_id
bytes
load_ms
parse_ms
first_frame_ms
runtime_tier
```

### Tests

`tests/cueIdAssets.test.ts` now also verifies:

- candidate remains outside the production catalogue;
- candidate passes the asset budget validator;
- generated JSON metadata matches the TS descriptor;
- real GLB file size matches the descriptor;
- status remains `candidate_not_production`.

### Next visual block

Do not promote this candidate yet.

Next work should be:

1. visually review the corrected candidate on staging desktop/mobile;
2. inspect silhouette at real profile sizes;
3. decide whether to increase geometry toward the 18k–28k preferred production range or keep a deliberately low-poly sculptural direction;
4. refine head/shoulder/hand/leg continuity and wardrobe volumes;
5. introduce rig/pose only after the static silhouette feels credible;
6. benchmark Tier A and Tier B after each meaningful geometry increase;
7. only then consider moving the asset from `candidate` to `production` and adding it to `CUE_ID_ASSETS`.

Production remains untouched.

## 76. Club Minimal candidate — silhouette refinement pass 2

The original candidate has been refined without materially increasing runtime cost.

Main visual changes:

- tee changed from a front plate into a full torso volume;
- shoulder joint volumes added to connect arms to torso;
- hand scale reduced;
- hips changed from box to rounded sculptural volume;
- hip joint volumes added to connect legs;
- boots reduced;
- stance gained mild left/right asymmetry;
- lime accent remains a narrow seam rather than costume.

Generated metadata after refinement:

```text
bytes = 37,840
triangles = 1,708
vertices = 894
materials = 4
textures = 0
```

Compared with previous candidate:

```text
33,164 -> 37,840 bytes
1,320 -> 1,708 triangles
692 -> 894 vertices
```

The increase is intentionally small and remains far below mobile budgets.

Status remains:

```text
purpose = candidate
status = candidate_not_production
```

Do not promote yet.

Next review should focus on:

1. silhouette at real mobile profile size;
2. head/neck editorial proportions;
3. shoulder-to-arm continuity;
4. leg taper and foot proportion;
5. whether the low-poly sculptural direction feels authored rather than primitive;
6. only then consider rigging or additional geometry.

Production remains untouched.

## 77. Club Minimal candidate — silhouette refinement pass 3

The candidate received a third shape pass focused on authored silhouette rather than polygon count.

Changes:

- tee is now a lofted shoulder/chest/waist volume instead of a simple box;
- arms use tapered frustums instead of cylinders;
- legs use tapered frustums instead of cylinders;
- feet were reduced again;
- stance asymmetry was preserved;
- no new textures or expensive material features were introduced.

Generated metadata:

```text
bytes = 37,992
triangles = 1,716
vertices = 898
materials = 4
textures = 0
```

Performance impact versus pass 2 is negligible:

```text
37,840 -> 37,992 bytes
1,708 -> 1,716 triangles
894 -> 898 vertices
```

This confirms that the current improvements are shape/topology improvements rather than brute-force geometry increases.

Status remains candidate-only.

Next gate:

1. CI + staging must remain green;
2. review the v3 silhouette at mobile and desktop sizes;
3. only if the static silhouette reads as authored/editorial should rigging begin;
4. otherwise do another shape pass before any animation work.

Production remains untouched.

## 78. Club Minimal candidate — pose/continuity pass 4

The candidate now has authored body articulation without introducing a rig.

Changes:

- waist bridge added between tee and hips;
- arms split into upper arm / elbow / forearm / hand;
- left/right arm pose uses restrained asymmetry;
- legs split into thigh / knee / shin / boot;
- stance asymmetry preserved;
- no textures, shadows or post-processing added.

Generated metadata:

```text
bytes = 45,904
triangles = 2,272
vertices = 1,194
materials = 4
textures = 0
```

The asset remains dramatically below production ceilings.

This pass is intended to improve human/editorial read before any rigging work.

Status remains:

```text
purpose = candidate
status = candidate_not_production
```

Next decision:

1. validate CI/staging;
2. review head/shoulder/pose silhouette at actual mobile scale;
3. if silhouette is credible, begin a minimal semantic rig/pose strategy;
4. if not, refine static geometry first;
5. do not add facial rig, post-processing or texture complexity yet.

Production remains untouched.

## 79. Club Minimal candidate — quality headroom + head/clavicle pass 5

The quality strategy was clarified: do not optimize for the smallest possible asset if additional budget materially improves the identity.

Current universal production ceiling remains:

```text
base GLB <= 1,000,000 bytes
triangles <= 35,000
materials <= 4
textures <= 6
```

Assets may approach the upper geometry range when the visual gain is measurable and Tier B remains healthy.

### Runtime headroom helper

`getCueIdAssetHeadroom()` now reports remaining bytes/triangles/materials/textures and usage ratios.

For candidate v5:

```text
bytes = 43,776
triangles = 2,164
vertices = 1,142
materials = 4
textures = 0
```

Approximate current usage:

```text
bytes: ~4.4% of base ceiling
triangles: ~6.2% of base ceiling
materials: 100% of material ceiling
textures: 0% of texture ceiling
```

Therefore the current constraint is NOT geometry. Future visual refinement should spend geometry budget freely when useful, while avoiding additional materials unless the contract is deliberately revised.

### Visual pass 5

Changes:

- generic icosphere head replaced with an authored elliptical loft;
- head now includes distinct crown / forehead / cheek / jaw / chin planes;
- neck changed to tapered frustum;
- clavicle bridge added between neck and shoulders;
- this increased visual authorship while reducing asset cost versus v4.

v4 -> v5:

```text
45,904 -> 43,776 bytes
2,272 -> 2,164 triangles
1,194 -> 1,142 vertices
```

This is the desired direction: use topology more intelligently before brute-force subdivision.

### Maximum-quality policy

If future refinement genuinely needs 30k–35k triangles, use them.

Do NOT exceed the universal ceiling merely because desktop can handle it.

If measured desktop quality eventually requires substantially more geometry, introduce explicit Tier A / Tier B LOD assets rather than increasing the mobile-safe default.

Status remains:

```text
purpose = candidate
status = candidate_not_production
```

Production remains untouched.

## 80. Semantic pose rig — node transforms before skeletal skinning

The first rigging layer is now implemented without bones or skinning.

New domain file:

```text
app/domain/cueIdPose.ts
```

It defines the four semantic poses:

```text
neutral
relaxed
focused
editorial
```

Each pose contains restrained root transforms plus named-node deltas for the generated candidate.

Current strategy:

```text
generated named GLB parts
-> remember base transforms
-> apply semantic pose deltas
-> redraw on demand
```

This avoids:

- continuous animation loops;
- skeletal overhead before it is necessary;
- pose drift from cumulative transforms;
- additional GLB weight;
- introducing a rig before the static identity is visually proven.

`CueIdScene.client.vue` now:

- stores original node transforms after GLB normalization;
- applies pose deltas from the original base every time;
- updates the candidate when `config.pose` changes;
- keeps benchmark assets untouched;
- keeps TresJS in `renderMode=on-demand`.

Tests:

```text
tests/cueIdPose.test.ts
```

They verify:

- exactly four semantic poses;
- neutral is zero-delta;
- pose transforms remain restrained;
- all referenced node names exist in the candidate generator.

Decision rule:

Do not add skeletal skinning merely because it is more sophisticated.

Keep semantic node posing if it delivers credible editorial silhouettes.

Only introduce bones/skinning if visual review shows clear limitations in:

- elbow/knee continuity;
- shoulder deformation;
- clothing deformation;
- pose naturalism;
- future motion/animation requirements.

Production remains untouched.

## 81. Semantic build transforms — one GLB, three body reads

The Club Minimal candidate now supports the semantic build dimension without duplicating assets.

New domain file:

```text
app/domain/cueIdBuild.ts
```

Builds:

```text
slim
regular
strong
```

Strategy:

- preserve the same GLB;
- scale only selected named nodes;
- keep Y/height largely stable;
- alter width/depth subtly;
- keep all scale multipliers in the 0.90–1.12 range;
- avoid caricature or status implication.

`CueIdScene.client.vue` now stores base scale in addition to base rotation/position and combines:

```text
base transform
+ semantic pose
x semantic build
```

from the original transform on every update.

This prevents cumulative drift when users switch between builds/poses.

Tests:

```text
tests/cueIdBuild.test.ts
```

They verify:

- exactly three builds;
- regular is the neutral scale reference;
- scales remain restrained;
- every referenced node maps to the generated candidate source.

Network/runtime cost:

```text
additional GLB bytes = 0
additional textures = 0
additional materials = 0
continuous render loop = 0
```

Production remains untouched.

## 82. Club Minimal PBR material contract + semantic surface controls

The generated Club Minimal candidate now exports real shared PBR materials instead of vertex colors.

Verified GLB material names:

```text
body
mid
dark
accent
```

Verified asset facts:

```text
bytes = 39,968
triangles = 2,164
vertices = 1,142
materials = 4
textures = 0
```

Leg nodes were also normalized to semantic left/right names (`thigh_left`, `knee_left`, `shin_left`, etc.) so the generated GLB now matches the semantic rig exactly.

New domain file:

```text
app/domain/cueIdMaterial.ts
```

It defines:

- matte PBR preset;
- satin PBR preset;
- lime / red / neutral accent colors.

`CueIdScene.client.vue` now combines, on the same GLB:

```text
semantic pose
semantic build
semantic material
semantic accent
```

Material changes reuse the four existing GLB materials. They do not create textures, do not add GLB bytes, and keep TresJS in on-demand rendering.

New tests:

```text
tests/cueIdMaterial.test.ts
```

They inspect the real GLB binary and verify:

- GLB v2;
- exactly four named materials;
- zero textures;
- restrained PBR roughness/metalness ranges;
- distinct lime/red/neutral accent options.

Production remains untouched.

## 83. Semantic base silhouettes + completed appearance stack

The Club Minimal candidate now applies five semantic dimensions on the same GLB:

```text
base
build
pose
material
accent
```

### Base strategy

New domain file:

```text
app/domain/cueIdBase.ts
```

Supported bases:

```text
masculine
feminine
neutral
```

`neutral` remains the exact scale reference.

Masculine/feminine variants use intentionally small clavicle / shoulder / torso / waist / hip scale changes only.

Current scale variation stays within approximately 0.98–1.035 for authored nodes. It is not a separate body-rating system and should not be made more stereotyped without explicit visual review.

`CueIdScene.client.vue` now combines from original transforms:

```text
base node scale
x build node scale
+ pose rotation/position
+ material PBR preset
+ accent color
```

Every change is reapplied from remembered original GLB transforms to prevent cumulative drift.

### Nullable accent contract

The persisted config remains:

```text
accent = lime | red | null
```

`null` maps to the neutral graphite accent through `getCueIdAccentColor()`; no artificial `none` value was added to the persisted schema.

### Tests

New/updated tests cover:

```text
tests/cueIdBase.test.ts
tests/cueIdBuild.test.ts
tests/cueIdPose.test.ts
tests/cueIdMaterial.test.ts
tests/cueIdAssets.test.ts
```

The material test inspects the real GLB JSON chunk and locks:

- four named PBR materials;
- zero textures;
- material preset limits.

Current candidate remains:

```text
bytes = 39,968
triangles = 2,164
materials = 4
textures = 0
purpose = candidate
status = candidate_not_production
```

Remaining semantic dimensions still not fully implemented on the real candidate:

```text
outfit
accessory
```

Production remains untouched.

## 84. Full semantic Club Minimal candidate — outfits + accessories

The lab candidate now covers all persisted CUE ID semantic dimensions:

```text
base
build
outfit
accessory
pose
material
accent
```

### Outfit visibility

New domain:

```text
app/domain/cueIdOutfit.ts
```

Outfits:

```text
tee
tank
hoodie
bomber
```

Each outfit maps to an isolated set of GLB node names. Only the selected outfit is visible before the candidate is presented.

### Accessory visibility

New domain:

```text
app/domain/cueIdAccessory.ts
```

Accessories:

```text
none
headphones
cap
glasses
```

`null` remains the persisted value for no accessory.

### Generated candidate after full variant coverage

```text
bytes = 60,632
triangles = 3,436
vertices = 1,796
materials = 4
textures = 0
```

Current approximate base-budget usage:

```text
bytes ~6.1%
triangles ~9.8%
materials 100%
textures 0%
```

This is still extremely light for the lab candidate.

### Performance architecture

The current lab keeps all outfit/accessory geometry in one GLB because the full file is only ~60 KB.

This is NOT a requirement for production art.

When art-directed production variants become materially heavier, prefer:

```text
base GLB
+ selected outfit asset loaded on demand
+ selected accessory asset loaded on demand
```

especially for Tier B.

Do not force mobile users to download unused high-detail wardrobe/accessory geometry simply because the proof-of-concept candidate can afford it.

### Tests

`tests/cueIdVisibility.test.ts` now verifies:

- four outfit visibility groups;
- three accessory groups plus null;
- no accidental node sharing;
- every mapped visibility node exists in the generated GLB binary itself.

Current candidate remains:

```text
purpose = candidate
status = candidate_not_production
```

Production remains untouched.

## 85. CUE ID lab runtime diagnostics

`/cue-id` now exposes an opt-in runtime diagnostics panel through `CueIdStage showDiagnostics`.

Displayed lab-only values:

```text
runtime tier
runtime decision reason
DPR cap
renderer init ms
asset id
asset bytes
GLB load ms
GLB parse ms
first rendered frame ms
```

The panel is disabled by default and enabled only by the noindex `/cue-id` lab route.

It is not rendered in:

- public Artist Profile;
- workspace/profile production flows;
- Booking/Calendar/Activity surfaces.

`tests/cueIdDiagnostics.test.ts` locks this lab-only boundary.

Purpose:

- compare Android / iPhone / desktop empirically;
- decide how much geometry/asset quality can be spent safely;
- tune Tier A / Tier B thresholds from measurements instead of assumptions.

Production remains untouched.

## 86. CUE ID ready-time performance gate

The lab now converts raw runtime metrics into an explicit tier gate.

New domain:

```text
app/domain/cueIdPerformance.ts
```

Budgets:

```text
full / Tier A    <= 800 ms
reduced / Tier B <= 1500 ms
static / Tier C  N/A
```

`CueIdStage.vue` measures total_ready_ms from IntersectionObserver preload trigger to first GLB frame and shows:

- total ready time;
- relevant tier budget;
- PASS or WARN.

The same technical value is added to the consent-aware `cue_id_glb_lab_asset_loaded` analytics event.

Tests:

```text
tests/cueIdPerformance.test.ts
```

Purpose:

Use real Android/iPhone/desktop measurements to decide how much of the remaining quality headroom can be spent.

Do not raise universal asset budgets based only on Tier A results.

Production remains untouched.

## 82. Quality ladder + embedded PBR consolidation

The Club Minimal candidate pipeline is now consolidated around one semantic material path and an automatic quality policy.

### Quality ladder

Generated candidate assets:

```text
light  = 54,540 bytes / 3,364 triangles
medium = 90,908 bytes / 7,804 triangles
high   = 191,256 bytes / 21,180 triangles
```

All three remain below the universal base ceiling:

```text
<= 1,000,000 bytes
<= 35,000 triangles
<= 4 materials
<= 6 textures
```

### Automatic quality policy

New domain helper:

```text
app/domain/cueIdQuality.ts
```

Default mapping:

```text
full    -> high
reduced -> medium
static  -> no interactive renderer; light only as fallback value
```

The `/cue-id` lab now defaults to `auto` but still allows forcing light / medium / high for comparison.

### Material consolidation

The generator now embeds exactly four named PBR materials in every quality GLB:

```text
body
mid
dark
accent
```

Each candidate GLB contains:

```text
embeddedMaterials = 4
runtimeMaterials = 4
materialStrategy = embedded_shared_pbr_mutated_runtime
textures = 0
```

`CueIdScene.client.vue` uses the single semantic material path driven by:

```text
app/domain/cueIdMaterial.ts
```

Matte / satin and accent changes mutate those four shared embedded PBR materials in place.

No duplicate runtime material system remains.

### Tests

Tests now verify:

- full -> high automatic quality;
- reduced -> medium automatic quality;
- all three GLBs contain the same four named PBR materials;
- all three GLBs contain zero textures;
- generated JSON metadata matches embedded/runtime material strategy;
- every quality descriptor stays inside the universal asset budget.

Production remains untouched.

## 83. Real medium vs high visual/performance comparison

The automatic quality decision has now been validated with real PR-preview captures of the GLB renderer.

Measured desktop/full-tier high:

```text
quality = high
asset = club-minimal-candidate-high-v1
bytes = 206,172
load = 362 ms
parse = 11 ms
first frame = 417 ms
total ready = 1,040 ms
budget = 800 ms
gate = WARN
```

Measured mobile/reduced-tier medium at 390x844:

```text
quality = medium
asset = club-minimal-candidate-medium-v1
bytes = 105,812
load = 140 ms
parse = 10 ms
first frame = 16 ms
total ready = 415 ms
budget = 1,500 ms
gate = PASS
```

Visual review at real stage size showed only a small perceived quality difference between medium (~9.1k triangles) and high (~22.1k triangles).

Decision:

```text
auto full    -> medium
auto reduced -> medium
static       -> no interactive renderer
high         -> lab/manual comparison only
```

Reason:

High currently costs roughly 2x the bytes and more than 2x the geometry while failing the desktop ready-time gate, without enough visible improvement at actual profile size.

This is not a permanent ban on high quality.

High can return to automatic Tier A only when:

1. the visual improvement is clearly visible at product size;
2. total ready time passes the Tier A 800 ms gate on representative hardware;
3. the additional geometry is spent on silhouette/anatomy/clothing quality rather than uniform subdivision.

### Readiness fix

The TresJS scene previously emitted `ready` when the canvas initialized, before the requested GLB had necessarily loaded.

This was corrected so that:

- candidate mode does not show the procedural Tres placeholder;
- `ready` is emitted only after the real GLB produces its first frame;
- GLB load failures emit `failed` instead of being silently swallowed;
- diagnostics therefore represent actual asset load/parse/frame readiness.

Temporary visual-capture workflow/script were removed after validation.

Production remains untouched.

## 84. Editorial proportion pass after real medium/high comparison

After validating real GLB captures, the next refinement moved away from uniform subdivision and into shared silhouette changes.

Measured comparison before this pass:

```text
high desktop:
206,172 bytes
22,112 triangles
ready = 1,040 ms
Tier A budget = 800 ms
gate = WARN

medium mobile:
105,812 bytes
9,120 triangles
ready = 415 ms
Tier B budget = 1,500 ms
gate = PASS
```

Visual difference between medium and high at product size was small.

Therefore automatic quality remains:

```text
full -> medium
reduced -> medium
static -> no interactive renderer
```

### Shared editorial proportion changes

The generator now improves all quality levels with the same authored silhouette:

- head rings can include Z offsets, giving the cranium/jaw a forward facial axis instead of a symmetric sphere;
- head crown/forehead/cheek/jaw/chin proportions were refined;
- shoulders moved inward and slightly down to connect better with the torso;
- shoulder radius reduced;
- arm chain moved inward to reduce puppet-like separation;
- thighs and shins were lengthened;
- knees and boots moved down accordingly;
- feet were slightly reduced;
- overall body now has a more elongated editorial proportion.

New generated metadata:

```text
light  = 64,264 bytes / 4,232 triangles
medium = 106,688 bytes / 9,168 triangles
high   = 207,336 bytes / 22,176 triangles
```

Cost increase versus the previous sculpted set is negligible.

This is the desired optimization pattern: improve visible authorship through geometry placement and proportion, not indiscriminate polygon density.

Production remains untouched.

## 85. Editorial joint refinement + headless WebGL diagnosis

The current Club Minimal candidate received a final low-cost silhouette cleanup after real GLB review.

### Joint / pelvis refinement

Changes:

- shoulder joint radius reduced and moved closer into the torso;
- elbow joints reduced;
- hip joints reduced;
- knee joints reduced;
- waist narrowed;
- pelvis width/depth reduced;
- editorial 3/4 presentation added at runtime;
- camera tightened slightly;
- ambient light reduced while key/rim contrast increased.

Generated metadata after refinement:

```text
light  = 64,236 bytes / 4,232 triangles
medium = 106,660 bytes / 9,168 triangles
high   = 207,308 bytes / 22,176 triangles
```

Triangle counts are unchanged from the previous editorial pass; byte size moved only marginally.

### Real runtime validation

Temporary headless capture initially failed because Chromium could not create a WebGL context under its default software-rendering policy.

Network diagnostics confirmed:

```text
GET /cue-id/candidates/club-minimal-candidate-medium-v1.glb -> 200
content-length = 106,688 before the final joint-byte regeneration
```

The capture workflow was then run with explicit SwiftShader flags only for CI visual validation.

That produced a real GLB render and runtime diagnostics.

Important measurement caveat:

- desktop capture was a cold network load;
- mobile capture ran after the same asset had been fetched and therefore benefited from cache;
- those two timings must NOT be interpreted as a fair desktop-vs-mobile performance comparison.

The valid product conclusion remains based on the earlier controlled quality comparison:

```text
medium -> visually close to high at product size
medium -> substantially cheaper
high -> remains manual/lab only
auto -> medium
```

Temporary capture/diagnostic scripts and workflows were removed after validation.

Production remains untouched.

## 85. WebGL capability hardening after real CI diagnosis

Headless Chromium visual diagnostics exposed a capability-probe edge case.

Observed in GitHub Actions:

```text
GLB request = HTTP 200
content-length = 106,660 bytes
canvas mounted = yes
CueIdScene loaded = yes
Three WebGLRenderer = failed to create WebGL context
renderer = ANGLE / SwiftShader software path
```

The previous capability probe was too permissive because it allowed an `experimental-webgl` fallback.

That allowed the runtime to classify the environment as interactive even though Three could not create a stable renderer.

Correction:

`canUseWebGl()` now:

- tests WebGL2, then standard WebGL only;
- uses `failIfMajorPerformanceCaveat: true`;
- uses a conservative low-power context probe;
- does NOT use `experimental-webgl`;
- releases the probe context immediately;
- falls back to Tier C/static when no stable context is available.

This behavior is intentional: software/unstable WebGL should never be forced merely to preserve the 3D effect.

The transient first-frame strategy remains:

```text
not ready -> temporary renderMode = always
first real GLB frame -> ready
ready -> renderMode = on-demand
```

This guarantees asynchronous scene insertion can produce a first frame while avoiding a permanent render loop.

Important validation rule:

GitHub Actions headless Chromium is not a valid visual-quality benchmark for CUE ID 3D because its software WebGL path can be unavailable or unstable.

Visual acceptance must therefore use representative real hardware:

- Android Chrome low/mid/high;
- iPhone Safari;
- Apple Silicon / Intel integrated desktop;
- Windows Chrome/Edge integrated GPU.

CI remains appropriate for:

- asset budget validation;
- GLB binary/header checks;
- build/tests;
- lazy bundle boundary;
- static fallback behavior;
- semantic contracts.

Temporary capture workflow/scripts were removed after diagnosis.

Production remains untouched.

## 86. WebGL context-loss fallback — TresJS runtime hardened

The TresJS scene now handles runtime WebGL context loss explicitly.

Behavior:

```text
webglcontextlost
-> prevent default browser recovery loop
-> mark renderer not ready
-> emit failed
-> CueIdStage returns to the complete static fallback
```

The listener is removed on unmount.

No automatic retry loop is introduced.

Reason:

- context loss often correlates with GPU/memory pressure;
- forcing immediate recovery can worsen battery/thermal pressure;
- the static CUE ID representation is already a valid first-class identity;
- reliability is preferred over preserving spectacle.

Together with the stricter capability probe, the current runtime policy is:

```text
stable WebGL -> interactive Tier A/B
unstable/unavailable WebGL -> Tier C static
context lost after startup -> static fallback
```

Tests now lock:

- transient continuous rendering only until first real GLB frame;
- strict non-experimental WebGL probing;
- context-loss fallback and listener cleanup.

Production remains untouched.

## 87. Club Minimal hand/shoulder refinement + reduced-tier framing

The latest visual pass keeps the medium candidate as the automatic quality target and improves authored silhouette without increasing subdivision.

Changes:

- shoulders moved slightly inward and reduced in radius;
- upper-arm chain moved inward with the shoulders;
- spherical hands replaced by tapered authored loft volumes;
- hands receive a subtle left/right wrist angle instead of reading as balls;
- waist narrowed slightly for cleaner torso-to-pelvis transition;
- reduced-tier camera moved back slightly to add mobile breathing room.

Generated metadata after regeneration:

```text
light  = 64,196 bytes / 4,240 triangles
medium = 104,456 bytes / 8,816 triangles
high   = 194,160 bytes / 20,000 triangles
```

Notably, the medium/high variants became cheaper while improving hand shape because the new hand topology is more efficient than subdivided spheres.

Automatic quality remains:

```text
full -> medium
reduced -> medium
static -> no interactive renderer
high -> lab/manual only
```

Next visual work should stay on authored geometry placement and clothing/body silhouette before considering any increase in global subdivision.

Production remains untouched.

## 88. Club Minimal wardrobe silhouette differentiation

The latest candidate pass differentiates the four wardrobe options through authored volume rather than textures or additional materials.

Changes:

- tee: cleaner shoulder-to-hem taper and slightly calmer upper volume;
- tank: narrower upper opening and more exposed shoulder read;
- hoodie: fuller chest/upper volume and looser lower silhouette;
- bomber: broader chest, fuller depth and a more cinched lower body;
- bomber collar position adjusted slightly.

All four variants still reuse:

```text
4 shared PBR materials
0 textures
same semantic visibility system
same base GLB per quality
```

Generated metadata:

```text
light  = 64,208 bytes / 4,240 triangles
medium = 104,472 bytes / 8,816 triangles
high   = 194,180 bytes / 20,000 triangles
```

Cost impact versus the previous hand refinement is negligible.

Automatic quality remains medium for Tier A and Tier B.

Next visual work should focus on silhouette/authorship and not global subdivision.

Production remains untouched.

## 89. Club Minimal accessory silhouette refinement

The current candidate now refines accessory geometry without increasing material or texture complexity.

Changes:

- headphones: tighter neck band and slimmer ear cups;
- cap: lower-profile crown and slimmer brim;
- glasses: narrower editorial oval silhouette instead of generic circular rings;
- glasses bridge reduced to keep the accessory visually lighter.

Generated metadata:

```text
light  = 64,216 bytes / 4,240 triangles
medium = 104,484 bytes / 8,816 triangles
high   = 194,192 bytes / 20,000 triangles
```

Cost impact is effectively negligible.

Current visual strategy remains:

- improve authored silhouette first;
- keep medium as the automatic Tier A/B quality;
- keep high lab-only until it earns its cost;
- do not add textures or extra materials merely for detail.

Production remains untouched.

## 90. Club Minimal head silhouette refinement

The latest pass refines recognizably human head geometry without adding facial realism or avatar-style features.

Changes:

- crown/forehead/cheek/jaw/chin rings adjusted;
- jaw and chin narrowed for a cleaner editorial profile;
- cranium depth shifted subtly to improve the 3/4 silhouette;
- small restrained ear volumes added on both sides;
- no facial texture, eyes, mouth or realism layer introduced.

Generated metadata:

```text
light  = 66,100 bytes / 4,400 triangles
medium = 109,260 bytes / 9,456 triangles
high   = 210,488 bytes / 22,560 triangles
```

Medium remains comfortably inside the mobile-safe envelope and stays the automatic Tier A/B quality.

Art-direction rule remains:

- human and editorial;
- no Sims/Bitmoji/metaverse read;
- no facial realism requirement;
- silhouette and material do the identity work first.

Production remains untouched.

## 91. Static-first CUE ID silhouette aligned with Club Minimal

The static CUE ID representation has been upgraded so public profiles and Tier C devices do not show a simplified bust that diverges from the interactive identity.

Static fallback now includes:

- editorial faceted head;
- neck;
- full torso;
- articulated-looking arms;
- tapered hands;
- pelvis;
- full legs;
- accessory layer;
- outfit-specific silhouette differences.

Outfit static reads are now intentionally distinct:

```text
tee -> clean neutral taper
tank -> narrower shoulder/upper-body read
hoodie -> fuller upper/lower volume + hood cue
bomber -> broader chest + cinched lower shape
```

Mobile fallback framing was reduced slightly to preserve breathing room.

This representation remains:

- CSS/static;
- zero WebGL;
- zero Three/TresJS runtime;
- valid under reduced motion;
- the first-class representation for public profile and unsupported/constrained devices.

Important product rule:

The static representation must feel like the same CUE ID identity, not like an error placeholder.

Tests now lock a complete head/neck/torso/arms/hands/pelvis/legs silhouette and outfit variants.

Production remains untouched.

## 92. Artist visual source — duplicate source of truth removed

The CUE ID persistence model no longer stores Photo / Artwork / CUE ID in a second overlapping column.

Previous overlap:

```text
visual_mode = photo | artwork | cue_id
artist_image_style = photo | artwork | duotone
```

This allowed Photo/Artwork to diverge across two persisted fields.

### Final model

Authoritative source:

```text
visual_source = portrait | cue_id
```

Portrait treatment remains:

```text
artist_image_style = photo | artwork | duotone
```

UI/public presentation is derived:

```text
cue_id source -> CUE ID
portrait + photo -> Photo
portrait + artwork/duotone -> Artwork
```

New domain:

```text
app/domain/artistVisual.ts
```

It owns:

- ArtistVisualSource;
- ArtistPresentationMode;
- getArtistPresentationMode();
- getArtistPresentationSelection().

Selecting CUE ID does not destroy the saved portrait treatment.

Selecting Artwork preserves an existing duotone treatment.

### Staging migrations

Applied:

```text
20260919155114 add_artist_visual_source
20260919155556 drop_legacy_artist_visual_mode
```

Repository migration files use the same versions.

Staging verification after migration:

```text
artists columns include visual_source + artist_image_style
visual_mode no longer exists
visual_source constraint = portrait | cue_id
existing profile = cue_id source + photo treatment
authenticated SELECT/INSERT/UPDATE grants present on visual_source
RLS policies unchanged
```

No new security advisory was introduced.

Existing advisories remain:

- leaked-password protection disabled;
- service-role operational tables with RLS and no end-user policies;
- development-stage unused-index informational findings.

### Public projection

`get-public-artist-profile` staging version 16 now reads `visual_source` and derives the existing public `visualMode` response for compatibility.

Public response smoke was executed twice:

1. after deploying the new function while legacy column still existed;
2. after physically dropping `visual_mode`.

Both verified:

```text
artist.visualMode = cue_id
artist.cueId.family = club_minimal
artist.artistImageStyle = photo
```

### Application

`useArtistProfile.ts` now selects and persists `visual_source`.

`CueIdProfileEditor.vue` derives Photo / Artwork / CUE ID from source + treatment.

`ProfileCoverUploader.vue` imports the portrait treatment type from the visual domain.

`tests/artistVisual.test.ts` locks the new model and asserts application/public-function code no longer reads `visual_mode`.

This resolves the architecture risk identified during the original CUE ID persistence work.

Production remains untouched.

## 93. CUE ID profile editor — public-state copy + accessibility pass

The profile editor copy now matches the product's actual public behavior.

Previous obsolete message:

```text
CUE ID stays private until public projection is enabled.
```

Current behavior:

- if the artist's public profile is active and CUE ID is the selected source, CUE ID is the visible representation;
- booking/operational data remains private;
- the public profile uses an optimized/static-first representation of the same Club Minimal identity;
- switching visual source does not delete portrait media or portrait treatment.

Accessibility refinements:

- presentation mode buttons expose `aria-pressed`;
- all CUE ID option buttons expose selected state through `aria-pressed`;
- touch targets are at least 44px high;
- controls use `touch-action: manipulation`;
- existing keyboard focus styles remain.

Tests lock the updated public copy, selected-state semantics and 44px touch target.

Production remains untouched.


## 94. Club Minimal torso / garment integration refinement

This pass continues the medium-first visual strategy after the head, accessory and static-fallback work.

Changes:

- the previous block-like clavicle bridge was replaced by a tapered elliptical volume;
- neck-to-shoulder-to-chest continuity is smoother and less mannequin-like;
- torso shaping now has more authored chest, ribcage and waist progression;
- tee, tank, hoodie and bomber use additional profile rings to create more believable garment volume;
- hoodie and bomber keep fuller upper volume while tapering with a cleaner lower silhouette;
- no global subdivision increase was introduced;
- no textures or additional materials were added.

Generated candidate metadata:

```text
light  = 70,792 bytes / 4,772 triangles
medium = 113,372 bytes / 10,108 triangles
high   = 216,140 bytes / 23,436 triangles
```

All variants remain:

```text
4 shared PBR materials
0 textures
candidate_not_production
```

Automatic quality remains:

```text
full -> medium
reduced -> medium
static -> no interactive renderer
high -> lab/manual only
```

The increased geometry is concentrated in visible torso and clothing silhouette. Medium remains comfortably within the universal budget and remains the automatic Tier A/B target.

Next visual review should judge the result at real profile size before spending more geometry. If the torso still reads too procedural, the next step should be localized garment construction around sleeve/shoulder transitions rather than higher global subdivision.

Production remains untouched.


## 95. Club Minimal garment sleeve / shoulder integration

This pass targets the remaining mannequin read around the shoulder-to-arm transition.

Changes:

- tee now has dedicated short-sleeve volumes on both arms;
- hoodie now has separate upper-arm and forearm sleeve volumes;
- bomber now has separate upper-arm and forearm sleeve volumes with slightly fuller proportions;
- tank intentionally keeps the shoulder exposed;
- sleeves follow the existing authored arm angles instead of using generic straight cylinders;
- sleeve nodes are part of the semantic outfit visibility contract;
- sleeve scale follows slim / regular / strong build semantics so clothing and anatomy stay coherent;
- no textures or additional materials were introduced;
- no global subdivision increase was introduced.

Generated candidate metadata:

```text
light  = 80,592 bytes / 5,612 triangles
medium = 126,752 bytes / 11,548 triangles
high   = 232,416 bytes / 25,356 triangles
```

All variants remain:

```text
4 shared PBR materials
0 textures
candidate_not_production
```

Automatic quality remains:

```text
full -> medium
reduced -> medium
static -> no interactive renderer
high -> lab/manual only
```

The medium cost increase is localized to visible garment construction and remains comfortably inside the base budget.

Next visual review should focus on whether tee / hoodie / bomber now read as actual garments at profile size. Do not add more torso density unless a visible defect remains.

Production remains untouched.


## 96. Club Minimal elbow / knee transition refinement

This pass removes two remaining spherical articulation cues that still read as procedural joints.

Changes:

- elbow spheres replaced by compact authored elliptical loft transitions;
- knee spheres replaced by tapered elliptical loft transitions;
- joint volumes inherit a small amount of the existing limb angle;
- hand refinement remains untouched;
- garment sleeve semantics remain unchanged;
- no textures or additional materials were introduced;
- no global subdivision increase was introduced.

Generated candidate metadata:

```text
light  = 80,572 bytes / 5,628 triangles
medium = 122,404 bytes / 10,844 triangles
high   = 206,184 bytes / 21,004 triangles
```

Compared with the previous garment-sleeve pass:

```text
medium: 126,752 bytes / 11,548 tris -> 122,404 bytes / 10,844 tris
high:   232,416 bytes / 25,356 tris -> 206,184 bytes / 21,004 tris
```

The change improves articulation authorship while reducing geometry, especially in high where subdivided icospheres were disproportionately expensive.

Automatic quality remains:

```text
full -> medium
reduced -> medium
static -> no interactive renderer
high -> lab/manual only
```

All variants remain candidate_not_production with 4 shared PBR materials and 0 textures.

Next visual review should focus on pelvis / hip continuity and overall silhouette only if those areas still visibly read as assembled parts at product size.

Production remains untouched.


## 97. Club Minimal waist / hip continuity refinement

This pass removes the remaining block-like waist and spherical hip-joint construction.

Changes:

- waist changed from a box loft to a multi-ring elliptical loft;
- waist-to-pelvis taper is now continuous;
- pelvis profile uses an additional authored ring for a smoother transition into the upper legs;
- spherical hip joints were replaced by compact elliptical loft transitions;
- hip transitions inherit a small amount of each leg angle;
- hip-joint scale now follows slim / regular / strong build semantics;
- no textures or additional materials were introduced;
- no global subdivision increase was introduced.

Generated candidate metadata:

```text
light  = 82,936 bytes / 5,764 triangles
medium = 124,404 bytes / 10,720 triangles
high   = 198,684 bytes / 19,136 triangles
```

Compared with the previous joint-refinement pass:

```text
medium: 122,404 bytes / 10,844 tris -> 124,404 bytes / 10,720 tris
high:   206,184 bytes / 21,004 tris -> 198,684 bytes / 19,136 tris
```

The small medium byte increase comes from the more continuous waist profile, while triangle count still falls. High becomes materially cheaper because another pair of subdivided icospheres has been removed.

Automatic quality remains:

```text
full -> medium
reduced -> medium
static -> no interactive renderer
high -> lab/manual only
```

All variants remain candidate_not_production with 4 shared PBR materials and 0 textures.

Next visual work should avoid broad geometry changes. The remaining review should be silhouette-led at real product size, with shoulder integration or footwear considered only if a visible defect remains.

Production remains untouched.


## 98. Club Minimal shoulder transition refinement

This pass removes the last prominent spherical shoulder construction, especially visible with the tank outfit.

Changes:

- shoulder icospheres replaced by compact elliptical loft transitions;
- shoulder volumes inherit a restrained amount of the authored upper-arm angle;
- tee / hoodie / bomber sleeve geometry remains unchanged;
- tank benefits most because the shoulder remains intentionally exposed;
- build semantics continue to scale shoulder nodes as before;
- no textures or additional materials were introduced;
- no global subdivision increase was introduced.

Generated candidate metadata:

```text
light  = 82,924 bytes / 5,772 triangles
medium = 122,228 bytes / 10,368 triangles
high   = 185,560 bytes / 16,960 triangles
```

Compared with the previous waist / hip pass:

```text
medium: 124,404 bytes / 10,720 tris -> 122,228 bytes / 10,368 tris
high:   198,684 bytes / 19,136 tris -> 185,560 bytes / 16,960 tris
```

The refinement improves shoulder-to-arm continuity while again reducing the cost of high-density icospheres.

Automatic quality remains:

```text
full -> medium
reduced -> medium
static -> no interactive renderer
high -> lab/manual only
```

All variants remain candidate_not_production with 4 shared PBR materials and 0 textures.

At this point broad anatomy cleanup should stop. Further geometry work should be triggered only by a visible defect found in representative product-size review. The next sensible review area is footwear / lower-leg termination or real-device framing, not another global shape pass.

Production remains untouched.


## 99. Club Minimal footwear termination + semantic CI fix

The final broad geometry cleanup is now complete.

### Footwear

Changes:

- rectangular boot boxes replaced by a four-section lofted footwear silhouette;
- ankle, mid-foot and toe volumes now progress instead of ending as a cuboid;
- left/right footwear receives a restrained opposing angle;
- lower-leg termination remains intentionally minimal and editorial;
- no textures or additional materials were introduced;
- no global subdivision increase was introduced.

Generated candidate metadata:

```text
light  = 83,540 bytes / 5,804 triangles
medium = 122,848 bytes / 10,400 triangles
high   = 186,180 bytes / 16,992 triangles
```

Cost versus the previous shoulder pass is negligible.

### Semantic CI correction

After hip build scaling was introduced, CI correctly detected that `hip_joint_left` and `hip_joint_right` existed as generated f-string nodes but were not declared literally in `SEMANTIC_NODE_NAMES`.

The generator now declares both semantic hip-joint node names explicitly.

The test was not weakened.

Validation on commit `5c8879d9a08e5ac220b80e3a5c37749053c4a4a9`:

```text
CI = success
```

### Current automatic policy

```text
full -> medium
reduced -> medium
static -> no interactive renderer
high -> lab/manual only
```

All assets remain:

```text
candidate_not_production
4 shared PBR materials
0 textures
```

Broad anatomy / silhouette iteration should now stop. Further CUE ID geometry changes require a concrete defect observed at real product size or on representative hardware.

Reduced-tier framing remains intentionally farther back than full tier:

```text
full camera z = 7.25
reduced camera z = 7.7
```

No camera change was required in this pass.

Production remains untouched.


## 100. Static / interactive semantic silhouette parity

Product-level review found a real semantic mismatch between the CSS static fallback and the interactive candidate.

Problem:

- the static fallback applies base/build silhouette differences regardless of outfit;
- the interactive candidate applied most torso base/build scaling to `tee_volume`;
- `tank`, `hoodie` and `bomber` body volumes could therefore mask part of the selected base/build identity.

Correction:

- masculine/feminine base semantics now include `outfit_tank`, `outfit_hoodie` and `outfit_bomber`;
- slim/strong build semantics now include the same three outfit body nodes;
- values remain deliberately restrained and within existing non-caricature limits;
- sleeve scaling remains as previously authored;
- no GLB regeneration is required because this is runtime semantic transform data;
- no renderer/runtime infrastructure change was made.

Regression coverage now explicitly requires every non-neutral base and non-regular build to include all four outfit body nodes:

```text
tee_volume
outfit_tank
outfit_hoodie
outfit_bomber
```

This brings the interactive identity model closer to the static-first contract instead of allowing outfit choice to erase body semantics.

Production remains untouched.


## 101. Garment sleeve / pose semantic alignment

Product review found that garment sleeves were modeled as independent semantic nodes but pose transforms only targeted the anatomy arm nodes.

Risk:

- upper-arm and forearm geometry could rotate for relaxed / focused / editorial poses;
- tee, hoodie and bomber sleeve nodes could remain at their authored neutral orientation;
- this could produce visible arm-through-sleeve or detached garment alignment.

Correction:

- tee short sleeves now inherit the corresponding upper-arm pose rotation;
- hoodie upper sleeves inherit upper-arm pose rotation;
- hoodie forearm sleeves inherit forearm pose rotation;
- bomber upper sleeves inherit upper-arm pose rotation;
- bomber forearm sleeves inherit forearm pose rotation;
- neutral pose remains the zero-transform reference;
- no GLB regeneration is needed;
- no runtime infrastructure change is needed.

Regression coverage now asserts sleeve / limb rotation equality across relaxed, focused and editorial poses.

Production remains untouched.


## 102. CUE ID lab mobile / accessibility cleanup

Product review found two small lab-only UX inconsistencies.

Changes:

- quality controls now use a 44 px minimum touch target instead of 36 px;
- on narrow screens the quality row can scroll horizontally without compressing controls below their intended target size;
- the CUE ID stage accessibility label is now neutral (`CUE ID preview`) instead of incorrectly announcing an interactive stage as a static preview;
- primary CUE ID editor controls already used 44 px touch targets and required no change;
- no runtime, asset or production behavior changed.

Production remains untouched.


## 103. Real-device visual review: procedural candidate rejected

A real iPhone review exposed an important distinction between technical validity and visual acceptability.

Observed on reduced/mobile tier:

- diagnostics obscured a large part of the figure;
- the figure framed too low and too small for the available stage;
- quality UI could show the newly selected quality while diagnostics still displayed metrics from the previously loaded asset;
- most importantly, the procedural Club Minimal candidate still reads as a low-poly assembled mannequin rather than a credible editorial artist identity.

Decision:

- the current procedural candidate is **rejected as a production visual direction**;
- it remains useful as a runtime/performance/semantic test fixture only;
- do not continue broad anatomy micro-refinement on this generator;
- do not promote any of the candidate GLBs into `CUE_ID_ASSETS`;
- the next visual asset must be genuinely art-directed and reviewed at product size before integration.

Mobile lab corrections in this pass:

- quality changes now reset ready/metrics state before loading the next candidate;
- stale metrics are cleared when resolved quality changes;
- reduced-tier camera moves from z 7.7 to z 7.25 after real-device evidence showed excessive distance;
- reduced-tier model gets a small upward framing offset;
- mobile stage min-height increases to 500px;
- diagnostics are hidden on <=680px so the visual itself can be reviewed unobstructed;
- desktop diagnostics remain available for lab measurement.

The screenshot-driven review overrides the previous assumption that extra reduced-tier camera distance improved mobile framing.

Production remains untouched.

## 104. Production asset strategy reset

The real-device rejection from section 103 is now reflected in the formal art documentation.

Changes:

- `CUE_ID_CLUB_MINIMAL_ART_DIRECTION.md` no longer describes the procedural candidate as an approved production contract;
- `/cue-id` explicitly labels the current model as a technical fixture with rejected visual direction;
- new `docs/CUE_ID_ASSET_BRIEF_V2.md` defines the next production asset as an authored editorial/sculptural human;
- the V2 brief establishes head, body, hands, wardrobe, footwear, material, static render, mobile review and geometry requirements;
- one excellent default tee is prioritised over producing four mediocre outfits in parallel;
- V2 may use restrained textures and authored morphs/rigging;
- medium remains the automatic target;
- visual still review at real product size is now a gate before deep runtime integration.

The procedural generator and generated GLBs remain in the repository only as runtime/performance/semantic fixtures.

`CUE_ID_ASSETS` remains intentionally empty.

Production remains untouched.

## 105. V2 brief update: three first-class bases

The V2 production asset brief now treats feminine, masculine and neutral as first-class bases from day one.

Decision:

- the next authored CUE ID asset must be designed around three real bases, not one default base plus later variants;
- the base system is part of the core product contract, not an optional expansion;
- all three bases must share the same quality level, pose set, wardrobe availability, accessory support and review bar.

Design rules added to the brief:

- feminine must avoid sexualised or cliché avatar cues;
- masculine must avoid heroic exaggeration;
- neutral must remain a complete authored identity, not an unfinished midpoint;
- base semantics must remain readable through silhouette, head structure and clothing fit;
- build semantics must remain independent from base semantics.

Product implication:

- the first production outfit remains a single excellent editorial club tee;
- that tee must be validated on feminine, masculine and neutral before any wardrobe expansion;
- the minimum visual review matrix now includes all three bases in regular build, with slim and strong spot checks.

The procedural generator remains a technical fixture only and is not upgraded to satisfy this requirement.

### Next execution block

The next concrete step is not more procedural refinement.

The next block is:

1. concept stills for feminine / masculine / neutral;
2. one approved visual family;
3. one production-quality editorial tee applied to all three bases;
4. mobile product-size review before deeper runtime integration.

No production asset work should proceed without still-image approval of the three bases.

Production remains untouched.

## 106. V2 concept checkpoint: professional yes, photoreal no

The first three-base V2 concept moved the product in the correct direction but is not yet the final production art direction.

Positive signals:

- credible human proportions;
- professional club/editorial presence;
- feminine / neutral / masculine shown as equal first-class bases;
- shared wardrobe and pose language;
- much stronger product credibility than the procedural fixture.

Remaining issue:

- the concept leans too far toward fashion-model / photoreal digital-human language;
- hair and glasses currently contribute too much identity;
- CUE ID needs a more authored sculptural head and must work with no accessories.

New document:

`docs/CUE_ID_CONCEPT_V2.md`

Next visual checkpoint:

- three bases;
- no accessories;
- same tee;
- same neutral pose;
- sculptural facial planes;
- structural base identity visible without styling aids.

Do not start production 3D modelling until that no-accessory concept direction passes.

Production remains untouched.

## 107. V2 production asset contract

The next authored CUE ID asset now has an explicit renderer/DCC boundary.

New document:

`docs/CUE_ID_ASSET_CONTRACT_V2.md`

Core decision:

- persisted CUE ID state remains semantic;
- Blender/GLB/Three-specific names never become product meaning;
- an application-owned manifest maps semantic choices to morphs, rig clips, mesh visibility and material slots;
- V2 should prefer authored morphs/shape keys and a shared rig over fixture-style arbitrary node scaling;
- clothing must deform/pose with the same rig rather than requiring parallel manual sleeve transforms;
- static renders are versioned against the same assetVersion;
- production promotion requires visual, compatibility and performance validation.

The current procedural model is exempt only because it remains a technical fixture.

Target architecture:

```text
CueIdConfigV1
  -> resolveCueIdAsset(...)
  -> production manifest + semantic bindings
  -> CueIdScene.client.vue
```

This preserves the existing product API while allowing the production asset to be authored properly.

`CUE_ID_ASSETS` remains empty.

Production remains untouched.

## 108. Production manifest domain foundation

The V2 asset contract now has a minimal application-domain implementation without admitting any production asset.

New domain:

`app/domain/cueIdProductionManifest.ts`

It defines:

- production manifest identity/version;
- application-owned GLB/static paths;
- geometry/material/texture metrics;
- supported interactive tiers;
- semantic capabilities;
- semantic bindings for morphs, poses, outfits, accessories and material slots;
- validation/assertion helpers.

Validation currently enforces:

- manifestVersion 1;
- non-empty assetVersion;
- application-owned paths;
- base asset budget <= 1 MB / 35k triangles / 4 materials / 6 textures / 2048 max texture dimension;
- interactive tiers only;
- all three first-class bases;
- slim / regular / strong builds;
- neutral / relaxed / focused / editorial poses;
- tee and matte as minimum V2 capabilities.

Regression coverage:

`tests/cueIdProductionManifest.test.ts`

The tests verify a valid V2 manifest, three-base requirement, budget rejection and rejection of external asset URLs.

Important:

- this does not add anything to `CUE_ID_ASSETS`;
- no real production GLB has been admitted;
- the existing fixture runtime remains unchanged;
- this is only the compatibility gate for the future authored V2 asset.

Production remains untouched.

## 109. V2 source asset package specification

The authored V2 model now has a concrete production handoff package specification.

New document:

`docs/CUE_ID_SOURCE_ASSET_PACKAGE_V2.md`

It defines:

- required source DCC deliverable;
- GLB export package;
- shared rig requirements;
- feminine / masculine / neutral base morph expectations;
- slim / regular / strong build expectations;
- first editorial tee requirements;
- head, hand and footwear quality requirements;
- pose clip delivery;
- material/texture limits;
- static review render set;
- mobile review framing;
- metadata and binding handoff;
- ownership/license confirmation;
- acceptance sequence.

Important scope control:

- the first authored package requires one excellent tee, not four outfits;
- no hair catalogue, facial rig, physics cloth or finger animation is required;
- no production integration starts before still-image and mobile review pass.

Production remains untouched.

## 110. V2 sculpt turnaround gate

The final pre-modelling visual checkpoint is now explicit.

The authored V2 asset must first pass a structural turnaround review for:

- feminine;
- neutral;
- masculine.

Each base is reviewed under the same neutral conditions in front, 3/4 and profile views.

No hair/accessory styling may be used to rescue identity.

The turnaround judges:

- head structure;
- shoulder/torso proportion;
- pelvis/hip relationship;
- hands;
- lower-body/foot silhouette;
- family coherence across all three bases.

Production modelling should not begin until this checkpoint passes.

Production remains untouched.

## 111. Production asset resolver boundary

The production manifest contract now has a dedicated semantic resolver.

New domain:

`app/domain/cueIdAssetResolver.ts`

New regression coverage:

`tests/cueIdAssetResolver.test.ts`

Resolver contract:

```text
CueIdConfigV1 + device tier + available production manifests
  -> newest valid compatible manifest
  -> interactive or static representation
  -> null when no production asset is valid/compatible
```

Current behavior:

- disabled CUE ID resolves to null;
- an empty production catalogue resolves to null;
- invalid manifests are ignored;
- semantic capability mismatches are rejected;
- full/reduced require the manifest to support that interactive tier;
- static tier resolves the version-matched portrait static asset;
- when multiple compatible versions exist, the newest assetVersion wins.

Important architecture rule:

- the resolver knows product semantics and manifest capabilities;
- `CueIdScene.client.vue` does not yet consume it;
- the rejected procedural fixture remains on its isolated lab path;
- no production asset has been admitted;
- `CUE_ID_ASSETS` remains empty.

This is the final domain boundary needed before an authored V2 asset can be introduced without coupling persistence to GLB internals.

Production remains untouched.

## 112. Product stage / fixture separation

A remaining architecture leak was found in `CueIdStage.vue`: when Artist Profile used the stage without `labAsset`, `CueIdScene.client.vue` could still render its internal procedural box placeholder.

This contradicted the decision to reject procedural visual direction outside the lab.

Correction:

- `/cue-id` remains the only path allowed to opt into the fixture renderer through explicit `labAsset`;
- Artist Profile no longer starts the 3D renderer while the production manifest catalogue is empty;
- product stage resolves production manifests through `resolveCueIdAsset(...)`;
- when no approved production manifest exists, the stage stays static-first;
- when a future manifest exists, its versioned static portrait can render immediately;
- interactive production rendering remains intentionally disabled until `CueIdScene.client.vue` supports the V2 manifest/binding contract;
- failed production static images fall back to the existing CSS static identity rather than breaking the stage.

New catalogue:

`app/domain/cueIdProductionCatalogue.ts`

It is intentionally empty.

New regression coverage:

`tests/cueIdProductionCatalogue.test.ts`
`tests/cueIdProductStageBoundary.test.ts`

Important result:

The rejected procedural fixture can no longer leak into Artist Profile simply because interactive runtime is available.

Production remains untouched.

## 113. Rejected procedural scene fallback removed

`CueIdScene.client.vue` no longer contains the old implicit box-built humanoid rendered when `labAsset` was absent.

Changes:

- removed the internal `v-else-if="!labAsset"` procedural TresGroup;
- removed now-unused procedural-only computed build/pose/material helpers;
- the renderer currently renders only an explicitly requested lab GLB;
- production interactive rendering remains intentionally absent until the V2 manifest/binding path is implemented;
- Artist Profile therefore stays static-first and cannot accidentally resurrect the rejected mannequin.

New regression coverage:

`tests/cueIdSceneFixtureBoundary.test.ts`

The test locks the absence of `TresBoxGeometry` and the implicit no-labAsset fallback.

Production remains untouched.

## 114. Exclusive static representation path

The product stage now guarantees that only one static CUE ID representation is visible at a time.

Behavior:

- when a future approved production static render resolves successfully, the CSS fallback figure is not rendered;
- if that image fails to load, the CSS fallback automatically becomes active again;
- lab mode remains unchanged and still uses the CSS/static layer until the explicit lab GLB becomes ready;
- this avoids transparent production renders visually stacking over the legacy CSS silhouette.

Regression coverage in `tests/cueIdProductStageBoundary.test.ts` now locks the exclusive static representation rule.

Production remains untouched.

## 115. Isolated production renderer shell

A dedicated production renderer now exists without being connected to Artist Profile yet.

New component:

`app/components/CueIdProductionScene.client.vue`

Responsibilities currently implemented:

- accept an approved `CueIdProductionManifest`;
- load the manifest GLB through the generic bounded GLB loader;
- enforce manifest compressed-byte ceiling while loading;
- parse with GLTFLoader;
- frame the authored asset consistently for full/reduced tiers;
- keep first-frame readiness explicit;
- preserve on-demand rendering after ready;
- handle WebGL context loss;
- dispose geometry/material resources on replacement/unmount.

Loader boundary improvement:

`loadCueIdGlbBuffer(...)` now accepts the minimal `glbPath + compressedBytes` contract rather than requiring the legacy `CueIdAssetDescriptor` type.

This allows both lab fixtures and future V2 manifests to use the same hardened GLB loading path without pretending they belong to the same catalogue model.

Bundle isolation:

- Three/Tres imports are now allowed only in `CueIdScene.client.vue` and `CueIdProductionScene.client.vue`;
- Booking/Calendar/Activity and all other application code remain free of renderer imports.

Intentional limitation:

- the production renderer is NOT mounted by `CueIdStage.vue` yet;
- semantic morph/pose/outfit/material bindings are deliberately not guessed without the first authored asset;
- Artist Profile therefore remains static-first;
- the lab renderer remains explicit and isolated.

New regression coverage:

`tests/cueIdProductionSceneBoundary.test.ts`

Production remains untouched.

## 116. Static-valid vs interactive-ready production manifests

The production manifest lifecycle now distinguishes visual/static admission from interactive semantic readiness.

New rule:

- a manifest may be structurally valid and provide version-matched static assets without being allowed to render interactively;
- interactive rendering requires explicit V2 semantic bindings.

Interactive readiness currently requires:

- feminine base binding;
- masculine base binding;
- slim build binding;
- strong build binding;
- neutral / relaxed / focused / editorial pose bindings;
- editorial tee binding;
- body material binding;
- textile material binding.

Neutral base and regular build may remain authored reference/default states.

Resolver behavior:

- invalid manifest -> ignored;
- valid + incomplete bindings -> static representation;
- valid + complete bindings + supported full/reduced tier -> interactive representation;
- static tier -> static representation regardless.

This allows a future authored V2 asset to enter Cuebooker safely in phases:

1. static visual approval;
2. manifest admission;
3. semantic binding completion;
4. interactive renderer activation.

No production asset has been admitted yet.

Production remains untouched.

## 117. Production semantic binding resolver

The V2 production path now has a renderer-agnostic semantic adapter.

New domain:

`app/domain/cueIdProductionBindings.ts`

New regression coverage:

`tests/cueIdProductionBindings.test.ts`

Responsibility:

- receive `CueIdConfigV1` plus an interactive-ready production manifest;
- resolve authored base/build morph names;
- resolve pose clip name;
- resolve selected outfit nodes;
- resolve selected accessory nodes;
- resolve semantic material slot names;
- return null when the selected configuration cannot be represented safely.

Reference states:

- neutral base may require no explicit morph;
- regular build may require no explicit morph.

This keeps Three/Tres-specific scene code free from product semantics.

Target data flow is now:

```text
CueIdConfigV1
  -> resolveCueIdAsset(...)
  -> resolveCueIdProductionBindings(...)
  -> production renderer
```

The production renderer is still intentionally disconnected from Artist Profile until the first authored V2 asset exists and its actual morph/clip/node bindings can be validated.

No production asset has been admitted.

Production remains untouched.

## 118. Production renderer semantic application

The isolated V2 production renderer can now apply the renderer-agnostic bindings resolved from `CueIdConfigV1` and an interactive-ready manifest.

Implemented in:

`app/components/CueIdProductionScene.client.vue`

Semantic application now covers:

- base/build morph target weights through manifest morph names;
- selected outfit visibility through manifest node bindings;
- selected accessory visibility through manifest node bindings;
- semantic pose clip selection through manifest clip names;
- body/textile/technical/accent material slot mapping;
- matte/satin PBR surface presets;
- lime/red/none accent color application.

Important constraints:

- no fixture geometry names are hardcoded;
- no Blender/DCC names live in product config;
- only names supplied by the application-owned manifest are used;
- neutral base and regular build remain zero-morph reference states;
- pose clips are evaluated at their final frame and then held;
- the renderer remains on-demand after ready.

The source asset package now documents the pose-clip final-frame convention.

`CueIdStage.vue` still does not mount the production renderer. Activation remains blocked until the first authored V2 GLB and its real bindings pass validation.

Production remains untouched.

## 119. V2 GLB inspection and manifest-draft tooling

The repository now includes a dependency-free inspection path for the first authored V2 GLB.

New files:

`scripts/lib/cue-id-glb-inspector.mjs`
`scripts/inspect-cue-id-v2-glb.mjs`
`tests/cueIdGlbInspector.test.ts`

New command:

```bash
npm run cue-id:inspect -- <asset.glb>
```

Optional manifest draft:

```bash
npm run cue-id:inspect -- <asset.glb> --manifest-draft <output.json> --asset-version <version>
```

The inspector validates the GLB container and extracts:

- bytes;
- triangle count;
- node names;
- mesh inventory;
- morph target names;
- animation clip names;
- material names;
- texture/image counts.

The generated manifest draft intentionally does not guess semantic bindings.

Human review remains required to map discovered DCC/export names to Cuebooker semantics.

This gives the V2 intake flow an objective first step before catalogue admission or renderer activation.

Production remains untouched.

## 120. V2 package-to-GLB binding validation

The V2 intake flow now validates the reviewed manifest against the actual exported GLB.

New files:

`scripts/lib/cue-id-package-validator.mjs`
`scripts/validate-cue-id-v2-package.mjs`
`tests/cueIdPackageValidator.test.ts`

New command:

```bash
npm run cue-id:validate-package -- <asset.glb> <manifest.json>
```

Validation covers:

- byte count;
- triangle count;
- material count;
- texture count;
- morph bindings;
- animation clip bindings;
- outfit node bindings;
- accessory node bindings;
- material slot bindings;
- visibility-node reuse.

This closes the gap between a manually reviewed semantic manifest and the actual exported DCC/GLB names.

Current V2 intake sequence is now:

```text
authored source asset
  -> GLB export
  -> cue-id:inspect
  -> human semantic binding review
  -> cue-id:validate-package
  -> visual/mobile acceptance
  -> runtime benchmark
  -> catalogue admission
```

No production asset has been admitted.

Production remains untouched.

## 121. Manifest-gated production renderer activation

`CueIdStage.vue` now knows how to activate the V2 production renderer without changing current product behavior while the production catalogue is empty.

Activation contract:

- lab GLB renderer remains available only when `labAsset` is explicitly set;
- production renderer is lazy-loaded separately;
- production renderer mounts only when `resolveCueIdAsset(...)` returns `representation: 'interactive'`;
- static-only manifests never mount WebGL;
- when no approved production manifest exists, Artist Profile remains static-first;
- when an interactive-ready manifest exists, the production static render stays visible until the first real GLB frame is ready;
- if production rendering fails, the static representation becomes visible again automatically.

Analytics now distinguishes:

- `tresjs_lab`;
- `tresjs_production_v2`.

Production asset load analytics record asset version, bytes, load/parse/first-frame/total-ready timings and the existing runtime performance gate.

Bundle guarantees:

- both lab and production renderers stay behind `defineAsyncComponent(...)`;
- Three/Tres remains isolated to the two `.client.vue` renderers;
- operational routes keep their existing no-renderer boundary.

Regression coverage updated in:

`tests/cueIdProductionSceneBoundary.test.ts`
`tests/cueIdProductStageBoundary.test.ts`
`tests/cueIdBundleBoundary.test.ts`

Because `CUE_ID_PRODUCTION_MANIFESTS` is still empty, this block does not activate any new production visual or download any production GLB today.

Production remains untouched.

## 122. Deterministic production pose freeze

The V2 production renderer now guarantees that authored semantic pose clips freeze at their intended final frame.

Fix:

- semantic pose actions use `LoopOnce`;
- `clampWhenFinished` is enabled;
- the mixer evaluates the clip at its duration and then holds that state.

This avoids the default repeat-loop behavior potentially wrapping an exact end-time evaluation back to the first frame.

Regression coverage in `tests/cueIdProductionSceneBoundary.test.ts` locks the `LoopOnce + clampWhenFinished` contract.

Production remains untouched.

## 123. Production catalogue admission gate

The production catalogue can no longer accept raw manifests directly.

New domain:

`app/domain/cueIdProductionAdmission.ts`

`app/domain/cueIdProductionCatalogue.ts` now builds its catalogue through `defineCueIdProductionCatalogue(...)` and derives `CUE_ID_PRODUCTION_MANIFESTS` only from admitted entries.

Admission stages:

- `static_approved`;
- `interactive_approved`.

Every admitted asset requires explicit evidence for:

- visual review;
- real-device mobile review;
- package-to-GLB validation.

`interactive_approved` additionally requires:

- complete interactive semantic bindings;
- measured performance evidence for every supported interactive tier;
- full tier ready time within the existing 800 ms budget;
- reduced tier ready time within the existing 1500 ms budget.

The catalogue also rejects duplicate `family + assetVersion` entries.

This creates a hard code-level distinction between an asset that is merely authored/exported and one that is actually approved for Cuebooker production use.

New regression coverage:

`tests/cueIdProductionAdmission.test.ts`

The production catalogue remains empty.

Production remains untouched.

## 124. Admission-stage-aware asset resolution

A correctness issue was fixed in the production resolver.

Before this block, `CUE_ID_PRODUCTION_MANIFESTS` stripped catalogue admission state. A manifest with complete bindings could therefore resolve as interactive even if it had only been admitted as `static_approved`.

Correction:

- `resolveCueIdAsset(...)` now consumes `CueIdProductionAdmission[]`, not raw manifests;
- `CueIdStage.vue` resolves from `CUE_ID_PRODUCTION_CATALOGUE`;
- `static_approved` always resolves as static on full/reduced/static tiers;
- only `interactive_approved` can resolve as interactive;
- invalid admissions are ignored entirely;
- the newest compatible admitted asset version still wins.

This preserves the production approval boundary all the way from catalogue declaration to runtime activation.

Regression coverage updated in:

`tests/cueIdAssetResolver.test.ts`

The production catalogue remains empty.

Production remains untouched.

## 125. Exact semantic parity for static CUE ID

A production parity gap was fixed: the manifest previously exposed one generic portrait/square static asset per version, which could show the wrong base/build/pose/material/accent while interactive state represented the selected config correctly.

New domain:

`app/domain/cueIdStaticVariants.ts`

Static identity is now keyed by the complete visible semantic state:

```text
base + build + outfit + accessory + pose + material + accent
```

Key example:

`neutral__regular__tee__none__neutral__matte__lime`

Manifest changes:

- `static.portrait` / `static.square` generic paths are replaced by `static.variants`;
- manifest validation enumerates every declared capability combination;
- missing variant coverage makes the manifest invalid;
- every portrait/square path must be application-owned;
- the asset resolver selects the exact static variant for `CueIdConfigV1`;
- no unrelated static fallback is allowed.

Tooling changes:

- `cue-id:validate-package` now validates semantic static coverage and local paths;
- manifest drafts intentionally start with an empty `static.variants` map;
- static renders must be generated/reviewed before admission.

Regression coverage:

`tests/cueIdStaticVariants.test.ts`
`tests/cueIdProductionManifest.test.ts`
`tests/cueIdAssetResolver.test.ts`
`tests/cueIdProductionAdmission.test.ts`
`tests/cueIdPackageValidator.test.ts`

Visual checkpoint note:

- recent generated turnaround references are not approved because they repeatedly coupled feminine with slim/athletic and masculine with strong/athletic;
- next approved modelling turnaround must show all three bases on regular build under identical conditions.

The production catalogue remains empty.

Production remains untouched.

## 126. Static variant failure retry boundary

A fallback-loop bug was fixed in `CueIdStage.vue`.

Previous behavior risk:

- a failed production static image set `productionStaticFailed = true`;
- `productionStaticPath` then changed to null;
- a watcher on that computed value immediately reset the failure flag;
- the same broken image could be requested again repeatedly.

Correction:

- the failure flag now resets only when the underlying resolved production static asset path changes;
- the same broken variant stays on CSS fallback instead of retrying in a loop;
- changing CUE ID config or admitted asset version can legitimately retry the new resolved path.

Regression coverage added to `tests/cueIdProductStageBoundary.test.ts`.

Production remains untouched.

## 127. Semantic static fixture alignment

CI exposed one remaining test fixture using the legacy generic `static.portrait/static.square` shape.

`tests/cueIdProductionBindings.test.ts` now builds the complete semantic static variant matrix from its declared capabilities, matching the production manifest contract.

No runtime behavior changed in this correction.

Production remains untouched.

## 128. Deterministic static render planning

The V2 intake path now has a deterministic planner for the semantic static render matrix.

Domain extension:

`app/domain/cueIdStaticVariants.ts`

New CLI:

`scripts/plan-cue-id-static-renders.mjs`

New command:

```bash
npm run cue-id:plan-static -- <manifest.json>
```

Optional JSON output:

```bash
npm run cue-id:plan-static -- <manifest.json> --output <plan.json>
```

The planner:

- reads `assetVersion` and declared capabilities;
- enumerates every visible semantic combination;
- generates deterministic portrait/square target paths;
- reports the exact render count;
- does not mutate the manifest;
- does not treat planned paths as existing or approved assets.

Default file layout:

`/cue-id/production/static/<assetVersion>/<semantic-key>-portrait.webp`
`/cue-id/production/static/<assetVersion>/<semantic-key>-square.webp`

Regression coverage added to `tests/cueIdStaticVariants.test.ts`.

The production catalogue remains empty.

Production remains untouched.

## 129. Static render finalization gate

The semantic static pipeline now refuses to populate a production manifest from planned paths alone.

New files:

`scripts/lib/cue-id-static-finalizer.mjs`
`scripts/finalize-cue-id-static-renders.mjs`
`tests/cueIdStaticFinalizer.test.ts`

New command:

```bash
npm run cue-id:finalize-static -- <manifest.json> <plan.json> --output <finalized-manifest.json>
```

Behavior:

- plan and manifest asset versions must match;
- every portrait file must exist physically under the configured public directory;
- every square file must exist physically;
- one missing file fails finalization;
- `static.variants` is populated only after successful filesystem verification.

Static V2 pipeline is now:

```text
capabilities
  -> cue-id:plan-static
  -> actual render/export
  -> human visual review
  -> cue-id:finalize-static
  -> cue-id:validate-package
  -> catalogue admission
```

The production catalogue remains empty.

Production remains untouched.

## 130. Unified V2 intake readiness report

The first authored V2 asset can now be assessed with one command after its GLB, finalized manifest and review evidence exist.

New files:

`scripts/lib/cue-id-intake-assessor.mjs`
`scripts/assess-cue-id-v2.mjs`
`tests/cueIdIntakeAssessor.test.ts`

New command:

```bash
npm run cue-id:assess -- <asset.glb> <manifest.json> --evidence <evidence.json>
```

The assessor combines:

- package-to-GLB validation;
- semantic static coverage;
- visual review evidence;
- real-device mobile review evidence;
- interactive semantic binding readiness;
- full/reduced runtime performance evidence.

It reports:

- `package.ready`;
- `static.ready`;
- `interactive.ready`;
- field-level issues for each gate;
- one summary state.

Summary states:

- `package_invalid`;
- `package_valid_review_pending`;
- `static_ready_interactive_pending`;
- `interactive_ready`.

This is a reporting/pre-admission tool only. It does not mutate `CUE_ID_PRODUCTION_CATALOGUE`.

The production catalogue remains empty.

Production remains untouched.

## 131. Non-destructive production promotion proposal

The V2 intake pipeline now has a final promotion proposal gate without automatic catalogue mutation.

New files:

`scripts/lib/cue-id-promotion-proposal.mjs`
`scripts/propose-cue-id-promotion.mjs`
`tests/cueIdPromotionProposal.test.ts`

New command:

```bash
npm run cue-id:propose-promotion -- <asset.glb> <manifest.json> --evidence <evidence.json>
```

Behavior:

- `auto` promotes to the highest readiness state actually achieved;
- static-ready assets produce `static_approved` proposals;
- fully passing assets produce `interactive_approved` proposals;
- forced interactive promotion is rejected when interactive gates are incomplete;
- missing human review evidence blocks promotion;
- the command outputs a proposal object only;
- `CUE_ID_PRODUCTION_CATALOGUE` is never modified automatically.

This preserves explicit human control over the final catalogue admission step.

The production catalogue remains empty.

Production remains untouched.

## 132. Authored V2 working-package scaffold

The repository can now generate the exact working package expected from the first real authored CUE ID V2 asset.

New files:

`scripts/lib/cue-id-package-scaffold.mjs`
`scripts/scaffold-cue-id-v2-package.mjs`
`tests/cueIdPackageScaffold.test.ts`

New command:

```bash
npm run cue-id:scaffold-package -- --version <x.y.z> --output-dir <path>
```

The scaffold creates source/export/textures/renders/manifest directories plus:

- `manifest.draft.json`;
- `evidence.draft.json`;
- `asset-metadata.draft.json`;
- `bindings.md`;
- package `README.md`.

Safety rules:

- version format is constrained to `x.y.z`;
- semantic bindings are never guessed;
- static variants begin empty;
- review/performance evidence begins incomplete;
- existing scaffold files are never overwritten.

This converts the V2 source-asset brief into an executable artist handoff package without admitting or fabricating a production asset.

The production catalogue remains empty.

Production remains untouched.

## 133. Sculpt / rig production specification

The first authored V2 asset now has an explicit sculpt and rig production specification rather than relying on broad art-direction language alone.

New document:

`docs/CUE_ID_SCULPT_SPEC_V2.md`

The spec defines:

- canonical `neutral + regular` reference state;
- strict separation of `base` and `build` morph semantics;
- three-base regular review gate before build work;
- nine base/build spot-check matrix;
- shared editorial adult proportion envelope;
- allowed structural differentiation zones;
- build morph rules;
- head/topology priorities;
- joint and garment deformation acceptance;
- shared-rig expectations;
- semantic pose targets;
- material-slot expectations;
- ordered sculpt review gates;
- hard rejection conditions.

The working-package scaffold now also generates:

`SCULPT_SPEC.md`

so an external 3D artist receives the essential production rules inside the handoff package itself.

Critical rule preserved:

- feminine regular must not be authored as slim;
- masculine regular must not be authored as strong;
- build remains independent across feminine, neutral and masculine bases.

The production catalogue remains empty.

Production remains untouched.

## 134. Machine-readable sculpt review gates

The authored V2 handoff now contains an operational review artifact for the sculpt itself.

New files:

`scripts/lib/cue-id-sculpt-review.mjs`
`scripts/assess-cue-id-sculpt-review.mjs`
`tests/cueIdSculptReview.test.ts`

New command:

```bash
npm run cue-id:assess-sculpt -- <sculpt-review.json>
```

`cue-id:scaffold-package` now also creates:

`manifest/sculpt-review.draft.json`

Review order is enforced:

- A: regular feminine/neutral/masculine structural gate;
- B: independent build matrix;
- C: tee fit/deformation;
- D: pose parity/grounding;
- E: product-size visual read only; real-device mobile review is tracked separately.

Passing a gate requires:

- every required check true;
- at least one evidence reference;
- all previous gates already passed.

The assessor returns readiness, issues, failed/pending gates and the next unresolved gate.

Important boundary:

- this tool does not automatically set production `visualReview` evidence;
- final admission still requires an explicit human approval decision.

The production catalogue remains empty.

Production remains untouched.

## 135. Sculpt review → visual evidence bridge

The structured sculpt review can now produce a non-destructive production evidence proposal once every Gate A–E requirement passes.

New files:

`scripts/lib/cue-id-visual-evidence-proposal.mjs`
`scripts/propose-cue-id-visual-evidence.mjs`
`tests/cueIdVisualEvidenceProposal.test.ts`

New command:

```bash
npm run cue-id:propose-visual-evidence -- <sculpt-review.json> <evidence.json>
```

Evidence drafts generated by `cue-id:scaffold-package` now include `assetVersion`.

Safety boundaries:

- incomplete sculpt review cannot produce visual approval evidence;
- review/evidence asset versions must match;
- only `visualReview` becomes true;
- mobile review and performance remain independent;
- evidence references from the passed sculpt gates are preserved;
- source evidence is not modified automatically;
- catalogue state is untouched.

This makes the sculpt approval auditable without collapsing visual, mobile and performance review into one automatic decision.

The production catalogue remains empty.

Production remains untouched.

## 136. Separate product-size and real-device mobile gates

A review-boundary inconsistency was corrected.

Before this block, sculpt Gate E required iPhone/Android device checks while `mobileReview` remained a separate production evidence field. That duplicated the same acceptance concern in two places.

Correction:

- sculpt Gate E is now `E_productSize`;
- it validates visual readability at approximately 390 px only;
- real-device validation has its own independent review artifact.

New files:

`scripts/lib/cue-id-mobile-review.mjs`
`scripts/assess-cue-id-mobile-review.mjs`
`scripts/lib/cue-id-mobile-evidence-proposal.mjs`
`scripts/propose-cue-id-mobile-evidence.mjs`
`tests/cueIdMobileReview.test.ts`

New scaffold artifact:

`manifest/mobile-review.draft.json`

New commands:

```bash
npm run cue-id:assess-mobile -- <mobile-review.json>
npm run cue-id:propose-mobile-evidence -- <mobile-review.json> <evidence.json>
```

Mobile pass requires both iPhone-class and representative Android mid-range evidence plus the reduced-tier/product-read checks.

The mobile evidence bridge:

- requires matching asset versions;
- sets only `mobileReview: true`;
- preserves visual/performance evidence;
- stores device evidence refs;
- never edits source evidence automatically.

This restores a clean evidence model:

```text
sculpt/product-size review -> visualReview
real-device review         -> mobileReview
runtime measurements       -> performance
```

The production catalogue remains empty.

Production remains untouched.

## 137. Structured performance evidence

The final independent evidence axis now has the same auditable workflow as visual and mobile review.

New files:

`scripts/lib/cue-id-performance-review.mjs`
`scripts/assess-cue-id-performance-review.mjs`
`scripts/lib/cue-id-performance-evidence-proposal.mjs`
`scripts/propose-cue-id-performance-evidence.mjs`
`tests/cueIdPerformanceReview.test.ts`

New scaffold artifact:

`manifest/performance-review.draft.json`

New commands:

```bash
npm run cue-id:assess-performance -- <performance-review.json>
npm run cue-id:propose-performance-evidence -- <performance-review.json> <evidence.json>
```

The assessor imports and uses the real product performance policy from `app/domain/cueIdPerformance.ts`.

Current ready-time budgets remain:

- full <= 800 ms;
- reduced <= 1500 ms.

Each tier requires:

- a finite non-negative `totalReadyMs` measurement;
- at least one evidence reference;
- a passing result against the runtime budget.

The evidence bridge:

- requires matching asset versions;
- sets only the full/reduced performance timings;
- preserves visual/mobile state;
- records budget + measurement + evidence refs;
- does not mutate source evidence automatically.

The independent evidence model is now:

```text
sculpt/product-size review -> visualReview
real-device review         -> mobileReview
runtime timing review      -> performance
package-to-GLB validator   -> packageValidation
```

The production catalogue remains empty.

Production remains untouched.

## 138. Intake evidence asset-version integrity

The unified V2 intake boundary now rejects review evidence that belongs to a different asset version.

Correction:

- scaffold evidence already carries `assetVersion`;
- visual/mobile/performance evidence proposal bridges already require matching versions;
- `cue-id:assess` now independently checks evidence `assetVersion` against manifest `assetVersion`;
- missing evidence version blocks static and interactive readiness;
- mismatched evidence version blocks static and interactive readiness;
- package validation can still report independently, but review evidence cannot be reused across asset revisions.

Regression coverage was added to:

`tests/cueIdIntakeAssessor.test.ts`

Promotion proposal fixtures now also use versioned evidence consistently.

A duplicate HANDOFF section for block 137 created by concurrent documentation commits was removed while closing this block.

The production catalogue remains empty.

Production remains untouched.

## 139. Combined review evidence orchestration

The three independent review axes can now be assembled into one intake evidence proposal without manual copying.

New files:

`scripts/lib/cue-id-combined-evidence-proposal.mjs`
`scripts/propose-cue-id-combined-evidence.mjs`
`tests/cueIdCombinedEvidenceProposal.test.ts`

New command:

```bash
npm run cue-id:propose-evidence -- <sculpt-review.json> <mobile-review.json> <performance-review.json> <evidence.json>
```

Behavior:

- requires matching `assetVersion` across all four inputs;
- rejects cross-version review mixing before any bridge runs;
- reuses the existing visual/mobile/performance proposal builders;
- rejects if any underlying review is incomplete;
- returns one evidence proposal with `visualReview`, `mobileReview`, performance and all audit refs;
- adds `evidenceVersion: 1`;
- never mutates source files;
- never touches the production catalogue.

The working-package README now directs the artist/integrator to generate this combined evidence before `cue-id:assess`.

The production catalogue remains empty.

Production remains untouched.

## 140. Review-contract documentation normalization

Residual documentation drift from the product-size/mobile split has been removed.

Corrections:

- sculpt Gate E is consistently documented as product-size visual review only;
- real-device iPhone/Android validation is consistently documented as a separate mobile review;
- scaffold checklist wording now distinguishes product-size still review from real-device mobile review;
- the source-package tree now lists sculpt/mobile/performance review artifacts;
- duplicated source-package section numbering around performance/evidence orchestration was normalized.

No runtime behavior changed.

The production catalogue remains empty.

Production remains untouched.

## 141. Production asset contract synchronized with implementation

The authored V2 technical contract has been aligned with the current production implementation.

Corrections in `docs/CUE_ID_ASSET_CONTRACT_V2.md`:

- removed the obsolete generic `static.portrait/static.square` manifest shape;
- documented semantic `static.variants` keyed by complete visible CUE ID state;
- documented portrait + square coverage for every declared capability combination;
- documented that no semantic fallback is allowed between base/build/pose/accessory/material/accent;
- aligned catalogue terminology with `static_approved` / `interactive_approved` admission stages;
- removed stale `CUE_ID_ASSETS` wording from the promotion contract.

`docs/CUE_ID_SOURCE_ASSET_PACKAGE_V2.md` also had a duplicated performance-review section left by concurrent commits. The duplicate was removed and following sections renumbered.

No runtime behavior changed.

The production catalogue remains empty.

Production remains untouched.


## 142. Creator lab preview single-representation boundary

The CUE ID creator lab no longer stacks three competing visual representations.

Previous behavior in the creator could combine:

- the procedural `CueIdStage` placeholder figure;
- the TresJS GLB lab candidate once loaded;
- the creator semantic CSS preview.

That produced a ghost/double-avatar risk and made the creator visually incoherent.

Correction:

- `CueIdStage` now exposes `showPlaceholderFigure`, defaulting to `true`;
- all existing/non-creator consumers retain the current placeholder behavior by default;
- the creator passes `interactive=false` while its selected config resolves to `lab_candidate`;
- the creator also passes `showPlaceholderFigure=false` in that state;
- therefore the creator lab shows exactly one semantic preview representation;
- when a selected config resolves to an admitted production asset, the creator re-enables the normal production stage;
- `/cue-id` keeps the TresJS `candidate` / `benchmark` runtime path for technical GLB, device-tier and performance validation.

The creator lab source label was changed from “Lab candidate” to “Lab preview” because the creator no longer renders the technical candidate GLB directly.

This is an intentional product boundary:

```text
Creator lab     -> one semantic product preview
/cue-id lab     -> technical TresJS candidate/benchmark
Production      -> admitted static/interative authored asset
```

No production catalogue entry was added.

Production remains untouched.

Visual quality of the semantic creator preview is NOT considered approved by this change alone; this block removes representation overlap only.


## 143. Creator semantic preview humanization pass

The creator lab semantic preview was refined after removing the overlapping Stage/GLB/mannequin representations.

Changes in `CueIdCreator.vue`:

- removed the hologram-like `mix-blend-mode: screen` presentation;
- increased semantic preview solidity/readability;
- added authored-looking neck, arms and hands to the CSS preview;
- improved head shading and facial plane hints;
- improved garment, trouser and footwear volume;
- added `base` and `build` classes to the semantic preview state;
- `build` now changes body mass subtly on the same figure;
- `base` changes shoulder/torso structure without using feminine=slim or masculine=strong shortcuts;
- review preview opacity is now near-full rather than washed out;
- review copy is source-aware: lab configurations remain explicitly provisional while production-resolved configurations use production copy.

Important boundary:

This is still a semantic lab preview, not an approved authored avatar asset.

Do not treat this CSS preview as the final visual quality bar.

The purpose of this pass is to make the creator coherent and useful while the real authored asset pipeline remains pending.

The production catalogue remains empty.

Production remains untouched.


## 144. Creator UX separated from technical asset diagnostics

The main CUE ID creator no longer exposes production admission gates as artist-facing UI.

Removed from the creator surface:

- visual review gate;
- mobile review gate;
- package validation gate;
- performance gate;
- pending/pass technical status panel.

The underlying asset status model remains intact and is still used internally for:

- lab vs production source resolution;
- source-aware representation coverage;
- asset version display when applicable;
- lab/production review copy.

Technical validation belongs in the dedicated `/cue-id` lab and intake tooling, not in the artist creator.

Creator copy was also cleaned to remove implementation vocabulary such as:

- “authored asset pending”;
- “fixture”;
- “production avatar”.

The artist-facing creator now speaks in terms of identity, appearance and preview while retaining a discreet lab disclaimer when the selected configuration is not backed by an admitted production asset.

This preserves a clean product boundary:

```text
Artist creator -> identity decisions and visual feedback
/cue-id lab    -> runtime / asset diagnostics and benchmark work
intake scripts -> package / review / performance admission
```

No production catalogue entry was added.

Production remains untouched.


## 145. Creator navigation parity across desktop and mobile

Desktop and mobile creator navigation now share the same interaction model and state semantics.

Changes:

- introduced a single `selectStep(step)` path for direct category navigation;
- desktop rail and mobile tabs now use the same active-step transition;
- mobile now exposes the same category numbering as desktop;
- mobile now uses `aria-current="step"` for the active category;
- mobile now mirrors pending visual-coverage state;
- active mobile styling now communicates the selected category consistently with the desktop rail.

The goal is one creator system rendered responsively, not two separate interfaces.

No domain semantics changed.

No production catalogue entry was added.

Production remains untouched.


## 146. Creator 3D authored slice contract and runtime bindings

CUE ID has moved from CSS-placeholder refinement into the first real authored 3D integration phase.

New runtime/domain support:

- `app/domain/cueIdCreator3dBindings.ts`
- optional `bindings.creator` block in `CueIdProductionManifest`
- creator-aware semantics inside `CueIdProductionScene.client.vue`

The creator 3D binding layer supports:

- face morph selection;
- hair mesh visibility;
- facial-hair mesh visibility;
- top mesh visibility;
- bottom mesh visibility;
- footwear mesh visibility;
- semantic skin tone applied to the authored body material.

The existing V2 production binding contract remains valid.

Creator bindings are optional, so existing V2 manifests are not widened implicitly.

The renderer only applies creator semantics when an explicit creator config + creator binding block are present.

A new authoring target document now defines the first real slice:

`docs/CUE_ID_CREATOR_3D_V1.md`

First authored slice:

- neutral / regular;
- skin-03 + skin-05;
- face-03 + face-04;
- textured-crop + curly-crop + locs;
- none + short-beard;
- oversized-tee + bomber;
- wide-trouser + cargo;
- technical-sneaker + boot;
- accessory none;
- neutral + relaxed poses;
- matte treatment.

Important implementation choice:

Skin variants do not consume one material each.

The authored asset keeps one skin surface/material; semantic skin tones modify that authored surface so the <=4 material budget remains realistic for mobile.

Static-first boundary:

The existing V2 static variant cartesian key is NOT expanded to every Creator dimension.

The first Creator 3D authored asset is validated interactively in the noindex `/cue-id` lab.

Before any Creator 3D production admission, Cuebooker still needs a per-saved-avatar static snapshot strategy rather than pre-rendering the full combinatorial Creator catalogue.

The production catalogue remains empty.

Production remains untouched.

Current next step:

Produce or import the first authored GLB matching `docs/CUE_ID_CREATOR_3D_V1.md`, inspect it, build the draft creator binding manifest from the actual exported node/morph names, and validate it in the CUE ID lab before any production promotion.


## 147. Authored Creator 3D lab-candidate slot

The first real authored Creator GLB can now be integrated and reviewed in `/cue-id` without pretending it is production-ready.

New file:

`app/domain/cueIdCreator3dLabCandidate.ts`

Key boundary:

```ts
CUE_ID_CREATOR_3D_LAB_CANDIDATE
```

remains `null` until an actual inspected GLB + partial manifest exist.

The lab candidate resolver requires both:

- the selected legacy/runtime semantics to resolve;
- the selected Creator semantics to resolve.

If the current Creator config is outside the authored slice, the Creator falls back to its semantic lab preview instead of showing a wrong authored avatar.

Runtime changes:

- `resolveCueIdProductionBindings(..., { allowPartial: true })` exists for lab validation only;
- `CueIdProductionScene.client.vue` accepts `labMode`;
- `CueIdStage.vue` accepts `labAuthoredManifest` + `creatorConfig`;
- lab authored renders are tracked separately from production renderer readiness;
- the Creator remounts the Stage when switching semantic-lab / authored-lab / production modes;
- authored lab does not show the procedural placeholder mannequin while loading.

Production behavior remains strict:

- default production binding resolution still requires full interactive readiness;
- the production catalogue remains empty;
- no production admission is bypassed.

The Creator review view was also corrected: it still contained the old technical GLB candidate path and could double-render. Edit and review now use the same single-representation rule.

Authoring flow is documented in:

`docs/CUE_ID_CREATOR_3D_V1.md`

The first real GLB should be placed under an application-owned lab path, inspected with the existing CUE ID inspector, then wired into the lab candidate slot using the actual exported bindings.

MakeHuman / MPFB core assets are documented as a possible CC0 base-mesh starting point only. Cuebooker must still sculpt, style, retopologize, rig-clean and optimize the character into its own authored visual identity. The runtime has no MakeHuman dependency.

Production remains untouched.


## 148. Creator 3D authored package scaffold

The existing CUE ID package scaffold now supports a dedicated first-avatar profile without changing the default V2 behavior.

Command:

```bash
npm run cue-id:scaffold-package -- \
  --version 3.0.0 \
  --profile creator-3d-v1 \
  --output-dir /path/to/work
```

Default behavior remains the legacy V2 scaffold when `--profile` is omitted.

The `creator-3d-v1` profile generates a lab-only authored package containing:

- source/export/textures/renders/manifest directories;
- partial Creator 3D manifest draft;
- Creator-specific bindings sheet;
- Creator-specific sculpt spec;
- evidence/metadata/mobile/performance drafts;
- explicit lab GLB path `/cue-id/lab/creator-v1.glb`.

The generated Creator manifest is deliberately narrow:

- base neutral;
- build regular;
- skin-03 / skin-05;
- face-03 / face-04;
- textured-crop / curly-crop / locs;
- none / short-beard;
- oversized-tee / bomber;
- wide-trouser / cargo;
- technical-sneaker / boot;
- neutral / relaxed poses.

No production admission or catalogue entry is generated.

The next material step is no longer architecture: create/export the actual GLB into this package, inspect it, fill bindings from the real export and wire that inspected manifest into `CUE_ID_CREATOR_3D_LAB_CANDIDATE`.


## 149. Blender-side Creator 3D V1 export gate

The authored avatar flow now includes a Blender-side pre-export validator:

`scripts/blender/cue-id-creator-v1-export.py`

It is intended to run against the real editable `.blend` source before producing `creator-v1.glb`.

The gate blocks export when the first authored slice is structurally incomplete or outside hard runtime budgets:

- required Creator mesh aliases;
- face-04 morph;
- neutral/relaxed actions;
- body/textile materials;
- one shared armature;
- <=35k triangles;
- <=4 materials;
- <=2048 texture dimension.

The canonical visible exported state is textured-crop + oversized-tee + wide-trouser + technical-sneaker while the other first-slice meshes remain in the GLB for runtime visibility switching.

This script is authoring tooling only and does not enter the application bundle.

Current material blocker is now external to repo architecture: create the actual sculpt/rig/garments in Blender/MPFB (or another DCC), then run this export gate and wire the inspected GLB into the existing authored lab candidate slot.


## 150. MPFB authoring bootstrap automated in CI

The external Blender authoring blocker has been reduced to a reproducible CI workflow.

New files:

`scripts/blender/cue-id-creator-v1-bootstrap.py`
`.github/workflows/cue-id-author-bootstrap.yml`

The workflow:

- downloads Blender 5.2.2;
- installs the official MPFB extension;
- creates an editable human source;
- applies the face-03 reference sculpt;
- creates the `cue_face_04` morph;
- adds one `game_engine` rig;
- creates `cue_pose_neutral` and `cue_pose_relaxed`;
- saves `source.blend`;
- emits geometry/rig metadata;
- renders full-body and portrait review PNGs;
- stores everything as a GitHub Actions artifact.

The generated source is explicitly an authoring base, not a production avatar and not a lab candidate.

Measured MPFB basemesh geometry:

```text
visible body vertices: 13,380
visible body triangles: 26,756
hidden helper triangles: 10,216
raw mesh triangles: 36,972
```

The visible body alone leaves too little geometry budget for the full Creator slice, so the raw MPFB basemesh is retained only as a high-detail authoring source.

Production remains untouched.

## 151. Lightweight topology comparison

A CI topology probe was added:

`scripts/blender/cue-id-creator-v1-topology-probe.py`
`.github/workflows/cue-id-topology-probe.yml`

It installs the official MakeHuman CC0 system asset pack and compares these proxies with the same neutral CUE ID source character:

- `proxy741`;
- `male1591`;
- `female1605`.

The probe generates full-body and portrait renders plus triangle/vertex measurements.

Review result:

- `proxy741` is too destructive in the face for the first authored CUE ID;
- `female1605` preserves detail but carries anatomy-specific torso volume that is undesirable for the neutral base;
- `male1591` provides the best current balance for the neutral export topology.

The upstream filename `male1591` is provenance only. The runtime object is renamed `cue_body` and CUE ID semantics do not expose that upstream naming.

Production remains untouched.

## 152. First low-poly dressed canonical source

New authoring files:

`scripts/blender/cue-id-creator-v1-lowpoly-source.py`
`.github/workflows/cue-id-lowpoly-source.yml`

The first successful artifact used the `male1591` proxy as `cue_body`, generated `cue_face_04` on that topology, shared one rig and created a canonical visible set:

```text
cue_hair_textured_crop
cue_top_oversized_tee
cue_bottom_wide_trouser
cue_footwear_technical_sneaker
```

The first pass proved the technical structure and remained within the hard material budget, but its visual result is rejected.

Observed problems in review:

- relaxed arm pose reads unnaturally;
- garment shells look visibly layered over the body;
- shoulder/axilla treatment makes the arms look joined;
- trousers intersect/read too close to the body;
- textured crop intrudes too far into the face;
- review lighting overexposes the materials.

The generated ZIP from this pass must NOT be treated as accepted visual evidence.

No GLB from this pass should be wired into `CUE_ID_CREATOR_3D_LAB_CANDIDATE`.

## 153. Canonical shell refinement in progress

The low-poly source is being refined before authoring any additional variants.

Current correction direction:

- reduce hair coverage and remove subdivision from the crop;
- clean the front hairline and temple selection;
- restrict the oversized tee to torso plus short-sleeve regions;
- create a real neckline opening;
- offset garment vertices using body normals to avoid z-fighting and shell intersections;
- separate trouser legs and waist more cleanly;
- reduce review light energy;
- preserve the same `cue_body` topology, morph and shared rig.

This step intentionally delays curly crop, locs, bomber, cargo, boot and beard. Variant expansion only resumes after the canonical combination reads as one believable authored character at product size.

Production remains untouched.

## 154. Authoring workflow infrastructure

GitHub Actions headless Blender rendering now installs Mesa/EGL/Xvfb dependencies and runs render steps under `xvfb-run`.

The MakeHuman CC0 system asset ZIP is cached in the low-poly workflow so later authoring iterations do not repeatedly download the full 267 MB pack.

The first headless topology comparison now completes successfully.

The production catalogue remains empty.

Production remains untouched.


## 155. Quality-source review rejected, visual criteria locked

The first MPFB quality-source render proved the fitted-asset pipeline but is rejected as a visual candidate.

User review identified concrete blockers:

- eyes rendered white / unreadable;
- arm and shoulder deformation still looked unnatural;
- the relaxed pose did not read like a person standing naturally;
- the default white shirt + patterned trousers were wrong for the CUE ID base identity;
- the default avatar must not assume long sleeves or full-length trousers because later Creator variants include short sleeves, sleeveless/tank tops and shorts.

The initial canonical outfit is now locked to a deliberately neutral visual baseline:

```text
top: plain black T-shirt
bottom: plain black trousers
footwear: dark neutral sneaker
hair: short crop with the full face visible
pose: natural standing relaxed
```

This baseline is for evaluating anatomy, face, deformation and silhouette. Artist customization comes after the neutral base reads correctly.

Visual acceptance gate before any lab candidate:

- both eyes must be visible and readable;
- hair must not cover eyes, nose or most of the face;
- face must read as a plausible adult human rather than a low-poly mannequin;
- shoulders must sit down naturally;
- arms must fall close to the torso;
- elbows need only a slight natural flex;
- hands must rest around upper/mid-thigh without crossing;
- no T-pose or pseudo-T-pose may be used as the accepted review pose;
- plain black top and trousers must be the canonical initial outfit;
- no clipping, detached shells or exposed skin caused by garment masks;
- body coverage must support future short-sleeve, sleeveless and shorts variants without rebuilding the character.

The quality-source ZIP produced before this section is evidence only and must not be promoted.

Production remains untouched.

## 156. Authoring direction switched to hybrid head/body prototype

The next prototype is implemented in:

`scripts/blender/cue-id-creator-v1-hybrid-source.py`

with CI in:

`.github/workflows/cue-id-hybrid-source.yml`

Reason for the change:

- `male1591` is efficient for the body but visibly degrades facial anatomy;
- the full MakeHuman basemesh preserves substantially more facial information but is too expensive as the complete runtime body;
- fitted MHCLO assets are retained for clothing/body parts because they provide correct fitting, rig integration and authoring provenance.

Current prototype architecture:

- one shared `cue_rig`;
- lightweight `cue_body` from the official `male1591` proxy;
- separate masked high-detail `cue_head` from the authored MakeHuman basemesh;
- `cue_face_04` remains on the high-detail head source;
- MHCLO eyes, eyebrows, short hair, top, trousers and footwear;
- full lightweight body is preserved under the outfit so exposed-skin variants can later use tank tops and shorts;
- garment masks are not baked permanently into the runtime body in this prototype;
- neutral and relaxed actions stay embedded;
- production catalogue and production runtime remain unchanged.

The hybrid prototype is still evidence-only until it passes the visual gate in section 155.

Current next step:

1. inspect the hybrid full-body and portrait renders;
2. force the canonical garments to plain black/dark materials;
3. correct eye rendering if the MHCLO eye material is still unreadable;
4. tune the relaxed standing pose from the actual rendered deformation;
5. only after those pass, run the Blender export gate and prepare the first authored lab GLB.

Production remains untouched.


## 157. CUE ID visual direction pivot: stylized avatar Creator

The realistic / semi-realistic avatar direction is rejected.

The user explicitly prefers an intentionally stylized 3D character closer to a low-poly soft-caricature/editorial avatar. The previous MakeHuman outputs read as cheap because realistic anatomy, face, eyes and deformation expose every imperfection.

Canonical spec:

`docs/CUE_ID_STYLIZED_CREATOR_V1.md`

New semantic domain:

`app/domain/cueIdStylizedCreator.ts`

This new direction supersedes the visual target in the earlier realistic Creator authoring experiments.

Stylized V1 scope is deliberately finite:

- body: male / female;
- six existing skin tones;
- five expressions: neutral, smile, focused, confident, playful;
- eye colours: blue, green, hazel, dark;
- optional stylized contacts: none, ice, white, red;
- hair styles: buzz, crop, curly, bob, locs;
- hair colours: black, brown, blond, red, platinum;
- facial hair: none, stubble, moustache, beard;
- piercings: ear, septum, nostril, eyebrow, maximum three active;
- tops: tee, tank, sweatshirt, hoodie, bomber;
- bottoms: wide trouser, straight trouser, cargo, shorts, denim;
- one-piece: none / jumpsuit;
- footwear: minimal sneaker, technical sneaker, boot;
- six shared garment colours.

Canonical initial avatar:

```text
male
skin-03
neutral expression
dark eyes
no contacts
crop / black hair
no facial hair
no piercings
black tee
black wide trousers
black minimal sneaker
relaxed standing
```

Art rules:

- stylization is intentional;
- no photoreal skin;
- no realistic strand hair;
- facial planes may be simplified;
- eyes must remain readable;
- hair must be built as designed masses;
- clothes use clean silhouettes;
- proportions may be mildly caricatured;
- avatar must read well around 390 px;
- avoid childish/chibi proportions.

Runtime material target:

```text
cue_mat_skin
cue_mat_hair
cue_mat_textile
cue_mat_detail
```

The first stylized runtime should target <=20k visible triangles, hard <=28k, one armature, <=4 materials, <=4 active textures and max 1024 texture dimension.

The complete authoring library may contain more inactive meshes. Performance gates must measure the active configuration separately from all stored variants.

Previous realistic authoring files and workflows are now research evidence only:

- MPFB bootstrap;
- low-poly male1591 source;
- quality MakeHuman source;
- hybrid high-detail-head / low-poly-body prototype.

None of those assets may be promoted to `CUE_ID_CREATOR_3D_LAB_CANDIDATE`.

Production remains untouched.

Current next step:

Build one intentional stylized lab character first, using the locked default configuration above. The first visual gate is the male base with black outfit and all five facial expressions. Once its art direction is accepted, derive the female body and the remaining modular options from the same visual system.


## 158. Stylized Creator accessories and Cuebooker Basics locked

The stylized Creator domain now includes dedicated accessory slots rather than one generic accessory selector.

Implemented in:

`app/domain/cueIdStylizedCreator.ts`

Accessory slots:

```text
headwear:
  none
  cap
  beanie
  top-hat

face accessory:
  none
  mask

ear accessory:
  none
  headphones

hands:
  none
  short-gloves
  long-gloves
```

Piercings remain an independent multi-select dimension:

```text
ear
septum
nostril
eyebrow
```

with a maximum of three simultaneous piercings.

Compatibility rule:

- accessory choices are persisted independently;
- the UI/runtime must not silently change hair, piercings or clothing when another accessory is selected;
- unsupported physical combinations are marked unavailable by authored-coverage metadata;
- hair-fit variants may be used internally for hats/headphones without changing the selected hair semantic;
- `top-hat + headphones` does not need simultaneous authored coverage in V1.

The canonical default still has no accessories selected.

### Cuebooker Basics

The initial clothing family is now named `Cuebooker Basics`.

Branding is deliberately subtle:

- black tee: small Cuebooker symbol on the left chest;
- sweatshirt / hoodie: small symbol on the left chest;
- bomber: small symbol on the sleeve;
- cap / beanie: small front symbol;
- wide / straight trousers: no visible logo by default;
- cargo: optional tiny pocket mark;
- prefer the Cuebooker symbol/isotype over the full wordmark at avatar scale.

Branding is garment metadata, not a separate runtime material and not a required user-facing creator control.

Tests:

`tests/cueIdStylizedCreator.test.ts`

cover the accessory catalogue, validation, piercing cap and the Cuebooker Basics branding defaults.

## 159. First primitive stylized render rejected as final art

The CI-generated primitive stylized avatar successfully proved:

- five expression morph targets;
- deterministic Blender generation;
- a very small geometry footprint;
- basic material/render plumbing.

Its current full-body render is still rejected as the final art target.

Reason:

- torso and limbs read as assembled primitives;
- silhouette is too rigid;
- body proportions feel like a technical mannequin;
- the approved reference requires softer continuous cartoon anatomy and a more designed face.

Do not spend further time polishing the primitive body.

The next art pass should use the approved soft-caricature reference as the visual target and keep the semantic/runtime contract already defined in `docs/CUE_ID_STYLIZED_CREATOR_V1.md`.

Production remains untouched.


## 160. Blender Studio stylized body adopted as authored source

The primitive-built stylized body is no longer the character base.

CUE ID Stylized V1 now uses the official Blender Studio / Blender Human Base Meshes
stylized male/female bodies as the authoring source.

Source bundle used for validation:

`Human Base Meshes v1.4.1`

License:

`CC0`

Validated collections:

```text
Body Male - Stylized
Body Female - Stylized
```

Both source bodies contain the same measured geometry:

```text
raw vertices: 14,106
raw triangles: 28,200
```

The source is intentionally retained as authoring/reference geometry. It is too close
to the V1 hard active-avatar budget to ship unchanged once hair, clothing and
accessories are present.

Runtime reduction probe:

```text
50% body reduction:
  evaluated vertices: 7,856
  evaluated triangles: 15,700

35% body reduction:
  evaluated vertices: 5,981
  evaluated triangles: 11,950
```

Visual decision:

- 50% retains substantially better face, ear and hand definition;
- 35% introduces visible faceting and loses too much facial quality;
- the first runtime source therefore starts at 50% reduction;
- reduction is applied before CUE ID expression morph authoring;
- the full CC0 source remains the editable visual reference.

This leaves roughly 4k triangles inside the preferred 20k active-avatar target for
hair and visible authored details, while the 28k hard limit remains the safety ceiling.

New authoring path:

`scripts/blender/cue-id-studio-stylized-v1-source.py`

CI:

`.github/workflows/cue-id-studio-stylized-v1.yml`

The first pass builds the male art-gate character with:

- slightly enlarged/stylized head proportions;
- readable eyes and iris geometry;
- authored brows;
- crop hair made from smooth cartoon masses;
- black Cuebooker Basics tee/trousers/shoes;
- small Cuebooker chest mark;
- neutral + four expression morphs;
- one shared armature;
- relaxed standing pose.

Female derivation and the full wardrobe/accessory library follow only after this
male visual gate passes.

Production remains untouched.


## 161. Quality-first rule overrides early runtime budgets

The user explicitly rejected performance-first compromises.

CUE ID must not ship or be approved visually if optimization makes the character look cheap.

From this point:

- approved male/female prototype images are the art target;
- first build high-quality 3D masters;
- do not decimate the master before visual approval;
- previous <=20k preferred / <=28k hard targets apply only to later runtime LOD candidates, not to the authored master;
- rigging, expressions and modular assets follow the accepted master;
- runtime optimization happens after the master passes visual review;
- if an optimization visibly reduces face, hair, hands, clothing or silhouette quality, reject it;
- low-end devices may use lower LODs or static snapshots rather than degrading the canonical art source.

Production remains untouched.


## 162. Meshy male/female masters received and audited

The approved CUE ID male/female visual masters were exported from Meshy and supplied in both GLB and FBX packages.

Canonical local filenames:

```text
cueid-male-master-v1.glb
cueid-male-master-v1.fbx.zip
cueid-female-master-v1.glb
cueid-female-master-v1.fbx.zip
```

Measured files:

```text
male GLB
  bytes: 26,674,040
  sha256: 1139d7166cd51ece54877c0d0e6589ab0bcc5544067c99ff07f75d3613123e7f

female GLB
  bytes: 24,560,984
  sha256: f3000754bb34bc411d123cb7ea1929be2c096ace0e0174d83687f84d6d2528df

male FBX package
  bytes: 45,047,692
  sha256: c1d7e0df3b8c04681c7704f9aa3d4bf08fbab7ddd67be1930e30858862e56b2d

female FBX package
  bytes: 41,906,176
  sha256: d522f46a504e31b5df8eb68aa906b2dc503bb5660c5a93de51773a4cb2a0f93b
```

GLB geometry audit:

```text
male
  vertices: 395,763
  triangles: 735,810
  mesh primitives: 1
  materials: 1
  skins: 0
  animations: 0
  morph targets: 0
  extents: ~0.693 x 1.896 x 0.350

female
  vertices: 352,674
  triangles: 655,612
  mesh primitives: 1
  materials: 1
  skins: 0
  animations: 0
  morph targets: 0
  extents: ~0.679 x 1.900 x 0.425
```

Both GLBs contain 2K embedded PBR textures:

- base color;
- metallic/roughness;
- normal.

The FBX ZIPs additionally contain the separate PNG texture files:

- base color;
- metallic;
- roughness;
- normal.

Decision:

- the GLBs are the primary approved visual masters for Cuebooker/Web/ThreeJS;
- the FBX packages are retained as a production/Blender/Unreal fallback;
- do not regenerate the characters unless the approved visual direction changes;
- do not use these raw Meshy exports directly as the modular runtime avatar.

Current structural limitation:

Meshy exported each character as one high-density mesh using one material. There is currently no armature, no animation data, no expression morphs and no semantic material split between skin, hair, clothing and footwear.

Required cleanup phase:

1. preserve the approved silhouette and face;
2. import the master in Blender without visual remodelling;
3. separate or mask semantic regions: skin, hair, top, bottom, footwear, eyes/details;
4. create a dedicated skin mask so skin tone can change independently;
5. create a shared humanoid rig and skin weights;
6. author the five CUE ID expression morphs;
7. add modular hair/facial-hair/piercing/accessory anchors;
8. only after visual/rig approval create runtime LODs;
9. keep the master source untouched as the visual source of truth.

Skin tone must be material-driven, not separate character meshes. The target remains six selectable skin tones across the same male/female geometry.

Production remains untouched.


## 163. Body masters converted to semantic GLB sources

The approved Meshy body masters now have reproducible semantic-split outputs.

New scripts:

```text
scripts/3d/cue-id-body-semantic-audit.py
scripts/3d/cue-id-body-semantic-split.py
```

Input body masters:

```text
cueid-male-body-master-v1-textured.glb
cueid-female-body-master-v1-textured-clean.glb
```

Semantic outputs generated locally:

```text
cueid-male-body-master-v1-semantic.glb
cueid-female-body-master-v1-semantic.glb
```

Each output contains three explicit geometries:

```text
cue_<body>_skin
cue_<body>_hair
cue_<body>_underwear
```

Male roundtrip:

```text
skin       118,149 vertices / 215,201 tris
hair        66,858 vertices / 120,735 tris
underwear    9,002 vertices / 15,982 tris
total                    351,918 tris
```

Female roundtrip:

```text
skin       115,741 vertices / 206,707 tris
hair       113,993 vertices / 208,695 tris
underwear   29,466 vertices / 51,342 tris
total                    466,744 tris
```

Decision:

- the split is non-destructive;
- total triangle counts remain identical to the source body masters;
- these semantic GLBs become the working source for skin-tone materials and default-hair visibility;
- the original Meshy GLBs remain the immutable visual source of truth;
- eyes/details remain fused with the skin source for now and will be separated during the facial-rig pass;
- do not begin runtime decimation yet.

Next implementation phase:

1. create body material controller with six skin-tone presets;
2. make hair visibility independently controllable;
3. make underwear visibility independently controllable;
4. create the shared humanoid rig contract;
5. author the five expression morphs;
6. only then start modular clothing and accessories.

Production remains untouched.


## 164. Shared physical rig bootstrap prepared

The semantic male/female body masters now have a reproducible Blender 5.2.2 rig bootstrap:

```text
scripts/blender/cue-id-body-rig-v1.py
```

Inputs:

```text
cueid-male-body-master-v1-semantic.glb
cueid-female-body-master-v1-semantic.glb
```

Expected semantic meshes:

```text
cue_male_skin
cue_male_hair
cue_male_underwear

cue_female_skin
cue_female_hair
cue_female_underwear
```

Shared public skeleton contract:

```text
root
hips
spine
chest
upper-chest
neck
head
shoulder-l
upper-arm-l
lower-arm-l
hand-l
shoulder-r
upper-arm-r
lower-arm-r
hand-r
upper-leg-l
lower-leg-l
foot-l
toe-l
upper-leg-r
lower-leg-r
foot-r
toe-r
```

The bootstrap:

- imports the semantic GLB;
- builds the exact shared skeleton for male/female;
- binds skin, source hair and underwear through Blender automatic weights;
- writes `cue_pose_neutral`;
- writes `cue_pose_relaxed`;
- writes `cue_pose_rig_check` as a QA-only deformation pose;
- reports per-mesh weighted-vertex coverage;
- saves an editable `.blend`;
- exports a rigged `.glb`;
- does not author facial expressions yet;
- is not production-admitted automatically.

Acceptance rule:

Automatic weights are never accepted simply because export succeeds. The rig must pass a deformation review around shoulders, elbows, wrists, neck, hips, knees and ankles using `cue_pose_rig_check`.

Expression morphs remain blocked until this body-deformation gate passes.

Current execution limitation:

The uploaded semantic GLBs exist in the active conversation workspace but are not currently reachable from GitHub Actions. The rig script is therefore committed and ready, but physical rig output must be generated either in local Blender 5.2.2 or after placing the semantic GLBs in a CI-accessible asset location.

Production remains untouched.


## 165. Rig deferred; Creator workspace and wardrobe continue in parallel

The physical Blender rig step is intentionally deferred until the user can run the local Blender package.

Pending rig package:

```text
cueid-rig-local-package.zip
```

Do not block product/UI work on this step.

Parallel work completed:

- `app/domain/cueIdWardrobe.ts`
  - shared male/female fitting contract;
  - garment coverage zones;
  - modesty-layer rules;
  - harness/outerwear compatibility;
  - no wardrobe item is restricted by body selection.

- `app/domain/cueIdWorkspace.ts`
  - one body is edited at a time;
  - expression/hair previews always use the currently selected body;
  - switching body preserves the current semantic configuration.

- `app/components/CueIdStylizedWorkspace.vue`
  - new Creator V1 workspace shell;
  - single-body stage;
  - shared catalogue sections;
  - skin/hair/color controls;
  - outfit/footwear/accessory sections;
  - no low-quality fake 3D avatar is shown while the physical rig is pending.

- `app/pages/cue-id.vue`
  - lab route now uses the stylized shared Creator workspace;
  - route remains noindex;
  - production is unchanged.

Wardrobe rules explicitly support:

- mesh tops;
- festival tops/outfits;
- harnesses;
- skirts;
- bodysuits;
- festival wraps;
- Venetian masks;
- platform boots;
- Vans-style shoes;
- festival headwear/goggles;
- the same catalogue for male/female bodies.

Rig remains the gate for:

- real 3D body preview;
- physical poses;
- expression morph execution;
- clothing deformation validation.

Production remains untouched.


## 166. Stylized Creator lab shell completed

The live branch already contained the isolated `CueIdStylizedWorkspace.vue` shell described in section 165. This pass validated that implementation against the current branch and completed missing lab-only UX without touching production.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
app/pages/cue-id.vue
```

Current lab behavior:

- one body is visible/edited at a time;
- male/female body switching preserves the semantic Creator config;
- the same shared catalogue remains available for both bodies;
- skin tones, expressions, hair, hair colors, eyes, contact lenses, facial hair, piercings, makeup and nails are editable;
- top, bottom and one-piece colors are controlled independently;
- footwear has its own color;
- shared accessory color is editable;
- harness remains a torso overlay selection;
- Venetian mask and festival/Burning-Man-inspired catalogue entries remain present;
- the stage remains a non-3D pending-rig state and does not reintroduce the rejected procedural mannequin;
- the current selection is summarized in the pending-rig stage so the editor remains legible while physical preview is deferred.

Save semantics in the lab:

- `Guardar CUE ID` now saves a validated V1 draft only in browser `localStorage`;
- the draft is restored on the same device on the next `/cue-id` visit;
- malformed/stale local drafts are discarded;
- this save path does not publish the profile;
- it does not write to Supabase;
- it does not connect assets to `CUE_ID_PRODUCTION_CATALOGUE`;
- it does not admit anything to `CUE_ID_CREATOR_3D_LAB_CANDIDATE`.

The route remains:

```text
/cue-id
robots = noindex, nofollow
```

The physical Blender rig remains pending and unapproved. Expression morph execution, actual 3D body rendering and clothing deformation remain blocked on the rig deformation gate.

Production remains untouched.


## 167. Creator presentation and wardrobe compatibility pass

The stylized Creator lab received a second UX pass without enabling the physical 3D rig.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
```

Changes:

- expression and hair choices now use explicit temporary 2D single-body thumbnails instead of text-only placeholders;
- previews always use the currently selected body, skin and hair-color context;
- the thumbnails are labelled as temporary 2D previews and are not presented as authored 3D assets;
- outfit controls are grouped into `Cuebooker Basics` and `Club / Festival` families while preserving one shared male/female catalogue;
- the existing wardrobe fitting contract now surfaces harness/top incompatibility in the UI;
- incompatible harness selection is never silently removed when the user changes top;
- selecting a new harness is blocked when the current top has no authored harness fit;
- an already-selected incompatible harness remains visible with a fitting-pending warning so the semantic selection is preserved.

This does not change the underlying catalogue, production assets, production runtime or rig status.

The physical rig remains pending. No expression morph, skin deformation or clothing deformation is claimed as working.

Production remains untouched.


## 168. Creator mobile editing pass

The stylized Creator lab received a mobile-focused layout pass while the physical 3D rig remains deferred.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
```

Mobile behavior now:

- save action becomes a full-width 44px control;
- stage height is reduced so the editor appears much sooner on small screens;
- body selector remains directly available above the stage;
- editor section navigation becomes one horizontal scroll row instead of a two-column grid;
- the active section exposes `aria-current`;
- section tabs and catalogue choices use larger touch targets;
- expression and hair preview tiles scroll horizontally rather than creating a long wrapped block;
- color swatches are enlarged for touch;
- editor content flows naturally on mobile instead of using an inner scroll area;
- desktop/tablet layout remains split or stacked as before.

The stage still shows only the pending-rig state. No procedural avatar, rigged GLB or production asset was introduced.

Production remains untouched.


## 169. Active outfit layering semantics surfaced in Creator

The Creator now reflects the wardrobe layer model more accurately without mutating stored user choices.

Updated:

```text
app/domain/cueIdWardrobe.ts
app/components/CueIdStylizedWorkspace.vue
tests/cueIdWardrobe.test.ts
```

Behavior:

- harness compatibility is resolved against the active outfit layer;
- when a one-piece is active, its `allowWithHarness` rule takes precedence over the stored top;
- when no one-piece is active, compatibility falls back to the selected top;
- top and bottom selections remain stored while a one-piece is active;
- the UI marks those stored base-layer choices as secondary instead of deleting or rewriting them;
- disabling the one-piece restores the previously selected top and bottom immediately;
- the current active outfit layer and resulting modesty rule are visible in the Outfit section;
- existing incompatible harness selections are preserved and shown as pending fitting.

Added unit coverage for one-piece harness precedence.

No physical garment deformation is claimed. Rig and authored fitting validation remain pending.

Production remains untouched.


## 170. Lab draft dirty state and reset controls

The Creator lab now behaves more like a real editor while keeping persistence strictly local.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
app/pages/cue-id.vue
```

Behavior:

- the page tracks the last saved local draft separately from the current editable config;
- any semantic config change marks the Creator as having unsaved changes;
- the Save button is disabled when the current config already matches the saved draft;
- the top bar exposes a visible saved / unsaved state;
- Reset returns the Creator to `DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG`;
- Reset also removes the lab draft from browser `localStorage`;
- Save and Reset both surface short live-region confirmations;
- restoring a valid local draft establishes it as the saved baseline, so the page does not appear dirty immediately after load;
- malformed local drafts continue to be discarded.

Reset affects only the local `/cue-id` lab state. It does not write to Supabase, production profile data or any asset catalogue.

Production remains untouched. The physical rig remains pending.


## 171. Creator selection accessibility pass

The lab Creator now exposes selection state more explicitly to keyboard and assistive-technology users.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
```

Changes:

- selectable text controls expose `aria-pressed` for their current state;
- piercing multi-select exposes pressed state independently per piercing;
- skin, hair and garment color swatches expose both selected state and descriptive labels;
- body selector continues to expose pressed state;
- keyboard focus now has a visible lime focus ring across Creator buttons;
- disabled fitting combinations remain native disabled controls where appropriate;
- stored-but-secondary top/bottom choices remain readable while one-piece is active.

No catalogue semantics, rig state or production behavior changed.

Production remains untouched.


## 172. Creator light-theme surface cleanup

The stylized Creator shell no longer relies on several dark-only surface assumptions.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
```

Changes:

- pending-rig panel background now derives from `--cue-surface`;
- stage gradients derive from theme text/accent variables;
- selected swatch inner ring uses the current surface instead of fixed black;
- temporary preview-card backgrounds derive from theme text/surface colors;
- fitting-warning and outfit-state backgrounds now mix against the current surface;
- dark remains the primary art direction, but the shell can render coherently under the existing light theme variables.

Brand lime buttons intentionally retain dark text for contrast.

No runtime 3D, rig or production catalogue changes were made.

Production remains untouched.


## 173. Stored base outfit semantics aligned

A small Creator consistency issue was corrected around one-piece layering.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
```

Behavior:

- when a one-piece is active, all stored top/bottom families are shown with the same secondary visual treatment;
- stored top/bottom colors are also shown as secondary;
- those stored base-layer choices remain editable;
- because they remain editable, they are no longer exposed as `aria-disabled`;
- true unavailable fitting combinations, such as adding a harness where no authored fit exists, continue to use native disabled controls.

This keeps visual hierarchy and accessibility semantics aligned.

Production remains untouched.


## 174. Semantic Creator config equality

Dirty-state comparison was moved out of the page and into the CUE ID domain.

Updated:

```text
app/domain/cueIdStylizedCreator.ts
app/pages/cue-id.vue
tests/cueIdStylizedCreator.test.ts
```

New helper:

```text
cueIdStylizedCreatorConfigsEqual(a, b)
```

Behavior:

- compares V1 config fields in a fixed semantic order;
- does not depend on JavaScript object property insertion order;
- treats piercing selection order as irrelevant while preserving piercing membership;
- still detects any actual semantic configuration change;
- `/cue-id` now uses this helper for saved/dirty state.

Unit coverage proves object-key order and piercing-order differences do not create false dirty state.

Production remains untouched.


## 174. CUE ID Creator non-3D closure pass

The current Creator V1 lab is now considered functionally closed as far as work that does not require the authored 3D rig/render pipeline.

Completed in this pass:

- semantic config equality is used for dirty-state tracking instead of raw object serialization;
- piercing order does not create false dirty state;
- local draft parsing is schema-aware and rejects malformed or incompatible stored data;
- invalid stored drafts are removed instead of being retried on every visit;
- Save validates the runtime config again before writing browser storage;
- browser-storage read/write/remove failures are handled without crashing the Creator;
- unsaved changes trigger a browser unload warning;
- in-app route changes prompt before discarding unsaved CUE ID changes;
- Reset requires confirmation before deleting the device-local draft;
- the pending stage no longer uses a body/mannequin-shaped placeholder;
- the pending stage now uses an abstract grid/halo treatment so it cannot be mistaken for an approved avatar;
- the look summary reflects the active one-piece layer instead of always showing stored top/bottom;
- expression is included in the current look summary;
- piercing selection has an explicit maximum-three state;
- unselected piercing choices are disabled once the limit is reached while selected piercings remain removable;
- wardrobe tests now guarantee catalogue coverage for every category that currently has an authored fitting contract;
- config parsing and runtime validation have dedicated tests.

### Lab / production boundaries re-verified

```text
CUE_ID_CREATOR_3D_LAB_CANDIDATE = null
CUE_ID_PRODUCTION_CATALOGUE = []
```

No new asset was admitted to either boundary.

### What remains genuinely blocked by 3D work

The following must not be represented as completed until the approved masters pass the physical deformation gate:

1. execute and review the male/female physical rigs;
2. approve neutral/relaxed deformation on real geometry;
3. author and review the facial expression morph targets;
4. bind approved hair assets to the real heads;
5. create and review actual garment fits for the shared catalogue;
6. validate harness/outerwear clipping on real deformation;
7. connect authored GLB semantic bindings to the Creator stage;
8. validate mobile/Android GPU and memory behavior with the real assets;
9. create real static fallbacks from approved authored assets;
10. only after visual/mobile/package/performance evidence, consider lab-candidate or production admission.

Until those gates pass, the current abstract stage and temporary 2D option previews are intentional and truthful.

Production remains untouched.


## 175. Artist onboarding can branch into CUE ID Creator

Artist onboarding now exposes CUE ID as an optional next step without making it a registration requirement.

Updated:

```text
app/pages/onboarding.vue
app/pages/cue-id.vue
```

Behavior:

- the choice appears only for `DJ / ARTIST` accounts;
- agencies are not shown the CUE ID creation decision;
- the default remains `Do it later`, so onboarding is never blocked by visual identity creation;
- artists can choose `Create my CUE ID now` before submitting onboarding;
- account/workspace creation still completes first;
- choosing `now` routes to `/cue-id?from=onboarding`;
- choosing `later` continues to `/workspace?setup=profile`;
- when CUE ID was opened from onboarding, its exit action becomes `Continue to workspace` and returns to professional-profile setup;
- CUE ID remains available later from the workspace path;
- no 3D renderer is required for this onboarding decision.

This is intentionally a next-step preference, not a persisted requirement or completion gate.

Production remains untouched.


## 176. CUE ID Creator is reachable later from Artist Profile

The onboarding `Do it later` path is now complete end-to-end.

Updated:

```text
app/components/CueIdProfileEditor.vue
app/pages/cue-id.vue
```

Behavior:

- Artist Profile keeps the existing public visual-presentation editor untouched;
- when the artist selects the existing CUE ID presentation mode, a separate `CUE ID 3D Creator` callout is shown;
- the callout explains that the new Creator remains isolated from public representation until the 3D validation gates pass;
- `Open Creator` routes to `/cue-id?from=workspace`;
- when opened from Artist Profile, the Creator exit action becomes `Back to profile`;
- this gives artists who skipped CUE ID during onboarding a clear re-entry point later;
- no local Creator draft is promoted into the public profile or production catalogue.

The legacy/public visual representation remains separate from the new stylized Creator V1 until real 3D admission is approved.

Production remains untouched.


## 177. Commercial home aligned with current product truth

The commercial home was updated without changing production.

Updated:

```text
content/es/home.json
content/en/home.json
app/pages/index.vue
assets/css/main.css
```

Changes:

- removed unproven 30-day trial language from primary conversion copy;
- current staging capabilities now include real outbound/inbound booking email threading;
- pre-production work is described as hardening, smoke and launch preparation rather than missing core product;
- discovery remains clearly marked as future/conceptual;
- added a Distribution section for profile links, direct booking links, hosted iframe widget and attributed QR/source links;
- added an Artist Identity section connecting Artist Profile, optional CUE ID and later CUE Passport;
- CUE ID is explicitly described as optional and still in visual lab status;
- section numbering was normalized after the new narrative blocks;
- analytics CTA name for the join block no longer references a trial.

The home now tells the product story as:

```text
fragmented conversations
-> CUE / capture
-> Booking Core
-> distribution
-> artist identity
-> roles/access
-> current product status
-> future discovery
```

Production remains untouched.

## 178. Public ingress hardening state re-verified

The deployed staging `submit-booking-request` and repository branch were re-checked.

Verified:

- honeypot protection exists;
- rate limiting exists at client, artist and artist/contact levels;
- rate-limit keys are HMAC-derived;
- database-backed rate limit migrations are committed;
- anonymous rate protection is implemented, though thresholds still require launch smoke.

Staging Security Advisor currently reports two `rls_enabled_no_policy` INFO notices for internal email-delivery tables. Effective grants were checked directly:

- `anon`: no privileges;
- `authenticated`: no privileges;
- `service_role`: internal access only.

Those notices are therefore accepted for the current internal-service design and must not be “fixed” with permissive policies.

The project-level `auth_leaked_password_protection` warning remains open.

The public acknowledgement email still requires a real provider-configured staging delivery smoke before production.

Production remains untouched.


## 179. Commercial home mobile compression after real-device review

Real iPhone screenshots of the PR preview exposed an overlong, over-scaled mobile composition.

Observed:

- section headlines occupied too much of the viewport;
- Distribution cards became visually cramped;
- Artist Identity cards felt too tall and repetitive;
- several sections carried the same visual weight;
- the separate `Join now` and `Product` blocks repeated essentially the same conversion message;
- the page felt much longer than the amount of product information justified.

Updated:

```text
content/es/home.json
content/en/home.json
app/pages/index.vue
assets/css/main.css
```

Corrections:

- shortened Problem, Distribution and Artist Identity copy;
- reduced mobile section-heading scale and vertical section padding;
- reduced the oversized Problem closing statement;
- Distribution uses lime as a stronger mobile visual accent;
- Distribution and Identity cards become full-width compact stacks on mobile instead of narrow multi-card rails;
- card heights and internal spacing were reduced;
- removed the redundant `Join now` section entirely;
- the existing Product status block remains the conversion/status section;
- removed dead `join` copy from ES/EN content;
- renumbered following sections.

The intent is now fewer, stronger beats rather than one large editorial statement per viewport.

Production remains untouched.


## 180. Booking Next Move mobile CSS collision fixed

A real iPhone screenshot exposed a severe responsive regression in `BookingCoreOperations.vue`.

Observed:

- the auto-complete checkbox expanded to a large square;
- the descriptive text collapsed into an extremely narrow right column;
- the auto-reply control inherited conflicting workspace/mobile form styles;
- the block grew hundreds of pixels vertically and distorted Booking Detail.

Fix:

- mobile auto-reply layout is now explicitly owned by the component;
- checkbox dimensions are hard-bounded to 18px;
- mobile layout uses a two-column grid: checkbox + flexible text;
- label height/min-height/padding are explicitly reset;
- text width, wrapping and line-height are normalized;
- the control remains accessible and touch-friendly without relying on global input styles.

No Booking Core domain behavior changed.

Production remains untouched.


## 181. CUE ID rig V10 baseline accepted for continued lab work

A real Blender validation pass was completed on the authored Meshy body masters.

Detailed state:
`docs/CUE_ID_RIG_V10_HANDOFF_2026-09-22.md`

Key result:

- automatic Blender Bone Heat was rejected after failing to skin body/hair reliably;
- deterministic/proximity approaches V3-V8 were iterated and visually rejected where deformation remained unacceptable;
- V9 established the first usable shared male/female bootstrap with a hard torso lock and arm capsules;
- V10 refines shoulder/axilla, wrist/forearm/hand and pelvis/groin/upper-leg transitions;
- male V10 passed isolated bootstrap QA for shoulders, elbows, hips and knees;
- female V10 also passed isolated bootstrap QA for shoulders, elbows, hips and knees;
- persistent QA actions are stored in the `.blend` via Fake User;
- V10 is now the selected shared male/female working baseline, while `productionReady` remains `false`.

The rig contract remains shared between male/female and no sex-specific user-facing catalogue is introduced.

The rig QA gate is closed. Next: freeze the final male + female V10 outputs and integrate them in the lab-only CUE ID stage. Do not start broad garment fitting until that body integration is stable.

Production remains untouched.


## 182. CUE ID V10 lab body integration started

The shared male/female V10 rig baseline is now wired into the new stylized Creator lab path without touching the production catalogue.

Added:

```text
app/domain/cueIdRiggedBodyLab.ts
app/components/CueIdRiggedBodyLabScene.client.vue
tests/cueIdRiggedBodyLab.test.ts
public/cue-id/lab/bodies/README.md
scripts/blender/cue-id-v10-web-export.py
```

Behavior:

- the stylized Creator stage mounts one real rigged body at a time;
- body switching remains semantic and preserves Creator config;
- skin tone is bound to the semantic skin node;
- authored source hair visibility follows the selected source hairstyle;
- source hair color is tintable;
- underwear remains the technical modesty layer;
- failure to load a lab GLB falls back to an explicit lab asset state rather than fake human geometry;
- production catalogue remains empty;
- Booking / Calendar / Activity remain outside the 3D bundle boundary.

The reviewed master GLBs are intentionally NOT committed directly as browser assets because the current files are approximately 64 MB (male) and 82 MB (female).

A Blender 5.2 web-export step was added using `EXT_meshopt_compression` without mesh simplification or rig changes. The lab loader supports `MeshoptDecoder`.

Expected delivery paths:

```text
public/cue-id/lab/bodies/cueid-male-body-master-v1-rigged-v10.glb
public/cue-id/lab/bodies/cueid-female-body-master-v1-rigged-v10.glb
```

Next gate:

- generate the Meshopt delivery GLBs from the accepted V10 `.blend` masters;
- inspect resulting byte size;
- smoke male/female loading in `/cue-id`;
- then run desktop/mobile memory and rendering checks before any wardrobe fitting.

Production remains untouched.


## 183. CUE ID body-base correction: neutral bald geometry is mandatory

Real browser inspection of the first V10 lab integration exposed an architectural problem in the current Meshy-derived body masters.

Observed:

- selecting `bald` on the male still exposes geometry/shape inherited from the authored fade haircut;
- the female head/hair region can deform or render incorrectly in the lab;
- the current semantic split can hide the explicit `cue_*_hair` node, but it cannot guarantee a truly neutral scalp because parts of the source hairstyle are still baked into or classified as body/skin geometry.

Decision:

- the CUE ID body base MUST be a genuinely bald, neutral head/scalp;
- no hairstyle may define or deform the underlying head silhouette;
- `fade`, `tied-back`, and every other hairstyle are modular hair assets layered onto the same neutral body;
- the current male/female V10 files remain useful as rig/deformation QA references, but they are NOT the final Creator body masters until the neutral scalp issue is corrected;
- do not paper over this with UI visibility toggles or texture masking: the geometry contract itself must be corrected.

Required next asset gate:

1. obtain or author neutral bald male/female body masters with the accepted body proportions;
2. preserve the shared `cue_rig` contract and transfer/rebuild skin weights onto those neutral bodies;
3. validate head/neck deformation again after the geometry swap;
4. keep underwear as a separate semantic/modesty layer;
5. extract/re-author hairstyles as independent assets attached to the head/rig, starting with fade and tied-back if those source meshes can be salvaged cleanly;
6. only after this gate should the Creator's `bald` and hairstyle controls be considered visually valid.

The current browser delivery GLBs stay lab-only and `productionReady: false`.

Production remains untouched.


## 184. New neutral-bald Meshy masters received and audited

New male/female Meshy body masters were supplied to replace the previous source-hair-contaminated bodies.

Source characteristics from the uploaded GLBs:

- male: one mesh, 148,270 vertices, 271,000 triangles, ~12 MB GLB;
- female: one mesh, 114,124 vertices, 204,544 triangles, ~9.5 MB GLB;
- both are unrigged: no skeleton, skin weights or animation actions are embedded;
- both use one textured mesh and 2048px PBR texture sets in the FBX packages;
- initial color/position audit found only ~0.45-0.48% dark faces in the head region, consistent with facial details rather than a large source-hair shell. This supports using them as neutral-bald candidates, but Blender/browser visual QA is still required before acceptance.

A dedicated semantic split was added:

```text
scripts/3d/cue-id-bald-body-semantic-split.py
```

Unlike the previous source-hair pipeline, this split deliberately creates only:

```text
cue_<body>_skin
cue_<body>_underwear
```

There is no `cue_<body>_hair` node in a neutral base. Brows/lashes and other facial texture detail remain part of skin until a dedicated face-material pass exists.

Local semantic candidates generated from the uploaded masters preserve all source triangles:

- male: 235,496 skin + 35,504 underwear = 271,000 total;
- female: 186,076 skin + 18,468 underwear = 204,544 total.

Next gate:

1. visually approve the new bald masters in Blender;
2. use these as V2 neutral body masters;
3. transfer/rebuild the shared `cue_rig` and weights;
4. repeat head/neck + shoulder/elbow/hip/knee QA;
5. export new web-delivery GLBs;
6. only then replace the current V10 lab bodies;
7. author hair as independent modular assets.

Do not reconnect embedded source hair to the body-base contract.

Production remains untouched.


## 185. Neutral-bald V2 rig strategy: transfer accepted V10 rig/weights

To avoid rebuilding the rigging logic from scratch, the new V2 bald masters now use the accepted V10 rigged bodies as the transfer source.

Added:

\`\`\`text
scripts/blender/cue-id-bald-v2-rig-transfer.py
\`\`\`

The script:

- imports the accepted V10 rigged GLB for the same body;
- keeps the shared \`cue_rig\` contract and imported QA actions;
- imports the new V2 semantic body containing only skin + underwear;
- transfers source V10 vertex-group weights onto the V2 topology in normalized body space using nearest-neighbor matching;
- retargets V10 rest-bone positions from the old body bounds to the new V2 body bounds;
- parents the V2 semantic meshes to the transferred rig;
- removes the old source meshes from the output;
- preserves actions with Fake User;
- emits .blend, .glb and .rig-report.json outputs;
- does not add hair or facial morphs;
- keeps \`productionReady: false\`.

This is a candidate transfer pipeline, not an automatic acceptance. The new body topology/proportions differ from V1, so Blender visual QA remains mandatory for:

- head / neck;
- shoulders;
- elbows;
- hips / groin;
- knees;
- underwear deformation.

If transfer QA exposes a localized defect, refine that region on V2 rather than reintroducing source-hair geometry or rebuilding the entire character pipeline.

Production remains untouched.
