# Project status

Updated: 14 September 2026

## On GitHub main

The remote `main` branch contains the current landing and demo flows, Brevo early-access integration, Cloudflare CI/CD foundation, Supabase identity foundation and the initial SEO foundation.

The Supabase schema now includes:

- profiles, organisations, organisation membership, artists and artist membership
- ownership triggers, RLS and restricted helper functions
- referral sources and immutable first-touch referral attribution
- seeded referral codes for the initial academy, collective and label outreach
- last-owner protection for both organisations and artists

The staging Supabase Security Advisor is clean after the latest schema changes.

Repository maintenance now also includes weekly Dependabot checks for npm dependencies and GitHub Actions.

## SEO and Search Console baseline

Cuebooker is verified as a Google Search Console Domain Property and connected to GSC Wizard.

The production site now includes:

- `public/robots.txt` with sitemap discovery
- `public/sitemap.xml`, currently containing only the public homepage
- self-referencing canonical URL for `https://cuebooker.com/`
- Open Graph metadata
- Twitter metadata
- explicit SVG favicon declaration
- `WebSite` structured data using JSON-LD

The SEO foundation was validated through CI, deployed to staging and then promoted to production from commit `92a343a8bf19ff2d49dd2e5d7b4a82bcc929e4f6`.

A live production audit currently reports:

- HTTP 200
- indexable page
- valid self canonical
- no `noindex`
- favicon detected
- `WebSite` structured data detected
- zero technical on-page SEO issues in the current audit

The sitemap is reachable at `https://cuebooker.com/sitemap.xml` and has been submitted manually in Google Search Console. Google has not crawled or indexed the homepage yet, which is expected for a newly registered property.

There is one known metadata discrepancy to review later: the live page title currently resolves to `CueBooker | Gestión de bookings para DJs`, while `nuxt.config.ts` defines `CueBooker | Booking de DJs y música electrónica`. This is not currently blocking indexing but should be reconciled so metadata has one source of truth.

## Core Web Vitals follow-up

Core Web Vitals field data cannot yet be read through GSC Wizard because the Chrome UX Report API is not configured for the account. Even after configuring CrUX, Cuebooker may initially return no field data until there is enough real-user traffic.

Keep this as a performance follow-up rather than a launch blocker:

1. Configure a Google API key with the Chrome UX Report API enabled in GSC Wizard.
2. Use PageSpeed Insights / Lighthouse lab measurements in the meantime.
3. Establish a baseline for LCP, CLS, FCP, TTFB and interaction responsiveness.
4. Recheck CrUX field data once Cuebooker has enough real-world traffic.
5. Treat Search Console Core Web Vitals as the production source of truth once data becomes available.

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

The previous malformed `package-lock.json` and `npm ci` problem has been resolved.

Current repository automation uses deterministic npm installs with:

- a valid regenerated `package-lock.json`
- `packageManager: npm@10.9.3`
- `.npmrc` with `legacy-peer-deps=true`
- `npm ci` in CI, staging and production deployment workflows

Do not reintroduce multiple package-manager lockfiles.

## Environment work still required

The pending Work branch currently expects:

- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_ANON_KEY`

Before merging that integration, review whether to adopt Supabase's modern publishable key naming (`NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`) instead of carrying the legacy anon-key naming forward.

Apply every pending Supabase migration before testing onboarding. Confirm the Auth redirect allowlist for local, staging and production.

## Integration order when Work publishes the branch

1. Inspect the exact diff before rebasing or merging.
2. Reconcile its migrations against the versions already applied in staging.
3. Verify package and lockfile changes against the current deterministic-install baseline.
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
