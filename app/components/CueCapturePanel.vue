<script setup lang="ts">
import type { BookingSource, CoreBooking, CounterpartyKind } from '../domain/bookingCore'
import type { SmartCaptureResult } from '../domain/smartCapture'

const props = defineProps<{
  open: boolean
  workspaceId: string
  artistId: string
  locale: 'es' | 'en'
}>()

const emit = defineEmits<{
  close: []
  created: [booking: CoreBooking]
}>()

const bookingCore = useBookingCore()
const captureEngine = useCaptureEngine()
const analytics = useAnalytics()
const { can: canEntitlement } = useCueEntitlements()
const voiceInput = ref<{ setProcessing: (value: boolean) => void } | null>(null)
const submitting = ref(false)
const analyzing = ref(false)
const loadingOptions = ref(false)
const errorMessage = ref('')
const contacts = ref<Array<{ id: string; name: string; email: string | null }>>([])
const counterparties = ref<Array<{ id: string; name: string; kind: CounterpartyKind }>>([])

const source = ref<BookingSource>('phone')
const contactMode = ref<'new' | 'existing'>('new')
const existingContactId = ref('')
const contactName = ref('')
const contactEmail = ref('')
const contactPhone = ref('')
const counterpartyMode = ref<'new' | 'existing'>('new')
const existingCounterpartyId = ref('')
const counterpartyKind = ref<CounterpartyKind>('venue')
const counterpartyName = ref('')
const eventName = ref('')
const venueName = ref('')
const city = ref('')
const countryCode = ref('')
const eventDate = ref('')
const startTime = ref('')
const endTime = ref('')
const eventTimezone = ref('')
const offer = ref('')
const currency = ref('EUR')
const feeBasis = ref('')
const initialNote = ref('')
const nextMoveLabel = ref('')
const nextMoveDueAt = ref('')
const interpretationMessage = ref('')
const smartResult = ref<SmartCaptureResult | null>(null)
const moreOpen = ref(false)

const text = computed(() => props.locale === 'es' ? {
  eyebrow: 'CUE / NUEVA OPORTUNIDAD',
  title: 'CAPTURA UNA OPORTUNIDAD',
  intro: 'Cuéntaselo a Cuebooker por voz o texto. Crearemos un booking nuevo con lo que sepamos y podrás completarlo después.',
  channel: 'Canal',
  phone: 'Teléfono', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram', inPerson: 'En persona', manual: 'Otro',
  who: 'Contacto',
  existing: 'Ya lo conozco', newContact: 'Nuevo', chooseContact: 'Selecciona un contacto', name: 'Nombre', contactEmail: 'Email', phoneLabel: 'Teléfono',
  withWho: 'Sala / promotor / evento', existingPlace: 'Ya existe', newPlace: 'Nuevo', choosePlace: 'Selecciona una entidad', type: 'Tipo', venue: 'Sala', promoter: 'Promotor', festival: 'Festival', agency: 'Agencia', brand: 'Marca', other: 'Otro',
  placeName: 'Nombre',
  event: 'Evento', date: 'Fecha', city: 'Ciudad', offer: 'Oferta',
  note: 'Cuéntaselo a Cuebooker', notePlaceholder: 'Ej. Me ha llamado Héctor de Nitsa para el 23 de septiembre. 1.200 €, pendiente confirmar horario.',
  interpret: 'Detectar datos del texto', interpreted: 'He detectado algunos datos claros. Revísalos antes de crear el booking.', nothingDetected: 'No he detectado datos suficientemente claros. Puedes completar el booking manualmente.', reviewSuggestions: 'Esto es lo que he entendido. Nada se aplicará hasta que lo confirmes.', applySuggestions: 'Aplicar sugerencias', discardSuggestions: 'Descartar', suggestionsApplied: 'Sugerencias aplicadas. Revísalas antes de guardar el CUE.', nextMove: 'Siguiente paso',
  more: 'Añadir más datos', less: 'Ocultar datos extra',
  cancel: 'Cancelar', save: 'Crear booking', saving: 'Creando…',
  minimum: 'Escribe al menos un contacto, una sala/evento o una nota.',
  error: 'No se ha podido guardar este CUE.'
} : {
  eyebrow: 'CUE / NEW OPPORTUNITY',
  title: 'CAPTURE AN OPPORTUNITY',
  intro: 'Tell Cuebooker by voice or text. We will create a new booking with what we know and you can complete it later.',
  channel: 'Channel',
  phone: 'Phone', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram', inPerson: 'In person', manual: 'Other',
  who: 'Contact',
  existing: 'Existing', newContact: 'New', chooseContact: 'Choose a contact', name: 'Name', contactEmail: 'Email', phoneLabel: 'Phone',
  withWho: 'Venue / promoter / event', existingPlace: 'Existing', newPlace: 'New', choosePlace: 'Choose an entity', type: 'Type', venue: 'Venue', promoter: 'Promoter', festival: 'Festival', agency: 'Agency', brand: 'Brand', other: 'Other',
  placeName: 'Name',
  event: 'Event', date: 'Date', city: 'City', offer: 'Offer',
  note: 'Tell Cuebooker', notePlaceholder: 'E.g. Hector from Nitsa called for September 23. €1,200, pending confirm schedule.',
  interpret: 'Detect details from text', interpreted: 'I found some clear details. Review them before creating the booking.', nothingDetected: 'I could not detect enough clear details. You can complete the booking manually.', reviewSuggestions: 'This is what I understood. Nothing will be applied until you confirm it.', applySuggestions: 'Apply suggestions', discardSuggestions: 'Discard', suggestionsApplied: 'Suggestions applied. Review them before saving the CUE.', nextMove: 'Next move',
  more: 'Add more details', less: 'Hide extra details',
  cancel: 'Cancel', save: 'Create booking', saving: 'Creating…',
  minimum: 'Add at least a contact, venue/event or a note.',
  error: 'This CUE could not be saved.'
})

