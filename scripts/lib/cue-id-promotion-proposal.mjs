import { assessCueIdV2Intake } from './cue-id-intake-assessor.mjs'

export function createCueIdPromotionProposal(
  buffer,
  manifest,
  evidence = {},
  requestedStage = 'auto'
) {
  const assessment = assessCueIdV2Intake(buffer, manifest, evidence)

  let stage = requestedStage
  if (stage === 'auto') {
    stage = assessment.interactive.ready
      ? 'interactive_approved'
      : assessment.static.ready
        ? 'static_approved'
        : null
  }

  if (!stage) {
    throw new Error(
      `CUE ID asset is not promotion-ready: ${assessment.summary}`
    )
  }

  if (stage === 'interactive_approved' && !assessment.interactive.ready) {
    throw new Error(
      `CUE ID asset is not interactive-ready: ${assessment.summary}`
    )
  }

  if (stage === 'static_approved' && !assessment.static.ready) {
    throw new Error(
      `CUE ID asset is not static-ready: ${assessment.summary}`
    )
  }

  if (!['static_approved', 'interactive_approved'].includes(stage)) {
    throw new Error(`Unsupported CUE ID promotion stage "${stage}"`)
  }

  return {
    stage,
    manifest,
    evidence: {
      visualReview: true,
      mobileReview: true,
      packageValidation: true,
      ...(stage === 'interactive_approved'
        ? { performance: evidence.performance }
        : {})
    },
    assessment: {
      summary: assessment.summary,
      assetVersion: assessment.assetVersion
    }
  }
}
