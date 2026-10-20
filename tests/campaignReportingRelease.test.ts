import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

function python(body: string) {
 const result=spawnSync('python3',['-c',`import runpy,subprocess\na=runpy.run_path('scripts/deploy-campaign-reporting.py')\n${body}`],{encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}})
 assert.equal(result.status,0,result.stdout+result.stderr)
}
test('report release uses reviewed SQL only, preserves collection and checks deployed definitions and grants',()=>{
 python(`
for rollback in [False,True]:
 sql=a['checked_sql'](rollback)
 assert sql.startswith('begin;') and sql.endswith('commit;\\n')
 assert 'report_function_drift' in sql and 'collector_drift' in sql
 assert 'report_grants_mismatch' in sql and 'migration_version_conflict' in sql
 assert 'update private.campaign_analytics_settings' not in sql
 assert 'create table' not in sql.lower() and 'auth.users set' not in sql
 assert 'supabase_migrations.schema_migrations' in sql
assert "set local role authenticated" in a['VERIFY_SQL']
assert "internal_admin_required" in a['VERIFY_SQL']
assert "create table " not in a['VERIFY_SQL'].lower() and "insert into " not in a['VERIFY_SQL'].lower()
`)
})
test('report execution keeps credentials out of argv and provider errors out of logs',()=>{
 python(`
for result in [subprocess.CompletedProcess([],1,'private-row','secret-password')]:
 try: a['execute']('select 1',{},lambda *args,**kwargs:result)
 except RuntimeError as error:
  assert 'private-row' not in str(error) and 'secret-password' not in str(error)
 else: raise AssertionError('provider error accepted')
# Staging is allowed only when explicitly requested by this environment-specific workflow.
audit=a['audit']
staging='postgresql://postgres.lycprjeuuynfzwskycwv:fictional@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
try: audit.connection_environment(staging)
except RuntimeError: pass
else: raise AssertionError('production accepted staging')
assert audit.connection_environment(staging,project='lycprjeuuynfzwskycwv')['PGSSLMODE']=='verify-full'
`)
})
test('reporting promotion requires staging success, protected production and fresh encrypted backup',()=>{
 const text=readFileSync('.github/workflows/deploy-campaign-reporting.yml','utf8')
 for(const part of ['needs: staging','environment: staging','environment: production','inputs.reviewed_sha == github.sha',"github.ref == 'refs/heads/main'",'contents: read','node scripts/backup-production.mjs','backup-output/database.tar.gz.gpg']) assert.ok(text.includes(part))
 assert.doesNotMatch(text,/supabase db push|pull_request:|push:|contents: write/)
 assert.ok(text.indexOf('Fresh encrypted verified backup')<text.lastIndexOf('Apply only the reviewed report'))
})
