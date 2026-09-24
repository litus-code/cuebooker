<script setup lang="ts">
import type { CoreBooking } from '../domain/bookingCore'
import type { CuePassportMedia, CuePassportMediaType } from '../domain/cuePassportMedia'

const props = defineProps<{
  workspaceId: string
  bookings: CoreBooking[]
  media: CuePassportMedia[]
  locale: 'es' | 'en'
  editable: boolean
  enabled: boolean
  limit: number | null
}>()

const emit = defineEmits<{ changed: [] }>()
const mediaApi = usePassportMedia()

const adding = ref(false)
const saving = ref(false)
const message = ref('')
const bookingId = ref('')
const mediaType = ref<CuePassportMediaType>('image')
const mediaUrl = ref('')
const permalink = ref('')
const thumbnailUrl = ref('')
const caption = ref('')
const capturedAt = ref('')

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'EVENT MEDIA',
  title: 'Vincula contenido a fechas reales.',
  body: 'Añade fotos, vídeos o reels a un booking confirmado. Vincularlos aquí no los publica automáticamente en tu perfil.',
  add: 'Añadir media',
  cancel: 'Cancelar',
  booking: 'Booking confirmado',
  chooseBooking: 'Selecciona una fecha',
  type: 'Tipo',
  mediaUrl: 'URL del media',
  permalink: 'Enlace público',
  thumbnail: 'Miniatura',
  caption: 'Texto',
  capturedAt: 'Fecha de captura',
  save: 'Vincular media',
  saving: 'Guardando…',
  linked: 'Vinculado',
  suggested: 'Sugerido',
  hidden: 'Oculto',
  hide: 'Ocultar',
  restore: 'Volver a vincular',
  empty: 'Todavía no hay Event Media vinculada a tus bookings confirmados.',
  invalid: 'Añade al menos una URL válida http/https.',
  saved: 'Media vinculada al booking.',
  updated: 'Estado actualizado.',
  error: 'No se pudo actualizar Event Media.',
  proTitle: 'Event Media en CUE Passport',
  proBody: 'Artist Pro permite vincular fotos, vídeos y reels a fechas reales y elegir cuáles aparecen en tu Passport público.',
  limitReached: 'Has alcanzado el límite de Event Media de tu plan.'
} : {
  eyebrow: 'EVENT MEDIA',
  title: 'Link content to real dates.',
  body: 'Add photos, videos or reels to a confirmed booking. Linking media here does not publish it automatically on your profile.',
  add: 'Add media',
  cancel: 'Cancel',
  booking: 'Confirmed booking',
  chooseBooking: 'Choose a date',
  type: 'Type',
  mediaUrl: 'Media URL',
  permalink: 'Public link',
  thumbnail: 'Thumbnail',
  caption: 'Caption',
  capturedAt: 'Captured at',
  save: 'Link media',
  saving: 'Saving…',
  linked: 'Linked',
  suggested: 'Suggested',
  hidden: 'Hidden',
  hide: 'Hide',
  restore: 'Link again',
  empty: 'No Event Media is linked to your confirmed bookings yet.',
  invalid: 'Add at least one valid http/https URL.',
  saved: 'Media linked to the booking.',
  updated: 'Status updated.',
  error: 'Event Media could not be updated.',
  proTitle: 'Event Media in CUE Passport',
  proBody: 'Artist Pro lets you link photos, videos and reels to real dates and choose which items appear on your public Passport.',
  limitReached: 'You have reached the Event Media limit for your plan.'
})

const capacityReached = computed(() => props.limit !== null && props.media.length >= props.limit)

const sortedBookings = computed(() => [...props.bookings].sort((a, b) =>
  String(b.event_date || b.created_at).localeCompare(String(a.event_date || a.created_at))
))

function bookingLabel(booking: CoreBooking) {
  const date = booking.event_date || booking.created_at.slice(0, 10)
  const place = booking.venue_name || booking.event_name || booking.city
    || (props.locale === 'es' ? 'Booking sin nombre' : 'Unnamed booking')
  return `${date} · ${place}`
}

function statusLabel(status: CuePassportMedia['status']) {
  return status === 'linked' ? copy.value.linked : status === 'hidden' ? copy.value.hidden : copy.value.suggested
}

