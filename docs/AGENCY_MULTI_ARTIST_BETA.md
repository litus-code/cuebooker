# Agency multi-artist beta

Status: PR preview implementation, 28 September 2026. Production untouched.

## Architecture decision

`workspaces` is the Booking Core tenant, and `workspace_artists` is the operational roster. `organizations` and `organization_artists` remain the legacy identity/onboarding bridge. The agency organization maps to one workspace through `workspace_legacy_organizations`; no third Agency–Artist join is introduced. A new artist is created by `add_agency_artist` and linked atomically to both relations. The workspace link carries `roster_active`: retiring an artist hides them from current agency operations without deleting the artist or the historical Booking foreign keys. An owner may restore them.

This avoids the pre-existing failure in which an agency workspace was bootstrapped with the first roster snapshot, but later artists were never attached to Booking Core. The migration also lets workspace members read roster artist identity and lets owner/admin/manager members edit an active roster artist's profile fields; team management and scoped assignments are not expanded into a new UI in this beta block.

## Experience contract

- Agency onboarding goes to `/workspace?view=overview&scope=all`; DJ onboarding keeps its existing Calendar/CUE ID destination.
- An agency starts in `Todos los artistas` with an empty-roster CTA or an aggregated overview. A persistent native selector shows agency name and current artist. Explicit artist URLs preserve their context; returning to all removes the artist query.
- Global Overview, Bookings, Calendar, Activity and Roster are independent surfaces. Global bookings and Activity label the artist; opening a booking selects its artist and keeps the same Booking Core detail. Calendar shows every selected artist and can filter multiple artists without arbitrary colors.
- Individual Profile, Passport and CUE ID mount only with a selected artist. A direct individual route in global context shows a selection prompt. Existing DJ flow and `aria-current="page"` navigation remain intact.
- Owner/admin can add/retire/restore. Retire is reversible and never calls `DELETE artists`. Individual Profile is the edit surface. Existing Booking Core roles enforce booking mutations; browser visibility alone is not an authorization boundary.
- No new Agency paywall is introduced. The existing plan/entitlement architecture is left in place.

## Limits and follow-up

- The active-booking KPI requests an exact server count; if the count is unavailable it explicitly displays a lower bound. Attention and roster previews use the first 100 most recently updated bookings. Calendar/Activity/holds query up to 500 records each. These are beta windows, not lifetime totals; cursor pagination and complete aggregate projections are follow-up scale work.
- Workspace `manager` currently has workspace-wide Booking Core operations. Per-artist team assignment is not represented in the existing schema; do not claim assigned-only isolation until a dedicated authorization model and RLS test suite exist.
- Organization membership reconciliation currently occurs at workspace bootstrap. A standalone team-invitation UI and later membership synchronization require a separate, reviewed permission block.
- The migration must be applied to staging before using the PR preview against staging data. Never point the preview at production or apply this migration there without a separate decision.

## Beta smoke

1. Sign up as Agency, create an agency, confirm global empty Overview and create Artists A/B.
2. See both in Roster; edit a profile and return to all through the selector.
3. Add a real booking for each artist, check global Bookings and artist filter; open B's booking and verify B context.
4. Check both in roster Calendar, switch one/multiple filters, open B's booking, then return to all.
5. Check Activity attribution, direct Profile/Passport/CUE ID without artist, retire/restore without deleting bookings.
6. Repeat at ~390 px, keyboard focus, Spanish/English, and with an existing DJ account.
