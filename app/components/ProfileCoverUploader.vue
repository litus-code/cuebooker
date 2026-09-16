<script setup lang="ts">
import type { ArtistImageStyle } from '../composables/useArtistProfile'

const props = withDefaults(defineProps<{
  imageUrl?: string
  positionY?: number
  disabled?: boolean
  uploading?: boolean
  title: string
  hint: string
  chooseLabel: string
  changeLabel: string
  removeLabel: string
  positionLabel: string
  uploadingLabel: string
}>(), {
  imageUrl: '',
  positionY: 50,
  disabled: false,
  uploading: false
})

const emit = defineEmits<{
  select: [file: File]
  remove: []
  'update:positionY': [value: number]
}>()

const input = ref<HTMLInputElement | null>(null)
const artistInput = ref<HTMLInputElement | null>(null)
const dragging = ref(false)
const artistDragging = ref(false)
const artistUploading = ref(false)
const artistMessage = ref('')
const artistImageUrl = ref('')
const artistStyle = ref<ArtistImageStyle>('artwork')
const artistPositionX = ref(50)
const artistPositionY = ref(50)
const artistScale = ref(1)

const profiles = useArtistProfile()
const preferences = useCuePreferences()

const coverSource = computed(() => props.imageUrl || '/images/profile/cuebooker-default-cover.webp')
const activeArtist = computed(() => profiles.activeProfile.value?.artist || null)

const artistCopy = computed(() => preferences.locale.value === 'es' ? {
  eyebrow: 'IMAGEN DEL ARTISTA',
  hint: 'Sube una foto y colócala sobre la portada. Artwork crea un tratamiento gráfico sin modificar el original.',
  choose: 'Añadir artista',
  change: 'Cambiar imagen',
  remove: 'Quitar imagen',
  style: 'Tratamiento',
  photo: 'Foto',
  artwork: 'Artwork',
  duotone: 'Duotono',
  x: 'Horizontal',
  y: 'Vertical',
  scale: 'Tamaño',
  uploading: 'Subiendo imagen…',
  saved: 'Imagen del artista actualizada.',
  removed: 'Imagen del artista eliminada.',
  invalid: 'Usa JPG, PNG o WebP de hasta 8 MB.',
  error: 'No se pudo guardar la imagen del artista.'
} : {
  eyebrow: 'ARTIST IMAGE',
  hint: 'Upload a photo and place it over the cover. Artwork adds a graphic treatment without changing the original.',
  choose: 'Add artist',
  change: 'Change image',
  remove: 'Remove image',
  style: 'Treatment',
  photo: 'Photo',
  artwork: 'Artwork',
  duotone: 'Duotone',
  x: 'Horizontal',
  y: 'Vertical',
  scale: 'Size',
  uploading: 'Uploading image…',
  saved: 'Artist image updated.',
  removed: 'Artist image removed.',
  invalid: 'Use a JPG, PNG or WebP file up to 8 MB.',
  error: 'The artist image could not be saved.'
})

function openPicker() {
  if (!props.disabled && !props.uploading) input.value?.click()
}

function selectFile(file?: File) {
  if (file && !props.disabled && !props.uploading) emit('select', file)
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  selectFile(target.files?.[0])
  target.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  selectFile(event.dataTransfer?.files?.[0])
}

function replaceArtistImageUrl(next = '') {
  if (artistImageUrl.value.startsWith('blob:')) URL.revokeObjectURL(artistImageUrl.value)
  artistImageUrl.value = next
}

async function loadArtistImage(path?: string | null) {
  replaceArtistImageUrl('')
  if (!path) return
  try {
    replaceArtistImageUrl(await profiles.getArtistImageObjectUrl(path))
  } catch {
    artistMessage.value = artistCopy.value.error
  }
}

function syncArtistVisual() {
  const artist = activeArtist.value
  if (!artist) return
  artistStyle.value = artist.artist_image_style || 'artwork'
  artistPositionX.value = artist.artist_image_position_x ?? 50
  artistPositionY.value = artist.artist_image_position_y ?? 50
  artistScale.value = Number(artist.artist_image_scale || 1)
  void loadArtistImage(artist.artist_image_path)
}

watch(
  () => [activeArtist.value?.id, activeArtist.value?.artist_image_path],
  syncArtistVisual,
  { immediate: true }
)

