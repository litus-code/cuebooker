# Private email beta admission

Task 1, 4 October 2026. Owner approved implementation of the admission step only. Gmail OAuth/Watch/reauthorization is Task 2; the deterministic pre-AI filter is Task 3. Existing Nylas connections remain intact. Approval does not prove that the new Gmail adapter works.

## User flow

Settings offers an email-beta request for a verified Cuebooker account with a mailbox-managing workspace role. Requests store the intended Google address and UI language. Saved states are pending, approved and rejected. A legacy capacity-waitlist row without an address is not an admission request.

The server enforces approval and exact requested email during OAuth reserve, claim and completion. The UI is only a presentation layer. Admission survives connection completion. Workspace changes clear local state and ignore responses from the previous workspace. Existing connections and their separately authorized AI settings are preserved.

## Operator review

First add the requested address to the Google project's Testing audience. Then use the staging Supabase Dashboard Edge Function tester for `mailbox-beta-admin`, with privileged service authentication entered privately, never in the browser app, repository or chat. A normal user, workspace admin JWT or publishable key cannot review requests.

Body for approval, substituting IDs from `mailbox_beta_waitlist`:

```json
{"action":"review","workspaceId":"WORKSPACE_UUID","userId":"AUTH_USER_UUID","status":"approved","googleTestUserAdded":true}
```

For rejection use the same action/IDs and `"status":"rejected"`. The server refuses approval without the explicit Google-audience confirmation. Approval does not add a Google test user automatically. Rejection blocks new OAuth attempts and cancels queued notices; it does not silently disconnect an existing mailbox. A rejected request cannot be reopened through the normal review operation. Address changes need an operator-reviewed correction; they cannot bypass the audience check through the public API.

Prefer this review endpoint to editing the status column directly: it validates current membership and dispatches the saved notice. Database status changes also create an outbox entry but do not by themselves make an external HTTP call.

## Notifications

Request and approval notices are captured transactionally in `mailbox_beta_notifications`, inaccessible to browser roles. Request notices go to the configured operator; approvals go to the verified Cuebooker account address, rather than an arbitrary address supplied by a caller. Instructions explain the unverified test-app warning and seven-day reauthorization, and distinguish connection from AI consent. Copy says Google connection will be usable when enabled, since Task 2 is not implemented yet.

Privately configure Edge secrets `BREVO_API_KEY`, `CUEBOOKER_FROM_EMAIL`, `CUEBOOKER_BETA_ADMIN_EMAIL`, `CUEBOOKER_MAILBOX_RETURN_URL` and `CUEBOOKER_BETA_NOTIFICATIONS_ENABLED=true`. Sender/domain must be accepted by Brevo. The return URL must match the environment allowlist. Missing configuration leaves the notice queued and preserves the request/review. On 4 October the owner supplied the administrator recipient privately. The recipient and enable flag were saved in staging; the queue was empty before activation. Existing sender/API values contain surrounding whitespace, so the notification helper now trims configuration values before validating/sending.

One fixed-content staging test was accepted by Brevo and its statistics API reported delivered at 13:57:33 Europe/Madrid. This validates notification transport to the owner-selected administrator, not Gmail connection or a real applicant's approval journey. No applicant was created or approved. Manual `scripts/mailbox-beta-notification-preflight.ts` is deployed only in staging as `mailbox-beta-notification-preflight` v3. It requires exact privileged platform authentication, rejects production, accepts no caller-selected recipient, uses fixed test copy/idempotency and returns only redacted delivery events for the configured administrator. Invoke `send-test` only for an authorized test; use `delivery` with its returned message ID to check delivery without resending. The diagnostic is not part of the production rollout.

The privileged endpoint supports `{"action":"notify","notificationId":"NOTIFICATION_UUID"}` and `{"action":"drain"}`. Drain processes up to ten queued database IDs in creation order, never a caller-specified recipient. An authenticated operator or privately configured scheduler/webhook must invoke it for queued notices and SQL-only approvals. No periodic drain/webhook has been installed yet. Do not claim automatic delivery of SQL-only changes until that hook and real delivery have been verified.

Atomic claims prevent duplicate concurrent sends. Brevo receives an idempotency header. API acceptance is recorded as sent, not proof of inbox delivery. Failed, uncertain and interrupted sending states require operator inspection and are not automatically resent; this avoids duplicate mail after an ambiguous timeout.

## Deployment and evidence

Staging project `lycprjeuuynfzwskycwv`: applied migrations `20261004111828_mailbox_beta_access_approval.sql` and `20261004112859_mailbox_beta_verified_account_read.sql`; connected-mailbox v33 and mailbox-beta-admin v4 active after notification-format correction. Both authenticate inside the handler. Real unauthenticated HTTP requests returned 401 before any operation.

The second migration grants service_role only the three Auth columns needed to verify identity. It grants no browser access or password-field read. New RPCs use invoker privileges with empty search_path and explicit client revocations.

474 local tests pass, including endpoint authorization, notification recipient binding, bounded outbox processing, UI workspace races, fail-closed admission, configuration whitespace and privileged staging-only notification diagnostics. The staging SQL smoke ran in a transaction and rolled back: membership, verified accounts, duplicate requests/claims, Google confirmation, email binding, reserve/claim/complete, retained admission and rejection checks passed. No fictional requests or in-flight notices remained. Security advisors gained only the expected informational RLS-with-no-client-policy entry; existing warnings remained unchanged. Static generation passed for the UI implementation; this follow-up only changes server notification formatting, diagnostics and docs. Authenticated mobile visual review remains pending. Notification transport delivery is verified; actual applicant approval end-to-end is not claimed.

Release migration manifest now contains 28 files. The earlier isolated 26-file rehearsal does not validate this expanded candidate. Repeat the full rehearsal before production. Production, stable staging web, provider subscriptions and recurring spend were not changed. Candidate remains Beta 0.0.2, pending release.
