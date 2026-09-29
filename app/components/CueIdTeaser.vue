<script setup lang="ts">
import { DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG } from '../domain/cueIdStylizedCreator'

const previewAvatarConfig = {
  ...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
  piercings: [...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG.piercings]
}

const props = withDefaults(defineProps<{
  artistName?: string
  compact?: boolean
  previewHref?: string
}>(), {
  artistName: '',
  compact: false,
  previewHref: '/cue-id'
})

const preferences = useCuePreferences()

const copy = computed(() => preferences.locale.value === 'es' ? {
  eyebrow: 'ARTIST PROFILE / CUE ID',
  title: 'TU PERFIL TOMA FORMA EN CUEBOOKER.',
  body: 'CUE ID forma parte de tu perfil de artista. Convierte tu identidad, tu imagen y tu trayectoria en una representación visual propia, sin crear un segundo perfil ni obligarte a completarlo ahora.',
  status: 'IDENTIDAD VISUAL',
  signal: 'SIGNAL 00 · CREATED',
  name: 'TU NOMBRE',
  action: 'Ver CUE ID'
} : {
  eyebrow: 'ARTIST PROFILE / CUE ID',
  title: 'YOUR PROFILE TAKES SHAPE IN CUEBOOKER.',
  body: 'CUE ID is part of your artist profile. It turns your identity, image and trajectory into a visual representation without creating a second profile or forcing you to complete it now.',
  status: 'VISUAL IDENTITY',
  signal: 'SIGNAL 00 · CREATED',
  name: 'YOUR NAME',
  action: 'View CUE ID'
})
</script>

<template>
  <article class="cue-id-teaser" :class="{ 'cue-id-teaser--compact': compact }">
    <div class="cue-id-teaser__copy">
      <p>{{ copy.eyebrow }}</p>
      <h2>{{ copy.title }}</h2>
      <span>{{ copy.body }}</span>
      <NuxtLink v-if="previewHref" :to="previewHref" target="_blank" rel="noopener noreferrer">
        {{ copy.action }} ↗
      </NuxtLink>
    </div>

    <div class="cue-id-teaser__visual" aria-hidden="true">
      <div class="cue-id-teaser__halo cue-id-teaser__halo--one" />
      <div class="cue-id-teaser__halo cue-id-teaser__halo--two" />
      <ClientOnly>
        <CueIdRiggedBodyLabScene
          class="cue-id-teaser__avatar"
          :config="previewAvatarConfig"
          view-mode="body"
        />
        <template #fallback>
          <div class="cue-id-teaser__avatar-loading">CUE ID</div>
        </template>
      </ClientOnly>
      <div class="cue-id-teaser__scan" />
      <div class="cue-id-teaser__meta">
        <span>{{ copy.status }}</span>
        <strong>{{ artistName || copy.name }}</strong>
        <small>{{ copy.signal }}</small>
      </div>
    </div>
  </article>
</template>

