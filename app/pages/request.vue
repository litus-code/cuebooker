<script setup lang="ts">
import type { PublicBookingFollowUp, PublicBookingFollowUpStatus } from '../domain/publicBookingFollowUp'
import { getPublicBookingFollowUp, replyPublicBookingFollowUp } from '../services/publicBookingFollowUpApi'

const route = useRoute()
const config = useRuntimeConfig()
const preferences = useCuePreferences()

const followUp = ref<PublicBookingFollowUp | null>(null)
const loading = ref(true)
const loadError = ref<'unavailable' | 'failed' | ''>('')
const reply = ref('')
const replySending = ref(false)
const replyError = ref('')
const replyRequestId = ref('')

const token = computed(() => typeof route.query.token === 'string' ? route.query.token.trim() : '')
const locale = computed<'es' | 'en'>(() => preferences.locale.value === 'en' ? 'en' : 'es')
const artistUrl = computed(() => followUp.value?.artist.slug ? `/${followUp.value.artist.slug}` : '/')

const copy = computed(() => locale.value === 'es' ? {
  eyebrow: 'SEGUIMIENTO / BOOKING',
  loading: 'Cargando tu solicitud…',
  unavailableTitle: 'Este enlace ya no está disponible.',
  unavailableBody: 'Puede haber caducado o haber sido sustituido por un enlace más reciente. Si tienes un email de Cuebooker más nuevo, utiliza ese enlace.',
  failedTitle: 'No hemos podido cargar la solicitud.',
  failedBody: 'Tu booking no se modifica por este error. Vuelve a intentarlo desde el mismo enlace.',
  backHome: 'Volver a Cuebooker',
  backArtist: 'Ver perfil del artista',
  hello: 'Tu booking, sin perder el hilo.',
  intro: 'Consulta el estado y continúa la conversación con el equipo del artista. No necesitas una cuenta de Cuebooker.',
  status: 'Estado', summary: 'Resumen', conversation: 'Conversación',
  event: 'Evento', date: 'Fecha', venue: 'Sala / venue', location: 'Ubicación', offer: 'Oferta',
  noDetail: 'Por definir',
  reply: 'Responder', placeholder: 'Escribe tu respuesta…', send: 'Enviar respuesta', sending: 'Enviando…',
  replyError: 'No se pudo enviar la respuesta. El texto se mantiene para que puedas intentarlo de nuevo.',
  archived: 'Este booking está archivado internamente, pero tu conversación sigue conservada.',
  channelBooking: 'Formulario', channelEmail: 'Email', channelSecure: 'Enlace seguro', channelMessage: 'Mensaje',
  you: 'Tú', team: 'Equipo del artista'
} : {
  eyebrow: 'FOLLOW-UP / BOOKING',
  loading: 'Loading your enquiry…',
  unavailableTitle: 'This link is no longer available.',
  unavailableBody: 'It may have expired or been replaced by a newer link. If you have a more recent Cuebooker email, use the link in that message.',
  failedTitle: 'We could not load the enquiry.',
  failedBody: 'Your booking is not changed by this error. Try again from the same link.',
  backHome: 'Back to Cuebooker',
  backArtist: 'View artist profile',
  hello: 'Your booking, without losing the thread.',
  intro: 'Check the status and continue the conversation with the artist team. No Cuebooker account is required.',
  status: 'Status', summary: 'Summary', conversation: 'Conversation',
  event: 'Event', date: 'Date', venue: 'Venue', location: 'Location', offer: 'Offer',
  noDetail: 'To be agreed',
  reply: 'Reply', placeholder: 'Write your reply…', send: 'Send reply', sending: 'Sending…',
  replyError: 'The reply could not be sent. Your text is kept so you can try again.',
  archived: 'This booking is archived internally, but your conversation remains preserved.',
  channelBooking: 'Booking form', channelEmail: 'Email', channelSecure: 'Secure link', channelMessage: 'Message',
  you: 'You', team: 'Artist team'
})

