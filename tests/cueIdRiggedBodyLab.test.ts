import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  CUE_ID_RIGGED_BODY_LAB_ASSETS,
  getCueIdRiggedBodyLabAsset
} from '../app/domain/cueIdRiggedBodyLab.ts'

test('V2 rigged bodies stay lab-only and expose semantic nodes', () => {
  const male = getCueIdRiggedBodyLabAsset('male')
  const female = getCueIdRiggedBodyLabAsset('female')

  assert.equal(male.version, 'v2')
  assert.equal(female.version, 'v2')
  assert.equal(male.productionReady, false)
  assert.equal(female.productionReady, false)
  assert.match(male.glbPath, /^\/cue-id\/lab\/bodies\//)
  assert.match(female.glbPath, /^\/cue-id\/lab\/bodies\//)
  assert.equal(male.semanticNodes.skin, 'cue_male_skin')
  assert.equal(female.semanticNodes.skin, 'cue_female_skin')
  assert.equal(male.semanticNodes.hair, undefined)
  assert.equal(female.semanticNodes.hair, undefined)
  assert.equal(male.sourceHair, null)
  assert.equal(female.sourceHair, null)
  assert.equal(Object.keys(CUE_ID_RIGGED_BODY_LAB_ASSETS).length, 2)
})

test('stylized workspace mounts the lab-only V2 scene instead of a fake mannequin', async () => {
  const source = await readFile(
    new URL('../app/components/CueIdStylizedWorkspace.vue', import.meta.url),
    'utf8'
  )

  assert.match(source, /CueIdRiggedBodyLabScene/)
  assert.doesNotMatch(source, /procedural mannequin/i)
})


test('V2 lab loader supports Meshopt-compressed delivery GLBs', async () => {
  const source = await readFile(
    new URL('../app/components/CueIdRiggedBodyLabScene.client.vue', import.meta.url),
    'utf8'
  )

  assert.match(source, /MeshoptDecoder/)
  assert.match(source, /setMeshoptDecoder\(MeshoptDecoder\)/)
})


test('V2 lab stage exposes loading progress and body/face inspection controls', async () => {
  const scene = await readFile(
    new URL('../app/components/CueIdRiggedBodyLabScene.client.vue', import.meta.url),
    'utf8'
  )
  const workspace = await readFile(
    new URL('../app/components/CueIdStylizedWorkspace.vue', import.meta.url),
    'utf8'
  )

  assert.match(scene, /progress: \[value: number\]/)
  assert.match(scene, /fetchBodyBuffer/)
  assert.match(scene, /viewMode\?: ViewMode/)
  assert.match(scene, /handlePointerMove/)
  assert.match(scene, /handleWheel/)
  assert.match(workspace, /labViewMode/)
  assert.match(workspace, /cue-workspace__load-progress/)
  assert.match(workspace, /:view-mode="labViewMode"/)
})
