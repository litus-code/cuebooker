## 2026-10-17 / Production delta rehearsal infrastructure PR118 prepared

Application candidate9bd56509bb9aba2176b55483988df80c05b1fd6a on PR114 has CI38976682744 and preview38976682708 SUCCESS. Two staging migrations and hosted QA results below are committed; production is unchanged.

Prepared separate draft PR118, chore/production-delta-rehearsal-20261017, exactSHA72ccedfd66b95e672e360cd4f24ed99d10d21f0f, based only on main3b6d3724f22d4209fad30b5beef6f04ad0fa1364. Six infrastructure files pin fresh verified backup38889098646/attempt1 and exact39-file candidate9bd56509. The disconnected runner checks production-only function/trigger fingerprints before/after,81-entry baseline ledger, protected counts/FKs/RLS, private attachment writes/bucket, campaign service grants/private tables/test mode, paused jobs and observer-disabling rollback. New exact GitHub Pages push exclusions prevent infrastructure-only publication. Existing main-only/manual confirmation, protected environment, read-only permissions and disconnect-before-decrypt/cleanup stay intact.326 main-based tests, nine focused infra regressions, YAML and all39 actual SQL hashes pass locally. PR118 CI38976909615 and preview38976909571 SUCCESS; stable-staging publication is not part of this infrastructure change.

Next action requires explicit owner approval to merge ONLY PR118 and run the isolated release rehearsal. No main merge or dispatch has been performed. The workflow's main-only guard prevents validating this new delta by rerunning the old registered source. PR114 remains draft/unmerged. A passing SQL rehearsal would still leave complete Edge/provider/Auth/Storage rollback/deployment preparation and final production approval separate.

## 2026-10-17 / Hosted API campaign funnel, FK indexes and last-owner cleanup repair

PR114 integration/beta-home21-review, parent9fcdf0bcbff92280e7675a6272a0587f89ece1d7. Beta0.0.13 unchanged; production/merge untouched. Owner authorizes continuation after real recovery password-change/sign-in acceptance. Dedicated disposable QA scope only.

Hosted collector/Auth signup/sign-in/onboarding/workspace/publication checks and Core service SQL first-enquiry command yield one fact per milestone and six-step report with five1/1 conversions. Auth confirmation is a scoped SQL fixture, report is authenticated-admin SQL context, Core command does not invoke outbound Edge mail. Do not claim a new full-browser/deliverability journey. Actual HTTP non-admin report denied400/P0001/internal_admin_required; other-workspace booking reads return zero rows. Duplicate request reuses booking, second enquiry keeps one activation in rolled-back fixture. Consent withdrawal/log-out pass and all temporary account/entity/workspace/request/queue/campaign records removed. Owner's manually tested accounts untouched. Evidence/limits in STAGING_CAMPAIGN_ACCEPTANCE and safe campaign-api-qa-summary.json.

Added campaign FK indexes (source20261016220553, hosted20261016220631): relevant advisories disappear,8→6 pre-existing other FK findings.49 isolated campaign assertions pass. Cleanup exposed legacy am.id/om.id lookup on composite-key memberships in both projects. Added fix_membership_owner_guards (source20261016223115, hosted20261016223158): use user_id, serialize parent changes, preserve last-owner denial and parent cascades. Old source fails regression;16 isolated cases and hosted rollback checks for artist/organization plus actual cleanup pass. Both applied only to staging.608 application tests and44-route generation pass. No further UI change.

Prepared39-file production SQL candidate (old30+six attachment/diagnostics+campaign+FK indexes+owner repair), excluding historical aliases/bootstrap migrations. Live production81-entry ledger/catalog inspected read-only; two production-only Next Move/billing functions/triggers must be preserved. Production Edge/provider/Auth/Storage reconciliation remains required. Existing main release workflow still pins old October4 backup/candidate; prepare separate bounded infrastructure PR from main with fresh verified38889098646/attempt1 backup and exact new candidate. No workflow dispatch, main merge or production application authorized by this checkpoint. Next: finish/register reviewable isolated delta rehearsal infrastructure, obtain owner integration approval, execute/check it, then finish remaining deployment/rollback gates. Do not call production ready.

## 2026-10-17 / Explain same-password recovery errors

PR114 integration/beta-home21-review, parent e733ed622595492684fa0f206ed7eaede5ea3489, Beta0.0.13 unchanged. Owner's fresh recovery email now opens the password form. Hosted Auth21:57:07UTC /user GET200 verifies the recovery link;21:57:29UTC PUT422/same_password explains the subsequent screenshot. Owner confirms a different password was saved successfully and sign-in with the new password worked. Real browser recovery acceptance is now complete.

At owner's request, reset-password.vue maps the structured Supabase response data.code=same_password to localized ES/EN copy explaining that the new password must differ from the current one. Keeps the valid recovery session/form ready for retry, clears the message on resubmission and exposes it as an accessible alert. Unknown failures retain safe generic copy without incorrectly requiring another recovery email. No raw provider messages or credentials displayed/logged. Two new behavioral regressions cover both languages, failure then corrected retry/sign-out and safe unknown-error handling; both fail old source. All608 tests pass; static generation44 routes passes. Executable source7015aa79b5c0b19d9041a6e91dcdf5bc0224e75b: CI38973129449 SUCCESS; preview38973129482/job117216043015 SUCCESS. Hosted same-password UI submission is not repeated by the agent; ES/EN failure and corrected retry are covered by executable page/composable regressions. Owner reset/sign-in acceptance is recorded independently above. No Auth policy/configuration, schema, Edge or real-user password changed. Production and merge remain untouched.

## 2026-10-16 / Password recovery fragment hydration fix

PR114 integration/beta-home21-review, parent349e4f16d120acce2deb9143911fb601285a82af, Beta0.0.13 unchanged. Owner reports Manager restrictions and preserved DJ workspace accepted. Recovery email initially redirected to localhost; owner was guided to staging Auth URL configuration. Latest new email reaches reset-password but reports invalid/expired. Do not mark recovery accepted yet.

Reproduced the page/composable initialization defect: Nuxt4.6 prerender hydration temporarily replaces the original URL with its payload route, then restores the recovery fragment at app:suspense:resolve. reset-password.vue consumed window.location.hash in onMounted, before restoration. Changed to onNuxtReady, preserving the existing server /auth/v1/user token verification, recovery-session requirement, URL credential cleanup, password update and sign-out. No Auth policy or token verification weakened. Also constrained the recovery heading to28–40px with wrapping to prevent the screenshot's desktop overflow.

Four executable page-plus-real-composable regressions cover deferred fragment verification/cleanup, reload then password update/sign-out, expired/incomplete denial and ordinary-session denial. Direct-open tests fail old source and pass fixed source. All606 tests and static generation44 routes pass locally. Executable source e9725f469595732a14230557c1f7b3255c0fb369: CI38972445479 and preview38972445563/job117213801768 SUCCESS. Published browser synthetic recovery link reaches Auth /user; hosted Auth log21:55:31UTC returns403/bad_jwt for the deliberately fictitious token, confirming the fragment is now read and verified by the server. Heading computed40px, width494px equals scrollWidth inside560px panel, visually checked desktop. No real password reset or mobile viewport check claimed. No hosted SQL, Edge Function, Auth configuration, real-user password, production or merge change. Next: owner completes fresh-email password reset and sign-in themselves. Campaign journey, FK indexes and production reconciliation gates remain pending.

## 2026-10-16 / Home demo next/restart button hover

PR114 integration/beta-home21-review, parent ccaa6209a9af5664b67c131304c31a4087af0e84, Beta0.0.13. Owner identified the remaining Home demo next/restart action (Volver al inicio at final step). Changed its default text/arrow from permanent accent to muted gray, with shared accent on hover/focus-visible. Arrow inherits currentColor. Removed the light-theme always-accent exception for this action so feedback also applies there. Demo cycling behavior unchanged. Home SFC/scoped CSS and diff whitespace checks pass. Source e3d6a436cff8bf7328cb56f5b911773145ce0f09: CI38969619128 and preview38969619137 SUCCESS. Published browser confirms default next-action text and arrow rgb151/151/147; after focusing the final-step Volver al inicio action, both text and arrow resolve rgb216/245/107. This block verifies feedback only, not a new full demo functional acceptance. No backend, merge or production change.

## 2026-10-16 / Remove redundant Home CUE ID link; workflow step hover

PR114 integration/beta-home21-review, parent ecdac93cc5f7e83e9715d8eaecca4a37a309473b, Beta0.0.13. Owner screenshot requests: removed only the redundant Home CUE ID arrow link from the development notice, retaining the notice and full DJ landing CUE ID section. Added hover/focus-visible feedback to unselected Home workflow tabs (Captura/Revisa/Haz seguimiento/Confirma): accent title/index/arrow, subtle tinted background and accent left edge. Selected-step rendering and tab selection/keyboard/domain behavior unchanged. Both Vue SFCs/scoped styles compile and diff whitespace passes. Executable source d14e03a3591ea722619ba53b6a19de78f81de5c1: CI38969169956 and preview38969169918 SUCCESS. Published Home contains zero links in the CUE ID development notice. Keyboard focus on unselected Revisa keeps aria-selected=false and shows lime title/left border, arrow opacity1 and6% accent background, verifying the shared hover/focus CSS without changing the selected step. No backend, merge or production change.

## 2026-10-16 / Home footer single desktop row and remaining public link feedback

PR114 integration/beta-home21-review, parent HEAD b0f355f9ce7debce0d668455ffbf0ab01063f92d. Beta0.0.13 unchanged. Owner requested all Home footer content in one desktop row and another public-link hover sweep. Footer now aligns logo/tagline, legal/contact/preferences links and copyright horizontally above1200px, wraps deliberately below that width, and stacks brand/tagline on narrow mobile without forcing overflow. Prior public navigation/audience/footer accent states retained.

Source sweep found additional missing feedback on landing screenshot enlargement links, brand home links, cross-audience closing links and unselected section controls. Added accent outline/zoom cursor to screenshots, subtle opacity to logo links, heavier underline on colored closing sections (avoids lime-on-lime text), and accent feedback on unselected controls; selected controls retain readable ink. Same keyboard focus treatment. Vue SFC/scoped CSS and landing PostCSS parse passed; source c094be529746b250d9737775656318379ca1a97c CI38968424091 and preview38968424130 SUCCESS. Published desktop Home visually checked at1348px: logo/tagline, nav and copyright share the same vertical center; footer width1240px equals scrollWidth (no overflow). Published screenshot link focus shows2px lime outline and zoom-in cursor. Responsive breakpoints inspected in CSS; no actual mobile viewport check claimed in this block. No routes, tracking, Auth, backend, merge or production deployment changed.

## 2026-10-16 / Public Home/DJ/Agency hover polish

PR114 branch integration/beta-home21-review, parent HEAD f006cfda4022edace179f2f972128ba5bf43a701, Beta0.0.13. Owner accepted invitation button alignment. Manager role/administration restrictions still await the requested owner check.

Owner requested consistent menu/link hover feedback, including Home audience links to DJ/Agency and muted landing navigation. Home header and audience title/discover links now share accent hover/focus-visible, landing nav defaults to theme muted gray and changes to readable accent on hover/focus-visible. Shared public mobile-menu text uses muted/accent states while the signup CTA retains its filled treatment. Footer links and landing secondary CTA also gain consistent hover/focus feedback. Existing theme tokens preserve dark lime and light palette contrast. Keep natural-case navigation labels, reserve uppercase for existing editorial headings. No route, analytics or auth behavior changed. Initial source9af95f8 CI38967571030/preview38967571237 passed. Follow-up also covers the Home ecosystem discovery/CUE ID links and disables color transitions for reduced-motion preference. Final source920e8db8241b9200930f06eb44b8e09b31b5c85d: CI38967801926 and preview38967801916 SUCCESS. Published browser checks: Home audience and ecosystem discovery links reach rgb216/245/107 on keyboard focus; DJ and Agency desktop nav defaults rgb151/151/147 and focused links reach the same lime. DJ light theme defaults rgb98/98/94 and focus uses the theme violet accent; restored dark preference afterward. Identical hover/focus CSS selectors compiled successfully. No direct pointer-hover persistence or actual mobile viewport validation claimed in this block. PR114 draft/unmerged; production unchanged.

## 2026-10-16 / Agency invitation button alignment and owner acceptance

PR114 branch `integration/beta-home21-review`, parent HEAD `dc389dd08feecc65e5d820e110e0c40da56752e4`, Beta0.0.13. Owner reports the corrected invitation flow worked with the existing DJ account. This confirms the reported acceptance flow only; per-role authorization and workspace switching still require their own checks.

At the owner's request, agency-invite.vue now groups actions in equal-width grid columns with centered labels, equal row height, established control radius and visible keyboard focus. Primary/leave actions share one row at desktop and390px; very narrow screens up to360px stack equal full-width controls. Error actions use the same grid, with an odd final action spanning the row. Authentication/token/RPC behavior unchanged. Six existing invitation/team regressions pass locally. Source c92b3d47a38d38fca08780fcf3062019ef2ab291: clean CI38966931502 and preview38966931883 SUCCESS. Local generation attempt failed due shared node_modules Nuxt cache resolution (#internal/nuxt/paths), superseded by passing clean CI and preview builds. Published browser verification confirms the signed-out sign-in/leave buttons share y600.0625, width243px, height52px, centered text and flex justification. Desktop screenshot visually reviewed; responsive CSS inspected, no actual mobile browser viewport check in this block. No backend change, merge or production deployment.

## 2026-10-16 / PR114 agency invitation direct-open hydration correction

Branch `integration/beta-home21-review`, parent HEAD `e5c7b90b5c273a91cb0baa83a7d93078d4e421f3`, Beta0.0.13 review candidate. Owner confirmed the authenticated Campaigns panel loads (availability only, not the complete attributed signup funnel). At the owner's explicit request, created a separate synthetic staging Auth user and empty agency QA workspace. Auth was provisioned through a scoped SQL fixture with bcrypt password and email identity, then real HTTPS password sign-in, authenticated complete_onboarding and ensure_booking_workspace RPCs passed; verification sessions logged out. No password or invitation token belongs in repository docs. This is a manually confirmed fixture, not evidence of signup email delivery or campaign signup attribution.

Owner browser evidence confirms agency Owner access, Manager invitation creation/copy, revocation and authenticated refusal of the revoked link. Leaving the invitation correctly returns the already-authorized Owner to the agency workspace. A subsequent invitation to the owner's existing DJ account is pending acceptance; do not claim Manager permissions or multi-workspace switching accepted yet.

Reproduced a direct-open defect on the published PR114 preview using a synthetic 64-character fragment: the URL retained the token but the UI incorrectly requested the original link. Nuxt4.6 prerender hydration temporarily exposes the payload route without query/fragment until app:suspense:resolve. agency-invite.vue read route.hash in onMounted before that restoration. It now reads onNuxtReady, after restoration, retaining strict token validation, per-tab sessionStorage and URL-fragment removal. No backend permissions, database schema or auth policy changed. Added three behavioral regressions for deferred fragment restoration/URL clearing, same-tab sign-in return, and missing/malformed links. Direct-open regression fails old source; all602 tests pass fixed source. Static generation passed (45 prerender entries). Executable commit45f051c810b8047e584113279138bf8b2721d52a: CI38959939373 and preview38959939376 SUCCESS. Fresh published browser tab with a synthetic 64-character token now reaches the sign-in CTA, removes the fragment from the URL, and retains the invitation after reload in the same tab. No real invitation accepted by the agent; owner must still complete the existing invited-account acceptance.

Production remains unchanged; PR114 remains draft/unmerged. Next: verify corrected published direct-open link, then owner completes the existing real invitation as the invited DJ account. Remaining production reconciliation, FK indexes, analytics Auth journey and recovery gates remain pending. Preserve accepted Gmail/attachments/DJ/ESEN/mobile checks.

## 2026-10-16 / Corrected full rehearsal PASSED; staging analytics SQL/Edge/retention deployed and hosted checks recorded

Owner approved PR117 merge and new main rehearsal. Main now `3b6d3724f22d4209fad30b5beef6f04ad0fa1364`. Corrected current-staging run38942042150/job117111828767 SUCCESS, including export/disconnected restore/exact SQL/protected counts/FK/RLS/service grants/non-admin report/test mode/cleanup. This supersedes earlier failed-RPC/connection gates. SQL source7111f15 and hash verified by runner.

Continued the already-authorized staging-only analytics block. Applied exact campaign SQL to lycprjeuuynfzwskycwv; ledger version20261016174815/name campaign_funnel_analytics maps to pending source file20261016120000_campaign_funnel_analytics.sql. Preserve this explicit mapping, never blindly db push/replay. Existing operational/Auth/legacy event counts preserved; private RLS/no-client access and service-only RPC matrix verified hosted. Dataset=test.

Deployed complete campaign-analytics bundle. Hosted withdrawal revealed void204 JSON parsing defect; fixed in `af6af0ed603fa54c4b162c99b1f82eae91463d27`, regression fails old adapter and passes fixed.599 unit tests pass; CI38943081504 and preview38943081563 SUCCESS. Final Edge version2 ACTIVE; retrieved3 deployed modules byte-identical to source. Real HTTP checks:204/405/400/413 cases, valid/retry persistence dedup, successful idempotent withdrawal and post-withdraw rejection. Anonymous direct REST RPCs denied401/42501. SQL-context authenticated non-admin report/purge rejected; SQL-context internal-admin aggregate contract passes. These are not a real authenticated browser acceptance.

Daily retention job10 active03:17UTC. Temporary QA job11 successfully ran the same purge helper, removed the91-day synthetic event/consent/acquisition, then was unscheduled. Final campaign events0/optional acquisition0; legacy3/bookings15/mail27/Auth6 unchanged. No real account/invitation/enquiry/email created/sent. No secrets read/changed by agent. Two unindexed campaign FKs remain INFO performance follow-ups; private no-policy and authenticated admin-wrapper advisories reviewed/intentional, other baseline warnings unchanged. Do not call all advisors clean.

Full evidence/limits/remediation URLs: [STAGING_CAMPAIGN_ACCEPTANCE](reviews/release-0.0.13/STAGING_CAMPAIGN_ACCEPTANCE.md). Next: real authenticated Campaigns/Auth analytics acceptance, remaining controlled agency/recovery cases, FK-index follow-up and explicit production reconciliation/delta rehearsal. Preserve already-accepted Gmail/attachments/DJ/ESEN/mobile checks. PR114 remains draft/unmerged, Beta0.0.13; production read-only check confirms campaign absent. No production deployment/release readiness claim. This follow-up commit records operations/evidence only.

## 2026-10-16 / Corrected campaign candidate and rehearsal PR117 ready for owner integration decision

Corrected immutable candidate `7111f156aefa09dfab8cad721422607460d9c4be` on PR114 includes only pending-SQL explicit client revokes, adversarial-default SQL regression and release docs.599 unit tests,49 isolated PostgreSQL assertions (old SQL fails the new privilege check), static build44 routes and whitespace pass locally. Candidate CI38941525855 and PR preview38941525877 SUCCESS. Beta0.0.13 frontend/domain behavior unchanged; SQL remains unapplied hosted. No visual re-audit needed for unchanged UI.

