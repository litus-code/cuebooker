<script setup lang="ts">
import type es from '../../content/es/landings.json'
defineProps<{ copy: typeof es; locale: 'es' | 'en' }>()
const { theme } = useCuePreferences()
const baseURL = useRuntimeConfig().app.baseURL
</script>
<template>
  <section id="passport" class="cl-passport cl-shell cl-section" aria-labelledby="passport-title">
    <div class="cl-section-head"><p class="cl-eyebrow">{{ copy.passport.status }}</p><h2 id="passport-title">{{ copy.passport.title }}</h2><p class="cl-lead">{{ copy.passport.body }}</p></div>
    <figure class="cl-evidence-frame"><a :href="`${baseURL}images/product/passport-${theme}-${locale}.webp`" target="_blank" rel="noopener" :aria-label="copy.product.openImage"><img :src="`${baseURL}images/product/passport-${theme}-${locale}.webp`" :alt="copy.passport.alt" width="1440" height="1050" loading="lazy"></a><figcaption>{{ copy.passport.caption }}</figcaption></figure>
  </section>
</template>
