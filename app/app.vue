<script setup lang="ts">
const { theme } = useCuePreferences()

useHead(() => ({
  link: [
    { key: 'cuebooker-favicon', rel: 'icon', type: 'image/png', href: theme.value === 'light' ? '/cuebooker-app-icon-light.png' : '/cuebooker-favicon.png' },
    { key: 'cuebooker-apple-touch-icon', rel: 'apple-touch-icon', href: theme.value === 'light' ? '/cuebooker-app-icon-light.png' : '/cuebooker-favicon.png' }
  ]
}))
</script>

<template>
  <GlobalBrandPreferences />
  <NuxtPage />
  <AnalyticsConsentBanner />
</template>
