# Agency multi-artist beta

Status: PR preview implementation, 28 September 2026. Production untouched.

## Anonymous visual review

PR #96 exposes `/preview-agency` on its Cloudflare preview branch. It uses the real `AgencyWorkspace` global component with an in-memory demo roster, bookings, holds, contacts and activity. Opening a booking now enters the same `BookingCoreInbox` layout used by DJ, with the selected artist, conversation, next action, hold and decision controls. These preview actions change local fixture data only; no Supabase reads or writes run from this route. Reviewers can switch global/artist context, navigate the roster, filter bookings and calendar, and simulate adding or retiring an artist. Demo navigation and filters reset on reload. The individual Profile, Passport and CUE ID tabs show navigation context with a visible read-only notice; they do not pretend to be the live editor. The page is gated to the staging build and the PR preview hostname, and has `noindex,nofollow`. Authenticated `/workspace`, RLS and production are unchanged.

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

- Overview counts now use the complete current-month calendar result for upcoming dates and an exact active-Hold count across all months. Its visible upcoming list remains capped at eight rows. If an exact Hold count is unavailable, the card shows a `≥` lower bound based on the displayed month. Validated with 322 tests and a static generation on the Agency branch; browser-authenticated staging smoke is still open. Staging now has one Agency organization and one active artist. A rollback-only backend smoke under the authenticated owner role passed for a second artist, bookings for both artists, an overdue next move and the agency booking route; subsequent queries confirmed no test rows remained. A nonmember sees no Agency roster or bookings.

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

## 30 September 2026: Agency operation closure

- Global Overview and Bookings expose + CUE through the existing capture panel. Agency capture requires a valid active roster artist, selected explicitly when more than one exists. Saving enters that artist's real Booking Core. Agency beta bypasses the individual five-process capture prompt; plan definitions remain unchanged. Viewer cannot use global capture or resolve attention items; existing database policies still enforce operations.
- Global Overview reuses BookingCoreAttention with active roster identity, so overdue Next Moves, expiring Holds, unread responses, failed delivery and stale follow-up use the DJ rules. Loading errors are explicit and retryable. Requests for an old artist scope cannot overwrite a newer scope. Per-artist attention retrieval retains existing 500-row beta windows; this is not an all-time analytics projection.
- Artist switching preserves the current operational section. A visible Agency/Artist context bar returns to the saved global view and query filters. Roster calendar month/day are URL state; moving month does not choose day one. A previously all-artists calendar includes newly added artists; an explicit subset remains a subset.
- Overview includes roster shortcuts and add-artist actions. The roster creation form uses a native modal dialog with Escape and focus handling. Retired artists remain restorable even when no active artists remain. The shared capture modal now restores and contains keyboard focus.
- Anonymous preview supports the same capture panel with a local creation callback. Demo capture never invokes Supabase lookup, smart-capture or product-telemetry endpoints. Public identity editors remain read-only illustrations requiring live authentication; the individual preview Overview is a simplified fixture view rather than a rendered clone of the live DJ Overview.
- Validation at this block: 327 assertions through direct test-file execution; staging static generation 36 routes; diff checks clean; rollback-only staging RPC/RLS smoke passed. CI and deployed preview must be verified on the final pushed commit. Browser-authenticated desktop/mobile smoke remains a release gate; the user's local session is not shared with the agent browser. No migration, function deployment, merge or production mutation.

## Team acceptance beta (30 September 2026)

Settings exposes Owner/Admin member management with verified-email, expiring invitations shared as links. No automatic email is sent. Tokens only persist as hashes in the database; the accepting browser removes the link fragment and keeps a pending token in its tab session. Accepting writes workspace membership plus the existing organization bridge in one command; no third roster relation is introduced. Existing Owner roles are never overwritten and consumed links cannot restore a removed member.

Owner can assign Admin/Manager/Editor/Viewer; Admin can manage Manager/Editor/Viewer. Roles cover the entire agency. Manager edits profiles and bookings, Editor operates bookings, Viewer reads. UI read-only does not replace RLS. Per-artist assignment remains explicitly unavailable. Joining a team selects the linked agency via a membership-bound workspace identity query. Signup/signin resumes pending invitations while preserving the normal DJ destination when none exists; opening the original link after email confirmation supports a different browser tab.

Staging migrations and rollback validation are recorded in HANDOFF. Promotional readiness still requires real browser-authenticated invitation/profile/public booking flows and mobile QA; fixture preview is not evidence of authenticated persistence.


## 30 September: one agency workspace and public presentation

Product decision supersedes the older two-context dashboard flow. Selecting an artist filters the same Agency Overview/Bookings/Calendar/Activity. It does not open the DJ dashboard or activation journey. The main navigation is stable; Artists contains the professional record with nested Public Profile / Career / CUE ID destinations. Booking detail stays inside Agency, with explicit artist attribution and a return to the list.

Agency identity is permanently labelled in the shell. Anonymous preview follows the same navigation and scope contract. Settings contains the public-page editor plus existing team management. Public route is `/agency/<organization-slug>`; artist profiles remain `/<artist-slug>` and their booking intake remains the existing Booking Core route. Links carry `src=agency`.

Persistence reuses organizations (agency_public_config / agency_public_enabled) and workspace_artists (catalog_visible default false). The authenticated catalogue command is Owner/Admin only, validates HTTPS links and email, and atomically saves page plus artist selection. Publishing requires bio/contact/at least one eligible artist. An eligible artist is active in this roster, explicitly public and routed to this agency workspace. Public reads reevaluate these conditions, so retirement, unpublishing or route transfer hides the artist. The existing server-only public profile Edge endpoint handles `?agency=<slug>` and signs only artist-owned media paths. Public clients cannot call the internal reader or draft builder. No private fees, bookings, notes, team or negotiations enter this response.

Draft preview uses the same PublicAgencyProfile component, including unsaved edits, and does not publish automatically. Page layout is editorial/industrial with cover, agency identity, bio, responsive artist grid and booking contact. Current image editing accepts HTTPS URLs for agency logo/cover; artist media reuses existing uploads. Dedicated agency uploads, server-rendered social unfurls, per-artist assignment and consented existing-DJ transfer remain follow-ups.

Staging migrations `20260930113404_agency_public_catalog.sql` and `20260930113750_agency_catalog_service_access.sql`; public profile Edge v20. Production unchanged. Rollback SQL verifies owner publication, unready artist rejection, invalid links, nonmember isolation, narrow public roster and immediate unpublication. Tests include the compiled actual AgencyWorkspace scope across artist changes, bookings and calendar.
