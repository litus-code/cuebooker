export default defineNuxtPlugin(async () => {
  const auth = useCueAuth()
  await auth.initialize()

  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  const scheduleRefresh = () => {
    if (refreshTimer) clearTimeout(refreshTimer)
    const current = auth.session.value
    if (!current) return

    const secondsUntilRefresh = current.expires_at - Math.floor(Date.now() / 1000) - 90
    refreshTimer = setTimeout(async () => {
      await auth.ensureFreshSession()
      scheduleRefresh()
    }, Math.max(0, secondsUntilRefresh * 1000))
  }

  watch(auth.session, scheduleRefresh, { immediate: true })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && auth.session.value) {
      void auth.ensureFreshSession().then(scheduleRefresh)
    }
  })
})
