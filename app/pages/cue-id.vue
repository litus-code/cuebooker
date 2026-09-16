<script setup lang="ts">
import CueIdStage from '../components/cue-id/CueIdStage.vue'

const preferences = useCuePreferences()

const copy = computed(() => preferences.locale.value === 'es' ? {
  eyebrow: 'LABORATORIO / ARTIST PROFILE',
  title: 'CUE ID, PRIMERA IDENTIDAD 3D.',
  body: 'Este laboratorio valida la representación 3D antes de incorporarla como opción visual estable dentro del perfil. La figura es procedural, ligera y no necesita descargar todavía un modelo GLB.',
  noteTitle: 'Qué estamos validando',
  noteBody: 'Escala, materiales, presencia, interacción y coste real en navegador. El perfil y la operativa de booking nunca dependen de este renderer.',
  returnHome: 'Volver'
} : {
  eyebrow: 'LAB / ARTIST PROFILE',
  title: 'CUE ID, FIRST 3D IDENTITY.',
  body: 'This lab validates the 3D representation before it becomes a stable visual option inside Artist Profile. The figure is procedural and lightweight, so no GLB model is downloaded yet.',
  noteTitle: 'What we are validating',
  noteBody: 'Scale, materials, presence, interaction and the real browser cost. Artist Profile and booking operations never depend on this renderer.',
  returnHome: 'Back'
})

useHead(() => ({
  title: 'CUE ID 3D lab | CueBooker',
  htmlAttrs: { lang: preferences.locale.value },
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
}))
</script>

<template>
  <main class="cue-id-page">
    <header class="cue-id-page__header">
      <NuxtLink class="brand" to="/" aria-label="CueBooker"><CueBrand /></NuxtLink>
      <div class="cue-id-page__header-actions">
        <CuePreferencesControl compact />
        <NuxtLink to="/">{{ copy.returnHome }}</NuxtLink>
      </div>
    </header>

    <section class="cue-id-page__intro">
      <p>{{ copy.eyebrow }}</p>
      <h1>{{ copy.title }}</h1>
      <span>{{ copy.body }}</span>
    </section>

    <CueIdStage artist-name="LITUS" />

    <section class="cue-id-page__note">
      <span>PERFORMANCE CONTRACT / 01</span>
      <div>
        <h2>{{ copy.noteTitle }}</h2>
        <p>{{ copy.noteBody }}</p>
      </div>
      <small>STATIC FALLBACK → LAZY CHUNK → WEBGL</small>
    </section>
  </main>
</template>

<style scoped>
:global(body) { margin: 0; background: var(--cue-bg); }
.cue-id-page { min-height: 100vh; padding: 0 28px 70px; background: var(--cue-bg); color: var(--cue-text); font-family: Arial, Helvetica, sans-serif; }
.cue-id-page__header { display: flex; justify-content: space-between; align-items: center; min-height: 68px; border-bottom: 1px solid var(--cue-border); }
.brand { color: inherit; text-decoration: none; }
.cue-id-page__header-actions { display: flex; align-items: center; gap: 14px; }
.cue-id-page__header-actions > a { color: var(--cue-muted); font: 700 11px/1.2 monospace; text-decoration: none; text-transform: uppercase; letter-spacing: .08em; }
.cue-id-page__intro { padding: clamp(42px,7vw,86px) 0 36px; }
.cue-id-page__intro p { margin: 0 0 17px; color: var(--cue-accent); font: 700 11px/1.2 monospace; letter-spacing: .13em; }
.cue-id-page__intro h1 { max-width: 1000px; margin: 0; font-size: clamp(3rem,7.4vw,7.4rem); line-height: .82; letter-spacing: -.06em; text-transform: uppercase; }
.cue-id-page__intro span { display: block; max-width: 720px; margin-top: 26px; color: var(--cue-muted); font-size: 15px; line-height: 1.65; }
.cue-id-page__note { display: grid; grid-template-columns: 180px 1fr auto; gap: 30px; align-items: start; margin-top: 20px; padding: 24px 0; border-top: 1px solid var(--cue-border); border-bottom: 1px solid var(--cue-border); }
.cue-id-page__note > span,.cue-id-page__note > small { color: var(--cue-muted); font: 700 9px/1.3 monospace; letter-spacing: .1em; }
.cue-id-page__note h2 { margin: 0 0 8px; font-size: 18px; text-transform: uppercase; }
.cue-id-page__note p { max-width: 670px; margin: 0; color: var(--cue-muted); font-size: 13px; line-height: 1.55; }
.cue-id-page__note > small { color: var(--cue-accent); text-align: right; }
@media (max-width: 760px) {
  .cue-id-page { padding: 0 14px 40px; }
  .cue-id-page__header { min-height: 62px; }
  .cue-id-page__intro { padding-top: 46px; }
  .cue-id-page__note { grid-template-columns: 1fr; gap: 12px; }
  .cue-id-page__note > small { text-align: left; }
}
</style>
