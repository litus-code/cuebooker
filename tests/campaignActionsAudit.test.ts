import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

function python(body: string) {
  const result = spawnSync('python3', ['-c', `import importlib.util,json,subprocess,os\nspec=importlib.util.spec_from_file_location('audit','scripts/audit-campaign-analytics.py')\na=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)\n${body}`], { encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } })
  assert.equal(result.status, 0, result.stderr + result.stdout)
}

test('audit only accepts the intended production database and strengthens TLS without exposing the URI', () => {
  python(`
good='postgresql://postgres.qlocooqfdzehogbwcbhr:fictional-password@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
env=a.connection_environment(good+'?sslmode=require')
assert env['PGSSLMODE']=='verify-full'
assert env['PGSSLROOTCERT']=='/etc/ssl/certs/ca-certificates.crt'
assert 'default_transaction_read_only=on' in env['PGOPTIONS']
assert 'CUEBOOKER_BACKUP_DB_URL' not in env and 'GH_TOKEN' not in env
for value in ['',good.replace('qlocooqfdzehogbwcbhr','lycprjeuuynfzwskycwv'),good.replace(':5432',':6543'),good.replace('fictional-password',''),good+'?sslmode=disable',good+'?host=other.invalid',good+'?sslmode=require&sslmode=require',good.replace('pooler.supabase.com','pooler.supabase.com.other.invalid')]:
 try: a.connection_environment(value)
 except RuntimeError as error: assert str(error)=='production_connection_missing_or_invalid'
 else: raise AssertionError('invalid connection accepted')
`)
})

test('audit SQL checksum excludes arbitrary queries and adds a fixed consented UTC panel window', () => {
  python(`
from pathlib import Path
source=Path('scripts/sql/campaign-analytics-readonly-audit.sql').read_bytes()
sql=a.compile_audit(source)
assert sql.startswith('begin transaction isolation level repeatable read read only;')
assert sql.endswith('rollback;')
assert sql.count("'section',")==9
assert 'v.consent' in sql and "interval '29 days'" in sql
for addition in (b'select 1;',b'insert into anything values(1);'):
 try: a.compile_audit(source+addition)
 except RuntimeError as error: assert str(error)=='reviewed_sql_checksum_mismatch'
 else: raise AssertionError('unreviewed SQL accepted')
`)
})

test('audit returns allowlisted aggregates only and rejects malformed/credential-bearing result shapes', () => {
  python(`
rows={key:[] for key in a.SECTIONS}
rows['settings']=[{'collection_dataset_for_new_browsers':'test'}]
rows['admins']=[{'internal_admin_count':1,'private':'PRIVATE_MARKER'}]
rows['events']=[{'dataset':'test','event_name':'page_view','events':2,'browsers':1,'accounts':0,'workspaces':0,'latest_event':'2026-10-20T12:00:00+00:00','email':'PRIVATE_MARKER'}]
rows['functions']=[{'schema':'private','proname':'PRIVATE_MARKER','arguments':'PRIVATE_MARKER'}]
def encode(): return '\\n'.join(json.dumps({'section':s,'rows':rows[s]}) for s in a.SECTIONS)
result=a.sanitize_output(encode())
assert result['collection_dataset']=='test' and result['events'][0]['events']==2
assert 'PRIVATE_MARKER' not in json.dumps(result)
assert result['functions']==[]
for bad in ('PRIVATE_MARKER',json.dumps({'section':'settings','rows':[]})):
 try: a.sanitize_output(bad)
 except RuntimeError as error: assert 'PRIVATE_MARKER' not in str(error)
 else: raise AssertionError('malformed result accepted')
rows['events'][0]['events']='PRIVATE_MARKER'
try: a.sanitize_output(encode())
except RuntimeError as error: assert 'PRIVATE_MARKER' not in str(error)
else: raise AssertionError('arbitrary event content accepted')
`)
})

test('audit captures provider failures without logging credentials and never passes the URI in process arguments', () => {
  python(`
def run(args,**options):
 assert args[0]=='psql' and '--no-psqlrc' in args and '--no-password' in args
 assert 'PRIVATE_MARKER' not in json.dumps(args)
 assert options['capture_output'] and options['timeout']==90
 return subprocess.CompletedProcess(args,1,stdout='PRIVATE_MARKER',stderr='42501 PRIVATE_MARKER')
try: a.read_snapshot('reviewed SQL',{'PGPASSWORD':'PRIVATE_MARKER'},run)
except RuntimeError as error: assert str(error)=='database_read_permission_denied'
else: raise AssertionError('provider failure ignored')
`)
})

