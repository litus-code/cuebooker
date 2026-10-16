export default defineNuxtPlugin(() => {
  const analytics = useAnalytics()
  const router = useRouter()

  let ready = false
  let lastPage = ''
  const trackCurrentPage = () => {
    const path = router.currentRoute.value.fullPath.split('#')[0] || '/'
    const url = new URL(path, 'https://cuebooker.invalid')
    // Query/hash normalization during hydration is not another page entry.
    const key = url.pathname.replace(/\/+$/, '') || '/'
    if (!ready || lastPage === key || analytics.consent.value !== 'granted') return
    lastPage = key
    analytics.trackPageView(path)
  }

  analytics.init()

  watch(
    () => analytics.consent.value,
    (value, previousValue) => {
      if (value !== 'granted') lastPage = ''
      if (value === 'granted' && previousValue !== 'granted') {
        queueMicrotask(trackCurrentPage)
      }
    }
  )

  router.isReady().then(() => {
    ready = true
    if (analytics.consent.value === 'granted') {
      trackCurrentPage()
    }
  })

  router.afterEach((to, from) => {
    if (to.fullPath === from.fullPath) return
    queueMicrotask(trackCurrentPage)
  })
})
