<script setup lang="ts">
import type { Contact, CoreBooking, Hold, NextMove, CreateManualBookingInput } from '../domain/bookingCore'
import type { WorkspaceActivityHistoryRow } from '../services/bookingCoreApi'

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
const focusedBooking = computed(() => demoBookings.value.find(item => item.id === focusBookingId.value))
const bookingArtist = computed(() => artists.value.find(item => item.id === focusedBooking.value?.artist_id))
function closeBooking() { focusBookingId.value = ''; view.value = returnView.value }
const nav = computed<Array<{ id: DemoView; label: string }>>(() => [
  { id: 'overview', label: 'Overview' }, { id: 'bookings', label: 'Bookings' }, { id: 'calendar', label: 'Calendar' },
  { id: 'history', label: 'Activity' }, { id: 'roster', label: locale.value === 'es' ? 'Artistas' : 'Artists' },
  { id: 'settings', label: 'Settings' }
])
const previewNotificationsOpen = ref(false)
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
        <button v-for="item in nav" :key="item.id" :data-workspace-view="item.id" type="button" :aria-current="(view === item.id || item.id === 'roster' && ['profile','passport','cue-id'].includes(view)) ? 'page' : undefined" @click="changeView(item.id)">{{ item.label }}</button>
      </nav>
      <div class="agency-preview__actions">
        <button class="agency-preview__icon agency-preview__notification" type="button" :aria-label="locale === 'es' ? 'Notificaciones' : 'Notifications'" :aria-expanded="previewNotificationsOpen" @click="previewNotificationsOpen = !previewNotificationsOpen">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
          <span class="agency-preview__badge" aria-hidden="true">1</span>
        </button>
        <NuxtLink class="agency-preview__icon agency-preview__exit" to="/access" :aria-label="locale === 'es' ? 'Salir' : 'Exit'" :title="locale === 'es' ? 'Salir' : 'Exit'">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/></svg>
        </NuxtLink>
        <section v-if="previewNotificationsOpen" class="agency-preview__notification-panel" role="dialog" :aria-label="locale === 'es' ? 'Notificaciones' : 'Notifications'">
          <strong>{{ locale === 'es' ? 'Nueva solicitud de booking' : 'New booking request' }}</strong>
          <span>Nave Industrial · Sala 04</span>
          <button type="button" @click="openPreviewNotification">{{ locale === 'es' ? 'Abrir solicitud' : 'Open request' }}</button>
        </section>
      </div>
    </header>

    <div v-if="selectedArtist" class="agency-preview__context"><span>CUE Test Agency / <strong>{{ selectedArtist.stage_name }}</strong></span><button type="button" @click="returnToAgency">{{ locale === 'es' ? 'Quitar filtro de artista' : 'Clear artist filter' }}</button></div>
    <nav v-if="selectedArtist && ['profile','passport','cue-id'].includes(view)" class="agency-preview__record-tabs" aria-label="Ficha del artista"><button type="button" @click="changeView('roster')">← {{ locale === 'es' ? 'Artistas' : 'Artists' }}</button><button v-for="tab in (['profile','passport','cue-id'] as const)" :key="tab" type="button" :aria-current="view===tab?'page':undefined" @click="changeView(tab)">{{ tab==='profile'?(locale==='es'?'Ficha y perfil público':'Record & public profile'):tab==='passport'?(locale==='es'?'Trayectoria':'Career'):'CUE ID' }}</button></nav>
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
      <p v-if="view === 'profile'">{{ locale === 'es' ? 'Ficha del artista seleccionado. Una agencia autorizada puede editar su identidad pública y configurar el booking.' : 'Selected artist profile. An authorized agency can edit the public identity and booking settings.' }}</p>
      <p v-else-if="view === 'passport'">{{ locale === 'es' ? 'El recorrido pertenece a este artista y se alimenta de sus bookings confirmados.' : 'This artist journey grows from confirmed bookings.' }}</p>
      <p v-else-if="view === 'cue-id'">{{ locale === 'es' ? 'La identidad visual pertenece al artista seleccionado.' : 'The visual identity belongs to the selected artist.' }}</p>
      <p v-else>{{ locale === 'es' ? 'Configuración del workspace de Agencia.' : 'Agency workspace settings.' }}</p>
      <AgencyCatalogEditor v-if="view === 'settings'" workspace-id="preview-agency" role="owner" :locale="locale" demo @edit-artist="id => { chooseArtist(id); changeView('profile') }" />
      <AgencyTeamPanel v-if="view === 'settings'" workspace-id="preview-agency" role="owner" user-id="demo-owner" :locale="locale" :demo="true" />
      <ConnectedMailboxPanel v-if="view === 'settings'" workspace-id="preview-agency" :locale="locale" demo />
      <div v-else class="agency-preview__read-only"><span>PREVIEW / {{ locale === 'es' ? 'SIN EDICIÓN REAL' : 'NO LIVE EDITING' }}</span><p>{{ locale === 'es' ? 'Esta sección muestra el contexto y la navegación. Su editor real requiere una cuenta Agency.' : 'This section shows context and navigation. The live editor requires an Agency account.' }}</p></div>
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
</style>

<style scoped>
.agency-preview__context{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;margin-top:20px;padding:12px;border-left:3px solid var(--cue-accent);background:var(--cue-surface);font-size:12px}.agency-preview__context button{background:transparent;color:var(--cue-accent);border:1px solid var(--cue-border);padding:8px}
</style>

<style scoped>.agency-preview__record-tabs{display:flex;flex-wrap:wrap;gap:10px;margin-top:20px}.agency-preview__record-tabs button{background:var(--cue-surface);color:var(--cue-text);padding:10px;border:1px solid var(--cue-border)}.agency-preview__record-tabs button[aria-current=page]{color:var(--cue-accent);border-bottom:2px solid var(--cue-accent)}</style>

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
  position:absolute;
  z-index:50;
  top:calc(100% + 12px);
  right:0;
  display:grid;
  gap:8px;
  width:min(280px,calc(100vw - 32px));
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
