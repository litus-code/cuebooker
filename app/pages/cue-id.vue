<script setup lang="ts">
import { cloneCueIdConfig, DEFAULT_CUE_ID_CONFIG } from '../domain/cueId'

const preferences = useCuePreferences()
const cueIdConfig = ref(cloneCueIdConfig(DEFAULT_CUE_ID_CONFIG))

const copy = computed(() => preferences.locale.value === 'es' ? {
  eyebrow: 'PROTOTIPO / CUE ID',
  title: 'IDENTIDAD, TRAYECTORIA Y CULTURA DE CLUB.',
  body: 'Esta vista sirve para validar la dirección visual antes de introducir 3D real. La identidad será opcional, compartible y conectada con actividad profesional, nunca con followers o rankings.',
  passport: 'CUE PASSPORT',
  passportBody: 'La historia profesional se construirá con bookings, ciudades, venues, años y relaciones recurrentes que el artista decida mostrar.',
  signal: 'CUE SIGNAL',
  signalBody: 'La progresión representa actividad real dentro de CueBooker. No mide talento, popularidad ni autenticidad.',
  share: 'SHARE',
  shareBody: 'La misma identidad podrá salir en formatos para Instagram, LinkedIn y tarjetas de artista con controles de privacidad.',
  first: 'Primera señal',
  identified: 'Identidad creada',
  booking: 'Primer booking',
  cities: 'Ciudades',
  venues: 'Venues',
  returnHome: 'Volver',
  editorEyebrow: 'CUE ID / FOUNDATION',
  editorTitle: 'PRIMERA IDENTIDAD. SIN JUGAR A SER UN JUEGO.',
  editorBody: 'Este laboratorio muestra el primer candidato original Club Minimal y valida su runtime en mobile/desktop. Sigue siendo un candidate: no entra al catálogo de producción hasta pasar revisión visual y performance.',
  reset: 'Restablecer'
} : {
  eyebrow: 'PROTOTYPE / CUE ID',
  title: 'IDENTITY, TRAJECTORY AND CLUB CULTURE.',
  body: 'This view validates the visual direction before real 3D is introduced. Identity will be optional, shareable and connected to professional activity, never followers or rankings.',
  passport: 'CUE PASSPORT',
  passportBody: 'Professional history will be built from bookings, cities, venues, years and recurring relationships the artist chooses to show.',
  signal: 'CUE SIGNAL',
  signalBody: 'Progress represents real activity inside CueBooker. It does not measure talent, popularity or authenticity.',
  share: 'SHARE',
  shareBody: 'The same identity can later export to Instagram, LinkedIn and artist cards with privacy controls.',
  first: 'First signal',
  identified: 'Identity created',
  booking: 'First booking',
  cities: 'Cities',
  venues: 'Venues',
  returnHome: 'Back',
  editorEyebrow: 'CUE ID / FOUNDATION',
  editorTitle: 'FIRST IDENTITY. WITHOUT TURNING IT INTO A GAME.',
  editorBody: 'This lab shows the first original Club Minimal candidate and validates its runtime on mobile/desktop. It remains a candidate until it passes visual and performance review.'
  reset: 'Reset'
})

