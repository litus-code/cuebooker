<script setup lang="ts">
import type { Activity, Contact, CoreBooking, Counterparty, CoreBookingStatus } from '../domain/bookingCore'

const props = defineProps<{
  workspaceId: string
  bookings: CoreBooking[]
  locale: 'es' | 'en'
  focusBookingId?: string
}>()

const emit = defineEmits<{ operationsChanged: []; cueRequested: [] }>()
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
  empty: 'Todavía no hay bookings reales.', emptyTitle: 'Tu primer booking empieza con un CUE.', emptyBody: 'Si te llaman, te escriben o aparece una oportunidad, guárdala en segundos. No necesitas tener todos los datos.', emptyAction: '+ CUE',
  date: 'Fecha', venue: 'Sala / entidad', contact: 'Contacto', offer: 'Oferta', source: 'Origen', status: 'Estado', activity: 'Conversación', details: 'Datos del booking',
  noActivity: 'Todavía no hay actividad registrada.',
  confirm: 'Confirmar', reject: 'Rechazar', cancel: 'Cancelar',
  confirmQuestion: '¿Confirmar este booking?', rejectQuestion: '¿Rechazar este booking?', cancelQuestion: '¿Cancelar este booking?',
  automaticState: 'Estado automático según la última interacción.',
  noDate: 'Sin fecha', noVenue: 'Sin sala definida', noContact: 'Sin contacto', noOffer: 'Sin oferta',
  active: 'Activos', archived: 'Archivados', archive: 'Archivar', restore: 'Restaurar', archivedReadOnly: 'Booking archivado. La traza se conserva en modo lectura.'
} : {
  eyebrow: 'BOOKINGS / REAL',
  title: 'Captured bookings',
  empty: 'No real bookings yet.', emptyTitle: 'Your first booking starts with a CUE.', emptyBody: 'If someone calls, messages you or an opportunity appears, save it in seconds. You do not need every detail yet.', emptyAction: '+ CUE',
  date: 'Date', venue: 'Venue / entity', contact: 'Contact', offer: 'Offer', source: 'Source', status: 'Status', activity: 'Conversation', details: 'Booking details',
  noActivity: 'No activity recorded yet.',
  confirm: 'Confirm', reject: 'Reject', cancel: 'Cancel',
  confirmQuestion: 'Confirm this booking?', rejectQuestion: 'Reject this booking?', cancelQuestion: 'Cancel this booking?',
  automaticState: 'Automatic state based on the latest interaction.',
  noDate: 'No date', noVenue: 'No venue defined', noContact: 'No contact', noOffer: 'No offer',
  active: 'Active', archived: 'Archived', archive: 'Archive', restore: 'Restore', archivedReadOnly: 'Archived booking. Its trace is preserved in read-only mode.'
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
const selectedBooking = computed(() => visibleBookings.value.find(item => item.id === selectedBookingId.value) || visibleBookings.value[0] || null)
const selectedContact = computed(() => selectedBooking.value?.primary_contact_id ? contacts.value.find(item => item.id === selectedBooking.value?.primary_contact_id) || null : null)
const selectedCounterparty = computed(() => selectedBooking.value?.counterparty_id ? counterparties.value.find(item => item.id === selectedBooking.value?.counterparty_id) || null : null)
const conversationActivities = computed(() => activities.value.filter(activity =>
  Boolean(activity.body?.trim())
  && !['status_change', 'system', 'hold_converted', 'hold_released'].includes(activity.type)
))

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
    if (import.meta.client) void scrollToSelectedBooking()
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

async function decideStatus(status: Extract<CoreBookingStatus, 'confirmed' | 'rejected' | 'cancelled'>) {
  if (!selectedBooking.value || selectedBooking.value.status === status) return

  const question = status === 'confirmed'
    ? copy.value.confirmQuestion
    : status === 'rejected'
      ? copy.value.rejectQuestion
      : copy.value.cancelQuestion

  if (!window.confirm(question)) return

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

function prefersReducedMotion() {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

async function scrollToSelectedBooking() {
  if (!import.meta.client) return
  await nextTick()
  const detail = document.getElementById('core-inbox-detail')
  if (!detail) return
  const header = document.getElementById('workspace-header')
  const offset = (header?.getBoundingClientRect().height || 0) + 10
  const top = detail.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

async function selectBooking(bookingId: string) {
  selectedBookingId.value = bookingId
  await scrollToSelectedBooking()
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

    <div v-if="!bookings.length" class="core-inbox__zero">
      <span>{{ copy.empty }}</span>
      <strong>{{ copy.emptyTitle }}</strong>
      <p>{{ copy.emptyBody }}</p>
      <button type="button" @click="emit('cueRequested')">{{ copy.emptyAction }}</button>
    </div>

    <div v-if="bookings.length" id="core-inbox-tools" class="core-inbox__tools">
      <input v-model="realSearch" type="search" :placeholder="locale === 'es' ? 'Buscar booking, sala, contacto…' : 'Search booking, venue, contact…'">
      <div class="core-inbox__filters core-inbox__filters--archive">
        <button type="button" :class="{ active: archiveView === 'active' }" @click="archiveView = 'active'">{{ copy.active }} · {{ bookings.filter(item => !item.archived_at).length }}</button>
        <button type="button" :class="{ active: archiveView === 'archived' }" @click="archiveView = 'archived'">{{ copy.archived }} · {{ bookings.filter(item => !!item.archived_at).length }}</button>
      </div>
      <div class="core-inbox__filters">
        <button type="button" :class="['status-filter', 'status-filter--all', { active: realStatusFilter === 'all' }]" @click="realStatusFilter = 'all'">{{ locale === 'es' ? 'Todos' : 'All' }} · {{ visibleBookings.length }}</button>
        <button v-for="(label, status) in statusLabels" :key="status" type="button" :class="['status-filter', `status-filter--${status}`, { active: realStatusFilter === status }]" @click="realStatusFilter = status">{{ label }} · {{ bookings.filter(item => item.status === status).length }}</button>
      </div>
    </div>

    <p v-if="bookings.length && !visibleBookings.length" class="core-inbox__empty">{{ locale === 'es' ? 'No hay bookings con estos filtros.' : 'No bookings match these filters.' }}</p>

    <div v-else-if="bookings.length" class="core-inbox__layout">
      <div id="core-inbox-list" class="core-inbox__list">
        <button
          v-for="booking in visibleBookings"
          :key="booking.id"
          type="button"
          :class="{ active: selectedBooking?.id === booking.id }"
          @click="selectBooking(booking.id)"
        >
          <time>{{ formatDate(booking.event_date) }}</time>
          <span><strong>{{ bookingTitle(booking) }}</strong><small>{{ booking.event_name || sourceLabels[booking.source] || booking.source }}</small></span>
          <em :class="`booking-status booking-status--${booking.status}`">{{ statusLabels[booking.status] }}</em>
        </button>
      </div>

      <article v-if="selectedBooking" id="core-inbox-detail" class="core-inbox__detail">
        <header>
          <div>
            <span>{{ sourceLabels[selectedBooking.source] || selectedBooking.source }}</span>
            <h3>{{ bookingTitle(selectedBooking) }}</h3>
            <p>{{ selectedBooking.event_name || selectedBooking.city || '—' }}</p>
          </div>
          <div class="core-inbox__header-actions">
            <button class="core-inbox__archive" type="button" :disabled="archiving" @click="toggleArchive">{{ selectedBooking.archived_at ? copy.restore : copy.archive }}</button>
            <div v-if="!selectedBooking.archived_at" class="core-inbox__decision-block">
              <div :class="['core-inbox__status', `core-inbox__status--${selectedBooking.status}`]">
                <span>{{ copy.status }}</span>
                <strong>{{ statusLabels[selectedBooking.status] }}</strong>
                <small v-if="['new','in_conversation','waiting_response'].includes(selectedBooking.status)">{{ copy.automaticState }}</small>
              </div>
              <div v-if="!['confirmed','rejected','cancelled'].includes(selectedBooking.status)" class="core-inbox__decisions">
                <button type="button" class="decision-confirm" :disabled="updatingStatus" @click="decideStatus('confirmed')">{{ copy.confirm }}</button>
                <button type="button" class="decision-reject" :disabled="updatingStatus" @click="decideStatus('rejected')">{{ copy.reject }}</button>
                <button type="button" class="decision-cancel" :disabled="updatingStatus" @click="decideStatus('cancelled')">{{ copy.cancel }}</button>
              </div>
            </div>
          </div>
        </header>

        <section class="core-inbox__details-block">
          <div class="core-inbox__details-heading">
            <strong>{{ copy.details }}</strong>
            <BookingCoreEditor
              v-if="!selectedBooking.archived_at"
              :workspace-id="workspaceId"
              :booking="selectedBooking"
              :locale="locale"
              @saved="handleBookingSaved"
            />
          </div>
          <dl id="core-inbox-facts" class="core-inbox__facts">
            <div><dt>{{ copy.date }}</dt><dd :class="{ missing: !selectedBooking.event_date }">{{ formatDate(selectedBooking.event_date) }}</dd></div>
            <div><dt>{{ copy.venue }}</dt><dd :class="{ missing: !selectedCounterparty?.name && !selectedBooking.venue_name }">{{ selectedCounterparty?.name || selectedBooking.venue_name || copy.noVenue }}</dd></div>
            <div><dt>{{ copy.contact }}</dt><dd :class="{ missing: !loadingMeta && !selectedContact?.name }">{{ loadingMeta ? '…' : selectedContact?.name || copy.noContact }}</dd></div>
            <div><dt>{{ copy.offer }}</dt><dd :class="{ missing: selectedBooking.offer_amount_minor == null }">{{ formatMoney(selectedBooking) }}</dd></div>
          </dl>
        </section>

        <section class="core-inbox__conversation">
          <div class="core-inbox__conversation-heading">
            <div>
              <span>{{ copy.activity }}</span>
              <small>{{ locale === 'es' ? 'Mensajes, llamadas y notas en orden cronológico.' : 'Messages, calls and notes in chronological order.' }}</small>
            </div>
          </div>

          <div class="core-inbox__thread">
            <p v-if="loadingActivity" class="core-inbox__empty">…</p>
            <p v-else-if="!conversationActivities.length" class="core-inbox__empty">{{ copy.noActivity }}</p>
            <article
              v-for="activity in conversationActivities"
              v-else
              :key="activity.id"
              :class="['thread-item', `thread-item--${activity.direction || 'internal'}`]"
            >
              <div class="thread-item__meta">
                <strong>{{ activity.type.replaceAll('_', ' ') }}</strong>
                <span>{{ activity.direction === 'inbound' ? (locale === 'es' ? 'Recibido' : 'Received') : activity.direction === 'outbound' ? (locale === 'es' ? 'Enviado' : 'Sent') : (locale === 'es' ? 'Nota interna' : 'Internal note') }}</span>
                <time>{{ formatTime(activity.occurred_at) }}</time>
              </div>
              <p>{{ activity.body }}</p>
            </article>
          </div>

          <BookingActivityComposer
            id="core-inbox-activity-composer"
            v-if="!selectedBooking.archived_at"
            :workspace-id="workspaceId"
            :booking="selectedBooking"
            :locale="locale"
            @created="handleActivityCreated"
          />
        </section>

        <BookingRelationshipMemory
          :booking="selectedBooking"
          :bookings="bookings"
          :contact-name="selectedContact?.name"
          :counterparty-name="selectedCounterparty?.name"
          :locale="locale"
        />

        <p v-if="selectedBooking.archived_at" class="core-inbox__readonly">{{ copy.archivedReadOnly }}</p>

        <BookingCoreConflictNotice
          v-if="!selectedBooking.archived_at"
          :workspace-id="workspaceId"
          :booking="selectedBooking"
          :bookings="bookings"
          :locale="locale"
          :refresh-key="activities.length"
        />

        <BookingCoreOperations
          id="core-inbox-operations"
          v-if="!selectedBooking.archived_at"
          :workspace-id="workspaceId"
          :booking="selectedBooking"
          :locale="locale"
          @changed="handleOperationsChanged"
        />


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
.core-inbox__zero { display:grid; justify-items:start; gap:8px; padding:24px 18px 28px; }
.core-inbox__zero > span { color:var(--cue-accent); font:700 9px monospace; text-transform:uppercase; }
.core-inbox__zero > strong { max-width:560px; font-size:clamp(20px,3vw,30px); line-height:1.05; }
.core-inbox__zero > p { max-width:600px; margin:0; color:var(--cue-muted); font-size:12px; line-height:1.5; }
.core-inbox__zero > button { margin-top:5px; min-height:40px; padding:0 15px; border:1px solid var(--cue-accent); background:var(--cue-accent); color:#090909; cursor:pointer; font-weight:800; }
.core-inbox__tools { display:grid; gap:8px; padding:10px; border-bottom:1px solid var(--cue-border); }
.core-inbox__tools > input { min-height:36px; border:1px solid var(--cue-border); background:var(--cue-raised); color:var(--cue-text); padding:0 10px; }
.core-inbox__filters { display:flex; gap:4px; overflow-x:auto; scrollbar-width:thin; }
.core-inbox__filters button { flex:0 0 auto; min-height:29px; padding:0 8px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; text-transform:uppercase; }
.core-inbox__filters button.active { border-color:var(--cue-accent); color:var(--cue-accent); }
.core-inbox__filters--archive button.active { background:var(--cue-raised); }
.status-filter { border-color:color-mix(in srgb,var(--status-color,var(--cue-border)) 72%,var(--cue-border)) !important; color:var(--status-color,var(--cue-muted)) !important; }
.status-filter.active { background:color-mix(in srgb, var(--status-color, var(--cue-accent)) 10%, transparent); box-shadow:inset 0 0 0 1px var(--status-color,var(--cue-accent)); }
.status-filter--all { --status-color:var(--cue-text); }
.status-filter--new, .booking-status--new, .core-inbox__status--new { --status-color:#ceff54; }
.status-filter--in_conversation, .booking-status--in_conversation, .core-inbox__status--in_conversation { --status-color:#73b7ff; }
.status-filter--waiting_response, .booking-status--waiting_response, .core-inbox__status--waiting_response { --status-color:#ffbf5f; }
.status-filter--confirmed, .booking-status--confirmed, .core-inbox__status--confirmed { --status-color:#55d98d; }
.status-filter--rejected, .booking-status--rejected, .core-inbox__status--rejected { --status-color:#ff6f7d; }
.status-filter--cancelled, .booking-status--cancelled, .core-inbox__status--cancelled { --status-color:#8e8e8e; }
.core-inbox__layout { display:grid; grid-template-columns:minmax(260px,.75fr) minmax(0,1.65fr); }
.core-inbox__list { border-right:1px solid var(--cue-border); }
.core-inbox__list button { display:grid; grid-template-columns:82px minmax(0,1fr) auto; align-items:center; gap:12px; width:100%; min-height:72px; padding:12px 14px; border:0; border-bottom:1px solid var(--cue-border); background:transparent; color:var(--cue-text); text-align:left; cursor:pointer; }
.core-inbox__list button.active { background:var(--cue-raised); }
.core-inbox__list time { color:var(--cue-muted); font:700 10px monospace; }
.core-inbox__list span strong, .core-inbox__list span small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.core-inbox__list span small { margin-top:4px; color:var(--cue-muted); font-size:11px; }
.core-inbox__list em { font:700 9px monospace; color:var(--status-color,var(--cue-accent)); text-transform:uppercase; font-style:normal; }
.core-inbox__detail { min-width:0; padding:18px; }
.core-inbox__detail > header { display:flex; justify-content:space-between; gap:18px; padding-bottom:18px; border-bottom:1px solid var(--cue-border); }
.core-inbox__detail > header span { color:var(--cue-accent); font:700 9px monospace; text-transform:uppercase; letter-spacing:.1em; }
.core-inbox__detail h3 { margin:6px 0 3px; font-size:28px; line-height:1; }
.core-inbox__detail header p { margin:0; color:var(--cue-muted); font-size:12px; }
.core-inbox__header-actions { display:flex; align-items:flex-start; gap:7px; flex-wrap:wrap; justify-content:flex-end; }
.core-inbox__archive { min-height:34px; padding:0 10px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; text-transform:uppercase; }
.core-inbox__archive:hover { border-color:var(--cue-accent); color:var(--cue-text); }
.core-inbox__decision-block { display:grid; gap:7px; min-width:210px; }
.core-inbox__status { display:grid; gap:4px; align-self:flex-start; padding:9px 10px; border:1px solid color-mix(in srgb,var(--status-color,var(--cue-border)) 70%,var(--cue-border)); background:color-mix(in srgb,var(--status-color,var(--cue-accent)) 5%,transparent); }
.core-inbox__status > span { color:var(--status-color,var(--cue-muted)); font:700 7px monospace; letter-spacing:.08em; text-transform:uppercase; }
.core-inbox__status > strong { color:var(--cue-text); font:800 10px monospace; text-transform:uppercase; }
.core-inbox__status > small { max-width:220px; color:var(--cue-muted); font-size:9px; line-height:1.35; }
.core-inbox__decisions { display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; }
.core-inbox__decisions button { min-height:31px; padding:0 7px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 7px monospace; text-transform:uppercase; }
.core-inbox__decisions button:disabled { opacity:.45; cursor:wait; }
.core-inbox__decisions .decision-confirm { border-color:#55d98d; color:#55d98d; }
.core-inbox__decisions .decision-reject { border-color:#ff6f7d; color:#ff6f7d; }
.core-inbox__decisions .decision-cancel { border-color:#666; color:#aaa; }
.core-inbox__readonly { margin:12px 0; padding:10px 12px; border-left:2px solid var(--cue-muted); background:var(--cue-raised); color:var(--cue-muted); font-size:11px; }
.core-inbox__details-block { border-bottom:1px solid var(--cue-border); }
.core-inbox__details-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 0 8px; }
.core-inbox__details-heading > strong { font:800 10px monospace; text-transform:uppercase; letter-spacing:.08em; }
.core-inbox__facts { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); margin:0; }
.core-inbox__facts > div { min-width:0; padding:14px 12px 14px 0; }
.core-inbox__facts dt { color:var(--cue-muted); font:700 9px monospace; text-transform:uppercase; }
.core-inbox__facts dd { margin:5px 0 0; overflow:hidden; text-overflow:ellipsis; font-size:12px; }
.core-inbox__facts dd.missing { color:var(--cue-accent); font-style:italic; }
.core-inbox__conversation { margin-top:16px; border:1px solid var(--cue-border); background:color-mix(in srgb,var(--cue-raised) 45%,transparent); }
.core-inbox__conversation-heading { padding:12px 14px; border-bottom:1px solid var(--cue-border); }
.core-inbox__conversation-heading span { display:block; font:800 11px monospace; text-transform:uppercase; letter-spacing:.08em; }
.core-inbox__conversation-heading small { display:block; margin-top:4px; color:var(--cue-muted); font-size:9px; }
.core-inbox__thread { padding:10px 12px 2px; }
.thread-item { width:min(86%,680px); margin:0 0 9px; padding:10px 11px; border:1px solid var(--cue-border); background:var(--cue-surface); }
.thread-item--outbound { margin-left:auto; border-color:color-mix(in srgb,#73b7ff 55%,var(--cue-border)); }
.thread-item--inbound { margin-right:auto; border-color:color-mix(in srgb,var(--cue-accent) 55%,var(--cue-border)); }
.thread-item--internal { margin-right:auto; border-style:dashed; color:var(--cue-muted); }
.thread-item__meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.thread-item__meta strong { color:var(--cue-text); font:800 9px monospace; text-transform:uppercase; }
.thread-item__meta span { color:var(--cue-muted); font:700 8px monospace; text-transform:uppercase; }
.thread-item__meta time { margin-left:auto; color:var(--cue-muted); font:8px monospace; }
.thread-item > p { margin:7px 0 0; font-size:12px; line-height:1.45; }
.core-inbox__empty { margin:0; padding:18px; color:var(--cue-muted); font-size:12px; }
@media (max-width: 760px) {
  .core-inbox__layout { grid-template-columns:1fr; }
  .core-inbox__list { border-right:0; border-bottom:1px solid var(--cue-border); max-height:260px; overflow:auto; }
  .core-inbox__list button { grid-template-columns:70px minmax(0,1fr); min-height:62px; }
  .core-inbox__list em { grid-column:2; margin-top:-4px; }
  .core-inbox__detail { padding:14px; }
  .core-inbox__detail h3 { font-size:22px; }
  .core-inbox__facts { grid-template-columns:1fr 1fr; }
  .core-inbox__filters:not(.core-inbox__filters--archive) { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); overflow:visible; }
  .core-inbox__filters:not(.core-inbox__filters--archive) button { width:100%; min-height:36px; white-space:normal; }
  .core-inbox__detail > header { flex-direction:column; gap:12px; }
  .core-inbox__header-actions { display:grid; grid-template-columns:1fr; width:100%; min-width:0; justify-content:stretch; }
  .core-inbox__archive { justify-self:start; }
  .core-inbox__decision-block { width:100%; min-width:0; }
  .core-inbox__status { min-width:0; }
  .core-inbox__decisions { grid-template-columns:repeat(3,minmax(0,1fr)); min-width:0; }
  .core-inbox__decisions button { min-width:0; padding-inline:4px; }
  .core-inbox__details-heading { align-items:center; }
  .core-inbox__facts { grid-template-columns:1fr 1fr; }
  .thread-item { width:auto; max-width:92%; }
}
</style>
