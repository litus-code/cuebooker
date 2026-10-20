# PR114 — CUE ID, actual Passport and campaign funnel

> Historical PR114 review evidence (16 October). PR114 was subsequently merged and
> the backend deployed according to release evidence. Use the
> [20 October audit](../acquisition-analytics-2026-10-20/README.md) for current checks,
> access limitations and the new prepared diagnostics migration. The deployment-pending
> statements in this historical review must not be treated as current environment truth.


Review candidate `integration/beta-home21-review`, same Beta0.0.12. Exact application
revision: a77fc4c7444bce1586a30e57827e00f507dc69e5. No main merge, production operation, hosted migration/function deployment,
secret change, email, hosted account or real enquiry was performed.

## Public pages

- DJ retains its approved design and content order. After basic Passport, CUE ID now has
  its own secondary block with the two existing clothed/haired female/male concepts and
  an explicit **In development** label. Home retains a brief reference linked to `/dj#cue-id`.
- Passport's three-point illustration is replaced by four locale/theme-specific captures
  of the current workspace renderer, with a city tooltip showing venue/date. Three
  artificial confirmed bookings build the actual constellation and counts. No new
  Passport functionality was implemented or implied; public summary visibility remains
  artist-controlled and linked media requires a compatible plan.
- All five distribution controls share the established SVG arrow, 20×20 and vertically
  centred on DJ and Agency. No glyph substitute remains in these controls.
- Signup notes are shorter. Agency mentions roster/enquiries; AI email still requires
  beta approval. No new pricing, free/card, commercial-limit or automatic-activation claim.

The four WebPs under `public/images/product/passport-*` are genuine rendered UI with
local artificial fixtures (not a published hosted account). The existing reproducible
[capture script](../commercial-product-review/capture.cjs) now also captures Passport.
Other product screenshots retained from the preceding PR114 review were not retouched.

## Audit findings and implementation

Previously, marketing/signup/onboarding/publication events went only to dataLayer/GTM.
The beta dashboard read operational tables and a separate first-party event store limited
to Smart Capture/media/automation. That optional feature writer did not check cookie
consent. There was no persisted visit→signup campaign cohort or reliable first received
request fact. UTM values were present in links but not stored as a complete campaign
funnel. Old overview/user counts can include tests and remain explicitly labelled as
historical operational data, separate from the new Campaigns tab.

The candidate reuses `useAnalytics` call sites, the `product_analytics_events` table,
existing names and the existing `is_internal_admin` gate. It adds only missing persistence,
server-observed milestones, a rate-limited adapter and the Campaigns tab. DataLayer
`signup_completed` remains an API-accepted signal; it is **not** ingested as a second signup.
The account-creation trigger is the persisted source. No GTM/GA report is imported into
this panel, and external tag/container/conversion settings have not been verified.

### Units and boundaries

| Step | Count / unit | Source and deduplication |
| --- | --- | --- |
| Visit | Total acquisition page-view events; distinct consented browsers separately | Home/DJ/Agency only; router readiness + navigation share deduplication; hashes do not create views |
| Interest | Total signup CTA events; distinct browsers separately | Page + placement + source, so two clicks are two events, not two people |
| Registration | Distinct new server-created auth accounts; browser count separately | One signup per account; may still await email confirmation; existing-account obfuscated responses do not create another fact |
| Onboarding | Distinct completed accounts and distinct first owned workspaces separately | Profile-completion observer; lazy workspace attachment updates the same fact. Agency members do not multiply workspace denominators |
| Publication | First observed profile/catalogue publication per workspace | Canonical artist booking route (unambiguous legacy association only if no route), or agency catalogue; republishing or multiple artists does not multiply the workspace |
| Activation | First received request per workspace | `public_form`, `email_import`, or automatic `ai_capture` with email origin; excludes manual captures, outbound messages and other AI inputs |

A visitor is a random **browser identifier**, not a person or a session. It lasts at most
30 days in local storage; one browser can create several accounts and several devices can
represent one person. The schema supports multiple account registrations per browser.

