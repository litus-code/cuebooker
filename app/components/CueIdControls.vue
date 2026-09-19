<script setup lang="ts">
import type { CueIdConfigV1, CueIdOption } from '../domain/cueId'
import { CLUB_MINIMAL_CATALOGUE } from '../domain/cueId'

const props = withDefaults(defineProps<{
  modelValue: CueIdConfigV1
  locale?: 'es' | 'en'
  disabled?: boolean
}>(), {
  locale: 'es',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: CueIdConfigV1]
}>()

const copy = computed(() => props.locale === 'es' ? {
  presence: 'Presencia',
  base: 'Base',
  build: 'Cuerpo',
  look: 'Look',
  outfit: 'Outfit',
  accessory: 'Accesorio',
  attitude: 'Actitud',
  pose: 'Pose',
  treatment: 'Tratamiento',
  material: 'Material',
  accent: 'Acento',
  lime: 'Lima',
  red: 'Rojo',
  none: 'Sin acento'
} : {
  presence: 'Presence',
  base: 'Base',
  build: 'Build',
  look: 'Look',
  outfit: 'Outfit',
  accessory: 'Accessory',
  attitude: 'Attitude',
  pose: 'Pose',
  treatment: 'Treatment',
  material: 'Material',
  accent: 'Accent',
  lime: 'Lime',
  red: 'Red',
  none: 'No accent'
})

function label<T extends string | null>(option: CueIdOption<T>) {
  return option.label[props.locale]
}

function set<K extends keyof CueIdConfigV1>(key: K, value: CueIdConfigV1[K]) {
  if (props.disabled) return
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}
</script>

<template>
  <div class="cue-id-controls">
    <section>
      <header><span>01</span><strong>{{ copy.presence }}</strong></header>
      <div class="cue-id-controls__group">
        <label>{{ copy.base }}</label>
        <div class="cue-id-controls__choices">
          <button v-for="item in CLUB_MINIMAL_CATALOGUE.bases" :key="String(item.id)" type="button" :class="{ active: modelValue.base === item.id }" :disabled="disabled" @click="set('base', item.id)">{{ label(item) }}</button>
        </div>
      </div>
      <div class="cue-id-controls__group">
        <label>{{ copy.build }}</label>
        <div class="cue-id-controls__choices">
          <button v-for="item in CLUB_MINIMAL_CATALOGUE.builds" :key="String(item.id)" type="button" :class="{ active: modelValue.build === item.id }" :disabled="disabled" @click="set('build', item.id)">{{ label(item) }}</button>
        </div>
      </div>
    </section>

    <section>
      <header><span>02</span><strong>{{ copy.look }}</strong></header>
      <div class="cue-id-controls__group">
        <label>{{ copy.outfit }}</label>
        <div class="cue-id-controls__choices">
          <button v-for="item in CLUB_MINIMAL_CATALOGUE.outfits" :key="String(item.id)" type="button" :class="{ active: modelValue.outfit === item.id }" :disabled="disabled" @click="set('outfit', item.id)">{{ label(item) }}</button>
        </div>
      </div>
      <div class="cue-id-controls__group">
        <label>{{ copy.accessory }}</label>
        <div class="cue-id-controls__choices">
          <button v-for="item in CLUB_MINIMAL_CATALOGUE.accessories" :key="String(item.id)" type="button" :class="{ active: modelValue.accessory === item.id }" :disabled="disabled" @click="set('accessory', item.id)">{{ label(item) }}</button>
        </div>
      </div>
    </section>

    <section>
      <header><span>03</span><strong>{{ copy.attitude }}</strong></header>
      <div class="cue-id-controls__group">
        <label>{{ copy.pose }}</label>
        <div class="cue-id-controls__choices">
          <button v-for="item in CLUB_MINIMAL_CATALOGUE.poses" :key="String(item.id)" type="button" :class="{ active: modelValue.pose === item.id }" :disabled="disabled" @click="set('pose', item.id)">{{ label(item) }}</button>
        </div>
      </div>
    </section>

    <section>
      <header><span>04</span><strong>{{ copy.treatment }}</strong></header>
      <div class="cue-id-controls__group">
        <label>{{ copy.material }}</label>
        <div class="cue-id-controls__choices">
          <button v-for="item in CLUB_MINIMAL_CATALOGUE.materials" :key="String(item.id)" type="button" :class="{ active: modelValue.material === item.id }" :disabled="disabled" @click="set('material', item.id)">{{ label(item) }}</button>
        </div>
      </div>
      <div class="cue-id-controls__group">
        <label>{{ copy.accent }}</label>
        <div class="cue-id-controls__choices">
          <button type="button" :class="{ active: modelValue.accent === 'lime' }" :disabled="disabled" @click="set('accent', 'lime')">{{ copy.lime }}</button>
          <button type="button" :class="{ active: modelValue.accent === 'red' }" :disabled="disabled" @click="set('accent', 'red')">{{ copy.red }}</button>
          <button type="button" :class="{ active: modelValue.accent === null }" :disabled="disabled" @click="set('accent', null)">{{ copy.none }}</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cue-id-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--cue-border);border-left:1px solid var(--cue-border)}
.cue-id-controls section{padding:22px;border-right:1px solid var(--cue-border);border-bottom:1px solid var(--cue-border);background:var(--cue-surface)}
.cue-id-controls header{display:flex;justify-content:space-between;gap:18px;padding-bottom:14px;border-bottom:1px solid var(--cue-border)}
.cue-id-controls header span{color:var(--cue-accent);font:700 9px/1.2 monospace}.cue-id-controls header strong{font-size:12px;letter-spacing:.05em;text-transform:uppercase}
.cue-id-controls__group{display:grid;gap:8px;margin-top:16px}.cue-id-controls__group label{color:var(--cue-muted);font:700 9px/1.2 monospace;letter-spacing:.1em;text-transform:uppercase}
.cue-id-controls__choices{display:flex;flex-wrap:wrap;gap:7px}.cue-id-controls__choices button{min-height:42px;padding:0 12px;border:1px solid var(--cue-border);background:var(--cue-bg);color:var(--cue-text);cursor:pointer;font-size:11px;font-weight:800}
.cue-id-controls__choices button.active{border-color:var(--cue-accent);background:var(--cue-accent);color:#080808}.cue-id-controls__choices button:focus-visible{outline:2px solid var(--cue-accent);outline-offset:2px}.cue-id-controls__choices button:disabled{opacity:.5;cursor:not-allowed}
@media(max-width:760px){.cue-id-controls{grid-template-columns:1fr}}
</style>
