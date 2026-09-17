from pathlib import Path


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'{label} anchor missing')
    return text.replace(old, new, 1)


api_path = Path('app/services/bookingCoreApi.ts')
api = api_path.read_text()
api = replace_once(api,
'''  async function listBookings(workspaceId: string, limit = 50) {
    return $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/bookings`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        select: 'id,workspace_id,artist_id,primary_contact_id,counterparty_id,source,status,event_name,venue_name,city,country_code,event_date,start_time,end_time,event_timezone,offer_amount_minor,currency,fee_basis,archived_at,created_by,created_at,updated_at',
        order: 'updated_at.desc',
        limit: String(Math.min(Math.max(limit, 1), 100))
      }
    })
  }
''',
'''  async function listBookings(workspaceId: string, limit = 50, artistId?: string) {
    return $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/bookings`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        ...(artistId ? { artist_id: `eq.${artistId}` } : {}),
        select: 'id,workspace_id,artist_id,primary_contact_id,counterparty_id,source,status,event_name,venue_name,city,country_code,event_date,start_time,end_time,event_timezone,offer_amount_minor,currency,fee_basis,archived_at,created_by,created_at,updated_at',
        order: 'updated_at.desc',
        limit: String(Math.min(Math.max(limit, 1), 100))
      }
    })
  }
''', 'listBookings')
api = replace_once(api,
'  async function createActivity(input: CreateActivityInput) {',
'''  async function listWorkspaceActivities(workspaceId: string, bookingIds: string[] = [], limit = 200) {
    if (!bookingIds.length) return [] as Activity[]
    return $fetch<Activity[]>(`${baseUrl}/rest/v1/activities`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        booking_id: `in.(${bookingIds.join(',')})`,
        select: 'id,workspace_id,booking_id,type,direction,contact_id,actor_user_id,body,metadata,visibility,occurred_at,created_by,created_at',
        order: 'occurred_at.desc',
        limit: String(Math.min(Math.max(limit, 1), 500))
      }
    })
  }

  async function createActivity(input: CreateActivityInput) {''', 'workspace activities')
api = replace_once(api,
'''    listActivities,
    createActivity,''',
'''    listActivities,
    listWorkspaceActivities,
    createActivity,''', 'API return')
api_path.write_text(api)

inbox_path = Path('app/components/BookingCoreInbox.vue')
inbox = inbox_path.read_text()
inbox = replace_once(inbox,
'''  bookings: CoreBooking[]
  locale: 'es' | 'en'
}>()''',
'''  bookings: CoreBooking[]
  locale: 'es' | 'en'
  focusBookingId?: string
}>()''', 'focus prop')
inbox = replace_once(inbox,
'const updatingStatus = ref(false)\n',
"const updatingStatus = ref(false)\nconst realSearch = ref('')\nconst realStatusFilter = ref<'all' | CoreBookingStatus>('all')\n", 'filter state')
inbox = replace_once(inbox,
'const selectedBooking = computed(() => props.bookings.find(item => item.id === selectedBookingId.value) || props.bookings[0] || null)\n',
'''const visibleBookings = computed(() => {
  const query = realSearch.value.trim().toLowerCase()
  return props.bookings.filter(booking => {
    if (realStatusFilter.value !== 'all' && booking.status !== realStatusFilter.value) return false
    if (!query) return true
    const party = booking.counterparty_id ? counterparties.value.find(item => item.id === booking.counterparty_id) : null
    const contact = booking.primary_contact_id ? contacts.value.find(item => item.id === booking.primary_contact_id) : null
    return [booking.event_name, booking.venue_name, booking.city, booking.source, party?.name, contact?.name, contact?.email]
      .filter(Boolean).join(' ').toLowerCase().includes(query)
  })
})
const selectedBooking = computed(() => props.bookings.find(item => item.id === selectedBookingId.value) || visibleBookings.value[0] || props.bookings[0] || null)
''', 'visible bookings')
watch_block = '''watch(() => props.bookings, value => {
  if (!value.length) selectedBookingId.value = ''
  else if (!value.some(item => item.id === selectedBookingId.value)) selectedBookingId.value = value[0].id
}, { immediate: true, deep: true })
'''
if 'watch(() => props.focusBookingId' not in inbox:
    if watch_block not in inbox: raise SystemExit('booking watch missing')
    inbox = inbox.replace(watch_block, watch_block + '''
watch(() => props.focusBookingId, value => {
  if (value && props.bookings.some(item => item.id === value)) {
    realSearch.value = ''
    realStatusFilter.value = 'all'
    selectedBookingId.value = value
  }
}, { immediate: true })

watch(visibleBookings, value => {
  if (value.length && !value.some(item => item.id === selectedBookingId.value)) selectedBookingId.value = value[0].id
}, { deep: true })
''', 1)
inbox = replace_once(inbox,
'    <div v-else class="core-inbox__layout">',
'''    <div v-if="bookings.length" class="core-inbox__tools">
      <input v-model="realSearch" type="search" :placeholder="locale === 'es' ? 'Buscar booking, sala, contacto…' : 'Search booking, venue, contact…'">
      <div class="core-inbox__filters">
        <button type="button" :class="{ active: realStatusFilter === 'all' }" @click="realStatusFilter = 'all'">{{ locale === 'es' ? 'Todos' : 'All' }} · {{ bookings.length }}</button>
        <button v-for="(label, status) in statusLabels" :key="status" type="button" :class="{ active: realStatusFilter === status }" @click="realStatusFilter = status">{{ label }} · {{ bookings.filter(item => item.status === status).length }}</button>
      </div>
    </div>

    <p v-if="bookings.length && !visibleBookings.length" class="core-inbox__empty">{{ locale === 'es' ? 'No hay bookings con estos filtros.' : 'No bookings match these filters.' }}</p>

    <div v-else-if="bookings.length" class="core-inbox__layout">''', 'toolbar')
