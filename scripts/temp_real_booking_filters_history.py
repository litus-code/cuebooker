from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'{label} anchor missing')
    return text.replace(old, new, 1)


# API: scope bookings by artist and expose a bounded activity feed for real History.
api_path = Path('app/services/bookingCoreApi.ts')
api = api_path.read_text()
api = replace_once(
    api,
    """  async function listBookings(workspaceId: string, limit = 50) {\n    return $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/bookings`, {\n      headers: authHeaders(),\n      query: {\n        workspace_id: `eq.${workspaceId}`,\n        select: 'id,workspace_id,artist_id,primary_contact_id,counterparty_id,source,status,event_name,venue_name,city,country_code,event_date,start_time,end_time,event_timezone,offer_amount_minor,currency,fee_basis,archived_at,created_by,created_at,updated_at',\n        order: 'updated_at.desc',\n        limit: String(Math.min(Math.max(limit, 1), 100))\n      }\n    })\n  }\n""",
    """  async function listBookings(workspaceId: string, limit = 50, artistId?: string) {\n    return $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/bookings`, {\n      headers: authHeaders(),\n      query: {\n        workspace_id: `eq.${workspaceId}`,\n        ...(artistId ? { artist_id: `eq.${artistId}` } : {}),\n        select: 'id,workspace_id,artist_id,primary_contact_id,counterparty_id,source,status,event_name,venue_name,city,country_code,event_date,start_time,end_time,event_timezone,offer_amount_minor,currency,fee_basis,archived_at,created_by,created_at,updated_at',\n        order: 'updated_at.desc',\n        limit: String(Math.min(Math.max(limit, 1), 100))\n      }\n    })\n  }\n""",
    'listBookings'
)
api = replace_once(
    api,
    """  async function createActivity(input: CreateActivityInput) {""",
    """  async function listWorkspaceActivities(workspaceId: string, bookingIds: string[] = [], limit = 200) {\n    if (!bookingIds.length) return [] as Activity[]\n    return $fetch<Activity[]>(`${baseUrl}/rest/v1/activities`, {\n      headers: authHeaders(),\n      query: {\n        workspace_id: `eq.${workspaceId}`,\n        booking_id: `in.(${bookingIds.join(',')})`,\n        select: 'id,workspace_id,booking_id,type,direction,contact_id,actor_user_id,body,metadata,visibility,occurred_at,created_by,created_at',\n        order: 'occurred_at.desc',\n        limit: String(Math.min(Math.max(limit, 1), 500))\n      }\n    })\n  }\n\n  async function createActivity(input: CreateActivityInput) {""",
    'listWorkspaceActivities'
)
api = replace_once(
    api,
    """    listActivities,\n    createActivity,""",
    """    listActivities,\n    listWorkspaceActivities,\n    createActivity,""",
    'API return listWorkspaceActivities'
)
api_path.write_text(api)


