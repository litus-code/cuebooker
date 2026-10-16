<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type es from '../../content/es/landings.json'
import '../../assets/css/commercial-landings.css'
import { campaignDestination } from '../domain/publicCampaign'
const route = useRoute()
defineProps<{ audience: 'dj' | 'agency'; copy: typeof es; signupTo: RouteLocationRaw }>()
const analytics = useAnalytics()
const baseURL = useRuntimeConfig().app.baseURL
const emit = defineEmits<{ signup: [area: string] }>()
</script>
<template>
  <div class="commercial-audience" :class="`cl-${audience}`">
    <a class="cl-skip" href="#main">{{ copy.skip }}</a>
    <header class="cl-nav" data-public-header><div class="cl-shell cl-nav-inner">
      <NuxtLink :to="campaignDestination('/',route.query)" :aria-label="copy.home" class="cl-brand"><CueBrand /></NuxtLink>
      <nav class="cl-desktop-nav" :aria-label="copy.menu.label"><NuxtLink :to="campaignDestination('/',route.query)">{{ copy.home }}</NuxtLink><a href="#how">{{ copy.how }}</a><NuxtLink :to="campaignDestination('/access?mode=signin',route.query)">{{ copy.login }}</NuxtLink></nav>
      <div class="cl-desktop-preferences"><CuePreferencesControl compact /></div>
      <PublicMobileMenu :signup-to="signupTo" @signup="emit('signup', 'mobile-menu')" />
    </div></header>

    <main id="main">
      <section class="cl-shell cl-hero" aria-labelledby="landing-title">
        <div class="cl-hero-copy"><p class="cl-eyebrow">{{ copy[audience].tag }}</p><h1 id="landing-title">{{ copy[audience].top }}<em>{{ copy[audience].accent }}</em></h1><p class="cl-lead">{{ copy[audience].lead }}</p><div class="cl-actions"><NuxtLink :to="signupTo" class="cl-button cl-primary" @click="emit('signup', 'hero')">{{ copy[audience].create }} <svg class="cl-button-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg></NuxtLink><a class="cl-button cl-secondary" href="#how">{{ copy[audience].see }}</a></div><p class="cl-access-note">{{ copy.initialAccess }}</p></div>
        <figure class="cl-photo"><img :src="`${baseURL}images/landings/${audience}-editorial-960.webp`" :srcset="`${baseURL}images/landings/${audience}-editorial-640.webp 640w, ${baseURL}images/landings/${audience}-editorial-960.webp 960w`" sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1280px) 45vw, 540px" width="960" height="1200" fetchpriority="high" :alt="copy[audience].alt"><figcaption>{{ copy.photo }} <span aria-hidden="true">CUE / {{ audience.toUpperCase() }}</span></figcaption></figure>
      </section>
      <slot />
      <section class="cl-close"><div class="cl-shell"><p class="cl-eyebrow">CUEBOOKER / BOOKING MANAGEMENT</p><h2>{{ copy[audience].closing }}</h2><NuxtLink :to="signupTo" class="cl-button cl-dark" @click="emit('signup', 'closing')">{{ copy[audience].create }} <svg class="cl-button-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg></NuxtLink><p class="cl-access-note">{{ copy.initialAccess }}</p><p><NuxtLink :to="campaignDestination(copy[audience].otherPath,route.query)">{{ copy[audience].other }} →</NuxtLink></p></div></section>
    </main>
    <footer class="cl-shell cl-footer"><NuxtLink :to="campaignDestination('/',route.query)" :aria-label="copy.home" class="cl-brand"><CueBrand /></NuxtLink><span>© {{ new Date().getFullYear() }} Cuebooker</span><NuxtLink to="/privacidad">{{ copy.privacy }}</NuxtLink><NuxtLink to="/aviso-legal">{{ copy.legal }}</NuxtLink><NuxtLink to="/cookies">{{ copy.cookies }}</NuxtLink><button type="button" class="cl-cookie-preferences" @click="analytics.openPreferences">{{ copy.cookiePreferences }}</button><a href="mailto:contacto@cuebooker.com">{{ copy.contact }}</a></footer>
  </div>
</template>
