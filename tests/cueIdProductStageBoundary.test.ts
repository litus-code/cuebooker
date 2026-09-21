import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const stagePath = new URL('../app/components/CueIdStage.vue', import.meta.url)

test('product CUE ID stage never loads the fixture renderer implicitly', async () => {
  const source = await readFile(stagePath, 'utf8')

  assert.match(source, /v-if="labAsset && interactive && runtimeWanted && runtimeDecision"/)
  assert.match(source, /reason: resolvedProductionAsset\.value \? 'production_static_first' : 'no_production_asset'/)
})

test('product CUE ID stage can render a versioned production static asset', async () => {
  const source = await readFile(stagePath, 'utf8')

  assert.match(source, /const productionStaticPath = computed/)
  assert.match(source, /v-if="showPlaceholderFigure && !productionStaticPath" class="cue-id-stage__figure"/)
  assert.match(source, /v-if="productionStaticPath && !runtimeReady"/)
  assert.match(source, /class="cue-id-stage__production-static"/)
  assert.match(source, /@error="productionStaticFailed = true"/)
})


test('product CUE ID keeps production static visible until the first interactive frame', async () => {
  const source = await readFile(stagePath, 'utf8')

  assert.match(source, /productionStaticPath && !runtimeReady/)
  assert.match(source, /@ready="handleProductionRuntimeReady"/)
  assert.match(source, /@failed="handleRuntimeFailed\(labAuthoredManifest \? 'tresjs_authored_lab' : 'tresjs_production_v2'\)"/)
})


test('failed production static variants retry only after the resolved asset path changes', async () => {
  const source = await readFile(stagePath, 'utf8')

  assert.match(source, /resolvedProductionAsset\.value\?\.staticPath \|\| null/)
  assert.doesNotMatch(source, /watch\(productionStaticPath/)
})
