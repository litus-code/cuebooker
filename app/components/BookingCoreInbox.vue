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

const emit = defineEmits<{ operationsChanged: []; cueRequested: []; bookingOpened: [bookingId: string]; calendarRequested: [date: string] }>()
const { capacity: cueCapacity } = useCueEntitlements()
const bookingCore = useBookingCore()
const analytics = useAnalytics()
const selectedBookingId = ref('')
const contacts = ref<Contact[]>([])
const counterparties = ref<Counterparty[]>([])
const activities = ref<Activity[]>([])
const emailMessages = ref<BookingEmailMessage[]>([])
const conversationThread = ref<HTMLElement | null>(null)
const decisionModal = ref<HTMLElement | null>(null)
const decisionTrigger = ref<HTMLElement | null>(null)
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

const archiveScopedBookings = computed(() => {
  const query = realSearch.value.trim().toLowerCase()
  return props.bookings.filter(booking => {
    if (archiveView.value === 'active' && booking.archived_at) return false
    if (archiveView.value === 'archived' && !booking.archived_at) return false
    if (!query) return true
    const party = booking.counterparty_id ? counterparties.value.find(item => item.id === booking.counterparty_id) : null
    const contact = booking.primary_contact_id ? contacts.value.find(item => item.id === booking.primary_contact_id) : null
    return [booking.event_name, booking.venue_name, booking.city, booking.source, party?.name, contact?.name, contact?.email]
      .filter(Boolean).join(' ').toLowerCase().includes(query)
  })
})
const statusCounts = computed<Record<CoreBookingStatus, number>>(() => ({
  new: archiveScopedBookings.value.filter(item => item.status === 'new').length,
  in_conversation: archiveScopedBookings.value.filter(item => item.status === 'in_conversation').length,
  waiting_response: archiveScopedBookings.value.filter(item => item.status === 'waiting_response').length,
  confirmed: archiveScopedBookings.value.filter(item => item.status === 'confirmed').length,
  rejected: archiveScopedBookings.value.filter(item => item.status === 'rejected').length,
  cancelled: archiveScopedBookings.value.filter(item => item.status === 'cancelled').length
}))
const visibleBookings = computed(() => realStatusFilter.value === 'all'
  ? archiveScopedBookings.value
  : archiveScopedBookings.value.filter(booking => booking.status === realStatusFilter.value))
const pagedBookings = computed(() => visibleBookings.value.slice(0, visibleLimit.value))
const hasMoreBookings = computed(() => visibleLimit.value < visibleBookings.value.length)
const hasActiveInboxFilters = computed(() => Boolean(realSearch.value.trim()) || realStatusFilter.value !== 'all')
const activeBookingCount = computed(() => props.bookings.filter(item => !item.archived_at).length)
const activeBookingCapacity = computed(() => cueCapacity('activeBookings', activeBookingCount.value))
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
    if (import.meta.client) void scrollToSelectedBooking(true)
  }
}, { immediate: true })

