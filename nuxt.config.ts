import { resolve } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-13',
  devtools: { enabled: false },
  css: [resolve('./assets/css/main.css')],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'CueBooker · The booking experience electronic music has been waiting for',
      meta: [
        {
          name: 'description',
          content: 'Discover available electronic music artists, send booking requests and manage every date from one connected workspace.'
        }
      ]
    }
  },
  nitro: { preset: process.env.NITRO_PRESET || 'static' },
  i18n: {
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'en', language: 'en-GB', name: 'English' },
      { code: 'es', language: 'es-ES', name: 'Español' }
    ]
  }
})
