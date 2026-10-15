# Agency Settings P0 review — 15 October 2026

Only the owner-authorized P0 UX tasks. Based on PR96 `fe75fd5c096c3392a376b24a02ef4f63067cd66e` (Beta 0.0.10), on new branch `fix/agency-settings-p0`. Beta 0.0.11 is the next review candidate; no stable release/backend deployment occurred.

## Findings and corrections

- Existing Appearance/Language controls were already implemented. The settings page placed catalog, team, mailbox and preferences directly in a two-column grid, leaving preferences attached to the height of another column. Catalog/team now share a management row; the existing preferences block is immediately next in DOM/reading/tab order, then the agency mailbox. Wide desktop uses two management columns; 1024/tablet/mobile stack the management panels. Individual settings retain their original mailbox-before-preferences order. No form fields, submit handlers or permission logic changed.
- Team help was a separate flex item, so its icon could wrap alone. The translated last word and existing InfoPopover now occupy one non-breaking inline group. Desktop help popovers are anchored inside their heading rows; their body text wraps normally rather than inheriting the title fragment’s nowrap.
- The expanded navigation row contract set label fonts/columns again in the collapsed rail. A desktop-only collapsed contract hides labels, centres icons and retains explicit translated accessible names, current-page state and the notification badge.
- Agency mobile rules applied through 1100 px, colliding with the desktop rail from 961 px and moving navigation over content at 1024 px. They now end at 960 px. Removing the agency heading's inherited negative margin keeps the title inside the content gutter rather than under the rail. No arbitrary title offset added.

## Validation and evidence

- `npm test`: **579 passed**, zero failed/skipped. Four new Vue-rendered regressions exercise actual settings/navigation/title templates: reading order, one mailbox, original individual order/agency operation visibility, ES/EN accessible names, and last-word/help grouping. Existing APIs/role logic are reused.
- `npm run build`: passed, **40 routes**. `git diff --check`: passed.
- Chromium/Playwright on development and compiled static output: ES/EN at 1440 expanded/collapsed, 1024 expanded/collapsed, 768 and 390 px (12 configurations per output). No page exceptions or document overflow. Verified preferences on the same row immediately after management, title beyond the sidebar, navigation buttons within the rail, no painted collapsed labels, icon accessible names, non-orphaned help, keyboard activation of the existing help trigger via Enter, Team → ES → EN → Appearance tab order and visible focus.
- Additional compiled checks: keyboard sidebar toggle/persistence at 1440/1024; persisted collapsed state does not hide mobile labels at 768/390; no internal settings/management horizontal overflow.
- The actual workspace/components render against **local intercepted HTTP fixtures** (`agency-ux-fixture.invalid`) and a fake session. No hosted Supabase requests, saved agency data, invitations, mailbox tests or provider calls. The forms are real; fixture data is illustrative. This is P0 visual/keyboard evidence, not authenticated role/RLS or P1 acceptance.
- Owner-reported validated Gmail/DJ/attachments/language/mobile flows were not repeated as general acceptance work. P1 is prepared only in [AGENCY_P1_ACCEPTANCE_PLAN.md](../../AGENCY_P1_ACCEPTANCE_PLAN.md).

## Captures

All captures are from the compiled local output, with an artificial owner/agency, never a customer account.

| View | Capture |
| --- | --- |
| 1440 expanded / collapsed | [Expanded](es-1440-expanded.jpg) · [Collapsed](es-1440-collapsed.jpg) |
| 1024 expanded / collapsed | [Expanded](es-1024-expanded.jpg) · [Collapsed](es-1024-collapsed.jpg) |
| 768 | [Settings](es-768-expanded.jpg) |
| 390 | [Settings](es-390-expanded.jpg) |
| 1024 team / preferences | [Team](es-1024-expanded-team.jpg) · [Preferences](es-1024-expanded-preferences.jpg) |
| 390 team / preferences | [Team](es-390-expanded-team.jpg) · [Preferences](es-390-expanded-preferences.jpg) |
| English | [1440 collapsed](en-1440-collapsed.jpg) · [390 team](en-390-expanded-team.jpg) |

No schema, migration, Supabase, backend, dependency or workflow changes. P1/P2, commercial PRs and broader settings redesign remain outside scope. Rollback: revert this P0 candidate's frontend commit; no database rollback required. The existing CI workflow targets main-based PRs; this stacked PR uses an explicit CI-only dispatch on its own branch, without stable staging or production publication.
