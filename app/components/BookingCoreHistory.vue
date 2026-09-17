<script setup lang="ts">
import type { Activity, CoreBooking } from '../domain/bookingCore'

const props = defineProps<{
  workspaceId: string
  bookings: CoreBooking[]
  locale: 'es' | 'en'
  refreshKey?: number
}>()

const emit = defineEmits<{ openBooking: [bookingId: string] }>()
const bookingCore = useBookingCore()
const activities = ref<Activity[]>([])
const loading = ref(false)
const search = ref('')
const typeFilter = ref<'all' | 'communication' | 'operations' | 'system'>('all')

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'ACTIVITY / REAL',
  title: 'Historial operativo',
  body: 'Lo que ha pasado alrededor de tus bookings, ordenado por tiempo.',
  search: 'Buscar en Activity…',
  all: 'Todo', communication: 'Conversaciones', operations: 'Operativa', system: 'Sistema',
  empty: 'Todavía no hay actividad real para este artista.',
  open: 'Abrir booking'
} : {
  eyebrow: 'ACTIVITY / REAL',
  title: 'Operational history',
  body: 'What happened around your bookings, ordered over time.',
  search: 'Search Activity…',
  all: 'All', communication: 'Conversations', operations: 'Operations', system: 'System',
  empty: 'No real activity for this artist yet.',
  open: 'Open booking'
})

const communicationTypes = new Set(['phone', 'email', 'whatsapp', 'instagram', 'note'])
const operationTypes = new Set(['status_change', 'hold_created', 'hold_released', 'hold_converted', 'next_move_created', 'next_move_completed'])

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return activities.value.filter(activity => {
    const booking = props.bookings.find(item => item.id === activity.booking_id)
    const groupOk = typeFilter.value === 'all'
      || (typeFilter.value === 'communication' && communicationTypes.has(activity.type))
      || (typeFilter.value === 'operations' && operationTypes.has(activity.type))
      || (typeFilter.value === 'system' && activity.type === 'system')
    if (!groupOk) return false
    if (!query) return true
    const haystack = [activity.type, activity.body, booking?.event_name, booking?.venue_name, booking?.city]
      .filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(query)
  })
})

function bookingLabel(activity: Activity) {
  const booking = props.bookings.find(item => item.id === activity.booking_id)
  return booking?.venue_name || booking?.event_name || (props.locale === 'es' ? 'Booking sin nombre' : 'Unnamed booking')
}

function activityLabel(activity: Activity) {
  const es: Record<string, string> = {
    phone: 'Llamada', email: 'Email', whatsapp: 'WhatsApp', instagram: 'Instagram', note: 'Nota',
    status_change: 'Estado', hold_created: 'Hold creado', hold_released: 'Hold liberado', hold_converted: 'Hold confirmado',
    next_move_created: 'Siguiente paso', next_move_completed: 'Paso completado', system: 'Sistema'
  }
  const en: Record<string, string> = {
    phone: 'Call', email: 'Email', whatsapp: 'WhatsApp', instagram: 'Instagram', note: 'Note',
    status_change: 'Status', hold_created: 'Hold created', hold_released: 'Hold released', hold_converted: 'Hold confirmed',
    next_move_created: 'Next move', next_move_completed: 'Move completed', system: 'System'
  }
  return (props.locale === 'es' ? es : en)[activity.type] || activity.type.replaceAll('_', ' ')
}

function activityDetail(activity: Activity) {
  if (activity.body) return activity.body
  if (activity.type === 'status_change') {
    const from = activity.metadata?.from_status
    const to = activity.metadata?.to_status
    if (from && to) return `${from} → ${to}`
  }
  if (activity.type === 'system' && activity.metadata?.event === 'booking_details_updated') {
    const fields = Array.isArray(activity.metadata.changed_fields) ? activity.metadata.changed_fields : []
    return props.locale === 'es' ? `Booking actualizado · ${fields.join(', ')}` : `Booking updated · ${fields.join(', ')}`
  }
  return ''
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(value))
}

async function load() {
  if (!props.workspaceId || !props.bookings.length) {
    activities.value = []
    return
  }
  loading.value = true
  try {
    activities.value = await bookingCore.listWorkspaceActivities(props.workspaceId, props.bookings.map(item => item.id), 300)
  } finally {
    loading.value = false
  }
}

