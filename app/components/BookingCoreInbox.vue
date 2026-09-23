<script setup lang="ts">
import type { Activity, Contact, CoreBooking, Counterparty, CoreBookingStatus } from '../domain/bookingCore'
import type { BookingEmailMessage } from '../services/bookingCoreApi'
import { buildFollowUpDraft, shouldSuggestFollowUp } from '../services/followUpDraft'
import { buildFailedEmailRetryDraft } from '../services/emailRetryDraft'

const props = defineProps<{
  workspaceId: string
  bookings: CoreBooking[]
  locale: 'es' | 'en'
  focusBookingId?: string
}>()

const emit = defineEmits<{ operationsChanged: []; cueRequested: []; bookingOpened: [bookingId: string] }>()
const bookingCore = useBookingCore()
const selectedBookingId = ref('')
const contacts = ref<Contact[]>([])
const counterparties = ref<Counterparty[]>([])
const activities = ref<Activity[]>([])
const emailMessages = ref<BookingEmailMessage[]>([])
const conversationThread = ref<HTMLElement | null>(null)
const loadingMeta = ref(false)
const loadingActivity = ref(false)
const updatingStatus = ref(false)
const pendingDecision = ref<Extract<CoreBookingStatus, 'confirmed' | 'rejected' | 'cancelled'> | null>(null)
const decisionError = ref('')
const archiving = ref(false)
const archiveView = ref<'active' | 'archived'>('active')
const realSearch = ref('')
const realStatusFilter = ref<'all' | CoreBookingStatus>('all')
const visibleLimit = ref(10)

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'BOOKINGS / REALES',
  title: 'Bookings capturados',
  empty: 'Todavía no hay bookings reales.', emptyTitle: 'Tu primer booking empieza con un CUE.', emptyBody: 'Si te llaman, te escriben o aparece una oportunidad, guárdala en segundos. No necesitas tener todos los datos.', emptyAction: '+ CUE',
  date: 'Fecha', venue: 'Sala / entidad', contact: 'Contacto', offer: 'Oferta', source: 'Origen', status: 'Estado', activity: 'Conversación', details: 'Datos del booking',
  noActivity: 'Todavía no hay conversación. Registra una nota, llamada, WhatsApp, Instagram o email para empezar el hilo.',
  confirm: 'Confirmar', reject: 'Rechazar', cancel: 'Cancelar',
  confirmQuestion: '¿Confirmar este booking?', rejectQuestion: '¿Rechazar este booking?', cancelQuestion: '¿Cancelar este booking?',
  automaticState: 'Estado automático según la última interacción.',
  noDate: 'Sin fecha', noVenue: 'Sin sala definida', noContact: 'Sin contacto', noOffer: 'Sin oferta',
  active: 'En curso', archived: 'Archivados', archive: 'Archivar', restore: 'Restaurar', archiveHint: 'En curso es tu trabajo vivo. Archivados conserva bookings fuera de la operativa diaria.', archivedReadOnly: 'Booking archivado. La traza se conserva en modo lectura.'
} : {
  eyebrow: 'BOOKINGS / REAL',
  title: 'Captured bookings',
  empty: 'No real bookings yet.', emptyTitle: 'Your first booking starts with a CUE.', emptyBody: 'If someone calls, messages you or an opportunity appears, save it in seconds. You do not need every detail yet.', emptyAction: '+ CUE',
  date: 'Date', venue: 'Venue / entity', contact: 'Contact', offer: 'Offer', source: 'Source', status: 'Status', activity: 'Conversation', details: 'Booking details',
  noActivity: 'No conversation yet. Add a note, call, WhatsApp, Instagram or email to start the thread.',
  confirm: 'Confirm', reject: 'Reject', cancel: 'Cancel',
  confirmQuestion: 'Confirm this booking?', rejectQuestion: 'Reject this booking?', cancelQuestion: 'Cancel this booking?',
  automaticState: 'Automatic state based on the latest interaction.',
  noDate: 'No date', noVenue: 'No venue defined', noContact: 'No contact', noOffer: 'No offer',
  active: 'In progress', archived: 'Archived', archive: 'Archive', restore: 'Restore', archiveHint: 'In progress is your live work. Archived keeps bookings outside day-to-day operations.', archivedReadOnly: 'Archived booking. Its trace is preserved in read-only mode.'
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
const pagedBookings = computed(() => visibleBookings.value.slice(0, visibleLimit.value))
const hasMoreBookings = computed(() => visibleLimit.value < visibleBookings.value.length)
const selectedBooking = computed(() => visibleBookings.value.find(item => item.id === selectedBookingId.value) || visibleBookings.value[0] || null)
const selectedContact = computed(() => selectedBooking.value?.primary_contact_id ? contacts.value.find(item => item.id === selectedBooking.value?.primary_contact_id) || null : null)
const selectedCounterparty = computed(() => selectedBooking.value?.counterparty_id ? counterparties.value.find(item => item.id === selectedBooking.value?.counterparty_id) || null : null)
const suggestedRetryEmail = computed(() => {
  if (!selectedContact.value?.email) return null
  return buildFailedEmailRetryDraft(activities.value, emailMessages.value, selectedContact.value.email)
})

const suggestedFollowUp = computed(() => {
  const booking = selectedBooking.value
  const contact = selectedContact.value
  if (!booking || !contact?.email || suggestedRetryEmail.value || !shouldSuggestFollowUp(booking, activities.value)) return null
  return buildFollowUpDraft(booking, contact, activities.value, props.locale)
})

const conversationActivities = computed(() => activities.value.filter(activity =>
  Boolean(activity.body?.trim())
  && !['status_change', 'system', 'hold_converted', 'hold_released'].includes(activity.type)
))

watch(() => props.bookings, value => {
  if (!value.length) selectedBookingId.value = ''
  else if (!value.some(item => item.id === selectedBookingId.value)) selectedBookingId.value = value[0].id
}, { immediate: true, deep: true })

watch([realSearch, realStatusFilter, archiveView], () => {
  visibleLimit.value = 10
})

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

function threadIsNearBottom() {
  const element = conversationThread.value
  if (!element) return true
  return element.scrollHeight - element.scrollTop - element.clientHeight < 72
}

async function scrollThreadToLatest() {
  await nextTick()
  const element = conversationThread.value
  if (element) element.scrollTop = element.scrollHeight
}

async function loadActivity(options: { silent?: boolean } = {}) {
  const bookingId = selectedBooking.value?.id
  const keepPinnedToLatest = !options.silent || threadIsNearBottom()
  if (!options.silent) {
    activities.value = []
    emailMessages.value = []
  }
  if (!bookingId || !props.workspaceId) return
  if (!options.silent) loadingActivity.value = true
  try {
    const [activityRows, emailRows] = await Promise.all([
      bookingCore.listActivities(props.workspaceId, bookingId),
      bookingCore.listBookingEmailMessages(props.workspaceId, bookingId)
    ])
    if (selectedBooking.value?.id !== bookingId) return
    activities.value = activityRows
    emailMessages.value = emailRows
    if (keepPinnedToLatest) await scrollThreadToLatest()
  } finally {
    if (!options.silent) loadingActivity.value = false
  }
}

function activityContactName(activity: Activity) {
  if (activity.contact_id) {
    const contact = contacts.value.find(item => item.id === activity.contact_id)
    if (contact?.name) return contact.name
  }
  return selectedContact.value?.name || (props.locale === 'es' ? 'Contacto' : 'Contact')
}

function activityTypeLabel(activity: Activity) {
  const labels = props.locale === 'es'
    ? { email:'Email', phone:'Llamada', whatsapp:'WhatsApp', instagram:'Instagram', note:'Nota' }
    : { email:'Email', phone:'Call', whatsapp:'WhatsApp', instagram:'Instagram', note:'Note' }
  return labels[activity.type as keyof typeof labels] || activity.type.replaceAll('_', ' ')
}

function emailDeliveryLabel(activity: Activity) {
  if (activity.type !== 'email' || activity.direction !== 'outbound') return ''
  const emailId = typeof activity.metadata?.email_message_id === 'string' ? activity.metadata.email_message_id : ''
  if (!emailId) return ''
  const message = emailMessages.value.find(item => item.id === emailId)
  if (!message) return ''
  const status = message.delivery_status
  if (!status) return props.locale === 'es' ? 'Enviado' : 'Sent'
  const labels: Record<string, string> = props.locale === 'es'
    ? { accepted:'Aceptado', delivered:'Entregado', deferred:'En espera', soft_bounce:'Rebote temporal', hard_bounce:'Rebotado', blocked:'Bloqueado', spam:'Spam', invalid:'Email inválido', error:'Error de entrega' }
    : { accepted:'Accepted', delivered:'Delivered', deferred:'Deferred', soft_bounce:'Soft bounce', hard_bounce:'Bounced', blocked:'Blocked', spam:'Spam', invalid:'Invalid email', error:'Delivery error' }
  return labels[status] || status
}

watch(() => selectedBooking.value?.id, () => loadActivity(), { immediate: true })

let activityPollTimer: ReturnType<typeof setInterval> | null = null

function refreshExternalActivity() {
  if (!import.meta.client || document.visibilityState !== 'visible') return
  void loadActivity({ silent: true })
}

onMounted(() => {
  activityPollTimer = setInterval(refreshExternalActivity, 10_000)
  window.addEventListener('focus', refreshExternalActivity)
  document.addEventListener('visibilitychange', refreshExternalActivity)
})

onBeforeUnmount(() => {
  if (activityPollTimer) clearInterval(activityPollTimer)
  window.removeEventListener('focus', refreshExternalActivity)
  document.removeEventListener('visibilitychange', refreshExternalActivity)
})

async function handleOperationsChanged() {
  await loadActivity()
  emit('operationsChanged')
}

async function handleBookingSaved() {
  await loadActivity()
  emit('operationsChanged')
}

function handleContactSaved(updated: Contact) {
  const index = contacts.value.findIndex(item => item.id === updated.id)
  if (index >= 0) contacts.value.splice(index, 1, updated)
  else contacts.value.push(updated)
}

async function handleActivityCreated() {
  await loadActivity()
}

function decideStatus(status: Extract<CoreBookingStatus, 'confirmed' | 'rejected' | 'cancelled'>) {
  if (!selectedBooking.value || selectedBooking.value.status === status) return
  decisionError.value = ''
  pendingDecision.value = status
}

function closeDecisionModal() {
  if (updatingStatus.value) return
  pendingDecision.value = null
  decisionError.value = ''
}

async function confirmDecision() {
  const status = pendingDecision.value
  const booking = selectedBooking.value
  if (!status || !booking) return

  if (status === 'confirmed' && !booking.event_date) {
    decisionError.value = props.locale === 'es'
      ? 'Antes de confirmar necesitas añadir una fecha al booking.'
      : 'Add a booking date before confirming.'
    return
  }

  updatingStatus.value = true
  decisionError.value = ''
  try {
    await bookingCore.setBookingStatus(props.workspaceId, booking.id, status)
    pendingDecision.value = null
    await loadActivity()
    emit('operationsChanged')
  } catch (error: any) {
    const code = error?.data?.message || error?.data?.error || error?.message || ''
    decisionError.value = code === 'confirmed_booking_requires_date'
      ? (props.locale === 'es' ? 'Antes de confirmar necesitas añadir una fecha al booking.' : 'Add a booking date before confirming.')
      : (props.locale === 'es' ? 'No he podido actualizar el estado. Revisa los datos del booking e inténtalo de nuevo.' : 'I could not update the status. Review the booking details and try again.')
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
  detail.focus({ preventScroll: true })
}

async function selectBooking(bookingId: string) {
  selectedBookingId.value = bookingId
  emit('bookingOpened', bookingId)
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
      <input
        v-model="realSearch"
        class="core-inbox__search"
        type="search"
        :placeholder="locale === 'es' ? 'Buscar booking, sala, contacto…' : 'Search booking, venue, contact…'"
      >
      <div class="core-inbox__filters core-inbox__filters--archive" :title="copy.archiveHint">
        <button type="button" :class="{ active: archiveView === 'active' }" @click="archiveView = 'active'">{{ copy.active }} · {{ bookings.filter(item => !item.archived_at).length }}</button>
        <button type="button" :class="{ active: archiveView === 'archived' }" @click="archiveView = 'archived'">{{ copy.archived }} · {{ bookings.filter(item => !!item.archived_at).length }}</button>
      </div>
      <div class="core-inbox__filters core-inbox__filters--status">
        <button type="button" :class="['status-filter', 'status-filter--all', { active: realStatusFilter === 'all' }]" @click="realStatusFilter = 'all'">{{ locale === 'es' ? 'Todos' : 'All' }} · {{ visibleBookings.length }}</button>
        <button v-for="(label, status) in statusLabels" :key="status" type="button" :class="['status-filter', `status-filter--${status}`, { active: realStatusFilter === status }]" @click="realStatusFilter = status">{{ label }} · {{ bookings.filter(item => item.status === status).length }}</button>
      </div>
    </div>

    <p v-if="bookings.length && !visibleBookings.length" class="core-inbox__empty">{{ locale === 'es' ? 'No hay bookings con estos filtros.' : 'No bookings match these filters.' }}</p>

    <div v-else-if="bookings.length" class="core-inbox__layout">
      <div id="core-inbox-list" class="core-inbox__list">
        <button
          v-for="booking in pagedBookings"
          :key="booking.id"
          type="button"
          :class="['core-inbox__booking-row', `core-inbox__booking-row--${booking.status}`, { active: selectedBooking?.id === booking.id }]"
          @click="selectBooking(booking.id)"
        >
          <time>{{ formatDate(booking.event_date) }}</time>
          <span><strong>{{ bookingTitle(booking) }}</strong><small>{{ booking.event_name || sourceLabels[booking.source] || booking.source }}</small></span>
          <em :class="`booking-status booking-status--${booking.status}`">{{ statusLabels[booking.status] }}</em>
        </button>
        <div v-if="hasMoreBookings" class="core-inbox__load-more">
          <button type="button" @click="visibleLimit += 10">
            {{ locale === 'es' ? `Cargar 10 más · ${visibleBookings.length - pagedBookings.length} restantes` : `Load 10 more · ${visibleBookings.length - pagedBookings.length} remaining` }}
          </button>
        </div>
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
            <div class="core-inbox__contact-fact">
              <dt>{{ copy.contact }}</dt>
              <dd :class="{ missing: !loadingMeta && !selectedContact?.name }">{{ loadingMeta ? '…' : selectedContact?.name || copy.noContact }}</dd>
              <small v-if="selectedContact?.email">{{ selectedContact.email }}</small>
              <small v-if="selectedContact?.phone">{{ selectedContact.phone }}</small>
              <BookingContactEditor
                v-if="selectedContact && !selectedBooking.archived_at"
                :workspace-id="workspaceId"
                :contact="selectedContact"
                :locale="locale"
                @saved="handleContactSaved"
              />
            </div>
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

          <div ref="conversationThread" class="core-inbox__thread">
            <p v-if="loadingActivity" class="core-inbox__empty">…</p>
            <p v-else-if="!conversationActivities.length" class="core-inbox__empty">{{ copy.noActivity }}</p>
            <article
              v-for="activity in conversationActivities"
              v-else
              :key="activity.id"
              :class="['thread-item', `thread-item--${activity.direction || 'internal'}`]"
            >
              <div class="thread-item__meta">
                <strong>{{ activityTypeLabel(activity) }}</strong>
                <span>
                  {{ activity.direction === 'inbound'
                    ? (activityContactName(activity) + ' → ' + (locale === 'es' ? 'Tú' : 'You'))
                    : activity.direction === 'outbound'
                      ? ((locale === 'es' ? 'Tú' : 'You') + ' → ' + activityContactName(activity))
                      : (locale === 'es' ? 'Nota interna' : 'Internal note') }}
                </span>
                <em v-if="emailDeliveryLabel(activity)" class="thread-item__delivery">{{ emailDeliveryLabel(activity) }}</em>
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
            :suggested-follow-up="suggestedFollowUp"
            :suggested-retry-email="suggestedRetryEmail"
            @created="handleActivityCreated"
          />
        </section>

        <BookingCoreOperations
          id="core-inbox-operations"
          v-if="!selectedBooking.archived_at"
          :workspace-id="workspaceId"
          :booking="selectedBooking"
          :locale="locale"
          @changed="handleOperationsChanged"
        />

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


      </article>
    </div>
  </section>

  <div v-if="pendingDecision" class="core-decision-modal" @click.self="closeDecisionModal">
    <article role="dialog" aria-modal="true" aria-labelledby="core-decision-title">
      <span>{{ locale === 'es' ? 'DECISIÓN DE BOOKING' : 'BOOKING DECISION' }}</span>
      <h3 id="core-decision-title">
        {{ pendingDecision === 'confirmed'
          ? (locale === 'es' ? '¿Confirmar este booking?' : 'Confirm this booking?')
          : pendingDecision === 'rejected'
            ? (locale === 'es' ? '¿Rechazar este booking?' : 'Reject this booking?')
            : (locale === 'es' ? '¿Cancelar este booking?' : 'Cancel this booking?') }}
      </h3>
      <p v-if="pendingDecision === 'confirmed'">
        {{ selectedBooking?.event_date
          ? (locale === 'es' ? 'La fecha quedará confirmada y aparecerá en Calendario. Si existe un hold de esta fecha, se convertirá automáticamente.' : 'The date will be confirmed and shown in Calendar. A matching hold will be converted automatically.')
          : (locale === 'es' ? 'Este booking todavía no tiene fecha. Añádela en “Datos del booking” antes de confirmarlo.' : 'This booking does not have a date yet. Add one under “Booking details” before confirming.') }}
      </p>
      <p v-else>{{ locale === 'es' ? 'La decisión quedará registrada en la actividad del booking.' : 'The decision will be recorded in booking activity.' }}</p>
      <p v-if="decisionError" class="core-decision-modal__error">{{ decisionError }}</p>
      <div>
        <button type="button" class="core-decision-modal__secondary" :disabled="updatingStatus" @click="closeDecisionModal">{{ locale === 'es' ? 'Volver' : 'Back' }}</button>
        <button
          type="button"
          class="core-decision-modal__primary"
          :class="{ danger: pendingDecision !== 'confirmed' }"
          :disabled="updatingStatus || (pendingDecision === 'confirmed' && !selectedBooking?.event_date)"
          @click="confirmDecision"
        >
          {{ updatingStatus
            ? (locale === 'es' ? 'Guardando…' : 'Saving…')
            : pendingDecision === 'confirmed'
              ? (locale === 'es' ? 'Confirmar booking' : 'Confirm booking')
              : pendingDecision === 'rejected'
                ? (locale === 'es' ? 'Rechazar booking' : 'Reject booking')
                : (locale === 'es' ? 'Cancelar booking' : 'Cancel booking') }}
        </button>
      </div>
    </article>
  </div>
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
.core-inbox__tools { display:grid; grid-template-columns:minmax(260px,1.2fr) auto minmax(0,2fr); align-items:center; gap:10px; padding:10px 12px; border-bottom:1px solid var(--cue-border); }
.core-inbox__search { min-width:0; min-height:36px; border:1px solid var(--cue-border); background:var(--cue-raised); color:var(--cue-text); padding:0 10px; }
.core-inbox__filters { display:flex; align-items:center; gap:6px; min-width:0; overflow-x:auto; scrollbar-width:thin; }
.core-inbox__filters button { flex:0 0 auto; min-height:32px; padding:0 10px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; text-transform:uppercase; white-space:nowrap; }
.core-inbox__filters button.active { border-color:var(--cue-accent); color:var(--cue-accent); }
.core-inbox__filters--archive button.active { background:var(--cue-raised); }
.status-filter { border-color:var(--cue-border) !important; color:var(--cue-muted) !important; background:transparent; }
.status-filter:hover { border-color:color-mix(in srgb,var(--cue-text) 45%,var(--cue-border)) !important; color:var(--cue-text) !important; }
.status-filter.active { border-color:color-mix(in srgb,var(--cue-text) 60%,var(--cue-border)) !important; color:var(--cue-text) !important; background:var(--cue-raised); box-shadow:none; }
.status-filter--all { --status-color:var(--cue-text); }
.status-filter--new, .booking-status--new, .core-inbox__status--new { --status-color:#ceff54; }
.status-filter--in_conversation, .booking-status--in_conversation, .core-inbox__status--in_conversation { --status-color:#73b7ff; }
.status-filter--waiting_response, .booking-status--waiting_response, .core-inbox__status--waiting_response { --status-color:#ffbf5f; }
.status-filter--confirmed, .booking-status--confirmed, .core-inbox__status--confirmed { --status-color:#55d98d; }
.status-filter--rejected, .booking-status--rejected, .core-inbox__status--rejected { --status-color:#ff6f7d; }
.status-filter--cancelled, .booking-status--cancelled, .core-inbox__status--cancelled { --status-color:#8e8e8e; }
.core-inbox__layout { display:grid; grid-template-columns:minmax(250px,.66fr) minmax(0,1.74fr); }
.core-inbox__list { border-right:1px solid var(--cue-border); }
.core-inbox__list button { display:grid; grid-template-columns:82px minmax(0,1fr) auto; align-items:center; gap:12px; width:100%; min-height:72px; padding:12px 14px; border:0; border-bottom:1px solid var(--cue-border); background:transparent; color:var(--cue-text); text-align:left; cursor:pointer; }
.core-inbox__booking-row { position:relative; }
.core-inbox__booking-row:before { position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--row-status,var(--cue-border)); content:""; opacity:.82; }
.core-inbox__booking-row--new { --row-status:#ceff54; }
.core-inbox__booking-row--in_conversation { --row-status:#73b7ff; }
.core-inbox__booking-row--waiting_response { --row-status:#ffbf5f; }
.core-inbox__booking-row--confirmed { --row-status:#55d98d; }
.core-inbox__booking-row--rejected { --row-status:#ff6f7d; }
.core-inbox__booking-row--cancelled { --row-status:#777; }
.core-inbox__list button.active { background:var(--cue-raised); }
.core-inbox__list button.active:before { width:5px; opacity:1; }
.core-inbox__load-more { padding:10px; border-top:1px solid var(--cue-border); }
.core-inbox__load-more > button { display:block; width:100%; min-height:38px; padding:0 12px; border:1px solid var(--cue-border); background:var(--cue-raised); color:var(--cue-text); cursor:pointer; font:800 8px monospace; text-transform:uppercase; }
.core-inbox__load-more > button:hover { border-color:var(--cue-accent); color:var(--cue-accent); }
.core-inbox__list time { color:var(--cue-muted); font:700 10px monospace; }
.core-inbox__list span strong, .core-inbox__list span small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.core-inbox__list span small { margin-top:4px; color:var(--cue-muted); font-size:11px; }
.core-inbox__list em { font:700 8px monospace; color:var(--cue-muted); text-transform:uppercase; font-style:normal; }
.core-inbox__detail { min-width:0; padding:22px 24px 26px; }
.core-inbox__detail > header { display:flex; justify-content:space-between; gap:18px; padding-bottom:18px; border-bottom:1px solid var(--cue-border); }
.core-inbox__detail > header span { color:var(--cue-accent); font:700 9px monospace; text-transform:uppercase; letter-spacing:.1em; }
.core-inbox__detail h3 { margin:6px 0 3px; font-size:28px; line-height:1; }
.core-inbox__detail header p { margin:0; color:var(--cue-muted); font-size:12px; }
.core-inbox__header-actions { display:flex; align-items:flex-start; gap:7px; flex-wrap:wrap; justify-content:flex-end; }
.core-inbox__archive { min-height:34px; padding:0 10px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; text-transform:uppercase; }
.core-inbox__archive:hover { border-color:var(--cue-accent); color:var(--cue-text); }
.core-inbox__decision-block { display:grid; gap:7px; min-width:210px; }
.core-inbox__status { display:grid; gap:3px; align-self:flex-start; padding:2px 0 2px 9px; border:0; border-left:2px solid var(--status-color,var(--cue-border)); background:transparent; }
.core-inbox__status > span { color:var(--cue-muted); font:700 7px monospace; letter-spacing:.08em; text-transform:uppercase; }
.core-inbox__status > strong { color:var(--cue-text); font:800 10px monospace; text-transform:uppercase; }
.core-inbox__status > small { max-width:220px; color:var(--cue-muted); font-size:9px; line-height:1.35; }
.core-inbox__decisions { display:grid; grid-template-columns:1fr 1fr 1fr; gap:4px; }
.core-inbox__decisions button { min-height:31px; padding:0 7px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 7px monospace; text-transform:uppercase; }
.core-inbox__decisions button:disabled { opacity:.45; cursor:wait; }
.core-inbox__decisions .decision-confirm { border-color:#55d98d; color:#55d98d; }
.core-inbox__decisions .decision-reject { border-color:#ff6f7d; color:#ff6f7d; }
.core-inbox__decisions .decision-cancel { border-color:#666; color:#aaa; }
.core-inbox__readonly { margin:12px 0; padding:10px 12px; border-left:2px solid var(--cue-muted); background:var(--cue-raised); color:var(--cue-muted); font-size:11px; }
.core-inbox__details-block { border-bottom:0; }
.core-inbox__details-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:15px 0 7px; }
.core-inbox__details-heading > strong { color:var(--cue-muted); font:800 9px monospace; text-transform:uppercase; letter-spacing:.08em; }
.core-inbox__facts { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); margin:0; padding:0 0 12px; border-bottom:1px solid var(--cue-border); }
.core-inbox__facts > div { min-width:0; padding:9px 12px 9px 0; }
.core-inbox__facts dt { color:var(--cue-muted); font:700 9px monospace; text-transform:uppercase; }
.core-inbox__facts dd { margin:5px 0 0; overflow:hidden; text-overflow:ellipsis; font-size:12px; }
.core-inbox__facts dd.missing { color:var(--cue-accent); font-style:italic; }
.core-inbox__contact-fact small { display:block; margin-top:3px; color:var(--cue-muted); font-size:9px; line-height:1.3; }
.core-inbox__conversation { margin-top:16px; padding-top:2px; border-top:0; border-bottom:1px solid var(--cue-border); background:transparent; }
.core-inbox__conversation-heading { padding:10px 2px 12px; border-bottom:0; }
.core-inbox__conversation-heading span { display:block; font:800 12px monospace; text-transform:uppercase; letter-spacing:.08em; }
.core-inbox__conversation-heading small { display:block; margin-top:4px; color:var(--cue-muted); font-size:9px; }
.core-inbox__thread { min-height:180px; max-height:clamp(340px,50vh,560px); overflow-y:auto; overscroll-behavior:contain; scrollbar-gutter:stable; scrollbar-width:thin; padding:7px 2px 10px; }
.thread-item { width:min(82%,720px); margin:0 0 10px; padding:12px 14px; border:0; border-left:2px solid var(--cue-border); border-radius:0 8px 8px 0; background:color-mix(in srgb,var(--cue-raised) 58%,transparent); }
.thread-item--outbound { margin-left:auto; border-left:0; border-right:2px solid color-mix(in srgb,#73b7ff 58%,var(--cue-border)); border-radius:8px 0 0 8px; background:color-mix(in srgb,#73b7ff 4%,var(--cue-raised)); }
.thread-item--inbound { margin-right:auto; border-left-color:color-mix(in srgb,var(--cue-accent) 62%,var(--cue-border)); background:color-mix(in srgb,var(--cue-accent) 3%,var(--cue-raised)); }
.thread-item--internal { margin-right:auto; border-left-style:dashed; color:var(--cue-muted); background:transparent; }
.thread-item__meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.thread-item__meta strong { color:var(--cue-text); font:800 9px monospace; text-transform:uppercase; }
.thread-item__meta span { color:var(--cue-muted); font:700 8px monospace; text-transform:uppercase; }
.thread-item__meta time { margin-left:auto; color:var(--cue-muted); font:8px monospace; }
.thread-item__delivery { margin-left:auto; padding:3px 6px; border:1px solid var(--cue-border); color:var(--cue-muted); font:800 7px monospace; font-style:normal; text-transform:uppercase; }
.thread-item__delivery + time { margin-left:0; }
.thread-item > p { margin:7px 0 0; font-size:12px; line-height:1.45; }
.core-inbox__empty { margin:0; padding:18px; color:var(--cue-muted); font-size:12px; }
@media (max-width: 1180px) {
  .core-inbox__tools { grid-template-columns:minmax(220px,1fr) auto; }
  .core-inbox__filters--status { grid-column:1 / -1; }
}
@media (max-width: 760px) {
  .core-inbox__layout { grid-template-columns:1fr; }
  .core-inbox__list { border-right:0; border-bottom:1px solid var(--cue-border); max-height:260px; overflow:auto; }
  .core-inbox__list button { grid-template-columns:70px minmax(0,1fr); min-height:62px; }
  .core-inbox__list em { grid-column:2; margin-top:-4px; }
  .core-inbox__detail { padding:14px; }
  .core-inbox__detail h3 { font-size:22px; }
  .core-inbox__facts { grid-template-columns:1fr 1fr; }
  .core-inbox__tools { grid-template-columns:1fr; gap:8px; }
  .core-inbox__search, .core-inbox__filters--archive, .core-inbox__filters--status { grid-column:1; }
  .core-inbox__filters:not(.core-inbox__filters--archive) { display:flex; overflow-x:auto; padding-bottom:2px; }
  .core-inbox__filters:not(.core-inbox__filters--archive) button { width:auto; min-height:38px; white-space:nowrap; }
  .core-inbox__detail > header { flex-direction:column; gap:12px; }
  .core-inbox__header-actions { display:grid; grid-template-columns:1fr; width:100%; min-width:0; justify-content:stretch; }
  .core-inbox__archive { justify-self:start; }
  .core-inbox__decision-block { width:100%; min-width:0; }
  .core-inbox__status { min-width:0; }
  .core-inbox__decisions { grid-template-columns:repeat(3,minmax(0,1fr)); min-width:0; }
  .core-inbox__decisions button,
  .core-inbox__archive { min-height:44px; }
  .core-inbox__decisions button { min-width:0; padding-inline:4px; }
  .core-inbox__details-heading { align-items:center; }
  .core-inbox__facts { grid-template-columns:1fr 1fr; }
  .core-inbox__thread { max-height:min(52vh,380px); }
  .thread-item { width:auto; max-width:92%; }
}

.core-decision-modal { position:fixed; z-index:120; inset:0; display:grid; place-items:center; padding:20px; background:rgba(0,0,0,.76); backdrop-filter:blur(7px); }
.core-decision-modal article { width:min(520px,100%); padding:24px; border:1px solid var(--cue-border); background:var(--cue-surface); box-shadow:0 28px 90px rgba(0,0,0,.55); }
.core-decision-modal article > span { color:var(--cue-accent); font:800 9px/1.2 monospace; letter-spacing:.1em; }
.core-decision-modal h3 { margin:10px 0 12px; font-size:26px; line-height:1.05; text-transform:uppercase; }
.core-decision-modal p { margin:0; color:var(--cue-muted); font-size:12px; line-height:1.55; }
.core-decision-modal__error { margin-top:14px !important; padding:10px 12px; border-left:2px solid #ff8585; color:#ffb0b0 !important; background:color-mix(in srgb,#ff8585 6%,transparent); }
.core-decision-modal article > div { display:flex; justify-content:flex-end; gap:8px; margin-top:22px; }
.core-decision-modal button { min-height:42px; padding:0 14px; cursor:pointer; font:800 9px monospace; text-transform:uppercase; }
.core-decision-modal__secondary { border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); }
.core-decision-modal__primary { border:1px solid var(--cue-accent); background:var(--cue-accent); color:#080808; }
.core-decision-modal__primary.danger { border-color:#ff8585; background:#ff8585; }
.core-decision-modal button:disabled { opacity:.45; cursor:not-allowed; }
@media (max-width:560px) {
  .core-decision-modal { align-items:end; padding:0; }
  .core-decision-modal article { width:100%; box-sizing:border-box; border-right:0; border-bottom:0; border-left:0; }
  .core-decision-modal article > div { display:grid; grid-template-columns:1fr; }
  .core-decision-modal button { width:100%; }
}
</style>
