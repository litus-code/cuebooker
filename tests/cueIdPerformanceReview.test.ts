import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assessCueIdPerformanceReview,
  createCueIdPerformanceReviewDraft
} from '../scripts/lib/cue-id-performance-review.mjs'
import { createCueIdPerformanceEvidenceProposal } from '../scripts/lib/cue-id-performance-evidence-proposal.mjs'

function passingReview() {
  const review = createCueIdPerformanceReviewDraft('2.0.0')
  review.tiers.full.totalReadyMs = 800
  review.tiers.full.evidenceRefs = ['benchmark://full']
  review.tiers.reduced.totalReadyMs = 1500
  review.tiers.reduced.evidenceRefs = ['benchmark://reduced']
  return review
}

test('performance review draft starts unmeasured for full and reduced tiers', () => {
  const review = createCueIdPerformanceReviewDraft('2.0.0')
  const result = assessCueIdPerformanceReview(review)

  assert.equal(result.ready, false)
  assert.equal(review.tiers.full.totalReadyMs, null)
  assert.equal(review.tiers.reduced.totalReadyMs, null)
  assert.ok(result.issues.some(issue => issue.field === 'tiers.full.totalReadyMs'))
  assert.ok(result.issues.some(issue => issue.field === 'tiers.reduced.totalReadyMs'))
})

test('accepts timings exactly at the current runtime budgets', () => {
  const result = assessCueIdPerformanceReview(passingReview())

  assert.equal(result.ready, true)
  assert.equal(result.tiers.full.budgetMs, 800)
  assert.equal(result.tiers.reduced.budgetMs, 1500)
  assert.equal(result.tiers.full.status, 'pass')
  assert.equal(result.tiers.reduced.status, 'pass')
})

test('rejects a full-tier timing above the current 800 ms budget', () => {
  const review = passingReview()
  review.tiers.full.totalReadyMs = 801

  const result = assessCueIdPerformanceReview(review)

  assert.equal(result.ready, false)
  assert.equal(result.tiers.full.status, 'warn')
  assert.ok(result.issues.some(issue => issue.field === 'tiers.full.totalReadyMs'))
})

test('requires evidence refs for measured tiers', () => {
  const review = passingReview()
  review.tiers.reduced.evidenceRefs = []

  const result = assessCueIdPerformanceReview(review)

  assert.equal(result.ready, false)
  assert.ok(result.issues.some(issue => issue.field === 'tiers.reduced.evidenceRefs'))
})

test('performance evidence proposal preserves visual and mobile state', () => {
  const proposal = createCueIdPerformanceEvidenceProposal(passingReview(), {
    assetVersion: '2.0.0',
    visualReview: true,
    mobileReview: false,
    performance: {
      full: null,
      reduced: null
    }
  })

  assert.equal(proposal.visualReview, true)
  assert.equal(proposal.mobileReview, false)
  assert.deepEqual(proposal.performance, {
    full: 800,
    reduced: 1500
  })
  assert.equal(proposal.reviewEvidence.performance.tiers.full.budgetMs, 800)
})

test('performance evidence proposal rejects version mismatch', () => {
  assert.throws(
    () => createCueIdPerformanceEvidenceProposal(passingReview(), {
      assetVersion: '2.1.0',
      visualReview: true,
      mobileReview: true
    }),
    /does not match evidence assetVersion/
  )
})
