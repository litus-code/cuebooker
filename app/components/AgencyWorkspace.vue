<script setup lang="ts">
import type { CoreBooking, Hold, NextMove } from '../domain/bookingCore'
import type { CueNotification } from '../domain/notification'
import type { WorkspaceActivityHistoryRow } from '../services/bookingCoreApi'
import { agencyActiveBookingCount, filterRosterBookings } from '../domain/agencyRoster'
import { emailReplyPresentation } from '../services/emailReplyPresentation'

type RosterArtist = { id: string; stage_name: string; slug: string; city?: string | null; artist_image_path?: string | null; cover_image_path?: string | null; roster_active?: boolean }
type AgencyDemoData = {
  bookings: CoreBooking[]
  activities: WorkspaceActivityHistoryRow[]
  holds: Array<Hold & { bookings: { artist_id: string } }>
  contacts: Array<{ id: string; name: string }>
  notifications?: CueNotification[]
  nextMoves?: NextMove[]
  counterparties: Array<{ id: string; name: string }>
}
const props = withDefaults(defineProps<{
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
  selectedArtistId?: string
  contextArtistName?: string
  contextState?: { filterArtist: string; calendarArtists: string[]; month: string; selectedDay: string }
}>(), { canCapture: true })
const emit = defineEmits<{
  selectArtist: [artistId: string, view: 'overview' | 'profile']
  openBooking: [bookingId: string]
  retireArtist: [artistId: string]
  restoreArtist: [artistId: string]
  contextChanged: [state: { filterArtist: string; calendarArtists: string[]; month: string; selectedDay: string }]
  filterArtist: [artistId: string]
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
const filterArtist = ref(props.contextState?.filterArtist || (!props.demoData && typeof route.query.rosterArtist === 'string' ? route.query.rosterArtist : 'all'))
const calendarArtists = ref<string[]>(props.contextState?.calendarArtists.slice() || (!props.demoData && typeof route.query.rosterCalendar === 'string' ? route.query.rosterCalendar.split(',').filter(Boolean) : []))
const calendarFilterInitialized = ref(Boolean(props.contextState) || !props.demoData && typeof route.query.rosterCalendar === 'string')
const month = ref(props.contextState?.month || props.initialMonth || (!props.demoData && typeof route.query.rosterMonth === 'string' && /^\d{4}-\d{2}-01$/.test(route.query.rosterMonth) ? route.query.rosterMonth : '') || new Date().toISOString().slice(0, 7) + '-01')
const today = new Date().toISOString().slice(0, 10)
const selectedDay = ref(props.contextState?.selectedDay ?? (!props.demoData && typeof route.query.rosterDay === 'string' ? route.query.rosterDay : month.value.slice(0, 7) === today.slice(0, 7) ? today : ''))
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
const pageSize = 10
const activityPage = ref(0)
watch([filterArtist, calendarArtists, month, selectedDay], () => emit('contextChanged', { filterArtist: filterArtist.value, calendarArtists: [...calendarArtists.value], month: month.value, selectedDay: selectedDay.value }), { immediate: true })
const activeArtists = computed(() => props.artists.filter(artist => artist.roster_active !== false))
const scopedArtists = computed(() => props.view !== 'roster' && props.selectedArtistId ? activeArtists.value.filter(a => a.id === props.selectedArtistId) : activeArtists.value)
watch(() => [props.selectedArtistId, props.view], () => {
  filterArtist.value = props.view === 'roster' ? 'all' : props.selectedArtistId || 'all'
  if (props.selectedArtistId) calendarArtists.value = [props.selectedArtistId]
  else if (props.view === 'calendar') calendarArtists.value = props.contextState?.calendarArtists.slice() || (typeof route.query.rosterCalendar === 'string' ? route.query.rosterCalendar.split(',').filter(id => activeArtists.value.some(a => a.id === id)) : activeArtists.value.map(a => a.id))
}, { immediate: true })
const activeIds = computed(() => new Set(activeArtists.value.map(artist => artist.id)))
const visibleBookings = computed(() => filterRosterBookings(bookings.value, activeArtists.value, filterArtist.value === 'all' ? undefined : [filterArtist.value]).slice(0, pageSize))
const visibleActivities = computed(() => activities.value.filter(activity => activeIds.value.has(activity.bookings?.artist_id) && (filterArtist.value === 'all' || activity.bookings?.artist_id === filterArtist.value)).slice(0, props.view === 'history' ? pageSize : 100))
const recentActivities = computed(() => activities.value.filter(activity => scopedArtists.value.some(a => a.id === activity.bookings?.artist_id)).slice(0, 5))
function activityPreview(activity: WorkspaceActivityHistoryRow) {
  return activity.type === 'email' ? emailReplyPresentation(activity.body || '').body : activity.body
}
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
  return [...Array(offset).fill(''), ...Array.from({ length: count }, (_, i) => `${month.value.slice(0, 7)}-${String(i + 1).padStart(2, '0')}`), ...Array((7 - (offset + count) % 7) % 7).fill('')]
})
const nextEvents = computed(() => filterRosterBookings(monthBookings.value, scopedArtists.value).filter(item => item.event_date && item.event_date >= new Date().toISOString().slice(0, 10)).slice(0, 8))
const upcomingThisMonthCount = computed(() => filterRosterBookings(monthBookings.value, scopedArtists.value).filter(item => item.event_date && item.event_date >= new Date().toISOString().slice(0, 10)).length)
const activeCount = computed(() => exactActiveCount.value ?? `≥${agencyActiveBookingCount(filterRosterBookings(summaryBookings.value, scopedArtists.value))}`)
const pendingHolds = computed(() => exactHoldCount.value ?? `≥${holds.value.filter(item => item.status === 'active' && scopedArtists.value.some(a => a.id === item.bookings.artist_id)).length}`)

