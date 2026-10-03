# Connected conversations product decision, 30 September 2026

The user approved a practical workflow: form/email/social enquiry -> existing Booking -> conversation and reply through original connected account. Promoter stays in their usual app. Form ingress remains supported; email is the primary response channel. A subject alone never identifies a thread. Channels may share one Booking, but their messages retain provider and channel identity; identities are never merged on display name alone.

## Pilot implemented

Private mailbox owner reviews recent messages and explicitly creates a request, choosing artist for Agency. The entire linked conversation becomes shared under workspace Booking permissions. Reply composer shows actual connected address. Sent/replies from that mailbox synchronize on opening/refreshing Booking; bounded polling is not a background webhook service. Notes stay internal. Manual WhatsApp/Instagram/phone capture is secondary and labelled manual, not a connected channel.

## Classification pilot implemented, activation requires consent

OpenAI Responses classifier (`gpt-4.1-mini`, `store:false`, strict JSON) processes up to 20 incoming messages with subject and a maximum 2,500 text characters each. Attachments and sender addresses are excluded from classifier input. User must explicitly authorize analysis in the pilot UI; server rejects missing consent before reading/transmitting for classification. One-minute atomic connection rate limit prevents repeated calls. Classification is booking/review/other, reason is evidence-based, output IDs/categories are validated. Mail is untrusted data, no tools/actions exposed. No real mailbox data sent to OpenAI by the agent. This is assisted detection, not autonomous import/background processing. All mail remains accessible as secondary pilot review, while default UI hides unrelated raw mail until requested.

## Agreed target, not yet implemented

Opt-in booking detection prepares/creates high-confidence new requests, with uncertain candidates reviewable and easy false-positive dismissal. Classification must understand conversation intent rather than keyword-only claims. No extra AI processor has received mailbox data in this block. Explicit analysis/privacy configuration is required before automatic conversion of personal mail to shared agency Booking. Agency requests with unknown artist should be unassigned; current Booking schema requires artist, so support needs a deliberate migration rather than fake artist records.

## Meta integrations

Instagram official messaging requires a professional Creator/Business account, permission grant, app review/appropriate access for customers and adherence to reply windows. WhatsApp requires Business Platform and business-number onboarding; Business app coexistence eligibility must be verified. Personal consumer accounts are not generally connectable through these official APIs. Do not implement browser scraping/unofficial personal-message bridges.

Actual inbound webhooks must verify signatures, deduplicate provider event/message IDs, map channel thread -> Booking, enforce account/workspace permissions and never auto-send. Outbound UI must explain any messaging-window restriction before submission. Costs, app/account setup, customer approvals, real provider tests and production deployment remain separate gates. Existing Nylas credential does not connect Meta.

## Acceptance

Purpose-written enquiry creates exactly one request. Reply comes from authorized real account and appears in original thread. Promoter reply and mailbox-app sent reply appear once in same Booking. New actor/workspace cannot read personal inbox; revoked member cannot sync/send; ambiguous send never blindly retries. Form-created request can initiate email through connected address. No automatic decisions/confirmations and no message deletion from source mailbox.
