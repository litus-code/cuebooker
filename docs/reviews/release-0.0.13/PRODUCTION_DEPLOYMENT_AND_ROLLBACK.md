Verified follow-up: source df8b90f passes615 tests/44-route CI and all18 Edge type checks.
Brevo ingress-v40 and complete Gmail-events-v16 now match that source in staging and
reject unsigned calls. See BACKEND_SOURCE_RECONCILIATION.md for exact evidence/limits.
Google Cloud console is unavailable in this browser; external provider/private production
configuration remains the next gate. Production unchanged.

Current follow-up: BACKEND_SOURCE_RECONCILIATION.md supersedes the original Brevo/Nylas
source findings below. Reconciled source has615 passing tests; exact staged deployment
and final checks are recorded there. No production action follows from that preparation.

# Beta0.0.13 production preparation, 17 October 2026

Status: prepared inventory, publication blocked by the explicit items below. PR114
remains draft/unmerged. No hosted SQL, Edge, Auth, provider, secret, Storage or
application setting was changed during this inspection.

## Exact scope and evidence

Function sources: candidate9bd56509bb9aba2176b55483988df80c05b1fd6a. Current PR114
adds documentation only after that candidate, plus two proposed explicit JWT settings
in this preparation. SQL remains the same39 files that passed isolated run39009939881
on infrastructure main2259f28c152f8663ba825171294bc5a00b62061a. Its backup is the
16 October archive38889098646/attempt1, not a live database clone of this inspection.

`production-edge-manifest.json` records every local transitive relative import, its
SHA256, effective JWT setting, observed staged version and byte-level source drift.
Keep the original repository-relative tree, including imported app/domain and
app/services files. Deploying only an index.ts is insufficient for several functions.
The manifest lists18 repository handlers:17 runtime and one conditional legacy Nylas
webhook. Staging-only synthetic/AI/notification diagnostics are not release targets.
Production-only email-provider-preflight stays closed (HTTP410), unchanged.

The three original production sources and JWT settings are captured under
`production-rollback/`, with exact file hashes and restore entrypoints in the manifest.
They contain no embedded credentials found by the preparation scan. These captures
are source rollback material, not exported provider/Auth configuration or secrets.

## Differences that must be resolved before promotion

| Finding | Evidence | Required disposition |
| --- | --- | --- |
| Two missing JWT declarations | submit-agency-enquiry and mailbox-beta-admin are false in hosted staging but default true in repository config | Explicit false entries now proposed in config.toml. Agency enquiry is public; admin handler separately requires a server credential and rejects ordinary user tokens. No server authentication removed. |
| Brevo ingress source drift | Staging ingest-booking-email v39 has gated attachment download/persistence absent from the candidate | Captured as staging-source-drift/ingest-booking-email-v39.ts for review only. Reconcile tested source/feature scope before any promotion of this handler. Do not overwrite the hosted implementation with the older repository file or blindly copy an unreviewed capture. |
| Gmail webhook dependency drift | Entry handler matches; staged bundled nylasMailbox helper predates outbound attachment support and lacks the new app/domain dependency | Package all four exact candidate files and verify/type-check the complete bundle in staging before promotion. Existing accepted Gmail delivery is separate evidence. |
| Brevo event byte drift | Executable lines match; trailing newline differs | Recorded as byte drift, no business-code correction required. |

All remaining local handlers and their complete imports match captured staged source
byte-for-byte. JWT settings match hosted staging after the two explicit entries.
Hosted version counters and ezbr bundle digests cannot substitute for file comparisons.

## Read-only configuration inventory

`production-config-inventory.json` contains only schema/configuration metadata and
aggregate Storage counts. Production still has81 migrations, three Edge functions,
two existing SQL schedules, no worker Vault names and one private artist-media bucket
with zero objects at inspection time. Staging has120 migrations,21 Edge functions,
six schedules, all three worker Vault names, six media objects and seven attachments.
No user rows, object names, bytes, secret values or cron command bodies were read.

The production attachment bucket is absent and is created private by the rehearsed
SQL delta. Keep its5242880-byte limit and PDF/JPEG/PNG allow-list. Existing artist-media
is private,8388608 bytes, JPEG/PNG/WebP. Never copy staged objects, OAuth credentials,
consent, queues or analytics facts into production. Current zero production objects
means no existing Storage bytes need exporting at this checkpoint; recheck immediately
before launch and protect any objects created since then. DB dumps omit object bytes.

## Configuration prerequisites, no values in repository

