<script setup lang="ts">
import type es from '../../content/es/landings.json'
import { createBookingQrSvg } from '../services/bookingQr'
defineProps<{ copy: typeof es; locale: 'es' | 'en'; title?: string; sectionId?: string }>()
const baseURL = useRuntimeConfig().app.baseURL
const selected = ref(0)
const sources = ['instagram', 'whatsapp', 'website', 'qr', 'direct']
const exampleUrl = computed(() => `https://cuebooker.com/artist-slug?booking=1&src=${sources[selected.value]}`)
const qr = computed(() => createBookingQrSvg(exampleUrl.value))
</script>
<template>
  <section :id="sectionId || 'how'" class="cl-shell cl-section" aria-labelledby="distribution-title">
    <div class="cl-section-head"><p class="cl-eyebrow">PROFILE / DISTRIBUTION</p><h2 id="distribution-title">{{ title || copy.distributionTitle }}</h2><p class="cl-lead">{{ copy.distributionBody }}</p></div>
    <div class="cl-distribution">
      <div class="cl-channels"><div class="cl-channel-list" :aria-label="copy.publicProfile"><button v-for="(channel, i) in copy.channels" :key="channel[0]" :aria-pressed="selected === i" @click="selected = i"><span class="cl-index">0{{ i + 1 }}</span><span>{{ channel[0] }}</span><svg class="cl-button-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" /></svg></button></div><div class="cl-channel-detail" aria-live="polite"><h3>{{ copy.channels[selected]?.[0] }}</h3><p>{{ copy.channels[selected]?.[1] }}</p><code>{{ exampleUrl }}</code><div v-if="selected === 3" class="cl-qr" role="img" :aria-label="copy.channels[3]?.[0]" v-html="qr" /><p class="cl-note">{{ copy.linkExample }}</p></div><p class="cl-note">{{ copy.manual }}</p></div>
      <div class="cl-profile"><img :src="`${baseURL}images/profile/cuebooker-default-cover.webp`" width="1672" height="941" loading="lazy" alt=""><div class="cl-profile-heading"><p class="cl-eyebrow">{{ copy.publicProfile }}</p><h3>{{ copy.profileName }}</h3></div><div class="cl-form-frame" tabindex="0" role="region" :aria-label="copy.publicProfile"><PublicBookingForm :artist-name="copy.profileName" :locale="locale" preview compact collapse-preview-details /></div></div>
    </div>
  </section>
</template>
