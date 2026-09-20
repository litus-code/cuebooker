import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const scenePath = new URL('../app/components/CueIdScene.client.vue', import.meta.url)

test('CUE ID scene contains no implicit procedural humanoid fallback', async () => {
  const source = await readFile(scenePath, 'utf8')

  assert.doesNotMatch(source, /v-else-if="!labAsset"/)
  assert.doesNotMatch(source, /TresBoxGeometry/)
  assert.match(source, /v-if="labAsset && labScene"/)
})
