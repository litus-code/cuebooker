# Cuebooker Beta: release readiness

Status: **NOT READY FOR PRODUCTION** (15 October 2026). Work on PR #96 and staging only.

## Verified
- CI runs unit tests and Nuxt generation. Preview builds do not replace manual end-to-end tests.
- Private email attachments bucket with 5 MiB limit; metadata is protected by workspace RLS.
- New staging diagnostics record a safe failure phase, never full provider exceptions.
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
