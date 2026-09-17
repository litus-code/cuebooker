from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected 1 match, found {count}")
    return text.replace(old, new, 1)


def replace_between(text: str, start: str, end: str, replacement: str, label: str) -> str:
    start_index = text.find(start)
    if start_index < 0:
        raise RuntimeError(f"{label}: start marker not found")
    end_index = text.find(end, start_index)
    if end_index < 0:
        raise RuntimeError(f"{label}: end marker not found")
    return text[:start_index] + replacement + text[end_index:]


workspace_path = Path("app/pages/workspace.vue")
inbox_path = Path("app/components/BookingCoreInbox.vue")
workspace = workspace_path.read_text()
inbox = inbox_path.read_text()

workspace = replace_once(
    workspace,
    "import { bookingStatuses, statusTone, type BookingStatus } from '../domain/booking'\n",
    "",
    "legacy booking import",
)

for legacy_ref in (
    "const bookingFilter = ref<'all' | BookingStatus>('all')\n",
    "const bookingSearch = ref('')\n",
    "const historySearch = ref('')\n",
    "const historyPage = ref(1)\n",
    "const historyPageSize = 10\n",
    "const selectedDemoBookingId = ref('')\n",
    "const showSampleMode = ref(route.query.demo === '1')\n",
    "const demoReply = ref('')\n",
):
    workspace = replace_once(workspace, legacy_ref, "", f"remove {legacy_ref.strip()}")

workspace = workspace.replace(
    "realBookingsBody: 'Aún sin conectar. La bandeja completa está disponible con ejemplos.'",
    "realBookingsBody: 'El workspace operativo todavía no está disponible para este artista.'",
)
workspace = workspace.replace(
    "realBookingsBody: 'Not connected yet. The complete inbox is available with examples.'",
    "realBookingsBody: 'The operational workspace is not available for this artist yet.'",
)

new_tour_steps = '''const tourSteps = computed(() => preferences.locale.value === 'es' ? [
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

'''
workspace = replace_between(workspace, "const tourSteps = computed", "const manageableAgency", new_tour_steps, "tour steps")

workspace = replace_between(
    workspace,
    "const sampleNamespace = computed",
    "const dateLocale = computed",
    "const tourNamespace = computed(() => auth.session.value?.user.id && selectedArtistId.value ? `workspace-${auth.session.value.user.id}-${selectedArtistId.value}` : undefined)\n",
    "demo namespace",
)
workspace = replace_between(workspace, "const demoActiveBookings = computed", "const currentTour = computed", "", "demo booking computed state")
workspace = replace_between(workspace, "const historyItems = computed", "const hours = Array.from", "", "demo history computed state")

for legacy_watch in (
    "watch(historySearch, () => { historyPage.value = 1 })\n",
    "watch(historyPageCount, count => { if (historyPage.value > count) historyPage.value = count })\n",
):
    workspace = replace_once(workspace, legacy_watch, "", f"remove {legacy_watch.strip()}")

workspace = replace_between(workspace, "watch(demo.ready, async (value) => {", "watch(profilePreviewOpen, (open) => {", "", "demo ready watcher")
workspace = replace_between(workspace, "watch(selectedDemoBookingId, async (id) => {", "watch(tourStep, async (step) => {", "", "demo selection watcher")

workspace = replace_once(
    workspace,
    "  if (tourPositionTimer) window.clearTimeout(tourPositionTimer)\n})",
    "  if (tourPositionTimer) window.clearTimeout(tourPositionTimer)\n  document.querySelectorAll<HTMLElement>('.tour-focus').forEach(element => element.classList.remove('tour-focus'))\n})",
    "tour unmount cleanup",
)
workspace = replace_once(
    workspace,
    "  const target = document.getElementById(item.target)\n  const card = document.querySelector<HTMLElement>('.workspace .tour-card')\n  if (!target || !card) return\n",
    "  document.querySelectorAll<HTMLElement>('.tour-focus').forEach(element => element.classList.remove('tour-focus'))\n  const target = document.getElementById(item.target)\n  const card = document.querySelector<HTMLElement>('.workspace .tour-card')\n  if (!target || !card) return\n  target.classList.add('tour-focus')\n",
    "tour dynamic focus",
)

workspace = replace_between(
    workspace,
    "async function openCalendarBlock(block: AvailabilityBlock) {",
    "function shortDate",
    "function openCalendarBlock(block: AvailabilityBlock) {\n  startEdit(block)\n}\n\n",
    "legacy calendar demo link",
)
workspace = replace_between(workspace, "function formatDemoDate", "function startTour", "", "demo helpers")
workspace = replace_once(
    workspace,
    "function startTour() {\n  bookingFilter.value = 'all'\n  tourStep.value = 0\n}",
    "function startTour() {\n  if (!realBookings.value.some(item => !item.archived_at)) return\n  tourStep.value = 0\n}",
    "real tour start",
)
workspace = replace_once(
    workspace,
    "  if (import.meta.client && sampleNamespace.value) localStorage.setItem(`cuebooker.tour.seen.${sampleNamespace.value}`, 'true')\n  tourStep.value = -1\n  tourCardStyle.value = {}",
    "  if (import.meta.client && tourNamespace.value) localStorage.setItem(`cuebooker.tour.seen.${tourNamespace.value}`, 'true')\n  document.querySelectorAll<HTMLElement>('.tour-focus').forEach(element => element.classList.remove('tour-focus'))\n  tourStep.value = -1\n  tourCardStyle.value = {}",
    "tour namespace",
)
workspace = replace_between(workspace, "async function clearSampleBookings() {", "function statusLabel", "", "sample management functions")
workspace = replace_between(workspace, "async function openHistoryItem(bookingId: string) {", "async function logout", "", "sample history navigation")

