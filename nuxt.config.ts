import { resolve } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-13',
  devtools: { enabled: false },
  css: [resolve('./assets/css/main.css')],
  app: {
    head: {
      htmlAttrs: { lang: 'es' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },
  nitro: {
    preset: 'cloudflare-pages',
  },
  runtimeConfig: {
    resendApiKey: '',
    contactEmail: 'contacto@carlesfar.com',
  },
})