An unguessable 256-bit browser token is sent only after consent; only its SHA-256 hash
is persisted. The matching hash in signup metadata associates an actual new account with
that consented browser at creation. Signup metadata carries code-only source/ref/UTM and
no additional names/emails. This transport envelope is removed by the auth observer and
stripped from browser auth sessions; it is not retained as a second attribution store. This is the valid linkage for visitor→registration conversion;
there is no email matching, cross-device inference or attribution of unrelated anonymous
traffic to existing accounts. Failure or unavailable storage/collector leaves attribution
missing and does not prevent signup. The metadata wait is bounded at 400 ms.

`source` is DJ/Agency entry intent. The chosen DJ/Agency type, when known from onboarding,
is shown **separately**; unknown stays pending/no data. Generic Home signup does not invent
an audience. Explicit Home audience CTAs now carry their destination source too.

All six steps accept UTC date bounds (inclusive end date in UI, exclusive in SQL), source,
`utm_source`, `utm_campaign`, referral and **one** dataset. Code matching is exact. Only
allowlisted campaign codes are accepted; raw URLs, profile slugs, referrers, arbitrary
page titles, contacts, subjects, conversation text and enquiry fields are not collected.
Legacy referral snapshots are now also consent-gated and their paths are sanitized.
Source/ref/UTM survive landing→access and the registration request.

Conversions intersect the **same unit**, in temporal order, inside the selected window:
visitors for visit→interest and interest→registration; accounts for registration→onboarding;
workspaces for onboarding→publication and publication→activation. Numerator/denominator
and unit are printed. Zero denominator is **Sin datos**, never 0% fabricated from missing
coverage. These are observable within-window cohorts, not a global full-history campaign
conversion. Registration or activation outside the window is not inferred. An activation
before publication does not convert a later publication, but still appears in its own step.

### Consent, security and test separation

- Unknown/denied consent prevents optional identifiers, GTM, campaign events and the
  optional feature telemetry writer. Rejecting at the actual banner is tested through
  registration. Existing necessary authentication/settings continue to work.
- Withdrawal clears local campaign/referral state and requests removal of that token's
  optional facts/account associations. An already loaded GTM script requires a reload;
  the denied choice is saved before that reload. No page-view is sent on the denied reload.
- The browser does not write verified milestones. The Edge collector bounds the body
  (including chunked requests), uses the existing HMAC-address abuse limiter and fails
  closed if that limiter/address is unavailable. A further per-browser budget bounds DB
  writes. IP is not stored in campaign events; existing abuse buckets retain their separate
  short-lived security policy.
- Collector and withdrawal RPCs are **service-role only**. Direct client inserts into the
  event table are removed; the existing bounded product RPC remains. Campaign report is
  authenticated **and** internal-admin checked in SQL. Private identity/config/dedup tables
  have RLS and no anon/authenticated read/write grants. UI never substitutes for DB access
  control and returns only aggregates, not identity/token/email/booking-content rows.
- `private.campaign_analytics_settings.dataset` determines the collection batch **on the
  server**. Default is `test`; browser flags cannot promote tests into `live`. Existing
  rows are `legacy` and excluded from both campaign sets. Staging/local QA must stay test;
  actual campaign collection requires an explicit reviewed switch. Do not generate test
  traffic in a live batch: use the separate test environment. This is an environment/batch
  classification, not a guessed email-domain rule.
- Milestones are measured only for new consenting acquisition cohorts, while their token
  is active (30 days); no legacy account/UTM/timestamp backfill. Existing received booking
  rows disqualify a later request from becoming a new first activation. Minimal workspace
  dedup keys survive optional-event deletion/retention and cascade when the workspace is
  deleted. History already deleted before this instrumentation cannot be reconstructed.
- Optional facts/associations expire after 90 days from identifier creation via the pending
  daily maintenance job. Revoked/expired hashes are minimal tombstones and cannot revive
  consent. Operational Booking Core records are not erased by analytics withdrawal.
- DB observers are fail-open for product actions, issuing categorical warnings only. A
  backend failure may lose metrics and must not block signup/onboarding/booking ingestion.

## Prepared backend — deployment still pending

Files:

