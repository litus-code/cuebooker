## 2026-10-17 15:43 Europe/Madrid / Production beta admission notifications enabled

Owner explicitly authorized automatic request/approval mail and queued notices. Verified bounded production recipients against waitlist and confirmed auth.users email: both existing notices belong to owner's verified litulandio@gmail.com account. Using Supabase Dashboard, saved CUEBOOKER_BETA_ADMIN_EMAIL=litulandio@gmail.com and CUEBOOKER_BETA_NOTIFICATIONS_ENABLED=true; saved-name/digest/timestamp confirmation at13:40:54Z. Existing Brevo sender/API and all other gates preserved; no credential values read.

Invoked existing mailbox-beta-admin through Dashboard Test using its managed secret-key header, without extracting the credential, body {"action":"drain"}. HTTP200, processed2, outcomes unchanged/sent. Database confirms obsolete requested notice cancelled (already approved) and approval notice sent/accepted at13:43:01Z. Acceptance is not inbox delivery confirmation. New user waitlist requests dispatch directly from connected-mailbox, and reviews through mailbox-beta-admin dispatch approvals. No periodic outbox drain installed; SQL-only approvals or temporary configuration/provider failures still need privileged inspection/drain. Uncertain/failed sends are not automatically retried. Do not duplicate the completed owner approval.

Production web remains Beta0.0.14. Owner also confirmed Passport403 gone and browser console clean at15:38. Notification neutral-retry UI remains unpublished local WIP. No app or Edge deployment during this activation.

undefined