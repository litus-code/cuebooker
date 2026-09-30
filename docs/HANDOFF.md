## 2026-09-30 / Agency calendar follows DJ visual design

Branch `feature/agency-multi-artist-beta`, base HEAD `fee680d210ad70bdfdf18a6d5cdb47424ec58afb`, PR #96 preview only.

Calendar now follows the DJ month toolbar, 86 px day cells, booking counts, hold/confirmed dots, legend, today badge and selected-day border. Artist visibility controls remain. The adjacent day agenda identifies artists and opens their bookings; below 950 px it stacks beneath the month, with 62 px cells below 560 px. No hourly availability editor was added to Agency. Blank trailing cells complete the grid.

Staging static build succeeds. Browser checks and remote CI/deploy tracked after publication. No schema/function changes or production deployment. Real authenticated media and 390 px viewport verification remain pending.

## 2026-09-30 / Agency UI polish and ten-row pagination

Branch `feature/agency-multi-artist-beta`, implementation HEAD `d28b38332f3521890619cc291967ea0041aca859`, PR #96 preview only.

Agency cards, panel containers, calendar outer border and controls now use existing panel/control radius tokens. Demo booking Follow-up is compact, labelled and uses quieter actions with explanatory text. Bookings and Activity paginate ten rows with an eleventh-row lookahead; navigation is hidden on the first page with ten or fewer rows and remains available on later pages. Overview summaries retain their separate 100-row fetch.

Validated locally: 336 tests pass, staging static generation succeeds, diff check passes. Remote CI/deploy and browser validation tracked separately on the PR. No database/function changes, no production deployment. Mobile 390 px and authenticated media save/reload/public flow remain pending.

## 30 September 2026: Agency cover/logo file uploads

Based on PR #96 HEAD `ff3025ac9066eb28103343eb207f2f42979372e1`. Editor accepts validated JPG/PNG/WebP files up to 8 MB with image decode, preview, replace/remove and explicit page save. HTTPS links remain a secondary option. Authenticated files use private artist-media under `agency/<workspace>/covers|logos/<uuid>`. Only Owner/Admin can insert/read agency identity objects; replacements use fresh UUIDs. No destructive cleanup of old images. Abandoned uploads and previous versions remain private and need a future cleanup policy.

Staging migrations `20260930124323_agency_catalog_media.sql` and `20260930124636_qualify_agency_media_object_name.sql` applied; second qualifies objects.name in the workspace lookup after the first metadata permission smoke detected an ambiguous-column denial. RPC validates workspace, slot and existing Storage object, preserves paths on legacy saves and supports explicit clear. Public Edge function get-public-artist-profile v21 signs only owned published agency paths (1 hour), removes raw paths/workspace identifier from response. Previously issued signed URLs can last until expiry after unpublishing.

Local 336 tests and 38-route generation. Staging metadata-only rollback smoke validates owner insert/read/save/clear, rejects foreign principal read/insert and invalid slot/missing asset, preserves media through legacy saves; zero leftover objects. This does not prove a physical file upload. Advisors retain only pre-existing warnings. Demo upload/preview browser validation and authenticated upload/reload/public page, mobile QA, team acceptance and complete Agency A/B flow remain gates until explicitly checked on PR. Production untouched.

## 30 September 2026: Agency settings UX refinement

Based on PR #96 HEAD `4b8665c27ff6a9417c1103dfe7a112bf76bbc6a6`. Catalog editor groups identity, public booking email, artist selection and publication. Optional imagery and external agency links use disclosure sections. Public email remains intentionally empty until explicitly provided; owner/admin may explicitly use their sign-in email. Never silently publish account email. This is public contact metadata, not mailbox connection or outbound sender configuration. No WhatsApp field or private notes added to the public contract.

Checkbox styling follows existing Profile presence controls, selects use shared Agency CSS and existing control tokens, keyboard focus is visible. Explicit draft/published status and publication readiness explain incomplete setup; saving disables form controls. Backend contracts, RLS, schema and email routing unchanged. Local 335 tests and staging generation (38 routes) pass; new deployed browser results must be checked on PR. Production untouched.

# Cuebooker living handoff

## 30 September 2026: unified Agency workspace and public agency landing

Branch `feature/agency-multi-artist-beta`, PR #96, starting HEAD `b38ef3dbb3aaa8014070f7127e75a547c9c04ed8`. Local implementation commit `4b256f6`, based on remote `b38ef3dbb3aaa8014070f7127e75a547c9c04ed8`. User confirmed continuing publication after automatic review blocked initial push. Final remote revision and deployment status must be checked on PR #96. Production untouched.

