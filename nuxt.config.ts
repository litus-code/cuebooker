import { resolve } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-13',
  devtools: { enabled: false },
  css: [resolve('./assets/css/main.css')],
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'es' },
      title: 'CueBooker | Booking de DJs y música electrónica',
      meta: [
        {
          name: 'description',
          content: 'Descubre artistas disponibles, envía una solicitud y gestiona el booking de música electrónica desde un mismo lugar.'
        }
      ]
    }
  },
  nitro: { preset: process.env.NITRO_PRESET || 'static' }
})