| Area | Production requirement | Current verification |
| --- | --- | --- |
| Auth URLs | site URL https://cuebooker.com; exact reset-password and agency-invite return routes for this environment | Verified in authenticated dashboard: site URL is cuebooker.com and existing cuebooker.com/** allow-list covers both routes. No setting changed. |
| Auth mail | Preserve/capture existing subjects, templates, confirmation policy, SMTP host/sender and recovery behavior before any change | Custom SMTP enabled, Brevo host/587, sender metadata verified; stored password not read. Recovery subject/body captured with ConfirmationURL and no localhost. Email confirmation and new signups are enabled; anonymous sign-ins/manual linking disabled. Other templates remain uncaptured. sync-supabase-auth-mail-templates.mjs writes immediately, so never invoke it as inspection. |
| Edge platform values | SUPABASE_URL and platform-provided server/public credentials from the production project | Do not export, print or copy staging values. Environment secret presence is not proven by source code. |
| Public mail routing | BREVO_API_KEY, CUEBOOKER_FROM_EMAIL, CUEBOOKER_FROM_NAME, CUEBOOKER_REPLY_DOMAIN, CUEBOOKER_APP_ORIGIN, CUEBOOKER_INBOUND_WEBHOOK_SECRET, BREVO_TRANSACTIONAL_WEBHOOK_SECRET and rate limiter secret if separately configured | The seven Brevo/routing names are present in Edge Secrets; values and actual provider routing remain unverified. Preserve originals through private operator controls. |
| Gmail | Separate production OAuth client, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_TOKEN_ENCRYPTION_KEY; callback ends /functions/v1/connected-mailbox on qlocooqfdzehogbwcbhr | Owner created the production OAuth client and private secrets. All three Gmail secret names are dashboard-verified; their values and actual OAuth client settings/consent remain unverified. Existing staged acceptance does not prove production OAuth. Never rotate an encryption secret while retained credentials depend on it. |
| Gmail push | Dedicated production topic/subscription/OIDC identity and exact endpoint/audience | Owner Cloud Shell output confirms production resources, exact endpoint/audience/OIDC identity and scoped IAM bindings. No production delivery test yet. See inventory evidence. |
| Worker gates | MAILBOX_WORKER_SECRET; production return URL; CUEBOOKER_MAILBOX_TRANSPORT=gmail; explicit mailbox/background/attachment flags | Owner configured private worker secret and transport/return URL; names verified only. All mailbox/background/attachment flags were instructed false and owner reported saved. Keep background and both new cron jobs off through initial validation. |
| AI | GROQ_API_KEY and optional configured capture/transcription models | Owner configured GROQ_API_KEY; name verified, value never read. Provider quota remains unverified; do not use paid calls as a readiness probe. |
| Beta notices | CUEBOOKER_BETA_ADMIN_EMAIL, CUEBOOKER_BETA_NOTIFICATIONS_ENABLED and sender configuration | Keep notifications disabled until recipient/provider checks. Do not issue invitations or send messages as part of preparation. |
| Legacy Nylas | NYLAS_API_KEY, NYLAS_CLIENT_ID, NYLAS_WEBHOOK_SECRET, optional NYLAS_API_URI | Conditional only. Do not require or activate Nylas for the Gmail-only cohort. |
| Vault | cuebooker_mailbox_worker_url, cuebooker_gmail_history_worker_url, cuebooker_mailbox_worker_secret | Owner saved all three names; exact-name presence verified in rendered production Vault. Owner regenerated the worker secret and reports saving it in both Edge and Vault; no values read or equality test performed. URLs were instructed to target production. No cron activated. |

The dashboard initially showed sign-in, then an authenticated GitHub session became
available. Read-only rendered controls verified URLs, SMTP metadata, the recovery
subject/body and Edge secret names. No credentials were entered/read by the agent,
no secret values were inspected. Subsequently the owner manually added production Gmail,
worker, Groq, gate and Pub/Sub settings; the agent verified names only. The owner also
created Google Pub/Sub resources and supplied matching final metadata/IAM output.
OAuth client settings/consent, Brevo external routing, other Auth templates and secret
values remain unverified. No application deployment/main merge or hosted SQL apply occurred.

Production resource names, now confirmed by owner Cloud Shell output:

```text
Google project: cuebooker
Topic: projects/cuebooker/topics/cuebooker-gmail-prod
Subscription: projects/cuebooker/subscriptions/cuebooker-gmail-prod-push
OIDC identity: cuebooker-gmail-push-prod@cuebooker.iam.gserviceaccount.com
Endpoint/audience: https://qlocooqfdzehogbwcbhr.supabase.co/functions/v1/gmail-mailbox-events
```

The existing script's --apply creates/updates Google resources and IAM grants. Its
offline plan is not proof they exist. OAuth branding, restricted scopes/testing users,
provider privacy/retention requirements and private credentials stay separate gates.

## Proposed order, requires final owner approval

1. Resolve the source/configuration findings above, pin the final candidate, require
   green CI and complete staged bundle/permission acceptance. Preserve owner-accepted
   DJ, Manager/recovery, connected mail/attachments, ES/EN/mobile/public checks.
