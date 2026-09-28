import assert from 'node:assert/strict'
import test from 'node:test'

import { createCueIdSculptReviewDraft } from '../scripts/lib/cue-id-sculpt-review.mjs'
import { createCueIdMobileReviewDraft } from '../scripts/lib/cue-id-mobile-review.mjs'
import { createCueIdPerformanceReviewDraft } from '../scripts/lib/cue-id-performance-review.mjs'
import { createCueIdCombinedEvidenceProposal } from '../scripts/lib/cue-id-combined-evidence-proposal.mjs'

function passSculpt(review) {
  for (const gate of Object.values(review.gates)) {
    gate.status = 'pass'
    for (const key of Object.keys(gate.checks)) gate.checks[key] = true
    gate.evidenceRefs = ['review://sculpt']
  }
}

function passMobile(review) {
  review.status = 'pass'
  for (const key of Object.keys(review.checks)) review.checks[key] = true
  review.evidenceRefs = ['device://iphone', 'device://android']
}

function passPerformance(review) {
  review.tiers.full.totalReadyMs = 800
  review.tiers.full.evidenceRefs = ['benchmark://full']
  review.tiers.reduced.totalReadyMs = 1500
  review.tiers.reduced.evidenceRefs = ['benchmark://reduced']
}

test('combines visual, mobile and performance evidence without mutating the base object', () => {
  const sculpt = createCueIdSculptReviewDraft('2.0.0')
  const mobile = createCueIdMobileReviewDraft('2.0.0')
  const performance = createCueIdPerformanceReviewDraft('2.0.0')
  passSculpt(sculpt)
  passMobile(mobile)
  passPerformance(performance)

  const evidence = {
    assetVersion: '2.0.0',
    visualReview: false,
    mobileReview: false,
    performance: {
      full: null,
      reduced: null
    }
  }

  const proposal = createCueIdCombinedEvidenceProposal({
    sculptReview: sculpt,
    mobileReview: mobile,
    performanceReview: performance,
    evidence
  })

  assert.equal(evidence.visualReview, false)
  assert.equal(evidence.mobileReview, false)
  assert.equal(evidence.performance.full, null)

  assert.equal(proposal.evidenceVersion, 1)
  assert.equal(proposal.visualReview, true)
  assert.equal(proposal.mobileReview, true)
  assert.deepEqual(proposal.performance, {
    full: 800,
    reduced: 1500
  })
  assert.ok(proposal.reviewEvidence.sculpt)
  assert.ok(proposal.reviewEvidence.mobile)
  assert.ok(proposal.reviewEvidence.performance)
})

test('rejects any cross-version evidence combination before bridging', () => {
  const sculpt = createCueIdSculptReviewDraft('2.0.0')
  const mobile = createCueIdMobileReviewDraft('2.1.0')
  const performance = createCueIdPerformanceReviewDraft('2.0.0')
  passSculpt(sculpt)
  passMobile(mobile)
  passPerformance(performance)

  assert.throws(
    () => createCueIdCombinedEvidenceProposal({
      sculptReview: sculpt,
      mobileReview: mobile,
      performanceReview: performance,
      evidence: {
        assetVersion: '2.0.0',
        visualReview: false,
        mobileReview: false
      }
    }),
    /does not match mobile assetVersion/
  )
})

test('rejects combined evidence when any underlying review is incomplete', () => {
  const sculpt = createCueIdSculptReviewDraft('2.0.0')
  const mobile = createCueIdMobileReviewDraft('2.0.0')
  const performance = createCueIdPerformanceReviewDraft('2.0.0')
  passSculpt(sculpt)
  passMobile(mobile)

  assert.throws(
    () => createCueIdCombinedEvidenceProposal({
      sculptReview: sculpt,
      mobileReview: mobile,
      performanceReview: performance,
      evidence: {
        assetVersion: '2.0.0',
        visualReview: false,
        mobileReview: false
      }
    }),
    /performance review is not ready/
  )
})
