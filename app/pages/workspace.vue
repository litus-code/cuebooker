<script setup lang="ts">
import type { FeeBasis } from '../composables/useArtistProfile'
import type { CoreBooking, Hold } from '../domain/bookingCore'
import type { CueNotification } from '../domain/notification'
import { toPublicCueIdConfig, type PublicArtistProfile } from '../domain/publicArtistProfile'
import { createBookingQrSvg } from '../services/bookingQr'

const auth = useCueAuth()
const availability = useAvailability()
const bookingCore = useBookingCore()
const notifications = useNotifications()
const artistProfiles = useArtistProfile()
const publicPublishing = usePublicArtistPublishing()
const preferences = useCuePreferences()
const route = useRoute()
const router = useRouter()

type WorkspaceView = 'overview' | 'bookings' | 'calendar' | 'history' | 'profile'
const WORKSPACE_VIEWS: WorkspaceView[] = ['overview', 'bookings', 'calendar', 'history', 'profile']
function workspaceViewFromQuery(value: unknown, booking?: unknown): WorkspaceView {
  if (typeof value === 'string' && WORKSPACE_VIEWS.includes(value as WorkspaceView)) return value as WorkspaceView
  if (typeof booking === 'string' && booking) return 'bookings'
  return 'overview'
}
type ProfileEditSection = 'identity' | 'image' | 'sound' | 'links' | 'booking' | 'distribution' | null
const PROFILE_EDIT_SECTIONS = ['identity', 'image', 'sound', 'links', 'booking', 'distribution'] as const
function profileSectionFromQuery(value: unknown): Exclude<ProfileEditSection, null> | null {
  return typeof value === 'string' && PROFILE_EDIT_SECTIONS.includes(value as any) ? value as Exclude<ProfileEditSection, null> : null
}
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

const activeView = ref<WorkspaceView>(workspaceViewFromQuery(route.query.view, route.query.booking))
const artists = ref<ManagedArtist[]>([])
const organizations = ref<ManagedOrganization[]>([])
const selectedArtistId = ref('')
const blocks = ref<AvailabilityBlock[]>([])
const monthCursor = ref(new Date().toISOString().slice(0, 7) + '-01')
const todayDate = new Date().toISOString().slice(0, 10)
const selectedDate = ref(todayDate)
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
const sidebarCollapsed = ref(false)
const bookingCoreWorkspaceId = ref('')
const realBookings = ref<CoreBooking[]>([])
const realHolds = ref<Hold[]>([])
const cueOpen = ref(false)
const cueCoreLoading = ref(false)
const cueMessage = ref('')
const bookingCoreOperationsRevision = ref(0)
const realBookingFocusId = ref('')
let bookingCoreSyncTimer: ReturnType<typeof setInterval> | null = null
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
const profileEditSection = ref<ProfileEditSection>(route.query.view === 'profile' ? profileSectionFromQuery(route.query.section) : null)
const profileCoverUrl = ref('')
const profileCoverUploading = ref(false)
const profileCoverMessage = ref('')
const profileArtistImageUrl = ref('')
const profileArtistCutoutUrl = ref('')
const publicProfilePublished = ref(false)
const publicProfileAcceptingRequests = ref(false)
const publicProfileWorkspaceId = ref('')
const publicPublishingSaving = ref(false)
const publicPublishingMessage = ref('')
const profileShareMessage = ref('')
const tourCardStyle = ref<Record<string, string>>({})
let tourPositionTimer: ReturnType<typeof setTimeout> | null = null

const copy = computed(() => preferences.locale.value === 'es' ? {
  overview: 'Resumen', bookings: 'Bookings', calendar: 'Calendario', history: 'Actividad', profile: 'Perfil',
  artist: 'Artista', role: 'DJ', settings: 'Ajustes', logout: 'Cerrar sesión',
  loading: 'Cargando workspace…', rosterEyebrow: 'ROSTER / PRIMER ARTISTA', addFirstArtist: 'Añade el primer artista de',
  rosterBody: 'Quedará asociado al roster y podrás empezar a gestionar su actividad.', artistName: 'Nombre artístico', identifier: 'Identificador', creating: 'Creando…', addArtist: 'Añadir artista',
  noArtist: 'No hay un artista gestionable en esta cuenta.', noArtistBody: 'Tu cuenta todavía no tiene un artista o roster asignado.',
  overviewEyebrow: 'WORKSPACE / RESUMEN', overviewTitle: 'QUÉ NECESITA TU ATENCIÓN.', overviewBody: 'Una entrada rápida a los bookings y fechas del artista, sin convertir el calendario en todo el producto.', profileCard: 'Perfil público', profileCardBody: 'Construye y distribuye tu presencia como artista.',
  realBookings: 'Bookings reales', realBookingsBody: 'El workspace operativo todavía no está disponible para este artista.', holdsMonth: 'Holds este mes', holdsBody: 'Fechas pendientes de decisión.', confirmed: 'Confirmados', confirmedStatus: 'Confirmado', confirmedBody: 'Horarios confirmados este mes.', occupiedDays: 'Días ocupados', occupiedBody: 'Con al menos un horario registrado.',
  agendaEyebrow: 'AGENDA / ESTE MES', upcoming: 'Próximos horarios', viewCalendar: 'Ver calendario', privateSlot: 'Horario privado', noUpcoming: 'No hay horarios próximos registrados en este mes.', addSlot: 'Añadir horario',
  bookingsEyebrow: 'BOOKINGS / BANDEJA', bookingsTitle: 'TODOS TUS BOOKINGS. UN SOLO HILO.',
  bookingsBody: 'Revisa cada propuesta, responde al promotor y decide la fecha sin perder el contexto.',
  guidedTour: 'Ver recorrido guiado', collapseSidebar: 'Comprimir menú', expandSidebar: 'Expandir menú',
  calendarEyebrow: 'CALENDARIO / AGENDA', calendarTitle: 'FECHAS Y HORARIOS.', calendarBody: 'Los holds y bookings confirmados aparecen aquí automáticamente. Usa “Añadir bloqueo” para viajes, estudio o indisponibilidad que no nacen de un booking.', weekdays: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'], unavailable: 'No disponible', dayHours: 'DÍA / 24 HORAS', add: 'Añadir bloqueo', selectedDaySchedule: 'Horario del día seleccionado', addAt: 'Añadir bloqueo a las',
  historyEyebrow: 'WORKSPACE / ACTIVIDAD', historyTitle: 'TODO LO QUE HA PASADO.',
  historyBody: 'Mensajes, cambios de estado, holds y acciones ordenados por tiempo. Los bookings archivados siguen estando en Bookings → Archivados.',
  previousMonth: 'Mes anterior', nextMonth: 'Mes siguiente',
  profileEyebrow: 'ARTISTA / PRESENCIA PÚBLICA', profileTitle: 'CONSTRUYE TU PERFIL PÚBLICO.', profileBody: 'Esta es la presencia que verá un promoter cuando llegue a tu enlace. Edita cada bloque sin salir del resultado final.',
  profileOptional: 'Ficha opcional', profileOptionalBody: 'Tu workspace ya está creado. Puedes completar estos datos ahora o volver desde Perfil cuando quieras.', later: 'Ahora no', previewProfile: 'Vista previa', previewPrivate: 'VISTA PREVIA / PERFIL PÚBLICO', previewClose: 'Cerrar vista previa', previewBioEmpty: 'Tu biografía aparecerá aquí cuando la completes.', previewGenresEmpty: 'Añade géneros para verlos en la ficha.', previewFormats: 'Formatos', previewLinks: 'Escuchar y seguir',
  coverTitle: 'Tu sonido empieza por la imagen.', coverHint: 'Arrastra una foto o elígela. Si no añades ninguna, CueBooker usará esta portada acid y Detroit.', coverChoose: 'Añadir mi portada', coverChange: 'Cambiar portada', coverRemove: 'Usar portada CueBooker', coverPosition: 'Ajustar encuadre vertical', coverUploading: 'Subiendo portada…', coverSaved: 'Portada actualizada.', coverRemoved: 'Portada base restaurada.', coverInvalid: 'Usa JPG, PNG o WebP de hasta 8 MB.', coverError: 'No se pudo guardar la portada.',
  profilePublicSection: 'Identidad y ubicación', profilePublicHint: 'Esta información forma parte de tu perfil público cuando decidas publicarlo.',
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
  editSlot: 'EDITAR BLOQUEO MANUAL', newSlot: 'NUEVO BLOQUEO MANUAL', privateLabel: 'Qué bloqueas', privatePlaceholder: 'Estudio, viaje, no disponible…', start: 'Inicio', end: 'Fin', invalidTime: 'La hora de fin debe ser posterior a la hora de inicio.', status: 'Estado', saving: 'Guardando…', saveChanges: 'Guardar cambios', createSlot: 'Crear horario', deleteSlot: 'Eliminar horario', finish: 'Terminar', next: 'Siguiente', closeTour: 'Cerrar recorrido'
} : {
  overview: 'Overview', bookings: 'Bookings', calendar: 'Calendar', history: 'Activity', profile: 'Profile',
  artist: 'Artist', role: 'DJ', settings: 'Settings', logout: 'Sign out',
  loading: 'Loading workspace…', rosterEyebrow: 'ROSTER / FIRST ARTIST', addFirstArtist: 'Add the first artist for',
  rosterBody: 'They will be linked to the roster so you can start managing their activity.', artistName: 'Artist name', identifier: 'Identifier', creating: 'Creating…', addArtist: 'Add artist',
  noArtist: 'There is no manageable artist in this account.', noArtistBody: 'Your account does not have an assigned artist or roster yet.',
  overviewEyebrow: 'WORKSPACE / OVERVIEW', overviewTitle: 'WHAT NEEDS YOUR ATTENTION.', overviewBody: 'A quick view of the artist’s bookings and dates without making the calendar the whole product.', profileCard: 'Public profile', profileCardBody: 'Build and distribute your artist presence.',
  realBookings: 'Real bookings', realBookingsBody: 'The operational workspace is not available for this artist yet.', holdsMonth: 'Holds this month', holdsBody: 'Dates waiting for a decision.', confirmed: 'Confirmed', confirmedStatus: 'Confirmed', confirmedBody: 'Confirmed slots this month.', occupiedDays: 'Occupied days', occupiedBody: 'With at least one registered slot.',
  agendaEyebrow: 'AGENDA / THIS MONTH', upcoming: 'Upcoming slots', viewCalendar: 'View calendar', privateSlot: 'Private slot', noUpcoming: 'There are no upcoming slots registered this month.', addSlot: 'Add slot',
  bookingsEyebrow: 'BOOKINGS / INBOX', bookingsTitle: 'ALL YOUR BOOKINGS. ONE THREAD.',
  bookingsBody: 'Review every proposal, reply to the promoter and decide each date without losing context.',
  guidedTour: 'View guided tour', collapseSidebar: 'Collapse menu', expandSidebar: 'Expand menu',
  calendarEyebrow: 'CALENDAR / SCHEDULE', calendarTitle: 'DATES AND TIMES.', calendarBody: 'Holds and confirmed bookings appear here automatically. Use “Add block” for travel, studio time or unavailability that does not come from a booking.', weekdays: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], unavailable: 'Unavailable', dayHours: 'DAY / 24 HOURS', add: 'Add block', selectedDaySchedule: 'Selected day schedule', addAt: 'Add block at',
  historyEyebrow: 'WORKSPACE / ACTIVITY', historyTitle: 'EVERYTHING THAT HAPPENED.',
  historyBody: 'Messages, status changes, holds and actions ordered over time. Archived bookings remain under Bookings → Archived.',
  previousMonth: 'Previous month', nextMonth: 'Next month',
  profileEyebrow: 'ARTIST / PUBLIC PRESENCE', profileTitle: 'BUILD YOUR PUBLIC PROFILE.', profileBody: 'This is what a promoter sees when they land on your link. Edit each block without leaving the final result.',
  profileOptional: 'Optional profile', profileOptionalBody: 'Your workspace is ready. Complete these details now or return from Profile whenever you want.', later: 'Not now', previewProfile: 'Preview', previewPrivate: 'PREVIEW / PUBLIC PROFILE', previewClose: 'Close preview', previewBioEmpty: 'Your biography will appear here once completed.', previewGenresEmpty: 'Add genres to see them on the profile.', previewFormats: 'Formats', previewLinks: 'Listen and follow',
  coverTitle: 'Your sound starts with the image.', coverHint: 'Drop a photo or choose one. If you skip it, CueBooker will use this acid and Detroit cover.', coverChoose: 'Add my cover', coverChange: 'Change cover', coverRemove: 'Use CueBooker cover', coverPosition: 'Adjust vertical framing', coverUploading: 'Uploading cover…', coverSaved: 'Cover updated.', coverRemoved: 'Default cover restored.', coverInvalid: 'Use a JPG, PNG or WebP file up to 8 MB.', coverError: 'The cover could not be saved.',
  profilePublicSection: 'Identity and location', profilePublicHint: 'This information becomes part of your public profile when you choose to publish it.',
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
  editSlot: 'EDIT MANUAL BLOCK', newSlot: 'NEW MANUAL BLOCK', privateLabel: 'What are you blocking?', privatePlaceholder: 'Studio, travel, unavailable…', start: 'Start', end: 'End', invalidTime: 'The end time must be later than the start time.', status: 'Status', saving: 'Saving…', saveChanges: 'Save changes', createSlot: 'Create slot', deleteSlot: 'Delete slot', finish: 'Finish', next: 'Next', closeTour: 'Close tour'
})

const tourSteps = computed(() => preferences.locale.value === 'es' ? [
  { view: 'bookings' as const, target: 'workspace-cue', title: 'Captura rápida', body: 'Registra una llamada, un WhatsApp, un email o una conversación en cuanto ocurre. El booking puede empezar con pocos datos.' },
  { view: 'bookings' as const, target: 'core-inbox-tools', title: 'Busca y filtra', body: 'La bandeja real separa activos y archivados, permite buscar y filtrar por estado sin salir del workspace.' },
  { view: 'bookings' as const, target: 'core-inbox-list', title: 'Abre un booking', body: 'Cada fila mantiene fecha, entidad, origen y estado. Selecciona una para trabajar sobre su hilo real.' },
  { view: 'bookings' as const, target: 'core-inbox-detail', title: 'Un hilo por booking', body: 'El booking concentra su contexto, estado, relación, conflictos, operativa y Activity en una sola superficie.' },
  { view: 'bookings' as const, target: 'core-inbox-facts', title: 'Datos de la propuesta', body: 'Fecha, sala o entidad, contacto y oferta permanecen ligados al booking y se editan sin crear duplicados.' },
  { view: 'bookings' as const, target: 'core-inbox-operations', title: 'Siguiente paso y holds', body: 'Define qué toca hacer y protege fechas con holds. El calendario los proyecta desde Booking Core.' },
  { view: 'bookings' as const, target: 'core-inbox-activity-composer', title: 'Activity', body: 'Registra notas, llamadas, WhatsApp, Instagram o email para conservar la traza profesional del booking.' },
  { view: 'calendar' as const, target: 'workspace-calendar', title: 'Revisa el día completo', body: 'El calendario combina disponibilidad privada, holds y bookings confirmados sin duplicar la fuente de verdad.' }
] : [
  { view: 'bookings' as const, target: 'workspace-cue', title: 'Quick capture', body: 'Log a call, WhatsApp, email or conversation as soon as it happens. A booking can start with only a few details.' },
  { view: 'bookings' as const, target: 'core-inbox-tools', title: 'Search and filter', body: 'The real inbox separates active and archived work, with search and status filters inside the workspace.' },
  { view: 'bookings' as const, target: 'core-inbox-list', title: 'Open a booking', body: 'Each row keeps date, entity, source and status together. Select one to work on its real thread.' },
  { view: 'bookings' as const, target: 'core-inbox-detail', title: 'One thread per booking', body: 'The booking keeps context, status, relationship memory, conflicts, operations and Activity in one surface.' },
  { view: 'bookings' as const, target: 'core-inbox-facts', title: 'Proposal details', body: 'Date, venue or entity, contact and offer stay attached to the booking and can be edited without duplicates.' },
  { view: 'bookings' as const, target: 'core-inbox-operations', title: 'Next move and holds', body: 'Define what needs to happen next and protect dates with holds. Calendar projects them from Booking Core.' },
  { view: 'bookings' as const, target: 'core-inbox-activity-composer', title: 'Activity', body: 'Log notes, calls, WhatsApp, Instagram or email to preserve the professional trace of the booking.' },
  { view: 'calendar' as const, target: 'workspace-calendar', title: 'Review the full day', body: 'Calendar combines private availability, holds and confirmed bookings without duplicating the source of truth.' }
])

const manageableAgency = computed(() => organizations.value.find(item => item.type === 'agency' && ['owner', 'admin'].includes(item.role)))
const ownerAgency = computed(() => organizations.value.find(item => item.type === 'agency' && item.role === 'owner'))
const selectedArtist = computed(() => artists.value.find(item => item.id === selectedArtistId.value))
const canEditSelectedArtist = computed(() => ['owner', 'manager'].includes(selectedArtist.value?.role || ''))
const tourNamespace = computed(() => auth.session.value?.user.id && selectedArtistId.value ? `workspace-${auth.session.value.user.id}-${selectedArtistId.value}` : undefined)
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
      blocks: blocks.value.filter(block => block.starts_at.slice(0, 10) === date),
      holds: realHolds.value.filter(hold => hold.status === 'active' && hold.event_date === date),
      confirmedBookings: realBookings.value.filter(booking => !booking.archived_at && booking.status === 'confirmed' && booking.event_date === date)
    }
  })
})

const dayBlocks = computed(() => blocks.value
  .filter(block => block.starts_at.slice(0, 10) === selectedDate.value)
  .sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
const selectedDayCoreHolds = computed(() => realHolds.value
  .filter(hold => hold.status === 'active' && hold.event_date === selectedDate.value)
  .sort((a, b) => (a.starts_at || a.event_date).localeCompare(b.starts_at || b.event_date)))
const selectedDayTimedCoreHolds = computed(() => selectedDayCoreHolds.value.filter(hold => hold.starts_at && hold.ends_at))
const selectedDayDateOnlyCoreHolds = computed(() => selectedDayCoreHolds.value.filter(hold => !hold.starts_at || !hold.ends_at))
const selectedDayConfirmedBookings = computed(() => realBookings.value.filter(booking => !booking.archived_at && booking.status === 'confirmed' && booking.event_date === selectedDate.value))
const selectedDayTimedConfirmedBookings = computed(() => selectedDayConfirmedBookings.value.filter(booking => booking.start_time && booking.end_time))
const selectedDayDateOnlyConfirmedBookings = computed(() => selectedDayConfirmedBookings.value.filter(booking => !booking.start_time || !booking.end_time))
const upcomingBlocks = computed(() => blocks.value
  .filter(block => block.ends_at >= new Date().toISOString())
  .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  .slice(0, 4))
const holdCount = computed(() => blocks.value.filter(block => block.status === 'hold').length + realHolds.value.filter(hold => hold.status === 'active').length)
const confirmedCount = computed(() => blocks.value.filter(block => block.status === 'confirmed').length + realBookings.value.filter(booking => !booking.archived_at && booking.status === 'confirmed').length)
const occupiedDays = computed(() => new Set([...blocks.value.map(block => block.starts_at.slice(0, 10)), ...realHolds.value.filter(hold => hold.status === 'active').map(hold => hold.event_date), ...realBookings.value.filter(booking => !booking.archived_at && booking.status === 'confirmed' && booking.event_date).map(booking => booking.event_date as string)]).size)
const validTimeRange = computed(() => endTime.value > startTime.value)
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
const publicProfileUrl = computed(() => {
  const slug = selectedArtist.value?.slug || artistProfiles.activeProfile.value?.artist?.slug || ''
  if (!slug) return ''
  return import.meta.client ? `${window.location.origin}/${slug}` : `https://cuebooker.com/${slug}`
})
const publicBookingUrl = computed(() => publicProfileUrl.value ? `${publicProfileUrl.value}?booking=1` : '')
const publicWidgetUrl = computed(() => publicProfileUrl.value ? `${publicProfileUrl.value}?embed=1&booking=1&src=website` : '')
const publicWidgetCode = computed(() => publicWidgetUrl.value
  ? `<iframe src="${publicWidgetUrl.value}" title="Cuebooker booking" loading="lazy" style="width:100%;height:760px;border:0;" sandbox="allow-scripts allow-forms allow-same-origin"></iframe>`
  : '')
const publicQrSvg = computed(() => publicBookingUrl.value ? createBookingQrSvg(`${publicBookingUrl.value}&src=qr`) : '')

async function toggleProfileEditSection(section: Exclude<ProfileEditSection, null>) {
  profileEditSection.value = profileEditSection.value === section ? null : section
  const query: Record<string, any> = { ...route.query, view: 'profile' }
  if (profileEditSection.value) query.section = profileEditSection.value
  else delete query.section
  void router.replace({ query }).catch(() => {})

  if (!profileEditSection.value || !import.meta.client) return
  await nextTick()
  await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  const editor = document.getElementById('profile-builder-editor')
  const header = document.getElementById('workspace-header')
  if (!editor) return
  const offset = (header?.getBoundingClientRect().height || 0) + 12
  const top = editor.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion() ? 'auto' : 'smooth'
  })
}

async function copyProfileValue(label: string, value: string) {
  if (!import.meta.client || !value) return
  await navigator.clipboard.writeText(value)
  profileShareMessage.value = preferences.locale.value === 'es' ? `${label} copiado.` : `${label} copied.`
  window.setTimeout(() => {
    profileShareMessage.value = ''
  }, 1600)
}

function downloadProfileQr() {
  if (!import.meta.client || !publicQrSvg.value || !selectedArtist.value) return
  const blob = new Blob([publicQrSvg.value], { type: 'image/svg+xml;charset=utf-8' })
  const href = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = `cuebooker-${selectedArtist.value.slug}-booking-qr.svg`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(href)
}

