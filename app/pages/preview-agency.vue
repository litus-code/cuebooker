<script setup lang="ts">
import type { Contact, CoreBooking, Hold, NextMove, CreateManualBookingInput } from '../domain/bookingCore'
import type { WorkspaceActivityHistoryRow } from '../services/bookingCoreApi'
import { cloneCueIdStylizedCreatorConfig, DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG, type CueIdStylizedCreatorConfigV1 } from '../domain/cueIdStylizedCreator'

type DemoView = 'overview' | 'bookings' | 'calendar' | 'history' | 'roster' | 'profile' | 'passport' | 'cue-id' | 'settings'
type DemoArtist = { id: string; stage_name: string; slug: string; city: string; roster_active: boolean }

const config = useRuntimeConfig()
const { locale } = useCuePreferences()
const allowed = ref(config.public.appEnv === 'staging')
const view = ref<DemoView>('overview')
const artists = ref<DemoArtist[]>([
  { id: 'demo-mara', stage_name: 'Mara Velt', slug: 'mara-velt', city: 'Barcelona', roster_active: true },
  { id: 'demo-nox', stage_name: 'Nox Arda', slug: 'nox-arda', city: 'Madrid', roster_active: true }
])
const selectedArtistId = ref('')
const selectedArtist = computed(() => artists.value.find(item => item.id === selectedArtistId.value && item.roster_active))
const rosterRevision = ref(0)
const focusBookingId = ref('')
const cueOpen = ref(false)
const returnView = ref<DemoView>('overview')
const globalContext = ref<{ filterArtist: string; calendarArtists: string[]; month: string; selectedDay: string }>()
const nextMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1))
const demoMonth = nextMonth.toISOString().slice(0, 10)
const day = (number: number) => `${demoMonth.slice(0, 7)}-${String(number).padStart(2, '0')}`
const now = new Date().toISOString()

function booking(id: string, artistId: string, eventName: string, venueName: string, eventDate: string, status: CoreBooking['status'], contactId: string): CoreBooking {
  return {
    id, workspace_id: 'preview-agency', artist_id: artistId, primary_contact_id: contactId, counterparty_id: null,
    source: 'booking_form', origin_channel: 'booking_form', capture_method: 'public_form', status,
    event_name: eventName, venue_name: venueName, city: artistId === 'demo-mara' ? 'Barcelona' : 'Madrid', country_code: 'ES',
    event_date: eventDate, start_time: '23:00:00', end_time: '02:00:00', event_timezone: 'Europe/Madrid',
    offer_amount_minor: null, currency: null, fee_basis: null, archived_at: null,
    created_by: 'preview', created_at: now, updated_at: now
  }
}
const demoBookings = ref<CoreBooking[]>([
  booking('demo-booking-a', 'demo-mara', 'Nave Industrial', 'Sala 04', day(8), 'new', 'demo-contact-a'),
  booking('demo-booking-b', 'demo-nox', 'Subsuelo', 'Club Norte', day(12), 'confirmed', 'demo-contact-b'),
  booking('demo-booking-c', 'demo-mara', 'Última Frecuencia', 'Warehouse 17', day(23), 'confirmed', 'demo-contact-c'),
  booking('demo-booking-d', 'demo-nox', 'Sesión de madrugada', 'La Nave', day(18), 'waiting_response', 'demo-contact-d')
])
const demoActivities: WorkspaceActivityHistoryRow[] = [
  { id: 'demo-activity-a', workspace_id: 'preview-agency', booking_id: 'demo-booking-a', type: 'email', direction: 'inbound', contact_id: 'demo-contact-a', actor_user_id: null, body: 'Nueva propuesta para Mara Velt.', metadata: {}, visibility: 'workspace', occurred_at: now, created_by: 'preview', created_at: now, bookings: { id: 'demo-booking-a', artist_id: 'demo-mara', event_name: 'Nave Industrial', venue_name: 'Sala 04', city: 'Barcelona' } },
  { id: 'demo-activity-b', workspace_id: 'preview-agency', booking_id: 'demo-booking-b', type: 'status_change', direction: 'internal', contact_id: null, actor_user_id: null, body: 'Booking confirmado para Nox Arda.', metadata: {}, visibility: 'workspace', occurred_at: now, created_by: 'preview', created_at: now, bookings: { id: 'demo-booking-b', artist_id: 'demo-nox', event_name: 'Subsuelo', venue_name: 'Club Norte', city: 'Madrid' } },
  { id: 'demo-activity-c', workspace_id: 'preview-agency', booking_id: 'demo-booking-d', type: 'whatsapp', direction: 'inbound', contact_id: 'demo-contact-d', actor_user_id: null, body: 'Nos interesa Nox para el día 18. ¿Podéis reservar la fecha mientras cerramos condiciones?', metadata: {}, visibility: 'workspace', occurred_at: now, created_by: 'preview', created_at: now, bookings: { id: 'demo-booking-d', artist_id: 'demo-nox', event_name: 'Sesión de madrugada', venue_name: 'La Nave', city: 'Madrid' } }
]
const demoHolds: Array<Hold & { bookings: { artist_id: string } }> = [
  { id: 'demo-hold', workspace_id: 'preview-agency', booking_id: 'demo-booking-d', event_date: day(18), starts_at: null, ends_at: null, event_timezone: 'Europe/Madrid', expires_at: null, priority: null, status: 'active', released_at: null, converted_at: null, created_by: 'preview', created_at: now, updated_at: now, bookings: { artist_id: 'demo-nox' } }
]
const demoNextMoves = ref<NextMove[]>([{ id: 'demo-next-followup', workspace_id: 'preview-agency', booking_id: 'demo-booking-d', label: 'Confirmar condiciones con el promotor', due_at: new Date(Date.now() - 86400000).toISOString(), assignee_user_id: null, completion_trigger: 'manual', completed_at: null, created_by: 'preview', created_at: now, updated_at: now }])
const demoData = { bookings: demoBookings.value, activities: demoActivities, holds: demoHolds, nextMoves: demoNextMoves.value, notifications: [{ id: 'demo-unread-a', workspace_id: 'preview-agency', recipient_user_id: 'preview', booking_id: 'demo-booking-a', activity_id: null, kind: 'booking_request_received' as const, dedupe_key: 'preview-a', metadata: {}, read_at: null, created_at: now }], contacts: [
  { id: 'demo-contact-a', name: 'Promoter / Sala 04' }, { id: 'demo-contact-b', name: 'Programación / Club Norte' },
  { id: 'demo-contact-c', name: 'Producción / Warehouse 17' }, { id: 'demo-contact-d', name: 'Promoter / La Nave' }
], counterparties: [] }
const demoContacts: Contact[] = demoData.contacts.map(item => ({ id: item.id, workspace_id: 'preview-agency', name: item.name,
  email: null, phone: null, role_label: null, notes: null, created_by: 'preview', created_at: now, updated_at: now }))
const demoInboxData = { contacts: demoContacts, counterparties: [], activities: demoActivities, holds: demoHolds, nextMoves: {} as Record<string, string> }
const artistPassportBookings = computed(() => demoBookings.value
  .filter(item => item.artist_id === selectedArtistId.value && item.status === 'confirmed')
  .sort((a, b) => (a.event_date || '').localeCompare(b.event_date || '')))
const artistInitials = computed(() => selectedArtist.value?.stage_name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase() || '')

