# Calendar & Auth implementation status

Updated: 14 September 2026
Branch: `feature/calendar-auth-foundation`
PR: `#19`

This file records what was actually reconstructed after the lost local Work commit. Treat it as implementation truth together with `docs/CALENDAR_AUTH_FOUNDATION.md`.

## Routes

- `/app` remains the anonymous browser-local product demo.
- `/access` handles email/password sign-in and registration.
- `/onboarding` creates the first DJ artist or agency identity.
- `/workspace` is the authenticated private calendar workspace.
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

`/access?ref=...` captures first touch locally if no earlier referral exists. After a successful authenticated session, Cuebooker checks whether the user already has `referral_attributions` and inserts the first touch only when absent.

Existing attribution is never overwritten.

## Onboarding

Migration `20260914200415_complete_account_onboarding.sql` adds `public.complete_onboarding(...)`.

The function:

- is `SECURITY INVOKER`;
- requires `auth.uid()`;
- locks the caller profile during completion;
- refuses repeated onboarding;
- creates either one DJ artist or one agency organisation;
- relies on the existing ownership triggers for membership creation;
- marks the profile complete in the same transaction;
- is executable by `authenticated`, not `anon`.

The migration version matches the migration applied to staging.

## Private availability

Migration `20260914200444_add_private_availability_blocks.sql` adds:

- `availability_block_status` (`unavailable`, `hold`, `confirmed`);
- `availability_blocks`;
- artist/time and booking-reference indexes;
- timestamp validation;
- private label/note fields;
- RLS for artist members/managers;
- no anonymous table privilege.

RLS uses the current hardened `private.is_artist_member()` and `private.can_manage_artist()` helpers. Do not reintroduce the superseded public helper functions.

The migration version matches the migration applied to staging.

## Workspace calendar

`/workspace` currently provides:

- managed-artist selector;
- responsive monthly calendar;
- clickable day selection;
- 24-hour day schedule;
- persistent private block creation;
- persistent block deletion;
- status markers for unavailable / hold / confirmed;
- explicit connected/private copy;
- logout.

The first agency account may legitimately show no direct artist membership until roster assignment is implemented. That state is handled explicitly.

## Staging verification completed

On `cuebooker-staging` Supabase:

- `complete_onboarding` exists and is `SECURITY INVOKER`;
- `availability_blocks` exists;
- RLS is enabled;
- four availability policies exist (select/insert/update/delete);
- `anon` cannot select `availability_blocks`;
- `authenticated` has table access subject to RLS;
- `anon` cannot execute `complete_onboarding`;
- `authenticated` can execute `complete_onboarding`;
- the Supabase Security Advisor reports no lints after these migrations.

## Still required before merge

- GitHub CI must pass for PR #19.
- Configure `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as environment secrets in GitHub staging/production if they are not already present.
- End-to-end browser test: signup, login, logout, session restore.
- End-to-end DJ onboarding test.
- End-to-end agency onboarding test.
- Cross-user RLS test with two authenticated accounts.
- Referral registration test with `?ref=`.
- Calendar create/delete test from staging UI.
- Decide whether update/edit of an existing availability block belongs in this foundation or the next calendar refinement.

Do not merge the draft PR until these checks are satisfied.
