<script setup lang="ts">
import type { CueIdCreatorConfigV1 } from '../domain/cueIdCreator'
import {
  CUE_ID_CREATOR_CATALOGUE,
  cueIdCreatorToRuntimeConfig
} from '../domain/cueIdCreator'

type Locale = 'es' | 'en'
type CreatorStep = keyof Pick<
  CueIdCreatorConfigV1,
  | 'base'
  | 'build'
  | 'skin'
  | 'face'
  | 'hair'
  | 'facialHair'
  | 'top'
  | 'bottom'
  | 'footwear'
  | 'accessory'
  | 'pose'
  | 'material'
  | 'accent'
>

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
const runtimeConfig = computed(() => cueIdCreatorToRuntimeConfig(props.modelValue))

const copy = computed(() => props.locale === 'es' ? {
  creator: 'CREADOR CUE ID',
  title: 'Construye tu identidad visual.',
  subtitle: 'Elige cada parte de tu CUE ID. El avatar de producción se conectará cuando exista un asset authored aprobado.',
  preview: 'Vista previa',
  save: 'Guardar CUE ID',
  reset: 'Restablecer',
  base: 'Base',
  build: 'Build',
  skin: 'Piel',
  face: 'Rostro',
  hair: 'Pelo',
  facialHair: 'Barba',
  top: 'Parte superior',
  bottom: 'Pantalón',
  footwear: 'Calzado',
  accessory: 'Accesorio',
  pose: 'Pose',
  material: 'Material',
  accent: 'Acento',
  none: 'Ninguno',
  current: 'Selección actual',
  authored: 'Asset authored pendiente',
  authoredBody: 'Esta vista valida el creator y su modelo semántico. El fixture actual no representa el resultado visual final.'
} : {
  creator: 'CUE ID CREATOR',
  title: 'Build your visual identity.',
  subtitle: 'Choose every part of your CUE ID. The production avatar will plug in once an approved authored asset exists.',
  preview: 'Preview',
  save: 'Save CUE ID',
  reset: 'Reset',
  base: 'Base',
  build: 'Build',
  skin: 'Skin',
  face: 'Face',
  hair: 'Hair',
  facialHair: 'Facial hair',
  top: 'Top',
  bottom: 'Bottom',
  footwear: 'Footwear',
  accessory: 'Accessory',
  pose: 'Pose',
  material: 'Material',
  accent: 'Accent',
  none: 'None',
  current: 'Current selection',
  authored: 'Authored asset pending',
  authoredBody: 'This view validates the creator and its semantic model. The current fixture does not represent the final visual result.'
})

const steps = computed(() => ([
  { id: 'base' as const, label: copy.value.base },
  { id: 'build' as const, label: copy.value.build },
  { id: 'skin' as const, label: copy.value.skin },
  { id: 'face' as const, label: copy.value.face },
  { id: 'hair' as const, label: copy.value.hair },
  { id: 'facialHair' as const, label: copy.value.facialHair },
  { id: 'top' as const, label: copy.value.top },
  { id: 'bottom' as const, label: copy.value.bottom },
  { id: 'footwear' as const, label: copy.value.footwear },
  { id: 'accessory' as const, label: copy.value.accessory },
  { id: 'pose' as const, label: copy.value.pose },
  { id: 'material' as const, label: copy.value.material },
  { id: 'accent' as const, label: copy.value.accent }
]))

function label(option: { label: { es: string; en: string } }) {
  return option.label[props.locale]
}

function update<K extends keyof CueIdCreatorConfigV1>(
  key: K,
  value: CueIdCreatorConfigV1[K]
) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