const agencyCueIdDrafts = reactive<Record<string, CueIdStylizedCreatorConfigV1>>({})
const agencyCueIdDirtyByArtist = reactive<Record<string, boolean>>({})
const agencyCueIdDirty = computed(() => Boolean(agencyCueIdDirtyByArtist[selectedArtistId.value]))
const agencyCueIdSection = ref<'identity' | 'face' | 'outfit' | 'accessories'>('identity')
const agencyCueIdSaved = ref(false)
const agencyCueIdConfig = computed({
  get: () => {
    const artistId = selectedArtistId.value
    if (!agencyCueIdDrafts[artistId]) agencyCueIdDrafts[artistId] = cloneCueIdStylizedCreatorConfig(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG)
    return agencyCueIdDrafts[artistId]
  },
  set: (value: CueIdStylizedCreatorConfigV1) => { if (selectedArtistId.value) { agencyCueIdDrafts[selectedArtistId.value] = value; agencyCueIdDirtyByArtist[selectedArtistId.value] = true } }
})
function saveAgencyCueIdDraft(value: CueIdStylizedCreatorConfigV1) {
  agencyCueIdConfig.value = cloneCueIdStylizedCreatorConfig(value)
  agencyCueIdDirtyByArtist[selectedArtistId.value] = false
  agencyCueIdSaved.value = true
  window.setTimeout(() => { agencyCueIdSaved.value = false }, 2200)
}
function resetAgencyCueIdDraft() {
  if (!selectedArtistId.value) return
  agencyCueIdConfig.value = cloneCueIdStylizedCreatorConfig(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG)
  agencyCueIdDirtyByArtist[selectedArtistId.value] = false
  agencyCueIdSaved.value = false
}
const artistPassportCities = computed(() => [...new Set(artistPassportBookings.value.map(item => item.city).filter((value): value is string => Boolean(value)))])
const artistPassportVenues = computed(() => [...new Set(artistPassportBookings.value.map(item => item.venue_name).filter((value): value is string => Boolean(value)))])
type ArtistProfileSection = 'identity' | 'image' | 'portrait' | 'sound' | 'links' | 'booking' | 'distribution' | 'passport'
const agencyArtistProfile = ref({ stageName: '', bio: null as string | null, city: null as string | null, countryCode: 'ES', languages: [] as string[], primaryGenres: [] as string[], secondaryGenres: [] as string[], performanceFormats: [] as string[], yearsActive: null as number | null, websiteUrl: null as string | null, instagramUrl: null as string | null, soundcloudUrl: null as string | null, mixcloudUrl: null as string | null, youtubeUrl: null as string | null, spotifyUrl: null as string | null, coverUrl: null as string | null, artistImageUrl: null as string | null, artistCutoutUrl: null as string | null, visualMode: 'editorial', cueId: null as unknown | null, acceptingRequests: false })
const agencyProfilePublished = ref(false)
const agencyPassportPublic = ref(true)
const profileEditorSection = ref<ArtistProfileSection | null>(null)
const agencyGenreDraft = ref('')
const agencyFormatDraft = ref('')
watch(selectedArtist, artist => {
  if (artist) {
    agencyArtistProfile.value.stageName = artist.stage_name
    agencyArtistProfile.value.city = artist.city || null
  }
}, { immediate: true })
function openAgencyProfileEditor(section: ArtistProfileSection) {
  profileEditorSection.value = section
  agencyGenreDraft.value = [...agencyArtistProfile.value.primaryGenres, ...agencyArtistProfile.value.secondaryGenres].join(', ')
  agencyFormatDraft.value = agencyArtistProfile.value.performanceFormats.join(', ')
}
function saveAgencyProfileEditor() {
  if (profileEditorSection.value === 'sound') {
    agencyArtistProfile.value.primaryGenres = agencyGenreDraft.value.split(',').map(value => value.trim()).filter(Boolean)
    agencyArtistProfile.value.performanceFormats = agencyFormatDraft.value.split(',').map(value => value.trim()).filter(Boolean)
  }
  profileEditorSection.value = null
}
const focusedBooking = computed(() => demoBookings.value.find(item => item.id === focusBookingId.value))
const bookingArtist = computed(() => artists.value.find(item => item.id === focusedBooking.value?.artist_id))
function closeBooking() { focusBookingId.value = ''; view.value = returnView.value }
const nav = computed<Array<{ id: DemoView; label: string }>>(() => [
  { id: 'overview', label: 'Overview' }, { id: 'bookings', label: 'Bookings' }, { id: 'calendar', label: 'Calendar' },
  { id: 'history', label: 'Activity' }, { id: 'roster', label: locale.value === 'es' ? 'Artistas' : 'Artists' },
  { id: 'settings', label: 'Settings' }
])
const previewNotificationsOpen = ref(false)
const previewNotificationsUnread = ref(true)
function togglePreviewNotifications() {
  previewNotificationsOpen.value = !previewNotificationsOpen.value
  if (previewNotificationsOpen.value) previewNotificationsUnread.value = false
}
function openPreviewNotification() {
  previewNotificationsOpen.value = false
  openBooking('demo-booking-a')
}

onMounted(async () => {
  const hostname = window.location.hostname.toLowerCase()
  if (!(hostname.startsWith('pr-') && hostname.endsWith('.cuebooker-staging.pages.dev')) && hostname !== 'localhost' && hostname !== '127.0.0.1') {
    allowed.value = false
    await navigateTo('/')
    return
  }
})
watch(selectedArtist, artist => {
  if (!artist && ['profile', 'passport', 'cue-id'].includes(view.value)) view.value = 'overview'
})
function changeView(next: DemoView) {
  previewNotificationsOpen.value = false
  view.value = next
  focusBookingId.value = ''
}
function chooseArtist(id: string) {
  if (!selectedArtistId.value && id) returnView.value = view.value
  selectedArtistId.value = artists.value.some(item => item.id === id && item.roster_active) ? id : ''
  focusBookingId.value = ''
  if (!selectedArtistId.value && ['profile', 'passport', 'cue-id'].includes(view.value)) view.value = 'overview'
}
function openBooking(id: string) {
  const item = demoBookings.value.find(row => row.id === id)
  if (!item) return
  returnView.value = view.value
  view.value = 'bookings'
  focusBookingId.value = id
}
async function createArtist(name: string, slug: string, city: string) {
  if (artists.value.some(item => item.slug === slug)) return false
  artists.value.push({ id: `demo-${Date.now()}`, stage_name: name, slug, city, roster_active: true })
  rosterRevision.value++
  return true
}
async function createDemoCue(input: CreateManualBookingInput) {
  const item = booking(`demo-cue-${Date.now()}`, input.artistId, input.eventName || input.initialNote || 'CUE', input.venueName || '', input.eventDate || '', 'new', '')
  item.event_date = input.eventDate || null
  item.source = input.source; item.origin_channel = input.source; item.capture_method = 'manual'
  item.city = input.city || null
  demoBookings.value.unshift(item)
  if (input.nextMoveLabel) demoNextMoves.value.push({ id: `demo-next-${Date.now()}`, workspace_id: 'preview-agency', booking_id: item.id, label: input.nextMoveLabel, due_at: input.nextMoveDueAt || null, completed_at: null, assignee_user_id: null, completion_trigger: 'manual', created_by: 'preview', created_at: now, updated_at: now })
  rosterRevision.value++
  return item
}
function returnToAgency() { selectedArtistId.value = ''; focusBookingId.value = ''; view.value = returnView.value }
function setRosterActive(id: string, active: boolean) {
  const artist = artists.value.find(item => item.id === id)
  if (!artist) return
  artist.roster_active = active
  if (!active && selectedArtistId.value === id) chooseArtist('')
  rosterRevision.value++
}

useHead({ title: 'Agency preview | Cuebooker', meta: [{ name: 'robots', content: 'noindex,nofollow' }] })
</script>

