export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path !== '/app' || to.query.mode !== 'account') return

  const auth = useCueAuth()
  await auth.initialize()

  if (!auth.signedIn.value) {
    return navigateTo({ path: '/access', query: { next: '/app?mode=account' } })
  }

  if (!auth.profile.value) await auth.fetchProfile()

  if (!auth.profile.value?.onboarding_completed) {
    return navigateTo('/onboarding')
  }
})