const isEs = computed(() => props.locale === 'es')
const title = computed(() => props.contextArtistName && props.view !== 'roster'
  ? ({ overview: props.contextArtistName.toUpperCase(), bookings: 'BOOKINGS', calendar: isEs.value ? 'CALENDARIO' : 'CALENDAR', history: isEs.value ? 'ACTIVIDAD' : 'ACTIVITY' })[props.view]
  : ({ overview: isEs.value ? 'PULSO DEL ROSTER.' : 'THE ROSTER PULSE.', bookings: 'BOOKINGS / ROSTER', calendar: isEs.value ? 'CALENDARIO DEL ROSTER.' : 'ROSTER CALENDAR.', history: 'ACTIVITY / ROSTER', roster: isEs.value ? 'ARTISTAS.' : 'ARTISTS.' })[props.view])
function calendarCount(day: string | null) { return day ? visibleMonthBookings.value.filter(item => item.event_date === day).length + visibleHolds.value.filter(item => item.event_date === day).length : 0 }
const monthLabel = computed(() => {
  const label = new Intl.DateTimeFormat(isEs.value ? 'es-ES' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(currentMonth.value)
  return label.charAt(0).toUpperCase() + label.slice(1)
})

function label(id: string | null) { return id === null ? (isEs.value ? 'Solicitud de agencia' : 'Agency enquiry') : props.artists.find(item => item.id === id)?.stage_name || (isEs.value ? 'Artista' : 'Artist') }
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
  calendarArtists.value = props.selectedArtistId ? [props.selectedArtistId] : calendarFilterInitialized.value && !wasAll ? calendarArtists.value.filter(id => existing.has(id)) : rows.map(row => row.id)
  calendarFilterInitialized.value = true
  if (filterArtist.value !== 'all' && !existing.has(filterArtist.value)) filterArtist.value = 'all'
}, { immediate: true })
watch(filterArtist, value => {
  if (props.view === 'roster') return
  if (value !== (props.selectedArtistId || 'all')) emit('filterArtist', value === 'all' ? '' : value)
})
watch([month, selectedDay], () => {
  if (!props.demoData && props.view === 'calendar') void router.replace({ query: { ...route.query, rosterMonth: month.value, rosterDay: selectedDay.value } })
})
watch(calendarArtists, ids => {
  if (props.demoData || props.view !== 'calendar' || props.selectedArtistId) return
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
    const ids = new Set(scopedArtists.value.map(a => a.id))
    const rows = props.demoData.bookings.filter(item => ids.has(item.artist_id))
    const filtered = filterArtist.value === 'all' ? rows : rows.filter(item => item.artist_id === filterArtist.value)
    bookings.value = filtered.slice(page.value * pageSize, (page.value + 1) * pageSize + 1)
    summaryBookings.value = rows.slice(0, 100)
    exactActiveCount.value = agencyActiveBookingCount(rows)
    exactHoldCount.value = props.demoData.holds.filter(item => item.status === 'active' && ids.has(item.bookings.artist_id)).length
    monthBookings.value = rows.filter(item => item.status === 'confirmed' && !item.archived_at && item.event_date && item.event_date >= month.value && item.event_date < monthEnd.value)
    const activityRows = props.demoData.activities.filter(item => ids.has(item.bookings.artist_id) && (props.view !== 'history' || filterArtist.value === 'all' || item.bookings.artist_id === filterArtist.value))
    activities.value = activityRows.slice((props.view === 'history' ? activityPage.value : 0) * pageSize, props.view === 'history' ? (activityPage.value + 1) * pageSize + 1 : 100)
    holds.value = props.demoData.holds.filter(item => ids.has(item.bookings.artist_id) && item.event_date >= month.value && item.event_date < monthEnd.value)
    contacts.value = props.demoData.contacts
    counterparties.value = props.demoData.counterparties
    loading.value = false
    return
  }
  try {
    const [rows, summaryRows, count, holdCount, monthRows, activityRows, holdRows, contactRows, partyRows] = await Promise.all([
      api.listRosterBookings(props.workspaceId, page.value * pageSize, pageSize + 1, filterArtist.value === 'all' ? undefined : filterArtist.value, activeArtists.value.map(item => item.id), filterArtist.value === 'all'),
      api.listRosterBookings(props.workspaceId, 0, 100, undefined, scopedArtists.value.map(item => item.id), !props.selectedArtistId),
      api.countRosterActiveBookings(props.workspaceId, scopedArtists.value.map(item => item.id), !props.selectedArtistId).catch(() => null),
      api.countRosterActiveHolds(props.workspaceId, scopedArtists.value.map(item => item.id)).catch(() => null),
      api.listRosterCalendarBookings(props.workspaceId, month.value, monthEnd.value),
      api.listRosterActivities(props.workspaceId, (props.view === 'history' ? activityPage.value : 0) * pageSize, props.view === 'history' ? pageSize + 1 : 100, filterArtist.value === 'all' || props.view !== 'history' ? scopedArtists.value.map(item => item.id) : [filterArtist.value]),
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
    if (current === request) error.value = isEs.value ? 'No se pudieron cargar los datos de la agencia. Comprueba la conexión e inténtalo de nuevo.' : 'Agency data could not be loaded. Check your connection and try again.'
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
  <section class="agency" :class="{ 'agency--roster': view === 'roster' }" :aria-busy="loading">
    <div class="agency-heading"><div><h1>{{ title }}</h1></div><div class="agency-heading-actions"><div v-if="view === 'roster'" class="agency-roster-heading-tools"><span>{{ activeArtists.length }} {{ isEs ? 'artistas activos' : 'active artists' }}</span><button v-if="canManageRoster" type="button" @click="showAdd = true">+ {{ isEs ? 'Añadir artista' : 'Add artist' }}</button></div><template v-else><button v-if="canCapture !== false && activeArtists.length && ['overview','bookings'].includes(view)" type="button" class="agency-primary" @click="emit('capture')">+ CUE</button><button v-if="canManageRoster && view === 'overview'" type="button" @click="showAdd = true">{{ isEs ? 'Añadir artista' : 'Add artist' }}</button><button v-if="view === 'overview'" type="button" @click="emit('navigate', 'roster')">{{ isEs ? 'Ver roster' : 'View roster' }}</button></template></div></div>
    <p v-if="error" role="alert" class="agency-error">{{ error }} <button type="button" @click="load">{{ isEs ? 'Reintentar' : 'Retry' }}</button></p>
    <div v-if="!activeArtists.length" class="agency-empty"><span>00 / ROSTER</span><h2>{{ isEs ? 'Tu roster todavía está vacío.' : 'Your roster is still empty.' }}</h2><p>{{ isEs ? 'Añade tu primer artista para empezar a gestionar fechas y bookings.' : 'Add your first artist to manage dates and bookings.' }}</p><button v-if="canManageRoster" type="button" @click="showAdd = true">{{ isEs ? 'Añadir primer artista' : 'Add first artist' }}</button></div>
    <template v-else>
      <template v-if="view === 'overview'">
        <div class="agency-stats"><button type="button" @click="emit('navigate', 'roster')"><span>{{ isEs ? 'Artistas' : 'Artists' }}</span><strong>{{ scopedArtists.length }}</strong></button><button type="button" @click="emit('navigate', 'bookings')"><span>{{ isEs ? 'Bookings activos' : 'Active bookings' }}</span><strong>{{ loading ? '…' : activeCount }}</strong></button><button type="button" @click="emit('navigate', 'calendar')"><span>{{ isEs ? 'Próximas fechas · este mes' : 'Upcoming dates · this month' }}</span><strong>{{ loading ? '…' : upcomingThisMonthCount }}</strong></button><button type="button" @click="emit('navigate', 'calendar')"><span>{{ isEs ? 'Holds pendientes' : 'Pending holds' }}</span><strong>{{ loading ? '…' : pendingHolds }}</strong></button></div>
        <div class="agency-columns"><BookingCoreAttention :include-agency-requests="!selectedArtistId" :workspace-id="workspaceId" :artists="scopedArtists" :bookings="summaryBookings" :locale="locale" :refresh-key="(revision || 0) + attentionRevision" :demo-data="demoData" :can-operate="canCapture !== false" @open-booking="emit('openBooking', $event)" @open-bookings="emit('navigate', 'bookings')" @changed="attentionRevision++; load()" /><section><h2>{{ isEs ? 'PRÓXIMAS FECHAS' : 'UPCOMING DATES' }}</h2><p v-if="!nextEvents.length" class="agency-muted">{{ isEs ? 'No hay fechas confirmadas este mes.' : 'No confirmed dates this month.' }}</p><button v-for="booking in nextEvents" :key="booking.id" class="agency-row" type="button" @click="emit('openBooking', booking.id)"><span><b>{{ label(booking.artist_id) }}</b><strong>{{ eventName(booking) }}</strong></span><time>{{ shortDate(booking.event_date) }}</time></button></section></div>
        <section class="agency-roster-summary"><div><h2>{{ isEs ? 'TU ROSTER' : 'YOUR ROSTER' }}</h2><p>{{ isEs ? 'Filtra la operativa por artista o completa su ficha desde Artistas.' : 'Filter operations by artist or complete their record in Artists.' }}</p></div><div class="agency-roster-shortcuts"><button v-for="artist in activeArtists" :key="artist.id" type="button" @click="emit('selectArtist', artist.id, 'overview')"><span>{{ artist.stage_name.slice(0,2).toUpperCase() }}</span><strong>{{ artist.stage_name }}</strong><small>{{ artist.city || (isEs ? 'Filtrar operativa' : 'Filter operations') }}</small></button></div></section>
<section class="agency-recent"><h2>{{ isEs ? 'ACTIVIDAD RECIENTE' : 'RECENT ACTIVITY' }}</h2><p v-if="!recentActivities.length" class="agency-muted">{{ isEs ? 'Todavía no hay actividad.' : 'No activity yet.' }}</p><button v-for="item in recentActivities" :key="item.id" class="agency-row" type="button" @click="emit('openBooking', item.booking_id)"><span><b>{{ label(item.bookings.artist_id) }}</b><strong>{{ activityPreview(item) || activityTypeLabel(item.type) }}</strong></span><small>{{ shortDate(item.occurred_at.slice(0, 10)) }}</small></button></section>
      </template>
      <template v-else-if="view === 'roster'">
        <div class="agency-roster"><article v-for="artist in activeArtists" :key="artist.id"><div class="agency-avatar" aria-hidden="true"><img v-if="portraitUrls[artist.id]" :src="portraitUrls[artist.id]" alt="">{{ portraitUrls[artist.id] ? '' : artist.stage_name.slice(0, 2).toUpperCase() }}</div><div><span>ARTIST / {{ artist.slug }}</span><h2>{{ artist.stage_name }}</h2><p>{{ artist.city || (isEs ? 'Ciudad sin definir' : 'City not set') }} · {{ upcomingSnapshotLabel(artist.id) }}</p><small class="agency-artist-active">{{ isEs ? 'En el roster' : 'On the roster' }}</small></div><div class="agency-roster-actions"><button type="button" @click="emit('selectArtist', artist.id, 'profile')">{{ canManageRoster ? (isEs ? 'Editar ficha' : 'Edit record') : (isEs ? 'Ver ficha' : 'View record') }}</button><button v-if="canManageRoster" type="button" @click="confirmRetire(artist)">{{ isEs ? 'Retirar del roster' : 'Remove from roster' }}</button></div></article></div>

      </template>
      <template v-else-if="view === 'bookings' || view === 'history'">
        <MailboxRequestsPanel v-if="view === 'bookings' && !demoData && canCapture !== false" :workspace-id="workspaceId" :locale="locale" :artists="activeArtists" @created="(id) => { load(); emit('openBooking',id) }" />
        <label v-if="!contextArtistName" class="agency-filter">{{ isEs ? 'Filtrar por artista' : 'Filter by artist' }}<select v-model="filterArtist"><option value="all">{{ isEs ? 'Todos los artistas' : 'All artists' }}</option><option v-for="artist in activeArtists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
        <template v-if="view === 'bookings'"><p v-if="!visibleBookings.length" class="agency-muted">{{ isEs ? 'Aún no hay bookings para este filtro.' : 'No bookings for this filter yet.' }}</p><div class="agency-list"><button v-for="booking in visibleBookings" :key="booking.id" class="agency-row agency-booking-row" :class="`agency-booking-row--${booking.status}`" type="button" @click="emit('openBooking', booking.id)"><time class="agency-booking-date" :datetime="booking.event_date || undefined">{{ booking.event_date ? new Intl.DateTimeFormat(isEs ? 'es-ES' : 'en-GB', {day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(`${booking.event_date}T12:00:00Z`)) : (isEs ? 'Sin fecha' : 'No date') }}</time><span><b>{{ label(booking.artist_id) }}</b><strong>{{ eventName(booking) }}</strong><small>{{ contact(booking) }}</small></span><em class="agency-booking-status">{{ bookingStatusLabel(booking.status) }}</em></button></div><div v-if="page > 0 || bookings.length > pageSize" class="agency-pages"><button :aria-label="isEs ? 'Página anterior' : 'Previous page'" :disabled="page === 0" type="button" @click="page--">←</button><span>{{ page + 1 }}</span><button :aria-label="isEs ? 'Página siguiente' : 'Next page'" :disabled="bookings.length <= pageSize" type="button" @click="page++">→</button></div></template>
        <template v-else><p v-if="!visibleActivities.length" class="agency-muted">{{ isEs ? 'Aún no hay actividad real para este filtro.' : 'No activity for this filter yet.' }}</p><div class="agency-list"><button v-for="item in visibleActivities" :key="item.id" class="agency-row" type="button" @click="emit('openBooking', item.booking_id)"><span><b>{{ label(item.bookings.artist_id) }} / {{ activityTypeLabel(item.type) }}</b><strong>{{ activityPreview(item) || item.bookings.event_name || item.bookings.venue_name || 'Booking' }}</strong></span><time>{{ shortDate(item.occurred_at.slice(0, 10)) }}</time></button></div><div v-if="activityPage > 0 || activities.length > pageSize" class="agency-pages"><button :aria-label="isEs ? 'Página anterior' : 'Previous page'" :disabled="activityPage === 0" type="button" @click="activityPage--">←</button><span>{{ activityPage + 1 }}</span><button :aria-label="isEs ? 'Página siguiente' : 'Next page'" :disabled="activities.length <= pageSize" type="button" @click="activityPage++">→</button></div></template>
      </template>
      <template v-else-if="view === 'calendar'">
        <fieldset v-if="!selectedArtistId" class="agency-calendar-filters"><legend>{{ isEs ? 'Artistas visibles' : 'Visible artists' }}</legend><label v-for="artist in activeArtists" :key="artist.id"><input type="checkbox" :checked="calendarArtists.includes(artist.id)" @change="toggleCalendarArtist(artist.id)">{{ artist.stage_name }}</label></fieldset>
        <div class="agency-calendar-layout">
          <section class="agency-month-panel">
            <div class="agency-month"><button type="button" :aria-label="isEs ? 'Mes anterior' : 'Previous month'" @click="moveMonth(-1)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg></button><h2>{{ monthLabel }}</h2><button type="button" :aria-label="isEs ? 'Mes siguiente' : 'Next month'" @click="moveMonth(1)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6" /></svg></button></div>
            <div class="agency-calendar">
              <span v-for="(day, index) in (isEs ? ['L','M','X','J','V','S','D'] : ['M','T','W','T','F','S','S'])" :key="index" class="agency-weekday">{{ day }}</span>
              <button v-for="(day, index) in calendarDays" :key="`${day}-${index}`" type="button" class="agency-calendar-cell" :class="{ 'is-empty': !day, 'is-selected': selectedDay === day, 'is-today': today === day }" :disabled="!day" :aria-pressed="Boolean(day && selectedDay === day)" :aria-current="day === today ? 'date' : undefined" :aria-label="day ? `${shortDate(day)} · ${calendarCount(day)} ${isEs ? 'fechas' : 'dates'}` : undefined" @click="selectedDay = day">
                <span v-if="day">{{ Number(day.slice(-2)) }}</span><small v-if="calendarCount(day)">{{ calendarCount(day) }}</small>
                <span class="agency-day-names"><span v-for="booking in visibleMonthBookings.filter(item => item.event_date === day).slice(0,2)" :key="booking.id" class="is-confirmed">{{ label(booking.artist_id) }}</span><span v-for="hold in visibleHolds.filter(item => item.event_date === day).slice(0, Math.max(0, 2 - visibleMonthBookings.filter(item => item.event_date === day).length))" :key="hold.id" class="is-hold">{{ label(hold.bookings.artist_id) }} · Hold</span><span v-if="calendarCount(day) > 2">+{{ calendarCount(day) - 2 }} {{ isEs ? 'más' : 'more' }}</span></span>
                <span class="agency-day-statuses"><i v-if="visibleHolds.some(item => item.event_date === day)" class="agency-status-dot is-hold" /><i v-if="visibleMonthBookings.some(item => item.event_date === day)" class="agency-status-dot is-confirmed" /></span>
              </button>
            </div>
            <div class="agency-calendar-legend"><span><i class="agency-status-dot is-hold" />Hold</span><span><i class="agency-status-dot is-confirmed" />{{ isEs ? 'Confirmado' : 'Confirmed' }}</span></div>
          </section>
          <section class="agency-day-agenda"><header><p>{{ isEs ? 'AGENDA DEL DÍA' : 'DAY SCHEDULE' }}</p><h3>{{ selectedDay ? shortDate(selectedDay) : (isEs ? 'Selecciona un día' : 'Select a day') }}</h3></header>
            <template v-if="selectedDay"><button v-for="booking in visibleMonthBookings.filter(item => item.event_date === selectedDay)" :key="booking.id" type="button" class="agency-agenda-card" @click="emit('openBooking', booking.id)"><i class="agency-status-dot is-confirmed" /><span><b>{{ label(booking.artist_id) }}</b><strong>{{ eventName(booking) }}</strong><small>{{ isEs ? 'Confirmado' : 'Confirmed' }}</small></span><span aria-hidden="true">→</span></button><button v-for="hold in visibleHolds.filter(item => item.event_date === selectedDay)" :key="hold.id" type="button" class="agency-agenda-card is-hold" @click="emit('openBooking', hold.booking_id)"><i class="agency-status-dot is-hold" /><span><b>{{ label(hold.bookings.artist_id) }}</b><strong>Hold</strong><small>{{ isEs ? 'Reserva provisional' : 'Provisional reservation' }}</small></span><span aria-hidden="true">→</span></button><p v-if="!calendarCount(selectedDay)" class="agency-calendar-empty">{{ isEs ? 'Sin fechas ni holds para este día.' : 'No dates or holds for this day.' }}</p></template>
            <p v-else class="agency-calendar-empty">{{ isEs ? 'Elige una fecha para ver los bookings de los artistas visibles.' : 'Choose a date to see bookings for visible artists.' }}</p>
          </section>
        </div>
      </template>
    </template>
        <div v-if="view === 'roster' && artists.some(item => item.roster_active === false)" class="agency-retired"><button type="button" @click="showRetired = !showRetired">{{ showRetired ? '−' : '+' }} {{ isEs ? 'Artistas retirados' : 'Removed artists' }}</button><div v-if="showRetired" class="agency-roster"><article v-for="artist in artists.filter(item => item.roster_active === false)" :key="artist.id"><div><h2>{{ artist.stage_name }}</h2><p>{{ isEs ? 'Historial conservado' : 'History retained' }}</p></div><button v-if="canManageRoster" type="button" @click="emit('restoreArtist', artist.id)">{{ isEs ? 'Reincorporar' : 'Restore' }}</button></article></div></div>
    <Teleport to="body"><dialog v-if="canManageRoster" ref="addDialog" class="agency-add" @cancel="showAdd = false"><form @submit.prevent="submitArtist"><div><h2>{{ isEs ? 'AÑADIR AL ROSTER' : 'ADD TO ROSTER' }}</h2><button type="button" :aria-label="isEs ? 'Cerrar' : 'Close'" @click="showAdd = false">×</button></div><label>{{ isEs ? 'Nombre artístico' : 'Artist name' }}<input v-model="artistName" required maxlength="100"></label><label>Slug<input v-model="artistSlug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required></label><label>{{ isEs ? 'Ciudad base (opcional)' : 'Base city (optional)' }}<input v-model="artistCity" maxlength="120"></label><p v-if="addError" role="alert">{{ addError }}</p><button type="submit" :disabled="submittingArtist">{{ submittingArtist ? (isEs ? 'Creando…' : 'Creating…') : (isEs ? 'Crear artista' : 'Create artist') }}</button></form></dialog></Teleport>
  </section>
</template>

<style scoped>
.agency{max-width:1440px;margin:auto;padding:clamp(20px,4vw,56px) 0;color:var(--cue-text)}.agency-heading{box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;gap:20px;min-height:156px;margin:0 0 28px;padding:32px clamp(20px,3vw,38px);border:0;border-bottom:1px solid var(--cue-border);background:var(--cue-surface)}.agency-heading p,.agency-roster article span,.agency-empty span{font-size:.7rem;letter-spacing:.18em;color:var(--cue-accent);font-weight:800}.agency-heading h1{font-size:clamp(2rem,5vw,4.5rem);letter-spacing:-.06em;line-height:1;margin:.45em 0}.agency-heading span,.agency-muted,.agency-roster p{color:var(--cue-muted,#9a9a9a)}button{cursor:pointer}.agency-heading button,.agency-actions button,.agency-empty button,.agency-add button[type=submit]{border:1px solid var(--cue-accent);background:var(--cue-accent);color:#10130d;padding:12px 18px;font-weight:800}.agency-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:24px 0}.agency-stats button{background:color-mix(in srgb,var(--cue-text) 5%,var(--cue-bg));border:1px solid var(--cue-border);color:inherit;text-align:left;padding:24px;min-height:140px}.agency-stats span,.agency-stats strong{display:block}.agency-stats span{font-size:.76rem;text-transform:uppercase;letter-spacing:.11em}.agency-stats strong{font-size:3.5rem;line-height:1;margin-top:20px;color:var(--cue-accent)}.agency-columns{display:grid;grid-template-columns:1fr 1fr;gap:14px}.agency-columns section,.agency-recent,.agency-roster article,.agency-empty,.agency-add{border:1px solid var(--cue-border);background:color-mix(in srgb,var(--cue-text) 3%,var(--cue-bg));padding:22px}.agency-columns h2,.agency-recent h2,.agency-add h2{font-size:.8rem;letter-spacing:.13em;margin:0 0 15px}.agency-recent{margin-top:14px}.agency-row{display:flex;gap:16px;align-items:center;justify-content:space-between;width:100%;padding:16px 3px;border:0;border-top:1px solid var(--cue-border);background:transparent;color:inherit;text-align:left}.agency-row:hover,.agency-row:focus-visible{color:var(--cue-accent)}.agency-row span{display:grid;gap:5px;min-width:0}.agency-row b{font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--cue-accent)}.agency-row strong{font-size:1rem;overflow:hidden;text-overflow:ellipsis}.agency-row small,.agency-row time,.agency-row em{font-size:.78rem;color:var(--cue-muted,#999);font-style:normal}.agency-list{margin-top:25px}.agency-filter{display:flex;align-items:center;gap:12px;margin:25px 0}.agency-filter select,.agency-add input{background:var(--cue-bg);color:var(--cue-text);border:1px solid var(--cue-border);padding:12px;min-width:0}.agency-actions{display:flex;justify-content:space-between;align-items:center;margin:25px 0}.agency-roster{display:grid;gap:10px}.agency-roster article{display:flex;align-items:center;gap:20px}.agency-avatar{display:grid;place-items:center;flex:none;width:68px;height:68px;border:1px solid var(--cue-accent);font-weight:900;font-size:1.3rem}.agency-roster h2{margin:5px 0;font-size:1.45rem}.agency-roster p{margin:5px 0}.agency-roster-actions{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}.agency-roster-actions button,.agency-retired button,.agency-pages button{background:transparent;border:1px solid var(--cue-border);color:inherit;padding:10px}.agency-roster-actions button:first-child{border-color:var(--cue-accent);color:var(--cue-accent)}.agency-retired{margin-top:24px}.agency-empty{margin-top:25px;padding:clamp(25px,5vw,60px)}.agency-empty h2{font-size:clamp(2rem,5vw,4rem);letter-spacing:-.05em}.agency-error{padding:15px;border:1px solid #d75b58}.agency-month{display:flex;justify-content:center;align-items:center;gap:25px;margin:22px 0}.agency-month h2{text-transform:none}.agency-month button{background:transparent;border:1px solid var(--cue-border);color:inherit;padding:10px 15px}.agency-calendar-filters{border:0;display:flex;flex-wrap:wrap;gap:12px;padding:0 0 20px}.agency-calendar-filters legend{font-size:.8rem;margin-bottom:10px}.agency-calendar-filters label{display:flex;gap:8px;align-items:center}.agency-calendar{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-top:1px solid var(--cue-border);border-left:1px solid var(--cue-border)}.agency-weekday{text-align:center;padding:10px}.agency-day{min-width:0;min-height:105px;border-right:1px solid var(--cue-border);border-bottom:1px solid var(--cue-border);padding:8px;overflow:hidden}.agency-day>span:first-child{font-size:.78rem}.agency-day button{display:block;width:100%;text-align:left;margin-top:5px;padding:5px;border:0;border-left:2px solid var(--cue-accent);background:color-mix(in srgb,var(--cue-accent) 10%,var(--cue-bg));color:inherit}.agency-day b,.agency-day small{display:block;font-size:.65rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.agency-hold{display:block;color:var(--cue-accent);font-size:.68rem;margin-top:4px}.agency-add{position:fixed;z-index:50;right:20px;top:80px;width:min(400px,calc(100vw - 40px));box-shadow:0 15px 60px #0009}.agency-add>div{display:flex;justify-content:space-between}.agency-add>div button{background:none;border:0;color:inherit;font-size:1.5rem}.agency-add label{display:grid;gap:8px;margin:15px 0}.agency-pages{display:flex;justify-content:center;gap:20px;align-items:center;margin:20px}
@media(max-width:750px){.agency-heading{min-height:132px;margin-bottom:20px;padding:26px 22px}.agency-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.agency-stats button{min-height:110px;padding:16px}.agency-stats strong{font-size:2.5rem}.agency-columns{grid-template-columns:1fr}.agency-roster article{align-items:start;flex-wrap:wrap}.agency-roster-actions{width:100%;margin-left:0}.agency-day{min-height:60px;padding:3px}.agency-day button{padding:3px}.agency-day small{display:none}.agency-day b{font-size:.55rem}.agency-heading{align-items:start}.agency-heading button{white-space:nowrap;padding:8px}.agency-row{flex-wrap:wrap}.agency-filter{align-items:start;flex-direction:column}}
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

<style scoped>
.agency-stats button,.agency-columns section,.agency-recent,.agency-roster article,.agency-empty,.agency-add,.agency-roster-summary{border-radius:var(--cue-radius-panel)}
.agency-heading button,.agency-actions button,.agency-empty button,.agency-add button,.agency-add input,.agency-roster-actions button,.agency-retired button,.agency-pages button,.agency-month button,.agency-roster-shortcuts button,.agency-avatar,.agency-day button{border-radius:var(--cue-radius-control)}
.agency-calendar{border-radius:var(--cue-radius-panel);overflow:hidden}
.agency-pages button{min-width:40px;min-height:40px}
.agency-pages button:disabled{opacity:.4;cursor:default}
</style>

<style scoped>
.agency-calendar-filters{margin:22px 0 0}
.agency-calendar-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:20px;align-items:start;margin-top:20px}
.agency-month-panel,.agency-day-agenda{border:1px solid var(--cue-border);border-radius:var(--cue-radius-panel);background:var(--cue-surface);overflow:hidden;min-width:0}
.agency-month{display:grid;grid-template-columns:36px minmax(0,1fr) 36px;min-height:60px;gap:8px;padding:0 16px;margin:0;border-bottom:1px solid var(--cue-border)}
.agency-month h2{text-align:center;margin:0;font-size:16px;font-weight:800;letter-spacing:-.01em}
.agency-month button{display:grid;place-items:center;width:36px;height:36px;padding:0;color:var(--cue-muted)}
.agency-month svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.agency-calendar{border:0;border-radius:0}
.agency-weekday{padding:10px 8px;border-right:1px solid var(--cue-border);border-bottom:1px solid var(--cue-border);color:var(--cue-muted);background:color-mix(in srgb,var(--cue-raised) 24%,transparent);font:800 8px/1.2 monospace;letter-spacing:.08em}
.agency-calendar-cell{position:relative;min-height:86px;padding:10px;border:0;border-right:1px solid var(--cue-border);border-bottom:1px solid var(--cue-border);background:transparent;color:var(--cue-text);text-align:left;border-radius:0;font:inherit}
.agency-calendar>*:nth-child(7n){border-right:0}
.agency-calendar-cell>span:first-child{font-size:12px;font-weight:750}
.agency-calendar-cell small{position:absolute;top:10px;right:10px;color:var(--cue-muted);font:9px monospace}
.agency-calendar-cell:hover:not(:disabled){background:var(--cue-raised)}
.agency-calendar-cell.is-selected{background:var(--cue-raised);box-shadow:inset 0 0 0 1px var(--cue-toggle)}
.agency-calendar-cell.is-today{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--cue-accent) 58%,var(--cue-border))}.agency-calendar-cell.is-today>span:first-child{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 5px;border-radius:999px;background:var(--cue-accent);color:var(--cue-accent-ink);font-weight:850}.agency-calendar-cell.is-today.is-selected{box-shadow:inset 0 0 0 1px var(--cue-toggle),inset 0 0 0 2px color-mix(in srgb,var(--cue-accent) 22%,transparent)}
.agency-calendar-cell.is-empty{opacity:.42;cursor:default}
.agency-day-statuses{position:absolute;left:10px;bottom:10px;display:flex;gap:6px}
.agency-status-dot{display:inline-block;flex:none;width:7px;height:7px;border-radius:50%}
.agency-status-dot.is-hold{background:var(--cue-accent)}
.agency-status-dot.is-confirmed{background:#57e389}
.agency-calendar-legend{display:flex;gap:16px;padding:16px;color:var(--cue-muted);font:700 9px/1.3 monospace;text-transform:uppercase}
.agency-calendar-legend span{display:flex;align-items:center;gap:7px}
.agency-day-agenda{display:block;margin:0;padding:0}
.agency-day-agenda header{padding:18px;border-bottom:1px solid var(--cue-border)}
.agency-day-agenda header p{color:var(--cue-accent);font:800 9px monospace;letter-spacing:.1em;margin:0 0 8px}
.agency-day-agenda h3{font-size:18px;letter-spacing:0;text-transform:none;margin:0}
.agency-day-agenda .agency-agenda-card{box-sizing:border-box;width:calc(100% - 24px);display:grid;grid-template-columns:7px minmax(0,1fr) auto;gap:10px;align-items:start;margin:12px;padding:12px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-control);background:transparent;color:var(--cue-text);text-align:left}
.agency-agenda-card>i{margin-top:5px}
.agency-agenda-card>span{display:grid;gap:4px;min-width:0}
.agency-day-agenda .agency-agenda-card b{min-width:0;font-size:10px;color:var(--cue-muted)}
.agency-agenda-card strong{font-size:12px}.agency-agenda-card small{font-size:11px;color:var(--cue-muted)}
.agency-day-agenda .agency-agenda-card.is-hold{border-style:dashed}
.agency-calendar-empty{padding:20px;margin:0;color:var(--cue-muted);font-size:12px;line-height:1.5}
.agency-calendar-layout button:focus-visible{outline:2px solid var(--cue-toggle);outline-offset:-3px}
@media(max-width:950px){.agency-calendar-layout{grid-template-columns:1fr}}
@media(max-width:560px){.agency-calendar-cell{min-height:62px;padding:8px}.agency-calendar-cell small{top:8px;right:6px}.agency-calendar-filters label{font-size:12px}.agency-month h2{font-size:14px}}
</style>

<style scoped>
.agency-booking-row{position:relative;display:grid;grid-template-columns:108px minmax(0,1fr) 160px;gap:20px;align-items:center;padding:18px 20px;border-top:0;border-bottom:1px solid var(--cue-border);min-height:90px;box-sizing:border-box;color:var(--cue-text)}
.agency-booking-row::before{content:"";position:absolute;left:0;top:12px;bottom:12px;width:3px;border-radius:2px;background:var(--booking-status-color)}
.agency-booking-row--new{--booking-status-color:var(--cue-status-new)}
.agency-booking-row--in_conversation{--booking-status-color:var(--cue-status-conversation)}
.agency-booking-row--waiting_response{--booking-status-color:var(--cue-status-waiting)}
.agency-booking-row--confirmed{--booking-status-color:var(--cue-status-confirmed)}
.agency-booking-row--rejected{--booking-status-color:var(--cue-status-rejected)}
.agency-booking-row--cancelled{--booking-status-color:var(--cue-status-cancelled)}
.agency-booking-row .agency-booking-date{font:700 11px/1.5 monospace;color:var(--cue-muted);white-space:normal}
.agency-booking-row .agency-booking-status{justify-self:start;display:inline-flex;align-items:center;gap:7px;color:var(--booking-status-color);font:700 10px/1.4 monospace;text-transform:uppercase;letter-spacing:.025em}
.agency-booking-status::before{content:"";width:6px;height:6px;flex:none;border-radius:50%;background:currentColor}
.agency-booking-row:hover,.agency-booking-row:focus-visible{background:color-mix(in srgb,var(--cue-raised) 72%,transparent);color:var(--cue-text)}
.agency-booking-row:focus-visible{outline:2px solid var(--cue-toggle);outline-offset:-2px}
@media(max-width:600px){.agency-booking-row{grid-template-columns:80px minmax(0,1fr);gap:6px 12px;padding:16px 12px}.agency-booking-row .agency-booking-status{grid-column:2;font-size:9px}.agency-booking-row .agency-booking-date{align-self:start;padding-top:3px;font-size:10px}}
</style>

<style scoped>
.agency-calendar-cell{vertical-align:top;min-height:106px;padding-bottom:25px}
.agency-day-names{display:grid;gap:4px;margin-top:8px}
.agency-day-names>span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:1.3;color:var(--cue-muted)}
.agency-day-names>.is-confirmed{color:var(--cue-text)}
.agency-day-names>.is-hold{color:var(--cue-accent)}
@media(max-width:560px){.agency-calendar-cell{min-height:84px;padding:6px 4px 20px}.agency-day-names>span{font-size:9px}.agency-day-statuses{left:5px;bottom:6px}.agency-calendar-cell small{top:6px;right:4px}}
</style>

<style scoped>
.agency-roster .agency-artist-active{display:inline-flex;align-items:center;gap:6px;margin-top:8px;color:var(--cue-muted);font-size:11px}
.agency-artist-active::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--cue-status-confirmed)}
.agency-roster-actions button:last-child:not(:first-child){color:var(--cue-muted)}
</style>

<style scoped>
@media(max-width:750px){
  .agency--roster{padding:10px 0 24px}
  .agency--roster .agency-heading{padding-bottom:14px;gap:8px}
  .agency--roster .agency-heading h1{margin:0;font-size:clamp(2rem,8vw,2.6rem);line-height:.95}
  .agency--roster .agency-actions{margin:14px 0;gap:10px}
}
</style>

<style scoped>
.agency-roster-heading-tools{display:flex;align-items:center;justify-content:flex-end;gap:18px}
.agency-roster-heading-tools>span{font-size:14px;font-weight:700;color:var(--cue-text);white-space:nowrap}
.agency-roster-heading-tools button{white-space:nowrap}
@media(max-width:750px){.agency-roster-heading-tools{width:100%;justify-content:space-between;gap:12px}.agency-roster-heading-tools>span{white-space:normal}}
</style>


<style scoped>
@media(max-width:750px){
  .agency{padding:12px 0 24px}
  .agency-heading{min-height:0;flex-direction:column;align-items:flex-start;gap:10px;margin-bottom:14px;padding:18px 16px}
  .agency-heading>div:first-child,.agency-heading-actions{width:100%}
  .agency-heading h1{margin:0;font-size:clamp(1.85rem,7vw,2.65rem);line-height:.98}
  .agency-heading-actions{justify-content:flex-start;gap:8px}
  .agency-heading-actions button{min-height:40px;padding:8px 12px}
  .agency--roster .agency-heading{gap:10px;padding-bottom:16px}
}
</style>

<style scoped>
/* Keep agency page titles inside the mobile viewport and give glyphs real vertical room. */
@media (max-width: 750px) {
  .agency {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 12px 16px 24px;
    overflow: visible;
  }
  .agency-heading {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    min-height: 0;
    margin: 0 0 16px;
    padding: 22px 18px 24px;
    overflow: visible;
  }
  .agency-heading > div:first-child {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    overflow: visible;
  }
  .agency-heading h1 {
    display: block;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    height: auto;
    min-height: 1.2em;
    margin: 0;
    padding: .12em 0 .16em;
    font-size: clamp(1.85rem, 7vw, 2.65rem);
    line-height: 1.2;
    letter-spacing: -.045em;
    white-space: normal;
    overflow: visible;
    overflow-wrap: anywhere;
  }
}
</style>
