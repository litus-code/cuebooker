<script setup lang="ts">
import type { PublicBookingRequestInput } from '../domain/publicArtistProfile'

type BookingFormSubmission = Omit<PublicBookingRequestInput, 'artistSlug' | 'requestId' | 'entrySource'>

const props = withDefaults(defineProps<{
  artistName: string
  locale?: 'es' | 'en'
  submitting?: boolean
  sent?: boolean
  error?: string
  preview?: boolean
}>(), {
  locale: 'es',
  submitting: false,
  sent: false,
  error: '',
  preview: false
})

const emit = defineEmits<{
  submit: [payload: BookingFormSubmission]
}>()

const form = reactive({
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  organizationName: '',
  eventName: '',
  venueName: '',
  eventCity: '',
  eventCountryCode: '',
  eventDate: '',
  offer: '',
  offerCurrency: 'EUR',
  initialMessage: '',
  website: ''
})

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'BOOKING / SOLICITUD',
  title: `Cuéntale a ${props.artistName} qué tienes en mente.`,
  intro: 'Sin registrarte. Envía lo esencial ahora y los detalles pueden cerrarse después.',
  name: 'Tu nombre', email: 'Email de respuesta', message: 'Cuéntanos la propuesta',
  messagePlaceholder: 'Evento, contexto, idea, fecha aproximada o cualquier dato que ayude a entender la propuesta.',
  details: 'Añadir detalles del evento', organization: 'Promotor / organización', phone: 'Teléfono',
  event: 'Evento', venue: 'Sala / venue', city: 'Ciudad', country: 'País', date: 'Fecha',
  offer: 'Oferta', currency: 'Moneda', send: 'Enviar solicitud', sending: 'Enviando…',
  sent: 'Solicitud enviada.', sentBody: 'Ha quedado registrada para el equipo del artista. Podrán continuar contigo por email.',
  preview: 'El formulario real aparecerá aquí cuando publiques el perfil.',
  error: 'No se pudo enviar. Revisa los datos o inténtalo de nuevo.'
} : {
  eyebrow: 'BOOKING / ENQUIRY',
  title: `Tell ${props.artistName} what you have in mind.`,
  intro: 'No account required. Send the essentials now; the remaining details can be agreed later.',
  name: 'Your name', email: 'Reply email', message: 'Tell us about the proposal',
  messagePlaceholder: 'Event, context, idea, approximate date or anything that helps explain the proposal.',
  details: 'Add event details', organization: 'Promoter / organisation', phone: 'Phone',
  event: 'Event', venue: 'Venue', city: 'City', country: 'Country', date: 'Date',
  offer: 'Offer', currency: 'Currency', send: 'Send enquiry', sending: 'Sending…',
  sent: 'Enquiry sent.', sentBody: 'It is now registered for the artist team. They can continue with you by email.',
  preview: 'The live form will appear here when the profile is published.',
  error: 'The enquiry could not be sent. Check the details or try again.'
})

function offerAmountMinor() {
  const raw = form.offer.trim().replace(',', '.')
  if (!raw) return null
  const amount = Number(raw)
  if (!Number.isFinite(amount) || amount < 0) return null
  return Math.round(amount * 100)
}

function submit() {
  if (props.preview || props.submitting || props.sent) return
  emit('submit', {
    contactName: form.contactName,
    contactEmail: form.contactEmail,
    contactPhone: form.contactPhone || null,
    organizationName: form.organizationName || null,
    eventName: form.eventName || null,
    venueName: form.venueName || null,
    eventCity: form.eventCity || null,
    eventCountryCode: form.eventCountryCode || null,
    eventDate: form.eventDate || null,
    offerAmountMinor: offerAmountMinor(),
    offerCurrency: form.offer.trim() ? form.offerCurrency : null,
    initialMessage: form.initialMessage,
    website: form.website
  })
}
</script>

