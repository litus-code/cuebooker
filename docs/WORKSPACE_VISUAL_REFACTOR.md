# Workspace visual refactor

## Decision

The approved visual prototype is the visual source of truth for the workspace. Existing functionality is preserved, but old layout structure must not dictate spacing, hierarchy or composition when it conflicts with the approved direction.

## System rules

- One shared internal page-header rhythm across Overview, Bookings, Calendar, History and Profile.
- Headers are product headers, not landing-page heroes.
- Sidebar owns navigation and account utilities without overflow or compressed controls.
- Bookings list and request detail are one continuous operational surface separated by a 1px divider.
- Calendar keeps the 24-hour day model and booking links.
- History keeps traceability back to the request.
- Guided Tour remains functional and adopts the same visual language.
- Dark/Light and ES/EN remain first-class requirements.
- Desktop and mobile are reviewed together.
- Performance and Core Web Vitals remain Definition of Done constraints.

## Current refactor

- Approved higher-resolution brand artwork in the shell.
- Constrained sidebar wordmark.
- Account controls split into a calmer two-level footer.
- Shared page-header scale and spacing.
- Reduced decorative vertical space in Overview.
- Denser sample notice and filters in Bookings.
- Fixed-width booking list plus flexible request detail with no artificial gap.
- Calendar, History and Profile aligned to the same vertical rhythm.
