import assert from 'node:assert/strict'
import test from 'node:test'

import { selectCueIdCandidateQuality } from '../app/domain/cueIdQuality.ts'

test('full runtime tier selects medium until high quality passes the desktop gate', () => {
  assert.equal(
    selectCueIdCandidateQuality({ tier: 'full', reason: 'full_capability' }),
    'medium'
  )
})

test('reduced runtime tier selects medium quality', () => {
  assert.equal(
    selectCueIdCandidateQuality({ tier: 'reduced', reason: 'reduced_viewport' }),
    'medium'
  )
  assert.equal(
    selectCueIdCandidateQuality({ tier: 'reduced', reason: 'reduced_memory' }),
    'medium'
  )
})

test('static runtime tier resolves to light only as a non-interactive fallback value', () => {
  assert.equal(
    selectCueIdCandidateQuality({ tier: 'static', reason: 'save_data' }),
    'light'
  )
})
