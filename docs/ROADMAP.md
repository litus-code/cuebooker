# Implementation roadmap

Updated: 14 September 2026

## Phase 0, presentation and validation

Status: working prototype.

Maintain the landing, authenticated sample workspace, promoter simulation and Brevo feedback form. Use the sample records and guided tour to observe whether users understand the entry channels and booking flow.

## Phase 1, identity and workspaces

Status: database foundation on main, client flow prepared locally.

Finish deployment of signup, login, DJ workspace creation and agency workspace creation. Verify RLS with unrelated users. Add password recovery before inviting pilot users.

Acceptance:

- A new user confirms email and creates one initial workspace.
- A returning user reaches the workspace without repeating onboarding.
- One account cannot read another account's profile, artist or organisation.
- Every new profile receives removable examples scoped to that browser and account.

## Phase 2, real booking vertical slice

Status: next.

Implement bookings, promoter contacts, messages, audit events, access tokens and private availability blocks.

Acceptance:

- A promoter submits a valid request without an account.
- The correct artist receives it.
- Opening the request moves new to in review.
- Sending a successful reply moves it to waiting for promoter.
- Confirm and reject are explicit manual actions.
- Every transition has an audit record.
- Confirmation creates a calendar event and checks overlaps.

## Phase 3, email and secure promoter access

Status: pending.

Connect transactional email and a secure promoter thread. Separate this provider and consent model from the Brevo marketing form.

Acceptance:

- Tokens are random, hashed in storage, scoped to one booking and expiring.
- A promoter can reply without a CueBooker account.
- Delivery failures are visible to the DJ.
- Marketing consent is never required for booking communication.

## Phase 4, agency collaboration

Status: pending.

Add roster management, invitations, assignments and role-based permissions. Keep fees and calendar detail private by default.

Acceptance:

- Owners invite or remove members.
- Managers access only assigned or permitted artists.
- Every sensitive change is auditable.
- Removing a member revokes access immediately.

## Phase 5, calendar integrations and files

Status: pending.

Add private attachment storage, signed downloads and external calendar synchronization. Define conflict behaviour for provisional, confirmed and manually blocked times.

## Phase 6, discovery network

Status: validate after supply exists.

Add opt-in availability search by date, city, sound and budget. Exact artist fees remain private. The matching system returns eligibility or a range, not the stored fee.

Do not start this phase until the pilot has enough participating DJs and the booking workflow shows repeat use.

## Delivery order for the next agent

1. Push and merge the prepared identity/calendar branch after CI.
2. Configure Supabase variables and apply migrations in staging.
3. Run an end-to-end account test.
4. Write the booking schema migration and RLS tests.
5. Add server-owned transition commands.
6. Introduce a booking repository interface.
7. Keep `useBookingDemo` as the temporary per-profile sample adapter.
8. Add the Supabase adapter for authenticated workspaces.
9. Connect transactional email last within the vertical slice, after persistence and token security work.
