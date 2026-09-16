<script setup lang="ts">
import { bookingStatuses, statusTone, type BookingStatus } from '../domain/booking'

const route = useRoute()
const { locale, theme, setLocale, setTheme } = useCuePreferences()
const { bookings, ready, setStatus, markOpened, addMessage, setArchived } = useBookingDemo()
const activeView = ref<'requests' | 'calendar' | 'history' | 'settings'>('requests')
const role = ref<'dj' | 'manager'>('dj')
const filter = ref<'all' | BookingStatus>('all')
const selectedId = ref('')
const reply = ref('')
const tourStep = ref(-1)
const monthCursor = ref('2026-10-01')

const copy = computed(() => locale.value === 'es' ? {
  prototype: 'DEMO FUNCIONAL · DATOS EN ESTE NAVEGADOR', role: 'Vista', dj: 'DJ', manager: 'Manager',
  nav: { requests: 'Solicitudes', calendar: 'Calendario', history: 'Historial', settings: 'Ajustes' },
  title: 'Tu siguiente acción, sin buscarla.', subtitle: 'Cada solicitud conserva los datos, la conversación y quién debe responder ahora.',
  originLabel: 'DEMO / SOLICITUD RECIBIDA', originTitle: 'Así llega un booking al panel del DJ.', originBody: 'Esta solicitud de ejemplo llegó desde el enlace público o widget del artista. El promotor completa los datos una vez y el DJ los recibe aquí con su estado, conversación y fecha.', originLink: 'Ver el enlace que la generó',
  all: 'Todas', empty: 'No hay solicitudes en este estado.', choose: 'Abre una solicitud para ver el hilo completo.', status: 'Estado automático', contact: 'Contacto', event: 'Datos del evento', conversation: 'Conversación', reply: 'Responder al promotor', replyPlaceholder: 'Escribe condiciones, una pregunta o una propuesta…', send: 'Enviar respuesta', emailNote: 'El estado solo cambiará a “Esperando al promotor” cuando envíes esta respuesta.', promoterView: 'Abrir vista del promotor', openThread: 'Ver conversación completa', confirm: 'Confirmar fecha', reject: 'Rechazar solicitud', archive: 'Archivar booking', restore: 'Devolver a solicitudes', attachment: 'Adjunto',
  calendarTitle: 'Tu agenda de booking', calendarBody: 'Consulta el mes completo, las horas y los compromisos provisionales antes de confirmar otra fecha.', calendarConflict: 'Posible solapamiento', calendarConflictBody: 'Revisa estos horarios antes de confirmar. CueBooker no bloquea una decisión sin avisarte.', calendarClear: 'Sin solapamientos detectados este mes.', manualBlock: 'Bloqueo manual', previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente', historyTitle: 'Historial', historyBody: 'Consultas cerradas que puedes volver a abrir si te equivocaste.', settingsTitle: 'Preferencias de la demo', settingsBody: 'Idioma y apariencia se conservan en este dispositivo.',
  guide: 'Ver recorrido guiado', next: 'Siguiente', finish: 'Terminar', close: 'Cerrar',
  facts: { date: 'Fecha', city: 'Ciudad', venue: 'Sala', capacity: 'Aforo', offer: 'Oferta', schedule: 'Horario', name: 'Nombre', email: 'Email', phone: 'Tel.', source: 'Origen', sourceValue: 'Enlace de booking', language: 'Idioma', appearance: 'Apariencia', calendar: 'CALENDARIO / PRIVADO', archiveLabel: 'ARCHIVO / REVERSIBLE', device: 'DISPOSITIVO / PREFERENCIAS' },
  tour: [
    ['Una bandeja accionable', 'Empieza viendo únicamente las solicitudes activas y cuántas requieren atención.', 'workspace-filters'],
    ['Abre una solicitud', 'Al seleccionar una fila aparecen los datos y el mensaje original del promotor.', 'workspace-list'],
    ['Los estados se actualizan solos', 'Al abrir pasa a En revisión. Solo cambia a Esperando al promotor cuando envías una respuesta.', 'workspace-status'],
    ['Responde desde el booking', 'Al enviar, el promotor recibiría el mensaje por email y el estado se actualizaría automáticamente.', 'workspace-reply'],
    ['Tú solo decides el resultado', 'Confirmar y rechazar son las únicas decisiones manuales del flujo.', 'workspace-actions']
  ],
  statuses: { new: 'Nueva', in_review: 'En revisión', waiting_promoter: 'Esperando al promotor', confirmed: 'Confirmada', rejected: 'Rechazada' }
} : {
  prototype: 'FUNCTIONAL DEMO · DATA ON THIS DEVICE', role: 'View', dj: 'DJ', manager: 'Manager',
  nav: { requests: 'Requests', calendar: 'Calendar', history: 'History', settings: 'Settings' },
  title: 'Your next action, without searching.', subtitle: 'Every request keeps its details, conversation and the person who needs to respond next.',
  originLabel: 'DEMO / REQUEST RECEIVED', originTitle: 'This is how a booking reaches the DJ workspace.', originBody: 'This sample request came from the artist’s public link or widget. The promoter enters the details once and the DJ receives them here with the status, conversation and date.', originLink: 'View the link that generated it',
  all: 'All', empty: 'No requests in this state.', choose: 'Open a request to see the complete thread.', status: 'Automatic status', contact: 'Contact', event: 'Event details', conversation: 'Conversation', reply: 'Reply to promoter', replyPlaceholder: 'Write conditions, a question or a proposal…', send: 'Send reply', emailNote: 'The status changes to “Waiting for promoter” only after you send this reply.', promoterView: 'Open promoter view', openThread: 'View full conversation', confirm: 'Confirm date', reject: 'Reject request', archive: 'Archive booking', restore: 'Return to requests', attachment: 'Attachment',
  calendarTitle: 'Your booking schedule', calendarBody: 'See the full month, times and provisional commitments before confirming another date.', calendarConflict: 'Possible overlap', calendarConflictBody: 'Review these times before confirming. CueBooker warns you without blocking your decision.', calendarClear: 'No overlaps detected this month.', manualBlock: 'Manual block', previousMonth: 'Previous month', nextMonth: 'Next month', historyTitle: 'History', historyBody: 'Closed enquiries you can reopen if needed.', settingsTitle: 'Demo preferences', settingsBody: 'Language and appearance are stored on this device.',
  guide: 'Start guided tour', next: 'Next', finish: 'Finish', close: 'Close',
  facts: { date: 'Date', city: 'City', venue: 'Venue', capacity: 'Capacity', offer: 'Offer', schedule: 'Schedule', name: 'Name', email: 'Email', phone: 'Phone', source: 'Source', sourceValue: 'Booking link', language: 'Language', appearance: 'Appearance', calendar: 'CALENDAR / PRIVATE', archiveLabel: 'ARCHIVE / REVERSIBLE', device: 'DEVICE / PREFERENCES' },
  tour: [
    ['An actionable inbox', 'Start with active requests and a clear count of what needs attention.', 'workspace-filters'],
    ['Open a request', 'Selecting a row reveals the promoter’s original details and message.', 'workspace-list'],
    ['Statuses update automatically', 'Opening moves it to In review. It changes to Waiting for promoter only after you send a reply.', 'workspace-status'],
    ['Reply inside the booking', 'On send, the promoter would receive an email and the status would update automatically.', 'workspace-reply'],
    ['You only decide the outcome', 'Confirm and reject are the only manual decisions in the flow.', 'workspace-actions']
  ],
  statuses: { new: 'New', in_review: 'In review', waiting_promoter: 'Waiting for promoter', confirmed: 'Confirmed', rejected: 'Rejected' }
})

