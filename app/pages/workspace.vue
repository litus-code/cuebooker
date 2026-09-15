<script setup lang="ts">
import { bookingStatuses, statusTone, type BookingStatus } from '../domain/booking'

const auth = useCueAuth()
const availability = useAvailability()
const preferences = useCuePreferences()

type WorkspaceView = 'overview' | 'bookings' | 'calendar' | 'history'
type ManagedArtist = { id: string; stage_name: string; slug: string; role: 'owner' | 'manager' | 'editor' }
type ManagedOrganization = { id: string; name: string; slug: string; type: 'agency' | 'promoter'; role: 'owner' | 'admin' | 'member' }

const activeView = ref<WorkspaceView>('overview')
const artists = ref<ManagedArtist[]>([])
const organizations = ref<ManagedOrganization[]>([])
const selectedArtistId = ref('')
const blocks = ref<AvailabilityBlock[]>([])
const monthCursor = ref(new Date().toISOString().slice(0, 7) + '-01')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const editorOpen = ref(false)
const startTime = ref('18:00')
const endTime = ref('20:00')
const blockStatus = ref<AvailabilityStatus>('unavailable')
const blockLabel = ref('')
const editingBlockId = ref<string | null>(null)
const rosterArtistName = ref('')
const rosterArtistSlug = ref('')
const rosterSubmitting = ref(false)
const bookingFilter = ref<'all' | BookingStatus>('all')
const selectedDemoBookingId = ref('')
const demoReply = ref('')
const tourStep = ref(-1)
const settingsOpen = ref(false)
const passwordCurrent = ref('')
const passwordNew = ref('')
const passwordConfirm = ref('')
const passwordSaving = ref(false)
const passwordMessage = ref('')

const copy = computed(() => preferences.locale.value === 'es' ? {
  overview: 'Resumen', bookings: 'Bookings', calendar: 'Calendario', history: 'Historial',
  artist: 'Artista', role: 'DJ', settings: 'Ajustes', logout: 'Cerrar sesión',
  loading: 'Cargando workspace…', rosterEyebrow: 'ROSTER / PRIMER ARTISTA', addFirstArtist: 'Añade el primer artista de',
  rosterBody: 'Quedará asociado al roster y podrás empezar a gestionar su actividad.', artistName: 'Nombre artístico', identifier: 'Identificador', creating: 'Creando…', addArtist: 'Añadir artista',
  noArtist: 'No hay un artista gestionable en esta cuenta.', noArtistBody: 'Tu cuenta todavía no tiene un artista o roster asignado.',
  overviewEyebrow: 'WORKSPACE / RESUMEN', overviewTitle: 'QUÉ NECESITA TU ATENCIÓN.', overviewBody: 'Una entrada rápida a los bookings y fechas del artista, sin convertir el calendario en todo el producto.',
  realBookings: 'Bookings reales', realBookingsBody: 'Aún sin conectar. La bandeja completa está disponible con ejemplos.', holdsMonth: 'Holds este mes', holdsBody: 'Fechas pendientes de decisión.', confirmed: 'Confirmados', confirmedStatus: 'Confirmado', confirmedBody: 'Horarios confirmados este mes.', occupiedDays: 'Días ocupados', occupiedBody: 'Con al menos un horario registrado.',
  agendaEyebrow: 'AGENDA / ESTE MES', upcoming: 'Próximos horarios', viewCalendar: 'Ver calendario', privateSlot: 'Horario privado', noUpcoming: 'No hay horarios próximos registrados en este mes.', addSlot: 'Añadir horario',
  sampleEyebrow: 'BOOKINGS / MODO PRUEBA', sampleTitle: 'PRUEBA LA BANDEJA COMPLETA.', sampleBody: 'Las solicitudes reales todavía no están conectadas a esta cuenta. Puedes probar ahora los filtros, ofertas, conversaciones y cambios de estado con datos simulados.', openBookings: 'Abrir Bookings',
  bookingsEyebrow: 'BOOKINGS / BANDEJA', bookingsTitle: 'TODOS TUS BOOKINGS. UN SOLO HILO.',
  bookingsBody: 'Revisa cada propuesta, responde al promotor y decide la fecha sin perder el contexto.',
  samplesLabel: 'EJEMPLOS INICIALES / DATOS SIMULADOS', samplesActive: 'Tu workspace empieza con solicitudes de muestra.', samplesRemoved: 'Has eliminado las solicitudes de muestra.', samplesBody: 'Los ejemplos pertenecen únicamente a este perfil y navegador. No modifican el calendario privado y puedes retirarlos cuando quieras.', guidedTour: 'Ver recorrido guiado', removeSamples: 'Eliminar ejemplos', restoreSamples: 'Restaurar ejemplos', all: 'Todas', noSamples: 'No hay solicitudes de prueba en este estado.',
  sampleBooking: 'BOOKING DE PRUEBA', automaticStatus: 'Estado automático', eventData: 'Datos del evento', date: 'Fecha', city: 'Ciudad', venue: 'Sala', capacity: 'Aforo', offer: 'Oferta', schedule: 'Horario', contact: 'Contacto', name: 'Nombre', phone: 'Tel.', source: 'Origen', bookingLink: 'Enlace de booking', conversation: 'Conversación', replyPromoter: 'Responder al promotor', replyPlaceholder: 'Escribe condiciones, una pregunta o una propuesta…', localMessage: 'Ejemplo local. El mensaje no se envía por email.', sendSampleReply: 'Enviar respuesta de ejemplo', openPromoter: 'Abrir vista del promotor', confirmDate: 'Confirmar fecha', rejectRequest: 'Rechazar solicitud', openRequest: 'Abre una solicitud para ver sus datos, la oferta y la conversación.',
  calendarEyebrow: 'CALENDARIO / DISPONIBILIDAD', calendarTitle: 'FECHAS Y HORARIOS.', calendarBody: 'Abre un día para ver sus 24 horas. Pulsa una hora vacía para crear un horario o un bloque existente para editarlo.', weekdays: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'], unavailable: 'No disponible', dayHours: 'DÍA / 24 HORAS', add: 'Añadir', selectedDaySchedule: 'Horario del día seleccionado', addAt: 'Añadir horario a las',
  historyEyebrow: 'WORKSPACE / HISTORIAL', historyTitle: 'TODO LO QUE HA PASADO.',
  historyBody: 'Abre cualquier movimiento para volver a la oferta y revisar toda la conversación que originó esa acción.',
  historyEmpty: 'Todavía no hay actividad en este perfil.', historyStatus: 'Estado actualizado', historyMessage: 'Mensaje', openTrace: 'Abrir oferta y ver traza', previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente', filterSamples: 'Filtrar bookings de ejemplo',
  settingsTitle: 'Ajustes de cuenta', appearance: 'Apariencia', dark: 'Oscuro', light: 'Claro',
  language: 'Idioma', password: 'Cambiar contraseña', currentPassword: 'Contraseña actual',
  newPassword: 'Nueva contraseña', confirmPassword: 'Repetir contraseña', savePassword: 'Guardar contraseña',
  passwordSaved: 'Contraseña actualizada.', passwordMismatch: 'Las contraseñas nuevas no coinciden.',
  passwordLength: 'La nueva contraseña debe tener al menos 8 caracteres.', close: 'Cerrar', accountPrivate: 'CUENTA / PRIVADO',
  editSlot: 'EDITAR HORARIO', newSlot: 'NUEVO HORARIO', privateLabel: 'Etiqueta privada', privatePlaceholder: 'Estudio, desplazamiento, evento…', start: 'Inicio', end: 'Fin', invalidTime: 'La hora de fin debe ser posterior a la hora de inicio.', status: 'Estado', saving: 'Guardando…', saveChanges: 'Guardar cambios', createSlot: 'Crear horario', deleteSlot: 'Eliminar horario', finish: 'Terminar', next: 'Siguiente', closeTour: 'Cerrar recorrido'
} : {
  overview: 'Overview', bookings: 'Bookings', calendar: 'Calendar', history: 'History',
  artist: 'Artist', role: 'DJ', settings: 'Settings', logout: 'Sign out',
  loading: 'Loading workspace…', rosterEyebrow: 'ROSTER / FIRST ARTIST', addFirstArtist: 'Add the first artist for',
  rosterBody: 'They will be linked to the roster so you can start managing their activity.', artistName: 'Artist name', identifier: 'Identifier', creating: 'Creating…', addArtist: 'Add artist',
  noArtist: 'There is no manageable artist in this account.', noArtistBody: 'Your account does not have an assigned artist or roster yet.',
  overviewEyebrow: 'WORKSPACE / OVERVIEW', overviewTitle: 'WHAT NEEDS YOUR ATTENTION.', overviewBody: 'A quick view of the artist’s bookings and dates without making the calendar the whole product.',
  realBookings: 'Real bookings', realBookingsBody: 'Not connected yet. The complete inbox is available with examples.', holdsMonth: 'Holds this month', holdsBody: 'Dates waiting for a decision.', confirmed: 'Confirmed', confirmedStatus: 'Confirmed', confirmedBody: 'Confirmed slots this month.', occupiedDays: 'Occupied days', occupiedBody: 'With at least one registered slot.',
  agendaEyebrow: 'AGENDA / THIS MONTH', upcoming: 'Upcoming slots', viewCalendar: 'View calendar', privateSlot: 'Private slot', noUpcoming: 'There are no upcoming slots registered this month.', addSlot: 'Add slot',
  sampleEyebrow: 'BOOKINGS / SAMPLE MODE', sampleTitle: 'TRY THE COMPLETE INBOX.', sampleBody: 'Real requests are not connected to this account yet. You can try filters, offers, conversations and status changes with sample data.', openBookings: 'Open Bookings',
  bookingsEyebrow: 'BOOKINGS / INBOX', bookingsTitle: 'ALL YOUR BOOKINGS. ONE THREAD.',
  bookingsBody: 'Review every proposal, reply to the promoter and decide each date without losing context.',
  samplesLabel: 'STARTER EXAMPLES / SAMPLE DATA', samplesActive: 'Your workspace starts with sample requests.', samplesRemoved: 'You removed the sample requests.', samplesBody: 'These examples belong only to this profile and browser. They do not change your private calendar and you can remove them whenever you want.', guidedTour: 'View guided tour', removeSamples: 'Remove examples', restoreSamples: 'Restore examples', all: 'All', noSamples: 'There are no sample requests with this status.',
  sampleBooking: 'SAMPLE BOOKING', automaticStatus: 'Automatic status', eventData: 'Event details', date: 'Date', city: 'City', venue: 'Venue', capacity: 'Capacity', offer: 'Offer', schedule: 'Schedule', contact: 'Contact', name: 'Name', phone: 'Phone', source: 'Source', bookingLink: 'Booking link', conversation: 'Conversation', replyPromoter: 'Reply to promoter', replyPlaceholder: 'Write conditions, a question or a proposal…', localMessage: 'Local example. This message is not sent by email.', sendSampleReply: 'Send sample reply', openPromoter: 'Open promoter view', confirmDate: 'Confirm date', rejectRequest: 'Reject request', openRequest: 'Open a request to view its details, offer and conversation.',
  calendarEyebrow: 'CALENDAR / AVAILABILITY', calendarTitle: 'DATES AND TIMES.', calendarBody: 'Open a day to see all 24 hours. Select an empty hour to create a slot or an existing block to edit it.', weekdays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], unavailable: 'Unavailable', dayHours: 'DAY / 24 HOURS', add: 'Add', selectedDaySchedule: 'Selected day schedule', addAt: 'Add slot at',
  historyEyebrow: 'WORKSPACE / HISTORY', historyTitle: 'EVERYTHING THAT HAPPENED.',
  historyBody: 'Open any activity to return to its offer and review the full conversation that caused it.',
  historyEmpty: 'There is no activity for this profile yet.', historyStatus: 'Status updated', historyMessage: 'Message', openTrace: 'Open offer and view trace', previousMonth: 'Previous month', nextMonth: 'Next month', filterSamples: 'Filter sample bookings',
  settingsTitle: 'Account settings', appearance: 'Appearance', dark: 'Dark', light: 'Light',
  language: 'Language', password: 'Change password', currentPassword: 'Current password',
  newPassword: 'New password', confirmPassword: 'Repeat password', savePassword: 'Save password',
  passwordSaved: 'Password updated.', passwordMismatch: 'The new passwords do not match.',
  passwordLength: 'The new password must contain at least 8 characters.', close: 'Close', accountPrivate: 'ACCOUNT / PRIVATE',
  editSlot: 'EDIT SLOT', newSlot: 'NEW SLOT', privateLabel: 'Private label', privatePlaceholder: 'Studio, travel, event…', start: 'Start', end: 'End', invalidTime: 'The end time must be later than the start time.', status: 'Status', saving: 'Saving…', saveChanges: 'Save changes', createSlot: 'Create slot', deleteSlot: 'Delete slot', finish: 'Finish', next: 'Next', closeTour: 'Close tour'
})

