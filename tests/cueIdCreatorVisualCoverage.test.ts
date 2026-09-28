import assert from 'node:assert/strict'
import test from 'node:test'

import { getCueIdCreatorVisualCoverage } from '../app/domain/cueIdCreatorVisualCoverage.ts'

test('lab candidate exposes every creator visual dimension', () => {
  const coverage = getCueIdCreatorVisualCoverage('lab_candidate')
  assert.ok(Object.values(coverage).every(Boolean))
})

test('production V2 exposes only dimensions authored by the current runtime contract', () => {
  const coverage = getCueIdCreatorVisualCoverage('production_interactive')

  assert.equal(coverage.base, true)
  assert.equal(coverage.build, true)
  assert.equal(coverage.top, true)
  assert.equal(coverage.accessory, true)
  assert.equal(coverage.pose, true)
  assert.equal(coverage.material, true)
  assert.equal(coverage.accent, true)

  assert.equal(coverage.skin, false)
  assert.equal(coverage.face, false)
  assert.equal(coverage.hair, false)
  assert.equal(coverage.facialHair, false)
  assert.equal(coverage.bottom, false)
  assert.equal(coverage.footwear, false)
})

test('static and interactive production share the same semantic visual coverage', () => {
  assert.deepEqual(
    getCueIdCreatorVisualCoverage('production_static'),
    getCueIdCreatorVisualCoverage('production_interactive')
  )
})
