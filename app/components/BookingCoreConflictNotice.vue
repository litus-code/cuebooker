<script setup lang="ts">
import type { CoreBooking, Hold } from '../domain/bookingCore'
import type { AvailabilityBlock } from '../composables/useAvailability'
import { intervalForDate, intervalsOverlap, timeToMinutes } from '../services/timeOverlap'
import { holdMatchesBookingSchedule } from '../services/bookingHoldAlignment'

const props = defineProps<{
  workspaceId: string
  booking: CoreBooking
  bookings: CoreBooking[]
  locale: 'es' | 'en'
  refreshKey?: number
}>()

const bookingCore = useBookingCore()
const availability = useAvailability()
const holds = ref<Hold[]>([])
const blocks = ref<AvailabilityBlock[]>([])
const loading = ref(false)

const copy = computed(() => props.locale === 'es' ? {
  title: 'Posible solape',
  body: 'Hay otra ocupación para esta fecha. Revísala antes de confirmar.',
  reviewTitle: 'Revisar agenda',
  reviewBody: 'Hay un Hold de este booking que ya no coincide con su fecha u horario. Revísalo antes de seguir.',
  combinedBody: 'Hay un Hold de este booking desalineado y además otra ocupación que puede solaparse.',
  booking: 'Booking', hold: 'Hold', availability: 'Disponibilidad',
  ownHold: 'Hold de este booking',
  allDay: 'Mismo día', loading: 'Comprobando agenda…'
} : {
  title: 'Possible conflict',
  body: 'There is another commitment on this date. Review it before confirming.',
  reviewTitle: 'Review schedule',
  reviewBody: 'This booking has a Hold that no longer matches its date or schedule. Review it before continuing.',
  combinedBody: 'This booking has a misaligned Hold and another commitment may also overlap.',
  booking: 'Booking', hold: 'Hold', availability: 'Availability',
  ownHold: 'This booking Hold',
  allDay: 'Same day', loading: 'Checking schedule…'
})

function isoDate(value: string | null | undefined) {
  return value?.slice(0, 10) || ''
}

function isoTime(value: string | null | undefined) {
  return value?.slice(11, 16) || null
}

function overlapsTimedRange(
  ownStart: number | null,
  ownEnd: number | null,
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  date: string
) {
  if (!startsAt || !endsAt) return true
  const interval = intervalForDate(startsAt, endsAt, date)
  if (!interval) return false
  return intervalsOverlap(ownStart, ownEnd, interval.start, interval.end)
}

const mismatchedOwnHolds = computed(() => {
  if (props.booking.archived_at) return []
  return holds.value.filter(hold =>
    hold.booking_id === props.booking.id
    && hold.status === 'active'
    && !holdMatchesBookingSchedule(props.booking, hold)
  )
})

const noticeTitle = computed(() => mismatchedOwnHolds.value.length ? copy.value.reviewTitle : copy.value.title)
const noticeBody = computed(() => {
  if (mismatchedOwnHolds.value.length && conflicts.value.length) return copy.value.combinedBody
  if (mismatchedOwnHolds.value.length) return copy.value.reviewBody
  return copy.value.body
})

const conflicts = computed(() => {
  const date = props.booking.event_date
  if (!date || props.booking.archived_at) return []
  const ownStart = timeToMinutes(props.booking.start_time)
  const ownEnd = timeToMinutes(props.booking.end_time)
  const rows: Array<{ id: string; kind: 'booking' | 'hold' | 'availability'; label: string; detail: string }> = []

  for (const booking of props.bookings) {
    if (booking.id === props.booking.id || booking.archived_at || booking.event_date !== date) continue
    if (booking.status === 'rejected' || booking.status === 'cancelled') continue
    if (!intervalsOverlap(ownStart, ownEnd, timeToMinutes(booking.start_time), timeToMinutes(booking.end_time))) continue
    rows.push({
      id: `booking-${booking.id}`,
      kind: 'booking',
      label: booking.venue_name || booking.event_name || copy.value.booking,
      detail: booking.start_time && booking.end_time ? `${booking.start_time.slice(0, 5)}–${booking.end_time.slice(0, 5)}` : copy.value.allDay
    })
  }

  for (const hold of holds.value) {
    if (hold.booking_id === props.booking.id || hold.status !== 'active' || hold.event_date !== date) continue
    if (!overlapsTimedRange(ownStart, ownEnd, hold.starts_at, hold.ends_at, date)) continue
    rows.push({
      id: `hold-${hold.id}`,
      kind: 'hold',
      label: copy.value.hold,
      detail: hold.starts_at && hold.ends_at ? `${isoTime(hold.starts_at)}–${isoTime(hold.ends_at)}` : copy.value.allDay
    })
  }

  for (const block of blocks.value) {
    if (!overlapsTimedRange(ownStart, ownEnd, block.starts_at, block.ends_at, date)) continue
    rows.push({
      id: `availability-${block.id}`,
      kind: 'availability',
      label: block.label || copy.value.availability,
      detail: `${isoDate(block.starts_at) === date ? (isoTime(block.starts_at) || '00:00') : '00:00'}–${isoDate(block.ends_at) === date ? (isoTime(block.ends_at) || '24:00') : '24:00'}`
    })
  }

  return rows
})