const tourSteps = computed(() => preferences.locale.value === 'es' ? [
  { view: 'bookings' as const, target: 'sample-mode', title: 'Solicitudes de ejemplo', body: 'Cada cuenta empieza con solicitudes simuladas para que puedas entender el flujo antes de recibir la primera real.' },
  { view: 'bookings' as const, target: 'workspace-filters', title: 'Filtra por estado', body: 'Los colores separan solicitudes nuevas, revisiones, respuestas pendientes y fechas confirmadas.' },
  { view: 'bookings' as const, target: 'workspace-list', title: 'Abre un booking', body: 'La lista reúne la fecha, sala, artista, ciudad y estado. Selecciona una fila para abrir el detalle.' },
  { view: 'bookings' as const, target: 'workspace-status', title: 'Estado automático', body: 'Abrir una solicitud la mueve a revisión. Responder actualiza quién tiene la siguiente acción.' },
  { view: 'bookings' as const, target: 'workspace-details', title: 'Oferta y producción', body: 'Fecha, aforo, horario, oferta y contacto permanecen unidos al mismo booking.' },
  { view: 'bookings' as const, target: 'workspace-reply', title: 'Conversación continua', body: 'Las respuestas se añaden al hilo. En estos ejemplos permanecen dentro del navegador y no envían emails.' },
  { view: 'bookings' as const, target: 'workspace-actions', title: 'Decide el resultado', body: 'Confirmar o rechazar son decisiones manuales. Los demás cambios de estado siguen la actividad.' },
  { view: 'calendar' as const, target: 'workspace-calendar', title: 'Revisa el día completo', body: 'El calendario real de la cuenta muestra el mes y las 24 horas del día seleccionado para evitar solapamientos.' }
] : [
  { view: 'bookings' as const, target: 'sample-mode', title: 'Sample requests', body: 'Every account starts with sample requests so you can understand the flow before the first real one arrives.' },
  { view: 'bookings' as const, target: 'workspace-filters', title: 'Filter by status', body: 'Colours separate new requests, reviews, pending replies and confirmed dates.' },
  { view: 'bookings' as const, target: 'workspace-list', title: 'Open a booking', body: 'The list brings together date, venue, artist, city and status. Select a row to open its details.' },
  { view: 'bookings' as const, target: 'workspace-status', title: 'Automatic status', body: 'Opening a request moves it to review. Replying updates who needs to act next.' },
  { view: 'bookings' as const, target: 'workspace-details', title: 'Offer and production', body: 'Date, capacity, schedule, offer and contact stay attached to the same booking.' },
  { view: 'bookings' as const, target: 'workspace-reply', title: 'Continuous conversation', body: 'Replies are added to the thread. These examples remain in the browser and do not send email.' },
  { view: 'bookings' as const, target: 'workspace-actions', title: 'Decide the outcome', body: 'Confirming or rejecting are manual decisions. Other status changes follow activity.' },
  { view: 'calendar' as const, target: 'workspace-calendar', title: 'Review the full day', body: 'The real account calendar shows the month and all 24 hours of the selected day to prevent overlaps.' }
])

const manageableAgency = computed(() => organizations.value.find(item => item.type === 'agency' && ['owner', 'admin'].includes(item.role)))
const selectedArtist = computed(() => artists.value.find(item => item.id === selectedArtistId.value))
const sampleNamespace = computed(() => auth.session.value?.user.id && selectedArtistId.value ? `workspace-${auth.session.value.user.id}-${selectedArtistId.value}` : undefined)
const sampleArtistName = computed(() => selectedArtist.value?.stage_name)
const demo = useBookingDemo(sampleNamespace, sampleArtistName)
const dateLocale = computed(() => preferences.locale.value === 'es' ? 'es-ES' : 'en-GB')
const monthLabel = computed(() => new Intl.DateTimeFormat(dateLocale.value, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${monthCursor.value}T12:00:00Z`)))
const selectedDateLabel = computed(() => new Intl.DateTimeFormat(dateLocale.value, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${selectedDate.value}T12:00:00Z`)))
const monthRange = computed(() => {
  const start = new Date(`${monthCursor.value}T00:00:00Z`)
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + 1)
  return { from: start.toISOString(), to: end.toISOString() }
})

const monthCells = computed(() => {
  const cursor = new Date(`${monthCursor.value}T12:00:00Z`)
  const first = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1, 12))
  const offset = (first.getUTCDay() + 6) % 7
  const start = new Date(first)
  start.setUTCDate(first.getUTCDate() - offset)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setUTCDate(start.getUTCDate() + index)
    const date = day.toISOString().slice(0, 10)
    return {
      date,
      number: day.getUTCDate(),
      current: day.getUTCMonth() === cursor.getUTCMonth(),
      blocks: blocks.value.filter(block => block.starts_at.slice(0, 10) === date)
    }
  })
})

const dayBlocks = computed(() => blocks.value
  .filter(block => block.starts_at.slice(0, 10) === selectedDate.value)
  .sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
const upcomingBlocks = computed(() => blocks.value
  .filter(block => block.ends_at >= new Date().toISOString())
  .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  .slice(0, 4))
const holdCount = computed(() => blocks.value.filter(block => block.status === 'hold').length)
const confirmedCount = computed(() => blocks.value.filter(block => block.status === 'confirmed').length)
const occupiedDays = computed(() => new Set(blocks.value.map(block => block.starts_at.slice(0, 10))).size)
const validTimeRange = computed(() => endTime.value > startTime.value)
const demoActiveBookings = computed(() => demo.bookings.value.filter(item => !item.archived))
const demoFilteredBookings = computed(() => demoActiveBookings.value.filter(item => bookingFilter.value === 'all' || item.status === bookingFilter.value))
const selectedDemoBooking = computed(() => demo.bookings.value.find(item => item.id === selectedDemoBookingId.value))
const demoCounts = computed(() => Object.fromEntries(bookingStatuses.map(status => [status, demoActiveBookings.value.filter(item => item.status === status).length])))
const currentTour = computed(() => tourStep.value >= 0 ? tourSteps.value[tourStep.value] : null)
const hasArtistSelector = computed(() => artists.value.length > 1)
const historyItems = computed(() => demo.bookings.value.flatMap(booking => [
  ...booking.messages.map(message => ({
    id: message.id,
    bookingId: booking.id,
    at: message.createdAt,
    kind: copy.value.historyMessage,
    title: `${message.actor === 'artist' ? booking.artistName : booking.promoter.name} · ${booking.event.venue}`,
    detail: message.body
  })),
  {
    id: `status-${booking.id}`,
    bookingId: booking.id,
    at: booking.updatedAt,
    kind: copy.value.historyStatus,
    title: `${booking.event.venue} · ${demoStatusLabel(booking.status)}`,
    detail: `${booking.event.city} · ${formatDemoDate(booking.event.date)}`
  }
]).sort((a, b) => b.at.localeCompare(a.at)))
const hours = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`)

onMounted(async () => {
  await auth.initialize()
  if (!auth.signedIn.value) return navigateTo('/access')
  if (!auth.profile.value) await auth.fetchProfile()
  if (!auth.profile.value?.onboarding_completed) return navigateTo('/onboarding')
  await loadWorkspaceIdentity()
  loading.value = false
})

watch([selectedArtistId, monthCursor], async () => {
  if (selectedArtistId.value) await loadBlocks()
})
watch(rosterArtistName, value => { rosterArtistSlug.value = slugify(value) })
watch(demo.ready, async (value) => {
  if (!value) selectedDemoBookingId.value = ''
  else if (!selectedDemoBookingId.value) {
    selectedDemoBookingId.value = demoActiveBookings.value[0]?.id || ''
    if (demoActiveBookings.value.length && import.meta.client && localStorage.getItem(`cuebooker.tour.seen.${sampleNamespace.value}`) !== 'true') {
      await nextTick()
      startTour()
    }
  }
}, { immediate: true })
watch(selectedDemoBookingId, async (id) => {
  if (id) await demo.markOpened(id)
})
watch(tourStep, async (step) => {
  const item = tourSteps.value[step]
  if (!item) return
  activeView.value = item.view
  await nextTick()
  const target = document.getElementById(item.target)
  if (!target) return
  target.scrollIntoView({ behavior: 'smooth', block: 'center' })
})

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function loadWorkspaceIdentity() {
  try {
    const [artistRows, organizationRows] = await Promise.all([availability.listArtists(), availability.listOrganizations()])
    artists.value = artistRows
    organizations.value = organizationRows
    if (!selectedArtistId.value || !artists.value.some(item => item.id === selectedArtistId.value)) selectedArtistId.value = artists.value[0]?.id || ''
    if (selectedArtistId.value) await loadBlocks()
  } catch (error: any) {
    errorMessage.value = error?.message || (preferences.locale.value === 'es' ? 'No se pudo cargar el workspace.' : 'The workspace could not be loaded.')
  }
}

async function addFirstRosterArtist() {
  if (!manageableAgency.value) return
  errorMessage.value = ''
  rosterSubmitting.value = true
  try {
    const artistId = await availability.addAgencyArtist({ organizationId: manageableAgency.value.id, artistName: rosterArtistName.value, artistSlug: rosterArtistSlug.value })
    rosterArtistName.value = ''
    rosterArtistSlug.value = ''
    await loadWorkspaceIdentity()
    selectedArtistId.value = artistId
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || (preferences.locale.value === 'es' ? 'No se pudo añadir el artista.' : 'The artist could not be added.')
  } finally {
    rosterSubmitting.value = false
  }
}

async function loadBlocks() {
  if (!selectedArtistId.value) return
  try {
    blocks.value = await availability.listBlocks(selectedArtistId.value, monthRange.value.from, monthRange.value.to)
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || (preferences.locale.value === 'es' ? 'No se pudo cargar la disponibilidad.' : 'Availability could not be loaded.')
  }
}

function changeMonth(offset: number) {
  const date = new Date(`${monthCursor.value}T12:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + offset)
  monthCursor.value = date.toISOString().slice(0, 7) + '-01'
  selectedDate.value = monthCursor.value
  closeEditor()
}

function selectDay(date: string) {
  selectedDate.value = date
  if (date.slice(0, 7) !== monthCursor.value.slice(0, 7)) monthCursor.value = `${date.slice(0, 7)}-01`
  closeEditor()
}

function openCreate(start = '18:00') {
  const startMinutes = Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5))
  const endMinutes = Math.min(startMinutes + 120, 23 * 60 + 59)
  startTime.value = start
  endTime.value = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
  blockStatus.value = 'unavailable'
  blockLabel.value = ''
  editingBlockId.value = null
  editorOpen.value = true
}

function startEdit(block: AvailabilityBlock) {
  selectedDate.value = block.starts_at.slice(0, 10)
  startTime.value = block.starts_at.slice(11, 16)
  endTime.value = block.ends_at.slice(11, 16)
  blockStatus.value = block.status
  blockLabel.value = block.label || ''
  editingBlockId.value = block.id
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
  editingBlockId.value = null
}

async function saveBlock() {
  if (!selectedArtistId.value || !validTimeRange.value) return
  errorMessage.value = ''
  saving.value = true
  const input = {
    startsAt: `${selectedDate.value}T${startTime.value}:00`,
    endsAt: `${selectedDate.value}T${endTime.value}:00`,
    status: blockStatus.value,
    label: blockLabel.value
  }
  const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))
  const proposedStart = toMinutes(startTime.value)
  const proposedEnd = toMinutes(endTime.value)
  const overlap = blocks.value.find(block => block.id !== editingBlockId.value
    && block.starts_at.slice(0, 10) === selectedDate.value
    && toMinutes(time(block.starts_at)) < proposedEnd
    && toMinutes(time(block.ends_at)) > proposedStart)
  if (blockStatus.value === 'confirmed' && overlap) {
    const overlapName = overlap.label || statusLabel(overlap.status)
    const warning = preferences.locale.value === 'es'
      ? `Esta franja se solapa con “${overlapName}” (${time(overlap.starts_at)}–${time(overlap.ends_at)}). ¿Quieres guardarla igualmente?`
      : `This slot overlaps “${overlapName}” (${time(overlap.starts_at)}–${time(overlap.ends_at)}). Save it anyway?`
    if (!window.confirm(warning)) { saving.value = false; return }
  }
  try {
    if (editingBlockId.value) await availability.updateBlock(editingBlockId.value, input)
    else await availability.createBlock({ artistId: selectedArtistId.value, ...input })
    closeEditor()
    await loadBlocks()
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || (preferences.locale.value === 'es' ? 'No se pudo guardar el horario.' : 'The slot could not be saved.')
  } finally {
    saving.value = false
  }
}

async function removeBlock() {
  const confirmation = preferences.locale.value === 'es' ? '¿Eliminar este horario? Esta acción no se puede deshacer.' : 'Delete this slot? This action cannot be undone.'
  if (!editingBlockId.value || !window.confirm(confirmation)) return
  saving.value = true
  try {
    await availability.deleteBlock(editingBlockId.value)
    closeEditor()
    await loadBlocks()
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || (preferences.locale.value === 'es' ? 'No se pudo eliminar el horario.' : 'The slot could not be deleted.')
  } finally {
    saving.value = false
  }
}

function blockStyle(block: AvailabilityBlock) {
  const start = Number(block.starts_at.slice(11, 13)) * 60 + Number(block.starts_at.slice(14, 16))
  const end = Number(block.ends_at.slice(11, 13)) * 60 + Number(block.ends_at.slice(14, 16))
  return { top: `${start * .8}px`, height: `${Math.max((end - start) * .8, 42)}px` }
}

