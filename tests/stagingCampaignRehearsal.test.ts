import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

function python(body: string) {
  const preamble = `import importlib.util, os, pathlib, tempfile, hashlib, subprocess\nspec=importlib.util.spec_from_file_location('script','scripts/rehearse-staging-campaign.py')\nscript=importlib.util.module_from_spec(spec); spec.loader.exec_module(script)\n`
  const result = spawnSync('python3', ['-c', preamble + body], { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
}

test('staging export accepts only its exact project with verified TLS and session port', () => {
  python(String.raw`
good='postgresql://postgres.lycprjeuuynfzwskycwv:fictional-secret@aws-0-eu-west-1.pooler.supabase.com:5432/postgres'
assert script.validate_connection(good).endswith('?sslmode=verify-full&sslrootcert=system')
assert script.validate_connection('postgresql://postgres:fictional-secret@db.lycprjeuuynfzwskycwv.supabase.co/postgres')
for value in ['',good.replace('lycprjeuuynfzwskycwv','qlocooqfdzehogbwcbhr'),good.replace(':5432',':6543'),good+'?sslmode=disable',good+'?sslmode=require',good+'?sslmode=verify-full&sslmode=verify-full',good+'?options=anything',good.replace('supabase.com','supabase.com.evil.example')]:
 try: script.validate_connection(value)
 except RuntimeError as error:
  assert str(error)=='Missing or invalid secure staging database connection.'
  assert 'fictional-secret' not in str(error)
 else: raise AssertionError('unsafe connection accepted')
try: script.restore.main(expected_project=script.STAGING,export_cli_version='2.79.0')
except RuntimeError as error: assert str(error)=='Unsupported isolated restore source.'
else: raise AssertionError('unsupported source accepted')
`)
})

test('export encrypts the three read-only dumps, passes phrase on stdin and removes plaintext', () => {
  python(String.raw`
calls=[]
def fake(args, stage, **kwargs):
 calls.append((args,kwargs))
 if args[0]=='supabase': pathlib.Path(args[args.index('--file')+1]).write_text('COPY public.example (id) FROM stdin;\n1\n\\.\n')
 elif args[0]=='gpg': pathlib.Path(args[args.index('--output')+1]).write_bytes(b'fictional-ciphertext')
 return b''
script.restore.command=fake
with tempfile.TemporaryDirectory() as tmp:
 target=pathlib.Path(tmp)
 script.export_snapshot('fictional-connection',target,'fictional-phrase')
 assert {p.name for p in target.iterdir()}=={'database.tar.gz.gpg','database.tar.gz.gpg.sha256'}
 assert len(calls)==4
 assert all(c[0][:3]==['supabase','db','dump'] for c in calls[:3])
 assert '--role-only' in calls[0][0] and '--data-only' in calls[2][0] and '--use-copy' in calls[2][0]
 assert calls[3][1]['input']==b'fictional-phrase\n' and 'fictional-phrase' not in calls[3][0]
 assert (target/'database.tar.gz.gpg.sha256').read_text().strip()==hashlib.sha256(b'fictional-ciphertext').hexdigest()
`)
})

test('migration tampering fails and isolated restore failure removes temporary files and phrase', () => {
  python(String.raw`
with tempfile.TemporaryDirectory() as tmp:
 path=pathlib.Path(tmp)/script.MIGRATION; path.parent.mkdir(parents=True); path.write_text('altered SQL')
 try: script.checked_migration(tmp)
 except RuntimeError as error: assert str(error)=='Reviewed migration checksum mismatch.'
 else: raise AssertionError('tampered migration accepted')
script.checked_migration=lambda _: 'reviewed SQL'
script.restore.command=lambda args,*a,**kw: b'2.119.0' if args==['supabase','--version'] else b''
paths=[]
def fake_export(connection,target,phrase):
 paths.append(target); (target/'database.tar.gz.gpg').write_bytes(b'fake'); assert len(phrase)==64
def fake_restore(callback,**kwargs):
 assert 'CUEBOOKER_STAGING_DB_URL' not in os.environ
 assert len(os.environ['CUEBOOKER_BACKUP_PASSPHRASE'])==64
 assert kwargs['expected_project']==script.STAGING and kwargs['export_cli_version']=='2.119.0'
 raise RuntimeError('controlled restore failure')
script.export_snapshot=fake_export; script.restore.main=fake_restore
os.environ.pop('CUEBOOKER_BACKUP_PASSPHRASE',None)
os.environ['CUEBOOKER_STAGING_DB_URL']='postgresql://postgres:fictional@db.lycprjeuuynfzwskycwv.supabase.co/postgres'
try: script.main()
except RuntimeError as error: assert str(error)=='controlled restore failure'
else: raise AssertionError('restore failure suppressed')
assert not paths[0].exists() and 'CUEBOOKER_BACKUP_PASSPHRASE' not in os.environ
`)
})

test('workflow pins reviewed source, stays manual/main/staging and never uploads data', () => {
  const workflow = readFileSync('.github/workflows/rehearse-staging-campaign.yml', 'utf8')
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /github.ref == 'refs\/heads\/main'/)
  assert.match(workflow, /environment: staging/)
  assert.match(workflow, /ref: 7111f156aefa09dfab8cad721422607460d9c4be/)
  assert.match(workflow, /contents: read/)
  assert.doesNotMatch(workflow, /upload-artifact|environment: production|BACKUP_DB_URL|schedule:|pull_request:|push:/)
  for (const path of ['.github/workflows/ci.yml', '.github/workflows/deploy-pages.yml']) {
    const source = readFileSync(path, 'utf8')
    for (const ignored of ['rehearse-staging-campaign.yml', 'rehearse-staging-campaign.py', 'restore-backup-drill.py', 'stagingCampaignRehearsal.test.ts']) assert.ok(source.includes(ignored))
  }
})