Selecting a DJ now filters the same Agency operational component. No individual DJ dashboard or onboarding appears for Agency. Main nav remains Overview/Bookings/Calendar/Activity/Artists/Settings; artist identity destinations live in nested record tabs. Agency identification stays visible. Booking detail uses existing inbox within Agency; return/navigation clears detail while preserving artist scope. Calendar links preserve event month/day in roster query.

Public agency presentation is `/agency/<organization-slug>`: shared PublicAgencyProfile renders editable cover/logo/tagline/bio/contact and explicitly selected eligible artists. Settings Owner/Admin editor saves to existing Organization plus existing roster visibility column, supports draft preview, publishing/unpublishing and share link. An artist must be public, active and routed to this workspace. Artist links use canonical profiles and unchanged booking backend. Agency URLs use a narrow SPA rewrite in Cloudflare static hosting.

Staging-only migrations: `20260930113404_agency_public_catalog.sql`, `20260930113750_agency_catalog_service_access.sql`. Existing get-public-artist-profile deployed v20: agency query resolves server-only allowlisted payload and signs only each artist-owned media. No client draft/public reader privilege, RLS unchanged. Rollback smoke passed including foreign principal rejection, unready artist rejection, HTTPS validation, public field allowlist and removal after unpublish. SQL test uses the disposable CUE Agency TEST staging account, not real users. Test account exists with two TEST artists; login was verified through normal Auth, browser secure login was declined and has not been bypassed.

Validation: 335 assertions including compiled AgencyWorkspace scope transitions; staging static generation (38 routes), diff check. New deployed visual validation is pending. Browser refused localhost preview with ERR_BLOCKED_BY_CLIENT. The demo booking return now preserves its artist filter and previous section. Real authenticated browser A/B profile/publishing/team acceptance and ~390px QA remain explicit gates if not completed there. Logo/cover support HTTPS URLs, no agency-specific upload flow yet; dynamic SEO/social unfurls are not server-rendered. No existing-DJ ownership transfer or assigned-only role claim.


## 30 September 2026: Agency team beta closure

Branch `feature/agency-multi-artist-beta`, PR #96, starting HEAD `96d5da3f892c2ca0ac138b0cbca7de12dd9330d2`. Final commit/CI/preview are recorded in PR. Production untouched.

Implemented team management in Agency Settings: member list, explicit whole-roster roles, verified-email invitation links (7-day expiry, hash-only persistence, explicit acceptance), revocation, role changes and access removal. Owner/self are protected; only Owner assigns/manages Admin. Admin manages Manager/Editor/Viewer. Invite acceptance writes existing workspace_members and organization_members identity bridge atomically, completes joining onboarding, and selects the joined agency on navigation. Public API wrappers are invoker functions calling private narrowly authorized commands. No automated invitation email or assigned-only Manager isolation is claimed.

Viewer UI is now read-only in Booking Core detail/Attention/operations, and Agency calendar writes follow profile permission; omitted permission props preserve DJ behavior. Anonymous preview Settings simulates team changes with explicit notices and no live grants. New `agency-invite` system route is reserved from artist slugs.

Staging-only migrations: `20260930094140_agency_team_beta.sql` and `20260930094451_agency_team_invitation_index.sql`, versions matched to staging history. Backend rollback smoke covers matching/mismatched recipient, accept/retry, Manager creating a booking/updating roster profile, Viewer rejecting booking creation, demotion/removal and revoked/consumed token rejection; new-user bootstrapping to agency is also checked. Zero leftover test users or invitations. Anon cannot call invite creation; authenticated users cannot SELECT token_hash; RLS enabled. Advisors show no new security warning; missing invitation-creator FK index fixed. Existing analytics/private-table/Auth password warnings remain unrelated baseline, see PR for remediation URLs.

Local: 332 assertions pass, 38-route staging generation and diff checks. New preview team visual smoke, authenticated invitation acceptance plus full Agency A/B desktop/mobile and existing DJ smoke remain required before removing draft or promoting production. Team invites are manually shared links, access is workspace-wide; per-artist isolation and existing-artist transfer remain later reviewed blocks.


## 30 September 2026: Agency preview desktop navigation parity

PR #96, based on `971facf2b1ee867f55e9c09dcc693eba5bb5d17b`. Anonymous Agency preview now reuses the real DJ Workspace desktop rail classes and navigation icons, with Agency name/artist selector above destinations. Desktop breakpoint remains 961px; smaller screens retain compact horizontal navigation. Active state uses aria-current. No authenticated shell, backend, schema or production change. Build and deployed visual validation recorded in PR.


## 30 September 2026: Agency global capture, follow-up and context

