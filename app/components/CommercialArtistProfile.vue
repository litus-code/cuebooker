<script setup lang="ts">
import type es from '../../content/es/landings.json'
defineProps<{ copy: typeof es; locale: 'es' | 'en' }>()
const { theme } = useCuePreferences()
const selected = ref(false)
const baseURL = useRuntimeConfig().app.baseURL
</script>
<template>
  <section id="how" class="cl-shell cl-section cl-profile-presentation" aria-labelledby="profile-presentation-title">
    <div class="cl-section-head"><p class="cl-eyebrow">PROFILE / BOOKING ENTRY</p><h2 id="profile-presentation-title">{{ copy.profileShowcase.title }}</h2><p class="cl-lead">{{ copy.profileShowcase.body }}</p></div>
    <div class="cl-profile-presentation-grid"><figure class="profile-composition"><div class="cl-evidence-controls cl-profile-view-controls"><button v-for="(label,i) in copy.profileShowcase.views" :key="label" type="button" :aria-pressed="selected === Boolean(i)" @click="selected = Boolean(i)">{{ label }}</button></div><a :href="`${baseURL}images/product/profile${selected ? '-details' : ''}-${theme}-${locale}.webp`" target="_blank" rel="noopener" :aria-label="copy.product.openImage"><img :src="`${baseURL}images/product/profile${selected ? '-details' : ''}-${theme}-${locale}.webp`" :alt="selected ? copy.profileShowcase.detailAlt : copy.profileShowcase.alt" width="1440" height="1050" loading="lazy"></a><figcaption>{{ copy.profileShowcase.caption }} {{ copy.product.openImage }}.</figcaption></figure><div class="cl-profile-parts"><article v-for="(part, i) in copy.profileShowcase.parts" :key="part[0]"><span class="cl-index">0{{ i + 1 }}</span><h3>{{ part[0] }}</h3><p>{{ part[1] }}</p></article></div></div>
  </section>
</template>
