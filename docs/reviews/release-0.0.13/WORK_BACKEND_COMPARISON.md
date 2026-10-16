# Work Mode backend comparison, 16 October 2026

Read-only inspection for Beta 0.0.13, reviewed SHA `69172db62772a0f294482d4c9f92f4fb94edf6dd`, PR114. This is a management-API/catalog inspection, not a deployment or authenticated product acceptance.

## Effective access

Authenticated Supabase management calls succeed for staging `lycprjeuuynfzwskycwv` and production `qlocooqfdzehogbwcbhr`. No access token was read, printed, created or changed. The former Codex-runtime access limitation does not apply to this Work session. No hosted mutation was performed.

## Observed inventories

| Item | Staging | Production |
| --- | ---: | ---: |
| migrations | 117 | 81 |
| relations | 89 | 73 |
| functions | 116 | 70 |
| policies | 115 | 95 |
| triggers | 51 | 47 |
| indexes | 311 | 269 |
| buckets | 2 | 1 |
| cron | 5 | 2 |

Counts include platform objects in auth/storage where applicable; a count alone is not a release delta. Function/policy/constraint hashes were compared, not just migration timestamps. No customer rows, auth metadata, tokens, cron commands or function bodies are included here.

## Material release findings

- Production has only three deployed Edge functions: smart-capture v5, get-public-artist-profile v5 and email-provider-preflight v5. Staging has 20. Version numbers are per-project metadata, not proof of equal source; source-level reconciliation of the required bundles is still pending.
- Production lacks 16 tables present in staging, including connected mailbox state, private email attachment metadata, workspace invitations and public agency submission deduplication. The current frontend alone cannot deliver the reviewed beta against that backend.
- Five shared relations differ in column/default definitions: bookings, email_messages, organizations, workspace_artists and workspace_billing. This does not authorize replacing production definitions.
- Production-only private helpers/triggers include terminal-booking Next Move completion and workspace-billing initialization. Preserve and reconcile these deliberately; do not overwrite them with staging's alternatives.
- Production lacks the private booking-email-attachments bucket. Both existing artist-media bucket definitions match. No object bytes were inspected or copied.
- Campaign migration is absent in staging and production: no campaign private tables, campaign Edge function or campaign-retention cron. Existing event table columns match between projects.
- Staging dependency catalog checks found the required profile/onboarding, workspace membership/type, agency-public flag, booking capture/origin and canonical artist-route columns. Existing event-name constraint and own-insert policy exist. Public rate limiter and internal-admin functions exist. This is preliminary compatibility evidence, not permission/trigger/runtime acceptance.

## Deployment remains gated

The reviewed release procedure explicitly requires an isolated **current staging restore** rehearsal before applying campaign SQL. A full staging snapshot/rehearsal is not available through the successful management catalog calls, and the previous PGlite minimal-dependency suite does not substitute for it. No DDL, Edge deployment, retention scheduler, account, invitation, booking, email, provider call or production write was performed.

