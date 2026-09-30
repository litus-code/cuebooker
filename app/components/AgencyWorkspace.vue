<script setup lang="ts">
import type { CoreBooking, Hold, NextMove } from '../domain/bookingCore'
import type { WorkspaceActivityHistoryRow } from '../services/bookingCoreApi'
import { agencyActiveBookingCount, filterRosterBookings } from '../domain/agencyRoster'

type RosterArtist = { id: string; stage_name: string; slug: string; city?: string | null; artist_image_path?: string | null; cover_image_path?: string | null; roster_active?: boolean }
type AgencyDemoData = {
  bookings: CoreBooking[]
  activities: WorkspaceActivityHistoryRow[]
  holds: Array<Hold & { bookings: { artist_id: string } }>
  contacts: Array<{ id: string; name: string }>
  nextMoves?: NextMove[]
  counterparties: Array<{ id: string; name: string }>
}
const props = defineProps<{
  workspaceId: string
  agencyName: string
  artists: RosterArtist[]
  view: 'overview' | 'bookings' | 'calendar' | 'history' | 'roster'
  locale: 'es' | 'en'
  canManageRoster: boolean
  canCapture?: boolean
  createArtist: (name: string, slug: string, city: string) => Promise<boolean>
  revision?: number
  demoData?: AgencyDemoData
  initialMonth?: string
  contextArtistName?: string
}>()
const emit = defineEmits<{
  selectArtist: [artistId: string, view: 'overview' | 'profile']
  openBooking: [bookingId: string]
  retireArtist: [artistId: string]
  restoreArtist: [artistId: string]
  capture: []
  navigate: [view: 'roster' | 'bookings' | 'calendar']
}>()
const route = useRoute()
const router = useRouter()
const api = useBookingCore()
const artistProfiles = useArtistProfile()
const portraitUrls = ref<Record<string, string>>({})
const loading = ref(false)
const error = ref('')
const bookings = ref<CoreBooking[]>([])
const summaryBookings = ref<CoreBooking[]>([])
const exactActiveCount = ref<number | null>(null)
const exactHoldCount = ref<number | null>(null)
const monthBookings = ref<CoreBooking[]>([])
const activities = ref<WorkspaceActivityHistoryRow[]>([])
const holds = ref<Array<Hold & { bookings: { artist_id: string } }>>([])
const contacts = ref<Array<{ id: string; name: string }>>([])
const counterparties = ref<Array<{ id: string; name: string }>>([])
const filterArtist = ref(!props.demoData && typeof route.query.rosterArtist === 'string' ? route.query.rosterArtist : 'all')
const calendarArtists = ref<string[]>(!props.demoData && typeof route.query.rosterCalendar === 'string' ? route.query.rosterCalendar.split(',').filter(Boolean) : [])
const calendarFilterInitialized = ref(!props.demoData && typeof route.query.rosterCalendar === 'string')
const month = ref(props.initialMonth || (!props.demoData && typeof route.query.rosterMonth === 'string' && /^\d{4}-\d{2}-01$/.test(route.query.rosterMonth) ? route.query.rosterMonth : '') || new Date().toISOString().slice(0, 7) + '-01')
const selectedDay = ref(props.initialMonth || (!props.demoData && typeof route.query.rosterDay === 'string' ? route.query.rosterDay : '') || new Date().toISOString().slice(0, 10))
const attentionRevision = ref(0)
const artistName = ref('')
const artistSlug = ref('')
const artistCity = ref('')
const showAdd = ref(false)
const addDialog = ref<HTMLDialogElement | null>(null)
watch(showAdd, async value => { await nextTick(); if (value) addDialog.value?.showModal(); else addDialog.value?.close() })
const submittingArtist = ref(false)
const addError = ref('')
const showRetired = ref(false)
const page = ref(0)
const pageSize = 100
const activityPage = ref(0)
const activeArtists = computed(() => props.artists.filter(artist => artist.roster_active !== false))
const activeIds = computed(() => new Set(activeArtists.value.map(artist => artist.id)))
const visibleBookings = computed(() => filterRosterBookings(bookings.value, activeArtists.value, filterArtist.value === 'all' ? undefined : [filterArtist.value]))
const visibleActivities = computed(() => activities.value.filter(activity => activeIds.value.has(activity.bookings?.artist_id) && (filterArtist.value === 'all' || activity.bookings?.artist_id === filterArtist.value)))
const recentActivities = computed(() => activities.value.filter(activity => activeIds.value.has(activity.bookings?.artist_id)).slice(0, 5))
const visibleMonthBookings = computed(() => filterRosterBookings(monthBookings.value, activeArtists.value, calendarArtists.value))
const visibleHolds = computed(() => holds.value.filter(hold => {
  const artistId = hold.bookings.artist_id
  return activeIds.value.has(artistId) && calendarArtists.value.includes(artistId) && hold.status === 'active'
}))
const currentMonth = computed(() => new Date(`${month.value}T12:00:00Z`))
const monthEnd = computed(() => new Date(Date.UTC(currentMonth.value.getUTCFullYear(), currentMonth.value.getUTCMonth() + 1, 1)).toISOString().slice(0, 10))
const calendarDays = computed(() => {
  const first = currentMonth.value
  const offset = (first.getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  return [...Array(offset).fill(''), ...Array.from({ length: count }, (_, i) => `${month.value.slice(0, 7)}-${String(i + 1).padStart(2, '0')}`)]
})
const nextEvents = computed(() => filterRosterBookings(monthBookings.value, activeArtists.value).filter(item => item.event_date && item.event_date >= new Date().toISOString().slice(0, 10)).slice(0, 8))
const upcomingThisMonthCount = computed(() => filterRosterBookings(monthBookings.value, activeArtists.value).filter(item => item.event_date && item.event_date >= new Date().toISOString().slice(0, 10)).length)
const activeCount = computed(() => exactActiveCount.value ?? `≥${agencyActiveBookingCount(filterRosterBookings(summaryBookings.value, activeArtists.value))}`)
const pendingHolds = computed(() => exactHoldCount.value ?? `≥${holds.value.filter(item => item.status === 'active' && activeIds.value.has(item.bookings.artist_id)).length}`)

const isEs = computed(() => props.locale === 'es')
const title = computed(() => props.contextArtistName && props.view !== 'roster'
  ? ({ overview: props.contextArtistName.toUpperCase(), bookings: `BOOKINGS / ${props.contextArtistName}`, calendar: `${isEs.value ? 'CALENDARIO' : 'CALENDAR'} / ${props.contextArtistName}`, history: `ACTIVITY / ${props.contextArtistName}` })[props.view]
  : ({ overview: isEs.value ? 'PULSO DEL ROSTER.' : 'THE ROSTER PULSE.', bookings: 'BOOKINGS / ROSTER', calendar: isEs.value ? 'CALENDARIO DEL ROSTER.' : 'ROSTER CALENDAR.', history: 'ACTIVITY / ROSTER', roster: 'EL ROSTER.' })[props.view])
const monthLabel = computed(() => {
  const label = new Intl.DateTimeFormat(isEs.value ? 'es-ES' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(currentMonth.value)
  return label.charAt(0).toUpperCase() + label.slice(1)
})

function label(id: string) { return props.artists.find(item => item.id === id)?.stage_name || (isEs.value ? 'Artista' : 'Artist') }
function bookingStatusLabel(status: CoreBooking['status']) {
  const es = { new: 'Nueva', in_conversation: 'En conversación', waiting_response: 'Esperando respuesta', confirmed: 'Confirmada', rejected: 'Rechazada', cancelled: 'Cancelada' }
  const en = { new: 'New', in_conversation: 'In conversation', waiting_response: 'Waiting response', confirmed: 'Confirmed', rejected: 'Rejected', cancelled: 'Cancelled' }
  return (isEs.value ? es : en)[status]
}
function activityTypeLabel(type: WorkspaceActivityHistoryRow['type']) {
  const es: Record<string, string> = { email: 'Email', phone: 'Llamada', whatsapp: 'WhatsApp', instagram: 'Instagram', note: 'Nota', status_change: 'Cambio de estado', hold_created: 'Hold creado', hold_released: 'Hold liberado', hold_converted: 'Hold confirmado', next_move_created: 'Próxima acción', next_move_completed: 'Acción completada', system: 'Sistema' }
  const en: Record<string, string> = { email: 'Email', phone: 'Call', whatsapp: 'WhatsApp', instagram: 'Instagram', note: 'Note', status_change: 'Status change', hold_created: 'Hold created', hold_released: 'Hold released', hold_converted: 'Hold confirmed', next_move_created: 'Next action', next_move_completed: 'Action completed', system: 'System' }
  return (isEs.value ? es : en)[type] || type.replaceAll('_', ' ')
}
function contact(booking: CoreBooking) {
  return contacts.value.find(item => item.id === booking.primary_contact_id)?.name
    || counterparties.value.find(item => item.id === booking.counterparty_id)?.name || '—'
}
function eventName(booking: CoreBooking) { return booking.event_name || booking.venue_name || (isEs.value ? 'Booking sin nombre' : 'Unnamed booking') }
function upcomingSnapshotLabel(artistId: string) {
  if (summaryBookings.value.length === 100) return isEs.value ? 'Ver próximas fechas' : 'View upcoming dates'
  const count = summaryBookings.value.filter(item => item.artist_id === artistId && item.event_date && item.event_date >= new Date().toISOString().slice(0, 10)).length
  return `${count} ${isEs.value ? 'próximos bookings' : 'upcoming bookings'}`
}
function shortDate(value: string | null) {
  return value ? new Intl.DateTimeFormat(isEs.value ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`)) : '—'
}
function moveMonth(delta: number) {
  month.value = new Date(Date.UTC(currentMonth.value.getUTCFullYear(), currentMonth.value.getUTCMonth() + delta, 1)).toISOString().slice(0, 10)
  selectedDay.value = ''
}
function toggleCalendarArtist(id: string) {
  calendarArtists.value = calendarArtists.value.includes(id) ? calendarArtists.value.filter(item => item !== id) : [...calendarArtists.value, id]
}
function slugify(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') }
watch(artistName, value => { artistSlug.value = slugify(value) })
watch(activeArtists, (rows, previous = []) => {
  const wasAll = previous.length > 0 && previous.every(item => calendarArtists.value.includes(item.id))
  const existing = new Set(rows.map(row => row.id))
  calendarArtists.value = calendarFilterInitialized.value && !wasAll ? calendarArtists.value.filter(id => existing.has(id)) : rows.map(row => row.id)
  calendarFilterInitialized.value = true
  if (filterArtist.value !== 'all' && !existing.has(filterArtist.value)) filterArtist.value = 'all'
}, { immediate: true })
watch(filterArtist, value => {
  if (props.demoData) return
  void router.replace({ query: { ...route.query, view: props.view, rosterArtist: value === 'all' ? undefined : value } })
})
watch([month, selectedDay], () => {
  if (!props.demoData && props.view === 'calendar') void router.replace({ query: { ...route.query, rosterMonth: month.value, rosterDay: selectedDay.value } })
})
watch(calendarArtists, ids => {
  if (props.demoData || props.view !== 'calendar') return
  void router.replace({ query: { ...route.query, view: props.view, rosterCalendar: ids.join(',') } })
})
watch(() => props.artists.map(item => `${item.id}:${item.artist_image_path || item.cover_image_path || ''}`).join(','), async () => {
  for (const url of Object.values(portraitUrls.value)) URL.revokeObjectURL(url)
  portraitUrls.value = {}
  if (props.demoData) return
  for (const artist of props.artists) {
    const path = artist.artist_image_path || artist.cover_image_path
    if (!path) continue
    try { portraitUrls.value[artist.id] = await artistProfiles.getArtistImageObjectUrl(path) } catch { /* Initials remain the fallback. */ }
  }
}, { immediate: true })
onUnmounted(() => { for (const url of Object.values(portraitUrls.value)) URL.revokeObjectURL(url) })

let request = 0
async function load() {
  if (!props.workspaceId) return
  const current = ++request
  loading.value = true
  error.value = ''
  if (props.demoData) {
    const ids = activeIds.value
    const rows = props.demoData.bookings.filter(item => ids.has(item.artist_id))
    const filtered = filterArtist.value === 'all' ? rows : rows.filter(item => item.artist_id === filterArtist.value)
    bookings.value = filtered.slice(page.value * pageSize, (page.value + 1) * pageSize)
    summaryBookings.value = rows.slice(0, 100)
    exactActiveCount.value = agencyActiveBookingCount(rows)
    exactHoldCount.value = props.demoData.holds.filter(item => item.status === 'active' && ids.has(item.bookings.artist_id)).length
    monthBookings.value = rows.filter(item => item.status === 'confirmed' && !item.archived_at && item.event_date && item.event_date >= month.value && item.event_date < monthEnd.value)
    const activityRows = props.demoData.activities.filter(item => ids.has(item.bookings.artist_id) && (props.view !== 'history' || filterArtist.value === 'all' || item.bookings.artist_id === filterArtist.value))
    activities.value = activityRows.slice((props.view === 'history' ? activityPage.value : 0) * pageSize, ((props.view === 'history' ? activityPage.value : 0) + 1) * pageSize)
    holds.value = props.demoData.holds.filter(item => ids.has(item.bookings.artist_id) && item.event_date >= month.value && item.event_date < monthEnd.value)
    contacts.value = props.demoData.contacts
    counterparties.value = props.demoData.counterparties
    loading.value = false
    return
  }
  try {
    const [rows, summaryRows, count, holdCount, monthRows, activityRows, holdRows, contactRows, partyRows] = await Promise.all([
      api.listRosterBookings(props.workspaceId, page.value * pageSize, pageSize, filterArtist.value === 'all' ? undefined : filterArtist.value, activeArtists.value.map(item => item.id)),
      api.listRosterBookings(props.workspaceId, 0, 100, undefined, activeArtists.value.map(item => item.id)),
      api.countRosterActiveBookings(props.workspaceId, activeArtists.value.map(item => item.id)).catch(() => null),
      api.countRosterActiveHolds(props.workspaceId, activeArtists.value.map(item => item.id)).catch(() => null),
      api.listRosterCalendarBookings(props.workspaceId, month.value, monthEnd.value),
      api.listRosterActivities(props.workspaceId, (props.view === 'history' ? activityPage.value : 0) * pageSize, pageSize, filterArtist.value === 'all' || props.view !== 'history' ? activeArtists.value.map(item => item.id) : [filterArtist.value]),
      api.listRosterHolds(props.workspaceId, month.value, monthEnd.value),
      api.listContacts(props.workspaceId), api.listCounterparties(props.workspaceId)
    ])
    if (current !== request) return
    bookings.value = rows
    summaryBookings.value = summaryRows
    exactActiveCount.value = count
    exactHoldCount.value = holdCount
    monthBookings.value = monthRows
    activities.value = activityRows
    holds.value = holdRows
    contacts.value = contactRows
    counterparties.value = partyRows
  } catch (cause: any) {
    if (current === request) error.value = cause?.message || (isEs.value ? 'No se pudo cargar el roster.' : 'Could not load the roster.')
  } finally {
    if (current === request) loading.value = false
  }
}
watch(filterArtist, () => { page.value = 0; activityPage.value = 0 })
watch(() => [props.workspaceId, props.revision, month.value, page.value, activityPage.value, filterArtist.value, props.view, props.artists.map(item => `${item.id}:${item.roster_active}`).join(',')], load, { immediate: true })
async function submitArtist() {
  if (!props.canManageRoster || !artistName.value.trim() || !artistSlug.value.trim()) return
  submittingArtist.value = true
  addError.value = ''
  try {
    if (!await props.createArtist(artistName.value.trim(), artistSlug.value, artistCity.value.trim())) {
      addError.value = isEs.value ? 'No se pudo añadir. Revisa el nombre y el slug.' : 'Could not add artist. Check the name and slug.'
      return
    }
    artistName.value = ''; artistSlug.value = ''; artistCity.value = ''; showAdd.value = false
  } finally { submittingArtist.value = false }
}
function confirmRetire(artist: RosterArtist) {
  if (window.confirm(isEs.value ? `¿Retirar a ${artist.stage_name} del roster? Sus bookings e historial se conservarán.` : `Remove ${artist.stage_name} from the active roster? Bookings and history will be kept.`)) emit('retireArtist', artist.id)
}
</script>

<template>
  <section class="agency" :aria-busy="loading">
    <div class="agency-heading"><div><p>AGENCY / {{ agencyName }}</p><h1>{{ title }}</h1><span>{{ contextArtistName ? (isEs ? `Artista seleccionado · ${contextArtistName}` : `Selected artist · ${contextArtistName}`) : (isEs ? 'Todos los artistas · Operación global' : 'All artists · Global operations') }}</span></div><div class="agency-heading-actions"><button v-if="canCapture !== false && activeArtists.length && ['overview','bookings'].includes(view)" type="button" class="agency-primary" @click="emit('capture')">+ CUE</button><button v-if="canManageRoster && view === 'overview'" type="button" @click="showAdd = true">{{ isEs ? 'Añadir artista' : 'Add artist' }}</button><button v-if="view !== 'roster'" type="button" @click="emit('navigate', 'roster')">{{ isEs ? 'Ver roster' : 'View roster' }}</button></div></div>
    <p v-if="error" role="alert" class="agency-error">{{ error }} <button type="button" @click="load">{{ isEs ? 'Reintentar' : 'Retry' }}</button></p>
    <div v-if="!activeArtists.length" class="agency-empty"><span>00 / ROSTER</span><h2>{{ isEs ? 'Tu roster todavía está vacío.' : 'Your roster is still empty.' }}</h2><p>{{ isEs ? 'Añade tu primer artista para empezar a gestionar fechas y bookings.' : 'Add your first artist to manage dates and bookings.' }}</p><button v-if="canManageRoster" type="button" @click="showAdd = true">{{ isEs ? 'Añadir primer artista' : 'Add first artist' }}</button></div>
    <template v-else>
      <template v-if="view === 'overview'">
        <div class="agency-stats"><button type="button" @click="emit('navigate', 'roster')"><span>{{ isEs ? 'Artistas' : 'Artists' }}</span><strong>{{ activeArtists.length }}</strong></button><button type="button" @click="emit('navigate', 'bookings')"><span>{{ isEs ? 'Bookings activos' : 'Active bookings' }}</span><strong>{{ loading ? '…' : activeCount }}</strong></button><button type="button" @click="emit('navigate', 'calendar')"><span>{{ isEs ? 'Próximas fechas · este mes' : 'Upcoming dates · this month' }}</span><strong>{{ loading ? '…' : upcomingThisMonthCount }}</strong></button><button type="button" @click="emit('navigate', 'calendar')"><span>{{ isEs ? 'Holds pendientes' : 'Pending holds' }}</span><strong>{{ loading ? '…' : pendingHolds }}</strong></button></div>
        <div class="agency-columns"><BookingCoreAttention :workspace-id="workspaceId" :artists="activeArtists" :bookings="summaryBookings" :locale="locale" :refresh-key="(revision || 0) + attentionRevision" :demo-data="demoData" :can-operate="canCapture !== false" @open-booking="emit('openBooking', $event)" @open-bookings="emit('navigate', 'bookings')" @changed="attentionRevision++; load()" /><section><h2>{{ isEs ? 'PRÓXIMAS FECHAS' : 'UPCOMING DATES' }}</h2><p v-if="!nextEvents.length" class="agency-muted">{{ isEs ? 'No hay fechas confirmadas este mes.' : 'No confirmed dates this month.' }}</p><button v-for="booking in nextEvents" :key="booking.id" class="agency-row" type="button" @click="emit('openBooking', booking.id)"><span><b>{{ label(booking.artist_id) }}</b><strong>{{ eventName(booking) }}</strong></span><time>{{ shortDate(booking.event_date) }}</time></button></section></div>
        <section class="agency-roster-summary"><div><h2>{{ isEs ? 'TU ROSTER' : 'YOUR ROSTER' }}</h2><p>{{ isEs ? 'Entra en un artista para gestionar su booking y su perfil.' : 'Open an artist to manage their bookings and profile.' }}</p></div><div class="agency-roster-shortcuts"><button v-for="artist in activeArtists" :key="artist.id" type="button" @click="emit('selectArtist', artist.id, 'overview')"><span>{{ artist.stage_name.slice(0,2).toUpperCase() }}</span><strong>{{ artist.stage_name }}</strong><small>{{ artist.city || (isEs ? 'Ver workspace' : 'Open workspace') }}</small></button></div></section>
        <section class="agency-recent"><h2>{{ isEs ? 'ACTIVIDAD RECIENTE' : 'RECENT ACTIVITY' }}</h2><p v-if="!recentActivities.length" class="agency-muted">{{ isEs ? 'Todavía no hay actividad.' : 'No activity yet.' }}</p><button v-for="item in recentActivities" :key="item.id" class="agency-row" type="button" @click="emit('openBooking', item.booking_id)"><span><b>{{ label(item.bookings.artist_id) }}</b><strong>{{ item.body || activityTypeLabel(item.type) }}</strong></span><small>{{ shortDate(item.occurred_at.slice(0, 10)) }}</small></button></section>
      </template>
      <template v-else-if="view === 'roster'">
        <div class="agency-actions"><span>{{ activeArtists.length }} {{ isEs ? 'artistas activos' : 'active artists' }}</span><button v-if="canManageRoster" type="button" @click="showAdd = true">+ {{ isEs ? 'Añadir artista' : 'Add artist' }}</button></div>
        <div class="agency-roster"><article v-for="artist in activeArtists" :key="artist.id"><div class="agency-avatar" aria-hidden="true"><img v-if="portraitUrls[artist.id]" :src="portraitUrls[artist.id]" alt="">{{ portraitUrls[artist.id] ? '' : artist.stage_name.slice(0, 2).toUpperCase() }}</div><div><span>ARTIST / {{ artist.slug }}</span><h2>{{ artist.stage_name }}</h2><p>{{ artist.city || (isEs ? 'Ciudad sin definir' : 'City not set') }} · {{ upcomingSnapshotLabel(artist.id) }}</p><small>{{ isEs ? 'Activo' : 'Active' }}</small></div><div class="agency-roster-actions"><button type="button" @click="emit('selectArtist', artist.id, 'overview')">{{ isEs ? 'Entrar' : 'Open' }}</button><button v-if="canManageRoster" type="button" @click="emit('selectArtist', artist.id, 'profile')">{{ isEs ? 'Editar' : 'Edit' }}</button><button v-if="canManageRoster" type="button" @click="confirmRetire(artist)">{{ isEs ? 'Retirar del roster' : 'Remove from roster' }}</button></div></article></div>

      </template>
      <template v-else-if="view === 'bookings' || view === 'history'">
        <label v-if="!contextArtistName" class="agency-filter">{{ isEs ? 'Filtrar por artista' : 'Filter by artist' }}<select v-model="filterArtist"><option value="all">{{ isEs ? 'Todos los artistas' : 'All artists' }}</option><option v-for="artist in activeArtists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
        <template v-if="view === 'bookings'"><p v-if="!visibleBookings.length" class="agency-muted">{{ isEs ? 'Aún no hay bookings para este filtro.' : 'No bookings for this filter yet.' }}</p><div class="agency-list"><button v-for="booking in visibleBookings" :key="booking.id" class="agency-row" type="button" @click="emit('openBooking', booking.id)"><span><b>{{ label(booking.artist_id) }}</b><strong>{{ eventName(booking) }}</strong><small>{{ contact(booking) }}</small></span><time>{{ shortDate(booking.event_date) }}</time><em>{{ bookingStatusLabel(booking.status) }}</em></button></div><div class="agency-pages"><button :disabled="page === 0" type="button" @click="page--">←</button><span>{{ page + 1 }}</span><button :disabled="bookings.length < pageSize" type="button" @click="page++">→</button></div></template>
        <template v-else><p v-if="!visibleActivities.length" class="agency-muted">{{ isEs ? 'Aún no hay actividad real para este filtro.' : 'No activity for this filter yet.' }}</p><div class="agency-list"><button v-for="item in visibleActivities" :key="item.id" class="agency-row" type="button" @click="emit('openBooking', item.booking_id)"><span><b>{{ label(item.bookings.artist_id) }} / {{ activityTypeLabel(item.type) }}</b><strong>{{ item.body || item.bookings.event_name || item.bookings.venue_name || 'Booking' }}</strong></span><time>{{ shortDate(item.occurred_at.slice(0, 10)) }}</time></button></div><div class="agency-pages"><button :disabled="activityPage === 0" type="button" @click="activityPage--">←</button><span>{{ activityPage + 1 }}</span><button :disabled="activities.length < pageSize" type="button" @click="activityPage++">→</button></div></template>
      </template>
      <template v-else-if="view === 'calendar'"><div class="agency-month"><button type="button" :aria-label="isEs ? 'Mes anterior' : 'Previous month'" @click="moveMonth(-1)">←</button><h2>{{ monthLabel }}</h2><button type="button" :aria-label="isEs ? 'Mes siguiente' : 'Next month'" @click="moveMonth(1)">→</button></div><fieldset class="agency-calendar-filters"><legend>{{ isEs ? 'Artistas visibles' : 'Visible artists' }}</legend><label v-for="artist in activeArtists" :key="artist.id"><input type="checkbox" :checked="calendarArtists.includes(artist.id)" @change="toggleCalendarArtist(artist.id)">{{ artist.stage_name }}</label></fieldset><div class="agency-calendar"><span v-for="(day, index) in (isEs ? ['L','M','X','J','V','S','D'] : ['M','T','W','T','F','S','S'])" :key="index" class="agency-weekday">{{ day }}</span><div v-for="(day, index) in calendarDays" :key="`${day}-${index}`" class="agency-day" :class="{ 'agency-day--empty': !day }"><button v-if="day" class="agency-day-date" type="button" :aria-pressed="selectedDay === day" @click="selectedDay = day">{{ Number(day.slice(-2)) }}</button><button v-for="booking in visibleMonthBookings.filter(item => item.event_date === day)" :key="booking.id" type="button" @click="emit('openBooking', booking.id)"><b>{{ label(booking.artist_id) }}</b><small>{{ eventName(booking) }}</small></button><button v-for="hold in visibleHolds.filter(item => item.event_date === day)" :key="hold.id" class="agency-hold" type="button" @click="emit('openBooking', hold.booking_id)"><b>{{ label(hold.bookings.artist_id) }}</b><small>Hold</small></button></div></div><div v-if="selectedDay" class="agency-day-agenda"><h3>{{ shortDate(selectedDay) }} / {{ isEs ? 'Agenda' : 'Schedule' }}</h3><button v-for="booking in visibleMonthBookings.filter(item => item.event_date === selectedDay)" :key="booking.id" type="button" @click="emit('openBooking', booking.id)"><b>{{ label(booking.artist_id) }}</b><span>{{ eventName(booking) }}</span></button><button v-for="hold in visibleHolds.filter(item => item.event_date === selectedDay)" :key="hold.id" type="button" @click="emit('openBooking', hold.booking_id)"><b>{{ label(hold.bookings.artist_id) }}</b><span>Hold</span></button><p v-if="!visibleMonthBookings.some(item => item.event_date === selectedDay) && !visibleHolds.some(item => item.event_date === selectedDay)" class="agency-muted">{{ isEs ? 'Sin fechas ni holds.' : 'No dates or holds.' }}</p></div></template>
    </template>
        <div v-if="view === 'roster' && artists.some(item => item.roster_active === false)" class="agency-retired"><button type="button" @click="showRetired = !showRetired">{{ showRetired ? '−' : '+' }} {{ isEs ? 'Artistas retirados' : 'Removed artists' }}</button><div v-if="showRetired" class="agency-roster"><article v-for="artist in artists.filter(item => item.roster_active === false)" :key="artist.id"><div><h2>{{ artist.stage_name }}</h2><p>{{ isEs ? 'Historial conservado' : 'History retained' }}</p></div><button v-if="canManageRoster" type="button" @click="emit('restoreArtist', artist.id)">{{ isEs ? 'Reincorporar' : 'Restore' }}</button></article></div></div>
    <Teleport to="body"><dialog v-if="canManageRoster" ref="addDialog" class="agency-add" @cancel="showAdd = false"><form @submit.prevent="submitArtist"><div><h2>{{ isEs ? 'AÑADIR AL ROSTER' : 'ADD TO ROSTER' }}</h2><button type="button" :aria-label="isEs ? 'Cerrar' : 'Close'" @click="showAdd = false">×</button></div><label>{{ isEs ? 'Nombre artístico' : 'Artist name' }}<input v-model="artistName" required maxlength="100"></label><label>Slug<input v-model="artistSlug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required></label><label>{{ isEs ? 'Ciudad base (opcional)' : 'Base city (optional)' }}<input v-model="artistCity" maxlength="120"></label><p v-if="addError" role="alert">{{ addError }}</p><button type="submit" :disabled="submittingArtist">{{ submittingArtist ? (isEs ? 'Creando…' : 'Creating…') : (isEs ? 'Crear artista' : 'Create artist') }}</button></form></dialog></Teleport>
  </section>
</template>

<style scoped>
.agency{max-width:1440px;margin:auto;padding:clamp(20px,4vw,56px) 0;color:var(--cue-text)}.agency-heading{display:flex;justify-content:space-between;align-items:end;gap:20px;border-bottom:1px solid var(--cue-border);padding-bottom:25px}.agency-heading p,.agency-roster article span,.agency-empty span{font-size:.7rem;letter-spacing:.18em;color:var(--cue-accent);font-weight:800}.agency-heading h1{font-size:clamp(2rem,5vw,4.5rem);letter-spacing:-.06em;line-height:1;margin:.45em 0}.agency-heading span,.agency-muted,.agency-roster p{color:var(--cue-muted,#9a9a9a)}button{cursor:pointer}.agency-heading button,.agency-actions button,.agency-empty button,.agency-add button[type=submit]{border:1px solid var(--cue-accent);background:var(--cue-accent);color:#10130d;padding:12px 18px;font-weight:800}.agency-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:24px 0}.agency-stats button{background:color-mix(in srgb,var(--cue-text) 5%,var(--cue-bg));border:1px solid var(--cue-border);color:inherit;text-align:left;padding:24px;min-height:140px}.agency-stats span,.agency-stats strong{display:block}.agency-stats span{font-size:.76rem;text-transform:uppercase;letter-spacing:.11em}.agency-stats strong{font-size:3.5rem;line-height:1;margin-top:20px;color:var(--cue-accent)}.agency-columns{display:grid;grid-template-columns:1fr 1fr;gap:14px}.agency-columns section,.agency-recent,.agency-roster article,.agency-empty,.agency-add{border:1px solid var(--cue-border);background:color-mix(in srgb,var(--cue-text) 3%,var(--cue-bg));padding:22px}.agency-columns h2,.agency-recent h2,.agency-add h2{font-size:.8rem;letter-spacing:.13em;margin:0 0 15px}.agency-recent{margin-top:14px}.agency-row{display:flex;gap:16px;align-items:center;justify-content:space-between;width:100%;padding:16px 3px;border:0;border-top:1px solid var(--cue-border);background:transparent;color:inherit;text-align:left}.agency-row:hover,.agency-row:focus-visible{color:var(--cue-accent)}.agency-row span{display:grid;gap:5px;min-width:0}.agency-row b{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--cue-accent)}.agency-row strong{font-size:1rem;overflow:hidden;text-overflow:ellipsis}.agency-row small,.agency-row time,.agency-row em{font-size:.78rem;color:var(--cue-muted,#999);font-style:normal}.agency-list{margin-top:25px}.agency-filter{display:flex;align-items:center;gap:12px;margin:25px 0}.agency-filter select,.agency-add input{background:var(--cue-bg);color:var(--cue-text);border:1px solid var(--cue-border);padding:12px;min-width:0}.agency-actions{display:flex;justify-content:space-between;align-items:center;margin:25px 0}.agency-roster{display:grid;gap:10px}.agency-roster article{display:flex;align-items:center;gap:20px}.agency-avatar{display:grid;place-items:center;flex:none;width:68px;height:68px;border:1px solid var(--cue-accent);font-weight:900;font-size:1.3rem}.agency-roster h2{margin:5px 0;font-size:1.45rem}.agency-roster p{margin:5px 0}.agency-roster-actions{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}.agency-roster-actions button,.agency-retired button,.agency-pages button{background:transparent;border:1px solid var(--cue-border);color:inherit;padding:10px}.agency-roster-actions button:first-child{border-color:var(--cue-accent);color:var(--cue-accent)}.agency-retired{margin-top:24px}.agency-empty{margin-top:25px;padding:clamp(25px,5vw,60px)}.agency-empty h2{font-size:clamp(2rem,5vw,4rem);letter-spacing:-.05em}.agency-error{padding:15px;border:1px solid #d75b58}.agency-month{display:flex;justify-content:center;align-items:center;gap:25px;margin:22px 0}.agency-month h2{text-transform:none}.agency-month button{background:transparent;border:1px solid var(--cue-border);color:inherit;padding:10px 15px}.agency-calendar-filters{border:0;display:flex;flex-wrap:wrap;gap:12px;padding:0 0 20px}.agency-calendar-filters legend{font-size:.8rem;margin-bottom:10px}.agency-calendar-filters label{display:flex;gap:8px;align-items:center}.agency-calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-top:1px solid var(--cue-border);border-left:1px solid var(--cue-border)}.agency-weekday{text-align:center;padding:10px}.agency-day{min-width:0;min-height:105px;border-right:1px solid var(--cue-border);border-bottom:1px solid var(--cue-border);padding:8px;overflow:hidden}.agency-day>span:first-child{font-size:.78rem}.agency-day button{display:block;width:100%;text-align:left;margin-top:5px;padding:5px;border:0;border-left:2px solid var(--cue-accent);background:color-mix(in srgb,var(--cue-accent) 10%,var(--cue-bg));color:inherit}.agency-day b,.agency-day small{display:block;font-size:.65rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.agency-hold{display:block;color:var(--cue-accent);font-size:.68rem;margin-top:4px}.agency-add{position:fixed;z-index:50;right:20px;top:80px;width:min(400px,calc(100vw - 40px));box-shadow:0 15px 60px #0009}.agency-add>div{display:flex;justify-content:space-between}.agency-add>div button{background:none;border:0;color:inherit;font-size:1.5rem}.agency-add label{display:grid;gap:8px;margin:15px 0}.agency-pages{display:flex;justify-content:center;gap:20px;align-items:center;margin:20px}
@media(max-width:750px){.agency-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.agency-stats button{min-height:110px;padding:16px}.agency-stats strong{font-size:2.5rem}.agency-columns{grid-template-columns:1fr}.agency-roster article{align-items:start;flex-wrap:wrap}.agency-roster-actions{width:100%;margin-left:0}.agency-day{min-height:60px;padding:3px}.agency-day button{padding:3px}.agency-day small{display:none}.agency-day b{font-size:.55rem}.agency-heading{align-items:start}.agency-heading button{white-space:nowrap;padding:8px}.agency-row{flex-wrap:wrap}.agency-filter{align-items:start;flex-direction:column}}
.agency-avatar img{width:100%;height:100%;object-fit:cover}
.agency-calendar .agency-day-date{display:block;width:auto;background:transparent;border:0;padding:3px 6px;color:inherit;font-weight:800}
.agency-calendar .agency-day-date[aria-pressed=true]{background:var(--cue-accent);color:#10130d}
.agency-day-agenda{padding:18px;border:1px solid var(--cue-border);border-top:0}
.agency-day-agenda h3{font-size:.8rem;letter-spacing:.1em;text-transform:uppercase}
.agency-day-agenda>button{width:100%;display:flex;gap:16px;padding:13px 0;background:transparent;color:inherit;border:0;border-top:1px solid var(--cue-border);text-align:left}
.agency-day-agenda>button b{min-width:110px;color:var(--cue-accent)}
@media(min-width:751px){.agency-day-agenda{display:none}}
</style>

<style scoped>
.agency-heading h1{font-size:clamp(2.4rem,4.4vw,4.5rem)}.agency-heading-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end}.agency-heading-actions .agency-primary{background:var(--cue-accent);color:#10130d}.agency-columns{grid-template-columns:1.2fr 1fr}.agency-roster-summary{border:1px solid var(--cue-border);padding:22px;margin-top:14px;background:var(--cue-surface)}.agency-roster-summary h2{font:700 12px monospace;letter-spacing:.1em}.agency-roster-summary p{font-size:12px;color:var(--cue-muted)}.agency-roster-shortcuts{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}.agency-roster-shortcuts button{display:grid;grid-template-columns:40px 1fr;text-align:left;gap:4px 12px;padding:14px;background:transparent;color:var(--cue-text);border:1px solid var(--cue-border);cursor:pointer}.agency-roster-shortcuts span{grid-row:span 2;align-self:center;color:var(--cue-accent);font-weight:800}.agency-roster-shortcuts small{color:var(--cue-muted)}.agency-add{position:fixed;inset:0;margin:auto;max-height:calc(100dvh - 40px);overflow:auto;color:var(--cue-text);background:var(--cue-bg);z-index:100}.agency-add::backdrop{background:#000b;backdrop-filter:blur(4px)}.agency-add form>div{display:flex;justify-content:space-between;align-items:center}.agency-add form>div button{background:transparent;color:inherit;border:1px solid var(--cue-border);padding:8px}.agency-columns>:first-child{min-width:0}@media(max-width:750px){.agency-columns{grid-template-columns:1fr}.agency-heading{flex-direction:column;gap:16px}.agency-heading-actions{justify-content:flex-start}.agency-roster-shortcuts{grid-template-columns:1fr}}
</style>