const publicProfilePreview = computed<PublicArtistProfile>(() => {
  const persisted = artistProfiles.activeProfile.value?.artist
  return {
    stageName: profileForm.value.stageName.trim() || selectedArtist.value?.stage_name || 'Artist',
    slug: selectedArtist.value?.slug || persisted?.slug || '',
    bio: nullableText(profileForm.value.bio),
    city: nullableText(profileForm.value.city),
    countryCode: nullableText(profileForm.value.countryCode)?.toUpperCase() || null,
    languages: splitList(profileForm.value.languages, 8),
    primaryGenres: splitList(profileForm.value.primaryGenres, 3),
    secondaryGenres: splitList(profileForm.value.secondaryGenres, 8),
    performanceFormats: splitList(profileForm.value.performanceFormats, 6),
    eventTypes: splitList(profileForm.value.eventTypes, 10),
    yearsActive: nullableNumber(profileForm.value.yearsActive),
    websiteUrl: nullableText(profileForm.value.websiteUrl),
    instagramUrl: nullableText(profileForm.value.instagramUrl),
    soundcloudUrl: nullableText(profileForm.value.soundcloudUrl),
    mixcloudUrl: nullableText(profileForm.value.mixcloudUrl),
    youtubeUrl: nullableText(profileForm.value.youtubeUrl),
    spotifyUrl: nullableText(profileForm.value.spotifyUrl),
    coverUrl: profileCoverUrl.value || null,
    coverPositionY: profileForm.value.coverPositionY,
    artistImageUrl: profileArtistImageUrl.value || null,
    artistCutoutUrl: profileArtistCutoutUrl.value || null,
    artistImageStyle: persisted?.artist_image_style || 'photo',
    artistImagePositionX: persisted?.artist_image_position_x ?? 50,
    artistImagePositionY: persisted?.artist_image_position_y ?? 50,
    artistImageScale: persisted?.artist_image_scale ?? 1,
    visualMode: persisted?.visual_mode || 'photo',
    cueId: persisted?.cue_id_config ? toPublicCueIdConfig(persisted.cue_id_config) : null,
    acceptingRequests: publicProfileAcceptingRequests.value
  }
})
const hours = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`)

onMounted(async () => {
  if (import.meta.client) sidebarCollapsed.value = localStorage.getItem('cuebooker.sidebar.collapsed') === 'true'
  await auth.initialize()
  if (!auth.signedIn.value) return navigateTo('/access')
  if (!auth.profile.value) await auth.fetchProfile()
  if (!auth.profile.value?.onboarding_completed) return navigateTo('/onboarding')
  await loadWorkspaceIdentity()
  bookingCoreSyncTimer = window.setInterval(() => { void refreshBookingCoreFromExternal() }, 30_000)
  window.addEventListener('focus', refreshBookingCoreFromExternal)
  document.addEventListener('visibilitychange', refreshBookingCoreFromExternal)
  if (route.query.setup === 'profile' || route.query.view === 'profile') {
    activeView.value = 'profile'
    profileWelcome.value = route.query.setup === 'profile'
  }
  loading.value = false
})

watch([selectedArtistId, monthCursor], async () => {
  if (selectedArtistId.value) await loadBlocks()
})
watch(selectedArtistId, async (artistId) => {
  bookingCoreWorkspaceId.value = ''
  publicProfileWorkspaceId.value = ''
  if (!artistId) return
  await loadArtistProfile()
  await ensureBookingCoreWorkspace()
})
watch(() => [route.query.view, route.query.booking], ([value, booking]) => {
  const next = workspaceViewFromQuery(value, booking)
  if (next !== activeView.value) activeView.value = next
  if (next === 'profile') profileEditSection.value = profileSectionFromQuery(route.query.section)
})
watch(() => route.query.section, value => {
  if (activeView.value === 'profile') profileEditSection.value = profileSectionFromQuery(value)
})
watch(activeView, async (view) => {
  await nextTick()
  const nav = document.getElementById('workspace-navigation')
  const tab = nav?.querySelector<HTMLElement>(`[data-workspace-view="${view}"]`)
  if (!nav || !tab) return
  nav.scrollTo({ left: tab.offsetLeft - (nav.clientWidth - tab.clientWidth) / 2, behavior: 'smooth' })
})
watch(rosterArtistName, value => { rosterArtistSlug.value = slugify(value) })
watch(activeView, view => { if (view !== 'profile') profilePreviewOpen.value = false })
watch(profilePreviewOpen, (open) => {
  if (!import.meta.client) return
  document.body.style.overflow = open ? 'hidden' : ''
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
  if (profileCoverUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileCoverUrl.value)
  if (profileArtistImageUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileArtistImageUrl.value)
  if (profileArtistCutoutUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileArtistCutoutUrl.value)
  if (import.meta.client) window.removeEventListener('resize', handleViewportChange)
  if (bookingCoreSyncTimer) window.clearInterval(bookingCoreSyncTimer)
  if (import.meta.client) window.removeEventListener('focus', refreshBookingCoreFromExternal)
  if (import.meta.client) document.removeEventListener('visibilitychange', refreshBookingCoreFromExternal)
  if (tourPositionTimer) window.clearTimeout(tourPositionTimer)
  document.querySelectorAll<HTMLElement>('.tour-focus').forEach(element => element.classList.remove('tour-focus'))
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

  const nextQuery: Record<string, any> = { ...route.query, view }
  delete nextQuery.setup
  if (view !== 'bookings') delete nextQuery.booking
  if (view !== 'profile') delete nextQuery.section
  void router.replace({ query: nextQuery }).catch(() => {
    // View navigation must not be blocked by URL state sync.
  })

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

  document.querySelectorAll<HTMLElement>('.tour-focus').forEach(element => element.classList.remove('tour-focus'))
  const target = document.getElementById(item.target)
  const card = document.querySelector<HTMLElement>('.workspace .tour-card')
  if (!target || !card) return
  target.classList.add('tour-focus')

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

const cueEntryCopy = computed(() => preferences.locale.value === 'es' ? {
  eyebrow: 'CUE / CAPTURA RÁPIDA',
  title: 'REGISTRA LO QUE ACABA DE PASAR.',
  body: 'Úsalo para capturar algo que acaba de pasar. CUE crea el booking en segundos; después continúas conversación, próxima acción, hold y decisión dentro del booking.',
  saved: 'CUE guardado. El booking ya forma parte de tu workspace.'
} : {
  eyebrow: 'CUE / QUICK CAPTURE',
  title: 'SAVE WHAT JUST HAPPENED.',
  body: 'Use it to capture something that just happened. CUE creates the booking in seconds; then continue the conversation, next action, hold and decision inside the booking.',
  saved: 'CUE saved. The booking is now part of your workspace.'
})

function collectionChanged<T>(current: T[], next: T[]) {
  if (current.length !== next.length) return true
  return JSON.stringify(current) !== JSON.stringify(next)
}

async function loadRealBookings() {
  if (!bookingCoreWorkspaceId.value || !selectedArtistId.value) {
    if (realBookings.value.length) realBookings.value = []
    return
  }
  const rows = await bookingCore.listBookings(bookingCoreWorkspaceId.value, 100, selectedArtistId.value)
  if (collectionChanged(realBookings.value, rows)) realBookings.value = rows
}

async function loadRealHolds() {
  if (!bookingCoreWorkspaceId.value || !realBookings.value.length) {
    if (realHolds.value.length) realHolds.value = []
    return
  }
  const bookingIds = new Set(realBookings.value.map(item => item.id))
  const rows = (await bookingCore.listHolds(bookingCoreWorkspaceId.value, undefined, true))
    .filter(hold => bookingIds.has(hold.booking_id))
  if (collectionChanged(realHolds.value, rows)) realHolds.value = rows
}

async function ensureBookingCoreWorkspace() {
  if (!selectedArtistId.value) return
  cueCoreLoading.value = true
  try {
    const workspaces = await bookingCore.listWorkspaces()
    let resolvedWorkspaceId = ''

    for (const workspace of workspaces) {
      const workspaceArtists = await bookingCore.listWorkspaceArtists(workspace.id)
      if (workspaceArtists.some(item => item.artist_id === selectedArtistId.value)) {
        resolvedWorkspaceId = workspace.id
        break
      }
    }

    if (!resolvedWorkspaceId) {
      if (ownerAgency.value) {
        resolvedWorkspaceId = await bookingCore.ensureBookingWorkspace({ organizationId: ownerAgency.value.id })
      } else if (selectedArtist.value?.role === 'owner') {
        resolvedWorkspaceId = await bookingCore.ensureBookingWorkspace({ artistId: selectedArtistId.value })
      }
    }

    bookingCoreWorkspaceId.value = resolvedWorkspaceId
    await loadRealBookings()
    await loadRealHolds()
  } catch (error: any) {
    // Legacy manager/admin accounts may need the owner to bootstrap once.
    // Do not block the existing workspace while that transition is incomplete.
    bookingCoreWorkspaceId.value = ''
    realBookings.value = []
    realHolds.value = []
    console.warn('[booking-core] workspace bootstrap unavailable', error?.message || error)
  } finally {
    cueCoreLoading.value = false
  }
}

async function refreshBookingCoreFromExternal() {
  if (!import.meta.client || document.visibilityState !== 'visible') return
  if (!bookingCoreWorkspaceId.value || !selectedArtistId.value || cueCoreLoading.value) return
  try {
    await loadRealBookings()
    await loadRealHolds()
    bookingCoreOperationsRevision.value += 1
  } catch (error: any) {
    console.warn('[booking-core] background refresh failed', error?.message || error)
  }
}

async function handleCueCreated(booking: CoreBooking) {
  cueOpen.value = false
  cueMessage.value = cueEntryCopy.value.saved
  await loadRealBookings()
  await loadRealHolds()
  bookingCoreOperationsRevision.value += 1
  await nextTick()
  openRealBooking(booking.id)
  window.setTimeout(() => { cueMessage.value = '' }, 4500)
}

async function handleBookingCoreOperationsChanged() {
  bookingCoreOperationsRevision.value += 1
  await loadRealBookings()
  await loadRealHolds()
}

function markBookingNotificationsRead(bookingId: string) {
  if (!bookingCoreWorkspaceId.value || !bookingId) return
  void notifications.markBookingRead(bookingCoreWorkspaceId.value, bookingId)
    .then(() => {
      if (import.meta.client) window.dispatchEvent(new Event('cuebooker:notifications-changed'))
    })
    .catch(() => {
      // Reviewing the booking must not be blocked by notification read-state sync.
    })
}

function openRealBooking(bookingId: string) {
  realBookingFocusId.value = bookingId
  activeView.value = 'bookings'
  markBookingNotificationsRead(bookingId)

  if (route.query.booking !== bookingId) {
    void router.replace({
      query: {
        ...route.query,
        view: 'bookings',
        artist: selectedArtistId.value || route.query.artist,
        booking: bookingId
      }
    }).catch(() => {
      // Opening the Booking must not be blocked by URL state sync.
    })
  }
}

async function openNotificationBooking(notification: CueNotification) {
  try {
    const rows = await bookingCore.listBookings(notification.workspace_id, 100)
    const booking = rows.find(item => item.id === notification.booking_id)
    if (!booking) throw new Error('notification_booking_not_found')

    bookingCoreWorkspaceId.value = notification.workspace_id
    if (selectedArtistId.value !== booking.artist_id) {
      selectedArtistId.value = booking.artist_id
      await nextTick()
    }

    realBookings.value = rows.filter(item => item.artist_id === booking.artist_id)
    await loadRealHolds()
    openRealBooking(booking.id)

  } catch (error: any) {
    console.warn('[notifications] booking open failed', error?.message || error)
    errorMessage.value = preferences.locale.value === 'es'
      ? 'No se pudo abrir este booking.'
      : 'This booking could not be opened.'
  }
}

async function loadWorkspaceIdentity() {
  try {
    const [artistRows, organizationRows] = await Promise.all([availability.listArtists(), availability.listOrganizations()])
    artists.value = artistRows
    organizations.value = organizationRows

    const requestedArtistId = typeof route.query.artist === 'string' ? route.query.artist : ''
    if (requestedArtistId && artists.value.some(item => item.id === requestedArtistId)) {
      selectedArtistId.value = requestedArtistId
    } else if (!selectedArtistId.value || !artists.value.some(item => item.id === selectedArtistId.value)) {
      selectedArtistId.value = artists.value[0]?.id || ''
    }

    if (selectedArtistId.value) {
      await Promise.all([loadBlocks(), loadArtistProfile()])
      await ensureBookingCoreWorkspace()

      const requestedBookingId = typeof route.query.booking === 'string' ? route.query.booking : ''
      if (requestedBookingId && realBookings.value.some(item => item.id === requestedBookingId)) {
        openRealBooking(requestedBookingId)
      }
    }
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

function replaceProfileArtistImageUrl(nextUrl: string) {
  if (profileArtistImageUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileArtistImageUrl.value)
  profileArtistImageUrl.value = nextUrl
}

function replaceProfileArtistCutoutUrl(nextUrl: string) {
  if (profileArtistCutoutUrl.value.startsWith('blob:')) URL.revokeObjectURL(profileArtistCutoutUrl.value)
  profileArtistCutoutUrl.value = nextUrl
}

async function loadProfileVisualMedia(artistImagePath: string | null, artistCutoutPath: string | null) {
  replaceProfileArtistImageUrl('')
  replaceProfileArtistCutoutUrl('')
  if (artistImagePath) {
    try { replaceProfileArtistImageUrl(await artistProfiles.getArtistImageObjectUrl(artistImagePath)) } catch { /* optional preview media */ }
  }
  if (artistCutoutPath) {
    try { replaceProfileArtistCutoutUrl(await artistProfiles.getArtistCutoutObjectUrl(artistCutoutPath)) } catch { /* optional preview media */ }
  }
}

async function loadPublicPublishingState() {
  publicProfilePublished.value = false
  publicProfileAcceptingRequests.value = false
  publicProfileWorkspaceId.value = ''
  publicPublishingMessage.value = ''
  if (!selectedArtistId.value) return
  try {
    const state = await publicPublishing.load(selectedArtistId.value)
    publicProfilePublished.value = state.publicProfileEnabled
    publicProfileAcceptingRequests.value = state.acceptingRequests
    publicProfileWorkspaceId.value = state.workspaceId || ''
  } catch (error: any) {
    publicPublishingMessage.value = error?.message || (preferences.locale.value === 'es'
      ? 'No se pudo cargar el estado del perfil público.'
      : 'The public profile state could not be loaded.')
  }
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
    await Promise.all([
      loadProfileCover(profileForm.value.coverImagePath),
      loadProfileVisualMedia(record.artist.artist_image_path, record.artist.artist_cutout_path),
      loadPublicPublishingState()
    ])
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || copy.value.profileSaveError
  } finally {
    profileLoading.value = false
  }
}

async function updatePublicProfilePublished(enabled: boolean) {
  if (!selectedArtistId.value || !canEditSelectedArtist.value) return
  publicPublishingSaving.value = true
  publicPublishingMessage.value = ''
  try {
    if (!enabled && publicProfileAcceptingRequests.value) {
      const workspaceId = publicProfileWorkspaceId.value || bookingCoreWorkspaceId.value
      if (workspaceId) {
        publicProfileAcceptingRequests.value = await publicPublishing.setAcceptingRequests(selectedArtistId.value, workspaceId, false)
        publicProfileWorkspaceId.value = workspaceId
      }
    }
    publicProfilePublished.value = await publicPublishing.setPublicProfileEnabled(selectedArtistId.value, enabled)
    if (!publicProfilePublished.value) publicProfileAcceptingRequests.value = false
    publicPublishingMessage.value = preferences.locale.value === 'es'
      ? (enabled ? 'Perfil público activado.' : 'Perfil público desactivado.')
      : (enabled ? 'Public profile enabled.' : 'Public profile disabled.')
  } catch (error: any) {
    publicPublishingMessage.value = error?.message || (preferences.locale.value === 'es'
      ? 'No se pudo actualizar el perfil público.'
      : 'The public profile could not be updated.')
    await loadPublicPublishingState()
  } finally {
    publicPublishingSaving.value = false
  }
}

async function updatePublicAcceptingRequests(enabled: boolean) {
  if (!selectedArtistId.value || !canEditSelectedArtist.value || (enabled && !publicProfilePublished.value)) return
  publicPublishingSaving.value = true
  publicPublishingMessage.value = ''
  try {
    let workspaceId = publicProfileWorkspaceId.value || bookingCoreWorkspaceId.value
    if (!workspaceId) {
      await ensureBookingCoreWorkspace()
      workspaceId = bookingCoreWorkspaceId.value
    }
    if (!workspaceId) throw new Error('booking_workspace_required')
    publicProfileAcceptingRequests.value = await publicPublishing.setAcceptingRequests(selectedArtistId.value, workspaceId, enabled)
    publicProfileWorkspaceId.value = workspaceId
    publicPublishingMessage.value = preferences.locale.value === 'es'
      ? (enabled ? 'Solicitudes de booking abiertas.' : 'Solicitudes de booking cerradas.')
      : (enabled ? 'Booking enquiries opened.' : 'Booking enquiries closed.')
  } catch (error: any) {
    publicPublishingMessage.value = error?.message || (preferences.locale.value === 'es'
      ? 'No se pudo actualizar la recepción de bookings.'
      : 'Booking enquiry availability could not be updated.')
    await loadPublicPublishingState()
  } finally {
    publicPublishingSaving.value = false
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

  const confirmedOverlap = realBookings.value.find(booking => !booking.archived_at
    && booking.status === 'confirmed'
    && booking.event_date === selectedDate.value
    && (!booking.start_time || !booking.end_time
      || (toMinutes(booking.start_time) < proposedEnd && toMinutes(booking.end_time) > proposedStart)))

  const holdOverlap = realHolds.value.find(hold => hold.status === 'active'
    && hold.event_date === selectedDate.value
    && (!hold.starts_at || !hold.ends_at || (() => {
      const start = new Date(hold.starts_at)
      const end = new Date(hold.ends_at)
      const holdStart = start.getHours() * 60 + start.getMinutes()
      const holdEnd = end.getHours() * 60 + end.getMinutes()
      return holdStart < proposedEnd && holdEnd > proposedStart
    })()))

  if (overlap || confirmedOverlap || holdOverlap) {
    const overlapName = overlap
      ? (overlap.label || statusLabel(overlap.status))
      : confirmedOverlap
        ? coreBookingLabel(confirmedOverlap)
        : holdOverlap
          ? coreHoldLabel(holdOverlap)
          : ''
    const warning = preferences.locale.value === 'es'
      ? `Esta franja se solapa con “${overlapName}”. ¿Quieres guardar el bloqueo igualmente?`
      : `This time overlaps “${overlapName}”. Save the block anyway?`
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

function coreHoldStyle(hold: Hold) {
  if (!hold.starts_at || !hold.ends_at) return {}
  const startDate = new Date(hold.starts_at)
  const endDate = new Date(hold.ends_at)
  const start = startDate.getHours() * 60 + startDate.getMinutes()
  const end = endDate.getHours() * 60 + endDate.getMinutes()
  return { top: `${start * .8}px`, height: `${Math.max((end - start) * .8, 42)}px` }
}

function coreHoldLabel(hold: Hold) {
  const booking = realBookings.value.find(item => item.id === hold.booking_id)
  return booking?.venue_name || booking?.event_name || (preferences.locale.value === 'es' ? 'Hold de booking' : 'Booking hold')
}

function coreHoldExpiry(hold: Hold) {
  if (!hold.expires_at) return ''
  return new Intl.DateTimeFormat(dateLocale.value, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(hold.expires_at))
}

function coreBookingLabel(booking: CoreBooking) {
  return booking.venue_name || booking.event_name || (preferences.locale.value === 'es' ? 'Booking confirmado' : 'Confirmed booking')
}

function coreBookingTimeStyle(booking: CoreBooking) {
  if (!booking.start_time || !booking.end_time) return {}
  const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))
  const start = toMinutes(booking.start_time)
  const end = toMinutes(booking.end_time)
  return { top: `${start * .8}px`, height: `${Math.max((end - start) * .8, 42)}px` }
}

function openUpcoming(block: AvailabilityBlock) {
  activeView.value = 'calendar'
  startEdit(block)
}

function openCalendarBlock(block: AvailabilityBlock) {
  startEdit(block)
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat(dateLocale.value, { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(value))
}

function time(value: string) { return value.slice(11, 16) }
function startTour() {
  if (!realBookings.value.some(item => !item.archived_at)) return
  tourStep.value = 0
}
function nextTourStep() {
  if (tourStep.value >= tourSteps.value.length - 1) closeTour()
  else tourStep.value += 1
}
function closeTour() {
  if (import.meta.client && tourNamespace.value) localStorage.setItem(`cuebooker.tour.seen.${tourNamespace.value}`, 'true')
  document.querySelectorAll<HTMLElement>('.tour-focus').forEach(element => element.classList.remove('tour-focus'))
  tourStep.value = -1
  tourCardStyle.value = {}
}
function statusLabel(status: AvailabilityStatus) { return status === 'confirmed' ? copy.value.confirmedStatus : status === 'hold' ? 'Hold' : copy.value.unavailable }
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
        <WorkspaceNotifications :locale="preferences.locale.value" @open-booking="openNotificationBooking" />
        <CuePreferencesControl compact />
        <button class="header-icon-button" type="button" :aria-label="copy.logout" :title="copy.logout" @click="logout"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H5v16h5M14 8l4 4-4 4M8 12h10"/></svg></button>
      </div>
    </header>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <section v-if="loading && activeView === 'bookings'" class="workspace-skeleton workspace-skeleton--bookings" aria-busy="true" aria-live="polite">
      <span class="sr-only">{{ copy.loading }}</span>
      <div class="workspace-skeleton__heading workspace-skeleton__heading--bookings">
        <i class="skeleton-line skeleton-line--eyebrow" />
        <div class="workspace-skeleton__title-block" aria-hidden="true">
          <i class="skeleton-line skeleton-line--title skeleton-line--title-primary" />
          <i class="skeleton-line skeleton-line--title skeleton-line--title-secondary" />
        </div>
        <i class="skeleton-line skeleton-line--body" />
      </div>
      <i class="skeleton-panel skeleton-panel--booking-cue" />
      <div class="workspace-skeleton__booking-shell">
        <i class="skeleton-panel skeleton-panel--booking-toolbar" />
        <div class="workspace-skeleton__booking-layout">
          <div class="workspace-skeleton__booking-list">
            <i v-for="index in 5" :key="`booking-row-${index}`" class="skeleton-panel skeleton-panel--booking-row" />
          </div>
          <div class="workspace-skeleton__booking-detail">
            <i class="skeleton-panel skeleton-panel--booking-head" />
            <i class="skeleton-panel skeleton-panel--booking-facts" />
            <i class="skeleton-panel skeleton-panel--booking-conversation" />
            <i class="skeleton-panel skeleton-panel--booking-followup" />
          </div>
        </div>
      </div>
    </section>

    <section v-else-if="loading" class="workspace-skeleton" aria-busy="true" aria-live="polite">
      <span class="sr-only">{{ copy.loading }}</span>
      <div class="workspace-skeleton__heading">
        <i class="skeleton-line skeleton-line--eyebrow" />
        <div class="workspace-skeleton__title-block" aria-hidden="true">
          <i class="skeleton-line skeleton-line--title skeleton-line--title-primary" />
          <i class="skeleton-line skeleton-line--title skeleton-line--title-secondary" />
        </div>
        <i class="skeleton-line skeleton-line--body" />
      </div>
      <div class="workspace-skeleton__stats">
        <i v-for="index in 5" :key="`stat-${index}`" class="skeleton-card" />
      </div>
      <i class="skeleton-panel skeleton-panel--attention" />
      <div class="workspace-skeleton__body">
        <i class="skeleton-panel skeleton-panel--agenda" />
        <i class="skeleton-panel skeleton-panel--cue" />
      </div>
    </section>

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
          <article class="summary-card summary-card--pending"><span>{{ copy.realBookings }}</span><strong>{{ cueCoreLoading ? '…' : realBookings.filter(item => !item.archived_at).length }}</strong><p>{{ bookingCoreWorkspaceId ? (preferences.locale.value === 'es' ? 'Bookings guardados en tu workspace.' : 'Bookings saved in your workspace.') : copy.realBookingsBody }}</p></article>
          <article class="summary-card"><span>{{ copy.holdsMonth }}</span><strong>{{ holdCount }}</strong><p>{{ copy.holdsBody }}</p></article>
          <article class="summary-card"><span>{{ copy.confirmed }}</span><strong>{{ confirmedCount }}</strong><p>{{ copy.confirmedBody }}</p></article>
          <article class="summary-card"><span>{{ copy.occupiedDays }}</span><strong>{{ occupiedDays }}</strong><p>{{ copy.occupiedBody }}</p></article>
          <button class="summary-card summary-card--profile" type="button" @click="activeView = 'profile'"><span>{{ copy.profileCard }}</span><strong>{{ profileCompletion }}%</strong><p>{{ copy.profileCardBody }} →</p></button>
        </div>

        <BookingCoreAttention
          v-if="bookingCoreWorkspaceId"
          :workspace-id="bookingCoreWorkspaceId"
          :bookings="realBookings.filter(item => !item.archived_at)"
          :locale="preferences.locale.value"
          :refresh-key="bookingCoreOperationsRevision"
          @changed="handleBookingCoreOperationsChanged"
          @open-bookings="activeView = 'bookings'"
          @open-booking="openRealBooking"
        />

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
            <p class="eyebrow">{{ cueEntryCopy.eyebrow }}</p>
            <h2>{{ preferences.locale.value === 'es' ? '¿HA PASADO ALGO?' : 'DID SOMETHING HAPPEN?' }}</h2>
            <p>{{ preferences.locale.value === 'es' ? 'Captura algo en segundos y continúa desde el booking.' : 'Capture it in seconds and continue from the booking.' }}</p>
            <button type="button" :disabled="!bookingCoreWorkspaceId" @click="cueOpen = true">+ CUE</button>
          </aside>
        </div>
      </section>

      <section v-else-if="activeView === 'bookings'" class="view bookings-view">
        <div class="view-heading">
          <div><p class="eyebrow">{{ copy.bookingsEyebrow }}</p><h1>{{ copy.bookingsTitle }}</h1><p>{{ copy.bookingsBody }}</p></div>
          <label v-if="hasArtistSelector" class="artist-select"><span>{{ copy.artist }}</span><select v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
          <div v-else class="artist-identity"><span>{{ copy.artist }}</span><small>{{ copy.role }}</small><strong><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 14h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z"/></svg>{{ selectedArtist?.stage_name }}</strong></div>
        </div>

        <section v-if="bookingCoreWorkspaceId" id="workspace-cue" class="cue-entry-bar">
          <div>
            <span>{{ cueEntryCopy.eyebrow }}</span>
            <strong>{{ cueEntryCopy.title }}</strong>
            <p>{{ cueEntryCopy.body }}</p>
          </div>
          <div class="cue-entry-actions">
            <button class="cue-tour-action" type="button" :disabled="!realBookings.some(item => !item.archived_at)" @click="startTour">{{ copy.guidedTour }}</button>
            <button type="button" @click="cueOpen = true">+ CUE</button>
          </div>
        </section>
        <p v-if="cueMessage" class="cue-entry-message">{{ cueMessage }}</p>

        <BookingCoreInbox
          v-if="bookingCoreWorkspaceId"
          :workspace-id="bookingCoreWorkspaceId"
          :bookings="realBookings"
          :locale="preferences.locale.value"
          :focus-booking-id="realBookingFocusId"
          @operations-changed="handleBookingCoreOperationsChanged"
          @cue-requested="cueOpen = true"
          @booking-opened="markBookingNotificationsRead"
        />

      </section>

      <section v-else-if="activeView === 'calendar'" class="view calendar-view">
        <div class="view-heading calendar-heading">
          <div><p class="eyebrow">{{ copy.calendarEyebrow }}</p><h1>{{ copy.calendarTitle }}</h1><p>{{ copy.calendarBody }}</p></div>
          <label v-if="hasArtistSelector" class="artist-select"><span>{{ copy.artist }}</span><select v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
          <div v-else class="artist-identity"><span>{{ copy.artist }}</span><small>{{ copy.role }}</small><strong><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 1-2ZM20 14h-3v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-1-2Z"/></svg>{{ selectedArtist?.stage_name }}</strong></div>
        </div>

        <div id="workspace-calendar" class="calendar-layout" :class="{ 'tour-focus': tourStep === 7 }">
          <section class="month-panel panel">
            <div class="calendar-toolbar">
              <button type="button" :aria-label="copy.previousMonth" @click="changeMonth(-1)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
              </button>
              <h2>{{ monthLabel }}</h2>
              <button type="button" :aria-label="copy.nextMonth" @click="changeMonth(1)">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
              </button>
            </div>
            <div class="calendar-grid">
              <div v-for="label in copy.weekdays" :key="label" class="weekday">{{ label }}</div>
              <button v-for="cell in monthCells" :key="cell.date" type="button" class="day" :class="{ muted: !cell.current, today: todayDate === cell.date, selected: selectedDate === cell.date }" @click="selectDay(cell.date)">
                <span>{{ cell.number }}</span>
                <small v-if="cell.blocks.length || cell.holds.length || cell.confirmedBookings.length">{{ cell.blocks.length + cell.holds.length + cell.confirmedBookings.length }}</small>
                <span v-if="cell.blocks.length || cell.holds.length || cell.confirmedBookings.length" class="day-statuses"><i v-for="block in cell.blocks.slice(0, 1)" :key="block.id" :class="`status-dot status-dot--${block.status}`" /><i v-if="cell.holds.length" class="status-dot status-dot--hold" /><i v-if="cell.confirmedBookings.length" class="status-dot status-dot--confirmed" /></span>
              </button>
            </div>
            <div class="legend"><span><i class="status-dot status-dot--hold" />Hold</span><span><i class="status-dot status-dot--confirmed" />{{ copy.confirmedStatus }}</span><span><i class="status-dot status-dot--unavailable" />{{ copy.unavailable }}</span></div>
          </section>

          <section id="workspace-day-panel" class="day-panel panel">
            <div class="day-heading"><div><p class="eyebrow">{{ copy.dayHours }}</p><h2>{{ selectedDateLabel }}</h2></div><button class="add-button" type="button" @click="openCreate()">{{ copy.add }}</button></div>
            <div v-if="selectedDayDateOnlyCoreHolds.length || selectedDayDateOnlyConfirmedBookings.length" class="core-calendar-holds">
              <article v-for="booking in selectedDayDateOnlyConfirmedBookings" :key="`confirmed-${booking.id}`" class="core-calendar-confirmed">
                <i class="status-dot status-dot--confirmed" />
                <div><strong>{{ coreBookingLabel(booking) }}</strong><span>{{ preferences.locale.value === 'es' ? 'Confirmado · horario pendiente' : 'Confirmed · schedule pending' }}</span></div>
              </article>
              <article v-for="hold in selectedDayDateOnlyCoreHolds" :key="hold.id">
                <i class="status-dot status-dot--hold" />
                <div><strong>{{ coreHoldLabel(hold) }}</strong><span>Hold · {{ hold.priority ? `P${hold.priority}` : (preferences.locale.value === 'es' ? 'Sin prioridad' : 'No priority') }}<template v-if="hold.expires_at"> · {{ preferences.locale.value === 'es' ? 'Caduca' : 'Expires' }} {{ coreHoldExpiry(hold) }}</template></span></div>
              </article>
            </div>
            <div class="timeline" :aria-label="copy.selectedDaySchedule">
              <button v-for="hour in hours" :key="hour" class="hour-row" type="button" :aria-label="`${copy.addAt} ${hour}`" @click="openCreate(hour)"><span>{{ hour }}</span></button>
              <button v-for="block in dayBlocks" :key="block.id" class="timeline-block" :class="`timeline-block--${block.status}`" :style="blockStyle(block)" type="button" @click.stop="openCalendarBlock(block)">
                <strong>{{ block.label || statusLabel(block.status) }}</strong><span>{{ time(block.starts_at) }}–{{ time(block.ends_at) }}</span>
              </button>
              <button v-for="hold in selectedDayTimedCoreHolds" :key="`core-hold-${hold.id}`" class="timeline-block timeline-block--hold core-timeline-hold" :style="coreHoldStyle(hold)" type="button" @click.stop="openRealBooking(hold.booking_id)">
                <strong>{{ coreHoldLabel(hold) }}</strong><span>{{ hold.starts_at ? new Date(hold.starts_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) : '' }}–{{ hold.ends_at ? new Date(hold.ends_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) : '' }}</span>
              </button>
              <button v-for="booking in selectedDayTimedConfirmedBookings" :key="`core-confirmed-${booking.id}`" class="timeline-block timeline-block--confirmed core-timeline-confirmed" :style="coreBookingTimeStyle(booking)" type="button" @click.stop="openRealBooking(booking.id)">
                <strong>{{ coreBookingLabel(booking) }}</strong><span>{{ booking.start_time?.slice(0, 5) }}–{{ booking.end_time?.slice(0, 5) }}</span>
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
        <BookingCoreHistory
          v-if="bookingCoreWorkspaceId"
          :workspace-id="bookingCoreWorkspaceId"
          :bookings="realBookings"
          :locale="preferences.locale.value"
          :refresh-key="bookingCoreOperationsRevision"
          @open-booking="openRealBooking"
        />
      </section>

      <section v-else class="view profile-view profile-view--presence">
        <div class="view-heading profile-presence-heading">
          <div>
            <p class="eyebrow">{{ copy.profileEyebrow }}</p>
            <h1>{{ copy.profileTitle }}</h1>
            <p>{{ copy.profileBody }}</p>
          </div>
          <label v-if="hasArtistSelector" class="artist-select">
            <span>{{ copy.artist }}</span>
            <select v-model="selectedArtistId">
              <option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option>
            </select>
          </label>
        </div>

        <aside v-if="profileWelcome" class="profile-welcome">
          <div><span>{{ copy.profileOptional }}</span><strong>{{ copy.profileOptionalBody }}</strong></div>
          <button type="button" @click="dismissProfileWelcome">{{ copy.later }}</button>
        </aside>

        <p v-if="profileLoading" class="loading-message">{{ copy.loading }}</p>

        <template v-else>
          <section class="profile-presence-status">
            <div class="profile-presence-status__identity">
              <span>{{ publicProfilePublished
                ? (preferences.locale.value === 'es' ? 'PUBLICADO' : 'PUBLISHED')
                : (preferences.locale.value === 'es' ? 'BORRADOR' : 'DRAFT') }}</span>
              <strong v-if="selectedArtist">cuebooker.com/{{ selectedArtist.slug }}</strong>
            </div>
            <div class="profile-presence-status__actions">
              <label class="profile-presence-toggle">
                <input
                  :checked="publicProfilePublished"
                  type="checkbox"
                  :disabled="publicPublishingSaving || !canEditSelectedArtist"
                  @change="updatePublicProfilePublished(($event.currentTarget as HTMLInputElement).checked)"
                >
                <span>{{ publicProfilePublished
                  ? (preferences.locale.value === 'es' ? 'Perfil visible' : 'Profile visible')
                  : (preferences.locale.value === 'es' ? 'Publicar perfil' : 'Publish profile') }}</span>
              </label>
              <button type="button" @click="profilePreviewOpen = true">
                {{ preferences.locale.value === 'es' ? 'Abrir perfil' : 'Open profile' }}
              </button>
            </div>
          </section>

          <section class="profile-presence-preview">
            <div class="profile-presence-preview__head">
              <div>
                <span>{{ preferences.locale.value === 'es' ? 'PREVIEW REAL' : 'LIVE PREVIEW' }}</span>
                <strong>{{ preferences.locale.value === 'es' ? 'Así te ve un promoter.' : 'This is what a promoter sees.' }}</strong>
              </div>
              <small>{{ preferences.locale.value === 'es' ? 'El CTA de booking forma parte del mismo perfil.' : 'The booking CTA is part of the same profile.' }}</small>
            </div>
            <div class="profile-presence-preview__frame">
              <PublicArtistProfile
                :profile="publicProfilePreview"
                :locale="preferences.locale.value"
                preview
              />
            </div>
          </section>

          <section class="profile-builder">
            <div class="profile-builder__head">
              <div>
                <span>{{ preferences.locale.value === 'es' ? 'CONSTRUYE TU PERFIL' : 'BUILD YOUR PROFILE' }}</span>
                <strong>{{ preferences.locale.value === 'es' ? 'Edita por bloques, no rellenando una ficha.' : 'Edit in blocks, not through one long form.' }}</strong>
              </div>
              <small>{{ profileCompletion }}%</small>
            </div>

            <div class="profile-builder__grid">
              <button type="button" :class="{ active: profileEditSection === 'identity' }" @click="toggleProfileEditSection('identity')">
                <span>01</span>
                <strong>{{ preferences.locale.value === 'es' ? 'Identidad' : 'Identity' }}</strong>
                <p>{{ profileForm.stageName || selectedArtist?.stage_name }} · {{ profileForm.city || (preferences.locale.value === 'es' ? 'ciudad pendiente' : 'city pending') }}</p>
              </button>

              <button type="button" :class="{ active: profileEditSection === 'image' }" @click="toggleProfileEditSection('image')">
                <span>02</span>
                <strong>{{ preferences.locale.value === 'es' ? 'Imagen' : 'Image' }}</strong>
                <p>{{ profileCoverUrl ? (preferences.locale.value === 'es' ? 'Portada personalizada' : 'Custom cover') : (preferences.locale.value === 'es' ? 'Portada Cuebooker' : 'Cuebooker cover') }}</p>
              </button>

              <NuxtLink class="profile-builder__cue-id" to="/cue-id?from=workspace&section=identity">
                <span>03</span>
                <div class="profile-builder__cue-title"><strong>CUE ID</strong><small>BETA</small></div>
                <p>{{ preferences.locale.value === 'es' ? 'Construye tu identidad visual 3D.' : 'Build your 3D visual identity.' }}</p>
              </NuxtLink>

              <button type="button" :class="{ active: profileEditSection === 'sound' }" @click="toggleProfileEditSection('sound')">
                <span>04</span>
                <strong>{{ preferences.locale.value === 'es' ? 'Sonido' : 'Sound' }}</strong>
                <p>{{ splitList(profileForm.primaryGenres, 3).join(' · ') || (preferences.locale.value === 'es' ? 'Géneros y formatos' : 'Genres and formats') }}</p>
              </button>

              <button type="button" :class="{ active: profileEditSection === 'links' }" @click="toggleProfileEditSection('links')">
                <span>05</span>
                <strong>{{ preferences.locale.value === 'es' ? 'Links' : 'Links' }}</strong>
                <p>Instagram · SoundCloud · Spotify · Web</p>
              </button>

              <button type="button" :class="{ active: profileEditSection === 'booking' }" @click="toggleProfileEditSection('booking')">
                <span>06</span>
                <strong>Booking</strong>
                <p>{{ preferences.locale.value === 'es' ? 'Condiciones privadas y disponibilidad.' : 'Private terms and availability.' }}</p>
              </button>

              <button type="button" :class="{ active: profileEditSection === 'distribution' }" @click="toggleProfileEditSection('distribution')">
                <span>07</span>
                <strong>{{ preferences.locale.value === 'es' ? 'Distribución' : 'Distribution' }}</strong>
                <p>{{ preferences.locale.value === 'es' ? 'Link, QR, Instagram, EPK e iframe.' : 'Link, QR, Instagram, EPK and iframe.' }}</p>
              </button>
            </div>
          </section>

          <form v-if="profileEditSection" id="profile-builder-editor" class="profile-builder-editor" @submit.prevent="saveArtistProfile">
            <header>
              <div>
                <p class="eyebrow">
                  {{ profileEditSection === 'identity' ? '01 / IDENTITY'
                    : profileEditSection === 'image' ? '02 / IMAGE'
                    : profileEditSection === 'sound' ? '04 / SOUND'
                    : profileEditSection === 'links' ? '05 / LINKS'
                    : profileEditSection === 'booking' ? '06 / BOOKING'
                    : '07 / DISTRIBUTION' }}
                </p>
                <h2>
                  {{ profileEditSection === 'identity'
                    ? (preferences.locale.value === 'es' ? 'Identidad del artista' : 'Artist identity')
                    : profileEditSection === 'image'
                      ? (preferences.locale.value === 'es' ? 'Imagen y portada' : 'Image and cover')
                      : profileEditSection === 'sound'
                        ? (preferences.locale.value === 'es' ? 'Sonido y formatos' : 'Sound and formats')
                        : profileEditSection === 'links'
                          ? (preferences.locale.value === 'es' ? 'Canales y enlaces' : 'Channels and links')
                          : profileEditSection === 'booking'
                            ? (preferences.locale.value === 'es' ? 'Booking privado' : 'Private booking')
                            : (preferences.locale.value === 'es' ? 'Distribuye tu perfil' : 'Distribute your profile') }}
                </h2>
              </div>
              <button type="button" :aria-label="copy.close" @click="profileEditSection = null">×</button>
            </header>

            <fieldset class="profile-fieldset" :disabled="!canEditSelectedArtist">
              <div v-if="profileEditSection === 'identity'" class="profile-fields profile-fields--builder">
                <label class="field-wide"><span>{{ copy.stageName }}</span><input v-model="profileForm.stageName" maxlength="120" required></label>
                <label class="field-wide"><span>{{ copy.bio }}</span><textarea v-model="profileForm.bio" rows="5" maxlength="2000" :placeholder="copy.bioPlaceholder" /></label>
                <label><span>{{ copy.baseCity }}</span><input v-model="profileForm.city" maxlength="120" autocomplete="address-level2"></label>
                <label><span>{{ copy.countryCode }}</span><input v-model="profileForm.countryCode" maxlength="2" pattern="[A-Za-z]{2}" placeholder="ES" autocomplete="country"></label>
                <label><span>{{ copy.timezone }}</span><input v-model="profileForm.timezone" maxlength="80" placeholder="Europe/Madrid"></label>
                <div class="chip-field"><span>{{ copy.languages }}</span><ProfileChipInput v-model="profileForm.languages" :limit="8" placeholder="Español" :remove-label="copy.removeChip" /><small>{{ copy.addWithEnter }}</small></div>
                <label><span>{{ copy.yearsActive }}</span><input v-model="profileForm.yearsActive" type="number" min="0" max="80"></label>
              </div>

              <div v-else-if="profileEditSection === 'image'" class="profile-builder-image">
                <ProfileCoverUploader
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
              </div>

              <div v-else-if="profileEditSection === 'sound'" class="profile-fields profile-fields--builder">
                <div class="chip-field"><span>{{ copy.primaryGenres }}</span><ProfileChipInput v-model="profileForm.primaryGenres" :limit="3" placeholder="Techno" :remove-label="copy.removeChip" /><small>{{ copy.primaryGenresHint }} {{ copy.addWithEnter }}</small></div>
                <div class="chip-field"><span>{{ copy.secondaryGenres }}</span><ProfileChipInput v-model="profileForm.secondaryGenres" :limit="8" placeholder="Trance" :remove-label="copy.removeChip" /><small>{{ copy.addWithEnter }}</small></div>
                <div class="chip-field"><span>{{ copy.performanceFormats }}</span><ProfileChipInput v-model="profileForm.performanceFormats" :limit="6" placeholder="DJ set" :remove-label="copy.removeChip" /><small>{{ copy.addWithEnter }}</small></div>
                <div class="chip-field"><span>{{ copy.eventTypes }}</span><ProfileChipInput v-model="profileForm.eventTypes" :limit="10" placeholder="Club" :remove-label="copy.removeChip" /><small>{{ copy.addWithEnter }}</small></div>
              </div>

              <div v-else-if="profileEditSection === 'links'" class="profile-fields profile-fields--builder">
                <label><span>{{ copy.website }}</span><input v-model="profileForm.websiteUrl" type="url" placeholder="https://"></label>
                <label><span>{{ copy.instagram }}</span><input v-model="profileForm.instagramUrl" type="url" placeholder="https://instagram.com/"></label>
                <label><span>{{ copy.soundcloud }}</span><input v-model="profileForm.soundcloudUrl" type="url" placeholder="https://soundcloud.com/"></label>
                <label><span>{{ copy.mixcloud }}</span><input v-model="profileForm.mixcloudUrl" type="url" placeholder="https://mixcloud.com/"></label>
                <label><span>{{ copy.youtube }}</span><input v-model="profileForm.youtubeUrl" type="url" placeholder="https://youtube.com/"></label>
                <label><span>{{ copy.spotify }}</span><input v-model="profileForm.spotifyUrl" type="url" placeholder="https://open.spotify.com/"></label>
                <label><span>{{ copy.technicalRider }}</span><input v-model="profileForm.technicalRiderUrl" type="url" placeholder="https://"></label>
                <label><span>{{ copy.hospitalityRider }}</span><input v-model="profileForm.hospitalityRiderUrl" type="url" placeholder="https://"></label>
              </div>

              <div v-else-if="profileEditSection === 'booking'" class="profile-fields profile-fields--builder">
                <label class="checkbox-field field-wide profile-booking-public-toggle">
                  <input
                    :checked="publicProfileAcceptingRequests"
                    type="checkbox"
                    :disabled="publicPublishingSaving || !publicProfilePublished"
                    @change="updatePublicAcceptingRequests(($event.currentTarget as HTMLInputElement).checked)"
                  >
                  <span>{{ publicProfileAcceptingRequests
                    ? (preferences.locale.value === 'es' ? 'Solicitudes de booking abiertas' : 'Booking enquiries open')
                    : (preferences.locale.value === 'es' ? 'Solicitudes de booking cerradas' : 'Booking enquiries closed') }}</span>
                </label>
                <p v-if="!publicProfilePublished" class="profile-builder-note field-wide">
                  {{ preferences.locale.value === 'es' ? 'Publica primero el perfil para poder abrir solicitudes.' : 'Publish the profile before opening enquiries.' }}
                </p>
                <label><span>{{ copy.feeBasis }}</span><select v-model="profileForm.feeBasis"><option value="">—</option><option value="event">{{ copy.feeEvent }}</option><option value="set">{{ copy.feeSet }}</option><option value="hour">{{ copy.feeHour }}</option></select></label>
                <label><span>{{ copy.feeMin }}</span><input v-model="profileForm.feeMin" type="number" min="0" step="0.01"></label>
                <label><span>{{ copy.feeTypical }}</span><input v-model="profileForm.feeTypical" type="number" min="0" step="0.01"></label>
                <label><span>{{ copy.currency }}</span><input v-model="profileForm.currency" maxlength="3" pattern="[A-Za-z]{3}" placeholder="EUR"></label>
                <label><span>{{ copy.setDuration }}</span><div class="input-suffix"><input v-model="profileForm.setDurationMinutes" type="number" min="15" max="1440" step="15"><small>{{ copy.minutes }}</small></div></label>
                <label class="checkbox-field"><input v-model="profileForm.acceptsTravel" type="checkbox"><span>{{ copy.acceptsTravel }}</span></label>
                <div class="chip-field field-wide"><span>{{ copy.travelRegions }}</span><ProfileChipInput v-model="profileForm.travelRegions" :limit="20" placeholder="Catalunya" :remove-label="copy.removeChip" /><small>{{ copy.addWithEnter }}</small></div>
                <label class="field-wide"><span>{{ copy.equipmentNotes }}</span><textarea v-model="profileForm.equipmentNotes" rows="4" maxlength="2000" /></label>
              </div>

              <div v-else class="profile-distribution-editor">
                <p>{{ preferences.locale.value === 'es'
                  ? 'Usa una sola presencia y distribúyela por el canal que necesites. Todo sigue entrando en el mismo Booking Core.'
                  : 'Use one presence and distribute it through the channel you need. Everything still lands in the same Booking Core.' }}</p>
                <div class="profile-distribution-grid">
                  <article>
                    <span>PUBLIC PROFILE</span>
                    <strong>{{ publicProfileUrl || '—' }}</strong>
                    <button type="button" :disabled="!publicProfileUrl" @click="copyProfileValue('Perfil', publicProfileUrl)">
                      {{ preferences.locale.value === 'es' ? 'Copiar enlace' : 'Copy link' }}
                    </button>
                  </article>
                  <article>
                    <span>BOOKING LINK</span>
                    <strong>{{ publicBookingUrl || '—' }}</strong>
                    <button type="button" :disabled="!publicBookingUrl || !publicProfileAcceptingRequests" @click="copyProfileValue('Booking link', publicBookingUrl)">
                      {{ preferences.locale.value === 'es' ? 'Copiar enlace' : 'Copy link' }}
                    </button>
                  </article>
                  <article>
                    <span>INSTAGRAM / EPK</span>
                    <strong>{{ publicBookingUrl ? `${publicBookingUrl}&src=instagram` : '—' }}</strong>
                    <button type="button" :disabled="!publicBookingUrl || !publicProfileAcceptingRequests" @click="copyProfileValue('Instagram', `${publicBookingUrl}&src=instagram`)">
                      {{ preferences.locale.value === 'es' ? 'Copiar enlace' : 'Copy link' }}
                    </button>
                  </article>
                  <article>
                    <span>QR</span>
                    <strong>{{ preferences.locale.value === 'es' ? 'SVG listo para flyers, EPK o cartelería.' : 'SVG ready for flyers, EPK or print.' }}</strong>
                    <button type="button" :disabled="!publicQrSvg || !publicProfileAcceptingRequests" @click="downloadProfileQr">
                      {{ preferences.locale.value === 'es' ? 'Descargar QR' : 'Download QR' }}
                    </button>
                  </article>
                  <article class="profile-distribution-grid__wide">
                    <span>IFRAME / WEBSITE</span>
                    <code>{{ publicWidgetCode || '—' }}</code>
                    <button type="button" :disabled="!publicWidgetCode || !publicProfileAcceptingRequests" @click="copyProfileValue('Iframe', publicWidgetCode)">
                      {{ preferences.locale.value === 'es' ? 'Copiar iframe' : 'Copy iframe' }}
                    </button>
                  </article>
                </div>
                <small v-if="profileShareMessage">{{ profileShareMessage }}</small>
              </div>
            </fieldset>

            <footer v-if="profileEditSection !== 'distribution'">
              <p v-if="profileMessage" :class="{ success: profileMessage === copy.profileSaved }">{{ profileMessage }}</p>
              <button class="primary-button" type="submit" :disabled="profileSaving || !canEditSelectedArtist">{{ profileSaving ? copy.saving : (preferences.locale.value === 'es' ? 'Guardar cambios' : 'Save changes') }}</button>
            </footer>
          </form>


        </template>
      </section>
    </template>

    <div v-if="profilePreviewOpen" class="profile-preview-backdrop" @click.self="profilePreviewOpen = false">
      <article class="profile-preview" role="dialog" aria-modal="true" aria-labelledby="profile-preview-title">
        <header>
          <p id="profile-preview-title">{{ copy.previewPrivate }}</p>
          <button type="button" :aria-label="copy.previewClose" @click="profilePreviewOpen = false">×</button>
        </header>
        <PublicArtistProfile
          :profile="publicProfilePreview"
          :locale="preferences.locale.value"
          preview
        />
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
    <CueCapturePanel
      :open="cueOpen"
      :workspace-id="bookingCoreWorkspaceId"
      :artist-id="selectedArtistId"
      :locale="preferences.locale.value"
      @close="cueOpen = false"
      @created="handleCueCreated"
    />

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
button:focus-visible,
a:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline:2px solid var(--cue-accent);
  outline-offset:2px;
}
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
.status-dot--confirmed { background:#57e389; box-shadow:0 0 0 1px color-mix(in srgb,#57e389 24%,transparent); }
.status-dot--unavailable { background: #ff8585; }
.legend { display: flex; flex-wrap: wrap; gap: 16px; padding: 16px; color: var(--cue-muted); font-size: 11px; }
.legend span { display: flex; align-items: center; gap: 7px; }
.day-panel { position: sticky; top: 92px; overflow: hidden; }
.day-heading { align-items: center; padding: 18px; border-bottom: 1px solid var(--cue-border); }
.day-heading h2 { font-size: 20px; text-transform: capitalize; }
.add-button { min-height:38px; padding:0 14px; border:1px solid var(--cue-accent); background:var(--cue-accent); color:#070707; cursor:pointer; font-size:11px; font-weight:850; }
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
.error-message { width:min(1440px,100%); box-sizing:border-box; margin:18px auto 0; padding:13px 16px; border:1px solid #8b3434; color:#ffadad; }
.workspace-skeleton { width:min(1440px,100%); margin:0 auto; padding:28px 0 24px; }
.workspace-skeleton__heading { display:grid; gap:12px; max-width:720px; margin-bottom:28px; }
.workspace-skeleton__stats { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); border-top:1px solid var(--cue-border); border-left:1px solid var(--cue-border); }
.workspace-skeleton__body { display:grid; grid-template-columns:1.35fr .65fr; gap:16px; margin-top:18px; }
.skeleton-line, .skeleton-card, .skeleton-panel { display:block; position:relative; overflow:hidden; background:var(--cue-surface); border:1px solid var(--cue-border); }
.skeleton-line::after, .skeleton-card::after, .skeleton-panel::after { position:absolute; inset:0; background:linear-gradient(100deg,transparent 20%,color-mix(in srgb,var(--cue-text) 7%,transparent) 46%,transparent 72%); transform:translateX(-100%); animation:workspace-shimmer 1.35s ease-in-out infinite; content:''; }
.skeleton-line { height:12px; border:0; }
.skeleton-line--eyebrow { width:150px; }
.skeleton-line--title { width:min(620px,90%); height:58px; }
.skeleton-line--body { width:min(520px,75%); height:18px; }
.skeleton-card { min-height:150px; border-top:0; border-left:0; }
.skeleton-panel { min-height:300px; }
@keyframes workspace-shimmer { to { transform:translateX(100%); } }
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
.profile-view--presence { display:grid; gap:18px; }
.profile-presence-heading { margin-bottom:2px; }
.profile-presence-status { display:flex; justify-content:space-between; align-items:center; gap:12px; padding:10px 12px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-panel); background:var(--cue-surface); }
.profile-presence-status > div:first-child { display:grid; gap:3px; }
.profile-presence-status span { color:var(--cue-toggle); font:800 9px/1 monospace; letter-spacing:.12em; }
.profile-presence-status strong { font-size:13px; overflow-wrap:anywhere; }
.profile-presence-status__actions button { min-height:var(--cue-button-sm); padding:0 12px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-control); background:transparent; color:var(--cue-text); font-weight:800; cursor:pointer; }
.profile-presence-preview { border:1px solid var(--cue-border); background:var(--cue-surface); overflow:hidden; }
.profile-presence-preview__head { display:flex; justify-content:space-between; gap:18px; align-items:flex-end; padding:16px 18px; border-bottom:1px solid var(--cue-border); }
.profile-presence-preview__head > div { display:grid; gap:6px; }
.profile-presence-preview__head span,.profile-builder__head span { color:var(--cue-accent); font:800 9px/1.2 monospace; letter-spacing:.12em; }
.profile-presence-preview__head strong,.profile-builder__head strong { font-size:16px; }
.profile-presence-preview__head small { max-width:360px; color:var(--cue-muted); text-align:right; line-height:1.4; }
.profile-presence-preview__frame { max-height:720px; overflow:auto; background:#0b0b0b; }
.profile-builder { display:grid; gap:8px; }
.profile-builder__head { display:flex; justify-content:space-between; align-items:end; gap:12px; padding:4px 0 0; }
.profile-builder__head > div { display:grid; gap:6px; }
.profile-builder__head > small { color:var(--cue-toggle); font:900 24px/1 monospace; }
.profile-builder__grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
.profile-builder__grid > button,.profile-builder__cue-id { display:grid; align-content:start; min-height:118px; padding:14px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-panel); background:var(--cue-surface); color:var(--cue-text); text-align:left; text-decoration:none; cursor:pointer; transition:border-color .16s ease,background .16s ease; }
.profile-builder__grid > button:hover,.profile-builder__grid > button.active,.profile-builder__cue-id:hover { border-color:var(--cue-toggle); background:color-mix(in srgb,var(--cue-toggle) 5%,var(--cue-surface)); }
.profile-builder__grid span,.profile-builder__cue-id span { color:var(--cue-muted); font:800 9px/1 monospace; letter-spacing:.12em; }
.profile-builder__grid strong,.profile-builder__cue-id strong { margin-top:14px; font-size:18px; text-transform:uppercase; }
.profile-builder__grid p,.profile-builder__cue-id p { margin:6px 0 0; color:var(--cue-muted); font-size:11px; line-height:1.4; }
.profile-builder__cue-id { border-color:color-mix(in srgb,var(--cue-accent) 38%,var(--cue-border)); }
.profile-builder__cue-id strong { color:var(--cue-accent); }
.profile-builder__cue-title{display:flex;align-items:center;gap:8px;margin-top:14px}.profile-builder__cue-title strong{margin-top:0}.profile-builder__cue-title small{padding:4px 6px;border:1px solid color-mix(in srgb,var(--cue-accent) 46%,var(--cue-border));border-radius:var(--cue-radius-sm);color:var(--cue-accent);font:800 8px/1 monospace;letter-spacing:.08em}
.profile-builder-editor { border:1px solid var(--cue-toggle); background:var(--cue-surface); }
.profile-builder-editor > header { display:flex; justify-content:space-between; gap:20px; align-items:flex-start; padding:18px; border-bottom:1px solid var(--cue-border); }
.profile-builder-editor > header h2 { margin:6px 0 0; font-size:clamp(1.5rem,3vw,2.5rem); text-transform:uppercase; }
.profile-builder-editor > header > button { width:40px; height:40px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); font-size:23px; cursor:pointer; }
.profile-builder-editor .profile-fields--builder { border:0; }
.profile-builder-image { padding:18px; }
.profile-builder-image .profile-cover-message { margin:12px 0 0; }
.profile-builder-editor > footer { display:flex; justify-content:flex-end; align-items:center; gap:14px; padding:14px 18px; border-top:1px solid var(--cue-border); }
.profile-builder-editor > footer p { margin:0; color:#ff9b9b; font-size:12px; }
.profile-builder-editor > footer p.success { color:#8ce99a; }
.profile-builder-editor > footer .primary-button { min-width:170px; padding:0 16px; }

.profile-presence-status__identity { min-width:0; }
.profile-presence-status__actions { display:flex; align-items:center; gap:8px; }
.profile-presence-toggle { display:flex; align-items:center; gap:8px; min-height:var(--cue-button-sm); padding:0 12px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-control); cursor:pointer; }
.profile-presence-toggle input { appearance:none; -webkit-appearance:none; width:18px; height:18px; margin:0; border:1px solid var(--cue-border); border-radius:5px; background:transparent; }
.profile-presence-toggle input:checked { border-color:var(--cue-toggle); background:var(--cue-toggle); box-shadow:inset 0 0 0 4px var(--cue-surface); }
.profile-presence-toggle span { color:var(--cue-text); font:800 10px/1.2 sans-serif; letter-spacing:0; }
.profile-booking-public-toggle { border-color:color-mix(in srgb,var(--cue-toggle) 40%,var(--cue-border)) !important; }
.profile-builder-note { margin:0; padding:11px 13px; border:1px dashed var(--cue-border); color:var(--cue-muted); font-size:12px; line-height:1.45; }
.profile-distribution-editor { display:grid; gap:16px; padding:18px; }
.profile-distribution-editor > p { max-width:760px; margin:0; color:var(--cue-muted); line-height:1.55; }
.profile-distribution-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
.profile-distribution-grid article { display:grid; align-content:start; gap:10px; min-width:0; padding:15px; border:1px solid var(--cue-border); background:var(--cue-bg); }
.profile-distribution-grid article > span { color:var(--cue-accent); font:800 9px/1.2 monospace; letter-spacing:.1em; }
.profile-distribution-grid article > strong,.profile-distribution-grid article > code { overflow-wrap:anywhere; color:var(--cue-muted); font:600 11px/1.5 monospace; }
.profile-distribution-grid article > button { justify-self:start; min-height:38px; padding:0 12px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); font-weight:800; cursor:pointer; }
.profile-distribution-grid article > button:disabled { opacity:.4; cursor:not-allowed; }
.profile-distribution-grid__wide { grid-column:1 / -1; }
.profile-distribution-editor > small { color:var(--cue-toggle); font-weight:800; }

.profile-view--hub { display:grid; gap:18px; }
.profile-hub-heading { margin-bottom:4px; }
.profile-hub-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
.profile-hub-card { position:relative; display:grid; align-content:start; min-height:260px; padding:22px; border:1px solid var(--cue-border); background:var(--cue-surface); overflow:hidden; }
.profile-hub-card__head { display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:26px; color:var(--cue-muted); font:800 9px/1.2 monospace; letter-spacing:.12em; text-transform:uppercase; }
.profile-hub-card__head > strong { color:var(--cue-toggle); font-size:24px; letter-spacing:-.04em; }
.profile-hub-card__head > small { color:var(--cue-accent); font:800 9px/1.2 monospace; }
.profile-hub-card__head > i { width:9px; height:9px; border-radius:50%; background:var(--cue-dim); }
.profile-hub-card__head > i.active { background:var(--cue-toggle); box-shadow:0 0 14px color-mix(in srgb,var(--cue-toggle) 55%,transparent); }
.profile-hub-identity h2 { margin:0 0 8px; font-size:clamp(2rem,4vw,4rem); line-height:.9; letter-spacing:-.04em; text-transform:uppercase; }
.profile-hub-identity p,.profile-hub-card__copy p { margin:0; color:var(--cue-muted); line-height:1.5; }
.profile-hub-tags { display:flex; flex-wrap:wrap; gap:7px; margin-top:22px; }
.profile-hub-tags span,.profile-hub-distribution-list span { padding:7px 9px; border:1px solid var(--cue-border); color:var(--cue-muted); font:800 9px/1 monospace; letter-spacing:.08em; text-transform:uppercase; }
.profile-hub-card__actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:auto; padding-top:24px; }
.profile-hub-card__actions button,.profile-hub-primary-link { min-height:42px; padding:0 14px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); font-weight:850; text-decoration:none; cursor:pointer; }
.profile-hub-card__actions button:first-child,.profile-hub-primary-link { border-color:var(--cue-toggle); background:var(--cue-toggle); color:#090909; }
.profile-hub-card--cue { background:radial-gradient(circle at 70% 35%,color-mix(in srgb,var(--cue-accent) 10%,transparent),transparent 38%),var(--cue-surface); }
.profile-hub-cue-visual { position:relative; display:grid; place-items:center; min-height:116px; margin:-8px 0 20px; }
.profile-hub-cue-visual b { position:relative; z-index:2; color:var(--cue-accent); font:900 20px/1 monospace; letter-spacing:.15em; }
.profile-hub-cue-ring { position:absolute; border:1px solid color-mix(in srgb,var(--cue-accent) 28%,transparent); border-radius:50%; }
.profile-hub-cue-ring--outer { width:170px; height:170px; }
.profile-hub-cue-ring--inner { width:100px; height:100px; border-style:dashed; }
.profile-hub-card__copy { display:grid; gap:8px; }
.profile-hub-card__copy strong { font-size:18px; line-height:1.2; }
.profile-hub-card__copy small { color:var(--cue-accent); font:800 9px/1.3 monospace; letter-spacing:.08em; text-transform:uppercase; }
.profile-hub-primary-link { display:flex; align-items:center; justify-content:space-between; margin-top:22px; }
.profile-hub-distribution-list { display:flex; flex-wrap:wrap; gap:7px; margin-top:auto; padding-top:24px; }
.profile-hub-publishing { margin-top:2px; }
.profile-form--editor { margin-top:8px; padding-top:18px; border-top:1px solid var(--cue-border); }
.profile-editor-heading { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; padding:4px 0 18px; }
.profile-editor-heading h2 { margin:7px 0 0; font-size:clamp(1.6rem,4vw,3rem); line-height:.95; text-transform:uppercase; }
.profile-editor-heading > button { width:42px; height:42px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); font-size:24px; cursor:pointer; }

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
.profile-fields { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; padding: 16px; }
.profile-fields label, .profile-fields .chip-field { display: grid; align-content: start; gap: 6px; }
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
.public-publishing-message { margin: -12px 0 24px; color: var(--cue-muted); font-size: 12px; }
.profile-preview-backdrop { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 24px; overflow-y: auto; background: rgba(0,0,0,.82); backdrop-filter: blur(9px); }
.profile-preview { width: min(1280px, 100%); max-height: calc(100dvh - 48px); overflow-y: auto; border: 1px solid #343434; background: #0b0b0b; color: #f4f2ed; box-shadow: 0 30px 100px #000; }
.profile-preview > header { position: sticky; z-index: 2; top: 0; display: flex; justify-content: space-between; align-items: center; min-height: 58px; padding: 0 22px; border-bottom: 1px solid #343434; background: rgba(11,11,11,.95); }
.profile-preview > header p { margin: 0; color: #cfff57; font: 700 10px/1.3 monospace; letter-spacing: .12em; }
.profile-preview > header button { width: 38px; height: 38px; border: 1px solid #343434; border-radius: var(--cue-radius-control); background: transparent; color: #f4f2ed; cursor: pointer; font-size: 25px; }
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
:global(:root[data-theme='light']) .add-button { border-color: var(--cue-accent); background: var(--cue-accent); color: var(--cue-accent-ink); }
:global(:root[data-theme='light']) .tone-lime { color: #5127c7 !important; }
:global(:root[data-theme='light'] .tour-focus) { outline-color: var(--cue-accent); box-shadow: 0 0 18px color-mix(in srgb, var(--cue-accent) 62%, transparent), 0 0 55px color-mix(in srgb, var(--cue-accent) 25%, transparent); animation-name: tour-pulse-light; }
:global(:root[data-theme='light']) .tour-card { border-color: var(--cue-accent); box-shadow: 0 0 32px color-mix(in srgb, var(--cue-accent) 22%, transparent), 0 24px 80px var(--cue-shadow); }
:global(:root[data-theme='light']) .tour-card > span { color: var(--cue-accent); }
:global(.tour-focus) { position: relative; z-index: 32; outline: 2px solid var(--cue-accent); outline-offset: 5px; box-shadow: 0 0 18px color-mix(in srgb, var(--cue-accent) 70%, transparent), 0 0 55px color-mix(in srgb, var(--cue-accent) 28%, transparent); animation: tour-pulse 1.5s ease-in-out infinite alternate; }
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
  .profile-presence-status { align-items:flex-start; flex-direction:column; }
  .profile-presence-status__actions,.profile-presence-status__actions button { width:100%; }
  .profile-presence-status__actions { align-items:stretch; flex-direction:column; }
  .profile-presence-toggle { width:100%; box-sizing:border-box; }
  .profile-distribution-grid { grid-template-columns:1fr; }
  .profile-distribution-grid__wide { grid-column:auto; }
  .profile-presence-preview__head { align-items:flex-start; flex-direction:column; }
  .profile-presence-preview__head small { text-align:left; }
  .profile-presence-preview__frame { max-height:none; }
  .profile-builder__grid { grid-template-columns:1fr 1fr; }
  .profile-builder__grid > button,.profile-builder__cue-id { min-height:126px; padding:14px; }
  .profile-builder__grid strong,.profile-builder__cue-id strong { margin-top:16px; font-size:16px; }
  .profile-builder-editor > footer { align-items:stretch; flex-direction:column; }
  .profile-builder-editor > footer .primary-button { width:100%; }

  .profile-hub-grid { grid-template-columns:1fr; gap:10px; }
  .profile-hub-card { min-height:0; padding:16px; }
  .profile-hub-card__head { margin-bottom:18px; }
  .profile-hub-identity h2 { font-size:2.35rem; }
  .profile-hub-cue-visual { min-height:92px; }
  .profile-hub-cue-ring--outer { width:135px; height:135px; }
  .profile-hub-cue-ring--inner { width:78px; height:78px; }
  .profile-hub-card__actions { display:grid; grid-template-columns:1fr 1fr; }
  .profile-hub-card__actions button,.profile-hub-primary-link { width:100%; }
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

.cue-entry-bar { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 14px; padding: 16px 18px; border: 1px solid color-mix(in srgb, var(--cue-accent) 48%, var(--cue-border)); background: color-mix(in srgb, var(--cue-accent) 5%, var(--cue-surface)); }
.cue-entry-bar > div { min-width: 0; }
.cue-entry-bar span { display: block; margin-bottom: 5px; color: var(--cue-accent); font: 700 9px/1.2 monospace; letter-spacing: .12em; }
.cue-entry-bar strong { display: block; font-size: 15px; }
.cue-entry-bar p { margin: 4px 0 0; max-width: 760px; color: var(--cue-muted); font-size: 12px; line-height: 1.4; }
.cue-entry-actions { display:flex; align-items:center; gap:8px; flex:0 0 auto; }
.cue-entry-actions > button { min-height:44px; padding:0 14px; cursor:pointer; font-weight:900; letter-spacing:.04em; }
.cue-entry-actions > button:last-child { min-width:104px; padding-inline:18px; border:0; background:var(--cue-accent); color:#090909; }
.cue-entry-actions .cue-tour-action { border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); font:700 9px monospace; text-transform:uppercase; }
.cue-entry-actions .cue-tour-action:hover:not(:disabled) { border-color:var(--cue-accent); color:var(--cue-accent); }
.cue-entry-actions .cue-tour-action:disabled { opacity:.42; cursor:not-allowed; }
.cue-entry-message { margin: -2px 0 14px; padding: 9px 12px; border-left: 2px solid var(--cue-mint); color: var(--cue-muted); font-size: 11px; }
@media (max-width: 760px) {
  .cue-entry-bar { align-items: stretch; gap: 10px; margin-bottom: 10px; padding: 11px 12px; }
  .cue-entry-bar span { font-size: 8px; }
  .cue-entry-bar strong { font-size: 12px; }
  .cue-entry-bar p { display: none; }
  .cue-entry-actions { align-self:center; }
  .cue-entry-actions > button { min-height:38px; padding:0 10px; }
  .cue-entry-actions > button:last-child { min-width:82px; padding-inline:12px; }
}

.core-calendar-holds { display:grid; gap:7px; padding:10px 12px; border-bottom:1px solid var(--cue-border); background:color-mix(in srgb, var(--cue-accent) 4%, var(--cue-surface)); }
.core-calendar-holds article { display:flex; align-items:flex-start; gap:9px; padding:9px 10px; border:1px solid color-mix(in srgb, var(--cue-accent) 32%, var(--cue-border)); }
.core-calendar-holds article > i { flex:0 0 auto; margin-top:4px; }
.core-calendar-holds strong, .core-calendar-holds span { display:block; }
.core-calendar-holds strong { font-size:11px; }
.core-calendar-holds span { margin-top:3px; color:var(--cue-muted); font-size:9px; }
.core-timeline-hold { z-index:3; border-style:dashed !important; }
.core-calendar-confirmed { border-style:solid !important; }
.core-timeline-confirmed { z-index:4; }

@media (max-width:760px) {
  .workspace-skeleton { padding-top:20px; }
  .workspace-skeleton__stats { grid-template-columns:1fr 1fr; }
  .workspace-skeleton__stats .skeleton-card:last-child { grid-column:1 / -1; min-height:100px; }
  .workspace-skeleton__body { grid-template-columns:1fr; }
  .skeleton-line--title { height:42px; }
  .skeleton-card { min-height:112px; }
  .skeleton-panel { min-height:220px; }
}
</style>
