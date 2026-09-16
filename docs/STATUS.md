# Project status

Updated: 16 September 2026

## Professional artist profile and request navigation on staging

Branch `feature/artist-profile-onboarding` adds an optional professional profile to the authenticated workspace and improves request navigation:

- selecting a request scrolls its detail to the top on mobile and desktop, while respecting reduced-motion preferences;
- onboarding explains that the professional profile is optional and can be completed later;
- the workspace profile stores identity, location, genres, formats, event types, media links and private booking conditions;
- exact fees, travel preferences, equipment notes and riders remain private to authorised artist members;
- agency users can switch between roster artists, while editor memberships remain read-only;
- the profile data is protected by RLS and the existing owner/manager permission helpers.

Migration `20260916000127_add_artist_professional_profile.sql` is applied to `cuebooker-staging`. Production has not been changed.

## On GitHub main

The remote `main` branch contains the current landing and demo flows, Brevo early-access integration, Cloudflare CI/CD foundation, Supabase identity foundation and the initial SEO foundation.

The Supabase schema now includes:

- profiles, organisations, organisation membership, artists and artist membership
- ownership triggers, RLS and restricted helper functions
- referral sources and immutable first-touch referral attribution
- seeded referral codes for the initial academy, collective and label outreach
- last-owner protection for both organisations and artists

The staging Supabase Security Advisor reports no table or RLS issue introduced by the profile schema. Its remaining warning is the project-level leaked-password protection setting.

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

## Analytics foundation in progress

Branch `feature/analytics-consent-foundation` introduces the first analytics layer without coupling product code directly to Google.

The intended architecture is:

`Nuxt event -> dataLayer -> GTM -> GA4`

This block adds:

- environment-driven `NUXT_PUBLIC_GTM_ID`
- consent-aware analytics composable
- GTM lazy loading only after explicit analytics consent
- persistent local accept/reject preference
- global analytics consent banner
- application-owned `page_view` tracking
- documented event contract for referral, signup, onboarding, artist views and booking requests

Analytics remains disabled while `NUXT_PUBLIC_GTM_ID` is empty. The next external setup is to create/configure the GTM container and GA4 destination, verify the flow in staging, and only then set the production GTM ID.

See `docs/ANALYTICS.md` for the event taxonomy and setup rules.

## Calendar and account foundation on main

The lost local commit was reconstructed on `feature/calendar-auth-foundation` and merged through PR #19. PR #20 then corrected the staging configuration and integrated account entry into the public home. `main` currently includes merge commit `c2d1766`.

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

The anonymous `/app` test workspace remains separate from the authenticated `/workspace`. This separation prevents fictional browser-local records from mixing with private account data.

## CI and lockfile status

The previous malformed `package-lock.json` and `npm ci` problem has been resolved.

Current repository automation uses deterministic npm installs with:

- a valid regenerated `package-lock.json`
- `packageManager: npm@10.9.3`
- `.npmrc` with `legacy-peer-deps=true`
- `npm ci` in CI, staging and production deployment workflows

Do not reintroduce multiple package-manager lockfiles.

## Environment configuration

The browser application expects:

- `NUXT_PUBLIC_SUPABASE_URL`
- `NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Staging uses the public publishable-key naming. Never place a secret or service-role key in frontend code or documentation.

Apply every pending Supabase migration before testing onboarding. Confirm the Auth redirect allowlist for local, staging and production.

## Remaining account and calendar verification

1. Verify signup, login, logout, session restore and protected routes.
2. Verify DJ and agency onboarding, including the agency's first roster artist.
3. Verify first-touch referral capture from `?ref=` through completed registration.
4. Verify calendar create, edit and delete persistence.
5. Verify ownership and RLS behaviour with two unrelated accounts.
6. Run generation, audit and staging smoke tests before any production deployment.

## Public product entry

The home now presents Cuebooker as usable software rather than an early-access waiting list. Account creation and sign-in are first-class header and hero actions. The floating pilot action has been removed. The existing Brevo form remains at the end of the page for research participation and product feedback, clearly separated from account registration.

The anonymous `/app` route remains available as a test workspace. Home copy must describe its records as fictional test data and distinguish it from each account's connected private workspace. Do not present the test workspace as a competing primary entry in the hero.

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

## Theme-aware brand assets

The application uses separate raster assets for each appearance rather than recolouring logos with CSS filters:

- dark mode keeps the approved lime and black Cuebooker mark with its red needle;
- light mode uses the dedicated violet, grey, black and white wordmark, icon and app icon PNGs;
- headers, mobile navigation, the home network centre and the favicon select the matching asset;
- the mobile menu keeps account actions in normal document flow and locks background scrolling while open.

Production deployment remains manual and is not part of theme or staging pull requests.
