<script setup lang="ts">
import type { CoreBooking } from '../domain/bookingCore'

const props = defineProps<{
  workspaceId: string
  booking: CoreBooking
  locale: 'es' | 'en'
}>()

const emit = defineEmits<{ saved: [booking: CoreBooking] }>()
const bookingCore = useBookingCore()
const open = ref(false)
const saving = ref(false)
const errorMessage = ref('')

const form = reactive({
  eventName: '',
  venueName: '',
  city: '',
  countryCode: '',
  eventDate: '',
  startTime: '',
  endTime: '',
  eventTimezone: '',
  offer: '',
  currency: 'EUR',
  feeBasis: ''
})

const copy = computed(() => props.locale === 'es' ? {
  edit: 'Editar booking',
  title: 'Completar booking',
  event: 'Evento', venue: 'Sala', city: 'Ciudad', country: 'País', date: 'Fecha', start: 'Inicio', end: 'Fin', timezone: 'Zona horaria', offer: 'Oferta', currency: 'Moneda', feeBasis: 'Base del fee',
  cancel: 'Cancelar', save: 'Guardar cambios', saving: 'Guardando…', invalidOffer: 'La oferta no es válida.', error: 'No se ha podido actualizar el booking.'
} : {
  edit: 'Edit booking',
  title: 'Complete booking',
  event: 'Event', venue: 'Venue', city: 'City', country: 'Country', date: 'Date', start: 'Start', end: 'End', timezone: 'Timezone', offer: 'Offer', currency: 'Currency', feeBasis: 'Fee basis',
  cancel: 'Cancel', save: 'Save changes', saving: 'Saving…', invalidOffer: 'The offer is not valid.', error: 'The booking could not be updated.'
})

function syncForm() {
  form.eventName = props.booking.event_name || ''
  form.venueName = props.booking.venue_name || ''
  form.city = props.booking.city || ''
  form.countryCode = props.booking.country_code || ''
  form.eventDate = props.booking.event_date || ''
  form.startTime = props.booking.start_time?.slice(0, 5) || ''
  form.endTime = props.booking.end_time?.slice(0, 5) || ''
  form.eventTimezone = props.booking.event_timezone || ''
  form.offer = props.booking.offer_amount_minor == null ? '' : String(props.booking.offer_amount_minor / 100)
  form.currency = props.booking.currency || 'EUR'
  form.feeBasis = props.booking.fee_basis || ''
  errorMessage.value = ''
}

watch(() => props.booking.id, syncForm, { immediate: true })
watch(() => props.booking.updated_at, () => { if (!open.value) syncForm() })

function parseOffer() {
  const value = form.offer.trim().replace(',', '.')
  if (!value) return null
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < 0) return NaN
  return Math.round(amount * 100)
}

function show() {
  syncForm()
  open.value = true
}

function close() {
  if (saving.value) return
  open.value = false
  errorMessage.value = ''
}

