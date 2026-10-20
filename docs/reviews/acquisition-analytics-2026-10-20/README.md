# Acquisition analytics audit — 20 October 2026

Scope: production read-only diagnosis; isolated correction branch from current main,
no production writes/deployment, settings/secret change, Auth change, merge, email or booking.

## Publication update —20 October

Owner now authorizes full PR122 analytics publication (Beta0.0.15). Production collection already verified live in protected run39439480511, following read-only audit39435561163; user confirms Test panel renders. Historical access/pending-mode statements below are checkpoint history. New reporting migration is still pending hosted application until deployment results are recorded. No collector redeploy needed. Exact fixed migration deployed by deploy-campaign-reporting.yml: staging first; protected production follows only after fresh encrypted verified backup; no historical migration chain. Real admin RPC/negative-gate verification uses existing admin transaction-local claims, logs only aggregate results; creates no identity. Rollback restores prior report function and removes only this migration ledger row. Retains live setting, old cohorts, events, consent and retention. No production event/account seeding.

## Current evidence (historical checkpoint)

- PR114 merged 17 October at e3bd0b040369c150fac7800f27643c30d69f0599.
  Main now 10d94956e128ca8c5105d4411ce0565bebf800d0, Beta0.0.14, production workflow
  39033868798 succeeded. PR120 merged; PR121 Passport media permissions remains open.
- Existing release evidence records campaign migration/function/retention deployment to
  staging and production. Historical campaign README's "not deployed" is stale. Current
  live checks below do not prove every recorded definition/version still matches.
- On both projects, HTTPS collector GET returns405/method_not_allowed and OPTIONS204.
  The report RPC exists and denies anonymous requests401/42501. This is evidence of
  existence/access denial, not collector persistence or an administrator's permission.
- Served production configuration targets `qlocooqfdzehogbwcbhr`, external GTM ID empty;
  staging targets `lycprjeuuynfzwskycwv`, GTM configured. Missing GTM does not disable the
  first-party collector. Publishable keys were read from served config, not secret keys.
- Deployed production assets in Chromium emit one page_view after actual Accept and one
  signup_click on the hero CTA; Reject emits neither and creates no optional identifier.
  Full Instagram UTM query survives the signup link. Collector requests were **intercepted**,
  not forwarded. See production-emission.json. No real signup or production event created.
  This is not Microsoft Edge, a hosted persistence test or an account-creation test.
- No management connection/binding is available in this execution environment. Secure
  configuration metadata explicitly says SUPABASE_ACCESS_TOKEN has_saved_binding=false.
  Current production/staging dataset, stored counts, exact migration ledger/source,
  Edge version, admin membership and natural retention runs remain unverified as of this
  checkpoint. Owner selected configuring access; selection is not authentication.

## Findings and causal limits

1. The panel defaults to live, while last hosted release evidence says collector mode test.
   This can explain all-zero live metrics, but **is not a confirmed current root cause**
   until the current setting and both datasets are read. Do not flip the mode blindly.
2. Client fetch ignores HTTP status and accepted:false; rejection looks like successful
   dispatch. This confirmed code defect prevents diagnosis, not proof the server failed.
3. Stored signup_started is omitted from displayed metrics. Clicks cannot answer how
   many browsers submitted signup, and a submission is not a created account.
4. Registration is an actual server-created account, possibly unconfirmed. Existing UI
   explains this but does not break down current email confirmation state.

## Prepared correction

Beta0.0.15 candidate, unchanged direct dependency lock. Browser delivery checks HTTP and
accepted acknowledgement and produces a categorical console warning/in-memory diagnostic
for network/HTTP/refusal/invalid response. No payloads, tokens, query strings or response
bodies are logged; no extra tracking service, persistent diagnostic store or automatic retry.
A boolean return from track still means dispatch scheduled, not persistence. Signup remains
independent and its existing bounded optional-metadata wait is unchanged.

A new additive migration `20261020120000_campaign_reporting_diagnostics.sql` replaces only
get_campaign_funnel, preserving its signature, admin gate, date/filter/consent semantics,
conversion math and explicit datasets. It adds current collection mode for **new** browsers,
same-filter counts for the other dataset, signup attempts/events and distinct browsers,
and current confirmed/pending email counts for attributed created accounts. No auth row,
trigger, dataset setting or historical event changes. No email/IDs are returned. The UI
supports both old/new report shapes and offers an explicit alternate-dataset query, never
silently switching datasets or relabelling records. No-data/errors stay distinct.

## Hosted gate and exact remaining steps

1. Complete secure read-only management access, then run
   `scripts/sql/campaign-analytics-readonly-audit.sql` separately on staging and production.
   It returns aggregates/definition hashes/grants, no personal records/cron command secrets.
   Stop if dependencies differ; compare actual definitions/migration names, including
   source-to-hosted timestamp mapping. Never db push historical files.
2. Inspect deployed collector bundle/config, logs with categorical errors only, admin/RLS
   denials and the retention job's most recent actual result. Confirm both datasets with
   the real internal admin. Restrict permission checks to existing authorized identities.
3. Rehearse the one new report migration against an isolated current staging snapshot;
   apply to staging only after dependencies, source hash and existing definitions match.
   No collector redeploy is needed for this frontend/report-only correction.
4. Staging QA must first verify collection is test. Use a new isolated browser and an
   explicit campaign code `qa_analytics_20261020`, accept, visit DJ/Agency, click signup
   and submit only via an existing approved controlled QA identity. Confirm network ack,
   exactly one persisted event/key and matching test report. Repeat deny and filters;
   denied browser must leave no optional identifier/event. No real account/email/enquiry
   is authorized by this audit merely to fill the funnel. Preserve existing acceptance.
