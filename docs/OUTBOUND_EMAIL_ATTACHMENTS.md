# Attach documents when replying from Cuebooker

15 October 2026. PR96, Beta0.0.7. Staging only; owner prioritizes this operational path before another inbound-reply test.

## User flow

Open the booking conversation, write the reply, select **Adjuntar archivos / Attach files**, review the chosen files and remove any unwanted file, then explicitly select **Enviar email / Send email**. Sent documents appear in the booking's existing private attachment list after the conversation refresh. Selection alone performs no upload or send. Files stay in memory and reset when the workspace/booking changes, on successful delivery or when the component is unmounted. An uncertain delivery retains the selection and blocks another send until the user checks their mailbox.

PDF, PNG and JPG/JPEG only. Maximum5 files and5MiB aggregate for Gmail/Brevo; legacy Nylas JSON transport is limited to2MiB aggregate so its encoded request remains below3MB. Client and server enforce file extension/MIME agreement, exact declared/decoded byte count, full PDF/PNG/JPEG signature, canonical base64, safe filename and aggregate/count caps. Actual JSON request streams are capped at8MiB. No URLs or arbitrary Storage paths accepted from the client. No attachment data goes to Groq, analytics or logs.

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