<template>
  <main v-if="allowed" class="agency-preview workspace">
    <header class="agency-preview__header workspace-header">
      <NuxtLink class="brand" to="/" aria-label="Cuebooker"><CueBrand class="agency-preview__brand" /></NuxtLink>
      <nav aria-label="Workspace Agency">
        <button v-for="item in nav" :key="item.id" :data-workspace-view="item.id" type="button" :aria-current="!previewNotificationsOpen && (view === item.id || item.id === 'roster' && ['profile','passport','cue-id'].includes(view)) ? 'page' : undefined" @click="changeView(item.id)">{{ item.label }}</button>
        <button class="agency-preview__desktop-notifications" type="button" :aria-label="locale === 'es' ? 'Notificaciones' : 'Notifications'" :aria-expanded="previewNotificationsOpen" @click="togglePreviewNotifications"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg><span>{{ locale === 'es' ? 'Notificaciones' : 'Notifications' }}</span><i v-if="previewNotificationsUnread" class="agency-preview__desktop-badge">1</i></button>
        <NuxtLink class="agency-preview__desktop-exit" to="/access"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/></svg><span>{{ locale === 'es' ? 'Cerrar sesión' : 'Sign out' }}</span></NuxtLink>
      </nav>
      <div class="agency-preview__actions">
        <button class="agency-preview__icon agency-preview__notification" type="button" :aria-label="locale === 'es' ? 'Notificaciones' : 'Notifications'" :aria-expanded="previewNotificationsOpen" @click="togglePreviewNotifications">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
          <span v-if="previewNotificationsUnread" class="agency-preview__badge" aria-hidden="true">1</span>
        </button>
        <NuxtLink class="agency-preview__icon agency-preview__exit" to="/access" :aria-label="locale === 'es' ? 'Salir' : 'Exit'" :title="locale === 'es' ? 'Salir' : 'Exit'">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/></svg>
        </NuxtLink>
      </div>
    </header>

    <div v-if="previewNotificationsOpen" class="agency-preview__notification-backdrop" aria-hidden="true" @click="previewNotificationsOpen = false" />
    <section v-if="previewNotificationsOpen" class="agency-preview__notification-panel" role="dialog" :aria-modal="true" :aria-label="locale === 'es' ? 'Notificaciones' : 'Notifications'">
      <header><div><span>{{ locale === 'es' ? 'ACTIVIDAD / AVISOS' : 'ACTIVITY / NOTIFICATIONS' }}</span><h1>{{ locale === 'es' ? 'Notificaciones' : 'Notifications' }}</h1></div><button class="agency-preview__notification-close" type="button" :aria-label="locale === 'es' ? 'Cerrar notificaciones' : 'Close notifications'" @click="previewNotificationsOpen = false">×</button></header>
      <button class="agency-preview__notification-item" type="button" @click="openPreviewNotification"><i aria-hidden="true"/><span><strong>{{ locale === 'es' ? 'Nueva solicitud de booking' : 'New booking request' }}</strong><small>Nave Industrial · Sala 04</small><em>{{ locale === 'es' ? 'Abrir solicitud' : 'Open request' }}</em></span></button>
    </section>

    <div v-if="selectedArtist" class="agency-preview__context"><span>CUE Test Agency / <strong>{{ selectedArtist.stage_name }}</strong></span><button type="button" @click="returnToAgency">{{ locale === 'es' ? 'Quitar filtro de artista' : 'Clear artist filter' }}</button></div>
    <nav v-if="selectedArtist && ['profile','passport','cue-id'].includes(view)" class="agency-preview__record-tabs" aria-label="Ficha del artista"><button type="button" @click="changeView('roster')">← {{ locale === 'es' ? 'Artistas' : 'Artists' }}</button><button v-for="tab in (['profile','passport','cue-id'] as const)" :key="tab" type="button" :aria-current="view===tab?'page':undefined" @click="changeView(tab)">{{ tab==='profile'?(locale==='es'?'Ficha y perfil público':'Record & public profile'):tab==='passport'?'CUE Passport':'CUE ID' }}</button></nav>
    <AgencyWorkspace
      v-if="!focusedBooking && ['overview', 'bookings', 'calendar', 'history', 'roster'].includes(view)"
      :selected-artist-id="selectedArtistId" :workspace-id="'preview-agency'" agency-name="CUE Test Agency"
      :artists="artists"
      :view="view as 'overview' | 'bookings' | 'calendar' | 'history' | 'roster'"
      :locale="locale" :can-manage-roster="true" :create-artist="createArtist"
      :demo-data="demoData" :initial-month="demoMonth" :revision="rosterRevision"
      :context-artist-name="view !== 'roster' ? selectedArtist?.stage_name : undefined"
      :context-state="!selectedArtist ? globalContext : undefined" @context-changed="state => { if (!selectedArtist) globalContext = state }"
      @capture="cueOpen = true" @filter-artist="chooseArtist($event)" @navigate="changeView" @select-artist="(id, target) => { chooseArtist(id); changeView(target) }"
      @open-booking="openBooking" @retire-artist="setRosterActive($event, false)" @restore-artist="setRosterActive($event, true)"
    />

    <section v-else-if="focusedBooking && view === 'bookings'" class="agency-preview__inbox">
      <div class="agency-preview__inbox-heading"><div><span>AGENCIA / {{ bookingArtist?.stage_name }}</span><h1>{{ locale === 'es' ? 'Seguimiento del booking.' : 'Booking follow-up.' }}</h1><p>{{ locale === 'es' ? 'Estás gestionando este booking desde tu agencia.' : 'You are managing this booking within your agency.' }}</p></div><button type="button" @click="closeBooking">← {{ locale === 'es' ? 'Volver a Agencia' : 'Back to Agency' }}</button></div>
      <BookingCoreInbox workspace-id="preview-agency" :bookings="demoBookings.filter(item => item.artist_id === focusedBooking?.artist_id)" :locale="locale" :focus-booking-id="focusBookingId" :demo-data="demoInboxData" @booking-opened="focusBookingId = $event" @calendar-requested="changeView('calendar')" />
    </section>

    <section v-else class="agency-preview__detail">
      <span>{{ selectedArtist ? `AGENCIA / ${selectedArtist.stage_name}` : 'AGENCIA / CUE TEST AGENCY' }}</span>
      <h1>{{ view === 'profile' ? selectedArtist?.stage_name : view === 'passport' ? 'CUE PASSPORT' : view === 'cue-id' ? 'CUE ID' : 'SETTINGS' }}</h1>
      <p v-if="view === 'profile'">{{ locale === 'es' ? 'Vista previa del perfil público del artista.' : 'Preview of the artist’s public profile.' }}</p>
      <p v-else-if="view === 'passport'">{{ locale === 'es' ? 'El CUE Passport reúne la trayectoria del artista y sus actuaciones confirmadas.' : 'The CUE Passport brings together the artist’s career and confirmed performances.' }}</p>
      <p v-else-if="view === 'cue-id'">{{ locale === 'es' ? 'La identidad visual pertenece al artista seleccionado.' : 'The visual identity belongs to the selected artist.' }}</p>
      <p v-else>{{ locale === 'es' ? 'Configuración del workspace de Agencia.' : 'Agency workspace settings.' }}</p>
      <AgencyCatalogEditor v-if="view === 'settings'" workspace-id="preview-agency" role="owner" :locale="locale" demo @edit-artist="id => { chooseArtist(id); changeView('profile') }" />
      <AgencyTeamPanel v-if="view === 'settings'" workspace-id="preview-agency" role="owner" user-id="demo-owner" :locale="locale" :demo="true" />
      <ConnectedMailboxPanel v-if="view === 'settings'" workspace-id="preview-agency" :locale="locale" demo />
      <section v-if="view === 'settings'" class="agency-preview__preferences" :aria-label="locale === 'es' ? 'Preferencias' : 'Preferences'">
        <div><span>{{ locale === 'es' ? 'PREFERENCIAS' : 'PREFERENCES' }}</span><h2>{{ locale === 'es' ? 'Idioma y apariencia' : 'Language and appearance' }}</h2><p>{{ locale === 'es' ? 'Elige el idioma y el tema de Cuebooker.' : 'Choose the Cuebooker language and theme.' }}</p></div>
        <CuePreferencesControl compact labels />
      </section>
      <section v-else-if="view === 'profile'" class="agency-preview__profile-builder" :aria-label="locale === 'es' ? 'Editor de ficha del artista' : 'Artist profile editor'">
        <WorkspaceArtistProfile
          :profile="agencyArtistProfile"
          :editable="true"
          :published="agencyProfilePublished"
          :locale="locale"
          :passport="{ confirmedBookings: artistPassportBookings.length, cities: artistPassportBookings.map(item => item.city || '').filter(Boolean), venues: artistPassportBookings.map(item => item.venue_name || '').filter(Boolean), milestones: [], media: [] }"
          @edit="openAgencyProfileEditor"
          @toggle-published="agencyProfilePublished = $event"
          @toggle-requests="agencyArtistProfile.acceptingRequests = $event"
          @cue-id="changeView('cue-id')"
          @passport="changeView('passport')"
        />
        <section v-if="profileEditorSection" class="agency-preview__profile-editor">
          <header><span>{{ locale === 'es' ? 'EDITAR FICHA / ARTISTA' : 'EDIT ARTIST PROFILE' }}</span><button type="button" @click="profileEditorSection = null">×</button></header>
          <h2>{{ profileEditorSection === 'identity' ? (locale === 'es' ? 'Identidad y biografía' : 'Identity and bio') : profileEditorSection === 'sound' ? (locale === 'es' ? 'Sonido y formato' : 'Sound and format') : profileEditorSection === 'links' ? (locale === 'es' ? 'Enlaces del artista' : 'Artist links') : profileEditorSection === 'booking' ? 'Booking' : profileEditorSection === 'passport' ? 'CUE Passport' : profileEditorSection === 'distribution' ? (locale === 'es' ? 'Distribución' : 'Distribution') : profileEditorSection === 'portrait' ? (locale === 'es' ? 'Imagen del artista' : 'Artist image') : (locale === 'es' ? 'Portada' : 'Cover') }}</h2>
          <div v-if="profileEditorSection === 'identity'" class="agency-preview__profile-fields"><label>{{ locale === 'es' ? 'Nombre artístico' : 'Artist name' }}<input v-model="agencyArtistProfile.stageName"></label><label>{{ locale === 'es' ? 'Ciudad base' : 'Base city' }}<input v-model="agencyArtistProfile.city"></label><label>{{ locale === 'es' ? 'Biografía' : 'Biography' }}<textarea v-model="agencyArtistProfile.bio" rows="4"></textarea></label></div>
          <div v-else-if="profileEditorSection === 'sound'" class="agency-preview__profile-fields"><label>{{ locale === 'es' ? 'Géneros, separados por comas' : 'Genres, comma separated' }}<input v-model="agencyGenreDraft"></label><label>{{ locale === 'es' ? 'Formatos, separados por comas' : 'Formats, comma separated' }}<input v-model="agencyFormatDraft"></label></div>
          <div v-else-if="profileEditorSection === 'links'" class="agency-preview__profile-fields"><label>Web<input v-model="agencyArtistProfile.websiteUrl"></label><label>Instagram<input v-model="agencyArtistProfile.instagramUrl"></label><label>SoundCloud<input v-model="agencyArtistProfile.soundcloudUrl"></label></div>
          <div v-else-if="profileEditorSection === 'booking'" class="agency-preview__profile-fields"><label class="agency-preview__profile-check"><input v-model="agencyArtistProfile.acceptingRequests" type="checkbox">{{ locale === 'es' ? 'Aceptar solicitudes desde el perfil público' : 'Accept enquiries through the public profile' }}</label></div>
          <div v-else-if="profileEditorSection === 'passport'" class="agency-preview__profile-fields"><label class="agency-preview__profile-check"><input v-model="agencyPassportPublic" type="checkbox">{{ locale === 'es' ? 'Mostrar el CUE Passport en el perfil' : 'Show CUE Passport on profile' }}</label></div>
          <p v-else class="agency-preview__profile-editor-note">{{ locale === 'es' ? 'La imagen y la portada se editan desde los controles del perfil. Los cambios de esta vista son de demostración.' : 'Images are managed from the profile controls. Changes in this preview are for demonstration.' }}</p>
          <footer><button type="button" @click="profileEditorSection = null">{{ locale === 'es' ? 'Cancelar' : 'Cancel' }}</button><button type="button" class="agency-preview__profile-save" @click="saveAgencyProfileEditor">{{ locale === 'es' ? 'Guardar cambios' : 'Save changes' }}</button></footer>
        </section>
      </section>
      <section v-else-if="view === 'passport'" class="agency-preview__passport" :aria-label="locale === 'es' ? 'CUE Passport del artista' : 'Artist CUE Passport'">
        <header class="agency-preview__passport-heading">
          <div><span>{{ locale === 'es' ? 'CUE PASSPORT / TRAYECTORIA REAL' : 'CUE PASSPORT / REAL CAREER' }}</span><h2>{{ locale === 'es' ? 'Trayectoria de' : 'Career of' }} {{ selectedArtist?.stage_name }}</h2><p>{{ locale === 'es' ? 'Construida a partir de sus bookings confirmados.' : 'Built from the artist’s confirmed bookings.' }}</p></div>
          <button type="button" @click="openAgencyProfileEditor('passport')">{{ locale === 'es' ? 'Editar visibilidad' : 'Edit visibility' }}</button>
        </header>
        <CuePassportProfileSummary :bookings="artistPassportBookings.length" :cities="artistPassportCities" :venues="artistPassportVenues" :locale="locale" :public-enabled="agencyPassportPublic" />
        <div class="agency-preview__passport-events"><h3>{{ locale === 'es' ? 'Actuaciones confirmadas' : 'Confirmed performances' }}</h3>
          <p v-if="!artistPassportBookings.length" class="agency-preview__passport-empty">{{ locale === 'es' ? 'Las actuaciones confirmadas aparecerán aquí.' : 'Confirmed performances will appear here.' }}</p>
          <article v-for="item in artistPassportBookings" :key="item.id" class="agency-preview__passport-event">
            <div class="agency-preview__passport-date"><strong>{{ item.event_date ? new Date(item.event_date + 'T12:00:00').toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit' }) : '—' }}</strong><span>{{ item.event_date ? new Date(item.event_date + 'T12:00:00').toLocaleDateString(locale === 'es' ? 'es-ES' : 'en-GB', { month: 'short' }).toUpperCase() : '' }}</span></div>
            <div><h3>{{ item.event_name }}</h3><p>{{ [item.venue_name, item.city].filter(Boolean).join(' · ') }}</p></div><span class="agency-preview__passport-status">{{ locale === 'es' ? 'Confirmada' : 'Confirmed' }}</span>
          </article>
        </div>
      </section>
      <section v-else-if="view === 'cue-id'" class="agency-preview__cue-id-editor" :aria-label="locale === 'es' ? 'Editor CUE ID del artista' : 'Artist CUE ID editor'">
        <header><span>CUE ID / {{ selectedArtist?.stage_name }}</span><small>{{ locale === 'es' ? 'BORRADOR DE PREVIEW' : 'PREVIEW DRAFT' }}</small></header>
        <p>{{ locale === 'es' ? 'Personaliza la identidad visual de este artista. Esta demo mantiene un borrador independiente por artista mientras está abierta.' : 'Customize this artist’s visual identity. This demo keeps a separate draft for each artist while it is open.' }}</p>
        <CueIdStylizedWorkspace v-model="agencyCueIdConfig" :locale="locale" :section="agencyCueIdSection" :dirty="agencyCueIdDirty" @section-change="agencyCueIdSection = $event" @save="saveAgencyCueIdDraft" @reset="resetAgencyCueIdDraft" />
        <p v-if="agencyCueIdSaved" class="agency-preview__cue-id-saved" role="status">{{ locale === 'es' ? 'Borrador de demostración actualizado.' : 'Demo draft updated.' }}</p>
      </section>
    </section>

    <CueCapturePanel :open="cueOpen" workspace-id="preview-agency" :artist-id="selectedArtistId" :artists="artists.filter(item => item.roster_active)" :locale="locale" :demo-create="createDemoCue" @close="cueOpen = false" @created="item => { cueOpen = false; openBooking(item.id) }" />
  </main>
</template>

<style scoped>
.agency-preview{min-height:100vh;padding:0 clamp(16px,3vw,32px) 60px;background:var(--cue-bg);color:var(--cue-text)}
.agency-preview__header{position:sticky;top:0;z-index:25;display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:18px;margin-inline:calc(-1 * clamp(16px,3vw,32px));padding:9px clamp(16px,3vw,32px);border-bottom:1px solid var(--cue-border);background:var(--cue-bg)}
.agency-preview__brand{display:block;width:130px;height:42px}.agency-preview__header nav{display:flex;gap:3px;overflow:auto;min-width:0;padding:3px;border:1px solid var(--cue-border);border-radius:30px;background:var(--cue-surface);scrollbar-width:none}
.agency-preview__header nav button{flex:none;position:relative;padding:10px 12px;border:0;background:transparent;color:var(--cue-muted);font-size:12px;font-weight:700;cursor:pointer}.agency-preview__header nav button[aria-current=page]{color:var(--cue-accent)}.agency-preview__header nav button[aria-current=page]:before{position:absolute;left:2px;top:8px;bottom:8px;width:2px;background:var(--cue-accent);content:''}
.agency-preview__selector{display:grid;gap:4px;min-width:190px}.agency-preview__selector span,.agency-preview__notice strong,.agency-preview__detail>span,.agency-preview__inbox-heading span,.agency-preview__read-only span{font:800 10px/1.4 monospace;letter-spacing:.12em;color:var(--cue-accent)}.agency-preview__selector select{min-width:0;padding:8px;border:1px solid var(--cue-border);background:var(--cue-surface);color:var(--cue-text)}
.agency-preview__notice{display:flex;gap:18px;align-items:center;margin-top:20px;padding:12px 16px;border-left:3px solid var(--cue-accent);background:color-mix(in srgb,var(--cue-accent) 7%,var(--cue-bg));font-size:12px}.agency-preview__notice span{color:var(--cue-muted)}
.agency-preview__detail{max-width:1440px;margin:40px auto;padding:clamp(24px,5vw,60px);border:1px solid var(--cue-border);background:var(--cue-surface)}.agency-preview__detail h1{margin:12px 0;font-size:clamp(2.7rem,7vw,6rem);letter-spacing:-.06em;text-transform:uppercase}.agency-preview__detail>p{max-width:650px;color:var(--cue-muted);line-height:1.6}.agency-preview__read-only{margin-top:50px;padding:24px;border-top:1px solid var(--cue-border)}.agency-preview__read-only p{color:var(--cue-muted)}
.agency-preview__inbox{max-width:1440px;margin:32px auto}.agency-preview__inbox-heading{display:flex;justify-content:space-between;align-items:end;gap:20px}.agency-preview__inbox-heading h1{margin:8px 0;font-size:clamp(2.3rem,5vw,5rem);line-height:1;text-transform:uppercase;letter-spacing:-.05em}.agency-preview__inbox-heading p{margin:0;color:var(--cue-muted);font-size:12px}.agency-preview__inbox-heading button{flex:none;min-height:40px;padding:8px 14px;border:1px solid var(--cue-border);background:var(--cue-surface);color:var(--cue-accent);cursor:pointer}
@media(max-width:960px){.agency-preview__header{grid-template-columns:1fr auto}.agency-preview__header nav{grid-column:1/-1;grid-row:2}.agency-preview__selector{min-width:150px}.agency-preview__notice{align-items:start;flex-direction:column;gap:5px}}
@media(max-width:760px){.agency-preview__inbox-heading{align-items:start;flex-direction:column}.agency-preview__inbox-heading h1{font-size:2.3rem}}
@media(max-width:390px){.agency-preview__brand{width:100px}.agency-preview__selector{min-width:130px}.agency-preview__header{gap:6px}}

/* Reuse the DJ desktop rail and its icons. The preview has no separate app shell. */
@media(min-width:961px){
  .agency-preview__header{box-sizing:border-box;height:100dvh;overflow-y:auto!important}
  .agency-preview__header nav{flex:none;order:2}
  .agency-preview__header nav button{text-align:left;color:var(--cue-muted)}
  .agency-preview__header nav button[aria-current=page]{color:var(--cue-accent);background:transparent!important;border-left:2px solid var(--cue-accent)!important}
  .agency-preview__header nav button[aria-current=page]:before{display:none}
  .agency-preview__selector{order:1;min-width:0;width:100%;gap:8px}
  .agency-preview__selector span{overflow-wrap:anywhere}
  .agency-preview__selector select{width:100%;min-height:40px}
}
@media(max-width:960px){
  .agency-preview__header{grid-template-columns:minmax(0,1fr) auto!important;grid-template-areas:'brand context' 'nav nav'!important;margin-inline:calc(-1 * clamp(16px,3vw,32px));padding:9px clamp(16px,3vw,32px)!important}
  .agency-preview__header>.brand{grid-area:brand;width:auto!important}
  .agency-preview__header nav{grid-area:nav;display:flex!important;overflow-x:auto!important;width:100%;box-sizing:border-box}
  .agency-preview__selector{grid-area:context;min-width:0;width:170px}
  .agency-preview__header nav button[aria-current=page]:before{top:auto;bottom:0;left:12px;right:12px;width:auto;height:2px}
}

.agency-preview__passport-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:20px;padding:18px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-panel);background:var(--cue-surface)}
.agency-preview__passport-heading>div{min-width:0}.agency-preview__passport-heading>div>span,.agency-preview__cue-id-editor>header>span{color:var(--cue-accent);font:800 10px/1.5 monospace;letter-spacing:.12em}
.agency-preview__passport-heading h2{margin:8px 0;font-size:clamp(22px,4vw,32px)}.agency-preview__passport-heading p{margin:0;color:var(--cue-muted)}
.agency-preview__passport-heading button{flex:none;min-height:42px;padding:0 14px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-control);background:var(--cue-bg);color:var(--cue-text)}
.agency-preview__passport-events{margin-top:22px}.agency-preview__passport-events>h3{font-size:18px}
.agency-preview__cue-id-editor>header{display:flex;align-items:center;justify-content:space-between;gap:12px}.agency-preview__cue-id-editor>header small{padding:6px 9px;border:1px solid var(--cue-border);border-radius:999px;color:var(--cue-muted);font:700 9px/1 monospace}
.agency-preview__cue-id-editor>p{max-width:760px;color:var(--cue-muted);line-height:1.6}
.agency-preview__cue-id-saved{padding:12px;border-left:3px solid var(--cue-accent);background:color-mix(in srgb,var(--cue-accent) 8%,var(--cue-surface));color:var(--cue-text)}
@media(max-width:600px){.agency-preview__passport-heading{flex-direction:column}.agency-preview__passport-heading button{width:100%}}

