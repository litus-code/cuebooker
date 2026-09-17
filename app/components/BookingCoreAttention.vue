<script setup lang="ts">
import type { CoreBooking, Hold, NextMove } from '../domain/bookingCore'

const props = defineProps<{
  workspaceId: string
  bookings: CoreBooking[]
  locale: 'es' | 'en'
}>()

const emit = defineEmits<{ changed: [] }>()
const bookingCore = useBookingCore()
const nextMoves = ref<NextMove[]>([])
const holds = ref<Hold[]>([])
const loading = ref(false)
const workingId = ref('')

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'QUÉ NECESITA TU ATENCIÓN',
  title: 'Lo siguiente, sin perder el hilo',
  next: 'Siguiente paso',
  hold: 'Hold',
  done: 'Hecho',
  release: 'Liberar',
  noItems: 'No hay nada urgente ahora mismo.',
  noDate: 'Sin fecha',
  expires: 'Caduca'
} : {
  eyebrow: 'WHAT NEEDS YOUR ATTENTION',
  title: 'What comes next, without losing context',
  next: 'Next move',
  hold: 'Hold',
  done: 'Done',
  release: 'Release',
  noItems: 'Nothing urgent right now.',
  noDate: 'No date',
  expires: 'Expires'
})

const items = computed(() => {
  const rows: Array<{
    id: string
    kind: 'next' | 'hold'
    bookingId: string
    title: string
    meta: string
    sortAt: number
    actionLabel: string
  }> = []

  for (const move of nextMoves.value) {
    const booking = props.bookings.find(item => item.id === move.booking_id)
    rows.push({
      id: move.id,
      kind: 'next',
      bookingId: move.booking_id,
      title: move.label,
      meta: [booking?.venue_name || booking?.event_name || copy.value.noDate, move.due_at ? formatDateTime(move.due_at) : ''].filter(Boolean).join(' · '),
      sortAt: move.due_at ? new Date(move.due_at).getTime() : Number.MAX_SAFE_INTEGER - 1,
      actionLabel: copy.value.done
    })
  }

  for (const hold of holds.value) {
    const booking = props.bookings.find(item => item.id === hold.booking_id)
    rows.push({
      id: hold.id,
      kind: 'hold',
      bookingId: hold.booking_id,
      title: `${copy.value.hold}: ${booking?.venue_name || booking?.event_name || copy.value.noDate}`,
      meta: [formatDateOnly(hold.event_date), hold.expires_at ? `${copy.value.expires} ${formatDateTime(hold.expires_at)}` : '', hold.priority ? `P${hold.priority}` : ''].filter(Boolean).join(' · '),
      sortAt: hold.expires_at ? new Date(hold.expires_at).getTime() : new Date(`${hold.event_date}T12:00:00`).getTime(),
      actionLabel: copy.value.release
    })
  }

  return rows.sort((a, b) => a.sortAt - b.sortAt).slice(0, 8)
})

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
    const [moves, holdRows] = await Promise.all([
      bookingCore.listNextMoves(props.workspaceId, undefined, true),
      bookingCore.listHolds(props.workspaceId, undefined, true)
    ])
    nextMoves.value = moves
    holds.value = holdRows
  } finally {
    loading.value = false
  }
}

watch(() => props.workspaceId, load, { immediate: true })
watch(() => props.bookings.length, load)

defineExpose({ refresh: load })

async function resolve(item: (typeof items.value)[number]) {
  workingId.value = item.id
  try {
    if (item.kind === 'next') await bookingCore.completeNextMove(props.workspaceId, item.id)
    else await bookingCore.releaseHold(props.workspaceId, item.id)
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
      <article v-for="item in items" :key="`${item.kind}-${item.id}`">
        <span :class="['attention-panel__type', `attention-panel__type--${item.kind}`]">{{ item.kind === 'next' ? copy.next : copy.hold }}</span>
        <div><strong>{{ item.title }}</strong><small>{{ item.meta }}</small></div>
        <button type="button" :disabled="workingId === item.id" @click="resolve(item)">{{ item.actionLabel }}</button>
      </article>
    </div>
    <div v-else class="attention-panel__empty">{{ copy.noItems }}</div>
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
.attention-panel__list div { min-width:0; }
.attention-panel__list strong, .attention-panel__list small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.attention-panel__list strong { font-size:12px; }
.attention-panel__list small { margin-top:4px; color:var(--cue-muted); font-size:10px; }
.attention-panel__list button { min-height:32px; padding:0 10px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.attention-panel__list button:hover { border-color:var(--cue-accent); }
.attention-panel__list button:disabled { opacity:.4; cursor:wait; }
.attention-panel__empty { padding:18px; color:var(--cue-muted); font-size:12px; }
@media (max-width:760px) {
  .attention-panel__list article { grid-template-columns:76px minmax(0,1fr); }
  .attention-panel__list button { grid-column:2; justify-self:start; }
  .attention-panel__heading h2 { font-size:16px; }
}
</style>