const statusCopy = computed<Record<PublicBookingFollowUpStatus, { label: string; body: string }>>(() => locale.value === 'es' ? {
  new: { label: 'Solicitud recibida', body: 'El equipo ya tiene tu propuesta.' },
  in_conversation: { label: 'En conversación', body: 'La propuesta está activa y se están cerrando detalles.' },
  waiting_response: { label: 'Esperando respuesta', body: 'Hay una respuesta pendiente dentro de la conversación.' },
  confirmed: { label: 'Fecha confirmada', body: 'El booking está confirmado.' },
  rejected: { label: 'No seguirá adelante', body: 'La propuesta se ha cerrado sin confirmación.' },
  cancelled: { label: 'Cancelado', body: 'El booking se ha cancelado.' }
} : {
  new: { label: 'Enquiry received', body: 'The team has your proposal.' },
  in_conversation: { label: 'In conversation', body: 'The proposal is active and details are being discussed.' },
  waiting_response: { label: 'Waiting for reply', body: 'A response is pending in the conversation.' },
  confirmed: { label: 'Date confirmed', body: 'The booking is confirmed.' },
  rejected: { label: 'Not moving forward', body: 'The proposal was closed without confirmation.' },
  cancelled: { label: 'Cancelled', body: 'The booking has been cancelled.' }
})

const currentStatus = computed(() => {
  const status = followUp.value?.booking.status || 'new'
  return statusCopy.value[status]
})

function formatDate(value?: string | null) {
  if (!value) return copy.value.noDetail
  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit', month: 'long', year: 'numeric'
  }).format(date)
}

function formatOccurredAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(date)
}