Separate bounded draft [PR117](https://github.com/litus-code/cuebooker/pull/117), branch chore/campaign-rpc-rehearsal-20261016, exact HEAD `6ef2b8fac8f118a0f86051be23321e04d3cf18e5`, based only on main6697cb04792fd20bec623ac2dac3ad0632914579. Four existing infrastructure files repin workflow checkout, runner candidate/hash, matching assertion and release status to corrected7111f15. Six focused infra regressions, YAML parsing and corrected SQL checksum pass. CI38941622322 SUCCESS; preview38941622369 job SUCCESS, stable-staging job SKIPPED. Existing guards and all export/isolation/cleanup code unchanged. No new connection/secret work required.

Owner has approved PR116, not this subsequent PR117 main integration. Next concrete action: approve merging only this bounded infra PR117, then dispatch a NEW main Isolated Staging Campaign Rehearsal (confirm cuebooker-staging-campaign). Existing old run38932556643 attempt4 PASSED current-staging export/isolated restore and FAILED old campaign RPC privileges; retrying it still runs old pinned SQL. Do not claim a corrected full rehearsal until the new actual run passes. On success continue already-authorized staging analytics/complete Edge/retention/test/advisors/runtime acceptance. PR114 remains draft/unmerged; production release/delta reconciliation and remaining agency/recovery acceptance remain pending. No production or hosted analytics mutation performed. This follow-up commit is documentation-only and does not alter the pinned candidate.

## 2026-10-16 / Current-staging restore PASSED; isolated campaign ACL mismatch reproduced and corrected

Owner updated secure staging URI and authorized retry. Run38932556643 attempt4/job117106725063 on main6697cb04792fd20bec623ac2dac3ad0632914579 reached the actual export/restore. Read-only staging roles/schema/data export, temporary AES256 snapshot, disconnected PostgreSQL17 import, all COPY counts, FK, RLS and unidentified-caller denial PASSED. The exact prepared campaign migration executed locally and preserved protected counts/domain definitions; its subsequent service-only RPC grant assertion FAILED with `Campaign RPC privileges mismatch.` Cleanup completed. This is a successful current staging logical restore and a failed campaign acceptance, not a passing rehearsal. No hosted analytics SQL/Edge/cron applied; production untouched. The connection now works; owner need not change credentials again.

Root cause independently reproduced with adversarial default privileges: restore executes as supabase_admin, whose actual staging public-function defaults directly grant EXECUTE to anon/authenticated/service_role. Read-only catalog confirmed postgres defaults differ (owner-only), so the mismatch is owner-default dependent rather than proof that a hosted postgres application already exposed these functions. Prepared SQL revoked PUBLIC only for record_campaign_event/revoke_campaign_consent, leaving direct client-role grants when created by supabase_admin. Correction explicitly revokes PUBLIC, anon and authenticated for both, then retains service_role EXECUTE. No default ACLs/roles, other functions, UI or domain behavior changed.

Synthetic SQL test now sets the directly observed public-function client defaults before the pending migration, and asserts both RPC signatures against anon/authenticated/service_role. Regression fails on old SQL at anon collector privilege; corrected SQL passes49 PostgreSQL assertions (43 existing +6 privilege-matrix checks). All599 repository tests pass locally. Static build44 routes and whitespace check also pass locally. This remains minimal-schema PGlite evidence, not the corrected full staging restore result. Migration file is still unapplied hosted, so editing the existing pending file is intentional. Candidate stays Beta0.0.13, PR114 draft/unmerged.

Next: pin the corrected immutable candidate and migration hash in a separate bounded main-based rehearsal infrastructure PR, retaining main-only/staging/TLS/isolation/cleanup guards. Owner integration approval is required for that new infra revision; retrying old run38932556643 would still execute old SQL and cannot validate this correction. After a passing actual corrected rehearsal, continue already-authorized staging-only campaign SQL/full Edge/retention/test/advisors/acceptance. Agency/recovery, production delta rehearsal and explicit production release gates remain pending. Preserve accepted Gmail/attachments/DJ/ESEN/mobile checks.

## 2026-10-16 / Owner requests retry after credential setup, attempt3 still pre-connect format rejection

Re-ran only failed jobs of authorized run38932556643. Attempt3/job117104551813 completed FAILURE at first URL validation, safe diagnostic at17:28:21Z `Missing or invalid secure staging database connection.` Source remains main6697cb04792fd20bec623ac2dac3ad0632914579. Setup/checkouts/CLI succeeded. No network authentication, export, snapshot, local restore or campaign SQL rehearsal occurred. This does not show a bad password or a Supabase outage. No credential values accessed; no repeated retry until format evidence changes. Owner has been guided through password reset/update, but successful rotation/secret correctness is not independently established. Request only a connection structure with the entire password replaced by OCULTA before sending, or improve safe categorical validation diagnostics through a separately reviewed infra change. Never request or print the real password/secret.

Production unchanged; PR114 remains draft/unmerged, Beta0.0.13 runtime source unchanged. Current staging rehearsal and all later analytics/backend release gates still pending. No password/secret mutation performed by agent. This commit records the failed run only; no tests/build needed for unchanged executable sources.

## 2026-10-16 / Staging postgres-password reset impact reviewed, not performed

Owner cannot locate the original staging DB password and agrees to a dependency review before manually resetting it. No password/credential reset, new credential entry, secret change, hosted schema mutation or production operation performed. Reviewed exact candidate69172db62772a0f294482d4c9f92f4fb94edf6dd tracked source across application, server, Edge, workflows and scripts for direct PostgreSQL URLs, DB_URL/DATABASE_URL/DB_PASSWORD/PGPASSWORD/PGHOST and database drivers. Frontend/runtime and repository Edge sources use Supabase HTTP APIs/publishable or service-role credentials; the candidate's only hosted direct DB consumer is production backup, independent of staging. Main's newly integrated staging rehearsal separately uses CUEBOOKER_STAGING_DB_URL, which must be replaced after a staging postgres-password reset. Local restore uses fixed disposable credentials and is unrelated.

Official current docs verified: https://supabase.com/docs/guides/database/postgres/roles states managed PostgREST/PgBouncer/services update automatically, while external username/password connections require manual update. Reset UI location is project Database Settings. Changelog fetched; no credential-rotation change identified for this plan. Read-only current staging pg_stat_activity aggregate returned role/count metadata only (no queries, addresses, secrets or user records); not proof that unknown/offline external clients do not exist. Deployed Edge bundles/configured external clients are not exhaustively audited by repository inspection. Owner should update any separately configured SQL GUI/CLI client if used. No API-token/JWT/Gmail credential rotation is required by this plan.

Next user action: manually reset only staging lycprjeuuynfzwskycwv postgres password in Database Settings, save new value in a password manager, substitute it (URI-encoded if containing reserved characters) into that project's Session pooler URI, update GitHub staging CUEBOOKER_STAGING_DB_URL, never chat/repo. Agent must not enter/change authentication credentials through browser automation. After owner reports saved, repeat same authorized isolated rehearsal; no production password change, app merge or backend release authorization is implied. Current run38932556643 attempt2 remains failed before connection validation, analytics hosted gates pending. This commit documents read-only impact review only; no new tests/build needed for unchanged runtime sources.

## 2026-10-16 / Staging rehearsal retry2: secret delivered, connection format rejected

Owner reports adding the requested secure secret. Re-ran only failed jobs of run38932556643 through GitHub Actions connector. Attempt2/job117088908304 completed FAILURE on the same authorized mainSHA6697cb04792fd20bec623ac2dac3ad0632914579. Checkouts/CLI setup/cleanup passed; runner stopped at first URL validation with `Missing or invalid secure staging database connection.` Logs show the environment input MASKED rather than empty: the secret now reaches the job. No value was accessed, printed, extracted or requested. This supersedes uncertainty about delivery for attempt2, but does not establish which format requirement failed. Validation happens before CLI export/network connection, so this is not evidence of an incorrect database password or hosted outage.

Exact validator independently reviewed at immutable run source: postgres/postgresql URI; exact staging host or session pooler username postgres.lycprjeuuynfzwskycwv; path /postgres; port5432 (not6543); nonempty password; no fragment; optional query parameters restricted to sslmode=verify-full and sslrootcert=system, with omitted settings normalized to those secure defaults. A copied weaker sslmode=require is rejected. Do not weaken TLS, reset credentials or ask for the whole connection string in chat. Ask owner only for non-sensitive format details (port and presence of sslmode query) before another retry. Wrong project/quotes/command prefixes/URI-sensitive password characters are other possibilities, not established diagnoses.

No current-staging export/snapshot/restore/migration rehearsal or hosted analytics deployment happened. Production remains untouched; fresh production logical restore stays PASSED. PR114/Beta0.0.13 application unchanged, still draft/unmerged. Next: correct secure staging secret format after identifying the mismatch; existing authorization covers repeating this same isolated workflow. All later staging analytics/advisors/Edge/retention/acceptance and production reconciliation/release gates remain pending.

## 2026-10-16 / Owner-approved PR116 merged; staging rehearsal stopped at connection validation

Owner explicitly approved infrastructure PR116 integration and isolated rehearsal. PR116 merged into main at `6697cb04792fd20bec623ac2dac3ad0632914579`, exact reviewed head65097c73a81ba6d27a345187b6a549e23ada2426. Dispatched Isolated Staging Campaign Rehearsal on main with confirm `cuebooker-staging-campaign`. [Run38932556643](https://github.com/litus-code/cuebooker/actions/runs/38932556643), job117079913174, completed FAILURE. Both checkouts and CLI setup passed; runner stopped at its first connection validation with safe authored diagnostic: `Missing or invalid secure staging database connection.` No export, snapshot, local restore, migration SQL apply, hosted mutation or analytics deployment occurred. No credentials/private data logged. [Run evidence](reviews/release-0.0.13/staging-rehearsal-38932556643.jpg).

This proves the workflow did not receive a connection satisfying its exact staging/TLS/session contract; it does not distinguish absent secret from malformed value. Needed: secure GitHub environment `staging` secret `CUEBOOKER_STAGING_DB_URL`, targeting only lycprjeuuynfzwskycwv via direct host/postgres or session pooler/postgres.lycprjeuuynfzwskycwv port5432, path /postgres. Runner adds sslmode=verify-full and sslrootcert=system when omitted; explicitly weaker SSL settings are rejected. Never paste values in chat or files. Protected secret configuration inspection remains blocked, so no browser credential probing/configuration change was attempted. Owner must configure/check it securely, then re-run this failed job. Existing authorization covers the same isolated rehearsal retry; no new main merge is needed.

PR114 application unchanged, Beta0.0.13. Production logical backup/restore38893078933 stays PASSED. Current-staging campaign rehearsal and hosted analytics/Edge/retention acceptance remain pending. Main received only authorized infrastructure; no production app/backend deployment or PR114 merge. Preserve accepted Gmail/attachments/DJ/ESEN/mobile checks and pending agency/recovery/production reconciliation gates. This candidate commit updates handoff/evidence only.

## 2026-10-16 / Current-staging campaign rehearsal infrastructure prepared, PR116

Separate draft [PR116](https://github.com/litus-code/cuebooker/pull/116), branch `chore/staging-campaign-rehearsal-20261016`, exact HEAD `65097c73a81ba6d27a345187b6a549e23ada2426`, based solely on main `bd22cd35c1624bf49c64a284d0ff2fa8d7283d02`. Eight infrastructure files; no application/migration/Edge source change. Adds manual main-only staging-environment read-only export plus ephemeral AES256 snapshot, disconnected local restore, exact campaign SQL hash/source pin and compatibility/access assertions. Source candidate stays `69172db62772a0f294482d4c9f92f4fb94edf6dd`, Beta0.0.13. Existing production restore defaults and workflow preserved; stage connection is scrubbed from child environments. No archive is uploaded; plaintext/temp/passphrase cleanup covered. Exact infrastructure push exclusions prevent this bounded integration from publishing the app/stable staging; PR validation stays enabled.

Actual LOCAL evidence for main-based infra branch: six focused regressions pass, full suite325/325, static build34 routes, three YAML workflows parse, reviewed SQL SHA256 matches, whitespace clean. These are separate from the unchanged PR114 candidate599 tests/44 routes and43 synthetic PostgreSQL assertions. CI38929368783 and preview38929369108 both completed SUCCESS at exact infra HEAD65097c73a81ba6d27a345187b6a549e23ada2426; stable staging job117069093576 is SKIPPED. No current-staging snapshot/export/restore/campaign rehearsal or hosted analytics deployment has run.

Secure prerequisite: GitHub `staging` environment needs `CUEBOOKER_STAGING_DB_URL`, exact stage project via direct/session port5432, TLS verify-full/system roots. Presence is UNVERIFIED: browser credential-protection blocked secret configuration inspection, so automated inspection stopped. No credentials/secret values read, no environment/protection/secret changed, no paid project/branch created. Configure only through secure GitHub settings, never chat or repository.

Next requires owner's separate authorization for bounded infra PR116 main integration, then main dispatch with confirm `cuebooker-staging-campaign` and any existing environment review. Actual passing rehearsal is required before the already-authorized staging-only campaign migration/full Edge/retention/test collection/advisors/hosted acceptance block. Instructions/limits in PR116 `docs/RELEASE_REHEARSAL_STATUS.md`. Production restore38893078933 remains PASSED. Preserve accepted Gmail/attachments/DJ/ESEN/mobile checks; agency roles/password/failed-attachment recovery and explicit production reconciliation/release approval remain pending. PR114 stays draft/unmerged; this candidate commit updates documentation only.

## 2026-10-16 / Fresh backup isolated restore PASSED

Owner approved the protected environment for run38893078933. Exact mainSHA `bd22cd35c1624bf49c64a284d0ff2fa8d7283d02`, restore job116947026773 completed SUCCESS. Downloaded current encrypted backup run38889098646/attempt1, artifact12041757362. Workflow steps all passed, including cleanup. Safe log confirmation at2026-10-16T11:29:27Z: import, all COPY row counts, foreign keys, restored RLS and unidentified-caller denial passed; no private data logged. The unchanged runner decrypts only after disconnecting its disposable PostgreSQL17 container and invokes cleanup in finally. This closes fresh **production logical DB backup and isolated restore verification**, superseding pending/waiting statements below.

No hosted database restore, application/backend publication, credentials change or production data mutation. DB backup does not include Storage object bytes or platform/provider configuration. No claim of current staging snapshot, campaign-migration rehearsal, complete production delta rehearsal or tenant-role journey acceptance.

Next authorized staging block: obtain a current staging snapshot through the secure export path, rehearse exact `20261016120000_campaign_funnel_analytics.sql` against its isolated restore, then apply approved staging-only campaign SQL/complete Edge bundle/retention with dataset=test and verify advisors/consent/attribution/dedup/report/runtime. Source/inventory alone and old fixed30-file rehearsal do not replace this requirement. Controlled agency/password/failed-attachment recovery acceptance and explicit production reconciliation remain pending. Preserve accepted mail/attachments/DJ checks. PR114 remains draft/unmerged, Beta0.0.13 application unchanged.

## 2026-10-16 / Owner-approved infra merge completed; fresh restore run awaiting environment review

Owner explicitly approved PR115 merge and isolated restore execution. PR115 merged at `bd22cd35c1624bf49c64a284d0ff2fa8d7283d02`. Main change is the5-file infrastructure-only repin/exclusions; no application/backend publication. GitHub browser authentication completed and Isolated Backup Restore Drill dispatched on main with confirm `cuebooker-isolated-restore`. Independently verified via Actions API: [run38893078933](https://github.com/litus-code/cuebooker/actions/runs/38893078933), status WAITING, exact mainSHA bd22cd35c1624bf49c64a284d0ff2fa8d7283d02. This run uses current encrypted backup38889098646/attempt1/artifact12041757362. Owner must review the existing protected production environment for this specific run; the earlier backup approval does not automatically approve the separate restore job.

Next: approve run38893078933 environment review, monitor actual disconnected restore/import/count/FK/RLS/denial/cleanup result and record success/failure. Do not rerun old backup/restore jobs or merge PR114. Current-staging snapshot/analytics rehearsal, hosted analytics and agency/recovery acceptance still pending. No restore success or production release readiness claimed.

## 2026-10-16 / Restore infrastructure PR115 ready for owner merge decision

Draft PR115 final HEAD `7c2eb160ee3508b326d23503ac510d8c2502f3e3`;5 files total: restore workflow, CI/Pages exact maintenance push exclusions, existing restore safety regression repinned, release-status doc. CI38892008356 and preview workflow38892008113 SUCCESS; stable staging job SKIPPED. Two restore parser/isolation/diagnostic regression tests also passed locally; all original security assertions retained. Earlier initialCI38891870273 failed because the existing test still pinned the old artifact; corrected in the final reviewed revision, no guard removed.

Backup run38889098646 remains SUCCESS, artifact12041757362/current encrypted archive available until October23. Owner main-merge authorization is needed only for bounded infrastructure PR115; existing workflow main-only guard and production environment review remain. No main merge, restore, paid service, hosted mutation or production application deployment performed. PR114/Beta0.0.13 application remains unchanged. Next: owner decides PR115 integration; after approval, run its main-only isolated restore and review environment gate. Current-staging migration rehearsal and later production release approval remain separate.

## 2026-10-16 / Fresh production DB backup completed; isolated restore repin prepared

Owner approved the protected environment gate. Run38889098646/attempt1, job116933969537 completed SUCCESS at11:07Z: roles/schema/data export, AES256 encryption, byte-for-byte decrypt roundtrip and encrypted-only artifact upload passed. Artifact12041757362 (`cuebooker-production-db-38889098646-1`),43464 ZIP bytes, digest `sha256:862f232b473e32391d74f69fa32fc2ee2a234569dc11ce814e8f5796667dfe2a`, expires2026-10-23T11:07:25Z. Source main remainsbbdf29122f704039b353fa4eed788bfdfef5aaa7. No restore success is claimed.

Existing Isolated Backup Restore Drill is main-only and still downloads the old October4 artifact. Prepared separate draft [PR115](https://github.com/litus-code/cuebooker/pull/115), exactSHA `a83a60b786eb4df69770e088a6b54735f78391e9`, branch `chore/restore-backup-20261016` based solely on main. Only repins run/name in restore workflow; Python implementation, main-only guard, explicit confirm, protected production review, read-only permissions and pinned actions/CLI unchanged. Bounded CI/Pages push exclusions prevent these exact4 maintenance paths from publishing frontend/stable staging when integrated alone; application/mixed changes still trigger normal publication. No main merge or deployment performed. Local YAML parsing/guard/artifact/path-filter assertions passed; PR CI result must be checked separately.

The runner cannot decrypt here: no backup passphrase or Docker runtime is available, and no secret is requested in chat. Do not broaden the workflow to arbitrary feature branches or evade environment review. Next concrete action requires owner authorization for this infrastructure-only main merge after green CI, then main workflow dispatch with `cuebooker-isolated-restore` and its protected-environment review. This approval does not authorize PR114/application/backend production release.

Current-staging snapshot/analytics rehearsal remains a separate pending prerequisite. Production backup omits Storage object bytes and external configuration. Previous WAITING-backup statements below are historical and superseded by this completed export; hosted analytics/P1/production release remain pending. Beta0.0.13 application unchanged; only documentation updated in PR114.

## 2026-10-16 / Work Mode resumes Beta0.0.13 — authenticated backend comparison

Owner asks Work to continue the prepared release. Reviewed candidate/application unchanged at `69172db62772a0f294482d4c9f92f4fb94edf6dd` / application `fbc6b09`, Beta0.0.13. Read-only comparison report committed at `0574df5aad35c2c7f120a428bb8d473a8723fda5`: [WORK_BACKEND_COMPARISON](reviews/release-0.0.13/WORK_BACKEND_COMPARISON.md). No production/main merge authorization added.

Supabase management access works in this Work session for staging lycprjeuuynfzwskycwv and production qlocooqfdzehogbwcbhr. This supersedes the previous runtime-access blocker only. Both projects inspected with READ ONLY transactions over catalogs/hashes/grants, bucket settings and cron names/status (no commands); Edge metadata listed. No customer rows, tokens, credentials or provider contents retrieved.

Actual backend gap: staging117 migration entries/20 Edge functions versus production81/3.16 tables staging-only, including connected-mailbox/attachments/invitations/agency enquiry state;5 shared column definitions differ;48 functions staging-only,20 shared function definitions/grants differ,2 production-only;20 extra RLS policies,6 staging-only and2 production-only triggers. Preserve production-only terminal-decision Next Move completion and billing initialization behavior during reconciliation. Production lacks private booking-email-attachments bucket. Counts are diagnostics, not instructions to replay a migration chain.

Campaign backend remains absent on both projects. Preliminary staging catalog prerequisites exist: expected columns, analytics event-name constraint/own-insert policy, limiter and internal-admin functions. No claim of hosted campaign acceptance, current Auth redirects, tenant permissions or complete source parity. No hosted mutation made.

Gate independently checked: backup run38889098646/job116933969537 is still WAITING at the protected production environment. Owner must approve it in GitHub. The reviewed campaign procedure separately requires an isolated **current staging restore** rehearsal before apply. Management catalog access alone does not provide that snapshot; old October4 backup and minimal-dependency PGlite results are not substitutes. Do not deploy the campaign migration/Edge/retention before completing the current staging rehearsal. No paid branch, secrets or workflows changed to evade the gate.

Next: owner approves existing production DB backup; verify artifact and update bounded restore inputs. Obtain current staging snapshot through secure export, rehearse exact campaign migration, then apply only approved staging analytics/test dataset, inspect advisors, deploy complete Edge bundle and verify retention/emitted→persisted→panel. Agency/recovery QA and production backend delta rehearsal remain pending. Existing owner-accepted Gmail/attachments/DJ/ESEN/mobile checks remain accepted. All application/SQL/Edge/workflow sources unchanged; no new tests/build run for this documentation-only inspection, no account/invitation/request/email, no backend/stable frontend/production deployment. Final production approval is not ready.

## 2026-10-16 / Beta 0.0.13 preparation — PR114, hosted access blocked

Branch `integration/beta-home21-review`; exact application revision `fbc6b097cd0df95ce1ae90113968fb201bd3b38b`. Product **Beta 0.0.13**, shared unchanged by review/staging/future production promotion. This entry supersedes older frontend-only authorization below: the owner now authorizes preview/staging corrections and analytics deployment, controlled acceptance, production read-only comparison and a fresh backup. Still no main merge, production deployment/migration, destructive operation, secret changes or paid activation. **Production release is not ready.**

CUE ID uses the owner's exact Spanish heading/body and matching EN, retaining both avatars and development status. Dependency lock update preserves direct package ranges: Nuxt 4.5.2 → 4.6.1 (upstream CLI 4/Vite 8 reviewed through compiled checks), Vue patch/Three patch. Audit falls from 19 (3 critical) to 9 high/0 critical; simple-git/parser removed, shell-quote fixed. Remaining roots braces 3.0.3 and node-forge 1.4.0 have no newer registry release at review time; exposure and restrictions are in `docs/reviews/release-0.0.13/README.md` with raw before/after audit evidence. No forced major override or downgrade.

Actual local evidence: 599 tests pass; production static build/generate 44 routes; 24 compiled public browser cases + 24 Axe scans pass across ES/EN, both themes and 390/1440 px, no reported Axe violations. New text/two loaded avatars checked and mobile capture visually inspected. Existing analytics suite passes 43 isolated PostgreSQL assertions. Read-only inventory SQL catalog syntax executes locally. These do not establish hosted Supabase parity, RLS acceptance or Edge deployment.

Access status after owner reports granting GitHub/Supabase access: scoped Git/API reads work; environment-secret listing and protected backup approval API still return 403. No Supabase tool or authenticated binding is available to this execution session. Saved a secure environment configuration requirement `SUPABASE_ACCESS_TOKEN`, restricted to `api.supabase.com`; saving the requirement does not populate it or authenticate this runtime. Do not ask for values in chat. Backup run https://github.com/litus-code/cuebooker/actions/runs/38889098646 remains waiting on protected production-environment approval, not completed. It is read-only encrypted DB export only. No fresh backup/restore verification is claimed; October 4 backup is stale and existing restore/rehearsal workflows remain pinned to it.

Prepared `scripts/sql/release-backend-inventory.sql` for separate read-only staging/production definition/grant/RLS/index/constraint/trigger comparison. No user rows or function bodies are returned. Build an explicit reconciled delta only after real inventories; never blindly replay historical migrations or the frozen 30-file manifest. Analytics migration/function/retention remain **prepared, not hosted**. Keep dataset test during QA. Retention and hosted consent/attribution/dedup/panel visibility are pending.

Preserve owner-accepted mail/attachments/DJ checks; no new real accounts/mail/invitations/requests created. Remaining agency catalogue/multi-artist/invitation/roles/removal/isolation, password recovery and failed-attachment recovery need controlled staging identities and hosted evidence. Do not present unit/fixture results as those acceptance tests. See release review for backup scope, rollback and precise pending gates.

Next: unblock authenticated Supabase management access and owner UI approval of the waiting backup; compare actual projects, restore/rehearse exact deltas, deploy analytics only to staging, execute identified test-data acceptance, verify retention/advisors and immutable published revision. Preview publication authorized; stable staging/production closure cannot be claimed yet. Keep PR114 draft and main untouched.

## 2026-10-16 / CUE ID, actual Passport and consented campaign reporting — PR114

Branch `integration/beta-home21-review`, exact application revision `a77fc4c7444bce1586a30e57827e00f507dc69e5` (frontend `de9d547`, final prepared-SQL correction `a77fc4c`). Same Beta0.0.12 review candidate, draft PR114. Owner authorizes changes on this candidate and a frontend preview only. No main/production merge or deployment, hosted schema/function/cron, secrets, paid service, real signup/email/enquiry or P1 operation.

DJ restores the two existing clothed/haired female/male concepts in a dedicated secondary CUE ID block after Passport, explicitly in development. Home keeps a brief deep link. Passport uses four ES/EN + theme captures of the actual workspace constellation/venue/date interface with local fictional confirmed bookings, not the former three-dot illustration. No new Passport feature or universal media entitlement claimed. Distribution controls on DJ/Agency share the established SVG; short registration conditions distinguish agency roster/enquiries and retain AI-email beta approval.

Campaign audit found GTM-only marketing events, a separate existing feature-event store and an optional first-party writer without consent gating. That writer and legacy referral snapshots now check consent. Campaign persistence reuses `useAnalytics` calls, existing names and `product_analytics_events`, with a bounded/rate-limited new Edge adapter. A random consented browser token hash in transient signup metadata links only an actual newly created auth account; the envelope is removed server-side and stripped from browser sessions. An API response/client completion cannot forge or duplicate the stored signup. Multiple accounts may share a browser. Source entry intent and actual onboarding type are separate. No URLs, titles, referrers, slugs, contacts, conversations or booking content are added to campaign data. Initial router/query normalization was found to duplicate views; readiness/canonical path deduplication and a compiled one-view assertion now verify exactly one initial emission.

The restricted Campaigns tab shows total events vs browsers vs accounts vs workspaces, UTC date/source/UTM-origin/campaign/ref filters, separate server-classified test/live batches, explicit applied filters, matched same-unit/time-ordered conversions and no-data/unavailable states. Registration can still require email confirmation. Profile/onboarding/publication/first received request are server observations. Publication belongs to the canonical artist booking route, not arbitrary oldest agency membership; a legacy fallback is accepted only when there is one workspace association. Shared-artist attribution is covered by the isolated SQL test. First received request belongs to a workspace, not each agency member; public_form/email_import/automatic email-origin ai_capture qualify, manual capture/outbound/other AI do not. Historical attribution is not reconstructed. Existing operational overview remains separate and explicitly warns about unclassified historical tests.

**Prepared backend, NOT applied/deployed:** `20261016120000_campaign_funnel_analytics.sql`, new `campaign-analytics` function, shared ingress handler and its config entry. Collector/withdraw RPCs are service-role only; report remains internal-admin checked in SQL; private identity/cohort/config/dedup tables retain RLS/no client grants. New tables default to test collection; no browser can relabel tests live. Existing Booking Core commands, mailbox functions and paid plans are unchanged. Observer failures do not block domain actions. Consent withdrawal removes optional facts/cohort links and suppresses future facts; minimal workspace dedup survives event retention. Browser/cohort collection lasts30 days; optional fact retention90 days requires the documented, still-pending scheduler. No existing auth metadata unrelated to the new transport field is removed.

Validation: **599 tests pass**,0 fail/skipped; **44-route generate passes**; whitespace clean. **43 isolated PostgreSQL/PGlite assertions** validate the actual existing analytics foundation + pending migration against explicit minimal dependency schemas: collector/persistence/report, roles/RLS/negative access, dedup, shared browser/multiple accounts, agency members, manual vs automatic email, temporal conversions, filters, datasets, metadata cleanup, withdrawal and retention. This is not full staging-chain replay. Compiled public **24 cases** (3 routes ×2 locales ×2 themes ×390/1440), no overflow/page errors, menu/header preserved, SVG20px geometry/images/order pass;24 Axe checks zero violations. Compiled Agency/DJ journeys use only intercepted local fake auth/onboarding APIs and actual local PostgreSQL observer persistence into the actual panel; **16 panel states** across locale/theme/size,16 Axe checks zero violations. Actual Reject-button signup flow sends no GTM/collector and stores no optional identifier/referral/campaign signup. Actual Edge adapter executed with Node Web APIs/fake Deno transport in tests; hosted Edge runtime remains unverified. No Safari/full-device acceptance claim.

Additional dependency audit **fails:19 advisories (1 low,15 high,3 critical)** in the unchanged pre-existing dependency tree. Manifest/lock byte-identical to baseline31d76bd, lockSHA256 `95da9f06ce3beffd1271410b1302cbde330a479757953f1bd1f515d9ea8342a4`. No blanket audit fix or upgrade mixed into this scope. Findings and exact evidence in [campaign review](reviews/campaign-funnel/README.md), including screenshots, reproducible capture/verification, metric units and required backend deployment/rollback gate. Frontend68c7853 CI38886355974 and preview38886355865 passed;12 published page cases passed against b852f07b.cuebooker-staging.pages.dev. Later changes affect prepared SQL/docs only. Final CI/frontend publication follow-up is recorded on [PR114](https://github.com/litus-code/cuebooker/pull/114); local checks alone do not establish hosted deployment.

Next: owner reviews PR114 frontend/campaign contracts. A separately authorized staging backend step must recheck current schema/functions/auth triggers, rehearse the extra migration against an isolated current restore (previous frozen30-file manifest unchanged), apply only approved staging, run security/performance advisors and tenant/admin negatives, deploy the new adapter with verified gateway limiter dependencies, schedule/verify retention, then use explicitly authorized test actions for hosted emitted→persisted→visible evidence. Decide live-batch activation separately. External GTM/GA settings, actual staging backend persistence, Edge deploy/advisors/cron and production remain pending. Dependency hardening is a separate release follow-up. Main, production and P1 remain outside this authorization.

## 2026-10-16 / Product-led Home and DJ/Agency acquisition journey

Branch `integration/beta-home21-review`, application HEAD `a79cdb5d125bece2c02c950f0504c54b38af2974`, draft PR114. Owner authorizes these product/campaign presentation changes on the existing review candidate only, no merge/production. Same Beta0.0.12.

Home retains approved hero/problem/journey/operational benefits; profile and basic Passport summarized with a DJ link, CUE ID secondary/in development. DJ now leads with public profile (actual introduction/sound/links captures), distribution and compact disabled enquiry preview, operation/journey + conversation/calendar proof, approved-mailbox email capture, confirmed-booking-derived basic Passport, secondary CUE ID and signup. Agency retains initial roster, adds actual artist-context evidence, simpler enquiry copy, conditional beta catalogue note, lower distribution. Access note next to main CTAs explains initial capabilities vs separate mailbox/AI approval; no invented free/card/time claim. PDF/PNG/JPG beta scope aligned with current code and staging acceptance, no production parity promise. Existing in-development avatar assets remain but no longer dominate public acquisition pages.

Actual renderer screenshots use a local, network-isolated artificial fixture, never tenant data or a hosted publication. Twenty ES/EN + theme assets, full-size links, one-image galleries. Capture found a real public-profile light-theme contrast defect on fixed dark sections; scoped ink/button CSS fixed without profile/intake logic changes. Form collapse is an opt-in preview prop, preserving ordinary preview/live defaults. Campaign helper extracts existing allowlist and preserves UTM/ref across home, landings, menus and signup. Existing CTA/signup/activation events retained without duplicate event names or booking-content payloads. External GTM/GA conversion configuration/first-event reports not verified; signup_completed can still require email confirmation. Audit and reproducible capture source in docs/reviews/commercial-product-review.

Verification:589 tests (five new meaningful regressions),44-route build, whitespace pass.48 compiled public combinations (3 pages ×2 locales ×2 themes ×4 widths390/768/1024/1440),24 full-page Axe checks with zero violations; ordering, form folding/disabled state, image/gallery keyboard, campaign paths, menu/header scroll pass. Four isolated signup-funnel cases with consent granted/denied, mocked GTM/signup only: one signal per step when granted, none when denied; no account/email or form data to analytics. Home length9297→8044px mobile,7569→6701 desktop (ES/dark,1000px viewport); DJ/Agency longer with required product evidence, documented measurements and12 captures. Chromium only, not Safari acceptance. Published CI/preview follow-up recorded in PR114 after publication.

Supabase/services/Booking Core/workspace/auth/access/workflows unchanged. No schema/function, secrets, paid activation, P1, stable staging, main or production operation. Next: owner reviews PR114 product flow/conditions; a later release must separately verify backend parity and external analytics configuration before main/promotion.

## 2026-10-16 / Paired CUE ID concepts and restored mobile header scroll

Branch `integration/beta-home21-review`, application HEAD `3bba504dc9378864266b03f637cf67e6a414bfe1`, draft PR114. Owner requests female/male styled avatars together and restoration of production-like hide-on-down/reveal-on-up mobile navigation. CUE ID now shows both clothed, haired visual concepts side by side, with ES/EN alt text and existing in-development concept caption. Marketing images only; no CUE ID model/editor changes.

Root cause: mobile scroll plugin selected only legacy `.site-header`, missing replacement Home/landing/access headers. Explicit public-header markers reconnect the existing plugin, using the shared1100px breakpoint for new headers and retaining720px for legacy headers. Landing/access header sticky on mobile; Home retains its fixed header. Shared modal announces existing menu-open state so header stays visible while open; close/unmount clears it. Small scroll movements accumulate past the6px threshold. Top, upward scroll, desktop resize, route change and keyboard focus reveal the header. Workspace/auth logic unchanged.

Local verification:584 tests pass (three new plugin event regressions),44-route build, whitespace clean. Compiled browser: Home/DJ/Agency/signup/sign-in at390px (shorter500px-high viewport on access to exercise its limited page scroll), down hides/up shows with actual geometry, menu open/close state and desktop1440 resize pass. Pair loaded and aligned at390/1440 with no document overflow; screenshot inspected. Published CI/preview follow-up tracked in PR114. Same Beta0.0.12 review candidate. No main/Supabase/production/P1 changes. Next: owner reviews paired concepts and restored scroll behaviour; no authorization to merge main.

## 2026-10-16 / Landing palettes and paired hero actions

Branch `integration/beta-home21-review`, application HEAD `4bdd26141ab62db4af65e6d14316d0beb6406f0a`, draft PR114. Owner requests home palette consistency, lilac second hero phrase in light mode, paired hero actions, and colour/contrast review on desktop/mobile. Landing colour tokens now reference the existing global Cuebooker theme tokens (neutral surfaces, lilac light / lime dark). Removed green text overrides; small accent text uses a slightly deeper lilac for AA contrast, while hero and button keep the brand accent. Fixed hardcoded dark email/card/bridge backgrounds that inherited dark text in light mode. Theme-aware graphics/borders retain the industrial composition. Hero actions use two equal grid columns at all reviewed widths, with readable wrapped labels and at least56px height. SVG arrows replace font-dependent glyphs. No copy, destinations, campaign tracking, auth or backend changes.

Local verification: 581 tests pass;44-route build; whitespace clean. DJ/Agency × ES/EN × light/dark ×390/768/1024/1440 (32 combinations): paired button positions, no page overflow/errors, hero accent matches global theme. Full-page Axe WCAG2/2.1 A/AA at390/1440 in both languages/themes: zero violations. DJ light390/1440 rechecked after SVG polish; screenshots visually inspected, including light email cards. Test runner explicitly loads lazy imagery before assertions. Eight review captures in docs/reviews/integration-beta-home21. Published CI/preview follow-up recorded in PR114. Same Beta0.0.12 review candidate; main, Supabase and production untouched. Next: review updated light/dark landings; P1 and main merge remain unauthorized.

## 2026-10-15 / One shared public mobile menu including access

Branch `integration/beta-home21-review`, application HEAD `1b38a3ba5af08f3292ddc872bb10881cfa66209e`, draft PR114. Owner requested consistency with the home menu and a hamburger on sign-up/sign-in. `PublicMobileMenu.vue` now supplies the same home design/navigation to Home, DJ, Agency and the existing access header. Language/theme are at the top left, close at top right, then the same navigation and signup CTA. Shared breakpoint1100px, native modal/inert background, keyboard wrap/Escape, focus restoration and scroll cleanup. Removes duplicated home/landing menu logic. Landing signup passes existing source/ref/UTM destination and emits its signup event. Desktop preferences remain inline; onboarding retains its existing header. No changes to access form, auth composable or backend.

Local compiled Chromium: five routes (Home/DJ/Agency/signup/sign-in) × ES/EN ×390/768/1100 (30 cases), desktop transition1101, no page exceptions/overflow, same menu ordering, keyboard wrap/Escape/trigger focus/scroll unlock. Menu Axe WCAG2/2.1 A/AA zero violations in both themes for all five routes/locales at390. Filled access email survives menu open/close. Both landing menu signup CTAs preserve source and UTM; access-menu navigation returns to home product anchor. No forms submitted or backend operations. 581 tests,44-route build, whitespace pass. Captures in docs/reviews/integration-beta-home21. Published CI/preview follow-up recorded in PR114. Same Beta0.0.12 review candidate; main/Supabase/production unchanged. Next: review the consistent public navigation in PR114; P1 and main merge remain outside authorization.

## 2026-10-15 / Landing mobile hamburger navigation

Branch `integration/beta-home21-review`, application HEAD `4a6b72357bc5cd719540eb2815b5e10ee6be1c43`, draft PR114. Owner requested that mobile landing header links/preferences move inside a hamburger menu. Both DJ and Agency share the corrected header: below768px only logo/toggle, native modal with Home/How/Sign-in and reused language/theme control. Desktop navigation remains inline. Native Escape/close restores trigger focus, Tab/Shift+Tab stay inside, How closes and focuses its section, document scroll unlocks on close/unmount and switching to desktop closes the modal. ES/EN accessible labels added.

Local compiled Chromium checks on both pages/locales at390px: hidden inline links/preferences, open/close, keyboard wrap, Escape/focus restore, How target focus, desktop1024 transition and Axe WCAG2/2.1 A/AA (zero violations) passed. 581 tests pass;44-route build and whitespace check pass. New menu captures in docs/reviews/integration-beta-home21. No real signup/backend operations. Published follow-up checks are recorded in PR114. Same Beta0.0.12 review candidate. Main/Supabase/production unchanged. Next: owner reviews PR114 preview; P1 remains unexecuted and main merge remains unauthorized.

## 2026-10-15 / Joint preview routing and home discovery follow-up

Branch `integration/beta-home21-review`, application HEAD `0a1fd63` (routing entry separation at `3c3cfda`), baseline `e910d9f542b541a1260a9fe1a8f432c91468575a`, draft PR114. Owner approved visible DJ/Agency discovery links and the same avatar direction with clothing/hair. Explicit ES/EN links supplement audience headings while signup CTAs/events remain. The home uses an AI-assisted styled marketing concept with short hair/black streetwear, labelled as a concept in development; actual CUE ID model/controls remain unchanged.

Published preview exposed `/agency/*` swallowing the new landing and the landing parent shadowing the catalogue. Landing moved to sibling `agency/index.vue`; fallbacks match only nonempty slugs, use clean `/200`, and retain the original requested URL. Two routing regressions added. Local verification: 581 tests pass, build44 routes, whitespace clean; compiled Home/Agency ES/EN at390/768/1024/1440, zero overflow/page exceptions and zero Axe violations at390/1440 in both themes/locales. Explicit discovery navigation passes. Existing public catalogue renders through its actual dynamic route with intercepted fixture provider response, without backend traffic/submissions. Updated home/agency captures under docs/reviews/integration-beta-home21. Published correction CI/preview results are tracked in the PR114 description; local evidence alone does not establish a deployed result.

Protected-path diff against beta8f4113f is empty. Main remains bbdf29122f704039b353fa4eed788bfdfef5aaa7. Same review candidate Beta0.0.12; no Supabase, stable staging, production or P1 operations. Next: confirm PR114 CI/preview and review the joint candidate; no authorization to merge main.

## 2026-10-15 / Joint Beta0.0.12 + Home2.1 candidate — review only, main untouched

Owner explicitly chose consolidating/reviewing without touching main. Branch `integration/beta-home21-review`, application merge HEAD `94565c0281b0f4cdc0769f976e62e0ed42ec0faf`, parents are beta `8f4113ff2f81625fc8150521828b5453c53850c0` and consolidated commercial `4594f268d416df330ab1785c394ea346b36f639b`. First merged113→96 at49de54d (CI38807901707/preview38807902118 success), then111→110 at4594f26 (CI/preview success).109 already precedes110;112 is preview-only history, not another feature. main remains bbdf29122f704039b353fa4eed788bfdfef5aaa7. No force push.

Commercial branch contained older backend/attachment changes. Explicitly resolved the joint merge to retain the beta's Supabase tree, services, auth/access, Booking Core, workspace/P0, shared forms/preferences, tests, dependencies, config and workflows. Only reviewed public Home/landings components/copy/assets/CSS/art docs/sitemap come from commercial. Protected-path diff against8f4113f is empty. Added home role-heading links to/dj and/agency, retaining direct signup CTAs/events. Candidate version0.0.11→0.0.12 per release policy for this new combined composition, not a stable/production promotion.

Validation:579 tests passed; build44 routes; diff check clean. Compiled Home/DJ/Agency ES/EN at390/768/1024/1440 (24 combinations), images, no document overflow/page exceptions, keyboard menu/demo/channel controls, role links, real signup route/native required checks passed. Axe WCAG2 A/AA and2.1 AA zero automatic violations at390/1440 in both languages/themes after client theme/locale settles. Combined workspace/P0 fixture checks at1440/390 and landing referral/campaign filtering/prior reference/locale/cookies passed. Eight final compiled captures in docs/reviews/integration-beta-home21/README.md, with exact scope/conflict resolution and limitations. No account/form/email/invitation submitted; no live Gmail/DJ acceptance repeated. Published CI/PR preview evidence belongs to the draft PR body after completion.

Next: review the joint draft PR and preview before any main decision. A main-based draft is used only to enable the existing PR-preview workflow, not authorization to merge. P1 remains prepared/not executed; release/backend/security gates are not waived by this composition. No Supabase/backend/schema/secret/cron/paid service, stable staging or production changes. Main merge would trigger GitHub Pages plus stable staging after CI; keep that separate. Existing96/110 remain feature references; do not merge109/112 again or pull unrelated old PRs into this candidate.

## 2026-10-15 / Owner starts branch consolidation — P0 merged into PR96 only

The owner approved moving on to joining branches after accepting P0. Integrated PR113 into its intended base feature/agency-multi-artist-beta with a normal merge commit `49de54da1513ca7300687a43026c7ff168a44ab3`, matching the exact reviewed head `e7758590edda9b32766c5fc17aa02dc3a2418a50` and unchanged base `fe75fd5c096c3392a376b24a02ef4f63067cd66e`. PR113 is merged; PR96 remains open/draft. Existing source CI38807345114 passed579 tests/40-route generation and P0 compiled browser checks remain valid. Beta0.0.11 is unchanged; this consolidation is the same reviewed version. Resulting PR96 CI/preview evidence is recorded in its description after completion.

Only P0→private-beta integration performed. No main, commercial branch, backend, Supabase, migration, secret, stable staging or production mutation. Local feature branch fast-forwarded to the remote merge without rewriting history. P1 remains prepared, not executed.

Next integration decision: commercial dependency is111→110;109 is already an ancestor of110,112 is a preview-only alternative of111 and must not be merged as a second feature. Before combining the commercial family with the private beta, agree the target review branch. Do not merge main casually: push to main automatically publishes GitHub Pages and successful main CI triggers stable staging. Production workflow is manual. Earlier no-merge statements below describe the completed P0 implementation phase; this later owner instruction authorizes the specific PR113 merge recorded here.

## 2026-10-15 / Agency Settings P0 UX only — Beta 0.0.11 candidate

Branch `fix/agency-settings-p0`; implementation HEAD `be767f8083b36fb7bc179f3346d53719895dc453`, based on PR96 `fe75fd5c096c3392a376b24a02ef4f63067cd66e` (Beta0.0.10, CI/preview successful). The initial local checkout was clean at the older3251d03; fetched current PR96 before creating this isolated branch. No merge/rewrite or change to the PR96/commercial branches. New PR targets feature/agency-multi-artist-beta so its diff contains only this P0 block; CI is dispatched on this branch because existing automatic PR workflows target main. Publication/check evidence is recorded in the PR body.

Applied only the owner-supplied backlog's three P0 items. Catalog/team now share a management group, followed immediately in DOM by the existing adjacent Language/Appearance controls, then agency email. Wide desktop uses two management columns;1024/tablet/mobile stack them. Individual settings keep mailbox-before-preferences. Team title's last translated word and info trigger are non-breaking inline; tooltip text wraps normally and desktop popovers stay anchored inside their heading rows. Collapsed desktop nav hides labels, retains translated explicit accessible names, icon alignment/current state and notification badge. Root causes verified: a1100px agency mobile breakpoint overlapped the961px desktop rail and displaced nav over content at1024; inherited negative heading margin put the title under the rail. Breakpoint now960 and agency heading stays inside its content gutter. No form fields/save handlers/permission/auth/API logic altered.

Verified locally:579 tests passed,0 failed/skipped (four new Vue-rendered template regressions); npm run build passed40 routes; git diff --check passed. Chromium/Playwright on actual workspace/components with intercepted local HTTP fixtures: ES/EN1440 expanded/collapsed,1024 expanded/collapsed,768,390 (12 configurations) on development and compiled output. Final compiled checks include no document overflow/page exceptions, title/nav inside rail/content bounds, hidden collapsed labels with accessible names, adjacent preferences after management, non-orphaned info trigger, wrapped/unclipped help text, keyboard activation, Team→ES→EN→Appearance tab order and visible focus. Additional compiled keyboard sidebar toggle/persistence at1440/1024 and persisted collapsed-state/mobile labels at768/390 pass; no internal settings/management overflow after transitions.12 final compiled captures and method/limitations committed in docs/reviews/agency-settings-p0/README.md. Test helpers/cache remain outside checkout.

Environment/limits: local fixture host agency-ux-fixture.invalid and fake sessions only. No real Supabase requests, account changes, publication, invitations, emails, backend/schema/Storage/RLS, secrets, dependencies, workflows, stable staging or production changes. No claim of authenticated P1 permissions/integration acceptance or new Safari verification. Beta0.0.11 prepared per AGENTS release policy, not promoted to stable/production. Rollback is a frontend candidate revert; no migration rollback needed.

Next block is prepared, NOT executed: docs/AGENCY_P1_ACCEPTANCE_PLAN.md defines the actual agency journey, test-account requirements and per-case evidence/status matrix, with subsequent integrity/recovery review kept separate. Owner-reported Gmail/extraction/replies/attachments/DJ/ESEN/mobile acceptance is retained and must not be reintroduced as a generic pending smoke without a concrete incident. P1 operations, Supabase/deployment work, P2 backup/release and commercial integration remain outside this P0 authorization. Review the new P0 PR/captures first; no merge or production readiness claim.

## 2026-10-15 / Beta0.0.10 explicit attachment download

Branch `feature/agency-multi-artist-beta`, baseline HEAD `c51a2d6a238ab42de9357133b66d0951092d7a65`. Owner confirms the attachment opens in-browser and asks for download so the user chooses when to open it. Replaced direct navigation to the signed URL with a browser Blob download preserving the stored filename; the conversation remains open. The existing RLS-authorized60-second URL endpoint and private Storage remain unchanged. Temporary DOM link is removed immediately and object URL released after60seconds. Failed/expired fetch reports an ES/EN download error without navigating or creating a download. Per-message buttons now emit download and have an explicit accessible Download+filename label.

575 tests pass and full build prerenders40 routes; whitespace checks pass. New download regressions assert exact bytes/original filename, no cross-origin navigation, omitted credentials/no cache, DOM cleanup, delayed URL release and expired-URL failure. Beta0.0.9→0.0.10 for PR preview. No backend/schema/Storage/RLS/provider/AI change or live file retrieval was performed by the agent. Real browser download/mobile/Safari acceptance remains for the owner; do not equate the mocked DOM test with a browser acceptance.

Next: verify PR96 CI/preview publication, then owner reloads the conversation and downloads the PNG from its original message. Publication evidence is recorded in the PR description. Production, stable frontend and merge remain untouched; no secrets, quotas, crons, consent, paid service, outgoing email or historical retry changed.

## 2026-10-15 / Beta0.0.9 per-message attachments

PR96 branch `feature/agency-multi-artist-beta`, baseline HEAD `485f6bcce74c1ec6e0ddb66684ab423ca84ba453`. Owner found the accumulated document list confusing and requests attachments inside their originating message. BookingCoreInbox now groups only by the exact activity metadata email_message_id and file email_message_id. The shared message attachment component renders each message's own files/download controls and rejection notices beneath its text, preserving inbound/outbound placement and chronological order. Attachment-only email activities remain visible. No filename/date/direction guessing. Historical files without a visible linked message remain accessible in an explicitly labelled fallback; they are not assigned to an arbitrary response. The composer info icon and actual sending limits remain in place.

573 tests pass, including exact inbound/outbound separation with identical filenames, WebP warning ownership and unlinked-history fallback. Full build prerenders40 routes; whitespace checks pass. Existing live staging sample activities have exact message IDs, including the newly accepted PNG reply. This change is frontend only: no schema, Edge Function, Storage/RLS, provider/AI call, file migration, new email or replay. Beta increments0.0.8→0.0.9 for PR preview publication. Browser390px/Safari visual acceptance is still open after the earlier unavailable Chromium download; this build is not a claimed visual check.

Next: owner reloads the published PR96 preview and opens the original booking and checks each reply has only its own attachments, with the WebP warning under its own message. Production, stable frontend and merge remain untouched. Implementation `70a023ae7cf21e2d4ec6814bdc22f05aa74da7db`: CI2207/run38789011135 and PR preview2681/run38789011134 SUCCESS. Stable frontend job skipped. Preview https://pr-96.cuebooker-staging.pages.dev. This subsequent evidence-only docs revision does not change application sources.

## 2026-10-15 / Live supported-file reply acceptance passed in staging

Branch `feature/agency-multi-artist-beta`, baseline HEAD `d5ebf8382d45be476e341792c7a9e0f7d5f328bc`, Beta0.0.8. Baseline CI2205/run38786904819 and PR preview2679/run38786904942 independently confirmed SUCCESS. Owner sent a new reply on the existing test thread at approximately18:44Z. Read-only staging checks show one job admitted18:45:03Z and completed18:46:05Z as ignored (normal linked-reply outcome), no classification and no new booking. Exactly one inbound email is bound to the original booking, with one PNG1593372-byte attachment at index0, matching private Storage object and no attachment warnings. Monthly connection AI attempts remain103, with zero attempts since18:44Z. This closes live supported-file inbound reply capture/storage acceptance, not browser signed-download acceptance.

Next: owner reloads the existing booking and opens/downloads the new PNG. Mobile/Safari visual QA, broader DJ/agency journey and durable recovery/orphan gates remain open. No code, schema, function, secret, quota, consent, cron, paid-service, email sending, historical replay, stable frontend, production or merge changes in this read-only acceptance block. Documentation-only publication keeps Beta0.0.8 and the existing application sources.

## 2026-10-15 / Beta0.0.8 attachment limits help and persistent notices

PR96 branch `feature/agency-multi-artist-beta`, baseline HEAD `67d0c639d7fe1577f6e2b8c7c5600faeaa99aca1`. Owner authorizes PR96/staging only. The attachment action now has a native keyboard/touch info disclosure with PDF/PNG/JPG formats and actual transport limits: five files/5MiB aggregate for Gmail/Brevo, legacy Nylas2MiB. Received-document help describes ten files/5MiB per file. Escape closes the help and restores focus. Rejection messages remain visible in the conversation even with no saved files; successful recovery suppresses the exact resolved index.

Compatible staging migration `20261015183107_email_attachment_warnings` adds bounded default-empty JSON diagnostics to existing email messages, retaining RLS. Server stores only fixed codes/index/optional WebP label, with exact inbound message/booking/workspace/connection scope and authorization rechecks. Incoming worker reports unsupported/oversize/invalid/save failures; explicit thread sync also records metadata rejection without downloading unsupported bodies, classification or creating bookings. Notice writes remain best effort, not a durable recovery queue.

571 tests,40-route build,3 affected Deno entrypoints and whitespace checks pass. New tests cover WebP/oversize without download, safe persistence/scoping/revocation, reload/zero-file display and exact-file recovery, transport help and Escape/focus. Staging rejects non-array and >10-item notice payloads in rollback SQL. Incoming43/connected55/recovery5 ACTIVE; all dependency-complete retrieved source matches local code and JWT settings retained. Hashes: incoming `c92a0f5ebbd501778d512712bfdafc307927d20f3f89d9219d40afd6e28953fe`; connected `7ab36b4e38679ffc3955e40850ba632a2e846ff391805fb4ab400b48958e8797`; recovery `03154abc74b665bc66c9acac5b6e2f49a2d18738b443d99b59cb1e7193a5ee81`. Implementation `f7e193aa5f86728d04d56b2b5ef7df2dcf34a607`, CI2204/run38786592560 and PR preview2678/run38786592747 SUCCESS. Stable frontend job skipped; preview is https://pr-96.cuebooker-staging.pages.dev. All three anonymous POSTs return401.

Live owner acceptance since the previous handoff: outgoing Cuebooker reply at17:46:44Z has a private PNG1654338-byte copy on the original booking and sent status; owner reports it works. Inbound reply completed18:21:03Z on the same booking with one unsupported WebP, zero stored files/new bookings/additional AI attempts (monthly103 unchanged). This is valid negative-format acceptance, not WebP support. Added a bounded notice to that exact known test message only, based on the owner's format confirmation and skipped-file evidence; no provider fetch, historical replay or outgoing send. Supported-file inbound reply and signed-download/recipient details still require acceptance.

Next: owner reloads the PR96 booking to review the info disclosure and persistent WebP notice. Mobile/Safari visual acceptance remains open: browser download previously failed; compiled component behavior is tested, not a real browser390px check. No stable frontend promotion, production, merge, secret, quota, consent, cron or paid-service changes. Durable attachment recovery/orphan handling and wider beta gates remain open.

## 2026-10-15 / Beta0.0.7 outgoing attachments published and deployed

Implementation `4ac10b0c58edd6a0539e4dae42c8bea458c87af1`, CI2202/run38777815097 and preview2676/run38777815050 SUCCESS.567 local tests,40-route build,5 Deno checks and whitespace checks passed. PR96 remains draft/unmerged. Staging connected54/send40/incoming42/history17/recovery4 ACTIVE, all retrieved source/dependencies match the implementation, original JWT settings retained; five unauthenticated livePOSTs return401. Migration20261015172641 verified with inbound/outbound/invalid-booking/duplicate/outsider rollback SQL; security advisor findings unchanged.

User can now select/remove PDF/PNG/JPG files and send them from the booking composer in PR96. Gmail preserves original threading; platform Brevo and legacy Nylas also receive attachments. Private outgoing copies bind to exact outbound messages; partial history failures do not resend. Sources, limits, failure truth and hashes in OUTBOUND_EMAIL_ATTACHMENTS.md. Browser visual check was attempted but Chromium download failed; compiled Vue interaction tests pass. No live outgoing provider call was made by the agent. Next: owner reloads PR96 and explicitly sends a reply with one file from Cuebooker, then verify original booking, recipient delivery and document download. Mobile/Safari, inbound reply, durable recovery and broad beta gates remain open. No stable frontend promotion, production, merge, secret/limit/consent/cron or paid-service changes.

## 2026-10-15 / Outgoing reply attachments implemented, Beta0.0.7 candidate

Owner explicitly prioritizes attaching a document when replying from Cuebooker; previous live inbound-reply acceptance is deferred. Baseline PR96 HEADaa773720ec689b761e91fe6af7973d93d7a08dde. Connected53/send39 staging sources match baseline; incoming41/history16/recovery3 bundles retrieved before changes. Work stays on PR96 and staging, no production or merge.

Composer adds accessible rounded attach/remove controls, selected filenames/sizes, ES/EN validation and in-memory File handling. PDF/PNG/JPG,5 files/5MiB aggregate (legacy Nylas2MiB). Shared server validator verifies canonical base64, actual size/signature/MIME/name and bounded8MiB stream. Gmail multipart preserves thread/RFC headers; Brevo/Nylas receive attachment bodies. Platform fallback now respects connected-thread ownership and claims a unique request UUID before delivery. Both APIs flag network uncertainty; no automatic send retry. Server rechecks access before sending, saves private outgoing copies against exact outbound email/booking/workspace after acknowledgement, and reports partial history persistence without resending. Context change during file read prevents sending under another booking.

Compatible staging migration20261015172641 extends the existing private invoker metadata trigger to inbound/outbound, preserving binding/RLS/unique/private bucket/client grant restrictions. Rollback SQL covers both directions, invalid booking, duplicate index and outsider metadata/Storage denial. Security advisors unchanged.567 tests pass,40-route build and five affected Deno checks pass. Real-handler/provider mocks are not live delivery. Chromium visual QA was attempted but browser download failed with truncated archives; compiled Vue interaction tests passed. No actual email sent by the agent. See OUTBOUND_EMAIL_ATTACHMENTS.md.

Next: publish reviewed code to PR96, deploy only dependency-complete staging functions retaining JWT settings, verify source/401/CI/preview, then owner sends one reply with an attachment directly from Cuebooker. Real recipient delivery/download, mobile/Safari, durable orphan/recovery and broader launch gates stay open. This block does not alter limits, secrets, user consent, crons or paid plans. Publication/deployment evidence must be recorded after completion.

## 2026-10-15 / First live Gmail PDF+PNG acceptance passed

Owner explicitly authorized raising staging's internal monthly per-connection analysis cap100→150; changed only that setting, app cap1000 retained. Verified active account had50 attempts available, valid credential/watch/consent revision. No production, secrets, scheduler, paid service or historical replay changed.

Owner's first test arrived as a reply to an unlinked thread and completed as review at16:50:05Z, with the expected fixed reason, no AI reservation, no booking and no attachments. Owner then sent a fresh enquiry. Job admitted16:53:01Z, completed as booking16:54:03Z, attachment handler finished16:54:07Z with stored2, failed0, skipped0, blockedfalse. Read-only SQL confirms one message/job, one booking/thread, one notification and zero outbound messages. PNG538284 bytes and PDF1980819 bytes both have private objects and exact inbound email/workspace/booking bindings. No content or correspondent details copied into docs. This proves initial live capture/storage, not download UI or complete DJ/agency journeys.

Next owner action: reply from the sender mailbox to that successful enquiry with one additional document; verify it appends to the same booking with no duplicate or additional AI classification. Keep reply recovery, UI/download, revocation/concurrency, expired secondary account and wider beta gates open. No application/Edge change in this documentation-only commit; deployed code remains a3a7841, Beta0.0.6. Parent43e5459 CI2200 and preview2674 succeeded.

## 2026-10-15 / PR96 Beta0.0.6 staging backend verified

Implementation SHA `a3a78419ebfb607d4e133b97ca70164818f560cb` published on PR96. CI2199/run38770594439 and preview2673/run38770594520 passed. Full local suite559/559,40-route build, five Deno entrypoint checks and whitespace checks pass. Original CI/preview on3251d03 independently verified before work.

Staging `lycprjeuuynfzwskycwv`: incoming41, connected53, history16, recovery3, download5 ACTIVE. All retrieved files/dependencies match the published sources; JWT settings retained. All five unauthenticated livePOSTs return401. Migration20261015163315 applied; dual-bound message/booking validation, duplicate rejection, member metadata access, outsider metadata/storage denial and client grant restriction verified. Advisor findings unchanged. Exact hashes and caveats: STAGING_MAILBOX_AUDIT_2026-10-15.md.

Next: resolve the exhausted internal100/month connection budget and expired watch through a separate explicit operational decision, then run one new Gmail enquiry with PDF+image and one document-bearing reply in DJ/agency workflows. No historical retry, automatic sending, secret/limit/cron/consent change, stable frontend promotion, production or merge occurred. Durable reply-attachment recovery/orphan handling and all broader beta launch gates remain open. This evidence-only documentation commit does not change the deployed application sources.

## 2026-10-15 / Staging audit and PR96 reconciliation, Beta 0.0.6 candidate

Owner authorizes PR96 and staging only. Baseline HEAD `3251d035d2ad65c2ca1a60ee3af9da77a43f5ee7`; CI/preview independently confirmed green and 556 baseline tests passed. Authenticated connector recovered. Incoming v40 already exactly matches Codex; connected v52/history v15 contain older shared modules. Retrieved all five complete bundles/JWT settings before changes.

Recovered missing historical attachment migrations and recovery/download sources from staging. Found real XOR provenance constraint incompatibility and unsafe client TRUNCATE grants. Applied compatible non-destructive migration `20261015163315_bind_mailbox_attachment_email_and_permissions` to staging only, preserving rows and enforcing exact email/booking/workspace/provider binding. Rollback transaction verifies a valid dual-bound insert, mismatched message rejection, unique rejection and client permission denial. Outsider JWT-sub role tests return zero metadata and zero private objects. Three existing attachments, zero orphans at audit.

Recovery strengthened with caller RLS preflight, repeated consent/processor/cutover/editor/requester checks, exact byte/signature validation, exact message binding and verified duplicate handling. Original-booking recovery remains bounded; durable reply-attachment recovery/incident UI remains a release gate. Added real-handler recovery/download regressions and safe internal-budget diagnostic. Product candidate increments to Beta0.0.6. No secrets, quotas, cron, consent, paid services, mail sending, historical retries, production or merge changed.

Current blocker independently diagnosed: one connected Gmail mailbox has reached Cuebooker internal monthly cap 100/100 (app cap1000). This does not prove Groq quota exhaustion. Another connected Gmail watch is expired. Do not claim successful live classification/attachment acceptance. See `docs/STAGING_MAILBOX_AUDIT_2026-10-15.md` for evidence, migration identity drift, rollback and remaining gates. Backend deployment/publication evidence will be appended only after completion.

## 2026-10-15 / PR96 private-beta stabilization: local corrections, deployment blocked

Branch `feature/agency-multi-artist-beta`, implementation HEAD `1b381a2beef5cea5b0d09c2d7d99f6103396223e`; base `316fc06d6a45fd5c9bc03d4589f65fd2ba68ccc0`. The initial checkout was clean; switched from the separate landings branch without modifying it. Base CI `38762501830` and preview `38762501715` were successful; 542 baseline tests passed. Current task explicitly authorizes fixes/pushes to PR96 and compatible staging work, never production or merge.

Groq: one JSON-object fallback only for explicit schema/format rejection codes, with the full JSON contract in the fallback instruction. Generic HTTP400, failed generation, model, rate/quota and transport errors do not enable another format retry. Same local ID/extra-field/draft/date/money validation; malformed/truncated output fails closed. Classifier/cache version v5. Safe bad-request category added to console diagnostics only; no new SQL failure-phase codes or changes to complete_mailbox_incoming.

Attachments: real Gmail mapping supports remote IDs and named inline MIME parts; validated base64/decoded size. Shared attachment persistence checks full PDF/PNG/JPEG signatures, exact size and 5 MiB cap; skips unsupported/oversized inputs, checks existing metadata, uses the existing deterministic private object paths and binds email_message_id. Saves files from linked replies to the existing booking after sync. Worker rechecks job/consent revision, processor, cutover, editor membership and exact ingested message/booking/connection before download/upload/metadata. Partial failures produce counted logs and created_attachments_pending / synced_attachments_pending; no reclassification, new booking, job replay or automatic sending/confirmation. These diagnostics are NOT a durable attachment queue/UI incident indicator; private orphan reconciliation and hosted duplicate constraints remain blockers.

Validation in this isolated cloud environment: 556/556 tests passed (0 failed/skipped), including an actual Edge-handler integration against explicit mocked Gmail/Groq/REST/RPC/storage. It covers one schema fallback, one booking with PDF/inline image, duplicate claim, same-booking reply documents, partial metadata failure and revoked consent. Unit regressions cover terminal errors, privacy, MIME/size, consent withdrawal and repeat saves. npm run build passed (40 prerendered routes); Deno 2.9.6 checks passed for process-mailbox-incoming, connected-mailbox, process-gmail-history and smart-capture; git diff --check passed. Deno dependency cache/tooling stayed outside the repository; no dependency/lock/workflow/schema changes. No UI change or new live Safari/DJ/agency/notification/calendar acceptance claimed. Publication CI/preview evidence belongs to the PR body after push, not this local result.

Real blocker: no authenticated Supabase connector or staging credentials in this session. The context's incoming v38, current flags, job counters, migration application and actual Groq rejection cannot be independently reverified. Repository additionally lacks the migration defining booking_email_attachments / booking-email-attachments and both recover-mailbox-attachments / get-booking-email-attachment Edge implementations referenced by the UI. Do not invent or overwrite these hosted definitions. No hosted deployment, provider call, real email, historical-job retry, migration, secret, scheduler, paid-service or production change occurred.

Next exact block: connect authenticated staging access for lycprjeuuynfzwskycwv; retrieve deployed bundles/JWT settings and attachment SQL/RLS/unique constraints/private bucket/recovery definitions; reconcile source drift and compatibility first. Then deploy only reviewed compatible bundles (changed shared modules affect connected-mailbox, incoming and history), verify hashes/versions, and run a dedicated authorized-mailbox PDF+image → booking → reply/document → notification/conversation acceptance for DJ and agency, including revocation/cross-workspace/recovery/duplicates. GMAIL_PRIVATE_BETA.md contains the dependency checklist. All BETA_RELEASE_GATE_2026-10-15.md hosted/launch blockers remain open. PR96 stays draft/unmerged; production untouched.

## 2026-10-14 — Beta0.0.5 published to PR96; Groq staging backend verified

Owner-authorized code revision d4cb3ce428fb8e70f83613b66bc33c04616757aa published on feature/agency-multi-artist-beta. Local533/533 tests,40-route static generation and diff check pass. GitHub CI2082/run38542167347/job115779336457 SUCCESS. Preview2556/run38542167829/job115779338094 SUCCESS; logs confirm exact code SHA and deployment39452999 at https://pr-96.cuebooker-staging.pages.dev (immutable https://39452999.cuebooker-staging.pages.dev). Stable-staging job115779341943 SKIPPED. PR96 remains draft and unmerged; production untouched.

Staging lycprjeuuynfzwskycwv smart-capturev27 ACTIVE, verify_jwt=true retained. Both deployed files match the published candidate source exactly. Bundle SHA256d55348329439c3fb8f436518961504ef1613ecc8bba8795487088b7bbed81e00. Unauthenticated livePOST returns401. No hosted schema, quota, secrets, billing tier, real email/audio/provider calls or production changes. Previousv26 source retrieved before replacement for rollback.

Groq Whisper transcription and GPT OSS20B extraction are now configured by code; existing private GROQ_API_KEY is reused without reading or changing it. Successful transcription survives extraction429/invalid output/timeouts and local parsing makes no further AI call. Transcription429 needs available browser dictation; without it the UI reports failure. This backend inspection/auth check is not a live Groq or microphone acceptance proof.

Next exact block: owner Safari/iPhone CUE stop→transcript→review (venue/date/fee), then agency artist assignment→reply thread→confirmation→calendar and public catalogue. Before production still resolve historical backend parity, Google/privacy/provider/time-based and release gates. Do not equate preview publication with production readiness. This subsequent handoff-only commit does not change Beta0.0.5 application sources.

## 2026-10-14 — Beta0.0.5 CUE voice/Groq and agency parity candidate

Owner authorized publication to PR96 preview and staging smart-capture. Base feature88dc8234d74cc6a265a320037bf5e9f3b41a61c4, mainbbdf29122f704039b353fa4eed788bfdfef5aaa7. No merge, stable-staging or production promotion authorized by this block.

Reproduced voice stop sending audio before final browser dictation and unmount submitting audio. Corrected bounded final-result collection, interim fallback, duplicate-stop guard and microphone/cancellation cleanup. Reproduced date/time punctuation joining a fee; corrected local numeric capture. Groq adapter uses Whisper Turbo and the existing mailbox-model family GPT OSS20B, strict schema validation and bounded one-call-per-stage requests. Extraction errors preserve server text;429 uses local parsing without further AI requests. Transcription429 uses available browser dictation, otherwise explicit failure/typed input. Existing authentication and quota remain. No schema/secret/billing changes or real mail/audio/provider calls in local tests.

Agency settings now shares the individual preference toggles and removes demo-plan/password blocks. Catalogue external arrow uses SVG. Release labelBeta0.0.5 prepared for this single candidate. Reconstructed publication candidate passes533/533 tests and static generation40 routes; diff check passes. Staging smart-capturev26 was retrieved as the rollback baseline, ACTIVE and verify_jwt=true. See CUE_VOICE_GROQ.md for configuration, quotas, failure truth and rollback.

Next: verify exact published revision/CI/preview and staging backend, record deployment evidence, then owner Safari/iPhone capture plus agency assignment→reply thread→confirmation→calendar and saved public catalogue checks. All historical production/privacy/provider/time-based gates remain open. No live microphone/Groq accuracy claim.

## 2026-10-04 23:31 Europe/Madrid — Beta0.0.4 archive/admission preview candidate

Owner authorized publishing UI adjustments to PR96 preview only and reviewing solo/agency. Changes are bounded to archive dialog/button, admission/capacity copy, tests, release label and current execution/handoff docs. No merge, stable staging, production, schema, secrets or admission capacity change. Await candidate CI/preview and visual checks. Previous acceptance and isolated30-migration run remain separate evidence.

## 2026-10-04 23:26 Europe/Madrid — Archive UI prepared; admission and profile audit

Local branch feature/agency-multi-artist-beta HEAD35a11942586cc6542221d6f0306c617ad77bc589, remote feature52033f3b117da3654f59f83717bfbad0769b6897. Preserve unrelated dirty changes. BookingCoreInbox archive/restore now opens branded native dialog with focus containment, Escape/backdrop cancellation, safe default Cancel, explicit command, booking/workspace binding, busy guard and inline failure/retry. Visible44px archive button has border/background/SVG/focus state. Same component serves solo and agency booking detail. ConnectedMailboxPanel pending copy now correctly identifies verified Cuebooker account as approval recipient and adds approved/full-capacity notices. Local only, not published/deployed, no version promotion.

Archive/UI tests pass; full suite522/522 passed before the additional admission-copy test, that test also passed separately. npm run generate passes; diff check passes. No live mobile/desktop visual validation yet. Staging read-only capacity query returned5; no capacity/config/schema/user mutations. Server inspected: global connected plus reserved mailbox cap; Google100 test users is a different limit. Solo automatic capture binds its one active artist; agency captures unassigned for human assignment. Shared Gmail components do not prove both real profile acceptance journeys. PRIVATE_BETA_EXECUTION.md now records current evidence and outstanding Google/privacy/production/time-based/profile checks. Operator review remains privileged mailbox-beta-admin after Google test-user addition; no product admin panel or periodic notification drain. Next: reviewed publication of this UI patch,390px/desktop checks and remaining release gates. Production untouched.

## 2026-10-04 23:19 Europe/Madrid — Isolated 30-migration rehearsal passed

Owner completed the protected environment approval. Run37235093978 / job111532505083 completed SUCCESS at21:18Z on main bbdf29122f704039b353fa4eed788bfdfef5aaa7. Logs explicitly confirm logical restore/import, all COPY row counts, foreign keys, RLS and unidentified-caller denial; then all30 exact candidate migrations, preserved protected counts, service-table denial and both paused schedulers. No hosted database changed. Runner cleanup is in finally and its command fails the job on failure; job completed successfully. PR96 remains unmerged. No application/Edge/hosted migration production deployment authorized or executed. Next: review backend promotion and outstanding privacy/Google production prerequisites separately; this rehearsal alone does not establish launch readiness.

## 2026-10-04 23:11 Europe/Madrid — PR108 merged; rehearsal waiting for environment review

Owner explicitly authorized merging PR108 and browser fallback for manual dispatch. Squash merged only PR108 into main at bbdf29122f704039b353fa4eed788bfdfef5aaa7. Existing feature/PR96 remains separate; no hosted migrations, Edge or application production deployment.

After owner completed browser GitHub sign-in, dispatched Isolated Release Migration Rehearsal on main with confirmation cuebooker-isolated-release. Run37235093978, job111532505083, state WAITING for the production environment reviewer. The environment supplies only the existing backup decryption passphrase. Do not bypass/approve protected workflow without owner action/direction. Full 30-migration database rehearsal has NOT started. Next: owner reviews this exact run, then monitor restore/import/checks/cleanup and record evidence. No authentication credentials inspected or recorded.

## 2026-10-04 22:47 Europe/Madrid — Bounded 30-migration rehearsal PR prepared

Owner requested execution of the isolated migration rehearsal. Main ee623d796680888ada26c2a871d44715fd9be0e5 already registers the workflow but pins the older 26-migration candidate. Prepared infrastructure-only PR108, chore/rehearse-gmail-30-migrations, head5a1f48cece1b3fe92e09b701d4e21ecec0f67187. Six files: workflow pin, rehearsal runner, 30-entry manifest, synthetic tests, CI main-push exclusion and a status document. No application or hosted schema changes. Candidate remains83774ef4722d859b80654be13cebc53b60aebcd9; encrypted backup37169429138/attempt2 unchanged.

Five feature hash/parser/security checks and two main-based synthetic tests pass. All six infrastructure paths excluded from main push CI to avoid an incidental stable-staging deployment; PR CI remains enabled. GitHub CI2080/run37233441784, job111527755020 completed SUCCESS including tests and static build. Preview2554/run37233441782, job111527754861 completed SUCCESS; stable staging job111527755631 skipped. PR108 description records this evidence. No Docker/gh in this executor; connector lacks workflow-dispatch. Full database rehearsal NOT executed. No merge or production changes. AGENTS.md requires explicit merge intent; obtain bounded PR108 approval and browser fallback approval to run GitHub Actions after checks pass. Do not mergePR96 for this prerequisite.

## 2026-10-04 22:31 Europe/Madrid — Gmail staging acceptance complete; repeatable Google setup

Branch feature/agency-multi-artist-beta; local HEAD35a11942586cc6542221d6f0306c617ad77bc589 remains behind connector-published feature head1ccfca80aa52a491a749b7f1e67ffbe4ac30f339. Preserve unrelated dirty work. PR96 preview Beta0.0.3 is the tested surface, not stable staging.

Owner-operated own-account acceptance passed: new enquiry captured automatically once, unrelated message classified other without booking, outbound response delivered, inbound reply synchronized to original booking without duplicate, pause blocks processing, reactivation establishes a new baseline without ingesting the pause message, disconnect removes local credentials and reconnect establishes current consent/watch. Details/timestamps in GMAIL_PRIVATE_BETA.md. iPhone captures establish tested connected/active and Reservations states, not exhaustive mobile QA.

Google topic/authenticated OIDC subscription configured by owner in cuebooker (number573163160991). Screenshot confirms endpoint/audience/account/wrapped payload; IAM grants owner-confirmed, not authenticated Google API inventory. Staging gate true; both history and incoming minute crons active, Vault URLs verified. Unsigned event POST401. Functions observed connected47/incoming24/history12/events11 with unchanged reviewed bundle hashes after secret updates. New migration not introduced in this block. Production untouched.

Added scripts/configure-gmail-push.py and docs/GMAIL_PUSH_SETUP.md: offline plan by default, explicit --apply, fixed project/environment/ref pairing, conditional creation and compatible update, topic-only publisher and account-only token creator, exact audience/wrapped-payload verification. Does not create private keys, set OAuth/Edge secrets, activate cron/user consent, deploy or promote production. Seven mocked tests and offline production plan passed. No authenticated gcloud apply performed. Production uses prod resource suffix within service-account ID limits.

Remaining: isolated 30-migration rehearsal; production backend/config parity; Google branded consent/privacy/terms and provider/retention/transfer review before invitations. Actual time-based watch renewal/Testing expiry and load/rate-limit recovery are not yet accepted. No claim of RGPD certification or no mailbox access. Next implementation block: install/run the bounded isolated rehearsal before deciding production promotion. Script/docs publication status recorded separately when completed; infrastructure/documentation work does not change the released product version.

## 2026-10-04 19:55 Europe/Madrid — Google project identity supplied

Owner supplied project number573163160991 and project IDcuebooker. Values are owner-provided, not independently verified against authenticated GCP. Next guided action: create topic cuebooker-gmail-staging in this OAuth project, no default pull subscription; then topic-scoped Gmail publisher, dedicated authenticated OIDC push account/subscription and private Edge/Vault configuration. Background remains disabled and production unchanged.

## Verification: preview published 2026-10-04

Feature head1ccfca80aa52a491a749b7f1e67ffbe4ac30f339 published. CI2078/run37221849007 SUCCESS; Deploy Staging2552/run37221849045 SUCCESS: PR preview job111493606812 success, stable staging job111493607501 skipped. Review https://pr-96.cuebooker-staging.pages.dev/workspace/. 520 local tests and40-route generation pass; SQL rollback and three entrypoint Deno checks pass. Authenticated mobile/layout QA not yet proven: local screenshot harness could render the component but Playwright browser binary was absent; no browser download or fake product data added. Google project ID/PubSub/OIDC/history activation and actual new-mail automatic classification remain the next blocker; no user consent auto-enabled, no production release.

Implementation object 83774ef4722d859b80654be13cebc53b60aebcd9 contains all30 candidate migrations. Rehearsal workflow pin now targets this exact object, pending bounded installation in main and real isolated rehearsal. Staging unauthenticated probes: connected-mailbox401; process-gmail-history401; incoming503 background-unavailable with operator gate off. These probes do not test authenticated processing or real mail. Source feature-branch publication/preview pending CI below.

## 2026-10-04 — Compact mail flow and new-mail retry installed in staging

User authorized simpler, clearly clickable UI, colored status notices, new-mail-only automation and honest privacy explanation. Implemented compact connected state, collapsed beta/privacy details, one-time automatic-analysis consent before OAuth (legacy connections explicitly activate separately), optional button-like old-mail review and no account-wide read when opening Reservations. Dedicated colored notices communicate actual detection health and pending rate-limited work. Existing manual per-message consent/import and booking threading remain. Candidate label Beta0.0.3.

New migration20261004173627_mailbox_detection_start_and_retry applied only to staging: atomic initial watch cursor+consent; claim timing/attempt metadata; explicit429 retry with bounded backoff and fresh budget request ID. No existing user consent activated. Staging background operator flag remainsfalse. Incoming cron was observed active, Gmail history cron inactive; do not describe both hosted schedulers as paused. The isolated migration rehearsal still expects both paused in its fresh candidate database.

520 local tests pass, including encrypted OAuth consent vs untrusted completion input, no historical reads on Reservations entry, detection health,429 deferral and SQL manifest hashes. Deno checks all three changed entrypoints; static generation succeeds40routes. Fictional SQL fixture rollback passed on staging (new baseline, duplicate-enable preservation, service-only grants and retry eligibility). Advisors introduce no new warnings; existing warnings remain. No real mail read/send/model call in this change block.

Staging deployment preserves exact retrieved bundles/custom authentication: connected-mailbox44, process-mailbox-incoming21, process-gmail-history9 ACTIVE. Existing deployed versions before this block were43/20/8 (not earlier handoff13/1). Production and stable web unchanged. Source publication/CI and unauthenticated probes are recorded below after completion.

Google project ID remains unknown; Pub/Sub/OIDC/Vault/history scheduling and own-account automatic-new-mail acceptance remain pending. Legal/provider contracts, transfer/retention/deletion and Google branded consent must be reviewed before invitations. No claim of full RGPD compliance. Main-only isolated30-migration rehearsal must be installed as a bounded infrastructure update; never merge the full feature just to run it. Preserve unrelated dirty work. Supabase CLI telemetry was rejected by automatic review; no retry/bypass, migration applied safely through the Supabase connector instead.

## 2026-10-04 18:46 Europe/Madrid — Own-account Gmail read proven; Groq 413 staging repair

Owner completed private staging Google External/Testing web OAuth setup, exact connected-mailbox callback, Gmail API and readonly/send scopes, test-user inclusion, and saved credentials/encryption settings privately. Own beta request for litulandio@gmail.com in workspace81c84e12-b895-43f4-84ac-5ca417ed8067 / user244ec103-9a79-4959-bdbc-9523a55b2460 approved through existing review_mailbox_beta_access RPC with google_test_user_added=true. Browser screenshots prove connected Gmail and recent actual mail displayed in PR96 preview. Background remains disabled; Pub/Sub and schedules remain pending. No credentials printed or production mutation.

Live manual detect at16:39:51Z failed: function_logs show mailbox_classifier_http_status413 and mailbox_ai_unavailable. Repair shared classifier: split only 413-rejected batches sequentially, preserving every ID and bounded20 input; never retry429 or other failures, aggregate successful model token usage even if a later batch fails. Single-message413 stays unavailable. No automatic sending or consent expansion. 517 local tests pass, Deno connected-mailbox check passes, diff whitespace passes. Split/accounting/stop-on429 regressions included. Actual model success after repair still requires owner's retry; sequential requests may reach a temporary Groq rate limit. No false live-success claim.

Deployed connected-mailbox43 ACTIVE to staging using exact retrieved42 bundle, replacing only mailboxClassifier.ts (old classifier matches local pre-edit source). Custom auth verify_jwt=false retained; live unauthenticated POST401; staging query succeeds. SHA25646da28e40537918208eea1b1cd974c4cf90a6378d7c5ed3889cacb5f3817e57f. process-mailbox-incoming not redeployed in this block (background disabled). Source/tests/docs remain local dirty atHEAD35a11942586cc6542221d6f0306c617ad77bc589, no commit/push; preserve unrelated changes. Prepared release label Beta0.0.3 per owner rule; current frontend preview still displays earlier revision, no web/stable/production promotion. Sync bounded repair before subsequent release.

Acceptance/UX pending: Google consent displays technical Supabase hostname and absent privacy/terms links; must improve identity/privacy before inviting beta users. Connected state still repeats connect form; manual-mail details summary needs visible affordance; empty copy wrongly suggests enabling unavailable detection. Next: owner retry manual detect; prove chosen mail import/send/reply/reconnection, then background infrastructure/consent, mobile UX, isolated29-migration rehearsal and reviewed environment promotion. Production remains unchanged.

## 2026-10-04 — Task3 deployed in staging; isolated 29-migration rehearsal corrected, not executed

Task3 implementation commit 375ee4bdef4a28c361c922621f4968f8ec6eb400 on feature/agency-multi-artist-beta / PR96. CI2076/run37209712100 SUCCESS; PR preview2550/run37209712072 SUCCESS, stable staging job skipped. Backend staging lycprjeuuynfzwskycwv: process-mailbox-incoming v13 and connected-mailbox v35 ACTIVE. Unauthenticated live POST returns401 for both. Security advisors unchanged: five existing SECURITY DEFINER warnings, one existing Auth warning and17 intentional INFO RLS-with-no-client-policy findings. No schema, secrets, schedules, real mail reads/sends or production mutation. Beta0.0.2 remains unreleased candidate.

Found the release rehearsal runner still enforced26 migrations and its workflow pinned the older26-file candidate while the reviewed manifest now contains29. Prepared the runner/tests/workflow update on this feature branch: pin the migration checkout to375ee4bdef4a28c361c922621f4968f8ec6eb400, require29 exact ordered hashes, check service-only beta-notification/Gmail tables and both incoming/Gmail schedulers paused. 515 local tests pass including real29-file manifest checksum verification. This is preparation, not a successful isolated29-file database rehearsal. The main-only manual workflow must receive this isolated infrastructure update before it can execute; do not merge PR96 merely to install it or accidentally trigger stable web promotion. Existing encrypted backup run37169429138/attempt2 is retained unchanged; no decryption/export/restore ran here.

Next blocking step remains private Google configuration and own-account OAuth/watch/reply/reconnection proof; cloud credentials page still shows Site Unavailable. After access, finish live/mobile acceptance and run the prepared isolated29-migration rehearsal before backend alignment and reviewed staging/production promotion. Preserve both profiles and all approved dirty UI work; no new stable release/version bump in this block.

## 2026-10-04 — Task3 conservative filtering and RFC reply fallback prepared

Branch feature/agency-multi-artist-beta / PR96, remote parent f1b4158c3b1acce087509a9d21c7054fab99b9cf; local HEAD remains 35a1194 with preserved earlier dirty work. This commit publishes only the reviewed Task3 files and updated handoff. Candidate stays Beta 0.0.2, no stable web/production release in this block.

Background processing synchronizes known threads before deterministic prefiltering. Auto-Replied and distribution-list metadata persist review without AI; delivery-status reports persist other. Short or keyword-free messages, generic senders and auto-generated booking forms retain classification. Manual analysis remains available. Gmail automation/RFC metadata stays server-side and outside normalized UI/model payloads.

If Gmail assigns a different threadId, bounded exact In-Reply-To/References searches verify returned RFC Message-ID metadata, then require an already saved message in the same workspace/connection and the same counterparty. Existing ingest atomically attaches the new thread alias to the saved booking. No schema migration or persisted RFC header store is introduced. Multiple bookings, unknown/invalid/excessive references stay reviewable; provider uncertainty fails without automatic retry or creating a duplicate. Current matching accepts a conservative RFC ID subset; unusual valid IDs require manual review. Existing Nylas behavior stays unchanged. Consent is checked before lookups and again before synchronization.

Validation: 514 local tests pass; Deno checks process-mailbox-incoming and connected-mailbox; static generation previously passed for the same unchanged UI (40 routes). No real mailbox/model calls or authenticated mobile proof. Deployment and CI status are recorded by the next verification entry after actual results, not assumed here.

Google Cloud credentials page still returns Site Unavailable in this cloud browser. No credentials, login, settings or permissions changed. Private staging OAuth/PubSub/Vault setup and real own-account connection/read/import/reply/received reply/reconnection remain the blocker. Then verify mobile, repeat isolated 29-migration release rehearsal/backend alignment, and promote the same reviewed version/SHA to stable staging and production. Owner intends the private beta in production; code tests do not satisfy the live-mail acceptance gate.

## 2026-10-04 — Resume after interrupted chat; conservative pre-AI filter prepared locally

Recovered branch feature/agency-multi-artist-beta, local HEAD 35a1194; extensive pre-existing dirty work remains untouched. The previous handoff records remote Task2 implementation b83a5291c807a5c9de9d9bdbdd87c95e93d8ca65 and its staging installation. Do not confuse local HEAD with that remote release revision. No new commit, push, Edge deployment, migration or production publication in this block.

Added mailboxPreFilter.ts to the background incoming-message path, after consent/folder checks and known-thread synchronization, before classification/cache/budget. Gmail adapter extracts a narrow set of automation headers privately; mailboxMessage and classifier payloads do not expose them. Auto-Replied messages and lists with combined List-ID/List-Unsubscribe/Precedence evidence are persisted as review, without AI or booking creation. Multipart delivery-status reports become other. Auto-generated booking forms, short messages, info@/noreply@ senders and missing keywords remain eligible for ordinary classification. Missing metadata never causes rejection. Existing Nylas behavior and explicit user-requested manual classification remain unchanged. No new permissions/schema or processor calls.

Validation: 503 local tests pass, including filter cases, Gmail metadata normalization, linked automatic replies and consent withdrawal. npm run generate passes (40 routes); git diff --check passes. No live mailbox/model calls or authenticated mobile proof. This is a bounded Task3 implementation, not complete acceptance: RFC In-Reply-To/References fallback across changed provider thread IDs still requires persisted identifier design and separate tests; current lookup uses the existing connection-scoped thread linkage.

Google credentials page was opened in the cloud browser and again returned Site Unavailable / Unable to access this site. No login, credentials, permissions or Google settings changed. Private Google setup remains blocked here, not verified. Exact next: enable access to the Google project and complete private staging OAuth/PubSub/Vault setup, verify approved own-account connection/read/import/reply/received reply/reconnection, finish RFC fallback, review/publish the bounded filter changes to the feature branch and deploy staging, then isolated release rehearsal/backend alignment and same reviewed candidate/version promotion to stable staging and production. Owner already intends the private beta in production; this block does not declare it ready.

## 2026-10-04 16:10 Europe/Madrid — Gmail direct beta Task 2 implemented; private Google setup pending

Implementation commit b83a5291c807a5c9de9d9bdbdd87c95e93d8ca65: CI2074/run37208516356 passed; PR preview2548/run37208516339 passed, stable staging job skipped. These validate the code revision, not live Gmail authorization or production.

Branch feature/agency-multi-artist-beta / PR96, remote base 0c4bccdf07827efb8137e05a123cafa1ca1160ed. This entry is included in the implementation commit; its resulting SHA is in Git history. Owner authorized continuing the MD, with eventual private beta in production. Do not treat this staging installation as a production release. Candidate remains Beta 0.0.2, same unreleased revision policy.

Added direct Gmail REST adapter: offline OAuth/PKCE, AES-256-GCM tokens bound to actor/workspace/email, exact approved-email and granted-scope checks, seven-day Testing reauth, MIME text and RFC thread replies. Explicit transport preserves Nylas IDs/Booking links; Gmail and Nylas same-address connections stay separate. New connections default to Gmail and fail closed without Google configuration; legacy route requires explicit operator selection, no silent provider fallback. Existing Nylas operations remain usable. Existing consent, analysis budgets, cache and send-attempt ledger are preserved. Task3 deterministic pre-AI filter is not implemented in this block.

Staging migration 20261004140619_gmail_direct_mailbox.sql applied. Timestamp follows actual MCP migration history; generated original file was renamed to match history before publishing, SQL unchanged. Manifest 29 files hashes verified. connected-mailbox v34, process-mailbox-incoming v12, gmail-mailbox-events v1, process-gmail-history v1 deployed. New watch/credential tables are service-only RLS; RPCs are security-invoker, empty search_path, clients revoked. Pub/Sub checks trusted RSA signature/issuer/audience/service-account email and exact subscription. History leases bind consent revision, pushes dedup high-water metadata, existing incoming queue dedups real messages, hourly recovery/daily watch renewal are operator-scheduled. Gmail cron installed paused, private GCP and Vault configuration absent. Expired history/backlog is visible as resync_required with explicit consent restart. No production mutation, subscription, new mailbox grant or real mail read/send.

Validation: 494 tests pass; four Deno2.5.6 entrypoints type-check; static generation passes. Transactional SQL rehearsal before installation and post-install rollback smoke pass: tenant/client denial, admission, Nylas preservation, Gmail completion, lease and revocation. Live unauthenticated HTTP: connected-mailbox401, process-gmail-history401, process-mailbox-incoming401, unconfigured Gmail push503. Security advisors: existing five SECURITY DEFINER warnings + one Auth warning unchanged, two additional intentional INFO RLS-with-no-client-policy entries. No Gmail OAuth/Watch delivery/live reply/mobile proof; do not claim the end-to-end beta ready. Google Cloud credentials page returned Site Unavailable in the current cloud browser, not a CAPTCHA or confirmed bot block; no account or credentials were entered.

Exact continuation: privately configure separate staging Google Web OAuth client, Gmail readonly/send scopes, Testing audience and redirect; encryption key; same-project Pub/Sub OIDC push account/topic/subscription; Vault paused workers. Verify one approved own-account OAuth/read/import/reply/received reply and reconnection plus mobile. Then Task3, 29-file isolated release rehearsal, backend alignment and same reviewed version/SHA promotion to stable staging and production. Never ask for keys/passwords in chat. SQL-only beta approval notices still require privileged drain; no notification scheduler was added. Full Google setup and caveats in docs/GMAIL_PRIVATE_BETA.md.

## 2026-10-04 — Administrator notification configured and delivered

Commit0c4bccdf07827efb8137e05a123cafa1ca1160ed records the latest full remote handoff and notification follow-up. Owner-selected admin recipient is saved privately in staging Edge settings, flag enabled, empty queue before activation. Existing sender whitespace corrected in notification helper. connected-mailbox v33, mailbox-beta-admin v4, privileged staging-only manual diagnostic v3 active. One authorized fixed test accepted by Brevo and delivered at13:57:33 Europe/Madrid; no real applicant/grant created. 474 tests pass. No prod/stableweb/version changes. SQL-only queued approvals still need operator drain or future privately configured periodic hook; mobile visual review pending. Gmail remainsTask2. See docs/MAILBOX_BETA_ACCESS.md; do not copy the recipient or keys into repository files.

## 2026-10-04 — Private email beta admission Task 1

Remote commit ca631630181e044110d2616c60913b5be10d126b on feature/agency-multi-artist-beta / PR96 contains Task1 and the complete latest remote handoff. Applied two staging migrations 20261004111828/20261004112859, connected-mailbox v31 and mailbox-beta-admin v2 active. 469 tests and local static generation pass; live staging rollback SQL smoke and unauthenticated HTTP checks pass. CI2072 succeeded. Production untouched, Beta0.0.2 remains candidate. Preserve dirty work.

See docs/MAILBOX_BETA_ACCESS.md. Admission is server-enforced with pending/approved/rejected and exact intended email; Google audience confirmation is manual before approval. Saved notification outbox requires private admin-recipient/enable configuration and actual Brevo delivery verification; periodic drain/webhook is not installed. Authenticated mobile visual review is blocked by the current preview sign-in wall. Gmail OAuth/Watch/reauth is Task2 and has not been implemented; filter is Task3. Current Nylas connections are retained. Manifest has28 migrations and needs a new isolated rehearsal, not the old26-file proof. The remote handoff is newer than older local entries below.

## 2026-10-04 04:46 Europe/Madrid — Release preflight verified; production mailbox credentials blocked

Remote feature dd1a3e431faaeb39741222194c63082813940c02 records full current status. Isolated migration rehearsal run37171742277/job111345907771 SUCCESS:26 exact files, preserved protected counts, FKs, client service-table denial and paused scheduler. No hosted migration/Edge/web deployment. Corrected connected-mailbox environment-bound CORS and OAuth return.451 local tests pass. Production Secrets visibly shows no custom secrets; Brevo/Nylas/Groq/webhook/worker configuration needs owner setup before promotion. PR96 Beta0.0.2 remains candidate. Preserve all dirty application work.

## 2026-10-04 / Encrypted production backup succeeded

Run 37169429138 attempt 2 at main 03a3db2f68ca4179d4c3bbe8fc6c74e58a876458 succeeded. Artifact 11290844352 (43998 bytes), expires 2026-10-11T02:05:40Z. Ciphertext ZIP downloaded and ZIP/inner SHA256 checks pass, only encrypted archive/checksum present. No agent decryption or restore. Owner private durable download/independent passphrase retention and isolated restore validation still required. No agent DB mutation, migration or stable web deployment. Latest remote feature HANDOFF contains exact full status.

## 2026-10-04 / Production backup authentication rejected

Main infrastructure diagnostic SHA 03a3db2f68ca4179d4c3bbe8fc6c74e58a876458. Protected run 37169429138 failed at roles export with authored category database authentication rejected. No artifact, DB mutation, restore or web deployment. Owner must privately correct production DB password in CUEBOOKER_BACKUP_DB_URL (URL encoded), never through chat. Rerun that run after correction. Five diagnostic tests and infrastructure CI passed. PR96 product release remains separate. See newest remote feature HANDOFF for full continuation.

## 2026-10-04 / Manual encrypted production backup prepared, not executed

Owner is on a phone and approved preparing a manual GitHub Actions backup without buying a Supabase plan. Branch `feature/agency-multi-artist-beta`, PR96, base `399fc93390f2dac791e71ff24cdadf361f2d89a1`. Added manual/main-only `backup-production.yml`, pinned setup/checkout/upload actions and CLI 2.79.0; production environment protection remains unchanged. The script validates the exact production direct/session-pooler connection and independent encryption passphrase, dumps roles/schema/data, encrypts with GPG AES256, verifies a decryption round-trip and publishes only encrypted archive/checksum with seven-day retention. Plaintext stays in a fresh private temp directory and is removed. Errors never echo tool output or database URLs. No commits of private backup data, schedules, migrations, restores or web deployments.

Validation: four new tests pass, including real encryption/decryption of fictional dumps, wrong-project/SSL/credential rejection, command failure redaction/cleanup and manual/encrypted-only workflow contracts. Full suite 444 tests passes. Supabase skill and current official backup/CLI guidance reviewed. No production data exported. New production secrets need direct owner entry/explicit access confirmation; no password reset or secret transfer is authorized. Workflow must be installed on main before GitHub exposes manual dispatch; do not merge PR96 just for that. An infrastructure-only promotion must account for the existing main CI -> stable staging deployment trigger. `docs/PRODUCTION_BACKUP.md` records scope, retention, private durable download, isolated restore validation and exclusions (Storage bytes/platform/provider config, Vault encryption material). Encryption verification is not a restore test and does not pass the production recovery gate by itself. Candidate remains Beta 0.0.2. Next: owner-secured backup connection/passphrase and isolated workflow installation, actual export/private retention/restore check, then remaining production backend release gates. Production database and stable staging/prod web remain untouched.

## 2026-10-04 / Saved onboarding completion checks

Owner visual follow-up: completed modules now reduce emphasis with muted titles and softer status labels in both modes. The SVG check stays accented and body text/actions keep their existing contrast and usability; no whole-panel opacity or disabled interactions. Nine focused tests pass, including saved-state classes and no interaction-blocking opacity. This follow-up builds on `f9b755bc5c906177636fa5cbf45f5b2d3422ba4e` and stays in the same release candidate.

PR96, branch `feature/agency-multi-artist-beta`, base `2dd249fcb2cccfcda5240e37d294e32f9b1d743f`. Owner requested a visible check on completed onboarding steps. Shared SetupStepMarker replaces the step number with an accent SVG circle/check for saved completed steps in both DJ and Agency panels. Pending/optional steps retain their number and translated status text; the icon is decorative/aria-hidden. Existing buttons stay usable for review. DJ profile and incoming-channel checks use the existing readiness values; link sharing deliberately has no completion check because copying/visiting cannot prove external sharing. No completion flags, backend, schema, permissions or onboarding exit changes. This remains the same Beta 0.0.2 release candidate, not a new stable staging/production delivery.

Validation: render tests cover SVG vs pending number and accessible decoration; panel source tests verify saved-state bindings and no emoji markers. 440 tests and static staging generation of 41 routes pass; diff checks clean. Authenticated browser/mobile visual review remains pending. Production untouched; next step remains release preflight and backend alignment before stable promotion.

## 2026-10-04 / Individual DJ onboarding with connected email and release label

Owner follow-up: the release version must be incremented before each new staging/production delivery without reminders. Canonical policy is now in AGENTS.md and AGENT_WORKFLOW.md: default patch bump, same reviewed version on both environments, no bump on retry, record deployed SHA/version/environment. Current candidate label remains Beta 0.0.2; individual setup implementation commit is `e70b811250ebe93c1f193370f6dfee80702b4727`.

Branch `feature/agency-multi-artist-beta`, PR96, remote base `297af47c99820fe37bb64549be7ba3dc451015a3`. This entry travels in the implementation commit; Git history provides its resulting SHA. Owner requested implementing DJ email onboarding before a later staging/production promotion, then added the visible Beta version label. No merge or stable staging/production deployment in this block.

IndividualSetupPanel replaces the old mandatory public-profile-first activation copy. The three steps are private professional profile preparation, optional incoming channels (personal mailbox with separately authorized automatic detection OR public booking form), and optional public link sharing. Connected-only and reconnect-required mailboxes never count as automatic detection ready. Public form readiness requires published profile, accepting requests and a real link. Sharing only appears when that form is ready. Completing a private profile does not show the public-activation guide. Onboarding navigation opens existing editors/settings and never publishes, connects or grants detection consent automatically. The existing manual enquiry path remains available without completing preparation.

Mailbox status uses the existing authenticated service, handles unknown/error/retry states, rereads when settings close or operations change, and ignores stale scope/unmounted responses. No provider details, messages or email addresses appear in onboarding. The panel only mounts for individual accounts with a resolved workspace, completed booking load and no saved artist bookings, including archived records in the existing list. It disappears after the first enquiry/manual record and avoids treating unavailable bootstrap data as a new account. No backend/schema/RLS/Edge changes.

The existing staging-only `/preview-first-run/` now uses the actual component with explicit fictional, no-network mailbox states and a simulation notice. Preview buttons describe real destinations but do not persist anything. Single product release label `APP_RELEASE_LABEL` in `app/domain/appRelease.ts` displays `Cuebooker · Beta 0.0.2` at the bottom of Settings for both account modes; this is a product label, not a git revision.

Validation: 438 tests pass, including compiled component readiness, mailbox consent/reconnect/failure/retry, stale scope, no-network demo, translated state, actual navigation handler execution without writes and shared Settings label. Staging static generation passes with 41 routes; diff checks clean. No authenticated phone/browser smoke is claimed. Supabase guide used for the existing authenticated status boundary; no permissions or secrets changed. Production still lacks the Agency/mailbox backend migrations/functions identified during read-only preflight and needs a separate controlled rollout, configured integrations and authenticated end-to-end validation before web promotion. Exact next step: review the updated first-run preview, verify live DJ onboarding actions with a staging session, then prepare the missing production backend release rather than deploying only the frontend.

## 2026-10-04 / Agency preparation onboarding

PR96, branch `feature/agency-multi-artist-beta`, base `31fc5a221929cf2b7ba2a338020c0a28cd401792`. Owner accepts both DJ and Agency profiles for now and requested Agency onboarding before later staging/production promotion. Added AgencySetupPanel to live Agency Overview for roster-managing owner/admin roles, including zero-artist agencies. Three saved-state steps: agency bio/contact email; first active artist name/bio/city/genres; optional published agency page with a selected eligible artist or connected personal mailbox. Public catalog/profile publication is not required for private/manual operations. The manual enquiry action becomes available with an active artist, independently of optional channel readiness. The optional public route follows the existing agency catalogue contract, never an independent artist-public toggle or accepting_requests switch.

Progress uses existing authenticated APIs and workspace data, never click-based completion or localStorage flags. listBookings(workspaceId,1) checks the entire workspace without artist/status/archive filters, so the first saved enquiry/manual booking hides onboarding permanently while that record exists, including archived bookings, unassigned agency requests and retired-artist bookings. Existing agencies with bookings make only this one extra existence read, skipping setup detail reads. Read errors display Retry and never imply a new agency or completed step. Mailbox status failure leaves other steps usable and explicitly reports that email could not be checked. Request-generation guards prevent scope races/unmounted responses. Preparation reads getProfile(id,false), preserving active artist/profile state. Existing callers retain default synchronization.

Actions use existing Settings sections, add-artist dialog, artist profile and CUE capture. Settings close, roster changes, operations refresh and attention refresh recompute status; returning from profile remounts Overview and rereads saved state. ES/EN, theme accents, rounded controls, pressed-free textual completion and 390px stacking are included. New staging-only anonymous `/preview-agency-setup/` uses explicit fictional data with New agency, Setup complete and First enquiry scenarios; simulated step actions never write, connect email, publish or create bookings. Existing agency demo remains unchanged.

Validation: 434 tests pass, including pure readiness/manual-private rules and execution of the compiled loader (saved-state navigation, archived/unassigned exit, no secondary reads for existing bookings, transport failures/retry, unavailable mailbox, workspace races and no-network demo). Staging static generation passes with 41 routes. No authenticated browser/mobile visual smoke is claimed. No new schema/migrations, functions, RLS or production changes. Next: owner review `/preview-agency-setup/`, then authenticated fresh Agency on phone before authorizing staging/production promotion.

## 2026-10-04 / Overview first-word accents

PR96, branch `feature/agency-multi-artist-beta`, base `865f3d740eec8c11e7093d99a752021069726797`. Owner requested accenting the first word of the four circled individual Overview metrics. SummaryMetricLabel now splits the translated label reactively and colors only its first word using the existing theme accent (lime in dark, existing light-theme accent in light). Remainder, month, numbers, descriptions and Public profile card remain unchanged. No data, agency, auth or production changes. Validation: compiled component tests cover ES/EN, month suffixes, single-word and empty labels; staging static generation and full suite run before publishing. Visual device verification remains pending.

## 2026-10-04 / Individual settings removals and onboarding avatar choice

PR96, branch `feature/agency-multi-artist-beta`, base `66c13a39a2316b89433b95c40ddd623816d87762`. Owner confirmed removal of both Demo plan and Change password from individual DJ Settings. Agency settings remain unchanged; password recovery remains available from Access. Existing underlying auth commands are not deleted.

Independent DJ onboarding now exposes rounded Hombre/Mujer (Male/Female) pressed-state buttons inside CueIdTeaser. The existing authored GLB preview reacts to the selected body. The choice is stored as `cuebooker_avatar_body` in authenticated user metadata before complete_onboarding, preserving other metadata and surfacing persistence errors before completing setup. This is an avatar preference, never an authorization claim or a recorded biological-sex field. Agency onboarding does not write it. Creator reads the preference as its initial/reset body for both Create now and Later, and waits for initialization before displaying a model. Existing user-scoped drafts take precedence after onboarding. Creator drafts are now namespaced by signed-in user ID; the legacy anonymous lab draft remains anonymous and is not adopted for a signed-in user. Full customizations remain browser-local as before, not cloud-synchronized or published automatically. No production-catalog promotion or public-profile selection change.

Validation: 429 tests pass, including execution of the actual auth command with mocked transport (female/male persistence, metadata preservation, agency exclusion, failure and invalid-value handling), compiled reactive teaser behavior and settings/draft isolation source contracts. Staging static generation is checked before publishing. No live registration or authenticated browser smoke is claimed. Owner phone check remains pending. No migrations, RLS, functions or production deployment. Next: verify signup avatar toggling and Creator initialization after both Now and Later in PR96.

## 2026-10-03 / Individual DJ settings and rounded actions

PR96, branch `feature/agency-multi-artist-beta`, base `0d14d8748aa2f506d5c43bee69c48b8d2307844e`. Agency/artists is accepted by the owner for now and left unchanged. Individual account settings now use the shared CuePreferencesControl with ES/EN and light/dark appearance controls. The mobile heading cancels the inherited negative gutter and sticky offset, fits its available width and wraps. Individual workspace primary/secondary/destructive actions, including Passport Public settings, use the rounded control token; login/signup/reset submission and access tabs have explicit rounded corners. Flat workspace navigation remains flat.

Validation: 426 tests pass, including three new source-contract regressions. Staging static generation is checked before publishing this change. No production, schema, auth logic or booking data changes. Visual device verification remains pending; browser QA was unavailable in this environment. Next: owner checks individual Settings, Passport action and login on the PR96 phone preview.

## 2026-10-04 / Artist roster and calendar omit context strip

PR96, base `0f2b535c9b1ba5f6295d16853bfbb43f192f4503`. The preview context strip now appears only on Overview, Bookings and Activity. Artists lists the complete roster without the redundant artist-filter banner; Calendar keeps its existing artist checkboxes. Profile/Passport/CUE ID remain unchanged from the previous fix. Validation: existing tests and staging static generation. No production changes.

## 2026-10-04 / Remove redundant artist context strip

PR96, branch `feature/agency-multi-artist-beta`, base `713db4572720249cb3068cc6e62bbf00bfcdd53e`. The anonymous agency preview now omits its agency/artist context strip and Clear artist filter action on Profile, CUE Passport and CUE ID. The separate Back to artists control remains. Operational views retain their filter control. The live artist record already has no equivalent strip. Validation: existing tests and staging static generation. No production changes.

## 2026-10-04 / Agency preview artist record booking band

Branch `feature/agency-multi-artist-beta`, based on `35a11942586cc6542221d6f0306c617ad77bc589`. The anonymous agency preview omitted `agencyManaged` when rendering WorkspaceArtistProfile, so its default false exposed the individual booking band despite the live workspace already hiding it. The preview now passes true explicitly, hiding Booking paused, Configure booking and Share profile in the managed record and retaining the independent artist behavior. The existing agency integration test verifies the preview prop connection and component condition.

Validation: npm test and staging generation, as recorded in this change's CI. No schema, functions, production or live data changes. Next: inspect the artist record in PR96 preview on the owner's phone.

## 2026-10-04 / Recover PR96 mobile follow-up

Branch `feature/agency-multi-artist-beta`, base HEAD `851c6206399f1a62ca86c0db0e09db7bf9d07137`. This section travels in the implementation commit; use Git history for its resulting SHA.

- Agency calendar day clicks scroll to the rendered day agenda at widths up to 950px, including repeated clicks on the same date. Sticky/fixed header height is accounted for. Desktop does not scroll; reduced-motion users get immediate movement. This is shared by the live workspace and local agency demo.
- The second agency-contact CTA at the end of PublicArtistProfile now draws an SVG arrow. Preview button and published link use the rounded control radius and the same responsive placement.
- Managed artist navigation removes the repeated stage name, labels the destinations Ficha / CUE Passport / CUE ID and keeps those three destinations on one grid row. Volver a artistas is a separate control. Live workspace and anonymous preview follow the same structure; aria-current remains the active-state source.
- Validation: 421 tests passed, including actual compiled AgencyWorkspace day selection, mobile scrolling, repeated selection, desktop behavior and reduced motion. Production and staging static generation each passed with 38 routes. No typecheck script exists. Visual browser QA was attempted but unavailable: local Chromium was absent and its download returned a truncated archive. Device visual verification remains pending, not claimed.
- No schema, migration, Edge Function or production deployment. Next: verify PR96 preview on a phone, especially day-agenda scroll, three-tab fit and portfolio contact CTA.

## 2026-10-02 / Agency preview and roster interaction polish

PR #96 (`feature/agency-multi-artist-beta`), for staging review only.

- Public agency enquiry preview now renders the actual artist selector, name/email fields, message area and privacy copy. Preview mode keeps submission disabled and the submit handler remains guarded, so no enquiry is created from the preview.
- Artist profile action “Distribución” is relabeled “Compartir perfil”. Its preview panel explains publication and enquiry status; it no longer falls through to an unrelated image/cover note or displays a no-op Save button.
- Agency roster actions use compact pencil/trash icon buttons with per-artist accessible labels and focus styles. Removing an artist still requires the existing confirmation.
- Added source-contract tests for preview form behavior, the share panel, accessible roster actions and the local artist preview.
- The agency demo now wires “Ver como público” to a full local Public Artist Profile preview with a close control; the booking form remains visibly disabled in preview mode.
- Agency catalog settings already include Instagram and website links, plus a public `/agency/<slug>` URL and copy-link action after publishing. Keep these agency-level links on the catalog; artist distribution stays on each artist profile. The visible roster is the content of the catalog, not a substitute for the public agency page.
- The agency share URL already follows `/agency/<slug>`. Onboarding derives the slug from the agency name; `organizations.slug` is unique and validated. The catalog editor does not yet expose slug editing, so do not describe the slug as editable from Settings.

Code commits: `f5a7d0cc57eb565afebbcfeae4c46c56d5d43580` plus template correction `a5bec624ab3242b1fabb06b990a47355db3b28a0`; tests were aligned in `c26a1fd2e2ed63d50a40000a61728a282acb5f93`. The public-profile preview fix is in `9408e6c9ec9dbffd2bf75ce02b83ff07c596ddaf`; CI run `37064260848` and Deploy Staging run `37064260864` passed. The PR preview rendered the local artist profile and accessible roster icon labels. Production was not touched. Production was not touched.

## 2026-10-02 / Agency mobile header: restore wordmark and separate controls

Follow-up from the owner's iPhone screenshot on PR96. At mobile widths the Agency header replaced the full Cuebooker wordmark with a small icon and placed the artist selector beside account actions, where the selector text was obscured by the notification control. The <=680px Agency header now uses three rows: Cuebooker wordmark and account actions; a full-width agency/artist selector; then horizontally scrollable workspace navigation. The full wordmark is shown at 112x38px and the selector truncates its label within its own grid cell.

CI run1920 tests and production build passed. Deploy Staging run2394 deployed the PR preview successfully; stable staging deployment was skipped. Owner can verify at https://pr-96.cuebooker-staging.pages.dev/access/. Authenticated iPhone workspace visual check remains with the owner; no login credentials were entered, mailbox connection was not performed, and production remains unchanged.

## 2026-10-02 / Session refresh, safe Agency errors and mobile navigation

PR #96, branch feature/agency-multi-artist-beta. Supabase staging logs for the user's Agency workspace show authenticated PostgREST requests at 2026-10-02 07:03Z returning401 with a token issued at04:57Z and expired at05:57Z. The app refreshed sessions only during initialization, so a tab left open past token expiry kept using the stale access token. This explains the concurrent Agency data, team, profile and mailbox request failures in the mobile screenshots; no RLS or permission policy was changed. The exact mailbox connect attempt was not independently confirmed in function logs.

Added a client session refresh 90 seconds before expiry and a freshness check when a backgrounded tab becomes visible. Agency roster load errors now show a localized safe message instead of rendering raw Supabase request URLs/query strings. Workspace navigation centers the active tab in the horizontally scrollable mobile nav after view changes.

Validation: CI run1918 tests and production build passed. PR preview run2392 deployed successfully; deployment to staging.cuebooker.com was skipped. User-facing preview: https://pr-96.cuebooker-staging.pages.dev/access/. The owner still needs to sign in and perform the Nylas authorization from Settings to verify their mailbox; no mailbox was connected, no user credentials entered, no data created, and production was untouched.

## 2026-10-01 / Automatic request verified with the real owned test email

The explicitly authorized post-consent pilot email Presunta oferta now maps to one real agency booking bdbc8826-ba71-4604-8d00-d8e50d389932, status new, artist_id null, contact retained, offer220000 EUR and original inbound conversation stored once. Event date remains unset because 4/5 November has no explicit year. Exactly one in-app notification was created, with no notification-email delivery. Fresh staging UI shows the agency request in the global list, notification badge1, and New email enquiry in the bell; opening that alert navigates directly to the request with price, uncertainty and the Gmail reply composer. No send or booking decision was taken. The old completed pilot job alone was explicitly requeued for this upgrade; no failed attempts or history were bulk replayed. Scheduler active again with consent preserved.

Transactional solo capture also passed and rolled back its fixtures. Adjusted classifier prompt/cache revision to gpt-oss-20b-20261001-v3: collective artist enquiries must not insist on choosing one artist. Corrected the known pilot's warning to match that contract without another model call;10 focused classifier/cache/draft tests passed. Live connected-mailbox v29 and worker v10 deployed. Fixed an observed notification layout issue by teleporting the panel outside the transformed sidebar while retaining outside-click behavior. Latest layout build and UI verification pending at this checkpoint. Linked-thread background reply still needs a fresh real reply test; no production changes.

## 2026-10-01 / Automatic email enquiries: one agency request, prefilled details and in-app alert

User clarified the product contract: an incoming booking enquiry must automatically become a real request; a multi-artist agency enquiry remains one agency request and one thread. Worker now classifies and extracts in one model call, then atomically creates contact/request/thread/email and a deduplicated in-app notification. Agency requests may have no individual artist; solo workspaces bind their single active artist. Initial request remains new; subsequent linked replies use deterministic sync without AI. Unknown date/year, currency or timezone is never invented; extracted warnings are visible in the request. No automatic response, confirmation, hold, contract, or notification email is sent.

Applied mailbox_automatic_requests and mailbox_initial_capture migrations on staging. Existing membership RLS remains in force; capture RPC is service-only and checks current mailbox consent, revision, membership and cutover under locks. Replay returns the same request and does not overwrite existing thread details. Scheduler paused during rollout; opt-in preserved. Staging connected-mailbox v28 and process-mailbox-incoming v9 deployed. Tests: 415 passed, Nuxt generate 38 routes, transactional agency capture/replay/revocation/notification checks passed without persistent fixture data. Live upgrade of the explicitly authorized fictional enquiry and fresh UI notification verification remain pending at this checkpoint. Production unchanged.

## 2026-10-01 / Real post-consent incoming enquiry classified; reveal saved proposals by default

User sent the fictional enquiry and confirmed sending. Signed webhook admitted one job at 17:54:35Z; scheduled worker completed it at 17:55:04Z as booking (direct availability/quote enquiry for two artists). Live mailbox UI shows the matching subject Presunta oferta from the expected owned test sender and the saved classification. No manual classify call was made and no enquiry was created or confirmed.

Found a UI defect: recent() returned saved background classifications, but shownMessages required a manual-analysis session or show-all toggle, hiding the detected proposal. Fixed the shared DJ/agency panel to show saved booking/review proposals by default while excluding unclassified and other mail. Manual review and manual detection remain available. Updated the obsolete pilot copy to reflect per-mailbox automatic-detection state and explicit reviewed creation. Nuxt generate passed. CI and Deploy Staging both passed. Fresh live page reload verifies Presunta oferta is visible by default as a Possible enquiry, with automatic detection active, without checking manual consent or pressing Detect. Ledger increased from 2 to 3 attempts only, matching one background classification. Existing fixture booking remains in_conversation. Linked-thread background reply validation remains pending.

## 2026-10-01 / Gmail background detection explicitly authorized and staging scheduler active

User explicitly accepted background Groq analysis after reviewing the per-mailbox disclosure. Enabled through the signed-in CUE Agency TEST UI, not by bypassing the consent setter. UI now shows authorization granted and the withdrawal button. Database verifies exactly one authorized mailbox, belonging to the test workspace, with cutover 2026-10-01T17:50:14.969766Z (19:50 Europe/Madrid). Activated the existing cuebooker-mailbox-incoming cron job only after that verification; active=true confirmed. It processes one queued message per minute and sends no HTTP request for an empty queue.

CI and Deploy Staging for 9c2447ac2eeeaacccf17b1511100230d8a5603d7 both completed successfully. Incoming queue remains empty at activation: a fresh post-consent fictional incoming email and linked-thread reply are still required for end-to-end validation. Do not claim an actual incoming email has been classified, create or confirm bookings automatically, or replay pre-consent history. Production untouched.

## 2026-10-01 / Live synthetic evaluation passed; worker configured, mailbox opt-in pending

Branch feature/agency-multi-artist-beta, PR96 preview/staging only, base HEAD a6d8d9faf85247bc3217777de565845f89a56f8a. User saved MAILBOX_WORKER_SECRET; a server-side digest comparison confirms it matches Vault without returning the value. Authenticated worker smoke returned200 processed:0; unsigned worker POST returned401 unauthorized. Nylas notification logs show several successful message.created deliveries to the exact staging receiver, including Google grant a2b560a2-9f41-4e77-8b77-eeceb81bd388 at2026-10-01T16:29:05Z; webhook ID ryazK5hRkBqWvkvvewJ78H7843. Signing configuration is now verified by provider delivery, not just secret presence.

Live Groq evaluation first hit rate_limit in its fourth back-to-back call and stopped without retry. Separate paced checks found a real extraction-mode error: a quote request for two possible artists was downgraded to review. Updated the classifier instruction to keep explicit performance/quote enquiries as booking despite missing details or unresolved artist choice; artistName remains null and requires selection. Classifier version bumped gpt-oss-20b-20261001-v2, invalidating old cached prompt results. Corrected live sample: 18/18 categories (8 booking true positives, 0 false positives/negatives) and5/5 extraction cases passed, including missing year, quoted older offer, multiple artists and sender phone. Six corrected calls used5276 input/4998 output tokens; no missing usage. This small fictional corpus is not a real-world accuracy estimate. Standalone operator runner now spaces extraction calls35s; no automatic failed-call retry.

Evaluation ran via a temporary staging-only worker-key-protected function that accepted only fixed synthetic cases, never read mail or created bookings. It is retired as evaluate-mailbox-synthetic v5 returning410 without provider/DB access. Tests bypassed the ordinary mailbox usage ledger as documented for standalone synthetic evaluation; provider quota was consumed. connected-mailbox v26 and process-mailbox-incoming v7 ACTIVE contain the corrected helper, custom authentication preserved. 408 local tests and38-route generation passed; standalone dry-run still0 calls. CUEBOOKER_MAILBOX_BACKGROUND_ENABLED=true is configured in staging, exposing consent controls only. No mailbox is opted in, so no background mail read/model call occurs. Cron remains paused. Existing fictional booking remains unchanged/in_conversation. Production untouched.

Next: securely authenticate PR96 test user, review Settings detection disclosure and obtain explicit per-mailbox Groq consent; do not set consent directly via SQL. Then fresh fictional enquiry and linked reply, inspect signed queue/worker outcomes, verify proposal-only new enquiry and deterministic reply sync/no AI/booking decision. Activate the paused schedule only within that test/consent scope. App currently shows Access; no full roundtrip or live UI checkbox action is claimed.

## 2026-10-01 / Staging webhook registered and signing secret configured; paused worker schedule installed

Branch feature/agency-multi-artist-beta, PR96 preview/staging only; base HEAD 3c980bc9a4e017a59901125bc98ad34cfb0e445d. Nylas Sandbox application 317c4281-1ef0-47ca-85c3-16e9bc243932 now has one Enabled destination named Cuebooker staging incoming mail, only message.created, gzip off, targeting staging nylas-mailbox-events. User explicitly confirmed registration and securely saved NYLAS_WEBHOOK_SECRET. Live unsigned POST now returns401 invalid_signature rather than missing-config503: proves a secret is configured, NOT that its value matches Nylas. A genuine signed delivery is still unverified. Do not recreate the destination or rotate secrets unnecessarily.

Migration 20261001153215_mailbox_worker_schedule.sql installed cuebooker-mailbox-incoming every minute, active=false (paused). The command reads its destination and independent bearer token from Vault, only emits an HTTP request when pending jobs exist, and processes one job per invocation. No provider/worker token is embedded in source or cron command. Vault contains one generated 256-bit cuebooker_mailbox_worker_secret and cuebooker_mailbox_worker_url for staging. Only IDs/metadata were returned; no secret was logged or committed. The Edge MAILBOX_WORKER_SECRET value still needs secure operator transfer from Vault. Background feature flag and mailbox opt-in remain off. This scheduler has pilot throughput of at most one job/minute; revisit drain capacity before larger rollout.

Validation: migration applied successfully using supported cron.alter_job after a direct cron.job UPDATE was rejected; no table permissions weakened. Live cron row confirms * * * * * and active=false. Executing its exact command against the empty queue returned zero rows and emitted no HTTP invocation. No new booking, mailbox authorization, model call, outbound mail or production change. Existing 408 tests/38-route build belong to the previous implementation and were not rerun for this SQL-only block. Next: operator copies Vault worker secret directly into Edge MAILBOX_WORKER_SECRET; then verify a signed Nylas delivery and worker authentication, complete synthetic model evaluation, explicitly enable staging flag and per-mailbox consent, and run fresh fictional enquiry/linked-reply tests before activating the schedule. Never print Vault decrypted values in SQL output, chat, logs, screenshots or source.

## 2026-10-01 / Signed incoming queue and protected processor deployed, activation/configuration pending

Branch feature/agency-multi-artist-beta, base 667d402172c4eb8ceca62f93d8d022ac2feef582, PR96 preview/staging only. Migrations 20261001132957_mailbox_incoming_queue.sql and 20261001133744_mailbox_incoming_processing.sql add RLS/service-only jobs and invoker enqueue/claim/authorize/complete. Unique connection/message and connection/event dedup, permission revision and cutover binding, current operating membership check, per-connection pending cap1000. SKIP LOCKED claim once, immutable completion, stale pending jobs ignored. No leases or automatic replay of processing/failed jobs; inspect interrupted executions manually. Jobs store identifiers/date/state and private derived category/reason, no raw content. No timed retention cleanup yet. Existing last-owner protection blocked a demotion smoke; protection preserved, that test removed, no role-removal smoke claimed.

Staging Edge nylas-mailbox-events v1 ACTIVE validates HMAC/raw bytes, 1MiB body bound, safe opaque ack, exact GET challenge. POST without configured signing secret fails503; gzip fails415 pending provider compression test. process-mailbox-incoming v3 ACTIVE requires separate worker bearer secret, both server feature gates and provider/model/signing configuration; claims one job and rechecks consent before reads/AI/result. Resolves opaque provider folder IDs through documented attributes; excludes sent/drafts/junk/trash, old/outgoing/non-inbox messages. Existing linked-thread replies ingest with explicit booking ID/no reviewed fields and no AI; new eligible messages become category/reason for user review using existing cache/monthly allowance. Worker reservation uses job UUID. No new booking, decision, hold or email send. Manual analysis racing worker is not globally message-locked. connected-mailbox v22 recent returns completed owned detection metadata. Shared Settings now prepares explicit per-mailbox consent checkbox/activate control behind operator availability, clears consent on save/scope changes, keeps withdrawal available.

Implementation HEAD a5e07ac9246a6349b5666d80c9a425404368ccce; CI run36872650101 and Deploy Staging run36872649527 succeeded. 408 tests and 38-route generation passed. Queue rollback verified default/cutover refusal, duplicate message/event, revision binding, pause, cap and client privileges. Processing rollback verified one claim, withdrawal refusal, immutable completion and stale-job discard. Helper/worker Edge/UI tests cover fresh permission, folders, no-AI linked sync, no outbound calls and checkbox scope. Live HTTP challenge200 exact; unsigned webhook503 mailbox_webhook_not_configured; worker503 mailbox_background_unavailable. Post-rollback jobs0/authorized connections0, no background reads/model calls or booking/email changes. Advisors reviewed after both migrations: service-only RLS/no policy INFO expected, existing warning categories unchanged. Final live DB checks retained jobs0/authorized0, usage attempts2 and fixture booking in_conversation/updated_at 2026-10-01 09:57:48.535505+00. Recent inbox preserves provider messages if optional detection metadata fails. No production/merge, subscriptions or new mailbox scopes. Full live corpus, registered signed Nylas delivery, real folder/compression verification, live UI/mobile390/separate DJ pending.

Next operational prerequisites: register staging Nylas webhook, save generated signing value securely as NYLAS_WEBHOOK_SECRET; securely configure MAILBOX_WORKER_SECRET and authenticated scheduler (one job/request, none installed); evaluate complete synthetic Groq corpus and test real signed event/folder mapping. Then explicitly enable CUEBOOKER_MAILBOX_BACKGROUND_ENABLED in staging and obtain owner mailbox opt-in before fictional enquiry+reply roundtrip. Detailed setup/limitations in MAILBOX_AI_EVALUATION.md. Do not claim automatic detection is active: current signing/configuration and background gate remain unavailable. No credentials copied or requested in chat.

## 2026-10-01 / Per-mailbox background authorization prepared, automatic processor unavailable

Branch feature/agency-multi-artist-beta, base 018926598e97ea8c9afe5c5626aff7da580469f8, PR96 preview/staging only. Migration 20261001131151_mailbox_background_consent.sql adds consent enabled/processor/since/revision to private mailbox_connections, strict complete-state constraint, service-only SECURITY INVOKER setter and reset trigger. Setter locks owned connection and checks current operating membership; repeat consent preserves cutover/revision; withdrawal clears; reauthorize gets fresh values. Grant/connected_at/status changes revoke consent. Existing/new connections stay disabled. Edge connected-mailbox v19 ACTIVE status adds safe permission metadata; authenticated background action rejects activation with unavailable (hardcoded false gate) and permits owned withdrawal even without provider configuration, no external reads/transmission. Disconnect revokes before provider disconnect. DJ/Agency shared Settings shows detection preparation details and withdrawal only if a saved permission exists. No activation button until incoming processor is ready.

Implementation HEAD 57b463d39c2d57595d18389088cd5ef4860253e4; CI run36867644958 and Deploy Staging run36867644996 succeeded. 391 tests and 38-route generation passed. Edge boundary tests prove unavailable activation/malformed version do not read/transmit/write, withdrawal survives disabled provider config, foreign mailbox denied. Staging rollback verified default, idempotence, wrong processor, foreign actor, withdrawal, fresh reauthorization cutover, reconnect/disconnect resets and client RPC privilege denial. Advisors reviewed, no new warning categories. Automatic authorization in actual test mailbox remains false after rollback, no background/provider AI call or booking mutation. No production/merge, subscriptions, scopes, confirmation/hold/outbound email. Next: durable authenticated incoming event/job path, fresh permission/revision/membership checks and new-message cutover, deterministic linked-thread reply sync, synthetic live model evaluation before enabling availability. Fresh browser tab reached /access because the earlier authenticated session was no longer available; no credentials were entered or login claimed. Live Settings visual verification, mobile390 and separate live DJ remain pending.

## 2026-10-01 / Reuse validated mailbox analysis without another AI attempt

Branch feature/agency-multi-artist-beta, base bb4b6361b2f97c0460a61f4d3c3269e681fb59c5, PR96 preview/staging only. Migration 20261001120319_mailbox_ai_result_cache.sql adds RLS/service-only mailbox_ai_results, FK cascade and connection/hash lookup index. connected-mailbox v18 ACTIVE checks cache after owned connection/authentication/explicit Groq consent. SHA-256 keys cover message ID, effective bounded input, extraction mode and explicit classifier version. Validated results are reusable for 24h; mixed batches classify misses only. Hits skip rate/budget gates. Booking data and updated_at always fetched fresh. Invalid/failed results never saved. Storage failure stops without automatic retry. Cache contains private derived reason/draft (possibly phone), no raw subject/body; unlike content-free usage ledger. Expired rows pruned on next analysis write for that connection, not guaranteed physical 24h deletion. Latest row per connection/message/mode only. Minute gate prevents simultaneous immediate misses; durable event/job dedup not implemented.

Implementation HEAD c5a8a982e0c33d8e7b86d3e88e072b7678e1ebc5; CI run36860115712 and Deploy Staging run36860115705 succeeded. 388 tests passed, 38-route generation passed. Edge tests prove hit requires consent, avoids all writes/budget/provider AI and returns fresh booking versions; helper tests cover mixed hit/miss ordering, identity changes, invalid output and fail-closed cache reads. Staging migration applied; rollback insertion and privilege checks verified RLS, no anon/authenticated reads, service access, zero rollback rows. Additional rollback test verified latest-row upsert replaces the expired result without duplicating the message/mode. Advisors reviewed: cache intentionally service-only RLS/no policies INFO; new unused index INFO retained; existing warning categories unchanged. Live Agency known fictional original email analyzed twice: attempts increased 1->2 for first call, second remained 2; exactly one cache row. Both proposals displayed. Approval stayed unchecked, returned without save; booking in_conversation, updated_at 2026-10-01 09:57:48.535505+00, emails3/activities8 unchanged. Initial thread load failure resolved after one reload. UI screenshot observed; no screenshot artifact saved. No production/merge, subscriptions, new scopes, automatic intake, confirmation/hold or outbound mail. Whole corpus live evaluation, mobile390 and separate live DJ still pending. Next: background opt-in per authorized connected mailbox, authenticated durable event/job dedup with fresh-message cutover and deterministic linked-thread sync; evaluate synthetic corpus before enabling automatic intake.

## 2026-10-01 / Monthly mailbox analysis gate and synthetic evaluation

Branch feature/agency-multi-artist-beta, base d0c6b5255c2f1a83734e696c150dca56ee9593dc, PR96 preview/staging only. Migration 20261001103606_mailbox_ai_monthly_budget.sql adds service-only settings/attempt ledger and invoker reserve/complete RPCs. Default monthly UTC caps: 100 attempts per connection, 1,000 app-wide. Singleton lock serializes reservations; membership and ownership are rechecked. Failed/unfinished attempts count; no automatic refund or retry. Completion is write-once. Ledger stores only references/outcome/timestamps and optional token counts, never email content/output. Missing accounting does not repeat AI or release allowance. Both client roles are denied table/RPC access. These are attempt limits, not a dollar invoice cap. Existing one-minute gate and selected consent remain. UI explains exhaustion and manual intake remains available.

Staging migration applied, rollback smoke passed connection/app exhaustion, duplicate refusal, failed attempt consumption, immutable completion, previous-month isolation, pause, foreign actor denial and client privilege denial. Edge connected-mailbox v17 ACTIVE with existing custom verified user/membership/owned connection authentication. Security advisor categories unchanged; new tables intentionally service-only with RLS/no client policies. Performance advisors reviewed; all new FK references indexed. Live Agency analyzed only known fictional original mail with explicit single-email Groq consent: one succeeded ledger entry, 817 input/878 output tokens; proposal displayed, approval remained unchecked, returned to conversation without saving or confirmation. Booking/email/activity counts remained unchanged.

Added 18 fictional labelled evaluation cases and five field-extraction cases, scorer and optional operator runner (dry-run by default, maximum six live calls, no mailbox reads/retries). Dry run and scorer tests passed with zero provider calls. Complete live corpus NOT run; no accuracy percentage or automatic-intake readiness claimed. Standalone operator calls are outside website allowance. 383 local tests and 38-route generation passed. Implementation HEAD `6d2afb7a4883fbf290f60448b6c0ae91cd0ede14`: CI and PR96 staging deployment succeeded. Edge v17 and monthly gate were exercised live as above; 383 tests and 38-route generation passed. Local migration listing/replay could not connect to a local database (127.0.0.1:54322); no local replay is claimed. Staging migration and rollback verification passed. Native credential protection prevented saving a screenshot. Latest user asks to trigger AI only for incoming mail in allowlisted mailboxes: proposed interpretation is explicitly authorized connected mailboxes, not a known-sender-only list. A new promoter stays eligible. Existing linked-thread replies sync deterministically without reclassification. Background consent, fresh-message/event dedup, cache and authenticated job/webhook path still need implementation; nothing has enabled background transmission. Local migration replay unavailable if Docker is not running; staging apply/rollback verified. No production, provider subscription, new mailbox scope, background capture, automatic confirmation/hold or outbound email. Next: run/evaluate the complete synthetic corpus through a secure operator environment, add classification cache/dedup and background consent/idempotent job path before automatic intake. Mobile390/separate live DJ remain pending.

## 2026-10-01 / Read-only mailbox refresh and usable manual intake

Branch feature/agency-multi-artist-beta, base d6419c0ed1a02aff203a02680d58c4158f70f5e1, PR96 preview/staging only. Shared DJ/Agency MailboxRequestsPanel separates reading from explicit batch detection. Refresh, mailbox changes and post-import reload never call Groq. Changing mailbox/workspace clears consent. Batch failures preserve loaded messages for manual creation and use scoped AI quota/rate/unavailable explanations. “Revisar correos sin IA” exposes the manual route. Detection shows a working label; mailbox selection is disabled during loading/operations. Delayed analysis results cannot populate a changed workspace.

Implementation HEAD `ae9d661de4fd069197f6c549f96d01216c17ae4b`: 376 local tests and 38-route generation passed after final refinement; CI and PR96 staging deployment succeeded. Mounted regression covers no refresh/import reanalysis, no analysis without consent, manual import after quota failure, per-mailbox consent and stale-workspace results. Live authenticated Agency intake after deployment showed Refresh available, Groq consent unchecked, Detect disabled and Review emails without AI available; explanatory manual-route copy and existing test booking in_conversation were visible. No unrelated mail was opened or analyzed. Native credential protection prevented saving a new screenshot; no screenshot or mobile/separate live DJ validation is claimed. No Edge, schema, provider-account, permission, automatic capture, outbound send or production changes. Existing reviewed-save safeguards remain. Next: measured classifier evaluation and budget/cache gates before automatic capture; live mobile390/separate DJ smoke remain pending.

## 2026-10-01 / Live linked-thread reviewed save verified

PR96 staging only. User restored preview login; existing browser tab recovered and opened the known Agency test booking. Original linked test email was selected individually with explicit Groq consent. Live extraction proposed 2026-10-24, 23:00-01:00, Europe/Madrid, Sala Apolo, Barcelona and 500 EUR. Apply reviewed changes started unchecked; explicitly checking it and saving closed review and showed populated booking facts.

Read-only SQL verified persisted fields (50000 minor units), unchanged artist/contact and in_conversation. Counts remain one workspace booking, three emails and one mailbox thread; activities rose from seven to eight for the reviewed internal update. No new outbound email, automatic confirmation, hold, duplicate booking or duplicate message. This completes the live guarded save smoke pending in the previous entry. Implementation remains 810f5f067c79f7f2b71934494d6c8d80f2442f79 with prior 375 tests, 38-route build and successful CI/staging deployment; no code/schema changes in this verification. Earlier generic Access error cause was not determined; latest successful login and recovered authenticated view are verified. Mobile390 and separate live DJ smoke remain unverified. Production untouched.

## 2026-10-01 / Review an email from its existing booking thread

Branch feature/agency-multi-artist-beta, base af4ab3daecfb2936907dbd67024ecb88244864e8. PR96 preview/staging only. Booking detail replaces the account-wide pilot inbox with a collapsed Review email details section for email_import bookings. Opening loads only the authenticated actor's linked connection and the first bound thread page (up to 20 messages, no seven-day filter); outbound and mismatched-thread results are excluded. Multiple linked threads or longer pages show a limitation notice. Saved conversation remains readable for other workspace members. No new scope, schema, grant or provider account.

New connected-mailbox action thread resolves thread IDs exclusively from workspace/owned-connection/booking links. Booking-scoped single-email classification checks the exact message's link before Groq transmission; no batch mode inside booking detail. Explicit single-email consent remains. Shared DJ/Agency review component reuses reviewed update validation, current/proposed comparison, unchecked approval and updated_at protection. Refreshing the roster preserves the existing artist. Saving passes the booking ID and closes review before reloading normal data. No automatic confirmation, hold or outbound email.

Implementation HEAD `810f5f067c79f7f2b71934494d6c8d80f2442f79`: 375 tests and 38-route generation passed; CI and PR96 staging preview deployment succeeded. Connected-mailbox v16 ACTIVE with existing custom user authentication, membership and personal ownership checks. No schema/migration/grant changes. Security advisor categories unchanged. Tests cover old linked-mail retrieval without account-wide feed/AI/writes, wrong-link refusal before AI, and mounted numeric review/booking context/artist preservation. Final browser session no longer existed; fresh preview redirected to Access. User completed secure browserAuth request, but the site returned 'No se pudo completar el acceso'. Stopped automated sign-in after that generic failure. Native credential protection also prevented manual browser handoff; explicit navigation to retained origin succeeded, but the fresh Access document remained protected for handoff. No repeated credential submission or alternate login method attempted. No final live guarded save or new UI screenshot is claimed. Known test booking baseline remains one workspace booking, three email messages, seven activities, one thread, in_conversation, same contact/artist and empty event fields. No new outbound send, durable test conditions update or AI confirmation. Production untouched. Next: restore preview authentication and verify the collapsed review opens the known original linked mail, extracts 24 October 2026/23:00-01:00/Barcelona/500EUR, then saves explicitly to same booking without confirming or duplication. Mobile390 and separate live DJ smoke remain unverified.

## 2026-10-01 / Explicit reviewed changes for existing mailbox threads

PR96 preview/staging only. Selected classification returns the existing linked booking from server-owned connection/thread lookup, including current details and updated_at. Shared DJ/Agency form merges missing suggestions with current fields, locks existing artist/contact inputs, shows current/proposed changes and leaves Apply changes unchecked. Opening the existing enquiry alone does not update details. Saving reviewed changes requires explicit checkbox plus action; changing an input resets that checkbox. No AI/status/artist/contact mutation is allowed. Missing proposed values never erase current data.

Migration `20261001075121_mailbox_existing_review.sql` replaces same service-only ingest signature. Existing booking is locked; explicitly reviewed update must match its updated_at and uses canonical update_booking_details RPC under verified actor claims. Stale/deleted links reject with safe booking_review_stale; unrelated concurrent edits are not silently replaced. Existing terminal decisions remain unchanged. Classifier reuses pure emailReplyPresentation to exclude recognized quoted history before draft extraction/year validation; original stored email remains intact. Quotation detection remains heuristic for unrecognized formats.

Final implementation HEAD `48cdef4305a4a32abc1594cc2aec3c740bc2619d`: 372 tests, 38-route generation, CI and PR96 staging preview deployment passed. Staging Edge v15 ACTIVE. Rollback SQL passed new/retry/contact/privacy cases, reviewed offer update, null-field preservation, stale review rejection, human confirmation preservation and email deduplication. Live Agency analysis of the known reply linked the existing booking, locked artist/contact, left apply unchecked and proposed no new event conditions from quoted history. Editing its numeric budget exposed Vue numeric v-model coercion; fixed string normalization for comparison/submission, with mounted regression for explicit approval and minor-unit conversion. By the final preview deployment both original and reply had moved outside the latest-20 selection; final real UI saving could not be repeated, and is not claimed. Test booking remains in_conversation, same contact/artist, one workspace booking, three email messages, seven activities and one linked thread. Screenshot saved. No new send, AI confirmation or durable event update. Security advisor categories unchanged. Production untouched. Next: final live reviewed-save smoke with a selected test email available in the pilot window, broader classifier evaluation and streamlined intake. Mobile390 and separate live DJ smoke remain unverified.

## 2026-10-01 / Reviewed mailbox booking details and verified sender contact
## 2026-10-01 / Reviewed mailbox booking details and verified sender contact

Final refinement HEAD `23a4eaa736b1ef379c526289cf70688eb664f44f`: CI and PR96 preview deployment succeeded. Contact and booking review extraction are ready in preview; final live test already exercised the refined server prompt. Staging Edge remains ACTIVE v14. No production deployment authorized.

PR96 preview/staging only. User requires useful event/contact extraction with all booking decisions owned by DJ/Agency. Single-message Groq classification now returns strict nullable draft fields: full date, overnight times, venue/city, amount in minor units/currency, artist name, signature phone and uncertainty warnings. No current-year inference; parser strips a year absent from message evidence. Shared DJ/Agency review form displays editable suggestions, sender email read-only, timezone to review and matching artist only when exactly one roster name matches. Bulk classification remains classification-only. No confirmation/send/hold capability in the AI schema; reviewed payload rejects status and contact-email injection.

Migration `20261001073006_mailbox_reviewed_details.sql` replaces existing six-argument service-only ingest RPC without expanding grants. Atomically stores reviewed fields for newly created threads, associates actual provider sender with contact, reuses same-workspace email contacts and preserves all existing-thread conditions/status on retry. Original email stays intact. Operational inbound status still follows existing triggers (in_conversation); terminal decisions remain manual. Existing contacts retain their existing data; reviewed phone/name are used for new contacts. Client-specific timezone is shown for review, not inferred from email.

369 unit tests and 38-route generation passed, repeated after prompt/UI theme refinement. Staging rollback SQL validates field persistence, overnight hours, no terminal decision, sender name/email/phone, retry idempotency, contact reuse, foreign actor rejection, status injection rejection and anon/authenticated EXECUTE denial. Security advisors retain existing five definer warnings and leaked-password notice, no new warning. Staging Edge v14 ACTIVE. Implementation `188f5b24b20219425ac44f215d28bd01aa96432b` CI and preview passed. Authenticated Agency selected only known synthetic test email: Groq populated 2026-10-24,23:00,01:00,Sala Apolo,Barcelona,500EUR and TEST Artista A; sender contact remained contacto@cuebooker.com, timezone Europe/Madrid visible for review. First live draft had an English reason and technical optional-phone warning; prompt corrected and second live call produced natural Spanish with no irrelevant warning, keeping all explicit fields. Screenshot saved. Light native control scheme added; separate live DJ/mobile390 remain unverified. No outbound email, production change or permanent synthetic booking. Reply-change proposals and reviewed updates to existing conditions remain a later explicit flow; import never silently overwrites them.

## 2026-10-01 / Groq selected-email UI and idempotent import verification

Authenticated PR96 Agency UI selected only the known original `Propuesta de sala apolo` synthetic test email from contacto@cuebooker.com; other inbox content was not inspected or sent to AI. Explicit single-email Groq consent submitted through the UI. Classification succeeded: booking / 'Solicita disponibilidad y condiciones para actuación.' Selected TEST Artista A and re-imported through 'Crear solicitud y continuar el hilo'. Opened existing booking `98e1d5c2-8787-4302-a2c4-40ce1fd8eaa1`; baseline and after counts identical: workspace bookings1, activities7, email_messages3, mailbox threads1. Saved original, prior outbound and prior inbound reply remain visible; reply preview has no quoted repetition. Composer uses litulandio@gmail.com. No new outbound mail or booking created in this step.

Evidence screenshots saved for classification and conversation. No implementation change needed, connected-mailbox v11 retained, production untouched. This verifies selected-message classification plus existing-thread import/sync in Agency. Separate live DJ smoke, broader AI evaluation and genuinely new-thread UI capture remain pending. Current classifier does not extract date/venue/fee; the booking remains Sin fecha/Sin oferta until manually edited. Automatic intake/caching still pending. UI review also found an unstyled back-to-bookings button and excessive mailbox-panel space above an opened conversation; address in a focused layout pass. Mobile390 remains unverified.

## 2026-10-01 / Groq credential activation and synthetic smoke

User configured `GROQ_API_KEY` directly outside the cloud browser. Authenticated PR96 Agency Settings now omits pending activation and preserves Gmail connected; credential values were never read or printed. A live staging smoke used the exact deployed mailboxClassifier adapter with six labelled synthetic messages: availability and negotiation => booking, newsletter and invoice => other, insufficient evidence => review, newsletter with prompt injection => other. All six matched expectations. One Groq call, 826 ms measured adapter time, 590 input tokens and 651 completion tokens (472 reasoning), total 1241 tokens. At previously verified list rates, approximate inference cost $0.00023955. Small deterministic fixture coverage is not a production accuracy estimate, and no real inbox messages were analyzed.

Temporary staging function `mailbox-ai-validation` v1 enforced random256-bit token digest, POST-only, five-minute expiry and one request per isolate; no input message payload accepted. After the single call, redeployed v2 as inert410 handler with verify_jwt true, no classifier/environment access. Unauthenticated smoke returns401. Local temporary token removed. Connected-mailbox v11 and production unchanged. No emails, imports, bookings or payments created. Next: controlled user-selected test email through the actual consent/classify/import UI, then wider labelled evaluation, limits/caching and automatic intake design. Never analyze unrelated private inbox mail. Mobile390 remains unverified.

## 2026-10-01 / Groq mailbox classifier transition

PR #96, branch `feature/agency-multi-artist-beta`, base `24e63bba14e2b2fe16fb561ff4cc2c80dda02258`. User approved Groq GPT-OSS20B for mailbox classification. Adapter uses Groq Chat Completions `openai/gpt-oss-20b`, strict JSON schema, bounded text and validated IDs. No tools, retries, provider fallback or automatic imports. Unsupported Chat Completions `store` parameter omitted after checking official API reference; retention depends on provider/account controls, no zero-retention guarantee. Smart Capture remains unchanged and still uses OpenAI.

Server requires `analysisConsent:true` and `analysisProvider:'groq'` before mailbox retrieval. Old OpenAI consent cannot authorize transmission to Groq. `GROQ_API_KEY` absent returns 503 before provider message access, even if an old OpenAI key exists. Status exposes only provider/model/configured boolean. Shared DJ/Agency disclosure names Groq; Settings shows pending activation when unconfigured. No secret exposed to browser/chat. Credential setup and real synthetic quality/latency/cost validation remain pending; transport tests are not accuracy evidence.

365 tests passed, including provider contract and old-consent/missing-key zero-network regression; repeated after removing the unsupported parameter. Final static generation passed 38 routes. Staging connected-mailbox Edge v11 ACTIVE. Implementation HEAD `fbc91d32ebcac79ab7ed3d25fbec1be262e60aca`: CI and preview deployment succeeded. Authenticated Agency Settings verified Groq disclosure, Gmail connected and AI pending activation (`GROQ_API_KEY` absent). Screenshot saved. Credential management is not exposed by the current Supabase connector; user must add the server secret securely in staging before synthetic model tests. No new inbox reads, AI calls, outbound emails, subscriptions, accounts or production changes. Keep private-mail classification and automatic capture pending until synthetic evaluation succeeds. Mobile390 remains unverified.

## 2026-10-01 / Mailbox timeout and AI limit diagnostics

Branch `feature/agency-multi-artist-beta`, base HEAD `a3ea9687cf0f050bd7f484216fb2ed984067fda5`, PR #96 preview/staging only. Sanitized log aggregation for 30 September 06:00Z to 1 October 05:25Z finds six generic timeout failures and one logged OpenAI429. Existing logs cannot identify timed-out dependency/action or quota-vs-rate cause; do not claim a root-cause fix.

Staging connected-mailbox Edge v9 ACTIVE preserves custom auth and OAuth GET callback (verify_jwt false as before). Storage and Nylas adapter timeouts have distinct safe codes; other timeout has generic request code. Allowlisted action names added to catch logs, no request/body/address/token/provider message. Classifier maps explicit OpenAI429 error code insufficient_quota/rate_limit_exceeded to quota/rate categories; unknown429 remains unavailable, no retry. Shared DJ/Agency UI explains AI pause/manual continuation, mailbox timeout/manual status retry, and avoids false pending-activation/disconnected badges on failed checks. Confirmed connected badge remains on errors unrelated to status.

364 tests passed including quota/rate/unknown429 privacy and no-retry checks, provider timeout distinction and storage timeout endpoint category/no-provider-access. 38-route generation passed before final badge-order correction; final generation tracked next. Backend deployed staging only; no schema changes. Frontend preview and real status smoke tracked next. No new mailbox reads, outbound email, AI analysis, payment or provider authorization. Historical429 remains unresolved; no classifier success claimed. Mobile390 remains unverified. Next: preview status check, then account quota investigation and controlled synthetic classifier validation when configured. Production untouched.

## 2026-10-01 / Email reply summaries across agency and DJ activity

Branch `feature/agency-multi-artist-beta`, base HEAD `e8e4c33ed9ae13f0540e4bb917a20bd5215038f5`, PR #96 preview only. Agency overview/recent activity and Activity list now reuse the existing emailReplyPresentation helper; shared DJ BookingCoreHistory does likewise. Only email rows decode entities and omit recognized quoted history from the summary. Notes and operational descriptions retain their original presentation. Original stored messages remain intact and accessible from Booking conversation. No schema, provider, authorization or backend changes.

361 tests pass, including mounted AgencyWorkspace checks for new-message-only email preview and unchanged note body; test harness resolves the newly imported helper. 38-route static generation and diff check pass. Implementation HEAD `85a902520fab80637e748c5de8dd5b2a6bed12a4`: CI and PR preview deployment succeeded. Authenticated Agency overview and Activity list verified the actual reply shows only 'Respuesta de prueba recibida!' with quoted history omitted and entities decoded. Screenshot evidence saved. DJ history uses the shared helper but no separate live DJ login was performed. Mobile390 remains unverified because the current browser API exposes no viewport resizing. Next: mobile verification when a supported viewport is available, then investigate transient mailbox status failures and resolve the classifier 429. OpenAI429, Microsoft/custom-domain live pilot, automatic capture and Meta integrations remain pending. Production untouched.

## 2026-10-01 / Agency team load correction and access regression

Branch `feature/agency-multi-artist-beta`, remote base HEAD `0314a227e638cce772d86cfaa577ff0c8277fb2b`, PR #96 preview/staging only. Reproduced team-load failure: PostgreSQL 42804 because `auth.users.email` is varchar(255), while `list_agency_team` declares text. Migration `20261001022812_agency_team_email_result_type.sql` explicitly casts email to text and adds deterministic ordering. Existing private definer/public invoker boundary, membership checks and grants remain unchanged. Applied only to staging `lycprjeuuynfzwskycwv`; production untouched.

Added repeatable `supabase/tests/agency_team_access.sql`. Live rollback test passed authenticated owner team/invitation reads, owner/admin list access, manager/editor/viewer denial, owner/self mutation protection, foreign workspace denial, missing-auth rejection and anonymous EXECUTE denial. A second existing actor is temporarily added as member inside the transaction; all changes rolled back. Last-owner protection also rejected an initial test attempt to demote the only owner; test corrected without weakening that protection. 361 local tests pass and diff check passes. Security advisors retain the existing five definer warnings and leaked-password warning, with no additional warning introduced. Performance notices remain outside this narrow type correction.

Implementation HEAD `2004eb46bcf151c15d5720dd86330bc452cde96d`: CI and PR preview deployment succeeded; 38-route generation passed. After user completed secure preview sign-in, authenticated Agency Settings verified Team loads with Agency Beta Tester as Owner, invitation controls visible and Gmail Connected. Screenshot evidence saved. No invitation, real email, provider authorization or AI call made. Mobile390 remains unverified. Newly observed: overview Activity summary still displays quoted reply history/entities, although Booking conversation already folds quotes; apply the existing presentation helper there next, then mobile smoke and transient mailbox status investigation. OpenAI429, live Microsoft/custom-domain pilot, automatic capture and Meta connectors remain unresolved. Production untouched.

## 2026-10-01 / Email beta capacity, simple setup and fallback disclosure

Branch `feature/agency-multi-artist-beta`, remote base HEAD `f27f05ff2b8068556871aea8156589713e2b877f`, local code base `21953f77a11c728bb3fa600c0bd2e05ae1d6a91e`, PR #96 only. User agreed limited free email beta, wants shared DJ/Agency setup by address, AI documentation and platform-email fallback made explicit.

Implemented shared ES/EN beta conditions on marketing and Settings, one email input with automatic server provider detection (known Gmail/Microsoft domains or Nylas custom-domain detection; choose service only when needed), secure authorization explanation, optional-AI disclosure, global cap/waitlist and platform-email fallback copy including composer sender explanation. Existing mailbox threads continue to require original mailbox owner; no unsafe sender substitution. No model switch, payment contract or automatic mailing. `docs/EMAIL_BETA_AND_AI.md` records actual OpenAI429 status, data payload/consent, costs/limits and future gates.

Staging migration `20260930225159_mailbox_beta_capacity.sql` applied. Default global capacity FIVE, configurable to TEN only after operator confirms Essentials. Service-only RLS tables/invoker RPC, membership recheck, serialized slot reservation, single-use claim and idempotent waitlist. Active private email remains connected. Edge v8 ACTIVE with custom auth. Global pool controls Cuebooker starts, not external provider grants/orphan billing; reconcile dashboard usage separately. Staging rollback smoke validates full pool, pending counting, replay rejection, completion, waitlist dedup/removal and foreign actor/client privilege denial. No persistent synthetic rows. Two intentional new info-only RLS/no-policy advisor findings; no new warning.

Implementation HEAD `22afacbea71be01d0ec63f2ae80b8b471c77753e`: 361 tests pass, 38 routes generated, CI and PR preview deployment successful. Authenticated Agency browser verifies conditions, optional AI disclosure, a single email input, no default provider selector and existing connected mailbox preserved. Copy follow-up removes redundant fallback paragraph and shortens setup guidance. Final copy HEAD `7063787346e95f64b0b3c1e5c3b5a8dfb3e5c1f9` also passed 38-route generation, CI and PR preview deployment. Browser verifies public marketing notice and final Agency Settings copy. Temporarily lowering staging cap to one showed the full-pool waitlist CTA and disabled new connection while preserving the existing connection; cap restored to five (one connected, zero waitlist entries). No provider connection or AI call initiated. Some independent mailbox sync/sender checks transiently failed during reload; final Settings verified Connected. No new send/delivery test performed. Mobile 390 and live custom-domain detection remain unverified. Production untouched. Next: preview verification, Essentials purchase/quota decision, Microsoft/custom-domain OAuth pilot, classifier quality and monthly spend controls before automatic/background capture. No Groq integration or successful live classifier claimed.

## 2026-09-30 / Reply text without repeated quoted conversation

Branch `feature/agency-multi-artist-beta`, base HEAD `6c2a4bb0e2017c9e5426313f29af745487c9243c`, PR #96 preview only. User requested showing only new reply text. BookingCoreInbox now applies a pure email presentation helper to email Activity only, shows new content and folds recognized dated Spanish/English reply headers, Outlook blocks and trailing quoted lines under native accessible details. Original database body remains unchanged and full quoted text remains readable on demand. Quote-only and inline-reply messages stay visible; unrecognized formats remain complete to avoid hiding content. Plain notes/other channels unchanged. Both parts use Vue text interpolation, no HTML rendering.

Named Spanish/common entities and safe numeric code points are decoded for presentation, including existing stored test reply; line breaks preserved. 355 tests pass, including actual Spanish-format regression, English/Outlook, inline replies, quote-only, plain prose and invalid/entity text. 38-route static generation passed. Implementation HEAD `21953f77a11c728bb3fa600c0bd2e05ae1d6a91e` has successful CI and PR preview deployment. Authenticated Agency browser verified actual test reply shows only new text by default, disclosure opens with decoded accents/guillemets, and closes again; no history database rewrite. No schema or server changes, production untouched. Next: resolve OpenAI429 and validate classification. Background automatic import/Meta/mobile390 remain pending.

## 2026-09-30 / Real connected-mail roundtrip completed in staging

Branch `feature/agency-multi-artist-beta`, exact implementation HEAD `386e0091687df7f543511aebdfe0794eb513ebf5`, PR #96. CI and preview deployment both successful. User replied to technical outbound test; fresh authenticated UI shows new inbound reply in existing Booking `98e1d5c2-8787-4302-a2c4-40ce1fd8eaa1` and state returns from waiting_reply to conversation. Original message, own-mailbox outbound and reply-back appear together. One thread mapping verified. Classification still failed HTTP429; no automatic AI success claimed, no unrelated emails sent to model. No new code/schema/function changes in this validation block, production untouched.

Known visual issue discovered: quoted reply contains named HTML entities for accents and guillemets; normalizer currently decodes only a small entity set. Follow-up should decode plain text safely and consider quote collapse, without HTML rendering or rewriting private history silently. Booking date/offer/venue extraction and automatic/background capture remain pending. Exact next: resolve OpenAI quota/rate rejection, validate actual classification, improve message text/quote presentation, then automatic capture and mobile390; Meta remains unconnected.

## 2026-09-30 / Real controlled-mail import and outbound verified

Branch `feature/agency-multi-artist-beta`, implementation HEAD `3b007342a78c9dbf1e07b60c8c745489819292a3`, PR #96. CI and PR preview deploy succeeded. Agency authenticated UI verified a purpose-written real inbound test, manual artist assignment, import into Booking `98e1d5c2-8787-4302-a2c4-40ce1fd8eaa1`, original email in Activity, connected original Google mailbox selected, outbound technical reply accepted and stored, state becomes waiting_reply. Recipient owns both test addresses; no real contracting commitment. Reply-back and delivery to recipient remain pending user verification. No extracted booking facts: date/offer/venue remain empty, original details preserved in text.

Single-message AI live call was attempted twice with only this synthetic test message (batch checkbox remained unchecked). No classification returned: OpenAI HTTP 429 observed via sanitized status logs. Do not claim live classifier quality or completed automatic detection. Rate limit vs exhausted quota is not distinguished; do not assume billing root cause. No repeated automatic retries. Function v7 ACTIVE adds safe fixed-category error/status logging with no body, address, tokens or raw provider errors. UI follow-up separates analyzing/creating states, explains AI unavailability with manual continuation, and gives artist select an accessible name. 350 tests passed; last UI build validation recorded in continuation. No new schema, production untouched. Next: user replies to sent test, observe incoming message on same Booking and dedup; resolve OpenAI limit/quota before retrying classification; automatic/background import, Meta, mobile390 still pending.

## 2026-09-30 / Single-message classification for controlled pilot

Branch `feature/agency-multi-artist-beta`, base HEAD `4264602d64ea8e5f9777f6d0a6bb22e0138b5539`, PR #96 preview only. User sent a purpose-written test mail from their owned account; authenticated Agency UI confirms receipt and body. No AI analysis, import or outbound delivery yet at this checkpoint.

Classifier accepts an optional exact message ID, fetches only that provider message and never falls back to recent-mail analysis when invalid. Selected-message disclosure/unchecked consent/button are independent of batch consent. Tests verify one-message provider read and OpenAI payload, invalid selection zero external calls. 350 tests pass; static generation/deployment and real roundtrip are tracked in the continuation. No schema changes, production untouched. Exact next: deploy/review selected-message control, analyze the purpose-written test only, explicitly assign TEST artist, import, reply and verify reply-back/dedup. Preserve unrelated personal inbox privacy.

## 2026-09-30 / Classification pilot and published email validation

Implementation before this update: `86c1d8e9fe2a554636fe58c01f217a3dbfdce53b` on PR #96; CI and preview deployment successful. Authenticated Agency browser confirms genuine recent mail retrieval; no real mail imported/sent. Agency list uses AgencyWorkspace, so connected-mail panel was integrated there as well as DJ BookingCoreInbox. Original mailbox required for an already linked conversation; other agency members cannot silently use a different sender.

Added assisted detection with OpenAI Responses, strict output validation and privacy disclosure/explicit UI consent. No real mailbox content transmitted to OpenAI by agent. Default view hides raw unrelated mail; classified opportunities/review messages are shown after opt-in analysis. Automatic Booking creation/background webhooks remain unimplemented. Migration `20260930184019_mailbox_analysis_rate_limit.sql` adds service-only last-analysis timestamp; atomic minute claim tested in staging rollback transaction. 348 tests pass, 38-route static generation succeeds. New classifier tests validate injection/data bounds/storage disabled/output IDs, missing-consent request never reaches mailbox or AI providers. Classification live-model quality and connected-email roundtrip remain pending; do not claim these mocked tests validate live classification accuracy.

Server `connected-mailbox` version 5 deployed ACTIVE with classifier. Production untouched. Exact next: publish classifier pilot, verify UI, user explicitly authorizes limited real-mail analysis, then purpose-written email import/reply/reply-back and duplicate tests. Instagram/WhatsApp account/app setup and mobile 390 px remain pending.

## 2026-09-30 / Own-mailbox Booking conversations

Branch `feature/agency-multi-artist-beta`, base HEAD `e8af961483917945554e474e7fbb3b359365dc28`, PR #96 preview only. Staging secrets configured by user; a Google mailbox genuinely connected, verified after reload. Do not publish its address in fixtures/docs. Old entries below describe earlier states.

Implemented Nylas recent message review (20 messages / seven days, private to connection owner), explicit create-request and artist assignment for this pilot, own-mailbox sender selector inside Booking conversation, reply by provider message ID, actor-bound connection access, bounded thread sync (up to 100 messages/thread, partial warning), and imports of mailbox replies/sent messages into existing shared Activity. Manual WhatsApp/Instagram/phone logging is secondary, explicitly manual; Email and internal Note remain primary. Public form ingress/Brevo fallback retained, fallback sender visibly labelled. No automatic AI detection or Meta integration is claimed.

Migration `20260930180438_mailbox_booking_threads.sql` applied to staging. Thread mappings/send-attempt receipts are service-only with RLS. Service-only transactional RPC `ingest_mailbox_thread` rechecks actor/connection/membership, locks connection, reuses Booking capture, imports Email+Activity once and rejects foreign actor/archive. Ambiguous external sends lock the request key and require checking Sent; no blind resend. Owner-only mailbox connection does not delegate sending to other agency members. Shared-mailbox delegation requires a separate implementation.

Validated: 345 local tests (six new adapter/auth/idempotency cases), 38-route static generation, diff check; staging rollback smoke validates owner import, repeated import/message/activity dedup, foreign actor rejection, no synthetic records retained. Security advisors introduce two intentional informational no-policy notices for server-only tables, no new warnings. Deployment and browser review tracked separately. No real outbound test sent, no real roundtrip confirmed. Mobile 390 px still pending. Production untouched.

Next: publish/review preview, execute user-approved purpose-written email roundtrip, harden pagination/attachments/reply-to aliases and background webhook sync. Build classifier opt-in/privacy controls before automatic import; do not share personal inbox silently. Meta: professional Instagram Creator/Business and WhatsApp Business Platform require their own app, permissions, account onboarding and review; no live Meta connector exists.

## 2026-09-30 / Nylas callback and pilot credential created

Branch `feature/agency-multi-artist-beta`, implementation HEAD `e8af961483917945554e474e7fbb3b359365dc28`. User confirmed callback registration and a full read/write sandbox credential expiring 14 October 2026. Callback saved and visibly verified in Nylas; credential named `Cuebooker staging pilot` created and shows Active with the approved expiry. No secret value committed, logged or saved to Supabase. Automatic browser review rejected reading the generated API credential via Playwright; do not work around that rejection with another extraction path. User must copy the credential directly to the Supabase secrets form. Supabase dashboard sign-in remains blocked on Google identity verification after the user selected GitHub then Google. No mailbox connected or messages read/sent. Staging function remains disabled awaiting server secrets. Production untouched. Next: user completes secure Supabase sign-in, then manually pastes Nylas credential into `NYLAS_API_KEY`; configure the other documented staging secrets and validate real connection lifecycle before implementing imports/replies.

## 2026-09-30 / Connected mailbox lifecycle implemented on staging

Branch `feature/agency-multi-artist-beta`, base HEAD `b5970c3bf5c1fb9823e2ff1fe4f84902c9650501`, PR #96 preview only. User approved Nylas and completed secure dashboard registration/sign-in. Free sandbox shows Google, Microsoft and IMAP enabled, US data residency. Implemented shared DJ/Agency Settings panel, explicit disconnected demo, Nylas server adapter, authenticated connection status/start/complete/disconnect and actor-bound ten-minute OAuth states. GET callback never binds an account without the initiating Supabase session. No message bodies are read or stored by this block; Booking import/reply remains next.

Staging migration `20260930151101_connected_mailbox_auth.sql` applied; `connected-mailbox` Edge Function v1 deployed, custom POST Auth validation and GET callback (verify_jwt false). RLS enabled, both tables service-only. Local 339 tests and 38-route static generation pass. Staging rollback smoke validates client privilege denial, foreign actor/state replay denial. Advisors add two intentional informational RLS/no-policy notices; no new security warning introduced. Callback URL is filled in the Nylas form but NOT saved. API credential/activation secrets are still missing; no mailbox connected. Preview publication and visual review tracked below/on PR. Production untouched.

Next: confirm/save the prepared Nylas callback and securely store its API credential on staging Supabase; activate with settings in `CONNECTED_MAILBOX_PILOT.md`; perform real connection/status/reconnect/disconnect tests. Then implement message review, explicit Booking import and own-mailbox replies. Do not claim the ingress workflow is complete. Existing authenticated Agency media and 390 px gates remain pending.

## 2026-09-30 / Own-mailbox pilot discovery

Branch `feature/agency-multi-artist-beta`, HEAD `b5970c3bf5c1fb9823e2ff1fe4f84902c9650501`. User authorized testing three owned accounts covering custom-domain hosting, Gmail and Hotmail. Existing Brevo threading is not an own-mailbox connector. `docs/CONNECTED_MAILBOX_PILOT.md` records a reviewable proposal, private mailbox ownership, OAuth/server invariants and concrete acceptance tests. User approved Nylas as the pilot processor in the subsequent turn. Nylas remains unconfigured: the cloud dashboard shows registration/sign-in, requiring user account setup. The registration page includes new password entry and Terms acceptance, so hand off rather than creating credentials or accepting terms on the user’s behalf. No account connected, no mail read/sent, no migration applied and no Edge Function deployed. Removed an empty generated migration rather than committing an unused schema stub. Documentation-only local change; diff check passes. Production untouched. Next: secure Nylas account setup and staging configuration, connection lifecycle implementation, then real import/reply tests. Existing mobile/authenticated Agency gates remain pending.

## 2026-09-30 / Compact shared booking decision buttons

Branch `feature/agency-multi-artist-beta`, base HEAD `c3c3c0a301902af3a66651df2acb1a0e0eccad17`, PR #96 preview only. Shared BookingCoreInbox Confirm/Reject/Cancel now use content-width wrapping flex layout instead of three equal columns; desktop height 34 px, narrow/mobile touch height 44 px. Existing colors and decision behavior remain. Applies to both DJ and Agency using this component. Static generation and diff check before publication; remote deployment/browser checks afterward. No production changes.

## 2026-09-30 / Agency settings and roster consistency

Branch `feature/agency-multi-artist-beta`, base HEAD `8e82e624c146995ba43931f4826b60b0ecb555ab`, PR #96 preview only.

Catalog editor displays account email in a separate suggestion card; explicit Use this email copies it into the public contact field, still requiring save/publication. Demo uses an explicitly fictional account email. Team members and invitation form use panel/control radii, role badges and selected-role descriptions; feedback follows existing state styling. Roster removes duplicate open/edit actions pointing to the same record and uses one permission-aware entry action with an on-roster indicator.

Static staging generation and diff check pass; visual checks after preview publication. No permission, API, schema or production changes. Authenticated media save/reload/public and 390 px viewport checks remain pending.

## 2026-09-30 / Agency booking rows and visible calendar names

Branch `feature/agency-multi-artist-beta`, base HEAD `8b0840fcfd6f5ccadff14eb904ca62b6032b7c9f`, PR #96 preview only.

Bookings now align the full date on the left, artist/event/contact in the middle and the existing six status colors on the right, with a status dot and lateral mark. Narrow screens place status under event details. Calendar artist names remain visible inside day cells, two entries plus an overflow count, while the adjacent agenda supplies full details. User clarified that names should remain visible in the calendar. No domain/API/schema changes or production deployment.

Validation: static generation and diff check before publication; remote checks and browser review after deployment. Existing pending authenticated and mobile viewport gates remain.

## 2026-09-30 / Agency calendar follows DJ visual design

Branch `feature/agency-multi-artist-beta`, base HEAD `fee680d210ad70bdfdf18a6d5cdb47424ec58afb`, PR #96 preview only.

Calendar now follows the DJ month toolbar, 86 px day cells, booking counts, hold/confirmed dots, legend, today badge and selected-day border. Artist visibility controls remain. The adjacent day agenda identifies artists and opens their bookings; below 950 px it stacks beneath the month, with 62 px cells below 560 px. No hourly availability editor was added to Agency. Blank trailing cells complete the grid.

Staging static build succeeds. Browser checks and remote CI/deploy tracked after publication. No schema/function changes or production deployment. Real authenticated media and 390 px viewport verification remain pending.

## 2026-09-30 / Agency UI polish and ten-row pagination

Branch `feature/agency-multi-artist-beta`, implementation HEAD `d28b38332f3521890619cc291967ea0041aca859`, PR #96 preview only.

Agency cards, panel containers, calendar outer border and controls now use existing panel/control radius tokens. Demo booking Follow-up is compact, labelled and uses quieter actions with explanatory text. Bookings and Activity paginate ten rows with an eleventh-row lookahead; navigation is hidden on the first page with ten or fewer rows and remains available on later pages. Overview summaries retain their separate 100-row fetch.

Validated locally: 336 tests pass, staging static generation succeeds, diff check passes. Remote CI/deploy and browser validation tracked separately on the PR. No database/function changes, no production deployment. Mobile 390 px and authenticated media save/reload/public flow remain pending.

## 30 September 2026: Agency cover/logo file uploads

Based on PR #96 HEAD `ff3025ac9066eb28103343eb207f2f42979372e1`. Editor accepts validated JPG/PNG/WebP files up to 8 MB with image decode, preview, replace/remove and explicit page save. HTTPS links remain a secondary option. Authenticated files use private artist-media under `agency/<workspace>/covers|logos/<uuid>`. Only Owner/Admin can insert/read agency identity objects; replacements use fresh UUIDs. No destructive cleanup of old images. Abandoned uploads and previous versions remain private and need a future cleanup policy.

Staging migrations `20260930124323_agency_catalog_media.sql` and `20260930124636_qualify_agency_media_object_name.sql` applied; second qualifies objects.name in the workspace lookup after the first metadata permission smoke detected an ambiguous-column denial. RPC validates workspace, slot and existing Storage object, preserves paths on legacy saves and supports explicit clear. Public Edge function get-public-artist-profile v22 signs only owned published agency paths (1 hour), removes raw paths/workspace identifier from response. Previously issued signed URLs can last until expiry after unpublishing.

Local 336 tests and 38-route generation. Staging metadata-only rollback smoke validates owner insert/read/save/clear, rejects foreign principal read/insert and invalid slot/missing asset, preserves media through legacy saves; zero leftover objects. This does not prove a physical file upload. Advisors retain only pre-existing warnings. Demo upload/preview browser validation and authenticated upload/reload/public page, mobile QA, team acceptance and complete Agency A/B flow remain gates until explicitly checked on PR. Production untouched.

## 30 September 2026: Agency settings UX refinement

Based on PR #96 HEAD `4b8665c27ff6a9417c1103dfe7a112bf76bbc6a6`. Catalog editor groups identity, public booking email, artist selection and publication. Optional imagery and external agency links use disclosure sections. Public email remains intentionally empty until explicitly provided; owner/admin may explicitly use their sign-in email. Never silently publish account email. This is public contact metadata, not mailbox connection or outbound sender configuration. No WhatsApp field or private notes added to the public contract.

Checkbox styling follows existing Profile presence controls, selects use shared Agency CSS and existing control tokens, keyboard focus is visible. Explicit draft/published status and publication readiness explain incomplete setup; saving disables form controls. Backend contracts, RLS, schema and email routing unchanged. Local 335 tests and staging generation (38 routes) pass; new deployed browser results must be checked on PR. Production untouched.

# Cuebooker living handoff

## 30 September 2026: unified Agency workspace and public agency landing

Branch `feature/agency-multi-artist-beta`, PR #96, starting HEAD `b38ef3dbb3aaa8014070f7127e75a547c9c04ed8`. Local implementation commit `4b256f6`, based on remote `b38ef3dbb3aaa8014070f7127e75a547c9c04ed8`. User confirmed continuing publication after automatic review blocked initial push. Final remote revision and deployment status must be checked on PR #96. Production untouched.

Selecting a DJ now filters the same Agency operational component. No individual DJ dashboard or onboarding appears for Agency. Main nav remains Overview/Bookings/Calendar/Activity/Artists/Settings; artist identity destinations live in nested record tabs. Agency identification stays visible. Booking detail uses existing inbox within Agency; return/navigation clears detail while preserving artist scope. Calendar links preserve event month/day in roster query.

Public agency presentation is `/agency/<organization-slug>`: shared PublicAgencyProfile renders editable cover/logo/tagline/bio/contact and explicitly selected eligible artists. Settings Owner/Admin editor saves to existing Organization plus existing roster visibility column, supports draft preview, publishing/unpublishing and share link. An artist must be public, active and routed to this workspace. Artist links use canonical profiles and unchanged booking backend. Agency URLs use a narrow SPA rewrite in Cloudflare static hosting.

Staging-only migrations: `20260930113404_agency_public_catalog.sql`, `20260930113750_agency_catalog_service_access.sql`. Existing get-public-artist-profile deployed v20: agency query resolves server-only allowlisted payload and signs only each artist-owned media. No client draft/public reader privilege, RLS unchanged. Rollback smoke passed including foreign principal rejection, unready artist rejection, HTTPS validation, public field allowlist and removal after unpublish. SQL test uses the disposable CUE Agency TEST staging account, not real users. Test account exists with two TEST artists; login was verified through normal Auth, browser secure login was declined and has not been bypassed.

Validation: 335 assertions including compiled AgencyWorkspace scope transitions; staging static generation (38 routes), diff check. New deployed visual validation is pending. Browser refused localhost preview with ERR_BLOCKED_BY_CLIENT. The demo booking return now preserves its artist filter and previous section. Real authenticated browser A/B profile/publishing/team acceptance and ~390px QA remain explicit gates if not completed there. Logo/cover support HTTPS URLs, no agency-specific upload flow yet; dynamic SEO/social unfurls are not server-rendered. No existing-DJ ownership transfer or assigned-only role claim.


## 30 September 2026: Agency team beta closure

Branch `feature/agency-multi-artist-beta`, PR #96, starting HEAD `96d5da3f892c2ca0ac138b0cbca7de12dd9330d2`. Final commit/CI/preview are recorded in PR. Production untouched.

Implemented team management in Agency Settings: member list, explicit whole-roster roles, verified-email invitation links (7-day expiry, hash-only persistence, explicit acceptance), revocation, role changes and access removal. Owner/self are protected; only Owner assigns/manages Admin. Admin manages Manager/Editor/Viewer. Invite acceptance writes existing workspace_members and organization_members identity bridge atomically, completes joining onboarding, and selects the joined agency on navigation. Public API wrappers are invoker functions calling private narrowly authorized commands. No automated invitation email or assigned-only Manager isolation is claimed.

Viewer UI is now read-only in Booking Core detail/Attention/operations, and Agency calendar writes follow profile permission; omitted permission props preserve DJ behavior. Anonymous preview Settings simulates team changes with explicit notices and no live grants. New `agency-invite` system route is reserved from artist slugs.

Staging-only migrations: `20260930094140_agency_team_beta.sql` and `20260930094451_agency_team_invitation_index.sql`, versions matched to staging history. Backend rollback smoke covers matching/mismatched recipient, accept/retry, Manager creating a booking/updating roster profile, Viewer rejecting booking creation, demotion/removal and revoked/consumed token rejection; new-user bootstrapping to agency is also checked. Zero leftover test users or invitations. Anon cannot call invite creation; authenticated users cannot SELECT token_hash; RLS enabled. Advisors show no new security warning; missing invitation-creator FK index fixed. Existing analytics/private-table/Auth password warnings remain unrelated baseline, see PR for remediation URLs.

Local: 332 assertions pass, 38-route staging generation and diff checks. New preview team visual smoke, authenticated invitation acceptance plus full Agency A/B desktop/mobile and existing DJ smoke remain required before removing draft or promoting production. Team invites are manually shared links, access is workspace-wide; per-artist isolation and existing-artist transfer remain later reviewed blocks.


## 30 September 2026: Agency preview desktop navigation parity

PR #96, based on `971facf2b1ee867f55e9c09dcc693eba5bb5d17b`. Anonymous Agency preview now reuses the real DJ Workspace desktop rail classes and navigation icons, with Agency name/artist selector above destinations. Desktop breakpoint remains 961px; smaller screens retain compact horizontal navigation. Active state uses aria-current. No authenticated shell, backend, schema or production change. Build and deployed visual validation recorded in PR.


## 30 September 2026: Agency global capture, follow-up and context

- Branch `feature/agency-multi-artist-beta`, PR #96. Base HEAD `5e815b0e13a956aa6ea98d3cf4b114b94b863b05`; resulting revision will be recorded on the PR. Production untouched.
- Implemented global + CUE with explicit active-artist selection; capture uses the existing Booking Core RPC. Agency beta no longer applies the individual five-process capture gate. Existing roles and plans remain intact.
- Global follow-up now reuses DJ attention rules across the active roster and labels each artist. Scope changes discard stale results; errors are visible and retryable. Agency return navigation preserves operational view, filters, calendar month/day; artist context remains visible.
- Overview roster shortcuts, add actions, accessible roster modal and capture focus handling. Last retired artist remains restorable. All-artists calendar picks up added artists; explicit filters remain explicit.
- Local 327 assertions (direct test-file execution), 36 generated routes and clean diff checks. Staging owner-role transactional smoke created a temporary second artist, bookings for A/B, an overdue Next Move and booking route; rollback confirmed zero leftover rows. Foreign principal sees zero roster/bookings. This is backend validation, not browser-authenticated E2E.
- Staging contains SALA PRUEBAS with one active artist. User reports login works in their local browser. Agent browser has no shared authenticated session. Next: verify CI/preview for the pushed revision; test global capture, attention, navigation and last-artist restore visually, then authenticated Agency A/B flow at desktop/mobile before removing draft or merging.
- No schema or Edge Function changes. Team invitations, per-artist Manager assignment and artist-transfer consent remain explicitly deferred. Anonymous individual Overview is still a simplified demo; live identity editors require authentication. Attention retains existing per-artist 500-row beta windows.

Warning: truncated output (original token count: 80606)
Total output lines: 10325

# Cuebooker living handoff

## 29 September 2026: Agency overview count correction

- PR #96, `feature/agency-multi-artist-beta`; remote implementation commit `fbe33279d87b0ac9f7d1175ec2060ab4e9b3cdd3` based on `9ad63db20d3ed328ea1fe828483a7da0e84cb726`.
- The global Overview now counts all upcoming confirmed dates in the displayed month rather than the eight preview rows. The pending-Holds card requests an exact active count for the active roster across all dates; its fallback is visibly a lower bound.
- Local isolated worktree: `npm test` 322/322; `npm run generate` 36 routes; `git diff --check` clean. Anonymous PR preview navigation, artist filter, calendar filter and Booking Core detail were inspected on the previous deployment. The new remote preview still requires CI/deployment verification.
- The three Agency migrations are present in Supabase staging. Read-only staging inspection found zero agency organizations and zero agency workspaces, so an authenticated Agency A/B end-to-end smoke has **not** been performed. No production change. Keep PR draft until this gate is tested with a staging account.
- Next: verify the updated PR preview, then run Agency signup, two roster artists, public booking attribution, global filters/calendar, artist Profile and return to global on desktop and mobile. Check existing DJ flow and roles. Team invitations, per-artist Manager assignments and artist transfer remain separate follow-up work.

## 29 September 2026: Agency visual review without login

- Branch: `feature/agency-multi-artist-beta`, PR #96, based on the latest `main` through merge commit `633d37994ed22e23ad997958fb5f61d6a203be52`. The PR head after this preview update is recorded on GitHub. No production deployment.
- `/preview-agency` is a public visual demo on the PR preview hostname only. It reuses `AgencyWorkspace` with in-memory fixtures for two fictional artists. Global Overview, Roster, Bookings, Calendar and Activity can be inspected without an account. Opening a booking enters the actual `BookingCoreInbox` layout in artist context. Its conversation log, next action, hold and decision actions use local fixture data and reset on reload; real email sending and database writes remain disabled. Artist Profile, Passport and CUE ID show context and an explicit read-only notice; their real editors still require Agency authentication.
- The preview branch builds with `NUXT_PUBLIC_APP_ENV=staging`. The route also checks the `pr-*.cuebooker-staging.pages.dev` hostname in the browser, uses `noindex,nofollow` and never makes Supabase calls. `/workspace` authentication and RLS remain unchanged. No migration or Edge Function changes in this block.
- Validated locally: 321 tests, staging-mode static generation (36 routes) and diff checks. Desktop preview navigation was reviewed before the booking-detail addition. The new detail and mobile view need a fresh PR preview check. Authenticated Agency A/B end-to-end smoke is still separate and pending.

## 28 September 2026: Agency multi-artist beta PR preview

- Branch: `feature/agency-multi-artist-beta`, based on `main` commit `c2996a77e411cdd1d0f6ec97089accd605edf03a`. Exact implementation HEAD and PR preview are recorded in the PR once pushed. No merge or production deployment.
- Product: Agency onboarding now enters global Overview. Agency has a persistent global/artist selector, reversible active roster, global Overview, artist-filterable Bookings and Activity, multi-select roster Calendar, and booking-to-artist navigation. Individual Profile/Passport/CUE ID require a selected artist. DJ onboarding and individual Booking Core remain in place.
- Architecture: operational roster remains `workspace_artists`; `organization_artists` stays an identity bridge. See `docs/AGENCY_MULTI_ARTIST_BETA.md`. Migrations `20260928202754_agency_roster_beta.sql` and `20260928204843_agency_roster_access.sql` were applied to `cuebooker-staging` only. They add non-destructive retirement, atomic RPC roster attachment, and agency access to profile/calendar/media for authorized workspace roles. Production was not touched.
- Validated locally at the branch worktree: `npm ci`, `npm test` (317 passing), `npm run generate` (32 routes), and `git diff --check`. Staging schema/advisor inspection and negative authorization queries with a nonmember UUID passed. Preview authenticated desktop/mobile smoke still needs a test Agency account; static generation is not proof of that flow.
- Known limits: global Overview requests an exact active-booking count but attention previews use the first 100 rows; Calendar/Activity/holds have 500-row windows. Team invite UI and per-artist manager assignment are not built; existing workspace roles are used. Repo-wide `vue-tsc` already reports unrelated baseline errors and has no configured `typecheck` script. Do not call these beta windows exact lifetime reporting.
- Next: verify Agency A/B end-to-end with a staging test account in the PR preview at desktop and ~390 px, repair any findings, then request review. Do not promote migrations or code to production as part of preview validation.

Updated: 19 September 2026  
Branch: `feature/app-visual-system`  
Status: ACTIVE BATON PASS

Read this immediately after `AGENTS.md`. This document records current implementation truth, not aspirations. Always query live branch HEAD before modifying code.

## Update 28 September 2026: public profile preview

- Branch: `feature/app-visual-system`; starting HEAD `d1f114216183a39919fd473299a4dbea5e3a5533` (PR #75).
- The Workspace "Ver como público" action opens `/profile-preview` as a full page in a new tab, leaving the editor state intact. It passes a session-only snapshot of the current editor state, including unsaved fields. The preview and `/<artist-slug>` still render the same `PublicArtistProfile` component.
- The public profile hero received stronger club/industrial art direction. It uses the artist's real cover, portrait, genres and biography; it does not fabricate achievements.
- Validation: `npm run build` and `git diff --check` locally. PR preview visual check at desktop and around 390 px is still pending.
- No schema, migrations or Edge Functions. Production untouched. Next: inspect PR #75 visually with a real profile and confirm navigation, mobile crop and booking preview behavior. A blob URL used by an unsaved image lasts only for the current browser document, so reloading the preview may require returning to the editor.
- Follow-up: the preview landing now includes the actual `PublicBookingForm` below the booking band. All fields, including expanded optional event details, are visible but disabled; submission stays blocked. Its "Ver formulario" buttons scroll to that section. The real public booking form continues to open as before.
- Follow-up layout fix: the public Passport section had a stale `.cue-passport-profile-summary` selector while the component root is `.profile-passport`. The summary now spans its grid and nested tracks can shrink; mobile stacks the heading and summary to prevent horizontal overflow. `npm run build` passed locally. Visual PR preview check remains pending.
- Follow-up portfolio redesign: `PublicArtistProfile.vue` now uses an editorial poster hero, large biography spread, typographic Sound section, differentiated CUE ID identity scene, integrated Passport, large official-channel links and a booking finale. Existing data, booking logic, preview form and component contracts remain unchanged. No new dependencies, migrations or functions. `npm run build` and `git diff --check` passed locally; validate the rendered PR preview at desktop and 390 px before promoting anything.

## 1. Product truth

Cuebooker manages booking demand that an artist, manager or agency already receives. It does not promise to find gigs.

All ingress mechanisms converge into the same Booking Core. Never create separate inboxes or booking models per channel.

```text
+CUE / public Artist Profile / widget / email import / future smart capture
 -> Contact / Counterparty
 -> Booking
 -> Activity
 -> Next Move
 -> Hold
 -> Overview attention
 -> Calendar projection
 -> History
```

The public-entry product direction is capability-driven rather than screen-driven:

```text
Input
 -> Normalize
 -> Interpret
 -> Validate
 -> Confirm
 -> Booking Core
 -> Activity
 -> Notify
```

Future voice/text/WhatsApp/email capture must reuse this pipeline rather than create parallel booking models.

## 2. Canonical public product

Canonical public identity:

```text
cuebooker.com/<artist-slug>
```

Attributed deep-link example:

```text
/<artist-slug>?booking=1&src=instagram
```

The authenticated Profile preview and public visitor profile reuse the same `PublicArtistProfile` component. Do not reintroduce a separate bespoke preview.

The public Artist Profile is intended to become the artist's professional public landing surface, with booking as a capability inside it rather than a disconnected cold form.

Promoters do not need a Cuebooker account.

Publication controls remain separate:

```text
Perfil publicado / privado
Aceptar solicitudes / booking cerrado
```

Private booking terms, fee thresholds, contacts, internal notes, negotiation history, holds, Next Moves and private calendar data stay outside the public profile contract.

## 3. Provenance semantics

Keep separate:

```text
origin_channel  = where the opportunity/conversation originated
capture_method  = how it entered Cuebooker
entry_source    = public-link/form attribution when known
```

Example:

```text
Instagram bio -> public form
origin_channel = booking_form
capture_method = public_form
entry_source = instagram
```

Do not overload `origin_channel` with referral attribution.

## 4. Public-ingress foundation — STAGING ONLY

Supabase staging:

```text
cuebooker-staging
project: lycprjeuuynfzwskycwv
```

Applied/versioned public-ingress migrations:

```text
20260917113205_add_public_booking_ingress_foundation.sql
20260917113340_harden_public_booking_submission_rls.sql
20260917113403_index_public_booking_ingress_foreign_keys.sql
20260917114038_reserve_public_artist_slugs.sql
20260917123613_add_public_booking_follow_up.sql
20260917123841_allow_system_origin_inbound_email_threads.sql
```

Real public-ingress smoke proved:

```text
Public Artist Profile
 -> Booking Form
 -> submit-booking-request
 -> create_public_booking
 -> Contact / Counterparty
 -> Booking(status=new)
 -> inbound Activity
 -> authenticated Booking Core
```

Idempotent retry with the same request ID returns the same Booking rather than duplicating it.

Expected provenance was verified:

```text
status = new
origin_channel = booking_form
capture_method = public_form
entry_source = website / instagram depending link
created_by = null
```

## 5. Public Booking Form V2 — IMPLEMENTED / PR PREVIEW

Functional implementation culminated at:

```text
cd54704b6aec843017252ce06b12f311aca7d30a
```

Files:

```text
app/components/PublicBookingForm.vue
app/components/PublicArtistProfile.vue
app/components/PublicBookingWidget.vue
app/pages/[slug].vue
```

Implemented behavior:

- native date/calendar input;
- malformed/past/unreasonably-future dates blocked client-side;
- 10-year future guardrail prevents accidental years such as `12026` reaching backend;
- inline validation for required name/email/proposal plus country/date/offer/currency;
- optional details auto-open when first invalid field lives there;
- focus moves to first invalid field;
- `aria-invalid` / `aria-describedby` relationships;
- form data preserved after backend failure;
- technical API errors translated into promoter-facing messages;
- success state distinguishes saved + confirmation email sent from saved + email delivery unavailable;
- public Booking reference surfaced when returned;
- same behavior shared by public profile and widget.

Validation:

```text
CI run 35276181812: tests + production build success
Deploy run 35276181813: PR preview success
```

Visual/mobile smoke of field-level states is still required before calling V2 UX fully closed.

## 6. Secure promoter follow-up — PROVEN ON STAGING

Product rule:

- secure link lets a promoter read a safe booking summary/status/conversation and reply;
- promoter cannot mutate internal `Booking.status`;
- external reply becomes inbound Activity in the same Booking Core;
- there is no second promoter booking model.

`public_booking_follow_up_access` stores only the SHA-256 hash of the secure bearer token. The raw token is not persisted in Booking Core, Activity or stored email body.

`/request?token=...` is the real promoter follow-up surface.

A real staging smoke proved:

```text
public form
 -> real Booking
 -> Brevo acknowledgement email
 -> secure follow-up link
 -> promoter reply on /request
 -> inbound Activity on same Booking
```

Observed Activity thread contained the initial public-form message, outbound acknowledgement email and secure-link inbound promoter reply.

## 7. Acknowledgement email — PROVEN ON STAGING

Staging has a working Brevo API key for `submit-booking-request`.

A real delivery smoke succeeded:

```text
email_messages.status = sent
provider = brevo
failure_code = null
from_email = bookings@cuebooker.com
provider_message_id = Brevo SMTP relay message id
```

Semantics:

- acknowledgement is system-origin with `created_by = null`;
- `purpose = public_acknowledgement`;
- provider failure never rolls back Booking;
- secure follow-up token is random 256-bit and only its hash persists;
- raw secure URL exists only in provider payload memory;
- Reply-To uses `booking+<reply_token>@reply.cuebooker.com`.

## 8. Direct email reply — PARTIALLY PROVEN, ONE GATE OPEN

Proven:

```text
Cuebooker acknowledgement
 -> Reply-To booking+<uuid>@reply.cuebooker.com
 -> Gmail sends to exact recipient
 -> Brevo inbound receives message
 -> Brevo marks received
 -> Brevo marks processed
```

Observed Brevo path then ends with:

```text
received -> processed -> webhookFailed
```

Inbound webhook:

```text
type = inbound
event = inboundEmailProcessed
domain = reply.cuebooker.com
endpoint = https://lycprjeuuynfzwskycwv.supabase.co/functions/v1/ingest-booking-email
header = x-cuebooker-webhook-secret
```

`reply.cuebooker.com` and Gmail/MX are therefore not the current investigation target. `ingest-booking-email` is ACTIVE and currently deployed with `verify_jwt = false`.

Exact next diagnostic when terminal access is available:

```text
1. use one webhook secret;
2. set exact same value in Supabase staging as CUEBOOKER_INBOUND_WEBHOOK_SECRET;
3. set same value in Brevo x-cuebooker-webhook-secret header;
4. POST directly to ingest-booking-email with {"items":[]};
5. expected: {"accepted":0,"ignored":0};
6. only then send a fresh Gmail reply and verify inbound email_messages + Activity.
```

Do not keep re-sending direct email replies before the handshake test passes.

Rotate exposed setup secrets before production readiness.

## 9. Distribution / Share UX — IMPLEMENTED ON BRANCH / PR PREVIEW

Latest functional commit:

```text
c336ebd946c9709f59524419fa3648471f3b0598
```

File:

```text
app/components/PublicProfilePublishingControls.vue
```

The previous technical wall of URLs has been replaced with use-case-driven distribution cards grouped as:

```text
Perfil
Solicitudes directas
Tu web
```

Current supported entry surfaces in the UI:

- public profile;
- direct booking;
- Instagram;
- WhatsApp Business;
- email;
- EPK;
- link-in-bio;
- QR-attributed link;
- website link;
- iframe widget code.

Each card explains where/why to use the entry point and shows attribution semantics rather than exposing a raw URL as the primary UX. Copy actions remain explicit (`Copiar enlace` / `Copiar código`). All attributed links still converge into the same public intake contract and preserve `entry_source`.

Important: the QR card currently copies a QR-attributed URL only. Actual QR image generation remains a separate future slice and is not falsely presented as implemented.

Validation:

```text
CI run 35277735399: tests + production build success
Deploy run 35277734983: PR preview success
```

Visual/mobile review of the expanded distribution panel is still required.

## 10. Inbound email observability foundation — IMPLEMENTED ON BRANCH

Operational hardening commits:

```text
b79af6c4785434721a270380ab2fc30165a36c11
4b3c5842294e1362190fdf6d04fc6249b998c0b0
```

Changes:

- `supabase/config.toml` now explicitly versions `[functions.ingest-booking-email] verify_jwt = false`, matching the deployed staging contract so future deploys do not depend on dashboard-only state;
- every inbound webhook invocation receives a Cuebooker request/correlation ID;
- responses expose that ID through `x-cuebooker-request-id` and response JSON;
- structured JSON log events distinguish method rejection, missing configuration, webhook auth failure, invalid JSON, empty batch, ignored-item reasons, accepted items, completed batch and failed batch;
- ignored reasons are explicit without logging message bodies, email addresses, webhook secrets or other high-risk payload content;
- accepted Activity metadata records `ingest_request_id` so future admin/support tooling can correlate a stored booking event with Edge Function logs;
- errors still return promoter/provider-safe codes while technical detail remains server-side.

Validation:

```text
CI run 35278941346: tests + production build success
Deploy/preview run 35278941375: preview build success; Cloudflare PR deployment initiated from same commit
```

This improves diagnosability of the existing inbound flow but does not replace the pending direct webhook-secret handshake. Production remains untouched.

## 11. Notification foundation — IMPLEMENTED ON STAGING

Migration / functional commit:

```text
485dd6dd624fc0d34417ecd8bca8ec517f086ca7
supabase/migrations/20260917232000_add_notification_foundation.sql
```

Staging migration applied successfully to:

```text
lycprjeuuynfzwskycwv
```

Current model:

- `public.notifications` is the shared user-facing notification event stream;
- current event kinds are `booking_request_received` and `promoter_reply_received`;
- one notification row is created per eligible workspace member (`owner/admin/manager/editor`), excluding passive `viewer` members;
- dedupe is enforced per workspace + recipient + event key;
- notifications reference the Booking and optional Activity instead of copying conversation content;
- metadata carries structured context only;
- RLS allows a signed-in user to read only their own notifications;
- authenticated clients receive only `SELECT` plus column-level `UPDATE(read_at)`, so notification identity/content cannot be rewritten by the browser;
- indexes cover recipient timeline, unread recipient timeline and booking lookup.

Automatic creation now happens at the domain boundary:

```text
new public_form Booking
 -> booking_request_received

external inbound Activity
 ingested_by = public_follow_up | brevo_inbound
 -> promoter_reply_received
```

The initial public-form Activity does not create a duplicate reply notification.

Validation:

```text
CI run 35279648215: success
Deploy Staging run 35279648389: success
staging RLS: enabled
recipient SELECT/UPDATE policies: present
recipient/unread/booking indexes: present
booking + external-reply triggers: present
```

No fake Booking was created solely for this validation. The next real public booking or promoter reply will exercise the triggers naturally.

This is intentionally channel-neutral. Email delivery, in-product notification center and future Web Push should consume this same notification event model rather than create separate booking logic.

## 12. Notification email templates + delivery queue — IMPLEMENTED ON STAGING

Functional commits:

```text
9862c9c7ac448fce9cfbe4c8b5370301dc2e6cc9
cd1de87b82893d115396d735fca91b03ea59150d
153bf42c3206877707f350e757ba7242c2358e39
```

Files:

```text
supabase/migrations/20260917234500_add_notification_email_delivery_queue.sql
supabase/functions/_shared/notificationEmailTemplates.ts
tests/notificationEmailTemplates.test.ts
```

Staging migration applied successfully to `lycprjeuuynfzwskycwv`.

Delivery model:

- notification events and email delivery attempts are separate records;
- every new notification automatically enqueues one `notification_email_deliveries` row;
- delivery state supports `queued / processing / sent / failed`;
- attempts, provider IDs, error code, retry timestamp and sent/failed timestamps are tracked;
- one delivery row per notification prevents retry duplication;
- queue indexes support ready/retry scans and recipient diagnostics;
- the queue is service-role-only; no browser RLS policy exposes operational delivery state.

Template layer:

- two initial templates: `booking_request_received` and `promoter_reply_received`;
- ES/EN copy;
- subject + preheader + plain-text fallback + branded HTML;
- contextual artist/contact/event/venue/city/date values;
- CTA points back to the Booking rather than reproducing the conversation;
- dynamic HTML content is escaped;
- promoter message body is intentionally not copied into notification email templates.

Current visual language is deliberately restrained: dark Cuebooker shell, lime accent, one clear CTA, short contextual copy.

Validation:

```text
CI run 35281897382: tests + production build success
notification template unit tests: success
staging queue RLS: enabled
notifications_enqueue_email_delivery trigger: present
ready + recipient queue indexes: present
```

No delivery dispatcher/cron is wired yet, so queued rows are not claimed/sent automatically in this slice. The next backend step is an idempotent dispatcher that resolves recipient email + Booking context, renders these templates, sends through Brevo and updates the delivery row. Do not send directly from the notification trigger.

## 13. Notification email dispatcher — IMPLEMENTED ON STAGING

Functional commits:

```text
5fad91b84d7dbb98b7e0e0c6c081d2e2a31a7e5d
bf7a42900153af1d74b6bb96a048337d8d6038a5
c0a09f3ac18ce803855facd40449edbcce1ccb72
5e8d5d7b8cbcdefa843a3bbcb2aaa1f47e7f2a6f
```

Files:

```text
supabase/migrations/20260918003000_add_notification_email_claim.sql
supabase/functions/dispatch-notification-emails/index.ts
supabase/config.toml
app/pages/workspace.vue
```

Staging state:

- service-role-only `claim_notification_email_deliveries(batch_size)` uses `FOR UPDATE SKIP LOCKED`;
- jobs can be reclaimed after 15 minutes in stale `processing`;
- max delivery attempts = 5;
- retry backoff is handled by dispatcher;
- Brevo delivery writes provider message ID and `sent/failed` operational state;
- recipient email is resolved from Supabase Auth server-side;
- recipient display name comes from `profiles`;
- booking/artist/contact/counterparty context is resolved server-side;
- email locale currently reads Auth metadata when present and otherwise falls back to ES;
- dispatcher never accepts arbitrary recipient/content from the caller;
- dispatcher endpoint requires the existing service-role bearer token in function code even though Supabase JWT gateway verification is disabled;
- `dispatch-notification-emails` is ACTIVE on staging, version 1;
- `supabase/config.toml` versions `verify_jwt = false` because custom service-role authentication happens inside the function.

Booking CTA deep-link support was added:

```text
/workspace?artist=<artist-id>&booking=<booking-id>
```

The workspace now honors both query params, selects the requested artist when accessible and opens the real Booking after Booking Core has loaded.

Validation:

```text
Edge Function deployment: ACTIVE v1
CI run 35283306204: tests + production build success
Deploy Staging / PR preview run 35283306104: success
processing/ready/recipient delivery indexes: present on staging
```

Automatic first-attempt activation is now wired server-to-server from the existing ingress Edge Functions:

- `submit-booking-request` dispatches only when a new public Booking was actually created;
- `booking-follow-up` dispatches only when a new external follow-up Activity was actually created;
- `ingest-booking-email` dispatches only when at least one inbound email item was accepted;
- each invocation authenticates to `dispatch-notification-emails` with the already-existing service-role secret held in Edge Function environment;
- calls run through `EdgeRuntime.waitUntil`, so promoter-facing responses are not blocked by notification email delivery;
- idempotent retries that do not create a new domain event do not trigger duplicate notification sends.

Deployment state:

```text
submit-booking-request ACTIVE v14
booking-follow-up ACTIVE v13
ingest-booking-email ACTIVE v15
dispatch-notification-emails ACTIVE v1
```

Validation:

```text
CI run 35284305515: tests + production build success
```

Periodic retry draining is now enabled on staging without persisting service-role or Brevo credentials in cron SQL.

Implementation:

- `pg_cron` + `pg_net` enabled on staging;
- cron job `cuebooker-notification-email-retry` runs every 5 minutes;
- each cron invocation generates a 256-bit one-time token through `private.issue_notification_dispatch_token()`;
- only the SHA-256 hash is stored in `private.notification_dispatch_tokens`;
- tokens expire after 2 minutes and are single-use;
- the dispatcher accepts either internal service-role authentication or a valid one-time scheduler token;
- token validation happens through service-role-only `consume_notification_dispatch_token()`;
- no service-role JWT, Brevo key or long-lived dispatcher secret is stored in the cron command.

Security note: `consume_notification_dispatch_token()` is `SECURITY DEFINER` because `service_role` intentionally has no direct access to the private token table; EXECUTE remains granted only to `service_role`.

Staging smoke:

```text
manual pg_net scheduler request -> HTTP 200
dispatcher response -> {"claimed":0,"sent":0,"failed":0}
cron job active -> */5 * * * *
```

The earlier scheduler-auth 403 was traced to the private-table permission boundary and fixed in migration `20260918012000_fix_scheduler_token_consume_permissions.sql`.

## 14. Notification read API foundation — IMPLEMENTED ON BRANCH

Functional commits:

```text
18c10ad32a235b4028c55c7cdeec724f631fa6d0
0285611c4ad4083e1bcf6d69fa7bfa3f5add5aa3
a6914dcfee527cf6e5c0a8f438b3825408e4cf2c
```

Files:

```text
app/domain/notification.ts
app/services/notificationApi.ts
app/composables/useNotifications.ts
```

Available client operations, all relying on existing notification RLS:

- list recent notifications;
- exact unread count through PostgREST count semantics;
- mark one notification as read;
- mark all visible unread notifications as read.

The browser does not receive delivery-queue access and cannot mutate notification identity/content. The existing column-level `UPDATE(read_at)` grant remains the only client-side notification mutation.

No notification-center UI was introduced in this slice. The intent is to make the future bell/panel a thin presentation layer over an already-defined domain/API contract.

Validation at time of handoff update:

```text
CI run 35284465373: tests success; production build running
PR preview run 35284465308: preview build success; deploy running
```

## 15. Notification delivery E2E + notification center — IMPLEMENTED ON STAGING / BRANCH

Additional functional commits:

```text
72080374718db2971933aa9d87ca5831b1b49a94
805eae97674d1b9c431466868d5ae51d8c94b533
5da673a870506a0c853b4c5dd1b1bdd2975276c7
```

### Delivery smoke

A real existing staging Booking was reused for an explicitly marked notification smoke instead of creating another fake Booking.

Smoke notification:

```text
booking_id: 214d912e-f4f1-414f-9d8d-eda2f50be115
kind: booking_request_received
metadata.smoke_test: true
recipient: workspace owner
```

The first dispatcher attempt exposed missing service-role SELECT grants on `notifications` and `profiles`:

```text
claimed=1
sent=0
failed=1
last_error_code=supabase_403
```

Migration `20260918013500_grant_notification_dispatch_context.sql` grants only the server-side reads required for delivery. Browser RLS/grants are unchanged.

Retry smoke after the migration:

```text
dispatcher HTTP 200
claimed=1
sent=1
failed=0
provider=brevo
provider_message_id=<202609172309.81894022181@smtp-relay.mailin.fr>
attempts=2
```

The periodic cron itself is also running successfully on staging at 5-minute intervals.

Scheduler configuration is now versioned through `private.configure_notification_email_retry(dispatch_url, schedule)` in migration `20260918015000_add_notification_retry_configurator.sql`. The shared migration never hard-codes a staging URL; each environment installs the same job with its own dispatcher endpoint. Staging has been reconfigured through this function and currently uses job id 2.

### Notification center

A first functional notification-center UI now exists on the branch:

```text
app/components/WorkspaceNotifications.vue
```

It is integrated into the workspace header and uses the existing RLS-backed notification API.

Current behavior:

- bell icon with unread badge;
- recent-notification list;
- distinct copy for new booking vs promoter reply;
- read/unread state;
- mark one as read by opening it;
- mark all as read;
- notification click resolves the Booking, switches artist when needed, opens the real Booking view and persists `artist` + `booking` query params;
- desktop uses an anchored panel;
- mobile uses a vertical bottom sheet rather than a horizontal notification rail;
- Escape/outside-click closes the panel;
- inline SVG only, no emoji/icon inconsistency.

Visual desktop/mobile smoke is still required before considering the notification-center presentation final.

Current smoke notification is intentionally left unread on staging so the bell badge and notification-center read flow can be visually verified without creating another test event.

Additional notification UX hardening:

- UI locale is now synchronized into Supabase Auth user metadata as `cuebooker_locale`, so notification emails can honor ES/EN instead of always falling back to ES;
- local preference remains immediate/offline-friendly through `localStorage`;
- notification center loads an exact unread count independently from the 40-item list;
- unread badge refreshes every 60 seconds while the app is visible;
- focus/visibility return triggers an immediate refresh;
- when the panel is open, refresh updates both list and count.

Commits:

```text
b4c0e187ee0027311b16c3c689a810d3e6c59595
0cae9991d1c81fcb1879ef64a357fd0cd940bc02
88ce55ef3be396d00f48a9cff97908068252e1c5
```

## 16. Automated booking workflow states + mobile UX clarification — IMPLEMENTED ON STAGING / BRANCH

Functional commits:

```text
62ee0c97fc3690ea4a05b3a8e0b8eac1bc257efd
318985bbef01465d853c70c298f1fdfb34845720
16952b1d5c4b755a104bae9725c2aa5db2554bf1
ea8874c1fafcc219f5b88b8a9b88418e9929c9f8
6b4d736b6e87bfb5d30fbcda240aa6cac695894d
```

### Booking state model

Operational states are now derived from Activity instead of being manually selected:

- new: initial state when a Booking is captured;
- in_conversation: automatic after a later inbound interaction;
- waiting_response: automatic after a later outbound interaction;
- confirmed / rejected / cancelled: explicit human decisions only.

Initial capture Activity is excluded using its existing metadata:

```text
capture=public_form
capture=cue_manual
```

Therefore creating a Booking does not immediately move it out of `new`.

Decision states are terminal for automatic transitions. `set_booking_status` now rejects manual writes to operational states with `operational_status_is_automatic`.

Every automatic transition writes an internal `status_change` Activity with:

```text
automatic=true
reason=external_activity_received | external_activity_sent
trigger_activity_id=<activity id>
```

A transaction/ROLLBACK smoke proved:

```text
new + outbound whatsapp
-> waiting_response
-> automatic status_change Activity written
-> rollback restored original booking to new
```

### Inbox UX

- removed manual status select;
- current state is displayed as an informational semantic-color chip;
- explicit decision actions are Confirm / Reject / Cancel;
- filters use semantic colors for New / In conversation / Waiting response / Confirmed / Rejected / Cancelled;
- mobile state filters are a visible grid instead of a hidden horizontal rail;
- booking selection restores auto-scroll to the booking detail;
- Activity section is renamed to Activity history;
- interaction composer explains that inbound/outbound interactions drive state automatically.

### CUE / capture

CUE now explains its product result explicitly:

```text
Capture an opportunity
-> voice or text
-> interpret details
-> create a new Booking
```

The existing functional voice input and interpreter were moved near the top of the flow instead of being hidden below contact/entity fields. CTA is now `Create booking` / `Crear booking`.

### Next action

The ambiguous `Siguiente paso` wording is now `Próxima acción`, with helper copy explaining that it is an operational reminder/to-do and does not change Booking status.

Visual mobile validation is still required after the preview deploy.

## 17. Mobile booking-detail simplification + voice capture correction — IMPLEMENTED ON BRANCH

Functional commits:

```text
73f1ce6bf708e4aa07a7714cce3901828b930352
3a739cedea0595e3c961f6718fd63a98f665ac0a
b0ea374a480f2c5d35c322ccea16c4744d8c5284
618bda23ca12c3c1272aea8bc101af6df96aef46
bcdd8ec342e774e5c72fa348afc49d6cba06798b
2c78c2fd5cc53586c76ed1f66b9551d0024ddb79
```

### Voice

The existing browser SpeechRecognition capture was stopping too early because it used `continuous=false` and rebuilt transcript from each event.

It now:

- uses continuous recognition;
- keeps committed final chunks separately from interim text;
- keeps listening until the user presses Stop;
- attempts to restart recognition after browser-level end events while capture is still active;
- preserves prior typed text;
- emits one final captured transcript when stopped.

This remains browser speech recognition, not server-grade transcription. Browser/iOS support and behavior can still vary.

### Text interpretation

The current `cueInterpreter.ts` is a deterministic local parser, not semantic AI. It currently extracts a limited set of patterns for:

- channel;
- contact/counterparty names in specific phrases;
- date;
- money/currency;
- next action.

The UI no longer presents it as an intelligent semantic interpreter. Copy now says `Detectar datos del texto` / `Detect details from text` and explicitly labels it basic detection. A future Smart Capture block should use a structured semantic extractor with confidence, evidence and missing-field handling before applying suggestions.

### Booking detail hierarchy

Mobile review showed that the booking detail contained too many competing concepts. Changes:

- empty Relationship Memory is hidden completely;
- relationship history only appears when there is actual prior history with the same counterparty/contact;
- label becomes `Historial con` instead of `Relación / Memoria`;
- Hold management is collapsed into a contextual `Reservar fecha (hold)` tool with helper copy;
- booking detail editing moves next to the facts as pencil + `Editar datos`;
- missing booking facts are visually marked;
- Conversation is promoted above follow-up/hold tools;
- body-bearing external/internal interactions are rendered as a chronological conversation thread;
- inbound/outbound/internal entries are visually differentiated;
- technical status/hold system events do not compete in that conversation thread;
- status filters retain semantic letter + border color even when inactive;
- mobile booking header/actions stack vertically so long titles/status actions cannot overflow the viewport.

Visual mobile smoke is required after preview deploy.

## 18. Smart Capture V1 foundation — IMPLEMENTED ON BRANCH / EDGE FUNCTION DEPLOYED TO STAGING

Smart Capture is now treated as a first-class product capability, not as the old regex parser.

Functional commits:

```text
ff2a04910c86be99c9db0f741547999bf56ca501
07b10d35d1eb9fc37f1cb33d45f89b69d5d60332
e52b241f643575bb511ff038ccc26b84d6781464
9643dd74eb86dab146ef2618a24372047123a43a
6c6e3c70053aad18532b56f9a7c81047c812665d
f7f2d09603c9a6b7fbfcfae72cc4056b12ee0c72
d1981b7164697960e7044502f07c39d5669a06df
3866ff3133ddb992e63a2f8472303bb6e8678987
d2c59efe10242724392b0d87a4bdf691240939f7
d1467ec54802f80bedb2ae2a7122b997b2065ec5
481cae9d61d7e87cbd7ec16f70db5168554c89fc
b18797d9f4564bcee42af7f5689065279ce0f4ff
59fa0d900bab4fdf67368d093bddc9a9720a5d96
```

### Architecture

The primary flow is now:

```text
voice or text
-> authenticated smart-capture Edge Function
-> audio transcription when needed
-> strict structured semantic extraction
-> confidence + evidence + warnings + missing fields
-> human review
-> apply selected result
-> create Smart CUE booking
-> Booking Core
```

The Edge Function:

- requires an authenticated user;
- verifies editable workspace membership;
- verifies the artist belongs to the workspace;
- does not persist transcript or extracted data;
- accepts text or multipart audio;
- limits audio to 20 MB;
- uses server-side transcription for audio;
- uses strict JSON-schema extraction;
- never receives provider credentials from the browser.

Provider configuration is server-side through:

```text
OPENAI_API_KEY
CUEBOOKER_TRANSCRIPTION_MODEL (optional; default gpt-4o-transcribe)
CUEBOOKER_SMART_CAPTURE_MODEL (optional; default gpt-5-mini)
```

If the provider is unavailable/unconfigured, text Smart Capture falls back explicitly to the existing local deterministic parser and tells the user that the result is basic detection. It must never claim semantic AI ran when it did not.

### Structured extraction

Smart Capture returns:

- transcript;
- summary;
- source/channel;
- contact name/email/phone;
- counterparty name/type;
- event name/venue/city/country/date/start/end/timezone;
- offer amount/currency/fee basis;
- next action + due date;
- hotel/travel/hospitality/technical/other conditions;
- missing fields;
- warnings.

Every primary field contains:

```text
value
confidence = high | medium | low | unknown
evidence
```

Evidence is kept short and derived from the source text. Nothing is applied automatically.

### Review UX

`SmartCaptureReview.vue` renders:

- interpreted summary;
- field-by-field values;
- confidence labels;
- source evidence;
- detected conditions;
- missing fields;
- warnings;
- Apply / Discard.

### Voice

Browser SpeechRecognition is no longer the primary capture path.

On capable browsers, CUE now:

- records microphone audio with MediaRecorder;
- uses noise suppression / echo cancellation / auto gain when available;
- supports up to 5 minutes per capture;
- sends the recorded audio to Smart Capture;
- transcribes server-side;
- places the returned transcript into the CUE;
- returns the semantic review in the same operation.

Browser dictation remains only as a compatibility fallback where MediaRecorder/getUserMedia is unavailable.

### Smart CUE persistence

Migration:

```text
20260918031500_add_smart_cue_booking_rpc.sql
```

adds `create_smart_cue_booking(...)`, preserving:

- country;
- date;
- start/end times;
- timezone;
- fee/currency/fee basis;
- initial transcript/note;
- next action;
- next-action due date.

A transaction + rollback smoke proved that the RPC persists the extended data without leaving test rows.

### Overnight club bookings

The smoke exposed a legacy domain assumption that required `end_time > start_time`, which incorrectly rejected normal DJ sets such as:

```text
23:30 -> 01:00
```

Migrations:

```text
20260918032500_allow_overnight_booking_times.sql
20260918033000_allow_overnight_booking_constraint.sql
```

now define `end_time <= start_time` as ending on the following calendar day.

This is deliberate club/booking domain behavior, not a validation relaxation by accident.

### Remaining gate

Before calling Smart Capture production-ready:

1. confirm the provider key/models are configured in staging;
2. run a real authenticated text extraction;
3. run a real iPhone audio capture/transcription;
4. review extraction quality with natural Spanish/Catalan/English booking speech;
5. add rate/cost protection before production;
6. keep the old regex parser only as explicit fallback.

## 19. Smart Capture audio hardening + public profile/home + trial foundation — IMPLEMENTED ON BRANCH / STAGING

Functional commits:

```text
e23deca061337a1648ea6b395a36c3efca7e07ee
aad16d916346ebe6fd744a82e9e47c41929c04e7
d7c1741a76b46ad376c8525aefd5c41043387e78
594993ff04d5bddb59c6cac420da51f573dc978a
046583874c20f3e276aa04ec53b4fee648e976a9
4428a516c927590c755017870ca267a506b597a0
```

### Smart Capture audio

The real iPhone test proved that text semantic capture worked while recorded audio returned the generic Smart Capture audio failure.

The `smart-capture` Edge Function was hardened and redeployed to staging v2:

- default transcription model is now `gpt-transcribe`;
- Safari/iPhone MIME types are normalized by stripping codec suffixes;
- the uploaded recording is rebuilt with a clean filename/MIME combination before provider upload;
- transcription-provider and extraction-provider failures now return separate safe error codes.

The next required smoke is another real iPhone audio capture. If it still fails, use the new safe failure code to isolate the provider/file issue instead of guessing.

### Public artist profile

The current staging artist `lits` has:

```text
cover_image_path = null
artist_image_path = <portrait path>
```

So the public profile was correctly rendering the fallback cover; no persisted cover existed for that artist.

The public mobile profile hero was redesigned:

- cover + artist + identity are one composition rather than separate tall blocks;
- if no cover exists, the artist portrait produces a blurred/darkened visual background instead of the empty abstract fallback;
- the portrait remains a separate foreground layer;
- stage name, genres and request CTA sit inside the same mobile hero;
- mobile hero height and downstream spacing are reduced;
- a real uploaded cover still takes precedence automatically.

### Commercial home messaging

Spanish and English home content was reframed around the core product promise:

```text
Tell it / Cuéntalo
-> Cuebooker organises the context
-> review
-> follow the booking
```

The homepage now avoids leading with internal vocabulary such as Activity/Next Move/Hold before the value is understood. Smart Capture, conversation continuity, automatic operational status and date context are the main narrative.

### 30-day trial foundation

Migration:

```text
20260918035000_add_workspace_trial_foundation.sql
```

adds non-enforcing `public.workspace_billing`.

New workspaces automatically receive:

```text
plan_code = solo
status = trialing
trial_started_at = now()
trial_ends_at = now() + 30 days
```

Existing staging workspaces were backfilled with a fresh 30-day trial. The current Lits workspace has an active trial ending 30 days after migration application.

The table also reserves future Stripe provider/customer/subscription/current-period/cancel-at-period-end fields.

Important:

- no paywall or entitlement enforcement exists yet;
- no Stripe customer/subscription is created yet;
- payment integration comes after validating onboarding/trial/activation;
- production remains untouched.

## 20. Trial value messaging + analytics instrumentation — IMPLEMENTED ON BRANCH

Functional commits:

```text
b7eb0f33431004af28e49fbe5979397af4e5cb90
705b067106bf96466c18bd3fdc7b7bf48163d0a4
79b05f23fd2376221d6328fbfa1903016b63c083
57ab3bb54c0c2b34f294a222c149e043b51514d4
b2a823b4148a4d1194aba67ca81720d0760ebf51
eea56b5b3112bd04b3e40a652a24950cb8997c02
5049c3a41a2bb9a165fc350003e0dfc4984270a1
b9d4d288166aa9ee7861306f7754dc617dda638f
```

### Home / early-access value

The commercial home now contains a dedicated 30-day trial block that separates:

- value available from day one;
- coming-next capabilities;
- the reason to join early.

The 30-day trial is presented as no-card early access and points to the existing signup flow. Stripe/payment is intentionally deferred.

### Analytics

Cuebooker already had a consent-aware GTM/dataLayer foundation. This block instruments it instead of adding another analytics stack.

Tracking remains disabled until optional analytics consent is granted and a GTM ID is configured.

Core events now include:

```text
page_view
section_view
cta_click
signup_click
login_click
role_select
discovery_simulate
public_booking_open
cue_open
smart_capture_start
smart_capture_result
smart_capture_apply
booking_created
```

Homepage section views are tracked once per page load when at least 30% visible and consent is granted.

CTA events include placement/destination so hero/header/final/trial conversion can be compared.

Smart Capture events track funnel metadata but do not send the transcript, booking message body, contact data or other captured content to analytics.

Route page views are standardized through `useAnalytics.trackPageView()`.

## 21. Product-rounding P0: voice resilience, hero proof, skeletons and list scaling — IMPLEMENTED ON BRANCH / AUDIO EDGE DEPLOYED TO STAGING

Functional commits:

```text
1015889b44bf9790690b8201ed80e6f6d28d128c
423040a4abc76849c79b8ee8b3d17455db6daf86
fbe9235a44fd7b3696e2defe156e62e17eb2185e
37739ba4f0dc879c19c4417c0257406514819782
7b4794f4cb54778ae3992a0b1d7174bf2beee7a4
06852a669cc6e299b484efbe0623162d5523c34e
5f111c440805c44340198d5ac382468169163ae5
596cdd535d860d9bee31bcd1587d1fb4c0e5fb87
```

### Smart Capture audio resilience

The staging Smart Capture Edge Function is now ACTIVE v3.

The audio path no longer depends on one transcription attempt. It:

- normalizes Safari/iPhone MIME types and file extension;
- accepts common AAC/MP4/M4A/WebM/OGG/WAV/MPEG audio families;
- tries the configured model first when present;
- then falls back through `gpt-transcribe` and `gpt-4o-transcribe`;
- logs only safe operational metadata on failed provider attempts: model, provider status, MIME and byte size;
- never logs or persists audio/transcript contents in these diagnostics.

A fresh real iPhone smoke is still required.

### Bookings and history scaling

Booking inbox:

```text
10 initially
-> Load 10 more
-> repeat
```

Filtering/search/archive changes reset the visible window to 10.

Operational history uses the same 10-at-a-time pattern.

This is intentionally progressive loading UX rather than classic numbered pagination. The current client still has the already-loaded collection; true cursor/server pagination can replace the backing query when data volume requires it without changing the UX contract.

### Workspace loading

The previous top-level `Cargando workspace…` text has been removed.

Workspace loading now preserves spatial continuity with:

- heading skeleton;
- KPI/card skeletons;
- primary/secondary panel skeletons;
- mobile responsive skeleton layout;
- reduced visual jump when real workspace content arrives.

### Commercial hero

The homepage hero was deliberately simplified.

New message:

```text
NO PIERDAS
EL BOOKING.
```

The previous abstract network visualization is no longer the primary hero proof. The hero now demonstrates the product:

```text
messy WhatsApp booking context
-> Smart Capture
-> structured Booking
-> date / fee / hotel / missing schedule
-> operational status
```

The purpose is to show the differentiating workflow before explaining feature vocabulary.

Visual mobile/desktop review remains required after preview deployment.

## 22. Demo-readiness product pass — IMPLEMENTED ON BRANCH

This pass responds to the first full desktop review of the real workspace and public profile.

Functional commits include:

```text
2f32c27ba48f0c1c70248390e1d0cb6cb15cd282
029b5ff6f0bccd3b3d7f371f7c45eb6583f9af54
ea58a1c1f01f5b2e0b9eccf3b5efec0a53f67a4b
d1eabb6e294237babf409b742c149f3039e716f1
411a5e6f73ff3e516429f5fa5c1dcf83558c2bdc
cc745c47f819f7152741027038572a635a2aef75
fcdbdf667ce3772fe6ef774bfb307736de41133a
5c082cbdc1474e96077abeaba97bd0643d511b78
b11677c32de674a8829a7dabb03c5a08d8ea1ac0
e6cd9c026ef3998e0f66caa2af53a29fa438cfbf
02dc985abffb008b787a50643a5ffb913cce3b96
```

### Notifications

Desktop notifications now use a labelled trigger and a fixed right-side drawer with an internally scrollable list rather than an anchored popover that could overlap/crop against workspace navigation.

Mobile keeps the compact bell trigger and bottom-sheet pattern.

### CUE / Smart Capture voice resilience

MediaRecorder audio capture now also attempts browser speech recognition in parallel when the browser exposes it.

The fallback transcript is not the primary path. The sequence is:

```text
MediaRecorder audio
 -> server Smart Capture audio transcription
 -> semantic extraction

if audio transcription fails AND browser transcript exists:
 browser transcript
 -> server Smart Capture text extraction

if semantic extraction also fails:
 browser transcript
 -> local basic parser / editable text
```

The intent is graceful degradation rather than a dead-end error.

A fresh desktop + iPhone smoke is still required. Do not call voice closed until both are proven.

### Booking operational mental model

Cuebooker now communicates the product contract more explicitly:

```text
CUE
 -> quickly creates the booking from something that just happened

Booking
 -> continues conversation, next action, hold and decision

Next action
 -> work reminder only; does not alter status or reserve calendar

Hold
 -> provisional booking-linked date reservation; appears in Calendar

Confirm booking
 -> human booking decision; matching hold converts and booking appears in Calendar

Manual calendar block
 -> travel / studio / unavailability not created by a booking
```

The hold UI no longer exposes a misleading independent "Confirm booking" action. Booking confirmation stays at the booking decision level, matching the current database command semantics.

### Calendar conflict behaviour

The existing booking conflict notice already checks:

- other bookings;
- active holds;
- manual availability blocks.

Manual calendar block creation now also warns when overlapping:

- another manual block;
- an active hold;
- a confirmed booking.

These are currently product/UI warnings, not a database-level exclusion guarantee.

### Bookings vs Activity

To remove the previous "Active / Archived / History" ambiguity:

- Bookings uses **En curso / Archivados**;
- archived bookings remain recoverable under Bookings;
- workspace **Historial** is renamed **Actividad**;
- Activity remains the chronological cross-booking event stream.

### Distribution

"Copiar booking directo" is now "Copiar enlace de solicitud".

Distribution groups receive stronger lime hierarchy and compact visual channel markers. The direct enquiry copy now explains that the link is for turning an existing promoter conversation into a structured request.

### Profile and public presentation

The profile editor already has a sticky save bar with completion percentage and save action.

Public profile fallback presentation is now consistent with the editor contract:

- uploaded cover wins when one exists;
- otherwise the Cuebooker default cover artwork is used;
- the artist portrait remains foreground content.

The current staging artist `lits` still has no persisted custom cover, so the default artwork is expected until one is uploaded.

## 23. Madrid demo hotfix pass — IMPLEMENTED ON BRANCH

Follow-up fixes from the live desktop smoke:

Functional commits:

```text
e32b0034167d92b270b3892a05606ee7c12e6d5e
df94d9194b4734927ac668217b183afccb756203
407f58ae6e778fefc31439cdd5e31ed4d1914ca0
f89247c21538171c51e5f49a2aef2c9787bbea7d
941651d43c7406b79f00afb418c1f53300c3b3b6
137fc09d6ebb629fe8f84ff6d8cbbd00f81d369d
```

### Voice fallback

> **Superseded provider-state note (2026-09-18):** The paragraph below describing `smart_capture_provider_not_configured` reflects an earlier staging state. Current staging Smart Capture uses the configured OpenAI provider/model strategy and text capture is proven. Keep the browser SpeechRecognition fallback as resilience, but do not treat provider configuration as the active blocker. The remaining voice gate is a fresh real desktop + iPhone capture smoke.

Staging currently reports `smart_capture_provider_not_configured` from the Smart Capture server provider path.

For demo resilience, browsers exposing SpeechRecognition/WebkitSpeechRecognition now prefer live dictation instead of MediaRecorder. When dictation stops:

```text
voice -> browser transcript -> Smart Capture text
                          -> local parser when server provider is unavailable
```

The user-visible provider/internal error code is no longer surfaced.

This is a graceful fallback, not a replacement for restoring the server-side provider configuration before production.

### Booking decision modal

Native `window.confirm` / technical error behaviour for booking decisions has been replaced with a Cuebooker modal.

Confirmation now validates the booking date before calling `set_booking_status`.

The 400 observed in the desktop smoke was expected database protection:

```text
confirmed_booking_requires_date
```

The tested booking visibly had no date. The UI now explains this and disables confirmation until a date exists instead of making a failing RPC.

### Visual polish

- calendar "Añadir bloqueo" control uses the Cuebooker accent system;
- confirmed calendar legend dot uses an explicit green token;
- profile cover upload CTA has a smaller, balanced plus icon and typography;
- Distribution no longer reserves an empty left column below its intro;
- Distribution channel cards now use recognizable pictograms rather than text abbreviations.

## 24. Smart Capture extraction quality pass — IMPLEMENTED ON BRANCH / EDGE DEPLOYED TO STAGING

Functional commits:

```text
cbf41934b4310fea7e74481957f6e1783f6180dd
28fe87924288002dcfd83f7a26d428a27e1a8f88
3f77a39de19f6d81d5c23dc755d60395a8c35922
8a5635183812e12706b7e0d7058c075aefc5b064
```

Staging `smart-capture` is ACTIVE v5.

### Semantic provider resilience

Semantic extraction no longer depends on the previous single default model. The function now tries:

```text
CUEBOOKER_SMART_CAPTURE_MODEL (when configured)
-> gpt-5.6-luna
-> gpt-5.6-terra
```

and logs only safe operational model/status metadata when an attempt fails.

### Local fallback quality

The deterministic fallback now additionally extracts common spoken booking details:

- plural conversation forms such as “hemos hablado con …”;
- venue names introduced as Sala / Club / Venue;
- explicit time ranges such as “de 3 a 4”;
- Spanish verbal EUR amounts such as “tres mil euros”;
- venue, start and end times are now shown in review and applied into the CUE draft.

A regression test covers the real spoken-style case:

```text
Héctor
Sala Apolo
24 de diciembre
de 3 a 4
tres mil euros
```

Expected fallback fields:

```text
contact = Héctor
venue/counterparty = Apolo
date = 2026-12-24
start = 03:00
end = 04:00
fee = 3000 EUR
```

Server semantic extraction remains the preferred path. Local parsing is only resilience.

## 25. Booking persistence + semantic model quality — IMPLEMENTED ON BRANCH / EDGE DEPLOYED TO STAGING

Functional commits:

```text
6341388bff8657c6a75d586dc0273a8dfb8c7c53
703d785b8f0fc1b0c10d3af101d2abb2b985ff23
7d67a54b4687bb989cda60d76ad680715592f68c
5097fac7e31cc36fe0115de18867fafa391e4afa
```

### Composite RPC response fix

Several Postgres RPCs return a single composite row rather than an array. The client previously typed those responses as arrays and read `rows[0]`, causing false failures after successful database operations.

The API client now normalizes either shape:

```text
T | T[] -> T
```

Covered RPC flows include:

- create Smart CUE booking;
- update booking details;
- booking status changes;
- archive/unarchive;
- hold create/release/convert.

### Semantic user-facing errors

Technical codes such as `manual_booking_create_failed` and `booking_details_update_failed` are no longer intended to surface directly.

Creation/edit flows map known validation cases to product language, including:

- missing date when schedule exists;
- invalid country code;
- invalid currency;
- invalid offer amount;
- workspace permission errors;
- booking not found.

### Smart Capture model strategy

Staging `smart-capture` is ACTIVE v6.

Semantic extraction now prefers:

```text
CUEBOOKER_SMART_CAPTURE_MODEL (if explicitly configured)
-> gpt-5.6-terra
-> gpt-5.6-sol
-> gpt-5.6-luna
```

Terra is the default quality/cost balance. Sol is the high-capability fallback; Luna remains a cost-sensitive fallback.

## 26. Editable contact details from booking — IMPLEMENTED ON BRANCH

The booking detail now treats contact data as its own reusable entity instead of mixing it into booking-specific fields.

Functional commits:

```text
b52aa7d0d1216788362356d959d8b5c98384eee4
af2cf282956c6e7145a362bc50620981d05e1949
```

### Product model

```text
Booking data
-> date / venue / city / schedule / offer / fee basis

Contact data
-> name / email / phone / role / notes
```

Contact edits update the shared `contacts` row under existing workspace RLS, so the improved contact is reused by future bookings that reference the same person.

The booking detail displays email/phone when available and exposes an **Editar contacto** action next to the contact summary.

No new database migration was required; current contacts UPDATE RLS already allows workspace editors.

## 27. Conversation simplification + transactional email delivery tracking — IMPLEMENTED ON BRANCH / STAGING FOUNDATION

Functional commits:

```text
da97aeca323e2f7e208ec7ffa16d19d71b83e27a
9b4347512f20d4f1497da95fd717f3d1a5d25e52
48990c9e7ab1653269752ca689b55720e648787f
a9140517647386b0ce98bf0e2f65473c5d6891f8
f313465ad7ea65ad36c4e164546d5067c90107b2
91b88802b1b961e0b978af6fbf01681090872262
dd26b74ecd79c9fb15715c1fe0219f4b4600f525
```

### Interaction composer

The composer now hides transport jargon where it is not useful:

- Note = internal memory, no direction;
- Email = always sends from Cuebooker, direction fixed outbound;
- Call / WhatsApp / Instagram = user chooses human wording: "Me contactaron" / "Contacté yo".

Conversation thread direction is rendered as:

```text
Héctor -> Tú
Tú -> Héctor
Nota interna
```

rather than inbound/outbound labels.

### Outbound sender identity

`send-booking-email` staging is upgraded so sender display name is derived from the booking artist when possible:

```text
Lits via Cuebooker <bookings@cuebooker.com>
```

Outbound Brevo requests also carry tags:

```text
cuebooker
cuebooker_email_<email_message_id>
```

to correlate delivery events reliably.

### Delivery tracking foundation

Staging migration `20260918132500_add_email_delivery_tracking.sql` is applied.

`email_messages` now stores:

- delivery_status;
- delivered_at;
- bounced_at;
- opened_at;
- last_delivery_event_at;
- delivery_failure_code.

Existing sent outbound messages are backfilled as `accepted` because provider acceptance is all Cuebooker can prove without a delivery webhook.

A new Edge Function `brevo-transactional-events` is ACTIVE in staging with `verify_jwt=false`. It expects a private header:

```text
x-cuebooker-webhook-secret
```

matching environment secret:

```text
BREVO_TRANSACTIONAL_WEBHOOK_SECRET
```

It maps Brevo delivery events by Cuebooker tag first, then provider_message_id fallback.

The UI reads email delivery state and can show:

- Aceptado;
- Entregado;
- En espera;
- Rebote temporal;
- Rebotado;
- Bloqueado;
- Spam;
- Email inválido.

### Current real smoke finding

The outbound message sent at 2026-09-18 13:11 local to `litulandio@gmail.com` was successfully accepted by Brevo and received a provider message id. No final delivery event is currently available because the transactional delivery webhook has not yet been registered in Brevo.

### Branded direct booking email

Direct booking emails were still using Brevo `textContent` only, which rendered as an unstyled plain email in Gmail. This has now been corrected on branch and deployed to staging `send-booking-email` v16.

New direct booking delivery uses both:

```text
htmlContent -> Cuebooker dark/lime branded shell
textContent -> plain-text fallback
```

Shared renderer:

```text
supabase/functions/_shared/bookingConversationEmailTemplate.ts
```

CI and staging deployment passed for the implementation commits.

### Inbound reply smoke

The previously failing Gmail -> Brevo -> Cuebooker path is now verified end to end on staging.

Root cause was a mismatch between the Brevo webhook header value and Supabase `CUEBOOKER_INBOUND_WEBHOOK_SECRET`. After synchronizing them, a fresh reply to subject `prueba cuebooker` created:

- one inbound `email_messages` row with `status = received`;
- one inbound email Activity on the same booking;
- the Gmail provider message id and `InReplyTo` metadata were preserved.

Verified booking:

```text
dc2145dd-1625-4e3b-bc33-50f7e9b36840
```

The real staging roundtrip gate is therefore closed.
## 28. Pricing / monetization direction — HYPOTHESIS, NOT IMPLEMENTED

Current launch hypothesis:

```text
30-day free trial
 -> one simple Solo plan around €15/month as an initial/founder price
 -> core booking workflow + public profile + links + widget + notifications included
```

Do not split Instagram links, WhatsApp links, widget or public profile into separate paid add-ons at launch. These are acquisition/distribution surfaces that increase the value of the same booking engine.

A future Manager/Agency plan can be priced around workspace/roster/artist scale once real usage data exists.

AI/voice limits should not be hard-coded into pricing before real usage/cost evidence exists.

No billing, trial enforcement or Stripe integration is implemented yet.

## 29. Product direction captured, NOT FOR IMMEDIATE PARALLEL IMPLEMENTATION

### Smart Capture / interpretation

Voice and free text should become one Capture Engine rather than separate novelty features.

Future inputs may include typed free text, dictated voice, pasted WhatsApp text and pasted/imported email.

The engine should propose structured booking fields, show uncertainty/missing information and require human confirmation before writing Booking Core. AI must not silently invent booking facts.

### Notification delivery

The shared notification event stream now exists on staging. Delivery remains deliberately separate.

Preferred sequencing:

```text
email delivery from notifications
 -> in-product notification center using the same rows
 -> Web Push/PWA where justified
```

Do not emit independent email-only or push-only booking events.

### Internal Cuebooker admin / back office

Future internal admin should cover platform/user/workspace health, support/incidents, operational KPIs, email/webhook delivery, logs/correlation IDs, error diagnostics, abuse/rate limiting, alerts and audited admin actions.

Observability data should be captured incrementally now even though the admin UI is deferred.

### Friendly system feedback

Treat human feedback as a cross-product rule:

- field error -> explain the field problem;
- save/send success -> confirm clearly;
- retryable failure -> preserve work and explain next action;
- technical/provider detail -> logs/admin, not promoter-facing copy.

## 30. Root routing and static deployment

Root artist URLs under static Nuxt are resolved by `functions/[slug].js` on Cloudflare Pages. `ASSETS.fetch()` must use the pretty `/200` path rather than `/200.html`.

Previously validated:

- real artist slug -> HTTP 200 + artist metadata + Nuxt shell;
- missing slug -> 404;
- reserved `/workspace` -> application route, never artist resolution.

PR #75 remains the staging preview vehicle.

## 31. Security / operational follow-up

Before production:

- rotate Brevo API/webhook secrets exposed during setup;
- keep the now-verified direct inbound email path covered during production rollout;
- strengthen anonymous rate/abuse protection for public intake and follow-up;
- perform visual desktop/mobile smoke of public profile, form, request page, distribution panel and widget;
- review CSP/frame policy for widget on external origins;
- run Supabase security/performance advisors;
- explicitly review production migrations/functions/deployment.

Existing project-level warning remains:

```text
Leaked Password Protection Disabled
```

Existing Edge Functions still use legacy `SUPABASE_SERVICE_ROLE_KEY`; migrate to the current Supabase secret-key model as a deliberate infrastructure task, not mixed into a product slice.

## …50606 tokens truncated…ized male/female bodies as the authoring source.

Source bundle used for validation:

`Human Base Meshes v1.4.1`

License:

`CC0`

Validated collections:

```text
Body Male - Stylized
Body Female - Stylized
```

Both source bodies contain the same measured geometry:

```text
raw vertices: 14,106
raw triangles: 28,200
```

The source is intentionally retained as authoring/reference geometry. It is too close
to the V1 hard active-avatar budget to ship unchanged once hair, clothing and
accessories are present.

Runtime reduction probe:

```text
50% body reduction:
  evaluated vertices: 7,856
  evaluated triangles: 15,700

35% body reduction:
  evaluated vertices: 5,981
  evaluated triangles: 11,950
```

Visual decision:

- 50% retains substantially better face, ear and hand definition;
- 35% introduces visible faceting and loses too much facial quality;
- the first runtime source therefore starts at 50% reduction;
- reduction is applied before CUE ID expression morph authoring;
- the full CC0 source remains the editable visual reference.

This leaves roughly 4k triangles inside the preferred 20k active-avatar target for
hair and visible authored details, while the 28k hard limit remains the safety ceiling.

New authoring path:

`scripts/blender/cue-id-studio-stylized-v1-source.py`

CI:

`.github/workflows/cue-id-studio-stylized-v1.yml`

The first pass builds the male art-gate character with:

- slightly enlarged/stylized head proportions;
- readable eyes and iris geometry;
- authored brows;
- crop hair made from smooth cartoon masses;
- black Cuebooker Basics tee/trousers/shoes;
- small Cuebooker chest mark;
- neutral + four expression morphs;
- one shared armature;
- relaxed standing pose.

Female derivation and the full wardrobe/accessory library follow only after this
male visual gate passes.

Production remains untouched.


## 161. Quality-first rule overrides early runtime budgets

The user explicitly rejected performance-first compromises.

CUE ID must not ship or be approved visually if optimization makes the character look cheap.

From this point:

- approved male/female prototype images are the art target;
- first build high-quality 3D masters;
- do not decimate the master before visual approval;
- previous <=20k preferred / <=28k hard targets apply only to later runtime LOD candidates, not to the authored master;
- rigging, expressions and modular assets follow the accepted master;
- runtime optimization happens after the master passes visual review;
- if an optimization visibly reduces face, hair, hands, clothing or silhouette quality, reject it;
- low-end devices may use lower LODs or static snapshots rather than degrading the canonical art source.

Production remains untouched.


## 162. Meshy male/female masters received and audited

The approved CUE ID male/female visual masters were exported from Meshy and supplied in both GLB and FBX packages.

Canonical local filenames:

```text
cueid-male-master-v1.glb
cueid-male-master-v1.fbx.zip
cueid-female-master-v1.glb
cueid-female-master-v1.fbx.zip
```

Measured files:

```text
male GLB
  bytes: 26,674,040
  sha256: 1139d7166cd51ece54877c0d0e6589ab0bcc5544067c99ff07f75d3613123e7f

female GLB
  bytes: 24,560,984
  sha256: f3000754bb34bc411d123cb7ea1929be2c096ace0e0174d83687f84d6d2528df

male FBX package
  bytes: 45,047,692
  sha256: c1d7e0df3b8c04681c7704f9aa3d4bf08fbab7ddd67be1930e30858862e56b2d

female FBX package
  bytes: 41,906,176
  sha256: d522f46a504e31b5df8eb68aa906b2dc503bb5660c5a93de51773a4cb2a0f93b
```

GLB geometry audit:

```text
male
  vertices: 395,763
  triangles: 735,810
  mesh primitives: 1
  materials: 1
  skins: 0
  animations: 0
  morph targets: 0
  extents: ~0.693 x 1.896 x 0.350

female
  vertices: 352,674
  triangles: 655,612
  mesh primitives: 1
  materials: 1
  skins: 0
  animations: 0
  morph targets: 0
  extents: ~0.679 x 1.900 x 0.425
```

Both GLBs contain 2K embedded PBR textures:

- base color;
- metallic/roughness;
- normal.

The FBX ZIPs additionally contain the separate PNG texture files:

- base color;
- metallic;
- roughness;
- normal.

Decision:

- the GLBs are the primary approved visual masters for Cuebooker/Web/ThreeJS;
- the FBX packages are retained as a production/Blender/Unreal fallback;
- do not regenerate the characters unless the approved visual direction changes;
- do not use these raw Meshy exports directly as the modular runtime avatar.

Current structural limitation:

Meshy exported each character as one high-density mesh using one material. There is currently no armature, no animation data, no expression morphs and no semantic material split between skin, hair, clothing and footwear.

Required cleanup phase:

1. preserve the approved silhouette and face;
2. import the master in Blender without visual remodelling;
3. separate or mask semantic regions: skin, hair, top, bottom, footwear, eyes/details;
4. create a dedicated skin mask so skin tone can change independently;
5. create a shared humanoid rig and skin weights;
6. author the five CUE ID expression morphs;
7. add modular hair/facial-hair/piercing/accessory anchors;
8. only after visual/rig approval create runtime LODs;
9. keep the master source untouched as the visual source of truth.

Skin tone must be material-driven, not separate character meshes. The target remains six selectable skin tones across the same male/female geometry.

Production remains untouched.


## 163. Body masters converted to semantic GLB sources

The approved Meshy body masters now have reproducible semantic-split outputs.

New scripts:

```text
scripts/3d/cue-id-body-semantic-audit.py
scripts/3d/cue-id-body-semantic-split.py
```

Input body masters:

```text
cueid-male-body-master-v1-textured.glb
cueid-female-body-master-v1-textured-clean.glb
```

Semantic outputs generated locally:

```text
cueid-male-body-master-v1-semantic.glb
cueid-female-body-master-v1-semantic.glb
```

Each output contains three explicit geometries:

```text
cue_<body>_skin
cue_<body>_hair
cue_<body>_underwear
```

Male roundtrip:

```text
skin       118,149 vertices / 215,201 tris
hair        66,858 vertices / 120,735 tris
underwear    9,002 vertices / 15,982 tris
total                    351,918 tris
```

Female roundtrip:

```text
skin       115,741 vertices / 206,707 tris
hair       113,993 vertices / 208,695 tris
underwear   29,466 vertices / 51,342 tris
total                    466,744 tris
```

Decision:

- the split is non-destructive;
- total triangle counts remain identical to the source body masters;
- these semantic GLBs become the working source for skin-tone materials and default-hair visibility;
- the original Meshy GLBs remain the immutable visual source of truth;
- eyes/details remain fused with the skin source for now and will be separated during the facial-rig pass;
- do not begin runtime decimation yet.

Next implementation phase:

1. create body material controller with six skin-tone presets;
2. make hair visibility independently controllable;
3. make underwear visibility independently controllable;
4. create the shared humanoid rig contract;
5. author the five expression morphs;
6. only then start modular clothing and accessories.

Production remains untouched.


## 164. Shared physical rig bootstrap prepared

The semantic male/female body masters now have a reproducible Blender 5.2.2 rig bootstrap:

```text
scripts/blender/cue-id-body-rig-v1.py
```

Inputs:

```text
cueid-male-body-master-v1-semantic.glb
cueid-female-body-master-v1-semantic.glb
```

Expected semantic meshes:

```text
cue_male_skin
cue_male_hair
cue_male_underwear

cue_female_skin
cue_female_hair
cue_female_underwear
```

Shared public skeleton contract:

```text
root
hips
spine
chest
upper-chest
neck
head
shoulder-l
upper-arm-l
lower-arm-l
hand-l
shoulder-r
upper-arm-r
lower-arm-r
hand-r
upper-leg-l
lower-leg-l
foot-l
toe-l
upper-leg-r
lower-leg-r
foot-r
toe-r
```

The bootstrap:

- imports the semantic GLB;
- builds the exact shared skeleton for male/female;
- binds skin, source hair and underwear through Blender automatic weights;
- writes `cue_pose_neutral`;
- writes `cue_pose_relaxed`;
- writes `cue_pose_rig_check` as a QA-only deformation pose;
- reports per-mesh weighted-vertex coverage;
- saves an editable `.blend`;
- exports a rigged `.glb`;
- does not author facial expressions yet;
- is not production-admitted automatically.

Acceptance rule:

Automatic weights are never accepted simply because export succeeds. The rig must pass a deformation review around shoulders, elbows, wrists, neck, hips, knees and ankles using `cue_pose_rig_check`.

Expression morphs remain blocked until this body-deformation gate passes.

Current execution limitation:

The uploaded semantic GLBs exist in the active conversation workspace but are not currently reachable from GitHub Actions. The rig script is therefore committed and ready, but physical rig output must be generated either in local Blender 5.2.2 or after placing the semantic GLBs in a CI-accessible asset location.

Production remains untouched.


## 165. Rig deferred; Creator workspace and wardrobe continue in parallel

The physical Blender rig step is intentionally deferred until the user can run the local Blender package.

Pending rig package:

```text
cueid-rig-local-package.zip
```

Do not block product/UI work on this step.

Parallel work completed:

- `app/domain/cueIdWardrobe.ts`
  - shared male/female fitting contract;
  - garment coverage zones;
  - modesty-layer rules;
  - harness/outerwear compatibility;
  - no wardrobe item is restricted by body selection.

- `app/domain/cueIdWorkspace.ts`
  - one body is edited at a time;
  - expression/hair previews always use the currently selected body;
  - switching body preserves the current semantic configuration.

- `app/components/CueIdStylizedWorkspace.vue`
  - new Creator V1 workspace shell;
  - single-body stage;
  - shared catalogue sections;
  - skin/hair/color controls;
  - outfit/footwear/accessory sections;
  - no low-quality fake 3D avatar is shown while the physical rig is pending.

- `app/pages/cue-id.vue`
  - lab route now uses the stylized shared Creator workspace;
  - route remains noindex;
  - production is unchanged.

Wardrobe rules explicitly support:

- mesh tops;
- festival tops/outfits;
- harnesses;
- skirts;
- bodysuits;
- festival wraps;
- Venetian masks;
- platform boots;
- Vans-style shoes;
- festival headwear/goggles;
- the same catalogue for male/female bodies.

Rig remains the gate for:

- real 3D body preview;
- physical poses;
- expression morph execution;
- clothing deformation validation.

Production remains untouched.


## 166. Stylized Creator lab shell completed

The live branch already contained the isolated `CueIdStylizedWorkspace.vue` shell described in section 165. This pass validated that implementation against the current branch and completed missing lab-only UX without touching production.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
app/pages/cue-id.vue
```

Current lab behavior:

- one body is visible/edited at a time;
- male/female body switching preserves the semantic Creator config;
- the same shared catalogue remains available for both bodies;
- skin tones, expressions, hair, hair colors, eyes, contact lenses, facial hair, piercings, makeup and nails are editable;
- top, bottom and one-piece colors are controlled independently;
- footwear has its own color;
- shared accessory color is editable;
- harness remains a torso overlay selection;
- Venetian mask and festival/Burning-Man-inspired catalogue entries remain present;
- the stage remains a non-3D pending-rig state and does not reintroduce the rejected procedural mannequin;
- the current selection is summarized in the pending-rig stage so the editor remains legible while physical preview is deferred.

Save semantics in the lab:

- `Guardar CUE ID` now saves a validated V1 draft only in browser `localStorage`;
- the draft is restored on the same device on the next `/cue-id` visit;
- malformed/stale local drafts are discarded;
- this save path does not publish the profile;
- it does not write to Supabase;
- it does not connect assets to `CUE_ID_PRODUCTION_CATALOGUE`;
- it does not admit anything to `CUE_ID_CREATOR_3D_LAB_CANDIDATE`.

The route remains:

```text
/cue-id
robots = noindex, nofollow
```

The physical Blender rig remains pending and unapproved. Expression morph execution, actual 3D body rendering and clothing deformation remain blocked on the rig deformation gate.

Production remains untouched.


## 167. Creator presentation and wardrobe compatibility pass

The stylized Creator lab received a second UX pass without enabling the physical 3D rig.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
```

Changes:

- expression and hair choices now use explicit temporary 2D single-body thumbnails instead of text-only placeholders;
- previews always use the currently selected body, skin and hair-color context;
- the thumbnails are labelled as temporary 2D previews and are not presented as authored 3D assets;
- outfit controls are grouped into `Cuebooker Basics` and `Club / Festival` families while preserving one shared male/female catalogue;
- the existing wardrobe fitting contract now surfaces harness/top incompatibility in the UI;
- incompatible harness selection is never silently removed when the user changes top;
- selecting a new harness is blocked when the current top has no authored harness fit;
- an already-selected incompatible harness remains visible with a fitting-pending warning so the semantic selection is preserved.

This does not change the underlying catalogue, production assets, production runtime or rig status.

The physical rig remains pending. No expression morph, skin deformation or clothing deformation is claimed as working.

Production remains untouched.


## 168. Creator mobile editing pass

The stylized Creator lab received a mobile-focused layout pass while the physical 3D rig remains deferred.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
```

Mobile behavior now:

- save action becomes a full-width 44px control;
- stage height is reduced so the editor appears much sooner on small screens;
- body selector remains directly available above the stage;
- editor section navigation becomes one horizontal scroll row instead of a two-column grid;
- the active section exposes `aria-current`;
- section tabs and catalogue choices use larger touch targets;
- expression and hair preview tiles scroll horizontally rather than creating a long wrapped block;
- color swatches are enlarged for touch;
- editor content flows naturally on mobile instead of using an inner scroll area;
- desktop/tablet layout remains split or stacked as before.

The stage still shows only the pending-rig state. No procedural avatar, rigged GLB or production asset was introduced.

Production remains untouched.


## 169. Active outfit layering semantics surfaced in Creator

The Creator now reflects the wardrobe layer model more accurately without mutating stored user choices.

Updated:

```text
app/domain/cueIdWardrobe.ts
app/components/CueIdStylizedWorkspace.vue
tests/cueIdWardrobe.test.ts
```

Behavior:

- harness compatibility is resolved against the active outfit layer;
- when a one-piece is active, its `allowWithHarness` rule takes precedence over the stored top;
- when no one-piece is active, compatibility falls back to the selected top;
- top and bottom selections remain stored while a one-piece is active;
- the UI marks those stored base-layer choices as secondary instead of deleting or rewriting them;
- disabling the one-piece restores the previously selected top and bottom immediately;
- the current active outfit layer and resulting modesty rule are visible in the Outfit section;
- existing incompatible harness selections are preserved and shown as pending fitting.

Added unit coverage for one-piece harness precedence.

No physical garment deformation is claimed. Rig and authored fitting validation remain pending.

Production remains untouched.


## 170. Lab draft dirty state and reset controls

The Creator lab now behaves more like a real editor while keeping persistence strictly local.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
app/pages/cue-id.vue
```

Behavior:

- the page tracks the last saved local draft separately from the current editable config;
- any semantic config change marks the Creator as having unsaved changes;
- the Save button is disabled when the current config already matches the saved draft;
- the top bar exposes a visible saved / unsaved state;
- Reset returns the Creator to `DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG`;
- Reset also removes the lab draft from browser `localStorage`;
- Save and Reset both surface short live-region confirmations;
- restoring a valid local draft establishes it as the saved baseline, so the page does not appear dirty immediately after load;
- malformed local drafts continue to be discarded.

Reset affects only the local `/cue-id` lab state. It does not write to Supabase, production profile data or any asset catalogue.

Production remains untouched. The physical rig remains pending.


## 171. Creator selection accessibility pass

The lab Creator now exposes selection state more explicitly to keyboard and assistive-technology users.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
```

Changes:

- selectable text controls expose `aria-pressed` for their current state;
- piercing multi-select exposes pressed state independently per piercing;
- skin, hair and garment color swatches expose both selected state and descriptive labels;
- body selector continues to expose pressed state;
- keyboard focus now has a visible lime focus ring across Creator buttons;
- disabled fitting combinations remain native disabled controls where appropriate;
- stored-but-secondary top/bottom choices remain readable while one-piece is active.

No catalogue semantics, rig state or production behavior changed.

Production remains untouched.


## 172. Creator light-theme surface cleanup

The stylized Creator shell no longer relies on several dark-only surface assumptions.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
```

Changes:

- pending-rig panel background now derives from `--cue-surface`;
- stage gradients derive from theme text/accent variables;
- selected swatch inner ring uses the current surface instead of fixed black;
- temporary preview-card backgrounds derive from theme text/surface colors;
- fitting-warning and outfit-state backgrounds now mix against the current surface;
- dark remains the primary art direction, but the shell can render coherently under the existing light theme variables.

Brand lime buttons intentionally retain dark text for contrast.

No runtime 3D, rig or production catalogue changes were made.

Production remains untouched.


## 173. Stored base outfit semantics aligned

A small Creator consistency issue was corrected around one-piece layering.

Updated:

```text
app/components/CueIdStylizedWorkspace.vue
```

Behavior:

- when a one-piece is active, all stored top/bottom families are shown with the same secondary visual treatment;
- stored top/bottom colors are also shown as secondary;
- those stored base-layer choices remain editable;
- because they remain editable, they are no longer exposed as `aria-disabled`;
- true unavailable fitting combinations, such as adding a harness where no authored fit exists, continue to use native disabled controls.

This keeps visual hierarchy and accessibility semantics aligned.

Production remains untouched.


## 174. Semantic Creator config equality

Dirty-state comparison was moved out of the page and into the CUE ID domain.

Updated:

```text
app/domain/cueIdStylizedCreator.ts
app/pages/cue-id.vue
tests/cueIdStylizedCreator.test.ts
```

New helper:

```text
cueIdStylizedCreatorConfigsEqual(a, b)
```

Behavior:

- compares V1 config fields in a fixed semantic order;
- does not depend on JavaScript object property insertion order;
- treats piercing selection order as irrelevant while preserving piercing membership;
- still detects any actual semantic configuration change;
- `/cue-id` now uses this helper for saved/dirty state.

Unit coverage proves object-key order and piercing-order differences do not create false dirty state.

Production remains untouched.


## 174. CUE ID Creator non-3D closure pass

The current Creator V1 lab is now considered functionally closed as far as work that does not require the authored 3D rig/render pipeline.

Completed in this pass:

- semantic config equality is used for dirty-state tracking instead of raw object serialization;
- piercing order does not create false dirty state;
- local draft parsing is schema-aware and rejects malformed or incompatible stored data;
- invalid stored drafts are removed instead of being retried on every visit;
- Save validates the runtime config again before writing browser storage;
- browser-storage read/write/remove failures are handled without crashing the Creator;
- unsaved changes trigger a browser unload warning;
- in-app route changes prompt before discarding unsaved CUE ID changes;
- Reset requires confirmation before deleting the device-local draft;
- the pending stage no longer uses a body/mannequin-shaped placeholder;
- the pending stage now uses an abstract grid/halo treatment so it cannot be mistaken for an approved avatar;
- the look summary reflects the active one-piece layer instead of always showing stored top/bottom;
- expression is included in the current look summary;
- piercing selection has an explicit maximum-three state;
- unselected piercing choices are disabled once the limit is reached while selected piercings remain removable;
- wardrobe tests now guarantee catalogue coverage for every category that currently has an authored fitting contract;
- config parsing and runtime validation have dedicated tests.

### Lab / production boundaries re-verified

```text
CUE_ID_CREATOR_3D_LAB_CANDIDATE = null
CUE_ID_PRODUCTION_CATALOGUE = []
```

No new asset was admitted to either boundary.

### What remains genuinely blocked by 3D work

The following must not be represented as completed until the approved masters pass the physical deformation gate:

1. execute and review the male/female physical rigs;
2. approve neutral/relaxed deformation on real geometry;
3. author and review the facial expression morph targets;
4. bind approved hair assets to the real heads;
5. create and review actual garment fits for the shared catalogue;
6. validate harness/outerwear clipping on real deformation;
7. connect authored GLB semantic bindings to the Creator stage;
8. validate mobile/Android GPU and memory behavior with the real assets;
9. create real static fallbacks from approved authored assets;
10. only after visual/mobile/package/performance evidence, consider lab-candidate or production admission.

Until those gates pass, the current abstract stage and temporary 2D option previews are intentional and truthful.

Production remains untouched.


## 175. Artist onboarding can branch into CUE ID Creator

Artist onboarding now exposes CUE ID as an optional next step without making it a registration requirement.

Updated:

```text
app/pages/onboarding.vue
app/pages/cue-id.vue
```

Behavior:

- the choice appears only for `DJ / ARTIST` accounts;
- agencies are not shown the CUE ID creation decision;
- the default remains `Do it later`, so onboarding is never blocked by visual identity creation;
- artists can choose `Create my CUE ID now` before submitting onboarding;
- account/workspace creation still completes first;
- choosing `now` routes to `/cue-id?from=onboarding`;
- choosing `later` continues to `/workspace?setup=profile`;
- when CUE ID was opened from onboarding, its exit action becomes `Continue to workspace` and returns to professional-profile setup;
- CUE ID remains available later from the workspace path;
- no 3D renderer is required for this onboarding decision.

This is intentionally a next-step preference, not a persisted requirement or completion gate.

Production remains untouched.


## 176. CUE ID Creator is reachable later from Artist Profile

The onboarding `Do it later` path is now complete end-to-end.

Updated:

```text
app/components/CueIdProfileEditor.vue
app/pages/cue-id.vue
```

Behavior:

- Artist Profile keeps the existing public visual-presentation editor untouched;
- when the artist selects the existing CUE ID presentation mode, a separate `CUE ID 3D Creator` callout is shown;
- the callout explains that the new Creator remains isolated from public representation until the 3D validation gates pass;
- `Open Creator` routes to `/cue-id?from=workspace`;
- when opened from Artist Profile, the Creator exit action becomes `Back to profile`;
- this gives artists who skipped CUE ID during onboarding a clear re-entry point later;
- no local Creator draft is promoted into the public profile or production catalogue.

The legacy/public visual representation remains separate from the new stylized Creator V1 until real 3D admission is approved.

Production remains untouched.


## 177. Commercial home aligned with current product truth

The commercial home was updated without changing production.

Updated:

```text
content/es/home.json
content/en/home.json
app/pages/index.vue
assets/css/main.css
```

Changes:

- removed unproven 30-day trial language from primary conversion copy;
- current staging capabilities now include real outbound/inbound booking email threading;
- pre-production work is described as hardening, smoke and launch preparation rather than missing core product;
- discovery remains clearly marked as future/conceptual;
- added a Distribution section for profile links, direct booking links, hosted iframe widget and attributed QR/source links;
- added an Artist Identity section connecting Artist Profile, optional CUE ID and later CUE Passport;
- CUE ID is explicitly described as optional and still in visual lab status;
- section numbering was normalized after the new narrative blocks;
- analytics CTA name for the join block no longer references a trial.

The home now tells the product story as:

```text
fragmented conversations
-> CUE / capture
-> Booking Core
-> distribution
-> artist identity
-> roles/access
-> current product status
-> future discovery
```

Production remains untouched.

## 178. Public ingress hardening state re-verified

The deployed staging `submit-booking-request` and repository branch were re-checked.

Verified:

- honeypot protection exists;
- rate limiting exists at client, artist and artist/contact levels;
- rate-limit keys are HMAC-derived;
- database-backed rate limit migrations are committed;
- anonymous rate protection is implemented, though thresholds still require launch smoke.

Staging Security Advisor currently reports two `rls_enabled_no_policy` INFO notices for internal email-delivery tables. Effective grants were checked directly:

- `anon`: no privileges;
- `authenticated`: no privileges;
- `service_role`: internal access only.

Those notices are therefore accepted for the current internal-service design and must not be “fixed” with permissive policies.

The project-level `auth_leaked_password_protection` warning remains open.

The public acknowledgement email still requires a real provider-configured staging delivery smoke before production.

Production remains untouched.


## 179. Commercial home mobile compression after real-device review

Real iPhone screenshots of the PR preview exposed an overlong, over-scaled mobile composition.

Observed:

- section headlines occupied too much of the viewport;
- Distribution cards became visually cramped;
- Artist Identity cards felt too tall and repetitive;
- several sections carried the same visual weight;
- the separate `Join now` and `Product` blocks repeated essentially the same conversion message;
- the page felt much longer than the amount of product information justified.

Updated:

```text
content/es/home.json
content/en/home.json
app/pages/index.vue
assets/css/main.css
```

Corrections:

- shortened Problem, Distribution and Artist Identity copy;
- reduced mobile section-heading scale and vertical section padding;
- reduced the oversized Problem closing statement;
- Distribution uses lime as a stronger mobile visual accent;
- Distribution and Identity cards become full-width compact stacks on mobile instead of narrow multi-card rails;
- card heights and internal spacing were reduced;
- removed the redundant `Join now` section entirely;
- the existing Product status block remains the conversion/status section;
- removed dead `join` copy from ES/EN content;
- renumbered following sections.

The intent is now fewer, stronger beats rather than one large editorial statement per viewport.

Production remains untouched.


## 180. Booking Next Move mobile CSS collision fixed

A real iPhone screenshot exposed a severe responsive regression in `BookingCoreOperations.vue`.

Observed:

- the auto-complete checkbox expanded to a large square;
- the descriptive text collapsed into an extremely narrow right column;
- the auto-reply control inherited conflicting workspace/mobile form styles;
- the block grew hundreds of pixels vertically and distorted Booking Detail.

Fix:

- mobile auto-reply layout is now explicitly owned by the component;
- checkbox dimensions are hard-bounded to 18px;
- mobile layout uses a two-column grid: checkbox + flexible text;
- label height/min-height/padding are explicitly reset;
- text width, wrapping and line-height are normalized;
- the control remains accessible and touch-friendly without relying on global input styles.

No Booking Core domain behavior changed.

Production remains untouched.


## 181. CUE ID rig V10 baseline accepted for continued lab work

A real Blender validation pass was completed on the authored Meshy body masters.

Detailed state:
`docs/CUE_ID_RIG_V10_HANDOFF_2026-09-22.md`

Key result:

- automatic Blender Bone Heat was rejected after failing to skin body/hair reliably;
- deterministic/proximity approaches V3-V8 were iterated and visually rejected where deformation remained unacceptable;
- V9 established the first usable shared male/female bootstrap with a hard torso lock and arm capsules;
- V10 refines shoulder/axilla, wrist/forearm/hand and pelvis/groin/upper-leg transitions;
- male V10 passed isolated bootstrap QA for shoulders, elbows, hips and knees;
- female V10 also passed isolated bootstrap QA for shoulders, elbows, hips and knees;
- persistent QA actions are stored in the `.blend` via Fake User;
- V10 is now the selected shared male/female working baseline, while `productionReady` remains `false`.

The rig contract remains shared between male/female and no sex-specific user-facing catalogue is introduced.

The rig QA gate is closed. Next: freeze the final male + female V10 outputs and integrate them in the lab-only CUE ID stage. Do not start broad garment fitting until that body integration is stable.

Production remains untouched.


## 182. CUE ID V10 lab body integration started

The shared male/female V10 rig baseline is now wired into the new stylized Creator lab path without touching the production catalogue.

Added:

```text
app/domain/cueIdRiggedBodyLab.ts
app/components/CueIdRiggedBodyLabScene.client.vue
tests/cueIdRiggedBodyLab.test.ts
public/cue-id/lab/bodies/README.md
scripts/blender/cue-id-v10-web-export.py
```

Behavior:

- the stylized Creator stage mounts one real rigged body at a time;
- body switching remains semantic and preserves Creator config;
- skin tone is bound to the semantic skin node;
- authored source hair visibility follows the selected source hairstyle;
- source hair color is tintable;
- underwear remains the technical modesty layer;
- failure to load a lab GLB falls back to an explicit lab asset state rather than fake human geometry;
- production catalogue remains empty;
- Booking / Calendar / Activity remain outside the 3D bundle boundary.

The reviewed master GLBs are intentionally NOT committed directly as browser assets because the current files are approximately 64 MB (male) and 82 MB (female).

A Blender 5.2 web-export step was added using `EXT_meshopt_compression` without mesh simplification or rig changes. The lab loader supports `MeshoptDecoder`.

Expected delivery paths:

```text
public/cue-id/lab/bodies/cueid-male-body-master-v1-rigged-v10.glb
public/cue-id/lab/bodies/cueid-female-body-master-v1-rigged-v10.glb
```

Next gate:

- generate the Meshopt delivery GLBs from the accepted V10 `.blend` masters;
- inspect resulting byte size;
- smoke male/female loading in `/cue-id`;
- then run desktop/mobile memory and rendering checks before any wardrobe fitting.

Production remains untouched.


## 183. CUE ID body-base correction: neutral bald geometry is mandatory

Real browser inspection of the first V10 lab integration exposed an architectural problem in the current Meshy-derived body masters.

Observed:

- selecting `bald` on the male still exposes geometry/shape inherited from the authored fade haircut;
- the female head/hair region can deform or render incorrectly in the lab;
- the current semantic split can hide the explicit `cue_*_hair` node, but it cannot guarantee a truly neutral scalp because parts of the source hairstyle are still baked into or classified as body/skin geometry.

Decision:

- the CUE ID body base MUST be a genuinely bald, neutral head/scalp;
- no hairstyle may define or deform the underlying head silhouette;
- `fade`, `tied-back`, and every other hairstyle are modular hair assets layered onto the same neutral body;
- the current male/female V10 files remain useful as rig/deformation QA references, but they are NOT the final Creator body masters until the neutral scalp issue is corrected;
- do not paper over this with UI visibility toggles or texture masking: the geometry contract itself must be corrected.

Required next asset gate:

1. obtain or author neutral bald male/female body masters with the accepted body proportions;
2. preserve the shared `cue_rig` contract and transfer/rebuild skin weights onto those neutral bodies;
3. validate head/neck deformation again after the geometry swap;
4. keep underwear as a separate semantic/modesty layer;
5. extract/re-author hairstyles as independent assets attached to the head/rig, starting with fade and tied-back if those source meshes can be salvaged cleanly;
6. only after this gate should the Creator's `bald` and hairstyle controls be considered visually valid.

The current browser delivery GLBs stay lab-only and `productionReady: false`.

Production remains untouched.


## 184. New neutral-bald Meshy masters received and audited

New male/female Meshy body masters were supplied to replace the previous source-hair-contaminated bodies.

Source characteristics from the uploaded GLBs:

- male: one mesh, 148,270 vertices, 271,000 triangles, ~12 MB GLB;
- female: one mesh, 114,124 vertices, 204,544 triangles, ~9.5 MB GLB;
- both are unrigged: no skeleton, skin weights or animation actions are embedded;
- both use one textured mesh and 2048px PBR texture sets in the FBX packages;
- initial color/position audit found only ~0.45-0.48% dark faces in the head region, consistent with facial details rather than a large source-hair shell. This supports using them as neutral-bald candidates, but Blender/browser visual QA is still required before acceptance.

A dedicated semantic split was added:

```text
scripts/3d/cue-id-bald-body-semantic-split.py
```

Unlike the previous source-hair pipeline, this split deliberately creates only:

```text
cue_<body>_skin
cue_<body>_underwear
```

There is no `cue_<body>_hair` node in a neutral base. Brows/lashes and other facial texture detail remain part of skin until a dedicated face-material pass exists.

Local semantic candidates generated from the uploaded masters preserve all source triangles:

- male: 235,496 skin + 35,504 underwear = 271,000 total;
- female: 186,076 skin + 18,468 underwear = 204,544 total.

Next gate:

1. visually approve the new bald masters in Blender;
2. use these as V2 neutral body masters;
3. transfer/rebuild the shared `cue_rig` and weights;
4. repeat head/neck + shoulder/elbow/hip/knee QA;
5. export new web-delivery GLBs;
6. only then replace the current V10 lab bodies;
7. author hair as independent modular assets.

Do not reconnect embedded source hair to the body-base contract.

Production remains untouched.


## 185. Neutral-bald V2 rig strategy: transfer accepted V10 rig/weights

To avoid rebuilding the rigging logic from scratch, the new V2 bald masters now use the accepted V10 rigged bodies as the transfer source.

Added:

\`\`\`text
scripts/blender/cue-id-bald-v2-rig-transfer.py
\`\`\`

The script:

- imports the accepted V10 rigged GLB for the same body;
- keeps the shared \`cue_rig\` contract and imported QA actions;
- imports the new V2 semantic body containing only skin + underwear;
- transfers source V10 vertex-group weights onto the V2 topology in normalized body space using nearest-neighbor matching;
- retargets V10 rest-bone positions from the old body bounds to the new V2 body bounds;
- parents the V2 semantic meshes to the transferred rig;
- removes the old source meshes from the output;
- preserves actions with Fake User;
- emits .blend, .glb and .rig-report.json outputs;
- does not add hair or facial morphs;
- keeps \`productionReady: false\`.

This is a candidate transfer pipeline, not an automatic acceptance. The new body topology/proportions differ from V1, so Blender visual QA remains mandatory for:

- head / neck;
- shoulders;
- elbows;
- hips / groin;
- knees;
- underwear deformation.

If transfer QA exposes a localized defect, refine that region on V2 rather than reintroducing source-hair geometry or rebuilding the entire character pipeline.

Production remains untouched.


## 186. CUE ID BODY V2 frozen after browser validation

The neutral-bald V2 bodies have now passed the full lab gate and are considered the frozen body baseline for the next modular-asset phase.

Validated in Blender and in the real `/cue-id` PR preview:

- male and female neutral-bald geometry display correctly;
- approved shared `cue_rig` alignment is preserved;
- rebuilt proxy-derived skin weights no longer show the catastrophic V10-transfer shoulder/elbow tearing;
- male/female switching works in the lab;
- body and face inspection views load correctly;
- semantic base is now skin + underwear only, with no embedded source-hair node;
- Draco delivery is supported by the lab loader;
- the loading overlay now resolves to ready after the parsed V2 scene is attached instead of hanging at 96%.

Current lab delivery assets are approximately:

- male: 15.2 MB;
- female: 12.9 MB.

Decision:

- do not re-open body proportions, rest-bone alignment or broad skin-weight work unless a concrete runtime deformation bug is reproduced;
- keep these approved V2 bodies as the source of truth for hair/clothing/accessory fitting;
- production catalogue remains untouched and `productionReady` remains `false`.

Next performance gate:

1. preserve geometry, rig and weights exactly;
2. test a conservative runtime candidate with textures capped at 1024px and no animation clips embedded;
3. compare visual fidelity and first-load behavior against the current lab asset;
4. only replace the lab GLBs if the candidate is visually indistinguishable at normal Creator inspection distances;
5. then begin the modular HAIR vertical slice.

Added:

```text
scripts/blender/cue-id-v2-runtime-optimize.py
```

This optimizer is deliberately conservative: it does not decimate geometry and does not modify the accepted rig or skin weights.

Production remains untouched.

## 24 Sep 2026 · Profile real + Passport public visibility

- CUE Passport workspace remains 2D and independent from CUE ID.
- Public artist profile includes the summarized Passport surface.
- Added persisted `artists.passport_public_enabled`, default `true`.
- Hiding Passport only affects the public profile. It does not delete or stop trajectory generation.
- `Gestionar Passport` now opens the Profile Passport editor instead of navigating to CUE ID.
- Profile editing model:
  - desktop side panel: Identity/About, Sound, Links, Passport, Distribution;
  - desktop centered modal: Cover, Portrait, Booking settings;
  - mobile: fullscreen editor for all sections.
- Public booking form now opens in a centered desktop modal and fullscreen mobile modal. No autoscroll to a long form.
- CUE Passport constellation tooltip now supports linked-media interaction and mobile internal scrolling.
- Passport V1 remains validation pending until CI/staging verification is available.

- Public Passport selection is now explicit:
  - milestones: automatic or up to 3 selected unlocked milestones;
  - event media: opt-in only, up to 6 linked items;
  - selected media is revalidated against confirmed artist bookings in the public endpoint.
- Public Profile now follows the approved content order more closely: Hero → About → Sound → optional public CUE ID → CUE Passport → Links → Booking.
- New backend changes are committed but NOT applied from this handoff:
  - `20260924135000_add_public_passport_visibility.sql`;
  - `20260924161000_add_public_passport_selection.sql`;
  - updated `get-public-artist-profile` Edge Function.
- Do not claim Passport public selection is live until the correct non-production Supabase target has those migrations/function deployed.

## 24 Sep 2026 · Commercial presentation foundation

Commercial presentation has started without enabling billing enforcement.

Implemented:

- `useCueEntitlements()` is the UI access layer for entitlements and capacity limits.
- Base commercial plan is currently `free` until the legacy `workspace_billing` trial model is reconciled.
- Non-production environments support `free`, `artist_pro` and `agency` demo plan overrides from Settings or `?demoPlan=...`.
- Production ignores demo plan and entitlement overrides.
- `CuePlanBadge.vue` is the reusable PRO / AGENCY badge.
- Passport Event Media stays visible on Free, but changing public media selection requires `passport.media`.
- Existing selected Passport media is preserved if access is unavailable.
- Smart Capture remains usable on Free. `capture.smart_extended` is presented as the higher-capacity Artist Pro capability; usage enforcement is pending real counters.
- Entitlement contract coverage added in `tests/entitlements.test.ts`.

Do not use direct checks such as `plan === 'artist_pro'` in feature UI. Use `can(entitlement)` / plan limits.

Billing is still not connected and production remains untouched.


## 24 Sep 2026 · Artist Pro automation boundary

The first paid automation value is wired without restricting the Free booking loop.

- `automation.advanced` gates the prepared stale follow-up draft.
- Free still receives the stale-waiting attention signal and can write/send the email manually.
- Email delivery retry remains Free because it recovers an operational failure.
- `automation.advanced` gates `completion_trigger = inbound_activity` for next actions.
- Manual next actions remain Free.
- Existing automatic next-action rules continue to display and operate after downgrade.
- Automatic conversational booking status remains Booking Core and is Free.
- Confirm/reject/cancel remain explicit artist decisions.

Validation:

- HEAD `dd9fe94bb15bc62395252c8b9f11ca4e384a7df0`;
- GitHub Actions run `36012306252`, attempt 2, completed successfully;
- `Generate preview build` and PR preview deployment succeeded;
- this workflow does not execute `npm test`, so tests are not claimed as run.


## 24 Sep 2026 · Commercial home + Pricing

The V1 commercial home is now aligned with the launch sequence.

Implemented:

- Pricing section with Free, Artist Pro and Agency.
- Launch prices:
  - Free: EUR 0;
  - Artist Pro: EUR 9.99/month or EUR 99/year;
  - Agency: EUR 39/month or EUR 390/year.
- Founding Artist is presented as an offer inside the commercial model, not a fourth plan.
- Paid-plan CTAs preserve plan intent in signup query params.
- The page states that checkout is not enabled yet.
- CUE Passport is described as a current product surface instead of a future concept.
- The large future discovery / marketplace simulation was removed from the V1 home.

Validation:

- current home build passes `Generate preview build` on the PR preview workflow;
- production remains untouched.

Open legal/commercial blockers before public launch:

- privacy policy;
- cookie policy;
- visible analytics consent UI;
- legal notice / terms as applicable;
- real billing checkout.

Analytics already defaults to unknown consent and does not load GTM before explicit grant. The missing piece is the user-facing consent interface and legal documentation.

Do not publish personal/legal controller details from memory or ad-hoc notes without an explicit reviewed legal pass.


## 24 Sep 2026 · Passport workspace separation

CUE Passport is now structurally independent from CUE ID inside Workspace.

Implemented:

- added `passport` as a dedicated Workspace view and navigation item;
- removed the full Passport explorer from the CUE ID hub;
- dedicated Passport uses the full content width instead of the former two-column preview layout;
- Profile Passport summary now separates:
  - `Open Passport` → dedicated workspace explorer;
  - `Public settings` → publication settings inside Profile;
- Passport view exposes a direct `Public settings` action back to Profile;
- empty constellation state explains the real prerequisite and links back to Bookings;
- zoom / interaction hints are hidden when there are no nodes;
- Passport media URLs are restricted to http/https and video URLs are not rendered as images;
- external Artist Profile links are restricted to http/https;
- changing Workspace module clears hidden Profile editor state;
- Escape closes Profile/public-booking overlays consistently;
- public CUE ID remains static-first because PublicArtistProfile passes `interactive=false`.

Validation:

- HEAD before documentation: `1316cbe7ef4d77972365c611e6fcfe3b7ba79a15`;
- GitHub Actions run `36031829227`;
- `Generate preview build` passed;
- PR preview deployment passed;
- production was not touched;
- pending Passport Supabase migrations / Edge Function were not applied.

Remaining before calling Passport/Profile launch-ready:

- apply Passport backend changes to the correct non-production Supabase target;
- real-device desktop/mobile visual QA, especially dense city/venue data and mobile tooltip/media cases.


## 24 Sep 2026 · Product analytics V1

The product-side V1 funnel is now instrumented without sending PII or free-text content.

Implemented events:

- `signup_started`;
- `signup_completed`;
- `onboarding_completed`;
- `artist_profile_viewed`;
- `artist_profile_published`;
- `booking_entry_shared`;
- `booking_request_started`;
- `booking_request_sent`;
- `booking_capture_created`;
- `booking_response_sent`;
- `booking_decision_completed`;
- `booking_confirmed`;
- `passport_event_created`;
- `upgrade_prompt_viewed`;
- `upgrade_prompt_action`.

Rules:

- success events are emitted only after the product action succeeds;
- first-use milestones are derived in analytics from first occurrence, not stored as browser flags;
- event payloads stay categorical and must not contain names, emails, phone numbers, slugs, booking IDs, URLs or message/free-text content;
- an upgrade prompt is only marked as measured when `analytics.track()` actually accepts it under the current consent state;
- checkout / Stripe / subscription events are intentionally not part of this implementation.

Contract: `docs/PRODUCT_ANALYTICS_V1.md`.

Validation:

- code HEAD before documentation: `1f51c5976c7053075ae8dcd433522b79a34dd3ce`;
- GitHub Actions run `36032641715`;
- `Generate preview build` passed;
- production was not touched.


## 24 Sep 2026 · Passport staging backend applied

Passport backend work is now applied to staging only.

Target:

```text
cuebooker-staging
lycprjeuuynfzwskycwv
```

Applied:

- CUE Passport media schema and RLS;
- public Passport visibility;
- public milestone/media selections;
- `passport_media.created_by` FK index;
- `get-public-artist-profile` version 17.

Security verification:

- `passport_media` RLS enabled;
- member-only SELECT;
- editor-only INSERT/UPDATE/DELETE;
- artist public Passport columns remain protected by the existing manager UPDATE policy;
- no new Passport-specific security advisor findings.

Performance verification:

- initial advisor exposed missing index on `passport_media.created_by`;
- migration `20260924174500_index_passport_media_creator.sql` added and applied;
- the unindexed-FK finding is now gone.

Data sanity:

- published staging artist `lits` currently resolves to 1 confirmed booking, 1 city and 1 venue;
- no public media is selected yet.

Limit of this validation:

- this session could not reach the public staging hostname over HTTP, so the real public JSON response still needs a browser/device smoke;
- production Supabase was not touched;
- billing migration was not applied.


## 24 Sep 2026 · History commercial boundary

The Workspace Activity history now uses the plan capacity contract.

- Free queries the last 90 days.
- Artist Pro and Agency query full available history.
- The filter is sent to the Activity API as `occurred_at >= cutoff`; older rows are not downloaded and hidden in the browser.
- Individual Booking Activity remains part of normal Booking Core operation and is not blocked.
- Free receives a visible Artist Pro explanation at the history boundary.

Validation:

- code HEAD `e30d659fb2f893d15fb2bc1b88ee9c634124c8f2`;
- GitHub Actions run `36036541876`;
- `Generate preview build` and PR preview deployment succeeded;
- this workflow does not execute `npm test`, so no test execution is claimed.

Production remains untouched.


## 24 Sep 2026 · Password recovery and beta checklist

Account recovery is now implemented as a beta-readiness requirement.

Implemented:

- Access exposes a focused Forgot Password state.
- Reset requests use Supabase Auth recovery with a same-origin `/reset-password` redirect.
- Request success copy does not reveal whether an email belongs to an account.
- `/reset-password` consumes only a recovery session.
- Normal authenticated sessions cannot call the recovery-only password setter.
- Password confirmation and minimum length are enforced in the UI.
- Successful reset signs out the recovery session before normal sign-in.

Validation:

- PR preview run `36037278858` completed successfully.
- `Generate preview build` and preview deployment passed.
- Staging redirect allow-list and a real recovery email still need a manual QA smoke.
- No reset email was sent to a real user from this work session.

Beta gates are now centralized in `docs/BETA_ROLLOUT_CHECKLIST.md`.

Ownership boundary remains unchanged: Work owns legal/RGPD/cookies/Pricing/Stripe/checkout.


## 24 Sep 2026 · History decoupled from Inbox pagination

The Activity view no longer uses the Booking Inbox's loaded booking IDs as its query universe.

- History queries Activity by `workspace_id` and selected `bookings.artist_id` using the PostgREST booking relationship.
- Booking labels are returned with the Activity relation.
- Free still applies the 90-day `occurred_at` cutoff server-side.
- Artist Pro / Agency remove the date cutoff.
- V1 requests are capped at 500 Activity rows per load; do not describe this as infinite search/retention.
- Booking Inbox remains capped independently and no longer truncates History.

Validation: HEAD `d700c4ba9fee451aadb998cbeae0a91a5bbacd37`, GitHub Actions run `36037867112`, preview build and deployment succeeded.


## 24 Sep 2026 · Passport Event Media management

Event Media is now manageable from the dedicated Passport workspace view.

- Passport trajectory no longer derives from the Inbox's 100 loaded bookings.
- Dedicated confirmed-booking query loads up to 500 artist bookings for Passport V1.
- Media loading is scoped to those Passport bookings.
- Booking decisions immediately refresh Passport bookings and Event Media.
- Artist Pro can add image/video/reel links to confirmed bookings.
- URL fields reject non-HTTP/HTTPS schemes before persistence.
- Media can be linked, hidden and re-linked.
- Adding media never selects it for the public Profile automatically.
- Public selection remains a separate Profile/Passport setting.
- Free sees existing media but cannot mutate Event Media state.

Binary upload is not opened in this iteration. Staging currently has a private `artist-media` bucket limited to JPG/PNG/WebP and 8 MB, so it is not being repurposed as an Event Media video pipeline.

Validation: HEAD `5bb4e86c366c530c04e652c8246c4580ecf366ae`, GitHub Actions run `36038535320`, preview build and deployment succeeded.


## 24 Sep 2026 · Booking Core beta hardening

This pass removes several hidden dependencies on the 100-row Inbox window and tightens decision/delivery semantics.

Implemented:

- exact booking retrieval exists in Booking Core API;
- notification targets use exact booking retrieval, then merge the target into Inbox if it is outside the recent page;
- initial booking deep-links use the same exact retrieval fallback;
- date-conflict detection queries artist bookings for the selected date instead of using Inbox rows;
- active hold conflict checks are scoped by artist/date, avoiding cross-artist false positives inside Agency workspaces;
- Hold UI exposes reserve/release only; booking confirmation remains a single explicit Booking decision path;
- automatic activity transitions remain limited to operational states and never confirm/reject/cancel;
- email delivery UI distinguishes provider submission from final delivery;
- failure/deferred/delivered states have distinct visual treatment;
- `soft_bounce` is aligned with retry semantics and returns the latest waiting-response Booking to in-conversation;
- migration `20260924201500_include_soft_bounce_in_delivery_failure.sql` was applied to staging only and verified from the deployed function definition;
- Relationship Memory queries up to 200 bookings for the selected artist/entity/contact independently from Inbox pagination, including archived history.

Validation:

- product HEAD `c1d734fff6f48ae8d5bd79cbe65cbdedf85c38f1` passed `Generate preview build` and PR preview deployment in GitHub Actions run `36040211375`;
- staging database soft-bounce trigger was applied and inspected;
- production was not touched;
- current preview workflow still does not execute `npm test`, so automated test execution is not claimed.


## 24 Sep 2026 · Calendar and Overview decoupled from Inbox

Calendar no longer uses the Booking Inbox page as its source of confirmed dates or holds.

- Dedicated artist/month query returns up to 500 confirmed non-archived bookings.
- Dedicated artist/month hold query uses the Booking relationship so Agency workspaces do not mix artists.
- PostgREST date ranges use the canonical `and=(event_date.gte...,event_date.lt...)` form.
- Month cells, selected-day timeline and manual-block overlap checks use the monthly Booking Core sources.
- Overview confirmed/hold/occupied-day KPIs use those same sources and show the month being counted.
- Overview upcoming agenda now combines manual availability blocks, active holds and confirmed bookings instead of showing only manual blocks.
- Booking/hold agenda items open the real Booking; manual blocks open Calendar editing.

Validation:

- calendar decoupling HEAD `94a39c5aabb18efb0b63c493c040286d31a8e7c3` passed its PR preview;
- final Overview agenda HEAD `59b2809458d625425e5bad80651b8ded9db53292`;
- GitHub Actions run `36041300782` completed successfully, including `Generate preview build` and PR preview deployment;
- production remains untouched;
- this preview workflow does not execute `npm test`.


## 24 Sep 2026 · Attention independent from Inbox

The Overview Attention surface is now artist-scoped and independent from the Booking Inbox page.

Data sources:

- up to 500 non-archived, non-rejected/non-cancelled artist bookings for attention evaluation;
- active Next Moves filtered through `bookings.artist_id`;
- active Holds filtered through `bookings.artist_id`;
- artist Activity through the existing relational Activity query;
- outbound email delivery rows filtered through the Booking relation;
- unread notifications loaded by workspace and then crossed with the artist's attention booking set.

This removes two hidden failure modes:

- a stale/failed/overdue booking falling outside the 100-row Inbox window;
- Agency data from another artist appearing in the selected artist's Attention panel.

Validation:

- final Attention HEAD `9cd333626ae088e9be542a2b043eed3be0dbd5f6`;
- GitHub Actions run `36041753583` completed successfully;
- `Generate preview build` and PR preview deployment passed;
- production remains untouched;
- automated `npm test` is still not executed by this preview workflow.


## 25 Sep 2026 · Workspace route-aware loading and consent continuity

Implementation commit: `2f6889b577fca769c8a74ea9bc5a9e719e8e86ff` (`fix: stabilize workspace route loading states`).

- Workspace resolves the initial loading surface from the explicit URL first, then the necessary `cuebooker.workspace.view` cookie, then the legacy local-storage value.
- A route without resolved state uses the neutral Workspace boot state instead of rendering the Overview skeleton by default.
- Direct and refreshed routes preserve their own structural skeletons for Overview, Bookings, Calendar, Activity, Profile, Passport and CUE ID. Settings remains represented by its own structural skeleton.
- Authentication and profile bootstrap calls have an 8-second guard and always release the global loading state, preventing Profile, Passport or CUE ID from remaining indefinitely on `Cargando workspace…`.
- Workspace navigation has one active-state source. `aria-current="page"` drives Overview, Bookings, Calendar, Activity, Profile, Passport, CUE ID and Settings without reintroducing an `.active` class.
- Analytics consent is mirrored to the necessary `cuebooker.analytics-consent.v2` cookie for one year and reconciled with the existing local-storage value, keeping the website and Workspace choice consistent.
- The cookie policy documents both persistence mechanisms in Spanish and English.
- Added route-resolution and source-contract tests for loading surfaces and navigation state.

Local validation from the isolated `feature/app-visual-system` worktree:

- `npm test`: 305 tests passed.
- `npm run generate`: completed successfully; 28 routes prerendered.
- Production was not touched. PR #75 remains the preview and validation surface.

## 28 Sep 2026 · CUE ID modular asset intake architecture

Branch `feature/app-visual-system`, based on `fa7448a9a54f97aa542c04b7e05e3a530974c213`. Work is confined to a modular asset contract, empty registry, validation command, reserved public directories and `docs/CUE_ID_MODULAR_ASSET_PIPELINE.md`. The current `CueIdProductionScene` and production manifest are unchanged. No catalogue entries, master `.blend`, body segmentation, runtime mounting or production admission are claimed.

Validation: modular registry tests, `npm run cue-id:validate-modular`, and application build (local worktree). The validator checks shape/files/GLB metadata but cannot replace visual rig and device QA. No schema, migrations, functions, environment or production change.

Next: approve a common body/rig master and segmentation, build one real piece in Blender, perform pose/combination/device QA, then integrate a gated modular loader with cache and semantic-ID migration plan. Do not switch the live creator to the empty registry.
## 2026-10-04 / Always show agency calendar artist checkboxes

PR96, base `6a88f9dcf0e55dba22f626ec600fd859317b500d`. Agency calendar always renders checkboxes for the complete active roster, including entry from a selected artist. The demo loads calendar bookings and holds from the full active roster so adding another checked artist displays their dates. Live calendar queries already cover the entire roster. Checkbox URL updates are no longer suppressed by selectedArtistId. Tests verify the visible filter fieldset and adding/removing artists against the compiled component. No production or schema changes.
## 2026-10-04 / Clearing artist filter retains the current tab

PR96, base `6c80a3f863b7fa2a5dbf2bd8196670292d80a340`. Clearing the selected artist in the preview no longer restores a previously remembered tab. Workspace return-to-agency query also derives the target from the current view, with the existing fallback for artist-only profile views. Bookings, Calendar, Overview and Activity stay in place. Added regression contracts. No production or schema changes.
## 2026-10-04 / Navigation uses the selected language

PR96 follow-up to filter retention: anonymous agency preview menu now reacts to locale for all six destinations. Spanish labels are Resumen, Reservas, Calendario, Actividad, Artistas, Ajustes. Live workspace uses Reservas for the Spanish Bookings label and preserves CUE Passport as the product name. Test evaluates both locale mappings. No production changes.
## 2026-10-04 — Isolated backup restore succeeded

Run 37171137469, job 111344159054, main SHA 4cd745d5fe3de1c76613b5f53fe8b90f461c02d7 succeeded: import, every COPY count, foreign keys, RLS, unidentified-caller denial and disposable cleanup. Exact backup artifact 11290844352 from run 37169429138 attempt 2; expires 2026-10-11. No hosted restore/migration or stable app deployment. Backend alignment and production mailbox/Nylas review remain before staging/prod promotion. Complete remote feature handoff synced at c949e0e9a2ec392478d067a52d0caec3844e8f8e. Preserve all dirty application work.
## 2026-10-04 23:38 Europe/Madrid — PR96 conflict reconciled in isolated worktree

Owner authorized careful main-to-feature conflict resolution and PR96 preview only. Parents: feature b916d94b7d3d5ae4d108eb07b9560e55d8c07b78 and main bbdf29122f704039b353fa4eed788bfdfef5aaa7. The sole conflict is a fictional migration timestamp in tests/releaseMigrationRehearsal.test.ts. Retained main's 2030 fixture and feature's additional real 30-migration checksum test. Incorporated main's exact infrastructure-only CI push exclusions and RELEASE_REHEARSAL_STATUS document. Application, Supabase, dependencies and deployment workflows are byte-identical to the feature parent. Beta0.0.4 remains the same pending release; this reconciliation does not relabel it.

Validation on the isolated merged checkout: 523/523 tests pass; static generation passes all40 routes; diff whitespace check passes; no unresolved paths. Original dirty worktree untouched. No hosted database, credentials, email, production or stable-staging mutations. CI/preview publication and visual acceptance must be recorded after actual completion. Historical rehearsal status below is superseded by the successful run recorded in this handoff. Next: fast-forward only the feature branch with this two-parent reconciliation, monitor PR CI and preview, then check branded archive dialog and cancellation on the deployed demo without changing real bookings.
