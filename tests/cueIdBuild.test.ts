import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { CUE_ID_BUILDS } from '../app/domain/cueIdBuild.ts'

const expectedBuilds = ['slim', 'regular', 'strong'] as const

test('CUE ID exposes the three semantic builds', () => {
  assert.deepEqual(Object.keys(CUE_ID_BUILDS), expectedBuilds)
})

test('regular build remains the neutral scale reference', () => {
  assert.deepEqual(CUE_ID_BUILDS.regular.rootScale, [1, 1, 1])
  assert.deepEqual(CUE_ID_BUILDS.regular.nodes, {})
})

test('build transforms remain restrained and non-caricatured', () => {
  for (const build of Object.values(CUE_ID_BUILDS)) {
    for (const scale of [build.rootScale, ...Object.values(build.nodes)]) {
      for (const value of scale) {
        assert.ok(value >= 0.9)
        assert.ok(value <= 1.12)
      }
    }
  }
})

test('build node names map to generated Club Minimal geometry names', async () => {
  const generator = await readFile(
    new URL('../scripts/generate-cue-id-club-minimal-candidate.py', import.meta.url),
    'utf8'
  )

  const names = new Set(
    Object.values(CUE_ID_BUILDS)
      .flatMap(build => Object.keys(build.nodes))
  )

  for (const name of names) {
    assert.ok(
      generator.includes(name),
      `semantic build node "${name}" must exist in the candidate generator`
    )
  }
})


test('non-regular builds preserve body semantics across all outfits', () => {
  const outfitBodyNodes = ['tee_volume', 'outfit_tank', 'outfit_hoodie', 'outfit_bomber']

  for (const build of [CUE_ID_BUILDS.slim, CUE_ID_BUILDS.strong]) {
    for (const node of outfitBodyNodes) {
      assert.ok(build.nodes[node], `build semantics must include outfit body "${node}"`)
    }
  }
})
