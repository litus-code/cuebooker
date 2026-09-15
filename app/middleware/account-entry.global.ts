export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  if (to.path !== '/app') return

  const auth = useCueAuth()
  await auth.initialize()

  if (!auth.signedIn.value) {
    return navigateTo({ path: '/access', query: { mode: 'signup', next: '/workspace' } })
  }

  if (!auth.profile.value) await auth.fetchProfile()

  if (!auth.profile.value?.onboarding_completed) {
    return navigateTo('/onboarding')
  }

  return navigateTo('/workspace')
})
