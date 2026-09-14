# Calendar & Auth implementation status

Updated: 14 September 2026
Branch: `feature/calendar-auth-foundation`
PR: `#19`

This file records what was actually reconstructed after the lost local Work commit. Treat it as implementation truth together with `docs/CALENDAR_AUTH_FOUNDATION.md`.

## Routes

- `/app` remains the anonymous browser-local product demo.
- `/access` handles email/password sign-in and registration.
- `/onboarding` creates the first DJ artist or agency identity.
- `/workspace` is the authenticated private product workspace.
- `/app?mode=account` is retained as an account-entry compatibility URL and routes authenticated/onboarded users to `/workspace`.

Separating `/app` and `/workspace` is intentional. It prevents demo records and authenticated records from sharing the same state container while the real booking persistence layer is still being built.

## Browser auth

`app/composables/useCueAuth.ts` owns the Alpha session lifecycle.

It uses Supabase Auth/Data HTTP endpoints directly through Nuxt `$fetch`, so this block does not add a new npm dependency or alter the deterministic lockfile baseline.

Public configuration:

- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The frontend never uses a secret/service-role key.

The browser stores the current session under a Cuebooker-specific local-storage key and refreshes an expiring access token before private API calls. Logout removes only authenticated account state; the existing `/app` demo storage is untouched.

## Referral continuity

`/access?ref=...` captures first touch locally if no earlier referral exists. After a successful authenticated session, Cuebooker checks whether the user already has `referral_attributions` and inserts the first touch only when absent. Existing attribution is never overwritten.

## Onboarding

Migration `20260914200415_complete_account_onboarding.sql` adds `public.complete_onboarding(...)`.

The function is `SECURITY INVOKER`, requires `auth.uid()`, locks the caller profile, refuses repeated onboarding, creates either one DJ artist or one agency organisation, relies on the existing ownership triggers for membership creation, and marks the profile complete in the same transaction. It is executable by `authenticated`, not `anon`.

Migration `20260914223216_fix_complete_onboarding_parameter_ambiguity.sql` qualifies the function inputs without renaming its public RPC parameters. This fixes PostgreSQL resolving `display_name` as both the profile column and the function parameter during account creation.

## Agency roster

Migration `20260914201639_add_agency_roster_artist.sql` adds the first explicit agency-to-artist relationship:

- `organization_artists` links organizations and artists;
- RLS allows organization members or artist members to read a roster link;
- only organization managers who also manage the artist can create a link;
- anonymous access is revoked;
- `public.add_agency_artist(...)` is a `SECURITY INVOKER` RPC available only to authenticated users;
- the RPC checks organization management, creates the artist, lets the existing artist-owner trigger establish ownership, and links the artist to the agency in one transaction.

An agency with no artist now gets an `Añade el primer artista` state in `/workspace`. Creating it immediately reloads the managed-artist selector and opens that artist's calendar.

## Private availability

Migration `20260914200444_add_private_availability_blocks.sql` adds `availability_block_status`, `availability_blocks`, timestamp validation, private label/note fields, indexes and RLS for artist members/managers. RLS uses the hardened `private.is_artist_member()` and `private.can_manage_artist()` helpers.

Migration `20260914200718_index_availability_blocks_creator.sql` adds the covering index for the `created_by` foreign key requested by Supabase's performance advisor.

## Private workspace and calendar

`/workspace` currently provides:

- product navigation separated into Resumen, Bookings and Calendario;
- an overview derived from real private availability data;
- the complete browser-local Bookings interface in an explicit test mode while shared persistence is pending;
- managed-artist selector;
- agency first-artist creation;
- responsive monthly calendar;
- clickable day selection;
- a scrollable 24-hour timeline with blocks positioned by start time and duration;
- creation from an empty hour in the timeline;
- persistent private block creation;
- persistent block editing (time, status and private label);
- persistent block deletion with confirmation;
- status markers for unavailable / hold / confirmed;
- a persistent visual notice separating connected availability from simulated bookings;
- logout.

## Verification completed

On `cuebooker-staging` Supabase:

- `complete_onboarding` exists and is `SECURITY INVOKER`;
- `complete_onboarding` completes inside a rollback-only verification transaction without leaving an artist or profile change behind;
- `availability_blocks` exists with RLS enabled;
- `organization_artists` exists with RLS enabled;
- `anon` has no select privilege on `organization_artists`;
- `authenticated` has select privilege subject to RLS;
- `add_agency_artist` is `SECURITY INVOKER`;
- `anon` cannot execute `add_agency_artist`;
- `authenticated` can execute `add_agency_artist`;
- the Supabase Security Advisor reports no lints;
- the performance advisor reports only unused-index informational notices expected on the new staging dataset.

GitHub CI has passed on the calendar/auth foundation before the agency-roster refinement. Every subsequent head must also pass before merge.

## Still required before merge

- Confirm CI passes on the final PR head.
- Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` in GitHub staging/production if they are not already present.
- End-to-end browser test: signup, login, logout, session restore.
- End-to-end DJ onboarding test.
- End-to-end agency onboarding + first roster artist test.
- Cross-user RLS test with two authenticated accounts.
- Referral registration test with `?ref=`.
- Calendar create/edit/delete test from staging UI.

Do not merge the draft PR until these checks are satisfied.
