const REQUIRED_CHECKS = [
  'iphoneClassDevice',
  'androidMidRangeDevice',
  'viewport430OrLess',
  'reducedTier',
  'dpr1Equivalent',
  'headReads',
  'shoulderContinuity',
  'handsRead',
  'garmentReads',
  'fullSilhouetteReads',
  'noDiagnosticsObstruction'
]

export function createCueIdMobileReviewDraft(assetVersion) {
  return {
    reviewVersion: 1,
    assetVersion,
    status: 'pending',
    checks: Object.fromEntries(REQUIRED_CHECKS.map(check => [check, false])),
    evidenceRefs: [],
    notes: []
  }
}

export function assessCueIdMobileReview(review) {
  const issues = []

  if (review?.reviewVersion !== 1) {
    issues.push({ field: 'reviewVersion', message: 'Mobile review must use reviewVersion 1' })
  }

  if (!review?.assetVersion) {
    issues.push({ field: 'assetVersion', message: 'Mobile review requires assetVersion' })
  }

  if (!['pending', 'pass', 'fail'].includes(review?.status)) {
    issues.push({ field: 'status', message: `Unsupported mobile review status "${review?.status}"` })
  }

  for (const check of REQUIRED_CHECKS) {
    if (!(check in (review?.checks || {}))) {
      issues.push({ field: `checks.${check}`, message: `Missing required mobile check "${check}"` })
    }

    if (review?.status === 'pass' && review?.checks?.[check] !== true) {
      issues.push({ field: `checks.${check}`, message: `Passed mobile review requires check "${check}"` })
    }
  }

  if (
    review?.status === 'pass'
    && (!Array.isArray(review.evidenceRefs) || review.evidenceRefs.length < 2)
  ) {
    issues.push({
      field: 'evidenceRefs',
      message: 'Passed mobile review requires evidence for both iPhone-class and Android mid-range devices'
    })
  }

  return {
    ready: review?.status === 'pass' && issues.length === 0,
    issues
  }
}
