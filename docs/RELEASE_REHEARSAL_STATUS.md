# Corrected campaign RPC privilege rehearsal pin, 16 October 2026

Run38932556643 attempt4/job117106725063 proved the updated secure connection works: read-only current staging export, temporary encrypted snapshot, disconnected logical restore, all COPY counts/FK/RLS/unidentified-caller denial and cleanup passed. Exact original campaign SQL executed locally and its preserved-count/domain-definition checks passed; campaign acceptance then FAILED at service-only RPC privileges. No hosted analytics SQL/Edge/cron or production operation occurred. No further credential change is needed.

Read-only catalog and a synthetic regression identified an owner-default difference: supabase_admin directly grants public-function EXECUTE to anon/authenticated/service_role by default, whereas hosted postgres defaults differ. Original prepared RPC SQL revoked PUBLIC only. PR114 now explicitly revokes PUBLIC, anon and authenticated for collector/withdrawal, retaining service_role. The adversarial-default SQL regression fails on the old SQL; corrected source passes49 SQL assertions,599 unit tests, static build44 routes and whitespace locally. These are separate from actual full corrected staging rehearsal, still pending.

This bounded infrastructure-only change repins checkout/runner/test to immutable corrected candidate `7111f156aefa09dfab8cad721422607460d9c4be` and SQL SHA256 `5587649f6725d3de8e50d9882f19f2980c53f00965079dd7219caeb54cdde000`. Only four existing maintenance files change: workflow, runner source/hash constants, matching source-pin assertion, this status document. Main-only/manual/staging guard, exact project/TLS, read-only export, isolation, permissions, encryption/cleanup, no uploads and production restore defaults remain unchanged. Existing exact push exclusions already cover all four files; this merge alone cannot publish application/stable staging assets.

Six focused restore/rehearsal regressions must pass, plus PR CI on final head. Owner authorization for this new bounded infrastructure integration remains separate from the previous PR116 merge. After approval, dispatch a NEW Isolated Staging Campaign Rehearsal on main with confirm cuebooker-staging-campaign. Re-running old38932556643 still uses old source and cannot validate the correction. Record actual run/job/source/result before hosted staging analytics apply. PR114/application release/production remain separate and unmerged.

---

# Current-staging campaign rehearsal preparation, 16 October 2026

Production logical backup restore run38893078933/job116947026773 PASSED on main `bd22cd35c1624bf49c64a284d0ff2fa8d7283d02`. Import, all COPY counts, FK, RLS, unidentified-caller denial and cleanup passed. That result does not establish campaign compatibility with current staging.

This separate infrastructure change prepares a manual, main-only, staging-environment job. It exports current staging `lycprjeuuynfzwskycwv` read-only (roles/schema/COPY data), creates an AES256 encrypted temporary archive using a random per-job passphrase, removes plaintext exports, and invokes the existing disconnected PostgreSQL17 restore runner. No snapshot artifact is uploaded. The temporary directory is removed on success/failure. Production restore defaults and its existing workflow remain unchanged; accepted restore source/version pairs are explicitly bounded.

The candidate checkout is immutable `69172db62772a0f294482d4c9f92f4fb94edf6dd`, Beta0.0.13. The runner verifies the SHA256 of the exact prepared campaign migration before export. Only the disposable database receives this SQL. Checks cover protected operational/Auth/event counts, unchanged pre-existing domain function definitions, foreign keys, campaign RLS/client denial, service-only write RPCs, default test dataset, denied direct client event insertion and non-admin reporting denial. Existing 43 synthetic SQL assertions remain separate evidence. This runner does not establish hosted Edge/cron/browser acceptance, tenant role journeys, complete production reconciliation, Storage bytes or provider configuration. No historical migration chain is replayed.

Secure prerequisite: GitHub environment `staging` must provide `CUEBOOKER_STAGING_DB_URL`, targeting only this staging project via direct connection or session pooler port5432. The runner enforces sslmode=verify-full and sslrootcert=system. Supply credentials only through GitHub secure settings, never chat, repository files or workflow logs. The current session could not inspect protected secret configuration; the secret's presence is unverified. No secret or environment protection was changed.

