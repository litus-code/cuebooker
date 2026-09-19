<script setup lang="ts">
import type { ArtistVisualMode } from '../composables/useArtistProfile'
import type { CueIdConfigV1 } from '../domain/cueId'
import { cloneCueIdConfig, DEFAULT_CUE_ID_CONFIG } from '../domain/cueId'

const props = withDefaults(defineProps<{
  artistName?: string
  locale?: 'es' | 'en'
  disabled?: boolean
}>(), {
  artistName: 'Artist',
  locale: 'es',
  disabled: false
})

const profiles = useArtistProfile()
const visualMode = ref<ArtistVisualMode>('photo')
const cueIdConfig = ref<CueIdConfigV1>(cloneCueIdConfig(DEFAULT_CUE_ID_CONFIG))
const saving = ref(false)
const message = ref('')
const dirty = ref(false)

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'PRESENTACIÓN VISUAL',
  title: 'Elige cómo aparece tu identidad.',
  body: 'Foto y Artwork siguen disponibles. CUE ID añade una representación propia sin sustituir tus imágenes ni borrar ninguna configuración.',
  photo: 'Foto',
  photoBody: 'Usa tu retrato como representación principal.',
  artwork: 'Artwork',
  artworkBody: 'Usa tu retrato con tratamiento visual Cuebooker.',
  cueId: 'CUE ID',
  cueIdBody: 'Construye una identidad visual modular. La primera familia es Club Minimal.',
  save: 'Guardar identidad visual',
  saving: 'Guardando…',
  saved: 'Identidad visual guardada.',
  error: 'No se pudo guardar la identidad visual.',
  privateHint: 'Esta configuración sigue siendo privada hasta que la proyección pública de CUE ID esté activada.',
  unsaved: 'Cambios sin guardar'
} : {
  eyebrow: 'VISUAL PRESENTATION',
  title: 'Choose how your identity appears.',
  body: 'Photo and Artwork remain available. CUE ID adds a dedicated visual representation without replacing your images or deleting their configuration.',
  photo: 'Photo',
  photoBody: 'Use your portrait as the main representation.',
  artwork: 'Artwork',
  artworkBody: 'Use your portrait with Cuebooker visual treatment.',
  cueId: 'CUE ID',
  cueIdBody: 'Build a modular visual identity. The first family is Club Minimal.',
  save: 'Save visual identity',
  saving: 'Saving…',
  saved: 'Visual identity saved.',
  error: 'The visual identity could not be saved.',
  privateHint: 'This configuration stays private until the public CUE ID projection is enabled.',
  unsaved: 'Unsaved changes'
})

const modes = computed(() => [
  { id: 'photo' as const, label: copy.value.photo, body: copy.value.photoBody },
  { id: 'artwork' as const, label: copy.value.artwork, body: copy.value.artworkBody },
  { id: 'cue_id' as const, label: copy.value.cueId, body: copy.value.cueIdBody }
])

function syncFromProfile() {
  const artist = profiles.activeProfile.value?.artist
  if (!artist) return
  visualMode.value = artist.visual_mode || 'photo'
  cueIdConfig.value = cloneCueIdConfig(artist.cue_id_config || DEFAULT_CUE_ID_CONFIG)
  dirty.value = false
  message.value = ''
}

watch(
  () => profiles.activeProfile.value?.artist.id,
  syncFromProfile,
  { immediate: true }
)

watch(
  () => profiles.activeProfile.value?.artist.visual_mode,
  value => {
    if (!dirty.value && value) visualMode.value = value
  }
)

function setMode(mode: ArtistVisualMode) {
  if (props.disabled || visualMode.value === mode) return
  visualMode.value = mode
  dirty.value = true
  message.value = ''
}

function updateCueIdConfig(value: CueIdConfigV1) {
  cueIdConfig.value = value
  dirty.value = true
  message.value = ''
}