const artistFilter = computed(() => {
  if (artistStyle.value === 'photo') return 'none'
  if (artistStyle.value === 'duotone') return 'grayscale(1) sepia(1) saturate(4.2) hue-rotate(35deg) contrast(1.25) brightness(1.05) drop-shadow(0 20px 32px rgba(0,0,0,.45))'
  return 'grayscale(1) contrast(1.45) brightness(1.08) drop-shadow(0 22px 34px rgba(0,0,0,.55))'
})

function syncPreviewVariables() {
  if (!import.meta.client) return
  const style = document.documentElement.style
  style.setProperty('--cue-profile-artist-image', artistImageUrl.value ? `url("${artistImageUrl.value}")` : 'none')
  style.setProperty('--cue-profile-artist-x', `${artistPositionX.value}%`)
  style.setProperty('--cue-profile-artist-y', `${artistPositionY.value}%`)
  style.setProperty('--cue-profile-artist-scale', String(artistScale.value))
  style.setProperty('--cue-profile-artist-filter', artistFilter.value)
  style.setProperty('--cue-profile-artist-opacity', artistImageUrl.value ? '1' : '0')
}

watch([artistImageUrl, artistPositionX, artistPositionY, artistScale, artistFilter], syncPreviewVariables, { immediate: true })

function openArtistPicker() {
  if (!props.disabled && !artistUploading.value) artistInput.value?.click()
}

function validateArtistFile(file?: File) {
  if (!file) return false
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    artistMessage.value = artistCopy.value.invalid
    return false
  }
  return true
}

async function selectArtistFile(file?: File) {
  artistDragging.value = false
  if (props.disabled || artistUploading.value || !validateArtistFile(file) || !file) return
  const artistId = profiles.activeArtistId.value
  if (!artistId) {
    artistMessage.value = artistCopy.value.error
    return
  }

  artistUploading.value = true
  artistMessage.value = ''
  let uploadedPath = ''
  const previousPath = activeArtist.value?.artist_image_path || ''

  try {
    uploadedPath = await profiles.uploadArtistImage(artistId, file)
    const saved = await profiles.saveArtistVisual(artistId, {
      artist_image_path: uploadedPath,
      artist_image_style: artistStyle.value,
      artist_image_position_x: artistPositionX.value,
      artist_image_position_y: artistPositionY.value,
      artist_image_scale: artistScale.value
    })
    await loadArtistImage(saved.artist_image_path)
    if (previousPath && previousPath !== uploadedPath) await profiles.deleteArtistImage(previousPath).catch(() => undefined)
    artistMessage.value = artistCopy.value.saved
  } catch {
    if (uploadedPath) await profiles.deleteArtistImage(uploadedPath).catch(() => undefined)
    artistMessage.value = artistCopy.value.error
  } finally {
    artistUploading.value = false
  }
}

function onArtistInput(event: Event) {
  const target = event.target as HTMLInputElement
  void selectArtistFile(target.files?.[0])
  target.value = ''
}

function onArtistDrop(event: DragEvent) {
  void selectArtistFile(event.dataTransfer?.files?.[0])
}

async function persistArtistSettings() {
  const artistId = profiles.activeArtistId.value
  const current = activeArtist.value
  if (!artistId || !current || props.disabled || artistUploading.value) return

  artistUploading.value = true
  artistMessage.value = ''
  try {
    await profiles.saveArtistVisual(artistId, {
      artist_image_path: current.artist_image_path,
      artist_image_style: artistStyle.value,
      artist_image_position_x: artistPositionX.value,
      artist_image_position_y: artistPositionY.value,
      artist_image_scale: artistScale.value
    })
    artistMessage.value = artistCopy.value.saved
  } catch {
    artistMessage.value = artistCopy.value.error
  } finally {
    artistUploading.value = false
  }
}

function setArtistStyle(value: ArtistImageStyle) {
  artistStyle.value = value
  void persistArtistSettings()
}

