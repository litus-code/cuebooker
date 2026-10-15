# Cuebooker Beta: release readiness

Status: **NOT READY FOR PRODUCTION** (15 October 2026). Work on PR #96 and staging only.

## Verified
- CI runs unit tests and Nuxt generation. Preview builds do not replace manual end-to-end tests.
- The attachment writer targets a private bucket with a 5 MiB application limit. Hosted bucket configuration/RLS and uniqueness require re-inspection: their migration is missing from this checkout.
- The repository diagnostics migration supports safe failure phases, never full provider exceptions. Hosted application/version is historical context until re-inspected.
- Production workflow requires a fixed full commit SHA and reruns tests.

## Release blockers
- [ ] Diagnose and resolve live incoming email failures (59 failed jobs at audit).
- [ ] Prove newly received PDFs/images save automatically to the original booking.
- [ ] Verify safe handling of uncertain failures without replay or duplicate bookings.
- [ ] Test DJ and agency request, conversation, hold, confirmation, calendar, notifications, public pages.
- [ ] Verify Google OAuth expiry, permissions, disconnect, privacy and data retention.
- [ ] Reconcile staging and target SQL/Edge Function versions before release.
- [ ] Complete mobile/Safari acceptance and ES/EN/light/dark QA.
- [ ] Make and verify a fresh backup and rollback rehearsal.

## Release procedure
Freeze one candidate SHA, require green CI, check the gates, back up, obtain explicit owner approval, deploy compatible backend first, then promote the same reviewed frontend revision. Smoke-test real flows and roll back on failure.

The marketing design PR #112 remains separate and requires integration review before the combined website/application launch.

## 15 October continuation: local candidate, hosted verification blocked

- 542 baseline tests passed at `316fc06d`; its GitHub CI and preview were successful.
- Candidate: schema-only one-time fallback with an explicit JSON contract and strict local validation; safe bad-request telemetry. Named inline Gmail files and linked-reply attachments supported; MIME/size verification, current consent/membership/message binding, existing-file checks and explicit partial outcomes added.
- 556 tests pass, Nuxt build prerenders 40 routes, and Deno checks affected consumers. The integration test runs the actual Edge handler against mocked Gmail/Groq/REST/SQL/storage; it does not establish hosted RLS/concurrency, delivery or real provider recovery.
- **No authenticated Supabase access in this session.** Current job counts, incoming v38, flags and diagnostics migration application cannot be reverified. No backend deployment was performed.
- **Missing source dependency:** attachment table/bucket migration and recovery/download Edge implementations are referenced but absent. Reconcile deployed definitions, RLS/unique constraints, signed-link ownership and private orphan cleanup before deploying this candidate. Do not invent a replacement schema.
- Partial failures are observable in worker outcomes/logs, but no durable attachment retry queue or UI incident state is added. Keep the attachment recovery/reconciliation gate open.
- All release blockers above remain open until actual staging acceptance; no historical failed jobs were retried. See GMAIL_PRIVATE_BETA.md for the exact dependency and live acceptance sequence.
