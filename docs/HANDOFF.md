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
