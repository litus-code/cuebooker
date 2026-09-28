<script setup lang="ts">
import type { Activity, CoreBooking } from '../domain/bookingCore'
import type { WorkspaceActivityHistoryRow } from '../services/bookingCoreApi'

const props = defineProps<{
  workspaceId: string
  artistId: string
  bookings: CoreBooking[]
  locale: 'es' | 'en'
  refreshKey?: number
}>()

const emit = defineEmits<{ openBooking: [bookingId: string] }>()
const bookingCore = useBookingCore()
const entitlements = useCueEntitlements()
const activities = ref<WorkspaceActivityHistoryRow[]>([])
const loading = ref(false)
const loadedOnce = ref(false)
const search = ref('')
const typeFilter = ref<'all' | 'communication' | 'operations' | 'system'>('all')
const visibleLimit = ref(10)

const historyDays = computed(() => entitlements.limit('historyDays'))
const historyCutoff = computed(() => {
  if (historyDays.value === null) return null
  const cutoff = new Date()
  cutoff.setUTCDate(cutoff.getUTCDate() - historyDays.value)
  return cutoff.toISOString()
})

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'ACTIVITY / REAL',
  title: 'Historial operativo',
  body: 'Lo que ha pasado alrededor de tus bookings, ordenado por tiempo.',
  search: 'Buscar en Activity…',
  all: 'Todo', communication: 'Conversaciones', operations: 'Operativa', system: 'Sistema',
  empty: 'Todavía no hay actividad real para este artista.',
  noResults: 'No hay actividad que coincida con estos filtros.',
  clearFilters: 'Limpiar filtros',
  open: 'Abrir booking'
} : {
  eyebrow: 'ACTIVITY / REAL',
  title: 'Operational history',
  body: 'What happened around your bookings, ordered over time.',
  search: 'Search Activity…',
  all: 'All', communication: 'Conversations', operations: 'Operations', system: 'System',
  empty: 'No real activity for this artist yet.',
  noResults: 'No activity matches these filters.',
  clearFilters: 'Clear filters',
  open: 'Open booking'
})

const communicationTypes = new Set(['phone', 'email', 'whatsapp', 'instagram', 'note'])
const operationTypes = new Set(['status_change', 'hold_created', 'hold_released', 'hold_converted', 'next_move_created', 'next_move_completed'])

function activityBooking(activity: WorkspaceActivityHistoryRow) {
  return activity.bookings || props.bookings.find(item => item.id === activity.booking_id) || null
}

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()
  return activities.value.filter(activity => {
    const booking = activityBooking(activity)
    const groupOk = typeFilter.value === 'all'
      || (typeFilter.value === 'communication' && communicationTypes.has(activity.type))
      || (typeFilter.value === 'operations' && operationTypes.has(activity.type))
      || (typeFilter.value === 'system' && activity.type === 'system')
    if (!groupOk) return false
    if (!query) return true
    const haystack = [
      activity.type,
      activity.body,
      activityLabel(activity),
      activityDetail(activity),
      booking?.event_name,
      booking?.venue_name,
      booking?.city
    ]
      .filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(query)
  })
})
const paged = computed(() => filtered.value.slice(0, visibleLimit.value))
const hasMore = computed(() => visibleLimit.value < filtered.value.length)
const hasActiveFilters = computed(() => Boolean(search.value.trim()) || typeFilter.value !== 'all')

function clearFilters() {
  search.value = ''
  typeFilter.value = 'all'
}

watch([search, typeFilter], () => {
  visibleLimit.value = 10
})

function bookingLabel(activity: WorkspaceActivityHistoryRow) {
  const booking = activityBooking(activity)
  return booking?.venue_name || booking?.event_name || (props.locale === 'es' ? 'Booking sin nombre' : 'Unnamed booking')
}

function activityGroup(activity: Activity) {
  if (communicationTypes.has(activity.type)) return 'communication'
  if (operationTypes.has(activity.type)) return 'operations'
  return 'system'
}