<template>
  <section class="public-booking-form" aria-labelledby="public-booking-title">
    <div class="public-booking-form__heading">
      <p>{{ copy.eyebrow }}</p>
      <h2 id="public-booking-title">{{ copy.title }}</h2>
      <span>{{ copy.intro }}</span>
    </div>

    <div v-if="sent" class="public-booking-form__success" role="status">
      <strong>{{ copy.sent }}</strong>
      <p>{{ copy.sentBody }}</p>
    </div>

    <div v-else-if="preview" class="public-booking-form__preview">
      <p>{{ copy.preview }}</p>
    </div>

    <form v-else class="public-booking-form__form" @submit.prevent="submit">
      <label>
        <span>{{ copy.name }}</span>
        <input v-model="form.contactName" name="name" autocomplete="name" maxlength="160" required>
      </label>
      <label>
        <span>{{ copy.email }}</span>
        <input v-model="form.contactEmail" name="email" autocomplete="email" type="email" maxlength="320" required>
      </label>
      <label class="public-booking-form__message">
        <span>{{ copy.message }}</span>
        <textarea v-model="form.initialMessage" name="message" rows="5" maxlength="10000" :placeholder="copy.messagePlaceholder" required />
      </label>

      <details class="public-booking-form__details">
        <summary>{{ copy.details }}</summary>
        <div class="public-booking-form__details-grid">
          <label><span>{{ copy.organization }}</span><input v-model="form.organizationName" maxlength="180"></label>
          <label><span>{{ copy.phone }}</span><input v-model="form.contactPhone" type="tel" autocomplete="tel" maxlength="50"></label>
          <label><span>{{ copy.event }}</span><input v-model="form.eventName" maxlength="180"></label>
          <label><span>{{ copy.venue }}</span><input v-model="form.venueName" maxlength="180"></label>
          <label><span>{{ copy.city }}</span><input v-model="form.eventCity" maxlength="120" autocomplete="address-level2"></label>
          <label><span>{{ copy.country }}</span><input v-model="form.eventCountryCode" maxlength="2" pattern="[A-Za-z]{2}" placeholder="ES" autocomplete="country"></label>
          <label><span>{{ copy.date }}</span><input v-model="form.eventDate" type="date"></label>
          <div class="public-booking-form__offer">
            <label><span>{{ copy.offer }}</span><input v-model="form.offer" inputmode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?"></label>
            <label><span>{{ copy.currency }}</span><input v-model="form.offerCurrency" maxlength="3" pattern="[A-Za-z]{3}"></label>
          </div>
        </div>
      </details>

      <label class="public-booking-form__honeypot" aria-hidden="true" tabindex="-1">
        Website
        <input v-model="form.website" tabindex="-1" autocomplete="off">
      </label>

      <p v-if="error" class="public-booking-form__error" role="alert">{{ copy.error }}</p>
      <button class="public-booking-form__submit" type="submit" :disabled="submitting">
        {{ submitting ? copy.sending : copy.send }}
        <span class="arrow arrow--ne" aria-hidden="true" />
      </button>
    </form>
  </section>
</template>

<style scoped>
.public-booking-form {
  padding: clamp(28px, 6vw, 76px);
  border-top: 1px solid var(--cue-border, #2d2d2d);
  background: var(--cue-surface, #101010);
  color: var(--cue-text, #f2f0eb);
}
.public-booking-form__heading { max-width: 780px; margin-bottom: 34px; }
.public-booking-form__heading > p { margin: 0 0 12px; color: var(--cue-accent, #e8ff2f); font: 700 10px/1.2 monospace; letter-spacing: .12em; }
.public-booking-form__heading h2 { max-width: 760px; margin: 0; font-size: clamp(2.3rem, 6vw, 5.8rem); line-height: .9; letter-spacing: -.04em; text-transform: uppercase; }
.public-booking-form__heading > span { display: block; max-width: 620px; margin-top: 18px; color: var(--cue-muted, #999); font-size: 15px; line-height: 1.55; }
.public-booking-form__form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; max-width: 920px; }
.public-booking-form label { display: grid; gap: 8px; }
.public-booking-form label > span, .public-booking-form__details summary { color: var(--cue-muted, #999); font: 700 10px/1.2 monospace; letter-spacing: .09em; text-transform: uppercase; }
.public-booking-form input, .public-booking-form textarea { box-sizing: border-box; width: 100%; min-height: 48px; padding: 12px 13px; border: 1px solid var(--cue-border, #353535); border-radius: 0; outline: none; background: var(--cue-bg, #090909); color: var(--cue-text, #f2f0eb); font: inherit; }
.public-booking-form textarea { min-height: 132px; resize: vertical; }
.public-booking-form input:focus-visible, .public-booking-form textarea:focus-visible, .public-booking-form summary:focus-visible, .public-booking-form__submit:focus-visible { outline: 2px solid var(--cue-accent, #e8ff2f); outline-offset: 2px; }
.public-booking-form__message, .public-booking-form__details, .public-booking-form__submit, .public-booking-form__error { grid-column: 1 / -1; }
.public-booking-form__details { padding: 0; border-top: 1px solid var(--cue-border, #353535); border-bottom: 1px solid var(--cue-border, #353535); }
.public-booking-form__details summary { padding: 17px 0; cursor: pointer; color: var(--cue-text, #f2f0eb); }
.public-booking-form__details-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; padding: 4px 0 22px; }
.public-booking-form__offer { display: grid; grid-template-columns: minmax(0, 1fr) 100px; gap: 10px; }
.public-booking-form__submit { display: inline-flex; justify-self: start; align-items: center; gap: 10px; min-height: 52px; padding: 0 20px; border: 0; background: var(--cue-accent, #e8ff2f); color: #090909; cursor: pointer; font-weight: 900; }
.public-booking-form__submit:disabled { cursor: wait; opacity: .6; }
.public-booking-form__error { margin: 0; color: #ff9d9d; font-size: 13px; }
.public-booking-form__success, .public-booking-form__preview { max-width: 720px; padding: 26px; border: 1px solid var(--cue-border, #353535); background: var(--cue-bg, #090909); }
.public-booking-form__success strong { color: var(--cue-accent, #e8ff2f); font-size: 20px; }
.public-booking-form__success p, .public-booking-form__preview p { margin: 8px 0 0; color: var(--cue-muted, #999); line-height: 1.55; }
.public-booking-form__honeypot { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
@media (max-width: 700px) {
  .public-booking-form { padding: 28px 18px 42px; }
  .public-booking-form__form, .public-booking-form__details-grid { grid-template-columns: 1fr; }
  .public-booking-form__message, .public-booking-form__details, .public-booking-form__submit, .public-booking-form__error { grid-column: 1; }
  .public-booking-form__heading h2 { font-size: clamp(2.2rem, 13vw, 4.2rem); }
}
</style>
