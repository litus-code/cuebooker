# Manual production database backup

Prepared 4 October 2026. No production export, restore, migration or deployment has run.

The owner approved preparing a no-subscription manual backup through GitHub Actions while using a phone. The Supabase skill and current official backup guidance informed the separate roles/schema/data exports. Unlike the documentation's auto-commit example, this workflow never commits private data and uploads only a GPG-encrypted archive.

## Configuration and authorization

Workflow: `.github/workflows/backup-production.yml`, manual dispatch only. It uses the existing `production` environment and its protection rules, contents-read permissions, pinned action revisions and Supabase CLI 2.79.0. GitHub must register the workflow on its default branch before manual dispatch is available. Adding it to PR96 alone does not make it executable; do not merge the whole application merely to enable a backup. A separate reviewed infrastructure-only promotion requires attention to the existing CI-to-stable-staging trigger.

Before configuring new credentials, obtain explicit owner confirmation that GitHub's production environment may hold the database connection for this export. The owner enters values directly into GitHub's masked secret form, never through chat, agent output, screenshots or source:

- `CUEBOOKER_BACKUP_DB_URL`: production direct/session-pooler PostgreSQL URL from Supabase Connect, database `postgres`, port 5432, password URL-encoded. No transaction pooler, staging connection, service-role key or Management API token. SSL is required.
- `CUEBOOKER_BACKUP_PASSPHRASE`: independent random passphrase, at least 32 characters, saved separately in the owner's password manager. Losing it makes the archive unusable. Do not reuse the database password.

Creating a new credential or changing/resetting a database password requires a separate owner action. Do not reset passwords, buy a plan or copy staging credentials to complete this task. Secrets are only supplied to the export step; its children do not inherit these named environment variables. Tool output stays suppressed because errors can contain connection information. No shell tracing or CLI debug.

## Execution and validation

Dispatch with `confirm_project=cuebooker-production`. The script rejects another project before calling any tool. It runs only database dump commands, checks nonempty files, archives them with a scope/time manifest, encrypts with GPG AES256 and checks decrypted bytes against the original archive. A fresh private temporary directory holds plaintext and is removed on success/failure. The only artifact files are encrypted bytes and their SHA256 checksum. Artifact retention is seven days, not permanent backup storage. The owner must download and retain the encrypted archive in private durable storage before it expires, and retain the passphrase separately. GitHub Actions/storage and Supabase egress allowances still apply; do not promise zero usage charges if account limits are exceeded.

Before calling the production backup recoverable, verify successful export/download/checksum and conduct an isolated restore exercise. Do not restore over production or create a paid project without permission. Decryption round-trip verifies encryption integrity only, not database restoration. Downloading an encrypted archive alone does not pass the release gate. Roles/schema/data are separate dumps; run without concurrent schema migrations and assess concurrent writes when planning a restore.

## Scope and restore limits

This is a logical database export, not a complete project backup. Supabase Storage object bytes, Edge secrets/functions, SMTP/Auth/provider/platform settings and external Nylas state are not covered. Built-in managed schemas/roles follow the CLI's exclusions. The data export excludes vector-storage tables per official restore guidance. Vault/column-encrypted values depend on their encryption root key and cannot be assumed recoverable in another project from these SQL files alone. Never expose/export that root key through agent-visible output. Review actual production usage and document any additional required recovery material before migrating affected data.

For an authorized recovery, use the official CLI restore guide on an isolated destination, verify role/schema/data compatibility and tenant isolation there, then plan any production recovery separately. Never run database reset, drop or restore automatically from this workflow.

References:

- https://supabase.com/docs/guides/platform/backups
- https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore
- https://supabase.com/docs/guides/deployment/ci/backups
- https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows

