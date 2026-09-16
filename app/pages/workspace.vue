<script setup lang="ts">
import { bookingStatuses, statusTone, type BookingStatus } from '../domain/booking'
import type { FeeBasis } from '../composables/useArtistProfile'

const auth = useCueAuth()
const availability = useAvailability()
const artistProfiles = useArtistProfile()
const preferences = useCuePreferences()
const route = useRoute()
const router = useRouter()

type WorkspaceView = 'overview' | 'bookings' | 'calendar' | 'history' | 'profile'
type ManagedArtist = { id: string; stage_name: string; slug: string; role: 'owner' | 'manager' | 'editor' }
type ManagedOrganization = { id: string; name: string; slug: string; type: 'agency' | 'promoter'; role: 'owner' | 'admin' | 'member' }

type ArtistProfileForm = {
  stageName: string
  bio: string
  city: string
  countryCode: string
  timezone: string
  languages: string
  primaryGenres: string
  secondaryGenres: string
  performanceFormats: string
  eventTypes: string
  yearsActive: string
  websiteUrl: string
  instagramUrl: string
  soundcloudUrl: string
  mixcloudUrl: string
  youtubeUrl: string
  spotifyUrl: string
  coverImagePath: string
  coverPositionY: number
  feeBasis: '' | FeeBasis
  feeMin: string
  feeTypical: string
  currency: string
  setDurationMinutes: string
  acceptsTravel: boolean
  travelRegions: string
  equipmentNotes: string
  technicalRiderUrl: string
  hospitalityRiderUrl: string
}

function emptyProfileForm(): ArtistProfileForm {
  return {
    stageName: '', bio: '', city: '', countryCode: '', timezone: '', languages: '', primaryGenres: '', secondaryGenres: '',
    performanceFormats: '', eventTypes: '', yearsActive: '', websiteUrl: '', instagramUrl: '', soundcloudUrl: '', mixcloudUrl: '', youtubeUrl: '', spotifyUrl: '', coverImagePath: '', coverPositionY: 50,
    feeBasis: '', feeMin: '', feeTypical: '', currency: 'EUR', setDurationMinutes: '', acceptsTravel: false, travelRegions: '', equipmentNotes: '', technicalRiderUrl: '', hospitalityRiderUrl: ''
  }
}

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
const bookingSearch = ref('')
const historySearch = ref('')
const historyPage = ref(1)
const historyPageSize = 10
const sidebarCollapsed = ref(false)
const selectedDemoBookingId = ref('')
const demoReply = ref('')
const tourStep = ref(-1)
const settingsOpen = ref(false)
const passwordCurrent = ref('')
const passwordNew = ref('')
const passwordConfirm = ref('')
const passwordSaving = ref(false)
const passwordMessage = ref('')
const profileForm = ref<ArtistProfileForm>(emptyProfileForm())
const profileLoading = ref(false)
const profileSaving = ref(false)
const profileMessage = ref('')
const profileWelcome = ref(false)
const profilePreviewOpen = ref(false)
const profileCoverUrl = ref('')
const profileCoverUploading = ref(false)
const profileCoverMessage = ref('')
const tourCardStyle = ref<Record<string, string>>({})
let tourPositionTimer: ReturnType<typeof setTimeout> | null = null

