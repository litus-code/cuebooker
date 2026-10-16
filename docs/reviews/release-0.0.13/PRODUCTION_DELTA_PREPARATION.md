# Production delta preparation, 17 October 2026

Status: prepared for an isolated rehearsal, not approved for hosted application.
PR114 remains draft/unmerged, Beta0.0.13. Production has only been read.

## Reconciled SQL candidate

The live production ledger has81 entries. The proposed input consists of the30
earlier named Agency/mailbox migrations plus six attachment/diagnostics migrations,
campaign analytics, its two FK indexes, and the membership-owner guard repair:
39 exact files, with hashes in the infrastructure rehearsal manifest.

This list is a candidate to test against the restored production backup. It is not
a command to replay staging history. Earlier identity/Booking Core aliases and the
three staging-only historical bootstrap names are excluded. Hosted staging migration
timestamps differ from source filenames, so migration names and actual definitions
were compared. No `db push` is authorized.

The catalog comparison shows20 missing production relations and six common relations
with different column definitions: bookings, email_messages, organizations,
product_analytics_events, workspace_artists and workspace_billing. The two production-only
functions and triggers for terminal-booking Next Moves and billing initialization
must survive byte-for-byte; the rehearsal captures/verifies their definition hashes.
Do not replace production with a staging schema dump.

The last-owner guard currently references a nonexistent membership `id` in both
environments. Its additive repair uses `user_id`, serializes changes on the parent,
preserves last-owner denial and permits parent cascades. It is applied and checked
only in staging; production must receive it only through the reviewed delta.

## Backup and rehearsal input

Use the already verified encrypted production backup38889098646/attempt1,
artifact12041757362, named `cuebooker-production-db-38889098646-1`.
Its disconnected restore38893078933 passed. The old release workflow still pins the
October4 archive and old30-file candidate, so it cannot establish acceptance of this
new delta. Prepare a bounded infrastructure PR from main to update those pins and
checks. The current main-only workflow and protected environment must remain intact.

The rehearsal must preserve original row counts/FKs/RLS and the two production-only
behaviors, keep the mailbox/Gmail schedulers paused, check private attachments and
analytics grants, and verify that operational records survive disabling the optional
analytics observers. Run only after owner approval to integrate that infrastructure.

## Remaining deployment preparation

SQL rehearsal success will not deploy Edge functions or prove provider configuration.
Production currently has only smart-capture, get-public-artist-profile and
email-provider-preflight. Record current rollback bundles and reconcile the required
complete candidate bundles, JWT settings, Auth redirects, Storage configuration and
provider environment before requesting production publication. DB backup excludes
Storage object bytes and external configuration. No live campaign collection is enabled.

Staging API funnel acceptance, owner recovery/Manager acceptance and the two new FK
indexes are recorded in STAGING_CAMPAIGN_ACCEPTANCE.md. Preserve the accepted
connected email, attachments, DJ, languages, mobile and public visual checks.
