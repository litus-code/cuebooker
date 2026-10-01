# Mailbox classifier evaluation and beta consumption limits

1 October 2026. PR96 preview/staging only.

## Current consumption gate

Website mailbox classification reserves a database attempt before Groq transmission. Defaults are 100 attempts per connected mailbox and 1,000 for the application per UTC calendar month. The operator can lower either service-only setting to zero to pause analysis. A singleton lock serializes reservations across tenants. Failed, timed-out, unfinished and repeated provider attempts consume allowance; there is no automatic refund or retry. Duplicate reservation IDs cannot authorize another call. Reads/imports/replies are outside this analysis gate.

These are attempt caps, not a dollar billing limit. A batch may contain up to 20 messages. Input is bounded per message by the provider adapter (300 subject characters, 2,500 body characters sent to AI); output limits are 2,400 tokens for batch classification and 3,600 for selected-email extraction. Provider reasoning, shared account usage, changed rates and other applications affect billing. No paid plan or new provider account is created here.

`mailbox_ai_attempts` records outcome, timestamps and optional prompt/completion token counts. It never stores email text, subject, attachment, recipient, provider error text or model output. Only the service role can access settings/attempts or reserve/complete RPCs. RPCs recheck operating membership and connection ownership. A completion write failure leaves the reservation counted, logs a fixed category and preserves a valid proposal. Missing usage stays unknown. Deleting a workspace/connection clears those references while preserving the global usage count.

Staging rollback tests verified per-connection/app exhaustion, duplicate reservation refusal, failed-attempt consumption, immutable completion, previous-month isolation, operator pause, foreign actor refusal and denial of client table/RPC access. Live Agency analysis of the known synthetic test mail reserved/completed exactly one attempt, recording 817 input and 878 output tokens. It proposed details without saving or confirming the booking. This single success is not an accuracy estimate.

## Synthetic evaluation

`scripts/mailbox-evaluation-cases.ts` contains 18 fictional labelled messages: direct enquiries, negotiation, English/Catalan, newsletters, ticket sales, invoice, account alert, recruitment, spam, ambiguity and prompt injection. Five selected-message cases check extracted fields, including an absent year, overnight hours, multiple artists, signature phone and quoted old conditions. The scorer reports missing/duplicate/unknown IDs, category mismatches, false positives/negatives and strict expected-field mismatches. Strict textual matching can flag harmless spelling/format variants for review.

Dry run (no model call):

```sh
node --experimental-strip-types scripts/evaluate-mailbox-classifier.ts
```

Optional operator run, only when GROQ_API_KEY is securely present in that operator's environment:

```sh
node --experimental-strip-types scripts/evaluate-mailbox-classifier.ts --live
```

The script only sends its fictional corpus to the configured existing Groq model. It never reads a mailbox, fetches Supabase secrets or creates/updates a booking. It makes at most six provider calls and stops on the first provider/validation failure, with no automatic retry. It outputs metrics/case IDs and token totals, without credentials. Standalone operator calls are outside the website ledger and count toward the same provider account. Dry run and scorer tests passed; the complete corpus has not been run against Groq and no model-quality percentage is claimed.

## Before automatic intake

Proposed interpretation of user direction, 1 October: allowlist the connected mailboxes explicitly authorized for background AI, rather than restricting enquiries to known senders. A new promoter must remain eligible. Connecting a mailbox alone is not background AI consent. Background processing requires active owned connection, valid workspace membership, explicit consent for the current processor and available allowance. Scope analysis to newly received messages in those authorized mailboxes; do not reanalyze old history on refresh or repeated provider delivery. Outbound mail and obvious provider spam/trash should not enter the detection path. Verify actual folder metadata/provider event support during implementation.

Replies to an already linked thread should sync directly to that booking through the existing deterministic path without reclassifying the conversation. Extracting proposed changed conditions remains separately reviewed. Use provider event/message IDs and tenant/connection scope for deduplication; retry delivery must not spend another AI attempt. This is the proposed target design, not an enabled background feature. The cache below is implemented; background opt-in storage and webhook/job processing remain pending.

Run the corpus against the live model, inspect false positives and uncertain cases, expand it using consented/redacted examples, and measure usage. Add durable event/job deduplication, background consent and an authenticated idempotent webhook/job path before automatic detection/import. Category results must not confirm/reject/cancel, create holds or send a reply. Production remains unchanged.

## Reuse of validated proposals

Migration `20261001120319_mailbox_ai_result_cache.sql` and connected-mailbox v18 add edge-only `mailbox_ai_results`. Results are scoped to owned connection, provider message ID, classification/extraction mode, SHA-256 of effective bounded classifier input and explicit model/prompt version. Hits are revalidated, usable for 24 hours and require the same explicit Groq consent. Mixed batches send only misses; a complete hit bypasses the minute gate and monthly reservation. Fresh booking conditions/version are always fetched, never cached. Failed or invalid model responses are not saved. Storage failures stop this path without automatic AI retries. Existing minute gate limits concurrent misses; this is not a durable provider-event job deduplicator.

Unlike the content-free usage ledger, this private cache stores derived reason and proposed fields, potentially including a contact phone, but no raw email body or subject. RLS is enabled and anon/authenticated have no table grants. One latest row per connection/message/mode is upserted. Expired rows are inaccessible to reuse and pruned on this mailbox's next successful analysis write; expiry is not a guarantee of physical deletion after 24 hours. Connection deletion cascades. No background mailbox authorization or automatic booking action is enabled.

## Background authorization preparation

Migration `20261001131151_mailbox_background_consent.sql` adds per-owned-connection permission, processor version, fresh-message cutover and revision. All existing/new connections default to disabled. The service-only invoker command checks operating membership and owner, locks the connection, preserves cutover/revision on repeated consent, clears them on withdrawal and starts fresh after reauthorization. A trigger withdraws permission when the grant, connected_at or connection status changes. No message content is stored by this permission control.

connected-mailbox v19 status returns only safe permission metadata. Authenticated `background` withdrawal works even when provider configuration is disabled and makes no provider/AI call. Activation returns `mailbox_background_unavailable` because the server availability gate is hardcoded false until the incoming processor is implemented and evaluated. There is no operator switch that silently enables this unfinished flow. Settings shared by DJ/Agency explain preparation inside each mailbox's detection details and allow withdrawing any saved authorization. No activate button is presented yet. Explicit manual Groq analysis is unchanged.

Staging rollback tests verified disabled defaults, idempotence, processor refusal, foreign actor denial, withdrawal, fresh revision/cutover after reauthorization, reconnect/disconnect withdrawal and denial of anon/authenticated RPC access. 391 local tests and 38-route generation passed. Edge v19 is ACTIVE. An authorized mailbox alone remains insufficient: the future job must recheck membership, connected status, current processor permission/revision and cutover before transmission; deduplicate provider events/messages durably; skip outbound/spam/trash; sync linked-thread replies without reclassification; and preserve review of proposed booking changes. None of that processing is enabled by this block.