function safeHttp(value: string | null | undefined) {
  return Boolean(value && /^https?:\/\//i.test(value.trim()))
}

function previewUrl(item: CuePassportMedia) {
  if (safeHttp(item.thumbnail_url)) return item.thumbnail_url
  if (item.media_type === 'image' && safeHttp(item.media_url)) return item.media_url
  return ''
}

function mediaLink(item: CuePassportMedia) {
  if (safeHttp(item.permalink)) return item.permalink
  if (safeHttp(item.media_url)) return item.media_url
  return ''
}

function resetForm() {
  bookingId.value = ''
  mediaType.value = 'image'
  mediaUrl.value = ''
  permalink.value = ''
  thumbnailUrl.value = ''
  caption.value = ''
  capturedAt.value = ''
  message.value = ''
}

function openAdd() {
  if (!props.editable || !props.enabled || capacityReached.value) return
  resetForm()
  bookingId.value = sortedBookings.value[0]?.id || ''
  adding.value = true
}

function closeAdd() {
  adding.value = false
  resetForm()
}

async function createMedia() {
  if (!props.workspaceId || !bookingId.value || saving.value) return
  if (![mediaUrl.value, permalink.value, thumbnailUrl.value].some(value => safeHttp(value))) {
    message.value = copy.value.invalid
    return
  }

  saving.value = true
  message.value = ''
  try {
    const publicLink = permalink.value.trim()
    let source: 'manual' | 'instagram' = 'manual'
    if (/^https?:\/\/(?:www\.)?instagram\.com\//i.test(publicLink)) source = 'instagram'

    await mediaApi.createMedia({
      workspaceId: props.workspaceId,
      bookingId: bookingId.value,
      source,
      mediaType: mediaType.value,
      status: 'linked',
      mediaUrl: mediaUrl.value,
      permalink: permalink.value,
      thumbnailUrl: thumbnailUrl.value,
      caption: caption.value.trim() || null,
      capturedAt: capturedAt.value ? new Date(capturedAt.value).toISOString() : null
    })
    adding.value = false
    resetForm()
    message.value = copy.value.saved
    emit('changed')
  } catch (error: any) {
    message.value = error?.message === 'invalid_media_url' ? copy.value.invalid : copy.value.error
  } finally {
    saving.value = false
  }
}

async function toggleStatus(item: CuePassportMedia) {
  if (!props.editable || !props.enabled || saving.value) return
  saving.value = true
  message.value = ''
  try {
    await mediaApi.updateStatus(
      props.workspaceId,
      item.id,
      item.status === 'linked' ? 'hidden' : 'linked'
    )
    message.value = copy.value.updated
    emit('changed')
  } catch {
    message.value = copy.value.error
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="passport-media-manager">
    <header class="passport-media-manager__head">
      <div>
        <span>{{ copy.eyebrow }} <CuePlanBadge entitlement="passport.media" /></span>
        <h2>{{ copy.title }}</h2>
        <p>{{ copy.body }}</p>
      </div>
      <button
        v-if="editable && enabled && sortedBookings.length"
        type="button"
        class="passport-media-manager__add"
        :disabled="capacityReached"
        @click="adding ? closeAdd() : openAdd()"
      >
        {{ adding ? copy.cancel : copy.add }}
      </button>
    </header>

    <CueUpgradePrompt
      v-if="!enabled"
      entitlement="passport.media"
      :title="copy.proTitle"
      :description="copy.proBody"
    />

    <p v-else-if="capacityReached" class="passport-media-manager__capacity">{{ copy.limitReached }}</p>

    <form v-if="adding" class="passport-media-manager__form" @submit.prevent="createMedia">
      <label class="passport-media-manager__wide">
        <span>{{ copy.booking }}</span>
        <select v-model="bookingId" required>
          <option value="">{{ copy.chooseBooking }}</option>
          <option v-for="booking in sortedBookings" :key="booking.id" :value="booking.id">
            {{ bookingLabel(booking) }}
          </option>
        </select>
      </label>

      <label>
        <span>{{ copy.type }}</span>
        <select v-model="mediaType">
          <option value="image">IMAGE</option>
          <option value="video">VIDEO</option>
          <option value="reel">REEL</option>
        </select>
      </label>

      <label>
        <span>{{ copy.capturedAt }}</span>
        <input v-model="capturedAt" type="datetime-local">
      </label>

      <label class="passport-media-manager__wide">
        <span>{{ copy.mediaUrl }}</span>
        <input v-model="mediaUrl" type="url" placeholder="https://">
      </label>

      <label class="passport-media-manager__wide">
        <span>{{ copy.permalink }}</span>
        <input v-model="permalink" type="url" placeholder="https://">
      </label>

      <label class="passport-media-manager__wide">
        <span>{{ copy.thumbnail }}</span>
        <input v-model="thumbnailUrl" type="url" placeholder="https://">
      </label>

      <label class="passport-media-manager__wide">
        <span>{{ copy.caption }}</span>
        <textarea v-model="caption" rows="3" maxlength="500" />
      </label>

      <p v-if="message" class="passport-media-manager__message">{{ message }}</p>
      <button class="passport-media-manager__save" type="submit" :disabled="saving || !bookingId">
        {{ saving ? copy.saving : copy.save }}
      </button>
    </form>

    <div v-if="media.length" class="passport-media-manager__grid">
      <article v-for="item in media" :key="item.id" :class="`is-${item.status}`">
        <a
          v-if="mediaLink(item)"
          :href="mediaLink(item) || undefined"
          target="_blank"
          rel="noopener noreferrer"
          class="passport-media-manager__preview"
        >
          <img v-if="previewUrl(item)" :src="previewUrl(item)" alt="">
          <span v-else>{{ item.media_type.toUpperCase() }}</span>
        </a>
        <div v-else class="passport-media-manager__preview">
          <img v-if="previewUrl(item)" :src="previewUrl(item)" alt="">
          <span v-else>{{ item.media_type.toUpperCase() }}</span>
        </div>

        <div class="passport-media-manager__meta">
          <span>{{ statusLabel(item.status) }}</span>
          <strong>{{ item.caption || item.media_type.toUpperCase() }}</strong>
          <small>{{ item.captured_at?.slice(0, 10) || '—' }}</small>
        </div>

        <button
          v-if="editable && enabled"
          type="button"
          :disabled="saving"
          @click="toggleStatus(item)"
        >
          {{ item.status === 'linked' ? copy.hide : copy.restore }}
        </button>
      </article>
    </div>

    <p v-else-if="!adding" class="passport-media-manager__empty">{{ copy.empty }}</p>
    <p v-if="message && !adding" class="passport-media-manager__message">{{ message }}</p>
  </section>
</template>

<style scoped>
.passport-media-manager{
  display:grid;
  gap:18px;
  margin-top:18px;
  padding:22px;
  border:1px solid var(--cue-border);
  background:var(--cue-surface);
}
.passport-media-manager__head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:20px;
}
.passport-media-manager__head>div{display:grid;gap:7px;max-width:760px}
.passport-media-manager__head span{
  display:flex;
  align-items:center;
  gap:7px;
  color:var(--cue-accent);
  font:800 8px/1 monospace;
  letter-spacing:.1em;
}
.passport-media-manager__head h2{margin:0;font-size:clamp(20px,2.5vw,34px);line-height:1}
.passport-media-manager__head p{margin:0;color:var(--cue-muted);font-size:11px;line-height:1.5}
.passport-media-manager__add,
.passport-media-manager__save{
  min-height:38px;
  padding:0 12px;
  border:1px solid var(--cue-accent);
  border-radius:var(--cue-radius-control);
  background:transparent;
  color:var(--cue-accent);
  cursor:pointer;
  font:800 8px/1 monospace;
  text-transform:uppercase;
}
.passport-media-manager__save{
  justify-self:start;
  background:var(--cue-accent);
  color:#080808;
}
.passport-media-manager__form{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:10px;
  padding:16px;
  border:1px solid var(--cue-border);
  background:var(--cue-bg);
}
.passport-media-manager__form label{display:grid;gap:6px}
.passport-media-manager__form label>span{
  color:var(--cue-muted);
  font:700 8px/1.2 monospace;
  letter-spacing:.08em;
  text-transform:uppercase;
}
.passport-media-manager__form input,
.passport-media-manager__form select,
.passport-media-manager__form textarea{
  width:100%;
  box-sizing:border-box;
  min-height:42px;
  padding:9px 10px;
  border:1px solid var(--cue-border);
  border-radius:var(--cue-radius-control);
  background:var(--cue-surface);
  color:var(--cue-text);
  font:inherit;
}
.passport-media-manager__form textarea{resize:vertical}
.passport-media-manager__wide{grid-column:1/-1}
.passport-media-manager__grid{
  display:grid;
  grid-template-columns:repeat(3,minmax(0,1fr));
  gap:9px;
}
.passport-media-manager__grid article{
  min-width:0;
  overflow:hidden;
  border:1px solid var(--cue-border);
  border-radius:var(--cue-radius-panel);
  background:var(--cue-bg);
}
.passport-media-manager__grid article.is-hidden{opacity:.56}
.passport-media-manager__preview{
  display:grid;
  place-items:center;
  aspect-ratio:16/10;
  overflow:hidden;
  background:#090909;
  color:var(--cue-muted);
  text-decoration:none;
  font:900 10px/1 monospace;
}
.passport-media-manager__preview img{width:100%;height:100%;object-fit:cover}
.passport-media-manager__meta{display:grid;gap:4px;padding:10px}
.passport-media-manager__meta>span{color:var(--cue-accent);font:800 7px/1 monospace;text-transform:uppercase}
.passport-media-manager__meta>strong{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px}
.passport-media-manager__meta>small{color:var(--cue-muted);font-size:8px}
.passport-media-manager__grid article>button{
  width:100%;
  min-height:34px;
  border:0;
  border-top:1px solid var(--cue-border);
  background:transparent;
  color:var(--cue-muted);
  cursor:pointer;
  font:800 8px/1 monospace;
  text-transform:uppercase;
}
.passport-media-manager__grid article>button:hover{color:var(--cue-accent)}
.passport-media-manager__capacity{
  margin:0;
  padding:10px 12px;
  border:1px solid var(--cue-border);
  color:var(--cue-muted);
  font-size:10px;
  line-height:1.45;
}
.passport-media-manager__message,
.passport-media-manager__empty{
  margin:0;
  color:var(--cue-muted);
  font-size:10px;
  line-height:1.45;
}
@media (max-width:860px){
  .passport-media-manager__grid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media (max-width:620px){
  .passport-media-manager{padding:16px}
  .passport-media-manager__head{display:grid}
  .passport-media-manager__add{width:100%}
  .passport-media-manager__form{grid-template-columns:1fr;padding:12px}
  .passport-media-manager__wide{grid-column:1}
  .passport-media-manager__grid{grid-template-columns:1fr}
}
</style>
