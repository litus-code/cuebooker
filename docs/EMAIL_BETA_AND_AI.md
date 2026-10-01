# Email beta and AI decisions

Date: 1 October 2026 (Europe/Madrid). PR #96, preview/staging only.

## Product and access

Email connection is optional for DJ and Agency. Public form requests and platform-email replies remain usable without a connected mailbox, subject to the existing contact-email and delivery configuration requirements. Brevo owns that existing platform delivery path; Nylas connects the user's existing mailbox. An already imported mailbox thread still requires its original mailbox/owner to reply in the same thread, rather than silently switching sender.

Shared user-facing notice in marketing and Settings: free access during beta, limited places, later a paid plan, notice before changes and no automatic charging. This block adds no payment or billing machinery. Current cap is FIVE globally because Essentials has not been purchased. Operator can raise it to TEN after confirming purchase and actual provider account quota. No per-user promise of ten free mailboxes. These are connection slots, not a lifetime user count.

Settings uses the same component for DJ/Agency: enter an email, click Connect and authorize securely. Known Gmail/Microsoft consumer domains route directly. Custom domains use the Nylas server-side detection endpoint with a narrow allowlist. If detection yields no supported provider, select where the email is accessed; IMAP can require an app password/server details in the hosted flow. Do not promise email-only authentication for every provider. Cuebooker never collects passwords.

Connections remain personal to the actor/workspace, not delegated to all agency agents. Attached Booking conversations follow existing workspace sharing. Shared-mailbox delegation is not implemented.

## Capacity and waitlist

Migration `20260930225159_mailbox_beta_capacity.sql`: service-only settings and waitlist with RLS/no client grants, invoker RPC restricted to service_role and fresh operating-membership checks. A singleton row lock serializes reservations and completion. Active connection tuples plus unexpired OAuth reservations count toward capacity. Reservation lasts ten minutes; completion claims it once and preserves the place during exchange. Duplicate waitlist registration is idempotent; successful connection removes that actor/workspace's waitlist entry. No automatic invitations/emails or paid activation. The UI only exposes availability and the current actor's waitlist state, never other accounts or global addresses.

The cap governs grants initiated through this backend. It is not a provider billing hard limit: grants created directly in Nylas, orphaned grants after interrupted provider auth, other applications and provider billing rules need operator reconciliation. Lowering quota does not revoke active connections. Review Nylas usage before increasing capacity and do not assume deletion instantly cancels all charges.

## AI, current truth

Actual adapter remains OpenAI Responses, `gpt-4.1-mini`, `store:false`; Groq/Qwen/GPT-OSS are researched alternatives, not connected. Two purpose-written test analyses failed HTTP429; rate limit vs credit exhaustion is not distinguished. No measured live classification accuracy or automatic detection success.

Diagnostics update (1 October): subsequent explicit OpenAI error codes distinguish `insufficient_quota` from `rate_limit_exceeded`; an unknown 429 remains unavailable. Log only numeric status and fixed categories, never provider message/body or private content. No automatic retry. Historical failures remain undiagnosed because those codes were not recorded, and no new live analysis has been attempted. Mailbox errors now distinguish storage/provider/request timeouts with allowlisted operation names. Settings shows an unverified check instead of claiming activation is pending after a failed request, and provides a manual status retry.

Analysis requires explicit opt-in before mailbox retrieval/transmission. Batch: up to twenty messages from the recent seven-day selection. Single-message mode: only that exact ID. Request includes provider message ID, subject and first 2,500 body characters. Address fields and attachments are excluded, but subject/body can contain personal information; do not describe this as anonymized. Output is booking/review/other plus a short reason. Parser validates exact IDs/categories. `store:false` is a request setting, not a guarantee of zero provider retention. Provider/account data terms must be confirmed separately.

UI already names OpenAI in the analysis consent. Settings also explains analysis, fallibility and review. AI does not send messages or make booking decisions. User creates/imports explicitly and assigns artist when necessary. Form intake/platform replies do not require this mailbox classifier. Background webhooks, automatic imports, per-message classification caching and extracted date/venue/fee fields remain pending.

Current cost control: one analysis attempt per minute per connection; bounded input and 2,400 max output tokens per call. This is NOT a monthly spend cap or a guarantee of a specific token bill. Before expanded beta, implement monthly app/account budgets, recorded usage, retry limits, dedup/caching and disablement on exhaustion. Do not retry HTTP429 indefinitely. Any provider change requires updating disclosure/consent before sending private inbox content to it.

## Operating costs and decision

Public Nylas pricing checked 30 September 2026: Free five connected accounts; Essentials $15/month includes ten, +$2.25/additional; Pro monthly $49 includes twenty-five, +$2/additional. USD, tax excluded, subject to actual subscribed account terms. Cap remains five until Essentials activation, no contract created by this implementation.

Published Groq rates: GPT-OSS 20B $0.075/M input and $0.30/M output, production model; Qwen3.8-27B $0.80/M input and $4/M output, preview model. Free allowances are shared across the application organization, not per user. Under illustrative 1,000 input +100 output tokens/message and 100 analyzed messages/mailbox/month, 1,000 mailboxes would cost $10.50/month GPT-OSS or $120/month Qwen plus $1,999/month Nylas Pro list-rate projection. These are unmeasured estimates; model reasoning/retries/longer mail change usage. Hosting/database, verification, support and maintenance excluded. Validate quality on a labelled synthetic evaluation set before selecting a model.

Decision: controlled Nylas beta first, provider-independent Booking model, compare direct Gmail/Outlook connectors when recurring use and paid demand are measured. Do not build a mailbox hosting provider. Self-hosted AI requires separate compute/maintenance economics; no commitment here.

Sources: https://www.nylas.com/pricing/ ; https://console.groq.com/docs/models ; https://console.groq.com/docs/rate-limits ; https://developer.nylas.com/docs/reference/api/connectors-integrations/detect_provider_by_email/ ; https://developers.google.com/workspace/gmail/api/auth/scopes .

## Validation and next steps

361 local tests and 38-route static generation passed. CI and preview deployment passed for implementation `22afacbea71be01d0ec63f2ae80b8b471c77753e`. Authenticated Agency UI verified single email input, beta terms, AI disclosure and preserved connection. Final copy simplification is tracked in HANDOFF. Mobile390/custom-domain live detection remain pending. Staging rollback smoke passed global full-cap rejection, reservation counting, single-use claim, completion, waitlist dedup/removal, foreign actor rejection and denial of client table/RPC access. No persistent synthetic data/provider grants. Advisors show only two new intentional informational RLS/no-policy findings, no new warnings. Edge `connected-mailbox` v8 ACTIVE, custom authentication preserved. Browser review/published revision tracked in HANDOFF.

Next: confirm Essentials activation separately, reconcile provider grants before raising cap, validate Microsoft/custom-host detection and actual OAuth with explicitly approved test accounts, add measured AI evaluation and budget gates before enabling automatic capture. Production remains untouched.
