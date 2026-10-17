<script setup lang="ts">
import { campaignDestination } from '../../domain/publicCampaign'
const route = useRoute()
defineProps<{ copy: { profile: { name: string; title: string; body: string }; passport: { name: string; body: string; concept: string }; identity: { name: string; status: string; body: string }; discover: string } }>()
</script>
<template>
  <div class="home-ecosystem-summary">
    <div class="home-ecosystem-summary__items"><article><h3>{{ copy.profile.name }}</h3><p>{{ copy.profile.body }}</p></article><article><h3>{{ copy.passport.name }}</h3><p>{{ copy.passport.body }}</p></article></div>
    <NuxtLink class="home-ecosystem-summary__link" :to="campaignDestination('/dj',route.query)">{{ copy.discover }}<span class="cp-arrow" aria-hidden="true" /></NuxtLink>
    <p class="home-ecosystem-summary__future"><strong>{{ copy.identity.name }} · {{ copy.identity.status }}</strong> {{ copy.identity.body }}</p>
  </div>
</template>
<style scoped>
.home-ecosystem-summary__items{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:32px}
.home-ecosystem-summary h3{font-size:24px;margin:0 0 14px;color:var(--cp-paper)}
.home-ecosystem-summary p{font-size:15px;line-height:1.65;color:var(--cp-muted);margin:0;max-width:650px}
.home-ecosystem-summary__link{display:inline-flex;align-items:center;gap:16px;margin-block:26px;color:var(--cp-paper);text-underline-offset:5px;font-weight:650}
.home-ecosystem-summary .home-ecosystem-summary__future{border-top:1px solid var(--cp-line);padding-top:20px;font-size:12px}
.home-ecosystem-summary__future strong{color:var(--cp-paper)}
.home-ecosystem-summary a{transition:color .18s ease}
.home-ecosystem-summary a:is(:hover,:focus-visible){color:var(--cp-lime)}
@media(prefers-reduced-motion:reduce){.home-ecosystem-summary a{transition:none}}
@media(max-width:800px){.home-ecosystem-summary__items{grid-template-columns:1fr;gap:24px}.home-ecosystem-summary__link{font-size:14px}}
</style>
