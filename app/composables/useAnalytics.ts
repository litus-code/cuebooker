import { persistCampaignSignal, revokeCampaignConsent } from '../services/campaignAnalytics'
import { campaignPage } from '../domain/campaignAnalytics'
type AnalyticsConsent = 'unknown' | 'granted' | 'denied'
type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>

type AnalyticsWindow = Window & {
  dataLayer?: Array<Record<string, unknown>>
}

const CONSENT_STORAGE_KEY = 'cuebooker:analytics-consent:v2'
const CONSENT_COOKIE_KEY = 'cuebooker.analytics-consent.v2'
const GTM_SCRIPT_ID = 'cuebooker-gtm'

function normalizedConsent(value: unknown): AnalyticsConsent | null {
  return value === 'granted' || value === 'denied' ? value : null
}

export const useAnalytics = () => {
  const config = useRuntimeConfig()
  const consentCookie = useCookie<AnalyticsConsent | null>(CONSENT_COOKIE_KEY, {
    default: () => null,
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
    sameSite: 'lax'
  })
  const consent = useState<AnalyticsConsent>('analytics-consent', () => normalizedConsent(consentCookie.value) || 'unknown')
  const initialized = useState<boolean>('analytics-initialized', () => false)
  const preferencesOpen = useState<boolean>('analytics-preferences-open', () => false)

  const gtmId = computed(() => String(config.public.gtmId || '').trim())
  const enabled = computed(() => Boolean(gtmId.value || (config.public.supabaseUrl && config.public.supabasePublishableKey)))

  const getDataLayer = () => {
    const analyticsWindow = window as AnalyticsWindow
    analyticsWindow.dataLayer = analyticsWindow.dataLayer || []
    return analyticsWindow.dataLayer
  }

  const loadGtm = () => {
    if (!import.meta.client || !gtmId.value) return
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

    const storedConsent = normalizedConsent(localStorage.getItem(CONSENT_STORAGE_KEY))
    const cookieConsent = normalizedConsent(consentCookie.value)
    const resolvedConsent = storedConsent || cookieConsent
    if (resolvedConsent) {
      consent.value = resolvedConsent
      localStorage.setItem(CONSENT_STORAGE_KEY, resolvedConsent)
      consentCookie.value = resolvedConsent
    }

    if (consent.value === 'granted') loadGtm()
  }

  const accept = () => {
    if (!import.meta.client) return
    consent.value = 'granted'
    preferencesOpen.value = false
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted')
    consentCookie.value = 'granted'
    loadGtm()
  }

  const deny = () => {
    if (!import.meta.client) return
    const hadGtm = Boolean(document.getElementById(GTM_SCRIPT_ID))
    revokeCampaignConsent(String(config.public.supabaseUrl || ''), String(config.public.supabasePublishableKey || ''))
    consent.value = 'denied'
    preferencesOpen.value = false
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied')
    consentCookie.value = 'denied'
    // Loaded third-party scripts cannot be unexecuted. Reload into the denied state.
    if (hadGtm) window.location.reload()
  }

  const openPreferences = () => {
    preferencesOpen.value = true
  }

  const closePreferences = () => {
    preferencesOpen.value = false
  }

  const track = (event: string, payload: AnalyticsPayload = {}) => {
    if (!import.meta.client || consent.value !== 'granted') return false

    const persisted = persistCampaignSignal(String(config.public.supabaseUrl || ''), String(config.public.supabasePublishableKey || ''), event, payload)
    if (!gtmId.value) return Boolean(persisted)

    getDataLayer().push({
      event,
      ...payload
    })
    return true
  }

  const trackPageView = (path = window.location.pathname + window.location.search) => {
    if (!import.meta.client) return false
    return track('page_view', {
      page_path: campaignPage(path) ? (campaignPage(path) === 'home' ? '/' : `/${campaignPage(path)}`) : '/product',
      page_title: campaignPage(path) || 'product'
    })
  }

  return {
    consent,
    initialized,
    preferencesOpen,
    enabled,
    init,
    accept,
    deny,
    openPreferences,
    closePreferences,
    track,
    trackPageView
  }
}