- `supabase/migrations/20261016120000_campaign_funnel_analytics.sql`
- `supabase/functions/campaign-analytics/index.ts`
- `supabase/functions/_shared/campaignAnalyticsIngress.ts`
- `supabase/config.toml` entry (`verify_jwt=false` for this limited anonymous collector)

No existing backend function, Booking Core command, mailbox job or billing entitlement
was changed. Existing public-ingress limiter and service-role environment bindings are
reused; no new secret or paid service is required.

Before any **separately authorized staging deployment**:

1. Recheck the target project/migration ledger, current definitions/grants, auth profile
   creation triggers, workspace creation order and internal-admin membership. Dependency
   tables: auth users/profiles, workspaces/members/artists, organizations/legacy bridge,
   bookings (including origin/capture fields), canonical artist booking routes, internal analytics foundation and public
   rate-limit buckets/RPC. Local tests use explicit minimal dependency schemas; they are
   not proof of a complete hosted migration-chain replay.
2. Rehearse the exact pending migration against an isolated current staging restore.
   The previous frozen 30-file release rehearsal manifest has intentionally not been
   rewritten; this extra migration must be included in the **next** reviewed rehearsal.
3. Apply this additive migration only to the approved staging project, preserving existing
   rows. Keep dataset `test`. Inspect RLS/grants, security and performance advisors, replay
   non-admin/anonymous/foreign-workspace negative cases and test owner/member isolation.
4. Deploy the new Edge adapter with its config; verify existing rate-limit RPC/environment
   dependencies without changing secrets. Validate gateway client-address forwarding,
   status/size limits, CORS and failure behaviour on the real Edge runtime. No hosted Edge
   runtime/deployment or Supabase advisor result is claimed by this review.
5. Schedule and verify the daily retention job (existing pg_cron capability), e.g.
   `select cron.schedule('cuebooker-prune-campaign-analytics','17 3 * * *','select private.purge_campaign_analytics();');`
   Inspect the job/result before claiming a 90-day retention policy is operational. The
   private helper is callable by the DB scheduler; the public manual wrapper requires an
   internal admin. No scheduler was activated by this PR.
6. With owner-authorized test accounts only, verify emitted→persisted→visible on staging,
   revocation, signup confirmation semantics, actual onboarding, catalogue/profile
   publication and one genuine incoming enquiry. Do not create accounts, send mail or
   create real requests without that separate authorization. Decide when the collection
   batch becomes `live`; never mix QA with a live batch.

Rollback: stop the optional collector and its retention schedule, remove only the new
campaign observers if necessary, then revert the frontend. Keep analytics data/schema for
inspection rather than destructive rollback. Existing domain commands do not depend on
campaign observers; failures cannot block them. Production remains a separate decision.

## Evidence and limits

- `npm test`: **599 pass**, 0 failures/skips (ten new regressions). Meaningful checks cover
  consent, privacy/attribution, optional feature telemetry, initial/hash navigation
  deduplication, payload bounds, rate limits and execution of the actual Edge adapter with
  simulated transport. The latter uses Node Web APIs and a fake Deno environment; it is
  not proof of a deployed Deno runtime.
- `npm run generate`: **44 routes**, success. No repository typecheck/lint scripts exist.
- Isolated PostgreSQL/PGlite0.5.10: **43 assertions** against the existing analytics
  foundation plus the exact pending migration, using explicit minimal dependency schemas.
  Collector→facts→report, duplicate keys, actual account creation/metadata cleanup,
  multi-account browser, agency owner/member cardinality, shared-artist canonical route, publication/activation order,
  manual/automatic email distinctions, no historical backfill, date/source/campaign/ref
  filters, test/live separation, anonymous/non-admin/direct-insert denial, revocation and
  retention pass. This is not a full current-staging migration-chain rehearsal.
- Public compiled Chromium: **24 combinations** (Home/DJ/Agency × ES/EN × light/dark ×
  390/1440), with zero page overflow/errors and zero Axe WCAG2/2.1 A/AA violations.
  Correct images, two-avatar alignment/order, SVG geometry, short CTA notes, home deep link,
  compact demo, menu and hide-down/reveal-up mobile header verified.
