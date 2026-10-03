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
const portrait = computed(() => props.profile.artistImageUrl || props.profile.artistCutoutUrl)
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
  if (props.preview) {
    document.getElementById('artist-booking-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
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
        <img v-if="profile.coverUrl" class="public-artist-profile__cover-image" :src="profile.coverUrl" alt="">
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
        <div class="public-artist-profile__grid" aria-hidden="true" />
      </div>

      <div class="public-artist-profile__hero-rail" aria-hidden="true">
        <span>ARTIST / {{ profile.slug || 'CUEBOOKER' }}</span>
        <span>INDEPENDENT SOUND / LIVE CULTURE</span>
      </div>
      <div class="public-artist-profile__vertical" aria-hidden="true">CUEBOOKER / ARTIST EDITION</div>
      <div class="public-artist-profile__hero-marker" aria-hidden="true"><span>CB</span><i />001</div>

      <div class="public-artist-profile__identity">
        <div class="public-artist-profile__identity-top">
          <div v-if="portrait && !showCueId" class="public-artist-profile__avatar">
            <img :src="portrait" :alt="profile.stageName">
          </div>
          <div class="public-artist-profile__location">
            <span>{{ locale === 'es' ? 'ARTISTA / ESCENA' : 'ARTIST / SCENE' }}</span>
            <p>{{ location || (locale === 'es' ? 'BASE POR DEFINIR' : 'BASE TO BE DEFINED') }}</p>
          </div>
        </div>

        <h1>{{ profile.stageName }}</h1>

        <div class="public-artist-profile__hero-bottom">
          <div v-if="genres.length" class="public-artist-profile__genres">
            <span v-for="(genre, index) in genres.slice(0, 4)" :key="genre"><small>0{{ index + 1 }}</small>{{ genre }}</span>
          </div>
          <button
            class="public-artist-profile__booking-cta"
            type="button"
            :disabled="!profile.acceptingRequests && !preview"
            @click="openBooking"
          >
            {{ preview ? (locale === 'es' ? 'Ver formulario' : 'View form') : (profile.acceptingRequests ? copy.booking : copy.bookingClosed) }}
            <span v-if="profile.acceptingRequests || preview" class="arrow arrow--ne" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div class="public-artist-profile__scroll-cue" aria-hidden="true"><i /> SCROLL TO EXPLORE</div>
    </section>

    <section class="public-artist-profile__story">
      <div class="public-artist-profile__section-index" aria-hidden="true">01</div>
      <div class="public-artist-profile__story-copy">
        <h2>{{ copy.about }}</h2>
        <p>{{ profile.bio || (locale === 'es' ? 'Una identidad que sigue tomando forma.' : 'An identity still taking shape.') }}</p>
      </div>
      <dl>
        <div v-if="location"><dt>{{ copy.based }}</dt><dd>{{ location }}</dd></div>
        <div v-if="profile.yearsActive !== null"><dt>{{ copy.years }}</dt><dd>{{ profile.yearsActive }}</dd></div>
        <div v-if="profile.performanceFormats.length"><dt>{{ copy.formats }}</dt><dd>{{ profile.performanceFormats.join(' · ') }}</dd></div>
      </dl>
    </section>

    <section class="public-artist-profile__sound">
      <div class="public-artist-profile__section-index" aria-hidden="true">02</div>
      <div class="public-artist-profile__sound-head">
        <h2>SOUND / PERFORMANCE</h2>
        <p>{{ locale === 'es' ? 'La identidad detrás del set.' : 'The identity behind the set.' }}</p>
      </div>
      <div class="public-artist-profile__sound-list">
        <div v-for="(genre, index) in genres.slice(0, 4)" :key="genre"><small>0{{ index + 1 }} /</small><strong>{{ genre }}</strong></div>
        <div v-if="!genres.length"><small>01 /</small><strong>{{ locale === 'es' ? 'SONIDO POR DEFINIR' : 'SOUND TO BE DEFINED' }}</strong></div>
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
        <h2>{{ locale === 'es' ? 'OTRA FORMA DE ESTAR EN ESCENA.' : 'ANOTHER WAY TO TAKE THE STAGE.' }}</h2>
        <p>{{ locale === 'es'
          ? 'Esta identidad visual forma parte de la presencia pública del artista en Cuebooker.'
          : 'This visual identity is part of the artist public presence on Cuebooker.' }}</p>
      </div>
    </section>

    <section v-if="profile.passport" class="public-artist-profile__passport">
      <div class="public-artist-profile__section-index" aria-hidden="true">03</div>
      <div class="public-artist-profile__passport-head">
        <h2>CUE PASSPORT / LIVE HISTORY</h2>
        <p>{{ locale === 'es' ? 'Trayectoria construida a partir de fechas confirmadas.' : 'Trajectory built from confirmed dates.' }}</p>
      </div>
      <CuePassportProfileSummary
        :bookings="profile.passport.confirmedBookings"
        :cities="profile.passport.cities"
        :venues="profile.passport.venues"
        :milestones="profile.passport.milestones"
        :media="profile.passport.media"
        :locale="locale"
        :editable="false"
      />
    </section>

    <section v-if="socialLinks.length" class="public-artist-profile__links">
      <div class="public-artist-profile__section-index" aria-hidden="true">04</div>
      <div class="public-artist-profile__links-head"><h2>{{ copy.links }}</h2><p>{{ locale === 'es' ? 'El sonido sigue aquí.' : 'The sound continues here.' }}</p></div>
      <nav>
        <a v-for="(link, index) in socialLinks" :key="link[0]" :href="link[1]" target="_blank" rel="noopener noreferrer">
          <small>0{{ index + 1 }}</small><strong>{{ link[0] }}</strong>
          <span class="arrow arrow--ne" aria-hidden="true" />
        </a>
      </nav>
    </section>

    <section class="public-artist-profile__booking-band">
      <div class="public-artist-profile__section-index" aria-hidden="true">05</div>
      <div>
        <span>BOOKING</span>
        <h2>{{ profile.acceptingRequests || preview ? (locale === 'es' ? 'SOLICITAR FECHA.' : 'REQUEST A DATE.') : (locale === 'es' ? 'BOOKING PAUSADO.' : 'BOOKING PAUSED.') }}</h2>
        <p>{{ locale === 'es'
          ? 'Una fecha empieza con una conversación. Cuéntame qué tienes en mente.'
          : 'Every date starts with a conversation. Tell me what you have in mind.' }}</p>
        <p v-if="profile.bookingManagedBy" class="public-artist-profile__booking-agent">{{ locale === 'es' ? 'Booking gestionado por' : 'Booking managed by' }} {{ profile.bookingManagedBy }}</p>
      </div>
      <button
        type="button"
        :disabled="!profile.acceptingRequests && !preview"
        @click="openBooking"
      >
        {{ preview ? (locale === 'es' ? 'Ver formulario' : 'View form') : (profile.acceptingRequests ? copy.booking : copy.bookingClosed) }}
      </button>
    </section>

    <section v-if="preview" id="artist-booking-preview" class="public-artist-profile__form-preview" :aria-label="locale === 'es' ? 'Vista previa del formulario de booking' : 'Booking form preview'">
      <PublicBookingForm :artist-name="profile.stageName" :locale="locale" preview />
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
              <small v-if="profile.bookingManagedBy">{{ locale === 'es' ? 'Gestionado por' : 'Managed by' }} {{ profile.bookingManagedBy }}</small>
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
.public-artist-profile__hero { position:relative; min-height:calc(100svh - 64px); overflow:hidden; border-bottom:1px solid var(--cue-border,#2c2c2c); background:#090909; isolation:isolate; }
.public-artist-profile__cover { position:absolute; z-index:0; inset:0; overflow:hidden; background:#121212; }
.public-artist-profile__cover-image { width:100%; height:100%; object-fit:cover; object-position:center; filter:saturate(.72) contrast(1.08) brightness(.82); transform:scale(1.002); }
.public-artist-profile__cover-default { position:absolute; inset:0; overflow:hidden; background:radial-gradient(circle at 72% 28%,color-mix(in srgb,var(--cue-accent,#e8ff2f) 16%,transparent),transparent 27%),linear-gradient(125deg,#171717,#070707 72%); }
.public-artist-profile__cover-default i { position:absolute; width:60vw; height:60vw; max-width:760px; max-height:760px; border:1px solid color-mix(in srgb,var(--cue-accent,#e8ff2f) 24%,transparent); border-radius:50%; }
.public-artist-profile__cover-default i:nth-child(1) { top:-32%; left:-15%; }
.public-artist-profile__cover-default i:nth-child(2) { right:-25%; bottom:-40%; }
.public-artist-profile__cover-default i:nth-child(3) { top:35%; left:38%; width:12vw; height:12vw; background:var(--cue-accent,#e8ff2f); opacity:.55; }
.public-artist-profile__cue-id { position:absolute; inset:0; z-index:1; width:100%; height:100%; min-height:100%; border:0; }
.public-artist-profile__cue-id :deep(.cue-id-stage__meta) { bottom:28px; }
.public-artist-profile__shade { position:absolute; z-index:2; inset:0; background:linear-gradient(90deg,rgba(5,5,5,.88) 0%,rgba(5,5,5,.52) 42%,rgba(5,5,5,.08) 72%),linear-gradient(0deg,rgba(5,5,5,.96) 0%,rgba(5,5,5,.2) 54%,rgba(5,5,5,.18) 100%); pointer-events:none; }
.public-artist-profile__grid { position:absolute; z-index:2; inset:0; opacity:.22; background-image:linear-gradient(rgba(255,255,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.08) 1px,transparent 1px); background-size:72px 72px; mask-image:linear-gradient(to right,#000,transparent 72%); pointer-events:none; }
.public-artist-profile__hero-rail { position:absolute; z-index:4; top:22px; right:24px; display:grid; justify-items:end; gap:6px; color:rgba(255,255,255,.55); font:800 7px/1 monospace; letter-spacing:.14em; }
.public-artist-profile__hero-rail span:first-child { color:var(--cue-accent,#e8ff2f); }
.public-artist-profile__vertical { position:absolute; z-index:4; top:50%; right:28px; color:rgba(255,255,255,.75); font:800 9px/1 monospace; letter-spacing:.16em; text-transform:uppercase; writing-mode:vertical-rl; transform:translateY(-50%); }
.public-artist-profile__scroll-cue { position:absolute; z-index:4; bottom:30px; left:clamp(28px,5vw,72px); display:flex; align-items:center; gap:11px; color:#d7d7d7; font:800 9px/1 monospace; letter-spacing:.16em; }
.public-artist-profile__scroll-cue i { display:block; width:34px; height:1px; background:var(--cue-accent,#e8ff2f); }
.public-artist-profile__identity { position:relative; z-index:3; display:flex; flex-direction:column; justify-content:flex-end; min-height:calc(100svh - 64px); box-sizing:border-box; padding:clamp(28px,5vw,72px) clamp(28px,5vw,72px) clamp(94px,8vw,130px); }
.public-artist-profile__identity-top { display:flex; align-items:end; gap:18px; margin-bottom:clamp(18px,3vw,34px); }
.public-artist-profile__avatar { width:92px; height:112px; flex:0 0 auto; overflow:hidden; border:1px solid rgba(255,255,255,.28); border-radius:4px; background:#111; box-shadow:0 18px 45px rgba(0,0,0,.38); }
.public-artist-profile__avatar img { width:100%; height:100%; object-fit:cover; object-position:center; filter:saturate(.88) contrast(1.04); }
.public-artist-profile__location { display:grid; gap:6px; padding-bottom:3px; }
.public-artist-profile__location span { color:var(--cue-accent,#e8ff2f); font:800 8px/1 monospace; letter-spacing:.12em; }
.public-artist-profile__location p { margin:0; color:#d6d6d6; font:800 10px/1.2 monospace; letter-spacing:.08em; text-transform:uppercase; }
.public-artist-profile__identity h1 { max-width:min(1280px,88vw); margin:0; font-size:clamp(5rem,13vw,13rem); line-height:.83; letter-spacing:-.075em; text-transform:uppercase; overflow-wrap:anywhere; text-shadow:0 18px 50px rgba(0,0,0,.55); }
.public-artist-profile__hero-bottom { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-top:clamp(24px,4vw,42px); }
.public-artist-profile__genres { display:flex; flex-wrap:wrap; gap:7px; margin:0; }
.public-artist-profile__genres span { padding: 7px 9px; border: 1px solid var(--cue-border, #333); color: var(--cue-muted, #aaa); font: 700 9px/1 monospace; text-transform: uppercase; }
.public-artist-profile__booking-cta { display: inline-flex; align-items: center; align-self: flex-start; gap: 10px; min-height: 54px; margin-top: 34px; padding: 0 20px; border: 0; background: var(--cue-accent, #e8ff2f); color: #080808; cursor: pointer; font-weight: 900; }
.public-artist-profile__hero::after { content:""; position:absolute; z-index:2; left:0; right:0; top:0; height:3px; background:linear-gradient(90deg,var(--cue-accent,#e8ff2f) 0 17%,transparent 17% 82%,#ef3a31 82% 100%); pointer-events:none; }
.public-artist-profile__cover-image { filter:saturate(.83) contrast(1.16) brightness(.78); }
.public-artist-profile__shade { background:linear-gradient(90deg,rgba(3,3,3,.82) 0%,rgba(3,3,3,.25) 56%,rgba(3,3,3,.06) 100%),linear-gradient(0deg,rgba(3,3,3,.98) 0%,rgba(3,3,3,.1) 65%,rgba(3,3,3,.3) 100%); }
.public-artist-profile__story-copy>span::before,.public-artist-profile__sound>span::before { content:"●"; margin-right:10px; color:#ee3731; font-size:8px; vertical-align:2px; }
.public-artist-profile__sound strong { border-radius:0; background:linear-gradient(145deg,#171717,#090909); font-size:clamp(1rem,2vw,1.65rem); letter-spacing:-.03em; padding:18px 22px; }
.public-artist-profile__booking-cta:disabled { border: 1px solid var(--cue-border, #333); background: transparent; color: var(--cue-muted, #777); cursor: default; }
.public-artist-profile__booking-cta:focus-visible, .public-artist-profile__links a:focus-visible { outline: 2px solid var(--cue-accent, #e8ff2f); outline-offset: 3px; }
.public-artist-profile__section-index { color:#3c3c3c; font:900 clamp(2.5rem,5vw,5.5rem)/.8 monospace; letter-spacing:-.08em; user-select:none; }
.public-artist-profile__story { display:grid; grid-template-columns:auto minmax(0,1.25fr) minmax(280px,.55fr); gap:clamp(24px,5vw,72px); padding:clamp(54px,8vw,120px) clamp(18px,6vw,90px); border-bottom:1px solid var(--cue-border,#2c2c2c); background:linear-gradient(180deg,#090909,#0b0b0b); }
.public-artist-profile__story span, .public-artist-profile__links > span, .public-artist-profile__story dt { color:var(--cue-muted,#999); font:700 9px/1.2 monospace; letter-spacing:.1em; text-transform:uppercase; }
.public-artist-profile__story-copy>span { color:var(--cue-accent,#e8ff2f); }
.public-artist-profile__story p { max-width:900px; margin:18px 0 0; font-size:clamp(1.5rem,3vw,3rem); line-height:1.08; letter-spacing:-.035em; }
.public-artist-profile__story dl { display:grid; align-content:start; gap:0; margin:0; border-top:1px solid var(--cue-border,#333); }
.public-artist-profile__story dl div { padding:16px 0; border-bottom:1px solid var(--cue-border,#333); }
.public-artist-profile__story dd { margin:7px 0 0; font:800 13px/1.4 monospace; text-transform:uppercase; }
.public-artist-profile__sound { display:grid; grid-template-columns:auto 160px minmax(0,1fr); gap:22px; align-items:start; padding:38px clamp(18px,6vw,90px); border-bottom:1px solid var(--cue-border,#2c2c2c); background:#080808; }
.public-artist-profile__sound>span,.public-artist-profile__cue>div:last-child>span,.public-artist-profile__booking-band>div:not(.public-artist-profile__section-index)>span,.public-artist-profile__passport-head>span { color:var(--cue-accent,#e8ff2f); font:800 9px/1 monospace; letter-spacing:.1em; }
.public-artist-profile__sound>div { display:flex; flex-wrap:wrap; gap:8px; }
.public-artist-profile__sound strong { padding:9px 11px; border:1px solid var(--cue-border,#333); border-radius:8px; font:900 13px/1 monospace; text-transform:uppercase; }
.public-artist-profile__sound p { grid-column:3; margin:0; color:var(--cue-muted,#888); font:800 9px/1.4 monospace; text-transform:uppercase; }
.public-artist-profile__cue { display:grid; grid-template-columns:minmax(220px,.7fr) 1fr; min-height:260px; border-bottom:1px solid var(--cue-border,#2c2c2c); background:#0c0c0c; }
.public-artist-profile__cue>div:first-child { display:grid; place-content:center; background:radial-gradient(circle,color-mix(in srgb,var(--cue-accent,#e8ff2f) 14%,transparent),transparent 44%),#070707; }
.public-artist-profile__cue>div:first-child span,.public-artist-profile__cue>div:first-child strong { font:900 54px/.8 monospace; letter-spacing:-.08em; }
.public-artist-profile__cue>div:first-child strong { color:var(--cue-accent,#e8ff2f); }
.public-artist-profile__cue>div:last-child { display:grid; align-content:center; gap:10px; padding:32px; }
.public-artist-profile__cue h2 { max-width:520px; margin:0; font-size:clamp(28px,4vw,48px); line-height:.95; }
.public-artist-profile__cue p { max-width:620px; margin:0; color:var(--cue-muted,#888); font-size:12px; line-height:1.55; }
.public-artist-profile__passport { display:grid; grid-template-columns:auto minmax(0,1fr); gap:28px; min-width:0; padding:44px clamp(18px,6vw,90px) 0; border-bottom:1px solid var(--cue-border,#2c2c2c); background:#0a0a0a; }
.public-artist-profile__passport-head { display:flex; justify-content:space-between; gap:20px; align-items:end; min-width:0; margin-bottom:22px; }
.public-artist-profile__passport-head p { max-width:420px; margin:0; color:var(--cue-muted,#888); font:700 10px/1.4 monospace; text-align:right; }
.public-artist-profile__passport :deep(.profile-passport) { grid-column:1 / -1; min-width:0; width:100%; box-sizing:border-box; margin:0 0 -1px; border-color:var(--cue-border,#2c2c2c); background:#090909; }
.public-artist-profile__links { display:grid; grid-template-columns:auto minmax(0,1fr); gap:28px; padding:44px clamp(18px,6vw,90px) 56px; border-bottom:1px solid var(--cue-border,#2c2c2c); }
.public-artist-profile__links>span { align-self:start; color:var(--cue-accent,#e8ff2f); }
.public-artist-profile__links nav { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:0; border-top:1px solid var(--cue-border,#333); }
.public-artist-profile__links a { display:flex; justify-content:space-between; align-items:center; gap:12px; min-height:58px; padding:0 14px; border-bottom:1px solid var(--cue-border,#333); color:var(--cue-text,#f2f0eb); text-decoration:none; font:800 11px/1 monospace; text-transform:uppercase; }
.public-artist-profile__links a:nth-child(odd) { border-right:1px solid var(--cue-border,#333); }
.public-artist-profile__links a:hover { border-color: var(--cue-accent, #e8ff2f); color: var(--cue-accent, #e8ff2f); }
.public-artist-profile__booking-band { display:grid; grid-template-columns:auto minmax(0,1fr) auto; align-items:end; gap:30px; padding:clamp(46px,7vw,86px) clamp(18px,6vw,90px); border-bottom:1px solid var(--cue-border,#2c2c2c); background:linear-gradient(110deg,color-mix(in srgb,var(--cue-accent,#e8ff2f) 8%,#080808),#080808 58%); }
.public-artist-profile__booking-band h2 { max-width:900px; margin:10px 0 7px; font-size:clamp(3rem,7vw,7rem); line-height:.82; letter-spacing:-.055em; text-transform:uppercase; }
.public-artist-profile__booking-band p { max-width:620px; margin:0; color:var(--cue-muted,#888); font-size:12px; line-height:1.5; }
.public-artist-profile__booking-band .public-artist-profile__booking-agent { margin-top:14px; color:var(--cue-accent,#e8ff2f); font-weight:700; }
.public-artist-profile__booking-band button { min-height:52px; padding:0 18px; border:1px solid var(--cue-accent,#e8ff2f); border-radius:8px; background:var(--cue-accent,#e8ff2f); color:#080808; cursor:pointer; font-weight:900; }
.public-artist-profile__booking-band button:disabled { border-color:var(--cue-border,#333); background:transparent; color:var(--cue-muted,#777); cursor:default; }
.public-artist-profile__form-preview { scroll-margin-top:24px; border-bottom:1px solid var(--cue-border,#2c2c2c); }
.public-artist-profile__form-preview :deep(.public-booking-form) { padding-inline:clamp(18px,6vw,90px); }
.public-artist-profile__booking-backdrop { position:fixed; z-index:80; inset:0; display:grid; place-items:center; padding:24px; background:rgba(0,0,0,.72); backdrop-filter:blur(8px); }
.public-artist-profile__booking-modal { width:min(760px,100%); max-height:min(860px,calc(100dvh - 48px)); overflow:hidden; border:1px solid var(--cue-border,#2c2c2c); border-radius:12px; background:var(--cue-bg,#080808); box-shadow:0 28px 90px rgba(0,0,0,.58); }
.public-artist-profile__booking-header { display:flex; align-items:center; justify-content:space-between; gap:16px; min-height:64px; padding:12px 16px; border-bottom:1px solid var(--cue-border,#2c2c2c); background:#0c0c0c; }
.public-artist-profile__booking-header>div { display:grid; gap:5px; }
.public-artist-profile__booking-header span { color:var(--cue-accent,#e8ff2f); font:800 8px/1 monospace; letter-spacing:.1em; }
.public-artist-profile__booking-header strong { font-size:16px; text-transform:uppercase; }
.public-artist-profile__booking-header button { width:38px; height:38px; padding:0; border:1px solid #343434; border-radius:8px; background:#111; color:#ddd; cursor:pointer; font-size:22px; line-height:1; }
.public-artist-profile__booking-body { max-height:calc(min(860px,100dvh - 48px) - 65px); overflow:auto; overscroll-behavior:contain; }
@media (max-width: 900px) {
  .public-artist-profile__story { grid-template-columns:auto 1fr; gap:20px; }
  .public-artist-profile__story dl { grid-column:2; }
  .public-artist-profile__sound { grid-template-columns:auto 1fr; }
  .public-artist-profile__sound>span { grid-column:2; }
  .public-artist-profile__sound>div { grid-column:2; }
  .public-artist-profile__sound p { grid-column:2; }
  .public-artist-profile__passport { grid-template-columns:auto 1fr; gap:18px; }
  .public-artist-profile__passport-head { grid-column:2; align-items:start; flex-direction:column; }
  .public-artist-profile__passport-head p { text-align:left; }
  .public-artist-profile__passport :deep(.profile-passport) { grid-column:1 / -1; }
  .public-artist-profile__links { grid-template-columns:auto 1fr; gap:18px; }
  .public-artist-profile__links nav { grid-column:1 / -1; }
  .public-artist-profile__booking-band { grid-template-columns:auto 1fr; align-items:start; gap:18px; }
  .public-artist-profile__booking-band>button { grid-column:2; justify-self:start; }

  .public-artist-profile__hero { min-height:78svh; }
  .public-artist-profile__identity {
    min-height:78svh;
    padding:24px 18px 76px;
  }
  .public-artist-profile__vertical { display:none; }
  .public-artist-profile__scroll-cue { left:18px;bottom:20px; }
  .public-artist-profile__hero-rail { top:16px; right:16px; }
  .public-artist-profile__hero-rail span:last-child { display:none; }
  .public-artist-profile__identity-top { margin-bottom:18px; }
  .public-artist-profile__avatar { width:72px; height:88px; }
  .public-artist-profile__identity h1 {
    max-width:100%;
    font-size:clamp(4rem,20vw,8rem);
    line-height:.74;
  }
  .public-artist-profile__hero-bottom { align-items:stretch; flex-direction:column; gap:18px; margin-top:22px; }
  .public-artist-profile__booking-cta { margin-top:0; }
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
  .public-artist-profile__identity { padding:22px 18px 76px; }
  .public-artist-profile__identity h1 {
    max-width:100%;
    font-size:clamp(3.35rem,18vw,5.7rem);
  }
  .public-artist-profile__genres { gap:5px; margin-top:14px; }
  .public-artist-profile__genres span { padding:6px 8px; font-size:8px; }
  .public-artist-profile__booking-cta { min-height:50px; margin-top:18px; }
  .public-artist-profile__story { padding:30px 18px 40px; gap:26px; }
  .public-artist-profile__passport { grid-template-columns:minmax(0,1fr); gap:16px; padding:34px 18px 0; }
  .public-artist-profile__passport .public-artist-profile__section-index { grid-column:1; }
  .public-artist-profile__passport-head { grid-column:1; margin-bottom:8px; }
  .public-artist-profile__story p { font-size:clamp(1.15rem,5.5vw,1.6rem); line-height:1.24; }
  .public-artist-profile__links { padding:28px 18px 36px; }
  .public-artist-profile__sound { grid-template-columns:1fr; gap:14px; padding:28px 18px; }
  .public-artist-profile__sound p { grid-column:1; }
  .public-artist-profile__cue>div:last-child { padding:24px 18px; }
  .public-artist-profile__booking-band { padding:28px 18px; }
  .public-artist-profile__booking-band button { width:100%; }
}
</style>

<style scoped>
/* Artist portfolio: poster cover, editorial spreads and a booking finale. */
.public-artist-profile { overflow:clip; background:#070707; }
.public-artist-profile__topbar { min-height:58px; padding-inline:clamp(18px,3.5vw,64px); border-color:rgba(255,255,255,.13); background:#080808; }
.public-artist-profile__topbar :deep(svg) { max-width:160px; }
.public-artist-profile__hero { min-height:min(920px,calc(100svh - 58px)); }
.public-artist-profile__cover-image { object-position:center; filter:saturate(.83) contrast(1.18) brightness(.83); }
.public-artist-profile__shade { background:linear-gradient(90deg,rgba(3,3,3,.56),transparent 70%),linear-gradient(0deg,#050505 0%,rgba(5,5,5,.68) 22%,rgba(5,5,5,.04) 69%,rgba(5,5,5,.42) 100%); }
.public-artist-profile__grid { opacity:.13; background-size:104px 104px; mask-image:linear-gradient(90deg,#000,transparent 58%); }
.public-artist-profile__hero-marker { position:absolute; z-index:4; top:clamp(34px,5vw,78px); left:clamp(24px,5vw,88px); display:flex; align-items:center; gap:10px; color:#fff; font:800 10px/1 monospace; letter-spacing:.12em; }
.public-artist-profile__hero-marker span { display:grid; place-items:center; width:36px; height:36px; border:1px solid var(--cue-accent,#e8ff2f); color:var(--cue-accent,#e8ff2f); font-size:14px; letter-spacing:-.07em; }
.public-artist-profile__hero-marker i { width:34px; height:1px; background:rgba(255,255,255,.55); }
.public-artist-profile__hero-rail { top:clamp(42px,5vw,82px); right:clamp(24px,5vw,88px); gap:9px; }
.public-artist-profile__vertical { right:clamp(20px,3vw,50px); font-size:8px; }
.public-artist-profile__identity { min-height:min(920px,calc(100svh - 58px)); justify-content:flex-end; padding:160px clamp(24px,5vw,88px) clamp(100px,9vw,145px); }
.public-artist-profile__identity-top { margin-bottom:clamp(26px,4vw,52px); }
.public-artist-profile__avatar { width:clamp(72px,7vw,112px); height:clamp(92px,9vw,144px); border-radius:0; transform:rotate(-3deg); box-shadow:15px 20px 50px rgba(0,0,0,.55); }
.public-artist-profile__location { gap:9px; }
.public-artist-profile__location span { font-size:10px; }
.public-artist-profile__location p { font-size:11px; }
.public-artist-profile__identity h1 { max-width:min(1400px,86vw); font-size:clamp(5rem,14vw,16rem); line-height:.75; letter-spacing:-.085em; text-wrap:balance; text-shadow:0 12px 70px rgba(0,0,0,.65); }
.public-artist-profile__hero-bottom { align-items:end; gap:24px; margin-top:clamp(36px,5vw,64px); }
.public-artist-profile__genres { display:flex; flex-wrap:wrap; max-width:70%; gap:16px 27px; }
.public-artist-profile__genres span { display:flex; gap:9px; align-items:baseline; padding:0; border:0; color:#f3f3f0; font:800 clamp(12px,1.2vw,17px)/1.2 Arial,sans-serif; letter-spacing:-.02em; }
.public-artist-profile__genres small { color:var(--cue-accent,#e8ff2f); font:700 9px/1 monospace; }
.public-artist-profile__booking-cta { position:relative; align-self:end; min-height:64px; margin:0; padding:0 26px; font-size:13px; text-transform:uppercase; letter-spacing:.04em; transition:transform .2s,box-shadow .2s; box-shadow:7px 7px 0 rgba(0,0,0,.58); }
.public-artist-profile__booking-cta:hover:not(:disabled) { transform:translate(-3px,-3px); box-shadow:10px 10px 0 rgba(0,0,0,.58); }
.public-artist-profile__scroll-cue { left:clamp(24px,5vw,88px); bottom:30px; }

.public-artist-profile__story { position:relative; grid-template-columns:minmax(60px,.14fr) minmax(0,1.36fr) minmax(220px,.5fr); gap:clamp(24px,4vw,86px); padding:clamp(95px,11vw,190px) clamp(24px,5vw,88px); background:radial-gradient(circle at 8% 85%,rgba(184,31,27,.10),transparent 26%),#0c0c0c; }
.public-artist-profile__section-index { color:rgba(255,255,255,.14); font-size:clamp(3rem,5vw,6rem); }
.public-artist-profile__story-copy { min-width:0; }
.public-artist-profile__story-copy>h2 { margin:0; color:var(--cue-accent,#e8ff2f); font:800 11px/1 monospace; letter-spacing:.18em; text-transform:uppercase; }
.public-artist-profile__story-copy>h2::before,.public-artist-profile__sound-head h2::before { content:"●"; margin-right:10px; color:#ee3731; font-size:8px; vertical-align:2px; }
.public-artist-profile__story p { max-width:980px; margin:clamp(24px,4vw,58px) 0 0; font-size:clamp(2rem,4.3vw,5.25rem); line-height:1.06; letter-spacing:-.055em; text-wrap:pretty; }
.public-artist-profile__story dl { border-top:2px solid var(--cue-accent,#e8ff2f); }
.public-artist-profile__story dl div { padding:22px 0; }
.public-artist-profile__story dd { font-size:clamp(12px,1.2vw,16px); }

.public-artist-profile__sound { position:relative; grid-template-columns:minmax(60px,.14fr) minmax(160px,.38fr) minmax(0,1.48fr); gap:clamp(24px,4vw,86px); align-items:start; padding:clamp(80px,10vw,160px) clamp(24px,5vw,88px); background:linear-gradient(125deg,#101010,#050505 65%); overflow:hidden; }
.public-artist-profile__sound::before { content:"SOUND"; position:absolute; bottom:-.25em; left:-.06em; color:rgba(255,255,255,.025); font:900 clamp(150px,28vw,480px)/1 Arial,sans-serif; letter-spacing:-.1em; pointer-events:none; }
.public-artist-profile__sound-head { grid-column:2; display:grid; align-content:start; gap:28px; min-width:0; }
.public-artist-profile__sound-head h2 { margin:0; color:var(--cue-accent,#e8ff2f); font:800 11px/1.3 monospace; letter-spacing:.12em; }
.public-artist-profile__sound .public-artist-profile__sound-head p { grid-column:auto; max-width:210px; margin:0; color:#a7a7a3; font-size:clamp(16px,1.6vw,22px); line-height:1.25; font-weight:500; text-transform:none; }
.public-artist-profile__sound-list { grid-column:3; display:grid; gap:0; min-width:0; }
.public-artist-profile__sound-list>div { display:grid; grid-template-columns:54px minmax(0,1fr); align-items:baseline; gap:12px; padding:12px 0 17px; border-bottom:1px solid rgba(255,255,255,.24); }
.public-artist-profile__sound-list small { color:var(--cue-accent,#e8ff2f); font:800 10px/1 monospace; }
.public-artist-profile__sound-list strong { padding:0; border:0; border-radius:0; background:none; color:#f4f2ef; font:900 clamp(2.8rem,7vw,8rem)/.85 Arial,sans-serif; letter-spacing:-.075em; text-transform:uppercase; overflow-wrap:anywhere; }
.public-artist-profile__sound>p { grid-column:3; margin:10px 0 0; color:#aaa; font:800 11px/1.4 monospace; letter-spacing:.12em; }

.public-artist-profile__cue { grid-template-columns:minmax(0,1fr) minmax(0,1fr); min-height:500px; background:#090909; }
.public-artist-profile__cue>div:first-child { position:relative; overflow:hidden; background:radial-gradient(circle at 50% 40%,color-mix(in srgb,var(--cue-accent,#e8ff2f) 17%,transparent),transparent 34%),repeating-linear-gradient(90deg,transparent 0 46px,#242424 47px 48px),#090909; }
.public-artist-profile__cue>div:first-child span,.public-artist-profile__cue>div:first-child strong { font-size:clamp(7rem,15vw,18rem); letter-spacing:-.13em; }
.public-artist-profile__cue>div:last-child { padding:clamp(50px,7vw,120px); }
.public-artist-profile__cue h2 { font-size:clamp(2.8rem,5.5vw,6rem); line-height:.88; letter-spacing:-.065em; }
.public-artist-profile__cue p { margin-top:20px; font-size:15px; }

.public-artist-profile__passport { grid-template-columns:minmax(60px,.14fr) minmax(0,1.86fr); gap:clamp(24px,4vw,86px); padding:clamp(80px,9vw,140px) clamp(24px,5vw,88px) 0; background:#111; }
.public-artist-profile__passport-head { align-items:start; margin:0 0 28px; }
.public-artist-profile__passport-head>h2 { max-width:320px; margin:0; color:var(--cue-accent,#e8ff2f); font:800 clamp(1.4rem,2.5vw,2.8rem)/1 monospace; letter-spacing:-.05em; }
.public-artist-profile__passport-head p { max-width:300px; color:#aaa; font-size:12px; }
.public-artist-profile__passport :deep(.profile-passport) { border-top:1px solid rgba(255,255,255,.25); background:#111; }
.public-artist-profile__passport :deep(.profile-passport__copy) { padding:clamp(28px,4vw,65px); background:#111; }
.public-artist-profile__passport :deep(.profile-passport__copy h2) { max-width:540px; font-size:clamp(2.3rem,4vw,5rem); line-height:.9; }
.public-artist-profile__passport :deep(.profile-passport__visual) { background:radial-gradient(circle at 60% 50%,color-mix(in srgb,var(--cue-accent,#e8ff2f) 9%,transparent),transparent 55%),#090909; }

.public-artist-profile__links { grid-template-columns:minmax(60px,.14fr) minmax(160px,.38fr) minmax(0,1.48fr); gap:clamp(24px,4vw,86px); align-items:start; padding:clamp(90px,11vw,170px) clamp(24px,5vw,88px); background:#0a0a0a; }
.public-artist-profile__links-head { grid-column:2; display:grid; gap:28px; }
.public-artist-profile__links-head>h2 { margin:0; color:var(--cue-accent,#e8ff2f); font:800 11px/1.3 monospace; text-transform:uppercase; letter-spacing:.12em; }
.public-artist-profile__links-head p { margin:0; font-size:clamp(1.7rem,2.4vw,3rem); line-height:1.05; letter-spacing:-.05em; }
.public-artist-profile__links nav { grid-column:3; grid-template-columns:1fr; }
.public-artist-profile__links a { min-height:78px; gap:18px; padding:8px 0; border-right:0 !important; transition:padding .2s,color .2s; }
.public-artist-profile__links a:hover { padding-left:12px; }
.public-artist-profile__links a small { width:35px; color:var(--cue-accent,#e8ff2f); font:800 10px/1 monospace; }
.public-artist-profile__links a strong { flex:1; font-size:clamp(1.7rem,3vw,3.8rem); line-height:1; letter-spacing:-.055em; }
.public-artist-profile__links .arrow { margin-right:12px; }

.public-artist-profile__booking-band { position:relative; grid-template-columns:minmax(60px,.14fr) minmax(0,1.5fr) minmax(180px,.36fr); gap:clamp(24px,4vw,86px); align-items:end; min-height:530px; padding:clamp(90px,11vw,170px) clamp(24px,5vw,88px); background:radial-gradient(circle at 88% 12%,color-mix(in srgb,var(--cue-accent,#e8ff2f) 14%,transparent),transparent 33%),linear-gradient(125deg,#151515,#070707 62%); }
.public-artist-profile__booking-band::before { content:""; position:absolute; top:0; left:clamp(24px,5vw,88px); right:clamp(24px,5vw,88px); height:1px; background:linear-gradient(90deg,#ef3935,var(--cue-accent,#e8ff2f) 30%,transparent); }
.public-artist-profile__booking-band h2 { max-width:1000px; margin:18px 0 26px; font-size:clamp(4.5rem,9vw,11rem); line-height:.82; letter-spacing:-.075em; }
.public-artist-profile__booking-band p { max-width:530px; color:#c7c7c2; font-size:clamp(15px,1.25vw,19px); }
.public-artist-profile__booking-band>button { min-height:64px; padding:0 24px; border-radius:0; justify-self:end; font-size:13px; text-transform:uppercase; }
.public-artist-profile__form-preview { background:#101010; }
.public-artist-profile__form-preview :deep(.public-booking-form) { max-width:1440px; margin-inline:auto; border:0; padding-block:clamp(60px,8vw,120px); }

@media(max-width:1000px) {
  .public-artist-profile__story { grid-template-columns:70px minmax(0,1fr); }
  .public-artist-profile__story dl { grid-column:2; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:18px; }
  .public-artist-profile__sound { grid-template-columns:70px minmax(0,1fr); }
  .public-artist-profile__sound-head { grid-column:2; }
  .public-artist-profile__sound-list,.public-artist-profile__sound>p { grid-column:2; }
  .public-artist-profile__passport { grid-template-columns:70px minmax(0,1fr); }
  .public-artist-profile__links { grid-template-columns:70px minmax(0,1fr); }
  .public-artist-profile__links-head,.public-artist-profile__links nav { grid-column:2; }
  .public-artist-profile__links-head { gap:10px; }
  .public-artist-profile__booking-band { grid-template-columns:70px minmax(0,1fr); min-height:440px; }
  .public-artist-profile__booking-band>button { grid-column:2; justify-self:start; }
}
@media(max-width:600px) {
  .public-artist-profile__topbar { min-height:54px; }
  .public-artist-profile__hero,.public-artist-profile__identity { min-height:calc(100svh - 54px); }
  .public-artist-profile__hero-marker { top:23px; left:18px; }
  .public-artist-profile__hero-rail { top:31px; right:18px; }
  .public-artist-profile__hero-rail span:first-child { max-width:140px; text-align:right; overflow-wrap:anywhere; }
  .public-artist-profile__identity { padding:130px 18px 72px; }
  .public-artist-profile__identity-top { gap:13px; margin-bottom:30px; }
  .public-artist-profile__identity h1 { max-width:100%; font-size:clamp(3.7rem,19vw,7rem); line-height:.8; }
  .public-artist-profile__hero-bottom { flex-direction:column; align-items:stretch; gap:24px; margin-top:30px; }
  .public-artist-profile__genres { max-width:100%; gap:9px 18px; }
  .public-artist-profile__genres span { font-size:12px; }
  .public-artist-profile__booking-cta { align-self:stretch; justify-content:space-between; min-height:58px; }
  .public-artist-profile__scroll-cue { left:18px; bottom:20px; }
  .public-artist-profile__story,.public-artist-profile__sound,.public-artist-profile__links { grid-template-columns:minmax(0,1fr); gap:24px; padding:80px 18px; }
  .public-artist-profile__story p { margin-top:20px; font-size:clamp(2rem,8vw,3.4rem); }
  .public-artist-profile__story dl { grid-column:1; grid-template-columns:1fr; gap:0; }
  .public-artist-profile__sound-head,.public-artist-profile__sound-list,.public-artist-profile__sound>p { grid-column:1; }
  .public-artist-profile__sound-list>div { grid-template-columns:38px minmax(0,1fr); }
  .public-artist-profile__sound-list strong { font-size:clamp(2.6rem,13vw,5rem); }
  .public-artist-profile__cue { grid-template-columns:1fr; min-height:0; }
  .public-artist-profile__cue>div:first-child { min-height:300px; }
  .public-artist-profile__cue>div:last-child { padding:60px 18px 80px; }
  .public-artist-profile__passport { grid-template-columns:minmax(0,1fr); gap:18px; padding:80px 18px 0; }
  .public-artist-profile__passport-head { grid-column:1; flex-direction:column; gap:14px; }
  .public-artist-profile__passport-head p { text-align:left; }
  .public-artist-profile__passport :deep(.profile-passport) { grid-column:1; }
  .public-artist-profile__passport :deep(.profile-passport__copy) { padding:28px 18px; }
  .public-artist-profile__links-head,.public-artist-profile__links nav { grid-column:1; }
  .public-artist-profile__links a { min-height:64px; }
  .public-artist-profile__links a strong { font-size:clamp(1.7rem,8vw,2.5rem); }
  .public-artist-profile__booking-band { grid-template-columns:minmax(0,1fr); gap:24px; min-height:0; padding:100px 18px 110px; }
  .public-artist-profile__booking-band h2 { font-size:clamp(4rem,16vw,7rem); overflow-wrap:anywhere; }
  .public-artist-profile__booking-band>button { grid-column:1; width:100%; justify-self:stretch; }
}
@media(prefers-reduced-motion:reduce) {
  .public-artist-profile__booking-cta,.public-artist-profile__links a { transition:none; }
}
</style>
