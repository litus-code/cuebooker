"""Read-only staging export, encrypted ephemeral snapshot and disconnected SQL rehearsal."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import secrets
import tarfile
import tempfile
from urllib.parse import urlsplit, parse_qsl, unquote, urlunsplit

spec = importlib.util.spec_from_file_location('restore', Path(__file__).with_name('restore-backup-drill.py'))
restore = importlib.util.module_from_spec(spec)
spec.loader.exec_module(restore)
STAGING = 'lycprjeuuynfzwskycwv'
CANDIDATE = '69172db62772a0f294482d4c9f92f4fb94edf6dd'
MIGRATION = 'supabase/migrations/20261016120000_campaign_funnel_analytics.sql'
MIGRATION_SHA256 = '793c7f6ef990ef0ee70170ff03ce4f617d47431461add1d1c1dca356b2541189'


def validate_connection(value):
    try:
        url = urlsplit(value)
        user = unquote(url.username or '')
        direct = url.hostname == f'db.{STAGING}.supabase.co' and user == 'postgres'
        pooler = (url.hostname or '').endswith('.pooler.supabase.com') and user == f'postgres.{STAGING}'
        options = parse_qsl(url.query, keep_blank_values=True, strict_parsing=True)
        valid_options = all(k in ('sslmode', 'sslrootcert') for k, v in options)
        opts = dict(options)
        if not (url.scheme in ('postgres', 'postgresql') and (direct or pooler)
                and url.port in (None, 5432) and url.password and url.path == '/postgres'
                and not url.fragment and valid_options and len(opts) == len(options)
                and opts.get('sslmode', 'verify-full') == 'verify-full'
                and opts.get('sslrootcert', 'system') == 'system'):
            raise ValueError()
        return urlunsplit((url.scheme, url.netloc, url.path, 'sslmode=verify-full&sslrootcert=system', ''))
    except Exception:
        raise RuntimeError('Missing or invalid secure staging database connection.') from None


def checked_migration(root):
    data = (Path(root) / MIGRATION).read_bytes()
    if hashlib.sha256(data).hexdigest() != MIGRATION_SHA256:
        raise RuntimeError('Reviewed migration checksum mismatch.')
    return data.decode()


def export_snapshot(connection, target, phrase):
    for name, flags in [('roles.sql', ['--role-only']), ('schema.sql', []),
                        ('data.sql', ['--data-only', '--use-copy', '-x', 'storage.buckets_vectors', '-x', 'storage.vector_indexes'])]:
        output = target / name
        restore.command(['supabase', 'db', 'dump', '--db-url', connection, '--file', str(output), *flags], 'read-only staging export')
        if not output.is_file() or not output.stat().st_size:
            raise RuntimeError('Staging export is incomplete.')
        output.chmod(0o600)
    (target / 'manifest.json').write_text(json.dumps({'project': STAGING, 'cliVersion': '2.119.0'}))
    names = ['roles.sql', 'schema.sql', 'data.sql', 'manifest.json']
    archive = target / 'database.tar.gz'
    with tarfile.open(archive, 'w:gz') as tar:
        for name in names:
            tar.add(target / name, arcname=name)
    encrypted = target / 'database.tar.gz.gpg'
    restore.command(['gpg', '--batch', '--yes', '--pinentry-mode', 'loopback', '--homedir', str(target),
                     '--passphrase-fd', '0', '--symmetric', '--cipher-algo', 'AES256', '--output', str(encrypted), str(archive)],
                    'ephemeral snapshot encryption', input=(phrase + '\n').encode())
    encrypted.chmod(0o600)
    (target / 'database.tar.gz.gpg.sha256').write_text(hashlib.sha256(encrypted.read_bytes()).hexdigest() + '\n')
    for name in names + ['database.tar.gz']:
        (target / name).unlink()


def rehearse(sql):
    tables = ['public.bookings', 'public.contacts', 'public.email_messages', 'public.workspaces',
              'public.workspace_members', 'public.workspace_artists', 'public.organizations',
              'public.artists', 'public.profiles', 'public.product_analytics_events', 'auth.users']
    counts = {t: restore.psql(f'SELECT count(*) FROM {t};') for t in tables}
    definitions = """SELECT coalesce(md5(string_agg(pg_get_functiondef(p.oid),'' ORDER BY p.oid)),'')
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE n.nspname IN ('public','private') AND p.prokind='f'
      AND p.proname NOT LIKE '%campaign%';"""
    before = restore.psql(definitions)
    restore.psql(sql, 'reviewed campaign migration')
    if before != restore.psql(definitions) or any(counts[t] != restore.psql(f'SELECT count(*) FROM {t};') for t in tables):
        raise RuntimeError('Existing records or domain functions changed.')
    restore.psql(restore.FK_CHECK, 'post-migration relationship verification')
    for table in ('campaign_analytics_settings', 'campaign_visitors', 'campaign_registrations', 'campaign_workspace_dedup'):
        if restore.psql(f"SELECT relrowsecurity FROM pg_class WHERE oid='private.{table}'::regclass;") != 't':
            raise RuntimeError('Campaign RLS missing.')
        for role in ('anon', 'authenticated'):
            if restore.psql(f"SELECT has_table_privilege('{role}','private.{table}','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER');") != 'f':
                raise RuntimeError('Campaign client privilege found.')
    for signature in ('record_campaign_event(text,uuid,text,jsonb)', 'revoke_campaign_consent(text)'):
        for role in ('anon', 'authenticated', 'service_role'):
            expected = 't' if role == 'service_role' else 'f'
            if restore.psql(f"SELECT has_function_privilege('{role}','public.{signature}','EXECUTE');") != expected:
                raise RuntimeError('Campaign RPC privileges mismatch.')
    if restore.psql('SELECT dataset FROM private.campaign_analytics_settings;') != 'test':
        raise RuntimeError('Campaign collection must start in test mode.')
    if restore.psql("SELECT has_table_privilege('authenticated','public.product_analytics_events','INSERT');") != 'f':
        raise RuntimeError('Direct analytics insertion remains possible.')
    try:
        restore.psql("BEGIN; SET LOCAL ROLE authenticated; SELECT set_config('request.jwt.claims','{}',true); SELECT public.get_campaign_funnel(now()-interval '1 day',now()); ROLLBACK;", 'non-admin report denial')
    except RuntimeError as exc:
        if str(exc) != 'Restore drill failed during non-admin report denial (SQLSTATE P0001).':
            raise
    else:
        raise RuntimeError('Non-admin campaign report access accepted.')
    print('Campaign rehearsal passed: exact SQL, protected counts, domain functions, FK, RLS, RPC grants, test mode and non-admin denial. No private rows logged.')


def main():
    os.umask(0o077)
    connection = validate_connection(os.environ.get('CUEBOOKER_STAGING_DB_URL', ''))
    sql = checked_migration('release-candidate')
    if restore.command(['supabase', '--version'], 'CLI version').strip() != b'2.119.0':
        raise RuntimeError('Unexpected export CLI version.')
    restore.command(['supabase', 'db', 'dump', '--help'], 'export capability check')
    phrase = secrets.token_hex(32)
    previous = os.environ.get('CUEBOOKER_BACKUP_PASSPHRASE')
    try:
        with tempfile.TemporaryDirectory(prefix='cuebooker-staging-snapshot-') as tmp:
            export_snapshot(connection, Path(tmp), phrase)
            os.environ.pop('CUEBOOKER_STAGING_DB_URL', None)
            os.environ['CUEBOOKER_BACKUP_PASSPHRASE'] = phrase
            restore.main(lambda: rehearse(sql), expected_project=STAGING, export_cli_version='2.119.0', artifact_dir=tmp)
    finally:
        if previous is None:
            os.environ.pop('CUEBOOKER_BACKUP_PASSPHRASE', None)
        else:
            os.environ['CUEBOOKER_BACKUP_PASSPHRASE'] = previous


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(str(exc) if isinstance(exc, RuntimeError) else 'Staging rehearsal failed; private details suppressed.')
        raise SystemExit(1)
