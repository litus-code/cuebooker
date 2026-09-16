<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

type CueIdMaterial = 'matte' | 'chrome' | 'glass'
type CueIdAccent = 'lime' | 'red' | 'violet'

const props = withDefaults(defineProps<{
  artistName?: string
  disabled?: boolean
  compact?: boolean
  embedded?: boolean
}>(), {
  artistName: '',
  disabled: false,
  compact: false,
  embedded: false
})

const preferences = useCuePreferences()
const root = ref<HTMLElement | null>(null)
const shouldLoad = ref(false)
const ready = ref(false)
const failed = ref(false)
const material = ref<CueIdMaterial>('matte')
const accent = ref<CueIdAccent>('lime')
let observer: IntersectionObserver | null = null

const CueIdScene = defineAsyncComponent({
  loader: () => import('./CueIdScene.client.vue'),
  delay: 0,
  timeout: 12000,
  onError(_error, retry, fail, attempts) {
    if (attempts <= 1) retry()
    else {
      failed.value = true
      fail()
    }
  }
})

const copy = computed(() => preferences.locale.value === 'es' ? {
  eyebrow: 'IDENTIDAD VISUAL / CUE ID',
  title: 'Tu presencia dentro de Cuebooker.',
  body: 'Una representación opcional dentro de tu mismo perfil. El 3D se carga solo cuando llegas aquí y siempre existe una versión ligera de respaldo.',
  prototype: 'Primera familia · Signal',
  material: 'Material',
  matte: 'Mate',
  chrome: 'Cromo',
  glass: 'Translúcido',
  accent: 'Acento',
  loading: 'Preparando CUE ID…',
  fallback: 'Vista ligera activa',
  performance: 'Carga diferida · WebGL aislado'
} : {
  eyebrow: 'VISUAL IDENTITY / CUE ID',
  title: 'Your presence inside Cuebooker.',
  body: 'An optional representation inside the same profile. 3D loads only when you reach this area and always keeps a lightweight fallback.',
  prototype: 'First family · Signal',
  material: 'Material',
  matte: 'Matte',
  chrome: 'Chrome',
  glass: 'Translucent',
  accent: 'Accent',
  loading: 'Preparing CUE ID…',
  fallback: 'Lightweight view active',
  performance: 'Deferred load · isolated WebGL'
})

function onReady() {
  ready.value = true
  failed.value = false
}

function onError() {
  failed.value = true
  ready.value = false
}