const activeBookings = computed(() => bookings.value.filter(item => !item.archived))
const historyBookings = computed(() => bookings.value.filter(item => item.archived))
const filteredBookings = computed(() => activeBookings.value.filter(item => filter.value === 'all' || item.status === filter.value))
const selected = computed(() => bookings.value.find(item => item.id === selectedId.value))
const confirmedBookings = computed(() => bookings.value.filter(item => item.status === 'confirmed' && !item.archived))
const counts = computed(() => Object.fromEntries(bookingStatuses.map(status => [status, activeBookings.value.filter(item => item.status === status).length])))
const currentTour = computed(() => tourStep.value >= 0 ? copy.value.tour[tourStep.value] : null)
const weekdayLabels = computed(() => locale.value === 'es' ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])

type CalendarItem = { id: string, title: string, artist: string, date: string, start: string, end: string, status: BookingStatus | 'manual' }

function scheduleParts(schedule: string) {
  const matches = schedule.match(/(\d{1,2}):(\d{2})\s*[–—-]\s*(\d{1,2}):(\d{2})/)
  if (!matches) return { start: '00:00', end: '23:59' }
  return { start: `${(matches[1] ?? '0').padStart(2, '0')}:${matches[2] ?? '00'}`, end: `${(matches[3] ?? '23').padStart(2, '0')}:${matches[4] ?? '59'}` }
}