useHead(() => ({
  title: 'CUE ID prototype | CueBooker',
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

    <section class="cue-id-editor-lab">
      <header class="cue-id-editor-lab__intro">
        <div>
          <p>{{ copy.editorEyebrow }}</p>
          <h2>{{ copy.editorTitle }}</h2>
          <span>{{ copy.editorBody }}</span>
        </div>
        <button type="button" @click="cueIdConfig = cloneCueIdConfig(DEFAULT_CUE_ID_CONFIG)">{{ copy.reset }}</button>
      </header>
      <div class="cue-id-editor-lab__stage">
        <CueIdStage :config="cueIdConfig" artist-name="LITUS" lab-asset="candidate" />
      </div>
      <CueIdControls v-model="cueIdConfig" :locale="preferences.locale.value" />
    </section>

    <section class="cue-id-system">
      <article class="cue-id-system__passport">
        <header><span>01</span><strong>{{ copy.passport }}</strong></header>
        <p>{{ copy.passportBody }}</p>
        <div class="passport-card">
          <div class="passport-card__top">
            <span>CUEBOOKER / ARTIST</span>
            <small>PRIVATE PREVIEW</small>
          </div>
          <h2>LITUS</h2>
          <p>TECHNO · HYPNOTIC · ACID</p>
          <div class="passport-card__grid">
            <span><small>{{ copy.cities }}</small><strong>02</strong></span>
            <span><small>{{ copy.venues }}</small><strong>04</strong></span>
            <span><small>BOOKINGS</small><strong>08</strong></span>
          </div>
          <div class="passport-card__stamps">
            <i>BCN</i><i>BER</i><i>2026</i>
          </div>
        </div>
      </article>

      <article>
        <header><span>02</span><strong>{{ copy.signal }}</strong></header>
        <p>{{ copy.signalBody }}</p>
        <div class="signal-list">
          <div class="active"><i /> <span><small>SIGNAL 00</small><strong>{{ copy.first }}</strong></span></div>
          <div><i /> <span><small>SIGNAL 01</small><strong>{{ copy.identified }}</strong></span></div>
          <div><i /> <span><small>SIGNAL 02</small><strong>{{ copy.booking }}</strong></span></div>
        </div>
      </article>

      <article>
        <header><span>03</span><strong>{{ copy.share }}</strong></header>
        <p>{{ copy.shareBody }}</p>
        <div class="share-formats">
          <span>9:16<small>Instagram Story</small></span>
          <span>1:1<small>Artist Card</small></span>
          <span>1.91:1<small>LinkedIn</small></span>
        </div>
      </article>
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
.cue-id-page__intro { padding: clamp(42px, 8vw, 96px) 0 42px; }
.cue-id-page__intro p { margin: 0 0 17px; color: var(--cue-accent); font: 700 11px/1.2 monospace; letter-spacing: .13em; }
.cue-id-page__intro h1 { max-width: 1100px; margin: 0; font-size: clamp(3.3rem, 8.5vw, 8.5rem); line-height: .82; letter-spacing: -.06em; text-transform: uppercase; }
.cue-id-page__intro span { display: block; max-width: 720px; margin-top: 28px; color: var(--cue-muted); font-size: 15px; line-height: 1.65; }
.cue-id-system { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); margin-top: 24px; border-top: 1px solid var(--cue-border); border-left: 1px solid var(--cue-border); }
.cue-id-system > article { min-width: 0; padding: 28px; border-right: 1px solid var(--cue-border); border-bottom: 1px solid var(--cue-border); background: var(--cue-surface); }
.cue-id-system > article > header { display: flex; justify-content: space-between; gap: 20px; padding-bottom: 18px; border-bottom: 1px solid var(--cue-border); }
.cue-id-system > article > header span { color: var(--cue-accent); font: 700 10px/1.2 monospace; }
.cue-id-system > article > header strong { font-size: 13px; letter-spacing: .05em; }
.cue-id-system > article > p { min-height: 88px; color: var(--cue-muted); font-size: 13px; line-height: 1.55; }
.passport-card { margin-top: 28px; padding: 18px; border: 1px solid #333730; background: #090a09; color: #f4f2ed; transform: rotate(-1.2deg); box-shadow: 0 24px 55px rgba(0,0,0,.28); }
.passport-card__top { display: flex; justify-content: space-between; gap: 12px; color: #777c73; font: 700 8px/1.2 monospace; letter-spacing: .1em; }
.passport-card h2 { margin: 34px 0 4px; font-size: 46px; line-height: .82; letter-spacing: -.05em; }
.passport-card > p { margin: 0; color: #ceff54; font: 700 9px/1.3 monospace; letter-spacing: .08em; }
.passport-card__grid { display: grid; grid-template-columns: repeat(3,1fr); margin-top: 30px; border-top: 1px solid #2b2e2a; border-left: 1px solid #2b2e2a; }
.passport-card__grid span { display: grid; gap: 7px; padding: 12px; border-right: 1px solid #2b2e2a; border-bottom: 1px solid #2b2e2a; }
.passport-card__grid small { color: #6e726a; font: 700 7px/1 monospace; }
.passport-card__grid strong { font-size: 20px; }
.passport-card__stamps { display: flex; gap: 9px; margin-top: 22px; }
.passport-card__stamps i { display: grid; place-items: center; width: 48px; height: 48px; border: 1px solid #ceff54; border-radius: 50%; color: #ceff54; font: 700 9px/1 monospace; font-style: normal; transform: rotate(-9deg); }
.passport-card__stamps i:nth-child(2) { transform: rotate(7deg); }
.passport-card__stamps i:nth-child(3) { border-radius: 0; border-color: #7a7e76; color: #7a7e76; transform: rotate(3deg); }
.signal-list { display: grid; margin-top: 32px; }
.signal-list > div { display: grid; grid-template-columns: 28px 1fr; align-items: center; gap: 13px; min-height: 68px; border-top: 1px solid var(--cue-border); opacity: .43; }
.signal-list > div:last-child { border-bottom: 1px solid var(--cue-border); }
.signal-list > div.active { opacity: 1; }
.signal-list i { display: block; width: 10px; height: 10px; border: 1px solid var(--cue-muted); border-radius: 50%; }
.signal-list .active i { border-color: var(--cue-toggle); background: var(--cue-toggle); box-shadow: 0 0 14px color-mix(in srgb,var(--cue-toggle) 50%,transparent); }
.signal-list span { display: grid; gap: 5px; }
.signal-list small { color: var(--cue-muted); font: 700 8px/1.2 monospace; letter-spacing: .08em; }
.signal-list strong { font-size: 13px; }
.share-formats { display: grid; grid-template-columns: repeat(3,1fr); gap: 10px; margin-top: 32px; }
.share-formats > span { display: grid; place-items: center; min-height: 150px; padding: 12px; border: 1px solid var(--cue-border); background: var(--cue-bg); font-size: 22px; font-weight: 800; text-align: center; }
.share-formats small { color: var(--cue-muted); font: 700 8px/1.3 monospace; letter-spacing: .06em; text-transform: uppercase; }
@media (max-width: 980px) { .cue-id-system { grid-template-columns: 1fr; } .cue-id-system > article > p { min-height: 0; } }
@media (max-width: 680px) { .cue-id-page { padding: 0 14px 40px; } .cue-id-page__header { min-height: 62px; } .cue-id-page__intro { padding-top: 46px; } .share-formats { grid-template-columns: 1fr; } .share-formats > span { min-height: 100px; } }
.cue-id-editor-lab { margin-top: 10px; }
.cue-id-editor-lab__intro { display:grid; grid-template-columns:1fr auto; gap:28px; align-items:end; padding:28px 0 20px; }
.cue-id-editor-lab__intro > div { max-width:820px; }
.cue-id-editor-lab__intro p { margin:0 0 12px; color:var(--cue-accent); font:700 10px/1.2 monospace; letter-spacing:.12em; }
.cue-id-editor-lab__intro h2 { margin:0; max-width:780px; font-size:clamp(2.4rem,5vw,5.3rem); line-height:.88; letter-spacing:-.055em; text-transform:uppercase; }
.cue-id-editor-lab__intro span { display:block; max-width:720px; margin-top:18px; color:var(--cue-muted); font-size:14px; line-height:1.6; }
.cue-id-editor-lab__intro button { min-height:44px; padding:0 15px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); cursor:pointer; font-weight:800; }
.cue-id-editor-lab__intro button:focus-visible { outline:2px solid var(--cue-accent); outline-offset:3px; }
.cue-id-editor-lab__stage { margin-bottom:14px; }
@media (max-width:680px) { .cue-id-editor-lab__intro { grid-template-columns:1fr; align-items:start; } .cue-id-editor-lab__intro button { width:100%; } }
</style>
