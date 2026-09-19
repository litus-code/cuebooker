<script setup lang="ts">
import type { Activity, CoreBooking, Hold, NextMove } from '../domain/bookingCore'
import type { CueNotification } from '../domain/notification'
import { deriveBookingAttentionSignals, deriveEmailDeliveryAttentionSignals, type BookingAttentionSignalKind } from '../services/bookingAttention'

const props = defineProps<{
  workspaceId: string
  bookings: CoreBooking[]
  locale: 'es' | 'en'
  refreshKey?: number
}>()

const emit = defineEmits<{ changed: []; openBookings: []; openBooking: [bookingId: string] }>()
const bookingCore = useBookingCore()
const notificationApi = useNotifications()
const nextMoves = ref<NextMove[]>([])
const holds = ref<Hold[]>([])
const activities = ref<Activity[]>([])
const notificationItems = ref<CueNotification[]>([])
const emailMessages = ref<import('../services/bookingCoreApi').BookingEmailMessage[]>([])
const loading = ref(false)
const workingId = ref('')
const ATTENTION_WINDOW_MS = 48 * 60 * 60 * 1000

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'QUÉ NECESITA TU ATENCIÓN',
  title: 'Lo siguiente, sin perder el hilo',
  next: 'Próxima acción',
  hold: 'Hold',
  done: 'Hecho',
  release: 'Liberar',
  open: 'Abrir booking',
  overdue: 'Vencida',
  expiredHold: 'Hold caducado',
  today: 'Hoy',
  reply: 'Respuesta',
  newBooking: 'Nuevo booking',
  waiting: 'Seguimiento',
  delivery: 'Email',
  replyTitle: 'Tienes una respuesta nueva',
  newBookingTitle: 'Revisar nuevo booking',
  waitingTitle: 'Lleva 3 días esperando respuesta',
  deliveryTitle: 'Un email no ha llegado',
  openAction: 'Abrir',
  noItems: 'No hay nada urgente ahora mismo.', browse: 'Ver bookings',
  noDate: 'Sin fecha',
  expires: 'Caduca'
} : {
  eyebrow: 'WHAT NEEDS YOUR ATTENTION',
  title: 'What comes next, without losing context',
  next: 'Next action',
  hold: 'Hold',
  done: 'Done',
  release: 'Release',
  open: 'Open booking',
  overdue: 'Overdue',
  expiredHold: 'Expired hold',
  today: 'Today',
  reply: 'Reply',
  newBooking: 'New booking',
  waiting: 'Follow-up',
  delivery: 'Email',
  replyTitle: 'You have a new reply',
  newBookingTitle: 'Review new booking',
  waitingTitle: 'Waiting for a reply for 3 days',
  deliveryTitle: 'An email was not delivered',
  openAction: 'Open',
  noItems: 'Nothing urgent right now.', browse: 'View bookings',
  noDate: 'No date',
  expires: 'Expires'
})

