# Calendar & Auth Foundation

Updated: 14 September 2026
Branch: `feature/calendar-auth-foundation`
Base: `5d98d1a81735a9335bdbbc74ded9cc831795a07f`

Historical note: this file describes the original foundation scope. The later workspace product decision retires anonymous `/app` access in favour of per-profile removable samples inside `/workspace`. Current routing truth lives in `docs/CALENDAR_AUTH_IMPLEMENTATION.md`.

## Why this branch exists

A previous ChatGPT Work environment created a local commit (`2a11323 Build calendar and account onboarding foundation`) but that commit was never pushed to GitHub before the Work environment became unavailable. This branch reconstructs that block from the documented behaviour and the current remote source of truth.

Do not assume the lost commit can be recovered. Rebuild deliberately against current `main` and current Supabase staging state.

## Current remote state

`main` already contains:

- the public/commercial experience and demo workspace;
- deterministic npm/CI/deploy setup;
- Supabase identity foundation;
- organisations, organisation membership, artists and artist membership;
- referral sources and immutable first-touch attribution;
- ownership/RLS hardening;
- SEO baseline;
- consent-aware analytics foundation.

Staging Supabase currently has these public tables:

- `profiles`
- `organizations`
- `organization_members`
- `artists`
- `artist_members`
- `referral_sources`
- `referral_attributions`

Calendar/onboarding persistence from the lost Work commit has not been applied to staging.

## Product invariant

Cuebooker connects:

`DISCOVERY -> BOOKING -> MANAGEMENT`

The operational calendar is private. Discovery may consume controlled availability derived from operational data, but it must never expose private calendar details.

The calendar is therefore not a standalone decorative feature. A confirmed booking or explicit availability block must eventually affect whether an artist can be presented as bookable for a date.

## Scope of this foundation

Reconstruct the previously documented first block:

1. Supabase browser client and auth session handling.
2. Signup and sign-in experience.
3. Protected workspace routing.
4. Returning-user routing.
5. DJ or agency onboarding.
6. Atomic onboarding completion in Postgres.
7. Responsive monthly calendar.
8. Clickable date -> 24-hour day schedule.
9. Booking navigation from calendar items.
10. Persistent private availability blocks with ownership/RLS.
11. Environment-aware UI copy: real connected account vs browser-only demo data.
12. Preserve the local sample adapter while the presentation entry is evaluated.

## API-key decision

Use Supabase's modern browser key naming:

- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not introduce new frontend code using `NUXT_PUBLIC_SUPABASE_ANON_KEY`.

Never expose a secret/service-role key to the browser.

## Auth model

Initial Alpha auth remains email/password via Supabase Auth.

Expected routes:

- `/access` - sign up/sign in
- `/onboarding` - authenticated account setup
- `/workspace` - authenticated private workspace
- `/app` - legacy route redirected to account access or `/workspace`

Routing rules:

- no session + explicit account/workspace entry -> `/access`;
- signed in + onboarding incomplete -> `/onboarding`;
- signed in + onboarding complete -> `/workspace`;
- restored sessions must follow the same rules after refresh;
- logout must clear the authenticated workspace state without mixing sample namespaces between profiles.

Authorization decisions must rely on database membership/RLS, not user-editable `user_metadata`.

## Onboarding model

The existing identity schema already creates one `profiles` row per Auth user.

The onboarding flow should support at least:

### DJ

Create an artist and owner membership atomically, then mark the profile onboarding complete.

### Agency

Create an `agency` organisation and owner membership atomically, then mark the profile onboarding complete.

Implement onboarding as a database function so partial identity state is not left behind if one step fails.

The function must validate `auth.uid()` internally and expose only the minimum execution permissions required.

## Calendar model

The first persistent calendar primitive is `availability_blocks`.

Minimum fields should cover:

- stable UUID;
- owner artist;
- start/end timestamp;
- status/type sufficient to represent unavailable/hold/confirmed-style calendar states;
- optional private label/note;
- created/updated timestamps;
- provenance/reference fields only where needed for later booking integration.

RLS requirements:

- artist members can read their artist's private blocks;
- only users with the appropriate artist-management role can create/update/delete blocks;
- no anonymous/public access to private calendar rows;
- policies must include ownership predicates, not only `TO authenticated`.

Do not duplicate real booking persistence in this foundation. The next vertical slice will connect confirmed bookings to calendar persistence through the booking domain/repository layer.

## Sample booking adapter

The original `/app` page derived calendar items from a local booking demo. It is now a minimal compatibility redirect. The current product workspace reuses the temporary adapter only for removable per-profile sample bookings.

Do not rewrite the full workspace solely to add persistence. Separate calendar/auth data access from presentation so the same UI can be driven by:

- browser sample adapter scoped to the authenticated profile;
- Supabase-backed adapter for authenticated workspaces.

## Referral integration

First-touch referral attribution already exists in the remote schema.

Registration/onboarding must preserve the incoming referral captured from `?ref=` and must not overwrite an existing first-touch attribution.

Referral attribution must be verified as part of the auth integration before merge.

## CI/deployment requirements

Keep the deterministic install baseline:

- npm only;
- committed `package-lock.json`;
- `npm@10.9.3` package manager metadata;
- `npm ci` in CI/staging/production.

When adding Supabase client dependencies, pin/update them through npm and commit the resulting lockfile.

Staging and production workflows need the public Supabase URL and publishable-key variables available at build/runtime as appropriate. Do not commit real key values to source.

## Implementation sequence

1. Add current Supabase client dependency and runtime config using publishable-key naming.
2. Add auth/session composable and clean session lifecycle.
3. Add `/access`.
4. Add auth-aware route guard/routing rules.
5. Add atomic onboarding migration and `/onboarding`.
6. Add `availability_blocks` migration with RLS and indexes.
7. Extract calendar presentation/data boundary from the current demo workspace.
8. Add Supabase-backed calendar adapter for authenticated artists.
9. Add month/day interaction and booking deep-link behaviour without regressing the current demo.
10. Verify referral continuity.
11. Run database advisors and application verification.
12. Deploy to staging before any merge to `main`.

## Verification gate

Before merge:

- signup works;
- sign-in works;
- logout works;
- refresh restores a valid session;
- incomplete accounts route to onboarding;
- DJ onboarding creates exactly one owned artist and completes atomically;
- agency onboarding creates exactly one owned organisation and completes atomically;
- first-touch referral survives registration/onboarding;
- private workspace routes are protected for account entry;
- every new profile receives removable samples without changing Supabase data;
- authenticated calendar reads only owned/member artist data;
- availability create/update/delete honours role permissions;
- another user's calendar rows cannot be read or mutated;
- month and 24-hour day views behave responsively;
- calendar items can navigate to their booking when a booking reference exists;
- Supabase security advisor is clean or every remaining warning is explicitly understood;
- typecheck passes;
- static generation/build passes;
- `git diff --check` passes;
- high-severity production dependency audit is clean;
- staging smoke test passes.

## Follow-up after this foundation

The next product block is shared booking persistence:

1. authenticated DJ workspace;
2. one real artist profile;
3. anonymous promoter enquiry through a protected endpoint;
4. real booking in the DJ inbox;
5. server-owned automatic state transitions;
6. persisted reply/delivery;
7. manual confirmation;
8. confirmed booking written into the private calendar;
9. controlled availability feeding Discovery without exposing private event details.
