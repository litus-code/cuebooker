"""Deploy only the reviewed additive reporting migration, never db push."""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess

spec = importlib.util.spec_from_file_location('audit', Path(__file__).with_name('audit-campaign-analytics.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
PROJECTS = {'staging': 'lycprjeuuynfzwskycwv', 'production': audit.PROJECT}
VERSION = '20261020120000'
OLD_HASH = '8ae2cb05582511f24b9152e19a088de9'
NEW_HASH = '8f3118c4eb44785df0aa024e4c39b492'
SIGNATURE = 'public.get_campaign_funnel(timestamptz,timestamptz,text,text,text,text,text)'


def checked_sql(rollback=False):
    root = Path(__file__).resolve().parent.parent
    path, checksum = ('scripts/sql/campaign-reporting-rollback.sql', '7b8e2f06af35b728fd5be5bc7a55d9b0e38ba0d51bf94c067eceed9b340a1bc3') if rollback else ('supabase/migrations/20261020120000_campaign_reporting_diagnostics.sql', '9a3fee73624756aead2250a62b23b01882ad2a4d2bbe0c43d53f73bcc3fc34cc')
    source = (root / path).read_bytes()
    if hashlib.sha256(source).hexdigest() != checksum:
        raise RuntimeError('reviewed_migration_checksum_mismatch')
    sql = source.decode()
    body = sql[sql.index('begin;') + len('begin;'):sql.rindex('commit;')]
    target = OLD_HASH if rollback else NEW_HASH
    ledger = '' if rollback else """insert into supabase_migrations.schema_migrations(version,name,statements)
 values('20261020120000','campaign_reporting_diagnostics',array[$reviewed$""" + sql + """$reviewed$]) on conflict(version) do nothing;"""
    return """begin;
set local statement_timeout='15s'; set local lock_timeout='2s';
select pg_advisory_xact_lock(641901021);
do $guard$
begin
 if md5(pg_get_functiondef('""" + SIGNATURE + """'::regprocedure)) not in ('""" + OLD_HASH + "','" + NEW_HASH + """') then raise exception 'report_function_drift'; end if;
 if md5(pg_get_functiondef('public.record_campaign_event(text,uuid,text,jsonb)'::regprocedure))<>'334124b6106aa260ac53027e86e3cdd8' then raise exception 'collector_drift'; end if;
 if exists(select 1 from supabase_migrations.schema_migrations where version='20261020120000' and name is distinct from 'campaign_reporting_diagnostics') then raise exception 'migration_version_conflict'; end if;
 if not exists(select 1 from private.campaign_analytics_settings where singleton and dataset in ('test','live')) then raise exception 'campaign_settings_missing'; end if;
end $guard$;
""" + body + ledger + """
do $verify$
begin
 if md5(pg_get_functiondef('""" + SIGNATURE + """'::regprocedure))<>'""" + target + """' then raise exception 'report_definition_mismatch'; end if;
 if has_function_privilege('anon','""" + SIGNATURE + """','execute') or not has_function_privilege('authenticated','""" + SIGNATURE + """','execute') then raise exception 'report_grants_mismatch'; end if;
end $verify$;
commit;
"""


VERIFY_SQL = r"""begin read only;
set local statement_timeout='15s';
select set_config('request.jwt.claims','{}',true) as ignored \gset
-- Exercise the actual negative gate without modifying users or admin membership.
do $denial$
begin
 begin
  perform public.get_campaign_funnel(now()-interval '29 days',now());
  raise exception 'anonymous_report_not_denied';
 exception when raise_exception then
  if sqlerrm<>'internal_admin_required' then raise; end if;
 end;
end $denial$;
-- Existing authorized admin only; claims are transaction-local and never printed.
do $claims$
declare admin_id uuid;
begin
 select user_id into admin_id from public.internal_admins order by created_at limit 1;
 if admin_id is null then raise exception 'existing_internal_admin_required'; end if;
 perform set_config('request.jwt.claims',json_build_object('sub',admin_id,'role','authenticated')::text,true);
end $claims$;
set local role authenticated;
select json_build_object('admin_report_readable',true,'collection_dataset',r->>'collection_dataset',
 'test_events',(r->'available_datasets'->>'test')::bigint,'live_events',(r->'available_datasets'->>'live')::bigint,
 'report_steps',jsonb_array_length(r->'rows'),'attempts_present',r ? 'registration_attempts',
 'confirmation_present',r ? 'registration_confirmation')
 from (select public.get_campaign_funnel(date_trunc('day',now())-interval '29 days',date_trunc('day',now())+interval '1 day') as r) q;
rollback;
"""


def execute(sql, env, run=subprocess.run):
    try:
        result = run(['psql', '--no-psqlrc', '--no-password', '--quiet', '--tuples-only', '--no-align', '--set=ON_ERROR_STOP=1', '--set=VERBOSITY=sqlstate', '--file=-'], input=sql, env=env, text=True, capture_output=True, timeout=90)
    except Exception:
        raise RuntimeError('report_result_unknown_reaudit_before_retry') from None
    if result.returncode:
        # Only fixed authored categories; never echo provider SQL, rows or connection data.
        for category in ('report_function_drift','collector_drift','migration_version_conflict',
                         'campaign_settings_missing','report_definition_mismatch','report_grants_mismatch',
                         'existing_internal_admin_required','anonymous_report_not_denied'):
            if category in (result.stderr or ''):
                raise RuntimeError(category + '_reaudit_before_retry')
        raise RuntimeError('report_step_failed_no_provider_output_reaudit_before_retry')
    return result.stdout


def main():
    revision = os.environ.get('CUEBOOKER_AUDIT_REVISION', '')
    if (os.environ.get('GITHUB_REF') != 'refs/heads/main' or not re.fullmatch('[a-f0-9]{40}', revision)
            or revision != os.environ.get('CUEBOOKER_AUDIT_REVIEWED_SHA')):
        raise RuntimeError('main_reviewed_revision_required')
    environment = os.environ.get('CUEBOOKER_REPORT_ENVIRONMENT', '')
    if environment not in PROJECTS:
        raise RuntimeError('invalid_report_environment')
    rollback = os.environ.get('CUEBOOKER_REPORT_ACTION') == 'rollback'
    if os.environ.get('CUEBOOKER_REPORT_ACTION') not in ('deploy','rollback'):
        raise RuntimeError('invalid_report_action')
    sql = checked_sql(rollback)
    env = audit.connection_environment(os.environ.get('CUEBOOKER_REPORT_DB_URL', ''), project=PROJECTS[environment])
    with audit.verified_ca_bundle() as bundle:
        env['PGSSLROOTCERT'] = bundle
        writable = dict(env)
        writable['PGOPTIONS'] = env['PGOPTIONS'].replace('default_transaction_read_only=on','default_transaction_read_only=off')
        execute(sql, writable)
        if rollback:
            safe = {'rollback_verified': True}
        else:
            try:
                result = json.loads(execute(VERIFY_SQL, env))
                assert set(result) == {'admin_report_readable','collection_dataset','test_events','live_events','report_steps','attempts_present','confirmation_present'}
                assert result['collection_dataset'] in ('test','live') and result['report_steps'] == 6
                assert all(result[k] is True for k in ('admin_report_readable','attempts_present','confirmation_present'))
                assert all(type(result[k]) is int and result[k] >= 0 for k in ('test_events','live_events'))
                safe = result
            except Exception:
                raise RuntimeError('deployed_report_verification_failed_no_raw_output') from None
    safe.update(environment=environment,revision=revision)
    output = json.dumps(safe)
    print(output)
    if os.environ.get('GITHUB_STEP_SUMMARY'):
        with open(os.environ['GITHUB_STEP_SUMMARY'],'a') as summary:
            summary.write('## Reporting backend result\n\n```json\n'+output+'\n```\n')


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as error:
        print('Reporting deployment stopped: '+str(error))
        raise SystemExit(1) from None
    except Exception:
        print('Reporting deployment stopped: unexpected_failure_no_details_disclosed')
        raise SystemExit(1) from None