const items = computed(() => {
  const rows: Array<{
    id: string
    kind: 'next' | 'hold' | BookingAttentionSignalKind
    bookingId: string
    title: string
    meta: string
    sortAt: number
    actionLabel: string | null
    urgency: 'overdue' | 'today' | 'normal' | 'attention'
    rank: number
  }> = []

  for (const move of nextMoves.value) {
    const booking = props.bookings.find(item => item.id === move.booking_id)
    const urgency = urgencyFor(move.due_at)
    const dueTime = move.due_at ? new Date(move.due_at).getTime() : null
    if (dueTime && urgency === 'normal' && dueTime > Date.now() + ATTENTION_WINDOW_MS) continue

    rows.push({
      id: move.id,
      kind: 'next',
      bookingId: move.booking_id,
      title: move.label,
      meta: [booking?.venue_name || booking?.event_name || copy.value.noDate, move.due_at ? formatDateTime(move.due_at) : ''].filter(Boolean).join(' · '),
      sortAt: dueTime ?? Number.MAX_SAFE_INTEGER - 1,
      actionLabel: copy.value.done,
      urgency,
      rank: urgency === 'overdue' ? 0 : urgency === 'today' ? 3 : 5
    })
  }

  for (const hold of holds.value) {
    if (!hold.expires_at) continue
    const booking = props.bookings.find(item => item.id === hold.booking_id)
    const urgency = urgencyFor(hold.expires_at)
    const expiryTime = new Date(hold.expires_at).getTime()
    if (urgency === 'normal' && expiryTime > Date.now() + ATTENTION_WINDOW_MS) continue

    rows.push({
      id: hold.id,
      kind: 'hold',
      bookingId: hold.booking_id,
      title: `${copy.value.hold}: ${booking?.venue_name || booking?.event_name || copy.value.noDate}`,
      meta: [formatDateOnly(hold.event_date), `${copy.value.expires} ${formatDateTime(hold.expires_at)}`, hold.priority ? `P${hold.priority}` : ''].filter(Boolean).join(' · '),
      sortAt: expiryTime,
      actionLabel: copy.value.release,
      urgency,
      rank: urgency === 'overdue' ? 0 : urgency === 'today' ? 3 : 5
    })
  }

  for (const notification of notificationItems.value) {
    if (notification.read_at) continue
    const booking = props.bookings.find(item => item.id === notification.booking_id)
    if (!booking || booking.archived_at) continue
    const kind: BookingAttentionSignalKind = notification.kind === 'promoter_reply_received'
      ? 'reply_received'
      : 'new_booking'
    const context = booking.venue_name || booking.event_name || copy.value.noDate
    rows.push({
      id: `notification-${notification.id}`,
      kind,
      bookingId: booking.id,
      title: kind === 'reply_received' ? copy.value.replyTitle : copy.value.newBookingTitle,
      meta: [context, formatDateTime(notification.created_at)].filter(Boolean).join(' · '),
      sortAt: new Date(notification.created_at).getTime(),
      actionLabel: null,
      urgency: 'attention',
      rank: kind === 'reply_received' ? 1 : 2
    })
  }

  for (const signal of deriveEmailDeliveryAttentionSignals(props.bookings, emailMessages.value)) {
    const booking = props.bookings.find(item => item.id === signal.bookingId)
    const context = booking?.venue_name || booking?.event_name || copy.value.noDate
    rows.push({
      id: signal.id,
      kind: signal.kind,
      bookingId: signal.bookingId,
      title: copy.value.deliveryTitle,
      meta: [context, formatDateTime(signal.occurredAt)].filter(Boolean).join(' · '),
      sortAt: new Date(signal.occurredAt).getTime(),
      actionLabel: null,
      urgency: 'attention',
      rank: 1
    })
  }

  for (const signal of deriveBookingAttentionSignals(props.bookings, activities.value)) {
    if (signal.kind !== 'stale_waiting') continue
    const booking = props.bookings.find(item => item.id === signal.bookingId)
    const context = booking?.venue_name || booking?.event_name || copy.value.noDate
    rows.push({
      id: signal.id,
      kind: signal.kind,
      bookingId: signal.bookingId,
      title: copy.value.waitingTitle,
      meta: [context, formatDateTime(signal.occurredAt)].filter(Boolean).join(' · '),
      sortAt: new Date(signal.occurredAt).getTime(),
      actionLabel: null,
      urgency: 'attention',
      rank: 4
    })
  }

  const sorted = rows.sort((a, b) => {
    const rankDelta = a.rank - b.rank
    if (rankDelta !== 0) return rankDelta
    if (a.kind === 'reply_received' || a.kind === 'new_booking' || a.kind === 'delivery_failed') return b.sortAt - a.sortAt
    return a.sortAt - b.sortAt
  })

  const seenBookings = new Set<string>()
  return sorted
    .filter(item => {
      if (seenBookings.has(item.bookingId)) return false
      seenBookings.add(item.bookingId)
      return true
    })
    .slice(0, 8)
})

function urgencyFor(value: string | null) {
  if (!value) return 'normal' as const
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return 'normal' as const
  const now = new Date()
  if (target.getTime() < now.getTime()) return 'overdue' as const
  if (
    target.getFullYear() === now.getFullYear()
    && target.getMonth() === now.getMonth()
    && target.getDate() === now.getDate()
  ) return 'today' as const
  return 'normal' as const
}

function kindLabel(kind: (typeof items.value)[number]['kind']) {
  if (kind === 'next') return copy.value.next
  if (kind === 'hold') return copy.value.hold
  if (kind === 'reply_received') return copy.value.reply
  if (kind === 'new_booking') return copy.value.newBooking
  if (kind === 'delivery_failed') return copy.value.delivery
  return copy.value.waiting
}

function urgencyLabel(item: (typeof items.value)[number]) {
  if (item.urgency === 'overdue') return item.kind === 'hold' ? copy.value.expiredHold : copy.value.overdue
  if (item.urgency === 'today') return copy.value.today
  return ''
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(new Date(value))
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(`${value}T12:00:00`))
}

async function load() {
  if (!props.workspaceId) return
  loading.value = true
  try {
    const bookingIds = props.bookings.map(item => item.id)
    const [moves, holdRows, activityRows, notifications, deliveryRows] = await Promise.all([
      bookingCore.listNextMoves(props.workspaceId, undefined, true),
      bookingCore.listHolds(props.workspaceId, undefined, true),
      bookingCore.listWorkspaceActivities(props.workspaceId, bookingIds, 500),
      notificationApi.list(100),
      bookingCore.listWorkspaceBookingEmailMessages(props.workspaceId, bookingIds)
    ])
    nextMoves.value = moves
    holds.value = holdRows
    activities.value = activityRows
    emailMessages.value = deliveryRows
    notificationItems.value = notifications.filter(item =>
      item.workspace_id === props.workspaceId
      && bookingIds.includes(item.booking_id)
      && !item.read_at
    )
  } finally {
    loading.value = false
  }
}

watch(() => props.workspaceId, load, { immediate: true })
watch(() => props.bookings.length, load)
watch(() => props.refreshKey, load)

