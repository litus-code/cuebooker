<script setup lang="ts">
import { bookingStatuses, statusTone, type BookingStatus } from '../domain/booking'

const route = useRoute()
const { locale, theme, setLocale, setTheme } = useCuePreferences()
const { bookings, ready, setStatus, addMessage, setArchived } = useBookingDemo()
const activeView = ref<'requests' | 'calendar' | 'history' | 'settings'>('requests')
const role = ref<'dj' | 'manager'>('dj')
const filter = ref<'all' | BookingStatus>('all')
const selectedId = ref('')
const reply = ref('')
const tourStep = ref(-1)

const copy = computed(() => locale.value === 'es' ? {
  prototype: 'DEMO FUNCIONAL · DATOS EN ESTE NAVEGADOR', role: 'Vista', dj: 'DJ', manager: 'Manager',
  nav: { requests: 'Solicitudes', calendar: 'Calendario', history: 'Historial', settings: 'Ajustes' },
  title: 'Tu siguiente acción, sin buscarla.', subtitle: 'Cada solicitud conserva los datos, la conversación y quién debe responder ahora.',
  all: 'Todas', empty: 'No hay solicitudes en este estado.', choose: 'Abre una solicitud para ver el hilo completo.', status: 'Estado', contact: 'Contacto', event: 'Datos del evento', conversation: 'Conversación', reply: 'Responder al promotor', replyPlaceholder: 'Escribe condiciones, una pregunta o una propuesta…', send: 'Enviar respuesta', emailNote: 'En producción, esta respuesta se enviará al email del promotor y su contestación volverá a este mismo hilo. En esta demo se refleja en la vista del promotor.', promoterView: 'Abrir vista del promotor', openThread: 'Ver conversación completa', confirm: 'Confirmar fecha', archive: 'Cerrar y enviar al historial', restore: 'Devolver a solicitudes', attachment: 'Adjunto',
  calendarTitle: 'Fechas confirmadas', calendarBody: 'Solo aparecen cuando ambas partes confirman. La disponibilidad pública muestra el resultado, nunca tu agenda completa.', historyTitle: 'Historial', historyBody: 'Consultas cerradas que puedes volver a abrir si te equivocaste.', settingsTitle: 'Preferencias de la demo', settingsBody: 'Idioma y apariencia se conservan en este dispositivo.',
  guide: 'Ver recorrido guiado', next: 'Siguiente', finish: 'Terminar', close: 'Cerrar',
  facts: { date: 'Fecha', city: 'Ciudad', venue: 'Sala', capacity: 'Aforo', offer: 'Oferta', schedule: 'Horario', name: 'Nombre', email: 'Email', phone: 'Tel.', source: 'Origen', sourceValue: 'Enlace de booking', language: 'Idioma', appearance: 'Apariencia', calendar: 'CALENDARIO / PRIVADO', archiveLabel: 'ARCHIVO / REVERSIBLE', device: 'DISPOSITIVO / PREFERENCIAS' },
  tour: [
    ['Una bandeja accionable', 'Empieza viendo únicamente las solicitudes activas y cuántas requieren atención.', 'workspace-filters'],
    ['Abre una solicitud', 'Al seleccionar una fila aparecen los datos y el mensaje original del promotor.', 'workspace-list'],
    ['El estado explica quién actúa', 'No necesitas “Revisando” o “Necesita información”: el estado indica el siguiente responsable.', 'workspace-status'],
    ['Responde desde el booking', 'El promotor recibiría el mensaje por email y puede volver al hilo mediante un enlace seguro.', 'workspace-reply'],
    ['Confirma o archiva', 'La confirmación bloquea la fecha. El archivo es opcional y siempre reversible.', 'workspace-actions']
  ],
  statuses: { new: 'Nueva', your_reply: 'Tu respuesta', waiting_promoter: 'Esperando al promotor', confirmed: 'Confirmada', closed: 'Cerrada' }
} : {
  prototype: 'FUNCTIONAL DEMO · DATA ON THIS DEVICE', role: 'View', dj: 'DJ', manager: 'Manager',
  nav: { requests: 'Requests', calendar: 'Calendar', history: 'History', settings: 'Settings' },
  title: 'Your next action, without searching.', subtitle: 'Every request keeps its details, conversation and the person who needs to respond next.',
  all: 'All', empty: 'No requests in this state.', choose: 'Open a request to see the complete thread.', status: 'Status', contact: 'Contact', event: 'Event details', conversation: 'Conversation', reply: 'Reply to promoter', replyPlaceholder: 'Write conditions, a question or a proposal…', send: 'Send reply', emailNote: 'In production, this reply is sent to the promoter by email and their answer returns to this thread. The demo mirrors it in the promoter view.', promoterView: 'Open promoter view', openThread: 'View full conversation', confirm: 'Confirm date', archive: 'Close and move to history', restore: 'Return to requests', attachment: 'Attachment',
  calendarTitle: 'Confirmed dates', calendarBody: 'They appear only when both sides confirm. Public availability shows the result, never your full calendar.', historyTitle: 'History', historyBody: 'Closed enquiries you can reopen if needed.', settingsTitle: 'Demo preferences', settingsBody: 'Language and appearance are stored on this device.',
  guide: 'Start guided tour', next: 'Next', finish: 'Finish', close: 'Close',
  facts: { date: 'Date', city: 'City', venue: 'Venue', capacity: 'Capacity', offer: 'Offer', schedule: 'Schedule', name: 'Name', email: 'Email', phone: 'Phone', source: 'Source', sourceValue: 'Booking link', language: 'Language', appearance: 'Appearance', calendar: 'CALENDAR / PRIVATE', archiveLabel: 'ARCHIVE / REVERSIBLE', device: 'DEVICE / PREFERENCES' },
  tour: [
    ['An actionable inbox', 'Start with active requests and a clear count of what needs attention.', 'workspace-filters'],
    ['Open a request', 'Selecting a row reveals the promoter’s original details and message.', 'workspace-list'],
    ['Status names the next actor', 'You do not need Reviewing or Need more info: the status shows who acts next.', 'workspace-status'],
    ['Reply inside the booking', 'The promoter would receive an email and return through a secure link.', 'workspace-reply'],
    ['Confirm or archive', 'Confirmation blocks the date. Archiving is optional and reversible.', 'workspace-actions']
  ],
  statuses: { new: 'New', your_reply: 'Your reply', waiting_promoter: 'Waiting for promoter', confirmed: 'Confirmed', closed: 'Closed' }
})

