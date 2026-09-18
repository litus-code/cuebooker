# Booking email threading status

Updated: 18 September 2026
Branch: `feature/app-visual-system`
Status: STAGING FOUNDATION DEPLOYED, OUTBOUND HTML VERIFIED IN CODE, REAL INBOUND ROUNDTRIP STILL PENDING

## Purpose

Email is an adapter into Booking Core, not a second source of truth. Outbound and inbound email events must resolve to the same Booking and become Activity without weakening workspace isolation or archived-booking semantics.

## Outbound

`supabase/functions/send-booking-email/index.ts`:

- requires a valid Supabase user JWT;
- independently checks workspace membership and an editor-capable role;
- rejects archived bookings;
- requires a contact linked to the booking with an email address;
- writes an outbound `email_messages` row before delivery;
- sends through Brevo;
- appends outbound Activity after confirmed delivery;
- uses the row `reply_token` to build a unique Reply-To address:

```text
booking+<reply_token>@<CUEBOOKER_REPLY_DOMAIN>
```

The function now fails closed with `email_reply_domain_not_configured` instead of sending an email whose reply cannot be routed.

Staging Edge Function: `send-booking-email` version 16, JWT verification enabled.

Direct booking emails now send both `htmlContent` and `textContent`. The HTML uses the Cuebooker dark/lime visual system through `_shared/bookingConversationEmailTemplate.ts`; plain text remains as the fallback.

## Inbound

`supabase/functions/ingest-booking-email/index.ts`:

- is an external provider webhook, so Supabase JWT verification is intentionally disabled;
- authenticates with `CUEBOOKER_INBOUND_WEBHOOK_SECRET`;
- accepts at most 50 provider items per invocation;
- extracts the Booking reply token from the recipient address;
- resolves the outbound thread;
- requires the inbound sender to equal the original outbound recipient;
- stores plain extracted text only, bounded to 20,000 characters;
- calls one transactional Postgres command instead of performing separate email and Activity writes.

Staging Edge Function: `ingest-booking-email` version 2.

## Atomic ingestion

Migration:

- `20260917110000_add_atomic_inbound_email_command.sql`

Command:

- `public.ingest_booking_email_message(...)`

The command is executable only by `service_role` and is idempotent on `(provider, provider_message_id)`.

A retry behaves as follows:

- if neither row exists, create `email_messages` and Activity;
- if the email exists and Activity exists, do nothing;
- if the email exists but Activity is missing, create only the missing Activity.

This avoids the previous failure mode where a provider retry could see an existing email and leave an orphan thread event with no Booking Activity.

## Archived booking semantics

An archived Booking remains read-only and is never automatically restored by an inbound email.

A trusted inbound provider email may still append one inbound email Activity because it represents an external event that happened after archive. The exception is restricted to `service_role`, email direction `inbound`, and provider-ingestion metadata. Normal authenticated users cannot append arbitrary Activity to archived bookings.

Validated on staging in a rollback transaction:

```text
email_created = true
activity_created = true
still_archived = true
inbound_activities = 1
```

## Service-role grants

Migration:

- `20260917110500_grant_booking_email_service_role.sql`

Booking Core tables were created with explicit authenticated grants, so `service_role` did not automatically have the SELECT/INSERT/UPDATE privileges required by the Edge Functions. This was detected by rollback testing rather than by UI behavior.

The migration grants only the provider-side capabilities currently required:

- SELECT: workspaces, workspace_members, contacts, bookings, booking_contacts;
- SELECT + INSERT + UPDATE: email_messages;
- SELECT + INSERT: activities.

No broad `GRANT ALL` was introduced.

## Idempotency validation

Validated on staging in a rollback transaction by invoking the same provider message twice:

```text
first_email_created = true
first_activity_created = true
second_email_created = false
second_activity_created = false
email_rows = 1
activity_rows = 1
```

No fixture data was retained.

## Security status

Current Supabase security advisor output contains no Booking Core schema warning. The remaining project-level warning is leaked-password protection being disabled in Supabase Auth.

Inbound email content is untrusted data. It is stored as text/metadata and must never be treated as instructions to an AI tool or privileged command.

## External configuration still required

The current tools cannot inspect or set Supabase project secrets, so these must be verified separately in staging:

- `BREVO_API_KEY`;
- `CUEBOOKER_FROM_EMAIL` / sender identity;
- `CUEBOOKER_REPLY_DOMAIN`;
- `CUEBOOKER_INBOUND_WEBHOOK_SECRET`.

The reply domain must also have the provider/DNS inbound-routing configuration required to send messages addressed to `booking+<uuid>@<domain>` into the `ingest-booking-email` webhook.

## Production gate for email threading

Do not market automatic reply threading as available and do not deploy this email path to production until a real staging roundtrip succeeds:

```text
Cuebooker outbound email
-> provider delivery
-> recipient replies normally
-> Reply-To recipient reaches inbound provider route
-> webhook authenticates
-> email resolves by reply_token
-> exactly one email_messages row
-> exactly one inbound Activity
-> Booking thread shows the reply
```

Also test a duplicate provider delivery and a reply to an archived booking before production rollout.


## 18 September smoke status

The real outbound message created at 13:11 local for `litulandio@gmail.com` is present in staging as an outbound `email_messages` row and outbound Activity. Its Reply-To is the expected tokenized address under `reply.cuebooker.com`.

After the Gmail reply test, staging still contains no corresponding inbound `email_messages` row or inbound email Activity. This proves the Booking UI is not hiding a stored reply; the reply has not completed the provider -> `ingest-booking-email` path.

The inbound function remains ACTIVE with JWT verification disabled and custom webhook authentication enforced through `x-cuebooker-webhook-secret`. The provider-side webhook/header configuration must be validated before the roundtrip can be called complete.
