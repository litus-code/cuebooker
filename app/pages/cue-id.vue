<script setup lang="ts">
import { cloneCueIdCreatorConfig, DEFAULT_CUE_ID_CREATOR_CONFIG } from '../domain/cueIdCreator'

const preferences = useCuePreferences()
const cueIdConfig = ref(cloneCueIdCreatorConfig(DEFAULT_CUE_ID_CREATOR_CONFIG))

const copy = computed(() => preferences.locale.value === 'es' ? {
  back: 'Volver',
  lab: 'LAB / NOINDEX',
  status: 'CUE ID V2 · CREATOR PROTOTYPE'
} : {
  back: 'Back',
  lab: 'LAB / NOINDEX',
  status: 'CUE ID V2 · CREATOR PROTOTYPE'
})

function resetCueId() {
  cueIdConfig.value = cloneCueIdCreatorConfig(DEFAULT_CUE_ID_CREATOR_CONFIG)
}

useHead(() => ({
  title: 'CUE ID creator | CueBooker',
  htmlAttrs: { lang: preferences.locale.value },
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
}))
</script>

<template>
  <main class="cue-id-page">
    <header class="cue-id-page__header">
      <NuxtLink class="brand" to="/" aria-label="CueBooker">
        <CueBrand />
      </NuxtLink>

      <div class="cue-id-page__status" aria-label="CUE ID lab status">
        <span>{{ copy.lab }}</span>
        <strong>{{ copy.status }}</strong>
      </div>

      <div class="cue-id-page__header-actions">
        <CuePreferencesControl compact />
        <NuxtLink to="/">{{ copy.back }}</NuxtLink>
      </div>
    </header>

    <CueIdCreator
      v-model="cueIdConfig"
      :locale="preferences.locale.value"
      @reset="resetCueId"
    />
  </main>
</template>

<style scoped>
:global(body){margin:0;background:var(--cue-bg)}
.cue-id-page{min-height:100vh;padding:0 28px 54px;background:var(--cue-bg);color:var(--cue-text);font-family:Arial,Helvetica,sans-serif}
.cue-id-page__header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;min-height:68px;border-bottom:1px solid var(--cue-border)}
.brand{color:inherit;text-decoration:none}
.cue-id-page__status{display:flex;align-items:center;gap:10px;color:var(--cue-muted);font:700 9px/1.2 monospace;letter-spacing:.08em}.cue-id-page__status span{color:var(--cue-accent)}.cue-id-page__status strong{font:inherit}
.cue-id-page__header-actions{display:flex;justify-content:flex-end;align-items:center;gap:14px}.cue-id-page__header-actions>a{color:var(--cue-muted);font:700 11px/1.2 monospace;text-decoration:none;text-transform:uppercase;letter-spacing:.08em}
@media(max-width:760px){.cue-id-page{padding:0 14px 30px}.cue-id-page__header{grid-template-columns:1fr auto;min-height:62px}.cue-id-page__status{display:none}}
</style>
