import { createCueIdVisualEvidenceProposal } from './cue-id-visual-evidence-proposal.mjs'
import { createCueIdMobileEvidenceProposal } from './cue-id-mobile-evidence-proposal.mjs'
import { createCueIdPerformanceEvidenceProposal } from './cue-id-performance-evidence-proposal.mjs'

export function createCueIdCombinedEvidenceProposal({
  sculptReview,
  mobileReview,
  performanceReview,
  evidence
}) {
  if (!evidence || typeof evidence !== 'object') {
    throw new Error('CUE ID evidence object is required')
  }

  const versions = {
    evidence: evidence.assetVersion,
    sculpt: sculptReview?.assetVersion,
    mobile: mobileReview?.assetVersion,
    performance: performanceReview?.assetVersion
  }

  if (!versions.evidence) {
    throw new Error('CUE ID evidence requires assetVersion')
  }

  for (const [source, version] of Object.entries(versions)) {
    if (!version) {
      throw new Error(`CUE ID ${source} review requires assetVersion`)
    }
    if (version !== versions.evidence) {
      throw new Error(
        `CUE ID evidence assetVersion ${versions.evidence} does not match ${source} assetVersion ${version}`
      )
    }
  }

  const withVisual = createCueIdVisualEvidenceProposal(sculptReview, evidence)
  const withMobile = createCueIdMobileEvidenceProposal(mobileReview, withVisual)
  const complete = createCueIdPerformanceEvidenceProposal(performanceReview, withMobile)

  return {
    ...complete,
    evidenceVersion: 1
  }
}