watch(visibleBookings, value => {
  if (!value.length) {
    selectedBookingId.value = ''
    return
  }
  if (!value.some(item => item.id === selectedBookingId.value)) selectedBookingId.value = value[0].id
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
  if (!status) return props.locale === 'es' ? 'Enviado al proveedor' : 'Sent to provider'
  const labels: Record<string, string> = props.locale === 'es'
    ? { accepted:'Aceptado', delivered:'Entregado', deferred:'En espera', soft_bounce:'Rebote temporal', hard_bounce:'Rebotado', blocked:'Bloqueado', spam:'Spam', invalid:'Email inválido', error:'Error de entrega' }
    : { accepted:'Accepted', delivered:'Delivered', deferred:'Deferred', soft_bounce:'Soft bounce', hard_bounce:'Bounced', blocked:'Blocked', spam:'Spam', invalid:'Invalid email', error:'Delivery error' }
  return labels[status] || status
}

function emailDeliveryTone(activity: Activity) {
  if (activity.type !== 'email' || activity.direction !== 'outbound') return ''
  const emailId = typeof activity.metadata?.email_message_id === 'string' ? activity.metadata.email_message_id : ''
  const status = emailMessages.value.find(item => item.id === emailId)?.delivery_status || ''
  if (status === 'delivered') return 'success'
  if (['soft_bounce', 'hard_bounce', 'blocked', 'spam', 'invalid', 'error'].includes(status)) return 'error'
  if (status === 'deferred') return 'warning'
  return 'pending'
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

async function decideStatus(status: Extract<CoreBookingStatus, 'confirmed' | 'rejected' | 'cancelled'>) {
  if (!selectedBooking.value || selectedBooking.value.status === status) return
  decisionTrigger.value = import.meta.client && document.activeElement instanceof HTMLElement ? document.activeElement : null
  decisionError.value = ''
  pendingDecision.value = status
  await nextTick()
  decisionModal.value?.focus({ preventScroll: true })
}

async function closeDecisionModal() {
  if (updatingStatus.value) return
  const trigger = decisionTrigger.value
  pendingDecision.value = null
  decisionError.value = ''
  decisionTrigger.value = null
  await nextTick()
  if (trigger?.isConnected) trigger.focus({ preventScroll: true })
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
    analytics.track('booking_decision_completed', { decision: status })
    if (status === 'confirmed') {
      const hasCity = Boolean(booking.city)
      const hasVenue = Boolean(booking.venue_name)
      analytics.track('booking_confirmed', {
        source: booking.source || 'unknown',
        has_city: hasCity,
        has_venue: hasVenue
      })
      if (hasCity) {
        analytics.track('passport_event_created', { has_venue: hasVenue })
      }
    }
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

function usesStackedBookingLayout() {
  return import.meta.client && window.matchMedia('(max-width: 760px)').matches
}

async function scrollToSelectedBooking(force = false) {
  if (!import.meta.client || (!force && !usesStackedBookingLayout())) return
  await nextTick()
  const detail = document.getElementById('core-inbox-detail')
  if (!detail) return
  const header = document.getElementById('workspace-header')
  const offset = (header?.getBoundingClientRect().height || 0) + 10
  const top = detail.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  detail.focus({ preventScroll: true })
}

async function scrollToBookingList() {
  if (!import.meta.client) return
  await nextTick()
  const list = document.getElementById('core-inbox-list')
  if (!list) return
  const header = document.getElementById('workspace-header')
  const offset = (header?.getBoundingClientRect().height || 0) + 10
  const top = list.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  list.querySelector<HTMLElement>('.core-inbox__booking-row.active')?.focus({ preventScroll: true })
}

function clearInboxFilters() {
  realSearch.value = ''
  realStatusFilter.value = 'all'
}

async function scrollToBookingSection(targetId: string) {
  if (!import.meta.client) return
  await nextTick()
  const target = document.getElementById(targetId)
  if (!target) return
  const header = document.getElementById('workspace-header')
  const localNav = document.querySelector<HTMLElement>('.core-inbox__mobile-section-nav')
  const offset = (header?.getBoundingClientRect().height || 0) + (localNav?.getBoundingClientRect().height || 0) + 18
  const top = target.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  target.focus({ preventScroll: true })
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
      <div class="core-inbox__heading-meta">
        <CueCapacityIndicator
          :used="bookings.filter(item => !item.archived_at).length"
          limit-key="activeBookings"
          upgrade-entitlement="booking.unlimited"
          :label="locale === 'es' ? 'Activos' : 'Active'"
        />
        <b>{{ bookings.length }}</b>
      </div>
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
        <button type="button" :class="['status-filter', 'status-filter--all', { active: realStatusFilter === 'all' }]" @click="realStatusFilter = 'all'">{{ locale === 'es' ? 'Todos' : 'All' }} · {{ archiveScopedBookings.length }}</button>
        <button v-for="(label, status) in statusLabels" :key="status" type="button" :class="['status-filter', `status-filter--${status}`, { active: realStatusFilter === status }]" @click="realStatusFilter = status">{{ label }} · {{ statusCounts[status] }}</button>
      </div>
    </div>

    <CueUpgradePrompt
      v-if="activeBookingCapacity.reached"
      entitlement="booking.unlimited"
      :title="locale === 'es' ? 'Capacidad Free alcanzada' : 'Free capacity reached'"
      :description="locale === 'es'
        ? 'Puedes seguir trabajando tus bookings actuales. Artist Pro elimina el límite de procesos activos.'
        : 'You can keep working on current bookings. Artist Pro removes the active-booking capacity limit.'"
    />

    <div v-if="bookings.length && !visibleBookings.length" class="core-inbox__empty core-inbox__empty--filtered">
      <p>{{ locale === 'es' ? 'No hay bookings con estos filtros.' : 'No bookings match these filters.' }}</p>
      <button v-if="hasActiveInboxFilters" type="button" @click="clearInboxFilters">
        {{ locale === 'es' ? 'Limpiar filtros' : 'Clear filters' }}
      </button>
      <button v-else-if="archiveView === 'archived'" type="button" @click="archiveView = 'active'">
        {{ locale === 'es' ? 'Volver a en curso' : 'Back to in progress' }}
      </button>
    </div>

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

      <article v-if="selectedBooking" id="core-inbox-detail" class="core-inbox__detail" tabindex="-1">
        <div class="core-inbox__mobile-nav">
          <button type="button" @click="scrollToBookingList">
            <span aria-hidden="true">←</span>
            {{ locale === 'es' ? 'Volver a bookings' : 'Back to bookings' }}
          </button>
          <small>{{ statusLabels[selectedBooking.status] }}</small>
        </div>
        <nav class="core-inbox__mobile-section-nav" :aria-label="locale === 'es' ? 'Secciones del booking' : 'Booking sections'">
          <button type="button" @click="scrollToBookingSection('core-inbox-facts')">{{ locale === 'es' ? 'Datos' : 'Details' }}</button>
          <button type="button" @click="scrollToBookingSection('core-inbox-conversation')">{{ locale === 'es' ? 'Conversación' : 'Conversation' }}</button>
          <button v-if="!selectedBooking.archived_at" type="button" @click="scrollToBookingSection('core-inbox-operations')">{{ locale === 'es' ? 'Seguimiento' : 'Follow-up' }}</button>
        </nav>

        <BookingCoreConflictNotice
          v-if="!selectedBooking.archived_at"
          class="core-inbox__conflict-predecision"
          :workspace-id="workspaceId"
          :booking="selectedBooking"
          :bookings="bookings"
          :locale="locale"
          :refresh-key="activities.length"
        />

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
            <div class="core-inbox__details-actions">
              <button
                v-if="selectedBooking.event_date"
                class="core-inbox__calendar-link"
                type="button"
                @click="emit('calendarRequested', selectedBooking.event_date)"
              >
                {{ locale === 'es' ? 'Ver en calendario' : 'View in calendar' }}
              </button>
              <BookingCoreEditor
                v-if="!selectedBooking.archived_at"
                :workspace-id="workspaceId"
                :booking="selectedBooking"
                :locale="locale"
                @saved="handleBookingSaved"
              />
            </div>
          </div>
          <dl id="core-inbox-facts" class="core-inbox__facts" tabindex="-1">
            <div><dt>{{ copy.date }}</dt><dd :class="{ missing: !selectedBooking.event_date }">{{ formatDate(selectedBooking.event_date) }}</dd></div>
            <div><dt>{{ copy.venue }}</dt><dd :class="{ missing: !selectedCounterparty?.name && !selectedBooking.venue_name }">{{ selectedCounterparty?.name || selectedBooking.venue_name || copy.noVenue }}</dd></div>
            <div class="core-inbox__contact-fact">
              <div class="core-inbox__contact-head">
                <div>
                  <dt>{{ copy.contact }}</dt>
                  <dd :class="{ missing: !loadingMeta && !selectedContact?.name }">{{ loadingMeta ? '…' : selectedContact?.name || copy.noContact }}</dd>
                </div>
                <BookingContactEditor
                  v-if="selectedContact && !selectedBooking.archived_at"
                  :workspace-id="workspaceId"
                  :contact="selectedContact"
                  :locale="locale"
                  @saved="handleContactSaved"
                />
              </div>
              <small v-if="selectedContact?.email">{{ selectedContact.email }}</small>
              <small v-if="selectedContact?.phone">{{ selectedContact.phone }}</small>
            </div>
            <div><dt>{{ copy.offer }}</dt><dd :class="{ missing: selectedBooking.offer_amount_minor == null }">{{ formatMoney(selectedBooking) }}</dd></div>
          </dl>
        </section>

        <section id="core-inbox-conversation" class="core-inbox__conversation" tabindex="-1">
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
                <em
                  v-if="emailDeliveryLabel(activity)"
                  :class="['thread-item__delivery', `thread-item__delivery--${emailDeliveryTone(activity)}`]"
                >{{ emailDeliveryLabel(activity) }}</em>
                <time>{{ formatTime(activity.occurred_at) }}</time>
              </div>
              <p>{{ activity.body }}</p>
            </article>
          </div>

          <BookingActivityComposer
            id="core-inbox-activity-composer"
            v-if="!selectedBooking.archived_at"
            :key="`activity-${selectedBooking.id}`"
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
          :key="`operations-${selectedBooking.id}`"
          :workspace-id="workspaceId"
          :booking="selectedBooking"
          :locale="locale"
          @changed="handleOperationsChanged"
        />

        <BookingRelationshipMemory
          :workspace-id="workspaceId"
          :booking="selectedBooking"
          :bookings="bookings"
          :contact-name="selectedContact?.name"
          :counterparty-name="selectedCounterparty?.name"
          :locale="locale"
        />

        <p v-if="selectedBooking.archived_at" class="core-inbox__readonly">{{ copy.archivedReadOnly }}</p>

      </article>
    </div>
  </section>

  <div v-if="pendingDecision" class="core-decision-modal" @click.self="closeDecisionModal">
    <article
      ref="decisionModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="core-decision-title"
      tabindex="-1"
    >
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
.core-inbox { margin:var(--cue-space-3) 0 var(--cue-space-5); border:1px solid var(--cue-border); border-radius:var(--cue-radius-panel); background:var(--cue-surface); overflow:hidden; }
.core-inbox__heading { display:flex; align-items:center; justify-content:space-between; gap:var(--cue-space-4); padding:var(--cue-space-4); border-bottom:1px solid var(--cue-border); }
.core-inbox__heading-meta{display:flex;align-items:center;gap:8px}.core-inbox__heading-meta>b{color:var(--cue-accent);font:700 12px monospace}
.core-inbox__heading span { display:block; color:var(--cue-accent); font:700 9px/1.2 monospace; letter-spacing:.11em; }
.core-inbox__heading strong { display:block; margin-top:4px; font-size:17px; }
.core-inbox__heading b { min-width:34px; text-align:center; font:700 12px monospace; color:var(--cue-accent); }
.core-inbox > :deep(.cue-upgrade-prompt){margin:10px var(--cue-space-4) 0}

.core-inbox__zero { display:grid; justify-items:start; gap:8px; padding:24px 18px 28px; }
.core-inbox__zero > span { color:var(--cue-accent); font:700 9px monospace; text-transform:uppercase; }
.core-inbox__zero > strong { max-width:560px; font-size:clamp(20px,3vw,30px); line-height:1.05; }
.core-inbox__zero > p { max-width:600px; margin:0; color:var(--cue-muted); font-size:12px; line-height:1.5; }
.core-inbox__zero > button { margin-top:5px; min-height:40px; padding:0 15px; border:1px solid var(--cue-accent); background:var(--cue-accent); color:var(--cue-primary-ink); cursor:pointer; font-weight:800; }
.core-inbox__tools { display:grid; grid-template-columns:minmax(260px,1fr) auto; align-items:center; gap:var(--cue-space-2); padding:var(--cue-space-3) var(--cue-space-4); border-bottom:1px solid var(--cue-border); background:color-mix(in srgb,var(--cue-raised) 28%,transparent); }
.core-inbox__search { min-width:0; min-height:var(--cue-button-sm); border:1px solid var(--cue-border); border-radius:var(--cue-radius-control); background:var(--cue-raised); color:var(--cue-text); padding:0 10px; }
.core-inbox__filters { display:flex; align-items:center; gap:4px; min-width:0; overflow-x:auto; scrollbar-width:thin; }
.core-inbox__filters button { flex:0 0 auto; min-height:var(--cue-button-sm); padding:0 10px; border:1px solid transparent; border-radius:var(--cue-radius-control); background:color-mix(in srgb,var(--cue-raised) 64%,transparent); color:var(--cue-muted); cursor:pointer; font:700 8px monospace; text-transform:uppercase; white-space:nowrap; transition:border-color .16s ease,background-color .16s ease,color .16s ease; }
.core-inbox__filters--archive { gap:4px; padding:3px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-control); background:transparent; }
.core-inbox__filters--archive button { background:transparent; }
.core-inbox__filters--archive button:hover { color:var(--cue-text); background:var(--cue-raised); }
.core-inbox__filters--archive button.active { border-color:color-mix(in srgb,var(--cue-accent) 35%,transparent); background:color-mix(in srgb,var(--cue-accent) 8%,var(--cue-raised)); color:var(--cue-accent); }
.core-inbox__filters--status { grid-column:1 / -1; padding-top:var(--cue-space-1); }
.status-filter { border-color:transparent !important; color:color-mix(in srgb,var(--status-color,var(--cue-muted)) 76%,var(--cue-muted)) !important; background:color-mix(in srgb,var(--cue-raised) 54%,transparent) !important; }
.status-filter:hover { border-color:color-mix(in srgb,var(--status-color,var(--cue-text)) 28%,var(--cue-border)) !important; color:var(--status-color,var(--cue-text)) !important; background:color-mix(in srgb,var(--status-color,var(--cue-text)) 4%,var(--cue-raised)) !important; }
.status-filter.active { border-color:color-mix(in srgb,var(--status-color,var(--cue-text)) 42%,var(--cue-border)) !important; color:var(--status-color,var(--cue-text)) !important; background:color-mix(in srgb,var(--status-color,var(--cue-text)) 8%,var(--cue-raised)) !important; box-shadow:none; }
.status-filter--all { --status-color:var(--cue-text); }
.status-filter--new, .booking-status--new, .core-inbox__status--new { --status-color:var(--cue-status-new); }
.status-filter--in_conversation, .booking-status--in_conversation, .core-inbox__status--in_conversation { --status-color:var(--cue-status-conversation); }
.status-filter--waiting_response, .booking-status--waiting_response, .core-inbox__status--waiting_response { --status-color:var(--cue-status-waiting); }
.status-filter--confirmed, .booking-status--confirmed, .core-inbox__status--confirmed { --status-color:var(--cue-status-confirmed); }
.status-filter--rejected, .booking-status--rejected, .core-inbox__status--rejected { --status-color:var(--cue-status-rejected); }
.status-filter--cancelled, .booking-status--cancelled, .core-inbox__status--cancelled { --status-color:var(--cue-status-cancelled); }
.core-inbox__layout { display:grid; grid-template-columns:minmax(290px,340px) minmax(0,1fr); min-height:620px; }
.core-inbox__list { border-right:1px solid var(--cue-border); background:color-mix(in srgb,var(--cue-bg) 34%,var(--cue-surface)); }
.core-inbox__list button { display:grid; grid-template-columns:76px minmax(0,1fr); align-items:center; gap:10px; width:100%; min-height:74px; padding:10px 14px; border:0; border-bottom:1px solid var(--cue-border); background:transparent; color:var(--cue-text); text-align:left; cursor:pointer; }
.core-inbox__booking-row { position:relative; }
.core-inbox__booking-row:before { position:absolute; left:0; top:0; bottom:0; width:3px; background:var(--row-status,var(--cue-border)); content:""; opacity:.82; }
.core-inbox__booking-row--new { --row-status:var(--cue-status-new); }
.core-inbox__booking-row--in_conversation { --row-status:var(--cue-status-conversation); }
.core-inbox__booking-row--waiting_response { --row-status:var(--cue-status-waiting); }
.core-inbox__booking-row--confirmed { --row-status:var(--cue-status-confirmed); }
.core-inbox__booking-row--rejected { --row-status:var(--cue-status-rejected); }
.core-inbox__booking-row--cancelled { --row-status:var(--cue-status-cancelled); }
.core-inbox__list button:hover { background:color-mix(in srgb,var(--cue-raised) 72%,transparent); }
.core-inbox__list button.active { background:color-mix(in srgb,var(--cue-raised) 92%,transparent); }
.core-inbox__list button.active:before { width:5px; opacity:1; }
.core-inbox__load-more { padding:10px; border-top:1px solid var(--cue-border); }
.core-inbox__load-more > button { display:block; width:100%; min-height:38px; padding:0 12px; border:1px solid var(--cue-border); background:var(--cue-raised); color:var(--cue-text); cursor:pointer; font:800 8px monospace; text-transform:uppercase; }
.core-inbox__load-more > button:hover { border-color:var(--cue-accent); color:var(--cue-accent); }
.core-inbox__list time { color:var(--cue-muted); font:700 10px monospace; }
.core-inbox__list span strong, .core-inbox__list span small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.core-inbox__list span small { margin-top:4px; color:var(--cue-muted); font-size:11px; }
.core-inbox__list em { grid-column:2; justify-self:start; margin-top:-2px; font:700 8px monospace; color:var(--row-status,var(--cue-muted)); text-transform:uppercase; font-style:normal; }
.core-inbox__detail { min-width:0; padding:var(--cue-space-4); background:var(--cue-surface); outline:none; }
.core-inbox__conflict-predecision { margin-bottom:var(--cue-space-3); }
.core-inbox__mobile-nav { display:none; }
.core-inbox__mobile-section-nav { display:none; }
.core-inbox__detail > header { display:grid; grid-template-columns:minmax(0,1fr) auto; align-items:start; gap:var(--cue-space-4); padding-bottom:var(--cue-space-3); border-bottom:1px solid var(--cue-border); }
.core-inbox__detail > header span { color:var(--cue-accent); font:700 9px monospace; text-transform:uppercase; letter-spacing:.1em; }
.core-inbox__detail h3 { margin:4px 0 3px; font-size:clamp(28px,2.4vw,36px); line-height:.96; letter-spacing:-.03em; }
.core-inbox__detail header p { margin:0; color:var(--cue-muted); font-size:12px; }
.core-inbox__header-actions { display:flex; align-items:flex-start; justify-content:flex-end; gap:var(--cue-space-2); flex-wrap:wrap; }
.core-inbox__archive { min-height:var(--cue-button-sm); padding:0 var(--cue-space-3); border:0; border-radius:var(--cue-radius-control); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; text-transform:uppercase; }
.core-inbox__archive:hover { color:var(--cue-accent); }
.core-inbox__decision-block { display:grid; grid-template-columns:auto auto; align-items:center; gap:var(--cue-space-2); min-width:0; }
.core-inbox__status { display:grid; gap:2px; align-self:center; min-width:132px; padding:2px 0 2px 9px; border:0; border-left:2px solid var(--status-color,var(--cue-border)); background:transparent; }
.core-inbox__status > span { color:var(--cue-muted); font:700 7px monospace; letter-spacing:.08em; text-transform:uppercase; }
.core-inbox__status > strong { color:var(--status-color,var(--cue-text)); font:800 10px monospace; text-transform:uppercase; }
.core-inbox__status > small { max-width:220px; color:var(--cue-muted); font-size:9px; line-height:1.35; }
.core-inbox__decisions { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; }
.core-inbox__decisions button { min-height:var(--cue-button-sm); padding:0 10px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-control); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 7px monospace; text-transform:uppercase; }
.core-inbox__decisions button:disabled { opacity:.45; cursor:wait; }
.core-inbox__decisions .decision-confirm { border-color:var(--cue-status-confirmed); color:var(--cue-status-confirmed); }
.core-inbox__decisions .decision-reject { border-color:var(--cue-status-rejected); color:var(--cue-status-rejected); }
.core-inbox__decisions .decision-cancel { border-color:var(--cue-border); color:var(--cue-muted); }
.core-inbox__readonly { margin:12px 0; padding:10px 12px; border-left:2px solid var(--cue-muted); background:var(--cue-raised); color:var(--cue-muted); font-size:11px; }
.core-inbox__details-block { margin-top:var(--cue-space-3); padding:0 var(--cue-space-4); border:1px solid var(--cue-border); border-right:0; border-left:0; background:color-mix(in srgb,var(--cue-raised) 26%,transparent); }
.core-inbox__details-heading { display:flex; align-items:center; justify-content:space-between; gap:var(--cue-space-3); padding:var(--cue-space-3) 0; border-bottom:1px solid color-mix(in srgb,var(--cue-border) 72%,transparent); }
.core-inbox__details-heading > strong { color:var(--cue-muted); font:800 9px monospace; text-transform:uppercase; letter-spacing:.08em; }
.core-inbox__details-actions { display:flex; align-items:center; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
.core-inbox__calendar-link { min-height:var(--cue-button-sm); padding:0 var(--cue-space-3); border:1px solid var(--cue-border); border-radius:var(--cue-radius-control); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; text-transform:uppercase; }
.core-inbox__calendar-link:hover,
.core-inbox__calendar-link:focus-visible { border-color:var(--cue-accent); color:var(--cue-accent); outline:none; }
.core-inbox__facts { display:grid; grid-template-columns:minmax(120px,.8fr) minmax(170px,1fr) minmax(230px,1.3fr) minmax(120px,.7fr); gap:0; margin:0; padding:var(--cue-space-3) 0; border-bottom:0; }
.core-inbox__facts > div { min-width:0; min-height:74px; padding:var(--cue-space-1) var(--cue-space-4); }
.core-inbox__facts > div:first-child { padding-left:0; }
.core-inbox__facts > div:last-child { padding-right:0; }
.core-inbox__facts > div + div { border-left:1px solid color-mix(in srgb,var(--cue-border) 70%,transparent); }
.core-inbox__facts dt { color:var(--cue-muted); font:800 8px monospace; letter-spacing:.08em; text-transform:uppercase; }
.core-inbox__facts dd { margin:6px 0 0; overflow:hidden; text-overflow:ellipsis; font-size:14px; font-weight:650; line-height:1.25; }
.core-inbox__facts dd.missing { color:var(--cue-accent); font-style:italic; }
.core-inbox__contact-fact { padding-inline:var(--cue-space-5) !important; }
.core-inbox__contact-head { display:flex; align-items:flex-start; justify-content:space-between; gap:var(--cue-space-3); }
.core-inbox__contact-head > div { min-width:0; }
.core-inbox__contact-fact dd { margin-top:7px; }
.core-inbox__contact-fact small { display:block; margin-top:6px; color:var(--cue-muted); font-size:10px; line-height:1.4; }
.core-inbox__contact-fact small + small { margin-top:3px; }
.core-inbox__conversation { margin-top:var(--cue-space-4); padding-top:var(--cue-space-3); border-top:1px solid var(--cue-border); border-bottom:1px solid var(--cue-border); background:transparent; }
.core-inbox__conversation-heading { padding:0 0 var(--cue-space-3); border-bottom:0; }
.core-inbox__conversation-heading span { display:block; color:var(--cue-accent); font:800 10px monospace; text-transform:uppercase; letter-spacing:.1em; }
.core-inbox__conversation-heading small { display:block; margin-top:5px; color:var(--cue-muted); font-size:10px; line-height:1.4; }
.core-inbox__thread { min-height:240px; max-height:clamp(420px,56vh,640px); overflow-y:auto; overscroll-behavior-y:auto; scrollbar-gutter:stable; scrollbar-width:thin; padding:var(--cue-space-2) 0 var(--cue-space-3); }
.thread-item { width:min(82%,720px); margin:0 0 8px; padding:10px 12px; border:0; border-left:2px solid var(--cue-border); border-radius:0 var(--cue-radius-sm) var(--cue-radius-sm) 0; background:color-mix(in srgb,var(--cue-raised) 58%,transparent); }
.thread-item--outbound { margin-left:auto; border-left:0; border-right:2px solid color-mix(in srgb,var(--cue-status-conversation) 58%,var(--cue-border)); border-radius:var(--cue-radius-sm) 0 0 var(--cue-radius-sm); background:color-mix(in srgb,var(--cue-status-conversation) 4%,var(--cue-raised)); }
.thread-item--inbound { margin-right:auto; border-left-color:color-mix(in srgb,var(--cue-accent) 62%,var(--cue-border)); background:color-mix(in srgb,var(--cue-accent) 3%,var(--cue-raised)); }
.thread-item--internal { margin-right:auto; border-left-style:dashed; color:var(--cue-muted); background:transparent; }
.thread-item__meta { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.thread-item__meta strong { color:var(--cue-text); font:800 9px monospace; text-transform:uppercase; }
.thread-item__meta span { color:var(--cue-muted); font:700 8px monospace; text-transform:uppercase; }
.thread-item__meta time { margin-left:auto; color:var(--cue-muted); font:8px monospace; }
.thread-item__delivery { margin-left:auto; padding:3px 6px; border:1px solid var(--cue-border); color:var(--cue-muted); font:800 7px monospace; font-style:normal; text-transform:uppercase; }
.thread-item__delivery--success { border-color:color-mix(in srgb,var(--cue-status-confirmed) 50%,var(--cue-border)); color:var(--cue-status-confirmed); }
.thread-item__delivery--warning { border-color:color-mix(in srgb,var(--cue-status-waiting) 52%,var(--cue-border)); color:var(--cue-status-waiting); }
.thread-item__delivery--error { border-color:color-mix(in srgb,var(--cue-status-rejected) 58%,var(--cue-border)); color:var(--cue-status-rejected); }
.thread-item__delivery--pending { color:var(--cue-muted); }
.thread-item__delivery + time { margin-left:0; }
.thread-item > p { margin:7px 0 0; font-size:12px; line-height:1.45; }
.core-inbox__empty { margin:0; padding:18px; color:var(--cue-muted); font-size:12px; }
.core-inbox__empty--filtered { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.core-inbox__empty--filtered p { margin:0; }
.core-inbox__empty--filtered button { flex:0 0 auto; min-height:38px; padding:0 12px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-control); background:transparent; color:var(--cue-text); cursor:pointer; font:800 8px monospace; text-transform:uppercase; }
.core-inbox__empty--filtered button:hover,
.core-inbox__empty--filtered button:focus-visible { border-color:var(--cue-accent); color:var(--cue-accent); outline:none; }
@media (max-width: 1180px) {
  .core-inbox__tools { grid-template-columns:minmax(220px,1fr) auto; }
  .core-inbox__filters--status { grid-column:1 / -1; padding-top:var(--cue-space-1); }
}
@media (max-width: 760px) {
  .core-inbox__layout { grid-template-columns:1fr; }
  .core-inbox__mobile-nav { display:flex; align-items:center; justify-content:space-between; gap:12px; margin:-2px 0 14px; padding-bottom:12px; border-bottom:1px solid var(--cue-border); }
  .core-inbox__mobile-nav button { min-height:40px; padding:0; border:0; background:transparent; color:var(--cue-accent); cursor:pointer; font:800 9px/1 monospace; text-transform:uppercase; }
  .core-inbox__mobile-nav button span { margin-right:6px; font-size:14px; }
  .core-inbox__mobile-nav small { color:var(--cue-muted); font:800 8px/1 monospace; text-transform:uppercase; }
  .core-inbox__mobile-section-nav { position:sticky; z-index:8; top:0; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; margin:0 0 14px; padding:8px 0; background:color-mix(in srgb,var(--cue-surface) 94%,transparent); backdrop-filter:blur(8px); }
  .core-inbox__mobile-section-nav button { min-height:38px; padding:0 6px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-control); background:var(--cue-raised); color:var(--cue-muted); cursor:pointer; font:800 8px/1 monospace; text-transform:uppercase; }
  .core-inbox__mobile-section-nav button:hover,
  .core-inbox__mobile-section-nav button:focus-visible { border-color:var(--cue-accent); color:var(--cue-accent); outline:none; }
  .core-inbox__facts:focus,
  .core-inbox__conversation:focus,
  #core-inbox-operations:focus { outline:none; }
  .core-inbox__list { border-right:0; border-bottom:1px solid var(--cue-border); max-height:260px; overflow:auto; }
  .core-inbox__list button { grid-template-columns:70px minmax(0,1fr); min-height:62px; }
  .core-inbox__list em { grid-column:2; margin-top:-4px; }
  .core-inbox__detail { padding:14px; }
  .core-inbox__detail h3 { font-size:22px; }
  .core-inbox__facts { grid-template-columns:1fr 1fr; }
  .core-inbox__facts > div { min-height:0; padding:var(--cue-space-3) 0; border-left:0 !important; }
  .core-inbox__facts > div:nth-child(even) { padding-left:var(--cue-space-3); border-left:1px solid color-mix(in srgb,var(--cue-border) 70%,transparent) !important; }
  .core-inbox__facts > div:nth-child(n+3) { border-top:1px solid color-mix(in srgb,var(--cue-border) 70%,transparent); }
  .core-inbox__tools { grid-template-columns:1fr; gap:8px; }
  .core-inbox__search, .core-inbox__filters--archive, .core-inbox__filters--status { grid-column:1; }
  .core-inbox__filters:not(.core-inbox__filters--archive) { display:flex; overflow-x:auto; padding-bottom:2px; }
  .core-inbox__filters:not(.core-inbox__filters--archive) button { width:auto; min-height:var(--cue-control-standard); white-space:nowrap; }
  .core-inbox__filters--archive { width:max-content; max-width:100%; }
  .core-inbox__detail > header { grid-template-columns:1fr; gap:12px; }
  .core-inbox__header-actions { display:grid; grid-template-columns:1fr; width:100%; min-width:0; justify-content:stretch; }
  .core-inbox__archive { justify-self:start; }
  .core-inbox__decision-block { grid-template-columns:1fr; width:100%; min-width:0; }
  .core-inbox__status { min-width:0; }
  .core-inbox__decisions { grid-template-columns:repeat(3,minmax(0,1fr)); min-width:0; }
  .core-inbox__decisions button,
  .core-inbox__archive { min-height:44px; }
  .core-inbox__decisions button { min-width:0; padding-inline:4px; }
  .core-inbox__details-heading { align-items:center; }
  .core-inbox__details-actions { width:100%; justify-content:flex-start; }
  .core-inbox__details-heading { flex-wrap:wrap; }
  .core-inbox__calendar-link { min-height:40px; }
  .core-inbox__facts { grid-template-columns:1fr 1fr; }
  .core-inbox__thread { max-height:min(52vh,380px); }
  .thread-item { width:auto; max-width:92%; }
  .core-inbox__empty--filtered { align-items:flex-start; flex-direction:column; }
  .core-inbox__empty--filtered button { width:100%; min-height:44px; }
}

.core-decision-modal { position:fixed; z-index:120; inset:0; display:grid; place-items:center; padding:20px; background:rgba(0,0,0,.76); backdrop-filter:blur(7px); }
.core-decision-modal article { width:min(520px,100%); padding:24px; border:1px solid var(--cue-border); background:var(--cue-surface); box-shadow:0 28px 90px rgba(0,0,0,.55); }
.core-decision-modal article > span { color:var(--cue-accent); font:800 9px/1.2 monospace; letter-spacing:.1em; }
.core-decision-modal h3 { margin:10px 0 12px; font-size:26px; line-height:1.05; text-transform:uppercase; }
.core-decision-modal p { margin:0; color:var(--cue-muted); font-size:12px; line-height:1.55; }
.core-decision-modal__error { margin-top:14px !important; padding:10px 12px; border-left:2px solid var(--cue-status-rejected); color:color-mix(in srgb,var(--cue-status-rejected) 72%,white) !important; background:color-mix(in srgb,var(--cue-status-rejected) 6%,transparent); }
.core-decision-modal article > div { display:flex; justify-content:flex-end; gap:8px; margin-top:22px; }
.core-decision-modal button { min-height:42px; padding:0 14px; cursor:pointer; font:800 9px monospace; text-transform:uppercase; }
.core-decision-modal__secondary { border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); }
.core-decision-modal__primary { border:1px solid var(--cue-accent); background:var(--cue-primary); color:var(--cue-primary-ink); }
.core-decision-modal__primary.danger { border-color:var(--cue-status-rejected); background:var(--cue-status-rejected); }
.core-decision-modal button:disabled { opacity:.45; cursor:not-allowed; }
@media (max-width:560px) {
  .core-decision-modal { align-items:end; padding:0; }
  .core-decision-modal article { width:100%; box-sizing:border-box; border-right:0; border-bottom:0; border-left:0; }
  .core-decision-modal article > div { display:grid; grid-template-columns:1fr; }
  .core-decision-modal button { width:100%; }
}
</style>
