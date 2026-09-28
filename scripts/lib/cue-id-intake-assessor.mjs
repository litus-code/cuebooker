import { validateCueIdPackage } from './cue-id-package-validator.mjs'
import {
  validateCueIdProductionAdmission
} from '../../app/domain/cueIdProductionAdmission.ts'

function normalizeEvidence(evidence = {}) {
  return {
    visualReview: evidence.visualReview === true,
    mobileReview: evidence.mobileReview === true,
    performance: evidence.performance || undefined
  }
}

function admissionFor(stage, manifest, evidence, packageValid) {
  const normalized = normalizeEvidence(evidence)

  return {
    stage,
    manifest,
    evidence: {
      visualReview: normalized.visualReview,
      mobileReview: normalized.mobileReview,
      packageValidation: packageValid,
      ...(stage === 'interactive_approved' && normalized.performance
        ? { performance: normalized.performance }
        : {})
    }
  }
}

export function assessCueIdV2Intake(buffer, manifest, evidence = {}) {
  const packageResult = validateCueIdPackage(buffer, manifest)
  const evidenceVersionValid =
    typeof evidence.assetVersion === 'string'
    && evidence.assetVersion.length > 0
    && evidence.assetVersion === manifest.assetVersion
  const staticAdmission = admissionFor(
    'static_approved',
    manifest,
    evidence,
    packageResult.valid
  )
  const interactiveAdmission = admissionFor(
    'interactive_approved',
    manifest,
    evidence,
    packageResult.valid
  )

  const staticIssues = validateCueIdProductionAdmission(staticAdmission)
  const interactiveIssues = validateCueIdProductionAdmission(interactiveAdmission)

  if (!evidenceVersionValid) {
    const versionIssue = {
      assetVersion: manifest.assetVersion || 'unknown',
      field: 'evidenceVersion',
      message: evidence.assetVersion
        ? `Evidence assetVersion ${evidence.assetVersion} does not match manifest assetVersion ${manifest.assetVersion || 'unknown'}`
        : 'Intake evidence requires assetVersion matching the manifest'
    }

    staticIssues.push(versionIssue)
    interactiveIssues.push({ ...versionIssue })
  }

  return {
    assetVersion: manifest.assetVersion || null,
    package: {
      ready: packageResult.valid,
      issues: packageResult.issues
    },
    static: {
      ready: staticIssues.length === 0,
      issues: staticIssues
    },
    interactive: {
      ready: interactiveIssues.length === 0,
      issues: interactiveIssues
    },
    summary: packageResult.valid
      ? staticIssues.length
        ? 'package_valid_review_pending'
        : interactiveIssues.length
          ? 'static_ready_interactive_pending'
          : 'interactive_ready'
      : 'package_invalid'
  }
}