function activityLabel(activity: Activity) {
  if (activity.type === 'system' && activity.metadata?.event === 'booking_details_updated') {
    return props.locale === 'es' ? 'Booking actualizado' : 'Booking updated'
  }

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
  if (activity.type === 'hold_created') {
    const date = String(activity.metadata?.event_date || '')
    const priority = activity.metadata?.priority
    const expiresAt = String(activity.metadata?.expires_at || '')
    const parts: string[] = []
    if (date) {
      const formattedDate = new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      }).format(new Date(`${date}T12:00:00Z`))
      parts.push(formattedDate)
    }
    if (priority) parts.push(`P${priority}`)
    if (expiresAt) {
      const expiry = formatTime(expiresAt)
      parts.push(props.locale === 'es' ? `Caduca ${expiry}` : `Expires ${expiry}`)
    }
    return parts.join(' · ')
  }

  if (activity.type === 'hold_converted' && activity.metadata?.reason === 'booking_confirmed') {
    return props.locale === 'es'
      ? 'Convertido automáticamente al confirmar el booking.'
      : 'Automatically converted when the booking was confirmed.'
  }

  if (activity.type === 'hold_released' && activity.metadata?.reason === 'booking_confirmed') {
    return props.locale === 'es'
      ? 'Liberado automáticamente al confirmar otra opción de este booking.'
      : 'Automatically released when another option for this booking was confirmed.'
  }

  if (activity.type === 'next_move_created' && activity.body) {
    const dueAt = String(activity.metadata?.due_at || '')
    if (!dueAt) return activity.body
    return props.locale === 'es'
      ? `${activity.body} · Vence ${formatTime(dueAt)}`
      : `${activity.body} · Due ${formatTime(dueAt)}`
  }

  if (activity.type === 'next_move_completed' && activity.body) {
    if (activity.metadata?.reason === 'inbound_activity_received') {
      return props.locale === 'es'
        ? `${activity.body} · Completado automáticamente al recibir respuesta.`
        : `${activity.body} · Automatically completed when a reply arrived.`
    }
    if (activity.metadata?.reason === 'replaced') {
      return props.locale === 'es'
        ? `${activity.body} · Sustituido por un nuevo siguiente paso.`
        : `${activity.body} · Replaced by a new next move.`
    }
    return activity.body
  }

  if (activity.body) return activity.body
  if (activity.type === 'status_change') {
    const from = String(activity.metadata?.from_status || '')
    const to = String(activity.metadata?.to_status || '')
    if (from && to) {
      const es: Record<string, string> = {
        new: 'Nueva',
        in_conversation: 'En conversación',
        waiting_response: 'Esperando respuesta',
        confirmed: 'Confirmada',
        rejected: 'Rechazada',
        cancelled: 'Cancelada'
      }
      const en: Record<string, string> = {
        new: 'New',
        in_conversation: 'In conversation',
        waiting_response: 'Waiting response',
        confirmed: 'Confirmed',
        rejected: 'Rejected',
        cancelled: 'Cancelled'
      }
      const labels = props.locale === 'es' ? es : en
      return `${labels[from] || from} → ${labels[to] || to}`
    }
  }
  if (activity.type === 'system' && activity.metadata?.event === 'booking_details_updated') {
    const fields = Array.isArray(activity.metadata.changed_fields) ? activity.metadata.changed_fields : []
    const es: Record<string, string> = {
      event_name: 'evento',
      venue_name: 'sala',
      city: 'ciudad',
      country_code: 'país',
      event_date: 'fecha',
      start_time: 'hora de inicio',
      end_time: 'hora de fin',
      event_timezone: 'zona horaria',
      offer_amount_minor: 'oferta',
      currency: 'moneda',
      fee_basis: 'base del fee'
    }
    const en: Record<string, string> = {
      event_name: 'event',
      venue_name: 'venue',
      city: 'city',
      country_code: 'country',
      event_date: 'date',
      start_time: 'start time',
      end_time: 'end time',
      event_timezone: 'timezone',
      offer_amount_minor: 'offer',
      currency: 'currency',
      fee_basis: 'fee basis'
    }
    const labels = fields
      .map(field => (props.locale === 'es' ? es : en)[String(field)] || '')
      .filter(Boolean)
    if (!labels.length) return props.locale === 'es' ? 'Datos del booking modificados' : 'Booking details changed'
    return props.locale === 'es'
      ? `Cambió: ${labels.join(', ')}`
      : `Changed: ${labels.join(', ')}`
  }
  return ''
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(value))
}

