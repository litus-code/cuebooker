<script setup lang="ts">
import type { Activity, Contact, CoreBooking, Counterparty, CoreBookingStatus } from '../domain/bookingCore'

const props = defineProps<{
  workspaceId: string
  bookings: CoreBooking[]
  locale: 'es' | 'en'
  focusBookingId?: string
}>()

const emit = defineEmits<{ operationsChanged: [] }>()
const bookingCore = useBookingCore()
const selectedBookingId = ref('')
const contacts = ref<Contact[]>([])
const counterparties = ref<Counterparty[]>([])
const activities = ref<Activity[]>([])
const loadingMeta = ref(false)
const loadingActivity = ref(false)
const updatingStatus = ref(false)
const archiving = ref(false)
const archiveView = ref<'active' | 'archived'>('active')
const realSearch = ref('')
const realStatusFilter = ref<'all' | CoreBookingStatus>('all')

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'BOOKINGS / REALES',
  title: 'Bookings capturados',
  empty: 'Todavía no hay bookings reales.',
  date: 'Fecha', venue: 'Sala / entidad', contact: 'Contacto', offer: 'Oferta', source: 'Origen', status: 'Estado', activity: 'Activity',
  noActivity: 'Todavía no hay actividad registrada.',
  noDate: 'Sin fecha', noVenue: 'Sin sala definida', noContact: 'Sin contacto', noOffer: 'Sin oferta',
  active: 'Activos', archived: 'Archivados', archive: 'Archivar', restore: 'Restaurar'
} : {
  eyebrow: 'BOOKINGS / REAL',
  title: 'Captured bookings',
  empty: 'No real bookings yet.',
  date: 'Date', venue: 'Venue / entity', contact: 'Contact', offer: 'Offer', source: 'Source', status: 'Status', activity: 'Activity',
  noActivity: 'No activity recorded yet.',
  noDate: 'No date', noVenue: 'No venue defined', noContact: 'No contact', noOffer: 'No offer',
  active: 'Active', archived: 'Archived', archive: 'Archive', restore: 'Restore'
})

const statusLabels = computed<Record<CoreBookingStatus, string>>(() => props.locale === 'es' ? {
  new: 'Nueva', in_conversation: 'En conversación', waiting_response: 'Esperando respuesta', confirmed: 'Confirmada', rejected: 'Rechazada', cancelled: 'Cancelada'
} : {
  new: 'New', in_conversation: 'In conversation', waiting_response: 'Waiting response', confirmed: 'Confirmed', rejected: 'Rejected', cancelled: 'Cancelled'
})

const sourceLabels = computed<Record<string, string>>(() => props.locale === 'es' ? {
  booking_form: 'Formulario', phone: 'Teléfono', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram', in_person: 'En persona', manager: 'Manager', manual: 'Manual', other: 'Otro'
} : {
  booking_form: 'Booking form', phone: 'Phone', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram', in_person: 'In person', manager: 'Manager', manual: 'Manual', other: 'Other'
})

const visibleBookings = computed(() => {
  const query = realSearch.value.trim().toLowerCase()
  return props.bookings.filter(booking => {
    if (archiveView.value === 'active' && booking.archived_at) return false
    if (archiveView.value === 'archived' && !booking.archived_at) return false
    if (realStatusFilter.value !== 'all' && booking.status !== realStatusFilter.value) return false
    if (!query) return true
    const party = booking.counterparty_id ? counterparties.value.find(item => item.id === booking.counterparty_id) : null
    const contact = booking.primary_contact_id ? contacts.value.find(item => item.id === booking.primary_contact_id) : null
    return [booking.event_name, booking.venue_name, booking.city, booking.source, party?.name, contact?.name, contact?.email]
      .filter(Boolean).join(' ').toLowerCase().includes(query)
  })
})
const selectedBooking = computed(() => props.bookings.find(item => item.id === selectedBookingId.value) || visibleBookings.value[0] || props.bookings[0] || null)
const selectedContact = computed(() => selectedBooking.value?.primary_contact_id ? contacts.value.find(item => item.id === selectedBooking.value?.primary_contact_id) || null : null)
const selectedCounterparty = computed(() => selectedBooking.value?.counterparty_id ? counterparties.value.find(item => item.id === selectedBooking.value?.counterparty_id) || null : null)

watch(() => props.bookings, value => {
  if (!value.length) selectedBookingId.value = ''
  else if (!value.some(item => item.id === selectedBookingId.value)) selectedBookingId.value = value[0].id
}, { immediate: true, deep: true })

watch(() => props.focusBookingId, value => {
  if (value && props.bookings.some(item => item.id === value)) {
    realSearch.value = ''
    realStatusFilter.value = 'all'
    archiveView.value = props.bookings.find(item => item.id === value)?.archived_at ? 'archived' : 'active'
    selectedBookingId.value = value
  }
}, { immediate: true })

