import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assessCueIdMobileReview,
  createCueIdMobileReviewDraft
} from '../scripts/lib/cue-id-mobile-review.mjs'
import { createCueIdMobileEvidenceProposal } from '../scripts/lib/cue-id-mobile-evidence-proposal.mjs'

function passMobile(review) {
  review.status = 'pass'
  for (const key of Object.keys(review.checks)) review.checks[key] = true
  review.evidenceRefs = ['device://iphone', 'device://android']
}

test('mobile review draft starts pending and separate from sculpt review', () => {
  const review = createCueIdMobileReviewDraft('2.0.0')
  const result = assessCueIdMobileReview(review)

  assert.equal(review.status, 'pending')
  assert.equal(result.ready, false)
  assert.equal(review.checks.iphoneClassDevice, false)
  assert.equal(review.checks.androidMidRangeDevice, false)
})

test('passed mobile review requires every check and two device evidence refs', () => {
  const review = createCueIdMobileReviewDraft('2.0.0')
  review.status = 'pass'
  for (const key of Object.keys(review.checks)) review.checks[key] = true
  review.evidenceRefs = ['device://iphone']

  const result = assessCueIdMobileReview(review)

  assert.equal(result.ready, false)
  assert.ok(result.issues.some(issue => issue.field === 'evidenceRefs'))
})

test('mobile evidence proposal only activates mobileReview', () => {
  const review = createCueIdMobileReviewDraft('2.0.0')
  passMobile(review)

  const evidence = {
    assetVersion: '2.0.0',
    visualReview: false,
    mobileReview: false,
    performance: { full: null, reduced: null }
  }

  const proposal = createCueIdMobileEvidenceProposal(review, evidence)

  assert.equal(proposal.visualReview, false)
  assert.equal(proposal.mobileReview, true)
  assert.deepEqual(proposal.performance, { full: null, reduced: null })
  assert.deepEqual(proposal.reviewEvidence.mobile.evidenceRefs, [
    'device://iphone',
    'device://android'
  ])
})

test('mobile evidence proposal rejects version mismatch', () => {
  const review = createCueIdMobileReviewDraft('2.0.0')
  passMobile(review)

  assert.throws(
    () => createCueIdMobileEvidenceProposal(review, {
      assetVersion: '2.1.0',
      visualReview: true,
      mobileReview: false
    }),
    /does not match evidence assetVersion/
  )
})
