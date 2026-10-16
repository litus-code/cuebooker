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