if 'v-for="booking in visibleBookings"' not in inbox:
    inbox = inbox.replace('v-for="booking in bookings"', 'v-for="booking in visibleBookings"', 1)
inbox = replace_once(inbox,
'.core-inbox__layout { display:grid; grid-template-columns:minmax(260px,.75fr) minmax(0,1.65fr); }\n',
'''.core-inbox__tools { display:grid; gap:8px; padding:10px; border-bottom:1px solid var(--cue-border); }
.core-inbox__tools > input { min-height:36px; border:1px solid var(--cue-border); background:var(--cue-raised); color:var(--cue-text); padding:0 10px; }
.core-inbox__filters { display:flex; gap:4px; overflow-x:auto; scrollbar-width:thin; }
.core-inbox__filters button { flex:0 0 auto; min-height:29px; padding:0 8px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; text-transform:uppercase; }
.core-inbox__filters button.active { border-color:var(--cue-accent); color:var(--cue-accent); }
.core-inbox__layout { display:grid; grid-template-columns:minmax(260px,.75fr) minmax(0,1.65fr); }
''', 'filter css')
inbox_path.write_text(inbox)

workspace_path = Path('app/pages/workspace.vue')
text = workspace_path.read_text()
text = replace_once(text, 'const bookingCoreOperationsRevision = ref(0)\n', "const bookingCoreOperationsRevision = ref(0)\nconst realBookingFocusId = ref('')\n", 'focus state')
text = replace_once(text,
'''async function loadRealBookings() {
  if (!bookingCoreWorkspaceId.value) { realBookings.value = []; return }
  realBookings.value = await bookingCore.listBookings(bookingCoreWorkspaceId.value)
}

async function loadRealHolds() {
  if (!bookingCoreWorkspaceId.value) { realHolds.value = []; return }
  realHolds.value = await bookingCore.listHolds(bookingCoreWorkspaceId.value, undefined, true)
}
''',
'''async function loadRealBookings() {
  if (!bookingCoreWorkspaceId.value || !selectedArtistId.value) { realBookings.value = []; return }
  realBookings.value = await bookingCore.listBookings(bookingCoreWorkspaceId.value, 100, selectedArtistId.value)
}

async function loadRealHolds() {
  if (!bookingCoreWorkspaceId.value || !realBookings.value.length) { realHolds.value = []; return }
  const bookingIds = new Set(realBookings.value.map(item => item.id))
  const rows = await bookingCore.listHolds(bookingCoreWorkspaceId.value, undefined, true)
  realHolds.value = rows.filter(hold => bookingIds.has(hold.booking_id))
}
''', 'real loaders')
text = text.replace('    await Promise.all([loadRealBookings(), loadRealHolds()])', '    await loadRealBookings()\n    await loadRealHolds()', 1)
text = text.replace('  await loadRealBookings()\n  bookingCoreOperationsRevision.value += 1', '  await loadRealBookings()\n  await loadRealHolds()\n  bookingCoreOperationsRevision.value += 1', 1)
text = text.replace('  await Promise.all([loadRealBookings(), loadRealHolds()])', '  await loadRealBookings()\n  await loadRealHolds()', 1)
ops = '''async function handleBookingCoreOperationsChanged() {
  bookingCoreOperationsRevision.value += 1
  await loadRealBookings()
  await loadRealHolds()
}
'''
if 'function openRealBooking(bookingId: string)' not in text:
    if ops not in text: raise SystemExit('operations handler missing')
    text = text.replace(ops, ops + '''
function openRealBooking(bookingId: string) {
  realBookingFocusId.value = bookingId
  activeView.value = 'bookings'
}
''', 1)
text = replace_once(text,
'''          :bookings="realBookings"
          :locale="preferences.locale.value"
          @operations-changed="handleBookingCoreOperationsChanged"
''',
'''          :bookings="realBookings"
          :locale="preferences.locale.value"
          :focus-booking-id="realBookingFocusId"
          @operations-changed="handleBookingCoreOperationsChanged"
''', 'inbox binding')
history_anchor = '''        </div>
        <div v-if="historyItems.length" class="history-tools">'''
if '<BookingCoreHistory' not in text:
    if history_anchor not in text: raise SystemExit('history anchor missing')
    text = text.replace(history_anchor, '''        </div>
        <BookingCoreHistory
          v-if="bookingCoreWorkspaceId"
          :workspace-id="bookingCoreWorkspaceId"
          :bookings="realBookings"
          :locale="preferences.locale.value"
          :refresh-key="bookingCoreOperationsRevision"
          @open-booking="openRealBooking"
        />
        <div v-if="historyItems.length" class="history-tools">''', 1)
text = text.replace("@click.stop=\"activeView = 'bookings'\">\n                <strong>{{ coreHoldLabel(hold) }}", "@click.stop=\"openRealBooking(hold.booking_id)\">\n                <strong>{{ coreHoldLabel(hold) }}", 1)
text = text.replace("@click.stop=\"activeView = 'bookings'\">\n                <strong>{{ coreBookingLabel(booking) }}", "@click.stop=\"openRealBooking(booking.id)\">\n                <strong>{{ coreBookingLabel(booking) }}", 1)
workspace_path.write_text(text)