const activeOptions = computed(() => {
  switch (activeStep.value) {
    case 'base':
      return CUE_ID_CREATOR_CATALOGUE.bases.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'build':
      return CUE_ID_CREATOR_CATALOGUE.builds.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'skin':
      return CUE_ID_CREATOR_CATALOGUE.skins.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'face':
      return CUE_ID_CREATOR_CATALOGUE.faces.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'hair':
      return CUE_ID_CREATOR_CATALOGUE.hairs.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'facialHair':
      return CUE_ID_CREATOR_CATALOGUE.facialHair.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'top':
      return CUE_ID_CREATOR_CATALOGUE.tops.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'bottom':
      return CUE_ID_CREATOR_CATALOGUE.bottoms.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'footwear':
      return CUE_ID_CREATOR_CATALOGUE.footwear.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'accessory':
      return CUE_ID_CREATOR_CATALOGUE.accessories.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'pose':
      return CUE_ID_CREATOR_CATALOGUE.poses.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'material':
      return CUE_ID_CREATOR_CATALOGUE.materials.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
    case 'accent':
      return CUE_ID_CREATOR_CATALOGUE.accents.map(item => ({ id: String(item.id), label: label(item), value: item.id }))
  }
})

function isSelected(value: unknown) {
  return props.modelValue[activeStep.value] === value
}

function optionVisualClass(optionId: string) {
  return [
    'creator__option-visual',
    `creator__option-visual--${activeStep.value}`,
    `creator__option-visual--${optionId.replace(/[^a-z0-9-]/gi, '-').toLowerCase()}`
  ]
}

