<script setup lang="ts">
import type { ArtistImageStyle } from '../domain/artistVisual'

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
const artistSettingsSaving = ref(false)
const artistMessage = ref('')
const artistOriginalUrl = ref('')
const artistCutoutUrl = ref('')
const artistStyle = ref<ArtistImageStyle>('artwork')
const artistPositionX = ref(50)
const artistPositionY = ref(50)
const artistScale = ref(1)
let settingsSaveTimer: ReturnType<typeof setTimeout> | null = null

const profiles = useArtistProfile()
const preferences = useCuePreferences()
const backgroundRemoval = useArtistBackgroundRemoval()

const coverSource = computed(() => props.imageUrl || '/images/profile/cuebooker-default-cover.webp')
const activeArtist = computed(() => profiles.activeProfile.value?.artist || null)
const displayedArtistUrl = computed(() => artistCutoutUrl.value || artistOriginalUrl.value)
const hasAutomaticCutout = computed(() => Boolean(artistCutoutUrl.value))

const artistCopy = computed(() => preferences.locale.value === 'es' ? {
  eyebrow: 'IMAGEN DEL ARTISTA',
  hint: 'Sube una foto. CueBooker quitará el fondo y la integrará en el centro de la portada.',
  choose: 'Añadir artista',
  change: 'Cambiar imagen',
  remove: 'Quitar imagen',
  recut: 'Regenerar recorte',
  style: 'Tratamiento',
  photo: 'Foto',
  artwork: 'Artwork',
  duotone: 'Duotono',
  x: 'Horizontal',
  y: 'Vertical',
  scale: 'Tamaño',
  uploading: 'Subiendo imagen…',
  cutting: 'Quitando fondo…',
  cutoutReady: 'Fondo eliminado. Ya puedes ajustar la composición.',
  cutoutFallback: 'La foto está guardada, pero el recorte no ha terminado. Pulsa Regenerar recorte.',
  removed: 'Imagen del artista eliminada.',
  invalid: 'Usa JPG, PNG o WebP de hasta 8 MB.',
  error: 'No se pudo guardar la imagen del artista.'
} : {
  eyebrow: 'ARTIST IMAGE',
  hint: 'Upload a photo. CueBooker will remove the background and place the artist in the centre of the cover.',
  choose: 'Add artist',
  change: 'Change image',
  remove: 'Remove image',
  recut: 'Regenerate cutout',
  style: 'Treatment',
  photo: 'Photo',
  artwork: 'Artwork',
  duotone: 'Duotone',
  x: 'Horizontal',
  y: 'Vertical',
  scale: 'Size',
  uploading: 'Uploading image…',
  cutting: 'Removing background…',
  cutoutReady: 'Background removed. You can now adjust the composition.',
  cutoutFallback: 'The photo is saved, but the cutout did not finish. Use Regenerate cutout.',
  removed: 'Artist image removed.',
  invalid: 'Use a JPG, PNG or WebP file up to 8 MB.',
  error: 'The artist image could not be saved.'
})