# Real Bookings inbox: search/status filters and deterministic focus from Calendar/History.
inbox_path = Path('app/components/BookingCoreInbox.vue')
inbox = inbox_path.read_text()
inbox = replace_once(
    inbox,
    """  bookings: CoreBooking[]\n  locale: 'es' | 'en'\n}>()""",
    """  bookings: CoreBooking[]\n  locale: 'es' | 'en'\n  focusBookingId?: string\n}>()""",
    'inbox focus prop'
)
inbox = replace_once(
    inbox,
    "const updatingStatus = ref(false)\n",
    "const updatingStatus = ref(false)\nconst realSearch = ref('')\nconst realStatusFilter = ref<'all' | CoreBookingStatus>('all')\n",
    'inbox filter state'
)
inbox = replace_once(
    inbox,
    "const selectedBooking = computed(() => props.bookings.find(item => item.id === selectedBookingId.value) || props.bookings[0] || null)\n",
    """const visibleBookings = computed(() => {\n  const query = realSearch.value.trim().toLowerCase()\n  return props.bookings.filter(booking => {\n    if (realStatusFilter.value !== 'all' && booking.status !== realStatusFilter.value) return false\n    if (!query) return true\n    const party = booking.counterparty_id ? counterparties.value.find(item => item.id === booking.counterparty_id) : null\n    const contact = booking.primary_contact_id ? contacts.value.find(item => item.id === booking.primary_contact_id) : null\n    return [booking.event_name, booking.venue_name, booking.city, booking.source, party?.name, contact?.name, contact?.email]\n      .filter(Boolean).join(' ').toLowerCase().includes(query)\n  })\n})\nconst selectedBooking = computed(() => props.bookings.find(item => item.id === selectedBookingId.value) || visibleBookings.value[0] || props.bookings[0] || null)\n""",
    'visible bookings'
)
watch_block = """watch(() => props.bookings, value => {\n  if (!value.length) selectedBookingId.value = ''\n  else if (!value.some(item => item.id === selectedBookingId.value)) selectedBookingId.value = value[0].id\n}, { immediate: true, deep: true })\n"""
if "watch(() => props.focusBookingId" not in inbox:
    if watch_block not in inbox:
        raise SystemExit('inbox booking watch missing')
    inbox = inbox.replace(watch_block, watch_block + """\nwatch(() => props.focusBookingId, value => {\n  if (value && props.bookings.some(item => item.id === value)) {\n    realSearch.value = ''\n    realStatusFilter.value = 'all'\n    selectedBookingId.value = value\n  }\n}, { immediate: true })\n\nwatch(visibleBookings, value => {\n  if (value.length && !value.some(item => item.id === selectedBookingId.value)) selectedBookingId.value = value[0].id\n}, { deep: true })\n""", 1)

inbox = replace_once(
    inbox,
    """    <div v-else class=\"core-inbox__layout\">""",
    """    <div v-if=\"bookings.length\" class=\"core-inbox__tools\">\n      <input v-model=\"realSearch\" type=\"search\" :placeholder=\"locale === 'es' ? 'Buscar booking, sala, contacto…' : 'Search booking, venue, contact…'\">\n      <div class=\"core-inbox__filters\">\n        <button type=\"button\" :class=\"{ active: realStatusFilter === 'all' }\" @click=\"realStatusFilter = 'all'\">{{ locale === 'es' ? 'Todos' : 'All' }} · {{ bookings.length }}</button>\n        <button v-for=\"(label, status) in statusLabels\" :key=\"status\" type=\"button\" :class=\"{ active: realStatusFilter === status }\" @click=\"realStatusFilter = status\">{{ label }} · {{ bookings.filter(item => item.status === status).length }}</button>\n      </div>\n    </div>\n\n    <p v-if=\"bookings.length && !visibleBookings.length\" class=\"core-inbox__empty\">{{ locale === 'es' ? 'No hay bookings con estos filtros.' : 'No bookings match these filters.' }}</p>\n\n    <div v-else-if=\"bookings.length\" class=\"core-inbox__layout\">""",
    'inbox toolbar'
)
if 'v-for="booking in visibleBookings"' not in inbox:
    inbox = inbox.replace('v-for="booking in bookings"', 'v-for="booking in visibleBookings"', 1)
inbox = replace_once(
    inbox,
    ".core-inbox__layout { display:grid; grid-template-columns:minmax(260px,.75fr) minmax(0,1.65fr); }\n",
    ".core-inbox__tools { display:grid; gap:8px; padding:10px; border-bottom:1px solid var(--cue-border); }\n.core-inbox__tools > input { min-height:36px; border:1px solid var(--cue-border); background:var(--cue-raised); color:var(--cue-text); padding:0 10px; }\n.core-inbox__filters { display:flex; gap:4px; overflow-x:auto; scrollbar-width:thin; }\n.core-inbox__filters button { flex:0 0 auto; min-height:29px; padding:0 8px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; text-transform:uppercase; }\n.core-inbox__filters button.active { border-color:var(--cue-accent); color:var(--cue-accent); }\n.core-inbox__layout { display:grid; grid-template-columns:minmax(260px,.75fr) minmax(0,1.65fr); }\n",
    'inbox filter css'
)
inbox_path.write_text(inbox)


