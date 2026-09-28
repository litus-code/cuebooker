import { assessCueIdPerformanceReview } from './cue-id-performance-review.mjs'

export function createCueIdPerformanceEvidenceProposal(review, evidence) {
  const assessment = assessCueIdPerformanceReview(review)

  if (!assessment.ready) {
    throw new Error('CUE ID performance review is not ready')
  }

  if (!evidence || typeof evidence !== 'object') {
    throw new Error('CUE ID evidence object is required')
  }

  if (!evidence.assetVersion) {
    throw new Error('CUE ID evidence requires assetVersion')
  }

  if (evidence.assetVersion !== review.assetVersion) {
    throw new Error(
      `CUE ID performance review assetVersion ${review.assetVersion} does not match evidence assetVersion ${evidence.assetVersion}`
    )
  }

  return {
    ...evidence,
    performance: {
      full: assessment.tiers.full.totalReadyMs,
      reduced: assessment.tiers.reduced.totalReadyMs
    },
    reviewEvidence: {
      ...(evidence.reviewEvidence || {}),
      performance: {
        reviewVersion: review.reviewVersion,
        assetVersion: review.assetVersion,
        tiers: {
          full: {
            totalReadyMs: assessment.tiers.full.totalReadyMs,
            budgetMs: assessment.tiers.full.budgetMs,
            evidenceRefs: [...review.tiers.full.evidenceRefs]
          },
          reduced: {
            totalReadyMs: assessment.tiers.reduced.totalReadyMs,
            budgetMs: assessment.tiers.reduced.budgetMs,
            evidenceRefs: [...review.tiers.reduced.evidenceRefs]
          }
        }
      }
    }
  }
}