const sourceOptions = computed<Array<{ value: BookingSource; label: string }>>(() => [
  { value: 'phone', label: text.value.phone },
  { value: 'whatsapp', label: text.value.whatsapp },
  { value: 'email', label: text.value.email },
  { value: 'instagram', label: text.value.instagram },
  { value: 'in_person', label: text.value.inPerson },
  { value: 'manual', label: text.value.manual }
])

const kindOptions = computed<Array<{ value: CounterpartyKind; label: string }>>(() => [
  { value: 'venue', label: text.value.venue },
  { value: 'promoter', label: text.value.promoter },
  { value: 'festival', label: text.value.festival },
  { value: 'agency', label: text.value.agency },
  { value: 'brand', label: text.value.brand },
  { value: 'other', label: text.value.other }
])

function reset() {
  source.value = 'phone'
  contactMode.value = 'new'
  existingContactId.value = ''
  contactName.value = ''
  contactEmail.value = ''
  contactPhone.value = ''
  counterpartyMode.value = 'new'
  existingCounterpartyId.value = ''
  counterpartyKind.value = 'venue'
  counterpartyName.value = ''
  eventName.value = ''
  venueName.value = ''
  city.value = ''
  countryCode.value = ''
  eventDate.value = ''
  startTime.value = ''
  endTime.value = ''
  eventTimezone.value = ''
  offer.value = ''
  currency.value = 'EUR'
  feeBasis.value = ''
  initialNote.value = ''
  nextMoveLabel.value = ''
  nextMoveDueAt.value = ''
  interpretationMessage.value = ''
  smartResult.value = null
  moreOpen.value = false
  errorMessage.value = ''
}

async function loadOptions() {
  if (!props.workspaceId) return
  loadingOptions.value = true
  try {
    const [contactRows, counterpartyRows] = await Promise.all([
      bookingCore.listContacts(props.workspaceId),
      bookingCore.listCounterparties(props.workspaceId)
    ])
    contacts.value = contactRows
    counterparties.value = counterpartyRows
  } catch {
    // Capture remains usable for new contacts even if optional suggestions fail.
    contacts.value = []
    counterparties.value = []
  } finally {
    loadingOptions.value = false
  }
}

watch(() => props.open, async value => {
  if (!value) return
  reset()
  analytics.track('cue_open', {
    workspace_id: props.workspaceId,
    artist_id: props.artistId
  })
  await loadOptions()
})

function close() {
  if (submitting.value) return
  emit('close')
}

function normalizeEntityName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
}

async function interpretNote() {
  const raw = initialNote.value.trim()
  if (!raw || analyzing.value) return

  analytics.track('smart_capture_start', {
    mode: 'text',
    text_length: raw.length
  })
  analyzing.value = true
  interpretationMessage.value = ''
  smartResult.value = null

  try {
    const analysis = await captureEngine.analyzeText({
      workspaceId: props.workspaceId,
      artistId: props.artistId,
      locale: props.locale,
      text: raw
    })
    smartResult.value = analysis.result
    analytics.track('smart_capture_result', {
      mode: 'text',
      success: analysis.method !== 'local_parser',
      fallback: analysis.method === 'local_parser' ? analysis.method : null,
      missing_fields: analysis.result.missingFields.length,
      warnings: analysis.result.warnings.length
    })
  } finally {
    analyzing.value = false
  }
}