- Branch `feature/agency-multi-artist-beta`, PR #96. Base HEAD `5e815b0e13a956aa6ea98d3cf4b114b94b863b05`; resulting revision will be recorded on the PR. Production untouched.
- Implemented global + CUE with explicit active-artist selection; capture uses the existing Booking Core RPC. Agency beta no longer applies the individual five-process capture gate. Existing roles and plans remain intact.
- Global follow-up now reuses DJ attention rules across the active roster and labels each artist. Scope changes discard stale results; errors are visible and retryable. Agency return navigation preserves operational view, filters, calendar month/day; artist context remains visible.
- Overview roster shortcuts, add actions, accessible roster modal and capture focus handling. Last retired artist remains restorable. All-artists calendar picks up added artists; explicit filters remain explicit.
- Local 327 assertions (direct test-file execution), 36 generated routes and clean diff checks. Staging owner-role transactional smoke created a temporary second artist, bookings for A/B, an overdue Next Move and booking route; rollback confirmed zero leftover rows. Foreign principal sees zero roster/bookings. This is backend validation, not browser-authenticated E2E.
- Staging contains SALA PRUEBAS with one active artist. User reports login works in their local browser. Agent browser has no shared authenticated session. Next: verify CI/preview for the pushed revision; test global capture, attention, navigation and last-artist restore visually, then authenticated Agency A/B flow at desktop/mobile before removing draft or merging.
- No schema or Edge Function changes. Team invitations, per-artist Manager assignment and artist-transfer consent remain explicitly deferred. Anonymous individual Overview is still a simplified demo; live identity editors require authentication. Attention retains existing per-artist 500-row beta windows.

Warning: truncated output (original token count: 80606)
Total output lines: 10325

# Cuebooker living handoff

## 29 September 2026: Agency overview count correction

- PR #96, `feature/agency-multi-artist-beta`; remote implementation commit `fbe33279d87b0ac9f7d1175ec2060ab4e9b3cdd3` based on `9ad63db20d3ed328ea1fe828483a7da0e84cb726`.
- The global Overview now counts all upcoming confirmed dates in the displayed month rather than the eight preview rows. The pending-Holds card requests an exact active count for the active roster across all dates; its fallback is visibly a lower bound.
- Local isolated worktree: `npm test` 322/322; `npm run generate` 36 routes; `git diff --check` clean. Anonymous PR preview navigation, artist filter, calendar filter and Booking Core detail were inspected on the previous deployment. The new remote preview still requires CI/deployment verification.
- The three Agency migrations are present in Supabase staging. Read-only staging inspection found zero agency organizations and zero agency workspaces, so an authenticated Agency A/B end-to-end smoke has **not** been performed. No production change. Keep PR draft until this gate is tested with a staging account.
- Next: verify the updated PR preview, then run Agency signup, two roster artists, public booking attribution, global filters/calendar, artist Profile and return to global on desktop and mobile. Check existing DJ flow and roles. Team invitations, per-artist Manager assignments and artist transfer remain separate follow-up work.

## 29 September 2026: Agency visual review without login

- Branch: `feature/agency-multi-artist-beta`, PR #96, based on the latest `main` through merge commit `633d37994ed22e23ad997958fb5f61d6a203be52`. The PR head after this preview update is recorded on GitHub. No production deployment.
- `/preview-agency` is a public visual demo on the PR preview hostname only. It reuses `AgencyWorkspace` with in-memory fixtures for two fictional artists. Global Overview, Roster, Bookings, Calendar and Activity can be inspected without an account. Opening a booking enters the actual `BookingCoreInbox` layout in artist context. Its conversation log, next action, hold and decision actions use local fixture data and reset on reload; real email sending and database writes remain disabled. Artist Profile, Passport and CUE ID show context and an explicit read-only notice; their real editors still require Agency authentication.
- The preview branch builds with `NUXT_PUBLIC_APP_ENV=staging`. The route also checks the `pr-*.cuebooker-staging.pages.dev` hostname in the browser, uses `noindex,nofollow` and never makes Supabase calls. `/workspace` authentication and RLS remain unchanged. No migration or Edge Function changes in this block.
- Validated locally: 321 tests, staging-mode static generation (36 routes) and diff checks. Desktop preview navigation was reviewed before the booking-detail addition. The new detail and mobile view need a fresh PR preview check. Authenticated Agency A/B end-to-end smoke is still separate and pending.

## 28 September 2026: Agency multi-artist beta PR preview