watch(visibleBookings, value => {
  if (value.length && !value.some(item => item.id === selectedBookingId.value)) selectedBookingId.value = value[0].id
}, { deep: true })

watch(() => props.workspaceId, async value => {
  if (!value) return
  loadingMeta.value = true
  try {
    const [contactRows, counterpartyRows] = await Promise.all([
      bookingCore.listContacts(value),
      bookingCore.listCounterparties(value)
    ])
    contacts.value = contactRows
    counterparties.value = counterpartyRows
  } finally {
    loadingMeta.value = false
  }
}, { immediate: true })

async function loadActivity() {
  const bookingId = selectedBooking.value?.id
  activities.value = []
  if (!bookingId || !props.workspaceId) return
  loadingActivity.value = true
  try {
    activities.value = await bookingCore.listActivities(props.workspaceId, bookingId)
  } finally {
    loadingActivity.value = false
  }
}

watch(() => selectedBooking.value?.id, loadActivity, { immediate: true })

async function handleOperationsChanged() {
  await loadActivity()
  emit('operationsChanged')
}

async function handleBookingSaved() {
  await loadActivity()
  emit('operationsChanged')
}

async function handleActivityCreated() {
  await loadActivity()
}

async function changeStatus(event: Event) {
  if (!selectedBooking.value) return
  const status = (event.target as HTMLSelectElement).value as CoreBookingStatus
  if (status === selectedBooking.value.status) return
  updatingStatus.value = true
  try {
    await bookingCore.setBookingStatus(props.workspaceId, selectedBooking.value.id, status)
    await loadActivity()
    emit('operationsChanged')
  } catch (error: any) {
    window.alert(error?.message === 'confirmed_booking_requires_date'
      ? (props.locale === 'es' ? 'Para confirmar el booking primero necesitas una fecha.' : 'A booking needs a date before it can be confirmed.')
      : (error?.message || 'Booking status could not be updated.'))
  } finally {
    updatingStatus.value = false
  }
}

async function toggleArchive() {
  if (!selectedBooking.value) return
  const nextArchived = !selectedBooking.value.archived_at
  if (nextArchived && !window.confirm(props.locale === 'es'
    ? 'Se archivará el booking y se cerrarán su Next Move y Holds activos. La Activity se conserva.'
    : 'This booking will be archived and its active Next Move and Holds will be closed. Activity is preserved.')) return
  archiving.value = true
  try {
    await bookingCore.setBookingArchived(props.workspaceId, selectedBooking.value.id, nextArchived)
    await loadActivity()
    emit('operationsChanged')
    archiveView.value = nextArchived ? 'archived' : 'active'
  } catch (error: any) {
    window.alert(error?.message || 'Booking archive could not be updated.')
  } finally {
    archiving.value = false
  }
}