</style>

<style scoped>
.agency-preview__context{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;margin-top:20px;padding:12px;border-left:3px solid var(--cue-accent);background:var(--cue-surface);font-size:12px}.agency-preview__context button{background:transparent;color:var(--cue-accent);border:1px solid var(--cue-border);border-radius:var(--cue-radius-control,12px);padding:8px 12px}
</style>

<style scoped>.agency-preview__record-tabs{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.agency-preview__record-tabs button{background:transparent;color:var(--cue-muted);padding:10px 8px;border:0;border-bottom:2px solid transparent;border-radius:0}.agency-preview__record-tabs button:first-child{padding:10px 12px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-control,12px);color:var(--cue-text)}.agency-preview__record-tabs button[aria-current=page]{background:transparent;color:var(--cue-accent);border:0;border-bottom:2px solid var(--cue-accent);border-radius:0}</style>

<style scoped>
.agency-preview__header {
  grid-template-columns: auto minmax(0,1fr) auto;
}
.agency-preview__actions {
  position:relative;
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:8px;
}
.agency-preview__icon {
  position:relative;
  display:grid;
  place-items:center;
  flex:0 0 42px;
  width:42px;
  height:42px;
  box-sizing:border-box;
  padding:9px;
  border:1px solid var(--cue-border);
  border-radius:50%;
  background:transparent;
  color:var(--cue-muted);
  text-decoration:none;
  cursor:pointer;
}
.agency-preview__exit { border-radius:10px; }
.agency-preview__icon svg {
  width:100%;
  height:100%;
  fill:none;
  stroke:currentColor;
  stroke-width:1.7;
  stroke-linecap:round;
  stroke-linejoin:round;
}
.agency-preview__icon:hover,.agency-preview__icon:focus-visible {
  border-color:var(--cue-accent);
  color:var(--cue-text);
}
.agency-preview__badge {
  position:absolute;
  top:-3px;
  right:-3px;
  display:grid;
  width:16px;
  height:16px;
  place-items:center;
  border:2px solid var(--cue-bg);
  border-radius:50%;
  background:var(--cue-accent);
  color:#111;
  font:800 9px/1 monospace;
}
.agency-preview__notification-panel {
  position:fixed;
  z-index:100;
  top:88px;
  right:24px;
  display:grid;
  gap:8px;
  width:min(360px,calc(100vw - 32px));
  max-height:min(70vh,520px);
  overflow:auto;
  box-sizing:border-box;
  padding:16px;
  border:1px solid var(--cue-border);
  border-radius:var(--cue-radius-panel,16px);
  background:var(--cue-surface);
  box-shadow:0 18px 48px #0009;
}
.agency-preview__notification-panel span { color:var(--cue-muted);font-size:13px; }
.agency-preview__notification-panel button {
  justify-self:start;
  min-height:38px;
  margin-top:4px;
  padding:0 12px;
  border:1px solid var(--cue-accent);
  border-radius:var(--cue-radius-control,10px);
  background:var(--cue-accent);
  color:#111;
  font-weight:800;
}
@media(max-width:960px) {
  .agency-preview__header {
    grid-template-columns:minmax(0,1fr) auto!important;
    grid-template-areas:'brand actions' 'nav nav'!important;
    gap:8px;
    padding:10px 16px!important;
  }
  .agency-preview__header>.brand { grid-area:brand;width:auto!important; }
  .agency-preview__brand { width:120px;height:40px; }
  .agency-preview__header nav { grid-area:nav;grid-column:auto;grid-row:auto; }
  .agency-preview__actions { grid-area:actions; }
}
@media(max-width:390px) {
  .agency-preview__brand { width:108px;height:38px; }
  .agency-preview__actions { gap:6px; }
}
</style>

