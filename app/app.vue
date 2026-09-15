<script setup lang="ts">
const { theme } = useCuePreferences()

useHead(() => ({
  link: [
    {
      key: 'cuebooker-favicon',
      rel: 'icon',
      type: 'image/x-icon',
      href: theme.value === 'light' ? '/favicon-light.ico' : '/favicon-dark.ico'
    },
    {
      key: 'cuebooker-apple-touch-icon',
      rel: 'apple-touch-icon',
      href: theme.value === 'light' ? '/logo-light.png' : '/logo-dark.png'
    }
  ]
}))
</script>

<template>
  <GlobalBrandPreferences />
  <NuxtPage />
  <AnalyticsConsentBanner />
</template>
