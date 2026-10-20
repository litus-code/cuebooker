# Production campaign analytics — protected Actions audit

20 October 2026. **Prepared, not executed. No production result claimed.**

Owner asks for an agent-run read-only audit using existing GitHub Actions credentials,
in an independent PR, with explicit authorization before execution. No new credentials,
secret changes, data writes, migration, Auth change, event injection, merge or deployment
is authorized by preparing this PR. Application stays Beta0.0.14; this is infrastructure,
not the Beta0.0.15 application correction in PR122.

## Verified access constraints

- Production environment API lists only branch `main` as allowed, plus required owner
  review. No setting is changed. A feature branch cannot access protected production
  secrets even if its workflow is otherwise valid.
- New `workflow_dispatch` workflows must be present on the default branch before GitHub
  registers them. This new file cannot be dispatched from an unmerged PR.
- Existing backup workflow references `CUEBOOKER_BACKUP_DB_URL` inside production and
  backup39014718244 succeeded17 October. Secret metadata listing returns403 to the
  integration, so current validity is not assumed. No attempt to extract its value.
- Prior Work sessions had a Supabase management connector; this session does not.
  This audit does not ask for another token or change that connection.

These restrictions mean **approval to run alone cannot make an unmerged branch run**.
The reviewed infrastructure PR first needs separate owner authorization for main
integration; no merge occurs during preparation. The normal environment gate remains.

## Proposed operation

Workflow `.github/workflows/audit-campaign-analytics.yml`:

- Manual dispatch only, contents:read, ubuntu24.04,10-minute job timeout.
- Requires main, confirmation `cuebooker-production-readonly`, and the exact reviewed
 40-character main SHA matching github.sha. Checkout pins that SHA and does not persist
 Git credentials. No arbitrary SQL, project, branch checkout or provider URL input.
- Uses the **existing** backup DB URL only in the protected audit step. No encryption
 passphrase, service-role key, new token or credentials in process arguments.
- Installs the PostgreSQL client before the secret-bearing step. The Python runner
 validates production project/direct-or-session endpoint/port/database. It strengthens
 TLS to verify-full with the system trust store plus the reviewed public Supabase CA;
 TLS failure stops rather than downgrades.
- Reuses the exact SQL from PR122 (`scripts/sql/campaign-analytics-readonly-audit.sql`,
 SHA256 a087fe4542211317bb84dd8a9a5bbd70d1f7c86c63510bb7330d07b10c01e073).
 It rejects a changed file before connecting. It wraps those eight fixed SELECTs as
 JSON aggregates and adds one fixed SELECT matching the panel's default UTC calendar
 window and consent join. No historical migration chain or DDL is run.
- Each snapshot is REPEATABLE READ / READ ONLY and explicitly rolls back. Session
 read-only defaults,15s statement timeout,2s lock timeout and a90s subprocess bound apply.
 No permanent database setting is modified. Child environment excludes unrelated secrets,
 PGSERVICE and caller-supplied connection options.
- Takes two snapshots10 seconds apart. Does not send visits, clicks, signup, mail or
 enquiries. Event arrivals can only be observed if they occur naturally.
- Captures psql output/errors privately. Only validated, allowlisted JSON aggregates,
 names, hashes, booleans and timestamps reach logs/job summary. No raw SQL/provider
 errors, connection URI, identifiers, campaign free text, emails, arguments, function
 bodies, cron commands or cron return_message are published. No raw artifact upload.
- Missing credential, auth/TLS/network/permission/schema/checksum/result-shape failure
 stops with a fixed diagnostic category. It never switches to another credential or
 changes grants/settings to make the audit pass.

## What the results can establish

1. Current collection setting for new browsers, test/live counts by event and latest
 timestamps, including page_view/signup_click/signup_started/signup_completed.
2. Same-window consented counts matching the default panel filters, alongside the
 original rolling30-day inventory. This avoids mistaking withdrawn/excluded records
 or window boundaries for panel-visible facts.
