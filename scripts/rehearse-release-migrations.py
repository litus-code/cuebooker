"""Apply only hashed candidate migrations to the already isolated restored DB."""
import hashlib
import importlib.util
import json
from pathlib import Path
import re

spec = importlib.util.spec_from_file_location('restore', Path(__file__).with_name('restore-backup-drill.py'))
restore = importlib.util.module_from_spec(spec)
spec.loader.exec_module(restore)

# Catalog fingerprints inspected read-only on the current production project.
# These production-only behaviors must not be overwritten by staging history.
PRESERVED_FUNCTIONS = {
    'private.complete_next_move_after_terminal_booking_decision()': '1d4fd5181662bba5cf6e02ef3fee9d17',
    'private.ensure_workspace_billing()': 'aa84b2d1d870ffcff3c6655a9dc45aa5',
}
PRESERVED_TRIGGERS = {
    ('public.bookings', 'bookings_complete_next_move_after_terminal_decision'): '8b2825796acf6ff25ab945d65dc35a34',
    ('public.workspaces', 'workspaces_ensure_billing'): 'a54198fa8ce8e8e4881432fe2a80f69f',
}


def verify_production_behaviors():
    for signature, expected in PRESERVED_FUNCTIONS.items():
        actual = restore.psql(f"SELECT md5(pg_get_functiondef(to_regprocedure('{signature}')));")
        if actual != expected:
            raise RuntimeError('Production-only function fingerprint mismatch.')
    for (table, name), expected in PRESERVED_TRIGGERS.items():
        actual = restore.psql(f"SELECT md5(pg_get_triggerdef(oid)) FROM pg_trigger WHERE tgrelid='{table}'::regclass AND tgname='{name}' AND tgenabled='O';")
        if actual != expected:
            raise RuntimeError('Production-only trigger fingerprint mismatch.')


def load_migrations(root, manifest):
    entries = json.loads(Path(manifest).read_text())
    if len(entries) != 39 or len({e['path'] for e in entries}) != 39:
        raise RuntimeError('Unexpected candidate migration manifest.')
    if [e['path'] for e in entries] != sorted(e['path'] for e in entries):
        raise RuntimeError('Candidate migrations are out of order.')
    result = []
    for entry in entries:
        path = entry['path']
        if not re.fullmatch(r'supabase/migrations/[0-9]{14}_[a-z_]+\.sql', path):
            raise RuntimeError('Invalid candidate migration path.')
        data = (Path(root) / path).read_bytes()
        if hashlib.sha256(data).hexdigest() != entry['sha256']:
            raise RuntimeError('Candidate migration checksum mismatch.')
        result.append(data.decode())
    return result


