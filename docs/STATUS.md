# Project status

Updated: 14 September 2026

## On GitHub main

The remote `main` branch contains the current landing and demo flows, Brevo early-access integration, Cloudflare CI/CD foundation and the Supabase identity foundation.

The Supabase schema now includes:

- profiles, organisations, organisation membership, artists and artist membership
- ownership triggers, RLS and restricted helper functions
- referral sources and immutable first-touch referral attribution
- seeded referral codes for the initial academy, collective and label outreach
- last-owner protection for both organisations and artists

The staging Supabase Security Advisor is clean after the latest schema changes.

Repository maintenance now also includes weekly Dependabot checks for npm dependencies and GitHub Actions.

## Prepared in local Work commit

Commit `2a11323 Build calendar and account onboarding foundation` was created on local branch `feature/calendar-auth-foundation`. It still needs to be pushed when the Work development environment is available.

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

Local verification completed before the Work environment became unavailable:

- `npm run typecheck` passed.
- `npm run generate` passed.
- Generated routes `/`, `/access/`, `/onboarding/`, `/app/`, `/artist/` and `/request/` returned HTTP 200.
- `npm audit --omit=dev --audit-level=high` reported zero vulnerabilities.
- `git diff --check` passed.

The older working tree at `cuebooker-publish` contains separate uncommitted user changes. Do not reset, overwrite or clean it. Continue from a clean worktree or reconcile changes file by file.

## CI and lockfile status

Current `main` still uses `npm install` in CI and deployment workflows.

A hardening attempt to switch automated installs to `npm ci` exposed that the committed `package-lock.json` is truncated and is not valid JSON. CI confirmed the file ends mid-object around line 2001, which is why `npm ci` reports that no usable lockfile exists.

Do not merge an `npm ci` workflow change until the lockfile has been regenerated and validated. A recovery PR is being used to regenerate the lockfile in GitHub Actions and verify that `npm ci` succeeds against the repaired file.

## Environment work still required

The pending Work branch currently expects:

- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_ANON_KEY`

Before merging that integration, review whether to adopt Supabase's modern publishable key naming (`NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) instead of carrying the legacy anon-key naming forward.

Apply every pending Supabase migration before testing onboarding. Confirm the Auth redirect allowlist for local, staging and production.

## Integration order when Work publishes the branch

1. Inspect the exact diff before rebasing or merging.
2. Reconcile its migrations against the versions already applied in staging.
3. Verify package and lockfile changes before resolving the `npm ci` issue.
4. Review Supabase client key naming and environment variables.
5. Verify signup, login, logout, session restore and protected routes.
6. Verify first-touch referral capture from `?ref=` through completed registration.
7. Verify calendar persistence and ownership/RLS behaviour.
8. Run typecheck, generate, audit and staging smoke tests before any production deployment.

## Next product implementation block

After the Work auth/calendar foundation is integrated and validated, build shared booking persistence. Start with the schema and server-owned transition functions, then connect the current workspace through a repository interface. Keep the browser-local demo adapter available so visitors can still test the product without registering.

The first vertical slice should support:

1. Authenticated DJ workspace.
2. One real artist profile.
3. Anonymous promoter enquiry through a protected endpoint.
4. Real booking visible in the DJ inbox.
5. Automatic new to in-review transition.
6. Real reply persisted and delivered.
7. Automatic waiting-for-promoter transition after successful send.
8. Manual confirmation and calendar entry.
