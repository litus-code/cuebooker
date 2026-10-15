# Joint review candidate — Beta 0.0.12

Owner requested consolidation and explicitly chose review **without touching main** on 15 October 2026.

## Consolidation

| Source | Result |
| --- | --- |
| #113 P0 Settings | Merged into PR96 branch at `49de54da1513ca7300687a43026c7ff168a44ab3`; documented at `8f4113ff2f81625fc8150521828b5453c53850c0`. CI38807901707 and preview38807902118 passed. |
| #111 DJ/Agency | Merged into #110 branch at `4594f268d416df330ab1785c394ea346b36f639b`. CI and PR110 preview passed. |
| Joint candidate | `integration/beta-home21-review`, merging the two review families, with the controlled resolution below. |
| main | Remains `bbdf29122f704039b353fa4eed788bfdfef5aaa7`; no merge/push to main. |

#109 is already an ancestor of Home 2.1. #112 is a preview-only alternative of the same landings history, not another independent feature to merge. Older unrelated PRs are outside this consolidation. Neither the PR96 nor commercial family was merged into main.

## Conflict resolution and integration

The commercial branch also contained older email/attachment implementations and migrations; it was not a marketing-only tree. Blindly taking that side would regress current beta fixes. The joint merge therefore:

- Takes the reviewed Home 2.1 page/components, DJ/Agency pages, commercial shared components/composable, ES/EN home/landing copy, commercial CSS, images, art-direction documentation and sitemap from the consolidated commercial family.
- Retains the current beta's complete `supabase/`, services, authentication/access route, Booking Core components, workspace/P0, shared form/preferences components, tests, dependency files, runtime config and workflows. Incoming older attachment migrations/implementation notes were not reintroduced. No hosted backend or schema change.
- Adds explicit ES/EN discovery links as well as links from the home role headings to `/dj` and `/agency`, while preserving the primary signup CTAs and their existing signup-click events. Landing signup retains the existing source/ref/UTM behaviour.
- Identifies this distinct combined review candidate as Beta0.0.12. This is not a production or stable-staging release; promotion must use the same reviewed version/SHA.

Protected-path check against the beta source before merge commit: `git diff --cached --quiet -- supabase app/services app/pages/access.vue app/pages/workspace.vue app/components/BookingCoreInbox.vue app/composables/useCueAuth.ts .github` returned zero. Final candidate can be compared to `8f4113ff2f81625fc8150521828b5453c53850c0` on those paths. History is preserved with a merge commit, without force pushes.

## Verification

- `npm test`: **581 passed**, 0 failed/skipped.
- `npm run build`: passed, **44 routes** (beta plus the two public landings and payloads).
- `git diff --check`: passed; all merge conflicts resolved.
- Actual compiled public pages: Home, DJ and Agency in ES/EN at390/768/1024/1440 (24 combinations). No horizontal overflow or page exceptions; loaded imagery, demo/channel keyboard controls, disabled real form preview, home role links and real signup navigation/native empty-field validation passed. No account was submitted.
- Axe WCAG2 A/AA and2.1 AA at390/1440 in both locales and both themes: zero automatic violations. Checks wait for client locale/theme application to settle rather than inspecting a partially applied theme.
- Current workspace/P0 rendered with intercepted local fixtures at1440/390: Beta0.0.12, management-before-preferences, collapsed labels and no document overflow verified. The current beta's underlying workspace source is unchanged. These are fixture-based visual checks, not P1 membership/security or real mailbox acceptance.
- Existing referral/campaign filtering, prior referral preservation, live locale and cookie preferences checked on the combined landing routes. No real Gmail/DJ flow was repeated.

The home now includes explicit discovery links in both audience cards (ES/EN), retaining signup CTAs. The CUE ID image is a styled visual concept with hair/clothing derived from the original preview, clearly labelled as a concept in development; the laboratory model is unchanged.

## Preview routing correction

Published smoke checks found that the old `/agency/*` fallback swallowed the new landing. The fallback now matches only a nonempty slug (with/without trailing slash), rewriting to clean `/200` without an HTML canonical redirect. The landing is a sibling `app/pages/agency/index.vue` of `[slug].vue`, so it no longer shadows the public catalogue as a parent page. Two regression tests cover route separation and fallback boundaries. A compiled browser check renders a catalogue fixture through the actual dynamic page, intercepting its provider request; no backend or form submission is involved.

## Compiled captures

Public images are editorial/illustrative; workspace data is artificial local fixture data, not customer information.

| Page | Desktop | Mobile |
| --- | --- | --- |
| Home | [1440](home-1440.jpg) | [390](home-390.jpg) |
| DJ | [1440](dj-1440.jpg) | [390](dj-390.jpg) |
| Agency | [1440](agency-1440.jpg) | [390](agency-390.jpg) |
| Agency settings | [1440](settings-1440.jpg) | [390](settings-390.jpg) |

