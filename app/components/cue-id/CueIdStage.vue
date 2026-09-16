<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import CueIdFallback from './CueIdFallback.vue'

type CueIdOutfit = 'tank' | 'tee' | 'hoodie' | 'jacket'
type CueIdAccessory = 'cap' | 'headphones' | 'glasses' | 'none'
type CueIdPose = 'relaxed' | 'neutral' | 'focused' | 'editorial'
type CueIdFinish = 'matte' | 'satin' | 'chrome'
type CueIdAccent = 'lime' | 'red' | 'violet' | 'white'

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
const outfit = ref<CueIdOutfit>('tank')
const accessory = ref<CueIdAccessory>('cap')
const pose = ref<CueIdPose>('relaxed')
const finish = ref<CueIdFinish>('matte')
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
  eyebrow: 'ARTIST PROFILE / CUE ID',
  title: 'Construye tu presencia.',
  body: 'No eliges un personaje cerrado. Combinas una base, outfit, accesorios y actitud para crear una versión de ti dentro de Cuebooker.',
  prototype: 'Primera presencia · Club Minimal',
  outfit: 'Outfit',
  tank: 'Tirantes',
  tee: 'Camiseta',
  hoodie: 'Hoodie',
  jacket: 'Chaqueta',
  accessory: 'Accesorio',
  cap: 'Gorra',
  headphones: 'Auriculares',
  glasses: 'Gafas',
  none: 'Ninguno',
  pose: 'Actitud',
  relaxed: 'Relaxed',
  neutral: 'Neutral',
  focused: 'Focused',
  editorial: 'Editorial',
  finish: 'Acabado',
  matte: 'Mate',
  satin: 'Satinado',
  chrome: 'Cromo',
  accent: 'Acento',
  loading: 'Preparando CUE ID…',
  fallback: 'Vista ligera activa',
  performance: 'Carga diferida · WebGL aislado'
} : {
  eyebrow: 'ARTIST PROFILE / CUE ID',
  title: 'Build your presence.',
  body: 'You are not choosing a closed character. Combine a base, outfit, accessories and attitude to create a version of yourself inside Cuebooker.',
  prototype: 'First presence · Club Minimal',
  outfit: 'Outfit',
  tank: 'Tank top',
  tee: 'T-shirt',
  hoodie: 'Hoodie',
  jacket: 'Jacket',
  accessory: 'Accessory',
  cap: 'Cap',
  headphones: 'Headphones',
  glasses: 'Sunglasses',
  none: 'None',
  pose: 'Attitude',
  relaxed: 'Relaxed',
  neutral: 'Neutral',
  focused: 'Focused',
  editorial: 'Editorial',
  finish: 'Finish',
  matte: 'Matte',
  satin: 'Satin',
  chrome: 'Chrome',
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
            :outfit="outfit"
            :accessory="accessory"
            :pose="pose"
            :finish="finish"
            :accent="accent"
            @ready="onReady"
            @error="onError"
          />
        </ClientOnly>

        <div class="cue-id-stage__identity">
          <span>CLUB MINIMAL / 01</span>
          <strong>{{ artistName || 'CUE ID' }}</strong>
          <small>{{ ready ? copy.performance : (failed ? copy.fallback : copy.loading) }}</small>
        </div>
      </div>

      <aside class="cue-id-stage__controls">
        <div>
          <span>{{ copy.outfit }}</span>
          <div class="cue-id-stage__options cue-id-stage__options--grid">
            <button type="button" :class="{ active: outfit === 'tank' }" :disabled="disabled" @click="outfit = 'tank'">{{ copy.tank }}</button>
            <button type="button" :class="{ active: outfit === 'tee' }" :disabled="disabled" @click="outfit = 'tee'">{{ copy.tee }}</button>
            <button type="button" :class="{ active: outfit === 'hoodie' }" :disabled="disabled" @click="outfit = 'hoodie'">{{ copy.hoodie }}</button>
            <button type="button" :class="{ active: outfit === 'jacket' }" :disabled="disabled" @click="outfit = 'jacket'">{{ copy.jacket }}</button>
          </div>
        </div>

        <div>
          <span>{{ copy.accessory }}</span>
          <div class="cue-id-stage__options cue-id-stage__options--grid">
            <button type="button" :class="{ active: accessory === 'cap' }" :disabled="disabled" @click="accessory = 'cap'">{{ copy.cap }}</button>
            <button type="button" :class="{ active: accessory === 'headphones' }" :disabled="disabled" @click="accessory = 'headphones'">{{ copy.headphones }}</button>
            <button type="button" :class="{ active: accessory === 'glasses' }" :disabled="disabled" @click="accessory = 'glasses'">{{ copy.glasses }}</button>
            <button type="button" :class="{ active: accessory === 'none' }" :disabled="disabled" @click="accessory = 'none'">{{ copy.none }}</button>
          </div>
        </div>

        <div>
          <span>{{ copy.pose }}</span>
          <div class="cue-id-stage__options cue-id-stage__options--grid">
            <button type="button" :class="{ active: pose === 'relaxed' }" :disabled="disabled" @click="pose = 'relaxed'">{{ copy.relaxed }}</button>
            <button type="button" :class="{ active: pose === 'neutral' }" :disabled="disabled" @click="pose = 'neutral'">{{ copy.neutral }}</button>
            <button type="button" :class="{ active: pose === 'focused' }" :disabled="disabled" @click="pose = 'focused'">{{ copy.focused }}</button>
            <button type="button" :class="{ active: pose === 'editorial' }" :disabled="disabled" @click="pose = 'editorial'">{{ copy.editorial }}</button>
          </div>
        </div>

        <div class="cue-id-stage__compact-row">
          <div>
            <span>{{ copy.finish }}</span>
            <div class="cue-id-stage__finish">
              <button type="button" :class="{ active: finish === 'matte' }" :disabled="disabled" @click="finish = 'matte'">{{ copy.matte }}</button>
              <button type="button" :class="{ active: finish === 'satin' }" :disabled="disabled" @click="finish = 'satin'">{{ copy.satin }}</button>
              <button type="button" :class="{ active: finish === 'chrome' }" :disabled="disabled" @click="finish = 'chrome'">{{ copy.chrome }}</button>
            </div>
          </div>

          <div>
            <span>{{ copy.accent }}</span>
            <div class="cue-id-stage__accents">
              <button type="button" :class="{ active: accent === 'lime' }" :disabled="disabled" aria-label="Lime" @click="accent = 'lime'"><i class="accent-lime" /></button>
              <button type="button" :class="{ active: accent === 'red' }" :disabled="disabled" aria-label="Red" @click="accent = 'red'"><i class="accent-red" /></button>
              <button type="button" :class="{ active: accent === 'violet' }" :disabled="disabled" aria-label="Violet" @click="accent = 'violet'"><i class="accent-violet" /></button>
              <button type="button" :class="{ active: accent === 'white' }" :disabled="disabled" aria-label="White" @click="accent = 'white'"><i class="accent-white" /></button>
            </div>
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
.cue-id-stage__heading > div { max-width: 760px; }
.cue-id-stage__heading span,
.cue-id-stage__controls > div > span,
.cue-id-stage__compact-row > div > span {
  color: #ceff54;
  font: 700 9px/1.2 monospace;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.cue-id-stage__heading h3 {
  margin: 9px 0 8px;
  font-size: clamp(1.7rem,3.2vw,2.9rem);
  line-height: .92;
  letter-spacing: -.04em;
  text-transform: uppercase;
}
.cue-id-stage__heading p {
  max-width: 680px;
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
.cue-id-stage__layout { display: grid; grid-template-columns: minmax(0,1fr) minmax(280px,340px); }
.cue-id-stage__viewport {
  position: relative;
  min-height: clamp(520px,58vw,720px);
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
.cue-id-stage__identity {
  position: absolute;
  z-index: 4;
  right: 22px;
  bottom: 20px;
  left: 22px;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: 5px 20px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,.13);
  pointer-events: none;
}
.cue-id-stage__identity > span,
.cue-id-stage__identity > small {
  color: #858980;
  font: 700 8px/1.25 monospace;
  letter-spacing: .1em;
  text-transform: uppercase;
}
.cue-id-stage__identity strong {
  grid-row: 1 / span 2;
  grid-column: 2;
  max-width: 220px;
  overflow: hidden;
  font: 900 15px/1.1 monospace;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}
.cue-id-stage__controls {
  display: grid;
  align-content: start;
  gap: 26px;
  padding: 22px;
  background: #0b0c0b;
}
.cue-id-stage__controls > div,
.cue-id-stage__compact-row > div { display: grid; gap: 10px; }
.cue-id-stage__options { display: grid; gap: 6px; }
.cue-id-stage__options--grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
.cue-id-stage__options button,
.cue-id-stage__finish button {
  min-height: 39px;
  padding: 0 11px;
  border: 1px solid #343734;
  background: #111311;
  color: #b7bab4;
  cursor: pointer;
  font: 800 9px/1 monospace;
  text-align: left;
  text-transform: uppercase;
}
.cue-id-stage__options button.active,
.cue-id-stage__finish button.active {
  border-color: #ceff54;
  color: #f4f2ed;
  box-shadow: inset 0 -2px 0 rgba(206,255,84,.25);
}
.cue-id-stage__compact-row { display: grid !important; grid-template-columns: 1fr 1fr; gap: 18px !important; }
.cue-id-stage__finish { display: grid; gap: 6px; }
.cue-id-stage__accents { display: flex; flex-wrap: wrap; gap: 7px; }
.cue-id-stage__accents button {
  display: grid;
  place-items: center;
  width: 37px;
  height: 37px;
  padding: 0;
  border: 1px solid #343734;
  background: #111311;
  cursor: pointer;
}
.cue-id-stage__accents button.active { border-color: #f4f2ed; }
.cue-id-stage__accents i { display: block; width: 15px; height: 15px; border-radius: 50%; }
.accent-lime { background: #ceff54; }
.accent-red { background: #dc2d28; }
.accent-violet { background: #9b7cff; }
.accent-white { background: #ededeb; }
.cue-id-stage button:disabled { cursor: not-allowed; opacity: .5; }
.cue-id-stage--compact .cue-id-stage__viewport { min-height: 520px; }

@media (max-width: 900px) {
  .cue-id-stage__layout { grid-template-columns: 1fr; }
  .cue-id-stage__viewport { min-height: 600px; border-right: 0; border-bottom: 1px solid #292b28; }
  .cue-id-stage__controls { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .cue-id-stage__compact-row { grid-column: 1 / -1; }
}

@media (max-width: 600px) {
  .cue-id-stage__heading { flex-direction: column; gap: 12px; padding: 18px; }
  .cue-id-stage__viewport { min-height: 500px; }
  .cue-id-stage__controls { grid-template-columns: 1fr; padding: 18px; }
  .cue-id-stage__compact-row { grid-column: auto; grid-template-columns: 1fr; }
  .cue-id-stage__identity strong { max-width: 135px; }
}
</style>