async function load() {
  if (!props.workspaceId || !props.artistId) {
    activities.value = []
    loadedOnce.value = false
    return
  }

  const initialLoad = !loadedOnce.value
  if (initialLoad) loading.value = true

  try {
    const nextActivities = await bookingCore.listArtistWorkspaceActivities(
      props.workspaceId,
      props.artistId,
      500,
      historyCutoff.value || undefined
    )
    activities.value = nextActivities
    loadedOnce.value = true
  } finally {
    if (initialLoad) loading.value = false
  }
}

watch(
  () => [props.workspaceId, props.artistId, props.refreshKey, historyCutoff.value],
  load,
  { immediate: true }
)
</script>

<template>
  <section class="core-history">
    <header class="core-history__heading">
      <div class="core-history__heading-copy">
        <p>{{ copy.eyebrow }}</p>
        <h2>{{ copy.title }}</h2>
        <span>{{ copy.body }}</span>
      </div>
      <div class="core-history__count" aria-label="Total activities">
        <strong>{{ filtered.length }}</strong>
        <span>{{ locale === 'es' ? 'eventos' : 'events' }}</span>
      </div>
    </header>

    <CueUpgradePrompt
      v-if="!entitlements.can('booking.history_full')"
      class="core-history__history-limit"
      entitlement="booking.history_full"
      :title="locale === 'es' ? `Historial de los últimos ${historyDays ?? 90} días` : `Last ${historyDays ?? 90} days of history`"
      :description="locale === 'es'
        ? 'Free conserva la actividad reciente. Artist Pro muestra el historial operativo completo del artista.'
        : 'Free keeps recent activity. Artist Pro shows the artist full operational history.'"
    />

    <div class="core-history__tools">
      <label class="core-history__search">
        <span class="sr-only">{{ copy.search }}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
        <input v-model="search" type="search" :placeholder="copy.search">
      </label>

      <div class="core-history__filters" role="group" :aria-label="locale === 'es' ? 'Filtrar actividad' : 'Filter activity'">
        <button type="button" :class="{ active: typeFilter === 'all' }" @click="typeFilter = 'all'">{{ copy.all }}</button>
        <button type="button" :class="{ active: typeFilter === 'communication' }" @click="typeFilter = 'communication'">{{ copy.communication }}</button>
        <button type="button" :class="{ active: typeFilter === 'operations' }" @click="typeFilter = 'operations'">{{ copy.operations }}</button>
        <button type="button" :class="{ active: typeFilter === 'system' }" @click="typeFilter = 'system'">{{ copy.system }}</button>
      </div>
    </div>

    <div v-if="loading" class="core-history__loading" aria-busy="true">
      <i v-for="index in 6" :key="`history-loading-${index}`" />
    </div>

    <div v-else-if="filtered.length" class="core-history__timeline">
      <button
        v-for="activity in paged"
        :key="activity.id"
        class="core-history__event"
        :class="`core-history__event--${activityGroup(activity)}`"
        type="button"
        @click="emit('openBooking', activity.booking_id)"
      >
        <div class="core-history__event-time">
          <time>{{ formatTime(activity.occurred_at) }}</time>
        </div>

        <div class="core-history__rail" aria-hidden="true"><i /></div>

        <div class="core-history__event-content">
          <div class="core-history__event-topline">
            <span>{{ activityLabel(activity) }}</span>
            <small>{{ copy.open }}</small>
          </div>
          <strong>{{ bookingLabel(activity) }}</strong>
          <p v-if="activityDetail(activity)">{{ activityDetail(activity) }}</p>
        </div>
      </button>

      <div v-if="hasMore" class="core-history__load-more">
        <button type="button" @click="visibleLimit += 10">
          {{ locale === 'es' ? `Cargar 10 más · ${filtered.length - paged.length} restantes` : `Load 10 more · ${filtered.length - paged.length} remaining` }}
        </button>
      </div>
    </div>

    <div v-else class="core-history__empty">
      <span>{{ hasActiveFilters ? (locale === 'es' ? 'SIN RESULTADOS' : 'NO RESULTS') : (locale === 'es' ? 'SIN ACTIVIDAD' : 'NO ACTIVITY') }}</span>
      <p>{{ hasActiveFilters ? copy.noResults : copy.empty }}</p>
      <button v-if="hasActiveFilters" type="button" @click="clearFilters">{{ copy.clearFilters }}</button>
    </div>
  </section>
