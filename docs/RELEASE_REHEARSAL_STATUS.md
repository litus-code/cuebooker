## 2026-10-17 / Actual production SQL delta rehearsal PASSED

Owner approved ONLY infrastructure PR119 integration and a new isolated rehearsal.
PR119 squash-merged as main2259f28c152f8663ba825171294bc5a00b62061a.
Run[39009939881](https://github.com/litus-code/cuebooker/actions/runs/39009939881),
job117330153817, completed SUCCESS at2026-10-17T06:29:43Z after the normal protected
production environment review, without changing protection rules.

The exact encrypted backup38889098646/attempt1, artifact12041757362, digest
sha256:862f232b473e32391d74f69fa32fc2ee2a234569dc11ce814e8f5796667dfe2a,
restored into disconnected disposable PostgreSQL17. All COPY counts, FK/RLS and
unidentified-caller denial passed. Corrected input fingerprints passed without
requiring excluded hosted migration history. All39 checksum-pinned SQL files from
candidate9bd56509bb9aba2176b55483988df80c05b1fd6a executed successfully.

Post-migration assertions passed: protected record counts and FKs; unchanged
production-only Next Move/billing function and trigger definitions; service table
RLS/client denial; campaign service-only RPCs/private tables/test dataset; private
attachment bucket/metadata writes; paused mailbox/Gmail schedules; observer-disabling
transaction rollback with operational counts and production-only definitions intact.
Disposable database cleanup and all final workflow steps passed. No data archive was
uploaded. No hosted database, Edge Function, application or provider changed.

This supersedes the failed preflight run38977296261 and old October4/30-file evidence.
It proves the exact39-file SQL candidate against this exact backup, not Edge/provider/
Auth/Storage configuration or a hosted production deployment. Non-blocking workflow
annotation: pinned download-artifact action declares Node20 and GitHub forced Node24;
the download and every check passed. No protection was relaxed to address the warning.

PR114 remains draft/unmerged, Beta0.0.13. Next: complete current Edge rollback bundles,
candidate bundle/JWT settings reconciliation and provider/Auth/Storage deployment/
rollback inventory, then present the concrete production plan for separate approval.
No production publication is authorized by this result.

---

# Isolated 30-migration rehearsal

4 October 2026. Infrastructure-only update from main ee623d796680888ada26c2a871d44715fd9be0e5. The existing runner covers 26 older migrations; this update pins candidate 83774ef4722d859b80654be13cebc53b60aebcd9 and checks 30 exact hashes, protected record counts, foreign keys, service-table client denial and both paused schedulers.

No application source, hosted migrations or Edge deployment is included. The approved encrypted artifact remains run37169429138/attempt2. The disposable PostgreSQL17 container is disconnected before decryption, emits no private rows and is removed afterward. The production environment is used only to access its existing backup decryption secret. No hosted database connection is configured.

Five local source/hash/parser tests pass in the feature checkout. The main-based PR retains the two synthetic rehearsal tests because candidate migrations are checked out separately only during the manual workflow. Full isolated execution remains pending. CI push ignores only these exact infrastructure files so merging this update alone cannot start the CI-to-stable-staging deployment. Pull-request CI remains enabled; application changes continue to trigger normal CI.

After merging the bounded infrastructure PR: Actions > Isolated Release Migration Rehearsal > Run workflow on main, confirm cuebooker-isolated-release. Record run/job/revision and result here before production promotion. Do not merge PR96 to register or run this workflow.