async function save() {
  const artistId = profiles.activeArtistId.value
  if (!artistId || props.disabled || saving.value || !dirty.value) return
  saving.value = true
  message.value = ''
  try {
    await profiles.saveCueIdPresentation(artistId, visualMode.value, cueIdConfig.value)
    dirty.value = false
    message.value = copy.value.saved
  } catch {
    message.value = copy.value.error
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="cue-id-profile-editor">
    <header class="cue-id-profile-editor__header">
      <div>
        <p>{{ copy.eyebrow }}</p>
        <h3>{{ copy.title }}</h3>
        <span>{{ copy.body }}</span>
      </div>
      <small>{{ copy.privateHint }}</small>
    </header>

    <div class="cue-id-profile-editor__modes" role="group" :aria-label="copy.title">
      <button
        v-for="mode in modes"
        :key="mode.id"
        type="button"
        :class="{ active: visualMode === mode.id }"
        :disabled="disabled"
        @click="setMode(mode.id)"
      >
        <strong>{{ mode.label }}</strong>
        <span>{{ mode.body }}</span>
      </button>
    </div>

    <div v-if="visualMode === 'cue_id'" class="cue-id-profile-editor__studio">
      <CueIdStage :config="cueIdConfig" :artist-name="artistName" compact />
      <CueIdControls
        :model-value="cueIdConfig"
        :locale="locale"
        :disabled="disabled"
        @update:model-value="updateCueIdConfig"
      />
    </div>

    <footer class="cue-id-profile-editor__footer">
      <span v-if="dirty" class="cue-id-profile-editor__dirty">{{ copy.unsaved }}</span>
      <span v-else-if="message">{{ message }}</span>
      <button type="button" :disabled="disabled || saving || !dirty" @click="save">
        {{ saving ? copy.saving : copy.save }}
      </button>
    </footer>
  </section>
</template>

<style scoped>
.cue-id-profile-editor{border:1px solid var(--cue-border);background:var(--cue-surface);overflow:hidden}
.cue-id-profile-editor__header{display:grid;grid-template-columns:1fr minmax(220px,.42fr);gap:32px;padding:24px;border-bottom:1px solid var(--cue-border)}
.cue-id-profile-editor__header p{margin:0 0 9px;color:var(--cue-accent);font:700 9px/1.2 monospace;letter-spacing:.13em}
.cue-id-profile-editor__header h3{margin:0;font-size:clamp(1.8rem,3vw,3.1rem);line-height:.92;letter-spacing:-.05em;text-transform:uppercase}
.cue-id-profile-editor__header span{display:block;max-width:700px;margin-top:12px;color:var(--cue-muted);font-size:13px;line-height:1.55}
.cue-id-profile-editor__header small{align-self:end;color:var(--cue-muted);font-size:11px;line-height:1.5}
.cue-id-profile-editor__modes{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-bottom:1px solid var(--cue-border)}
.cue-id-profile-editor__modes button{display:grid;align-content:start;gap:8px;min-height:120px;padding:18px;border:0;border-right:1px solid var(--cue-border);background:var(--cue-bg);color:var(--cue-text);cursor:pointer;text-align:left}
.cue-id-profile-editor__modes button:last-child{border-right:0}
.cue-id-profile-editor__modes button strong{font-size:14px}.cue-id-profile-editor__modes button span{color:var(--cue-muted);font-size:11px;line-height:1.45}
.cue-id-profile-editor__modes button.active{background:color-mix(in srgb,var(--cue-accent) 8%,var(--cue-bg));box-shadow:inset 0 -2px 0 var(--cue-accent)}
.cue-id-profile-editor__modes button.active strong{color:var(--cue-accent)}
.cue-id-profile-editor__modes button:focus-visible,.cue-id-profile-editor__footer button:focus-visible{outline:2px solid var(--cue-accent);outline-offset:-3px}
.cue-id-profile-editor__modes button:disabled{cursor:not-allowed;opacity:.55}
.cue-id-profile-editor__studio{display:grid;gap:14px;padding:14px;background:var(--cue-bg)}
.cue-id-profile-editor__footer{display:flex;align-items:center;justify-content:flex-end;gap:16px;min-height:72px;padding:14px 18px;border-top:1px solid var(--cue-border)}
.cue-id-profile-editor__footer>span{margin-right:auto;color:var(--cue-muted);font-size:11px}.cue-id-profile-editor__dirty{color:var(--cue-accent)!important}
.cue-id-profile-editor__footer button{min-height:44px;padding:0 16px;border:1px solid var(--cue-accent);background:var(--cue-accent);color:#080808;cursor:pointer;font-weight:850}
.cue-id-profile-editor__footer button:disabled{border-color:var(--cue-border);background:transparent;color:var(--cue-muted);cursor:not-allowed}
@media(max-width:760px){.cue-id-profile-editor__header{grid-template-columns:1fr}.cue-id-profile-editor__modes{grid-template-columns:1fr}.cue-id-profile-editor__modes button{min-height:92px;border-right:0;border-bottom:1px solid var(--cue-border)}.cue-id-profile-editor__modes button:last-child{border-bottom:0}.cue-id-profile-editor__studio{padding:10px}}
</style>
