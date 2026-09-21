import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('CueIdStage placeholder figure is opt-out and stays enabled by default', async () => {
  const source = await readFile(
    new URL('../app/components/CueIdStage.vue', import.meta.url),
    'utf8'
  )

  assert.match(source, /showPlaceholderFigure\?: boolean/)
  assert.match(source, /showPlaceholderFigure: true/)
  assert.match(
    source,
    /v-if="showPlaceholderFigure && !productionStaticPath" class="cue-id-stage__figure"/
  )
})

test('CueIdStage keeps lab GLB runtime support for the dedicated lab route', async () => {
  const source = await readFile(
    new URL('../app/components/CueIdStage.vue', import.meta.url),
    'utf8'
  )

  assert.match(source, /labAsset\?: 'benchmark' \| 'candidate' \| null/)
  assert.match(source, /v-if="labAsset && interactive && runtimeWanted && runtimeDecision"/)
  assert.match(source, /LazyCueIdScene/)
})


test('CueIdStage exposes an authored manifest slot without touching the production catalogue', async () => {
  const source = await readFile(
    new URL('../app/components/CueIdStage.vue', import.meta.url),
    'utf8'
  )

  assert.match(source, /labAuthoredManifest\?: CueIdProductionManifest \| null/)
  assert.match(source, /creatorConfig\?: CueIdCreatorConfigV1 \| null/)
  assert.match(source, /props\.labAuthoredManifest/)
  assert.match(source, /:lab-mode="Boolean\(labAuthoredManifest\)"/)
  assert.match(source, /:creator-config="creatorConfig"/)
  assert.match(source, /tresjs_authored_lab/)
})