const calendarItems = computed<CalendarItem[]>(() => {
  const bookingItems = activeBookings.value.map((booking) => {
    const hours = scheduleParts(booking.event.schedule || '')
    return { id: booking.id, title: booking.event.venue, artist: booking.artistName, date: booking.event.date, start: hours.start, end: hours.end, status: booking.status }
  })
  return [...bookingItems, { id: 'manual-studio', title: copy.value.manualBlock, artist: 'Nara Voss', date: '2026-10-22', start: '01:30', end: '03:30', status: 'manual' as const }]
})

const monthLabel = computed(() => new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${monthCursor.value}T12:00:00Z`)))

const monthCells = computed(() => {
  const cursor = new Date(`${monthCursor.value}T12:00:00Z`)
  const year = cursor.getUTCFullYear()
  const month = cursor.getUTCMonth()
  const first = new Date(Date.UTC(year, month, 1, 12))
  const mondayOffset = (first.getUTCDay() + 6) % 7
  const start = new Date(first)
  start.setUTCDate(first.getUTCDate() - mondayOffset)
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setUTCDate(start.getUTCDate() + index)
    const date = day.toISOString().slice(0, 10)
    return { date, number: day.getUTCDate(), current: day.getUTCMonth() === month, items: calendarItems.value.filter(item => item.date === date) }
  })
})

const calendarConflicts = computed(() => {
  const conflicts: Array<{ id: string, date: string, first: CalendarItem, second: CalendarItem }> = []
  calendarItems.value.forEach((first, index) => {
    calendarItems.value.slice(index + 1).forEach((second) => {
      if (first.date !== second.date || first.status === 'rejected' || second.status === 'rejected') return
      if (first.start < second.end && second.start < first.end) conflicts.push({ id: `${first.id}-${second.id}`, date: first.date, first, second })
    })
  })
  return conflicts
})

watch(ready, value => {
  if (!value) return
  const requested = typeof route.query.booking === 'string' ? route.query.booking : ''
  selectedId.value = bookings.value.some(item => item.id === requested) ? requested : (activeBookings.value[0]?.id || '')
}, { immediate: true })

watch(selectedId, async (id) => {
  if (!id) return
  await markOpened(id)
})

watch(tourStep, async step => {
  if (step < 0) return
  await nextTick()
  const targetId = copy.value.tour[step]?.[2]
  if (!targetId) return
  const target = document.getElementById(targetId)
  if (!target) return

  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  const isMobile = window.matchMedia('(max-width: 860px)').matches
  if (!isMobile) {
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  const targetTop = window.scrollY + target.getBoundingClientRect().top
  window.scrollTo({ top: Math.max(0, targetTop - 84), behavior: 'smooth' })
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

async function selectBooking(bookingId: string) {
  const nextId = selectedId.value === bookingId ? '' : bookingId
  selectedId.value = nextId
  if (!nextId) return

  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  const detail = document.getElementById(`booking-detail-${nextId}`)
  if (!detail) return
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  detail.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
  detail.focus({ preventScroll: true })
}

async function sendReply() {
  if (!selected.value || !reply.value.trim()) return
  await addMessage(selected.value.id, 'artist', reply.value)
  reply.value = ''
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

function changeMonth(offset: number) {
  const date = new Date(`${monthCursor.value}T12:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + offset)
  monthCursor.value = date.toISOString().slice(0, 7) + '-01'
}

