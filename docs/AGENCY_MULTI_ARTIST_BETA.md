# Agency multi-artist beta

Status: PR preview implementation, 28 September 2026. Production untouched.

## Architecture decision

`workspaces` is the Booking Core tenant, and `workspace_artists` is the operational roster. `organizations` and `organization_artists` remain the legacy identity/onboarding bridge. The agency organization maps to one workspace through `workspace_legacy_organizations`; no third Agency–Artist join is introduced. A new artist is created by `add_agency_artist` and linked atomically to both relations. The workspace link carries `roster_active`: retiring an artist hides them from current agency operations without deleting the artist or the historical Booking foreign keys. An owner may restore them.

This avoids the pre-existing failure in which an agency workspace was bootstrapped with the first roster snapshot, but later artists were never attached to Booking Core. The migration also lets workspace members read roster artist identity and lets owner/admin/manager members edit an active roster artist's profile fields; team management and scoped assignments are not expanded into a new UI in this beta block.

## Representation and public enquiries

An artist has one public profile and one `artist_booking_routes` destination. An agency's active roster artist created through `add_agency_artist` gets a closed route to the agency workspace in the same transaction. Publishing the profile and opening enquiries are separate actions. A public request carries the artist ID into a booking owned by that workspace, so agency staff operate it from the global inbox and artist-filtered views. The public profile identifies the managing agency when its route points to an agency workspace. The artist does not automatically receive a duplicate booking or an automatic workspace membership.

Existing independent artists are **not** silently transferred by adding a roster relation. If a route points to another workspace, the agency UI refuses to change its public booking settings. A future explicit transfer must establish consent, permissions, handling of open enquiries and continuity of history. Retiring an artist closes their agency enquiry route but retains bookings and the route; restoring them does not reopen enquiries automatically. Agency owner/admin control roster retirement; managers can edit active artist profiles and operate bookings at workspace scope. Per-artist manager assignments and notifications to the represented DJ are not yet implemented or promised in beta.

Global Bookings and Activity paginate on the server after artist filtering; a page does not silently empty out because retired artists occupy its first results. Calendar and active holds load every page in the displayed month, so the previous 500-row cap no longer hides dates. The Overview and roster cards deliberately show a recent snapshot; their per-artist upcoming count is not an all-time total.

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