onMounted(() => {
  if (!root.value) return
  if (!('IntersectionObserver' in window)) {
    shouldLoad.value = true
    return
  }

  observer = new IntersectionObserver(([entry]) => {
    if (!entry?.isIntersecting) return
    shouldLoad.value = true
    observer?.disconnect()
    observer = null
  }, { rootMargin: '320px 0px', threshold: 0.01 })

  observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <section
    ref="root"
    class="cue-id-stage"
    :class="{
      'cue-id-stage--compact': compact,
      'cue-id-stage--embedded': embedded
    }"
  >
    <header class="cue-id-stage__heading">
      <div>
        <span>{{ copy.eyebrow }}</span>
        <h3>{{ copy.title }}</h3>
        <p>{{ copy.body }}</p>
      </div>
      <small>{{ copy.prototype }}</small>
    </header>

    <div class="cue-id-stage__layout">
      <div class="cue-id-stage__viewport">
        <CueIdFallback :artist-name="artistName" :accent="accent" />
        <ClientOnly>
          <component
            :is="CueIdScene"
            v-if="shouldLoad && !failed"
            class="cue-id-stage__scene"
            :class="{ 'cue-id-stage__scene--ready': ready }"
            :material="material"
            :accent="accent"
            @ready="onReady"
            @error="onError"
          />
        </ClientOnly>

        <div class="cue-id-stage__status">
          <span>{{ ready ? copy.performance : (failed ? copy.fallback : copy.loading) }}</span>
          <strong>{{ artistName || 'CUE ID' }}</strong>
        </div>
      </div>

      <aside class="cue-id-stage__controls">
        <div>
          <span>{{ copy.material }}</span>
          <div class="cue-id-stage__options">
            <button type="button" :class="{ active: material === 'matte' }" :disabled="disabled" @click="material = 'matte'">{{ copy.matte }}</button>
            <button type="button" :class="{ active: material === 'chrome' }" :disabled="disabled" @click="material = 'chrome'">{{ copy.chrome }}</button>
            <button type="button" :class="{ active: material === 'glass' }" :disabled="disabled" @click="material = 'glass'">{{ copy.glass }}</button>
          </div>
        </div>

        <div>
          <span>{{ copy.accent }}</span>
          <div class="cue-id-stage__accents">
            <button type="button" :class="{ active: accent === 'lime' }" :disabled="disabled" aria-label="Lime" @click="accent = 'lime'"><i class="accent-lime" /></button>
            <button type="button" :class="{ active: accent === 'red' }" :disabled="disabled" aria-label="Red" @click="accent = 'red'"><i class="accent-red" /></button>
            <button type="button" :class="{ active: accent === 'violet' }" :disabled="disabled" aria-label="Violet" @click="accent = 'violet'"><i class="accent-violet" /></button>
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.cue-id-stage {
  overflow: hidden;
  border: 1px solid var(--cue-border);
  background: #080908;
  color: #f4f2ed;
}
.cue-id-stage--embedded { border-right: 0; border-left: 0; border-bottom: 0; }
.cue-id-stage__heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 30px;
  padding: 22px;
  border-bottom: 1px solid #292b28;
}
.cue-id-stage__heading > div { max-width: 700px; }
.cue-id-stage__heading span,
.cue-id-stage__controls > div > span {
  color: #ceff54;
  font: 700 9px/1.2 monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.cue-id-stage__heading h3 {
  margin: 9px 0 8px;
  font-size: clamp(1.6rem,3.2vw,2.8rem);
  line-height: .92;
  letter-spacing: -.04em;
  text-transform: uppercase;
}
.cue-id-stage__heading p {
  max-width: 620px;
  margin: 0;
  color: #a8aaa5;
  font-size: 13px;
  line-height: 1.55;
}
.cue-id-stage__heading small {
  flex: 0 0 auto;
  color: #72766f;
  font: 700 9px/1.3 monospace;
  letter-spacing: .09em;
  text-transform: uppercase;
}
.cue-id-stage__layout { display: grid; grid-template-columns: minmax(0,1fr) 240px; }
.cue-id-stage__viewport {
  position: relative;
  min-height: clamp(390px,48vw,570px);
  overflow: hidden;
  border-right: 1px solid #292b28;
  isolation: isolate;
}
.cue-id-stage__scene {
  z-index: 2;
  opacity: 0;
  transition: opacity .3s ease;
}
.cue-id-stage__scene--ready { opacity: 1; }
.cue-id-stage__status {
  position: absolute;
  z-index: 4;
  right: 18px;
  bottom: 17px;
  left: 18px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
  padding-top: 13px;
  border-top: 1px solid rgba(255,255,255,.13);
  pointer-events: none;
}
.cue-id-stage__status span {
  color: #858980;
  font: 700 8px/1.25 monospace;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.cue-id-stage__status strong {
  max-width: 48%;
  overflow: hidden;
  color: #f4f2ed;
  font: 800 12px/1.2 monospace;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
.cue-id-stage__controls {
  display: grid;
  align-content: start;
  gap: 28px;
  padding: 22px;
  background: #0b0c0b;
}
.cue-id-stage__controls > div { display: grid; gap: 10px; }
.cue-id-stage__options { display: grid; gap: 6px; }
.cue-id-stage__options button {
  min-height: 38px;
  padding: 0 12px;
  border: 1px solid #343734;
  background: #111311;
  color: #b7bab4;
  cursor: pointer;
  font: 800 10px/1 monospace;
  text-align: left;
  text-transform: uppercase;
}
.cue-id-stage__options button.active {
  border-color: #ceff54;
  color: #f4f2ed;
}
.cue-id-stage__accents { display: flex; gap: 8px; }
.cue-id-stage__accents button {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid #343734;
  background: #111311;
  cursor: pointer;
}
.cue-id-stage__accents button.active { border-color: #f4f2ed; }
.cue-id-stage__accents i { display: block; width: 16px; height: 16px; border-radius: 50%; }
.accent-lime { background: #ceff54; }
.accent-red { background: #dc2d28; }
.accent-violet { background: #9b7cff; }
.cue-id-stage button:disabled { cursor: not-allowed; opacity: .5; }
.cue-id-stage--compact .cue-id-stage__viewport { min-height: 360px; }

@media (max-width: 760px) {
  .cue-id-stage__heading { flex-direction: column; gap: 12px; padding: 18px; }
  .cue-id-stage__layout { grid-template-columns: 1fr; }
  .cue-id-stage__viewport { min-height: 420px; border-right: 0; border-bottom: 1px solid #292b28; }
  .cue-id-stage__controls { grid-template-columns: 1fr 1fr; gap: 18px; padding: 18px; }
}

@media (max-width: 460px) {
  .cue-id-stage__viewport { min-height: 370px; }
  .cue-id-stage__controls { grid-template-columns: 1fr; }
}
</style>
