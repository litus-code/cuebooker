import {
  isCueIdProductionInteractiveReady,
  validateCueIdProductionManifest,
  type CueIdProductionManifest
} from './cueIdProductionManifest.ts'
import {
  evaluateCueIdReadyPerformance,
  type CueIdPerformanceGateStatus
} from './cueIdPerformance.ts'

export type CueIdProductionAdmissionStage =
  | 'static_approved'
  | 'interactive_approved'

export type CueIdProductionPerformanceEvidence = {
  full?: number
  reduced?: number
}

export type CueIdProductionAdmission = {
  stage: CueIdProductionAdmissionStage
  manifest: CueIdProductionManifest
  evidence: {
    visualReview: true
    mobileReview: true
    packageValidation: true
    performance?: CueIdProductionPerformanceEvidence
  }
}

export type CueIdProductionAdmissionIssue = {
  assetVersion: string
  field:
    | 'manifest'
    | 'interactiveBindings'
    | 'visualReview'
    | 'mobileReview'
    | 'packageValidation'
    | 'performance'
    | 'duplicate'
  message: string
}

function performanceStatus(
  tier: 'full' | 'reduced',
  totalReadyMs: number | undefined
): CueIdPerformanceGateStatus {
  if (totalReadyMs === undefined) return 'not_applicable'
  return evaluateCueIdReadyPerformance(tier, totalReadyMs).status
}

export function validateCueIdProductionAdmission(
  admission: CueIdProductionAdmission
): CueIdProductionAdmissionIssue[] {
  const issues: CueIdProductionAdmissionIssue[] = []
  const assetVersion = admission.manifest.assetVersion || 'unknown'

  const manifestIssues = validateCueIdProductionManifest(admission.manifest)
  if (manifestIssues.length) {
    issues.push({
      assetVersion,
      field: 'manifest',
      message: manifestIssues.map(issue => issue.message).join('; ')
    })
  }

  if (admission.evidence.visualReview !== true) {
    issues.push({
      assetVersion,
      field: 'visualReview',
      message: 'Production admission requires completed visual review'
    })
  }

  if (admission.evidence.mobileReview !== true) {
    issues.push({
      assetVersion,
      field: 'mobileReview',
      message: 'Production admission requires completed real-device mobile review'
    })
  }

  if (admission.evidence.packageValidation !== true) {
    issues.push({
      assetVersion,
      field: 'packageValidation',
      message: 'Production admission requires package-to-GLB validation'
    })
  }

  if (admission.stage === 'interactive_approved') {
    if (!isCueIdProductionInteractiveReady(admission.manifest)) {
      issues.push({
        assetVersion,
        field: 'interactiveBindings',
        message: 'Interactive production admission requires complete semantic bindings'
      })
    }

    const evidence = admission.evidence.performance
    if (!evidence) {
      issues.push({
        assetVersion,
        field: 'performance',
        message: 'Interactive production admission requires measured performance evidence'
      })
    } else {
      for (const tier of admission.manifest.supportedTiers) {
        const timing = evidence[tier]
        if (timing === undefined) {
          issues.push({
            assetVersion,
            field: 'performance',
            message: `Interactive production admission requires a measured ${tier} ready time`
          })
          continue
        }

        if (performanceStatus(tier, timing) !== 'pass') {
          issues.push({
            assetVersion,
            field: 'performance',
            message: `Interactive production asset exceeds the ${tier} ready-time budget`
          })
        }
      }
    }
  }

  return issues
}

export function defineCueIdProductionCatalogue(
  admissions: CueIdProductionAdmission[]
) {
  const issues = admissions.flatMap(validateCueIdProductionAdmission)
  const keys = new Set<string>()

  for (const admission of admissions) {
    const key = `${admission.manifest.family}:${admission.manifest.assetVersion}`
    if (keys.has(key)) {
      issues.push({
        assetVersion: admission.manifest.assetVersion,
        field: 'duplicate',
        message: `Duplicate CUE ID production catalogue entry "${key}"`
      })
    }
    keys.add(key)
  }

  if (issues.length) {
    throw new Error(
      issues
        .map(issue => `[${issue.assetVersion}:${issue.field}] ${issue.message}`)
        .join('; ')
    )
  }

  return admissions
}

export function getCueIdProductionManifests(
  admissions: CueIdProductionAdmission[]
) {
  return admissions.map(admission => admission.manifest)
}
