## Latest hosted staging result, 16 October

Corrected current-staging rehearsal passed. Campaign SQL, Edge version2 and daily retention are now deployed to staging/test, with actual HTTP/SQL/cron consent/dedup/access/retention checks. [Exact sources, evidence, limitations and remaining release gates](STAGING_CAMPAIGN_ACCEPTANCE.md). Production/PR114 merge remain pending. Earlier prepared/not-hosted statements below are historical.

## 16 October follow-up: isolated current staging restore and campaign ACL correction

Current staging export/restore run38932556643 attempt4/job117106725063 passed actual import/all COPY counts/FK/RLS/unidentified-caller denial and cleanup. Campaign acceptance then stopped at service-only RPC privileges. The disconnected runner creates functions as supabase_admin, whose public-function defaults directly grant client EXECUTE; prepared SQL now revokes anon/authenticated explicitly on both collector and withdrawal RPCs. Hosted postgres owner defaults differ, so this is an owner-dependent security contract defect found before deployment, not evidence of an existing hosted exposure. Nothing has been applied to hosted analytics or production.

The SQL fixture reproduces those defaults. Old SQL fails the regression; corrected SQL passes49 assertions, including the6-role/signature privilege checks. All599 unit tests, static build44 routes and whitespace check pass. The corrected current-staging rehearsal remains pending until its new source/hash pin is integrated and actually executed. Follow latest HANDOFF for the exact revision/build/CI and infrastructure PR.

# Beta 0.0.13 release preparation — 16 October 2026

PR114, `integration/beta-home21-review`. Production approval is **not ready**.
The owner authorizes preview and staging publication, analytics staging deployment,
controlled acceptance and production read-only comparison/backup. No main merge,
production application/backend deployment, destructive migration or secret changes.
One product version, Beta 0.0.13, must be promoted unchanged after approval.

## Dependency assessment

The accompanying before/after npm audit JSON files preserve all 19 initial affected
package entries and the nine remaining entries. These are affected packages, not 19
independent exploit paths. Three critical entries are eliminated: `simple-git` and
`@simple-git/argv-parser` are absent after the upstream Nuxt devtools patch, and
`shell-quote` is upgraded from 1.10.0 to 1.12.0.

`npm update --ignore-scripts` respects unchanged direct dependency declarations.
Nuxt 4.5.2 → 4.6.1 stays in major 4; its supported dependency set introduces CLI 4
and Vite 8. These transitive major changes require compiled/browser validation,
not a forced override. Vue 3.5.42 → 3.5.44, Three 0.186.0 → 0.186.1. `devalue`
5.9.2 → 5.9.4 and `source-map-js` 1.2.1 → 1.2.2 remove their advisories. No
`npm audit fix --force`, downgrade or fabricated patched package is used.

Nine high entries remain, propagated from two root advisories:

- `braces` 3.0.3: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
  nested glob patterns can exhaust the stack. Path: Nitro → globby → fast-glob /
  micromatch → braces. Registry latest is still 3.0.3 on this review. Build tooling
  consumes repository-controlled glob patterns; do not feed untrusted patterns to it.
- `node-forge` 1.4.0: [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv),
  RSA PKCS#1 v1.5 verification accepts extra DigestAlgorithm elements. Path:
  Nitro → listhen → node-forge. Registry latest is still 1.4.0. Inspected listhen
  uses Forge for local TLS key/certificate generation/parsing, not application
  signature authentication. Development uses HTTP; keep development endpoints private.

Both packages are server/build dependencies. Cloudflare receives only `.output/public`,
not a hosted Nuxt/Nitro server. Devtools are disabled in `nuxt.config.ts`. This narrows
current exposure; it does not certify every possible future SSR/dev configuration.
No compatible published upstream fix was found for these two root advisories.
Recheck before production approval and when a patched version is published.

## Backend reconciliation and rollback gate

No hosted parity claim can be made without authenticated project access. Known project
references: staging `lycprjeuuynfzwskycwv`, production `qlocooqfdzehogbwcbhr`.
Use `scripts/sql/release-backend-inventory.sql` separately on both projects. It uses a
read-only transaction and returns schema/function/policy/trigger hashes and grants,
not user rows or function bodies. Supplement it with Edge function versions/config,
Storage policy/bucket configuration, Auth redirects and cron names/status. Never
publish secret-bearing cron commands or provider credentials.