async function removeArtistImage() {
  const artistId = profiles.activeArtistId.value
  const current = activeArtist.value
  if (!artistId || !current?.artist_image_path || props.disabled || artistUploading.value) return

  artistUploading.value = true
  artistMessage.value = ''
  const previousPath = current.artist_image_path
  try {
    await profiles.saveArtistVisual(artistId, {
      artist_image_path: null,
      artist_image_style: artistStyle.value,
      artist_image_position_x: artistPositionX.value,
      artist_image_position_y: artistPositionY.value,
      artist_image_scale: artistScale.value
    })
    replaceArtistImageUrl('')
    await profiles.deleteArtistImage(previousPath).catch(() => undefined)
    artistMessage.value = artistCopy.value.removed
  } catch {
    artistMessage.value = artistCopy.value.error
  } finally {
    artistUploading.value = false
  }
}

onBeforeUnmount(() => {
  replaceArtistImageUrl('')
  if (!import.meta.client) return
  const style = document.documentElement.style
  ;['--cue-profile-artist-image', '--cue-profile-artist-x', '--cue-profile-artist-y', '--cue-profile-artist-scale', '--cue-profile-artist-filter', '--cue-profile-artist-opacity'].forEach(name => style.removeProperty(name))
})
</script>

<template>
  <section
    class="cover-uploader"
    :class="{ 'cover-uploader--dragging': dragging, 'cover-uploader--custom': imageUrl }"
    @dragenter.prevent="dragging = true"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <img class="cover-uploader__background" :src="coverSource" alt="" :style="{ objectPosition: `50% ${positionY}%` }">
    <div class="cover-uploader__shade" />

    <img
      v-if="artistImageUrl"
      class="cover-uploader__artist-image"
      :class="`cover-uploader__artist-image--${artistStyle}`"
      :src="artistImageUrl"
      alt=""
      :style="{
        left: `${artistPositionX}%`,
        top: `${artistPositionY}%`,
        transform: `translate(-50%, -50%) scale(${artistScale})`,
        filter: artistFilter
      }"
    >

    <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" tabindex="-1" @change="onInput">
    <input ref="artistInput" type="file" accept="image/jpeg,image/png,image/webp" tabindex="-1" @change="onArtistInput">

    <div class="cover-uploader__intro">
      <span>PORTADA / 16:9</span>
      <h3>{{ title }}</h3>
      <p>{{ hint }}</p>
      <button type="button" :disabled="disabled || uploading" @click="openPicker">
        <i aria-hidden="true">＋</i>
        {{ uploading ? uploadingLabel : (imageUrl ? changeLabel : chooseLabel) }}
      </button>
    </div>

    <aside
      class="artist-layer"
      :class="{ 'artist-layer--dragging': artistDragging }"
      @dragenter.prevent="artistDragging = true"
      @dragover.prevent="artistDragging = true"
      @dragleave.prevent="artistDragging = false"
      @drop.prevent.stop="onArtistDrop"
    >
      <div class="artist-layer__heading">
        <div>
          <span>{{ artistCopy.eyebrow }}</span>
          <p>{{ artistCopy.hint }}</p>
        </div>
        <button type="button" :disabled="disabled || artistUploading" @click="openArtistPicker">
          {{ artistUploading ? artistCopy.uploading : (artistImageUrl ? artistCopy.change : artistCopy.choose) }}
        </button>
      </div>

      <template v-if="artistImageUrl">
        <div class="artist-layer__styles" role="group" :aria-label="artistCopy.style">
          <span>{{ artistCopy.style }}</span>
          <button type="button" :class="{ active: artistStyle === 'photo' }" :disabled="disabled || artistUploading" @click="setArtistStyle('photo')">{{ artistCopy.photo }}</button>
          <button type="button" :class="{ active: artistStyle === 'artwork' }" :disabled="disabled || artistUploading" @click="setArtistStyle('artwork')">{{ artistCopy.artwork }}</button>
          <button type="button" :class="{ active: artistStyle === 'duotone' }" :disabled="disabled || artistUploading" @click="setArtistStyle('duotone')">{{ artistCopy.duotone }}</button>
        </div>

        <div class="artist-layer__sliders">
          <label><span>{{ artistCopy.x }}</span><input v-model.number="artistPositionX" type="range" min="15" max="85" :disabled="disabled || artistUploading" @change="persistArtistSettings"></label>
          <label><span>{{ artistCopy.y }}</span><input v-model.number="artistPositionY" type="range" min="20" max="80" :disabled="disabled || artistUploading" @change="persistArtistSettings"></label>
          <label><span>{{ artistCopy.scale }}</span><input v-model.number="artistScale" type="range" min="0.6" max="1.8" step="0.05" :disabled="disabled || artistUploading" @change="persistArtistSettings"></label>
        </div>

        <button class="artist-layer__remove" type="button" :disabled="disabled || artistUploading" @click="removeArtistImage">{{ artistCopy.remove }}</button>
      </template>

      <small v-if="artistMessage">{{ artistMessage }}</small>
    </aside>

    <div v-if="imageUrl" class="cover-uploader__controls">
      <label>
        <span>{{ positionLabel }}</span>
        <input
          type="range"
          min="0"
          max="100"
          :value="positionY"
          :disabled="disabled || uploading"
          @input="emit('update:positionY', Number(($event.target as HTMLInputElement).value))"
        >
      </label>
      <button type="button" :disabled="disabled || uploading" @click="emit('remove')">{{ removeLabel }}</button>
    </div>
  </section>
