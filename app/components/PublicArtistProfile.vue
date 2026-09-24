<script setup lang="ts">
import type { PublicArtistProfile, PublicBookingRequestInput } from '../domain/publicArtistProfile'

type BookingFormSubmission = Omit<PublicBookingRequestInput, 'artistSlug' | 'requestId' | 'entrySource' | 'locale'>

const props = withDefaults(defineProps<{
  profile: PublicArtistProfile
  locale?: 'es' | 'en'
  bookingFocused?: boolean
  bookingSubmitting?: boolean
  bookingSent?: boolean
  bookingConfirmationSent?: boolean | null
  bookingReference?: string
  bookingError?: string
  preview?: boolean
}>(), {
  locale: 'es',
  bookingFocused: false,
  bookingSubmitting: false,
  bookingSent: false,
  bookingConfirmationSent: null,
  bookingReference: '',
  bookingError: '',
  preview: false
})

const analytics = useAnalytics()

const emit = defineEmits<{
  submitBooking: [payload: BookingFormSubmission]
}>()

const requestOpen = ref(props.bookingFocused)
const bookingModal = ref<HTMLElement | null>(null)

watch(() => props.bookingFocused, value => {
  if (value) requestOpen.value = true
})

const copy = computed(() => props.locale === 'es' ? {
  booking: 'Solicitar fecha',
  bookingClosed: 'Booking no disponible ahora',
  about: 'Sobre el proyecto',
  formats: 'Formatos',
  links: 'Escuchar / seguir',
  based: 'Base',
  years: 'Años en activo',
  preview: 'Vista previa del perfil público'
} : {
  booking: 'Request booking',
  bookingClosed: 'Booking currently unavailable',
  about: 'About the project',
  formats: 'Formats',
  links: 'Listen / follow',
  based: 'Based in',
  years: 'Years active',
  preview: 'Public profile preview'
})

const genres = computed(() => [...props.profile.primaryGenres, ...props.profile.secondaryGenres].filter(Boolean).slice(0, 7))
const location = computed(() => [props.profile.city, props.profile.countryCode].filter(Boolean).join(' · '))
const portrait = computed(() => props.profile.artistCutoutUrl || props.profile.artistImageUrl)
const visualMode = computed(() => props.profile.visualMode || 'photo')
const showCueId = computed(() => visualMode.value === 'cue_id' && Boolean(props.profile.cueId))
function safeExternalUrl(value: string | null) {
  if (!value) return null
  return /^https?:\/\//i.test(value.trim()) ? value.trim() : null
}

const socialLinks = computed(() => [
  ['Website', safeExternalUrl(props.profile.websiteUrl)],
  ['Instagram', safeExternalUrl(props.profile.instagramUrl)],
  ['SoundCloud', safeExternalUrl(props.profile.soundcloudUrl)],
  ['Mixcloud', safeExternalUrl(props.profile.mixcloudUrl)],
  ['YouTube', safeExternalUrl(props.profile.youtubeUrl)],
  ['Spotify', safeExternalUrl(props.profile.spotifyUrl)]
].filter((item): item is [string, string] => Boolean(item[1])))

function openBooking() {
  if (!props.profile.acceptingRequests && !props.preview) return
  analytics.track('public_booking_open', {
    artist_slug: props.profile.slug,
    preview: props.preview
  })
  requestOpen.value = true
}

function closeBooking() {
  requestOpen.value = false
}

function handleBookingKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape' || !requestOpen.value) return
  event.stopImmediatePropagation()
  closeBooking()
}

watch(requestOpen, async open => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
  if (open) {
    await nextTick()
    bookingModal.value?.focus({ preventScroll: true })
  }
}, { immediate: true })

onMounted(() => {
  if (import.meta.client) window.addEventListener('keydown', handleBookingKeydown)
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.body.style.overflow = ''
  window.removeEventListener('keydown', handleBookingKeydown)
})
</script>

