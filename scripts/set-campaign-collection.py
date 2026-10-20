"""Protected, bounded production collection setting; never accepts arbitrary SQL."""
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess

spec = importlib.util.spec_from_file_location('audit', Path(__file__).with_name('audit-campaign-analytics.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


def activation_sql(dataset):
    if dataset not in ('live', 'test'):
        raise RuntimeError('invalid_dataset')
    # Only configuration, not a migration, historical reclassification or immediate purge.
    return """begin;
set local statement_timeout='15s';
set local lock_timeout='2s';
select pg_advisory_xact_lock(641901021);
do $activation$
declare existing cron.job%rowtype;
begin
 if (select count(*) from private.campaign_analytics_settings where singleton)<>1 then
  raise exception 'unexpected_campaign_settings';
 end if;
 if md5(pg_get_functiondef('public.record_campaign_event(text,uuid,text,jsonb)'::regprocedure))<>'334124b6106aa260ac53027e86e3cdd8' or
 md5(pg_get_functiondef('private.purge_campaign_analytics()'::regprocedure))<>'f66503d7a915c3acca884ec81b95b8a6' then
  raise exception 'campaign_function_drift';
 end if;
 select * into existing from cron.job where jobname='cuebooker-prune-campaign-analytics';
 if found then
  if existing.command<>'select private.purge_campaign_analytics();' or existing.schedule<>'17 3 * * *'
   or not existing.active or existing.database<>current_database() or existing.username<>current_user then
   raise exception 'retention_job_conflict';
  end if;
 else
  perform cron.schedule('cuebooker-prune-campaign-analytics','17 3 * * *','select private.purge_campaign_analytics();');
 end if;
 update private.campaign_analytics_settings set dataset='__DATASET__' where singleton;
end $activation$;
commit;
select json_build_object('collection_dataset',s.dataset,'retention_scheduled',exists(
 select 1 from cron.job where jobname='cuebooker-prune-campaign-analytics' and active
 and schedule='17 3 * * *' and command='select private.purge_campaign_analytics();'
 and database=current_database() and username=current_user))
 from private.campaign_analytics_settings s where singleton;
""".replace('__DATASET__', dataset)


def apply(dataset, env, run=subprocess.run):
    # The URI/TLS validation and isolated credential environment are shared with the successful audit.
    env = dict(env)
    env['PGOPTIONS'] = env['PGOPTIONS'].replace('default_transaction_read_only=on', 'default_transaction_read_only=off')
    env['PGAPPNAME'] = 'cuebooker_campaign_collection_setting'
    try:
        result = run(['psql', '--no-psqlrc', '--no-password', '--quiet', '--tuples-only', '--no-align', '--set=ON_ERROR_STOP=1', '--set=VERBOSITY=sqlstate', '--file=-'], input=activation_sql(dataset), env=env, text=True, capture_output=True, timeout=90)
    except Exception:
        raise RuntimeError('setting_result_unknown_reaudit_before_retry') from None
    if result.returncode:
        raise RuntimeError('setting_failed_or_result_unknown_reaudit_no_provider_output')
    try:
        value = json.loads(result.stdout)
        if value != {'collection_dataset': dataset, 'retention_scheduled': True}:
            raise ValueError()
    except Exception:
        raise RuntimeError('setting_verification_failed_reaudit_before_retry') from None
    return value


def main():
    revision = os.environ.get('CUEBOOKER_AUDIT_REVISION', '')
    if (os.environ.get('GITHUB_REF') != 'refs/heads/main' or not re.fullmatch('[a-f0-9]{40}', revision)
            or revision != os.environ.get('CUEBOOKER_AUDIT_REVIEWED_SHA')):
        raise RuntimeError('main_reviewed_revision_required')
    dataset = os.environ.get('CUEBOOKER_COLLECTION_DATASET', '')
    activation_sql(dataset)
    env = audit.connection_environment(os.environ.get('CUEBOOKER_BACKUP_DB_URL', ''))
    with audit.verified_ca_bundle() as bundle:
        env['PGSSLROOTCERT'] = bundle
        value = apply(dataset, env)
    safe = json.dumps({'project': audit.PROJECT, 'revision': revision, **value})
    print(safe)
    summary = os.environ.get('GITHUB_STEP_SUMMARY')
    if summary:
        with open(summary, 'a') as output:
            output.write('## Collection configuration verified\n\n```json\n' + safe + '\n```\n\nExisting test browsers remain test. Retention is scheduled, not yet proven executed.\n')


if __name__ == '__main__':
    try:
        main()
    except RuntimeError as error:
        print('Collection setting stopped: ' + str(error))
        raise SystemExit(1) from None
    except Exception:
        print('Collection setting stopped: unexpected_failure_no_details_disclosed')
        raise SystemExit(1) from None
