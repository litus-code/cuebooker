import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

function python(body: string) {
 const r=spawnSync('python3',['-c',`import importlib.util,subprocess,json\nspec=importlib.util.spec_from_file_location('collection','scripts/set-campaign-collection.py')\na=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)\n${body}`],{encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}})
 assert.equal(r.status,0,r.stdout+r.stderr)
}

test('collection rejects injected modes and keeps historical identities, events and permissions unchanged',()=>{
 python(`
for mode in ['','LIVE',"live';delete from auth.users;--"]:
 try: a.activation_sql(mode)
 except RuntimeError: pass
 else: raise AssertionError('unbounded mode')
for mode in ['test','live']:
 sql=a.activation_sql(mode)
 assert "set dataset='"+mode+"' where singleton" in sql
 assert 'campaign_function_drift' in sql and 'retention_job_conflict' in sql
 assert 'pg_advisory_xact_lock' in sql
 assert 'delete from' not in sql.lower() and 'update private.campaign_visitors' not in sql.lower()
 assert 'create function' not in sql.lower() and 'grant ' not in sql.lower()
`)
})

test('collection verifies response, preserves TLS and refuses to leak provider errors on uncertain writes',()=>{
 python(`
env=a.audit.connection_environment('postgresql://postgres.qlocooqfdzehogbwcbhr:secret-marker@aws-0-eu-west-1.pooler.supabase.com:5432/postgres')
def success(args,**kw):
 assert 'secret-marker' not in str(args)
 assert kw['env']['PGSSLMODE']=='verify-full'
 assert 'default_transaction_read_only=off' in kw['env']['PGOPTIONS']
 assert '--set=ON_ERROR_STOP=1' in args
 return subprocess.CompletedProcess(args,0,' {"collection_dataset":"live","retention_scheduled":true} ', '')
assert a.apply('live',env,success)['collection_dataset']=='live'
for result in [subprocess.CompletedProcess([],1,'','secret-marker'),subprocess.CompletedProcess([],0,'secret-marker',''),subprocess.CompletedProcess([],0,'{"collection_dataset":"test","retention_scheduled":true}','')]:
 try: a.apply('live',env,lambda *args,**kwargs:result)
 except RuntimeError as error: assert 'secret-marker' not in str(error) and 'reaudit' in str(error)
 else: raise AssertionError('unverified success')
assert 'default_transaction_read_only=on' in env['PGOPTIONS']
`)
})

test('collection is protected, manual and cannot trigger an application publication on integration',()=>{
 const workflow=readFileSync('.github/workflows/set-campaign-collection.yml','utf8')
 for (const value of ['environment: production',"github.ref == 'refs/heads/main'",'inputs.reviewed_sha == github.sha','contents: read','secrets.CUEBOOKER_BACKUP_DB_URL','python3 scripts/audit-campaign-analytics.py']) assert.ok(workflow.includes(value))
 assert.doesNotMatch(workflow,/push:|pull_request:|schedule:|upload-artifact|contents: write/)
 for(const file of ['ci.yml','deploy-pages.yml','deploy-staging.yml']) {
  const ignored=readFileSync('.github/workflows/'+file,'utf8').split('    paths-ignore:\n')[1].split(/\n  [a-z]/)[0]
  for(const path of ['.github/workflows/set-campaign-collection.yml','scripts/set-campaign-collection.py','tests/campaignCollection.test.ts']) assert.ok(ignored.includes(`'${path}'`))
 }
})
