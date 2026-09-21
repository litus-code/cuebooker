<script setup lang="ts">
import {
  CUE_ID_STYLIZED_CREATOR_CATALOGUE,
  type CueIdStylizedCreatorConfigV1,
  type CueIdStylizedBodyId,
  type CueIdStylizedExpressionId,
  type CueIdStylizedHairId,
  type CueIdStylizedGarmentColorId
} from '../domain/cueIdStylizedCreator'
import {
  CUE_ID_WORKSPACE_SECTIONS,
  cueIdSwitchBody,
  type CueIdWorkspaceSection
} from '../domain/cueIdWorkspace'
import { CUE_ID_SKIN_TONES } from '../domain/cueIdBodyMaterials'

type Locale = 'es' | 'en'

const props = withDefaults(defineProps<{
  modelValue: CueIdStylizedCreatorConfigV1
  locale?: Locale
}>(), {
  locale: 'es'
})

const emit = defineEmits<{
  'update:modelValue': [value: CueIdStylizedCreatorConfigV1]
  save: [value: CueIdStylizedCreatorConfigV1]
}>()

const activeSection = ref<CueIdWorkspaceSection>('identity')

const copy = computed(() => props.locale === 'es' ? {
  title: 'CUE ID Creator',
  subtitle: 'Mismo catálogo. Tu identidad.',
  rigPending: 'Preview 3D pendiente de rig',
  rigBody: 'El cuerpo ya está definido. El rig físico se integrará aquí cuando pase la revisión de deformación.',
  body: 'Body',
  skin: 'Piel',
  expression: 'Expresión',
  hair: 'Pelo',
  hairColor: 'Color de pelo',
  eyes: 'Ojos',
  lenses: 'Lentillas',
  facialHair: 'Barba / bigote',
  piercings: 'Piercings',
  makeup: 'Maquillaje',
  nails: 'Uñas',
  top: 'Parte superior',
  bottom: 'Parte inferior',
  onePiece: 'Una pieza',
  footwear: 'Calzado',
  headwear: 'Cabeza',
  faceAccessory: 'Cara',
  earAccessory: 'Audio',
  gloves: 'Guantes',
  torsoAccessory: 'Torso',
  neckAccessory: 'Cuello',
  color: 'Color',
  identity: 'Identidad',
  face: 'Cara',
  outfit: 'Ropa',
  accessories: 'Accesorios',
  save: 'Guardar CUE ID',
  sameCatalogue: 'Todas las opciones están disponibles para ambos cuerpos.',
  previewBody: 'Preview activo',
  localDraft: 'El guardado del laboratorio no publica ni conecta assets a producción.'
} : {
  title: 'CUE ID Creator',
  subtitle: 'Same catalogue. Your identity.',
  rigPending: '3D preview pending rig',
  rigBody: 'The body is already defined. The physical rig will appear here once deformation review passes.',
  body: 'Body',
  skin: 'Skin',
  expression: 'Expression',
  hair: 'Hair',
  hairColor: 'Hair color',
  eyes: 'Eyes',
  lenses: 'Contact lenses',
  facialHair: 'Facial hair',
  piercings: 'Piercings',
  makeup: 'Makeup',
  nails: 'Nails',
  top: 'Top',
  bottom: 'Bottom',
  onePiece: 'One-piece',
  footwear: 'Footwear',
  headwear: 'Headwear',
  faceAccessory: 'Face',
  earAccessory: 'Audio',
  gloves: 'Gloves',
  torsoAccessory: 'Torso',
  neckAccessory: 'Neck',
  color: 'Color',
  identity: 'Identity',
  face: 'Face',
  outfit: 'Outfit',
  accessories: 'Accessories',
  save: 'Save CUE ID',
  sameCatalogue: 'Every option is available for both bodies.',
  previewBody: 'Active preview',
  localDraft: 'Lab save does not publish or connect assets to production.'
})

const sectionLabels = computed<Record<CueIdWorkspaceSection, string>>(() => ({
  identity: copy.value.identity,
  hair: copy.value.hair,
  face: copy.value.face,
  outfit: copy.value.outfit,
  footwear: copy.value.footwear,
  accessories: copy.value.accessories
}))

