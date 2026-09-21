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
import {
  cueIdHarnessCompatibleWithSelection,
  cueIdModestyForSelection
} from '../domain/cueIdWardrobe'

type Locale = 'es' | 'en'

const props = withDefaults(defineProps<{
  modelValue: CueIdStylizedCreatorConfigV1
  locale?: Locale
  dirty?: boolean
}>(), {
  locale: 'es',
  dirty: false
})

const emit = defineEmits<{
  'update:modelValue': [value: CueIdStylizedCreatorConfigV1]
  save: [value: CueIdStylizedCreatorConfigV1]
  reset: []
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
  localDraft: 'El guardado del laboratorio no publica ni conecta assets a producción.',
  basics: 'Cuebooker Basics',
  clubFestival: 'Club / Festival',
  preview2d: 'Preview 2D provisional',
  incompatible: 'Combinación pendiente de fitting',
  harnessWarning: 'El harness seleccionado no tiene fitting aprobado con la capa de outfit activa. La selección se conserva, pero no se considera validada.',
  baseStored: 'Top y bottom quedan guardados y volverán al desactivar la prenda de una pieza.',
  activeLayer: 'Capa activa',
  modesty: 'Modesty layer',
  unsaved: 'Cambios sin guardar',
  savedState: 'Draft guardado',
  reset: 'Restablecer',
  resetHint: 'Volver al CUE ID inicial del laboratorio'
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
  localDraft: 'Lab save does not publish or connect assets to production.',
  basics: 'Cuebooker Basics',
  clubFestival: 'Club / Festival',
  preview2d: 'Temporary 2D preview',
  incompatible: 'Pending fitting combination',
  harnessWarning: 'The selected harness has no approved fitting with the active outfit layer. The selection is preserved, but it is not considered validated.',
  baseStored: 'Top and bottom stay stored and return when the one-piece is disabled.',
  activeLayer: 'Active layer',
  modesty: 'Modesty layer',
  unsaved: 'Unsaved changes',
  savedState: 'Draft saved',
  reset: 'Reset',
  resetHint: 'Return to the initial lab CUE ID'
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

const basicsTops = ['tee', 'tank', 'sweatshirt', 'hoodie', 'bomber'] as const
const clubTops = ['mesh-top', 'festival-top'] as const
const basicsBottoms = ['wide-trouser', 'straight-trouser', 'cargo', 'shorts', 'utility-trouser'] as const
const clubBottoms = ['skirt', 'harem-trouser', 'festival-wrap'] as const

const harnessCompatible = computed(() => cueIdHarnessCompatibleWithSelection({
  top: props.modelValue.top,
  onePiece: props.modelValue.onePiece
}))
const harnessSelectionNeedsFitting = computed(() =>
  props.modelValue.torsoAccessory === 'harness' && !harnessCompatible.value
)
const onePieceActive = computed(() => props.modelValue.onePiece !== 'none')
const modestyRule = computed(() => cueIdModestyForSelection({
  top: props.modelValue.top,
  bottom: props.modelValue.bottom,
  onePiece: props.modelValue.onePiece,
  torsoAccessory: props.modelValue.torsoAccessory
}))

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

function reset() {
  emit('reset')
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
      <div class="cue-workspace__actions">
        <span
          class="cue-workspace__save-state"
          :class="{ dirty }"
        >
          {{ dirty ? copy.unsaved : copy.savedState }}
        </span>
        <button
          type="button"
          class="cue-workspace__reset"
          :title="copy.resetHint"
          @click="reset"
        >
          {{ copy.reset }}
        </button>
        <button
          type="button"
          class="cue-workspace__save"
          :disabled="!dirty"
          @click="save"
        >
          {{ copy.save }}
        </button>
      </div>
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
            :aria-current="activeSection === section ? 'page' : undefined"
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
              <i
                class="cue-workspace__mini-avatar"
                :data-body="modelValue.body"
                :data-expression="expression"
                :style="{ '--mini-skin': CUE_ID_SKIN_TONES[modelValue.skin].color, '--mini-hair': hairColorHex(modelValue.hairColor) }"
                aria-hidden="true"
              >
                <b />
                <em />
              </i>
              <span>{{ expression }}<small>{{ copy.preview2d }}</small></span>
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
              <i
                class="cue-workspace__mini-avatar"
                :data-body="modelValue.body"
                :data-hair="hair"
                :style="{ '--mini-skin': CUE_ID_SKIN_TONES[modelValue.skin].color, '--mini-hair': hairColorHex(modelValue.hairColor) }"
                aria-hidden="true"
              >
                <b />
                <em />
              </i>
              <span>{{ hair }}<small>{{ copy.preview2d }}</small></span>
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
          <div class="cue-workspace__outfit-state">
            <span><strong>{{ copy.activeLayer }}:</strong> {{ onePieceActive ? modelValue.onePiece : modelValue.top + ' + ' + modelValue.bottom }}</span>
            <span><strong>{{ copy.modesty }}:</strong> {{ modestyRule }}</span>
            <small v-if="onePieceActive">{{ copy.baseStored }}</small>
          </div>
          <h2>{{ copy.basics }} · {{ copy.top }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="top in basicsTops"
              :key="top"
              type="button"
              :class="{ selected: modelValue.top === top, muted: onePieceActive }"
              :aria-disabled="onePieceActive"
              @click="patch('top', top)"
            >{{ top }}</button>
          </div>

          <h2>{{ copy.clubFestival }} · {{ copy.top }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="top in clubTops"
              :key="top"
              type="button"
              :class="{ selected: modelValue.top === top }"
              @click="patch('top', top)"
            >{{ top }}</button>
          </div>

          <h2>{{ copy.basics }} · {{ copy.bottom }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="bottom in basicsBottoms"
              :key="bottom"
              type="button"
              :class="{ selected: modelValue.bottom === bottom, muted: onePieceActive }"
              :aria-disabled="onePieceActive"
              @click="patch('bottom', bottom)"
            >{{ bottom }}</button>
          </div>

          <h2>{{ copy.clubFestival }} · {{ copy.bottom }}</h2>
          <div class="cue-workspace__chips">
            <button
              v-for="bottom in clubBottoms"
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
          <div
            v-if="harnessSelectionNeedsFitting"
            class="cue-workspace__compatibility"
            role="status"
          >
            <strong>{{ copy.incompatible }}</strong>
            <span>{{ copy.harnessWarning }}</span>
          </div>
          <div class="cue-workspace__chips">
            <button
              v-for="torsoAccessory in CUE_ID_STYLIZED_CREATOR_CATALOGUE.torsoAccessories"
              :key="torsoAccessory"
              type="button"
              :class="{ selected: modelValue.torsoAccessory === torsoAccessory }"
              :disabled="torsoAccessory === 'harness' && !harnessCompatible && modelValue.torsoAccessory !== 'harness'"
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
.cue-workspace__actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;flex-wrap:wrap}
.cue-workspace__save-state{padding:7px 9px;border:1px solid var(--cue-border);border-radius:999px;color:var(--cue-muted);font:800 9px/1 monospace;letter-spacing:.05em;text-transform:uppercase}.cue-workspace__save-state.dirty{border-color:rgba(206,255,84,.42);color:var(--cue-accent);background:rgba(206,255,84,.06)}
.cue-workspace__reset{min-height:42px;border:1px solid var(--cue-border);border-radius:12px;padding:11px 14px;background:transparent;color:var(--cue-muted);font-weight:800}.cue-workspace__reset:hover{color:var(--cue-text)}
.cue-workspace__save{min-height:42px;border:0;border-radius:12px;padding:11px 18px;background:var(--cue-accent);color:#111;font-weight:900}.cue-workspace__save:disabled{opacity:.38;cursor:not-allowed}
.cue-workspace__layout{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(380px,.9fr);gap:14px;min-height:680px}
.cue-workspace__stage,.cue-workspace__editor{border:1px solid var(--cue-border);border-radius:20px;background:color-mix(in srgb,var(--cue-surface) 94%,transparent)}
.cue-workspace__stage{display:grid;grid-template-rows:auto 1fr auto;overflow:hidden}
.cue-workspace__stage-head{display:flex;justify-content:space-between;align-items:center;padding:18px;border-bottom:1px solid var(--cue-border)}
.cue-workspace__stage-head span{display:block;color:var(--cue-muted);font-size:11px;text-transform:uppercase;letter-spacing:.1em}.cue-workspace__stage-head strong{font-size:1.1rem}
.cue-workspace__body-toggle{display:flex;padding:3px;border:1px solid var(--cue-border);border-radius:999px}.cue-workspace__body-toggle button{min-height:40px;border:0;border-radius:999px;padding:8px 14px;background:transparent;color:var(--cue-muted);font-weight:800}.cue-workspace__body-toggle button.active{background:var(--cue-accent);color:#111}
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
.cue-workspace__tabs button{min-height:42px;border:0;border-radius:10px;padding:10px;background:transparent;color:var(--cue-muted);font-weight:800}.cue-workspace__tabs button.active{background:rgba(206,255,84,.12);color:var(--cue-accent)}
.cue-workspace__group{align-content:start;display:grid;gap:10px;padding:18px;overflow:auto}.cue-workspace__group h2{margin:10px 0 2px;font-size:.78rem;text-transform:uppercase;letter-spacing:.1em;color:var(--cue-muted)}
.cue-workspace__chips,.cue-workspace__tiles,.cue-workspace__swatches{display:flex;flex-wrap:wrap;gap:8px}
.cue-workspace__chips button{min-height:40px;border:1px solid var(--cue-border);border-radius:10px;padding:9px 11px;background:transparent;color:var(--cue-text)}.cue-workspace__chips button.selected{border-color:var(--cue-accent);box-shadow:0 0 0 1px var(--cue-accent) inset}.cue-workspace__chips button.muted{opacity:.52}.cue-workspace__chips button:disabled{opacity:.34;cursor:not-allowed}
.cue-workspace__swatches button{width:34px;height:34px;border:2px solid transparent;border-radius:50%;background:var(--swatch);box-shadow:0 0 0 1px var(--cue-border)}.cue-workspace__swatches button.selected{border-color:var(--cue-accent);box-shadow:0 0 0 2px #111 inset,0 0 0 1px var(--cue-accent)}
.cue-workspace__tiles--preview button{display:grid;grid-template-rows:58px auto;min-width:86px;overflow:hidden;border:1px solid var(--cue-border);border-radius:12px;padding:0;background:transparent;color:var(--cue-text)}.cue-workspace__tiles--preview button.selected{border-color:var(--cue-accent)}
.cue-workspace__tiles--preview i{display:grid;place-items:center;background:linear-gradient(145deg,rgba(255,255,255,.08),rgba(255,255,255,.02));font-style:normal;font-size:10px;color:var(--cue-muted)}.cue-workspace__tiles--preview span{display:grid;gap:3px;padding:8px;font-size:11px}.cue-workspace__tiles--preview span small{color:var(--cue-muted);font-size:8px}
.cue-workspace__mini-avatar{position:relative;overflow:hidden;min-height:58px}.cue-workspace__mini-avatar b{position:absolute;left:50%;top:10px;width:28px;height:31px;transform:translateX(-50%);border-radius:46% 46% 44% 44%;background:var(--mini-skin)}.cue-workspace__mini-avatar em{position:absolute;left:50%;top:37px;width:48px;height:31px;transform:translateX(-50%);border-radius:50% 50% 16% 16%;background:color-mix(in srgb,var(--mini-skin) 60%,var(--cue-surface))}
.cue-workspace__mini-avatar[data-body="female"] em{width:44px;border-radius:46% 46% 22% 22%}.cue-workspace__mini-avatar[data-hair]:not([data-hair="bald"]) b:before{content:"";position:absolute;left:-3px;right:-3px;top:-4px;height:13px;border-radius:60% 60% 38% 38%;background:var(--mini-hair)}.cue-workspace__mini-avatar[data-hair="mohawk"] b:before{left:8px;right:8px;top:-9px;height:16px;border-radius:50%}.cue-workspace__mini-avatar[data-hair="locs"] b:before,.cue-workspace__mini-avatar[data-hair="tied-back"] b:before,.cue-workspace__mini-avatar[data-hair="bob"] b:before{height:25px;border-radius:55% 55% 28% 28%}.cue-workspace__mini-avatar[data-expression] b:after{content:"";position:absolute;left:7px;right:7px;bottom:7px;height:2px;border-radius:999px;background:rgba(30,20,18,.65)}.cue-workspace__mini-avatar[data-expression="smile"] b:after{height:5px;border-bottom:2px solid rgba(30,20,18,.7);background:transparent}.cue-workspace__mini-avatar[data-expression="playful"] b:after{transform:rotate(-8deg)}
.cue-workspace__compatibility{display:grid;gap:5px;padding:10px 12px;border:1px solid rgba(255,69,69,.38);border-radius:10px;background:rgba(255,69,69,.06)}.cue-workspace__compatibility strong{font-size:11px;color:#ff7777}.cue-workspace__compatibility span{font-size:11px;line-height:1.45;color:var(--cue-muted)}
.cue-workspace__outfit-state{display:grid;gap:4px;padding:11px 12px;border:1px solid var(--cue-border);border-radius:10px;background:rgba(255,255,255,.025);font-size:11px;color:var(--cue-muted)}.cue-workspace__outfit-state strong{color:var(--cue-text)}.cue-workspace__outfit-state small{font-size:10px;line-height:1.4;color:var(--cue-accent)}
@media(max-width:1000px){
  .cue-workspace__layout{grid-template-columns:1fr;min-height:0}
  .cue-workspace__stage-placeholder{min-height:420px}
  .cue-workspace__editor{min-height:560px}
}
@media(max-width:640px){
  .cue-workspace{gap:12px;padding-top:14px}
  .cue-workspace__topbar{display:grid;grid-template-columns:1fr;align-items:start;gap:12px}
  .cue-workspace__topbar h1{font-size:2rem}
  .cue-workspace__topbar span{font-size:13px}
  .cue-workspace__actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
  .cue-workspace__save-state{grid-column:1 / -1;width:max-content}
  .cue-workspace__reset,.cue-workspace__save{width:100%;min-height:44px;padding:11px 13px}
  .cue-workspace__stage,.cue-workspace__editor{border-radius:14px}
  .cue-workspace__stage-head{padding:12px;gap:10px}
  .cue-workspace__stage-head strong{font-size:1rem}
  .cue-workspace__body-toggle{flex:0 0 auto}
  .cue-workspace__body-toggle button{min-height:38px;padding:7px 11px;font-size:12px}
  .cue-workspace__stage-placeholder{min-height:300px}
  .cue-workspace__silhouette{inset:10% 18% 6%;transform:scale(.72);transform-origin:50% 50%}
  .cue-workspace__pending{max-width:calc(100% - 28px);padding:14px}
  .cue-workspace__pending span:not(.cue-workspace__preview-kicker){font-size:12px}
  .cue-workspace__shared-note{padding:11px 12px;font-size:11px}
  .cue-workspace__editor{min-height:0;overflow:visible}
  .cue-workspace__tabs{position:sticky;top:0;z-index:4;display:flex;gap:6px;overflow-x:auto;padding:8px;background:var(--cue-surface);border-radius:14px 14px 0 0;scrollbar-width:none}
  .cue-workspace__tabs::-webkit-scrollbar{display:none}
  .cue-workspace__tabs button{flex:0 0 auto;min-width:104px;min-height:44px;padding:9px 12px;white-space:nowrap}
  .cue-workspace__group{overflow:visible;padding:14px;gap:9px}
  .cue-workspace__group h2{margin-top:14px;font-size:.72rem}
  .cue-workspace__chips{gap:7px}
  .cue-workspace__chips button{min-height:42px;padding:9px 10px;font-size:13px}
  .cue-workspace__tiles--preview{flex-wrap:nowrap;overflow-x:auto;padding-bottom:3px;scrollbar-width:none}
  .cue-workspace__tiles--preview::-webkit-scrollbar{display:none}
  .cue-workspace__tiles--preview button{flex:0 0 92px;min-width:92px}
  .cue-workspace__swatches button{width:38px;height:38px}
}
</style>