# Workspace: artist-scoped operational data, real History and context-preserving navigation.
workspace_path = Path('app/pages/workspace.vue')
text = workspace_path.read_text()
text = replace_once(
    text,
    "const bookingCoreOperationsRevision = ref(0)\n",
    "const bookingCoreOperationsRevision = ref(0)\nconst realBookingFocusId = ref('')\n",
    'workspace focus state'
)
text = replace_once(
    text,
    """async function loadRealBookings() {\n  if (!bookingCoreWorkspaceId.value) { realBookings.value = []; return }\n  realBookings.value = await bookingCore.listBookings(bookingCoreWorkspaceId.value)\n}\n\nasync function loadRealHolds() {\n  if (!bookingCoreWorkspaceId.value) { realHolds.value = []; return }\n  realHolds.value = await bookingCore.listHolds(bookingCoreWorkspaceId.value, undefined, true)\n}\n""",
    """async function loadRealBookings() {\n  if (!bookingCoreWorkspaceId.value || !selectedArtistId.value) { realBookings.value = []; return }\n  realBookings.value = await bookingCore.listBookings(bookingCoreWorkspaceId.value, 100, selectedArtistId.value)\n}\n\nasync function loadRealHolds() {\n  if (!bookingCoreWorkspaceId.value || !realBookings.value.length) { realHolds.value = []; return }\n  const bookingIds = new Set(realBookings.value.map(item => item.id))\n  const rows = await bookingCore.listHolds(bookingCoreWorkspaceId.value, undefined, true)\n  realHolds.value = rows.filter(hold => bookingIds.has(hold.booking_id))\n}\n""",
    'workspace real loaders'
)
text = text.replace('    await Promise.all([loadRealBookings(), loadRealHolds()])', '    await loadRealBookings()\n    await loadRealHolds()', 1)
text = text.replace('  await loadRealBookings()\n  bookingCoreOperationsRevision.value += 1', '  await loadRealBookings()\n  await loadRealHolds()\n  bookingCoreOperationsRevision.value += 1', 1)
text = text.replace('  await Promise.all([loadRealBookings(), loadRealHolds()])', '  await loadRealBookings()\n  await loadRealHolds()', 1)

ops_handler = """async function handleBookingCoreOperationsChanged() {\n  bookingCoreOperationsRevision.value += 1\n  await loadRealBookings()\n  await loadRealHolds()\n}\n"""
if 'function openRealBooking(bookingId: string)' not in text:
    if ops_handler not in text:
        raise SystemExit('workspace operations handler missing after loader rewrite')
    text = text.replace(ops_handler, ops_handler + """\nfunction openRealBooking(bookingId: string) {\n  realBookingFocusId.value = bookingId\n  activeView.value = 'bookings'\n}\n""", 1)

text = replace_once(
    text,
    """          :bookings=\"realBookings\"\n          :locale=\"preferences.locale.value\"\n          @operations-changed=\"handleBookingCoreOperationsChanged\""" ,
    """          :bookings=\"realBookings\"\n          :locale=\"preferences.locale.value\"\n          :focus-booking-id=\"realBookingFocusId\"\n          @operations-changed=\"handleBookingCoreOperationsChanged\""" ,
    'workspace inbox focus binding'
)

history_heading = """        </div>\n        <div v-if=\"historyItems.length\" class=\"history-tools\">"""
if '<BookingCoreHistory' not in text:
    if history_heading not in text:
        raise SystemExit('workspace history anchor missing')
    text = text.replace(history_heading, """        </div>\n        <BookingCoreHistory\n          v-if=\"bookingCoreWorkspaceId\"\n          :workspace-id=\"bookingCoreWorkspaceId\"\n          :bookings=\"realBookings\"\n          :locale=\"preferences.locale.value\"\n          :refresh-key=\"bookingCoreOperationsRevision\"\n          @open-booking=\"openRealBooking\"\n        />\n        <div v-if=\"historyItems.length\" class=\"history-tools\">""", 1)

text = text.replace("@click.stop=\"activeView = 'bookings'\">\n                <strong>{{ coreHoldLabel(hold) }}", "@click.stop=\"openRealBooking(hold.booking_id)\">\n                <strong>{{ coreHoldLabel(hold) }}", 1)
text = text.replace("@click.stop=\"activeView = 'bookings'\">\n                <strong>{{ coreBookingLabel(booking) }}", "@click.stop=\"openRealBooking(booking.id)\">\n                <strong>{{ coreBookingLabel(booking) }}", 1)

workspace_path.write_text(text)
