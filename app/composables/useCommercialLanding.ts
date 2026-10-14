import es from '../../content/es/landings.json'
import en from '../../content/en/landings.json'
export function useCommercialLanding(audience: 'dj' | 'agency') {
  const { locale } = useCuePreferences()
  const route = useRoute()
  const analytics = useAnalytics()
  const auth = useCueAuth()
  const copy = computed(() => locale.value === 'es' ? es : en)
  const campaign = computed(() => {
    const query: Record<string, string> = {}
    for (const key of ['ref', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const value = route.query[key]
      if (typeof value !== 'string' || !value || value.length > 128) continue
      if (key === 'ref' && !/^[a-z0-9][a-z0-9_-]{1,63}$/i.test(value)) continue
      query[key] = value
    }
    return query
  })
  const signupTo = computed(() => ({ path: '/access', query: { ...campaign.value, mode: 'signup', source: audience } }))
  function captureOrigin() {
    if (!import.meta.client || !campaign.value.ref || !route.path.startsWith(`/${audience}`)) return
    try { auth.captureReferral(campaign.value.ref, `${route.path}?${new URLSearchParams(campaign.value)}`) } catch { /* Storage can be unavailable; signup remains usable. */ }
  }
  onMounted(captureOrigin)
  watch(() => route.fullPath, captureOrigin)
  function trackSignup(area: string) {
    captureOrigin()
    analytics.track('signup_click', { placement: `landing_${audience}_${area}`, audience })
  }
  useHead(() => ({ htmlAttrs: { lang: locale.value }, title: `${audience === 'dj' ? 'DJ' : 'Agency'} | Cuebooker`, meta: [{ name: 'description', content: copy.value[audience].lead }, { property: 'og:description', content: copy.value[audience].lead }] }))
  return { copy, locale, signupTo, trackSignup }
}
