<script setup lang="ts">
const auth = useCueAuth()

onMounted(async () => {
  await auth.initialize()
  if (!auth.signedIn.value) {
    await navigateTo({ path: '/access', query: { mode: 'signup' } }, { replace: true })
    return
  }

  if (!auth.profile.value) await auth.fetchProfile()
  await navigateTo(auth.accountDestination(), { replace: true })
})

useHead({ title: 'Acceso al workspace | CueBooker' })
</script>

<template>
  <main class="legacy-entry">
    <NuxtLink to="/">CUEBOOKER<span>/</span></NuxtLink>
    <p>Abriendo tu workspace…</p>
  </main>
</template>

<style scoped>
.legacy-entry { display: grid; place-content: center; min-height: 100vh; background: #070707; color: #f2f0eb; text-align: center; }
.legacy-entry a { color: inherit; font-weight: 900; letter-spacing: .08em; text-decoration: none; }
.legacy-entry a span { color: #e8ff2f; }
.legacy-entry p { margin-top: 20px; color: #888; }
</style>
