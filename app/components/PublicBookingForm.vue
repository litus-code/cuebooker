<script setup lang="ts">
import type { PublicBookingRequestInput } from '../domain/publicArtistProfile'

type BookingFormSubmission = Omit<PublicBookingRequestInput, 'artistSlug' | 'requestId' | 'entrySource' | 'locale'>
type FieldName = 'contactName' | 'contactEmail' | 'initialMessage' | 'eventCountryCode' | 'eventDate' | 'offer' | 'offerCurrency'

const props = withDefaults(defineProps<{
  artistName: string
  locale?: 'es' | 'en'
  submitting?: boolean
  sent?: boolean
  confirmationSent?: boolean | null
  reference?: string
  error?: string
  preview?: boolean
  compact?: boolean
}>(), {
  locale: 'es',
  submitting: false,
  sent: false,
  confirmationSent: null,
  reference: '',
  error: '',
  preview: false,
  compact: false
})

const emit = defineEmits<{
  submit: [payload: BookingFormSubmission]
}>()

const formRoot = ref<HTMLFormElement | null>(null)
const detailsRoot = ref<HTMLDetailsElement | null>(null)
const minEventDate = ref('')
const maxEventDate = ref('')
const fieldErrors = reactive<Partial<Record<FieldName, string>>>({})

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
  dateHelp: 'Elige la fecha desde el calendario para evitar errores.',
  offer: 'Oferta', currency: 'Moneda', send: 'Enviar solicitud', sending: 'Enviando…',
  sent: 'Solicitud enviada',
  sentWithEmail: 'Todo listo. Te hemos enviado un email con un enlace seguro para consultar el estado y continuar la conversación. También puedes responder directamente a ese email.',
  sentWithoutEmail: 'La solicitud está guardada y ya puede verla el equipo del artista. No hemos podido entregar el email de confirmación, pero no necesitas volver a enviarla.',
  reference: 'Referencia',
  preview: 'El formulario real aparecerá aquí cuando publiques el perfil.',
  errors: {
    name: 'Escribe tu nombre.',
    email: 'Introduce un email válido para poder responderte.',
    message: 'Cuéntanos brevemente la propuesta.',
    country: 'Usa el código de país de 2 letras, por ejemplo ES.',
    date: 'Selecciona una fecha válida.',
    datePast: 'La fecha del evento no puede estar en el pasado.',
    dateFuture: 'Revisa el año de la fecha del evento.',
    offer: 'Introduce una cantidad válida, por ejemplo 1500 o 1500,50.',
    currency: 'Usa una moneda de 3 letras, por ejemplo EUR.',
    invalidPayload: 'Hay algún dato que no cuadra. Revisa los campos antes de volver a enviar.',
    context: 'Necesitamos al menos una propuesta, evento, sala o fecha para registrar la solicitud.',
    closed: 'Este artista ya no está aceptando nuevas solicitudes de booking.',
    rateLimited: 'Has hecho varios intentos seguidos. Espera un momento y vuelve a probar.',
    generic: 'No hemos podido enviar la solicitud. Tus datos siguen aquí; revísalos o inténtalo de nuevo en unos segundos.'
  }
} : {
  eyebrow: 'BOOKING / ENQUIRY',
  title: `Tell ${props.artistName} what you have in mind.`,
  intro: 'No account required. Send the essentials now; the remaining details can be agreed later.',
  name: 'Your name', email: 'Reply email', message: 'Tell us about the proposal',
  messagePlaceholder: 'Event, context, idea, approximate date or anything that helps explain the proposal.',
  details: 'Add event details', organization: 'Promoter / organisation', phone: 'Phone',
  event: 'Event', venue: 'Venue', city: 'City', country: 'Country', date: 'Date',
  dateHelp: 'Choose the date from the calendar to avoid input errors.',
  offer: 'Offer', currency: 'Currency', send: 'Send enquiry', sending: 'Sending…',
  sent: 'Enquiry sent',
  sentWithEmail: 'All set. We sent you an email with a secure link to check the status and continue the conversation. You can also reply directly to that email.',
  sentWithoutEmail: 'Your enquiry is safely recorded and the artist team can already see it. We could not deliver the confirmation email, but you do not need to send the enquiry again.',
  reference: 'Reference',
  preview: 'The live form will appear here when the profile is published.',
  errors: {
    name: 'Enter your name.',
    email: 'Enter a valid email so the artist team can reply.',
    message: 'Tell us briefly about the proposal.',
    country: 'Use a 2-letter country code, for example ES.',
    date: 'Choose a valid date.',
    datePast: 'The event date cannot be in the past.',
    dateFuture: 'Check the year of the event date.',
    offer: 'Enter a valid amount, for example 1500 or 1500.50.',
    currency: 'Use a 3-letter currency code, for example EUR.',
    invalidPayload: 'Some details do not look right. Review the fields before sending again.',
    context: 'We need at least a proposal, event, venue or date to register the enquiry.',
    closed: 'This artist is no longer accepting new booking enquiries.',
    rateLimited: 'There have been several attempts in a short time. Wait a moment and try again.',
    generic: 'We could not send the enquiry. Your details are still here; review them or try again in a few seconds.'
  }
})