- Branch: `feature/agency-multi-artist-beta`, based on `main` commit `c2996a77e411cdd1d0f6ec97089accd605edf03a`. Exact implementation HEAD and PR preview are recorded in the PR once pushed. No merge or production deployment.
- Product: Agency onboarding now enters global Overview. Agency has a persistent global/artist selector, reversible active roster, global Overview, artist-filterable Bookings and Activity, multi-select roster Calendar, and booking-to-artist navigation. Individual Profile/Passport/CUE ID require a selected artist. DJ onboarding and individual Booking Core remain in place.
- Architecture: operational roster remains `workspace_artists`; `organization_artists` stays an identity bridge. See `docs/AGENCY_MULTI_ARTIST_BETA.md`. Migrations `20260928202754_agency_roster_beta.sql` and `20260928204843_agency_roster_access.sql` were applied to `cuebooker-staging` only. They add non-destructive retirement, atomic RPC roster attachment, and agency access to profile/calendar/media for authorized workspace roles. Production was not touched.
- Validated locally at the branch worktree: `npm ci`, `npm test` (317 passing), `npm run generate` (32 routes), and `git diff --check`. Staging schema/advisor inspection and negative authorization queries with a nonmember UUID passed. Preview authenticated desktop/mobile smoke still needs a test Agency account; static generation is not proof of that flow.
- Known limits: global Overview requests an exact active-booking count but attention previews use the first 100 rows; Calendar/Activity/holds have 500-row windows. Team invite UI and per-artist manager assignment are not built; existing workspace roles are used. Repo-wide `vue-tsc` already reports unrelated baseline errors and has no configured `typecheck` script. Do not call these beta windows exact lifetime reporting.
- Next: verify Agency A/B end-to-end with a staging test account in the PR preview at desktop and ~390 px, repair any findings, then request review. Do not promote migrations or code to production as part of preview validation.

Updated: 19 September 2026  
Branch: `feature/app-visual-system`  
Status: ACTIVE BATON PASS

Read this immediately after `AGENTS.md`. This document records current implementation truth, not aspirations. Always query live branch HEAD before modifying code.

## Update 28 September 2026: public profile preview