function applyEntityMatches(contact: string | null, party: string | null) {
  if (contact) {
    const match = contacts.value.find(item => normalizeEntityName(item.name) === normalizeEntityName(contact))
    if (match) {
      contactMode.value = 'existing'
      existingContactId.value = match.id
    } else {
      contactMode.value = 'new'
      existingContactId.value = ''
      contactName.value = contact
    }
  }

  if (party) {
    const match = counterparties.value.find(item => normalizeEntityName(item.name) === normalizeEntityName(party))
    if (match) {
      counterpartyMode.value = 'existing'
      existingCounterpartyId.value = match.id
      if (!venueName.value) venueName.value = match.name
    } else {
      counterpartyMode.value = 'new'
      existingCounterpartyId.value = ''
      counterpartyName.value = party
    }
  }
}

function applySmartResult() {
  const parsed = smartResult.value
  if (!parsed) return
  analytics.track('smart_capture_apply', {
    source: parsed.source.value || null,
    missing_fields: parsed.missingFields.length,
    warnings: parsed.warnings.length
  })

  if (parsed.source.value) source.value = parsed.source.value
  applyEntityMatches(parsed.contact.name.value, parsed.counterparty.name.value)

  if (parsed.contact.email.value) contactEmail.value = parsed.contact.email.value
  if (parsed.contact.phone.value) contactPhone.value = parsed.contact.phone.value
  if (parsed.counterparty.kind.value) counterpartyKind.value = parsed.counterparty.kind.value
  if (parsed.event.name.value) eventName.value = parsed.event.name.value
  if (parsed.event.venueName.value) venueName.value = parsed.event.venueName.value
  if (parsed.event.city.value) city.value = parsed.event.city.value
  if (parsed.event.countryCode.value) countryCode.value = parsed.event.countryCode.value
  if (parsed.event.eventDate.value) eventDate.value = parsed.event.eventDate.value
  if (parsed.event.startTime.value) startTime.value = parsed.event.startTime.value
  if (parsed.event.endTime.value) endTime.value = parsed.event.endTime.value
  if (parsed.event.timezone.value) eventTimezone.value = parsed.event.timezone.value
  if (parsed.offer.amountMinor.value != null) offer.value = String(parsed.offer.amountMinor.value / 100)
  if (parsed.offer.currency.value) currency.value = parsed.offer.currency.value
  if (parsed.offer.feeBasis.value) feeBasis.value = parsed.offer.feeBasis.value
  if (parsed.nextAction.label.value) nextMoveLabel.value = parsed.nextAction.label.value
  if (parsed.nextAction.dueAt.value) nextMoveDueAt.value = parsed.nextAction.dueAt.value.slice(0, 16)

  moreOpen.value = true
  smartResult.value = null
  interpretationMessage.value = props.locale === 'es'
    ? 'Smart Capture aplicado. Revisa los datos antes de crear el booking.'
    : 'Smart Capture applied. Review the details before creating the booking.'
}

function discardSmartResult() {
  smartResult.value = null
}

async function onVoiceCaptured(value: string) {
  initialNote.value = value
  await nextTick()
  await interpretNote()
}

async function onAudioCaptured(audio: Blob, filename: string, fallbackTranscript = '') {
  if (analyzing.value) return
  analytics.track('smart_capture_start', {
    mode: 'audio',
    audio_bytes: audio.size,
    audio_type: audio.type || null
  })
  analyzing.value = true
  interpretationMessage.value = ''
  smartResult.value = null

  try {
    const analysis = await captureEngine.analyzeAudio({
      workspaceId: props.workspaceId,
      artistId: props.artistId,
      locale: props.locale,
      audio,
      filename,
      fallbackTranscript
    })
    initialNote.value = analysis.result.transcript || fallbackTranscript
    smartResult.value = analysis.result

    if (analysis.method === 'browser_transcript') {
      interpretationMessage.value = props.locale === 'es'
        ? 'He recuperado la voz mediante el dictado del navegador. Revisa lo que he entendido.'
        : 'I recovered the voice using browser dictation. Review what I understood.'
    }

    analytics.track('smart_capture_result', {
      mode: analysis.method === 'browser_transcript' ? 'audio_browser_fallback' : 'audio',
      success: analysis.method !== 'local_parser',
      fallback: analysis.method === 'local_parser' ? analysis.method : null,
      transcript_length: analysis.result.transcript.length,
      missing_fields: analysis.result.missingFields.length,
      warnings: analysis.result.warnings.length
    })
  } catch {
    interpretationMessage.value = props.locale === 'es'
      ? 'No he podido transcribir este audio. Inténtalo de nuevo o escríbelo.'
      : 'I could not transcribe this audio. Try again or type it.'
    analytics.track('smart_capture_result', {
      mode: 'audio',
      success: false,
      browser_fallback_available: Boolean(fallbackTranscript.trim())
    })
  } finally {
    analyzing.value = false
    voiceInput.value?.setProcessing(false)
  }
}