<template>
  <main class="public-artist-profile">
    <header class="public-artist-profile__topbar">
      <NuxtLink to="/" aria-label="Cuebooker"><CueBrand /></NuxtLink>
      <span v-if="preview">{{ copy.preview }}</span>
    </header>

    <section class="public-artist-profile__hero">
      <div class="public-artist-profile__cover">
        <img v-if="profile.coverUrl" class="public-artist-profile__cover-image" :src="profile.coverUrl" alt="" :style="{ objectPosition: `50% ${profile.coverPositionY}%` }">
        <div v-else class="public-artist-profile__cover-default" aria-hidden="true"><i /><i /><i /></div>
        <CueIdStage
          v-if="showCueId && profile.cueId"
          class="public-artist-profile__cue-id"
          :config="{ ...profile.cueId, enabled: true }"
          :artist-name="profile.stageName"
          :interactive="false"
          compact
        />
        <div class="public-artist-profile__shade" />
        <img
          v-if="portrait && !showCueId"
          :class="['public-artist-profile__portrait', { 'public-artist-profile__portrait--artwork': visualMode === 'artwork' }]"

          :src="portrait"
          :alt="profile.stageName"
          :style="{
            left: `${profile.artistImagePositionX}%`,
            top: `${profile.artistImagePositionY}%`,
            transform: `translate(-50%, -50%) scale(${profile.artistImageScale || 1})`
          }"
        >
      </div>

      <div class="public-artist-profile__identity">
        <p v-if="location">{{ location }}</p>
        <h1>{{ profile.stageName }}</h1>
        <div v-if="genres.length" class="public-artist-profile__genres">
          <span v-for="genre in genres" :key="genre">{{ genre }}</span>
        </div>
        <button
          class="public-artist-profile__booking-cta"
          type="button"
          :disabled="!profile.acceptingRequests && !preview"
          @click="openBooking"
        >
          {{ profile.acceptingRequests || preview ? copy.booking : copy.bookingClosed }}
          <span v-if="profile.acceptingRequests || preview" class="arrow arrow--ne" aria-hidden="true" />
        </button>
      </div>
    </section>

    <section class="public-artist-profile__story">
      <div>
        <span>{{ copy.about }}</span>
        <p>{{ profile.bio || '—' }}</p>
      </div>
      <dl>
        <div v-if="location"><dt>{{ copy.based }}</dt><dd>{{ location }}</dd></div>
        <div v-if="profile.yearsActive !== null"><dt>{{ copy.years }}</dt><dd>{{ profile.yearsActive }}</dd></div>
        <div v-if="profile.performanceFormats.length"><dt>{{ copy.formats }}</dt><dd>{{ profile.performanceFormats.join(' · ') }}</dd></div>
      </dl>
    </section>

    <section class="public-artist-profile__sound">
      <span>SOUND</span>
      <div>
        <strong v-for="genre in genres.slice(0, 4)" :key="genre">{{ genre }}</strong>
        <strong v-if="!genres.length">{{ locale === 'es' ? 'SONIDO PENDIENTE' : 'SOUND PENDING' }}</strong>
      </div>
      <p>{{ profile.performanceFormats.join(' · ') || 'DJ SET' }}</p>
    </section>

    <section v-if="showCueId" class="public-artist-profile__cue">
      <div aria-hidden="true">
        <span>CUE</span>
        <strong>ID</strong>
      </div>
      <div>
        <span>CUE ID</span>
        <h2>{{ locale === 'es' ? 'IDENTIDAD VISUAL DIGITAL.' : 'DIGITAL ARTIST IDENTITY.' }}</h2>
        <p>{{ locale === 'es'
          ? 'Esta identidad visual forma parte de la presencia pública del artista en Cuebooker.'
          : 'This visual identity is part of the artist public presence on Cuebooker.' }}</p>
      </div>
    </section>

    <CuePassportProfileSummary
      v-if="profile.passport"
      :bookings="profile.passport.confirmedBookings"
      :cities="profile.passport.cities"
      :venues="profile.passport.venues"
      :milestones="profile.passport.milestones"
      :media="profile.passport.media"
      :locale="locale"
      :editable="false"
    />

    <section v-if="socialLinks.length" class="public-artist-profile__links">
      <span>{{ copy.links }}</span>
      <nav>
        <a v-for="link in socialLinks" :key="link[0]" :href="link[1]" target="_blank" rel="noopener noreferrer">
          {{ link[0] }}
          <span class="arrow arrow--ne" aria-hidden="true" />
        </a>
      </nav>
    </section>

    <section class="public-artist-profile__booking-band">
      <div>
        <span>BOOKING</span>
        <h2>{{ profile.acceptingRequests || preview ? (locale === 'es' ? 'SOLICITAR FECHA.' : 'REQUEST A DATE.') : (locale === 'es' ? 'BOOKING PAUSADO.' : 'BOOKING PAUSED.') }}</h2>
        <p>{{ locale === 'es'
          ? 'La solicitud entra directamente en el Booking Core del artista.'
          : 'Your enquiry goes directly into the artist Booking Core.' }}</p>
      </div>
      <button
        type="button"
        :disabled="!profile.acceptingRequests && !preview"
        @click="openBooking"
      >
        {{ profile.acceptingRequests || preview ? copy.booking : copy.bookingClosed }}
      </button>
    </section>

    <Teleport to="body">
      <div
        v-if="requestOpen"
        class="public-artist-profile__booking-backdrop"
        role="presentation"
        @click.self="closeBooking"
      >
        <section
          id="artist-booking-request"
          ref="bookingModal"
          class="public-artist-profile__booking-modal"
          role="dialog"
          tabindex="-1"
          aria-modal="true"
          :aria-label="locale === 'es' ? 'Solicitar fecha' : 'Request booking'"
        >
          <header class="public-artist-profile__booking-header">
            <div>
              <span>BOOKING REQUEST</span>
              <strong>{{ profile.stageName }}</strong>
            </div>
            <button
              type="button"
              :aria-label="locale === 'es' ? 'Cerrar' : 'Close'"
              @click="closeBooking"
            >×</button>
          </header>

          <div class="public-artist-profile__booking-body">
            <PublicBookingForm
              :artist-name="profile.stageName"
              :locale="locale"
              :submitting="bookingSubmitting"
              :sent="bookingSent"
              :confirmation-sent="bookingConfirmationSent"
              :reference="bookingReference"
              :error="bookingError"
              :preview="preview"
              @submit="emit('submitBooking', $event)"
            />
          </div>
        </section>
      </div>
    </Teleport>
  </main>