</template>

<style scoped>
.cover-uploader { position: relative; min-height: clamp(420px, 46vw, 590px); overflow: hidden; border: 1px solid var(--cue-border); background: #090909; color: #f4f2ed; isolation: isolate; }
.cover-uploader__background { position: absolute; z-index: -3; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease, filter .35s ease; }
.cover-uploader__shade { position: absolute; z-index: -2; inset: 0; background: linear-gradient(90deg,rgba(0,0,0,.88) 0%,rgba(0,0,0,.42) 48%,rgba(0,0,0,.2) 100%),linear-gradient(0deg,rgba(0,0,0,.82),transparent 48%); }
.cover-uploader__artist-image { position: absolute; z-index: -1; width: clamp(180px, 28vw, 370px); max-height: 86%; object-fit: contain; object-position: center bottom; pointer-events: none; transform-origin: center; transition: left .18s ease, top .18s ease, transform .18s ease, filter .18s ease; -webkit-mask-image: linear-gradient(#000 0 82%, transparent 100%); mask-image: linear-gradient(#000 0 82%, transparent 100%); }
.cover-uploader__artist-image--artwork { mix-blend-mode: screen; }
.cover-uploader__artist-image--duotone { mix-blend-mode: screen; }
.cover-uploader > input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.cover-uploader__intro { position: relative; z-index: 2; display: grid; align-content: start; justify-items: start; max-width: 520px; padding: clamp(32px,5vw,64px); }
.cover-uploader__intro > span { color: #ceff54; font: 700 10px/1.2 monospace; letter-spacing: .15em; }
.cover-uploader__intro h3 { margin: 12px 0 10px; font-size: clamp(2rem,4.5vw,4.1rem); line-height: .88; letter-spacing: -.06em; text-transform: uppercase; }
.cover-uploader__intro p { max-width: 440px; margin: 0 0 22px; color: #c3c3c3; line-height: 1.5; }
.cover-uploader__intro button { display: inline-flex; align-items: center; gap: 11px; min-height: 48px; padding: 0 18px; border: 1px solid #ceff54; background: rgba(0,0,0,.65); color: #f4f2ed; cursor: pointer; font-weight: 900; }
.cover-uploader__intro button i { display: grid; place-items: center; width: 27px; height: 27px; border-radius: 50%; background: #ceff54; color: #090909; font-size: 19px; font-style: normal; }
.cover-uploader button:disabled { cursor: not-allowed; opacity: .55; }
.artist-layer { position: absolute; z-index: 3; top: 22px; right: 22px; width: min(390px, calc(100% - 44px)); padding: 15px; border: 1px solid rgba(255,255,255,.2); background: rgba(5,5,5,.8); backdrop-filter: blur(15px); transition: border-color .2s ease, background .2s ease; }
.artist-layer--dragging { border-color: #ceff54; background: rgba(18,24,8,.94); }
.artist-layer__heading { display: flex; align-items: start; justify-content: space-between; gap: 16px; }
.artist-layer__heading > div { min-width: 0; }
.artist-layer__heading span, .artist-layer__styles > span, .artist-layer__sliders span { color: #ceff54; font: 700 9px/1.2 monospace; letter-spacing: .12em; text-transform: uppercase; }
.artist-layer__heading p { margin: 7px 0 0; color: #bdbdbd; font-size: 12px; line-height: 1.4; }
.artist-layer__heading button { flex: none; min-height: 36px; padding: 0 12px; border: 1px solid #ceff54; background: transparent; color: #f4f2ed; cursor: pointer; font-weight: 800; }
.artist-layer__styles { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 14px; }
.artist-layer__styles > span { width: 100%; margin-bottom: 2px; }
.artist-layer__styles button { min-height: 31px; padding: 0 10px; border: 1px solid #4b4b4b; background: #111; color: #c8c8c8; cursor: pointer; font-size: 11px; font-weight: 800; }
.artist-layer__styles button.active { border-color: #ceff54; background: #ceff54; color: #090909; }
.artist-layer__sliders { display: grid; gap: 8px; margin-top: 14px; }
.artist-layer__sliders label { display: grid; grid-template-columns: 74px 1fr; align-items: center; gap: 9px; }
.artist-layer__sliders input { width: 100%; accent-color: #ceff54; }
.artist-layer__remove { margin-top: 12px; padding: 0; border: 0; background: transparent; color: #bdbdbd; cursor: pointer; font-size: 11px; text-decoration: underline; text-underline-offset: 3px; }
.artist-layer small { display: block; margin-top: 9px; color: #d7d7d7; font-size: 11px; }
.cover-uploader__controls { position: absolute; z-index: 3; right: 22px; bottom: 22px; left: 22px; display: flex; align-items: end; gap: 18px; padding: 14px 16px; border: 1px solid rgba(255,255,255,.22); background: rgba(5,5,5,.86); backdrop-filter: blur(14px); }
.cover-uploader__controls label { display: grid; flex: 1; gap: 7px; }
.cover-uploader__controls label span { color: #bbb; font: 700 9px/1.2 monospace; letter-spacing: .12em; text-transform: uppercase; }
.cover-uploader__controls input { width: 100%; accent-color: #ceff54; }
.cover-uploader__controls button { min-height: 38px; padding: 0 14px; border: 1px solid #555; background: transparent; color: #eee; cursor: pointer; font-weight: 800; }
.cover-uploader--dragging { outline: 3px solid #ceff54; outline-offset: -3px; }
.cover-uploader--dragging .cover-uploader__background { transform: scale(1.035); filter: brightness(1.15); }

:global(.profile-preview-hero) { position: relative; isolation: isolate; overflow: hidden; }
:global(.profile-preview-hero)::after { content: ''; position: absolute; z-index: 0; left: var(--cue-profile-artist-x, 50%); top: var(--cue-profile-artist-y, 50%); width: clamp(180px, 32vw, 390px); height: 88%; background-image: var(--cue-profile-artist-image, none); background-repeat: no-repeat; background-position: center bottom; background-size: contain; opacity: var(--cue-profile-artist-opacity, 0); filter: var(--cue-profile-artist-filter, none); transform: translate(-50%, -50%) scale(var(--cue-profile-artist-scale, 1)); transform-origin: center; pointer-events: none; -webkit-mask-image: linear-gradient(#000 0 82%, transparent 100%); mask-image: linear-gradient(#000 0 82%, transparent 100%); }
:global(.profile-preview-hero > *) { position: relative; z-index: 2; }

@media (max-width: 900px) {
  .cover-uploader { min-height: 650px; }
  .cover-uploader__intro { max-width: 60%; }
  .artist-layer { top: auto; bottom: 84px; }
  .cover-uploader__artist-image { width: clamp(170px, 38vw, 300px); }
}

@media (max-width: 680px) {
  .cover-uploader { min-height: 760px; }
  .cover-uploader__intro { max-width: none; padding: 28px 20px; }
  .cover-uploader__intro h3 { max-width: 80%; font-size: 2.75rem; }
  .cover-uploader__artist-image { top: 43% !important; width: min(58vw, 240px); max-height: 46%; }
  .artist-layer { right: 10px; bottom: 112px; left: 10px; width: auto; }
  .artist-layer__heading { align-items: stretch; flex-direction: column; }
  .artist-layer__heading button { width: 100%; }
  .cover-uploader__controls { right: 10px; bottom: 10px; left: 10px; align-items: stretch; flex-direction: column; gap: 10px; }
  .cover-uploader__controls button { width: 100%; }
  :global(.profile-preview-hero)::after { width: min(58vw, 240px); height: 76%; }
}
</style>