function parseOfferMinor() {
  const normalized = offer.value.trim().replace(',', '.')
  if (!normalized) return null
  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount < 0) return NaN
  return Math.round(amount * 100)
}

async function submit() {
  errorMessage.value = ''
  const hasContact = contactMode.value === 'existing' ? Boolean(existingContactId.value) : Boolean(contactName.value.trim())
  const hasCounterparty = counterpartyMode.value === 'existing' ? Boolean(existingCounterpartyId.value) : Boolean(counterpartyName.value.trim())
  const hasContext = hasContact || hasCounterparty || Boolean(eventName.value.trim() || venueName.value.trim() || initialNote.value.trim())
  if (!hasContext) {
    errorMessage.value = text.value.minimum
    return
  }

  const offerMinor = parseOfferMinor()
  if (Number.isNaN(offerMinor)) {
    errorMessage.value = text.value.error
    return
  }

  submitting.value = true
  try {
    const booking = await bookingCore.createManualBooking({
      workspaceId: props.workspaceId,
      artistId: props.artistId,
      source: source.value,
      existingContactId: contactMode.value === 'existing' ? existingContactId.value || null : null,
      contactName: contactMode.value === 'new' ? contactName.value : null,
      contactEmail: contactMode.value === 'new' ? contactEmail.value : null,
      contactPhone: contactMode.value === 'new' ? contactPhone.value : null,
      existingCounterpartyId: counterpartyMode.value === 'existing' ? existingCounterpartyId.value || null : null,
      counterpartyKind: counterpartyKind.value,
      counterpartyName: counterpartyMode.value === 'new' ? counterpartyName.value : null,
      eventName: eventName.value,
      venueName: venueName.value || counterpartyName.value,
      city: city.value,
      eventDate: eventDate.value || null,
      startTime: startTime.value || null,
      endTime: endTime.value || null,
      eventTimezone: eventTimezone.value,
      offerAmountMinor: offerMinor,
      currency: offerMinor == null ? null : currency.value,
      feeBasis: feeBasis.value,
      initialNote: initialNote.value,
      nextMoveLabel: nextMoveLabel.value,
      nextMoveDueAt: nextMoveDueAt.value ? new Date(nextMoveDueAt.value).toISOString() : null
    })
    analytics.track('booking_created', {
      capture_method: 'cue',
      source: source.value,
      used_smart_capture: Boolean(initialNote.value.trim())
    })
    emit('created', booking)
    reset()
  } catch (error: any) {
    const code = String(error?.data?.message || error?.data?.error || error?.message || '')
    errorMessage.value = code.includes('invalid_country_code')
      ? (props.locale === 'es' ? 'Revisa el país: debe ser un código de dos letras, por ejemplo ES.' : 'Check the country: use a two-letter code, for example ES.')
      : code.includes('invalid_currency')
        ? (props.locale === 'es' ? 'Revisa la moneda: debe usar tres letras, por ejemplo EUR.' : 'Check the currency: use three letters, for example EUR.')
        : code.includes('booking_time_requires_date')
          ? (props.locale === 'es' ? 'Si indicas un horario, añade también la fecha del booking.' : 'If you set a schedule, add the booking date too.')
          : code.includes('workspace_access_denied')
            ? (props.locale === 'es' ? 'No tienes permisos para crear bookings en este workspace.' : 'You do not have permission to create bookings in this workspace.')
            : (props.locale === 'es' ? 'No he podido crear el booking. Revisa los datos e inténtalo de nuevo.' : 'I could not create the booking. Review the details and try again.')
  } finally {
    submitting.value = false
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="cue-capture-backdrop" @click.self="close">
      <aside class="cue-capture" role="dialog" aria-modal="true" :aria-labelledby="'cue-capture-title'">
        <header class="cue-capture__header">
          <div>
            <p>{{ text.eyebrow }}</p>
            <h2 id="cue-capture-title">{{ text.title }}</h2>
            <span>{{ text.intro }}</span>
          </div>
          <button type="button" aria-label="Cerrar" @click="close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>
          </button>
        </header>

        <form class="cue-capture__form" @submit.prevent="submit">
          <fieldset class="cue-capture__channel">
            <legend>{{ text.channel }}</legend>
            <button v-for="option in sourceOptions" :key="option.value" type="button" :class="{ active: source === option.value }" @click="source = option.value">{{ option.label }}</button>
          </fieldset>

          <section class="cue-capture__tell">
            <div class="cue-capture__tell-head">
              <strong>{{ text.note }}</strong>
              <small>{{ locale === 'es' ? 'Habla o escribe. Cuebooker intentará extraer los datos.' : 'Speak or type. Cuebooker will try to extract the details.' }}</small>
            </div>
            <textarea v-model="initialNote" rows="4" :placeholder="text.notePlaceholder" />
            <div class="cue-capture__smart-actions">
              <CueVoiceInput ref="voiceInput" v-model="initialNote" :locale="locale" @captured="onVoiceCaptured" @audio-captured="onAudioCaptured" />
              <div class="cue-capture__interpret">
                <div class="cue-capture__interpret-head">
                  <button type="button" :disabled="!initialNote.trim() || analyzing" @click="interpretNote">{{ analyzing ? (locale === 'es' ? 'Analizando…' : 'Analysing…') : 'Smart Capture' }}</button>
                  <CuePlanBadge v-if="!canEntitlement('capture.smart_extended')" entitlement="capture.smart_extended" />
                </div>
                <p>{{ locale === 'es' ? 'Una sola captura para voz o texto. Revisa siempre antes de aplicar.' : 'One capture flow for voice or text. Always review before applying.' }}</p>
                <small v-if="!canEntitlement('capture.smart_extended')" class="cue-capture__commercial-note">
                  {{ locale === 'es'
                    ? 'Free incluye una cuota mensual de Smart Capture. Artist Pro amplía esta capacidad.'
                    : 'Free includes a monthly Smart Capture allowance. Artist Pro extends this capacity.' }}
                </small>
                <p v-if="interpretationMessage" aria-live="polite">{{ interpretationMessage }}</p>
              </div>
            </div>
            <SmartCaptureReview
              v-if="smartResult"
              :result="smartResult"
              :locale="locale"
              @apply="applySmartResult"
              @discard="discardSmartResult"
            />

            <div v-if="nextMoveLabel" class="cue-capture__next">
              <label><span>{{ text.nextMove }}</span><input v-model="nextMoveLabel" maxlength="240"></label>
              <label><span>{{ locale === 'es' ? 'Cuándo' : 'When' }}</span><input v-model="nextMoveDueAt" type="datetime-local"></label>
            </div>
          </section>

          <section class="cue-capture__section">
            <div class="cue-capture__section-head">
              <strong>{{ text.who }}</strong>
              <div class="cue-capture__switch">
                <button v-if="contacts.length" type="button" :class="{ active: contactMode === 'existing' }" @click="contactMode = 'existing'">{{ text.existing }}</button>
                <button type="button" :class="{ active: contactMode === 'new' }" @click="contactMode = 'new'">{{ text.newContact }}</button>
              </div>
            </div>
            <select v-if="contactMode === 'existing'" v-model="existingContactId" :disabled="loadingOptions">
              <option value="">{{ text.chooseContact }}</option>
              <option v-for="contact in contacts" :key="contact.id" :value="contact.id">{{ contact.name }}{{ contact.email ? ` · ${contact.email}` : '' }}</option>
            </select>
            <div v-else class="cue-capture__grid cue-capture__grid--contact">
              <label><span>{{ text.name }}</span><input v-model="contactName" autocomplete="name"></label>
              <label><span>{{ text.contactEmail }}</span><input v-model="contactEmail" type="email" autocomplete="email"></label>
              <label v-if="moreOpen"><span>{{ text.phoneLabel }}</span><input v-model="contactPhone" type="tel" autocomplete="tel"></label>
            </div>
          </section>

          <section class="cue-capture__section">
            <div class="cue-capture__section-head">
              <strong>{{ text.withWho }}</strong>
              <div class="cue-capture__switch">
                <button v-if="counterparties.length" type="button" :class="{ active: counterpartyMode === 'existing' }" @click="counterpartyMode = 'existing'">{{ text.existingPlace }}</button>
                <button type="button" :class="{ active: counterpartyMode === 'new' }" @click="counterpartyMode = 'new'">{{ text.newPlace }}</button>
              </div>
            </div>
            <select v-if="counterpartyMode === 'existing'" v-model="existingCounterpartyId" :disabled="loadingOptions">
              <option value="">{{ text.choosePlace }}</option>
              <option v-for="party in counterparties" :key="party.id" :value="party.id">{{ party.name }}</option>
            </select>
            <div v-else class="cue-capture__grid cue-capture__grid--party">
              <label><span>{{ text.placeName }}</span><input v-model="counterpartyName"></label>
              <label><span>{{ text.type }}</span><select v-model="counterpartyKind"><option v-for="kind in kindOptions" :key="kind.value" :value="kind.value">{{ kind.label }}</option></select></label>
            </div>
          </section>


          <button class="cue-capture__more" type="button" @click="moreOpen = !moreOpen">{{ moreOpen ? text.less : text.more }} <span>{{ moreOpen ? '−' : '+' }}</span></button>

          <div v-if="moreOpen" class="cue-capture__details">
            <label><span>{{ text.event }}</span><input v-model="eventName"></label>
            <label><span>{{ text.date }}</span><input v-model="eventDate" type="date"></label>
            <label><span>{{ text.city }}</span><input v-model="city"></label>
            <label><span>{{ locale === 'es' ? 'País' : 'Country' }}</span><input v-model="countryCode" maxlength="2" placeholder="ES"></label>
            <label><span>{{ locale === 'es' ? 'Inicio' : 'Start' }}</span><input v-model="startTime" type="time"></label>
            <label><span>{{ locale === 'es' ? 'Fin' : 'End' }}</span><input v-model="endTime" type="time"></label>
            <label><span>{{ locale === 'es' ? 'Zona horaria' : 'Timezone' }}</span><input v-model="eventTimezone" placeholder="Europe/Madrid"></label>
            <label><span>{{ locale === 'es' ? 'Base del fee' : 'Fee basis' }}</span><input v-model="feeBasis" placeholder="event"></label>
            <label class="cue-capture__offer"><span>{{ text.offer }}</span><div><input v-model="offer" inputmode="decimal" placeholder="1200"><select v-model="currency"><option>EUR</option><option>GBP</option><option>USD</option></select></div></label>
          </div>

          <p v-if="errorMessage" class="cue-capture__error">{{ errorMessage }}</p>

          <footer class="cue-capture__actions">
            <button type="button" :disabled="submitting" @click="close">{{ text.cancel }}</button>
            <button class="cue-capture__save" type="submit" :disabled="submitting">{{ submitting ? text.saving : text.save }}</button>
          </footer>
        </form>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.cue-capture-backdrop { position: fixed; z-index: 90; inset: 0; display: flex; justify-content: flex-end; background: rgba(0,0,0,.68); backdrop-filter: blur(6px); }
.cue-capture { --capture-accent:var(--cue-accent,#ceff54); width: min(560px, 100%); height: 100dvh; overflow-y: auto; box-sizing: border-box; border-left: 1px solid var(--cue-border,#303030); background: var(--cue-surface,#0d0d0d); color: var(--cue-text,#f4f3ef); box-shadow: -30px 0 80px rgba(0,0,0,.45); }
.cue-capture__header { display: flex; justify-content: space-between; gap: 20px; padding: 26px 26px 22px; border-bottom: 1px solid #292929; }
.cue-capture__header p, .cue-capture legend, .cue-capture label > span { margin: 0; color: #a6a6a6; font: 700 9px/1.25 monospace; letter-spacing: .12em; text-transform: uppercase; }
.cue-capture__header p { color:color-mix(in srgb,var(--capture-accent) 82%,#a5a79d); }
.cue-capture__header h2 { margin: 9px 0 8px; font-size: clamp(2rem,5vw,3.6rem); line-height: .88; letter-spacing: -.045em; }
.cue-capture__header span { display: block; max-width: 420px; color: #999; font-size: 13px; line-height: 1.45; }
.cue-capture__header > button { display:grid; place-items:center; width:44px; height:44px; flex:0 0 44px; padding:0; border:1px solid var(--cue-border,#3a3a3a); border-radius:50%; background:var(--cue-raised,#141414); color:var(--cue-text,#fff); cursor:pointer; transition:border-color .16s ease,background .16s ease,transform .16s ease; }
.cue-capture__header > button:hover { border-color:color-mix(in srgb,var(--capture-accent) 45%,var(--cue-border,#3a3a3a)); }
.cue-capture__header > button:active { transform:scale(.96); }
.cue-capture__header > button:focus-visible { outline:2px solid color-mix(in srgb,var(--capture-accent) 78%,#d9ddd0); outline-offset:2px; }
.cue-capture__header svg { width:18px; height:18px; fill:none; stroke:currentColor; stroke-width:1.7; }
.cue-capture__form { display: grid; gap: 0; padding: 0 26px 28px; }
.cue-capture__channel { display: flex; flex-wrap: wrap; gap: 7px; margin: 0; padding: 22px 0; border: 0; border-bottom: 1px solid #292929; }
.cue-capture__channel legend { width: 100%; margin-bottom: 8px; }
.cue-capture__channel button, .cue-capture__switch button { min-height: 34px; padding: 0 11px; border: 1px solid #343434; background: transparent; color: #888; cursor: pointer; font: 700 10px/1 monospace; }
.cue-capture__channel button.active { border-color:color-mix(in srgb,var(--capture-accent) 58%,#343434); background:color-mix(in srgb,var(--capture-accent) 8%,#111); color:var(--capture-accent); }
.cue-capture__section { padding: 20px 0; border-bottom: 1px solid #292929; }
.cue-capture__section-head { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-bottom: 12px; }
.cue-capture__section-head > strong { font-size: 13px; }
.cue-capture__switch { display: flex; gap: 4px; }
.cue-capture__switch button { min-height: 28px; padding: 0 8px; font-size: 8px; }
.cue-capture__switch button.active { border-color: #777; color: #fff; background: #1c1c1c; }
.cue-capture input, .cue-capture select, .cue-capture textarea { width: 100%; box-sizing: border-box; border: 1px solid #343434; border-radius: 0; background: #111; color: #f4f3ef; font: inherit; outline: none; }
.cue-capture button:focus-visible,
.cue-capture input:focus-visible,
.cue-capture select:focus-visible,
.cue-capture textarea:focus-visible {
  outline:2px solid color-mix(in srgb,var(--capture-accent) 78%,#d9ddd0);
  outline-offset:2px;
}
.cue-capture input, .cue-capture select { min-height: 42px; padding: 0 11px; }
.cue-capture textarea { padding: 11px; resize: vertical; line-height: 1.45; }
.cue-capture input:focus, .cue-capture select:focus, .cue-capture textarea:focus { border-color:color-mix(in srgb,var(--capture-accent) 62%,#555); }
.cue-capture__grid { display: grid; gap: 8px; }
.cue-capture__grid--contact { grid-template-columns: 1fr 1fr; }
.cue-capture__grid--party { grid-template-columns: minmax(0,1.6fr) minmax(130px,.7fr); }
.cue-capture label { display: grid; gap: 6px; }
.cue-capture__tell { display:grid; gap:10px; padding:18px 0; border-bottom:1px solid #292929; }
.cue-capture__tell-head { display:grid; gap:4px; }
.cue-capture__tell-head strong { font-size:14px; }
.cue-capture__tell-head small { color:#8f8f8f; font-size:10px; line-height:1.4; }
.cue-capture__tell textarea { width:100%; min-height:96px; box-sizing:border-box; padding:12px; border:1px solid #3d3d3d; background:#111; color:#f4f3ef; resize:vertical; font:inherit; line-height:1.45; }
.cue-capture__smart-actions { display:flex; align-items:flex-start; gap:8px; flex-wrap:wrap; }
.cue-capture__interpret-head{display:flex;align-items:center;gap:8px}.cue-capture__commercial-note{display:block;color:#818181;font-size:9px;line-height:1.4}
.cue-capture__interpret { display:flex; align-items:center; gap:10px; margin-top:-4px; padding-bottom:10px; }
.cue-capture__interpret button { min-height:34px; padding:0 11px; border:1px solid color-mix(in srgb,var(--capture-accent) 28%,#353535); background:color-mix(in srgb,var(--capture-accent) 3%,transparent); color:color-mix(in srgb,var(--capture-accent) 78%,#b7b9b1); cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.cue-capture__interpret button:disabled { opacity:.35; cursor:not-allowed; }
.cue-capture__interpret p { margin:0; color:#929292; font-size:10px; line-height:1.35; }
.cue-capture__preview { display:grid; gap:10px; margin:0 0 12px; padding:12px; border:1px solid #3e4722; background:rgba(206,255,84,.035); }
.cue-capture__preview > p { margin:0; color:#b8b8b8; font-size:10px; line-height:1.4; }
.cue-capture__preview-items { display:flex; flex-wrap:wrap; gap:6px; }
.cue-capture__preview-items span { padding:6px 8px; border:1px solid #353923; color:#d6e7a2; font:700 9px/1.25 monospace; }
.cue-capture__preview-actions { display:flex; justify-content:flex-end; gap:7px; }
.cue-capture__preview-actions button { min-height:34px; padding:0 10px; border:1px solid #404040; background:transparent; color:#c6c6c6; cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.cue-capture__preview-actions button.apply { border-color:color-mix(in srgb,var(--capture-accent) 68%,#3a3a3a); background:color-mix(in srgb,var(--capture-accent) 12%,#141414); color:var(--capture-accent); }
.cue-capture__next { display:grid; grid-template-columns:minmax(0,1fr) minmax(150px,.6fr); gap:8px; padding:10px 12px; margin-bottom:10px; border-left:2px solid color-mix(in srgb,var(--capture-accent) 66%,#555); background:color-mix(in srgb,var(--capture-accent) 3%,transparent); }
.cue-capture__more { display: flex; justify-content: space-between; width: 100%; min-height: 40px; padding: 0; border: 0; border-bottom: 1px solid #292929; background: transparent; color: #bdbdbd; cursor: pointer; font-size: 11px; text-align: left; }
.cue-capture__more span { color:color-mix(in srgb,var(--capture-accent) 72%,#aaa); font-size:18px; }
.cue-capture__details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 18px 0 2px; }
.cue-capture__offer > div { display: grid; grid-template-columns: 1fr 78px; }
.cue-capture__offer select { border-left: 0; }
.cue-capture__error { margin: 14px 0 0; color: #ff9b9b; font-size: 11px; }
.cue-capture__actions { position: sticky; bottom: 0; display: grid; grid-template-columns: .7fr 1.3fr; gap: 8px; margin: 22px -26px -28px; padding: 14px 26px max(14px,env(safe-area-inset-bottom)); border-top: 1px solid #292929; background: rgba(13,13,13,.96); backdrop-filter: blur(10px); }
.cue-capture__actions button { min-height: 46px; border: 1px solid #383838; background: transparent; color: #f4f3ef; cursor: pointer; font-weight: 800; }
.cue-capture__actions .cue-capture__save { border-color:color-mix(in srgb,var(--capture-accent) 72%,#3a3a3a); background:color-mix(in srgb,var(--capture-accent) 86%,#d8ddd0); color:#0b0b0b; }
.cue-capture__actions button:disabled { opacity: .55; cursor: wait; }
@media (max-width: 640px) {
  .cue-capture-backdrop { align-items: flex-end; }
  .cue-capture { height: 100dvh; max-height: 100dvh; border-top: 1px solid #333; border-left: 0; }
  .cue-capture__header { position: sticky; top: 0; z-index: 4; padding: max(18px, env(safe-area-inset-top)) 16px 15px; background: color-mix(in srgb,var(--cue-surface,#0d0d0d) 97%,transparent); backdrop-filter: blur(12px); }
  .cue-capture__header h2 { font-size: 2.35rem; }
  .cue-capture__form { padding: 0 16px 20px; }
  .cue-capture__channel { padding: 16px 0; gap: 5px; }
  .cue-capture__channel button { min-height:44px; padding:0 10px; font-size:9px; }
  .cue-capture__switch button,
  .cue-capture__interpret button,
  .cue-capture__preview-actions button { min-height:44px; }
  .cue-capture__section { padding: 15px 0; }
  .cue-capture__tell { padding:16px 0; }
  .cue-capture__smart-actions { display:grid; grid-template-columns:1fr; }
  .cue-capture__interpret { margin-top:0; }
  .cue-capture__grid--contact, .cue-capture__grid--party, .cue-capture__details, .cue-capture__next { grid-template-columns: 1fr; }
  .cue-capture__actions { margin: 18px -16px -20px; padding-right: 16px; padding-left: 16px; }
}
</style>