function formatDate(value: string | null) {
  if (!value) return copy.value.noDate
  return new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function formatMoney(booking: CoreBooking) {
  if (booking.offer_amount_minor == null || !booking.currency) return copy.value.noOffer
  return new Intl.NumberFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', { style: 'currency', currency: booking.currency }).format(booking.offer_amount_minor / 100)
}

function bookingTitle(booking: CoreBooking) {
  const party = booking.counterparty_id ? counterparties.value.find(item => item.id === booking.counterparty_id) : null
  return booking.venue_name || party?.name || booking.event_name || copy.value.noVenue
}
</script>

<template>
  <section class="core-inbox">
    <header class="core-inbox__heading">
      <div>
        <span>{{ copy.eyebrow }}</span>
        <strong>{{ copy.title }}</strong>
      </div>
      <b>{{ bookings.length }}</b>
    </header>

    <p v-if="!bookings.length" class="core-inbox__empty">{{ copy.empty }}</p>

    <div v-if="bookings.length" class="core-inbox__tools">
      <input v-model="realSearch" type="search" :placeholder="locale === 'es' ? 'Buscar booking, sala, contacto…' : 'Search booking, venue, contact…'">
      <div class="core-inbox__filters core-inbox__filters--archive">
        <button type="button" :class="{ active: archiveView === 'active' }" @click="archiveView = 'active'">{{ copy.active }} · {{ bookings.filter(item => !item.archived_at).length }}</button>
        <button type="button" :class="{ active: archiveView === 'archived' }" @click="archiveView = 'archived'">{{ copy.archived }} · {{ bookings.filter(item => !!item.archived_at).length }}</button>
      </div>
      <div class="core-inbox__filters">
        <button type="button" :class="{ active: realStatusFilter === 'all' }" @click="realStatusFilter = 'all'">{{ locale === 'es' ? 'Todos' : 'All' }} · {{ visibleBookings.length }}</button>
        <button v-for="(label, status) in statusLabels" :key="status" type="button" :class="{ active: realStatusFilter === status }" @click="realStatusFilter = status">{{ label }} · {{ bookings.filter(item => item.status === status).length }}</button>
      </div>
    </div>

    <p v-if="bookings.length && !visibleBookings.length" class="core-inbox__empty">{{ locale === 'es' ? 'No hay bookings con estos filtros.' : 'No bookings match these filters.' }}</p>

    <div v-else-if="bookings.length" class="core-inbox__layout">
      <div class="core-inbox__list">
        <button
          v-for="booking in visibleBookings"
          :key="booking.id"
          type="button"
          :class="{ active: selectedBooking?.id === booking.id }"
          @click="selectedBookingId = booking.id"
        >
          <time>{{ formatDate(booking.event_date) }}</time>
          <span><strong>{{ bookingTitle(booking) }}</strong><small>{{ booking.event_name || sourceLabels[booking.source] || booking.source }}</small></span>
          <em>{{ statusLabels[booking.status] }}</em>
        </button>
      </div>

      <article v-if="selectedBooking" class="core-inbox__detail">
        <header>
          <div>
            <span>{{ sourceLabels[selectedBooking.source] || selectedBooking.source }}</span>
            <h3>{{ bookingTitle(selectedBooking) }}</h3>
            <p>{{ selectedBooking.event_name || selectedBooking.city || '—' }}</p>
          </div>
          <div class="core-inbox__header-actions">
            <BookingCoreEditor :workspace-id="workspaceId" :booking="selectedBooking" :locale="locale" @saved="handleBookingSaved" />
            <button class="core-inbox__archive" type="button" :disabled="archiving" @click="toggleArchive">{{ selectedBooking.archived_at ? copy.restore : copy.archive }}</button>
            <label class="core-inbox__status core-inbox__status-control"><span>{{ copy.status }}</span><select :value="selectedBooking.status" :disabled="updatingStatus" @change="changeStatus"><option v-for="(label, status) in statusLabels" :key="status" :value="status">{{ label }}</option></select></label>
          </div>
        </header>

        <dl class="core-inbox__facts">
          <div><dt>{{ copy.date }}</dt><dd>{{ formatDate(selectedBooking.event_date) }}</dd></div>
          <div><dt>{{ copy.venue }}</dt><dd>{{ selectedCounterparty?.name || selectedBooking.venue_name || copy.noVenue }}</dd></div>
          <div><dt>{{ copy.contact }}</dt><dd>{{ loadingMeta ? '…' : selectedContact?.name || copy.noContact }}</dd></div>
          <div><dt>{{ copy.offer }}</dt><dd>{{ formatMoney(selectedBooking) }}</dd></div>
        </dl>

        <BookingCoreConflictNotice
          :workspace-id="workspaceId"
          :booking="selectedBooking"
          :bookings="bookings"
          :locale="locale"
          :refresh-key="activities.length"
        />

        <BookingCoreOperations
          :workspace-id="workspaceId"
          :booking="selectedBooking"
          :locale="locale"
          @changed="handleOperationsChanged"
        />

        <BookingActivityComposer
          :workspace-id="workspaceId"
          :booking="selectedBooking"
          :locale="locale"
          @created="handleActivityCreated"
        />

        <section class="core-inbox__activity">
          <h4>{{ copy.activity }}</h4>
          <p v-if="loadingActivity" class="core-inbox__empty">…</p>
          <p v-else-if="!activities.length" class="core-inbox__empty">{{ copy.noActivity }}</p>
          <article v-for="activity in activities" v-else :key="activity.id">
            <div><strong>{{ activity.type.replaceAll('_', ' ') }}</strong><time>{{ formatTime(activity.occurred_at) }}</time></div>
            <p v-if="activity.body">{{ activity.body }}</p>
          </article>
        </section>
      </article>
    </div>
  </section>
</template>

<style scoped>
.core-inbox { margin: 14px 0 18px; border: 1px solid var(--cue-border); background: var(--cue-surface); }
.core-inbox__heading { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 16px; border-bottom:1px solid var(--cue-border); }
.core-inbox__heading span { display:block; color:var(--cue-accent); font:700 9px/1.2 monospace; letter-spacing:.11em; }
.core-inbox__heading strong { display:block; margin-top:4px; font-size:15px; }
.core-inbox__heading b { min-width:34px; text-align:center; font:700 12px monospace; color:var(--cue-accent); }
.core-inbox__tools { display:grid; gap:8px; padding:10px; border-bottom:1px solid var(--cue-border); }
.core-inbox__tools > input { min-height:36px; border:1px solid var(--cue-border); background:var(--cue-raised); color:var(--cue-text); padding:0 10px; }
.core-inbox__filters { display:flex; gap:4px; overflow-x:auto; scrollbar-width:thin; }
.core-inbox__filters button { flex:0 0 auto; min-height:29px; padding:0 8px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; text-transform:uppercase; }
.core-inbox__filters button.active { border-color:var(--cue-accent); color:var(--cue-accent); }
.core-inbox__layout { display:grid; grid-template-columns:minmax(260px,.75fr) minmax(0,1.65fr); }
.core-inbox__list { border-right:1px solid var(--cue-border); }
.core-inbox__list button { display:grid; grid-template-columns:82px minmax(0,1fr) auto; align-items:center; gap:12px; width:100%; min-height:72px; padding:12px 14px; border:0; border-bottom:1px solid var(--cue-border); background:transparent; color:var(--cue-text); text-align:left; cursor:pointer; }
.core-inbox__list button.active { background:var(--cue-raised); }
.core-inbox__list time { color:var(--cue-muted); font:700 10px monospace; }
.core-inbox__list span strong, .core-inbox__list span small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.core-inbox__list span small { margin-top:4px; color:var(--cue-muted); font-size:11px; }
.core-inbox__list em { font:700 9px monospace; color:var(--cue-accent); text-transform:uppercase; font-style:normal; }
.core-inbox__detail { min-width:0; padding:18px; }
.core-inbox__detail > header { display:flex; justify-content:space-between; gap:18px; padding-bottom:18px; border-bottom:1px solid var(--cue-border); }
.core-inbox__detail > header span { color:var(--cue-accent); font:700 9px monospace; text-transform:uppercase; letter-spacing:.1em; }
.core-inbox__detail h3 { margin:6px 0 3px; font-size:28px; line-height:1; }
.core-inbox__detail header p { margin:0; color:var(--cue-muted); font-size:12px; }
.core-inbox__header-actions { display:flex; align-items:flex-start; gap:7px; flex-wrap:wrap; justify-content:flex-end; }
.core-inbox__status { align-self:flex-start; padding:7px 9px; border:1px solid var(--cue-border); font:700 9px monospace; text-transform:uppercase; }
.core-inbox__archive { min-height:31px; padding:0 9px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.core-inbox__archive:hover { border-color:var(--cue-accent); color:var(--cue-text); }
.core-inbox__archive:disabled { opacity:.5; cursor:wait; }
.core-inbox__filters--archive { padding-bottom:2px; }
.core-inbox__status-control { display:grid; gap:4px; padding:6px 8px; }
.core-inbox__status-control > span { color:var(--cue-muted); font:700 7px monospace; letter-spacing:.08em; }
.core-inbox__status-control select { border:0; outline:0; background:transparent; color:var(--cue-text); font:700 9px monospace; text-transform:uppercase; cursor:pointer; }
.core-inbox__facts { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); margin:0; border-bottom:1px solid var(--cue-border); }
.core-inbox__facts > div { min-width:0; padding:14px 12px 14px 0; }
.core-inbox__facts dt { color:var(--cue-muted); font:700 9px monospace; text-transform:uppercase; }
.core-inbox__facts dd { margin:5px 0 0; overflow:hidden; text-overflow:ellipsis; font-size:12px; }
.core-inbox__activity { padding-top:16px; }
.core-inbox__activity h4 { margin:0 0 10px; font-size:11px; text-transform:uppercase; letter-spacing:.08em; }
.core-inbox__activity article { padding:11px 0; border-top:1px solid var(--cue-border); }
.core-inbox__activity article > div { display:flex; justify-content:space-between; gap:12px; }
.core-inbox__activity article strong { font:700 10px monospace; text-transform:uppercase; color:var(--cue-accent); }
.core-inbox__activity article time { color:var(--cue-muted); font:10px monospace; }
.core-inbox__activity article p { margin:6px 0 0; color:var(--cue-text); font-size:12px; line-height:1.45; }
.core-inbox__empty { margin:0; padding:18px; color:var(--cue-muted); font-size:12px; }
@media (max-width: 760px) {
  .core-inbox__layout { grid-template-columns:1fr; }
  .core-inbox__list { border-right:0; border-bottom:1px solid var(--cue-border); max-height:260px; overflow:auto; }
  .core-inbox__list button { grid-template-columns:70px minmax(0,1fr); min-height:62px; }
  .core-inbox__list em { grid-column:2; margin-top:-4px; }
  .core-inbox__detail { padding:14px; }
  .core-inbox__detail h3 { font-size:22px; }
  .core-inbox__facts { grid-template-columns:1fr 1fr; }
}
</style>