test('workflow requires protected main, exact SHA and manual dispatch; infrastructure never triggers a publication', () => {
  const workflow = readFileSync('.github/workflows/audit-campaign-analytics.yml', 'utf8')
  assert.match(workflow, /environment: production/)
  assert.match(workflow, /github.ref == 'refs\/heads\/main'/)
  assert.match(workflow, /inputs.reviewed_sha == github.sha/)
  assert.match(workflow, /contents: read/)
  assert.match(workflow, /secrets.CUEBOOKER_BACKUP_DB_URL/)
  assert.doesNotMatch(workflow, /pull_request:|push:|schedule:|upload-artifact|contents: write|SUPABASE_ACCESS_TOKEN/)
  const paths = ['.github/workflows/audit-campaign-analytics.yml', '.github/workflows/ci.yml', '.github/workflows/deploy-pages.yml', '.github/workflows/deploy-staging.yml', 'scripts/audit-campaign-analytics.py', 'scripts/certificates/supabase-prod-ca-2021.crt', 'scripts/sql/campaign-analytics-readonly-audit.sql', 'tests/campaignActionsAudit.test.ts', 'docs/CAMPAIGN_ANALYTICS_ACTIONS_AUDIT.md', 'docs/HANDOFF.md']
  for (const file of ['ci.yml', 'deploy-pages.yml', 'deploy-staging.yml']) {
    const text = readFileSync('.github/workflows/' + file, 'utf8')
    const ignored = text.split('    paths-ignore:\n')[1].split(/\n  [a-z]/)[0]
    for (const path of paths) assert.ok(ignored.includes(`'${path}'`), `${file} must exclude infrastructure-only path ${path}`)
    assert.doesNotMatch(ignored, /app\/|supabase\/|package|\*\*/)
  }
})

test('audit adds the reviewed public Supabase CA without disabling certificate or hostname checks', () => {
  python(`
import ssl,hashlib
from pathlib import Path
with a.verified_ca_bundle() as file:
 path=Path(file)
 context=ssl.create_default_context(cafile=file)
 assert context.check_hostname and context.verify_mode==ssl.CERT_REQUIRED
 fingerprints={hashlib.sha256(value).hexdigest() for value in context.get_ca_certs(binary_form=True)}
 assert '807025ad50d4ed219d2c9c7d299c004f824eb00cf7f65afef607d07b72e6cafa' in fingerprints
 assert path.read_bytes().endswith(Path('scripts/certificates/supabase-prod-ca-2021.crt').read_bytes())
assert not path.exists()
`)
})

test('modified Supabase CA fails before connecting and temporary trust files are cleaned on failure', () => {
  python(`
from pathlib import Path
try:
 with a.verified_ca_bundle() as file:
  path=Path(file)
  raise RuntimeError('fixture_failure')
except RuntimeError: pass
assert not path.exists()
a.SUPABASE_CA_HASH='0'*64
try:
 with a.verified_ca_bundle(): raise AssertionError('unreviewed CA accepted')
except RuntimeError as error: assert str(error)=='supabase_ca_checksum_mismatch'
`)
})

test('native PostgreSQL multiline JSON documents survive the psql transport without relaxing output checks', () => {
  python(`
rows={key:[] for key in a.SECTIONS}
rows['settings']=[{'collection_dataset_for_new_browsers':'test'}]
rows['admins']=[{'internal_admin_count':1}]
base={'dataset':'test','events':2,'browsers':1,'accounts':0,'workspaces':0,'latest_event':'2026-10-20T13:00:00+00:00'}
rows['events']=[dict(base,event_name='page_view',private='PRIVATE_MARKER'),dict(base,event_name='signup_click')]
wire='  '+ '\\n\\n'.join(json.dumps({'section':key,'rows':rows[key]},indent=1) for key in a.SECTIONS)+'\\n'
try: [json.loads(line) for line in wire.splitlines() if line.strip()]
except json.JSONDecodeError: pass
else: raise AssertionError('fixture must reproduce the old line parser failure')
def run(args,**options): return subprocess.CompletedProcess(args,0,stdout=wire,stderr='')
result=a.read_snapshot('fixed SQL',{},run)
assert result['collection_dataset']=='test' and len(result['events'])==2
assert 'PRIVATE_MARKER' not in json.dumps(result)
for bad in (wire+'PRIVATE_MARKER',wire[:-8],wire+json.dumps({'section':'PRIVATE_MARKER','rows':[]})):
 try: a.sanitize_output(bad)
 except RuntimeError as error:
  assert str(error)=='unexpected_audit_json_stream_shape_no_raw_output_disclosed'
  assert 'PRIVATE_MARKER' not in str(error)
 else: raise AssertionError('invalid trailing/truncated JSON accepted')
`)
})

test('audit shape errors identify only a fixed section, never a field value or raw PostgreSQL output', () => {
  python(`
rows={key:[] for key in a.SECTIONS}
rows['settings']=[{'collection_dataset_for_new_browsers':'test'}]
rows['admins']=[{'internal_admin_count':1}]
rows['events']=[{'dataset':'test','event_name':'page_view','events':'PRIVATE_MARKER'}]
wire='\\n'.join(json.dumps({'section':key,'rows':rows[key]}) for key in a.SECTIONS)
try: a.sanitize_output(wire)
except RuntimeError as error: assert str(error)=='unexpected_audit_events_shape_no_raw_output_disclosed'
else: raise AssertionError('invalid count accepted')
`)
})
