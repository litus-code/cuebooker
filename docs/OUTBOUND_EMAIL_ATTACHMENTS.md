# Attach documents when replying from Cuebooker

15 October 2026. PR96, Beta0.0.9. Staging only. Current implementation/evidence in HANDOFF.md; earlier rollout records below are historical.

## User flow

Open the booking conversation, write the reply, select **Adjuntar archivos / Attach files**, review the chosen files and remove any unwanted file, then explicitly select **Enviar email / Send email**. Sent documents appear in the booking's existing private attachment list after the conversation refresh. Selection alone performs no upload or send. Files stay in memory and reset when the workspace/booking changes, on successful delivery or when the component is unmounted. An uncertain delivery retains the selection and blocks another send until the user checks their mailbox.

An accessible clickable info icon beside Attach files lists supported formats and the selected transport’s actual limits. It works with touch and keyboard; Escape closes it and restores focus. PDF, PNG and JPG/JPEG only. Maximum5 files and5MiB aggregate for Gmail/Brevo; legacy Nylas JSON transport is limited to2MiB aggregate so its encoded request remains below3MB. Client and server enforce file extension/MIME agreement, exact declared/decoded byte count, full PDF/PNG/JPEG signature, canonical base64, safe filename and aggregate/count caps. Actual JSON request streams are capped at8MiB. No URLs or arbitrary Storage paths accepted from the client. No attachment data goes to Groq, analytics or logs.

Gmail sends multipart/mixed MIME with encoded file names and unchanged original subject, threadId, In-Reply-To and References. Brevo receives its documented attachment array; Nylas receives filename/content_type/content. The original mailbox remains mandatory for existing connected-mailbox threads, including server enforcement on the platform fallback.

## Access, persistence and failure behavior

Connected sends keep their pre-existing request ledger. Platform sends accept a client request UUID as the unique outbound email row ID before calling Brevo. Repeating a claimed request cannot send it again. Both routes recheck workspace editor membership and booking access before provider delivery; connected sends also recheck the owned connection. Client network/invalid acknowledgement failures are uncertain, not an invitation to retry automatically. No automatic outgoing email was sent by the agent.

After provider acknowledgement, the system ingests/updates the outbound email and stores copies in the existing private bucket using deterministic `workspace/outgoing/email_message/index` paths. Metadata links the exact outbound email, booking and workspace. RLS and signed download endpoint remain unchanged. The server rechecks authorization around file uploads/metadata writes. Persistence failure returns `status:sent` with an explicit pending count and a UI message explaining that the email went out but some history copies are unavailable. It never resends the message. A private orphan is possible if consent/membership changes or metadata fails after upload; durable reconciliation remains a broader release gate. The recipient receives the provider copy independently from the history copy.

Migration `20261015172641_outbound_booking_email_attachments.sql` extends the existing invoker trigger from inbound-only to inbound/outbound conversation messages. It preserves workspace/booking/provider binding, unique indexes, RLS, private bucket and existing client grant restrictions. Applied only to staging. No new table or bucket and no row deletion/backfill. SQL rollback smoke verifies both inbound and outbound metadata, wrong-booking/duplicate rejection and outsider denial.

## Validation and limitations

567 tests pass, including actual connected-mailbox and platform Edge handlers with explicit mocked auth/database/provider/Storage boundaries. Cases cover viewer/foreign-mailbox/archive denial, invalid files before ledger/provider calls, exact MIME bytes/threading, success, partial history storage failure, ambiguous delivery and duplicate request denial. The compiled Vue component test covers select/remove, real File encoding, success cleanup, context switch during file read and uncertain-send blocking. Client tests verify network uncertainty and no retry.

Build prerenders40 routes. Five affected entrypoints pass Deno checks. Security advisors remain unchanged after the migration. No live outbound delivery/recipient-open or real mobile/Safari claim: local Playwright rendering was attempted but Chromium download repeatedly returned truncated archives. Template compilation and mounted Vue interaction tests passed; visual390px/desktop, ES/EN and light/dark acceptance still need the actual preview.

Primary contracts checked: https://developers.google.com/workspace/gmail/api/guides/sending · https://developers.brevo.com/reference/send-transac-email · https://developer.nylas.com/docs/cookbook/email/attachments/send-attachments/

## Rollout and rollback

Baseline aa773720ec689b761e91fe6af7973d93d7a08dde matches the retrieved staging connected53/send39 sources. Prior incoming41/history16/recovery3 bundles were also retrieved before deployment. Deploy dependency-complete connected/send bundles plus shared-library consumers to lycprjeuuynfzwskycwv only, preserving JWT settings. Check source identity and unauthenticated denial. PR96 remains draft/unmerged; stable-staging frontend and production are separate decisions.

