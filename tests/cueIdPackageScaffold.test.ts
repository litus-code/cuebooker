import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

import { scaffoldCueIdV2Package } from '../scripts/lib/cue-id-package-scaffold.mjs'

test('scaffolds the complete CUE ID V2 working package', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cue-id-scaffold-'))
  const result = await scaffoldCueIdV2Package(root, '2.0.0')

  const manifest = JSON.parse(
    await readFile(join(result.dirs.manifest, 'manifest.draft.json'), 'utf8')
  )
  const evidence = JSON.parse(
    await readFile(join(result.dirs.manifest, 'evidence.draft.json'), 'utf8')
  )
  const metadata = JSON.parse(
    await readFile(join(result.dirs.manifest, 'asset-metadata.draft.json'), 'utf8')
  )
  const sculptReview = JSON.parse(
    await readFile(join(result.dirs.manifest, 'sculpt-review.draft.json'), 'utf8')
  )
  const mobileReview = JSON.parse(
    await readFile(join(result.dirs.manifest, 'mobile-review.draft.json'), 'utf8')
  )
  const performanceReview = JSON.parse(
    await readFile(join(result.dirs.manifest, 'performance-review.draft.json'), 'utf8')
  )
  const bindings = await readFile(join(result.dirs.manifest, 'bindings.md'), 'utf8')
  const sculptSpec = await readFile(join(result.root, 'SCULPT_SPEC.md'), 'utf8')
  const readme = await readFile(join(result.root, 'README.md'), 'utf8')

  assert.equal(manifest.assetVersion, '2.0.0')
  assert.deepEqual(manifest.static.variants, {})
  assert.deepEqual(manifest.bindings.morphs, {})
  assert.equal(evidence.assetVersion, '2.0.0')
  assert.equal(evidence.visualReview, false)
  assert.equal(evidence.performance.full, null)
  assert.equal(metadata.assetVersion, '2.0.0')
  assert.equal(sculptReview.assetVersion, '2.0.0')
  assert.equal(sculptReview.gates.A_regularBases.status, 'pending')
  assert.equal(sculptReview.gates.E_productSize.status, 'pending')
  assert.equal(mobileReview.assetVersion, '2.0.0')
  assert.equal(mobileReview.status, 'pending')
  assert.equal(performanceReview.assetVersion, '2.0.0')
  assert.equal(performanceReview.tiers.full.totalReadyMs, null)
  assert.equal(performanceReview.tiers.reduced.totalReadyMs, null)
  assert.match(bindings, /feminine \/ neutral \/ masculine reviewed on regular build/)
  assert.match(bindings, /Canonical reference:/)
  assert.match(bindings, /cue_base_feminine/)
  assert.match(bindings, /cue_base_masculine/)
  assert.match(bindings, /cue_build_slim/)
  assert.match(bindings, /cue_build_strong/)
  assert.match(bindings, /cue_pose_editorial/)
  assert.match(bindings, /cue_outfit_tee/)
  assert.match(bindings, /cue_mat_body/)
  assert.match(bindings, /CUE_ID_AUTHORED_BINDINGS_V2\.md/)
  assert.match(sculptSpec, /Base and build are independent semantic dimensions/)
  assert.match(sculptSpec, /feminine \+ regular/)
  assert.match(sculptSpec, /masculine \+ regular/)
  assert.match(sculptSpec, /CUE_ID_AUTHORED_BINDINGS_V2\.md/)
  assert.match(readme, /SCULPT_SPEC\.md/)
  assert.match(readme, /Human review before catalogue admission/)
})

test('requires an x.y.z asset version', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cue-id-scaffold-'))

  await assert.rejects(
    () => scaffoldCueIdV2Package(root, 'v2'),
    /x\.y\.z format/
  )
})

test('never overwrites an existing scaffold file', async () => {
  const root = await mkdtemp(join(tmpdir(), 'cue-id-scaffold-'))
  const result = await scaffoldCueIdV2Package(root, '2.0.0')
  const readmePath = join(result.root, 'README.md')

  await writeFile(readmePath, 'keep me', 'utf8')

  await assert.rejects(
    () => scaffoldCueIdV2Package(root, '2.0.0'),
    /Refusing to overwrite existing file/
  )

  assert.equal(await readFile(readmePath, 'utf8'), 'keep me')
})
