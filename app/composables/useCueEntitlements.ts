import {
  CUE_PLANS,
  cueMinimumPlan,
  cuePlanBadge,
  cuePlanLimit,
  resolveCueEntitlement,
  type CueEntitlement,
  type CueEntitlementOverride,
  type CuePlan
} from '../domain/entitlements'

function cuePlanFromValue(value: unknown): CuePlan | null {
  return value === 'free' || value === 'artist_pro' || value === 'agency' ? value : null
}

export function useCueEntitlements() {
  const config = useRuntimeConfig()
  const route = useRoute()
  const basePlan = useState<CuePlan>('cue-commercial-base-plan', () => 'free')
  const demoPlan = useState<CuePlan | null>('cue-commercial-demo-plan', () => null)
  const overrides = useState<CueEntitlementOverride>('cue-commercial-entitlement-overrides', () => ({}))

  const appEnv = computed(() => String(config.public.appEnv || 'production').toLowerCase())
  const demoOverrideEnabled = computed(() => appEnv.value !== 'production')
  const currentPlan = computed<CuePlan>(() => demoOverrideEnabled.value && demoPlan.value
    ? demoPlan.value
    : basePlan.value)

  function can(entitlement: CueEntitlement) {
    return resolveCueEntitlement(currentPlan.value, entitlement, overrides.value)
  }

  function limit<K extends keyof typeof CUE_PLANS.free.limits>(key: K) {
    return cuePlanLimit(currentPlan.value, key)
  }

  function badge(entitlement: CueEntitlement) {
    return cuePlanBadge(entitlement)
  }

  function minimumPlan(entitlement: CueEntitlement) {
    return cueMinimumPlan(entitlement)
  }

  function setBasePlan(plan: CuePlan) {
    basePlan.value = plan
  }

  function setDemoPlan(plan: CuePlan | null) {
    if (!demoOverrideEnabled.value) {
      demoPlan.value = null
      return
    }
    demoPlan.value = plan
    if (!import.meta.client) return
    if (plan) localStorage.setItem('cuebooker-demo-plan', plan)
    else localStorage.removeItem('cuebooker-demo-plan')
  }

  function setOverride(entitlement: CueEntitlement, value: boolean | null) {
    if (!demoOverrideEnabled.value) return
    const next = { ...overrides.value }
    if (value === null) delete next[entitlement]
    else next[entitlement] = value
    overrides.value = next
  }

  onMounted(() => {
    if (!demoOverrideEnabled.value) {
      demoPlan.value = null
      overrides.value = {}
      return
    }
    const queryPlan = cuePlanFromValue(route.query.demoPlan)
    const storedPlan = cuePlanFromValue(localStorage.getItem('cuebooker-demo-plan'))
    if (queryPlan) setDemoPlan(queryPlan)
    else if (storedPlan) demoPlan.value = storedPlan
  })

  return {
    currentPlan,
    basePlan,
    demoPlan,
    demoOverrideEnabled,
    can,
    limit,
    badge,
    minimumPlan,
    setBasePlan,
    setDemoPlan,
    setOverride
  }
}
