# Technical architecture

Updated: 16 September 2026

## Application

CueBooker uses Nuxt 4, Vue 3 and TypeScript. Nitro generates a static application for Cloudflare Pages. The interface keeps Spanish and English content in parallel JSON files and uses a shared CSS visual system.

The public demo currently uses a browser-local repository. Treat it as a presentation adapter. Do not extend that storage model into production features.

## Target data flow

1. A DJ or agency signs in through Supabase Auth.
2. The user creates an artist or organisation workspace.
3. The artist shares a public booking URL or embed.
4. A promoter submits an enquiry without an account.
5. The backend creates a booking and a secure promoter access token.
6. The DJ opens the booking. The state moves from new to in review.
7. A successful outbound reply creates a message and moves the state to waiting for promoter.
8. Manual confirmation or rejection records an auditable transition.
9. A confirmed booking appears in the private calendar.

## Identity model

The existing Supabase foundation contains:

- `profiles`, one per authenticated user.
- `organizations`, currently agency or promoter.
- `organization_members`, with owner, admin and member roles.
- `artists`.
- `artist_members`, with owner, manager and editor roles.

Database triggers create the profile after Auth signup and add the creator as owner after artist or organisation creation.

Security helper functions live in the private schema. Public tables use RLS. Anonymous users have no access to identity tables.

## Artist professional profile

Public-ready artist attributes live on `artists`: biography, base city and country, time zone, languages, genres, performance formats, event types, years active and media links.

Private commercial attributes live in the one-to-one `artist_booking_profiles` table: fee basis and range, currency, set duration, travel preferences, equipment notes and rider links. RLS permits artist members to read the private row and restricts inserts and updates to owner or manager memberships. Editor memberships render the profile in read-only mode.

The profile is optional. Onboarding only creates the workspace and communicates that the profile can be completed later from the authenticated panel.

## Onboarding

The prepared onboarding flow supports DJ and agency workspaces. The database operation should remain atomic: lock the profile, reject repeated completion, create the workspace, create ownership membership through the existing trigger and mark onboarding complete in the same transaction.

Returning users with completed onboarding go to the workspace. Users without a completed profile go to onboarding.

## Next database model

The next migration should introduce these concepts:

| Entity | Purpose |
|---|---|
| bookings | Request, event details, offer, status, assignee and ownership |
| booking_contacts | Promoter identity and contact details |
| booking_messages | Thread messages, sender type, delivery state and timestamps |
| booking_status_events | Immutable audit history for transitions |
| availability_blocks | Manual private blocks and unavailable periods |
| promoter_access_tokens | Hashed, expiring access to one booking |
| booking_attachments | Storage metadata, ownership and visibility |

Use UUID primary keys, timezone-aware timestamps and explicit foreign keys. Store token hashes, never raw tokens. Keep files in a private Supabase Storage bucket and issue short-lived signed URLs.

## Status transitions

Enforce transitions on the server or in database functions. The client may request an action but must not write arbitrary status values.

Recommended commands:

- `open_booking(booking_id)`
- `send_booking_reply(booking_id, body)`
- `confirm_booking(booking_id)`
- `reject_booking(booking_id, reason)`

Each command validates membership, writes the action and status history atomically, then returns the updated booking.

## Public request security

The public booking form requires an anonymous-safe endpoint or Edge Function. Validate every field server-side, rate-limit submissions and add bot protection that does not trap legitimate mobile users in repeated visual challenges.

Do not grant anonymous direct insert access to the full bookings table. The endpoint should select the permitted artist, normalize input and create only the allowed records.

## Email

Transactional booking email is separate from the Brevo marketing list. The first technical version needs:

- DJ notification after a valid enquiry.
- Promoter acknowledgement.
- Reply notification with a secure booking link.
- Confirmation or rejection message.
- Delivery and failure state stored on the message.

Marketing consent must not be required to submit a booking.

## Environments

Expected public variables:

```text
NUXT_PUBLIC_SUPABASE_URL
NUXT_PUBLIC_SUPABASE_ANON_KEY
NUXT_PUBLIC_APP_ENV
```

The URL and anon key are client-safe identifiers. Never expose the service-role key. Store private API keys only as protected environment secrets.

Supabase Auth redirect allowlists must include local, staging and production URLs.

## CI and deployment

Pull requests and branch pushes run:

```bash
npm ci
npm run typecheck
npm run generate
```

Staging deploys automatically after CI succeeds on `main`. Production uses the manual reviewed-SHA workflow. Add Supabase public variables to the matching GitHub environments before expecting account access to work.

## Verification checklist

- Run the type checker and static generation.
- Run the production dependency audit.
- Check every generated route with HTTP 200.
- Test signup, email confirmation, login, onboarding and returning login against the staging Supabase project.
- Test RLS with two unrelated users.
- Test 390 px mobile and desktop layouts.
- Confirm that public pages never reveal private fees, messages or calendar details.