const artistBusyLabel = computed(() => {
  if (backgroundRemoval.processing.value || backgroundRemoval.loadingModel.value) {
    return `${artistCopy.value.cutting}${backgroundRemoval.progress.value ? ` ${backgroundRemoval.progress.value}%` : ''}`
  }
  return artistCopy.value.uploading
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

function replaceObjectUrl(target: typeof artistOriginalUrl, next = '') {
  if (target.value.startsWith('blob:')) URL.revokeObjectURL(target.value)
  target.value = next
}

async function loadArtistMedia(imagePath?: string | null, cutoutPath?: string | null) {
  try {
    const [original, cutout] = await Promise.all([
      imagePath ? profiles.getArtistImageObjectUrl(imagePath) : Promise.resolve(''),
      cutoutPath ? profiles.getArtistCutoutObjectUrl(cutoutPath) : Promise.resolve('')
    ])

    replaceObjectUrl(artistOriginalUrl, original)
    replaceObjectUrl(artistCutoutUrl, cutout)
  } catch {
    artistMessage.value = artistCopy.value.error
  }
}

function syncArtistControls() {
  const artist = activeArtist.value
  if (!artist) return
  artistStyle.value = artist.artist_image_style || 'artwork'
  artistPositionX.value = artist.artist_image_position_x ?? 50
  artistPositionY.value = artist.artist_image_position_y ?? 50
  artistScale.value = Number(artist.artist_image_scale || 1)
}

watch(
  () => activeArtist.value?.id,
  () => {
    const artist = activeArtist.value
    if (!artist) return
    syncArtistControls()
    void loadArtistMedia(artist.artist_image_path, artist.artist_cutout_path)
  },
  { immediate: true }
)

watch(
  [
    () => activeArtist.value?.artist_image_path,
    () => activeArtist.value?.artist_cutout_path
  ],
  ([imagePath, cutoutPath], [previousImagePath, previousCutoutPath]) => {
    if (imagePath === previousImagePath && cutoutPath === previousCutoutPath) return
    void loadArtistMedia(imagePath, cutoutPath)
  }
)

const artistFilter = computed(() => {
  if (artistStyle.value === 'photo') {
    return 'drop-shadow(0 22px 34px rgba(0,0,0,.5))'
  }
  if (artistStyle.value === 'duotone') {
    return 'grayscale(1) sepia(1) saturate(5) hue-rotate(35deg) contrast(1.3) brightness(1.08) drop-shadow(0 22px 34px rgba(0,0,0,.5))'
  }
  return 'grayscale(1) contrast(1.75) brightness(1.1) drop-shadow(2px 0 0 rgba(206,255,84,.7)) drop-shadow(-2px 0 0 rgba(206,255,84,.25)) drop-shadow(0 24px 36px rgba(0,0,0,.6))'
})

function syncPreviewVariables() {
  if (!import.meta.client) return
  const style = document.documentElement.style
  style.setProperty('--cue-profile-artist-image', displayedArtistUrl.value ? `url("${displayedArtistUrl.value}")` : 'none')
  style.setProperty('--cue-profile-artist-x', `${artistPositionX.value}%`)
  style.setProperty('--cue-profile-artist-y', `${artistPositionY.value}%`)
  style.setProperty('--cue-profile-artist-scale', String(artistScale.value))
  style.setProperty('--cue-profile-artist-filter', artistFilter.value)
  style.setProperty('--cue-profile-artist-opacity', displayedArtistUrl.value ? '1' : '0')
}

watch([displayedArtistUrl, artistPositionX, artistPositionY, artistScale, artistFilter], syncPreviewVariables, { immediate: true })

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

async function createAndUploadCutout(artistId: string, source: Blob) {
  const cutout = await backgroundRemoval.removeBackground(source)
  return profiles.uploadArtistCutout(artistId, cutout)
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
  let cutoutPath = ''
  let cutoutFailed = false
  const previousPath = activeArtist.value?.artist_image_path || ''
  const previousCutoutPath = activeArtist.value?.artist_cutout_path || ''

  try {
    uploadedPath = await profiles.uploadArtistImage(artistId, file)

    try {
      cutoutPath = await createAndUploadCutout(artistId, file)
    } catch {
      cutoutFailed = true
    }

    const saved = await profiles.saveArtistVisual(artistId, {
      artist_image_path: uploadedPath,
      artist_cutout_path: cutoutPath || null,
      artist_image_style: artistStyle.value,
      artist_image_position_x: artistPositionX.value,
      artist_image_position_y: artistPositionY.value,
      artist_image_scale: artistScale.value
    })

    await loadArtistMedia(saved.artist_image_path, saved.artist_cutout_path)

    if (previousPath && previousPath !== uploadedPath) {
      await profiles.deleteArtistImage(previousPath).catch(() => undefined)
    }
    if (previousCutoutPath && previousCutoutPath !== cutoutPath) {
      await profiles.deleteArtistCutout(previousCutoutPath).catch(() => undefined)
    }

    artistMessage.value = cutoutFailed ? artistCopy.value.cutoutFallback : artistCopy.value.cutoutReady
  } catch {
    if (uploadedPath) await profiles.deleteArtistImage(uploadedPath).catch(() => undefined)
    if (cutoutPath) await profiles.deleteArtistCutout(cutoutPath).catch(() => undefined)
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
  if (!artistId || !current || props.disabled) return

  artistSettingsSaving.value = true
  try {
    await profiles.saveArtistVisual(artistId, {
      artist_image_path: current.artist_image_path,
      artist_cutout_path: current.artist_cutout_path,
      artist_image_style: artistStyle.value,
      artist_image_position_x: artistPositionX.value,
      artist_image_position_y: artistPositionY.value,
      artist_image_scale: artistScale.value
    })
  } catch {
    artistMessage.value = artistCopy.value.error
  } finally {
    artistSettingsSaving.value = false
  }
}

function schedulePersistArtistSettings() {
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer)
  settingsSaveTimer = setTimeout(() => {
    settingsSaveTimer = null
    void persistArtistSettings()
  }, 250)
}

function setArtistStyle(value: ArtistImageStyle) {
  artistStyle.value = value
  schedulePersistArtistSettings()
}

async function regenerateCutout() {
  const artistId = profiles.activeArtistId.value
  const current = activeArtist.value
  if (!artistId || !current?.artist_image_path || props.disabled || artistUploading.value) return

  artistUploading.value = true
  artistMessage.value = ''
  let nextCutoutPath = ''
  const previousCutoutPath = current.artist_cutout_path || ''

  try {
    const original = await profiles.getMediaBlob(current.artist_image_path)
    nextCutoutPath = await createAndUploadCutout(artistId, original)
    const saved = await profiles.saveArtistVisual(artistId, {
      artist_image_path: current.artist_image_path,
      artist_cutout_path: nextCutoutPath,
      artist_image_style: artistStyle.value,
      artist_image_position_x: artistPositionX.value,
      artist_image_position_y: artistPositionY.value,
      artist_image_scale: artistScale.value
    })
    await loadArtistMedia(saved.artist_image_path, saved.artist_cutout_path)
    if (previousCutoutPath && previousCutoutPath !== nextCutoutPath) {
      await profiles.deleteArtistCutout(previousCutoutPath).catch(() => undefined)
    }
    artistMessage.value = artistCopy.value.cutoutReady
  } catch {
    if (nextCutoutPath) await profiles.deleteArtistCutout(nextCutoutPath).catch(() => undefined)
    artistMessage.value = artistCopy.value.cutoutFallback
  } finally {
    artistUploading.value = false
  }
}

async function removeArtistImage() {
  const artistId = profiles.activeArtistId.value
  const current = activeArtist.value
  if (!artistId || !current?.artist_image_path || props.disabled || artistUploading.value) return

  artistUploading.value = true
  artistMessage.value = ''
  const previousPath = current.artist_image_path
  const previousCutoutPath = current.artist_cutout_path || ''

  try {
    await profiles.saveArtistVisual(artistId, {
      artist_image_path: null,
      artist_cutout_path: null,
      artist_image_style: artistStyle.value,
      artist_image_position_x: artistPositionX.value,
      artist_image_position_y: artistPositionY.value,
      artist_image_scale: artistScale.value
    })
    replaceObjectUrl(artistOriginalUrl)
    replaceObjectUrl(artistCutoutUrl)
    await profiles.deleteArtistImage(previousPath).catch(() => undefined)
    if (previousCutoutPath) await profiles.deleteArtistCutout(previousCutoutPath).catch(() => undefined)
    artistMessage.value = artistCopy.value.removed
  } catch {
    artistMessage.value = artistCopy.value.error
  } finally {
    artistUploading.value = false
  }
}

onBeforeUnmount(() => {
  if (settingsSaveTimer) clearTimeout(settingsSaveTimer)
  replaceObjectUrl(artistOriginalUrl)
  replaceObjectUrl(artistCutoutUrl)
  if (!import.meta.client) return
  const style = document.documentElement.style
  ;['--cue-profile-artist-image', '--cue-profile-artist-x', '--cue-profile-artist-y', '--cue-profile-artist-scale', '--cue-profile-artist-filter', '--cue-profile-artist-opacity'].forEach(name => style.removeProperty(name))
})
</script>

<template>
  <section class="cover-uploader" :class="{ 'cover-uploader--dragging': dragging }">
    <div
      class="cover-uploader__stage"
      @dragenter.prevent="dragging = true"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <img class="cover-uploader__background" :src="coverSource" alt="" :style="{ objectPosition: `50% ${positionY}%` }">
      <div class="cover-uploader__shade" />

      <img
        v-if="displayedArtistUrl"
        class="cover-uploader__artist-image"
        :class="[`cover-uploader__artist-image--${artistStyle}`, { 'cover-uploader__artist-image--fallback': !hasAutomaticCutout }]"
        :src="displayedArtistUrl"
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
          {{ artistUploading ? artistBusyLabel : (displayedArtistUrl ? artistCopy.change : artistCopy.choose) }}
        </button>
      </div>

      <template v-if="displayedArtistUrl">
        <div class="artist-layer__styles" role="group" :aria-label="artistCopy.style">
          <span>{{ artistCopy.style }}</span>
          <button type="button" :class="{ active: artistStyle === 'photo' }" :disabled="disabled || artistUploading" @click="setArtistStyle('photo')">{{ artistCopy.photo }}</button>
          <button type="button" :class="{ active: artistStyle === 'artwork' }" :disabled="disabled || artistUploading" @click="setArtistStyle('artwork')">{{ artistCopy.artwork }}</button>
          <button type="button" :class="{ active: artistStyle === 'duotone' }" :disabled="disabled || artistUploading" @click="setArtistStyle('duotone')">{{ artistCopy.duotone }}</button>
        </div>

        <div class="artist-layer__sliders">
          <label><span>{{ artistCopy.x }}</span><input v-model.number="artistPositionX" type="range" min="15" max="85" :disabled="disabled || artistUploading" @change="schedulePersistArtistSettings"></label>
          <label><span>{{ artistCopy.y }}</span><input v-model.number="artistPositionY" type="range" min="20" max="80" :disabled="disabled || artistUploading" @change="schedulePersistArtistSettings"></label>
          <label><span>{{ artistCopy.scale }}</span><input v-model.number="artistScale" type="range" min="0.6" max="1.8" step="0.05" :disabled="disabled || artistUploading" @change="schedulePersistArtistSettings"></label>
        </div>

        <div class="artist-layer__footer">
          <button v-if="!hasAutomaticCutout" type="button" :disabled="disabled || artistUploading" @click="regenerateCutout">{{ artistCopy.recut }}</button>
          <button class="artist-layer__remove" type="button" :disabled="disabled || artistUploading" @click="removeArtistImage">{{ artistCopy.remove }}</button>
          <span v-if="artistSettingsSaving" class="artist-layer__saving" aria-live="polite">•••</span>
        </div>
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
.cover-uploader { overflow: hidden; border: 1px solid var(--cue-border); background: #090909; color: #f4f2ed; }
.cover-uploader__stage { position: relative; min-height: clamp(260px, 26vw, 360px); overflow: hidden; isolation: isolate; }
.cover-uploader__background { position: absolute; z-index: -3; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease, filter .35s ease; }
.cover-uploader__shade { position: absolute; z-index: -2; inset: 0; background: linear-gradient(90deg,rgba(0,0,0,.9) 0%,rgba(0,0,0,.5) 42%,rgba(0,0,0,.16) 100%),linear-gradient(0deg,rgba(0,0,0,.64),transparent 55%); }
.cover-uploader__artist-image { position: absolute; z-index: -1; width: clamp(190px, 30vw, 390px); max-height: 90%; object-fit: contain; object-position: center bottom; pointer-events: none; transform-origin: center; transition: left .12s ease, top .12s ease, transform .12s ease, filter .12s ease; }
.cover-uploader__artist-image--fallback { max-height: 74%; border-radius: 4px; opacity: .82; -webkit-mask-image: linear-gradient(#000 0 78%, transparent 100%); mask-image: linear-gradient(#000 0 78%, transparent 100%); }
.cover-uploader__artist-image--artwork,.cover-uploader__artist-image--duotone { mix-blend-mode: screen; }
.cover-uploader__stage > input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.cover-uploader__intro { position: relative; z-index: 2; display: grid; align-content: center; justify-items: start; box-sizing: border-box; height: 100%; min-height: 0; max-width: min(48%, 560px); padding: clamp(24px,3.4vw,44px) clamp(28px,5vw,72px); }
.cover-uploader__intro > span { color: #ceff54; font: 700 10px/1.2 monospace; letter-spacing: .15em; }
.cover-uploader__intro h3 { margin: 10px 0 8px; font-size: clamp(2rem,3.4vw,3.45rem); line-height: .9; letter-spacing: -.055em; text-transform: uppercase; }
.cover-uploader__intro p { max-width: 420px; margin: 0 0 16px; color: #c3c3c3; line-height: 1.42; }
.cover-uploader__intro button { display:inline-flex; align-items:center; justify-content:center; gap:9px; min-height:40px; padding:0 14px; border:1px solid #ceff54; background:rgba(0,0,0,.65); color:#f4f2ed; cursor:pointer; font-size:12px; font-weight:850; }
.cover-uploader__intro button i { display:grid; place-items:center; width:20px; height:20px; border-radius:50%; background:#ceff54; color:#090909; font-size:14px; line-height:1; font-style:normal; }
.cover-uploader button:disabled { cursor: not-allowed; opacity: .55; }
.artist-layer { padding: 18px 20px; border-top: 1px solid rgba(255,255,255,.14); background: #0b0b0b; transition: border-color .2s ease, background .2s ease; }
.artist-layer--dragging { border-color: #ceff54; background: #111608; }
.artist-layer__heading { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.artist-layer__heading > div { min-width: 0; }
.artist-layer__heading span,.artist-layer__styles > span,.artist-layer__sliders span { color: #ceff54; font: 700 9px/1.2 monospace; letter-spacing: .12em; text-transform: uppercase; }
.artist-layer__heading p { max-width: 620px; margin: 6px 0 0; color: #aaa; font-size: 12px; line-height: 1.45; }
.artist-layer__heading button { flex: none; min-height: 38px; padding: 0 14px; border: 1px solid #ceff54; background: transparent; color: #f4f2ed; cursor: pointer; font-weight: 800; }
.artist-layer__styles { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; margin-top: 16px; }
.artist-layer__styles > span { margin-right: 6px; }
.artist-layer__styles button { min-height: 32px; padding: 0 11px; border: 1px solid #414141; background: #111; color: #c8c8c8; cursor: pointer; font-size: 11px; font-weight: 800; }
.artist-layer__styles button.active { border-color: #ceff54; background: #ceff54; color: #090909; }
.artist-layer__sliders { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 18px; margin-top: 16px; }
.artist-layer__sliders label { display: grid; gap: 7px; }
.artist-layer__sliders input { width: 100%; accent-color: #ceff54; }
.artist-layer__footer { display: flex; align-items: center; gap: 16px; min-height: 18px; margin-top: 14px; }
.artist-layer__footer button { padding: 0; border: 0; background: transparent; color: #bdbdbd; cursor: pointer; font-size: 11px; text-decoration: underline; text-underline-offset: 3px; }
.artist-layer__remove { color: #969696 !important; }
.artist-layer__saving { margin-left: auto; color: #ceff54; letter-spacing: .18em; animation: saving-pulse 1s ease-in-out infinite; }
.artist-layer small { display: block; margin-top: 10px; color: #d7d7d7; font-size: 11px; }
.cover-uploader__controls { display: flex; align-items: end; gap: 18px; padding: 14px 20px; border-top: 1px solid rgba(255,255,255,.12); background: #101010; }
.cover-uploader__controls label { display: grid; flex: 1; gap: 7px; }
.cover-uploader__controls label span { color: #bbb; font: 700 9px/1.2 monospace; letter-spacing: .12em; text-transform: uppercase; }
.cover-uploader__controls input { width: 100%; accent-color: #ceff54; }
.cover-uploader__controls button { min-height: 38px; padding: 0 14px; border: 1px solid #555; background: transparent; color: #eee; cursor: pointer; font-weight: 800; }
.cover-uploader--dragging .cover-uploader__stage { outline: 3px solid #ceff54; outline-offset: -3px; }
.cover-uploader--dragging .cover-uploader__background { transform: scale(1.035); filter: brightness(1.15); }

@keyframes saving-pulse { 0%,100% { opacity: .35; } 50% { opacity: 1; } }

:global(.profile-preview) { width: min(1180px, calc(100vw - 48px)); }
:global(.profile-preview-hero) { position: relative !important; min-height: clamp(380px,52vw,590px) !important; padding: 0 !important; overflow: hidden; background: #090909; isolation: isolate; }
:global(.profile-preview-hero > img) { position: absolute !important; z-index: -3 !important; inset: 0 !important; width: 100% !important; height: 100% !important; object-fit: cover !important; }
:global(.profile-preview-hero-shade) { position: absolute !important; z-index: -2 !important; inset: 0 !important; background: linear-gradient(90deg,rgba(0,0,0,.82) 0%,rgba(0,0,0,.55) 38%,rgba(0,0,0,.16) 78%),linear-gradient(0deg,rgba(0,0,0,.8),transparent 58%) !important; }
:global(.profile-preview-hero)::after { content: ''; position: absolute; z-index: 0; left: var(--cue-profile-artist-x,50%); top: var(--cue-profile-artist-y,50%); width: clamp(220px,34vw,430px); height: 94%; background-image: var(--cue-profile-artist-image,none); background-repeat: no-repeat; background-position: center bottom; background-size: contain; opacity: var(--cue-profile-artist-opacity,0); filter: var(--cue-profile-artist-filter,none); transform: translate(-50%,-50%) scale(var(--cue-profile-artist-scale,1)); transform-origin: center; pointer-events: none; }
:global(.profile-preview-hero > h2) { position: absolute !important; z-index: 2 !important; left: clamp(24px,5vw,64px) !important; bottom: 88px !important; max-width: 48% !important; margin: 0 !important; font-size: clamp(3rem,6.5vw,6.6rem) !important; line-height: .82 !important; letter-spacing: -.07em !important; overflow-wrap: normal !important; word-break: normal !important; }
:global(.profile-preview-hero > p:not(.profile-preview-empty)) { position: absolute !important; z-index: 2 !important; top: 38px !important; left: clamp(24px,5vw,64px) !important; max-width: 45% !important; margin: 0 !important; color: #c5c5c5 !important; }
:global(.profile-preview-hero > .profile-preview-chips),:global(.profile-preview-hero > .profile-preview-empty) { position: absolute !important; z-index: 2 !important; left: clamp(24px,5vw,64px) !important; bottom: 38px !important; max-width: 48% !important; margin: 0 !important; }
:global(.profile-preview-body) { min-height: 0 !important; grid-template-columns: minmax(0,1.35fr) minmax(240px,.65fr) !important; gap: clamp(28px,5vw,58px) !important; padding: clamp(30px,5vw,60px) !important; }
:global(.profile-preview-bio) { max-width: 720px; margin: 0; font-size: clamp(1.1rem,2vw,1.65rem) !important; line-height: 1.5 !important; }

@media (max-width: 760px) {
  .cover-uploader__stage { min-height: 470px; }
  .cover-uploader__intro { align-content: start; padding: 28px 20px; }
  .cover-uploader__intro h3 { max-width: 78%; font-size: 2.8rem; }
  .cover-uploader__intro p { max-width: 72%; }
  .cover-uploader__artist-image { width: min(58vw,250px); max-height: 62%; }
  .artist-layer { padding: 16px; }
  .artist-layer__heading { align-items: stretch; flex-direction: column; gap: 12px; }
  .artist-layer__heading button { width: 100%; }
  .artist-layer__sliders { grid-template-columns: 1fr; gap: 10px; }
  .cover-uploader__controls { align-items: stretch; flex-direction: column; gap: 10px; }
  .cover-uploader__controls button { width: 100%; }
  :global(.profile-preview) { width: 100%; }
  :global(.profile-preview-hero) { min-height: 420px !important; }
  :global(.profile-preview-hero)::after { width: min(62vw,280px); height: 82%; }
  :global(.profile-preview-hero > h2) { left: 22px !important; right: 22px !important; bottom: 84px !important; max-width: none !important; font-size: clamp(3rem,16vw,5.2rem) !important; }
  :global(.profile-preview-hero > p:not(.profile-preview-empty)) { top: 24px !important; left: 22px !important; max-width: 75% !important; }
  :global(.profile-preview-hero > .profile-preview-chips),:global(.profile-preview-hero > .profile-preview-empty) { left: 22px !important; right: 22px !important; bottom: 30px !important; max-width: none !important; }
  :global(.profile-preview-body) { grid-template-columns: 1fr !important; gap: 28px !important; padding: 28px 22px 42px !important; }
}


@media (max-width: 720px) {
  .cover-uploader__stage { min-height: 210px; }
  .cover-uploader__intro {
    width: 58%;
    max-width: 58%;
    height: 100%;
    padding: 20px 18px;
    align-content: center;
  }
  .cover-uploader__intro > span { font-size: 8px; }
  .cover-uploader__intro h3 { margin: 8px 0 7px; font-size: clamp(1.45rem, 7.2vw, 2rem); line-height: .92; }
  .cover-uploader__intro p { margin-bottom: 12px; font-size: 11px; line-height: 1.35; }
  .cover-uploader__intro button { min-height:38px; padding-inline:11px; font-size:10px; }
  .cover-uploader__intro button i { width:18px; height:18px; font-size:13px; }
}

</style>


<style scoped>


@media (max-width: 720px) {
  .cover-uploader__stage { min-height: 210px; }
  .cover-uploader__intro {
    width: 58%;
    max-width: 58%;
    height: 100%;
    padding: 20px 18px;
    align-content: center;
  }
  .cover-uploader__intro > span { font-size: 8px; }
  .cover-uploader__intro h3 { margin: 8px 0 7px; font-size: clamp(1.45rem, 7.2vw, 2rem); line-height: .92; }
  .cover-uploader__intro p { margin-bottom: 12px; font-size: 11px; line-height: 1.35; }
  .cover-uploader__intro button { min-height: 40px; padding-inline: 12px; font-size: 11px; }
  .cover-uploader__intro button i { width: 24px; height: 24px; font-size: 17px; }
}

</style>
