# Cuebooker — Adjuntos de email en Booking Core
Updated: 2026-10-14
Status: implementation design / NOT production-ready

## Audit of current code
- `supabase/functions/ingest-booking-email/index.ts` authenticates Brevo via `x-cuebooker-webhook-secret`; accepts `items[]`, finds an existing outbound `reply_token`, validates the sender and writes only message text into `ingest_booking_email_message` RPC.
- Therefore this endpoint is **reply threading**, not ingestion of new booking opportunities for allowlisted inboxes. Without a reply token an email is ignored. Do not use this webhook to create a new Booking.
- The existing ingest RPC is idempotent using provider + provider message id, per `docs/BOOKING_EMAIL_THREADING_STATUS.md`. Attachment processing must have **its own retry safety** and must not break the current text/activity path.
- `app/domain/booking.ts` includes a demonstration attachment interface; it is not proof of a persisted, secure upload path.
- `docs/BOOKING_INGRESS_PRODUCT.md` section 20 already specifies private storage, validation, authenticated access and retention as future work.

## Two separate integrations
1. **Existing conversation reply:** a reply to an existing Booking includes safe attachments, linked to its persisted `email_messages.id` and `booking_id`. No new Booking.
2. **New inbound offer (Smart Email Capture / private beta):** from an authorised and allowlisted mailbox, classify mail first; on a possible offer create/reuse the Booking once, then attach documents. Unrelated email must not create a Booking or files in the Booking namespace. This adapter needs separate code and tests, not an opportunistic change to reply-threading.

## Storage contract for first implementation
- Private Supabase Storage bucket `booking-email-attachments`, never public.
- A relation such as `booking_email_attachments` with: id, workspace_id, booking_id, email_message_id, provider, provider_message_id, provider_attachment_id or deterministic index, filename_display, sanitized_path, reported_mime, detected_mime, bytes, sha256, created_at.
- Enforce foreign keys and workspace membership authorization. If an attachment is linked to a message, verify that the message and booking belong to the same workspace (prefer service-role RPC).
- Unique key for retries: provider + provider_message_id + provider_attachment_id or, if the provider lacks attachment IDs, a stable ordinal plus sha256. Storage path generated server-side from workspace/message identifiers and a random object ID; never use a raw filename as object path.
- Per-item size and per-message total size caps; allowlisted PDF, JPEG, PNG, plain text and DOCX only after checking actual bytes/MIME; reject executables, unsafe formats, and suspicious content. Decide and test precise limits with real Brevo payload samples.
- The webhook must never publicly expose file URLs, raw bytes, or untrusted content in logs. Downloads only via short-lived authenticated signed URLs, with workspace member permission checks.
- Failures must be visible in a safe status: e.g. `pending`, `stored`, `rejected`, `failed`; avoid claiming an email's documents were attached if upload failed.
- Define retention, deletion, quota, archived Booking handling, and malware scanning before production availability.

## Before coding the provider adapter
- Capture a **redacted Brevo inbound sample with an attachment** to establish if attachments arrive as inline base64, provider-hosted URLs, or metadata only. Do not guess the payload contract.
- Audit the existing email_messages/Booking Core schema, member roles and RLS; choose a migration and RPC design.
- Confirm if Smart Email Capture allowlisted inbox ingestion actually exists separately in the beta environment; the inspected `ingest-booking-email` is for threaded replies.
- Test: valid PDF/image; oversize; MIME spoofing; zero-byte; provider retry; multiple attachments; untrusted sender; cross-workspace denial; signed URL expiry; partial failure and retry; incoming email not classified as an offer.
- Keep the current webhook 200/500 idempotency behaviour intact, and do not block plain-text booking replies just because one attachment cannot be stored.

## UI and rollout
- In Booking Core Activity display linked attachments with filename, size and type, status, secure view/download.
- Distinguish file metadata from verified availability. Existing landing email attachment visual is a conceptual demonstration and must not claim production availability.
- Stage migration -> deploy function -> test real Brevo email roundtrip -> limited beta allowlist -> production rollout by approval.
- No production secrets, bucket creation, deployment or merge without explicit review.
