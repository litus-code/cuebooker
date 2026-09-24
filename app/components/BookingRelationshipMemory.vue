<script setup lang="ts">
import type { CoreBooking } from '../domain/bookingCore'
import { deriveRelationshipMemory } from '../services/relationshipMemory'

const props = defineProps<{
  workspaceId: string
  booking: CoreBooking
  bookings: CoreBooking[]
  contactName?: string | null
  counterpartyName?: string | null
  locale: 'es' | 'en'
}>()

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'HISTORIAL CON',
  first: '',
  firstBody: '',
  together: 'Bookings juntos',
  bookings: 'bookings',
  confirmed: 'confirmados',
  lastDate: 'Última fecha',
  lastFee: 'Último caché',
  cities: 'Ciudades',
  noDate: 'Sin fecha previa',
  noFee: 'Sin caché previo'
} : {
  eyebrow: 'HISTORY WITH',
  first: '',
  firstBody: '',
  together: 'Bookings together',
  bookings: 'bookings',
  confirmed: 'confirmed',
  lastDate: 'Last date',
  lastFee: 'Last fee',
  cities: 'Cities',
  noDate: 'No previous date',
  noFee: 'No previous fee'
})

const bookingCore = useBookingCore()
const relationshipRows = ref<CoreBooking[]>([])
const relationshipLoaded = ref(false)

const relationshipName = computed(() => props.counterpartyName || props.contactName || props.booking.venue_name || props.booking.event_name || '—')
const memorySource = computed(() => relationshipLoaded.value ? relationshipRows.value : props.bookings)
const memory = computed(() => deriveRelationshipMemory(props.booking, memorySource.value))

async function loadRelationship() {
  relationshipLoaded.value = false
  relationshipRows.value = []
  if (!props.workspaceId || (!props.booking.counterparty_id && !props.booking.primary_contact_id)) {
    relationshipLoaded.value = true
    relationshipRows.value = [props.booking]
    return
  }
  try {
    const rows = await bookingCore.listRelationshipBookings(
      props.workspaceId,
      props.booking.artist_id,
      props.booking.counterparty_id,
      props.booking.primary_contact_id,
      200
    )
    relationshipRows.value = rows.some(item => item.id === props.booking.id)
      ? rows
      : [props.booking, ...rows]
  } catch {
    relationshipRows.value = props.bookings
  } finally {
    relationshipLoaded.value = true
  }
}

watch(
  () => [
    props.workspaceId,
    props.booking.id,
    props.booking.artist_id,
    props.booking.counterparty_id,
    props.booking.primary_contact_id
  ],
  () => { void loadRelationship() },
  { immediate: true }
)
const previousBookings = computed(() => memory.value.previousBookings)
const relationshipBookings = computed(() => memory.value.relationshipBookings)
const confirmedCount = computed(() => memory.value.confirmedCount)
const lastPreviousBooking = computed(() => memory.value.lastPreviousBooking)
const lastFeeBooking = computed(() => memory.value.lastConfirmedFeeBooking)
const cities = computed(() => memory.value.cities)

function formatDate(booking: CoreBooking | null) {
  if (!booking?.event_date) return copy.value.noDate
  return new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
  }).format(new Date(`${booking.event_date}T12:00:00Z`))
}

function formatFee(booking: CoreBooking | null) {
  if (!booking || booking.offer_amount_minor == null || !booking.currency) return copy.value.noFee
  return new Intl.NumberFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
    style: 'currency', currency: booking.currency, maximumFractionDigits: 2
  }).format(booking.offer_amount_minor / 100)
}
</script>

<template>
  <section v-if="previousBookings.length" class="relationship-memory">
    <div class="relationship-memory__heading">
      <div>
        <span>{{ copy.eyebrow }}</span>
        <strong>{{ relationshipName }}</strong>
      </div>
      <b>{{ relationshipBookings.length }}</b>
    </div>

    <div class="relationship-memory__grid">
      <div><span>{{ copy.together }}</span><strong>{{ relationshipBookings.length }} {{ copy.bookings }}</strong></div>
      <div><span>{{ copy.confirmed }}</span><strong>{{ confirmedCount }}</strong></div>
      <div><span>{{ copy.lastDate }}</span><strong>{{ formatDate(lastPreviousBooking) }}</strong></div>
      <div><span>{{ copy.lastFee }}</span><strong>{{ formatFee(lastFeeBooking) }}</strong></div>
    </div>

    <p v-if="cities.length" class="relationship-memory__cities"><span>{{ copy.cities }}</span>{{ cities.join(' · ') }}</p>
  </section>
</template>

<style scoped>
.relationship-memory { margin:16px 0; border:1px solid var(--cue-border); background:color-mix(in srgb,var(--cue-raised) 55%,transparent); }
.relationship-memory__heading { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; border-bottom:1px solid var(--cue-border); }
.relationship-memory__heading span { display:block; color:var(--cue-accent); font:700 8px/1.2 monospace; letter-spacing:.11em; }
.relationship-memory__heading strong { display:block; margin-top:4px; font-size:13px; }
.relationship-memory__heading b { color:var(--cue-muted); font:700 10px monospace; }
.relationship-memory__first { padding:14px; }
.relationship-memory__first strong { font-size:12px; }
.relationship-memory__first p { max-width:620px; margin:5px 0 0; color:var(--cue-muted); font-size:11px; line-height:1.45; }
.relationship-memory__grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); }
.relationship-memory__grid > div { min-width:0; padding:12px 14px; border-right:1px solid var(--cue-border); }
.relationship-memory__grid > div:last-child { border-right:0; }
.relationship-memory__grid span, .relationship-memory__cities span { display:block; margin-bottom:5px; color:var(--cue-muted); font:700 8px monospace; text-transform:uppercase; letter-spacing:.08em; }
.relationship-memory__grid strong { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; }
.relationship-memory__cities { margin:0; padding:10px 14px; border-top:1px solid var(--cue-border); color:var(--cue-text); font-size:11px; }
@media (max-width:760px) {
  .relationship-memory__grid { grid-template-columns:1fr 1fr; }
  .relationship-memory__grid > div:nth-child(2) { border-right:0; }
  .relationship-memory__grid > div:nth-child(-n+2) { border-bottom:1px solid var(--cue-border); }
}
</style>