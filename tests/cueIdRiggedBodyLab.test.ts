import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  CUE_ID_RIGGED_BODY_LAB_ASSETS,
  getCueIdRiggedBodyLabAsset
} from '../app/domain/cueIdRiggedBodyLab.ts'

test('V10 rigged bodies stay lab-only and expose semantic nodes', () => {
  const male = getCueIdRiggedBodyLabAsset('male')
  const female = getCueIdRiggedBodyLabAsset('female')

  assert.equal(male.version, 'v10')
  assert.equal(female.version, 'v10')
  assert.equal(male.productionReady, false)
  assert.equal(female.productionReady, false)
  assert.match(male.glbPath, /^\/cue-id\/lab\/bodies\//)
  assert.match(female.glbPath, /^\/cue-id\/lab\/bodies\//)
  assert.equal(male.semanticNodes.skin, 'cue_male_skin')
  assert.equal(female.semanticNodes.skin, 'cue_female_skin')
  assert.equal(male.sourceHair, 'fade')
  assert.equal(female.sourceHair, 'tied-back')
  assert.equal(Object.keys(CUE_ID_RIGGED_BODY_LAB_ASSETS).length, 2)
})

test('stylized workspace mounts the lab-only V10 scene instead of a fake mannequin', async () => {
  const source = await readFile(
    new URL('../app/components/CueIdStylizedWorkspace.vue', import.meta.url),
    'utf8'
  )

  assert.match(source, /CueIdRiggedBodyLabScene/)
  assert.doesNotMatch(source, /procedural mannequin/i)
})