</template>

<style scoped>
.core-history {
  margin-bottom:var(--cue-space-5);
  overflow:hidden;
  border:1px solid var(--workspace-line, var(--cue-border));
  border-radius:var(--cue-radius-panel, 12px);
  background:var(--cue-surface);
}

.core-history > :deep(.core-history__history-limit){
  display:grid;
  grid-template-columns:auto minmax(180px,.45fr) minmax(0,1fr);
  align-items:center;
  align-content:center;
  gap:var(--cue-space-4);
  min-height:0;
  height:auto;
  margin:0;
  padding:12px var(--cue-space-5);
  border:0;
  border-bottom:1px solid var(--workspace-line, var(--cue-border));
  border-radius:0;
  background:color-mix(in srgb,var(--cue-accent) 3%,var(--cue-surface));
}
.core-history > :deep(.core-history__history-limit > div){
  min-width:120px;
}
.core-history > :deep(.core-history__history-limit > strong){
  font-size:11px;
  line-height:1.25;
}
.core-history > :deep(.core-history__history-limit > p){
  font-size:10px;
  line-height:1.4;
}
.core-history__heading {
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:var(--cue-space-5);
  padding:var(--cue-space-5);
  border-bottom:1px solid var(--workspace-line, var(--cue-border));
}

.core-history__heading-copy {
  min-width:0;
}

.core-history__heading p {
  margin:0;
  color:var(--cue-accent);
  font:800 9px/1.1 monospace;
  letter-spacing:.1em;
}

.core-history__heading h2 {
  margin:var(--cue-space-2) 0 var(--cue-space-2);
  font-size:22px;
  line-height:1;
  letter-spacing:-.02em;
}

.core-history__heading span {
  display:block;
  max-width:620px;
  color:var(--cue-muted);
  font-size:12px;
  line-height:1.5;
}

.core-history__count {
  display:grid;
  justify-items:end;
  gap:3px;
  min-width:64px;
  padding-top:2px;
}

.core-history__count strong {
  color:var(--cue-text);
  font-size:24px;
  line-height:1;
}

