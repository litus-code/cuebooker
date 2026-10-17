# Production email setup, release gate

4 October 2026. Production backend qlocooqfdzehogbwcbhr now has owner-entered BREVO_API_KEY and the four reviewed sender/domain/origin settings (saved 4 October 2026, verified by name and timestamp only). Do not copy sandbox provider grants, mailbox contents or staging worker credentials into production. Supabase Auth SMTP settings are separate from Edge delivery.

Owner enters provider credentials directly in Supabase production Edge Functions > Secrets, never chat/source/logs. Owner created a credential named Cuebooker producción in Brevo and saved BREVO_API_KEY directly; the agent verified saved metadata only. Next private-entry step is production webhook authentication, starting with CUEBOOKER_INBOUND_WEBHOOK_SECRET. Agent does not invent, extract, rotate or paste credentials.

| Capability | Server configuration | Review before enabling |
| --- | --- | --- |
| Platform delivery | BREVO_API_KEY; CUEBOOKER_FROM_EMAIL=bookings@cuebooker.com; CUEBOOKER_FROM_NAME=Cuebooker; CUEBOOKER_REPLY_DOMAIN=reply.cuebooker.com; CUEBOOKER_APP_ORIGIN=https://cuebooker.com | Verify sender and reply-domain/provider routing actually target production; a staging webhook does not deliver to prod |
| Platform callbacks | CUEBOOKER_INBOUND_WEBHOOK_SECRET; BREVO_TRANSACTIONAL_WEBHOOK_SECRET | Owner-generated provider secrets and exact production callback registrations; no unsigned ingestion |
| Personal mailbox | NYLAS_API_KEY; NYLAS_CLIENT_ID; NYLAS_API_URI matching provider region; CUEBOOKER_MAILBOX_RETURN_URL=https://cuebooker.com/workspace/ | Separate appropriate production provider app/access decision. Register production connected-mailbox callback; preserve scopes and separate owner opt-in. Do not buy or accept terms automatically |
| Classification | GROQ_API_KEY | Provider/account approval and budget/quality controls. Missing configuration disables analysis |
| Background intake | NYLAS_WEBHOOK_SECRET; MAILBOX_WORKER_SECRET; Vault worker URL/token | Register signed callback, verify scheduler/consent/model gates. Do not disclose/decrypt Vault keys |
| Activation flags | CUEBOOKER_MAILBOX_ENABLED; CUEBOOKER_MAILBOX_BACKGROUND_ENABLED | Keep false until corresponding configuration/live verification passes. New cron job stays paused |

Backends still need the 26 exact migrations in scripts/release-migration-manifest.json and production functions. Their isolated compatibility rehearsal37171742277 passed; it does not activate providers. Standard delivery functions, public artist/form/follow-up, agency enquiry and mailbox handlers must be reviewed/deployed as one backend plan; synthetic evaluation helpers are staging-only. After rollout, verify no unauthorized access, then staged frontend behavior and the exact reviewed production revision. No frontend-only release claim.

Nylas official support describes free Sandbox as initial testing/development, maximum five grants; paid production is a separate service decision. Do not assume the current staging sandbox credential is production-ready or promise unlimited/free production service. Source: https://support.nylas.com/hc/en-us/articles/28841692494877-Nylas-Sandbox-vs-Production-Applications-Understanding-Limitations . No subscription/contract has been made.