watch(() => [props.workspaceId, props.refreshKey, props.bookings.map(item => item.id).join(',')], load, { immediate: true })
</script>

<template>
  <section class="core-history">
    <header class="core-history__heading">
      <div><p>{{ copy.eyebrow }}</p><h2>{{ copy.title }}</h2><span>{{ copy.body }}</span></div>
      <strong>{{ filtered.length }}</strong>
    </header>
    <div class="core-history__tools">
      <input v-model="search" type="search" :placeholder="copy.search">
      <div><button type="button" :class="{ active: typeFilter === 'all' }" @click="typeFilter = 'all'">{{ copy.all }}</button><button type="button" :class="{ active: typeFilter === 'communication' }" @click="typeFilter = 'communication'">{{ copy.communication }}</button><button type="button" :class="{ active: typeFilter === 'operations' }" @click="typeFilter = 'operations'">{{ copy.operations }}</button><button type="button" :class="{ active: typeFilter === 'system' }" @click="typeFilter = 'system'">{{ copy.system }}</button></div>
    </div>
    <p v-if="loading" class="core-history__empty">…</p>
    <div v-else-if="filtered.length" class="core-history__list">
      <button v-for="activity in filtered" :key="activity.id" type="button" @click="emit('openBooking', activity.booking_id)">
        <time>{{ formatTime(activity.occurred_at) }}</time>
        <i />
        <div><span>{{ activityLabel(activity) }}</span><strong>{{ bookingLabel(activity) }}</strong><p v-if="activityDetail(activity)">{{ activityDetail(activity) }}</p><small>{{ copy.open }}</small></div>
      </button>
    </div>
    <p v-else class="core-history__empty">{{ copy.empty }}</p>
  </section>
</template>

<style scoped>
.core-history { margin-bottom:18px; border:1px solid var(--cue-border); background:var(--cue-surface); }
.core-history__heading { display:flex; align-items:flex-start; justify-content:space-between; gap:18px; padding:16px 18px; border-bottom:1px solid var(--cue-border); }
.core-history__heading p { margin:0; color:var(--cue-accent); font:700 9px monospace; letter-spacing:.1em; }
.core-history__heading h2 { margin:5px 0 4px; font-size:20px; }
.core-history__heading span { color:var(--cue-muted); font-size:11px; }
.core-history__heading > strong { color:var(--cue-accent); font:700 12px monospace; }
.core-history__tools { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px; border-bottom:1px solid var(--cue-border); }
.core-history__tools input { flex:1; min-width:140px; min-height:34px; border:1px solid var(--cue-border); background:var(--cue-raised); color:var(--cue-text); padding:0 10px; }
.core-history__tools > div { display:flex; gap:4px; flex-wrap:wrap; }
.core-history__tools button { min-height:30px; padding:0 8px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; text-transform:uppercase; }
.core-history__tools button.active { border-color:var(--cue-accent); color:var(--cue-accent); }
.core-history__list > button { display:grid; grid-template-columns:125px 8px minmax(0,1fr); gap:12px; width:100%; padding:13px 15px; border:0; border-top:1px solid var(--cue-border); background:transparent; color:var(--cue-text); text-align:left; cursor:pointer; }
.core-history__list > button:first-child { border-top:0; }
.core-history__list time { color:var(--cue-muted); font:9px monospace; }
.core-history__list > button > i { width:6px; height:6px; margin-top:3px; border-radius:50%; background:var(--cue-accent); }
.core-history__list span { color:var(--cue-accent); font:700 8px monospace; text-transform:uppercase; }
.core-history__list strong { display:block; margin-top:4px; font-size:12px; }
.core-history__list p { margin:4px 0 0; color:var(--cue-muted); font-size:11px; line-height:1.4; }
.core-history__list small { display:block; margin-top:6px; color:var(--cue-muted); font-size:9px; }
.core-history__empty { margin:0; padding:18px; color:var(--cue-muted); font-size:11px; }
@media (max-width:680px) { .core-history__tools { align-items:stretch; flex-direction:column; } .core-history__list > button { grid-template-columns:88px 6px minmax(0,1fr); gap:8px; } }
</style>
