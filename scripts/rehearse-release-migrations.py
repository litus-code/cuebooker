"""Apply only hashed candidate migrations to the already isolated restored DB."""
import hashlib
import importlib.util
import json
from pathlib import Path
import re

spec = importlib.util.spec_from_file_location('restore', Path(__file__).with_name('restore-backup-drill.py'))
restore = importlib.util.module_from_spec(spec)
spec.loader.exec_module(restore)


def load_migrations(root, manifest):
    entries = json.loads(Path(manifest).read_text())
    if len(entries) != 29 or len({e['path'] for e in entries}) != 29:
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
    for index, sql in enumerate(sql_files, 1):
        restore.psql(sql, f'candidate migration {index:02d}')
    for table, before in counts.items():
        if restore.psql(f'SELECT count(*) FROM {table};') != before:
            raise RuntimeError('Candidate migrations changed protected record counts.')
    restore.psql(restore.FK_CHECK, 'candidate relationship verification')
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
    print('Candidate migration rehearsal passed: 29 exact files, preserved protected counts, foreign keys, service-table denial and both paused schedulers. No hosted database changed.')


if __name__ == '__main__':
    try:
        restore.main(rehearse)
    except Exception as exc:
        print(str(exc) if isinstance(exc, RuntimeError) else 'Candidate rehearsal failed; private details suppressed.')
        raise SystemExit(1)
