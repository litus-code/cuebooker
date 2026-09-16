import { resolve } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-13',
  devtools: { enabled: false },
  css: [resolve('./assets/css/main.css'), resolve('./assets/css/mobile-polish.css'), resolve('./assets/css/final-mobile-fixes.css'), resolve('./assets/css/workspace-light-final.css'), resolve('./assets/css/light-headline-polish.css'), resolve('./assets/css/profile-preview-fix.css'), resolve('./assets/css/workspace-v2.css'), resolve('./assets/css/workspace-v2-polish.css'), resolve('./assets/css/workspace-v3-system.css'), resolve('./assets/css/workspace-v4-structure.css'), resolve('./assets/css/workspace-v5-navigation-settings.css'), resolve('./assets/css/workspace-v6-profile-polish.css'), resolve('./assets/css/workspace-v7-mobile-system.css'), resolve('./assets/css/workspace-responsive-final.css')],
  runtimeConfig: {
    public: {
      gtmId: process.env.NUXT_PUBLIC_GTM_ID || '',
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || '',
      supabasePublishableKey: process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || ''
    }
  },
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'CueBooker | Booking de DJs y música electrónica',
      meta: [
        { name: 'description', content: 'Descubre artistas disponibles, envía una solicitud y gestiona el booking de música electrónica desde un mismo lugar.' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://cuebooker.com/' },
        { property: 'og:title', content: 'CueBooker | Booking de DJs y música electrónica' },
        { property: 'og:description', content: 'Descubre artistas disponibles, envía una solicitud y gestiona el booking de música electrónica desde un mismo lugar.' },
        { name: 'twitter:card', content: 'summary' },
        { name: 'twitter:title', content: 'CueBooker | Booking de DJs y música electrónica' },
        { name: 'twitter:description', content: 'Descubre artistas disponibles, envía una solicitud y gestiona el booking de música electrónica desde un mismo lugar.' }
      ],
      link: [{ rel: 'canonical', href: 'https://cuebooker.com/' }],
      script: [{
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'CueBooker',
          url: 'https://cuebooker.com/',
          description: 'Descubre artistas disponibles, envía una solicitud y gestiona el booking de música electrónica desde un mismo lugar.'
        })
      }]
    }
  },
  nitro: { preset: process.env.NITRO_PRESET || 'static' }
})