function formatOffer(amount?: number | null, currency?: string | null) {
  if (amount === null || amount === undefined || !currency) return copy.value.noDetail
  try {
    return new Intl.NumberFormat(locale.value === 'es' ? 'es-ES' : 'en-GB', {
      style: 'currency', currency
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`
  }
}

function channelLabel(channel: string) {
  if (channel === 'booking_form') return copy.value.channelBooking
  if (channel === 'email') return copy.value.channelEmail
  if (channel === 'secure_link') return copy.value.channelSecure
  return copy.value.channelMessage
}

async function loadFollowUp() {
  loading.value = true
  loadError.value = ''
  followUp.value = null
  if (!token.value) {
    loadError.value = 'unavailable'
    loading.value = false
    return
  }

  try {
    followUp.value = await getPublicBookingFollowUp(String(config.public.supabaseUrl || ''), token.value)
  } catch (error) {
    const status = (error as Error & { status?: number }).status
    loadError.value = status === 404 ? 'unavailable' : 'failed'
  } finally {
    loading.value = false
  }
}

async function sendReply() {
  const bodyText = reply.value.trim()
  if (!followUp.value || !token.value || !bodyText || replySending.value) return
  replySending.value = true
  replyError.value = ''
  if (!replyRequestId.value) replyRequestId.value = crypto.randomUUID()

  try {
    const result = await replyPublicBookingFollowUp(String(config.public.supabaseUrl || ''), {
      token: token.value,
      requestId: replyRequestId.value,
      bodyText
    })
    followUp.value = result.followUp
    reply.value = ''
    replyRequestId.value = ''
  } catch {
    replyError.value = copy.value.replyError
  } finally {
    replySending.value = false
  }
}

onMounted(loadFollowUp)
watch(token, () => {
  reply.value = ''
  replyRequestId.value = ''
  loadFollowUp()
})

useHead(() => ({
  title: followUp.value
    ? `${followUp.value.artist.stageName} · ${locale.value === 'es' ? 'Seguimiento de booking' : 'Booking follow-up'} | Cuebooker`
    : locale.value === 'es' ? 'Seguimiento de booking | Cuebooker' : 'Booking follow-up | Cuebooker',
  htmlAttrs: { lang: locale.value },
  meta: [
    { name: 'robots', content: 'noindex,nofollow,noarchive' },
    { name: 'referrer', content: 'no-referrer' }
  ]
}))
</script>

<template>
  <main class="follow-up-page">
    <header class="follow-up-header">
      <NuxtLink to="/" aria-label="Cuebooker"><CueBrand /></NuxtLink>
      <p>{{ copy.eyebrow }}</p>
      <div class="follow-up-locale" aria-label="Language">
        <button :class="{ active: locale === 'es' }" type="button" @click="preferences.setLocale('es')">ES</button>
        <button :class="{ active: locale === 'en' }" type="button" @click="preferences.setLocale('en')">EN</button>
      </div>
    </header>

    <section v-if="loading" class="follow-up-state">
      <p>{{ copy.loading }}</p>
    </section>

    <section v-else-if="!followUp" class="follow-up-state follow-up-state--error">
      <p class="eyebrow">{{ copy.eyebrow }}</p>
      <h1>{{ loadError === 'unavailable' ? copy.unavailableTitle : copy.failedTitle }}</h1>
      <p>{{ loadError === 'unavailable' ? copy.unavailableBody : copy.failedBody }}</p>
      <NuxtLink class="follow-up-primary-link" to="/">{{ copy.backHome }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink>
    </section>

    <template v-else>
      <section class="follow-up-hero">
        <div>
          <p class="eyebrow">{{ followUp.artist.stageName }} / {{ currentStatus.label }}</p>
          <h1>{{ copy.hello }}</h1>
          <p>{{ copy.intro }}</p>
        </div>
        <article class="follow-up-status" :data-status="followUp.booking.status">
          <span>{{ copy.status }}</span>
          <strong>{{ currentStatus.label }}</strong>
          <p>{{ currentStatus.body }}</p>
        </article>
      </section>

      <p v-if="followUp.booking.archived" class="follow-up-archive-note">{{ copy.archived }}</p>

      <section class="follow-up-grid">
        <article class="follow-up-summary">
          <header><p class="eyebrow">{{ copy.summary }}</p></header>
          <dl>
            <div>
              <dt>{{ copy.event }}</dt>
              <dd>{{ followUp.booking.eventName || copy.noDetail }}</dd>
            </div>
            <div>
              <dt>{{ copy.date }}</dt>
              <dd>{{ formatDate(followUp.booking.eventDate) }}</dd>
            </div>
            <div>
              <dt>{{ copy.venue }}</dt>
              <dd>{{ followUp.booking.venueName || copy.noDetail }}</dd>
            </div>
            <div>
              <dt>{{ copy.location }}</dt>
              <dd>{{ [followUp.booking.city, followUp.booking.countryCode].filter(Boolean).join(' · ') || copy.noDetail }}</dd>
            </div>
            <div>
              <dt>{{ copy.offer }}</dt>
              <dd>{{ formatOffer(followUp.booking.offerAmountMinor, followUp.booking.currency) }}</dd>
            </div>
          </dl>
          <NuxtLink class="follow-up-secondary-link" :to="artistUrl">
            {{ copy.backArtist }} <span class="arrow arrow--ne" aria-hidden="true" />
          </NuxtLink>
        </article>

        <article class="follow-up-thread">
          <header><p class="eyebrow">{{ copy.conversation }}</p></header>
          <div class="follow-up-messages" aria-live="polite">
            <article
              v-for="message in followUp.messages"
              :key="message.id"
              class="follow-up-message"
              :class="`follow-up-message--${message.direction}`"
            >
              <header>
                <div>
                  <strong>{{ message.direction === 'outbound' ? copy.team : copy.you }}</strong>
                  <span>{{ channelLabel(message.channel) }}</span>
                </div>
                <time :datetime="message.occurredAt">{{ formatOccurredAt(message.occurredAt) }}</time>
              </header>
              <p>{{ message.body }}</p>
            </article>
          </div>

          <form class="follow-up-reply" @submit.prevent="sendReply">
            <label>
              <span>{{ copy.reply }}</span>
              <textarea v-model="reply" rows="5" maxlength="10000" :placeholder="copy.placeholder" />
            </label>
            <p v-if="replyError" class="follow-up-reply__error" role="alert">{{ replyError }}</p>
            <button type="submit" :disabled="replySending || !reply.trim()">
              {{ replySending ? copy.sending : copy.send }}
              <span class="arrow arrow--ne" aria-hidden="true" />
            </button>
          </form>
        </article>
      </section>
    </template>
  </main>
</template>

<style scoped>
:global(body) { margin: 0; background: var(--cue-bg, #080808); }
.follow-up-page { min-height: 100vh; background: var(--cue-bg, #080808); color: var(--cue-text, #f2f0eb); font-family: Arial, Helvetica, sans-serif; }
.follow-up-header { position: sticky; top: 0; z-index: 20; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 64px; padding: 0 clamp(18px, 4vw, 48px); border-bottom: 1px solid var(--cue-border, #2c2c2c); background: color-mix(in srgb, var(--cue-bg, #080808) 92%, transparent); backdrop-filter: blur(16px); }
.follow-up-header > a { justify-self: start; color: inherit; text-decoration: none; }
.follow-up-header > p { margin: 0; color: var(--cue-muted, #888); font: 700 9px/1.2 monospace; letter-spacing: .11em; }
.follow-up-locale { justify-self: end; display: flex; gap: 3px; padding: 3px; border: 1px solid var(--cue-border, #303030); border-radius: 999px; }
.follow-up-locale button { min-width: 34px; min-height: 30px; border: 0; border-radius: 999px; background: transparent; color: var(--cue-muted, #888); cursor: pointer; font: 800 9px/1 monospace; }
.follow-up-locale button.active { background: var(--cue-accent, #e8ff2f); color: #080808; }
.eyebrow { margin: 0; color: var(--cue-accent, #e8ff2f); font: 800 10px/1.2 monospace; letter-spacing: .11em; text-transform: uppercase; }
.follow-up-state { display: grid; align-content: center; min-height: calc(100vh - 65px); box-sizing: border-box; padding: clamp(28px, 8vw, 110px); }
.follow-up-state--error { max-width: 1000px; }
.follow-up-state--error h1 { max-width: 900px; margin: 22px 0; font-size: clamp(3rem, 8vw, 8rem); line-height: .86; letter-spacing: -.055em; text-transform: uppercase; }
.follow-up-state--error > p:not(.eyebrow) { max-width: 650px; margin: 0; color: var(--cue-muted, #999); font-size: 16px; line-height: 1.55; }
.follow-up-hero { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(280px, .6fr); gap: clamp(32px, 8vw, 130px); align-items: end; padding: clamp(50px, 9vw, 130px) clamp(18px, 6vw, 90px); border-bottom: 1px solid var(--cue-border, #2c2c2c); }
.follow-up-hero h1 { max-width: 1000px; margin: 16px 0 24px; font-size: clamp(3.8rem, 9vw, 9.4rem); line-height: .78; letter-spacing: -.065em; text-transform: uppercase; }
.follow-up-hero > div > p:last-child { max-width: 660px; margin: 0; color: var(--cue-muted, #999); font-size: 16px; line-height: 1.55; }
.follow-up-status { padding: 20px 0 4px; border-top: 2px solid var(--cue-accent, #e8ff2f); }
.follow-up-status > span { display: block; color: var(--cue-muted, #888); font: 700 9px/1.2 monospace; letter-spacing: .1em; text-transform: uppercase; }
.follow-up-status strong { display: block; margin-top: 12px; font-size: clamp(1.5rem, 3vw, 2.5rem); line-height: 1; }
.follow-up-status p { margin: 10px 0 0; color: var(--cue-muted, #999); line-height: 1.45; }
.follow-up-status[data-status='confirmed'] { border-top-color: #77e59a; }
.follow-up-status[data-status='rejected'], .follow-up-status[data-status='cancelled'] { border-top-color: #ff8080; }
.follow-up-archive-note { margin: 0; padding: 14px clamp(18px, 6vw, 90px); border-bottom: 1px solid var(--cue-border, #2c2c2c); color: var(--cue-muted, #999); font-size: 12px; }
.follow-up-grid { display: grid; grid-template-columns: minmax(280px, .36fr) minmax(0, .64fr); min-height: 600px; }
.follow-up-summary { padding: clamp(30px, 5vw, 66px) clamp(18px, 4vw, 54px); border-right: 1px solid var(--cue-border, #2c2c2c); }
.follow-up-summary dl { display: grid; gap: 22px; margin: 32px 0 0; }
.follow-up-summary dl div { padding-top: 11px; border-top: 1px solid var(--cue-border, #303030); }
.follow-up-summary dt { color: var(--cue-muted, #888); font: 700 9px/1.2 monospace; letter-spacing: .09em; text-transform: uppercase; }
.follow-up-summary dd { margin: 7px 0 0; font-size: 14px; line-height: 1.4; }
.follow-up-thread { padding: clamp(30px, 5vw, 66px) clamp(18px, 5vw, 70px); }
.follow-up-messages { display: grid; gap: 12px; margin-top: 30px; }
.follow-up-message { width: min(82%, 720px); box-sizing: border-box; padding: 18px; border: 1px solid var(--cue-border, #303030); background: var(--cue-surface, #101010); }
.follow-up-message--outbound { justify-self: start; border-left: 3px solid var(--cue-accent, #e8ff2f); }
.follow-up-message--inbound { justify-self: end; background: color-mix(in srgb, var(--cue-accent, #e8ff2f) 6%, var(--cue-surface, #101010)); }
.follow-up-message > header { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
.follow-up-message > header > div { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
.follow-up-message strong { font-size: 12px; }
.follow-up-message header span, .follow-up-message time { color: var(--cue-muted, #777); font: 700 9px/1.2 monospace; text-transform: uppercase; }
.follow-up-message > p { margin: 14px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: 14px; line-height: 1.55; }
.follow-up-reply { display: grid; gap: 12px; margin-top: 28px; padding-top: 26px; border-top: 1px solid var(--cue-border, #303030); }
.follow-up-reply label { display: grid; gap: 9px; }
.follow-up-reply label > span { color: var(--cue-muted, #888); font: 700 9px/1.2 monospace; letter-spacing: .09em; text-transform: uppercase; }
.follow-up-reply textarea { width: 100%; min-height: 130px; box-sizing: border-box; padding: 14px; border: 1px solid var(--cue-border, #353535); border-radius: 0; outline: 0; resize: vertical; background: var(--cue-bg, #090909); color: var(--cue-text, #f2f0eb); font: inherit; line-height: 1.5; }
.follow-up-reply textarea:focus-visible, .follow-up-reply button:focus-visible, .follow-up-locale button:focus-visible, .follow-up-primary-link:focus-visible, .follow-up-secondary-link:focus-visible { outline: 2px solid var(--cue-accent, #e8ff2f); outline-offset: 3px; }
.follow-up-reply button, .follow-up-primary-link { display: inline-flex; justify-self: start; align-items: center; gap: 9px; min-height: 50px; padding: 0 18px; border: 0; background: var(--cue-accent, #e8ff2f); color: #080808; cursor: pointer; text-decoration: none; font-weight: 900; }
.follow-up-reply button:disabled { cursor: wait; opacity: .55; }
.follow-up-reply__error { margin: 0; color: #ff9d9d; font-size: 12px; line-height: 1.45; }
.follow-up-secondary-link { display: inline-flex; align-items: center; gap: 8px; margin-top: 34px; color: var(--cue-text, #f2f0eb); text-decoration: none; font-size: 12px; font-weight: 800; }
.follow-up-secondary-link:hover { color: var(--cue-accent, #e8ff2f); }
.follow-up-primary-link { margin-top: 28px; }
@media (max-width: 900px) {
  .follow-up-hero, .follow-up-grid { grid-template-columns: 1fr; }
  .follow-up-summary { border-right: 0; border-bottom: 1px solid var(--cue-border, #2c2c2c); }
  .follow-up-status { max-width: 520px; }
}
@media (max-width: 620px) {
  .follow-up-header { grid-template-columns: 1fr auto; min-height: 58px; padding-inline: 14px; }
  .follow-up-header > p { display: none; }
  .follow-up-hero { padding: 40px 18px 44px; gap: 32px; }
  .follow-up-hero h1 { font-size: clamp(3.4rem, 18vw, 6rem); }
  .follow-up-summary, .follow-up-thread { padding: 34px 18px 46px; }
  .follow-up-message { width: 94%; }
  .follow-up-message > header { display: grid; gap: 7px; }
}
</style>
