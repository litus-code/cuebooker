const GATE_ORDER = [
  'A_regularBases',
  'B_builds',
  'C_tee',
  'D_poses',
  'E_mobile'
]

const REQUIRED_CHECKS = {
  A_regularBases: [
    'sameConditions',
    'feminineRegular',
    'neutralRegular',
    'masculineRegular',
    'structuralIdentity',
    'noStylingDependency'
  ],
  B_builds: [
    'feminineSlim',
    'feminineRegular',
    'feminineStrong',
    'neutralSlim',
    'neutralRegular',
    'neutralStrong',
    'masculineSlim',
    'masculineRegular',
    'masculineStrong',
    'baseBuildIndependent'
  ],
  C_tee: [
    'allNineCombinations',
    'shoulderSleeve',
    'necklineHem',
    'bodyIdentityPreserved',
    'noPaintedOnFit'
  ],
  D_poses: [
    'neutralAllRegularBases',
    'editorialAllRegularBases',
    'relaxedFocusedSpotChecks',
    'feetGrounded',
    'noBodyGarmentIntersections',
    'sameIntentAcrossBases'
  ],
  E_mobile: [
    'iphoneClass',
    'androidMidRange',
    'viewport430OrLess',
    'dpr1Equivalent',
    'headReads',
    'shouldersRead',
    'handsRead',
    'teeReads',
    'fullSilhouetteReads'
  ]
}

function issue(gate, field, message) {
  return { gate, field, message }
}

export function createCueIdSculptReviewDraft(assetVersion) {
  return {
    reviewVersion: 1,
    assetVersion,
    gates: Object.fromEntries(
      GATE_ORDER.map(gate => [
        gate,
        {
          status: 'pending',
          checks: Object.fromEntries(
            REQUIRED_CHECKS[gate].map(check => [check, false])
          ),
          evidenceRefs: [],
          notes: []
        }
      ])
    )
  }
}

export function assessCueIdSculptReview(review) {
  const issues = []

  if (review?.reviewVersion !== 1) {
    issues.push(issue('review', 'reviewVersion', 'Sculpt review must use reviewVersion 1'))
  }

  if (!review?.assetVersion) {
    issues.push(issue('review', 'assetVersion', 'Sculpt review requires assetVersion'))
  }

  let previousPassed = true

  for (const gate of GATE_ORDER) {
    const current = review?.gates?.[gate]
    if (!current) {
      issues.push(issue(gate, 'gate', `Missing sculpt review gate ${gate}`))
      previousPassed = false
      continue
    }

    if (!['pending', 'pass', 'fail'].includes(current.status)) {
      issues.push(issue(gate, 'status', `Unsupported gate status "${current.status}"`))
    }

    if (current.status === 'pass' && !previousPassed) {
      issues.push(issue(
        gate,
        'sequence',
        `${gate} cannot pass before all previous gates pass`
      ))
    }

    for (const check of REQUIRED_CHECKS[gate]) {
      if (!(check in (current.checks || {}))) {
        issues.push(issue(gate, `checks.${check}`, `Missing required check "${check}"`))
      }
      if (current.status === 'pass' && current.checks?.[check] !== true) {
        issues.push(issue(
          gate,
          `checks.${check}`,
          `Passed gate ${gate} requires check "${check}"`
        ))
      }
    }

    if (
      current.status === 'pass'
      && (!Array.isArray(current.evidenceRefs) || current.evidenceRefs.length === 0)
    ) {
      issues.push(issue(
        gate,
        'evidenceRefs',
        `Passed gate ${gate} requires at least one evidence reference`
      ))
    }

    previousPassed = previousPassed && current.status === 'pass'
  }

  const ready =
    issues.length === 0
    && GATE_ORDER.every(gate => review.gates[gate].status === 'pass')

  const failedGates = GATE_ORDER.filter(gate => review?.gates?.[gate]?.status === 'fail')
  const pendingGates = GATE_ORDER.filter(gate => review?.gates?.[gate]?.status === 'pending')

  return {
    ready,
    issues,
    failedGates,
    pendingGates,
    nextGate: GATE_ORDER.find(gate => review?.gates?.[gate]?.status !== 'pass') || null
  }
}

export const CUE_ID_SCULPT_REVIEW_GATE_ORDER = GATE_ORDER
