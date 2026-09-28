import { assessCueIdMobileReview } from './cue-id-mobile-review.mjs'

export function createCueIdMobileEvidenceProposal(review, evidence) {
  const assessment = assessCueIdMobileReview(review)

  if (!assessment.ready) {
    throw new Error('CUE ID mobile review is not ready')
  }

  if (!evidence || typeof evidence !== 'object') {
    throw new Error('CUE ID evidence object is required')
  }

  if (!evidence.assetVersion) {
    throw new Error('CUE ID evidence requires assetVersion')
  }

  if (evidence.assetVersion !== review.assetVersion) {
    throw new Error(
      `CUE ID mobile review assetVersion ${review.assetVersion} does not match evidence assetVersion ${evidence.assetVersion}`
    )
  }

  return {
    ...evidence,
    mobileReview: true,
    reviewEvidence: {
      ...(evidence.reviewEvidence || {}),
      mobile: {
        reviewVersion: review.reviewVersion,
        assetVersion: review.assetVersion,
        evidenceRefs: [...review.evidenceRefs]
      }
    }
  }
}