const currentBodyLabel = computed(() => props.modelValue.body === 'male' ? 'Male' : 'Female')

const currentLookSummary = computed(() => [
  props.modelValue.hair,
  props.modelValue.top,
  props.modelValue.bottom,
  props.modelValue.footwear
].join(' · '))

function save() {
  emit('save', {
    ...props.modelValue,
    piercings: [...props.modelValue.piercings]
  })
}

function patch<K extends keyof CueIdStylizedCreatorConfigV1>(
  key: K,
  value: CueIdStylizedCreatorConfigV1[K]
) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
    piercings: [...props.modelValue.piercings]
  })
}

function setBody(body: CueIdStylizedBodyId) {
  emit('update:modelValue', cueIdSwitchBody(props.modelValue, body))
}

function togglePiercing(id: CueIdStylizedCreatorConfigV1['piercings'][number]) {
  const values = props.modelValue.piercings.includes(id)
    ? props.modelValue.piercings.filter(value => value !== id)
    : [...props.modelValue.piercings, id].slice(0, 3)

  emit('update:modelValue', {
    ...props.modelValue,
    piercings: values
  })
}

const garmentColors = CUE_ID_STYLIZED_CREATOR_CATALOGUE.garmentColors

function colorHex(id: CueIdStylizedGarmentColorId) {
  return {
    black: '#111111',
    white: '#f3f3ef',
    charcoal: '#34373a',
    grey: '#858a8d',
    lime: '#ceff54',
    red: '#ff4545',
    purple: '#905cff',
    blue: '#3478ff'
  }[id]
}

function hairColorHex(id: CueIdStylizedCreatorConfigV1['hairColor']) {
  return {
    black: '#141311',
    'dark-brown': '#2a1d18',
    brown: '#654332',
    blond: '#d8b77f',
    platinum: '#dedbd2',
    red: '#9e3027',
    blue: '#1f63d9'
  }[id]
}
</script>

