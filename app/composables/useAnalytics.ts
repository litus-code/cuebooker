type AnalyticsConsent = 'unknown' | 'granted' | 'denied'
type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>
}

const CONSENT_STORAGE_KEY = 'cuebooker:analytics-consent:v2'
const GTM_SCRIPT_ID = 'cuebooker-gtm'

export const useAnalytics = () => {
  const config = useRuntimeConfig()
  const consent = useState<AnalyticsConsent>('analytics-consent', () => 'unknown')
  const initialized = useState<boolean>('analytics-initialized', () => false)

  const gtmId = computed(() => String(config.public.gtmId || '').trim())
  const enabled = computed(() => Boolean(gtmId.value))

  const getDataLayer = () => {
    const analyticsWindow = window as AnalyticsWindow
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || []
    return analyticsWindow.dataLayer
  }

  const loadGtm = () => {
    if (!import.meta.client || !enabled.value) return
    if (document.getElementById(GTM_SCRIPT_ID)) return

    const dataLayer = getDataLayer()
    dataLayer.push({
      'gtm.start': Date.now(),
      event: 'gtm.js'
    })

    const script = document.createElement('script')
    script.id = GTM_SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId.value)}`
    document.head.appendChild(script)
  }

  const init = () => {
    if (!import.meta.client || initialized.value) return
    initialized.value = true

    const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (storedConsent === 'granted' || storedConsent === 'denied') {
      consent.value = storedConsent
    }

    if (consent.value === 'granted') loadGtm()
  }

  const accept = () => {
    if (!import.meta.client) return
    consent.value = 'granted'
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    loadGtm()
  }

  const deny = () => {
    if (!import.meta.client) return
    consent.value = 'denied'
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied')
  }

  const track = (event: string, payload: AnalyticsPayload = {}) => {
    if (!import.meta.client || consent.value !== 'granted' || !enabled.value) return

    getDataLayer().push({
      event,
      ...payload
    })
  }

  return {
    consent,
    enabled,
    init,
    accept,
    deny,
    track
  }
}
