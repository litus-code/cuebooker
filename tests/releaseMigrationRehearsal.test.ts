import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('rehearsal rejects changed SQL, reordered manifests and traversal paths', () => {
  const r = spawnSync('python3', ['-c', String.raw`
import importlib.util,json,tempfile,pathlib,hashlib
s=importlib.util.spec_from_file_location('rehearsal','scripts/rehearse-release-migrations.py')
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
entries=json.loads(pathlib.Path('scripts/release-migration-manifest.json').read_text())
with tempfile.TemporaryDirectory() as t:
 root=pathlib.Path(t)
 entries=[]
 for i in range(39):
  name=f'supabase/migrations/{20301004000000+i}_fictional.sql'
  file=root/name;file.parent.mkdir(parents=True,exist_ok=True);file.write_text('select 1;')
  entries.append(dict(path=name,sha256=hashlib.sha256(file.read_bytes()).hexdigest()))
 p=pathlib.Path(t)/'manifest.json'
 p.write_text(json.dumps(entries))
 assert len(m.load_migrations(root,p))==39
 for bad in [entries[::-1],entries[:-1],[dict(e,sha256='0'*64) for e in entries],[dict(e,path='../../secret') for e in entries]]:
  p.write_text(json.dumps(bad))
  try:m.load_migrations(root,p)
  except RuntimeError:pass
  else:raise AssertionError('unsafe manifest accepted')
`], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
})

test('rehearsal has only exact disconnected restore destination and no hosted credentials', () => {
  const workflow = readFileSync('.github/workflows/rehearse-release-migrations.yml', 'utf8')
  assert.match(workflow, /ref: 9bd56509bb9aba2176b55483988df80c05b1fd6a/)
  assert.match(workflow, /inputs.confirm == 'cuebooker-isolated-release'/)
  assert.match(workflow, /persist-credentials: false/)
  assert.match(workflow, /name: cuebooker-production-db-38889098646-1/)
  assert.match(workflow, /run-id: 38889098646/)
  assert.match(workflow, /github.ref == 'refs\/heads\/main'/)
  assert.doesNotMatch(workflow, /BACKUP_DB_URL|SERVICE_ROLE|upload-artifact|schedule:|push:|pull_request:/)
  const script = readFileSync('scripts/rehearse-release-migrations.py', 'utf8')
  assert.match(script, /restore.main\(rehearse\)/)
  assert.match(script, /AND NOT active/)
  assert.doesNotMatch(script, /--db-url|--linked|db push|db reset/)
  for (const path of ['.github/workflows/ci.yml', '.github/workflows/deploy-pages.yml']) {
    const source = readFileSync(path, 'utf8')
    for (const ignored of ['rehearse-release-migrations.yml', 'rehearse-release-migrations.py', 'release-migration-manifest.json', 'releaseMigrationRehearsal.test.ts', 'RELEASE_REHEARSAL_STATUS.md']) assert.ok(source.includes(ignored))
  }
})

test('rehearsal rejects missing or changed production-only functions and triggers', () => {
  const r = spawnSync('python3', ['-c', String.raw`
import importlib.util
s=importlib.util.spec_from_file_location('rehearsal','scripts/rehearse-release-migrations.py')
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
answers=list(m.PRESERVED_FUNCTIONS.values())+list(m.PRESERVED_TRIGGERS.values())
def verify(values):
 it=iter(values)
 m.restore.psql=lambda *args,**kwargs:next(it)
 m.verify_production_behaviors()
verify(answers)
for index in range(len(answers)):
 changed=answers.copy();changed[index]=''
 try:verify(changed)
 except RuntimeError:pass
 else:raise AssertionError('Missing production-only behavior accepted')
 changed[index]='0'*32
 try:verify(changed)
 except RuntimeError:pass
 else:raise AssertionError('Changed production-only behavior accepted')
`], {encoding:'utf8'})
  assert.equal(r.status,0,r.stderr)
})
