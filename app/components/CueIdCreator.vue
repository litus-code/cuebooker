<script setup lang="ts">
import type { CueIdConfigV1 } from '../domain/cueId'
import { CUE_ID_CREATOR_CATALOGUE } from '../domain/cueId'

type Locale = 'es' | 'en'
type CreatorStep = 'base' | 'build' | 'outfit' | 'accessory' | 'pose' | 'material' | 'accent'

const props = withDefaults(defineProps<{
  modelValue: CueIdCreatorConfigV1
  locale?: Locale
}>(), {
  locale: 'es'
})

const emit = defineEmits<{
  'update:modelValue': [value: CueIdCreatorConfigV1]
  reset: []
}>()

const activeStep = ref<CreatorStep>('base')

const copy = computed(() => props.locale === 'es' ? {
  creator: 'CREADOR CUE ID',
  title: 'Construye tu identidad visual.',
  subtitle: 'Una identidad configurable para tu perfil de artista. El asset actual sigue siendo un fixture técnico hasta que exista el sculpt authored aprobado.',
  preview: 'Vista previa',
  config: 'Tu CUE ID',
  save: 'Guardar CUE ID',
  reset: 'Restablecer',
  base: 'Base',
  build: 'Build',
  skin: 'Piel',\n  face: 'Rostro',\n  hair: 'Pelo',\n  facialHair: 'Barba',\n  top: 'Parte superior',\n  bottom: 'Pantalón',\n  footwear: 'Calzado',
  accessory: 'Accesorio',
  pose: 'Pose',
  material: 'Material',
  accent: 'Acento',
  none: 'Ninguno',
  current: 'Selección actual',
  authored: 'Asset authored pendiente',
  authoredBody: 'El creator ya puede validarse como producto. La figura de producción se conectará aquí cuando pase los gates visuales de CUE ID V2.'
} : {
  creator: 'CUE ID CREATOR',
  title: 'Build your visual identity.',
  subtitle: 'A configurable identity for your artist profile. The current asset remains a technical fixture until the authored sculpt is approved.',
  preview: 'Preview',
  config: 'Your CUE ID',
  save: 'Save CUE ID',
  reset: 'Reset',
  base: 'Base',
  build: 'Build',
  skin: 'Skin',\n  face: 'Face',\n  hair: 'Hair',\n  facialHair: 'Facial hair',\n  top: 'Top',\n  bottom: 'Bottom',\n  footwear: 'Footwear',
  accessory: 'Accessory',
  pose: 'Pose',
  material: 'Material',
  accent: 'Accent',
  none: 'None',
  current: 'Current selection',
  authored: 'Authored asset pending',
  authoredBody: 'The creator can now be validated as a product. The production figure will plug in here once the CUE ID V2 visual gates pass.'
})

const steps = computed(() => ([
  { id: 'base' as const, label: copy.value.base },
  { id: 'build' as const, label: copy.value.build },
  { id: 'skin' as const, label: copy.value.skin },\n  { id: 'face' as const, label: copy.value.face },\n  { id: 'hair' as const, label: copy.value.hair },\n  { id: 'facialHair' as const, label: copy.value.facialHair },\n  { id: 'top' as const, label: copy.value.top },\n  { id: 'bottom' as const, label: copy.value.bottom },\n  { id: 'footwear' as const, label: copy.value.footwear },
  { id: 'accessory' as const, label: copy.value.accessory },
  { id: 'pose' as const, label: copy.value.pose },
  { id: 'material' as const, label: copy.value.material },
  { id: 'accent' as const, label: copy.value.accent }
]))

function label(option: { label: { es: string; en: string } }) {
  return option.label[props.locale]
}

function update<K extends keyof CueIdCreatorConfigV1>(key: K, value: CueIdCreatorConfigV1[K]) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const activeOptions = computed(() => {
  switch (activeStep.value) {
    case 'base':
      return CUE_ID_CREATOR_CATALOGUE.bases.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'build':
      return CUE_ID_CREATOR_CATALOGUE.builds.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'outfit':
      return CUE_ID_CREATOR_CATALOGUE.outfits.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'accessory':
      return CUE_ID_CREATOR_CATALOGUE.accessories.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'pose':
      return CUE_ID_CREATOR_CATALOGUE.poses.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'material':
      return CUE_ID_CREATOR_CATALOGUE.materials.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'accent':
      return [
        { id: 'lime', label: 'Lime', value: 'lime' },
        { id: 'red', label: 'Red', value: 'red' },
        { id: 'none', label: copy.value.none, value: null }
      ]
  }
})

function isSelected(value: unknown) {
  return props.modelValue[activeStep.value] === value
}