</template>

<style scoped>
:global(body) { margin: 0; background: var(--cue-bg, #080808); }
.public-artist-profile { min-height: 100vh; background: var(--cue-bg, #080808); color: var(--cue-text, #f2f0eb); font-family: Arial, Helvetica, sans-serif; }
.public-artist-profile__topbar { position: relative; z-index: 4; display: flex; justify-content: space-between; align-items: center; min-height: 64px; padding: 0 clamp(18px, 4vw, 48px); border-bottom: 1px solid var(--cue-border, #2c2c2c); }
.public-artist-profile__topbar a { color: inherit; text-decoration: none; }
.public-artist-profile__topbar > span { color: var(--cue-muted, #999); font: 700 9px/1.2 monospace; letter-spacing: .1em; text-transform: uppercase; }
.public-artist-profile__hero { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(360px, .65fr); min-height: min(760px, calc(100vh - 64px)); border-bottom: 1px solid var(--cue-border, #2c2c2c); }
.public-artist-profile__cover { position: relative; min-height: 600px; overflow: hidden; background: #121212; }
.public-artist-profile__cover-image { width: 100%; height: 100%; object-fit: cover; }
.public-artist-profile__cover-image--portrait-fallback { position:absolute; inset:-5%; width:110%; height:110%; filter:blur(26px) saturate(.75) brightness(.52); transform:scale(1.08); }
.public-artist-profile__cover-fallback-overlay { position:absolute; inset:0; background:radial-gradient(circle at 70% 32%, rgba(206,255,84,.12), transparent 32%), linear-gradient(180deg,rgba(8,8,8,.1),rgba(8,8,8,.72)); }
.public-artist-profile__cover-default { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(circle at 28% 35%, color-mix(in srgb, var(--cue-accent, #e8ff2f) 28%, transparent), transparent 30%), #111; }
.public-artist-profile__cover-default i { position: absolute; width: 60vw; height: 60vw; max-width: 760px; max-height: 760px; border: 1px solid color-mix(in srgb, var(--cue-accent, #e8ff2f) 40%, transparent); border-radius: 50%; }
.public-artist-profile__cover-default i:nth-child(1) { top: -32%; left: -15%; }
.public-artist-profile__cover-default i:nth-child(2) { right: -25%; bottom: -40%; }
.public-artist-profile__cover-default i:nth-child(3) { top: 35%; left: 38%; width: 12vw; height: 12vw; background: var(--cue-accent, #e8ff2f); filter: blur(1px); opacity: .8; }
.public-artist-profile__cue-id { position:absolute; inset:0; z-index:1; width:100%; height:100%; min-height:100%; border:0; }
.public-artist-profile__cue-id :deep(.cue-id-stage__meta) { bottom:28px; }
.public-artist-profile__shade { position: absolute; z-index:2; inset: 0; background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,.5)); pointer-events: none; }
.public-artist-profile__portrait { position: absolute; z-index: 3; width: min(56%, 520px); max-height: 88%; object-fit: contain; transform-origin: center; filter: drop-shadow(0 24px 28px rgba(0,0,0,.5)); }
.public-artist-profile__portrait--artwork { filter: grayscale(1) contrast(1.75) brightness(1.1) drop-shadow(2px 0 0 rgba(206,255,84,.7)) drop-shadow(-2px 0 0 rgba(206,255,84,.25)) drop-shadow(0 24px 36px rgba(0,0,0,.6)); }
.public-artist-profile__identity { display: flex; flex-direction: column; justify-content: flex-end; padding: clamp(32px, 5vw, 76px); background: var(--cue-surface, #101010); }
.public-artist-profile__identity > p { margin: 0 0 14px; color: var(--cue-accent, #e8ff2f); font: 700 10px/1.2 monospace; letter-spacing: .12em; text-transform: uppercase; }
.public-artist-profile__identity h1 { margin: 0; font-size: clamp(4rem, 9vw, 9.5rem); line-height: .76; letter-spacing: -.07em; text-transform: uppercase; overflow-wrap: anywhere; }
.public-artist-profile__genres { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 28px; }
.public-artist-profile__genres span { padding: 7px 9px; border: 1px solid var(--cue-border, #333); color: var(--cue-muted, #aaa); font: 700 9px/1 monospace; text-transform: uppercase; }
.public-artist-profile__booking-cta { display: inline-flex; align-items: center; align-self: flex-start; gap: 10px; min-height: 54px; margin-top: 34px; padding: 0 20px; border: 0; background: var(--cue-accent, #e8ff2f); color: #080808; cursor: pointer; font-weight: 900; }
.public-artist-profile__booking-cta:disabled { border: 1px solid var(--cue-border, #333); background: transparent; color: var(--cue-muted, #777); cursor: default; }
.public-artist-profile__booking-cta:focus-visible, .public-artist-profile__links a:focus-visible { outline: 2px solid var(--cue-accent, #e8ff2f); outline-offset: 3px; }
.public-artist-profile__story { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(300px, .7fr); gap: clamp(30px, 7vw, 120px); padding: clamp(40px, 8vw, 110px) clamp(18px, 6vw, 90px); border-bottom: 1px solid var(--cue-border, #2c2c2c); }
.public-artist-profile__story span, .public-artist-profile__links > span, .public-artist-profile__story dt { color: var(--cue-muted, #999); font: 700 9px/1.2 monospace; letter-spacing: .1em; text-transform: uppercase; }
.public-artist-profile__story p { max-width: 820px; margin: 16px 0 0; font-size: clamp(1.35rem, 2.5vw, 2.4rem); line-height: 1.18; letter-spacing: -.025em; }
.public-artist-profile__story dl { display: grid; align-content: start; gap: 24px; margin: 0; }
.public-artist-profile__story dl div { padding-top: 12px; border-top: 1px solid var(--cue-border, #333); }
.public-artist-profile__story dd { margin: 7px 0 0; font-size: 14px; line-height: 1.45; }
.public-artist-profile__sound { display:grid; grid-template-columns:140px minmax(0,1fr); gap:24px; padding:34px clamp(18px,6vw,90px); border-bottom:1px solid var(--cue-border,#2c2c2c); }
.public-artist-profile__sound>span,.public-artist-profile__cue>div:last-child>span,.public-artist-profile__booking-band>div>span { color:var(--cue-accent,#e8ff2f); font:800 9px/1 monospace; letter-spacing:.1em; }
.public-artist-profile__sound>div { display:flex; flex-wrap:wrap; gap:8px; }
.public-artist-profile__sound strong { padding:9px 11px; border:1px solid var(--cue-border,#333); border-radius:8px; font:900 13px/1 monospace; text-transform:uppercase; }
.public-artist-profile__sound p { grid-column:2; margin:0; color:var(--cue-muted,#888); font:800 9px/1.4 monospace; text-transform:uppercase; }
.public-artist-profile__cue { display:grid; grid-template-columns:minmax(220px,.7fr) 1fr; min-height:260px; border-bottom:1px solid var(--cue-border,#2c2c2c); background:#0c0c0c; }
.public-artist-profile__cue>div:first-child { display:grid; place-content:center; background:radial-gradient(circle,color-mix(in srgb,var(--cue-accent,#e8ff2f) 14%,transparent),transparent 44%),#070707; }
.public-artist-profile__cue>div:first-child span,.public-artist-profile__cue>div:first-child strong { font:900 54px/.8 monospace; letter-spacing:-.08em; }
.public-artist-profile__cue>div:first-child strong { color:var(--cue-accent,#e8ff2f); }
.public-artist-profile__cue>div:last-child { display:grid; align-content:center; gap:10px; padding:32px; }
.public-artist-profile__cue h2 { max-width:520px; margin:0; font-size:clamp(28px,4vw,48px); line-height:.95; }
.public-artist-profile__cue p { max-width:620px; margin:0; color:var(--cue-muted,#888); font-size:12px; line-height:1.55; }
.public-artist-profile__links { padding: 34px clamp(18px, 6vw, 90px) 48px; border-bottom: 1px solid var(--cue-border, #2c2c2c); }
.public-artist-profile__links nav { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 17px; }
.public-artist-profile__links a { display: inline-flex; align-items: center; gap: 7px; min-height: 42px; padding: 0 13px; border: 1px solid var(--cue-border, #333); color: var(--cue-text, #f2f0eb); text-decoration: none; font-size: 12px; font-weight: 800; }
.public-artist-profile__links a:hover { border-color: var(--cue-accent, #e8ff2f); color: var(--cue-accent, #e8ff2f); }
.public-artist-profile__booking-band { display:flex; align-items:end; justify-content:space-between; gap:24px; padding:36px clamp(18px,6vw,90px); border-bottom:1px solid var(--cue-border,#2c2c2c); background:linear-gradient(110deg,color-mix(in srgb,var(--cue-accent,#e8ff2f) 7%,#090909),#090909 55%); }
.public-artist-profile__booking-band h2 { margin:8px 0 5px; font-size:clamp(28px,4vw,48px); line-height:.95; }
.public-artist-profile__booking-band p { max-width:620px; margin:0; color:var(--cue-muted,#888); font-size:12px; line-height:1.5; }
.public-artist-profile__booking-band button { min-height:52px; padding:0 18px; border:1px solid var(--cue-accent,#e8ff2f); border-radius:8px; background:var(--cue-accent,#e8ff2f); color:#080808; cursor:pointer; font-weight:900; }
.public-artist-profile__booking-band button:disabled { border-color:var(--cue-border,#333); background:transparent; color:var(--cue-muted,#777); cursor:default; }
.public-artist-profile__booking-backdrop { position:fixed; z-index:80; inset:0; display:grid; place-items:center; padding:24px; background:rgba(0,0,0,.72); backdrop-filter:blur(8px); }
.public-artist-profile__booking-modal { width:min(760px,100%); max-height:min(860px,calc(100dvh - 48px)); overflow:hidden; border:1px solid var(--cue-border,#2c2c2c); border-radius:12px; background:var(--cue-bg,#080808); box-shadow:0 28px 90px rgba(0,0,0,.58); }
.public-artist-profile__booking-header { display:flex; align-items:center; justify-content:space-between; gap:16px; min-height:64px; padding:12px 16px; border-bottom:1px solid var(--cue-border,#2c2c2c); background:#0c0c0c; }
.public-artist-profile__booking-header>div { display:grid; gap:5px; }
.public-artist-profile__booking-header span { color:var(--cue-accent,#e8ff2f); font:800 8px/1 monospace; letter-spacing:.1em; }
.public-artist-profile__booking-header strong { font-size:16px; text-transform:uppercase; }
.public-artist-profile__booking-header button { width:38px; height:38px; padding:0; border:1px solid #343434; border-radius:8px; background:#111; color:#ddd; cursor:pointer; font-size:22px; line-height:1; }
.public-artist-profile__booking-body { max-height:calc(min(860px,100dvh - 48px) - 65px); overflow:auto; overscroll-behavior:contain; }
@media (max-width: 900px) {
  .public-artist-profile__hero {
    position:relative;
    display:block;
    min-height:76svh;
    overflow:hidden;
  }
  .public-artist-profile__cover {
    position:absolute;
    inset:0;
    min-height:0;
    height:100%;
  }
  .public-artist-profile__shade {
    background:linear-gradient(180deg,rgba(0,0,0,.02) 18%,rgba(0,0,0,.28) 52%,rgba(0,0,0,.92) 92%);
  }
  .public-artist-profile__portrait {
    width:min(70%,520px);
    max-height:72%;
  }
  .public-artist-profile__identity {
    position:relative;
    z-index:3;
    min-height:76svh;
    box-sizing:border-box;
    justify-content:flex-end;
    padding:clamp(28px,6vw,48px) clamp(18px,5vw,34px) clamp(30px,7vw,52px);
    background:linear-gradient(180deg,transparent 44%,rgba(8,8,8,.18) 60%,rgba(8,8,8,.92) 100%);
  }
  .public-artist-profile__identity > p { margin-bottom:8px; }
  .public-artist-profile__identity h1 {
    max-width:90%;
    font-size:clamp(4rem,17vw,7.5rem);
    line-height:.78;
  }
  .public-artist-profile__genres { margin-top:18px; }
  .public-artist-profile__booking-cta { margin-top:22px; }
  .public-artist-profile__story { grid-template-columns:1fr; }
  .public-artist-profile__cue { grid-template-columns:1fr; }
  .public-artist-profile__cue>div:first-child { min-height:190px; }
  .public-artist-profile__booking-band { align-items:stretch; flex-direction:column; }
}
@media (max-width: 520px) {
  .public-artist-profile__booking-backdrop { place-items:stretch; padding:0; }
  .public-artist-profile__booking-modal { width:100%; max-height:100dvh; min-height:100dvh; border:0; border-radius:0; box-shadow:none; }
  .public-artist-profile__booking-header { position:sticky; top:0; z-index:2; min-height:60px; padding:10px 14px; }
  .public-artist-profile__booking-body { max-height:calc(100dvh - 60px); }
  .public-artist-profile__topbar { min-height:56px; }
  .public-artist-profile__hero,
  .public-artist-profile__identity { min-height:72svh; }
  .public-artist-profile__portrait {
    width:min(76%,410px);
    max-height:68%;
  }
  .public-artist-profile__identity { padding:22px 18px 28px; }
  .public-artist-profile__identity h1 {
    max-width:100%;
    font-size:clamp(3.35rem,18vw,5.7rem);
  }
  .public-artist-profile__genres { gap:5px; margin-top:14px; }
  .public-artist-profile__genres span { padding:6px 8px; font-size:8px; }
  .public-artist-profile__booking-cta { min-height:50px; margin-top:18px; }
  .public-artist-profile__story { padding:30px 18px 40px; gap:26px; }
  .public-artist-profile__story p { font-size:clamp(1.15rem,5.5vw,1.6rem); line-height:1.24; }
  .public-artist-profile__links { padding:28px 18px 36px; }
  .public-artist-profile__sound { grid-template-columns:1fr; gap:14px; padding:28px 18px; }
  .public-artist-profile__sound p { grid-column:1; }
  .public-artist-profile__cue>div:last-child { padding:24px 18px; }
  .public-artist-profile__booking-band { padding:28px 18px; }
  .public-artist-profile__booking-band button { width:100%; }
}
</style>