- Two compiled browser journeys (Agency and DJ): actual UI registration/onboarding calls
  intercepted to a loopback-only fixture adapter, **real local PostgreSQL** observer
  persistence, then the actual Campaigns tab renders those aggregate results. One initial
  page view and one click/start are emitted, with no duplicate stored client completion;
  source/ref/UTM and metadata cleanup verified. Normalizing hydration query/trailing-slash
  routes no longer doubles the entry. Filters cannot relabel an unapplied test result as
  live; the applied filter values remain printed with the result.
- Panel checked in **16 states** (two cohort journeys × ES/EN × light/dark ×390/1440),
  zero page overflow/errors and zero Axe violations. Overflow tables are keyboard-focusable.
  Separate test/live/no-data results, unavailable RPC and denied-admin UI states pass.
- An actual **Reject** button flow through a simulated signup emits no GTM/collector
  calls, creates no optional identifier/referral snapshot and persists no campaign signup.
  SQL withdrawal tests independently verify deletion, future suppression and retention.
- [Dependency audit](dependency-audit.txt): **fails** with 19 advisories (1 low,15 high,
  3 critical) in the unchanged existing dependency tree. `package.json` and
  `package-lock.json` are byte-identical to baseline31d76bd (lock SHA256
  `95da9f06ce3beffd1271410b1302cbde330a479757953f1bd1f515d9ea8342a4`). No blind audit fix,
  dependency upgrade, vulnerability suppression or production-risk clearance was performed.
  This is a separate release-hardening follow-up; tests/build success does not resolve it.
- All browser data above is artificial and all provider traffic is intercepted/blocked.
  No real account, email, hosted publication or enquiry. Chromium only; Safari/device
  acceptance, actual Supabase persistence/Edge deployment/advisors/cron and external GTM/GA
  configuration remain unverified and pending the deployment gate above.

### Review captures (ES, artificial data)

| Surface | Mobile390 | Desktop1440 |
| --- | --- | --- |
| CUE ID, light | [Capture](cue-id-390.jpg) | [Capture](cue-id-1440.jpg) |
| Passport, light | [Capture](passport-390.jpg) | [Capture](passport-1440.jpg) |
| DJ | [Dark page](dj-dark-390.jpg) | [Light page](dj-light-1440.jpg) |
| Agency | [Dark page](agency-dark-390.jpg) | [Light page](agency-light-1440.jpg) |
| Campaign panel, dark | [Test cohort](analytics-dark-390.jpg) | [Test cohort](analytics-dark-1440.jpg) |
| Campaign panel, light | [Test cohort](analytics-light-390.jpg) | [Test cohort](analytics-light-1440.jpg) |

Published frontend revision68c7853: CI38886355974 and preview38886355865 passed;12 public Home/DJ/Agency × ES/EN ×390/1440 cases passed (ES dark,EN light), including loaded new imagery, menus/scroll, compact demo and UTM links. Deployment: https://b852f07b.cuebooker-staging.pages.dev/. The later canonical-route SQL correction changes no frontend asset or application component. Final-head publication/CI follow-up is recorded on [PR114](https://github.com/litus-code/cuebooker/pull/114).
The hosted preview has frontend changes only; the prepared campaign backend has not been
applied. An authorized account sees a backend-unavailable message until deployment,
not invented metrics. No hosted campaign data is claimed.

Reproduce local SQL checks without Supabase:

```sh
# PGlite is an external test tool, not an application dependency or lockfile change.
PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node scripts/test-campaign-analytics.mjs
# Optional loopback-only bridge for compiled UI → actual local PostgreSQL → actual panel.
PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js CUEBOOKER_CAMPAIGN_BRIDGE_PORT=4196 node scripts/test-campaign-analytics.mjs
```

Build with the existing local artificial `agency-ux-fixture.invalid` public connection,
serve `.output/public` on loopback, then run `verify.cjs` (public matrix) or
`CUEBOOKER_CAMPAIGN_BRIDGE=http://127.0.0.1:4196 node verify.cjs --funnel-only` from this directory.
The script intercepts fixture-provider requests and blocks other external resources.
Override Playwright/Chromium/Axe paths through its documented environment variables when
running outside this cloud workspace. No localhost link is a user-facing preview.