2. Refresh the encrypted backup immediately before hosted SQL. Recheck current schema,
   preserved production-only definitions and Storage count. Repeat the isolated drill
   if schema or candidate SQL changed. Capture the currently served frontend revision
   and a recoverable Cloudflare deployment, plus private configuration rollback values.
3. Apply only the reviewed39-file SQL delta to qlocooqfdzehogbwcbhr in recorded order,
   mapping source names/hashes to hosted migration history. Never run blind db push,
   replay staging history or replace production with a staging dump. Stop on failure.
4. Verify counts/FK/RLS, preserved Next Move/billing definitions, private attachments,
   service-only RPCs, test analytics and paused mailbox/Gmail jobs against production.
5. Deploy the dependency-complete runtime bundles with manifest JWT settings. Preserve
   email-provider-preflight. Keep provider webhooks/background gates off until exact
   production OAuth, routing, Vault and permissions have been checked.
6. Integrate the approved application PR separately. The production frontend workflow
   requires a full40-character SHA contained in main, reruns tests and builds against
   production settings. Deploy that reviewed revision only; PR119 was infrastructure.
7. Use one authorized disposable production QA scope to verify access, public enquiry,
   conversation/attachments and owner-approved delivery. No unsolicited email, new
   consent or automatic reply. Confirm private cross-workspace denial and idempotency.
8. Activate only explicitly approved provider routes/background workers after scoped
   consent and successful checks. Keep analytics dataset=test until a separate live
   collection decision. Existing expire-holds/prune schedules remain intact.

## Stop and rollback

Stop on failed migrations, mismatched fingerprints/counts, cross-workspace exposure,
public attachment access, wrong-environment endpoints or ambiguous provider sends.
First disable the new entry/background routes and pause only newly activated worker
jobs. Retain Bookings, conversations, files, consent records and send-attempt facts;
do not replay failed/uncertain sends or delete schemas to imitate rollback.

Restore the previously recorded frontend deployment. Redeploy the captured original
smart-capture/get-public-artist-profile sources with their original entrypoints/JWT
settings if replacement code caused the failure; this creates new version numbers,
not a rewrite of hosted history. The closed preflight stays unchanged. Source rollback
alone does not undo provider side effects, Auth changes, credentials or SQL.

Keep compatible additive SQL/data unless a separately reviewed compensating migration
is necessary. A complete DB restore requires an explicit incident decision, reconciled
post-backup records and object-byte recovery. The isolated observer rollback proved
operational records survive disabling analytics observers, not arbitrary schema undo.

## Validation of this preparation

Executable source df8b90f01c057b67a8a7529824de616ea34ee670 passed615 app tests,
44-route generation in CI39011862455/job117335909451, and complete18-handler Deno
checks. Reconciled Brevo v40/Gmail v16 sources retrieved and byte-verified in staging;
unsigned requests denied401. SQL39-file isolated rehearsal39009939881 passed; SQL
checksums unchanged. Current operator script passes seven offline tests, including
the stable Pub/Sub unsupported-condition regression. No new paid/provider calls.
Earlier608-test/partial-type-check preparation evidence is superseded.

Read-only production refresh after09:41 on October17:81 migrations, the original
two active cron jobs, one private artist-media bucket with zero objects, three
required Vault names present, only smart-capture/get-public-artist-profile/closed
preflight deployed. Version counters21 reflect secret updates; they do not prove
source changes. Fresh encrypted backup run39014718244 dispatched on reviewed main
2259f28; owner approved protected environment and the run finished SUCCESS at
07:47:18Z. Job117344308339 verified encrypted export without restoring. Artifact
12094427790, cuebooker-production-db-39014718244-1, digest
sha256:1aab916fd7c281416e7047ab3153e0c3a67f919b63b84b4837ecc9c53bedff31,
expires2026-10-24T07:47:15Z. Current six input table hashes and both preserved
function/trigger pairs exactly match the passing rehearsal. No fresh restore claimed.
Final application release approval remains separate from backup approval.

## 2026-10-17 frontend recovery evidence

Owner screenshots identify the current successful production deployment as
`8ec8a35f-1f8c-4e49-97d2-e91f9f4a631e`, project `cuebooker-production`, alias
`cuebooker.com`, URL `https://8ec8a35f.cuebooker-production.pages.dev`.
Dashboard displays September29,2026 11:42AM without timezone. Retain this
deployment as the frontend recovery target after promotion. The owner also
opened the menu on previous successful production deployment `ecef9cf1`: it
shows `Rollback to this deployment`. No rollback/delete was selected. The active
deployment only showed disabled delete, so never expect a self-rollback menu.

This is screenshot evidence of identity/menu capability, not an executed recovery
test. Exact hosted git SHA remains unverified; repository title matches candidate
`2f434db69761f09b932bf93b4de126a2677cfc9b` but title alone does not prove linkage.
Frontend rollback does not revert SQL, providers, Vault, or Edge Functions.