function select(value: unknown) {
  update(activeStep.value as keyof CueIdCreatorConfigV1, value as never)
}
</script>

<template>
  <section class="creator">
    <header class="creator__heading">
      <div>
        <p>{{ copy.creator }}</p>
        <h1>{{ copy.title }}</h1>
        <span>{{ copy.subtitle }}</span>
      </div>
      <button type="button" class="creator__reset" @click="emit('reset')">{{ copy.reset }}</button>
    </header>

    <div class="creator__shell">
      <nav class="creator__rail" aria-label="CUE ID creator categories">
        <button
          v-for="(step, index) in steps"
          :key="step.id"
          type="button"
          :class="{ active: activeStep === step.id }"
          :aria-current="activeStep === step.id ? 'step' : undefined"
          @click="activeStep = step.id"
        >
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ step.label }}</strong>
        </button>
      </nav>

      <div class="creator__stage">
        <div class="creator__stage-label">
          <span>{{ copy.preview }}</span>
          <strong>{{ copy.authored }}</strong>
        </div>
        <CueIdStage
          :config="cueIdCreatorToRuntimeConfig(modelValue)"
          artist-name="LITUS"
          lab-asset="candidate"
          lab-quality="medium"
          :show-diagnostics="false"
        />
        <p class="creator__asset-note">{{ copy.authoredBody }}</p>
      </div>

      <aside class="creator__panel">
        <div class="creator__panel-head">
          <span>{{ copy.current }}</span>
          <strong>{{ steps.find(step => step.id === activeStep)?.label }}</strong>
        </div>

        <div class="creator__options">
          <button
            v-for="option in activeOptions"
            :key="option.id"
            type="button"
            :class="{ selected: isSelected(option.value) }"
            :aria-pressed="isSelected(option.value)"
            @click="select(option.value)"
          >
            <i aria-hidden="true" />
            <span>{{ option.label }}</span>
          </button>
        </div>

        <div class="creator__summary">
          <div><span>{{ copy.base }}</span><strong>{{ modelValue.base }}</strong></div>
          <div><span>{{ copy.build }}</span><strong>{{ modelValue.build }}</strong></div>
          <div><span>{{ copy.skin }}</span><strong>{{ modelValue.skin }}</strong></div>\n          <div><span>{{ copy.face }}</span><strong>{{ modelValue.face }}</strong></div>\n          <div><span>{{ copy.hair }}</span><strong>{{ modelValue.hair }}</strong></div>\n          <div><span>{{ copy.top }}</span><strong>{{ modelValue.top }}</strong></div>\n          <div><span>{{ copy.bottom }}</span><strong>{{ modelValue.bottom }}</strong></div>\n          <div><span>{{ copy.footwear }}</span><strong>{{ modelValue.footwear }}</strong></div>
          <div><span>{{ copy.accessory }}</span><strong>{{ modelValue.accessory || copy.none }}</strong></div>
          <div><span>{{ copy.pose }}</span><strong>{{ modelValue.pose }}</strong></div>
        </div>

        <button type="button" class="creator__save">{{ copy.save }}</button>
      </aside>
    </div>

    <div class="creator__mobile-tabs" aria-label="CUE ID creator categories">
      <button
        v-for="step in steps"
        :key="step.id"
        type="button"
        :class="{ active: activeStep === step.id }"
        @click="activeStep = step.id"
      >
        {{ step.label }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.creator{display:grid;gap:18px;color:var(--cue-text)}
.creator__heading{display:flex;justify-content:space-between;gap:28px;align-items:end;padding:26px 0 10px}
.creator__heading>div{max-width:850px}.creator__heading p{margin:0 0 10px;color:var(--cue-accent);font:700 10px/1.2 monospace;letter-spacing:.14em}.creator__heading h1{margin:0;font-size:clamp(2.6rem,6vw,6.6rem);line-height:.86;letter-spacing:-.055em;text-transform:uppercase}.creator__heading span{display:block;max-width:760px;margin-top:18px;color:var(--cue-muted);font-size:14px;line-height:1.6}
.creator__reset{min-height:44px;padding:0 16px;border:1px solid var(--cue-border);background:transparent;color:var(--cue-text);font-weight:800;cursor:pointer}
.creator__shell{display:grid;grid-template-columns:170px minmax(0,1fr) 310px;min-height:690px;border:1px solid var(--cue-border);background:#070908}
.creator__rail{display:flex;flex-direction:column;border-right:1px solid var(--cue-border);background:#090b0a}.creator__rail button{display:grid;grid-template-columns:28px 1fr;align-items:center;gap:9px;min-height:62px;padding:0 16px;border:0;border-bottom:1px solid var(--cue-border);background:transparent;color:var(--cue-muted);text-align:left;cursor:pointer}.creator__rail button span{font:700 9px/1 monospace}.creator__rail button strong{font-size:11px}.creator__rail button.active{background:color-mix(in srgb,var(--cue-accent) 7%,transparent);color:var(--cue-text);box-shadow:inset 3px 0 0 var(--cue-accent)}.creator__rail button.active span{color:var(--cue-accent)}
.creator__stage{position:relative;min-width:0;padding:18px;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.035),transparent 38%),#050706}.creator__stage :deep(.cue-id-stage){min-height:590px;border-color:#202420}.creator__stage-label{position:absolute;z-index:8;top:34px;left:36px;display:grid;gap:5px;pointer-events:none}.creator__stage-label span{color:var(--cue-muted);font:700 9px/1 monospace;letter-spacing:.12em;text-transform:uppercase}.creator__stage-label strong{font-size:11px;text-transform:uppercase}.creator__asset-note{position:absolute;z-index:8;left:36px;right:36px;bottom:34px;max-width:520px;margin:0;padding:10px 12px;border:1px solid rgba(255,255,255,.11);background:rgba(5,7,6,.82);backdrop-filter:blur(8px);color:#92978f;font-size:11px;line-height:1.45}
.creator__panel{display:flex;flex-direction:column;min-width:0;border-left:1px solid var(--cue-border);background:#0a0c0b}.creator__panel-head{display:grid;gap:6px;padding:20px;border-bottom:1px solid var(--cue-border)}.creator__panel-head span{color:var(--cue-muted);font:700 9px/1 monospace;letter-spacing:.1em;text-transform:uppercase}.creator__panel-head strong{font-size:20px}
.creator__options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:14px}.creator__options button{display:grid;gap:10px;min-height:94px;padding:10px;border:1px solid var(--cue-border);background:#0d100e;color:var(--cue-text);text-align:left;cursor:pointer}.creator__options button i{display:block;height:38px;border-radius:3px;background:linear-gradient(135deg,#171b18,#2a302a)}.creator__options button span{font-size:10px;font-weight:800}.creator__options button.selected{border-color:var(--cue-accent);box-shadow:inset 0 0 0 1px var(--cue-accent)}.creator__options button.selected i{background:linear-gradient(135deg,color-mix(in srgb,var(--cue-accent) 24%,#171b18),#252b25)}
.creator__summary{display:grid;gap:0;margin:4px 14px 14px;border-top:1px solid var(--cue-border)}.creator__summary div{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--cue-border)}.creator__summary span{color:var(--cue-muted);font:700 9px/1 monospace;text-transform:uppercase}.creator__summary strong{max-width:150px;overflow:hidden;text-overflow:ellipsis;font-size:10px;text-transform:uppercase}
.creator__save{margin:auto 14px 14px;min-height:48px;border:1px solid var(--cue-accent);background:var(--cue-accent);color:#070807;font-weight:900;cursor:pointer}
.creator__mobile-tabs{display:none}
button:focus-visible{outline:2px solid var(--cue-accent);outline-offset:2px}
@media(max-width:1040px){.creator__shell{grid-template-columns:128px minmax(0,1fr) 270px}.creator__rail button{grid-template-columns:1fr;gap:4px;padding:0 12px}.creator__stage :deep(.cue-id-stage){min-height:540px}}
@media(max-width:780px){.creator__heading{align-items:start;flex-direction:column}.creator__reset{width:100%}.creator__shell{grid-template-columns:1fr;min-height:0}.creator__rail{display:none}.creator__stage{padding:0}.creator__stage :deep(.cue-id-stage){min-height:540px;border:0}.creator__stage-label{top:18px;left:18px}.creator__asset-note{left:16px;right:16px;bottom:18px}.creator__panel{border-left:0;border-top:1px solid var(--cue-border)}.creator__panel-head{padding:16px}.creator__options{display:flex;overflow-x:auto;padding:12px}.creator__options button{flex:0 0 118px}.creator__summary{display:none}.creator__save{margin:2px 12px 12px}.creator__mobile-tabs{display:flex;position:sticky;bottom:0;z-index:20;overflow-x:auto;border:1px solid var(--cue-border);background:rgba(8,10,9,.96);backdrop-filter:blur(14px)}.creator__mobile-tabs button{flex:0 0 auto;min-height:48px;padding:0 14px;border:0;border-right:1px solid var(--cue-border);background:transparent;color:var(--cue-muted);font-size:10px;font-weight:800}.creator__mobile-tabs button.active{color:var(--cue-accent)}}
</style>