<template>
  <section class="cue-workspace">
    <header class="cue-workspace__topbar">
      <div>
        <p>CUE ID</p>
        <h1>{{ copy.title }}</h1>
        <span>{{ copy.subtitle }}</span>
      </div>
      <button type="button" class="cue-workspace__save" @click="save">{{ copy.save }}</button>
    </header>

    <div class="cue-workspace__layout">
      <section class="cue-workspace__stage">
        <div class="cue-workspace__stage-head">
          <div>
            <span>{{ copy.body }}</span>
            <strong>{{ currentBodyLabel }}</strong>
          </div>
          <div class="cue-workspace__body-toggle" role="group" :aria-label="copy.body">
            <button
              v-for="body in CUE_ID_STYLIZED_CREATOR_CATALOGUE.bodies"
              :key="body"
              type="button"
              :class="{ active: modelValue.body === body }"
              :aria-pressed="modelValue.body === body"
              @click="setBody(body)"
            >
              {{ body === 'male' ? 'Male' : 'Female' }}
            </button>
          </div>
        </div>

        <div class="cue-workspace__stage-placeholder">
          <div class="cue-workspace__silhouette" :data-body="modelValue.body">
            <i class="cue-workspace__silhouette-head" />
            <i class="cue-workspace__silhouette-body" />
          </div>
          <div class="cue-workspace__pending">
            <span class="cue-workspace__preview-kicker">{{ copy.previewBody }} · {{ currentBodyLabel }}</span>
            <strong>{{ copy.rigPending }}</strong>
            <span>{{ copy.rigBody }}</span>
            <small>{{ currentLookSummary }}</small>
          </div>
        </div>

        <div class="cue-workspace__shared-note">
          <span>{{ copy.sameCatalogue }}</span>
          <small>{{ copy.localDraft }}</small>
        </div>
      </section>

      <aside class="cue-workspace__editor">
        <nav class="cue-workspace__tabs" aria-label="CUE ID creator sections">
          <button
            v-for="section in CUE_ID_WORKSPACE_SECTIONS"
            :key="section"
            type="button"
            :class="{ active: activeSection === section }"
            @click="activeSection = section"
          >
            {{ sectionLabels[section] }}
          </button>
        </nav>

        <div v-if="activeSection === 'identity'" class="cue-workspace__group">
          <h2>{{ copy.skin }}</h2>
          <div class="cue-workspace__swatches">
            <button
              v-for="skin in CUE_ID_STYLIZED_CREATOR_CATALOGUE.skins"
              :key="skin"
              type="button"
              :class="{ selected: modelValue.skin === skin }"
              :style="{ '--swatch': CUE_ID_SKIN_TONES[skin].color }"
              :aria-label="skin"
              @click="patch('skin', skin)"
            />
          </div>

          <h2>{{ copy.expression }}</h2>
          <div class="cue-workspace__tiles cue-workspace__tiles--preview">
            <button
              v-for="expression in CUE_ID_STYLIZED_CREATOR_CATALOGUE.expressions"
              :key="expression"
              type="button"
              :class="{ selected: modelValue.expression === expression }"
              @click="patch('expression', expression as CueIdStylizedExpressionId)"
            >
              <i>{{ currentBodyLabel }}</i>
              <span>{{ expression }}</span>
            </button>
          </div>
        </div>

        <div v-else-if="activeSection === 'hair'" class="cue-workspace__group">
          <h2>{{ copy.hair }}</h2>
          <div class="cue-workspace__tiles cue-workspace__tiles--preview">
            <button
              v-for="hair in CUE_ID_STYLIZED_CREATOR_CATALOGUE.hairs"
              :key="hair"
              type="button"
              :class="{ selected: modelValue.hair === hair }"
              @click="patch('hair', hair as CueIdStylizedHairId)"
            >
              <i>{{ currentBodyLabel }}</i>
              <span>{{ hair }}</span>
            </button>
          </div>

          <h2>{{ copy.hairColor }}</h2>
          <div class="cue-workspace__swatches">
            <button
              v-for="hairColor in CUE_ID_STYLIZED_CREATOR_CATALOGUE.hairColors"
              :key="hairColor"
              type="button"
              :class="{ selected: modelValue.hairColor === hairColor }"
              :style="{ '--swatch': hairColorHex(hairColor) }"
              :aria-label="hairColor"
              @click="patch('hairColor', hairColor)"
            />
          </div>
        </div>

        <div v-else-if="activeSection === 'face'" class="cue-workspace__group">
          <h2>{{ copy.eyes }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="eyeColor in CUE_ID_STYLIZED_CREATOR_CATALOGUE.eyeColors"
              :key="eyeColor"
              type="button"
              :class="{ selected: modelValue.eyeColor === eyeColor }"
              @click="patch('eyeColor', eyeColor)"
            >{{ eyeColor }}</button>
          </div>

          <h2>{{ copy.lenses }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="lens in CUE_ID_STYLIZED_CREATOR_CATALOGUE.contactLenses"
              :key="lens"
              type="button"
              :class="{ selected: modelValue.contactLens === lens }"
              @click="patch('contactLens', lens)"
            >{{ lens }}</button>
          </div>

          <h2>{{ copy.facialHair }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="facialHair in CUE_ID_STYLIZED_CREATOR_CATALOGUE.facialHair"
              :key="facialHair"
              type="button"
              :class="{ selected: modelValue.facialHair === facialHair }"
              @click="patch('facialHair', facialHair)"
            >{{ facialHair }}</button>
          </div>

          <h2>{{ copy.piercings }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="piercing in CUE_ID_STYLIZED_CREATOR_CATALOGUE.piercings"
              :key="piercing"
              type="button"
              :class="{ selected: modelValue.piercings.includes(piercing) }"
              @click="togglePiercing(piercing)"
            >{{ piercing }}</button>
          </div>

          <h2>{{ copy.makeup }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="makeup in CUE_ID_STYLIZED_CREATOR_CATALOGUE.makeup"
              :key="makeup"
              type="button"
              :class="{ selected: modelValue.makeup === makeup }"
              @click="patch('makeup', makeup)"
            >{{ makeup }}</button>
          </div>

          <h2>{{ copy.nails }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="nail in CUE_ID_STYLIZED_CREATOR_CATALOGUE.nails"
              :key="nail"
              type="button"
              :class="{ selected: modelValue.nails === nail }"
              @click="patch('nails', nail)"
            >{{ nail }}</button>
          </div>
        </div>

        <div v-else-if="activeSection === 'outfit'" class="cue-workspace__group">
          <h2>{{ copy.top }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="top in CUE_ID_STYLIZED_CREATOR_CATALOGUE.tops"
              :key="top"
              type="button"
              :class="{ selected: modelValue.top === top }"
              @click="patch('top', top)"
            >{{ top }}</button>
          </div>

          <h2>{{ copy.bottom }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="bottom in CUE_ID_STYLIZED_CREATOR_CATALOGUE.bottoms"
              :key="bottom"
              type="button"
              :class="{ selected: modelValue.bottom === bottom }"
              @click="patch('bottom', bottom)"
            >{{ bottom }}</button>
          </div>

          <h2>{{ copy.onePiece }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="piece in CUE_ID_STYLIZED_CREATOR_CATALOGUE.onePieces"
              :key="piece"
              type="button"
              :class="{ selected: modelValue.onePiece === piece }"
              @click="patch('onePiece', piece)"
            >{{ piece }}</button>
          </div>

          <h2>{{ copy.top }} · {{ copy.color }}</h2>
          <div class="cue-workspace__swatches">
            <button
              v-for="color in garmentColors"
              :key="'top-' + color"
              type="button"
              :class="{ selected: modelValue.topColor === color }"
              :style="{ '--swatch': colorHex(color) }"
              :aria-label="color"
              @click="patch('topColor', color)"
            />
          </div>

          <h2>{{ copy.bottom }} · {{ copy.color }}</h2>
          <div class="cue-workspace__swatches">
            <button
              v-for="color in garmentColors"
              :key="'bottom-' + color"
              type="button"
              :class="{ selected: modelValue.bottomColor === color }"
              :style="{ '--swatch': colorHex(color) }"
              :aria-label="color"
              @click="patch('bottomColor', color)"
            />
          </div>

          <template v-if="modelValue.onePiece !== 'none'">
            <h2>{{ copy.onePiece }} · {{ copy.color }}</h2>
            <div class="cue-workspace__swatches">
              <button
                v-for="color in garmentColors"
                :key="'one-piece-' + color"
                type="button"
                :class="{ selected: modelValue.onePieceColor === color }"
                :style="{ '--swatch': colorHex(color) }"
                :aria-label="color"
                @click="patch('onePieceColor', color)"
              />
            </div>
          </template>
        </div>

        <div v-else-if="activeSection === 'footwear'" class="cue-workspace__group">
          <h2>{{ copy.footwear }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="footwear in CUE_ID_STYLIZED_CREATOR_CATALOGUE.footwear"
              :key="footwear"
              type="button"
              :class="{ selected: modelValue.footwear === footwear }"
              @click="patch('footwear', footwear)"
            >{{ footwear }}</button>
          </div>

          <h2>{{ copy.color }}</h2>
          <div class="cue-workspace__swatches">
            <button
              v-for="color in garmentColors"
              :key="color"
              type="button"
              :class="{ selected: modelValue.footwearColor === color }"
              :style="{ '--swatch': colorHex(color) }"
              :aria-label="color"
              @click="patch('footwearColor', color)"
            />
          </div>
        </div>

        <div v-else class="cue-workspace__group">
          <h2>{{ copy.headwear }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="headwear in CUE_ID_STYLIZED_CREATOR_CATALOGUE.headwear"
              :key="headwear"
              type="button"
              :class="{ selected: modelValue.headwear === headwear }"
              @click="patch('headwear', headwear)"
            >{{ headwear }}</button>
          </div>

          <h2>{{ copy.faceAccessory }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="faceAccessory in CUE_ID_STYLIZED_CREATOR_CATALOGUE.faceAccessories"
              :key="faceAccessory"
              type="button"
              :class="{ selected: modelValue.faceAccessory === faceAccessory }"
              @click="patch('faceAccessory', faceAccessory)"
            >{{ faceAccessory }}</button>
          </div>

          <h2>{{ copy.earAccessory }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="earAccessory in CUE_ID_STYLIZED_CREATOR_CATALOGUE.earAccessories"
              :key="earAccessory"
              type="button"
              :class="{ selected: modelValue.earAccessory === earAccessory }"
              @click="patch('earAccessory', earAccessory)"
            >{{ earAccessory }}</button>
          </div>

          <h2>{{ copy.torsoAccessory }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="torsoAccessory in CUE_ID_STYLIZED_CREATOR_CATALOGUE.torsoAccessories"
              :key="torsoAccessory"
              type="button"
              :class="{ selected: modelValue.torsoAccessory === torsoAccessory }"
              @click="patch('torsoAccessory', torsoAccessory)"
            >{{ torsoAccessory }}</button>
          </div>

          <h2>{{ copy.gloves }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="glove in CUE_ID_STYLIZED_CREATOR_CATALOGUE.gloves"
              :key="glove"
              type="button"
              :class="{ selected: modelValue.gloves === glove }"
              @click="patch('gloves', glove)"
            >{{ glove }}</button>
          </div>

          <h2>{{ copy.neckAccessory }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="neckAccessory in CUE_ID_STYLIZED_CREATOR_CATALOGUE.neckAccessories"
              :key="neckAccessory"
              type="button"
              :class="{ selected: modelValue.neckAccessory === neckAccessory }"
              @click="patch('neckAccessory', neckAccessory)"
            >{{ neckAccessory }}</button>
          </div>

          <h2>{{ copy.accessories }} · {{ copy.color }}</h2>
          <div class="cue-workspace__swatches">
            <button
              v-for="color in garmentColors"
              :key="'accessory-' + color"
              type="button"
              :class="{ selected: modelValue.accessoryColor === color }"
              :style="{ '--swatch': colorHex(color) }"
              :aria-label="color"
              @click="patch('accessoryColor', color)"
            />
          </div>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.cue-workspace{display:grid;gap:18px;padding:24px 0 12px}
.cue-workspace__topbar{display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
.cue-workspace__topbar p{margin:0 0 6px;color:var(--cue-accent);font:800 10px/1 monospace;letter-spacing:.18em}
.cue-workspace__topbar h1{margin:0;font-size:clamp(1.9rem,4vw,3.2rem);line-height:.95}
.cue-workspace__topbar span{display:block;margin-top:8px;color:var(--cue-muted)}
.cue-workspace__save{border:0;border-radius:12px;padding:13px 18px;background:var(--cue-accent);color:#111;font-weight:900}
.cue-workspace__layout{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(380px,.9fr);gap:14px;min-height:680px}
.cue-workspace__stage,.cue-workspace__editor{border:1px solid var(--cue-border);border-radius:20px;background:color-mix(in srgb,var(--cue-surface) 94%,transparent)}
.cue-workspace__stage{display:grid;grid-template-rows:auto 1fr auto;overflow:hidden}
.cue-workspace__stage-head{display:flex;justify-content:space-between;align-items:center;padding:18px;border-bottom:1px solid var(--cue-border)}
.cue-workspace__stage-head span{display:block;color:var(--cue-muted);font-size:11px;text-transform:uppercase;letter-spacing:.1em}.cue-workspace__stage-head strong{font-size:1.1rem}
.cue-workspace__body-toggle{display:flex;padding:3px;border:1px solid var(--cue-border);border-radius:999px}.cue-workspace__body-toggle button{border:0;border-radius:999px;padding:8px 14px;background:transparent;color:var(--cue-muted);font-weight:800}.cue-workspace__body-toggle button.active{background:var(--cue-accent);color:#111}
.cue-workspace__stage-placeholder{position:relative;display:grid;place-items:center;min-height:560px;background:radial-gradient(circle at 50% 45%,rgba(206,255,84,.07),transparent 38%),linear-gradient(180deg,rgba(255,255,255,.02),transparent)}
.cue-workspace__silhouette{position:absolute;inset:8% 24% 8%;opacity:.15;filter:blur(.1px)}
.cue-workspace__silhouette-head{position:absolute;left:50%;top:3%;width:100px;height:120px;transform:translateX(-50%);border-radius:48%;background:linear-gradient(160deg,#fff,#59605a)}
.cue-workspace__silhouette-body{position:absolute;left:50%;top:20%;width:240px;height:420px;transform:translateX(-50%);border-radius:44% 44% 28% 28%/18% 18% 24% 24%;background:linear-gradient(160deg,#fff,#4d534e)}
.cue-workspace__silhouette[data-body="female"] .cue-workspace__silhouette-body{width:220px;border-radius:42% 42% 34% 34%/18% 18% 24% 24%}
.cue-workspace__pending{position:relative;z-index:2;display:grid;gap:8px;max-width:360px;padding:18px;text-align:center;border:1px solid var(--cue-border);border-radius:16px;background:rgba(8,10,9,.78);backdrop-filter:blur(10px)}
.cue-workspace__pending strong{font-size:1.05rem}.cue-workspace__pending span{color:var(--cue-muted);line-height:1.5}.cue-workspace__pending small{color:var(--cue-text);font:700 10px/1.4 monospace;letter-spacing:.04em}
.cue-workspace__preview-kicker{color:var(--cue-accent)!important;font:800 9px/1.2 monospace;letter-spacing:.1em;text-transform:uppercase}
.cue-workspace__shared-note{display:grid;gap:4px;margin:0;padding:14px 18px;border-top:1px solid var(--cue-border);color:var(--cue-muted);font-size:12px}.cue-workspace__shared-note small{font-size:10px;opacity:.78}
.cue-workspace__editor{display:grid;grid-template-rows:auto 1fr;overflow:hidden}
.cue-workspace__tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:10px;border-bottom:1px solid var(--cue-border)}
.cue-workspace__tabs button{border:0;border-radius:10px;padding:10px;background:transparent;color:var(--cue-muted);font-weight:800}.cue-workspace__tabs button.active{background:rgba(206,255,84,.12);color:var(--cue-accent)}
.cue-workspace__group{align-content:start;display:grid;gap:10px;padding:18px;overflow:auto}.cue-workspace__group h2{margin:10px 0 2px;font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;color:var(--cue-muted)}
.cue-workspace__chips,.cue-workspace__tiles,.cue-workspace__swatches{display:flex;flex-wrap:wrap;gap:8px}
.cue-workspace__chips button{border:1px solid var(--cue-border);border-radius:10px;padding:9px 11px;background:transparent;color:var(--cue-text)}.cue-workspace__chips button.selected{border-color:var(--cue-accent);box-shadow:0 0 0 1px var(--cue-accent) inset}
.cue-workspace__swatches button{width:34px;height:34px;border:2px solid transparent;border-radius:50%;background:var(--swatch);box-shadow:0 0 0 1px var(--cue-border)}.cue-workspace__swatches button.selected{border-color:var(--cue-accent);box-shadow:0 0 0 2px #111 inset,0 0 0 1px var(--cue-accent)}
.cue-workspace__tiles--preview button{display:grid;grid-template-rows:58px auto;min-width:86px;overflow:hidden;border:1px solid var(--cue-border);border-radius:12px;padding:0;background:transparent;color:var(--cue-text)}.cue-workspace__tiles--preview button.selected{border-color:var(--cue-accent)}
.cue-workspace__tiles--preview i{display:grid;place-items:center;background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02));font-style:normal;font-size:10px;color:var(--cue-muted)}.cue-workspace__tiles--preview span{padding:8px;font-size:11px}
@media(max-width:1000px){.cue-workspace__layout{grid-template-columns:1fr}.cue-workspace__stage-placeholder{min-height:480px}}
@media(max-width:640px){.cue-workspace{padding-top:14px}.cue-workspace__topbar{align-items:flex-start}.cue-workspace__save{padding:11px 13px}.cue-workspace__layout{min-height:0}.cue-workspace__stage-placeholder{min-height:420px}.cue-workspace__tabs{grid-template-columns:repeat(2,1fr)}}
</style>
