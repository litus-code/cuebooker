import type { CueIdRuntimeTier } from './cueIdRuntime'

export type CueIdPerformanceGateStatus = 'pass' | 'warn' | 'not_applicable'

export const CUE_ID_READY_BUDGET_MS: Record<Exclude<CueIdRuntimeTier, 'static'>, number> = {
  full: 800,
  reduced: 1500
}

export type CueIdPerformanceGate = {
  status: CueIdPerformanceGateStatus
  budgetMs: number | null
  totalReadyMs: number | null
  remainingMs: number | null
}

export function evaluateCueIdReadyPerformance(
  tier: CueIdRuntimeTier,
  totalReadyMs: number | null
): CueIdPerformanceGate {
  if (tier === 'static' || totalReadyMs === null) {
    return {
      status: 'not_applicable',
      budgetMs: null,
      totalReadyMs,
      remainingMs: null
    }
  }

  const budgetMs = CUE_ID_READY_BUDGET_MS[tier]

  return {
    status: totalReadyMs <= budgetMs ? 'pass' : 'warn',
    budgetMs,
    totalReadyMs,
    remainingMs: budgetMs - totalReadyMs
  }
}
