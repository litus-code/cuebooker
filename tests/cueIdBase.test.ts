import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import { CUE_ID_BASES } from '../app/domain/cueIdBase.ts'

test('CUE ID exposes masculine feminine and neutral bases', () => {
  assert.deepEqual(Object.keys(CUE_ID_BASES), ['masculine', 'feminine', 'neutral'])
})

test('neutral base remains the zero-variation reference', () => {
  assert.deepEqual(CUE_ID_BASES.neutral.rootScale, [1, 1, 1])
  assert.deepEqual(CUE_ID_BASES.neutral.nodes, {})
})

test('base silhouette variation stays restrained', () => {
  for (const base of Object.values(CUE_ID_BASES)) {
    for (const scale of [base.rootScale, ...Object.values(base.nodes)]) {
      for (const value of scale) {
        assert.ok(value >= 0.97)
        assert.ok(value <= 1.04)
      }
    }
  }
})

test('base node names map to generated Club Minimal geometry names', async () => {
  const generator = await readFile(
    new URL('../scripts/generate-cue-id-club-minimal-candidate.py', import.meta.url),
    'utf8'
  )

  const names = new Set(
    Object.values(CUE_ID_BASES)
      .flatMap(base => Object.keys(base.nodes))
  )

  for (const name of names) {
    assert.ok(
      generator.includes(name),
      `semantic base node "${name}" must exist in the candidate generator`
    )
  }
})


test('non-neutral bases preserve silhouette semantics across all outfit bodies', () => {
  const outfitBodyNodes = ['tee_volume', 'outfit_tank', 'outfit_hoodie', 'outfit_bomber']

  for (const base of [CUE_ID_BASES.masculine, CUE_ID_BASES.feminine]) {
    for (const node of outfitBodyNodes) {
      assert.ok(base.nodes[node], `base semantics must include outfit body "${node}"`)
    }
  }
})