<style scoped>
/* One consistent 16px mobile gutter for every preview screen. */
@media(max-width:960px){
  .agency-preview.workspace{
    box-sizing:border-box;
    padding:0 16px 40px;
  }
}
.agency-preview__detail{
  box-sizing:border-box;
  border-radius:var(--cue-radius-panel,18px);
}
@media(max-width:600px){
  .agency-preview__detail{
    width:100%;
    margin:20px 0;
    padding:20px 16px;
    border-radius:var(--cue-radius-panel,18px);
  }
  .agency-preview__detail h1{
    margin:10px 0;
    font-size:clamp(2.1rem,10vw,3rem);
    line-height:1.04;
    overflow-wrap:anywhere;
  }
  .agency-preview__detail .agency-catalog-editor{
    margin-top:18px;
    padding:16px 0 0;
  }
  .agency-preview__detail :deep(.agency-catalog-editor__heading){
    min-height:0;
    margin-bottom:14px;
    padding:16px 0;
  }
  .agency-preview__detail :deep(.agency-catalog-editor__heading h2){
    font-size:clamp(22px,6vw,28px);
    line-height:1.15;
  }
  .agency-preview__detail :deep(.agency-catalog-editor__group){
    margin-bottom:16px;
    padding:16px 12px;
    border-radius:var(--cue-radius-panel,18px);
  }
}
</style>

