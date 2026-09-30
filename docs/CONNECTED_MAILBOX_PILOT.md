# Connected mailbox pilot

Date: 2026-09-30. Branch: feature/agency-multi-artist-beta. Preview/staging only.

## Current truth

Public contact email is metadata. The existing Brevo send/reply integration supports Booking conversations, but does not connect an existing mailbox or ingest new requests from it. No mailbox is connected. Staging migration `20260930151101_connected_mailbox_auth.sql` and `connected-mailbox` v1 are deployed. The connection lifecycle is implemented; message review/import/reply is a subsequent block, not implemented here.

The user offered three privately owned accounts covering custom-domain IMAP, Google and Microsoft. Do not persist these real addresses in demo fixtures, tests or public repository documentation. Ownership permission covers a pilot; consent to a new mailbox data processor remains a separate decision.

## Proposed integration

Use Nylas Hosted Authentication as a single provider adapter for Google, Microsoft and supported IMAP servers. The user approved Nylas for this pilot on 2026-09-30. The service is not activated. Its current sandbox advertises five connected accounts, sufficient for three pilot accounts; production terms/pricing require a separate decision. References:

- https://www.nylas.com/pricing/
- https://developer.nylas.com/docs/v3/auth/hosted-oauth-apikey/
- https://developer.nylas.com/docs/v3/auth/imap/
- https://developer.nylas.com/docs/provider-guides/imap/

Cuebooker must disclose that Nylas receives access to the mailbox under the authorized scopes. Provider credentials are entered in the hosted authentication flow, never in chat or Cuebooker browser storage. API credentials and grant IDs remain server-side. An application, callback registration, provider connectors and server secrets are required before a real connection can start. IMAP compatibility is verified against the actual host; do not promise support for every email address.

## User flow

Settings contains a shared Connected email section for DJ and Agency. A connection belongs to the connecting user and chosen workspace. Other workspace members do not receive access to a personal inbox. Only messages explicitly attached to a Booking become shared under existing workspace permissions.

1. Enter mailbox address and choose Connect; disclose provider access before redirect.
2. Complete hosted authentication and return to the same workspace.
3. Show connected address and real provider status, including reconnect/disconnect states.
4. Select the folder or label to review, initially a dedicated pilot folder when supported.
5. Review an incoming message and explicitly create or associate a Booking; choose the artist for Agency.
6. Reply through that mailbox and associate further messages with the same Booking.

No fake connected state, automatic conversion of every message, silent sharing of personal inboxes or public publishing of the sign-in address. Existing Brevo behavior stays available until the own-mailbox path is validated.

## Server invariants

- Validate Supabase identity and active workspace membership on each operation.
- Bind OAuth state to actor, workspace and intended address, store a hash, expire quickly and consume once. Validate callback address and fresh membership before saving a connection.
- Use fixed allowlisted callback/return URLs; do not accept arbitrary redirects.
- Store provider capabilities privately, with no anonymous/client grant access. Scope mailbox reads and disconnect to the owning actor.
- Deduplicate imported messages by connection and provider message ID; associate threads using provider IDs, not subject alone.
- Render untrusted mail as safe text; do not load tracking pixels or log message bodies/tokens.
- Revalidate access when importing into Booking Core. Use existing transactional booking commands rather than a second booking model.
- Separate outbound provider delivery from database writes, preserving delivery status and retry safety.

## Acceptance tests

For each of the three providers: connect with explicit user consent, verify the account identity, review a purpose-written test request, create a single Booking, assign an artist when appropriate, reply from the connected account, receive its next reply in the same conversation, retry ingestion without duplicates, disconnect and verify access stops.

Also reject a reused/expired OAuth state, account mismatch, foreign-workspace access, former member and cross-user mailbox read. Check revoked permissions and reconnect behavior. Verify desktop and 390 px layout, keyboard access and useful disconnected/error states.

No test mail has been sent. Real email sending requires an explicit pilot action with agreed content and recipient. Production remains untouched.

## Next step

Nylas pilot processor approval was obtained. The dashboard currently requires account registration or sign-in. The Nylas dashboard is signed in; its free sandbox application has Google, Microsoft and IMAP enabled. The observed application is in the US region. Its Client ID is `317c4281-1ef0-47ca-85c3-16e9bc243932`. A Cuebooker callback is prepared but not saved, and the server credential is not configured. Complete those settings, then validate the implemented connection lifecycle with real accounts before adding message review/import/reply. Do not label the pilot ready until real provider tests pass.

## Staging activation settings

Register the Web callback `https://lycprjeuuynfzwskycwv.supabase.co/functions/v1/connected-mailbox` in Nylas. Configure these secrets on staging Supabase only:

- `NYLAS_API_KEY`: server-only Nylas sandbox API credential, never commit or paste in chat.
- `NYLAS_CLIENT_ID`: the sandbox application ID above.
- `NYLAS_API_URI`: `https://api.us.nylas.com`, matching the observed application region.
- `CUEBOOKER_MAILBOX_RETURN_URL`: `https://pr-96.cuebooker-staging.pages.dev/workspace/`.
- `CUEBOOKER_MAILBOX_ENABLED`: `true`, only after callback and credential setup.

POST requests validate the real Supabase user and active operating membership. GET callbacks only return an authorization code in the URL fragment; completion requires a POST from the initiating authenticated user and workspace. Browser code clears the fragment before submitting it. State hashes expire in ten minutes and are atomically deleted with actor/workspace predicates. Grant capabilities are service-only tables, RLS enabled with no client policies/grants. The two new informational no-policy advisor notices are intentional deny-by-default. A callback mismatch or provider exchange followed by DB failure can leave an unbound Nylas grant; inspect/revoke it in the sandbox before retrying. One provider grant cannot be bound across multiple user/workspace connections in this first pilot.

Current validation: 339 local tests, static generation of 38 routes; staging rollback smoke checks client denial, server permissions, foreign actor denial and state replay denial. Hosted provider authentication, status/reconnect/disconnect and 390 px visual checks are pending. Existing Brevo email routing is unchanged.