- Branch: `feature/app-visual-system`; starting HEAD `d1f114216183a39919fd473299a4dbea5e3a5533` (PR #75).
- The Workspace "Ver como público" action opens `/profile-preview` as a full page in a new tab, leaving the editor state intact. It passes a session-only snapshot of the current editor state, including unsaved fields. The preview and `/<artist-slug>` still render the same `PublicArtistProfile` component.
- The public profile hero received stronger club/industrial art direction. It uses the artist's real cover, portrait, genres and biography; it does not fabricate achievements.
- Validation: `npm run build` and `git diff --check` locally. PR preview visual check at desktop and around 390 px is still pending.
- No schema, migrations or Edge Functions. Production untouched. Next: inspect PR #75 visually with a real profile and confirm navigation, mobile crop and booking preview behavior. A blob URL used by an unsaved image lasts only for the current browser document, so reloading the preview may require returning to the editor.
- Follow-up: the preview landing now includes the actual `PublicBookingForm` below the booking band. All fields, including expanded optional event details, are visible but disabled; submission stays blocked. Its "Ver formulario" buttons scroll to that section. The real public booking form continues to open as before.
- Follow-up layout fix: the public Passport section had a stale `.cue-passport-profile-summary` selector while the component root is `.profile-passport`. The summary now spans its grid and nested tracks can shrink; mobile stacks the heading and summary to prevent horizontal overflow. `npm run build` passed locally. Visual PR preview check remains pending.
- Follow-up portfolio redesign: `PublicArtistProfile.vue` now uses an editorial poster hero, large biography spread, typographic Sound section, differentiated CUE ID identity scene, integrated Passport, large official-channel links and a booking finale. Existing data, booking logic, preview form and component contracts remain unchanged. No new dependencies, migrations or functions. `npm run build` and `git diff --check` passed locally; validate the rendered PR preview at desktop and 390 px before promoting anything.

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

## …50606 tokens truncated…ized male/female bodies as the authoring source.

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


## 186. CUE ID BODY V2 frozen after browser validation

The neutral-bald V2 bodies have now passed the full lab gate and are considered the frozen body baseline for the next modular-asset phase.

Validated in Blender and in the real `/cue-id` PR preview:

- male and female neutral-bald geometry display correctly;
- approved shared `cue_rig` alignment is preserved;
- rebuilt proxy-derived skin weights no longer show the catastrophic V10-transfer shoulder/elbow tearing;
- male/female switching works in the lab;
- body and face inspection views load correctly;
- semantic base is now skin + underwear only, with no embedded source-hair node;
- Draco delivery is supported by the lab loader;
- the loading overlay now resolves to ready after the parsed V2 scene is attached instead of hanging at 96%.

Current lab delivery assets are approximately:

- male: 15.2 MB;
- female: 12.9 MB.

Decision:

- do not re-open body proportions, rest-bone alignment or broad skin-weight work unless a concrete runtime deformation bug is reproduced;
- keep these approved V2 bodies as the source of truth for hair/clothing/accessory fitting;
- production catalogue remains untouched and `productionReady` remains `false`.

Next performance gate:

1. preserve geometry, rig and weights exactly;
2. test a conservative runtime candidate with textures capped at 1024px and no animation clips embedded;
3. compare visual fidelity and first-load behavior against the current lab asset;
4. only replace the lab GLBs if the candidate is visually indistinguishable at normal Creator inspection distances;
5. then begin the modular HAIR vertical slice.

Added:

```text
scripts/blender/cue-id-v2-runtime-optimize.py
```

This optimizer is deliberately conservative: it does not decimate geometry and does not modify the accepted rig or skin weights.

Production remains untouched.

## 24 Sep 2026 · Profile real + Passport public visibility

- CUE Passport workspace remains 2D and independent from CUE ID.
- Public artist profile includes the summarized Passport surface.
- Added persisted `artists.passport_public_enabled`, default `true`.
- Hiding Passport only affects the public profile. It does not delete or stop trajectory generation.
- `Gestionar Passport` now opens the Profile Passport editor instead of navigating to CUE ID.
- Profile editing model:
  - desktop side panel: Identity/About, Sound, Links, Passport, Distribution;
  - desktop centered modal: Cover, Portrait, Booking settings;
  - mobile: fullscreen editor for all sections.
- Public booking form now opens in a centered desktop modal and fullscreen mobile modal. No autoscroll to a long form.
- CUE Passport constellation tooltip now supports linked-media interaction and mobile internal scrolling.
- Passport V1 remains validation pending until CI/staging verification is available.

- Public Passport selection is now explicit:
  - milestones: automatic or up to 3 selected unlocked milestones;
  - event media: opt-in only, up to 6 linked items;
  - selected media is revalidated against confirmed artist bookings in the public endpoint.
- Public Profile now follows the approved content order more closely: Hero → About → Sound → optional public CUE ID → CUE Passport → Links → Booking.
- New backend changes are committed but NOT applied from this handoff:
  - `20260924135000_add_public_passport_visibility.sql`;
  - `20260924161000_add_public_passport_selection.sql`;
  - updated `get-public-artist-profile` Edge Function.
- Do not claim Passport public selection is live until the correct non-production Supabase target has those migrations/function deployed.

## 24 Sep 2026 · Commercial presentation foundation

Commercial presentation has started without enabling billing enforcement.

Implemented:

- `useCueEntitlements()` is the UI access layer for entitlements and capacity limits.
- Base commercial plan is currently `free` until the legacy `workspace_billing` trial model is reconciled.
- Non-production environments support `free`, `artist_pro` and `agency` demo plan overrides from Settings or `?demoPlan=...`.
- Production ignores demo plan and entitlement overrides.
- `CuePlanBadge.vue` is the reusable PRO / AGENCY badge.
- Passport Event Media stays visible on Free, but changing public media selection requires `passport.media`.
- Existing selected Passport media is preserved if access is unavailable.
- Smart Capture remains usable on Free. `capture.smart_extended` is presented as the higher-capacity Artist Pro capability; usage enforcement is pending real counters.
- Entitlement contract coverage added in `tests/entitlements.test.ts`.

Do not use direct checks such as `plan === 'artist_pro'` in feature UI. Use `can(entitlement)` / plan limits.

Billing is still not connected and production remains untouched.


## 24 Sep 2026 · Artist Pro automation boundary

The first paid automation value is wired without restricting the Free booking loop.

- `automation.advanced` gates the prepared stale follow-up draft.
- Free still receives the stale-waiting attention signal and can write/send the email manually.
- Email delivery retry remains Free because it recovers an operational failure.
- `automation.advanced` gates `completion_trigger = inbound_activity` for next actions.
- Manual next actions remain Free.
- Existing automatic next-action rules continue to display and operate after downgrade.
- Automatic conversational booking status remains Booking Core and is Free.
- Confirm/reject/cancel remain explicit artist decisions.

Validation:

- HEAD `dd9fe94bb15bc62395252c8b9f11ca4e384a7df0`;
- GitHub Actions run `36012306252`, attempt 2, completed successfully;
- `Generate preview build` and PR preview deployment succeeded;
- this workflow does not execute `npm test`, so tests are not claimed as run.


## 24 Sep 2026 · Commercial home + Pricing

The V1 commercial home is now aligned with the launch sequence.

Implemented:

- Pricing section with Free, Artist Pro and Agency.
- Launch prices:
  - Free: EUR 0;
  - Artist Pro: EUR 9.99/month or EUR 99/year;
  - Agency: EUR 39/month or EUR 390/year.
- Founding Artist is presented as an offer inside the commercial model, not a fourth plan.
- Paid-plan CTAs preserve plan intent in signup query params.
- The page states that checkout is not enabled yet.
- CUE Passport is described as a current product surface instead of a future concept.
- The large future discovery / marketplace simulation was removed from the V1 home.

Validation:

- current home build passes `Generate preview build` on the PR preview workflow;
- production remains untouched.

Open legal/commercial blockers before public launch:

- privacy policy;
- cookie policy;
- visible analytics consent UI;
- legal notice / terms as applicable;
- real billing checkout.

Analytics already defaults to unknown consent and does not load GTM before explicit grant. The missing piece is the user-facing consent interface and legal documentation.

Do not publish personal/legal controller details from memory or ad-hoc notes without an explicit reviewed legal pass.


## 24 Sep 2026 · Passport workspace separation

CUE Passport is now structurally independent from CUE ID inside Workspace.

Implemented:

- added `passport` as a dedicated Workspace view and navigation item;
- removed the full Passport explorer from the CUE ID hub;
- dedicated Passport uses the full content width instead of the former two-column preview layout;
- Profile Passport summary now separates:
  - `Open Passport` → dedicated workspace explorer;
  - `Public settings` → publication settings inside Profile;
- Passport view exposes a direct `Public settings` action back to Profile;
- empty constellation state explains the real prerequisite and links back to Bookings;
- zoom / interaction hints are hidden when there are no nodes;
- Passport media URLs are restricted to http/https and video URLs are not rendered as images;
- external Artist Profile links are restricted to http/https;
- changing Workspace module clears hidden Profile editor state;
- Escape closes Profile/public-booking overlays consistently;
- public CUE ID remains static-first because PublicArtistProfile passes `interactive=false`.

Validation:

- HEAD before documentation: `1316cbe7ef4d77972365c611e6fcfe3b7ba79a15`;
- GitHub Actions run `36031829227`;
- `Generate preview build` passed;
- PR preview deployment passed;
- production was not touched;
- pending Passport Supabase migrations / Edge Function were not applied.

Remaining before calling Passport/Profile launch-ready:

- apply Passport backend changes to the correct non-production Supabase target;
- real-device desktop/mobile visual QA, especially dense city/venue data and mobile tooltip/media cases.


## 24 Sep 2026 · Product analytics V1

The product-side V1 funnel is now instrumented without sending PII or free-text content.

Implemented events:

- `signup_started`;
- `signup_completed`;
- `onboarding_completed`;
- `artist_profile_viewed`;
- `artist_profile_published`;
- `booking_entry_shared`;
- `booking_request_started`;
- `booking_request_sent`;
- `booking_capture_created`;
- `booking_response_sent`;
- `booking_decision_completed`;
- `booking_confirmed`;
- `passport_event_created`;
- `upgrade_prompt_viewed`;
- `upgrade_prompt_action`.

Rules:

- success events are emitted only after the product action succeeds;
- first-use milestones are derived in analytics from first occurrence, not stored as browser flags;
- event payloads stay categorical and must not contain names, emails, phone numbers, slugs, booking IDs, URLs or message/free-text content;
- an upgrade prompt is only marked as measured when `analytics.track()` actually accepts it under the current consent state;
- checkout / Stripe / subscription events are intentionally not part of this implementation.

Contract: `docs/PRODUCT_ANALYTICS_V1.md`.

Validation:

- code HEAD before documentation: `1f51c5976c7053075ae8dcd433522b79a34dd3ce`;
- GitHub Actions run `36032641715`;
- `Generate preview build` passed;
- production was not touched.


## 24 Sep 2026 · Passport staging backend applied

Passport backend work is now applied to staging only.

Target:

```text
cuebooker-staging
lycprjeuuynfzwskycwv
```

Applied:

- CUE Passport media schema and RLS;
- public Passport visibility;
- public milestone/media selections;
- `passport_media.created_by` FK index;
- `get-public-artist-profile` version 17.

Security verification:

- `passport_media` RLS enabled;
- member-only SELECT;
- editor-only INSERT/UPDATE/DELETE;
- artist public Passport columns remain protected by the existing manager UPDATE policy;
- no new Passport-specific security advisor findings.

Performance verification:

- initial advisor exposed missing index on `passport_media.created_by`;
- migration `20260924174500_index_passport_media_creator.sql` added and applied;
- the unindexed-FK finding is now gone.

Data sanity:

- published staging artist `lits` currently resolves to 1 confirmed booking, 1 city and 1 venue;
- no public media is selected yet.

Limit of this validation:

- this session could not reach the public staging hostname over HTTP, so the real public JSON response still needs a browser/device smoke;
- production Supabase was not touched;
- billing migration was not applied.


## 24 Sep 2026 · History commercial boundary

The Workspace Activity history now uses the plan capacity contract.

- Free queries the last 90 days.
- Artist Pro and Agency query full available history.
- The filter is sent to the Activity API as `occurred_at >= cutoff`; older rows are not downloaded and hidden in the browser.
- Individual Booking Activity remains part of normal Booking Core operation and is not blocked.
- Free receives a visible Artist Pro explanation at the history boundary.

Validation:

- code HEAD `e30d659fb2f893d15fb2bc1b88ee9c634124c8f2`;
- GitHub Actions run `36036541876`;
- `Generate preview build` and PR preview deployment succeeded;
- this workflow does not execute `npm test`, so no test execution is claimed.

Production remains untouched.


## 24 Sep 2026 · Password recovery and beta checklist

Account recovery is now implemented as a beta-readiness requirement.

Implemented:

- Access exposes a focused Forgot Password state.
- Reset requests use Supabase Auth recovery with a same-origin `/reset-password` redirect.
- Request success copy does not reveal whether an email belongs to an account.
- `/reset-password` consumes only a recovery session.
- Normal authenticated sessions cannot call the recovery-only password setter.
- Password confirmation and minimum length are enforced in the UI.
- Successful reset signs out the recovery session before normal sign-in.

Validation:

- PR preview run `36037278858` completed successfully.
- `Generate preview build` and preview deployment passed.
- Staging redirect allow-list and a real recovery email still need a manual QA smoke.
- No reset email was sent to a real user from this work session.

Beta gates are now centralized in `docs/BETA_ROLLOUT_CHECKLIST.md`.

Ownership boundary remains unchanged: Work owns legal/RGPD/cookies/Pricing/Stripe/checkout.


## 24 Sep 2026 · History decoupled from Inbox pagination

The Activity view no longer uses the Booking Inbox's loaded booking IDs as its query universe.

- History queries Activity by `workspace_id` and selected `bookings.artist_id` using the PostgREST booking relationship.
- Booking labels are returned with the Activity relation.
- Free still applies the 90-day `occurred_at` cutoff server-side.
- Artist Pro / Agency remove the date cutoff.
- V1 requests are capped at 500 Activity rows per load; do not describe this as infinite search/retention.
- Booking Inbox remains capped independently and no longer truncates History.

Validation: HEAD `d700c4ba9fee451aadb998cbeae0a91a5bbacd37`, GitHub Actions run `36037867112`, preview build and deployment succeeded.


## 24 Sep 2026 · Passport Event Media management

Event Media is now manageable from the dedicated Passport workspace view.

- Passport trajectory no longer derives from the Inbox's 100 loaded bookings.
- Dedicated confirmed-booking query loads up to 500 artist bookings for Passport V1.
- Media loading is scoped to those Passport bookings.
- Booking decisions immediately refresh Passport bookings and Event Media.
- Artist Pro can add image/video/reel links to confirmed bookings.
- URL fields reject non-HTTP/HTTPS schemes before persistence.
- Media can be linked, hidden and re-linked.
- Adding media never selects it for the public Profile automatically.
- Public selection remains a separate Profile/Passport setting.
- Free sees existing media but cannot mutate Event Media state.

Binary upload is not opened in this iteration. Staging currently has a private `artist-media` bucket limited to JPG/PNG/WebP and 8 MB, so it is not being repurposed as an Event Media video pipeline.

Validation: HEAD `5bb4e86c366c530c04e652c8246c4580ecf366ae`, GitHub Actions run `36038535320`, preview build and deployment succeeded.


## 24 Sep 2026 · Booking Core beta hardening

This pass removes several hidden dependencies on the 100-row Inbox window and tightens decision/delivery semantics.

Implemented:

- exact booking retrieval exists in Booking Core API;
- notification targets use exact booking retrieval, then merge the target into Inbox if it is outside the recent page;
- initial booking deep-links use the same exact retrieval fallback;
- date-conflict detection queries artist bookings for the selected date instead of using Inbox rows;
- active hold conflict checks are scoped by artist/date, avoiding cross-artist false positives inside Agency workspaces;
- Hold UI exposes reserve/release only; booking confirmation remains a single explicit Booking decision path;
- automatic activity transitions remain limited to operational states and never confirm/reject/cancel;
- email delivery UI distinguishes provider submission from final delivery;
- failure/deferred/delivered states have distinct visual treatment;
- `soft_bounce` is aligned with retry semantics and returns the latest waiting-response Booking to in-conversation;
- migration `20260924201500_include_soft_bounce_in_delivery_failure.sql` was applied to staging only and verified from the deployed function definition;
- Relationship Memory queries up to 200 bookings for the selected artist/entity/contact independently from Inbox pagination, including archived history.

Validation:

- product HEAD `c1d734fff6f48ae8d5bd79cbe65cbdedf85c38f1` passed `Generate preview build` and PR preview deployment in GitHub Actions run `36040211375`;
- staging database soft-bounce trigger was applied and inspected;
- production was not touched;
- current preview workflow still does not execute `npm test`, so automated test execution is not claimed.


## 24 Sep 2026 · Calendar and Overview decoupled from Inbox

Calendar no longer uses the Booking Inbox page as its source of confirmed dates or holds.

- Dedicated artist/month query returns up to 500 confirmed non-archived bookings.
- Dedicated artist/month hold query uses the Booking relationship so Agency workspaces do not mix artists.
- PostgREST date ranges use the canonical `and=(event_date.gte...,event_date.lt...)` form.
- Month cells, selected-day timeline and manual-block overlap checks use the monthly Booking Core sources.
- Overview confirmed/hold/occupied-day KPIs use those same sources and show the month being counted.
- Overview upcoming agenda now combines manual availability blocks, active holds and confirmed bookings instead of showing only manual blocks.
- Booking/hold agenda items open the real Booking; manual blocks open Calendar editing.

Validation:

- calendar decoupling HEAD `94a39c5aabb18efb0b63c493c040286d31a8e7c3` passed its PR preview;
- final Overview agenda HEAD `59b2809458d625425e5bad80651b8ded9db53292`;
- GitHub Actions run `36041300782` completed successfully, including `Generate preview build` and PR preview deployment;
- production remains untouched;
- this preview workflow does not execute `npm test`.


## 24 Sep 2026 · Attention independent from Inbox

The Overview Attention surface is now artist-scoped and independent from the Booking Inbox page.

Data sources:

- up to 500 non-archived, non-rejected/non-cancelled artist bookings for attention evaluation;
- active Next Moves filtered through `bookings.artist_id`;
- active Holds filtered through `bookings.artist_id`;
- artist Activity through the existing relational Activity query;
- outbound email delivery rows filtered through the Booking relation;
- unread notifications loaded by workspace and then crossed with the artist's attention booking set.

This removes two hidden failure modes:

- a stale/failed/overdue booking falling outside the 100-row Inbox window;
- Agency data from another artist appearing in the selected artist's Attention panel.

Validation:

- final Attention HEAD `9cd333626ae088e9be542a2b043eed3be0dbd5f6`;
- GitHub Actions run `36041753583` completed successfully;
- `Generate preview build` and PR preview deployment passed;
- production remains untouched;
- automated `npm test` is still not executed by this preview workflow.


## 25 Sep 2026 · Workspace route-aware loading and consent continuity

Implementation commit: `2f6889b577fca769c8a74ea9bc5a9e719e8e86ff` (`fix: stabilize workspace route loading states`).

- Workspace resolves the initial loading surface from the explicit URL first, then the necessary `cuebooker.workspace.view` cookie, then the legacy local-storage value.
- A route without resolved state uses the neutral Workspace boot state instead of rendering the Overview skeleton by default.
- Direct and refreshed routes preserve their own structural skeletons for Overview, Bookings, Calendar, Activity, Profile, Passport and CUE ID. Settings remains represented by its own structural skeleton.
- Authentication and profile bootstrap calls have an 8-second guard and always release the global loading state, preventing Profile, Passport or CUE ID from remaining indefinitely on `Cargando workspace…`.
- Workspace navigation has one active-state source. `aria-current="page"` drives Overview, Bookings, Calendar, Activity, Profile, Passport, CUE ID and Settings without reintroducing an `.active` class.
- Analytics consent is mirrored to the necessary `cuebooker.analytics-consent.v2` cookie for one year and reconciled with the existing local-storage value, keeping the website and Workspace choice consistent.
- The cookie policy documents both persistence mechanisms in Spanish and English.
- Added route-resolution and source-contract tests for loading surfaces and navigation state.

Local validation from the isolated `feature/app-visual-system` worktree:

- `npm test`: 305 tests passed.
- `npm run generate`: completed successfully; 28 routes prerendered.
- Production was not touched. PR #75 remains the preview and validation surface.

## 28 Sep 2026 · CUE ID modular asset intake architecture

Branch `feature/app-visual-system`, based on `fa7448a9a54f97aa542c04b7e05e3a530974c213`. Work is confined to a modular asset contract, empty registry, validation command, reserved public directories and `docs/CUE_ID_MODULAR_ASSET_PIPELINE.md`. The current `CueIdProductionScene` and production manifest are unchanged. No catalogue entries, master `.blend`, body segmentation, runtime mounting or production admission are claimed.

Validation: modular registry tests, `npm run cue-id:validate-modular`, and application build (local worktree). The validator checks shape/files/GLB metadata but cannot replace visual rig and device QA. No schema, migrations, functions, environment or production change.

Next: approve a common body/rig master and segmentation, build one real piece in Blender, perform pose/combination/device QA, then integrate a gated modular loader with cache and semantic-ID migration plan. Do not switch the live creator to the empty registry.
