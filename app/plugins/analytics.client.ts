export default defineNuxtPlugin(() => {
  const analytics = useAnalytics()
  const router = useRouter()

  const trackCurrentPage = () => {
    analytics.track('page_view', {
      page_path: router.currentRoute.value.fullPath
    })
  }

  analytics.init()

  watch(
    () => analytics.consent.value,
    (value, previousValue) => {
      if (value === 'granted' && previousValue !== 'granted') {
        trackCurrentPage()
      }
    }
  )

  router.isReady().then(() => {
    if (analytics.consent.value === 'granted') {
      trackCurrentPage()
    }
  })

  router.afterEach((to) => {
    analytics.track('page_view', {
      page_path: to.fullPath
    })
  })
})
