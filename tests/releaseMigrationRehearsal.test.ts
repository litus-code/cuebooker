import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

test('rehearsal rejects changed SQL, reordered manifests and traversal paths', () => {
  const r = spawnSync('python3', ['-c', String.raw`
import importlib.util,json,tempfile,pathlib
s=importlib.util.spec_from_file_location('rehearsal','scripts/rehearse-release-migrations.py')
m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
entries=json.loads(pathlib.Path('scripts/release-migration-manifest.json').read_text())
assert len(m.load_migrations('.', 'scripts/release-migration-manifest.json'))==26
with tempfile.TemporaryDirectory() as t:
 p=pathlib.Path(t)/'manifest.json'
 for bad in [entries[::-1],entries[:-1],[dict(e,sha256='0'*64) for e in entries],[dict(e,path='../../secret') for e in entries]]:
  p.write_text(json.dumps(bad))
  try:m.load_migrations('.',p)
  except RuntimeError:pass
  else:raise AssertionError('unsafe manifest accepted')
`], { encoding: 'utf8' })
  assert.equal(r.status, 0, r.stderr)
})

test('rehearsal has only exact disconnected restore destination and no hosted credentials', () => {
  const workflow = readFileSync('.github/workflows/rehearse-release-migrations.yml', 'utf8')
  assert.match(workflow, /ref: c949e0e9a2ec392478d067a52d0caec3844e8f8e/)
  assert.match(workflow, /inputs.confirm == 'cuebooker-isolated-release'/)
  assert.match(workflow, /persist-credentials: false/)
  assert.doesNotMatch(workflow, /BACKUP_DB_URL|SERVICE_ROLE|upload-artifact|schedule:|push:|pull_request:/)
  const script = readFileSync('scripts/rehearse-release-migrations.py', 'utf8')
  assert.match(script, /restore.main\(rehearse\)/)
  assert.match(script, /AND NOT active/)
  assert.doesNotMatch(script, /--db-url|--linked|db push|db reset/)
})