Local verification: six focused safety regressions, full main-based suite325/325, static build34 routes and whitespace check pass. These numbers describe this infrastructure branch, not PR114's separate599-test/44-route candidate. GitHub CI must also pass on the final revision. No staging snapshot/export/restore or hosted analytics apply has run. To register the new workflow requires a separate owner-approved bounded infrastructure merge. Exact CI/Pages push exclusions prevent this infrastructure-only integration from publishing application assets or stable staging. PR validation stays enabled, mixed application changes still trigger normal publication. PR114 remains draft and unmerged.

After approved infrastructure integration and secure connection configuration: dispatch Isolated Staging Campaign Rehearsal on main with confirm `cuebooker-staging-campaign`; complete existing environment review if required. Record exact run/job/source/result here and in PR114 HANDOFF. Stop on any export/import/compatibility failure. Only a passing actual rehearsal allows the already-authorized staging-only analytics migration, full Edge bundle and retention/test-dataset acceptance block. Production backend/application deployment remains a separate decision.

---

# Current backup restore preparation, 16 October 2026

The production DB export run38889098646/attempt1 completed successfully after owner environment approval. Job116933969537 passed export, AES256 encryption, byte-for-byte decrypt roundtrip and encrypted-only upload. Artifact12041757362, name `cuebooker-production-db-38889098646-1`, ZIP digest `sha256:862f232b473e32391d74f69fa32fc2ee2a234569dc11ce814e8f5796667dfe2a`, expires2026-10-23T11:07:25Z. Export implementation mainSHA `bbdf29122f704039b353fa4eed788bfdfef5aaa7`. This is not yet a restore result.

This bounded infrastructure change repins the Isolated Backup Restore Drill from the old October4 artifact to this exact run/name. Its main-only guard, explicit confirmation, protected production environment, read-only GitHub permissions, pinned actions/CLI, disconnected local PostgreSQL17 target and cleanup remain unchanged. No hosted DB connection is passed to the restore job. The Python restore implementation is unchanged. The test decrypts only inside an isolated disposable job; no data archive is committed.

The existing restore safety regression is repinned to the same current run/name; no guard assertions are removed. Exact infrastructure paths are excluded from main CI push and GitHub Pages push so this maintenance-only merge does not publish application assets or trigger stable staging. Mixed commits containing application paths still trigger normal CI/Pages. PR CI and manual workflow dispatch remain enabled. This does not authorize a merge; the owner must approve the bounded infrastructure PR separately. PR114 remains draft and untouched by this infrastructure branch.

After merge: run Isolated Backup Restore Drill on main with confirm `cuebooker-isolated-restore`, review its protected environment gate, then record run/job/revision and actual import/count/FK/RLS/denial/cleanup results. Never use the old frozen30-migration rehearsal as proof of the Beta0.0.13 delta. The separate current-staging snapshot/analytics rehearsal remains pending. DB backup excludes Storage object bytes and platform/provider configuration. No production application/backend migration or deployment is performed by this workflow change.

---

# Isolated 30-migration rehearsal

4 October 2026. Infrastructure-only update from main ee623d796680888ada26c2a871d44715fd9be0e5. The existing runner covers 26 older migrations; this update pins candidate 83774ef4722d859b80654be13cebc53b60aebcd9 and checks 30 exact hashes, protected record counts, foreign keys, service-table client denial and both paused schedulers.

No application source, hosted migrations or Edge deployment is included. The approved encrypted artifact remains run37169429138/attempt2. The disposable PostgreSQL17 container is disconnected before decryption, emits no private rows and is removed afterward. The production environment is used only to access its existing backup decryption secret. No hosted database connection is configured.

Five local source/hash/parser tests pass in the feature checkout. The main-based PR retains the two synthetic rehearsal tests because candidate migrations are checked out separately only during the manual workflow. Full isolated execution remains pending. CI push ignores only these exact infrastructure files so merging this update alone cannot start the CI-to-stable-staging deployment. Pull-request CI remains enabled; application changes continue to trigger normal CI.

After merging the bounded infrastructure PR: Actions > Isolated Release Migration Rehearsal > Run workflow on main, confirm cuebooker-isolated-release. Record run/job/revision and result here before production promotion. Do not merge PR96 to register or run this workflow.