const activeBookings = computed(() => bookings.value.filter(item => !item.archived))
const historyBookings = computed(() => bookings.value.filter(item => item.archived))
const filteredBookings = computed(() => activeBookings.value.filter(item => filter.value === 'all' || item.status === filter.value))
const selected = computed(() => bookings.value.find(item => item.id === selectedId.value))
const confirmedBookings = computed(() => bookings.value.filter(item => item.status === 'confirmed' && !item.archived))
const counts = computed(() => Object.fromEntries(bookingStatuses.map(status => [status, activeBookings.value.filter(item => item.status === status).length])))
const currentTour = computed(() => tourStep.value >= 0 ? copy.value.tour[tourStep.value] : null)

watch(ready, value => {
  if (!value) return
  const requested = typeof route.query.booking === 'string' ? route.query.booking : ''
  selectedId.value = bookings.value.some(item => item.id === requested) ? requested : (activeBookings.value[0]?.id || '')
}, { immediate: true })

watch(tourStep, async step => {
  if (step < 0) return
  await nextTick()
  const targetId = copy.value.tour[step]?.[2]
  if (!targetId) return
  const target = document.getElementById(targetId)
  target?.scrollIntoView({ behavior: 'smooth', block: 'center' })
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

async function sendReply() {
  if (!selected.value || !reply.value.trim()) return
  await addMessage(selected.value.id, 'artist', reply.value)
  reply.value = ''
}

async function changeStatus(event: Event) {
  if (!selected.value) return
  await setStatus(selected.value.id, (event.target as HTMLSelectElement).value as BookingStatus)
}

function startTour() {
  activeView.value = 'requests'
  filter.value = 'all'
  tourStep.value = 0
}

function nextTour() {
  if (tourStep.value >= copy.value.tour.length - 1) tourStep.value = -1
  else tourStep.value += 1
}

async function archiveSelected() {
  if (!selected.value || selected.value.status !== 'confirmed') return
  await setArchived(selected.value.id, true)
  selectedId.value = ''
  activeView.value = 'history'
}

useHead(() => ({ title: locale.value === 'es' ? 'Bandeja de booking | CueBooker' : 'Booking inbox | CueBooker', htmlAttrs: { lang: locale.value } }))
</script>

<template>
  <main class="workspace-page">
    <header class="workspace-header">
      <NuxtLink to="/">CUEBOOKER<span>/</span></NuxtLink>
      <p><i /> {{ copy.prototype }}</p>
      <div class="workspace-role"><span>{{ copy.role }}</span><button :class="{ active: role === 'dj' }" @click="role = 'dj'">{{ copy.dj }}</button><button :class="{ active: role === 'manager' }" @click="role = 'manager'">{{ copy.manager }}</button></div>
      <div class="locale-control"><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div>
    </header>

    <section class="workspace-intro">
      <div><p class="eyebrow">{{ role === 'dj' ? 'NARA VOSS / BOOKING' : 'VOID AGENCY / 3 ARTISTS' }}</p><h1>{{ copy.title }}</h1><p>{{ copy.subtitle }}</p></div>
      <button class="button button--ghost guide-button" @click="startTour">{{ copy.guide }} <span>↗</span></button>
    </section>

    <nav class="workspace-nav" aria-label="Workspace">
      <button v-for="view in ['requests', 'calendar', 'history', 'settings'] as const" :key="view" :class="{ active: activeView === view }" @click="activeView = view">{{ copy.nav[view] }}<span v-if="view === 'requests'">{{ activeBookings.length }}</span><span v-if="view === 'history'">{{ historyBookings.length }}</span></button>
    </nav>

    <section v-if="activeView === 'requests'" class="workspace-content">
      <div id="workspace-filters" class="status-filters" :class="{ 'tour-focus': tourStep === 0 }">
        <button :class="{ active: filter === 'all' }" @click="filter = 'all'">{{ copy.all }} <strong>{{ activeBookings.length }}</strong></button>
        <button v-for="status in bookingStatuses.filter(item => item !== 'closed')" :key="status" :class="[{ active: filter === status }, `tone-${statusTone[status]}`]" @click="filter = status"><i />{{ copy.statuses[status] }} <strong>{{ counts[status] }}</strong></button>
      </div>

      <div class="booking-workspace">
        <div id="workspace-list" class="booking-list" :class="{ 'tour-focus': tourStep === 1 }">
          <button v-for="booking in filteredBookings" :key="booking.id" :class="{ active: selectedId === booking.id }" @click="selectedId = selectedId === booking.id ? '' : booking.id">
            <span class="booking-list__date">{{ formatDate(booking.event.date) }}</span>
            <span><strong>{{ booking.event.venue }}</strong><small>{{ booking.artistName }} · {{ booking.event.city }}</small></span>
            <span :class="`status-pill tone-${statusTone[booking.status]}`"><i />{{ copy.statuses[booking.status] }}</span>
          </button>
          <p v-if="!filteredBookings.length" class="workspace-empty">{{ copy.empty }}</p>
        </div>

        <article v-if="selected" class="booking-detail">
          <header>
            <div><p class="eyebrow">BOOKING / {{ selected.id.slice(-8).toUpperCase() }}</p><h2>{{ selected.event.venue }}</h2><p>{{ selected.event.name }} · {{ selected.artistName }}</p></div>
            <label id="workspace-status" :class="{ 'tour-focus': tourStep === 2 }"><span>{{ copy.status }}</span><select :value="selected.status" @change="changeStatus"><option v-for="status in bookingStatuses" :key="status" :value="status">{{ copy.statuses[status] }}</option></select></label>
          </header>

          <div class="booking-facts">
            <section><h3>{{ copy.event }}</h3><dl><div><dt>{{ copy.facts.date }}</dt><dd>{{ formatDate(selected.event.date) }}</dd></div><div><dt>{{ copy.facts.city }}</dt><dd>{{ selected.event.city }}</dd></div><div><dt>{{ copy.facts.venue }}</dt><dd>{{ selected.event.venue }}</dd></div><div><dt>{{ copy.facts.capacity }}</dt><dd>{{ selected.event.capacity }}</dd></div><div><dt>{{ copy.facts.offer }}</dt><dd>{{ selected.event.offer }}</dd></div><div><dt>{{ copy.facts.schedule }}</dt><dd>{{ selected.event.schedule || '—' }}</dd></div></dl></section>
            <section><h3>{{ copy.contact }}</h3><dl><div><dt>{{ copy.facts.name }}</dt><dd>{{ selected.promoter.name }}</dd></div><div><dt>{{ copy.facts.email }}</dt><dd>{{ selected.promoter.email }}</dd></div><div v-if="selected.promoter.phone"><dt>{{ copy.facts.phone }}</dt><dd>{{ selected.promoter.phone }}</dd></div><div><dt>{{ copy.facts.source }}</dt><dd>{{ copy.facts.sourceValue }}</dd></div></dl></section>
          </div>

          <section class="message-thread"><h3>{{ copy.conversation }}</h3><article v-for="message in selected.messages" :key="message.id" :class="`message message--${message.actor}`"><header><strong>{{ message.actor === 'artist' ? selected.artistName : selected.promoter.name }}</strong><time>{{ formatTime(message.createdAt) }}</time></header><p>{{ message.body }}</p><a v-for="file in message.attachments" :key="file.id" href="#" @click.prevent>↳ {{ copy.attachment }} · {{ file.name }}</a></article></section>

          <form id="workspace-reply" class="booking-reply" :class="{ 'tour-focus': tourStep === 3 }" @submit.prevent="sendReply"><label>{{ copy.reply }}<textarea v-model="reply" rows="5" :placeholder="copy.replyPlaceholder" /></label><p>{{ copy.emailNote }}</p><button class="button button--primary" :disabled="!reply.trim()">{{ copy.send }} <span>↗</span></button></form>

          <footer id="workspace-actions" class="booking-actions" :class="{ 'tour-focus': tourStep === 4 }"><NuxtLink class="button button--ghost" :to="`/request?id=${selected.id}`">{{ copy.promoterView }} <span>↗</span></NuxtLink><button v-if="selected.status !== 'confirmed'" class="button button--primary" @click="setStatus(selected.id, 'confirmed')">{{ copy.confirm }} <span>✓</span></button><button v-else class="archive-action" @click="archiveSelected">{{ copy.archive }}</button></footer>
        </article>
        <div v-else class="booking-placeholder"><span>↳</span><p>{{ copy.choose }}</p></div>
      </div>
    </section>

    <section v-else-if="activeView === 'calendar'" class="workspace-panel"><p class="eyebrow">{{ copy.facts.calendar }}</p><h2>{{ copy.calendarTitle }}</h2><p>{{ copy.calendarBody }}</p><div class="calendar-list"><article v-for="booking in confirmedBookings" :key="booking.id"><time>{{ formatDate(booking.event.date) }}</time><strong>{{ booking.event.venue }}</strong><span>{{ booking.event.city }} · {{ booking.artistName }}</span></article></div></section>

    <section v-else-if="activeView === 'history'" class="workspace-panel"><p class="eyebrow">{{ copy.facts.archiveLabel }}</p><h2>{{ copy.historyTitle }}</h2><p>{{ copy.historyBody }}</p><div class="history-list"><article v-for="booking in historyBookings" :key="booking.id"><div><strong>{{ booking.event.venue }}</strong><span>{{ formatDate(booking.event.date) }} · {{ booking.artistName }}</span></div><NuxtLink :to="`/request?id=${booking.id}`">{{ copy.openThread }}</NuxtLink><button @click="setArchived(booking.id, false)">{{ copy.restore }}</button></article></div></section>

    <section v-else class="workspace-panel"><p class="eyebrow">{{ copy.facts.device }}</p><h2>{{ copy.settingsTitle }}</h2><p>{{ copy.settingsBody }}</p><div class="settings-row"><span>{{ copy.facts.language }}</span><div class="locale-control"><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div></div><div class="settings-row"><span>{{ copy.facts.appearance }}</span><div class="theme-control"><button v-for="value in ['dark', 'light'] as const" :key="value" :class="{ active: theme === value }" @click="setTheme(value)">{{ value.toUpperCase() }}</button></div></div></section>

    <div v-if="currentTour" class="tour-layer" role="dialog" aria-live="polite"><button class="tour-close" @click="tourStep = -1">×<span class="sr-only">{{ copy.close }}</span></button><span class="mono">{{ String(tourStep + 1).padStart(2, '0') }} / {{ String(copy.tour.length).padStart(2, '0') }}</span><strong>{{ currentTour[0] }}</strong><p>{{ currentTour[1] }}</p><button class="button button--primary" @click="nextTour">{{ tourStep === copy.tour.length - 1 ? copy.finish : copy.next }} <span>↗</span></button></div>
  </main>
</template>