workspace = replace_once(
    workspace,
    '<section v-if="bookingCoreWorkspaceId" class="cue-entry-bar">',
    '<section v-if="bookingCoreWorkspaceId" id="workspace-cue" class="cue-entry-bar">',
    "cue tour anchor",
)
workspace = replace_once(
    workspace,
    '          <button type="button" @click="cueOpen = true">+ CUE</button>\n        </section>\n        <p v-if="cueMessage" class="cue-entry-message">',
    '          <div class="cue-entry-actions">\n            <button class="cue-tour-action" type="button" :disabled="!realBookings.some(item => !item.archived_at)" @click="startTour">{{ copy.guidedTour }}</button>\n            <button type="button" @click="cueOpen = true">+ CUE</button>\n          </div>\n        </section>\n        <p v-if="cueMessage" class="cue-entry-message">',
    "real tour action",
)
workspace = replace_between(
    workspace,
    '        <aside v-if="showSampleMode" id="sample-mode"',
    '      </section>\n\n      <section v-else-if="activeView === \'calendar\'"',
    '',
    "bookings demo template",
)
workspace = replace_between(
    workspace,
    '        <div v-if="showSampleMode && historyItems.length"',
    '      </section>\n\n      <section v-else class="view profile-view">',
    '',
    "history demo template",
)

workspace = replace_once(
    workspace,
    ":global(:root[data-theme='light']) .tour-focus {",
    ":global(:root[data-theme='light'] .tour-focus) {",
    "light tour global focus",
)
workspace = replace_once(workspace, "\n.tour-focus {", "\n:global(.tour-focus) {", "tour global focus")

workspace = replace_once(
    workspace,
    ".cue-entry-bar > button { min-width: 104px; min-height: 44px; padding: 0 18px; border: 0; background: var(--cue-accent); color: #090909; cursor: pointer; font-weight: 900; letter-spacing: .04em; }",
    ".cue-entry-actions { display:flex; align-items:center; gap:8px; flex:0 0 auto; }\n.cue-entry-actions > button { min-height:44px; padding:0 14px; cursor:pointer; font-weight:900; letter-spacing:.04em; }\n.cue-entry-actions > button:last-child { min-width:104px; padding-inline:18px; border:0; background:var(--cue-accent); color:#090909; }\n.cue-entry-actions .cue-tour-action { border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); font:700 9px monospace; text-transform:uppercase; }\n.cue-entry-actions .cue-tour-action:hover:not(:disabled) { border-color:var(--cue-accent); color:var(--cue-accent); }\n.cue-entry-actions .cue-tour-action:disabled { opacity:.42; cursor:not-allowed; }",
    "cue entry actions css",
)
workspace = replace_once(
    workspace,
    "  .cue-entry-bar > button { min-width: 82px; min-height: 38px; padding: 0 12px; }",
    "  .cue-entry-actions { align-self:center; }\n  .cue-entry-actions > button { min-height:38px; padding:0 10px; }\n  .cue-entry-actions > button:last-child { min-width:82px; padding-inline:12px; }",
    "cue entry actions mobile css",
)

inbox = replace_once(inbox, '<div v-if="bookings.length" class="core-inbox__tools">', '<div v-if="bookings.length" id="core-inbox-tools" class="core-inbox__tools">', "inbox tools anchor")
inbox = replace_once(inbox, '<div class="core-inbox__list">', '<div id="core-inbox-list" class="core-inbox__list">', "inbox list anchor")
inbox = replace_once(inbox, '<article v-if="selectedBooking" class="core-inbox__detail">', '<article v-if="selectedBooking" id="core-inbox-detail" class="core-inbox__detail">', "inbox detail anchor")
inbox = replace_once(inbox, '<dl class="core-inbox__facts">', '<dl id="core-inbox-facts" class="core-inbox__facts">', "inbox facts anchor")
inbox = replace_once(inbox, '        <BookingCoreOperations\n          v-if="!selectedBooking.archived_at"', '        <BookingCoreOperations\n          id="core-inbox-operations"\n          v-if="!selectedBooking.archived_at"', "operations tour anchor")
inbox = replace_once(inbox, '        <BookingActivityComposer\n          v-if="!selectedBooking.archived_at"', '        <BookingActivityComposer\n          id="core-inbox-activity-composer"\n          v-if="!selectedBooking.archived_at"', "activity tour anchor")

for forbidden in (
    "showSampleMode",
    "selectedDemoBookingId",
    "demoActiveBookings",
    "demoFilteredBookings",
    "selectedDemoBooking",
    "useBookingDemo(",
    "sampleNamespace",
):
    if forbidden in workspace:
        raise RuntimeError(f"workspace still contains demo coupling: {forbidden}")

workspace_path.write_text(workspace)
inbox_path.write_text(inbox)
print("Booking Core workspace detached from demo state and guided tour migrated to real surfaces.")