.core-history__count span {
  color:var(--cue-muted);
  font:800 8px/1 monospace;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.core-history__tools {
  display:grid;
  grid-template-columns:minmax(240px,1fr) auto;
  align-items:center;
  gap:var(--cue-space-3);
  padding:var(--cue-space-3);
  border-bottom:1px solid var(--workspace-line, var(--cue-border));
  background:color-mix(in srgb,var(--cue-raised) 34%,transparent);
}

.core-history__search {
  position:relative;
  display:flex;
  align-items:center;
}

.core-history__search svg {
  position:absolute;
  left:13px;
  width:15px;
  height:15px;
  fill:none;
  stroke:var(--cue-muted);
  stroke-width:1.8;
  pointer-events:none;
}

.core-history__search input {
  width:100%;
  min-width:0;
  height:var(--cue-input-md,44px);
  padding:0 14px 0 38px;
  border:1px solid var(--cue-border);
  border-radius:var(--cue-radius-control,8px);
  outline:0;
  background:var(--cue-surface);
  color:var(--cue-text);
  font-size:12px;
}

.core-history__search input:focus {
  border-color:var(--cue-accent);
}

.core-history__filters {
  display:flex;
  gap:6px;
  flex-wrap:wrap;
  justify-content:flex-end;
}

.core-history__filters button {
  min-height:36px;
  padding:0 12px;
  border:1px solid var(--cue-border);
  border-radius:var(--cue-radius-control,8px);
  background:transparent;
  color:var(--cue-muted);
  cursor:pointer;
  font:800 8px/1 monospace;
  letter-spacing:.05em;
  text-transform:uppercase;
  transition:border-color .16s ease,color .16s ease,background .16s ease;
}

.core-history__filters button:hover,
.core-history__filters button:focus-visible {
  border-color:color-mix(in srgb,var(--cue-accent) 56%,var(--cue-border));
  color:var(--cue-text);
}

.core-history__filters button.active {
  border-color:var(--cue-accent);
  background:color-mix(in srgb,var(--cue-accent) 9%,transparent);
  color:var(--cue-accent);
}

.core-history__timeline {
  position:relative;
}

.core-history__event {
  display:grid;
  grid-template-columns:132px 18px minmax(0,1fr);
  gap:var(--cue-space-3);
  width:100%;
  min-height:88px;
  padding:var(--cue-space-4) var(--cue-space-5);
  border:0;
  border-top:1px solid var(--workspace-line, var(--cue-border));
  background:transparent;
  color:var(--cue-text);
  text-align:left;
  cursor:pointer;
  transition:background .16s ease;
}

.core-history__event:first-child {
  border-top:0;
}

.core-history__event:hover,
.core-history__event:focus-visible {
  background:color-mix(in srgb,var(--cue-raised) 52%,transparent);
  outline:0;
}

.core-history__event-time {
  padding-top:2px;
}

.core-history__event time {
  color:var(--cue-muted);
  font:700 9px/1.35 monospace;
}

.core-history__rail {
  position:relative;
  display:flex;
  justify-content:center;
}

.core-history__rail::before {
  content:"";
  position:absolute;
  top:-16px;
  bottom:-16px;
  width:1px;
  background:var(--workspace-line, var(--cue-border));
}

.core-history__event:first-child .core-history__rail::before {
  top:8px;
}

.core-history__event:last-of-type .core-history__rail::before {
  bottom:calc(100% - 11px);
}

.core-history__rail i {
  position:relative;
  z-index:1;
  width:8px;
  height:8px;
  margin-top:5px;
  border:2px solid var(--cue-surface);
  border-radius:50%;
  background:var(--cue-muted);
  box-shadow:0 0 0 1px var(--cue-border);
}

.core-history__event--communication .core-history__rail i {
  background:#6ea8ff;
}

.core-history__event--operations .core-history__rail i {
  background:var(--cue-accent);
}

.core-history__event--system .core-history__rail i {
  background:#8d8d94;
}

.core-history__event-content {
  min-width:0;
}

.core-history__event-topline {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:var(--cue-space-3);
}

.core-history__event-topline > span {
  color:var(--cue-muted);
  font:800 8px/1 monospace;
  letter-spacing:.06em;
  text-transform:uppercase;
}

.core-history__event--communication .core-history__event-topline > span {
  color:#8ab9ff;
}

.core-history__event--operations .core-history__event-topline > span {
  color:var(--cue-accent);
}

.core-history__event-topline small {
  flex:none;
  color:var(--cue-muted);
  font:800 8px/1 monospace;
  letter-spacing:.04em;
  text-transform:uppercase;
  opacity:.78;
}

.core-history__event:hover .core-history__event-topline small,
.core-history__event:focus-visible .core-history__event-topline small {
  color:var(--cue-accent);
  opacity:1;
}

.core-history__event-content > strong {
  display:block;
  margin-top:7px;
  font-size:14px;
  line-height:1.25;
}

.core-history__event-content > p {
  max-width:760px;
  margin:6px 0 0;
  color:var(--cue-muted);
  font-size:11px;
  line-height:1.5;
}

.core-history__load-more {
  padding:var(--cue-space-3);
  border-top:1px solid var(--workspace-line, var(--cue-border));
}

.core-history__load-more button {
  width:100%;
  min-height:40px;
  border:1px solid var(--cue-border);
  border-radius:var(--cue-radius-control,8px);
  background:var(--cue-raised);
  color:var(--cue-text);
  cursor:pointer;
  font:800 8px/1 monospace;
  letter-spacing:.05em;
  text-transform:uppercase;
}

.core-history__load-more button:hover,
.core-history__load-more button:focus-visible {
  border-color:var(--cue-accent);
  color:var(--cue-accent);
}

.core-history__empty {
  display:grid;
  gap:var(--cue-space-2);
  min-height:180px;
  place-content:center;
  padding:var(--cue-space-6);
  text-align:center;
}

.core-history__empty span {
  color:var(--cue-accent);
  font:800 9px/1 monospace;
  letter-spacing:.1em;
}

.core-history__empty p {
  max-width:360px;
  margin:0;
  color:var(--cue-muted);
  font-size:12px;
  line-height:1.5;
}

.core-history__empty button {
  justify-self:center;
  min-height:40px;
  padding:0 14px;
  border:1px solid var(--cue-border);
  border-radius:var(--cue-radius-control,8px);
  background:transparent;
  color:var(--cue-text);
  cursor:pointer;
  font:800 8px/1 monospace;
  letter-spacing:.05em;
  text-transform:uppercase;
}

.core-history__empty button:hover,
.core-history__empty button:focus-visible {
  border-color:var(--cue-accent);
  color:var(--cue-accent);
  outline:0;
}

.core-history__loading {
  display:grid;
}

.core-history__loading i {
  display:block;
  min-height:88px;
  border-top:1px solid var(--workspace-line, var(--cue-border));
  background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--cue-raised) 52%,transparent),transparent);
  background-size:220% 100%;
  animation:core-history-loading 1.35s ease-in-out infinite;
}

