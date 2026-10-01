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

Run the corpus against the live model, inspect false positives and uncertain cases, expand it using consented/redacted examples, and measure usage. Add per-message caching/deduplication, background consent and an authenticated idempotent webhook/job path before automatic detection/import. Category results must not confirm/reject/cancel, create holds or send a reply. Production remains unchanged.