function select(value: unknown) {
  update(activeStep.value, value as never)
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
      <button type="button" class="creator__reset" @click="emit('reset')">
        {{ copy.reset }}
      </button>
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
          :config="runtimeConfig"
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
            <i :class="optionVisualClass(option.id)" aria-hidden="true">
              <b />
              <em />
            </i>
            <span>{{ option.label }}</span>
          </button>
        </div>

        <div class="creator__summary">
          <div><span>{{ copy.base }}</span><strong>{{ modelValue.base }}</strong></div>
          <div><span>{{ copy.build }}</span><strong>{{ modelValue.build }}</strong></div>
          <div><span>{{ copy.skin }}</span><strong>{{ modelValue.skin }}</strong></div>
          <div><span>{{ copy.face }}</span><strong>{{ modelValue.face }}</strong></div>
          <div><span>{{ copy.hair }}</span><strong>{{ modelValue.hair }}</strong></div>
          <div><span>{{ copy.facialHair }}</span><strong>{{ modelValue.facialHair }}</strong></div>
          <div><span>{{ copy.top }}</span><strong>{{ modelValue.top }}</strong></div>
          <div><span>{{ copy.bottom }}</span><strong>{{ modelValue.bottom }}</strong></div>
          <div><span>{{ copy.footwear }}</span><strong>{{ modelValue.footwear }}</strong></div>
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
.creator__heading>div{max-width:850px}
.creator__heading p{margin:0 0 10px;color:var(--cue-accent);font:700 10px/1.2 monospace;letter-spacing:.14em}
.creator__heading h1{margin:0;font-size:clamp(2.6rem,6vw,6.6rem);line-height:.86;letter-spacing:-.055em;text-transform:uppercase}
.creator__heading span{display:block;max-width:760px;margin-top:18px;color:var(--cue-muted);font-size:14px;line-height:1.6}
.creator__reset{min-height:44px;padding:0 16px;border:1px solid var(--cue-border);background:transparent;color:var(--cue-text);font-weight:800;cursor:pointer}
.creator__shell{display:grid;grid-template-columns:170px minmax(0,1fr) 310px;min-height:690px;border:1px solid var(--cue-border);background:#070908}
.creator__rail{display:flex;flex-direction:column;border-right:1px solid var(--cue-border);background:#090b0a;max-height:690px;overflow:auto}
.creator__rail button{display:grid;grid-template-columns:28px 1fr;align-items:center;gap:9px;min-height:52px;padding:0 16px;border:0;border-bottom:1px solid var(--cue-border);background:transparent;color:var(--cue-muted);text-align:left;cursor:pointer}
.creator__rail button span{font:700 9px/1 monospace}
.creator__rail button strong{font-size:11px}
.creator__rail button.active{background:color-mix(in srgb,var(--cue-accent) 7%,transparent);color:var(--cue-text);box-shadow:inset 3px 0 0 var(--cue-accent)}
.creator__rail button.active span{color:var(--cue-accent)}
.creator__stage{position:relative;min-width:0;padding:18px;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.035),transparent 38%),#050706}
.creator__stage :deep(.cue-id-stage){min-height:590px;border-color:#202420}
.creator__stage-label{position:absolute;z-index:8;top:34px;left:36px;display:grid;gap:5px;pointer-events:none}
.creator__stage-label span{color:var(--cue-muted);font:700 9px/1 monospace;letter-spacing:.12em;text-transform:uppercase}
.creator__stage-label strong{font-size:11px;text-transform:uppercase}
.creator__asset-note{position:absolute;z-index:8;left:36px;right:36px;bottom:34px;max-width:520px;margin:0;padding:10px 12px;border:1px solid rgba(255,255,255,.11);background:rgba(5,7,6,.82);backdrop-filter:blur(8px);color:#92978f;font-size:11px;line-height:1.45}
.creator__panel{display:flex;flex-direction:column;min-width:0;border-left:1px solid var(--cue-border);background:#0a0c0b}
.creator__panel-head{display:grid;gap:6px;padding:20px;border-bottom:1px solid var(--cue-border)}
.creator__panel-head span{color:var(--cue-muted);font:700 9px/1 monospace;letter-spacing:.1em;text-transform:uppercase}
.creator__panel-head strong{font-size:20px}
.creator__options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:14px;max-height:370px;overflow:auto}
.creator__options button{display:grid;gap:10px;min-height:94px;padding:10px;border:1px solid var(--cue-border);background:#0d100e;color:var(--cue-text);text-align:left;cursor:pointer}
.creator__option-visual{position:relative;display:block;height:54px;overflow:hidden;border-radius:4px;background:linear-gradient(135deg,#171b18,#2a302a);isolation:isolate}
.creator__option-visual b,.creator__option-visual em{position:absolute;display:block;content:''}
.creator__options button span{font-size:10px;font-weight:800}
.creator__options button.selected{border-color:var(--cue-accent);box-shadow:inset 0 0 0 1px var(--cue-accent)}
.creator__options button.selected .creator__option-visual{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--cue-accent) 45%,transparent)}

.creator__option-visual--skin{background:var(--skin-tone,#9f7359)}
.creator__option-visual--skin-01{--skin-tone:#f1d1bb}
.creator__option-visual--skin-02{--skin-tone:#d9aa88}
.creator__option-visual--skin-03{--skin-tone:#b9805f}
.creator__option-visual--skin-04{--skin-tone:#8f5d45}
.creator__option-visual--skin-05{--skin-tone:#67402f}
.creator__option-visual--skin-06{--skin-tone:#3d261d}

.creator__option-visual--base::before,.creator__option-visual--build::before,.creator__option-visual--face::before,.creator__option-visual--hair::before,.creator__option-visual--facialhair::before,.creator__option-visual--pose::before{content:'';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#7d847c}
.creator__option-visual--base::before{width:24px;height:38px;border-radius:44% 44% 36% 36%}
.creator__option-visual--feminine::before{width:22px}
.creator__option-visual--neutral::before{width:24px}
.creator__option-visual--masculine::before{width:27px}
.creator__option-visual--build-slim::before{width:19px}
.creator__option-visual--build-regular::before{width:24px}
.creator__option-visual--build-strong::before{width:29px}

.creator__option-visual--face::before{width:30px;height:38px;border-radius:46% 46% 42% 42%}
.creator__option-visual--face-01::before{border-radius:48% 48% 44% 44%}
.creator__option-visual--face-02::before{border-radius:42% 42% 50% 50%}
.creator__option-visual--face-03::before{clip-path:polygon(18% 0,82% 0,100% 40%,76% 100%,24% 100%,0 40%)}
.creator__option-visual--face-04::before{clip-path:polygon(24% 0,76% 0,94% 30%,82% 82%,50% 100%,18% 82%,6% 30%)}
.creator__option-visual--face-05::before{border-radius:40%}
.creator__option-visual--face-06::before{clip-path:polygon(10% 8%,90% 8%,100% 42%,72% 100%,28% 100%,0 42%)}

.creator__option-visual--hair::before{width:32px;height:34px;top:58%;border-radius:46% 46% 40% 40%;background:#777f76}
.creator__option-visual--hair b{left:50%;top:6px;transform:translateX(-50%);background:#171a17}
.creator__option-visual--buzz b{width:30px;height:12px;border-radius:50% 50% 28% 28%}
.creator__option-visual--textured-crop b{width:34px;height:16px;border-radius:60% 45% 30% 28%;transform:translateX(-50%) rotate(-4deg)}
.creator__option-visual--curly-crop b{width:36px;height:18px;border-radius:50%;box-shadow:-8px 2px 0 -3px #171a17,8px 2px 0 -3px #171a17}
.creator__option-visual--curtains b{width:38px;height:20px;border-radius:55% 55% 32% 32%;clip-path:polygon(0 0,46% 0,50% 55%,54% 0,100% 0,90% 100%,10% 100%)}
.creator__option-visual--bob b{width:42px;height:31px;border-radius:50% 50% 36% 36%}
.creator__option-visual--tied-back b{width:32px;height:17px;border-radius:50%}
.creator__option-visual--tied-back em{right:16px;top:13px;width:10px;height:22px;border-radius:50%;background:#171a17}
.creator__option-visual--locs b{width:38px;height:28px;background:repeating-linear-gradient(90deg,#171a17 0 4px,transparent 4px 7px)}
.creator__option-visual--long-natural b{width:44px;height:44px;border-radius:48% 48% 32% 32%}

.creator__option-visual--facialhair::before{width:29px;height:36px;border-radius:45%;background:#7d847c}
.creator__option-visual--facialhair b{left:50%;bottom:7px;transform:translateX(-50%);background:#181b18}
.creator__option-visual--stubble b{width:21px;height:8px;border-radius:0 0 50% 50%;opacity:.55}
.creator__option-visual--short-beard b{width:23px;height:13px;border-radius:0 0 48% 48%}
.creator__option-visual--moustache b{width:19px;height:4px;bottom:18px;border-radius:50%}

.creator__option-visual--top::before{content:'';position:absolute;left:50%;top:8px;transform:translateX(-50%);width:44px;height:38px;background:#252a26;clip-path:polygon(18% 0,82% 0,100% 18%,86% 100%,14% 100%,0 18%)}
.creator__option-visual--fitted-tee::before{width:36px}
.creator__option-visual--tank::before{width:32px;clip-path:polygon(30% 0,70% 0,88% 12%,82% 100%,18% 100%,12% 12%)}
.creator__option-visual--hoodie::after{content:'';position:absolute;left:50%;top:5px;transform:translateX(-50%);width:22px;height:12px;border:3px solid #3a403a;border-bottom:0;border-radius:50% 50% 0 0}
.creator__option-visual--bomber::before{width:48px;border-radius:6px}

.creator__option-visual--bottom::before{content:'';position:absolute;left:50%;top:8px;transform:translateX(-50%);width:34px;height:40px;background:#252a26;clip-path:polygon(8% 0,92% 0,82% 100%,56% 100%,50% 48%,44% 100%,18% 100%)}
.creator__option-visual--wide-trouser::before{width:42px}
.creator__option-visual--straight-trouser::before{width:34px}
.creator__option-visual--cargo::after{content:'';position:absolute;left:19px;right:19px;top:24px;height:8px;border-left:8px solid #343a34;border-right:8px solid #343a34}
.creator__option-visual--denim::before{background:#303943}

.creator__option-visual--footwear::before,.creator__option-visual--footwear::after{content:'';position:absolute;bottom:10px;width:33px;height:16px;background:#d8d8d3;border-radius:8px 14px 5px 5px}
.creator__option-visual--footwear::before{left:15px}
.creator__option-visual--footwear::after{right:15px;transform:scaleX(-1)}
.creator__option-visual--minimal-sneaker::before,.creator__option-visual--minimal-sneaker::after{height:12px}
.creator__option-visual--boot::before,.creator__option-visual--boot::after{height:25px;border-radius:4px 10px 4px 4px;background:#252825}

.creator__option-visual--accessory::before{content:'';position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);background:#4c524c}
.creator__option-visual--glasses::before{width:42px;height:12px;border:3px solid #aab0a9;background:transparent;border-radius:7px}
.creator__option-visual--cap::before{width:34px;height:16px;border-radius:50% 50% 20% 20%}
.creator__option-visual--headphones::before{width:36px;height:32px;border:5px solid #4c524c;border-bottom:0;background:transparent;border-radius:50% 50% 0 0}
.creator__option-visual--none::before{content:'×';position:absolute;inset:0;display:grid;place-items:center;color:#697068;font:700 24px/1 monospace}

.creator__option-visual--pose::before{width:12px;height:34px;border-radius:7px;background:#777f76}
.creator__option-visual--pose::after{content:'';position:absolute;left:50%;top:10px;width:20px;height:20px;border:4px solid #777f76;border-bottom:0;border-radius:50%;transform:translateX(-50%)}
.creator__option-visual--relaxed{transform:rotate(-3deg)}
.creator__option-visual--focused::before{transform:translate(-50%,-50%) rotate(3deg)}
.creator__option-visual--editorial::before{transform:translate(-50%,-50%) rotate(10deg)}

.creator__option-visual--material{background:linear-gradient(135deg,#303530,#111411)}
.creator__option-visual--satin{background:linear-gradient(115deg,#111411 0%,#626b61 38%,#1a1e1a 54%,#737c70 72%,#111411 100%)}
.creator__option-visual--accent{background:#181b18}
.creator__option-visual--lime{background:#ceff54}
.creator__option-visual--red{background:#ff4545}
.creator__summary{display:grid;gap:0;margin:4px 14px 14px;border-top:1px solid var(--cue-border);max-height:220px;overflow:auto}
.creator__summary div{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid var(--cue-border)}
.creator__summary span{color:var(--cue-muted);font:700 9px/1 monospace;text-transform:uppercase}
.creator__summary strong{max-width:150px;overflow:hidden;text-overflow:ellipsis;font-size:10px;text-transform:uppercase}
.creator__save{margin:auto 14px 14px;min-height:48px;border:1px solid var(--cue-accent);background:var(--cue-accent);color:#070807;font-weight:900;cursor:pointer}
.creator__mobile-tabs{display:none}
button:focus-visible{outline:2px solid var(--cue-accent);outline-offset:2px}
@media(max-width:1040px){
  .creator__shell{grid-template-columns:128px minmax(0,1fr) 270px}
  .creator__rail button{grid-template-columns:1fr;gap:4px;padding:0 12px}
  .creator__stage :deep(.cue-id-stage){min-height:540px}
}
@media(max-width:780px){
  .creator__heading{align-items:start;flex-direction:column}
  .creator__reset{width:100%}
  .creator__shell{grid-template-columns:1fr;min-height:0}
  .creator__rail{display:none}
  .creator__stage{padding:0}
  .creator__stage :deep(.cue-id-stage){min-height:540px;border:0}
  .creator__stage-label{top:18px;left:18px}
  .creator__asset-note{left:16px;right:16px;bottom:18px}
  .creator__panel{border-left:0;border-top:1px solid var(--cue-border)}
  .creator__panel-head{padding:16px}
  .creator__options{display:flex;overflow-x:auto;max-height:none;padding:12px}
  .creator__options button{flex:0 0 118px}
  .creator__summary{display:none}
  .creator__save{margin:2px 12px 12px}
  .creator__mobile-tabs{display:flex;position:sticky;bottom:0;z-index:20;overflow-x:auto;border:1px solid var(--cue-border);background:rgba(8,10,9,.96);backdrop-filter:blur(14px)}
  .creator__mobile-tabs button{flex:0 0 auto;min-height:48px;padding:0 14px;border:0;border-right:1px solid var(--cue-border);background:transparent;color:var(--cue-muted);font-size:10px;font-weight:800}
  .creator__mobile-tabs button.active{color:var(--cue-accent)}
}
</style>
