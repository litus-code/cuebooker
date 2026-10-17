<script setup lang="ts">
import type es from '../../content/es/landings.json'
defineProps<{ copy: typeof es }>()
const baseURL = useRuntimeConfig().app.baseURL
</script>
<template>
  <section id="cue-id" class="cl-shell cl-section cl-cue-id" aria-labelledby="cue-id-title">
    <div class="cl-section-head"><p class="cl-eyebrow">CUE ID / {{ copy.cueId.status }}</p><h2 id="cue-id-title">{{ copy.cueId.title }}</h2><p class="cl-lead">{{ copy.cueId.body }}</p></div>
    <div class="cl-cue-id__pair"><img v-for="(file,i) in ['cue-id-female-style-concept.jpg','cue-id-style-concept.jpg']" :key="file" :src="`${baseURL}images/home21/${file}`" :alt="copy.cueId.alts[i]" width="640" height="640" loading="lazy"></div>
  </section>
</template>
<style scoped>
.cl-cue-id__pair{display:grid;grid-template-columns:1fr 1fr;gap:clamp(12px,3vw,28px);max-width:900px;margin-inline:auto}
.cl-cue-id__pair img{display:block;width:100%;height:auto;aspect-ratio:1;object-fit:cover;border:1px solid var(--cl-line)}
.cl-cue-id .cl-section-head{max-width:780px}
</style>
