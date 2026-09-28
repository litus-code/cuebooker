import { assessCueIdSculptReview } from './cue-id-sculpt-review.mjs'

export function createCueIdVisualEvidenceProposal(review, evidence) {
  const assessment = assessCueIdSculptReview(review)

  if (!assessment.ready) {
    throw new Error(
      `CUE ID sculpt review is not ready; next gate: ${assessment.nextGate || 'unknown'}`
    )
  }

  if (!evidence || typeof evidence !== 'object') {
    throw new Error('CUE ID evidence object is required')
  }

  if (!evidence.assetVersion) {
    throw new Error('CUE ID evidence requires assetVersion')
  }

  if (evidence.assetVersion !== review.assetVersion) {
    throw new Error(
      `CUE ID sculpt review assetVersion ${review.assetVersion} does not match evidence assetVersion ${evidence.assetVersion}`
    )
  }

  return {
    ...evidence,
    visualReview: true,
    reviewEvidence: {
      ...(evidence.reviewEvidence || {}),
      sculpt: {
        reviewVersion: review.reviewVersion,
        assetVersion: review.assetVersion,
        gates: Object.fromEntries(
          Object.entries(review.gates).map(([gate, value]) => [
            gate,
            {
              status: value.status,
              evidenceRefs: [...value.evidenceRefs]
            }
          ])
        )
      }
    }
  }
}