async function save() {
  const offerAmountMinor = parseOffer()
  if (Number.isNaN(offerAmountMinor)) {
    errorMessage.value = copy.value.invalidOffer
    return
  }

  saving.value = true
  errorMessage.value = ''
  try {
    const updated = await bookingCore.updateBookingDetails({
      workspaceId: props.workspaceId,
      bookingId: props.booking.id,
      eventName: form.eventName,
      venueName: form.venueName,
      city: form.city,
      countryCode: form.countryCode,
      eventDate: form.eventDate || null,
      startTime: form.startTime || null,
      endTime: form.endTime || null,
      eventTimezone: form.eventTimezone,
      offerAmountMinor,
      currency: offerAmountMinor == null ? null : form.currency,
      feeBasis: form.feeBasis
    })
    open.value = false
    emit('saved', updated)
  } catch (error: any) {
    const code = error?.message || ''
    errorMessage.value = code === 'booking_time_requires_date'
      ? (props.locale === 'es' ? 'Añade una fecha antes de indicar horario.' : 'Add a date before setting a schedule.')
      : code === 'invalid_booking_time_range'
        ? (props.locale === 'es' ? 'La hora de fin debe ser posterior al inicio.' : 'End time must be after start time.')
        : code || copy.value.error
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="booking-editor-entry">
    <button class="booking-editor-entry__button" type="button" @click="show">{{ copy.edit }}</button>
    <div v-if="open" class="booking-editor-backdrop" @click.self="close">
      <form class="booking-editor" role="dialog" aria-modal="true" @submit.prevent="save">
        <header><div><span>CUE / BOOKING</span><h3>{{ copy.title }}</h3></div><button type="button" aria-label="Close" @click="close">×</button></header>
        <div class="booking-editor__grid">
          <label><span>{{ copy.event }}</span><input v-model="form.eventName"></label>
          <label><span>{{ copy.venue }}</span><input v-model="form.venueName"></label>
          <label><span>{{ copy.city }}</span><input v-model="form.city"></label>
          <label><span>{{ copy.country }}</span><input v-model="form.countryCode" maxlength="2" placeholder="ES"></label>
          <label><span>{{ copy.date }}</span><input v-model="form.eventDate" type="date"></label>
          <label><span>{{ copy.start }}</span><input v-model="form.startTime" type="time"></label>
          <label><span>{{ copy.end }}</span><input v-model="form.endTime" type="time"></label>
          <label><span>{{ copy.timezone }}</span><input v-model="form.eventTimezone" placeholder="Europe/Madrid"></label>
          <label class="booking-editor__offer"><span>{{ copy.offer }}</span><div><input v-model="form.offer" inputmode="decimal" placeholder="1200"><input v-model="form.currency" maxlength="3" placeholder="EUR"></div></label>
          <label><span>{{ copy.feeBasis }}</span><input v-model="form.feeBasis" placeholder="event"></label>
        </div>
        <p v-if="errorMessage" class="booking-editor__error">{{ errorMessage }}</p>
        <footer><button type="button" :disabled="saving" @click="close">{{ copy.cancel }}</button><button class="primary" type="submit" :disabled="saving">{{ saving ? copy.saving : copy.save }}</button></footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.booking-editor-entry__button { min-height:34px; padding:0 11px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.booking-editor-backdrop { position:fixed; z-index:95; inset:0; display:grid; place-items:center; padding:18px; background:rgba(0,0,0,.72); backdrop-filter:blur(4px); }
.booking-editor { width:min(720px,100%); max-height:90dvh; overflow:auto; border:1px solid var(--cue-border); background:var(--cue-surface); color:var(--cue-text); }
.booking-editor > header { display:flex; justify-content:space-between; gap:16px; padding:18px 20px; border-bottom:1px solid var(--cue-border); }
.booking-editor header span { color:var(--cue-accent); font:700 9px monospace; letter-spacing:.1em; }
.booking-editor h3 { margin:5px 0 0; font-size:22px; }
.booking-editor header button { border:0; background:transparent; color:var(--cue-text); cursor:pointer; font-size:24px; }
.booking-editor__grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; padding:20px; }
.booking-editor label > span { display:block; margin-bottom:5px; color:var(--cue-muted); font:700 8px monospace; text-transform:uppercase; }
.booking-editor input { width:100%; min-height:38px; box-sizing:border-box; border:1px solid var(--cue-border); background:var(--cue-raised); color:var(--cue-text); padding:0 10px; }
.booking-editor__offer > div { display:grid; grid-template-columns:1fr 80px; gap:7px; }
.booking-editor__error { margin:0 20px 14px; color:#ff7c7c; font-size:11px; }
.booking-editor footer { display:flex; justify-content:flex-end; gap:8px; padding:14px 20px; border-top:1px solid var(--cue-border); }
.booking-editor footer button { min-height:38px; padding:0 14px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.booking-editor footer .primary { border-color:var(--cue-accent); background:var(--cue-accent); color:#080808; }
@media (max-width:620px) { .booking-editor-backdrop { align-items:end; padding:0; } .booking-editor { width:100%; max-height:92dvh; border-width:1px 0 0; } .booking-editor__grid { grid-template-columns:1fr; padding:16px; } }
</style>
