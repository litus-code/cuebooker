import { CUE_ID_PRODUCTION_CATALOGUE } from './cueIdProductionCatalogue'
import type { CueIdProductionAdmission } from './cueIdProductionAdmission'

export type CueIdCreatorAssetSource = 'lab_candidate' | 'production_static' | 'production_interactive'

export type CueIdCreatorAssetStatus = {
  source: CueIdCreatorAssetSource
  assetVersion: string | null
  visualReview: boolean
  mobileReview: boolean
  packageValidation: boolean
  performanceReady: boolean
}

function performanceReady(admission: CueIdProductionAdmission) {
  if (admission.stage !== 'interactive_approved') return false
  const performance = admission.evidence.performance
  return Boolean(performance?.full !== undefined && performance?.reduced !== undefined)
}

export function getCueIdCreatorAssetStatus(
  admissions: CueIdProductionAdmission[] = CUE_ID_PRODUCTION_CATALOGUE
): CueIdCreatorAssetStatus {
  const latest = [...admissions]
    .sort((a, b) =>
      b.manifest.assetVersion.localeCompare(
        a.manifest.assetVersion,
        undefined,
        { numeric: true }
      )
    )[0]

  if (!latest) {
    return {
      source: 'lab_candidate',
      assetVersion: null,
      visualReview: false,
      mobileReview: false,
      packageValidation: false,
      performanceReady: false
    }
  }

  return {
    source: latest.stage === 'interactive_approved'
      ? 'production_interactive'
      : 'production_static',
    assetVersion: latest.manifest.assetVersion,
    visualReview: latest.evidence.visualReview === true,
    mobileReview: latest.evidence.mobileReview === true,
    packageValidation: latest.evidence.packageValidation === true,
    performanceReady: performanceReady(latest)
  }
}
