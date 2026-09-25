import {
  CUE_ID_READY_BUDGET_MS,
  evaluateCueIdReadyPerformance
} from '../../app/domain/cueIdPerformance.ts'

const TIERS = ['full', 'reduced']

export function createCueIdPerformanceReviewDraft(assetVersion) {
  return {
    reviewVersion: 1,
    assetVersion,
    tiers: {
      full: {
        totalReadyMs: null,
        evidenceRefs: [],
        notes: []
      },
      reduced: {
        totalReadyMs: null,
        evidenceRefs: [],
        notes: []
      }
    }
  }
}

export function assessCueIdPerformanceReview(review) {
  const issues = []
  const results = {}

  if (review?.reviewVersion !== 1) {
    issues.push({
      field: 'reviewVersion',
      message: 'Performance review must use reviewVersion 1'
    })
  }

  if (!review?.assetVersion) {
    issues.push({
      field: 'assetVersion',
      message: 'Performance review requires assetVersion'
    })
  }

  for (const tier of TIERS) {
    const current = review?.tiers?.[tier]
    const timing = current?.totalReadyMs

    if (!current) {
      issues.push({
        field: `tiers.${tier}`,
        message: `Missing performance tier "${tier}"`
      })
      continue
    }

    if (typeof timing !== 'number' || !Number.isFinite(timing) || timing < 0) {
      issues.push({
        field: `tiers.${tier}.totalReadyMs`,
        message: `Performance tier "${tier}" requires a measured totalReadyMs`
      })
      results[tier] = {
        ready: false,
        budgetMs: CUE_ID_READY_BUDGET_MS[tier],
        totalReadyMs: null,
        status: 'not_measured'
      }
      continue
    }

    if (!Array.isArray(current.evidenceRefs) || current.evidenceRefs.length === 0) {
      issues.push({
        field: `tiers.${tier}.evidenceRefs`,
        message: `Performance tier "${tier}" requires at least one evidence reference`
      })
    }

    const gate = evaluateCueIdReadyPerformance(tier, timing)
    results[tier] = {
      ready: gate.status === 'pass',
      budgetMs: gate.budgetMs,
      totalReadyMs: gate.totalReadyMs,
      remainingMs: gate.remainingMs,
      status: gate.status
    }

    if (gate.status !== 'pass') {
      issues.push({
        field: `tiers.${tier}.totalReadyMs`,
        message: `Performance tier "${tier}" exceeds the ${gate.budgetMs} ms ready-time budget`
      })
    }
  }

  return {
    ready:
      issues.length === 0
      && TIERS.every(tier => results[tier]?.ready === true),
    tiers: results,
    issues
  }
}