Rollback to the baseline source bundles if needed. Keep the compatible migration and already stored files; reverting the trigger to inbound-only would prevent new outgoing history copies. No quota, secret, consent, scheduler or paid-service change in this block.

Next acceptance: owner uses PR96 to reply from Cuebooker on the already-created test booking with a new PDF/image, verifies recipient receives the attachment, and the reply and private file remain in the same conversation. Then test inbound reply, signed download and DJ/agency operations. Do not send email on the owner's behalf just to satisfy a gate.

## Published staging evidence

Implementation SHA `4ac10b0c58edd6a0539e4dae42c8bea458c87af1`. GitHub CI2202/run38777815097 and PR preview2676/run38777815050 completed successfully. No stable frontend or production promotion. All five retrieved deployed bundles and their transitive files match the code revision; JWT settings preserved. Anonymous live POST returns401 on every endpoint.

- connected-mailbox: v54, verify_jwt=false, bundle SHA256 cf10b14fe495da12043a7b208f5278d368022e220e9853e6e8c5e0d018243410.
- send-booking-email: v40, verify_jwt=true, bundle SHA256 4d8bfa1a885f2449d1236563fa48f0f319b1a764b500387156c689b9732e67f5.
- process-mailbox-incoming: v42, verify_jwt=false, bundle SHA256 289a9e38a6ca1c8e0dd5664a9eb3d2d5dd803a89b225501fb1d50990414e20ec.
- process-gmail-history: v17, verify_jwt=false, bundle SHA256 18db089e55f23312aef0f8216b143236d8ecdee84d2e2ac32645d38fbd5133dd.
- recover-mailbox-attachments: v4, verify_jwt=true, bundle SHA256 de4213c67518dc9d2ada34847799a8bc42f4bfdeba3969799370eab4f48cd103.

Migration20261015172641 is present in staging history. Inbound/outbound fixture metadata, wrong-booking rejection, uniqueness and outsider metadata/Storage denial passed in a rolled-back transaction. Existing security advisor findings unchanged. Live outgoing delivery/recipient-open and visual mobile/Safari remain pending owner acceptance. There was no agent-originated real send or paid-service/secret/limit/consent/cron/production change. This evidence-only revision keeps Beta0.0.7 and does not change deployed sources.

## Beta0.0.8 notices and owner acceptance

Implementation `f7e193aa5f86728d04d56b2b5ef7df2dcf34a607` adds persistent inbound attachment diagnostics via staging migration20261015183107. Unsupported formats, oversized files, invalid bytes and save failures appear in the conversation even with no saved documents; successful exact-index recovery hides the resolved warning. Only fixed codes/index/optional WebP label are stored, with repeated authorization and exact message/workspace/booking/account binding. Worker and manual sync record these warnings without reclassification or new bookings. This is best-effort diagnostics, not durable recovery. Received help describes ten files per message,5MiB per file. No WebP support or size-limit increase was added.

Owner's real Cuebooker outgoing reply stored a1654338-byte PNG on the original booking at17:46:44Z and was reported working. Incoming WebP reply synced to that same booking, skipped one unsupported file and completed18:21:03Z with no new booking/additional AI usage. Its confirmed negative-format test now has the corresponding persistent notice. No provider fetch, email sending or job replay was used for this notice. Recipient-open/signed-download detail, supported-file inbound reply and mobile/Safari visual acceptance remain open.

571 tests,40-route build,3 affected Deno entrypoints and bounded-column rollback SQL passed. Incoming43/connected55/recovery5 source/dependencies and retained JWT flags verified; all three unauthenticated POSTs return401. No stable frontend promotion, production or merge.

Implementation CI2204/run38786592560 and PR preview2678/run38786592747 SUCCESS. PR preview https://pr-96.cuebooker-staging.pages.dev; stable frontend deployment skipped. This evidence-only documentation revision does not change application sources or the Beta0.0.8 version.

## Beta0.0.9 message placement

Documents and rejection notices now render beneath the originating email, using the exact activity metadata email_message_id and file email_message_id. The accumulated conversation-wide list is removed. Attachment-only messages remain visible. Historical unlinked documents stay available under an explicit Files without a linked message fallback; no filename/date guessing. Downloads use the existing private endpoint; composer info/limits remain.573 tests and40-route build pass. Frontend-only release: staging backend/schema/Storage/AI/provider behavior unchanged. Owner's supported PNG reply capture/storage acceptance passed; browser signed-download and mobile/Safari acceptance remain open.
