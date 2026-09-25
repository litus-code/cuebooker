import type { CuePlan } from '../domain/entitlements'

const STORAGE_KEY = 'cuebooker.billing.plan-intent.v1'

function normalizePlanIntent(value: unknown): CuePlan | null {
  return value === 'free' || value === 'artist_pro' || value === 'agency' ? value : null
}

export function useBillingIntent() {
  const plan = useState<CuePlan | null>('cue-billing-plan-intent', () => null)
  const initialized = useState<boolean>('cue-billing-plan-intent-initialized', () => false)

  function initialize() {
    if (!import.meta.client || initialized.value) return
    initialized.value = true
    plan.value = normalizePlanIntent(localStorage.getItem(STORAGE_KEY))
  }

  function capture(value: unknown) {
    const next = normalizePlanIntent(value)
    if (!next) return null
    plan.value = next
    if (import.meta.client) localStorage.setItem(STORAGE_KEY, next)
    return next
  }

  function clear() {
    plan.value = null
    if (import.meta.client) localStorage.removeItem(STORAGE_KEY)
  }

  return {
    plan: readonly(plan),
    initialize,
    capture,
    clear
  }
}