5. Confirm the UI renders **actual hosted** aggregates, created vs pending/confirmed,
   permission-negative cases, withdrawal and retention. Local fixtures do not close this.
6. Production migration/frontend deployment and enabling live collection require separate
   explicit approval. Do not move existing test/history to live. Mode controls new visitor
   cohorts; old test browser identities remain test until their lifecycle ends. Retest a
   new browser after an approved activation. Do not invent attribution lost in the past.

## Instagram verification after approved activation

Use `https://cuebooker.com/?utm_source=instagram&utm_medium=social&utm_campaign=launch2026`.
Choose a fresh browser context, check no collector before consent, then Accept. Confirm a
single page_view with allowed UTM codes and accepted:true (not just HTTP200). Check CTA
signup_click and signup form submission signup_started separately. An Auth error or
existing-account obfuscated response must not become another persisted registration.
In the restricted panel use an inclusive UTC range containing today, the verified dataset,
utm_source instagram and utm_campaign launch2026; leave destination source empty for Home
entries. Read total events vs distinct browsers vs accounts/workspaces separately. Confirm
the server-created account fact only via a scoped real QA signup if explicitly authorized.

Additional privacy finding: `public_booking_open` passed the public artist slug to GTM.
That field is removed; the event keeps only its categorical preview flag. Profile and
booking functionality are untouched. This respects the existing analytics contract's
explicit exclusion of public slugs; no broader booking instrumentation rewrite is included.

## Environment matrix at the audit checkpoint

| Item | Production | Stable staging |
| --- | --- | --- |
| Served frontend target | production project, Beta0.0.14 deployment recorded | staging project, exact served SHA not independently established |
| Collector currently reachable | GET405 / OPTIONS204 | GET405 / OPTIONS204 |
| Report RPC currently exists | anonymous401/42501 | anonymous401/42501 |
| Original campaign migration | release execution records hosted20261017080043, source hash5587649f… | acceptance records hosted20261016174815, same source hash |
| Current dataset/counts | not authenticated; last release evidence test | not authenticated; last acceptance evidence test |
| Exact current deployed Edge source/version | pending authenticated retrieval | pending authenticated retrieval |
| Natural retention result/admin's current grants | pending authenticated check | pending authenticated check |
| New report-diagnostics migration | prepared only, not applied | prepared only, not applied |

Read the dataset row as **unverified now**, not a current database query. Public endpoint
existence cannot establish source parity, retention health, event persistence or admin access.

Rollback for this bounded correction: preserve the currently deployed report definition
and grants before staging replacement. Restore that one definition from the captured
pre-change source if needed and revert frontend revision; optional fields are backward
compatible. Do not delete events/cohorts, change Auth, or relabel datasets. No collector
source change is needed by this correction.

## Validation actually completed

- Baseline from current main:626 tests pass. Final candidate:632 pass,0 failures/skips.
  New tests cover HTTP503, network rejection, accepted:false, malformed acknowledgement,
  invalid JSON and acknowledged success. Errors neither leak response/PII nor retry or
  block the existing signup metadata path.
- Final static production build/generate:44 routes, client/server compilation succeeds.
- Actual foundation + new report replacement in isolated PGlite:58 assertions pass,
  including original consent/RLS/admin/dedup/filter/retention and workspace-cardinality
  checks, test/live mismatch diagnostics, same-filter other-dataset counts and current
  confirmation changes without duplicating registration. Explicit minimal dependencies,
  not an actual Supabase snapshot or full hosted migration rehearsal.
- Compiled public suite24 language/theme/390/1440 cases,24 Axe scans with no violations.
- Compiled Agency and DJ local journeys → actual local PostgreSQL facts → actual panel:
  16 panel states,16 Axe scans with no violations. Test/live query does not activate
  collection, no-data vs error/admin denial, old-report compatibility, optional signup
  metadata cleanup and actual Reject-button no-identifier/no-event cases pass.
  Auth/onboarding transport is a local artificial fixture; no hosted signup occurred.
- Two illustrative **local fixture** screenshots accompany this report. They do not
  show real production/staging data and do not establish campaign collection works there.
- Deployed production emission probe passes Accept/Reject and UTM/CTA checks with all
  collector calls intercepted. TLS verification retained via verified curl transport;
  browser uses Chromium, not Microsoft Edge. Source:check-served-emission.cjs.
- `git diff --check` passes. No typecheck/lint script is exposed by package.json; no
  separate typecheck/lint success is claimed. Hosted Edge source/SQL/readiness checks,
  actual staging events/panel and administrator acceptance remain pending access.


## Release execution checkpoint

PR122 merged with owner publication authorization as6e6c42734e8236c0c5af6bce2c8551a1872619d6 / Beta0.0.15; reviewed tree identical. CI647 tests/build and preview pass; main CI/Pages pass. Immutable preview8d4397b4 passes actual served Accept/Reject and one view/CTA with collector intercepted (no hosted facts). Backend workflow39441670259 staging job118692839053 SUCCESS: actual migration+ledger and restricted existing-admin RPC verified, anonymous gate denied; current collection test,29testevents,0liveevents,6steps,attempts/confirmation metadata present. Production job awaits protected owner review; no production backend change yet. Production frontend must follow backend verification at same SHA, not before. No unrelated PR promotion or production event/account seeding.
