import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const productionScenePath = new URL('../app/components/CueIdProductionScene.client.vue', import.meta.url)
const stagePath = new URL('../app/components/CueIdStage.vue', import.meta.url)

test('production CUE ID renderer depends on manifest and generic loader only', async () => {
  const source = await readFile(productionScenePath, 'utf8')

  assert.match(source, /CueIdProductionManifest/)
  assert.match(source, /loadCueIdGlbBuffer/)
  assert.match(source, /resolveCueIdProductionBindings/)
  assert.match(source, /applyMorphBindings/)
  assert.match(source, /applyPoseBinding/)
  assert.match(source, /applyMaterialBindings/)
  assert.match(source, /setSemanticVisibility/)
  assert.doesNotMatch(source, /CUE_ID_CANDIDATE_ASSETS/)
  assert.doesNotMatch(source, /CUE_ID_BASES/)
  assert.doesNotMatch(source, /CUE_ID_BUILDS/)
  assert.doesNotMatch(source, /CUE_ID_POSES/)
  assert.doesNotMatch(source, /CUE_ID_OUTFITS/)
})

test('production renderer is mounted only behind an interactive production manifest', async () => {
  const stage = await readFile(stagePath, 'utf8')

  assert.match(stage, /defineAsyncComponent\(\(\)\s*=>\s*import\(['"]\.\/CueIdProductionScene\.client\.vue['"]\)\)/)
  assert.match(stage, /const productionInteractiveManifest = computed/)
  assert.match(stage, /resolvedProductionAsset\.value\?\.representation === 'interactive'/)
  assert.match(stage, /v-if="!labAsset && interactive && runtimeWanted && runtimeDecision && productionInteractiveManifest"/)
})
