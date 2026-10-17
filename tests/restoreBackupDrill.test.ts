import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('restore parser checks every COPY block and safe diagnostics never disclose provider output', () => {
  const result = spawnSync('python3', ['-c', String.raw`
import importlib.util, subprocess
spec=importlib.util.spec_from_file_location('drill','scripts/restore-backup-drill.py')
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
assert m.copy_counts('COPY public.a (id) FROM stdin;\n1\n2\n\\.\nCOPY "auth"."b" (id) FROM stdin;\n\\.\n') == {'public.a':2,'"auth"."b"':0}
assert m.copy_counts('COPY public.a (value) FROM stdin;\ntext\u2028inside\n\\.\n') == {'public.a':1}
for bad in ['COPY public.a (id) FROM stdin;\n1', 'COPY public.a (id) FROM stdin;\n\\.\nCOPY public.a (id) FROM stdin;\n\\.','COPY public.a;evil (id) FROM stdin;','-- no data']:
 try: m.copy_counts(bad)
 except RuntimeError: pass
 else: raise AssertionError('unsafe/incomplete COPY accepted')
def failed(*args,**kwargs):
 assert 'CUEBOOKER_BACKUP_PASSPHRASE' not in kwargs['env']
 assert 'CUEBOOKER_STAGING_DB_URL' not in kwargs['env']
 return subprocess.CompletedProcess(args[0],1,b'PRIVATE ROW',b'ERROR: 42703\nPRIVATE SQL PASSWORD')
m.subprocess.run=failed
try: m.command(['fake'],'verification')
except RuntimeError as error:
 assert str(error)=='Restore drill failed during verification (SQLSTATE 42703).'
else: raise AssertionError('command failure accepted')
`], { encoding: 'utf8', env: { ...process.env, CUEBOOKER_BACKUP_PASSPHRASE: 'fictional-secret', CUEBOOKER_STAGING_DB_URL: 'fictional-staging-secret' } })
  assert.equal(result.status, 0, result.stderr)
})

test('restore targets only fixed disposable container, disconnects before decrypt and cleans up', () => {
  const script = readFileSync('scripts/restore-backup-drill.py', 'utf8')
  assert.match(script, /PROJECT = 'cuebooker-restore-drill'/)
  assert.ok(script.indexOf("'network', 'disconnect'") < script.indexOf("'--decrypt'"))
  assert.match(script, /finally:[\s\S]*'stop', '--no-backup'/)
  assert.match(script, /'--file', '-'/)
  assert.match(script, /'PGPASSWORD=postgres'/)
  assert.match(script, /'psql', '-h', '127.0.0.1'/)
  assert.match(script, /SET session_replication_role = replica/)
  assert.doesNotMatch(script, /db push|db reset|--linked|--db-url|service_role_key|extractall/)
  const workflow = readFileSync('.github/workflows/restore-backup-drill.yml', 'utf8')
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /github.ref == 'refs\/heads\/main'/)
  assert.match(workflow, /environment: production/)
  assert.match(workflow, /name: cuebooker-production-db-38889098646-1/)
  assert.match(workflow, /run-id: 38889098646/)
  assert.doesNotMatch(workflow, /BACKUP_DB_URL|upload-artifact|schedule:|push:|pull_request:/)
})