GitHub backup run [38889098646](https://github.com/litus-code/cuebooker/actions/runs/38889098646), job116933969537, was independently checked and remains **waiting** at the protected production environment. An owner must review/approve that existing gate. It is a production DB backup and does not by itself satisfy the separate current-staging rehearsal. The October4 backup/old pinned restore drill must not be presented as a current restore. DB archives also omit Storage object bytes and external configuration.

## Next bounded steps

1. Owner approves the existing protected backup job. Verify resulting artifact/run/attempt and restore it using the reviewed drill with current inputs.
2. Obtain the current staging snapshot through the documented secure export workflow, rehearse the exact campaign migration in isolation, and resolve any observed conflicts. Do not create a paid Supabase branch as an unrequested workaround.
3. Apply only the reviewed analytics delta to staging, keep dataset test, deploy the complete campaign bundle and verify retention/advisors/negative access and real runtime behavior.
4. Complete controlled agency/recovery acceptance with identified QA identities. Preserve owner-accepted email/attachments/DJ checks; no generic retest is reopened here.
5. Build and rehearse the explicit production backend delta, including production-only behavior, current rollback bundles, object recovery and provider/Auth configuration. Final production decision remains separate; no main merge is authorized.

## Structural differences

### relations

Staging-only:

- `public.booking_email_attachments`
- `public.gmail_mailbox_credentials`
- `public.gmail_mailbox_watches`
- `public.mailbox_ai_attempts`
- `public.mailbox_ai_budget_settings`
- `public.mailbox_ai_results`
- `public.mailbox_beta_notifications`
- `public.mailbox_beta_settings`
- `public.mailbox_beta_waitlist`
- `public.mailbox_booking_threads`
- `public.mailbox_connections`
- `public.mailbox_incoming_jobs`
- `public.mailbox_oauth_states`
- `public.mailbox_send_attempts`
- `public.public_agency_enquiry_submissions`
- `public.workspace_invitations`

Production-only:

None.

Different shared definitions:

- `public.bookings`
- `public.email_messages`
- `public.organizations`
- `public.workspace_artists`
- `public.workspace_billing`

### functions

Staging-only:

- `private.agency_catalog_payload.target_workspace_id uuid, draft boolean`
- `private.agency_workspace_from_storage_name.object_name text`
- `private.can_manage_agency_booking_route.target_workspace_id uuid, target_artist_id uuid`
- `private.can_manage_roster_artist.target_artist_id uuid`
- `private.close_retired_agency_booking_route`
- `private.create_agency_invitation.target_workspace_id uuid, invite_email text, invite_role workspace_member_role`
- `private.create_public_agency_enquiry.target_agency_slug text, target_idempotency_key uuid, target_request_fingerprint text, contact_name text, contact_email text, initial_message text`
- `private.get_agency_catalog.target_workspace_id uuid`
- `private.get_public_agency_profile.agency_slug text`
- `private.guard_agency_email_request`
- `private.list_agency_team.target_workspace_id uuid`
- `private.manage_agency_member.target_workspace_id uuid, target_user_id uuid, new_role workspace_member_role`
- `private.review_agency_invitation.invite_token text, accept_invitation boolean`
- `private.revoke_agency_invitation.target_invitation_id uuid`
- `private.save_agency_catalog.target_workspace_id uuid, settings jsonb, published boolean, visible_artist_ids uuid[]`
- `private.verify_booking_email_attachment`
- `public.authorize_gmail_watch.target_connection uuid, target_revision uuid`
- `public.authorize_mailbox_incoming.target_job uuid`
- `public.claim_gmail_watch`
- `public.claim_mailbox_beta_notification.target_notification uuid`
- `public.claim_mailbox_incoming`
- `public.complete_gmail_mailbox.target_workspace uuid, target_actor uuid, target_state text, target_email text, target_ciphertext text, target_access_expires timestamp with time zone, target_reauth_at timestamp with time zone`
- `public.complete_gmail_watch.target_connection uuid, target_revision uuid, target_lease uuid, target_patch jsonb`
- `public.complete_mailbox_analysis.target_workspace uuid, target_actor uuid, target_connection uuid, target_request uuid, target_outcome text, target_input_tokens integer, target_output_tokens integer`
- `public.complete_mailbox_incoming.target_job uuid, target_state text, target_kind text, target_reason text`
- `public.create_agency_invitation.target_workspace_id uuid, invite_email text, invite_role workspace_member_role`
- `public.create_automatic_mailbox_request.target_job uuid, target_message jsonb, target_classification jsonb`
- `public.create_public_agency_enquiry.target_agency_slug text, target_idempotency_key uuid, target_request_fingerprint text, contact_name text, contact_email text, initial_message text`
- `public.defer_mailbox_incoming.target_job uuid`
- `public.enqueue_gmail_history.target_email text, target_history text`
- `public.enqueue_mailbox_incoming.target_grant text, target_event text, target_message text, target_thread text, target_date timestamp with time zone`
- `public.get_agency_catalog.target_workspace_id uuid`
- `public.get_public_agency_profile.agency_slug text`
- `public.ingest_mailbox_thread.target_connection uuid, target_actor uuid, target_thread text, target_messages jsonb, target_artist uuid, target_booking uuid`
- `public.list_agency_team.target_workspace_id uuid`
- `public.mailbox_beta_capacity_command.target_action text, target_workspace uuid, target_actor uuid, target_email text, target_provider text, target_state text, target_grant text`
- `public.mailbox_beta_command.target_action text, target_workspace uuid, target_actor uuid, target_email text, target_provider text, target_state text, target_grant text`
- `public.manage_agency_member.target_workspace_id uuid, target_user_id uuid, new_role workspace_member_role`
- `public.queue_mailbox_beta_notification`
- `public.request_mailbox_beta_access.target_workspace uuid, target_actor uuid, target_email text, target_locale text`
- `public.reserve_mailbox_analysis.target_workspace uuid, target_actor uuid, target_connection uuid, target_request uuid`
- `public.reset_mailbox_background_consent`
- `public.review_agency_invitation.invite_token text, accept_invitation boolean`
- `public.review_mailbox_beta_access.target_workspace uuid, target_actor uuid, target_status text, target_google_added boolean`
- `public.revoke_agency_invitation.target_invitation_id uuid`
- `public.save_agency_catalog.target_workspace_id uuid, settings jsonb, published boolean, visible_artist_ids uuid[]`
- `public.set_mailbox_background_analysis.target_workspace uuid, target_actor uuid, target_connection uuid, target_enabled boolean, target_processor text`
- `public.start_gmail_mailbox_detection.target_workspace uuid, target_actor uuid, target_connection uuid, target_history text, target_expires timestamp with time zone`

Production-only:

- `private.complete_next_move_after_terminal_booking_decision`
- `private.ensure_workspace_billing`

Different shared definitions:

- `private.can_edit_workspace.target_workspace_id uuid` (staging 0b6b2d2709e5565c6f0400f62a1007c8, production 976dbad5dd065ac95aeb804503c8b248)
- `private.can_manage_workspace.target_workspace_id uuid` (staging f84b87c4a7305b73f97b40e86864d72b, production 5c2886cf422df8055ef9d168785f2fbd)
- `private.complete_next_move_from_activity` (staging a57417301675695943ca1ee5d81f57fe, production d515236d60571e493ef1387259fa131f)
- `private.default_booking_origin_capture` (staging 3f721e1bcbee63a467669c6f93144561, production 9c031a029b03ea10664e601120270430)
- `private.enqueue_notification_email_delivery` (staging 1bcf0e7c1c3ee60f732bf4931b57e7b2, production 5702d784d6111918aedd807123d16c79)
- `private.ensure_booking_workspace.target_organization_id uuid, target_artist_id uuid` (staging f7f68610d5d8eade84da7718d466cd34, production 656523e46879e07becb1989a20c961e2)
- `private.is_workspace_member.target_workspace_id uuid` (staging 25368540d76f073f956a0164c014a5e0, production 7e1117131808d2781fbab03011136dc0)
- `private.is_workspace_owner.target_workspace_id uuid` (staging 2fcdcbb281794fc26e841725036ce8bf, production 1da880c3c8666331bfe00c40d0de4982)
- `private.normalize_email_delivery_acceptance` (staging 9148607fea64e7400698b85d9f70e146, production 6fb29b91894a22bcc856097bb9e9099a)
- `private.preserve_workspace_identity` (staging 9e41e4cc9a25a07d05e033f66167a873, production 03a2d3efeadb586c3f7e50ba5f4141de)
- `private.preserve_workspace_record_identity` (staging a91670abab5fb2918b5349585984db83, production e6af6aafb78e20d2fae57d60c8704875)
- `private.prevent_last_artist_owner_change` (staging 108d9053d48911b70b786c622de80f03, production 042b32a90f25c377c95787e4fd16fe47)
- `private.prevent_last_organization_owner_change` (staging f601d034c951efe50166f2cabbe630d4, production bf2f7ff2f782e34d1c18ea9822fcb5fc)
- `private.sync_booking_status_from_activity` (staging 54f9e9b103927650c10de76e01ef32c6, production bccca850dbc44e5e00bf60ee5e5ca610)
- `public.add_agency_artist.target_organization_id uuid, artist_name text, artist_slug text` (staging c77534e471216b871237a83aa5c2572b, production a0f196713ab9ef46629826c2ca7a98da)
- `public.add_workspace_owner` (staging 319c8d5dd865fd7367889cca65ed7c19, production ed3d37e9663bd6b5651ff40f4d22d871)
- `public.create_manual_booking.target_workspace_id uuid, target_artist_id uuid, target_source booking_source, existing_contact_id uuid, contact_name text, contact_email text, contact_phone text, existing_counterparty_id uuid, counterparty_kind counterparty_kind, counterparty_name text, event_name text, venue_name text, event_city text, event_country_code text, event_date date, offer_amount_minor bigint, offer_currency text, initial_note text` (staging 3cb784648b1dea14a0bdd99af094a7c2, production 8ef6b843b22d373b511c24d8a58fd70a)
- `public.ensure_booking_workspace.target_organization_id uuid, target_artist_id uuid` (staging 87d8058e208894aa7774f93fc8a4a619, production d4072e776b7f2fdfadbe933de3b98dbd)
- `public.ingest_booking_email_message.target_workspace_id uuid, target_booking_id uuid, target_contact_id uuid, target_to_email text, target_from_email text, target_subject text, target_body_text text, target_provider text, target_provider_message_id text, target_received_at timestamp with time zone, target_occurred_at timestamp with time zone, target_created_by uuid, target_metadata jsonb` (staging e1441db965efe7906fcf08d45b350a92, production 56c017de96e68f472bb7a70dcf49351f)
- `public.protect_workspace_last_owner` (staging 6d973117494299cbae2af1f76c280f5a, production 47a60ac75d36432b558d57bb2b058cc0)

### policies

Staging-only:

- `public.artist_booking_profiles.artist_booking_profiles_insert_agency_managers`
- `public.artist_booking_profiles.artist_booking_profiles_select_agency`
- `public.artist_booking_profiles.artist_booking_profiles_update_agency_managers`
- `public.artist_booking_routes.artist_booking_routes_insert_agency`
- `public.artist_booking_routes.artist_booking_routes_update_agency`
- `public.artists.artists_select_workspace_roster`
- `public.artists.artists_update_agency_managers`
- `public.availability_blocks.availability_blocks_delete_agency_managers`
- `public.availability_blocks.availability_blocks_insert_agency_managers`
- `public.availability_blocks.availability_blocks_select_agency_roster`
- `public.availability_blocks.availability_blocks_update_agency_managers`
- `public.booking_email_attachments.booking_email_attachments_member_read`
- `public.workspace_artists.workspace_artists_update_roster_managers`
- `public.workspace_invitations.workspace_invitations_managers_read`
- `storage.objects.agency_identity_media_insert`
- `storage.objects.agency_identity_media_select`
- `storage.objects.artist_media_delete_agency_managers`
- `storage.objects.artist_media_insert_agency_managers`
- `storage.objects.artist_media_select_agency_roster`
- `storage.objects.artist_media_update_agency_managers`

Production-only:

None.

Different shared definitions:

None.

### triggers

Staging-only:

- `public.booking_email_attachments.booking_email_attachments_validate_link`
- `public.bookings.bookings_guard_agency_email_request`
- `public.mailbox_beta_waitlist.mailbox_beta_notification`
- `public.mailbox_connections.mailbox_connection_consent_reset`
- `public.workspace_artists.close_retired_agency_booking_route`
- `public.workspaces.workspaces_start_trial`

Production-only:

- `public.bookings.bookings_complete_next_move_after_terminal_decision`
- `public.workspaces.workspaces_ensure_billing`

Different shared definitions:

None.

### buckets

Staging-only:

- `booking-email-attachments`

Production-only:

None.

Different shared definitions:

None.

### cron

Staging-only:

- `cuebooker-gmail-history`
- `cuebooker-mailbox-incoming`
- `cuebooker-notification-email-retry`

Production-only:

None.

Different shared definitions:

None.

No tests were rerun for this documentation-only inspection; 599 unit tests/44-route build/43 isolated SQL checks remain prior candidate evidence, not new Work execution.