Compare actual definitions and the migration ledger; historical staging migration
timestamps differ from the repository. Produce an explicit hash-pinned delta manifest
from those observations. Do **not** run `supabase db push` or replay the historical
30-file manifest as a substitute for reconciliation.

A new production backup was requested in run
[38889098646](https://github.com/litus-code/cuebooker/actions/runs/38889098646).
At this review it is waiting for the protected `production` environment gate; API
approval returns 403. It is not yet a backup. The October 4 artifact is not fresh.
After completion, pin the new run/attempt/artifact and SHA256, verify encrypted archive
roundtrip and restore it in the disconnected disposable database using the existing
restore-drill implementation. The registered restore workflow is pinned to the OLD
artifact: update its bounded input before dispatch, do not claim that old run verifies
the current database. The backup covers database rows/schema, not Storage object bytes
or provider/platform configuration. Those recovery limitations remain explicit gates.

For analytics staging: restore/rehearse against the current staging snapshot, apply
only `20261016120000_campaign_funnel_analytics.sql` after dependency/grant checks,
deploy `campaign-analytics` with the checked shared modules and `verify_jwt=false`,
then schedule/inspect the documented retention job. Keep the dataset `test` throughout
QA. Verify actual Deno ingress → SQL events → restricted panel, withdrawal and denied
consent, campaign transfer, cross-account/workspace attribution and once-per-workspace
activation. Local Postgres and mocked browser transports are not hosted evidence.

Rollback preparation: record pre-release frontend SHA and Edge versions/source. Stop
the optional collector and its retention job before reverting the frontend; remove
only the new campaign observer triggers if required. Preserve optional analytics
tables for inspection. Rehearse any other reconciled backend delta and its reverse
against the fresh isolated restore; do not restore a full database over new production
writes without a separate incident decision and data-loss assessment.

## Acceptance gates

Preserve owner-accepted connected email, supported/rejected message attachments and
DJ operational circuit. Do not restart them as generic pending work. The remaining
agency catalogue/multi-artist/invite/role/removal/tenant cases, password recovery and
failed attachment recovery still need controlled staging identities and hosted evidence.
Use `docs/AGENCY_P1_ACCEPTANCE_PLAN.md`, record each allowed and denied operation, and
do not expose invitation/recovery tokens. A passing source/unit test is not a hosted
acceptance result. Do not create real accounts, mail or requests merely to populate
analytics. Use explicitly identified test data in the authorized staging QA scope.

## Verification performed on the updated local candidate

- Node 22.23.3 / npm 10.9.3; `npm test`: **599 pass**, zero failures/skips.
- `npm run generate`: client/server production build succeeds, **44 prerendered routes**.
- Existing compiled public browser suite: **24 cases pass** (Home/DJ/Agency × ES/EN ×
  light/dark × 390/1440 px), including 24 Axe scans with zero reported violations,
  loaded images, SVG alignment, attribution links, denied optional traffic and mobile
  navigation hide/show/menu behaviour. Chromium only; no Safari/device claim.
- Exact Spanish CUE ID heading and both loaded avatars checked on the generated page;
  mobile section screenshot saved alongside this file and visually inspected.
- Existing analytics SQL suite: **43 assertions pass** on isolated PGlite, explicitly
  minimal dependencies. Not staging, not evidence of real accounts or invitations.
- Inventory SQL executes successfully against isolated PostgreSQL catalogs; hosted
  schema comparison is pending. `git diff --check` passes.

No new account, email, invitation or booking was created for this review. No hosted
migration, function or retention deployment has occurred. No stable staging or
production readiness is implied by these local checks.

## Production preparation checkpoint, 17 October

PRODUCTION_DEPLOYMENT_AND_ROLLBACK.md records the ordered proposal and remaining
source/configuration gates. production-edge-manifest.json pins all local bundle files
and three captured original production function sources. production-config-inventory.json
contains only safe metadata/aggregate counts. The captured recovery template is source
rollback material; staging-source-drift contains an unpromoted Brevo handler for review.
No hosted production change is represented by these files.
