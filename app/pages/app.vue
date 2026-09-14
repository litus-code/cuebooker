<script setup lang="ts">
const auth = useCueAuth()
const { locale } = useCuePreferences()
const loadingCopy = computed(() => locale.value === 'es' ? 'Abriendo tu workspace…' : 'Opening your workspace…')

onMounted(async () => {
  await auth.initialize()
  if (!auth.signedIn.value) {
    await navigateTo({ path: '/access', query: { mode: 'signup' } }, { replace: true })
    return
  }

  if (!auth.profile.value) await auth.fetchProfile()
  await navigateTo(auth.accountDestination(), { replace: true })
})

useHead(() => ({ title: locale.value === 'es' ? 'Acceso al workspace | CueBooker' : 'Workspace access | CueBooker', htmlAttrs: { lang: locale.value } }))
</script>

<template>
  <main class="legacy-entry">
    <header><NuxtLink to="/">CUEBOOKER<span>/</span></NuxtLink><CuePreferencesControl compact /></header>
    <p>{{ loadingCopy }}</p>
  </main>
</template>

<style scoped>
.legacy-entry { min-height: 100vh; padding: 28px; box-sizing: border-box; background: var(--cue-bg); color: var(--cue-text); text-align: center; }
.legacy-entry header { display: flex; align-items: center; justify-content: space-between; }
.legacy-entry a { color: inherit; font-weight: 900; letter-spacing: .08em; text-decoration: none; }
.legacy-entry a span { color: var(--cue-toggle); }
.legacy-entry p { margin-top: 34vh; color: var(--cue-muted); }
</style>
