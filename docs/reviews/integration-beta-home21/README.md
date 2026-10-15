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
- Adds links from the home role headings to `/dj` and `/agency`, while preserving the primary signup CTAs and their existing signup-click events. Landing signup retains the existing source/ref/UTM behaviour.
- Identifies this distinct combined review candidate as Beta0.0.12. This is not a production or stable-staging release; promotion must use the same reviewed version/SHA.

Protected-path check against the beta source before merge commit: `git diff --cached --quiet -- supabase app/services app/pages/access.vue app/pages/workspace.vue app/components/BookingCoreInbox.vue app/composables/useCueAuth.ts .github` returned zero. Final candidate can be compared to `8f4113ff2f81625fc8150521828b5453c53850c0` on those paths. History is preserved with a merge commit, without force pushes.

## Verification

- `npm test`: **579 passed**, 0 failed/skipped.
- `npm run build`: passed, **44 routes** (beta plus the two public landings and payloads).
- `git diff --check`: passed; all merge conflicts resolved.
- Actual compiled public pages: Home, DJ and Agency in ES/EN at390/768/1024/1440 (24 combinations). No horizontal overflow or page exceptions; loaded imagery, demo/channel keyboard controls, disabled real form preview, home role links and real signup navigation/native empty-field validation passed. No account was submitted.
- Axe WCAG2 A/AA and2.1 AA at390/1440 in both locales and both themes: zero automatic violations. Checks wait for client locale/theme application to settle rather than inspecting a partially applied theme.
- Current workspace/P0 rendered with intercepted local fixtures at1440/390: Beta0.0.12, management-before-preferences, collapsed labels and no document overflow verified. The current beta's underlying workspace source is unchanged. These are fixture-based visual checks, not P1 membership/security or real mailbox acceptance.
- Existing referral/campaign filtering, prior referral preservation, live locale and cookie preferences checked on the combined landing routes. No real Gmail/DJ flow was repeated.

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
