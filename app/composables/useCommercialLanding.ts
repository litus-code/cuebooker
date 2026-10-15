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
  const seo = computed(() => audience === 'dj' ? (locale.value === 'es' ? {
    title: 'Gestión de bookings para DJs | Cuebooker',
    description: 'Organiza solicitudes de contratación, conversaciones y fechas. Comparte tu perfil profesional DJ y recibe propuestas con tu formulario de booking.'
  } : {
    title: 'DJ Booking Management Software | Cuebooker',
    description: 'Manage DJ booking requests, conversations and dates. Share your professional DJ profile and receive enquiries through your booking form.'
  }) : (locale.value === 'es' ? {
    title: 'Software de booking para agencias | Cuebooker',
    description: 'Gestiona artistas, solicitudes de contratación, negociaciones y fechas desde un mismo espacio para agencias de booking y managers musicales.'
  } : {
    title: 'Booking Software for Music Agencies | Cuebooker',
    description: 'Manage artist rosters, booking enquiries, negotiations and dates in one workspace built for music booking agencies and managers.'
  }))
  const canonical = `https://cuebooker.com/${audience}`
  useHead(() => ({
    htmlAttrs: { lang: locale.value },
    title: seo.value.title,
    link: [{ rel: 'canonical', href: canonical }],
    meta: [
      { name: 'description', content: seo.value.description },
      { property: 'og:title', content: seo.value.title },
      { property: 'og:description', content: seo.value.description },
      { property: 'og:url', content: canonical },
      { name: 'twitter:title', content: seo.value.title },
      { name: 'twitter:description', content: seo.value.description }
    ]
  }))
  return { copy, locale, signupTo, trackSignup }
}
