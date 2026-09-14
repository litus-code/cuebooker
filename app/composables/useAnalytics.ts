type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>
}

export type PrivacyConsent = {
  necessary: true
  analytics: boolean
  marketing: boolean
  decidedAt: string
  version: string
}

const CONSENT_STORAGE_KEY = 'cuebooker:privacy-consent'
const LEGACY_CONSENT_STORAGE_KEY = 'cuebooker:analytics-consent'
const CONSENT_VERSION = '1.0'
const GTM_SCRIPT_ID = 'cuebooker-gtm'

export const useAnalytics = () => {
  const config = useRuntimeConfig()
  const consent = useState<PrivacyConsent | null>('privacy-consent', () => null)
  const initialized = useState<boolean>('analytics-initialized', () => false)
  const preferencesOpen = useState<boolean>('privacy-preferences-open', () => false)

  const gtmId = computed(() => String(config.public.gtmId || '').trim())
  const enabled = computed(() => Boolean(gtmId.value))
  const hasDecision = computed(() => consent.value !== null)
  const analyticsAllowed = computed(() => consent.value?.analytics === true)

  const getDataLayer = () => {
    const analyticsWindow = window as AnalyticsWindow
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || []
    return analyticsWindow.dataLayer
  }

  const loadGtm = () => {
    if (!import.meta.client || !enabled.value || !analyticsAllowed.value) return
    if (document.getElementById(GTM_SCRIPT_ID)) return

    const dataLayer = getDataLayer()
    dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

    const script = document.createElement('script')
    script.id = GTM_SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId.value)}`
    document.head.appendChild(script)
  }

  const persist = (analytics: boolean, marketing: boolean) => {
    if (!import.meta.client) return
    consent.value = {
      necessary: true,
      analytics,
      marketing,
      decidedAt: new Date().toISOString(),
      version: CONSENT_VERSION
    }
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent.value))
    localStorage.removeItem(LEGACY_CONSENT_STORAGE_KEY)
    preferencesOpen.value = false
    if (analytics) loadGtm()
  }

  const init = () => {
    if (!import.meta.client || initialized.value) return
    initialized.value = true

    const stored = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as PrivacyConsent
        if (parsed.version === CONSENT_VERSION && parsed.necessary === true) consent.value = parsed
      } catch {
        localStorage.removeItem(CONSENT_STORAGE_KEY)
      }
    }

    if (analyticsAllowed.value) loadGtm()
  }

  const acceptAll = () => persist(true, true)
  const rejectOptional = () => persist(false, false)
  const savePreferences = (analytics: boolean, marketing: boolean) => persist(analytics, marketing)
  const openPreferences = () => { preferencesOpen.value = true }
  const closePreferences = () => { preferencesOpen.value = false }

  const track = (event: string, payload: AnalyticsPayload = {}) => {
    if (!import.meta.client || !analyticsAllowed.value || !enabled.value) return
    getDataLayer().push({ event, ...payload })
  }

  return {
    consent,
    enabled,
    hasDecision,
    analyticsAllowed,
    preferencesOpen,
    init,
    acceptAll,
    rejectOptional,
    savePreferences,
    openPreferences,
    closePreferences,
    track
  }
}
