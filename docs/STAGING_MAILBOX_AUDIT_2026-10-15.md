# Staging mailbox reconciliation, 15 October 2026

Scope: PR96 `feature/agency-multi-artist-beta`, baseline `3251d035d2ad65c2ca1a60ee3af9da77a43f5ee7`, project `lycprjeuuynfzwskycwv` (ACTIVE_HEALTHY). Beta 0.0.6 candidate. No production, merge, secrets, quota changes, paid service, automatic sending or historical-job replay.

## Inspected facts

- Baseline GitHub CI 38765702547 and PR preview 38765702529 succeeded. This session independently ran the baseline's 556 tests.
- Incoming v40 was already deployed, with all files matching the Codex candidate modulo trailing whitespace. Previous handoff's incoming v38/deployment-blocked statement was stale. Connected v52 and history v15 still bundled older shared Gmail/classifier modules.
- Retrieved complete rollback bundles for incoming, connected, history, recovery v2 and download v4 before modifying staging. Missing recovery/download implementations and attachment migrations were recovered from the deployed source/migration history, rather than invented.
- Private bucket has a 5 MiB limit and PDF/JPEG/PNG MIME allowlist. Three existing mailbox attachments, no private orphan objects at audit. Metadata RLS allows SELECT only to workspace members. Storage policies do not grant direct access to this bucket. Download authenticates, reads metadata using caller JWT/RLS, then signs for 60 seconds.
- Both connected Gmail records had matching consent/watch revisions. One watch was ready/unexpired; another was marked ready but had expired on 12 October. Both existing minute crons active. No watch, cron, credential or consent was changed.
- At 16:30Z: 66 failed jobs (six classified by failure phase), seven booking jobs, one pending. Historical failures remain untouched. Counts are observations, not promises about an active queue.
- One currently connected mailbox has reached 100/100 internal monthly analysis attempts. The configured app cap is 1000; this is a Cuebooker database guard, not evidence of Groq quota exhaustion. Limits were not increased. New unlinked enquiries on that mailbox cannot complete classification until the budget is legitimately available. Logs previously classified this error as unknown; the candidate now allowlists its safe category.

## Compatibility/security fixes

The old `attachment_source_required` constraint required XOR between email_message_id and mailbox provenance. Codex writes both, correctly binding the document to the exact inbound conversation. That write was impossible under the hosted constraint.

Migration `20261015163315_bind_mailbox_attachment_email_and_permissions.sql` permits both representations, retains existing rows, and verifies the inbound message's workspace, booking, provider namespace and provider message ID when both are supplied. Existing unique indexes still prevent duplicates by email/index, mailbox/message/index and storage path. It also revokes client TRUNCATE and other prototype grants; RLS alone does not protect TRUNCATE. Authenticated users retain SELECT via membership RLS, the backend retains INSERT/SELECT. Applied only to staging under the same recorded migration version.

The two historical attachment migrations are exact copies of staging migration statements. Do not reapply them to staging. The diagnostics migration's deployed version is 20261015141541 while the historical repository file uses 20261015165000; the definitions match, and this audit does not replay it. Many earlier repo/deployed migration timestamps also differ, so never blindly `db push` this historical chain.

Recovery keeps its explicit operator/user invocation and original-booking scope. It now uses caller booking RLS before privileged lookups, repeats current processor/revision/cutover/editor/requester checks before provider/storage/metadata work, validates complete signatures and exact byte size using the shared validator, and binds email_message_id. A 409 is treated as already stored only after verifying the exact scoped metadata. No classification, booking creation or automatic retry occurs. The original recovery endpoint still selects the initial completed booking job; it is not a durable retry system for all reply attachments.

## Validation

- Full suite: 559 passing tests, including real-handler mocks for initial/reply attachment handling, partial failures, revocation, manual recovery and signed download. These mocks do not establish live Gmail delivery.
- Nuxt build: 40 prerendered routes. Deno checks: all five mailbox/document entrypoints passed. No typecheck script exists. Whitespace check passed.
- Staging transaction, fully rolled back: inserted a correctly dual-bound fixture, rejected a mismatched message, rejected duplicate index, asserted client TRUNCATE/INSERT denied. Subsequent authenticated outsider queries returned zero metadata and zero bucket objects. No actual file content or mail was read by these SQL tests.
- Security advisors report no attachment-specific warnings. Existing findings concern 17 service-only RLS tables without client policies, five authenticated SECURITY DEFINER analytics/quota APIs and disabled leaked-password protection. They are not newly introduced by this change. Review each API body before deciding its grants are unsafe. Performance advisors were inspected; fresh unused indexes are not removed.

## Remaining acceptance and rollback

A live PDF/image enquiry and document-bearing reply must still prove one booking, exact conversation/metadata/object binding and notifications in DJ and agency workflows. The exhausted mailbox budget blocks a fresh AI classification there; an expired watch on the other connection is a separate health issue. Do not bulk-retry failed mail or raise limits to make a test appear successful.

Partial failures produce explicit worker outcomes and safe logs, not a durable retry queue/UI incident state. Private orphan reconciliation remains a release gate even though none existed at audit. Signed URLs already issued remain usable until their 60-second expiry. Revocation checks around external writes are not one atomic transaction.

Rollback: restore the retrieved prior dependency-complete bundles with their original JWT settings if needed. Leave the additive compatibility/security migration in place, as old sources accept it. Reinstating the XOR constraint would reject newly dual-bound rows and requires a separate reviewed data migration. Preserve new documents. Do not deploy or merge to production from this audit.
