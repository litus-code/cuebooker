# Project status

Updated: 14 September 2026

## On GitHub main

The remote main branch already contains the current landing and demo flows, Brevo early-access integration, Cloudflare CI/CD foundation and the Supabase identity foundation.

Supabase migrations currently define profiles, organisations, organisation membership, artists, artist membership, ownership triggers, RLS and restricted helper functions.

## Prepared in local commit

Commit `2a11323 Build calendar and account onboarding foundation` was created on local branch `feature/calendar-auth-foundation`. It still needs to be pushed when the development environment is available.

That commit contains:

- Responsive monthly calendar with coloured statuses.
- Clickable days and a 24-hour day schedule.
- Booking navigation from calendar events.
- Supabase browser client and session handling.
- Signup and sign-in page.
- DJ or agency onboarding.
- Atomic `complete_onboarding` database function.
- Returning-user routing.
- Environment-aware copy that distinguishes connected accounts from simulated bookings.
- CI type checking and reproducible `npm ci` installs.
- Supabase variables in staging and production workflows.
- Dependency alignment with the Nuxt router version.

Local verification completed before the environment became unavailable:

- `npm run typecheck` passed.
- `npm run generate` passed.
- Generated routes `/`, `/access/`, `/onboarding/`, `/app/`, `/artist/` and `/request/` returned HTTP 200.
- `npm audit --omit=dev --audit-level=high` reported zero vulnerabilities.
- `git diff --check` passed.

The older working tree at `cuebooker-publish` contains separate uncommitted user changes. Do not reset, overwrite or clean it. Continue from a clean worktree or reconcile changes file by file.

## Environment work still required

The access UI remains disabled in any deployment missing:

- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_ANON_KEY`

Apply every pending Supabase migration before testing onboarding. Confirm the Auth redirect allowlist for local, staging and production.

## Next implementation block

Build shared booking persistence. Start with the schema and server-owned transition functions, then connect the current workspace through a repository interface. Keep the browser-local demo adapter available so visitors can still test the product without registering.

The first vertical slice should support:

1. Authenticated DJ workspace.
2. One real artist profile.
3. Anonymous promoter enquiry through a protected endpoint.
4. Real booking visible in the DJ inbox.
5. Automatic new to in-review transition.
6. Real reply persisted and delivered.
7. Automatic waiting-for-promoter transition after successful send.
8. Manual confirmation and calendar entry.