const serverErrorMessage = computed(() => {
  if (!props.error) return ''
  const code = props.error.toLowerCase()
  if (code.includes('booking_context_required')) return copy.value.errors.context
  if (code.includes('invalid_payload')) return copy.value.errors.invalidPayload
  if (code.includes('closed') || code.includes('not_accepting')) return copy.value.errors.closed
  if (code.includes('429') || code.includes('rate')) return copy.value.errors.rateLimited
  return copy.value.errors.generic
})

function localDateIso(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

onMounted(() => {
  const today = new Date()
  const latest = new Date(today.getFullYear() + 10, today.getMonth(), today.getDate())
  minEventDate.value = localDateIso(today)
  maxEventDate.value = localDateIso(latest)
})

function clearFieldError(field: FieldName) {
  delete fieldErrors[field]
}

function isRealIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function validateField(field: FieldName) {
  clearFieldError(field)

  if (field === 'contactName' && !form.contactName.trim()) fieldErrors.contactName = copy.value.errors.name
  if (field === 'contactEmail') {
    const email = form.contactEmail.trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fieldErrors.contactEmail = copy.value.errors.email
  }
  if (field === 'initialMessage' && !form.initialMessage.trim()) fieldErrors.initialMessage = copy.value.errors.message
  if (field === 'eventCountryCode') {
    const country = form.eventCountryCode.trim()
    if (country && !/^[A-Za-z]{2}$/.test(country)) fieldErrors.eventCountryCode = copy.value.errors.country
  }
  if (field === 'eventDate') {
    const date = form.eventDate.trim()
    if (date) {
      if (!isRealIsoDate(date)) fieldErrors.eventDate = copy.value.errors.date
      else if (minEventDate.value && date < minEventDate.value) fieldErrors.eventDate = copy.value.errors.datePast
      else if (maxEventDate.value && date > maxEventDate.value) fieldErrors.eventDate = copy.value.errors.dateFuture
    }
  }
  if (field === 'offer') {
    const raw = form.offer.trim().replace(',', '.')
    if (raw && (!/^\d+(?:\.\d{1,2})?$/.test(raw) || !Number.isFinite(Number(raw)))) fieldErrors.offer = copy.value.errors.offer
  }
  if (field === 'offerCurrency') {
    const currency = form.offerCurrency.trim()
    if (form.offer.trim() && !/^[A-Za-z]{3}$/.test(currency)) fieldErrors.offerCurrency = copy.value.errors.currency
  }

  return !fieldErrors[field]
}

function validateForm() {
  const fields: FieldName[] = ['contactName', 'contactEmail', 'initialMessage', 'eventCountryCode', 'eventDate', 'offer', 'offerCurrency']
  const valid = fields.map(validateField).every(Boolean)
  if (valid) return true

  const detailFields: FieldName[] = ['eventCountryCode', 'eventDate', 'offer', 'offerCurrency']
  if (detailFields.some(field => fieldErrors[field])) detailsRoot.value?.setAttribute('open', '')

  nextTick(() => {
    const firstInvalid = fields.find(field => fieldErrors[field])
    if (!firstInvalid) return
    formRoot.value?.querySelector<HTMLElement>(`[data-field="${firstInvalid}"]`)?.focus()
  })
  return false
}

function offerAmountMinor() {
  const raw = form.offer.trim().replace(',', '.')
  if (!raw) return null
  const amount = Number(raw)
  if (!Number.isFinite(amount) || amount < 0) return null
  return Math.round(amount * 100)
}

function submit() {
  if (props.preview || props.submitting || props.sent || !validateForm()) return
  emit('submit', {
    contactName: form.contactName.trim(),
    contactEmail: form.contactEmail.trim(),
    contactPhone: form.contactPhone.trim() || null,
    organizationName: form.organizationName.trim() || null,
    eventName: form.eventName.trim() || null,
    venueName: form.venueName.trim() || null,
    eventCity: form.eventCity.trim() || null,
    eventCountryCode: form.eventCountryCode.trim().toUpperCase() || null,
    eventDate: form.eventDate || null,
    offerAmountMinor: offerAmountMinor(),
    offerCurrency: form.offer.trim() ? form.offerCurrency.trim().toUpperCase() : null,
    initialMessage: form.initialMessage.trim(),
    website: form.website
  })
}
</script>

<template>
  <section class="public-booking-form" :class="{ 'public-booking-form--compact': compact }" aria-labelledby="public-booking-title">
    <div class="public-booking-form__heading">
      <p>{{ copy.eyebrow }}</p>
      <h2 id="public-booking-title">{{ copy.title }}</h2>
      <span>{{ copy.intro }}</span>
    </div>

    <div v-if="sent" class="public-booking-form__success" role="status" aria-live="polite">
      <strong>{{ copy.sent }}</strong>
      <p>{{ confirmationSent ? copy.sentWithEmail : copy.sentWithoutEmail }}</p>
      <span v-if="reference" class="public-booking-form__reference">{{ copy.reference }} · {{ reference }}</span>
    </div>

    <div v-else-if="preview" class="public-booking-form__preview">
      <p>{{ copy.preview }}</p>
    </div>

    <form v-else ref="formRoot" class="public-booking-form__form" novalidate @submit.prevent="submit">
      <label>
        <span>{{ copy.name }}</span>
        <input
          v-model="form.contactName"
          data-field="contactName"
          name="name"
          autocomplete="name"
          maxlength="160"
          :aria-invalid="Boolean(fieldErrors.contactName)"
          :aria-describedby="fieldErrors.contactName ? 'booking-name-error' : undefined"
          @input="clearFieldError('contactName')"
          @blur="validateField('contactName')"
        >
        <small v-if="fieldErrors.contactName" id="booking-name-error" class="public-booking-form__field-error">{{ fieldErrors.contactName }}</small>
      </label>
      <label>
        <span>{{ copy.email }}</span>
        <input
          v-model="form.contactEmail"
          data-field="contactEmail"
          name="email"
          autocomplete="email"
          type="email"
          inputmode="email"
          maxlength="320"
          :aria-invalid="Boolean(fieldErrors.contactEmail)"
          :aria-describedby="fieldErrors.contactEmail ? 'booking-email-error' : undefined"
          @input="clearFieldError('contactEmail')"
          @blur="validateField('contactEmail')"
        >
        <small v-if="fieldErrors.contactEmail" id="booking-email-error" class="public-booking-form__field-error">{{ fieldErrors.contactEmail }}</small>
      </label>
      <label class="public-booking-form__message">
        <span>{{ copy.message }}</span>
        <textarea
          v-model="form.initialMessage"
          data-field="initialMessage"
          name="message"
          rows="5"
          maxlength="10000"
          :placeholder="copy.messagePlaceholder"
          :aria-invalid="Boolean(fieldErrors.initialMessage)"
          :aria-describedby="fieldErrors.initialMessage ? 'booking-message-error' : undefined"
          @input="clearFieldError('initialMessage')"
          @blur="validateField('initialMessage')"
        />
        <small v-if="fieldErrors.initialMessage" id="booking-message-error" class="public-booking-form__field-error">{{ fieldErrors.initialMessage }}</small>
      </label>

      <details ref="detailsRoot" class="public-booking-form__details">
        <summary>{{ copy.details }}</summary>
        <div class="public-booking-form__details-grid">
          <label><span>{{ copy.organization }}</span><input v-model="form.organizationName" maxlength="180"></label>
          <label><span>{{ copy.phone }}</span><input v-model="form.contactPhone" type="tel" autocomplete="tel" maxlength="50"></label>
          <label><span>{{ copy.event }}</span><input v-model="form.eventName" maxlength="180"></label>
          <label><span>{{ copy.venue }}</span><input v-model="form.venueName" maxlength="180"></label>
          <label><span>{{ copy.city }}</span><input v-model="form.eventCity" maxlength="120" autocomplete="address-level2"></label>
          <label>
            <span>{{ copy.country }}</span>
            <input
              v-model="form.eventCountryCode"
              data-field="eventCountryCode"
              maxlength="2"
              inputmode="text"
              placeholder="ES"
              autocomplete="country"
              :aria-invalid="Boolean(fieldErrors.eventCountryCode)"
              :aria-describedby="fieldErrors.eventCountryCode ? 'booking-country-error' : undefined"
              @input="clearFieldError('eventCountryCode')"
              @blur="validateField('eventCountryCode')"
            >
            <small v-if="fieldErrors.eventCountryCode" id="booking-country-error" class="public-booking-form__field-error">{{ fieldErrors.eventCountryCode }}</small>
          </label>
          <label>
            <span>{{ copy.date }}</span>
            <input
              v-model="form.eventDate"
              data-field="eventDate"
              type="date"
              :min="minEventDate || undefined"
              :max="maxEventDate || undefined"
              :aria-invalid="Boolean(fieldErrors.eventDate)"
              :aria-describedby="fieldErrors.eventDate ? 'booking-date-error' : 'booking-date-help'"
              @input="clearFieldError('eventDate')"
              @change="validateField('eventDate')"
              @blur="validateField('eventDate')"
            >
            <small id="booking-date-help" class="public-booking-form__field-help">{{ copy.dateHelp }}</small>
            <small v-if="fieldErrors.eventDate" id="booking-date-error" class="public-booking-form__field-error">{{ fieldErrors.eventDate }}</small>
          </label>
          <div class="public-booking-form__offer">
            <label>
              <span>{{ copy.offer }}</span>
              <input
                v-model="form.offer"
                data-field="offer"
                inputmode="decimal"
                :aria-invalid="Boolean(fieldErrors.offer)"
                :aria-describedby="fieldErrors.offer ? 'booking-offer-error' : undefined"
                @input="clearFieldError('offer')"
                @blur="validateField('offer')"
              >
              <small v-if="fieldErrors.offer" id="booking-offer-error" class="public-booking-form__field-error">{{ fieldErrors.offer }}</small>
            </label>
            <label>
              <span>{{ copy.currency }}</span>
              <input
                v-model="form.offerCurrency"
                data-field="offerCurrency"
                maxlength="3"
                inputmode="text"
                :aria-invalid="Boolean(fieldErrors.offerCurrency)"
                :aria-describedby="fieldErrors.offerCurrency ? 'booking-currency-error' : undefined"
                @input="clearFieldError('offerCurrency')"
                @blur="validateField('offerCurrency')"
              >
              <small v-if="fieldErrors.offerCurrency" id="booking-currency-error" class="public-booking-form__field-error">{{ fieldErrors.offerCurrency }}</small>
            </label>
          </div>
        </div>
      </details>

      <label class="public-booking-form__honeypot" aria-hidden="true" tabindex="-1">
        Website
        <input v-model="form.website" tabindex="-1" autocomplete="off">
      </label>

      <p v-if="serverErrorMessage" class="public-booking-form__error" role="alert">{{ serverErrorMessage }}</p>
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
.public-booking-form label { display: grid; align-content: start; gap: 8px; }
.public-booking-form label > span, .public-booking-form__details summary { color: var(--cue-muted, #999); font: 700 10px/1.2 monospace; letter-spacing: .09em; text-transform: uppercase; }
.public-booking-form input, .public-booking-form textarea { box-sizing: border-box; width: 100%; min-height: 48px; padding: 12px 13px; border: 1px solid var(--cue-border, #353535); border-radius: 0; outline: none; background: var(--cue-bg, #090909); color: var(--cue-text, #f2f0eb); font: inherit; }
.public-booking-form input[aria-invalid="true"], .public-booking-form textarea[aria-invalid="true"] { border-color: #ff9d9d; }
.public-booking-form textarea { min-height: 132px; resize: vertical; }
.public-booking-form input:focus-visible, .public-booking-form textarea:focus-visible, .public-booking-form summary:focus-visible, .public-booking-form__submit:focus-visible { outline: 2px solid var(--cue-accent, #e8ff2f); outline-offset: 2px; }
.public-booking-form__message, .public-booking-form__details, .public-booking-form__submit, .public-booking-form__error { grid-column: 1 / -1; }
.public-booking-form__details { padding: 0; border-top: 1px solid var(--cue-border, #353535); border-bottom: 1px solid var(--cue-border, #353535); }
.public-booking-form__details summary { padding: 17px 0; cursor: pointer; color: var(--cue-text, #f2f0eb); }
.public-booking-form__details-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; padding: 4px 0 22px; }
.public-booking-form__offer { display: grid; grid-template-columns: minmax(0, 1fr) 110px; gap: 10px; }
.public-booking-form__field-error, .public-booking-form__field-help { display: block; font-size: 12px; line-height: 1.4; }
.public-booking-form__field-error { color: #ff9d9d; }
.public-booking-form__field-help { color: var(--cue-muted, #777); }
.public-booking-form__submit { display: inline-flex; justify-self: start; align-items: center; gap: 10px; min-height: 52px; padding: 0 20px; border: 0; background: var(--cue-accent, #e8ff2f); color: #090909; cursor: pointer; font-weight: 900; }
.public-booking-form__submit:disabled { cursor: wait; opacity: .6; }
.public-booking-form__error { margin: 0; padding: 13px 14px; border-left: 2px solid #ff9d9d; background: color-mix(in srgb, #ff9d9d 8%, transparent); color: #ffc2c2; font-size: 13px; line-height: 1.45; }
.public-booking-form__success, .public-booking-form__preview { max-width: 720px; padding: 26px; border: 1px solid var(--cue-border, #353535); background: var(--cue-bg, #090909); }
.public-booking-form__success { border-left: 3px solid var(--cue-accent, #e8ff2f); }
.public-booking-form__success strong { color: var(--cue-accent, #e8ff2f); font-size: 20px; }
.public-booking-form__success p, .public-booking-form__preview p { margin: 8px 0 0; color: var(--cue-muted, #aaa); line-height: 1.55; }
.public-booking-form__reference { display: inline-block; margin-top: 18px; color: var(--cue-text, #f2f0eb); font: 700 10px/1.2 monospace; letter-spacing: .08em; text-transform: uppercase; }
.public-booking-form__honeypot { position: absolute !important; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
.public-booking-form--compact { min-height: 100%; box-sizing: border-box; padding: 24px; border-top: 0; }
.public-booking-form--compact .public-booking-form__heading { margin-bottom: 24px; }
.public-booking-form--compact .public-booking-form__heading h2 { max-width: 620px; font-size: clamp(2rem, 7vw, 4rem); }
.public-booking-form--compact .public-booking-form__heading > span { max-width: 560px; margin-top: 12px; font-size: 13px; }
.public-booking-form--compact .public-booking-form__form { gap: 13px; max-width: none; }
.public-booking-form--compact input { min-height: 44px; }
.public-booking-form--compact textarea { min-height: 110px; }
@media (max-width: 700px) {
  .public-booking-form { padding: 28px 18px 42px; }
  .public-booking-form__form, .public-booking-form__details-grid { grid-template-columns: 1fr; }
  .public-booking-form__message, .public-booking-form__details, .public-booking-form__submit, .public-booking-form__error { grid-column: 1; }
  .public-booking-form__offer { grid-template-columns: minmax(0, 1fr) 96px; }
  .public-booking-form__heading h2 { font-size: clamp(2.2rem, 13vw, 4.2rem); }
  .public-booking-form--compact { padding: 20px 16px 28px; }
  .public-booking-form--compact .public-booking-form__heading h2 { font-size: clamp(2rem, 12vw, 3.7rem); }
}
</style>