async function load() {
  const date = props.booking.event_date
  if (!props.workspaceId || !props.booking.artist_id) {
    holds.value = []
    blocks.value = []
    return
  }
  loading.value = true
  try {
    const holdPromise = bookingCore.listHolds(props.workspaceId, undefined, true)
    const blockPromise = date
      ? (() => {
          const from = `${date}T00:00:00`
          const next = new Date(`${date}T12:00:00Z`)
          next.setUTCDate(next.getUTCDate() + 1)
          const to = `${next.toISOString().slice(0, 10)}T00:00:00`
          return availability.listBlocks(props.booking.artist_id, from, to)
        })()
      : Promise.resolve([] as AvailabilityBlock[])

    const [holdRows, blockRows] = await Promise.all([holdPromise, blockPromise])
    holds.value = holdRows
    blocks.value = blockRows
  } catch {
    holds.value = []
    blocks.value = []
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.booking.id, props.booking.event_date, props.booking.start_time, props.booking.end_time, props.refreshKey],
  load,
  { immediate: true }
)
</script>

<template>
  <section v-if="loading || conflicts.length || mismatchedOwnHolds.length" class="booking-conflicts" :class="{ 'booking-conflicts--loading': loading && !conflicts.length && !mismatchedOwnHolds.length }">
    <div class="booking-conflicts__intro">
      <strong>{{ loading && !conflicts.length && !mismatchedOwnHolds.length ? copy.loading : noticeTitle }}</strong>
      <p v-if="conflicts.length || mismatchedOwnHolds.length">{{ noticeBody }}</p>
    </div>
    <div v-if="mismatchedOwnHolds.length || conflicts.length" class="booking-conflicts__items">
      <article v-for="hold in mismatchedOwnHolds" :key="`own-hold-${hold.id}`">
        <span>{{ copy.ownHold }}</span>
        <strong>{{ hold.event_date }}{{ hold.starts_at ? ` · ${isoTime(hold.starts_at) || ''}${hold.ends_at ? `–${isoTime(hold.ends_at) || ''}` : ''}` : '' }}</strong>
        <small>{{ hold.expires_at ? `${props.locale === 'es' ? 'Caduca' : 'Expires'} ${hold.expires_at.slice(0, 16).replace('T', ' ')}` : copy.allDay }}</small>
      </article>
      <article v-for="conflict in conflicts" :key="conflict.id">
        <span>{{ copy[conflict.kind] }}</span>
        <strong>{{ conflict.label }}</strong>
        <small>{{ conflict.detail }}</small>
      </article>
    </div>
  </section>
</template>

<style scoped>
.booking-conflicts { margin:14px 0 0; padding:12px; border:1px solid color-mix(in srgb, #ffb84d 52%, var(--cue-border)); background:color-mix(in srgb, #ffb84d 7%, var(--cue-surface)); }
.booking-conflicts__intro { display:flex; align-items:baseline; justify-content:space-between; gap:18px; }
.booking-conflicts__intro > strong { font:800 10px monospace; letter-spacing:.08em; text-transform:uppercase; color:#ffb84d; }
.booking-conflicts__intro p { margin:0; color:var(--cue-muted); font-size:11px; }
.booking-conflicts__items { display:grid; gap:6px; margin-top:10px; }
.booking-conflicts__items article { display:grid; grid-template-columns:90px minmax(0,1fr) auto; align-items:center; gap:10px; padding:8px 0; border-top:1px solid var(--cue-border); }
.booking-conflicts__items span, .booking-conflicts__items small { color:var(--cue-muted); font:700 9px monospace; text-transform:uppercase; }
.booking-conflicts__items strong { font-size:11px; }
@media (max-width:760px) {
  .booking-conflicts__intro { display:block; }
  .booking-conflicts__intro p { margin-top:5px; }
  .booking-conflicts__items article { grid-template-columns:70px minmax(0,1fr); }
  .booking-conflicts__items small { grid-column:2; }
}
</style>