3. Instagram/social/launch2026 aggregate counts; known migration ledger entries,
 report/collector RPC source hashes/grants, private-table RLS/client privileges,
 number of internal admins and latest retention scheduler status.
4. Differences between snapshots may show natural arrivals or removal. They do not
 prove a specific new browser request traversed Edge and persisted, because this
 operation deliberately does not generate events. No natural change in10s is not a
 failed collector. The function's last persisted timestamp is evidence, not an end-to-end test.
5. Test facts with empty live/default-panel facts can establish a dataset mismatch.
 Empty facts in both sets require further collector/log/consent diagnosis. Facts in
 live with a zero panel require comparing actual selected filters/consent/admin RPC.
 A positive admin count does not prove a particular person's membership or browser access.

## Prevent unintended publications

This PR adds exact infrastructure-file exclusions to CI's **main push** trigger and
GitHub Pages' main push trigger. CI still runs for this PR. Matching exclusions prevent
the PR preview deployment for this infrastructure-only file set. Main CI therefore
does not automatically start stable-staging publication for this exact merge. Ordinary
application/SQL migration/package changes still trigger existing checks/publications.

Excluded files are this audit workflow/runner/SQL/tests/document, HANDOFF and the three
workflow files needed for the exclusions. No broad wildcard or application path is
excluded. Before any authorized merge, verify the actual changed-file set remains
within that list. Additional product changes invalidate this no-publication assurance.
PR122 application fixes/migration remain separate and must not be merged with this PR.

## Approval and execution procedure — not yet performed

1. Owner reviews the independent PR, including script, SQL checksum and publication
 exclusions, and explicitly authorizes infrastructure integration and read-only execution.
2. After green CI, merge only that reviewed infrastructure PR with an expected-head
 guard, if authorized. Confirm its diff is infrastructure-only and no application
 deployment workflow was triggered. Record the resulting exact main SHA and inspect
 audit-source hashes against the reviewed PR. Do not merge PR122 or change production version.
3. Dispatch `audit-campaign-analytics.yml` at main with confirm above and reviewed_sha
 equal to that exact main SHA. Preserve GitHub's protected production review. If API
 approval is403 or a required reviewer must act, report that concrete run/gate; do not
 weaken branch policies/reviewers or substitute another environment.
4. Inspect completed safe JSON/job summary; report counts, dataset, root-cause evidence
 and remaining uncertainty. A started job or a zero-exit local mock is not a production audit.

No dispatch or approval is requested through a different workflow, no Auth-sync or backup
is repurposed, and there is no attempt to run unreviewed branch code with production secrets.

## Local validation

Five new tests exercise production/SSL validation, fixed-query checksum, aggregate-only
output, secret-bearing failure suppression, manual/main/SHA/environment guards and exact
publication exclusions. Actual assembled SQL was exercised on isolated PGlite catalogs
using the existing analytics fixture and fake migration/cron metadata, then fed to the
real output sanitizer. This is a protocol/schema-shape test, not production access.
No actual psql/TLS connection from Actions has been tested before owner authorization.

## 20 October follow-up — first hosted attempt stopped at TLS

Owner authorized PR123 integration and audit execution. Main27cb953e0e14d4cc2af152039b8bab84b342124b
exactly matched reviewed53cea748. Run39429043605 passed checkout/client installation and,
after owner environment approval, stopped with `database_tls_verification_failed` before
SQL execution. No current dataset, event count or server authentication result is established.
Only the audit run was triggered; no application deployment occurred.

The original client trusted the system CAs only. This follow-up adds Supabase's public
Root2021 CA to an ephemeral **client-only** bundle alongside system CAs, keeps verify-full
and hostname verification and pins the public certificate SHA256 before any connection.
No secret, server trust store, production configuration or encryption downgrade is involved.
The bundle is deleted on success or error. This is a bounded trust-chain correction;
an actual hosted retry is required to confirm whether it resolves the observed failure.

Public authoritative download (retrieved over verified HTTPS):
https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

