<script setup lang="ts">
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
  eyebrow: 'CUE ID / OPCIONAL',
  title: 'TU IDENTIDAD DENTRO DE CUEBOOKER.',
  body: 'Una identidad visual ligada a tu trayectoria, tu perfil y la cultura de club. Podrás empezarla cuando quieras y dejarla para más tarde sin bloquear tu workspace.',
  status: 'PRIMERA SEÑAL',
  signal: 'SIGNAL 00 · CREATED',
  name: 'TU NOMBRE',
  action: 'Ver dirección visual'
} : {
  eyebrow: 'CUE ID / OPTIONAL',
  title: 'YOUR IDENTITY INSIDE CUEBOOKER.',
  body: 'A visual identity connected to your trajectory, profile and club culture. Start it when you want or leave it for later without blocking your workspace.',
  status: 'FIRST SIGNAL',
  signal: 'SIGNAL 00 · CREATED',
  name: 'YOUR NAME',
  action: 'View visual direction'
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
      <div class="cue-id-teaser__figure">
        <i class="cue-id-teaser__head" />
        <i class="cue-id-teaser__torso" />
        <i class="cue-id-teaser__arm cue-id-teaser__arm--left" />
        <i class="cue-id-teaser__arm cue-id-teaser__arm--right" />
      </div>
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
.cue-id-teaser__figure {
  position: absolute;
  left: 50%;
  top: 48%;
  width: 170px;
  height: 295px;
  transform: translate(-50%, -50%) rotateY(-13deg) rotateX(2deg);
  transform-style: preserve-3d;
  filter: drop-shadow(0 34px 42px rgba(0,0,0,.75));
}
.cue-id-teaser__figure i { position: absolute; display: block; }
.cue-id-teaser__head {
  left: 51px;
  top: 0;
  width: 68px;
  height: 78px;
  border-radius: 44% 44% 40% 40%;
  background: linear-gradient(115deg, #40443e 0%, #121412 46%, #9aa091 49%, #22251f 56%, #080908 100%);
  box-shadow: inset -8px 0 16px rgba(206,255,84,.12), 8px 0 0 rgba(220,45,40,.7);
}
.cue-id-teaser__head::after {
  content: '';
  position: absolute;
  left: 8px;
  right: 8px;
  top: 32px;
  height: 7px;
  background: #ceff54;
  box-shadow: 0 0 19px rgba(206,255,84,.55);
}
.cue-id-teaser__torso {
  left: 24px;
  top: 66px;
  width: 122px;
  height: 182px;
  clip-path: polygon(19% 0, 81% 0, 100% 26%, 82% 100%, 18% 100%, 0 26%);
  background: linear-gradient(118deg, #5d6259 0%, #131513 34%, #050605 65%, #272b26 100%);
  border: 1px solid rgba(255,255,255,.16);
  box-shadow: inset 14px 0 24px rgba(206,255,84,.06);
}
.cue-id-teaser__torso::after {
  content: 'CUE';
  position: absolute;
  left: 50%;
  top: 54%;
  transform: translate(-50%, -50%) rotate(-90deg);
  color: rgba(244,242,237,.45);
  font: 800 13px/1 monospace;
  letter-spacing: .32em;
}
.cue-id-teaser__arm {
  top: 84px;
  width: 31px;
  height: 157px;
  background: linear-gradient(#252824, #080908);
  border: 1px solid rgba(255,255,255,.1);
}
.cue-id-teaser__arm--left { left: 4px; transform: rotate(9deg); }
.cue-id-teaser__arm--right { right: 4px; transform: rotate(-9deg); }
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
.cue-id-teaser--compact { grid-template-columns: 1fr 280px; }
.cue-id-teaser--compact .cue-id-teaser__copy { padding: 24px; }
.cue-id-teaser--compact .cue-id-teaser__copy h2 { font-size: clamp(1.8rem, 4vw, 3rem); }
.cue-id-teaser--compact .cue-id-teaser__visual { min-height: 300px; }
.cue-id-teaser--compact .cue-id-teaser__figure { transform: translate(-50%, -53%) scale(.72) rotateY(-13deg); }

@media (prefers-reduced-motion: no-preference) {
  .cue-id-teaser__figure { animation: cue-id-float 5.5s ease-in-out infinite; }
  .cue-id-teaser__scan { animation: cue-id-scan 4.2s ease-in-out infinite; }
}
@keyframes cue-id-float {
  0%, 100% { transform: translate(-50%, -50%) rotateY(-13deg) translateY(0); }
  50% { transform: translate(-50%, -50%) rotateY(-7deg) translateY(-8px); }
}
@keyframes cue-id-scan {
  0%, 100% { transform: translateY(-75px); opacity: .22; }
  50% { transform: translateY(92px); opacity: .9; }
}

@media (max-width: 760px) {
  .cue-id-teaser, .cue-id-teaser--compact { grid-template-columns: 1fr; }
  .cue-id-teaser__copy { border-right: 0; border-bottom: 1px solid #292b28; }
  .cue-id-teaser__visual, .cue-id-teaser--compact .cue-id-teaser__visual { min-height: 340px; }
  .cue-id-teaser--compact .cue-id-teaser__figure { transform: translate(-50%, -50%) scale(.82) rotateY(-13deg); }
}
</style>