async function resolve(item: (typeof items.value)[number]) {
  workingId.value = item.id
  try {
    if (item.kind === 'next') await bookingCore.completeNextMove(props.workspaceId, item.id)
    else if (item.kind === 'hold') await bookingCore.releaseHold(props.workspaceId, item.id)
    else return
    await load()
    emit('changed')
  } finally {
    workingId.value = ''
  }
}
</script>

<template>
  <section class="attention-panel">
    <div class="attention-panel__heading">
      <div><p>{{ copy.eyebrow }}</p><h2>{{ copy.title }}</h2></div>
      <strong>{{ items.length }}</strong>
    </div>
    <div v-if="loading" class="attention-panel__empty">…</div>
    <div v-else-if="items.length" class="attention-panel__list">
      <article v-for="item in items" :key="`${item.kind}-${item.id}`" :class="{ 'attention-panel__item--overdue': item.urgency === 'overdue' }">
        <span :class="['attention-panel__type', `attention-panel__type--${item.kind}`]">{{ kindLabel(item.kind) }}</span>
        <button class="attention-panel__context" type="button" :aria-label="`${copy.open}: ${item.title}`" @click="emit('openBooking', item.bookingId)">
          <strong>{{ item.title }}</strong>
          <small>{{ item.meta }}</small>
          <em v-if="urgencyLabel(item)" :class="`attention-panel__urgency attention-panel__urgency--${item.urgency}`">{{ urgencyLabel(item) }}</em>
        </button>
        <button v-if="item.actionLabel" class="attention-panel__resolve" type="button" :disabled="workingId === item.id" @click="resolve(item)">{{ item.actionLabel }}</button>
        <button v-else class="attention-panel__resolve" type="button" @click="emit('openBooking', item.bookingId)">{{ copy.openAction }}</button>
      </article>
    </div>
    <div v-else class="attention-panel__empty attention-panel__empty--action"><span>{{ copy.noItems }}</span><button type="button" @click="emit('openBookings')">{{ copy.browse }} →</button></div>
  </section>
</template>

<style scoped>
.attention-panel { border:1px solid var(--cue-border); background:var(--cue-surface); }
.attention-panel__heading { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; padding:15px 16px; border-bottom:1px solid var(--cue-border); }
.attention-panel__heading p { margin:0; color:var(--cue-accent); font:700 9px/1.2 monospace; letter-spacing:.11em; }
.attention-panel__heading h2 { margin:5px 0 0; font-size:20px; }
.attention-panel__heading > strong { color:var(--cue-accent); font:700 12px monospace; }
.attention-panel__list article { display:grid; grid-template-columns:100px minmax(0,1fr) auto; align-items:center; gap:12px; padding:12px 14px; border-top:1px solid var(--cue-border); }
.attention-panel__list article:first-child { border-top:0; }
.attention-panel__type { font:700 8px monospace; letter-spacing:.08em; text-transform:uppercase; color:var(--cue-muted); }
.attention-panel__type--next { color:var(--cue-accent); }
.attention-panel__type--reply_received { color:#73b7ff; }
.attention-panel__type--new_booking { color:#ceff54; }
.attention-panel__type--delivery_failed { color:#ff6f7d; }
.attention-panel__type--stale_waiting { color:#ffbf5f; }
.attention-panel__context { position:relative; min-width:0; padding:4px 0; border:0; background:transparent; color:var(--cue-text); text-align:left; cursor:pointer; }
.attention-panel__context strong, .attention-panel__context small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.attention-panel__context strong { font-size:12px; }
.attention-panel__context small { margin-top:4px; color:var(--cue-muted); font-size:10px; }
.attention-panel__context:hover strong { color:var(--cue-accent); }
.attention-panel__urgency { display:inline-block; margin-top:6px; padding:2px 5px; border:1px solid var(--cue-border); color:var(--cue-muted); font:800 7px monospace; font-style:normal; text-transform:uppercase; }
.attention-panel__urgency--today { border-color:color-mix(in srgb,#ffbf5f 65%,var(--cue-border)); color:#ffbf5f; }
.attention-panel__urgency--overdue { border-color:color-mix(in srgb,#ff6f7d 65%,var(--cue-border)); color:#ff6f7d; }
.attention-panel__item--overdue { background:color-mix(in srgb,#ff6f7d 4%,transparent); }
.attention-panel__resolve { min-height:32px; padding:0 10px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.attention-panel__resolve:hover { border-color:var(--cue-accent); }
.attention-panel__resolve:disabled { opacity:.4; cursor:wait; }
.attention-panel__empty { padding:18px; color:var(--cue-muted); font-size:12px; }
.attention-panel__empty--action { display:flex; align-items:center; justify-content:space-between; gap:14px; }
.attention-panel__empty--action button { border:0; background:transparent; color:var(--cue-accent); cursor:pointer; font:800 9px monospace; text-transform:uppercase; }
@media (max-width:760px) {
  .attention-panel__list article { grid-template-columns:76px minmax(0,1fr); }
  .attention-panel__resolve { grid-column:2; justify-self:start; }
  .attention-panel__heading h2 { font-size:16px; }
}
</style>