- Certificate subject/issuer: Supabase Root2021 CA, Supabase Inc (self-signed CA).
- Validity:28 April2021 through26 April2031.
- DER SHA256 fingerprint:807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa.
- Pinned PEM file SHA256:700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7.

OpenSSL verifies the public root signature; the Python TLS context loads that exact root
with certificate/hostname checks enabled. Tests cover modified-root refusal and cleanup
when execution fails. A non-authenticated TLS probe to a public example pooler from this
cloud machine was connection-refused, so no live handshake is claimed from local tests.
No credential-bearing connection was attempted locally. Existing production execution
must be retried on the reviewed new main SHA only after follow-up merge authorization,
retaining the normal production review gate. Original read-only SQL hash is unchanged.

## 20 October follow-up — native PostgreSQL JSON framing

Owner authorized PR124 integration/retry. Maina33d96159e3970ddc602b0f6e7146008361cbd84
exactly matched revieweda0dcd2ef. Corrected-TLS run39432510306 reached psql successfully
and returned exit0 after the first read-only batch. It then stopped with
`unexpected_audit_result_shape_no_raw_output_disclosed`. TLS, DB authentication and
SQL read access are therefore no longer the blocker. No raw output was published,
no second snapshot was reached and no product data was modified.

Reproduced reader defect: PostgreSQL `json_agg` of composite rows emits literal newlines
between objects. psql unaligned output preserves them. The runner incorrectly used one
json.loads per physical line. Earlier isolated tests converted PostgreSQL's parsed JSON
back to compact JSON, accidentally hiding its actual wire formatting. This is an audit
client defect, not evidence that campaign events are absent or Supabase returns bad data.

The reader now decodes consecutive complete JSON documents with normal JSON whitespace
handling. It still requires all9 sections in order, validates every emitted field and
rejects extra/truncated/garbage documents. Fixed categorical failure phases distinguish
JSON framing from settings/events/metadata shape errors without logging values/bodies.
The original SQL checksum, read-only transactions, CA/TLS, credentials and all gates are
unchanged. No collection setting is changed and no test events are sent.

Local confirmation uses the actual nine assembled PostgreSQL queries cast to text before
the driver can deserialize them. Native text reproduces failure with the old line reader
and passes the corrected reader/sanitizer. This is isolated PostgreSQL with artificial
schema/data, not a captured production response. New tests exercise multiline documents
through the mocked psql transport, trailing garbage, truncation, extra documents and safe
phase diagnostics. Real production dataset/counts remain unreported until a reviewed
new dispatch succeeds. A further merge/retry requires its own scoped authorization.


## 20 October: owner-authorized live activation — prepared, not applied

Successful audit39435561163 confirmed test collection. Owner confirms Pruebas is visible and explicitly requests live activation. The dedicated set-campaign-collection workflow uses existing protected credentials, main plus exact reviewed SHA and fixed live/test modes. It changes only the default new-browser cohort and schedules existing90-day purge daily03:17 UTC. Function hashes are pinned to the audited production definitions; conflicting cron fails before setting changes. No immediate purge or historical reclassification. Existing test browsers remain test; existing live browsers remain live on rollback. Retention scheduling is not evidence of a successful cleanup run.

This new workflow needs default-branch registration and normal protected-environment approval. No integration/deployment protection is weakened. Explicit prior no-main-merge instruction remains: obtain scoped authorization for this infrastructure PR before merge, then dispatch the already authorized live setting. Exact paths-ignore rules prevent application publication. Product stays Beta0.0.14 and PR122 remains separate. Reverting uses same workflow dataset=test, preserving facts and retention. If connection/result fails after commit, first re-audit to determine actual state.

Validation:638 unit tests pass; isolated PostgreSQL49 foundation checks plus exact SQL live/idempotence/test rollback/conflicting-job rollback pass. Local cron is a stand-in; no production setting or scheduler change has run yet. No new credential, personal information or synthetic production event used.