.core-history__loading i:first-child {
  border-top:0;
}

@keyframes core-history-loading {
  from { background-position:200% 0; }
  to { background-position:-20% 0; }
}

@media (max-width:760px) {
  .core-history > :deep(.core-history__history-limit){
    grid-template-columns:auto minmax(0,1fr);
    align-items:center;
    min-height:0;
    height:auto;
    gap:8px 12px;
    padding:12px 14px;
  }

  .core-history > :deep(.core-history__history-limit > div){
    min-width:0;
  }

  .core-history > :deep(.core-history__history-limit > strong){
    min-width:0;
    font-size:11px;
    line-height:1.25;
  }

  .core-history > :deep(.core-history__history-limit > p){
    grid-column:1 / -1;
    margin:0;
    font-size:10px;
    line-height:1.4;
  }

  .core-history__heading {
    padding:var(--cue-space-4);
  }

  .core-history__tools {
    grid-template-columns:1fr;
  }

  .core-history__filters {
    justify-content:flex-start;
  }

  .core-history__event {
    grid-template-columns:88px 14px minmax(0,1fr);
    gap:var(--cue-space-2);
    padding:var(--cue-space-4);
  }
}

@media (max-width:520px) {
  .core-history__heading {
    gap:var(--cue-space-3);
  }

  .core-history__count strong {
    font-size:20px;
  }

  .core-history__filters {
    display:grid;
    grid-template-columns:repeat(2,minmax(0,1fr));
  }

  .core-history__filters button {
    width:100%;
  }

  .core-history__event {
    grid-template-columns:14px minmax(0,1fr);
    min-height:96px;
  }

  .core-history__event-time {
    grid-column:2;
    grid-row:1;
    padding:0;
  }

  .core-history__rail {
    grid-column:1;
    grid-row:1 / span 2;
  }

  .core-history__event-content {
    grid-column:2;
    grid-row:2;
  }

  .core-history__event-topline {
    align-items:flex-start;
  }
}
</style>
