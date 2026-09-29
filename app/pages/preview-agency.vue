<script setup lang="ts">
import type { Contact, CoreBooking, Hold } from '../domain/bookingCore'
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
const demoData = { bookings: demoBookings.value, activities: demoActivities, holds: demoHolds, contacts: [
  { id: 'demo-contact-a', name: 'Promoter / Sala 04' }, { id: 'demo-contact-b', name: 'Programación / Club Norte' },
  { id: 'demo-contact-c', name: 'Producción / Warehouse 17' }, { id: 'demo-contact-d', name: 'Promoter / La Nave' }
], counterparties: [] }
const demoContacts: Contact[] = demoData.contacts.map(item => ({ id: item.id, workspace_id: 'preview-agency', name: item.name,
  email: null, phone: null, role_label: null, notes: null, created_by: 'preview', created_at: now, updated_at: now }))
const demoInboxData = { contacts: demoContacts, counterparties: [], activities: demoActivities, holds: demoHolds, nextMoves: {} as Record<string, string> }
const focusedBooking = computed(() => demoBookings.value.find(item => item.id === focusBookingId.value))
const nav = computed<Array<{ id: DemoView; label: string }>>(() => [
  { id: 'overview', label: 'Overview' }, { id: 'bookings', label: 'Bookings' }, { id: 'calendar', label: 'Calendar' },
  { id: 'history', label: 'Activity' }, { id: 'roster', label: 'Roster' },
  ...(selectedArtist.value ? [{ id: 'profile' as const, label: 'Profile' }, { id: 'passport' as const, label: 'Passport' }, { id: 'cue-id' as const, label: 'CUE ID' }] : []),
  { id: 'settings', label: 'Settings' }
])

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
  if (next === 'roster') selectedArtistId.value = ''
  view.value = next
  focusBookingId.value = ''
}
function chooseArtist(id: string) {
  selectedArtistId.value = artists.value.some(item => item.id === id && item.roster_active) ? id : ''
  focusBookingId.value = ''
  if (!selectedArtistId.value && ['profile', 'passport', 'cue-id'].includes(view.value)) view.value = 'overview'
}
function openBooking(id: string) {
  const item = demoBookings.value.find(row => row.id === id)
  if (!item) return
  selectedArtistId.value = item.artist_id
  view.value = 'bookings'
  focusBookingId.value = id
}
async function createArtist(name: string, slug: string, city: string) {
  if (artists.value.some(item => item.slug === slug)) return false
  artists.value.push({ id: `demo-${Date.now()}`, stage_name: name, slug, city, roster_active: true })
  rosterRevision.value++
  return true
}
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
  <main v-if="allowed" class="agency-preview">
    <header class="agency-preview__header">
      <NuxtLink to="/" aria-label="Cuebooker"><CueBrand class="agency-preview__brand" /></NuxtLink>
      <nav aria-label="Workspace Agency">
        <button v-for="item in nav" :key="item.id" type="button" :aria-current="view === item.id ? 'page' : undefined" @click="changeView(item.id)">{{ item.label }}</button>
      </nav>
      <label class="agency-preview__selector"><span>AGENCIA / CUE TEST AGENCY</span><select :value="selectedArtistId" :aria-label="locale === 'es' ? 'Contexto de artista' : 'Artist context'" @change="chooseArtist(($event.target as HTMLSelectElement).value)"><option value="">{{ locale === 'es' ? 'Todos los artistas' : 'All artists' }}</option><option v-for="artist in artists.filter(item => item.roster_active)" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
    </header>
    <div class="agency-preview__notice"><strong>PREVIEW AGENCIA / DATOS FICTICIOS</strong><span>{{ locale === 'es' ? 'Puedes recorrer el workspace sin iniciar sesión. Los cambios se pierden al recargar.' : 'Explore the workspace without signing in. Changes reset on reload.' }}</span></div>

    <AgencyWorkspace
      v-if="!focusedBooking && ['overview', 'bookings', 'calendar', 'history', 'roster'].includes(view)"
      :key="selectedArtistId || 'all'" :workspace-id="'preview-agency'" agency-name="CUE Test Agency"
      :artists="view === 'roster' || !selectedArtist ? artists : [selectedArtist]"
      :view="view as 'overview' | 'bookings' | 'calendar' | 'history' | 'roster'"
      :locale="locale" :can-manage-roster="true" :create-artist="createArtist"
      :demo-data="demoData" :initial-month="demoMonth" :revision="rosterRevision"
      :context-artist-name="view !== 'roster' ? selectedArtist?.stage_name : undefined"
      @navigate="changeView" @select-artist="(id, target) => { chooseArtist(id); changeView(target) }"
      @open-booking="openBooking" @retire-artist="setRosterActive($event, false)" @restore-artist="setRosterActive($event, true)"
    />

    <section v-else-if="focusedBooking && view === 'bookings'" class="agency-preview__inbox">
      <div class="agency-preview__inbox-heading"><div><span>AGENCIA / {{ selectedArtist?.stage_name }}</span><h1>{{ locale === 'es' ? 'Seguimiento del booking.' : 'Booking follow-up.' }}</h1><p>{{ locale === 'es' ? 'La gestión individual conserva el mismo panel de Bookings que usa un DJ.' : 'Individual work uses the same Bookings panel as a DJ.' }}</p></div><button type="button" @click="chooseArtist('')">← {{ locale === 'es' ? 'Todos los artistas' : 'All artists' }}</button></div>
      <BookingCoreInbox workspace-id="preview-agency" :bookings="demoBookings.filter(item => item.artist_id === selectedArtistId)" :locale="locale" :focus-booking-id="focusBookingId" :demo-data="demoInboxData" @booking-opened="focusBookingId = $event" @calendar-requested="changeView('calendar')" />
    </section>

    <section v-else class="agency-preview__detail">
      <span>{{ selectedArtist ? `AGENCIA / ${selectedArtist.stage_name}` : 'AGENCIA / CUE TEST AGENCY' }}</span>
      <h1>{{ view === 'profile' ? selectedArtist?.stage_name : view === 'passport' ? 'CUE PASSPORT' : view === 'cue-id' ? 'CUE ID' : 'SETTINGS' }}</h1>
      <p v-if="view === 'profile'">{{ locale === 'es' ? 'Ficha del artista seleccionado. Una agencia autorizada puede editar su identidad pública y configurar el booking.' : 'Selected artist profile. An authorized agency can edit the public identity and booking settings.' }}</p>
      <p v-else-if="view === 'passport'">{{ locale === 'es' ? 'El recorrido pertenece a este artista y se alimenta de sus bookings confirmados.' : 'This artist journey grows from confirmed bookings.' }}</p>
      <p v-else-if="view === 'cue-id'">{{ locale === 'es' ? 'La identidad visual pertenece al artista seleccionado.' : 'The visual identity belongs to the selected artist.' }}</p>
      <p v-else>{{ locale === 'es' ? 'Configuración del workspace de Agencia.' : 'Agency workspace settings.' }}</p>
      <div class="agency-preview__read-only"><span>PREVIEW / {{ locale === 'es' ? 'SIN EDICIÓN REAL' : 'NO LIVE EDITING' }}</span><p>{{ locale === 'es' ? 'Esta sección muestra el contexto y la navegación. Su editor real requiere una cuenta Agency.' : 'This section shows context and navigation. The live editor requires an Agency account.' }}</p></div>
    </section>

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
@media(max-width:850px){.agency-preview__header{grid-template-columns:1fr auto}.agency-preview__header nav{grid-column:1/-1;grid-row:2}.agency-preview__selector{min-width:150px}.agency-preview__notice{align-items:start;flex-direction:column;gap:5px}}
@media(max-width:760px){.agency-preview__inbox-heading{align-items:start;flex-direction:column}.agency-preview__inbox-heading h1{font-size:2.3rem}}
@media(max-width:390px){.agency-preview__brand{width:100px}.agency-preview__selector{min-width:130px}.agency-preview__header{gap:6px}}
</style>
