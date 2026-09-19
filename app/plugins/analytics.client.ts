export default defineNuxtPlugin(() => {
  const analytics = useAnalytics()
  const router = useRouter()

  const trackCurrentPage = () => {
    analytics.trackPageView(router.currentRoute.value.fullPath)
  }

  analytics.init()

  watch(
    () => analytics.consent.value,
    (value, previousValue) => {
      if (value === 'granted' && previousValue !== 'granted') {
        queueMicrotask(trackCurrentPage)
      }
    }
  )

  router.isReady().then(() => {
    if (analytics.consent.value === 'granted') {
      trackCurrentPage()
    }
  })

  router.afterEach((to, from) => {
    if (to.fullPath === from.fullPath) return
    queueMicrotask(() => analytics.trackPageView(to.fullPath))
  })
})