function openUpcoming(block: AvailabilityBlock) {
  activeView.value = 'calendar'
  startEdit(block)
}

async function openCalendarBlock(block: AvailabilityBlock) {
  if (!block.booking_reference) { startEdit(block); return }
  const booking = demo.bookings.value.find(item => item.id === block.booking_reference)
  if (!booking) { startEdit(block); return }

  selectedDemoBookingId.value = booking.id
  activeView.value = booking.archived ? 'history' : 'bookings'
  await nextTick()
  document.getElementById(booking.archived ? `history-booking-${booking.id}` : `booking-thread-${booking.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat(dateLocale.value, { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(value))
}

function time(value: string) { return value.slice(11, 16) }
function formatDemoDate(value: string) { return new Intl.DateTimeFormat(dateLocale.value, { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) }
function formatDemoTime(value: string) { return new Intl.DateTimeFormat(dateLocale.value, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) }
function demoStatusLabel(status: BookingStatus) {
  return preferences.locale.value === 'es'
    ? { new: 'Nueva', in_review: 'En revisión', waiting_promoter: 'Esperando al promotor', confirmed: 'Confirmada', rejected: 'Rechazada' }[status]
    : { new: 'New', in_review: 'In review', waiting_promoter: 'Waiting for promoter', confirmed: 'Confirmed', rejected: 'Rejected' }[status]
}
async function sendDemoReply() {
  if (!selectedDemoBooking.value || !demoReply.value.trim()) return
  await demo.addMessage(selectedDemoBooking.value.id, 'artist', demoReply.value)
  demoReply.value = ''
}
async function confirmDemoBooking() {
  if (selectedDemoBooking.value) await demo.setStatus(selectedDemoBooking.value.id, 'confirmed')
}
async function rejectDemoBooking() {
  if (!selectedDemoBooking.value) return
  await demo.setStatus(selectedDemoBooking.value.id, 'rejected')
  selectedDemoBookingId.value = demoActiveBookings.value[0]?.id || ''
}
function startTour() {
  bookingFilter.value = 'all'
  tourStep.value = 0
}
function nextTourStep() {
  if (tourStep.value >= tourSteps.value.length - 1) closeTour()
  else tourStep.value += 1
}
function closeTour() {
  if (import.meta.client && sampleNamespace.value) localStorage.setItem(`cuebooker.tour.seen.${sampleNamespace.value}`, 'true')
  tourStep.value = -1
}
async function clearSampleBookings() {
  await demo.clearSamples()
  selectedDemoBookingId.value = ''
}
async function restoreSampleBookings() {
  await demo.restoreSamples()
  selectedDemoBookingId.value = demoActiveBookings.value[0]?.id || ''
}
function statusLabel(status: AvailabilityStatus) { return status === 'confirmed' ? copy.value.confirmedStatus : status === 'hold' ? 'Hold' : copy.value.unavailable }
async function openHistoryItem(bookingId: string) {
  const booking = demo.bookings.value.find(item => item.id === bookingId)
  if (!booking) return
  selectedDemoBookingId.value = booking.id
  activeView.value = 'bookings'
  await nextTick()
  document.getElementById(`booking-thread-${booking.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
async function logout() { await auth.signOut(); await navigateTo('/access') }
async function savePassword() {
  passwordMessage.value = ''
  if (passwordNew.value.length < 8) { passwordMessage.value = copy.value.passwordLength; return }
  if (passwordNew.value !== passwordConfirm.value) { passwordMessage.value = copy.value.passwordMismatch; return }
  passwordSaving.value = true
  try {
    await auth.updatePassword(passwordCurrent.value, passwordNew.value)
    passwordCurrent.value = ''
    passwordNew.value = ''
    passwordConfirm.value = ''
    passwordMessage.value = copy.value.passwordSaved
  } catch (error: any) {
    passwordMessage.value = error?.data?.msg || error?.data?.message || error?.message || (preferences.locale.value === 'es' ? 'No se pudo actualizar la contraseña.' : 'The password could not be updated.')
  } finally {
    passwordSaving.value = false
  }
}
useHead(() => ({ title: 'Workspace | CueBooker', htmlAttrs: { lang: preferences.locale.value } }))
</script>

<template>
  <main class="workspace">
    <header class="workspace-header">
      <NuxtLink class="brand" to="/">CUEBOOKER<span>/</span></NuxtLink>
      <nav aria-label="Workspace">
        <button :class="{ active: activeView === 'overview' }" type="button" @click="activeView = 'overview'">{{ copy.overview }}</button>
        <button :class="{ active: activeView === 'bookings' }" type="button" @click="activeView = 'bookings'">{{ copy.bookings }}</button>
        <button :class="{ active: activeView === 'calendar' }" type="button" @click="activeView = 'calendar'">{{ copy.calendar }}</button>
        <button :class="{ active: activeView === 'history' }" type="button" @click="activeView = 'history'">{{ copy.history }}</button>
      </nav>
      <div class="account-actions">
        <CuePreferencesControl compact />
        <button class="header-icon-button" type="button" :aria-label="copy.settings" :title="copy.settings" @click="settingsOpen = true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-4v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2h4v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg></button>
        <button class="header-icon-button" type="button" :aria-label="copy.logout" :title="copy.logout" @click="logout"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/></svg></button>
      </div>
    </header>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <p v-if="loading" class="loading-message">{{ copy.loading }}</p>

    <section v-else-if="!artists.length" class="empty-card">
      <p class="eyebrow">{{ copy.rosterEyebrow }}</p>
      <template v-if="manageableAgency">
        <h1>{{ copy.addFirstArtist }} {{ manageableAgency.name }}.</h1>
        <p>{{ copy.rosterBody }}</p>
        <form class="roster-form" @submit.prevent="addFirstRosterArtist">
          <label><span>{{ copy.artistName }}</span><input v-model="rosterArtistName" minlength="1" required></label>
          <label><span>{{ copy.identifier }}</span><input v-model="rosterArtistSlug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required></label>
          <button class="primary-button" type="submit" :disabled="rosterSubmitting">{{ rosterSubmitting ? copy.creating : copy.addArtist }}</button>
        </form>
      </template>
      <template v-else>
        <h1>{{ copy.noArtist }}</h1>
        <p>{{ copy.noArtistBody }}</p>
      </template>
    </section>

    <template v-else>
      <section v-if="activeView === 'overview'" class="view overview-view">
        <div class="view-heading">
          <div>
            <p class="eyebrow">{{ copy.overviewEyebrow }}</p>
            <h1>{{ copy.overviewTitle }}</h1>
            <p>{{ copy.overviewBody }}</p>
          </div>
          <label v-if="hasArtistSelector" class="artist-select"><span>{{ copy.artist }}</span><select v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
          <div v-else class="artist-identity"><span>{{ copy.artist }}</span><small>{{ copy.role }}</small><strong><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 14h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z"/></svg>{{ selectedArtist?.stage_name }}</strong></div>
        </div>

        <div class="summary-grid">
          <article class="summary-card summary-card--pending"><span>{{ copy.realBookings }}</span><strong>—</strong><p>{{ copy.realBookingsBody }}</p></article>
          <article class="summary-card"><span>{{ copy.holdsMonth }}</span><strong>{{ holdCount }}</strong><p>{{ copy.holdsBody }}</p></article>
          <article class="summary-card"><span>{{ copy.confirmed }}</span><strong>{{ confirmedCount }}</strong><p>{{ copy.confirmedBody }}</p></article>
          <article class="summary-card"><span>{{ copy.occupiedDays }}</span><strong>{{ occupiedDays }}</strong><p>{{ copy.occupiedBody }}</p></article>
        </div>

        <div class="overview-grid">
          <section class="panel agenda-panel">
            <div class="panel-heading"><div><p class="eyebrow">{{ copy.agendaEyebrow }}</p><h2>{{ copy.upcoming }}</h2></div><button type="button" @click="activeView = 'calendar'">{{ copy.viewCalendar }}</button></div>
            <div v-if="upcomingBlocks.length" class="agenda-list">
              <button v-for="block in upcomingBlocks" :key="block.id" type="button" @click="openUpcoming(block)">
                <time>{{ shortDate(block.starts_at) }}</time>
                <span><strong>{{ block.label || copy.privateSlot }}</strong><small>{{ time(block.starts_at) }}–{{ time(block.ends_at) }}</small></span>
                <i :class="`status-dot status-dot--${block.status}`" />
              </button>
            </div>
            <div v-else class="panel-empty"><p>{{ copy.noUpcoming }}</p><button type="button" @click="activeView = 'calendar'; openCreate()">{{ copy.addSlot }}</button></div>
          </section>

          <aside class="panel next-panel">
            <p class="eyebrow">{{ copy.sampleEyebrow }}</p>
            <h2>{{ copy.sampleTitle }}</h2>
            <p>{{ copy.sampleBody }}</p>
            <button type="button" @click="activeView = 'bookings'">{{ copy.openBookings }}</button>
          </aside>
        </div>
      </section>

      <section v-else-if="activeView === 'bookings'" class="view bookings-view">
        <div class="view-heading">
          <div><p class="eyebrow">{{ copy.bookingsEyebrow }}</p><h1>{{ copy.bookingsTitle }}</h1><p>{{ copy.bookingsBody }}</p></div>
          <label v-if="hasArtistSelector" class="artist-select"><span>{{ copy.artist }}</span><select v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
          <div v-else class="artist-identity"><span>{{ copy.artist }}</span><small>{{ copy.role }}</small><strong><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 14h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z"/></svg>{{ selectedArtist?.stage_name }}</strong></div>
        </div>
        <aside id="sample-mode" class="demo-notice" :class="{ 'tour-focus': tourStep === 0 }">
          <div><span>{{ copy.samplesLabel }}</span><strong>{{ demoActiveBookings.length ? copy.samplesActive : copy.samplesRemoved }}</strong><p>{{ copy.samplesBody }}</p></div>
          <div class="demo-notice__actions"><button class="guide-action" type="button" @click="startTour">{{ copy.guidedTour }}</button><button v-if="demoActiveBookings.length" type="button" @click="clearSampleBookings">{{ copy.removeSamples }}</button><button v-else type="button" @click="restoreSampleBookings">{{ copy.restoreSamples }}</button></div>
        </aside>

        <div id="workspace-filters" class="status-filters" :class="{ 'tour-focus': tourStep === 1 }" :aria-label="copy.filterSamples">
          <button :class="{ active: bookingFilter === 'all' }" type="button" @click="bookingFilter = 'all'">{{ copy.all }} <strong>{{ demoActiveBookings.length }}</strong></button>
          <button v-for="status in bookingStatuses.filter(item => item !== 'rejected')" :key="status" type="button" :class="[{ active: bookingFilter === status }, `tone-${statusTone[status]}`]" @click="bookingFilter = status"><i />{{ demoStatusLabel(status) }} <strong>{{ demoCounts[status] }}</strong></button>
        </div>

        <div class="booking-workspace demo-booking-workspace">
          <div id="workspace-list" class="booking-list" :class="{ 'tour-focus': tourStep === 2 }">
            <button v-for="booking in demoFilteredBookings" :key="booking.id" type="button" :class="{ active: selectedDemoBookingId === booking.id }" @click="selectedDemoBookingId = selectedDemoBookingId === booking.id ? '' : booking.id">
              <span class="booking-list__date">{{ formatDemoDate(booking.event.date) }}</span>
              <span><strong>{{ booking.event.venue }}</strong><small>{{ booking.artistName }} · {{ booking.event.city }}</small></span>
              <span :class="`status-pill tone-${statusTone[booking.status]}`"><i />{{ demoStatusLabel(booking.status) }}</span>
            </button>
            <p v-if="!demoFilteredBookings.length" class="workspace-empty">{{ copy.noSamples }}</p>
          </div>

          <article v-if="selectedDemoBooking" :id="`booking-thread-${selectedDemoBooking.id}`" class="booking-detail">
            <header>
              <div><p class="eyebrow">{{ copy.sampleBooking }} / {{ selectedDemoBooking.id.slice(-8).toUpperCase() }}</p><h2>{{ selectedDemoBooking.event.venue }}</h2><p>{{ selectedDemoBooking.event.name }} · {{ selectedDemoBooking.artistName }}</p></div>
              <div id="workspace-status" class="booking-status-display" :class="[{ 'tour-focus': tourStep === 3 }, `tone-${statusTone[selectedDemoBooking.status]}`]"><span>{{ copy.automaticStatus }}</span><strong><i />{{ demoStatusLabel(selectedDemoBooking.status) }}</strong></div>
            </header>

            <div id="workspace-details" class="booking-facts" :class="{ 'tour-focus': tourStep === 4 }">
              <section><h3>{{ copy.eventData }}</h3><dl><div><dt>{{ copy.date }}</dt><dd>{{ formatDemoDate(selectedDemoBooking.event.date) }}</dd></div><div><dt>{{ copy.city }}</dt><dd>{{ selectedDemoBooking.event.city }}</dd></div><div><dt>{{ copy.venue }}</dt><dd>{{ selectedDemoBooking.event.venue }}</dd></div><div><dt>{{ copy.capacity }}</dt><dd>{{ selectedDemoBooking.event.capacity }}</dd></div><div><dt>{{ copy.offer }}</dt><dd>{{ selectedDemoBooking.event.offer }}</dd></div><div><dt>{{ copy.schedule }}</dt><dd>{{ selectedDemoBooking.event.schedule || '—' }}</dd></div></dl></section>
              <section><h3>{{ copy.contact }}</h3><dl><div><dt>{{ copy.name }}</dt><dd>{{ selectedDemoBooking.promoter.name }}</dd></div><div><dt>Email</dt><dd>{{ selectedDemoBooking.promoter.email }}</dd></div><div v-if="selectedDemoBooking.promoter.phone"><dt>{{ copy.phone }}</dt><dd>{{ selectedDemoBooking.promoter.phone }}</dd></div><div><dt>{{ copy.source }}</dt><dd>{{ copy.bookingLink }}</dd></div></dl></section>
            </div>

            <section class="message-thread"><h3>{{ copy.conversation }}</h3><article v-for="message in selectedDemoBooking.messages" :key="message.id" :class="`message message--${message.actor}`"><header><strong>{{ message.actor === 'artist' ? selectedDemoBooking.artistName : selectedDemoBooking.promoter.name }}</strong><time>{{ formatDemoTime(message.createdAt) }}</time></header><p>{{ message.body }}</p></article></section>

            <form id="workspace-reply" class="booking-reply" :class="{ 'tour-focus': tourStep === 5 }" @submit.prevent="sendDemoReply"><label>{{ copy.replyPromoter }}<textarea v-model="demoReply" rows="5" :placeholder="copy.replyPlaceholder" /></label><p>{{ copy.localMessage }}</p><button class="primary-button demo-action" type="submit" :disabled="!demoReply.trim()">{{ copy.sendSampleReply }}</button></form>

            <footer id="workspace-actions" class="booking-actions" :class="{ 'tour-focus': tourStep === 6 }"><NuxtLink class="demo-secondary-action" :to="`/request?id=${selectedDemoBooking.id}`">{{ copy.openPromoter }}</NuxtLink><button v-if="selectedDemoBooking.status !== 'confirmed'" class="primary-button demo-action" type="button" @click="confirmDemoBooking">{{ copy.confirmDate }}</button><button v-if="selectedDemoBooking.status !== 'confirmed'" class="demo-danger-action" type="button" @click="rejectDemoBooking">{{ copy.rejectRequest }}</button></footer>
          </article>
          <div v-else class="booking-placeholder"><span>→</span><p>{{ copy.openRequest }}</p></div>
        </div>
      </section>

      <section v-else-if="activeView === 'calendar'" class="view calendar-view">
        <div class="view-heading calendar-heading">
          <div><p class="eyebrow">{{ copy.calendarEyebrow }}</p><h1>{{ copy.calendarTitle }}</h1><p>{{ copy.calendarBody }}</p></div>
          <label v-if="hasArtistSelector" class="artist-select"><span>{{ copy.artist }}</span><select v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
          <div v-else class="artist-identity"><span>{{ copy.artist }}</span><small>{{ copy.role }}</small><strong><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 14h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z"/></svg>{{ selectedArtist?.stage_name }}</strong></div>
        </div>

        <div id="workspace-calendar" class="calendar-layout" :class="{ 'tour-focus': tourStep === 7 }">
          <section class="month-panel panel">
            <div class="calendar-toolbar"><button type="button" :aria-label="copy.previousMonth" @click="changeMonth(-1)">←</button><h2>{{ monthLabel }}</h2><button type="button" :aria-label="copy.nextMonth" @click="changeMonth(1)">→</button></div>
            <div class="calendar-grid">
              <div v-for="label in copy.weekdays" :key="label" class="weekday">{{ label }}</div>
              <button v-for="cell in monthCells" :key="cell.date" type="button" class="day" :class="{ muted: !cell.current, selected: selectedDate === cell.date }" @click="selectDay(cell.date)">
                <span>{{ cell.number }}</span>
                <small v-if="cell.blocks.length">{{ cell.blocks.length }}</small>
                <span v-if="cell.blocks.length" class="day-statuses"><i v-for="block in cell.blocks.slice(0, 3)" :key="block.id" :class="`status-dot status-dot--${block.status}`" /></span>
              </button>
            </div>
            <div class="legend"><span><i class="status-dot status-dot--hold" />Hold</span><span><i class="status-dot status-dot--confirmed" />{{ copy.confirmedStatus }}</span><span><i class="status-dot status-dot--unavailable" />{{ copy.unavailable }}</span></div>
          </section>

          <section class="day-panel panel">
            <div class="day-heading"><div><p class="eyebrow">{{ copy.dayHours }}</p><h2>{{ selectedDateLabel }}</h2></div><button class="add-button" type="button" @click="openCreate()">{{ copy.add }}</button></div>
            <div class="timeline" :aria-label="copy.selectedDaySchedule">
              <button v-for="hour in hours" :key="hour" class="hour-row" type="button" :aria-label="`${copy.addAt} ${hour}`" @click="openCreate(hour)"><span>{{ hour }}</span></button>
              <button v-for="block in dayBlocks" :key="block.id" class="timeline-block" :class="`timeline-block--${block.status}`" :style="blockStyle(block)" type="button" @click.stop="openCalendarBlock(block)">
                <strong>{{ block.label || statusLabel(block.status) }}</strong><span>{{ time(block.starts_at) }}–{{ time(block.ends_at) }}</span>
              </button>
            </div>
          </section>
        </div>
      </section>

      <section v-else class="view history-view">
        <div class="view-heading">
          <div><p class="eyebrow">{{ copy.historyEyebrow }}</p><h1>{{ copy.historyTitle }}</h1><p>{{ copy.historyBody }}</p></div>
          <label v-if="hasArtistSelector" class="artist-select"><span>{{ copy.artist }}</span><select v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
          <div v-else class="artist-identity"><span>{{ copy.artist }}</span><small>{{ copy.role }}</small><strong><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 14h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z"/></svg>{{ selectedArtist?.stage_name }}</strong></div>
        </div>
        <div v-if="historyItems.length" class="history-list">
          <button v-for="item in historyItems" :id="item.id === `status-${item.bookingId}` ? `history-booking-${item.bookingId}` : undefined" :key="item.id" type="button" :aria-label="`${copy.openTrace}: ${item.title}`" @click="openHistoryItem(item.bookingId)"><time>{{ formatDemoTime(item.at) }}</time><i /><div><span>{{ item.kind }}</span><strong>{{ item.title }}</strong><p>{{ item.detail }}</p><small>{{ copy.openTrace }} →</small></div></button>
        </div>
        <p v-else class="workspace-empty">{{ copy.historyEmpty }}</p>
      </section>
    </template>

    <div v-if="settingsOpen" class="editor-backdrop" @click.self="settingsOpen = false">
      <aside class="editor-panel settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div class="editor-heading"><div><p class="eyebrow">{{ copy.accountPrivate }}</p><h2 id="settings-title">{{ copy.settingsTitle }}</h2></div><button type="button" :aria-label="copy.close" @click="settingsOpen = false">×</button></div>
        <section class="settings-group"><span>{{ copy.language }}</span><div class="settings-options"><button :class="{ active: preferences.locale.value === 'es' }" type="button" @click="preferences.setLocale('es')">ES</button><button :class="{ active: preferences.locale.value === 'en' }" type="button" @click="preferences.setLocale('en')">EN</button></div></section>
        <section class="settings-group"><span>{{ copy.appearance }}</span><div class="settings-options"><button :class="{ active: preferences.theme.value === 'dark' }" type="button" @click="preferences.setTheme('dark')">{{ copy.dark }}</button><button :class="{ active: preferences.theme.value === 'light' }" type="button" @click="preferences.setTheme('light')">{{ copy.light }}</button></div></section>
        <form class="password-form" @submit.prevent="savePassword">
          <p class="eyebrow">{{ copy.password }}</p>
          <label><span>{{ copy.currentPassword }}</span><input v-model="passwordCurrent" type="password" autocomplete="current-password" required></label>
          <label><span>{{ copy.newPassword }}</span><input v-model="passwordNew" type="password" minlength="8" autocomplete="new-password" required></label>
          <label><span>{{ copy.confirmPassword }}</span><input v-model="passwordConfirm" type="password" minlength="8" autocomplete="new-password" required></label>
          <p v-if="passwordMessage" class="form-hint" :class="{ 'form-hint--success': passwordMessage === copy.passwordSaved, 'form-hint--error': passwordMessage !== copy.passwordSaved }">{{ passwordMessage }}</p>
          <button class="primary-button" type="submit" :disabled="passwordSaving">{{ passwordSaving ? '…' : copy.savePassword }}</button>
        </form>
      </aside>
    </div>

    <div v-if="editorOpen" class="editor-backdrop" @click.self="closeEditor">
      <aside class="editor-panel" role="dialog" aria-modal="true" :aria-labelledby="editingBlockId ? 'editor-title-edit' : 'editor-title-new'">
        <div class="editor-heading"><div><p class="eyebrow">{{ editingBlockId ? copy.editSlot : copy.newSlot }}</p><h2 :id="editingBlockId ? 'editor-title-edit' : 'editor-title-new'">{{ selectedDateLabel }}</h2></div><button type="button" :aria-label="copy.close" @click="closeEditor">×</button></div>
        <form @submit.prevent="saveBlock">
          <label><span>{{ copy.privateLabel }}</span><input v-model="blockLabel" maxlength="160" :placeholder="copy.privatePlaceholder"></label>
          <div class="time-fields"><label><span>{{ copy.start }}</span><input v-model="startTime" type="time" required></label><label><span>{{ copy.end }}</span><input v-model="endTime" type="time" required></label></div>
          <p v-if="!validTimeRange" class="form-hint form-hint--error">{{ copy.invalidTime }}</p>
          <label><span>{{ copy.status }}</span><select v-model="blockStatus"><option value="unavailable">{{ copy.unavailable }}</option><option value="hold">Hold</option><option value="confirmed">{{ copy.confirmedStatus }}</option></select></label>
          <button class="primary-button" type="submit" :disabled="saving || !validTimeRange">{{ saving ? copy.saving : editingBlockId ? copy.saveChanges : copy.createSlot }}</button>
          <button v-if="editingBlockId" class="delete-button" type="button" :disabled="saving" @click="removeBlock">{{ copy.deleteSlot }}</button>
        </form>
      </aside>
    </div>

    <aside v-if="currentTour" class="tour-card" role="dialog" aria-live="polite">
      <button class="tour-card__close" type="button" :aria-label="copy.closeTour" @click="closeTour">×</button>
      <span>{{ String(tourStep + 1).padStart(2, '0') }} / {{ String(tourSteps.length).padStart(2, '0') }}</span>
      <strong>{{ currentTour.title }}</strong>
      <p>{{ currentTour.body }}</p>
      <button class="primary-button" type="button" @click="nextTourStep">{{ tourStep === tourSteps.length - 1 ? copy.finish : copy.next }}</button>
    </aside>
  </main>
</template>

<style scoped>
:global(body) { margin: 0; background: var(--cue-bg); }
button, select, input { font: inherit; }
button, a, select { -webkit-tap-highlight-color: transparent; }
.workspace { min-height: 100vh; padding: 0 28px 64px; background: var(--cue-bg); color: var(--cue-text); font-family: Arial, Helvetica, sans-serif; }
.workspace-header { position: sticky; z-index: 20; top: 0; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 64px; border-bottom: 1px solid var(--cue-border); background: color-mix(in srgb, var(--cue-bg) 94%, transparent); backdrop-filter: blur(12px); }
.brand { color: inherit; text-decoration: none; font-weight: 900; letter-spacing: .08em; }
.brand span { color: var(--cue-toggle); }
.eyebrow { color: var(--cue-accent); }
.workspace-header nav { display: flex; gap: 3px; padding: 3px; border: 1px solid var(--cue-border); border-radius: 999px; background: var(--cue-surface); }
.workspace-header nav button { min-height: 34px; padding: 0 14px; border: 0; border-radius: 999px; background: transparent; color: var(--cue-muted); cursor: pointer; font-size: 12px; font-weight: 700; }
.workspace-header nav button.active { background: var(--cue-toggle); color: #070707; box-shadow: 0 0 18px color-mix(in srgb, var(--cue-toggle) 28%, transparent); }
.account-actions { display: flex; justify-content: flex-end; align-items: center; gap: 7px; color: var(--cue-muted); font-size: 12px; }
.account-actions button, .panel-heading button, .next-panel button, .panel-empty button, .empty-actions button, .empty-actions a { border: 0; background: transparent; color: var(--cue-text); cursor: pointer; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }
.account-actions .header-icon-button { display: grid; place-items: center; width: 36px; height: 36px; padding: 8px; border: 1px solid var(--cue-border); border-radius: 50%; color: var(--cue-muted); text-decoration: none; }
.header-icon-button:hover { border-color: var(--cue-accent); color: var(--cue-text); }
.header-icon-button svg, .artist-identity svg { width: 100%; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.view { width: min(1440px, 100%); margin: 0 auto; }
.view-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; padding: 24px 0 24px; }
.view-heading > div { max-width: 880px; }
.eyebrow { margin: 0; font: 700 10px/1.25 monospace; letter-spacing: .12em; text-transform: uppercase; }
h1 { max-width: 900px; margin: 10px 0 14px; font-size: clamp(3rem, 7vw, 7.2rem); line-height: .84; letter-spacing: -.065em; text-transform: uppercase; }
.view-heading > div > p:last-child, .empty-card > p, .next-panel > p, .booking-empty > p { max-width: 680px; margin: 0; color: var(--cue-muted); font-size: 16px; line-height: 1.55; }
.artist-select, .roster-form label, .editor-panel label { display: grid; gap: 8px; }
.artist-select span, .roster-form label span, .editor-panel label span { color: #858585; font: 700 10px/1.2 monospace; letter-spacing: .08em; text-transform: uppercase; }
select, input { min-height: 46px; box-sizing: border-box; padding: 0 13px; border: 1px solid var(--cue-border); border-radius: 0; outline: none; background: var(--cue-surface); color: var(--cue-text); }
select:focus, input:focus { border-color: #e8ff2f; }
.artist-select select { min-width: 220px; }
.artist-identity { display: grid; min-width: 220px; padding: 12px 0 3px; border-top: 1px solid var(--cue-border); }
.artist-identity > span, .artist-identity > small { color: var(--cue-muted); font: 700 9px/1.3 monospace; letter-spacing: .12em; text-transform: uppercase; }
.artist-identity > small { margin-top: 4px; color: var(--cue-accent); }
.artist-identity strong { display: flex; align-items: center; gap: 9px; margin-top: 8px; font-size: 16px; }
.artist-identity svg { width: 20px; height: 20px; color: var(--cue-accent); }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid var(--cue-border); border-left: 1px solid var(--cue-border); }
.summary-card { min-height: 170px; padding: 22px; border-right: 1px solid var(--cue-border); border-bottom: 1px solid var(--cue-border); background: var(--cue-surface); color: var(--cue-text); }
.summary-card > span { color: var(--cue-muted); font: 700 10px monospace; letter-spacing: .09em; text-transform: uppercase; }
.summary-card strong { display: block; margin: 16px 0 8px; font-size: 54px; line-height: 1; }
.summary-card p { max-width: 220px; margin: 0; color: var(--cue-muted); font-size: 13px; line-height: 1.45; }
.summary-card--pending { background: var(--cue-raised); }
.summary-card--pending strong { color: var(--cue-dim); }
.overview-grid { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(300px, .75fr); gap: 20px; margin-top: 20px; }
.panel, .empty-card { border: 1px solid var(--cue-border); background: var(--cue-surface); color: var(--cue-text); }
.panel-heading, .day-heading, .editor-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
.panel-heading { padding: 22px; border-bottom: 1px solid var(--cue-border); }
.panel h2, .empty-card h1, .editor-panel h2 { margin: 7px 0 0; }
.agenda-list > button { display: grid; grid-template-columns: 78px 1fr auto; align-items: center; width: 100%; min-height: 82px; padding: 14px 22px; border: 0; border-bottom: 1px solid var(--cue-border); background: transparent; color: var(--cue-text); text-align: left; cursor: pointer; }
.agenda-list > button:hover { background: var(--cue-raised); }
.agenda-list time { color: #e8ff2f; font: 700 12px monospace; text-transform: uppercase; }
.agenda-list strong, .agenda-list small { display: block; }
.agenda-list small { margin-top: 5px; color: var(--cue-muted); font-size: 12px; }
.next-panel { padding: 24px; background: #e8ff2f; color: #090909; }
.next-panel .eyebrow, .next-panel > p { color: #222; }
.next-panel h2 { max-width: 360px; margin: 18px 0; font-size: clamp(1.8rem, 3vw, 3.2rem); line-height: .95; text-transform: uppercase; }
.next-panel button { margin-top: 28px; color: #090909; }
.panel-empty { padding: 32px 22px; color: var(--cue-muted); }
.panel-empty button { padding: 0; color: #e8ff2f; }
.demo-notice { display: flex; justify-content: space-between; align-items: center; gap: 28px; padding: 20px 22px; border: 1px solid #665f18; background: #17170d; }
.demo-notice span { display: block; margin-bottom: 7px; color: #e8ff2f; font: 700 10px monospace; letter-spacing: .1em; }
.demo-notice strong { font-size: 17px; }
.demo-notice p { max-width: 720px; margin: 6px 0 0; color: var(--cue-muted); font-size: 13px; line-height: 1.5; }
.demo-notice__actions { display: flex; flex: 0 0 auto; gap: 9px; }
.demo-notice__actions button { min-height: 42px; padding: 0 16px; border: 1px solid #777025; background: transparent; color: #e8ff2f; cursor: pointer; font-weight: 800; }
.demo-notice__actions .guide-action { background: #e8ff2f; color: #070707; }
.demo-booking-workspace { padding-bottom: 34px; }
.demo-action { min-height: 46px; padding: 0 18px; }
.demo-secondary-action, .demo-danger-action { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border: 1px solid #3a3a3a; background: transparent; color: #f2f0eb; cursor: pointer; font-size: 12px; font-weight: 800; text-decoration: none; }
.demo-danger-action { border-color: #75404a; color: #ff9dab; }
.bookings-shell { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 470px; border: 1px solid #292929; background: #0d0d0d; }
.booking-filters { padding: 10px; border-right: 1px solid #292929; }
.booking-filters button { display: flex; justify-content: space-between; width: 100%; min-height: 50px; padding: 0 14px; border: 0; background: transparent; color: #848484; cursor: pointer; text-align: left; }
.booking-filters button.active { background: #181818; color: #fff; }
.booking-empty { display: grid; align-content: center; justify-items: start; max-width: 720px; padding: clamp(36px, 7vw, 92px); }
.booking-empty h2 { margin: 12px 0 18px; font-size: clamp(2.2rem, 5vw, 5rem); line-height: .92; text-transform: uppercase; }
.empty-actions { display: flex; gap: 24px; margin-top: 28px; }
.empty-actions a { padding: 14px 18px; background: #e8ff2f; color: #070707; text-decoration: none; }
.calendar-heading { padding-bottom: 26px; }
.calendar-layout { display: grid; grid-template-columns: minmax(580px, 1.35fr) minmax(390px, .65fr); gap: 20px; align-items: start; }
.month-panel { overflow: hidden; }
.calendar-toolbar { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; gap: 12px; min-height: 70px; padding: 0 14px; border-bottom: 1px solid var(--cue-border); }
.calendar-toolbar h2 { margin: 0; text-align: center; font-size: 18px; text-transform: capitalize; }
.calendar-toolbar button, .editor-heading > button { min-width: 42px; min-height: 42px; border: 1px solid var(--cue-border); background: var(--cue-raised); color: var(--cue-text); cursor: pointer; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border-left: 1px solid var(--cue-border); }
.weekday { padding: 11px 8px; border-right: 1px solid var(--cue-border); border-bottom: 1px solid var(--cue-border); color: var(--cue-muted); font: 700 10px monospace; text-align: center; }
.day { position: relative; min-height: 82px; padding: 9px; border: 0; border-right: 1px solid var(--cue-border); border-bottom: 1px solid var(--cue-border); background: var(--cue-surface); color: var(--cue-text); text-align: left; cursor: pointer; }
.day:hover { background: var(--cue-raised); }
.day.muted { color: var(--cue-dim); }
.day.selected { box-shadow: inset 0 0 0 1px var(--cue-toggle); background: var(--cue-raised); }
.day small { position: absolute; top: 8px; right: 8px; color: #777; font: 9px monospace; }
.day-statuses { position: absolute; right: 9px; bottom: 10px; left: 9px; display: flex; gap: 6px; align-items: center; }
.status-dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #777; }
.agenda-list .status-dot, .legend .status-dot { margin: 0; }
.status-dot--hold { background: #e8ff2f; }
.status-dot--confirmed { background: var(--cue-mint); }
.status-dot--unavailable { background: #ff8585; }
.legend { display: flex; flex-wrap: wrap; gap: 16px; padding: 16px; color: var(--cue-muted); font-size: 11px; }
.legend span { display: flex; align-items: center; gap: 7px; }
.day-panel { position: sticky; top: 92px; overflow: hidden; }
.day-heading { align-items: center; padding: 18px; border-bottom: 1px solid var(--cue-border); }
.day-heading h2 { font-size: 20px; text-transform: capitalize; }
.add-button { min-height: 40px; padding: 0 16px; border: 0; background: #e8ff2f; color: #070707; cursor: pointer; font-weight: 800; }
.timeline { position: relative; height: 590px; overflow-y: auto; }
.hour-row { display: block; width: 100%; height: 48px; padding: 0 12px; border: 0; border-bottom: 1px solid var(--cue-border); background: transparent; color: var(--cue-muted); text-align: left; cursor: crosshair; }
.hour-row:hover { background: var(--cue-raised); color: var(--cue-accent); }
.hour-row span { position: relative; top: -17px; padding-right: 7px; background: var(--cue-surface); font: 10px monospace; }
.timeline-block { position: absolute; right: 12px; left: 58px; z-index: 2; overflow: hidden; min-height: 42px; padding: 8px 10px; border: 1px solid #666; background: #202020; color: #fff; text-align: left; cursor: pointer; }
.timeline-block strong, .timeline-block span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.timeline-block strong { font-size: 12px; }
.timeline-block span { margin-top: 3px; color: #aaa; font-size: 10px; }
.timeline-block--hold { border-color: #e8ff2f; background: #272a10; }
.timeline-block--confirmed { border-color: #8ce99a; background: #15281a; }
.timeline-block--unavailable { border-color: #ff8585; background: #291818; }
.editor-backdrop { position: fixed; z-index: 40; inset: 0; display: flex; justify-content: flex-end; background: rgba(0, 0, 0, .66); }
.editor-panel { width: min(460px, 100%); box-sizing: border-box; padding: 26px; overflow-y: auto; border-left: 1px solid var(--cue-border); background: var(--cue-surface); color: var(--cue-text); box-shadow: -30px 0 80px rgba(0, 0, 0, .45); }
.editor-heading { padding-bottom: 28px; }
.editor-panel form, .roster-form { display: grid; gap: 18px; }
.form-hint { margin: -8px 0 0; color: #888; font-size: 12px; }
.form-hint--error { color: #ff9b9b; }
.form-hint--success { color: #8ce99a; }
.time-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.primary-button { min-height: 50px; border: 0; background: #e8ff2f; color: #070707; cursor: pointer; font-weight: 900; }
.delete-button { min-height: 46px; border: 1px solid #693737; background: transparent; color: #ff9b9b; cursor: pointer; }
.empty-card { max-width: 760px; margin: 70px auto; padding: clamp(26px, 6vw, 70px); }
.empty-card h1 { margin-bottom: 18px; font-size: clamp(2.4rem, 6vw, 5.5rem); line-height: .9; text-transform: uppercase; }
.roster-form { margin-top: 28px; }
.error-message, .loading-message { width: min(1440px, 100%); box-sizing: border-box; margin: 18px auto 0; padding: 13px 16px; }
.error-message { border: 1px solid #8b3434; color: #ffadad; }
.loading-message { color: #999; }
.history-list { max-width: 1040px; padding-bottom: 64px; }
.history-list > button { display: grid; grid-template-columns: 145px 12px minmax(0, 1fr); gap: 20px; width: 100%; min-height: 104px; padding: 0; border: 0; background: transparent; color: var(--cue-text); text-align: left; cursor: pointer; }
.history-list time { padding-top: 4px; color: var(--cue-muted); font: 700 10px/1.4 monospace; text-transform: uppercase; }
.history-list > button > i { position: relative; width: 9px; height: 9px; margin-top: 5px; border-radius: 50%; background: var(--cue-accent); box-shadow: 0 0 14px color-mix(in srgb, var(--cue-accent) 65%, transparent); }
.history-list > button > i::after { position: absolute; top: 15px; bottom: -86px; left: 4px; width: 1px; background: var(--cue-border); content: ''; }
.history-list > button:last-child > i::after { display: none; }
.history-list > button > div { padding: 0 0 28px; border-bottom: 1px solid var(--cue-border); }
.history-list > button span { display: block; margin-bottom: 7px; color: var(--cue-accent); font: 700 9px/1.3 monospace; letter-spacing: .1em; text-transform: uppercase; }
.history-list > button strong { font-size: 17px; }
.history-list > button p { max-width: 720px; margin: 7px 0 0; color: var(--cue-muted); font-size: 13px; line-height: 1.5; }
.history-list > button small { display: block; margin-top: 10px; color: var(--cue-accent); font: 700 10px/1.3 monospace; text-transform: uppercase; letter-spacing: .08em; }
.history-list > button:hover > div { border-color: var(--cue-accent); }
.settings-panel { display: block; }
.settings-group { display: grid; gap: 10px; padding: 18px 0; border-top: 1px solid var(--cue-border); }
.settings-group > span { color: var(--cue-muted); font: 700 10px monospace; letter-spacing: .1em; text-transform: uppercase; }
.settings-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.settings-options button { min-height: 44px; border: 1px solid var(--cue-border); background: transparent; color: var(--cue-muted); cursor: pointer; font-weight: 800; }
.settings-options button.active { border-color: var(--cue-toggle); background: var(--cue-toggle); color: #070707; }
.password-form { display: grid; gap: 16px; margin-top: 14px; padding-top: 24px; border-top: 1px solid var(--cue-border); }

:global(:root[data-theme='light']) .demo-notice { background: #eeefcf; }
.tour-focus { position: relative; z-index: 32; outline: 2px solid #e8ff2f; outline-offset: 5px; box-shadow: 0 0 18px rgba(232, 255, 47, .7), 0 0 55px rgba(232, 255, 47, .28); animation: tour-pulse 1.5s ease-in-out infinite alternate; }
.tour-card { position: fixed; right: 24px; bottom: 24px; z-index: 60; width: min(390px, calc(100vw - 32px)); box-sizing: border-box; padding: 24px; border: 1px solid #e8ff2f; background: #111; color: #f2f0eb; box-shadow: 0 0 32px rgba(232, 255, 47, .25), 0 24px 80px #000; }
.tour-card > span { color: #e8ff2f; font: 700 10px monospace; letter-spacing: .12em; }
.tour-card > strong { display: block; margin: 17px 0 9px; font-size: 24px; text-transform: uppercase; }
.tour-card > p { margin: 0 0 20px; color: #aaa; font-size: 14px; line-height: 1.55; }
.tour-card .primary-button { width: 100%; }
.tour-card__close { position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border: 0; background: transparent; color: #999; cursor: pointer; font-size: 25px; }
@keyframes tour-pulse { from { box-shadow: 0 0 12px rgba(232, 255, 47, .55), 0 0 35px rgba(232, 255, 47, .2); } to { box-shadow: 0 0 25px rgba(232, 255, 47, .9), 0 0 70px rgba(232, 255, 47, .36); } }

@media (max-width: 1040px) {
  .workspace-header { grid-template-columns: 1fr auto; }
  .workspace-header nav { position: fixed; right: 16px; bottom: 16px; left: 16px; z-index: 30; justify-content: stretch; box-shadow: 0 14px 40px #000; }
  .workspace-header nav button { flex: 1; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .overview-grid, .calendar-layout { grid-template-columns: 1fr; }
  .day-panel { position: static; }
}

@media (max-width: 680px) {
  .workspace { padding: 0 14px 100px; }
  .workspace-header { min-height: 62px; }
  .account-actions { gap: 8px; }
  .view-heading { display: block; padding: 20px 0 20px; }
  h1 { font-size: clamp(2.7rem, 16vw, 4.8rem); }
  .view-heading > div > p:last-child { font-size: 15px; }
  .artist-select { margin-top: 22px; }
  .artist-select select { width: 100%; min-width: 0; }
  .artist-identity { min-width: 0; margin-top: 18px; }
  .summary-grid { grid-template-columns: 1fr; }
  .summary-card { min-height: 132px; }
  .overview-grid { gap: 14px; }
  .bookings-shell { grid-template-columns: 1fr; }
  .booking-filters { display: grid; grid-template-columns: repeat(2, 1fr); border-right: 0; border-bottom: 1px solid #292929; }
  .booking-empty { padding: 34px 20px; }
  .demo-notice { align-items: flex-start; flex-direction: column; }
  .demo-notice__actions { display: grid; width: 100%; }
  .demo-notice__actions button { width: 100%; }
  .demo-booking-workspace { display: block; }
  .demo-booking-workspace .booking-list { margin-bottom: 14px; }
  .empty-actions { align-items: flex-start; flex-direction: column; }
  .calendar-toolbar { min-height: 60px; }
  .weekday { padding: 9px 2px; font-size: 8px; }
  .day { min-height: 58px; padding: 6px; }
  .day small { display: none; }
  .day-statuses { right: 6px; bottom: 7px; left: 6px; gap: 4px; }
  .status-dot { width: 5px; height: 5px; }
  .legend .status-dot { width: 7px; height: 7px; margin: 0; }
  .day-heading { align-items: flex-start; }
  .day-heading h2 { max-width: 210px; font-size: 17px; }
  .timeline { height: 520px; }
  .editor-panel { border-left: 0; }
  .time-fields { grid-template-columns: 1fr; }
  .tour-card { right: 16px; bottom: 86px; }
  .history-list > button { grid-template-columns: 1fr; gap: 7px; padding: 16px 0; border-bottom: 1px solid var(--cue-border); }
  .history-list > button > i { display: none; }
  .history-list > button > div { padding: 0; border: 0; }
}
</style>
