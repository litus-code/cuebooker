export type CueIdRuntimeTier = 'full' | 'reduced' | 'static'
export type CueIdRuntimeState = 'idle' | 'loading' | 'ready' | 'error'

export type CueIdRuntimeSignals = {
  saveData: boolean
  deviceMemoryGb: number | null
  viewportWidth: number
  webglAvailable: boolean
  reducedMotion: boolean
}

export type CueIdRuntimeDecision = {
  tier: CueIdRuntimeTier
  dprCap: 1 | 1.5
  continuousIdle: boolean
  shouldLoadRuntime: boolean
  reason:
    | 'full_capability'
    | 'reduced_viewport'
    | 'reduced_memory'
    | 'save_data'
    | 'low_memory'
    | 'webgl_unavailable'
}

export function decideCueIdRuntime(signals: CueIdRuntimeSignals): CueIdRuntimeDecision {
  if (!signals.webglAvailable) {
    return {
      tier: 'static',
      dprCap: 1,
      continuousIdle: false,
      shouldLoadRuntime: false,
      reason: 'webgl_unavailable'
    }
  }

  if (signals.saveData) {
    return {
      tier: 'static',
      dprCap: 1,
      continuousIdle: false,
      shouldLoadRuntime: false,
      reason: 'save_data'
    }
  }

  if (signals.deviceMemoryGb !== null && signals.deviceMemoryGb <= 2) {
    return {
      tier: 'static',
      dprCap: 1,
      continuousIdle: false,
      shouldLoadRuntime: false,
      reason: 'low_memory'
    }
  }

  if (signals.deviceMemoryGb !== null && signals.deviceMemoryGb <= 4) {
    return {
      tier: 'reduced',
      dprCap: 1,
      continuousIdle: false,
      shouldLoadRuntime: true,
      reason: 'reduced_memory'
    }
  }

  if (signals.viewportWidth <= 900) {
    return {
      tier: 'reduced',
      dprCap: 1,
      continuousIdle: false,
      shouldLoadRuntime: true,
      reason: 'reduced_viewport'
    }
  }

  return {
    tier: 'full',
    dprCap: 1.5,
    continuousIdle: !signals.reducedMotion,
    shouldLoadRuntime: true,
    reason: 'full_capability'
  }
}

export function canUseWebGl() {
  if (typeof document === 'undefined') return false
  const canvas = document.createElement('canvas')
  return Boolean(
    canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })
    || canvas.getContext('experimental-webgl')
  )
}

export function getCueIdRuntimeSignals(): CueIdRuntimeSignals {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      saveData: false,
      deviceMemoryGb: null,
      viewportWidth: 0,
      webglAvailable: false,
      reducedMotion: false
    }
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }

  return {
    saveData: Boolean(nav.connection?.saveData),
    deviceMemoryGb: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null,
    viewportWidth: window.innerWidth,
    webglAvailable: canUseWebGl(),
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }
}