A new main-based **draft PR is for combined preview/review only**, not permission to merge. Existing workflows publish only its PR preview; do not manually dispatch stable staging/production. Main CI would trigger stable staging and a main push would trigger GitHub Pages, so those remain separate later decisions. No Supabase deployment, migration, secret, scheduler, paid service, invitation or real email operation occurred. P1 stays prepared in AGENCY_P1_ACCEPTANCE_PLAN.md, not executed. This merge does not establish release/security/backend parity readiness.

Rollback before any later promotion: close the joint review PR or discard its branch. The already merged #113/#111 history remains in their intended feature families; no database rollback is needed. CI and deployed preview evidence for the published candidate are recorded in the PR description.

## Mobile landing navigation follow-up

Application `4a6b72357bc5cd719540eb2815b5e10ee6be1c43`: below768px the shared landing header has only logo and hamburger; links and language/theme controls are inside a native modal. Compiled Chromium checks cover both routes/locales at390px, keyboard wrapping, Escape/trigger focus restoration, How target focus, scroll unlock and desktop1024 transition. Zero Axe WCAG2/2.1 A/AA violations in the open menu. 581 tests and44-route build pass.

[Agency menu390](agency-menu-390.jpg) · [DJ menu390](dj-menu-390.jpg). Earlier closed-header landing captures predate this follow-up.

## Shared menu consistency (supersedes separate landing menu)

Application `1b38a3ba5af08f3292ddc872bb10881cfa66209e` extracts the home menu into `PublicMobileMenu.vue` for all public marketing/access headers. Preferences above navigation, same close control, same links and signup CTA, same1100px breakpoint. Authentication forms/composable unchanged.

Compiled browser verification: Home/DJ/Agency/signup/sign-in × ES/EN ×390/768/1100 (30 cases), desktop1101 transition, keyboard wrap/Escape/focus/scroll cleanup and no page errors/overflow. Axe open-menu WCAG2/2.1 A/AA zero violations in dark/light at390 across all routes/locales. Access draft email survives menu interaction; both landing signup destinations retain source/UTM. 581 tests/44-route build pass. No account submission or backend calls.

[Shared access menu390](shared-access-menu-390.jpg) · [Shared agency menu390](shared-agency-menu-390.jpg). Older menu captures above are historical.

## Theme palette and hero action review — 16 October

Application `4bdd26141ab62db4af65e6d14316d0beb6406f0a`: landing surfaces/text/accent now use home theme tokens. Light mode uses lilac for the second hero phrase and primary CTA, deeper lilac for small text contrast. Dark mode retains lime. Email cards and decorative graphics follow the active theme; no light-mode dark text on fixed dark cards. Hero actions share a row with equal widths and wrapped labels; SVG arrows avoid missing glyphs.

581 tests/44-route build pass.32 unique compiled route/locale/theme/viewport combinations (DJ/Agency, ES/EN, light/dark,390/768/1024/1440), plus targeted final SVG checks: aligned buttons, no document overflow/errors. Full-page Axe WCAG2/2.1 A/AA at390/1440 for each route/locale/theme: zero violations. Imagery explicitly loaded before assertions; representative hero/email views inspected.

| Landing/theme | Desktop1440 | Mobile390 |
| --- | --- | --- |
| DJ/light | [Capture](palette-dj-light-1440.jpg) | [Capture](palette-dj-light-390.jpg) |
| DJ/dark | [Capture](palette-dj-dark-1440.jpg) | [Capture](palette-dj-dark-390.jpg) |
| Agency/light | [Capture](palette-agency-light-1440.jpg) | [Capture](palette-agency-light-390.jpg) |
| Agency/dark | [Capture](palette-agency-dark-1440.jpg) | [Capture](palette-agency-dark-390.jpg) |

## Paired avatar concepts and mobile header scroll

Application `3bba504dc9378864266b03f637cf67e6a414bfe1` shows the male/female styled CUE ID concepts together ([desktop1440](avatars-pair-1440.jpg), [mobile390](avatars-pair-390.jpg)). Both remain illustrative/in development, with hair/streetwear and matching industrial framing. No laboratory/editor change.

The existing scroll plugin now recognizes replacement public headers. New headers use1100px breakpoint; legacy headers retain720px. Tests cover downward hide, accumulated small upward movement, top/menu/route/desktop reveal.584 tests/44-route build pass. Compiled browser verifies actual header geometry and modal state on Home/DJ/Agency/signup/sign-in, and the loaded pair at390/1440 without overflow. Access uses500px viewport height for scroll coverage; no forms submitted.
