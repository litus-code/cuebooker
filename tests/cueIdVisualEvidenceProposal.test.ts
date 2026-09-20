import assert from 'node:assert/strict'
import test from 'node:test'

import { createCueIdSculptReviewDraft } from '../scripts/lib/cue-id-sculpt-review.mjs'
import { createCueIdVisualEvidenceProposal } from '../scripts/lib/cue-id-visual-evidence-proposal.mjs'

function passAll(review) {
  for (const gate of Object.values(review.gates)) {
    gate.status = 'pass'
    for (const key of Object.keys(gate.checks)) gate.checks[key] = true
    gate.evidenceRefs = ['review://approved']
  }
}

test('promotes completed sculpt review into a visualReview evidence proposal only', () => {
  const review = createCueIdSculptReviewDraft('2.0.0')
  passAll(review)

  const evidence = {
    assetVersion: '2.0.0',
    visualReview: false,
    mobileReview: false,
    performance: {
      full: null,
      reduced: null
    }
  }

  const proposal = createCueIdVisualEvidenceProposal(review, evidence)

  assert.equal(proposal.visualReview, true)
  assert.equal(proposal.mobileReview, false)
  assert.deepEqual(proposal.performance, {
    full: null,
    reduced: null
  })
  assert.equal(
    proposal.reviewEvidence.sculpt.gates.A_regularBases.status,
    'pass'
  )
})

test('rejects visual evidence proposal while sculpt gates remain pending', () => {
  const review = createCueIdSculptReviewDraft('2.0.0')

  assert.throws(
    () => createCueIdVisualEvidenceProposal(review, {
      assetVersion: '2.0.0',
      visualReview: false,
      mobileReview: false
    }),
    /sculpt review is not ready/
  )
})

test('rejects review and evidence from different asset versions', () => {
  const review = createCueIdSculptReviewDraft('2.0.0')
  passAll(review)

  assert.throws(
    () => createCueIdVisualEvidenceProposal(review, {
      assetVersion: '2.1.0',
      visualReview: false,
      mobileReview: false
    }),
    /does not match evidence assetVersion/
  )
})

test('requires versioned evidence', () => {
  const review = createCueIdSculptReviewDraft('2.0.0')
  passAll(review)

  assert.throws(
    () => createCueIdVisualEvidenceProposal(review, {
      visualReview: false,
      mobileReview: false
    }),
    /evidence requires assetVersion/
  )
})
