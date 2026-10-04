# Isolated 30-migration rehearsal

4 October 2026. Infrastructure-only update from main ee623d796680888ada26c2a871d44715fd9be0e5. The existing runner covers 26 older migrations; this update pins candidate 83774ef4722d859b80654be13cebc53b60aebcd9 and checks 30 exact hashes, protected record counts, foreign keys, service-table client denial and both paused schedulers.

No application source, hosted migrations or Edge deployment is included. The approved encrypted artifact remains run37169429138/attempt2. The disposable PostgreSQL17 container is disconnected before decryption, emits no private rows and is removed afterward. The production environment is used only to access its existing backup decryption secret. No hosted database connection is configured.

Five local source/hash/parser tests pass in the feature checkout. The main-based PR retains the two synthetic rehearsal tests because candidate migrations are checked out separately only during the manual workflow. Full isolated execution remains pending. CI push ignores only these exact infrastructure files so merging this update alone cannot start the CI-to-stable-staging deployment. Pull-request CI remains enabled; application changes continue to trigger normal CI.

After merging the bounded infrastructure PR: Actions > Isolated Release Migration Rehearsal > Run workflow on main, confirm cuebooker-isolated-release. Record run/job/revision and result here before production promotion. Do not merge PR96 to register or run this workflow.