const copy = computed(() => preferences.locale.value === 'es' ? {
  overview: 'Resumen', bookings: 'Bookings', calendar: 'Calendario', history: 'Historial', profile: 'Perfil',
  artist: 'Artista', role: 'DJ', settings: 'Ajustes', logout: 'Cerrar sesión',
  loading: 'Cargando workspace…', rosterEyebrow: 'ROSTER / PRIMER ARTISTA', addFirstArtist: 'Añade el primer artista de',
  rosterBody: 'Quedará asociado al roster y podrás empezar a gestionar su actividad.', artistName: 'Nombre artístico', identifier: 'Identificador', creating: 'Creando…', addArtist: 'Añadir artista',
  noArtist: 'No hay un artista gestionable en esta cuenta.', noArtistBody: 'Tu cuenta todavía no tiene un artista o roster asignado.',
  overviewEyebrow: 'WORKSPACE / RESUMEN', overviewTitle: 'QUÉ NECESITA TU ATENCIÓN.', overviewBody: 'Una entrada rápida a los bookings y fechas del artista, sin convertir el calendario en todo el producto.', profileCard: 'Ficha profesional', profileCardBody: 'Completa o actualiza los datos del artista.',
  realBookings: 'Bookings reales', realBookingsBody: 'Aún sin conectar. La bandeja completa está disponible con ejemplos.', holdsMonth: 'Holds este mes', holdsBody: 'Fechas pendientes de decisión.', confirmed: 'Confirmados', confirmedStatus: 'Confirmado', confirmedBody: 'Horarios confirmados este mes.', occupiedDays: 'Días ocupados', occupiedBody: 'Con al menos un horario registrado.',
  agendaEyebrow: 'AGENDA / ESTE MES', upcoming: 'Próximos horarios', viewCalendar: 'Ver calendario', privateSlot: 'Horario privado', noUpcoming: 'No hay horarios próximos registrados en este mes.', addSlot: 'Añadir horario',
  sampleEyebrow: 'BOOKINGS / MODO PRUEBA', sampleTitle: 'PRUEBA LA BANDEJA COMPLETA.', sampleBody: 'Las solicitudes reales todavía no están conectadas a esta cuenta. Puedes probar ahora los filtros, ofertas, conversaciones y cambios de estado con datos simulados.', openBookings: 'Abrir Bookings',
  bookingsEyebrow: 'BOOKINGS / BANDEJA', bookingsTitle: 'TODOS TUS BOOKINGS. UN SOLO HILO.',
  bookingsBody: 'Revisa cada propuesta, responde al promotor y decide la fecha sin perder el contexto.',
  samplesLabel: 'EJEMPLOS INICIALES / DATOS SIMULADOS', samplesActive: 'Tu workspace empieza con solicitudes de muestra.', samplesRemoved: 'Has eliminado las solicitudes de muestra.', samplesBody: 'Los ejemplos pertenecen únicamente a este perfil y navegador. No modifican el calendario privado y puedes retirarlos cuando quieras.', guidedTour: 'Ver recorrido guiado', searchBookings: 'Buscar solicitudes', searchBookingsPlaceholder: 'Sala, promotor, ciudad, evento o ID…', searchResults: 'resultados', searchHistory: 'Buscar en historial', searchHistoryPlaceholder: 'Sala, ciudad, mensaje o estado…', previousPage: 'Anterior', nextPage: 'Siguiente', page: 'Página', collapseSidebar: 'Comprimir menú', expandSidebar: 'Expandir menú', removeSamples: 'Eliminar ejemplos', restoreSamples: 'Restaurar ejemplos', all: 'Todas', noSamples: 'No hay solicitudes de prueba en este estado.',
  sampleBooking: 'BOOKING DE PRUEBA', automaticStatus: 'Estado automático', eventData: 'Datos del evento', date: 'Fecha', city: 'Ciudad', venue: 'Sala', capacity: 'Aforo', offer: 'Oferta', schedule: 'Horario', contact: 'Contacto', name: 'Nombre', phone: 'Tel.', source: 'Origen', bookingLink: 'Enlace de booking', conversation: 'Conversación', replyPromoter: 'Responder al promotor', replyPlaceholder: 'Escribe condiciones, una pregunta o una propuesta…', localMessage: 'Ejemplo local. El mensaje no se envía por email.', sendSampleReply: 'Enviar respuesta de ejemplo', openPromoter: 'Abrir vista del promotor', confirmDate: 'Confirmar fecha', rejectRequest: 'Rechazar solicitud', openRequest: 'Abre una solicitud para ver sus datos, la oferta y la conversación.',
  calendarEyebrow: 'CALENDARIO / DISPONIBILIDAD', calendarTitle: 'FECHAS Y HORARIOS.', calendarBody: 'Abre un día para ver sus 24 horas. Pulsa una hora vacía para crear un horario o un bloque existente para editarlo.', weekdays: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'], unavailable: 'No disponible', dayHours: 'DÍA / 24 HORAS', add: 'Añadir', selectedDaySchedule: 'Horario del día seleccionado', addAt: 'Añadir horario a las',
  historyEyebrow: 'WORKSPACE / HISTORIAL', historyTitle: 'TODO LO QUE HA PASADO.',
  historyBody: 'Abre cualquier movimiento para volver a la oferta y revisar toda la conversación que originó esa acción.',
  historyEmpty: 'Todavía no hay actividad en este perfil.', historyStatus: 'Estado actualizado', historyMessage: 'Mensaje', openTrace: 'Abrir oferta y ver traza', previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente', filterSamples: 'Filtrar bookings de ejemplo',
  profileEyebrow: 'ARTISTA / FICHA PROFESIONAL', profileTitle: 'TU INFORMACIÓN DE BOOKING.', profileBody: 'Completa esta ficha a tu ritmo. Hoy es privada y servirá para organizar mejor tus solicitudes y preparar futuras opciones de descubrimiento.',
  profileOptional: 'Ficha opcional', profileOptionalBody: 'Tu workspace ya está creado. Puedes completar estos datos ahora o volver desde Perfil cuando quieras.', later: 'Ahora no', previewProfile: 'Vista previa', previewPrivate: 'VISTA PRIVADA / NO PUBLICADA', previewClose: 'Cerrar vista previa', previewBioEmpty: 'Tu biografía aparecerá aquí cuando la completes.', previewGenresEmpty: 'Añade géneros para verlos en la ficha.', previewFormats: 'Formatos', previewLinks: 'Escuchar y seguir',
  coverTitle: 'Tu sonido empieza por la imagen.', coverHint: 'Arrastra una foto o elígela. Si no añades ninguna, CueBooker usará esta portada acid y Detroit.', coverChoose: 'Añadir mi portada', coverChange: 'Cambiar portada', coverRemove: 'Usar portada CueBooker', coverPosition: 'Ajustar encuadre vertical', coverUploading: 'Subiendo portada…', coverSaved: 'Portada actualizada.', coverRemoved: 'Portada base restaurada.', coverInvalid: 'Usa JPG, PNG o WebP de hasta 8 MB.', coverError: 'No se pudo guardar la portada.',
  profilePublicSection: 'Identidad y ubicación', profilePublicHint: 'Información profesional preparada para una futura ficha pública. Todavía no se publica.',
  profileSoundSection: 'Sonido y formatos', profileBookingSection: 'Condiciones de booking', profileBookingHint: 'Solo tú y las personas autorizadas de tu equipo pueden ver estos datos.', profileLinksSection: 'Enlaces y material',
  stageName: 'Nombre artístico', bio: 'Biografía', bioPlaceholder: 'Describe el proyecto, su sonido y el tipo de directo.', baseCity: 'Ciudad base', countryCode: 'País', timezone: 'Zona horaria', languages: 'Idiomas', commaHint: 'Separa los valores con comas.',
  primaryGenres: 'Géneros principales', primaryGenresHint: 'Máximo 3.', secondaryGenres: 'Géneros secundarios', performanceFormats: 'Formatos', eventTypes: 'Tipos de evento', yearsActive: 'Años en activo',
  feeBasis: 'Tipo de caché', feeEvent: 'Por actuación', feeSet: 'Por set', feeHour: 'Por hora', feeMin: 'Caché mínimo', feeTypical: 'Caché habitual', currency: 'Moneda', setDuration: 'Duración habitual del set', acceptsTravel: 'Acepto desplazamientos', travelRegions: 'Zonas donde trabajo', equipmentNotes: 'Equipo y necesidades técnicas',
  website: 'Web', instagram: 'Instagram', soundcloud: 'SoundCloud', mixcloud: 'Mixcloud', youtube: 'YouTube', spotify: 'Spotify', technicalRider: 'Rider técnico', hospitalityRider: 'Rider de hospitalidad',
  saveProfile: 'Guardar ficha', profileSaved: 'Ficha guardada.', profileSaveError: 'No se pudo guardar la ficha.', profileCompletion: 'Perfil completado', profileReadOnly: 'Puedes consultar esta ficha, pero solo propietarios y managers pueden editarla.', addWithEnter: 'Escribe y pulsa Enter.', removeChip: 'Eliminar', minutes: 'minutos',
  settingsTitle: 'Ajustes de cuenta', appearance: 'Apariencia', dark: 'Oscuro', light: 'Claro',
  language: 'Idioma', password: 'Cambiar contraseña', currentPassword: 'Contraseña actual',
  newPassword: 'Nueva contraseña', confirmPassword: 'Repetir contraseña', savePassword: 'Guardar contraseña',
  passwordSaved: 'Contraseña actualizada.', passwordMismatch: 'Las contraseñas nuevas no coinciden.',
  passwordLength: 'La nueva contraseña debe tener al menos 8 caracteres.', close: 'Cerrar', accountPrivate: 'CUENTA / PRIVADO',
  editSlot: 'EDITAR HORARIO', newSlot: 'NUEVO HORARIO', privateLabel: 'Etiqueta privada', privatePlaceholder: 'Estudio, desplazamiento, evento…', start: 'Inicio', end: 'Fin', invalidTime: 'La hora de fin debe ser posterior a la hora de inicio.', status: 'Estado', saving: 'Guardando…', saveChanges: 'Guardar cambios', createSlot: 'Crear horario', deleteSlot: 'Eliminar horario', finish: 'Terminar', next: 'Siguiente', closeTour: 'Cerrar recorrido'
} : {
  overview: 'Overview', bookings: 'Bookings', calendar: 'Calendar', history: 'History', profile: 'Profile',
  artist: 'Artist', role: 'DJ', settings: 'Settings', logout: 'Sign out',
  loading: 'Loading workspace…', rosterEyebrow: 'ROSTER / FIRST ARTIST', addFirstArtist: 'Add the first artist for',
  rosterBody: 'They will be linked to the roster so you can start managing their activity.', artistName: 'Artist name', identifier: 'Identifier', creating: 'Creating…', addArtist: 'Add artist',
  noArtist: 'There is no manageable artist in this account.', noArtistBody: 'Your account does not have an assigned artist or roster yet.',
  overviewEyebrow: 'WORKSPACE / OVERVIEW', overviewTitle: 'WHAT NEEDS YOUR ATTENTION.', overviewBody: 'A quick view of the artist’s bookings and dates without making the calendar the whole product.', profileCard: 'Professional profile', profileCardBody: 'Complete or update the artist details.',
  realBookings: 'Real bookings', realBookingsBody: 'Not connected yet. The complete inbox is available with examples.', holdsMonth: 'Holds this month', holdsBody: 'Dates waiting for a decision.', confirmed: 'Confirmed', confirmedStatus: 'Confirmed', confirmedBody: 'Confirmed slots this month.', occupiedDays: 'Occupied days', occupiedBody: 'With at least one registered slot.',
  agendaEyebrow: 'AGENDA / THIS MONTH', upcoming: 'Upcoming slots', viewCalendar: 'View calendar', privateSlot: 'Private slot', noUpcoming: 'There are no upcoming slots registered this month.', addSlot: 'Add slot',
  sampleEyebrow: 'BOOKINGS / SAMPLE MODE', sampleTitle: 'TRY THE COMPLETE INBOX.', sampleBody: 'Real requests are not connected to this account yet. You can try filters, offers, conversations and status changes with sample data.', openBookings: 'Open Bookings',
  bookingsEyebrow: 'BOOKINGS / INBOX', bookingsTitle: 'ALL YOUR BOOKINGS. ONE THREAD.',
  bookingsBody: 'Review every proposal, reply to the promoter and decide each date without losing context.',
  samplesLabel: 'STARTER EXAMPLES / SAMPLE DATA', samplesActive: 'Your workspace starts with sample requests.', samplesRemoved: 'You removed the sample requests.', samplesBody: 'These examples belong only to this profile and browser. They do not change your private calendar and you can remove them whenever you want.', guidedTour: 'View guided tour', searchBookings: 'Search requests', searchBookingsPlaceholder: 'Venue, promoter, city, event or ID…', searchResults: 'results', searchHistory: 'Search history', searchHistoryPlaceholder: 'Venue, city, message or status…', previousPage: 'Previous', nextPage: 'Next', page: 'Page', collapseSidebar: 'Collapse menu', expandSidebar: 'Expand menu', removeSamples: 'Remove examples', restoreSamples: 'Restore examples', all: 'All', noSamples: 'There are no sample requests with this status.',
  sampleBooking: 'SAMPLE BOOKING', automaticStatus: 'Automatic status', eventData: 'Event details', date: 'Date', city: 'City', venue: 'Venue', capacity: 'Capacity', offer: 'Offer', schedule: 'Schedule', contact: 'Contact', name: 'Name', phone: 'Phone', source: 'Source', bookingLink: 'Booking link', conversation: 'Conversation', replyPromoter: 'Reply to promoter', replyPlaceholder: 'Write conditions, a question or a proposal…', localMessage: 'Local example. This message is not sent by email.', sendSampleReply: 'Send sample reply', openPromoter: 'Open promoter view', confirmDate: 'Confirm date', rejectRequest: 'Reject request', openRequest: 'Open a request to view its details, offer and conversation.',
  calendarEyebrow: 'CALENDAR / AVAILABILITY', calendarTitle: 'DATES AND TIMES.', calendarBody: 'Open a day to see all 24 hours. Select an empty hour to create a slot or an existing block to edit it.', weekdays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], unavailable: 'Unavailable', dayHours: 'DAY / 24 HOURS', add: 'Add', selectedDaySchedule: 'Selected day schedule', addAt: 'Add slot at',
  historyEyebrow: 'WORKSPACE / HISTORY', historyTitle: 'EVERYTHING THAT HAPPENED.',
  historyBody: 'Open any activity to return to its offer and review the full conversation that caused it.',
  historyEmpty: 'There is no activity for this profile yet.', historyStatus: 'Status updated', historyMessage: 'Message', openTrace: 'Open offer and view trace', previousMonth: 'Previous month', nextMonth: 'Next month', filterSamples: 'Filter sample bookings',
  profileEyebrow: 'ARTIST / PROFESSIONAL PROFILE', profileTitle: 'YOUR BOOKING INFORMATION.', profileBody: 'Complete this profile at your own pace. It is private today and will help organise requests and prepare future discovery options.',
  profileOptional: 'Optional profile', profileOptionalBody: 'Your workspace is ready. Complete these details now or return from Profile whenever you want.', later: 'Not now', previewProfile: 'Preview', previewPrivate: 'PRIVATE PREVIEW / NOT PUBLISHED', previewClose: 'Close preview', previewBioEmpty: 'Your biography will appear here once completed.', previewGenresEmpty: 'Add genres to see them on the profile.', previewFormats: 'Formats', previewLinks: 'Listen and follow',
  coverTitle: 'Your sound starts with the image.', coverHint: 'Drop a photo or choose one. If you skip it, CueBooker will use this acid and Detroit cover.', coverChoose: 'Add my cover', coverChange: 'Change cover', coverRemove: 'Use CueBooker cover', coverPosition: 'Adjust vertical framing', coverUploading: 'Uploading cover…', coverSaved: 'Cover updated.', coverRemoved: 'Default cover restored.', coverInvalid: 'Use a JPG, PNG or WebP file up to 8 MB.', coverError: 'The cover could not be saved.',
  profilePublicSection: 'Identity and location', profilePublicHint: 'Professional information prepared for a future public profile. It is not published yet.',
  profileSoundSection: 'Sound and formats', profileBookingSection: 'Booking terms', profileBookingHint: 'Only you and authorised team members can see these details.', profileLinksSection: 'Links and material',
  stageName: 'Artist name', bio: 'Biography', bioPlaceholder: 'Describe the project, its sound and performance style.', baseCity: 'Base city', countryCode: 'Country', timezone: 'Time zone', languages: 'Languages', commaHint: 'Separate values with commas.',
  primaryGenres: 'Primary genres', primaryGenresHint: 'Maximum 3.', secondaryGenres: 'Secondary genres', performanceFormats: 'Formats', eventTypes: 'Event types', yearsActive: 'Years active',
  feeBasis: 'Fee basis', feeEvent: 'Per event', feeSet: 'Per set', feeHour: 'Per hour', feeMin: 'Minimum fee', feeTypical: 'Typical fee', currency: 'Currency', setDuration: 'Typical set duration', acceptsTravel: 'I accept travel bookings', travelRegions: 'Regions where I work', equipmentNotes: 'Equipment and technical requirements',
  website: 'Website', instagram: 'Instagram', soundcloud: 'SoundCloud', mixcloud: 'Mixcloud', youtube: 'YouTube', spotify: 'Spotify', technicalRider: 'Technical rider', hospitalityRider: 'Hospitality rider',
  saveProfile: 'Save profile', profileSaved: 'Profile saved.', profileSaveError: 'The profile could not be saved.', profileCompletion: 'Profile completed', profileReadOnly: 'You can view this profile, but only owners and managers can edit it.', addWithEnter: 'Type and press Enter.', removeChip: 'Remove', minutes: 'minutes',
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
const canEditSelectedArtist = computed(() => ['owner', 'manager'].includes(selectedArtist.value?.role || ''))
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
const demoFilteredBookings = computed(() => {
  const query = bookingSearch.value.trim().toLocaleLowerCase(preferences.locale.value === 'es' ? 'es' : 'en')
  return demoActiveBookings.value.filter(item => {
    if (bookingFilter.value !== 'all' && item.status !== bookingFilter.value) return false
    if (!query) return true
    const haystack = [
      item.id,
      item.artistName,
      item.event.name,
      item.event.venue,
      item.event.city,
      item.promoter.name,
      item.promoter.email,
      item.promoter.phone || ''
    ].join(' ').toLocaleLowerCase(preferences.locale.value === 'es' ? 'es' : 'en')
    return haystack.includes(query)
  })
})
const selectedDemoBooking = computed(() => demo.bookings.value.find(item => item.id === selectedDemoBookingId.value))
const demoCounts = computed(() => Object.fromEntries(bookingStatuses.map(status => [status, demoActiveBookings.value.filter(item => item.status === status).length])))
const currentTour = computed(() => tourStep.value >= 0 ? tourSteps.value[tourStep.value] : null)
const hasArtistSelector = computed(() => artists.value.length > 1)
const profileCompletion = computed(() => {
  const fields = [
    profileForm.value.stageName,
    profileForm.value.bio,
    profileForm.value.city,
    profileForm.value.countryCode,
    profileForm.value.primaryGenres,
    profileForm.value.performanceFormats,
    profileForm.value.eventTypes,
    profileForm.value.feeBasis,
    profileForm.value.feeTypical,
    profileForm.value.setDurationMinutes,
    profileForm.value.soundcloudUrl || profileForm.value.mixcloudUrl || profileForm.value.youtubeUrl
  ]
  return Math.round(fields.filter(value => String(value || '').trim()).length / fields.length * 100)
})
const profilePreviewGenres = computed(() => [
  ...splitList(profileForm.value.primaryGenres, 3),
  ...splitList(profileForm.value.secondaryGenres, 8)
].slice(0, 8))
const profilePreviewFormats = computed(() => splitList(profileForm.value.performanceFormats, 6))
const profilePreviewLocation = computed(() => [profileForm.value.city.trim(), profileForm.value.countryCode.trim().toUpperCase()].filter(Boolean).join(', '))
const profilePreviewLinks = computed(() => [
  { label: copy.value.website, url: profileForm.value.websiteUrl },
  { label: copy.value.instagram, url: profileForm.value.instagramUrl },
  { label: copy.value.soundcloud, url: profileForm.value.soundcloudUrl },
  { label: copy.value.mixcloud, url: profileForm.value.mixcloudUrl },
  { label: copy.value.youtube, url: profileForm.value.youtubeUrl },
  { label: copy.value.spotify, url: profileForm.value.spotifyUrl }
]
  .map(link => ({ ...link, url: link.url.trim() }))
  .filter(link => /^https?:\/\//i.test(link.url)))
const profileCoverSource = computed(() => profileCoverUrl.value || '/images/profile/cuebooker-default-cover.webp')
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
const filteredHistoryItems = computed(() => {
  const query = historySearch.value.trim().toLocaleLowerCase(preferences.locale.value === 'es' ? 'es' : 'en')
  if (!query) return historyItems.value
  return historyItems.value.filter(item => [item.kind, item.title, item.detail].join(' ').toLocaleLowerCase(preferences.locale.value === 'es' ? 'es' : 'en').includes(query))
})
const historyPageCount = computed(() => Math.max(1, Math.ceil(filteredHistoryItems.value.length / historyPageSize)))
const paginatedHistoryItems = computed(() => {
  const start = (historyPage.value - 1) * historyPageSize
  return filteredHistoryItems.value.slice(start, start + historyPageSize)
})
const hours = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`)

onMounted(async () => {
  if (import.meta.client) sidebarCollapsed.value = localStorage.getItem('cuebooker.sidebar.collapsed') === 'true'
  await auth.initialize()
  if (!auth.signedIn.value) return navigateTo('/access')
  if (!auth.profile.value) await auth.fetchProfile()
  if (!auth.profile.value?.onboarding_completed) return navigateTo('/onboarding')
  await loadWorkspaceIdentity()
  if (route.query.setup === 'profile') {
    activeView.value = 'profile'
    profileWelcome.value = true
  }
  loading.value = false
})

watch([selectedArtistId, monthCursor], async () => {
  if (selectedArtistId.value) await loadBlocks()
})
watch(selectedArtistId, async (artistId) => {
  if (artistId) await loadArtistProfile()
})
watch(activeView, async (view) => {
  await nextTick()
  const nav = document.getElementById('workspace-navigation')
  const tab = nav?.querySelector<HTMLElement>(`[data-workspace-view="${view}"]`)
  if (!nav || !tab) return
  nav.scrollTo({ left: tab.offsetLeft - (nav.clientWidth - tab.clientWidth) / 2, behavior: 'smooth' })
})
watch(rosterArtistName, value => { rosterArtistSlug.value = slugify(value) })
watch(historySearch, () => { historyPage.value = 1 })
watch(historyPageCount, count => { if (historyPage.value > count) historyPage.value = count })
watch(activeView, view => { if (view !== 'profile') profilePreviewOpen.value = false })
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

watch(profilePreviewOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
  if (profileCoverUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileCoverUrl.value)
  if (import.meta.client) window.removeEventListener('resize', handleViewportChange)
  if (tourPositionTimer) window.clearTimeout(tourPositionTimer)
})
watch(selectedDemoBookingId, async (id) => {
  if (id) await demo.markOpened(id)
})
watch(tourStep, async (step) => {
  const item = tourSteps.value[step]
  if (!item) return
  settingsOpen.value = false
  activeView.value = item.view
  await nextTick()
  scheduleTourPosition()
})

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  if (import.meta.client) localStorage.setItem('cuebooker.sidebar.collapsed', String(sidebarCollapsed.value))
  if (currentTour.value) scheduleTourPosition(120)
}

function prefersReducedMotion() {
  return import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

async function changeView(view: WorkspaceView) {
  settingsOpen.value = false
  activeView.value = view
  await nextTick()
  const target = document.querySelector<HTMLElement>('.workspace .view')
  if (!target) return
  const header = document.getElementById('workspace-header')
  const offset = (header?.getBoundingClientRect().height || 0) + 8
  const top = target.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

async function openSettings() {
  settingsOpen.value = true
  await nextTick()
  document.querySelector<HTMLElement>('.settings-panel')?.focus({ preventScroll: true })
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
}

function scheduleTourPosition(delay = 280) {
  if (!import.meta.client) return
  if (tourPositionTimer) window.clearTimeout(tourPositionTimer)
  tourCardStyle.value = {}
  tourPositionTimer = window.setTimeout(() => void positionTour(), delay)
}

async function positionTour() {
  const item = tourSteps.value[tourStep.value]
  if (!item) return
  await nextTick()

  const target = document.getElementById(item.target)
  const card = document.querySelector<HTMLElement>('.workspace .tour-card')
  if (!target || !card) return

  const edge = 12
  const gap = 12
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  const mobileShell = viewportWidth <= 960
  const headerBottom = mobileShell
    ? document.getElementById('workspace-header')?.getBoundingClientRect().bottom || edge
    : edge
  let targetRect = target.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()
  const safeTop = Math.max(edge, headerBottom + gap)
  const safeBottom = viewportHeight - edge

  let top: number

  if (mobileShell) {
    const isDecisionStep = tourStep.value === tourSteps.value.length - 2
    const fixedBottomTop = Math.max(safeTop, safeBottom - cardRect.height)

    if (isDecisionStep) {
      if (targetRect.top < safeTop || targetRect.bottom > safeBottom) {
        const nextScrollTop = targetRect.top + window.scrollY - safeTop - 8
        window.scrollTo({ top: Math.max(0, nextScrollTop), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
        if (!prefersReducedMotion()) await new Promise(resolve => window.setTimeout(resolve, 240))
        targetRect = target.getBoundingClientRect()
      }
      top = Math.max(safeTop, targetRect.top - cardRect.height - gap)
    } else {
      const targetBottomLimit = fixedBottomTop - gap
      if (targetRect.top < safeTop || targetRect.bottom > targetBottomLimit) {
        const desiredTop = Math.max(safeTop, targetBottomLimit - Math.min(targetRect.height, 180))
        const nextScrollTop = targetRect.top + window.scrollY - desiredTop
        window.scrollTo({ top: Math.max(0, nextScrollTop), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
        if (!prefersReducedMotion()) await new Promise(resolve => window.setTimeout(resolve, 240))
      }
      top = fixedBottomTop
    }
  } else {
    if (targetRect.bottom < safeTop || targetRect.top > safeBottom) {
      const nextScrollTop = targetRect.top + window.scrollY - safeTop
      window.scrollTo({ top: Math.max(0, nextScrollTop), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
      if (!prefersReducedMotion()) await new Promise(resolve => window.setTimeout(resolve, 280))
      targetRect = target.getBoundingClientRect()
    }

    const spaceBelow = safeBottom - targetRect.bottom
    const spaceAbove = targetRect.top - safeTop
    if (spaceBelow >= cardRect.height + gap) top = targetRect.bottom + gap
    else if (spaceAbove >= cardRect.height + gap) top = targetRect.top - cardRect.height - gap
    else top = targetRect.top + targetRect.height / 2 < viewportHeight / 2
      ? safeBottom - cardRect.height
      : safeTop
  }

  const left = mobileShell
    ? edge
    : Math.min(viewportWidth - cardRect.width - edge, Math.max(edge, targetRect.right - cardRect.width))

  const maxTop = Math.max(edge, safeBottom - cardRect.height)
  const resolvedTop = Math.max(edge, Math.min(top, maxTop))

  tourCardStyle.value = {
    '--tour-top': `${resolvedTop}px`,
    '--tour-left': `${left}px`
  }
}

function handleViewportChange() {
  if (currentTour.value) scheduleTourPosition(80)
}

onMounted(() => window.addEventListener('resize', handleViewportChange, { passive: true }))

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function loadWorkspaceIdentity() {
  try {
    const [artistRows, organizationRows] = await Promise.all([availability.listArtists(), availability.listOrganizations()])
    artists.value = artistRows
    organizations.value = organizationRows
    if (!selectedArtistId.value || !artists.value.some(item => item.id === selectedArtistId.value)) selectedArtistId.value = artists.value[0]?.id || ''
    if (selectedArtistId.value) await Promise.all([loadBlocks(), loadArtistProfile()])
  } catch (error: any) {
    errorMessage.value = error?.message || (preferences.locale.value === 'es' ? 'No se pudo cargar el workspace.' : 'The workspace could not be loaded.')
  }
}

function splitList(value: string, limit: number) {
  return Array.from(new Set(value.split(',').map(item => item.trim()).filter(Boolean))).slice(0, limit)
}

function joinList(value: string[] | null | undefined) {
  return (value || []).join(', ')
}

function nullableText(value: string) {
  return value.trim() || null
}

function nullableNumber(value: string) {
  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : null
}

function replaceProfileCoverUrl(nextUrl: string) {
  if (profileCoverUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileCoverUrl.value)
  profileCoverUrl.value = nextUrl
}

async function loadProfileCover(path: string) {
  replaceProfileCoverUrl('')
  if (!path) return
  try {
    replaceProfileCoverUrl(await artistProfiles.getCoverObjectUrl(path))
  } catch {
    profileCoverMessage.value = copy.value.coverError
  }
}

async function selectProfileCover(file: File) {
  if (!selectedArtistId.value || !canEditSelectedArtist.value) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
    profileCoverMessage.value = copy.value.coverInvalid
    return
  }

  const previousPath = profileForm.value.coverImagePath
  replaceProfileCoverUrl(URL.createObjectURL(file))
  profileCoverUploading.value = true
  profileCoverMessage.value = ''
  try {
    const path = await artistProfiles.uploadCover(selectedArtistId.value, file)
    await artistProfiles.saveCover(selectedArtistId.value, path, profileForm.value.coverPositionY)
    profileForm.value.coverImagePath = path
    profileCoverMessage.value = copy.value.coverSaved
    if (previousPath) await artistProfiles.deleteCover(previousPath).catch(() => undefined)
  } catch {
    profileCoverMessage.value = copy.value.coverError
    await loadProfileCover(previousPath)
  } finally {
    profileCoverUploading.value = false
  }
}

async function removeProfileCover() {
  if (!selectedArtistId.value || !canEditSelectedArtist.value || !profileForm.value.coverImagePath) return
  const previousPath = profileForm.value.coverImagePath
  profileCoverUploading.value = true
  profileCoverMessage.value = ''
  try {
    await artistProfiles.saveCover(selectedArtistId.value, null, 50)
    profileForm.value.coverImagePath = ''
    profileForm.value.coverPositionY = 50
    replaceProfileCoverUrl('')
    profileCoverMessage.value = copy.value.coverRemoved
    await artistProfiles.deleteCover(previousPath).catch(() => undefined)
  } catch {
    profileCoverMessage.value = copy.value.coverError
  } finally {
    profileCoverUploading.value = false
  }
}

async function loadArtistProfile() {
  if (!selectedArtistId.value) return
  profileLoading.value = true
  profileMessage.value = ''
  try {
    const record = await artistProfiles.getProfile(selectedArtistId.value)
    const booking = record.booking
    profileForm.value = {
      stageName: record.artist.stage_name,
      bio: record.artist.bio || '',
      city: record.artist.city || '',
      countryCode: record.artist.country_code || '',
      timezone: record.artist.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      languages: joinList(record.artist.languages),
      primaryGenres: joinList(record.artist.primary_genres),
      secondaryGenres: joinList(record.artist.secondary_genres),
      performanceFormats: joinList(record.artist.performance_formats),
      eventTypes: joinList(record.artist.event_types),
      yearsActive: record.artist.years_active === null ? '' : String(record.artist.years_active),
      websiteUrl: record.artist.website_url || '',
      instagramUrl: record.artist.instagram_url || '',
      soundcloudUrl: record.artist.soundcloud_url || '',
      mixcloudUrl: record.artist.mixcloud_url || '',
      youtubeUrl: record.artist.youtube_url || '',
      spotifyUrl: record.artist.spotify_url || '',
      coverImagePath: record.artist.cover_image_path || '',
      coverPositionY: record.artist.cover_position_y ?? 50,
      feeBasis: booking?.fee_basis || '',
      feeMin: booking?.fee_min === null || booking?.fee_min === undefined ? '' : String(booking.fee_min),
      feeTypical: booking?.fee_typical === null || booking?.fee_typical === undefined ? '' : String(booking.fee_typical),
      currency: booking?.currency || 'EUR',
      setDurationMinutes: booking?.set_duration_minutes === null || booking?.set_duration_minutes === undefined ? '' : String(booking.set_duration_minutes),
      acceptsTravel: booking?.accepts_travel || false,
      travelRegions: joinList(booking?.travel_regions),
      equipmentNotes: booking?.equipment_notes || '',
      technicalRiderUrl: booking?.technical_rider_url || '',
      hospitalityRiderUrl: booking?.hospitality_rider_url || ''
    }
    await loadProfileCover(profileForm.value.coverImagePath)
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || copy.value.profileSaveError
  } finally {
    profileLoading.value = false
  }
}

async function saveArtistProfile() {
  if (!selectedArtistId.value || !canEditSelectedArtist.value) return
  profileSaving.value = true
  profileMessage.value = ''
  const form = profileForm.value
  try {
    await artistProfiles.saveProfile(selectedArtistId.value, {
      artist: {
        stage_name: form.stageName.trim(),
        bio: nullableText(form.bio),
        city: nullableText(form.city),
        country_code: nullableText(form.countryCode)?.toUpperCase() || null,
        timezone: nullableText(form.timezone),
        languages: splitList(form.languages, 8),
        primary_genres: splitList(form.primaryGenres, 3),
        secondary_genres: splitList(form.secondaryGenres, 8),
        performance_formats: splitList(form.performanceFormats, 6),
        event_types: splitList(form.eventTypes, 10),
        years_active: nullableNumber(form.yearsActive),
        website_url: nullableText(form.websiteUrl),
        instagram_url: nullableText(form.instagramUrl),
        soundcloud_url: nullableText(form.soundcloudUrl),
        mixcloud_url: nullableText(form.mixcloudUrl),
        youtube_url: nullableText(form.youtubeUrl),
        spotify_url: nullableText(form.spotifyUrl),
        cover_image_path: nullableText(form.coverImagePath),
        cover_position_y: form.coverPositionY
      },
      booking: {
        fee_basis: form.feeBasis || null,
        fee_min: nullableNumber(form.feeMin),
        fee_typical: nullableNumber(form.feeTypical),
        currency: form.currency.trim().toUpperCase(),
        set_duration_minutes: nullableNumber(form.setDurationMinutes),
        accepts_travel: form.acceptsTravel,
        travel_regions: splitList(form.travelRegions, 20),
        equipment_notes: nullableText(form.equipmentNotes),
        technical_rider_url: nullableText(form.technicalRiderUrl),
        hospitality_rider_url: nullableText(form.hospitalityRiderUrl)
      }
    })
    const artist = artists.value.find(item => item.id === selectedArtistId.value)
    if (artist) artist.stage_name = form.stageName.trim()
    profileMessage.value = copy.value.profileSaved
    profileWelcome.value = false
    await router.replace({ query: { ...route.query, setup: undefined } })
  } catch (error: any) {
    profileMessage.value = error?.data?.message || error?.message || copy.value.profileSaveError
  } finally {
    profileSaving.value = false
  }
}

async function dismissProfileWelcome() {
  profileWelcome.value = false
  activeView.value = 'overview'
  await router.replace({ query: { ...route.query, setup: undefined } })
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

async function selectDay(date: string) {
  selectedDate.value = date
  if (date.slice(0, 7) !== monthCursor.value.slice(0, 7)) monthCursor.value = `${date.slice(0, 7)}-01`
  closeEditor()
  if (!import.meta.client || window.innerWidth > 960) return
  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  const panel = document.getElementById('workspace-day-panel')
  const header = document.getElementById('workspace-header')
  if (!panel) return
  const offset = (header?.getBoundingClientRect().height || 0) + 8
  const top = panel.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
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

async function selectDemoBooking(bookingId: string) {
  const nextId = selectedDemoBookingId.value === bookingId ? '' : bookingId
  selectedDemoBookingId.value = nextId
  if (!nextId) return

  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  const detail = document.getElementById(`booking-thread-${nextId}`)
  if (!detail) return
  const header = document.getElementById('workspace-header')
  const headerOffset = header ? Math.ceil(header.getBoundingClientRect().height) + 12 : 16
  const detailTitle = detail.querySelector<HTMLElement>(':scope > header h2') || detail
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (window.innerWidth <= 960) {
    const bookingTools = document.querySelector<HTMLElement>('.bookings-view .booking-tools')
    const mobileAnchor = bookingTools || detailTitle
    // Pin the booking tools directly below the sticky mobile header, then reveal the selected title immediately after them.
    const top = mobileAnchor.getBoundingClientRect().top + window.scrollY - headerOffset - 12
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })
  } else {
    const top = detailTitle.getBoundingClientRect().top + window.scrollY - headerOffset
    window.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  detail.focus({ preventScroll: true })
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
  tourCardStyle.value = {}
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
  <main class="workspace" :class="{ 'workspace--sidebar-collapsed': sidebarCollapsed }">
    <header id="workspace-header" class="workspace-header">
      <div class="workspace-brand-row">
        <NuxtLink class="brand" to="/" aria-label="Cuebooker">
          <CueBrand class="workspace-brand-wordmark" />
          <CueBrand class="workspace-brand-icon" variant="icon" />
        </NuxtLink>
        <button class="sidebar-collapse-button" type="button" :aria-label="sidebarCollapsed ? copy.expandSidebar : copy.collapseSidebar" :title="sidebarCollapsed ? copy.expandSidebar : copy.collapseSidebar" @click="toggleSidebar">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 4 12l5 7M20 5v14"/></svg>
        </button>
      </div>
      <nav id="workspace-navigation" aria-label="Workspace">
        <button :title="copy.overview" data-workspace-view="overview" :class="{ active: activeView === 'overview' && !settingsOpen }" type="button" @click="changeView('overview')">{{ copy.overview }}</button>
        <button :title="copy.bookings" data-workspace-view="bookings" :class="{ active: activeView === 'bookings' && !settingsOpen }" type="button" @click="changeView('bookings')">{{ copy.bookings }}</button>
        <button :title="copy.calendar" data-workspace-view="calendar" :class="{ active: activeView === 'calendar' && !settingsOpen }" type="button" @click="changeView('calendar')">{{ copy.calendar }}</button>
        <button :title="copy.history" data-workspace-view="history" :class="{ active: activeView === 'history' && !settingsOpen }" type="button" @click="changeView('history')">{{ copy.history }}</button>
        <button :title="copy.profile" data-workspace-view="profile" :class="{ active: activeView === 'profile' && !settingsOpen }" type="button" @click="changeView('profile')">{{ copy.profile }}</button>
        <button :title="copy.settings" data-workspace-view="settings" :class="{ active: settingsOpen }" type="button" @click="openSettings">{{ copy.settings }}</button>
      </nav>
      <div class="account-actions">
        <CuePreferencesControl compact />
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
          <button class="summary-card summary-card--profile" type="button" @click="activeView = 'profile'"><span>{{ copy.profileCard }}</span><strong>{{ profileCompletion }}%</strong><p>{{ copy.profileCardBody }} →</p></button>
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

        <div class="booking-tools">
          <label class="booking-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
            <span class="sr-only">{{ copy.searchBookings }}</span>
            <input v-model="bookingSearch" type="search" :placeholder="copy.searchBookingsPlaceholder" :aria-label="copy.searchBookings">
          </label>
          <span class="booking-search-count">{{ demoFilteredBookings.length }} / {{ demoActiveBookings.length }} {{ copy.searchResults }}</span>
        </div>

        <div id="workspace-filters" class="status-filters" :class="{ 'tour-focus': tourStep === 1 }" :aria-label="copy.filterSamples">
          <button :class="{ active: bookingFilter === 'all' }" type="button" @click="bookingFilter = 'all'">{{ copy.all }} <strong>{{ demoActiveBookings.length }}</strong></button>
          <button v-for="status in bookingStatuses.filter(item => item !== 'rejected')" :key="status" type="button" :class="[{ active: bookingFilter === status }, `tone-${statusTone[status]}`]" @click="bookingFilter = status"><i />{{ demoStatusLabel(status) }} <strong>{{ demoCounts[status] }}</strong></button>
        </div>

        <div class="booking-workspace demo-booking-workspace">
          <div id="workspace-list" class="booking-list" :class="{ 'tour-focus': tourStep === 2 }">
            <button v-for="booking in demoFilteredBookings" :key="booking.id" type="button" :class="{ active: selectedDemoBookingId === booking.id }" @click="selectDemoBooking(booking.id)">
              <span class="booking-list__date">{{ formatDemoDate(booking.event.date) }}</span>
              <span><strong>{{ booking.event.venue }}</strong><small>{{ booking.artistName }} · {{ booking.event.city }}</small></span>
              <span :class="`status-pill tone-${statusTone[booking.status]}`"><i />{{ demoStatusLabel(booking.status) }}</span>
            </button>
            <p v-if="!demoFilteredBookings.length" class="workspace-empty">{{ copy.noSamples }}</p>
          </div>

          <article v-if="selectedDemoBooking" :id="`booking-thread-${selectedDemoBooking.id}`" class="booking-detail" tabindex="-1">
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

          <section id="workspace-day-panel" class="day-panel panel">
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

      <section v-else-if="activeView === 'history'" class="view history-view">
        <div class="view-heading">
          <div><p class="eyebrow">{{ copy.historyEyebrow }}</p><h1>{{ copy.historyTitle }}</h1><p>{{ copy.historyBody }}</p></div>
          <label v-if="hasArtistSelector" class="artist-select"><span>{{ copy.artist }}</span><select v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
          <div v-else class="artist-identity"><span>{{ copy.artist }}</span><small>{{ copy.role }}</small><strong><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 14h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z"/></svg>{{ selectedArtist?.stage_name }}</strong></div>
        </div>
        <div v-if="historyItems.length" class="history-tools">
          <label class="booking-search history-search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg>
            <span class="sr-only">{{ copy.searchHistory }}</span>
            <input v-model="historySearch" type="search" :placeholder="copy.searchHistoryPlaceholder" :aria-label="copy.searchHistory">
          </label>
          <span>{{ filteredHistoryItems.length }} / {{ historyItems.length }}</span>
        </div>
        <div v-if="paginatedHistoryItems.length" class="history-list">
          <button v-for="item in paginatedHistoryItems" :id="item.id === `status-${item.bookingId}` ? `history-booking-${item.bookingId}` : undefined" :key="item.id" type="button" :aria-label="`${copy.openTrace}: ${item.title}`" @click="openHistoryItem(item.bookingId)"><time>{{ formatDemoTime(item.at) }}</time><i /><div><span>{{ item.kind }}</span><strong>{{ item.title }}</strong><p>{{ item.detail }}</p><small>{{ copy.openTrace }} <svg class="inline-arrow-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 7l5 5-5 5"/></svg></small></div></button>
        </div>
        <div v-if="filteredHistoryItems.length > historyPageSize" class="history-pagination" aria-label="Pagination">
          <button type="button" :disabled="historyPage <= 1" @click="historyPage -= 1">{{ copy.previousPage }}</button>
          <span>{{ copy.page }} {{ historyPage }} / {{ historyPageCount }}</span>
          <button type="button" :disabled="historyPage >= historyPageCount" @click="historyPage += 1">{{ copy.nextPage }}</button>
        </div>
        <p v-if="!paginatedHistoryItems.length" class="workspace-empty">{{ copy.historyEmpty }}</p>
      </section>

      <section v-else class="view profile-view">
        <div class="view-heading">
          <div><p class="eyebrow">{{ copy.profileEyebrow }}</p><h1>{{ copy.profileTitle }}</h1><p>{{ copy.profileBody }}</p></div>
          <div class="profile-heading-actions">
            <label v-if="hasArtistSelector" class="artist-select"><span>{{ copy.artist }}</span><select v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
            <div v-else class="profile-progress"><span>{{ copy.profileCompletion }}</span><strong>{{ profileCompletion }}%</strong><i><b :style="{ width: `${profileCompletion}%` }" /></i></div>
            <button class="profile-preview-button" type="button" @click="profilePreviewOpen = true"><span>{{ copy.previewProfile }}</span><svg class="external-link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></button>
          </div>
        </div>

        <aside v-if="profileWelcome" class="profile-welcome">
          <div><span>{{ copy.profileOptional }}</span><strong>{{ copy.profileOptionalBody }}</strong></div>
          <button type="button" @click="dismissProfileWelcome">{{ copy.later }}</button>
        </aside>

        <p v-if="profileLoading" class="loading-message">{{ copy.loading }}</p>
        <form v-else class="profile-form" @submit.prevent="saveArtistProfile">
          <p v-if="!canEditSelectedArtist" class="profile-readonly">{{ copy.profileReadOnly }}</p>
          <fieldset class="profile-fieldset" :disabled="!canEditSelectedArtist">
          <section class="profile-section">
            <header><div><p class="eyebrow">01</p><h2>{{ copy.profilePublicSection }}</h2></div><p>{{ copy.profilePublicHint }}</p></header>
            <ProfileCoverUploader
              class="profile-cover-field"
              :image-url="profileCoverUrl"
              :position-y="profileForm.coverPositionY"
              :disabled="!canEditSelectedArtist"
              :uploading="profileCoverUploading"
              :title="copy.coverTitle"
              :hint="copy.coverHint"
              :choose-label="copy.coverChoose"
              :change-label="copy.coverChange"
              :remove-label="copy.coverRemove"
              :position-label="copy.coverPosition"
              :uploading-label="copy.coverUploading"
              @select="selectProfileCover"
              @remove="removeProfileCover"
              @update:position-y="profileForm.coverPositionY = $event"
            />
            <p v-if="profileCoverMessage" class="profile-cover-message" :class="{ success: profileCoverMessage === copy.coverSaved || profileCoverMessage === copy.coverRemoved }">{{ profileCoverMessage }}</p>
            <div class="profile-fields">
              <label class="field-wide"><span>{{ copy.stageName }}</span><input v-model="profileForm.stageName" maxlength="120" required></label>
              <label class="field-wide"><span>{{ copy.bio }}</span><textarea v-model="profileForm.bio" rows="5" maxlength="2000" :placeholder="copy.bioPlaceholder" /></label>
              <label><span>{{ copy.baseCity }}</span><input v-model="profileForm.city" maxlength="120" autocomplete="address-level2"></label>
              <label><span>{{ copy.countryCode }}</span><input v-model="profileForm.countryCode" maxlength="2" pattern="[A-Za-z]{2}" placeholder="ES" autocomplete="country"></label>
              <label><span>{{ copy.timezone }}</span><input v-model="profileForm.timezone" maxlength="80" placeholder="Europe/Madrid"></label>
              <div class="chip-field"><span>{{ copy.languages }}</span><ProfileChipInput v-model="profileForm.languages" :limit="8" placeholder="Español" :remove-label="copy.removeChip" /><small>{{ copy.addWithEnter }}</small></div>
              <label><span>{{ copy.yearsActive }}</span><input v-model="profileForm.yearsActive" type="number" min="0" max="80"></label>
            </div>
          </section>

          <section class="profile-section">
            <header><div><p class="eyebrow">02</p><h2>{{ copy.profileSoundSection }}</h2></div></header>
            <div class="profile-fields">
              <div class="chip-field"><span>{{ copy.primaryGenres }}</span><ProfileChipInput v-model="profileForm.primaryGenres" :limit="3" placeholder="Techno" :remove-label="copy.removeChip" /><small>{{ copy.primaryGenresHint }} {{ copy.addWithEnter }}</small></div>
              <div class="chip-field"><span>{{ copy.secondaryGenres }}</span><ProfileChipInput v-model="profileForm.secondaryGenres" :limit="8" placeholder="Trance" :remove-label="copy.removeChip" /><small>{{ copy.addWithEnter }}</small></div>
              <div class="chip-field"><span>{{ copy.performanceFormats }}</span><ProfileChipInput v-model="profileForm.performanceFormats" :limit="6" placeholder="DJ set" :remove-label="copy.removeChip" /><small>{{ copy.addWithEnter }}</small></div>
              <div class="chip-field"><span>{{ copy.eventTypes }}</span><ProfileChipInput v-model="profileForm.eventTypes" :limit="10" placeholder="Club" :remove-label="copy.removeChip" /><small>{{ copy.addWithEnter }}</small></div>
            </div>
          </section>

          <section class="profile-section profile-section--private">
            <header><div><p class="eyebrow">03 / PRIVADO</p><h2>{{ copy.profileBookingSection }}</h2></div><p>{{ copy.profileBookingHint }}</p></header>
            <div class="profile-fields">
              <label><span>{{ copy.feeBasis }}</span><select v-model="profileForm.feeBasis"><option value="">—</option><option value="event">{{ copy.feeEvent }}</option><option value="set">{{ copy.feeSet }}</option><option value="hour">{{ copy.feeHour }}</option></select></label>
              <label><span>{{ copy.feeMin }}</span><input v-model="profileForm.feeMin" type="number" min="0" step="0.01"></label>
              <label><span>{{ copy.feeTypical }}</span><input v-model="profileForm.feeTypical" type="number" min="0" step="0.01"></label>
              <label><span>{{ copy.currency }}</span><input v-model="profileForm.currency" maxlength="3" pattern="[A-Za-z]{3}" placeholder="EUR"></label>
              <label><span>{{ copy.setDuration }}</span><div class="input-suffix"><input v-model="profileForm.setDurationMinutes" type="number" min="15" max="1440" step="15"><small>{{ copy.minutes }}</small></div></label>
              <label class="checkbox-field"><input v-model="profileForm.acceptsTravel" type="checkbox"><span>{{ copy.acceptsTravel }}</span></label>
              <div class="chip-field field-wide"><span>{{ copy.travelRegions }}</span><ProfileChipInput v-model="profileForm.travelRegions" :limit="20" placeholder="Catalunya" :remove-label="copy.removeChip" /><small>{{ copy.addWithEnter }}</small></div>
              <label class="field-wide"><span>{{ copy.equipmentNotes }}</span><textarea v-model="profileForm.equipmentNotes" rows="4" maxlength="2000" /></label>
            </div>
          </section>

          <section class="profile-section">
            <header><div><p class="eyebrow">04</p><h2>{{ copy.profileLinksSection }}</h2></div></header>
            <div class="profile-fields">
              <label><span>{{ copy.website }}</span><input v-model="profileForm.websiteUrl" type="url" placeholder="https://"></label>
              <label><span>{{ copy.instagram }}</span><input v-model="profileForm.instagramUrl" type="url" placeholder="https://instagram.com/"></label>
              <label><span>{{ copy.soundcloud }}</span><input v-model="profileForm.soundcloudUrl" type="url" placeholder="https://soundcloud.com/"></label>
              <label><span>{{ copy.mixcloud }}</span><input v-model="profileForm.mixcloudUrl" type="url" placeholder="https://mixcloud.com/"></label>
              <label><span>{{ copy.youtube }}</span><input v-model="profileForm.youtubeUrl" type="url" placeholder="https://youtube.com/"></label>
              <label><span>{{ copy.spotify }}</span><input v-model="profileForm.spotifyUrl" type="url" placeholder="https://open.spotify.com/"></label>
              <label><span>{{ copy.technicalRider }}</span><input v-model="profileForm.technicalRiderUrl" type="url" placeholder="https://"></label>
              <label><span>{{ copy.hospitalityRider }}</span><input v-model="profileForm.hospitalityRiderUrl" type="url" placeholder="https://"></label>
            </div>
          </section>
          </fieldset>

          <footer class="profile-savebar">
            <div><span>{{ copy.profileCompletion }}</span><strong>{{ profileCompletion }}%</strong></div>
            <p v-if="profileMessage" :class="{ success: profileMessage === copy.profileSaved }">{{ profileMessage }}</p>
            <button class="primary-button" type="submit" :disabled="profileSaving || !canEditSelectedArtist">{{ profileSaving ? copy.saving : copy.saveProfile }}</button>
          </footer>
        </form>
      </section>
    </template>

    <div v-if="profilePreviewOpen" class="profile-preview-backdrop" @click.self="profilePreviewOpen = false">
      <article class="profile-preview" role="dialog" aria-modal="true" aria-labelledby="profile-preview-title">
        <header>
          <p>{{ copy.previewPrivate }}</p>
          <button type="button" :aria-label="copy.previewClose" @click="profilePreviewOpen = false">×</button>
        </header>
        <section class="profile-preview-hero">
          <img :src="profileCoverSource" alt="" :style="{ objectPosition: `50% ${profileForm.coverPositionY}%` }">
          <div class="profile-preview-hero-shade" />
          <p v-if="profilePreviewLocation">{{ profilePreviewLocation }}</p>
          <h2 id="profile-preview-title">{{ profileForm.stageName || selectedArtist?.stage_name }}</h2>
          <div v-if="profilePreviewGenres.length" class="profile-preview-chips"><span v-for="genre in profilePreviewGenres" :key="genre">{{ genre }}</span></div>
          <p v-else class="profile-preview-empty">{{ copy.previewGenresEmpty }}</p>
        </section>
        <section class="profile-preview-body">
          <p class="profile-preview-bio">{{ profileForm.bio || copy.previewBioEmpty }}</p>
          <div v-if="profilePreviewFormats.length" class="profile-preview-block"><span>{{ copy.previewFormats }}</span><strong>{{ profilePreviewFormats.join(' · ') }}</strong></div>
          <div v-if="profilePreviewLinks.length" class="profile-preview-block"><span>{{ copy.previewLinks }}</span><nav><a v-for="link in profilePreviewLinks" :key="link.label" :href="link.url" target="_blank" rel="noopener noreferrer"><span>{{ link.label }}</span><svg class="external-link-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg></a></nav></div>
        </section>
      </article>
    </div>

    <div v-if="settingsOpen" class="editor-backdrop" @click.self="settingsOpen = false">
      <aside class="editor-panel settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title" tabindex="-1">
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

    <aside v-if="currentTour" class="tour-card" role="dialog" aria-live="polite" aria-labelledby="tour-card-title" :style="tourCardStyle">
      <button class="tour-card__close" type="button" :aria-label="copy.closeTour" @click="closeTour">×</button>
      <span>{{ String(tourStep + 1).padStart(2, '0') }} / {{ String(tourSteps.length).padStart(2, '0') }}</span>
      <strong id="tour-card-title">{{ currentTour.title }}</strong>
      <p>{{ currentTour.body }}</p>
      <button class="primary-button" type="button" @click="nextTourStep">{{ tourStep === tourSteps.length - 1 ? copy.finish : copy.next }}</button>
    </aside>
  </main>
</template>

<style scoped>
:global(body) { margin: 0; background: var(--cue-bg); }
button, select, input, textarea { font: inherit; }
button, a, select { -webkit-tap-highlight-color: transparent; }
.workspace { min-height: 100vh; padding: 0 28px 64px; background: var(--cue-bg); color: var(--cue-text); font-family: Arial, Helvetica, sans-serif; }
.workspace-header { position: sticky; z-index: 20; top: 0; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 64px; margin-inline: -28px; padding-inline: 28px; border-bottom: 1px solid var(--cue-border); background: color-mix(in srgb, var(--cue-bg) 94%, transparent); backdrop-filter: blur(12px); }
.brand { color: inherit; text-decoration: none; font-weight: 900; letter-spacing: .08em; }
.brand span { color: var(--cue-toggle); }
.eyebrow { color: var(--cue-accent); }
.workspace-header nav { display: flex; flex-wrap: nowrap; gap: 3px; min-width: 0; max-width: min(620px, 52vw); padding: 3px; overflow-x: auto; border: 1px solid var(--cue-border); border-radius: 999px; background: var(--cue-surface); scrollbar-width: none; }
.workspace-header nav::-webkit-scrollbar { display: none; }
.workspace-header nav button { flex: 0 0 auto; min-height: 34px; padding: 0 14px; border: 0; border-radius: 999px; background: transparent; color: var(--cue-muted); cursor: pointer; font-size: 12px; font-weight: 700; white-space: nowrap; }
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
textarea { box-sizing: border-box; width: 100%; padding: 13px; resize: vertical; border: 1px solid var(--cue-border); border-radius: 0; outline: none; background: var(--cue-surface); color: var(--cue-text); }
select:focus, input:focus, textarea:focus { border-color: #e8ff2f; }
.artist-select select { min-width: 220px; }
.artist-identity { display: grid; min-width: 220px; padding: 12px 0 3px; border-top: 1px solid var(--cue-border); }
.artist-identity > span, .artist-identity > small { color: var(--cue-muted); font: 700 9px/1.3 monospace; letter-spacing: .12em; text-transform: uppercase; }
.artist-identity > small { margin-top: 4px; color: var(--cue-accent); }
.artist-identity strong { display: flex; align-items: center; gap: 9px; margin-top: 8px; font-size: 16px; }
.artist-identity svg { width: 20px; height: 20px; color: var(--cue-accent); }
.summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); border-top: 1px solid var(--cue-border); border-left: 1px solid var(--cue-border); }
.summary-card { min-height: 170px; padding: 22px; border-right: 1px solid var(--cue-border); border-bottom: 1px solid var(--cue-border); background: var(--cue-surface); color: var(--cue-text); }
.summary-card--profile { font: inherit; text-align: left; cursor: pointer; }
.summary-card--profile:hover, .summary-card--profile:focus-visible { background: color-mix(in srgb, var(--cue-toggle) 10%, var(--cue-surface)); outline: none; }
.summary-card--profile strong { color: var(--cue-toggle); }
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
.panel-empty button { padding: 0; color: var(--cue-accent); }
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
.booking-detail { scroll-margin-top: 84px; }
.booking-detail:focus { outline: none; }
.profile-view { padding-bottom: 0; }
.profile-progress { display: grid; min-width: 220px; gap: 7px; }
.profile-progress > span, .profile-savebar span { color: var(--cue-muted); font: 700 10px/1.3 monospace; letter-spacing: .1em; text-transform: uppercase; }
.profile-progress > strong { font-size: 28px; }
.profile-progress > i { display: block; overflow: hidden; height: 5px; background: var(--cue-border); }
.profile-progress > i > b { display: block; height: 100%; background: var(--cue-toggle); transition: width .25s ease; }
.profile-heading-actions { display: grid; justify-items: stretch; min-width: 220px; gap: 12px; }
.profile-preview-button { min-height: 42px; padding: 0 16px; border: 1px solid var(--cue-border); background: transparent; color: var(--cue-text); cursor: pointer; font-weight: 800; }
.profile-preview-button:hover, .profile-preview-button:focus-visible { border-color: var(--cue-toggle); outline: none; }
.profile-welcome { display: flex; justify-content: space-between; align-items: center; gap: 24px; margin-bottom: 18px; padding: 20px 22px; border: 1px solid color-mix(in srgb, var(--cue-toggle) 55%, var(--cue-border)); background: color-mix(in srgb, var(--cue-toggle) 8%, var(--cue-surface)); }
.profile-welcome span { display: block; margin-bottom: 7px; color: var(--cue-accent); font: 700 10px/1.2 monospace; letter-spacing: .1em; text-transform: uppercase; }
.profile-welcome strong { max-width: 820px; font-size: 15px; line-height: 1.5; }
.profile-welcome button { flex: 0 0 auto; min-height: 42px; padding: 0 16px; border: 1px solid var(--cue-border); background: transparent; color: var(--cue-text); cursor: pointer; font-weight: 800; }
.profile-cover-field { margin: 0 22px; }
.profile-cover-message { margin: 12px 22px 0; color: #ff9b9b; font-size: 12px; }
.profile-cover-message.success { color: #8ce99a; }
.profile-form { display: grid; gap: 18px; }
.profile-fieldset { display: grid; gap: 18px; margin: 0; padding: 0; border: 0; min-width: 0; }
.profile-fieldset:disabled { opacity: .72; }
.profile-readonly { margin: 0; padding: 12px 14px; border: 1px solid var(--cue-border); color: var(--cue-muted); background: var(--cue-surface); }
.profile-section { border: 1px solid var(--cue-border); background: var(--cue-surface); }
.profile-section--private { border-color: color-mix(in srgb, var(--cue-accent) 44%, var(--cue-border)); }
.profile-section > header { display: flex; justify-content: space-between; align-items: flex-start; gap: 30px; padding: 22px; border-bottom: 1px solid var(--cue-border); }
.profile-section > header h2 { margin: 7px 0 0; font-size: clamp(1.4rem, 3vw, 2.3rem); text-transform: uppercase; }
.profile-section > header > p { max-width: 500px; margin: 0; color: var(--cue-muted); font-size: 13px; line-height: 1.5; }
.profile-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; padding: 22px; }
.profile-fields label, .profile-fields .chip-field { display: grid; align-content: start; gap: 8px; }
.profile-fields label > span, .profile-fields .chip-field > span { color: var(--cue-muted); font: 700 10px/1.2 monospace; letter-spacing: .09em; text-transform: uppercase; }
.profile-fields label > small, .profile-fields .chip-field > small { margin-top: -3px; color: var(--cue-dim); font-size: 11px; }
.profile-fields .field-wide { grid-column: 1 / -1; }
.profile-fields .checkbox-field { display: flex; align-items: center; align-self: end; min-height: 46px; padding: 0 13px; border: 1px solid var(--cue-border); }
.profile-fields .checkbox-field input { width: 18px; min-height: 18px; margin: 0 10px 0 0; accent-color: var(--cue-toggle); }
.profile-fields .checkbox-field span { color: var(--cue-text); }
.input-suffix { display: grid; grid-template-columns: 1fr auto; align-items: center; border: 1px solid var(--cue-border); }
.input-suffix input { border: 0; }
.input-suffix small { padding-right: 13px; color: var(--cue-muted); font-size: 11px; }
.profile-savebar { position: sticky; z-index: 10; bottom: 0; display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 20px; padding: 15px 18px; border: 1px solid var(--cue-border); background: color-mix(in srgb, var(--cue-bg) 97%, transparent); box-shadow: 0 -12px 34px var(--cue-shadow); backdrop-filter: blur(14px); }
.profile-savebar > div { display: flex; align-items: baseline; gap: 10px; }
.profile-savebar > div strong { font-size: 22px; }
.profile-savebar > p { margin: 0; color: #ff9b9b; font-size: 12px; }
.profile-savebar > p.success { color: #8ce99a; }
.profile-savebar .primary-button { min-width: 180px; padding: 0 18px; }
.profile-preview-backdrop { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 24px; overflow-y: auto; background: rgba(0,0,0,.82); backdrop-filter: blur(9px); }
.profile-preview { width: min(980px, 100%); max-height: calc(100dvh - 48px); overflow-y: auto; border: 1px solid #343434; background: #0b0b0b; color: #f4f2ed; box-shadow: 0 30px 100px #000; }
.profile-preview > header { position: sticky; z-index: 2; top: 0; display: flex; justify-content: space-between; align-items: center; min-height: 58px; padding: 0 22px; border-bottom: 1px solid #343434; background: rgba(11,11,11,.95); }
.profile-preview > header p { margin: 0; color: #cfff57; font: 700 10px/1.3 monospace; letter-spacing: .12em; }
.profile-preview > header button { width: 38px; height: 38px; border: 1px solid #343434; border-radius: 50%; background: transparent; color: #f4f2ed; cursor: pointer; font-size: 25px; }
.profile-preview-hero { position: relative; min-height: 420px; padding: clamp(40px,7vw,84px); overflow: hidden; border-bottom: 1px solid #343434; background: #0b0b0b; isolation: isolate; }
.profile-preview-hero > img { position: absolute; z-index: -2; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.profile-preview-hero-shade { position: absolute; z-index: -1; inset: 0; background: linear-gradient(90deg,rgba(0,0,0,.88),rgba(0,0,0,.44) 64%,rgba(0,0,0,.2)),linear-gradient(0deg,rgba(0,0,0,.75),transparent 55%); }
.profile-preview-hero > p:first-child { margin: 0 0 18px; color: #a5a5a5; font: 700 11px/1.3 monospace; letter-spacing: .12em; text-transform: uppercase; }
.profile-preview-hero h2 { max-width: 820px; margin: 0 0 30px; font-size: clamp(4rem,11vw,9rem); line-height: .78; letter-spacing: -.075em; text-transform: uppercase; overflow-wrap: anywhere; }
.profile-preview-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.profile-preview-chips span { padding: 9px 12px; border: 1px solid #4a4a4a; color: #d9d9d9; font-size: 12px; font-weight: 800; }
.profile-preview-empty { color: #777; }
.profile-preview-body { display: grid; grid-template-columns: minmax(0,1.4fr) minmax(240px,.6fr); gap: 50px; padding: clamp(30px,6vw,70px); }
.profile-preview-bio { margin: 0; font-size: clamp(1.2rem,2.4vw,1.8rem); line-height: 1.55; white-space: pre-wrap; }
.profile-preview-block { display: grid; align-content: start; gap: 10px; }
.profile-preview-block + .profile-preview-block { margin-top: 28px; }
.profile-preview-block > span { color: #777; font: 700 10px/1.3 monospace; letter-spacing: .12em; text-transform: uppercase; }
.profile-preview-block strong { line-height: 1.5; }
.profile-preview-block nav { display: flex; flex-wrap: wrap; gap: 8px; }
.profile-preview-block a { padding: 9px 11px; border: 1px solid #343434; color: #f4f2ed; font-size: 11px; font-weight: 800; text-decoration: none; }
.settings-panel { display: block; }
.settings-group { display: grid; gap: 10px; padding: 18px 0; border-top: 1px solid var(--cue-border); }
.settings-group > span { color: var(--cue-muted); font: 700 10px monospace; letter-spacing: .1em; text-transform: uppercase; }
.settings-options { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.settings-options button { min-height: 44px; border: 1px solid var(--cue-border); background: transparent; color: var(--cue-muted); cursor: pointer; font-weight: 800; }
.settings-options button.active { border-color: var(--cue-toggle); background: var(--cue-toggle); color: #070707; }
.password-form { display: grid; gap: 16px; margin-top: 14px; padding-top: 24px; border-top: 1px solid var(--cue-border); }

:global(:root[data-theme='light']) .panel-empty button,
:global(:root[data-theme='light']) .demo-notice span { color: var(--cue-accent); }
:global(:root[data-theme='light']) .demo-notice { border-color: color-mix(in srgb, var(--cue-accent) 32%, var(--cue-border)); background: var(--cue-surface); }
:global(:root[data-theme='light']) .demo-notice__actions button { border-color: color-mix(in srgb, var(--cue-accent) 48%, var(--cue-border)); color: var(--cue-accent); }
:global(:root[data-theme='light']) .demo-notice__actions .guide-action,
:global(:root[data-theme='light']) .add-button { border-color: var(--cue-accent); background: var(--cue-accent); color: var(--cue-accent-ink); }
:global(:root[data-theme='light']) .tone-lime { color: #5127c7 !important; }
:global(:root[data-theme='light']) .tour-focus { outline-color: var(--cue-accent); box-shadow: 0 0 18px color-mix(in srgb, var(--cue-accent) 62%, transparent), 0 0 55px color-mix(in srgb, var(--cue-accent) 25%, transparent); animation-name: tour-pulse-light; }
:global(:root[data-theme='light']) .tour-card { border-color: var(--cue-accent); box-shadow: 0 0 32px color-mix(in srgb, var(--cue-accent) 22%, transparent), 0 24px 80px var(--cue-shadow); }
:global(:root[data-theme='light']) .tour-card > span { color: var(--cue-accent); }
.tour-focus { position: relative; z-index: 32; outline: 2px solid var(--cue-accent); outline-offset: 5px; box-shadow: 0 0 18px color-mix(in srgb, var(--cue-accent) 70%, transparent), 0 0 55px color-mix(in srgb, var(--cue-accent) 28%, transparent); animation: tour-pulse 1.5s ease-in-out infinite alternate; }
.tour-card { position: fixed; right: 24px; bottom: 24px; z-index: 60; width: min(390px, calc(100vw - 32px)); box-sizing: border-box; padding: 24px; border: 1px solid var(--cue-accent); background: var(--cue-surface); color: var(--cue-text); box-shadow: 0 0 32px color-mix(in srgb, var(--cue-accent) 25%, transparent), 0 24px 80px var(--cue-shadow); }
.tour-card > span { color: var(--cue-accent); font: 700 10px monospace; letter-spacing: .12em; }
.tour-card > strong { display: block; margin: 17px 0 9px; font-size: 24px; text-transform: uppercase; }
.tour-card > p { margin: 0 0 20px; color: #aaa; font-size: 14px; line-height: 1.55; }
.tour-card .primary-button { width: 100%; }
.tour-card__close { position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border: 0; background: transparent; color: #999; cursor: pointer; font-size: 25px; }
@keyframes tour-pulse { from { box-shadow: 0 0 12px color-mix(in srgb, var(--cue-accent) 55%, transparent), 0 0 35px color-mix(in srgb, var(--cue-accent) 20%, transparent); } to { box-shadow: 0 0 25px color-mix(in srgb, var(--cue-accent) 90%, transparent), 0 0 70px color-mix(in srgb, var(--cue-accent) 36%, transparent); } }
@keyframes tour-pulse-light { from { box-shadow: 0 0 12px color-mix(in srgb, var(--cue-accent) 48%, transparent), 0 0 35px color-mix(in srgb, var(--cue-accent) 18%, transparent); } to { box-shadow: 0 0 25px color-mix(in srgb, var(--cue-accent) 74%, transparent), 0 0 70px color-mix(in srgb, var(--cue-accent) 31%, transparent); } }

@media (max-width: 1040px) {
  .workspace-header { grid-template-columns: 1fr auto; padding-bottom: 8px; }
  .workspace-header nav { grid-column: 1 / -1; grid-row: 2; width: 100%; max-width: none; justify-self: stretch; border-radius: 0; }
  .workspace-header nav button { padding-inline: 16px; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .overview-grid, .calendar-layout { grid-template-columns: 1fr; }
  .day-panel { position: static; }
}

@media (max-width: 680px) {
  .workspace { padding: 0 14px 24px; }
  .workspace-header { min-height: 62px; margin-inline: -14px; }
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
  .booking-detail { scroll-margin-top: 74px; }
  .profile-progress { min-width: 0; margin-top: 20px; }
  .profile-heading-actions { min-width: 0; margin-top: 20px; }
  .profile-welcome, .profile-section > header { align-items: stretch; flex-direction: column; }
  .profile-welcome button { width: 100%; }
  .profile-fields { grid-template-columns: 1fr; padding: 18px; }
  .profile-cover-field { margin: 0 12px; }
  .profile-cover-message { margin-inline: 12px; }
  .profile-fields .field-wide { grid-column: auto; }
  .profile-savebar { bottom: 0; grid-template-columns: 1fr auto; gap: 10px; margin-inline: -1px; }
  .profile-savebar > p { grid-column: 1 / -1; grid-row: 2; }
  .profile-savebar .primary-button { min-width: 0; }
  .profile-preview-backdrop { align-items: stretch; padding: 0; }
  .profile-preview { width: 100%; max-height: 100dvh; border: 0; }
  .profile-preview-hero { min-height: 280px; padding: 42px 22px; }
  .profile-preview-hero h2 { font-size: clamp(3.6rem,19vw,6rem); }
  .profile-preview-body { grid-template-columns: 1fr; gap: 34px; padding: 30px 22px 46px; }
}
</style>