<style scoped>
.agency-preview__exit{border-radius:50%;color:#f17b86}
.agency-preview__exit:hover,.agency-preview__exit:focus-visible{color:#ff8996}
.agency-preview__desktop-notifications{display:none}
.agency-preview__desktop-exit{display:none}
.agency-preview__desktop-notifications{position:relative;flex-direction:row!important;justify-content:flex-start!important;min-height:42px;height:42px;padding:10px 12px;box-sizing:border-box}
.agency-preview__desktop-notifications::before,.agency-preview__desktop-notifications::after{display:none!important;content:none!important;background:none!important}
.agency-preview__desktop-notifications svg{width:17px;height:17px;flex:none;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.agency-preview__desktop-notifications .agency-preview__desktop-badge{position:absolute;top:18px;left:26px;z-index:2;display:grid;place-items:center;width:9px;height:9px;margin:0;border-radius:50%;background:var(--cue-accent);color:#111;font:800 6px/1 monospace}
.agency-preview__desktop-exit{display:flex;align-items:center;gap:12px;margin-top:auto;padding:10px 12px;border:0;border-left:2px solid transparent;border-radius:0;background:transparent;color:#f17b86;text-decoration:none;font-size:12px;font-weight:700}
.agency-preview__desktop-exit svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.agency-preview__desktop-exit:hover,.agency-preview__desktop-exit:focus-visible{color:#ff8996}
@media(min-width:961px){
  .agency-preview__notification{display:none}
  .agency-preview__actions .agency-preview__exit{display:none}
  .agency-preview__header nav{flex-direction:column;flex-wrap:nowrap;align-items:stretch;min-height:calc(100dvh - 120px);box-sizing:border-box}
  .agency-preview__desktop-notifications{display:flex!important;align-items:center;gap:12px;width:100%;text-align:left!important}
  .agency-preview__desktop-exit{display:flex}
}
@media(max-width:960px){
  .agency-preview__desktop-notifications{display:none!important}
  .agency-preview__exit{border-radius:50%}
}
.agency-preview__preferences{box-sizing:border-box;display:flex;justify-content:space-between;align-items:center;gap:20px;margin:36px 0 8px;padding:20px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-panel,18px);background:var(--cue-surface)}
.agency-preview__preferences>div>span{font:800 10px/1.4 monospace;letter-spacing:.14em;color:var(--cue-accent)}
.agency-preview__preferences h2{margin:7px 0 4px;font-size:18px}
.agency-preview__preferences p{margin:0;color:var(--cue-muted);font-size:13px}
.agency-preview__preferences :deep(.cue-preferences-control){flex:none}
@media(max-width:600px){.agency-preview__preferences{align-items:flex-start;flex-direction:column;margin-top:24px;padding:16px}}
@media(max-width:420px){.agency-preview__preferences{justify-content:flex-start}}
@media(max-width:390px){.agency-preview__notification-panel{top:76px;right:12px;width:calc(100vw - 24px)}}
</style>

<style scoped>
/* Compact desktop rail and keep every navigation item on the same rhythm. */
@media (min-width: 961px) {
  .agency-preview__header {
    display:flex!important;flex-direction:column;align-items:stretch;gap:12px;
    padding:18px 12px 12px!important;height:100dvh;box-sizing:border-box;
  }
  .agency-preview__brand { flex:none;align-self:flex-start;margin:0 0 8px 4px; }
  .agency-preview__header nav {
    display:flex!important;flex:1 1 auto;flex-direction:column;align-items:stretch;justify-content:flex-start;
    gap:6px;min-height:0!important;height:auto!important;padding:0;border:0;border-radius:0;background:transparent;
  }
  .agency-preview__header nav button {
    box-sizing:border-box;display:flex;flex:0 0 42px;align-items:center;width:100%;min-height:42px;height:42px;
    padding:9px 12px!important;border:0!important;border-radius:10px;background:transparent;cursor:pointer;
  }
  .agency-preview__header nav button[aria-current=page] { position:relative;border:0!important;background:transparent!important; }
  .agency-preview__header nav button[aria-current=page]:before {
    display:block;position:absolute;left:0;top:10px;bottom:10px;width:2px;height:auto;border-radius:2px;background:var(--cue-accent);content:'';
  }
  .agency-preview__desktop-notifications { margin-top:2px; }
  .agency-preview__desktop-exit { margin-top:auto!important;min-height:42px;box-sizing:border-box; }
}
.agency-preview button,.agency-preview a { cursor:pointer; }
.agency-preview button:disabled { cursor:not-allowed; }
.agency-preview__notification-panel {
  position:relative;z-index:1;display:block;box-sizing:border-box;width:calc(100% - 238px);
  max-height:none;margin:40px 20px 40px 218px;padding:0;overflow:hidden;border:1px solid var(--cue-border);
  border-radius:var(--cue-radius-panel,18px);background:var(--cue-surface);color:var(--cue-text);box-shadow:none;
}
.agency-preview__notification-panel>header { display:flex;align-items:center;justify-content:space-between;gap:20px;padding:22px 24px;border-bottom:1px solid var(--cue-border); }
.agency-preview__notification-panel>header span { color:var(--cue-accent);font:800 10px/1.4 monospace;letter-spacing:.12em; }
.agency-preview__notification-panel>header h1 { margin:8px 0 0;font-size:clamp(1.8rem,4vw,2.5rem);line-height:1.05; }
.agency-preview__notification-close { display:grid;place-items:center;flex:0 0 42px;width:42px;height:42px;border:1px solid var(--cue-border);border-radius:50%;background:transparent;color:var(--cue-text);font-size:25px; }
.agency-preview__notification-item { display:grid;grid-template-columns:8px minmax(0,1fr);gap:14px;width:100%;padding:22px 24px;border:0;border-radius:0;background:transparent;color:var(--cue-text);text-align:left; }
.agency-preview__notification-item:hover { background:color-mix(in srgb,var(--cue-accent) 5%,var(--cue-surface)); }
.agency-preview__notification-item>i { width:8px;height:8px;margin-top:6px;border-radius:50%;background:var(--cue-accent); }
.agency-preview__notification-item>span { display:grid;gap:7px; }
.agency-preview__notification-item strong { font-size:15px; }
.agency-preview__notification-item small { color:var(--cue-muted);font-size:13px; }
.agency-preview__notification-item em { color:var(--cue-accent);font:800 10px/1.2 monospace;font-style:normal;text-transform:uppercase; }
.agency-preview__notification-backdrop { display:none; }
@media (max-width:960px) {
  .agency-preview__notification-backdrop { position:fixed;z-index:99;inset:0;background:rgba(0,0,0,.74);backdrop-filter:blur(5px); }
  .agency-preview__notification-panel { position:fixed;z-index:100;inset:12px;width:auto;max-height:none;height:auto;margin:0;padding:0;overflow:auto;border-radius:var(--cue-radius-panel,18px);box-shadow:0 22px 70px #000a; }
  .agency-preview__notification-panel>header { padding:20px 18px; }
  .agency-preview__notification-item { padding:20px 18px; }
}
</style>

<style scoped>
.agency-preview__notification-panel .agency-preview__notification-close {
  border:1px solid var(--cue-border)!important;border-radius:50%!important;background:transparent!important;color:var(--cue-text)!important;
}
.agency-preview__notification-panel .agency-preview__notification-close:hover,
.agency-preview__notification-panel .agency-preview__notification-close:focus-visible {
  border-color:var(--cue-accent)!important;background:transparent!important;color:var(--cue-accent)!important;
}
.agency-preview__notification-panel .agency-preview__notification-item {
  border:0!important;border-radius:0!important;background:transparent!important;color:var(--cue-text)!important;
}
.agency-preview__notification-panel .agency-preview__notification-item:hover,
.agency-preview__notification-panel .agency-preview__notification-item:focus-visible {
  background:color-mix(in srgb,var(--cue-accent) 5%,var(--cue-surface))!important;
}
</style>

<style scoped>
.agency-preview__notification-backdrop {
  display:block!important;position:fixed!important;z-index:99!important;inset:0!important;width:100vw!important;height:100dvh!important;
  margin:0!important;padding:0!important;border:0!important;background:rgba(0,0,0,.72)!important;backdrop-filter:blur(5px);
}
.agency-preview__notification-panel {
  position:fixed!important;z-index:100!important;top:50%!important;right:auto!important;bottom:auto!important;left:50%!important;
  transform:translate(-50%,-50%);box-sizing:border-box;width:min(640px,calc(100vw - 40px));height:auto;max-height:calc(100dvh - 48px);
  margin:0!important;padding:0;overflow:auto;border-radius:var(--cue-radius-panel,18px);box-shadow:0 24px 72px #000b;
}
.agency-preview__notification-panel .agency-preview__notification-close {
  border:1px solid var(--cue-border)!important;border-radius:50%!important;background:transparent!important;color:var(--cue-text)!important;
}
.agency-preview__notification-panel .agency-preview__notification-close:hover,
.agency-preview__notification-panel .agency-preview__notification-close:focus-visible {
  border-color:var(--cue-accent)!important;background:var(--cue-accent)!important;color:var(--cue-accent-ink)!important;
}
.agency-preview__notification-panel .agency-preview__notification-item {
  border:0!important;border-radius:0!important;background:transparent!important;color:var(--cue-text)!important;
}
.agency-preview__notification-panel .agency-preview__notification-item:hover,
.agency-preview__notification-panel .agency-preview__notification-item:focus-visible {
  background:color-mix(in srgb,var(--cue-accent) 5%,var(--cue-surface))!important;
}
.agency-preview__desktop-notifications { margin-top:0!important; }
.agency-preview__context button { color:var(--cue-text)!important; }
.agency-preview__context button:hover,.agency-preview__context button:focus-visible { color:var(--cue-accent)!important;border-color:var(--cue-accent)!important; }
.agency-preview__record-tabs button:not(:first-child):hover,
.agency-preview__record-tabs button:not(:first-child):focus-visible { color:var(--cue-accent)!important;border-bottom-color:var(--cue-accent)!important; }
.agency-preview__record-tabs button:first-child:hover,
.agency-preview__record-tabs button:first-child:focus-visible { color:var(--cue-accent)!important;border-color:var(--cue-accent)!important; }
@media(max-width:960px){
  .agency-preview__header nav .agency-preview__desktop-exit{display:none!important;}
}
@media(max-width:960px){
  .agency-preview__notification-panel {top:0!important;right:0!important;bottom:0!important;left:0!important;transform:none;width:100vw;height:100dvh;max-height:none;border:0;border-radius:0;}
  .agency-preview__notification-panel>header {padding-top:max(20px,env(safe-area-inset-top));}
}
</style>

<style scoped>
/* Match the sidebar notification control to the icon and label columns above. */
@media(min-width:961px){
  .agency-preview.workspace .agency-preview__header nav button.agency-preview__desktop-notifications{padding-left:15px!important;gap:4px!important;}
}
/* Give the notification row more vertical breathing room. */
.agency-preview__notification-item{padding-block:32px!important;}
@media(max-width:960px){
  .agency-preview__notification-item{padding:28px 18px!important;}
}
</style>

<style scoped>
.agency-preview__profile-preview{margin-top:24px;padding:24px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-panel,18px);background:var(--cue-surface)}
.agency-preview__profile-identity{display:flex;align-items:center;gap:20px}
.agency-preview__profile-photo{display:grid;flex:0 0 112px;place-items:center;align-content:center;gap:8px;width:112px;height:112px;box-sizing:border-box;border:1px dashed var(--cue-border);border-radius:16px;background:linear-gradient(145deg,var(--cue-bg),var(--cue-surface));color:var(--cue-muted)}
.agency-preview__profile-photo svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
.agency-preview__profile-photo span{font:800 20px/1 monospace;color:var(--cue-accent)}
.agency-preview__profile-name>span{font:800 10px/1.4 monospace;letter-spacing:.12em;color:var(--cue-accent)}
.agency-preview__profile-name h2{margin:8px 0 4px;font-size:clamp(1.35rem,3vw,2rem)}
.agency-preview__profile-name p{margin:0;color:var(--cue-muted)}
.agency-preview__profile-empty{margin-top:24px;padding:16px 18px;border-left:3px solid var(--cue-accent);border-radius:0 12px 12px 0;background:color-mix(in srgb,var(--cue-accent) 7%,var(--cue-surface))}
.agency-preview__profile-empty strong{font-size:14px}
.agency-preview__profile-empty p{margin:6px 0 0;color:var(--cue-muted);font-size:14px;line-height:1.55}
@media(max-width:600px){.agency-preview__profile-preview{margin-top:18px;padding:16px}.agency-preview__profile-identity{align-items:flex-start;gap:14px}.agency-preview__profile-photo{flex-basis:84px;width:84px;height:84px;border-radius:14px}.agency-preview__profile-name h2{font-size:1.3rem}}
</style>

<style scoped>
.agency-preview__passport,.agency-preview__cue-id-card{margin-top:24px;padding:22px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-panel,18px);background:var(--cue-surface)}
.agency-preview__passport>header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-bottom:18px;border-bottom:1px solid var(--cue-border)}
.agency-preview__passport>header span,.agency-preview__cue-id-copy>span,.agency-preview__cue-id-foot>span{font:800 10px/1.4 monospace;letter-spacing:.12em;color:var(--cue-accent)}
.agency-preview__passport h2,.agency-preview__cue-id-copy h2{margin:7px 0 0;font-size:clamp(1.25rem,3vw,1.7rem)}
.agency-preview__passport>header>strong{display:grid;place-items:center;min-width:38px;height:38px;padding:0 8px;border-radius:50%;background:color-mix(in srgb,var(--cue-accent) 15%,var(--cue-surface));color:var(--cue-accent);font-size:18px}
.agency-preview__passport-event{display:grid;grid-template-columns:58px minmax(0,1fr) auto;align-items:center;gap:16px;padding:18px 0;border-bottom:1px solid var(--cue-border)}
.agency-preview__passport-date{display:grid;justify-items:center;gap:2px;padding:8px 4px;border:1px solid var(--cue-border);border-radius:12px}.agency-preview__passport-date strong{font-size:20px}.agency-preview__passport-date span{font:800 9px/1.2 monospace;color:var(--cue-accent)}
.agency-preview__passport-event h3{margin:0;font-size:16px}.agency-preview__passport-event p,.agency-preview__cue-id-copy p{margin:5px 0 0;color:var(--cue-muted)}
.agency-preview__passport-status{color:var(--cue-accent);font-size:12px;font-weight:700}.agency-preview__passport-empty{color:var(--cue-muted)}
.agency-preview__cue-id-card{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:22px;overflow:hidden;background:radial-gradient(ellipse at 0 0,color-mix(in srgb,var(--cue-accent) 10%,var(--cue-surface)),var(--cue-surface) 65%)}
.agency-preview__cue-id-mark{position:relative;display:grid;place-items:center;width:112px;height:112px;border:1px solid var(--cue-accent);border-radius:24px;background:var(--cue-bg);color:var(--cue-accent);font:800 30px/1 monospace}.agency-preview__cue-id-mark i{position:absolute;right:10px;bottom:10px;width:10px;height:10px;border-radius:50%;background:#55d69a;box-shadow:0 0 0 4px var(--cue-bg)}
.agency-preview__cue-id-copy h2{font-size:clamp(1.5rem,4vw,2.2rem)}.agency-preview__cue-id-copy code{display:inline-block;margin-top:12px;padding:6px 9px;border:1px solid var(--cue-border);border-radius:8px;color:var(--cue-muted);font-size:12px}
.agency-preview__cue-id-foot{grid-column:1/-1;display:flex;justify-content:space-between;gap:12px;padding-top:16px;border-top:1px solid var(--cue-border)}.agency-preview__cue-id-foot strong{color:var(--cue-text);font-size:12px}
@media(max-width:600px){.agency-preview__passport,.agency-preview__cue-id-card{margin-top:18px;padding:16px}.agency-preview__passport-event{grid-template-columns:50px minmax(0,1fr);gap:12px}.agency-preview__passport-status{grid-column:2}.agency-preview__cue-id-card{gap:14px}.agency-preview__cue-id-mark{width:78px;height:78px;border-radius:18px;font-size:24px}}
</style>

<style scoped>
.agency-preview__profile-builder{margin-top:24px}
.agency-preview__profile-editor{position:fixed;z-index:120;top:50%;left:50%;transform:translate(-50%,-50%);box-sizing:border-box;width:min(600px,calc(100vw - 32px));max-height:85dvh;overflow:auto;padding:22px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-panel,18px);background:var(--cue-surface);color:var(--cue-text);box-shadow:0 24px 72px #000b}
.agency-preview__profile-editor:before{content:'';position:fixed;z-index:-1;inset:-100vh -100vw;background:rgba(0,0,0,.76);backdrop-filter:blur(5px)}
.agency-preview__profile-editor>header,.agency-preview__profile-editor>footer{display:flex;align-items:center;justify-content:space-between;gap:16px}
.agency-preview__profile-editor>header{padding-bottom:16px;border-bottom:1px solid var(--cue-border)}
.agency-preview__profile-editor>header span{font:800 10px/1.4 monospace;letter-spacing:.12em;color:var(--cue-accent)}
.agency-preview__profile-editor>header button{width:38px;height:38px;border:1px solid var(--cue-border);border-radius:50%;background:transparent;color:var(--cue-text);font-size:23px}
.agency-preview__profile-editor h2{margin:8px 0;font-size:22px}
.agency-preview__profile-fields{display:grid;gap:14px;padding:16px 0}
.agency-preview__profile-fields label{display:grid;gap:7px;font-size:13px}
.agency-preview__profile-fields input:not([type=checkbox]),.agency-preview__profile-fields textarea{width:100%;box-sizing:border-box;padding:12px;border:1px solid var(--cue-border);border-radius:10px;background:var(--cue-bg);color:var(--cue-text);font:inherit}
.agency-preview__profile-fields textarea{resize:vertical}
.agency-preview__profile-check{display:flex!important;align-items:center;gap:10px}
.agency-preview__profile-check input{accent-color:var(--cue-accent)}
.agency-preview__profile-editor-note{color:var(--cue-muted);font-size:14px;line-height:1.5}
.agency-preview__profile-editor>footer{justify-content:flex-end;padding-top:14px;border-top:1px solid var(--cue-border)}
.agency-preview__profile-editor>footer button{min-height:40px;padding:0 14px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-control,10px);background:transparent;color:var(--cue-text)}
.agency-preview__profile-editor>footer .agency-preview__profile-save{border-color:var(--cue-accent);background:var(--cue-accent);color:#111;font-weight:800}
@media(max-width:600px){.agency-preview__profile-builder{margin-top:18px}.agency-preview__profile-editor{padding:16px}}
</style>
