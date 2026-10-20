"""Fixed, read-only production audit. Never prints provider output or credentials."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
from contextlib import contextmanager
from urllib.parse import parse_qsl, unquote, urlsplit

PROJECT = 'qlocooqfdzehogbwcbhr'
SQL_HASH = 'a087fe4542211317bb84dd8a9a5bbd70d1f7c86c63510bb7330d07b10c01e073'
SUPABASE_CA_HASH = '700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7'
SOURCE_SECTIONS = ('settings', 'migrations', 'events', 'instagram', 'functions', 'rls', 'admins', 'retention')
SECTIONS = SOURCE_SECTIONS + ('panel_default_window',)
PANEL_QUERY = """select e.dataset,e.event_name,count(*) as events,
 count(distinct e.campaign_visitor_id) as browsers,count(distinct e.user_id) as accounts,
 count(distinct e.workspace_id) as workspaces,max(e.created_at) as latest_event
 from public.product_analytics_events e join private.campaign_visitors v
 on v.id=e.campaign_visitor_id and v.consent
 where e.dataset in ('test','live')
 and e.created_at>=date_trunc('day',now())-interval '29 days'
 and e.created_at<date_trunc('day',now())+interval '1 day'
 group by e.dataset,e.event_name order by e.dataset,e.event_name"""
EVENTS = {'page_view', 'signup_click', 'signup_started', 'signup_completed',
          'onboarding_completed', 'artist_profile_published', 'agency_catalog_published',
          'workspace_first_request_received'}
FUNCTIONS = {'get_campaign_funnel', 'record_campaign_event', 'revoke_campaign_consent',
             'purge_campaign_analytics', 'is_internal_admin'}
TABLES = {'campaign_analytics_settings', 'campaign_visitors', 'campaign_registrations',
          'campaign_workspace_dedup'}
MIGRATIONS = {'add_internal_beta_analytics', 'campaign_funnel_analytics',
              'campaign_foreign_key_indexes', 'campaign_reporting_diagnostics'}


@contextmanager
def verified_ca_bundle():
    # Public Supabase CA, pinned in review; never fetch trust roots during a secret-bearing job.
    certificate = Path(__file__).with_name('certificates').joinpath('supabase-prod-ca-2021.crt').read_bytes()
    if hashlib.sha256(certificate).hexdigest() != SUPABASE_CA_HASH:
        raise RuntimeError('supabase_ca_checksum_mismatch')
    system = Path('/etc/ssl/certs/ca-certificates.crt').read_bytes()
    with tempfile.TemporaryDirectory(prefix='cuebooker-audit-ca-') as directory:
        path = Path(directory) / 'trusted-roots.pem'
        path.write_bytes(system + b'\n' + certificate)
        yield str(path)


def connection_environment(value, project=PROJECT):
    try:
        if project not in (PROJECT, 'lycprjeuuynfzwskycwv'):
            raise ValueError()
        url = urlsplit(value)
        direct = url.hostname == f'db.{project}.supabase.co' and url.username == 'postgres'
        pooler = bool(re.fullmatch(r'aws-\d+-[a-z0-9-]+\.pooler\.supabase\.com', url.hostname or '')) and url.username == f'postgres.{project}'
        options = parse_qsl(url.query, keep_blank_values=True)
        if (url.scheme not in ('postgres', 'postgresql') or not (direct or pooler)
                or url.path != '/postgres' or url.port not in (None, 5432)
                or not url.password or url.fragment
                or len(options) != len(dict(options))
                or any(k not in ('sslmode', 'sslrootcert') for k, _ in options)
                or dict(options).get('sslmode', 'verify-full') not in ('require', 'verify-ca', 'verify-full')
                or dict(options).get('sslrootcert', 'system') != 'system'):
            raise ValueError()
        password = unquote(url.password, errors='strict')
        if not password or '\0' in password:
            raise ValueError()
        # Do not pass a secret URI in argv or inherit PGSERVICE/PGOPTIONS/other secrets.
        env = {k: os.environ[k] for k in ('PATH', 'LANG', 'LC_ALL', 'TZ') if k in os.environ}
        env.update(PGHOST=url.hostname, PGPORT='5432', PGDATABASE='postgres',
                   PGUSER=url.username, PGPASSWORD=password, PGCONNECT_TIMEOUT='10',
                   PGSSLMODE='verify-full', PGSSLROOTCERT='/etc/ssl/certs/ca-certificates.crt',
                   PGAPPNAME='cuebooker_campaign_readonly_audit',
                   PGOPTIONS='-c default_transaction_read_only=on -c timezone=UTC -c statement_timeout=15000 -c lock_timeout=2000 -c idle_in_transaction_session_timeout=15000')
        return env
    except Exception:
        raise RuntimeError('production_connection_missing_or_invalid') from None


def compile_audit(source):
    if hashlib.sha256(source).hexdigest() != SQL_HASH:
        raise RuntimeError('reviewed_sql_checksum_mismatch')
    lines = '\n'.join(line.split('--', 1)[0] for line in source.decode().splitlines())
    statements = [s.strip() for s in lines.split(';') if s.strip()]
    if (len(statements) != len(SOURCE_SECTIONS) + 2 or statements[0].lower() != 'begin transaction read only'
            or statements[-1].lower() != 'rollback' or any(not s.lower().startswith('select ') for s in statements[1:-1])):
        raise RuntimeError('reviewed_sql_shape_invalid')
    # One coherent read snapshot, then explicit rollback. No user SQL or SQL parameters.
    queries = ['begin transaction isolation level repeatable read read only;']
    for section, query in list(zip(SOURCE_SECTIONS, statements[1:-1])) + [('panel_default_window', PANEL_QUERY)]:
        queries.append("select json_build_object('section','" + section + "','rows',coalesce(json_agg(audit_rows),'[]'::json)) from (" + query + ') audit_rows;')
    return '\n'.join(queries + ['rollback;'])


def integer(value):
    if type(value) is not int or value < 0:
        raise ValueError()
    return value


def boolean(value):
    if type(value) is not bool:
        raise ValueError()
    return value


def timestamp(value):
    if value is None:
        return None
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d\d-\d\d[T ]\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d(?::\d\d)?)', value):
        raise ValueError()
    return value


def sanitize_output(output):
    """Allowlisted aggregate fields only. Unknown names/provider text never get printed."""
    phase = 'json_stream'
    try:
        if len(output) > 1024 * 1024:
            raise ValueError()
        # json_agg(composite) inserts literal newlines. psql's unaligned mode does
        # not remove them: parse complete JSON documents, never individual lines.
        decoder = json.JSONDecoder()
        remaining = output.lstrip()
        documents = []
        while remaining:
            document, end = decoder.raw_decode(remaining)
            documents.append(document)
            if len(documents) > len(SECTIONS):
                raise ValueError()
            remaining = remaining[end:].lstrip()
        phase = 'sections'
        if [d['section'] for d in documents] != list(SECTIONS) or any(not isinstance(d['rows'], list) for d in documents):
            raise ValueError()
        data = {d['section']: d['rows'] for d in documents}
        phase = 'settings'
        if len(data['settings']) != 1 or data['settings'][0]['collection_dataset_for_new_browsers'] not in ('test', 'live'):
            raise ValueError()
        result = {'collection_dataset': data['settings'][0]['collection_dataset_for_new_browsers'], 'events': [], 'panel_default_window': [], 'instagram': [], 'migrations': [], 'functions': [], 'private_rls': [], 'retention': []}
        for section in ('events', 'panel_default_window'):
            phase = section
            for row in data[section]:
                if row['dataset'] not in ('test', 'live') or row['event_name'] not in EVENTS:
                    raise ValueError()
                result[section].append({**{k: row[k] for k in ('dataset', 'event_name')}, **{k: integer(row[k]) for k in ('events', 'browsers', 'accounts', 'workspaces')}, 'latest_event': timestamp(row['latest_event'])})
        phase = 'instagram'
        for row in data['instagram']:
            if row['dataset'] not in ('test', 'live'):
                raise ValueError()
            result['instagram'].append({'dataset': row['dataset'], **{k: integer(row[k]) for k in ('instagram_events', 'instagram_browsers')}})
        phase = 'migrations'
        for row in data['migrations']:
            if row['name'] in MIGRATIONS:
                if not re.fullmatch(r'\d{14}', row['version']):
                    raise ValueError()
                result['migrations'].append({'name': row['name'], 'version': row['version']})
        phase = 'functions'
        for row in data['functions']:
            if row['schema'] in ('public', 'private') and row['proname'] in FUNCTIONS:
                if not re.fullmatch('[a-f0-9]{32}', row['source_hash']):
                    raise ValueError()
                result['functions'].append({'schema': row['schema'], 'name': row['proname'], 'hash': row['source_hash'], **{k: boolean(row[k]) for k in ('security_definer', 'anon_execute', 'authenticated_execute', 'service_execute')}})
        phase = 'rls'
        for row in data['rls']:
            if row['schema'] == 'private' and row['relname'] in TABLES:
                result['private_rls'].append({'table': row['relname'], **{k: boolean(row[k]) for k in ('relrowsecurity', 'anon_select', 'authenticated_select')}})
        phase = 'admins'
        if len(data['admins']) != 1:
            raise ValueError()
        result['internal_admin_count'] = integer(data['admins'][0]['internal_admin_count'])
        phase = 'retention'
        for row in data['retention']:
            if row['jobname'] != 'cuebooker-prune-campaign-analytics' or not re.fullmatch(r'[\d\s*/,-]{1,80}', row['schedule']):
                raise ValueError()
            status = row['last_status']
            result['retention'].append({'jobid': integer(row['jobid']), 'active': boolean(row['active']), 'schedule': row['schedule'], 'last_status': status if status in (None, 'succeeded', 'failed', 'running', 'starting', 'connecting', 'sending') else 'other', 'last_finished': timestamp(row['last_finished'])})
        return result
    except Exception:
        raise RuntimeError(f'unexpected_audit_{phase}_shape_no_raw_output_disclosed') from None


def read_snapshot(sql, env, run=subprocess.run):
    try:
        result = run(['psql', '--no-psqlrc', '--no-password', '--quiet', '--tuples-only', '--no-align', '--set=ON_ERROR_STOP=1', '--set=VERBOSITY=sqlstate', '--file=-'], input=sql, env=env, text=True, capture_output=True, timeout=90)
    except Exception:
        raise RuntimeError('database_client_unavailable_or_timed_out') from None
    if result.returncode:
        # Fixed categories only, never print provider errors, SQL, connection or rows.
        details = result.stderr or ''
        code = next((value for pattern, value in [
            ('password authentication failed', 'database_authentication_rejected'),
            ('certificate verify failed', 'database_tls_verification_failed'),
            ('could not translate host name', 'database_dns_unavailable'),
            ('Connection refused', 'database_connection_refused'),
            ('42501', 'database_read_permission_denied'),
            ('42P01', 'audit_dependency_relation_missing'),
            ('42883', 'audit_dependency_function_missing'),
            ('57014', 'audit_statement_timed_out'),
        ] if pattern in details), 'database_audit_failed_no_provider_output_disclosed')
        raise RuntimeError(code)
    return sanitize_output(result.stdout)


def main():
    revision = os.environ.get('CUEBOOKER_AUDIT_REVISION', '')
    if (os.environ.get('GITHUB_REF') != 'refs/heads/main' or not re.fullmatch('[a-f0-9]{40}', revision)
            or revision != os.environ.get('CUEBOOKER_AUDIT_REVIEWED_SHA')):
        raise RuntimeError('main_reviewed_revision_required')
    sql = compile_audit(Path(__file__).with_name('sql').joinpath('campaign-analytics-readonly-audit.sql').read_bytes())
    env = connection_environment(os.environ.get('CUEBOOKER_BACKUP_DB_URL', ''))
    with verified_ca_bundle() as bundle:
        env['PGSSLROOTCERT'] = bundle
        first = read_snapshot(sql, env)
        time.sleep(10)
        second = read_snapshot(sql, env)
    report = {'project': PROJECT, 'revision': revision, 'interval_seconds': 10,
              'first': first, 'second': second,
              'limits': 'Read-only persisted aggregates, no event injection. New natural facts may appear or be removed by retention/withdrawal. Does not prove a specific browser-to-Edge-to-panel journey or an individual admin permission.'}
    safe = json.dumps(report, indent=2)
    print(safe)
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a') as output:
            output.write('## Production campaign audit — read only\n\n```json\n' + safe + '\n```\n')


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as error:
        # All RuntimeErrors above are authored constants. Suppress unexpected exceptions.
        print('Audit stopped: ' + str(error))
        raise SystemExit(1) from None
    except Exception:
        print('Audit stopped: unexpected_failure_no_details_disclosed')
        raise SystemExit(1) from None