def rehearse():
    sql_files = load_migrations('release-candidate', 'scripts/release-migration-manifest.json')
    protected = ('public.bookings', 'public.contacts', 'public.email_messages',
                 'public.workspaces', 'public.workspace_members', 'auth.users')
    counts = {t: restore.psql(f'SELECT count(*) FROM {t};') for t in protected}
    if restore.psql('SELECT count(*) FROM supabase_migrations.schema_migrations;') != '81':
        raise RuntimeError('Unexpected restored production migration ledger.')
    verify_production_behaviors()
    for index, sql in enumerate(sql_files, 1):
        restore.psql(sql, f'candidate migration {index:02d}')
    for table, before in counts.items():
        if restore.psql(f'SELECT count(*) FROM {table};') != before:
            raise RuntimeError('Candidate migrations changed protected record counts.')
    restore.psql(restore.FK_CHECK, 'candidate relationship verification')
    verify_production_behaviors()
    if restore.psql("SELECT count(*) FROM cron.job WHERE jobname='cuebooker-mailbox-incoming' AND NOT active;") != '1':
        raise RuntimeError('Candidate mailbox scheduler is not paused.')
    if restore.psql("SELECT count(*) FROM cron.job WHERE jobname='cuebooker-gmail-history' AND NOT active;") != '1':
        raise RuntimeError('Candidate Gmail scheduler is not paused.')
    service_tables = ('mailbox_connections','mailbox_oauth_states','mailbox_booking_threads',
                     'mailbox_send_attempts','mailbox_beta_settings','mailbox_beta_waitlist',
                     'mailbox_ai_budget_settings','mailbox_ai_attempts','mailbox_ai_results',
                     'mailbox_incoming_jobs','public_agency_enquiry_submissions',
                     'mailbox_beta_notifications','gmail_mailbox_credentials','gmail_mailbox_watches')
    for name in service_tables:
        table = 'public.' + name
        if restore.psql(f"SELECT relrowsecurity FROM pg_class WHERE oid='{table}'::regclass;") != 't':
            raise RuntimeError('Candidate service table RLS is missing.')
        for role in ('anon','authenticated'):
            if restore.psql(f"SELECT has_table_privilege('{role}','{table}','SELECT,INSERT,UPDATE,DELETE');") == 't':
                raise RuntimeError('Candidate service table is exposed to clients.')
    for signature in ('public.record_campaign_event(text,uuid,text,jsonb)', 'public.revoke_campaign_consent(text)'):
        for role in ('anon', 'authenticated', 'service_role'):
            if restore.psql(f"SELECT has_function_privilege('{role}','{signature}','EXECUTE');") != ('t' if role == 'service_role' else 'f'):
                raise RuntimeError('Campaign service-only function grants mismatch.')
    for name in ('campaign_visitors', 'campaign_registrations', 'campaign_workspace_dedup', 'campaign_analytics_settings'):
        table = 'private.' + name
        if restore.psql(f"SELECT relrowsecurity FROM pg_class WHERE oid='{table}'::regclass;") != 't':
            raise RuntimeError('Campaign private table RLS is missing.')
        for role in ('anon', 'authenticated'):
            if restore.psql(f"SELECT has_table_privilege('{role}','{table}','SELECT,INSERT,UPDATE,DELETE');") != 'f':
                raise RuntimeError('Campaign private table grants mismatch.')
    if restore.psql('SELECT dataset FROM private.campaign_analytics_settings WHERE singleton;') != 'test':
        raise RuntimeError('Campaign collection must remain in the test dataset.')
    if restore.psql("SELECT public FROM storage.buckets WHERE id='booking-email-attachments';") != 'f':
        raise RuntimeError('Attachment bucket is missing or public.')
    if restore.psql("SELECT relrowsecurity FROM pg_class WHERE oid='public.booking_email_attachments'::regclass;") != 't':
        raise RuntimeError('Attachment metadata RLS is missing.')
    for role in ('anon', 'authenticated'):
        if restore.psql(f"SELECT has_table_privilege('{role}','public.booking_email_attachments','INSERT,UPDATE,DELETE');") != 'f':
            raise RuntimeError('Attachment metadata client writes are exposed.')
    # Non-destructive optional-analytics rollback drill: disable only new observers,
    # verify operational facts, then roll back the whole local transaction.
    observers = [('auth.users','campaign_signup_created'), ('public.profiles','campaign_onboarding_completed'),
                 ('public.workspace_members','campaign_workspace_attached'), ('public.artists','campaign_artist_published'),
                 ('public.organizations','campaign_catalog_published'), ('public.bookings','campaign_first_request')]
    rollback_sql = 'BEGIN; ' + ' '.join(f'DROP TRIGGER {name} ON {table};' for table, name in observers)
    for table, before in counts.items():
        if not before.isdigit():
            raise RuntimeError('Invalid protected record count.')
        rollback_sql += f" DO $$ BEGIN IF (SELECT count(*) FROM {table}) <> {before} THEN RAISE EXCEPTION 'Observer rollback changed protected records'; END IF; END $$;"
    rollback_sql += ' ROLLBACK;'
    restore.psql(rollback_sql, 'optional observer rollback drill')
    for table, before in counts.items():
        if restore.psql(f'SELECT count(*) FROM {table};') != before:
            raise RuntimeError('Optional observer rollback changed protected records.')
    verify_production_behaviors()
    print('Candidate migration rehearsal passed: 39 exact files, preserved production-only behaviors and records, foreign keys, service grants, private attachments, test analytics, paused schedulers and optional observer rollback. No hosted database changed.')


if __name__ == '__main__':
    try:
        restore.main(rehearse)
    except Exception as exc:
        print(str(exc) if isinstance(exc, RuntimeError) else 'Candidate rehearsal failed; private details suppressed.')
        raise SystemExit(1)
