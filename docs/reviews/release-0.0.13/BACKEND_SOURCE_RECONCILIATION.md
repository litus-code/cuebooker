# Backend source reconciliation, 17 October 2026

PR114, Beta0.0.13, based on9c9bb5e32dd4b319fc3b138477c05103075184cc.
Production unchanged. No new SQL or configuration values.

The repository Brevo ingress omitted the attachment persistence already deployed in
staging v39. The candidate now restores that exact-message path, its existing explicit
feature flag, ten-position/5MiB PDF/JPEG/PNG limits and idempotent attachment lookup.
It keeps the original Booking/message even when an individual file fails. Redelivery
reuses the core message and can attempt only missing files. It is not a new retry queue.

Review tightened full eight-byte PNG signature validation, refuses redirects when
fetching a Brevo attachment with the provider credential, bounds that fetch with a
15-second timeout and allows only fixed failure codes in logs. Supabase/provider
response bodies and arbitrary exception text never enter logs. Existing webhook-secret
and expected-sender checks, private service-side writes and default-off flag remain.

Six real-handler fixture tests cover authenticated sender/feature gate, original-message
binding, duplicate redelivery, mixed-success file retry, declared/actual size limits,
unsupported MIME/false signatures, ten-file cap and private-error suppression. The new
tests fail the previous repository handler. They are local HTTP/SQL/Storage mocks, not
evidence of live Brevo delivery or a new hosted end-to-end acceptance.

The full Gmail event candidate has four files; the staged v15 bundle has an older
transitive helper and only three. It must be deployed with all files, retaining
verify_jwt=false and the handler's Google signature/audience/identity checks. No Gmail
flag, consent, provider account or production resource is activated by packaging.

The optional Nylas verifier's Uint8Array generic conflicted with WebCrypto BufferSource
under Deno2.9.6. Copy only the supplied byte view before verifying HMAC. A regression
checks valid padded subarray input and rejects modified bytes; signature/authentication
semantics remain intact. This legacy route stays conditional and is not activated.

615 application tests and13 focused Brevo/Nylas tests pass. Direct Deno checks pass for
the Gmail and Nylas handlers. Full checks use the official functions-js2.118.0 declaration
whose SHA256427921102ae314a45213a4f919fab835d94421661fcbdaba580406f35bfe5079
matches JSR registry metadata; normal Deno JSR dependency download is unavailable in
this environment. The local-only import map is not a production configuration change.
All18 exact candidate handlers now pass the complete check. The official declaration
requires openai types; openai4.104.0 was installed only in an isolated validation
directory to satisfy its declared ^4.52.5 range. Repository dependencies and deployed
imports remain unchanged. A public-enquiry locale union annotation fixes a pre-existing
type error; emitted JavaScript is identical before/after. CI remains pending.

Exact original staged ingress/Gmail source bundles are saved under staging-rollback
with per-file hashes and original JWT settings in production-edge-manifest.json.
No old bundle is overwritten until reviewed source CI passes. After staging deployment,
retrieve the complete actual sources again and compare every byte/JWT flag; test bad
webhook authentication without creating mail, Bookings or provider operations.

The passed39-file SQL delta and production-only preserved definitions are unchanged.
After this source block: finish production Gmail/Groq/worker private configuration and
Google/Brevo provider inspection, refresh pre-deploy backup/state, then obtain separate
production integration/deployment approval. Existing accepted user journeys stand.

## Actual result

Exact source df8b90f01c057b67a8a7529824de616ea34ee670 passed branch-only
CI39011862455/job117335909451:615 tests, zero failures and44 routes. All18 function
bundles pass the local full Deno check described above. All39 SQL hashes still match
the candidate that passed the isolated production-backup rehearsal.

Staging only: ingest-booking-email is now v40 (one exact source file), and
gmail-mailbox-events is v16 (all four exact candidate files). Both retain
verify_jwt=false and their existing handler authentication. Retrieved every deployed
source and compared bytes, including Supabase's single-file ingress path alias.
Empty unsigned POSTs return401/unauthorized_webhook and401/unauthorized respectively.
No user data, mail, Booking, provider operation, flag, consent, secret, Vault, cron or
production change occurred during these negative checks. This is not a new real
Brevo/Gmail roundtrip acceptance. Original staged bundles remain available for rollback.

Conditional Nylas type compatibility correction and public-enquiry type-only locale
annotation are in source; neither additional handler was deployed by this block.
The public-enquiry compiled JavaScript is unchanged. The exact staged ingress source
mismatch and Gmail missing-dependency findings are resolved.

Google Cloud console reports Site Unavailable in this browser. No sign-in, OAuth
client creation, Pub/Sub/IAM mutation or credential read was attempted. Production
Gmail/Groq/worker settings and external Google/Brevo checks therefore remain pending.
Use the owner's own Google session for the next production client inventory; never
paste credentials in chat or copy staging tokens/consent into production.
