import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assessCueIdSculptReview,
  createCueIdSculptReviewDraft
} from '../scripts/lib/cue-id-sculpt-review.mjs'

function passGate(gate) {
  gate.status = 'pass'
  for (const key of Object.keys(gate.checks)) gate.checks[key] = true
  gate.evidenceRefs = ['review://evidence']
}

test('draft starts pending at Gate A', () => {
  const review = createCueIdSculptReviewDraft('2.0.0')
  const result = assessCueIdSculptReview(review)

  assert.equal(result.ready, false)
  assert.equal(result.nextGate, 'A_regularBases')
  assert.deepEqual(result.failedGates, [])
  assert.equal(result.pendingGates.length, 5)
})

test('requires every check and evidence reference before a gate can pass', () => {
  const review = createCueIdSculptReviewDraft('2.0.0')
  review.gates.A_regularBases.status = 'pass'
  review.gates.A_regularBases.checks.sameConditions = true

  const result = assessCueIdSculptReview(review)

  assert.equal(result.ready, false)
  assert.ok(result.issues.some(issue => issue.field === 'checks.feminineRegular'))
  assert.ok(result.issues.some(issue => issue.field === 'evidenceRefs'))
})

test('prevents later gates from passing before previous gates', () => {
  const review = createCueIdSculptReviewDraft('2.0.0')
  passGate(review.gates.B_builds)

  const result = assessCueIdSculptReview(review)

  assert.ok(result.issues.some(issue => issue.field === 'sequence'))
})

test('reports ready only when Gates A through E pass in order with evidence', () => {
  const review = createCueIdSculptReviewDraft('2.0.0')

  passGate(review.gates.A_regularBases)
  passGate(review.gates.B_builds)
  passGate(review.gates.C_tee)
  passGate(review.gates.D_poses)
  passGate(review.gates.E_productSize)

  const result = assessCueIdSculptReview(review)

  assert.equal(result.ready, true)
  assert.equal(result.nextGate, null)
  assert.deepEqual(result.issues, [])
})