<style scoped>
.cue-id-teaser {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(280px, 1.1fr);
  overflow: hidden;
  border: 1px solid var(--cue-border);
  background: #080908;
  color: #f4f2ed;
}
.cue-id-teaser__copy {
  display: grid;
  align-content: center;
  gap: 15px;
  padding: clamp(24px, 5vw, 54px);
  border-right: 1px solid #292b28;
}
.cue-id-teaser__copy p {
  margin: 0;
  color: #ceff54;
  font: 700 10px/1.2 monospace;
  letter-spacing: .13em;
}
.cue-id-teaser__copy h2 {
  max-width: 620px;
  margin: 0;
  font-size: clamp(2rem, 5vw, 4.8rem);
  line-height: .88;
  letter-spacing: -.055em;
  text-transform: uppercase;
}
.cue-id-teaser__copy span {
  max-width: 560px;
  color: #989b95;
  font-size: 14px;
  line-height: 1.6;
}
.cue-id-teaser__copy a {
  width: fit-content;
  margin-top: 5px;
  color: #f4f2ed;
  font: 800 11px/1.2 monospace;
  letter-spacing: .08em;
  text-decoration: none;
  text-transform: uppercase;
  border-bottom: 1px solid #ceff54;
  padding-bottom: 5px;
}
.cue-id-teaser__visual {
  position: relative;
  min-height: 430px;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 42%, rgba(206,255,84,.12), transparent 28%),
    linear-gradient(135deg, #111410 0%, #050605 48%, #0a0b0a 100%);
  isolation: isolate;
  perspective: 900px;
}
.cue-id-teaser__visual::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  opacity: .23;
  background-image: linear-gradient(rgba(255,255,255,.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
  background-size: 38px 38px;
  transform: perspective(700px) rotateX(62deg) scale(1.5) translateY(12%);
  transform-origin: 50% 100%;
}
.cue-id-teaser__halo {
  position: absolute;
  left: 50%;
  top: 46%;
  border: 1px solid rgba(206,255,84,.24);
  border-radius: 50%;
  transform: translate(-50%, -50%) rotateX(68deg);
}
.cue-id-teaser__halo--one { width: 340px; height: 340px; }
.cue-id-teaser__halo--two { width: 470px; height: 470px; opacity: .45; }
.cue-id-teaser__avatar {
  position:absolute;
  inset:12px 12px 58px;
  z-index:2;
}
.cue-id-teaser__avatar-loading {
  position:absolute;
  inset:0;
  display:grid;
  place-items:center;
  color:#777b74;
  font:800 11px/1 monospace;
  letter-spacing:.18em;
}

.cue-id-teaser__scan {
  position: absolute;
  left: 12%;
  right: 12%;
  top: 44%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(206,255,84,.85), transparent);
  box-shadow: 0 0 20px rgba(206,255,84,.38);
}
.cue-id-teaser__meta {
  position: absolute;
  left: 22px;
  right: 22px;
  bottom: 20px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 7px 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,.14);
}
.cue-id-teaser__meta span, .cue-id-teaser__meta small {
  color: #777b74;
  font: 700 9px/1.3 monospace;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.cue-id-teaser__meta strong {
  grid-column: 1;
  font-size: clamp(1.4rem, 3vw, 2.4rem);
  line-height: .9;
  text-transform: uppercase;
}
.cue-id-teaser__meta small { grid-column: 2; grid-row: 1 / 3; color: #ceff54; text-align: right; }
.cue-id-teaser--compact {
  grid-template-columns: minmax(0, 1.35fr) minmax(220px, .65fr);
  width:min(760px,100%);
  margin-inline:auto;
}
.cue-id-teaser--compact .cue-id-teaser__copy {
  gap:10px;
  padding:22px 24px;
}
.cue-id-teaser--compact .cue-id-teaser__copy h2 {
  max-width:430px;
  font-size:clamp(1.55rem,3vw,2.25rem);
  line-height:.94;
}
.cue-id-teaser--compact .cue-id-teaser__copy span {
  max-width:470px;
  font-size:12px;
  line-height:1.5;
}
.cue-id-teaser--compact .cue-id-teaser__copy a {
  margin-top:2px;
  font-size:10px;
}
.cue-id-teaser--compact .cue-id-teaser__visual { min-height:240px; }
.cue-id-teaser--compact .cue-id-teaser__avatar { inset:6px 6px 42px; }
.cue-id-teaser--compact .cue-id-teaser__meta { left:14px; right:14px; bottom:12px; padding-top:10px; }
.cue-id-teaser--compact .cue-id-teaser__meta strong { font-size:1.15rem; }
.cue-id-teaser--compact .cue-id-teaser__meta span,
.cue-id-teaser--compact .cue-id-teaser__meta small { font-size:8px; }

@media (prefers-reduced-motion: no-preference) {
  .cue-id-teaser__scan { animation: cue-id-scan 4.2s ease-in-out infinite; }
}
@keyframes cue-id-scan {
  0%, 100% { transform: translateY(-75px); opacity: .22; }
  50% { transform: translateY(92px); opacity: .9; }
}

@media (max-width: 760px) {
  .cue-id-teaser, .cue-id-teaser--compact { grid-template-columns: 1fr; }
  .cue-id-teaser__copy { border-right: 0; border-bottom: 1px solid #292b28; }
  .cue-id-teaser__visual { min-height:340px; }
  .cue-id-teaser--compact .cue-id-teaser__copy { padding:20px; }
  .cue-id-teaser--compact .cue-id-teaser__copy h2 { font-size:1.8rem; }
  .cue-id-teaser--compact .cue-id-teaser__visual { min-height:280px; }
  .cue-id-teaser--compact .cue-id-teaser__avatar { inset:4px 4px 44px; }
}
</style>
