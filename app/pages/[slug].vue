<script setup lang="ts">
import type { PublicArtistProfile, PublicBookingRequestInput } from '../domain/publicArtistProfile'
import { isReservedArtistSlug, normalizePublicEntrySource } from '../domain/publicArtistProfile'
import { getPublicArtistProfile, submitPublicBookingRequest } from '../services/publicBookingIngressApi'

type BookingFormSubmission = Omit<PublicBookingRequestInput, 'artistSlug' | 'requestId' | 'entrySource' | 'locale'>

const route = useRoute()
const config = useRuntimeConfig()
const preferences = useCuePreferences()

const slug = computed(() => String(route.params.slug || '').trim().toLowerCase())
const profile = ref<PublicArtistProfile | null>(null)
const loading = ref(true)
const loadError = ref<'not_found' | 'failed' | ''>('')
const bookingSubmitting = ref(false)
const bookingSent = ref(false)
const bookingConfirmationSent = ref<boolean | null>(null)
const bookingError = ref('')
const requestId = ref('')

const entrySource = computed(() => normalizePublicEntrySource(route.query.src))
const bookingFocused = computed(() => route.query.booking === '1')
const locale = computed<'es' | 'en'>(() => preferences.locale.value === 'en' ? 'en' : 'es')

const copy = computed(() => locale.value === 'es' ? {
  loading: 'Cargando perfil…',
  notFound: 'Este perfil no está disponible.',
  failed: 'No se pudo cargar el perfil.',
  back: 'Volver a Cuebooker'
} : {
  loading: 'Loading profile…',
  notFound: 'This profile is not available.',
  failed: 'The profile could not be loaded.',
  back: 'Back to Cuebooker'
})

async function loadProfile() {
  loading.value = true
  loadError.value = ''
  try {
    if (!slug.value || isReservedArtistSlug(slug.value)) {
      loadError.value = 'not_found'
      return
    }
    profile.value = await getPublicArtistProfile(String(config.public.supabaseUrl || ''), slug.value)
  } catch (error) {
    const status = (error as Error & { status?: number })?.status
    loadError.value = status === 404 ? 'not_found' : 'failed'
  } finally {
    loading.value = false
  }
}

async function submitBooking(payload: BookingFormSubmission) {
  if (!profile.value || bookingSubmitting.value) return
  bookingSubmitting.value = true
  bookingError.value = ''
  bookingConfirmationSent.value = null
  if (!requestId.value) requestId.value = crypto.randomUUID()

  try {
    const result = await submitPublicBookingRequest(String(config.public.supabaseUrl || ''), {
      ...payload,
      artistSlug: profile.value.slug,
      requestId: requestId.value,
      entrySource: entrySource.value,
      locale: locale.value
    })
    bookingSent.value = true
    bookingConfirmationSent.value = result.confirmationSent ?? false
  } catch (error) {
    bookingError.value = (error as Error)?.message || 'booking_request_failed'
  } finally {
    bookingSubmitting.value = false
  }
}

onMounted(loadProfile)
watch(slug, () => {
  profile.value = null
  bookingSent.value = false
  bookingConfirmationSent.value = null
  requestId.value = ''
  loadProfile()
})

useHead(() => {
  const artist = profile.value
  const title = artist ? `${artist.stageName} · Booking | Cuebooker` : 'Artist · Cuebooker'
  const description = artist?.bio?.trim().slice(0, 180) || (locale.value === 'es'
    ? 'Perfil profesional y solicitudes de booking en Cuebooker.'
    : 'Professional artist profile and booking enquiries on Cuebooker.')
  const canonical = `https://cuebooker.com/${encodeURIComponent(slug.value)}`
  return {
    htmlAttrs: { lang: locale.value },
    title,
    meta: [
      { name: 'description', content: description },
      { property: 'og:type', content: 'profile' },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: canonical },
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description }
    ],
    link: [{ rel: 'canonical', href: canonical }]
  }
})
</script>

<template>
  <PublicArtistProfile
    v-if="profile"
    :profile="profile"
    :locale="locale"
    :booking-focused="bookingFocused"
    :booking-submitting="bookingSubmitting"
    :booking-sent="bookingSent"
    :booking-confirmation-sent="bookingConfirmationSent"
    :booking-error="bookingError"
    @submit-booking="submitBooking"
  />

  <main v-else class="public-profile-state">
    <CueBrand />
    <p v-if="loading">{{ copy.loading }}</p>
    <template v-else>
      <h1>{{ loadError === 'not_found' ? copy.notFound : copy.failed }}</h1>
      <NuxtLink to="/">{{ copy.back }}</NuxtLink>
    </template>
  </main>
</template>

<style scoped>
.public-profile-state { display: grid; align-content: center; justify-items: start; min-height: 100vh; box-sizing: border-box; padding: clamp(26px, 8vw, 100px); background: var(--cue-bg, #080808); color: var(--cue-text, #f2f0eb); font-family: Arial, Helvetica, sans-serif; }
.public-profile-state p { margin-top: 30px; color: var(--cue-muted, #999); }
.public-profile-state h1 { max-width: 760px; margin: 38px 0 24px; font-size: clamp(2.6rem, 7vw, 7rem); line-height: .9; text-transform: uppercase; }
.public-profile-state a { color: var(--cue-accent, #e8ff2f); font-weight: 800; }
</style>