async function archiveSelected() {
  if (!selected.value || selected.value.status !== 'confirmed') return
  await setArchived(selected.value.id, true)
  selectedId.value = ''
  activeView.value = 'history'
}

async function rejectSelected() {
  if (!selected.value) return
  await setStatus(selected.value.id, 'rejected')
  selectedId.value = activeBookings.value[0]?.id || ''
}

useHead(() => ({ title: locale.value === 'es' ? 'Bandeja de booking | CueBooker' : 'Booking inbox | CueBooker', htmlAttrs: { lang: locale.value } }))
</script>

<template>
  <main class="workspace-page">
    <header class="workspace-header">
      <NuxtLink class="brand" to="/" aria-label="Cuebooker"><CueBrand /></NuxtLink>
      <p><i /> {{ copy.prototype }}</p>
      <div class="workspace-role"><span>{{ copy.role }}</span><button :class="{ active: role === 'dj' }" @click="role = 'dj'">{{ copy.dj }}</button><button :class="{ active: role === 'manager' }" @click="role = 'manager'">{{ copy.manager }}</button></div>
      <div class="locale-control"><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div>
    </header>

    <section class="workspace-intro">
      <div><p class="eyebrow">{{ role === 'dj' ? 'NARA VOSS / BOOKING' : 'VOID AGENCY / 3 ARTISTS' }}</p><h1>{{ copy.title }}</h1><p>{{ copy.subtitle }}</p></div>
      <button class="button button--ghost guide-button" @click="startTour">{{ copy.guide }} <span class="arrow arrow--ne" aria-hidden="true" /></button>
    </section>

    <aside class="workspace-origin">
      <div>
        <span class="mono">{{ copy.originLabel }}</span>
        <strong>{{ copy.originTitle }}</strong>
        <p>{{ copy.originBody }}</p>
      </div>
      <NuxtLink class="workspace-origin__link" to="/artist">{{ copy.originLink }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink>
    </aside>

    <nav class="workspace-nav" aria-label="Workspace">
      <button v-for="view in ['requests', 'calendar', 'history', 'settings'] as const" :key="view" :class="{ active: activeView === view }" @click="activeView = view">{{ copy.nav[view] }}<span v-if="view === 'requests'">{{ activeBookings.length }}</span><span v-if="view === 'history'">{{ historyBookings.length }}</span></button>
    </nav>

    <section v-if="activeView === 'requests'" class="workspace-content">
      <div id="workspace-filters" class="status-filters" :class="{ 'tour-focus': tourStep === 0 }">
        <button :class="{ active: filter === 'all' }" @click="filter = 'all'">{{ copy.all }} <strong>{{ activeBookings.length }}</strong></button>
        <button v-for="status in bookingStatuses.filter(item => item !== 'rejected')" :key="status" :class="[{ active: filter === status }, `tone-${statusTone[status]}`]" @click="filter = status"><i />{{ copy.statuses[status] }} <strong>{{ counts[status] }}</strong></button>
      </div>

      <div class="booking-workspace">
        <div id="workspace-list" class="booking-list" :class="{ 'tour-focus': tourStep === 1 }">
          <button v-for="booking in filteredBookings" :key="booking.id" :class="{ active: selectedId === booking.id }" @click="selectBooking(booking.id)">
            <span class="booking-list__date">{{ formatDate(booking.event.date) }}</span>
            <span><strong>{{ booking.event.venue }}</strong><small>{{ booking.artistName }} · {{ booking.event.city }}</small></span>
            <span :class="`status-pill tone-${statusTone[booking.status]}`"><i />{{ copy.statuses[booking.status] }}</span>
          </button>
          <p v-if="!filteredBookings.length" class="workspace-empty">{{ copy.empty }}</p>
        </div>

        <article v-if="selected" :id="`booking-detail-${selected.id}`" class="booking-detail" tabindex="-1">
          <header>
            <div><p class="eyebrow">BOOKING / {{ selected.id.slice(-8).toUpperCase() }}</p><h2>{{ selected.event.venue }}</h2><p>{{ selected.event.name }} · {{ selected.artistName }}</p></div>
            <div id="workspace-status" class="booking-status-display" :class="[{ 'tour-focus': tourStep === 2 }, `tone-${statusTone[selected.status]}`]"><span>{{ copy.status }}</span><strong><i />{{ copy.statuses[selected.status] }}</strong></div>
          </header>

          <div class="booking-facts">
            <section><h3>{{ copy.event }}</h3><dl><div><dt>{{ copy.facts.date }}</dt><dd>{{ formatDate(selected.event.date) }}</dd></div><div><dt>{{ copy.facts.city }}</dt><dd>{{ selected.event.city }}</dd></div><div><dt>{{ copy.facts.venue }}</dt><dd>{{ selected.event.venue }}</dd></div><div><dt>{{ copy.facts.capacity }}</dt><dd>{{ selected.event.capacity }}</dd></div><div><dt>{{ copy.facts.offer }}</dt><dd>{{ selected.event.offer }}</dd></div><div><dt>{{ copy.facts.schedule }}</dt><dd>{{ selected.event.schedule || '—' }}</dd></div></dl></section>
            <section><h3>{{ copy.contact }}</h3><dl><div><dt>{{ copy.facts.name }}</dt><dd>{{ selected.promoter.name }}</dd></div><div><dt>{{ copy.facts.email }}</dt><dd>{{ selected.promoter.email }}</dd></div><div v-if="selected.promoter.phone"><dt>{{ copy.facts.phone }}</dt><dd>{{ selected.promoter.phone }}</dd></div><div><dt>{{ copy.facts.source }}</dt><dd>{{ copy.facts.sourceValue }}</dd></div></dl></section>
          </div>

          <section class="message-thread"><h3>{{ copy.conversation }}</h3><article v-for="message in selected.messages" :key="message.id" :class="`message message--${message.actor}`"><header><strong>{{ message.actor === 'artist' ? selected.artistName : selected.promoter.name }}</strong><time>{{ formatTime(message.createdAt) }}</time></header><p>{{ message.body }}</p><a v-for="file in message.attachments" :key="file.id" href="#" @click.prevent><span class="arrow arrow--right" aria-hidden="true" /> {{ copy.attachment }} · {{ file.name }}</a></article></section>

          <form id="workspace-reply" class="booking-reply" :class="{ 'tour-focus': tourStep === 3 }" @submit.prevent="sendReply"><label>{{ copy.reply }}<textarea v-model="reply" rows="5" :placeholder="copy.replyPlaceholder" /></label><p>{{ copy.emailNote }}</p><button class="button button--primary" :disabled="!reply.trim()">{{ copy.send }} <span class="arrow arrow--ne" aria-hidden="true" /></button></form>

          <footer id="workspace-actions" class="booking-actions" :class="{ 'tour-focus': tourStep === 4 }"><NuxtLink class="button button--ghost" :to="`/request?id=${selected.id}`">{{ copy.promoterView }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink><button v-if="selected.status !== 'confirmed'" class="button button--primary" @click="setStatus(selected.id, 'confirmed')">{{ copy.confirm }} <span>✓</span></button><button v-if="selected.status !== 'confirmed'" class="button button--danger" @click="rejectSelected">{{ copy.reject }}</button><button v-else class="archive-action" @click="archiveSelected">{{ copy.archive }}</button></footer>
        </article>
        <div v-else class="booking-placeholder"><span><i class="arrow arrow--right" aria-hidden="true" /></span><p>{{ copy.choose }}</p></div>
      </div>
    </section>

    <section v-else-if="activeView === 'calendar'" class="workspace-panel calendar-panel">
      <p class="eyebrow">{{ copy.facts.calendar }}</p><h2>{{ copy.calendarTitle }}</h2><p>{{ copy.calendarBody }}</p>
      <div v-if="calendarConflicts.length" class="calendar-alert" role="alert"><span>!</span><div><strong>{{ copy.calendarConflict }}</strong><p>{{ copy.calendarConflictBody }}</p><ul><li v-for="conflict in calendarConflicts" :key="conflict.id"><b>{{ formatDate(conflict.date) }}</b> · {{ conflict.first.start }}–{{ conflict.first.end }} {{ conflict.first.title }} / {{ conflict.second.start }}–{{ conflict.second.end }} {{ conflict.second.title }}</li></ul></div></div>
      <p v-else class="calendar-clear">{{ copy.calendarClear }}</p>
      <div class="month-calendar">
        <header><button :aria-label="copy.previousMonth" @click="changeMonth(-1)">‹</button><strong>{{ monthLabel }}</strong><button :aria-label="copy.nextMonth" @click="changeMonth(1)">›</button></header>
        <div class="month-calendar__weekdays"><span v-for="day in weekdayLabels" :key="day">{{ day }}</span></div>
        <div class="month-calendar__grid"><article v-for="cell in monthCells" :key="cell.date" :class="{ muted: !cell.current, busy: cell.items.length }"><time :datetime="cell.date">{{ cell.number }}</time><div><button v-for="item in cell.items" :key="item.id" :class="`calendar-event calendar-event--${item.status}`" :title="`${item.start}–${item.end} · ${item.title}`" @click="item.status !== 'manual' && (selectedId = item.id, activeView = 'requests')"><span>{{ item.start }}</span><strong>{{ item.title }}</strong></button></div></article></div>
      </div>
      <div class="calendar-list"><article v-for="item in calendarItems" :key="item.id"><time>{{ formatDate(item.date) }}</time><strong>{{ item.title }}</strong><span>{{ item.start }}–{{ item.end }} · {{ item.artist }} · {{ item.status === 'manual' ? copy.manualBlock : copy.statuses[item.status] }}</span></article></div>
    </section>

    <section v-else-if="activeView === 'history'" class="workspace-panel"><p class="eyebrow">{{ copy.facts.archiveLabel }}</p><h2>{{ copy.historyTitle }}</h2><p>{{ copy.historyBody }}</p><div class="history-list"><article v-for="booking in historyBookings" :key="booking.id"><div><strong>{{ booking.event.venue }}</strong><span>{{ formatDate(booking.event.date) }} · {{ booking.artistName }}</span></div><NuxtLink :to="`/request?id=${booking.id}`">{{ copy.openThread }}</NuxtLink><button @click="setArchived(booking.id, false)">{{ copy.restore }}</button></article></div></section>

    <section v-else class="workspace-panel"><p class="eyebrow">{{ copy.facts.device }}</p><h2>{{ copy.settingsTitle }}</h2><p>{{ copy.settingsBody }}</p><div class="settings-row"><span>{{ copy.facts.language }}</span><div class="locale-control"><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div></div><div class="settings-row"><span>{{ copy.facts.appearance }}</span><div class="theme-control"><button v-for="value in ['dark', 'light'] as const" :key="value" :class="{ active: theme === value }" @click="setTheme(value)">{{ value.toUpperCase() }}</button></div></div></section>

    <div v-if="currentTour" class="tour-layer" role="dialog" aria-live="polite"><button class="tour-close" @click="tourStep = -1">×<span class="sr-only">{{ copy.close }}</span></button><span class="mono">{{ String(tourStep + 1).padStart(2, '0') }} / {{ String(copy.tour.length).padStart(2, '0') }}</span><strong>{{ currentTour[0] }}</strong><p>{{ currentTour[1] }}</p><button class="button button--primary" @click="nextTour">{{ tourStep === copy.tour.length - 1 ? copy.finish : copy.next }} <span class="arrow arrow--ne" aria-hidden="true" /></button></div>
  </main>
</template>
