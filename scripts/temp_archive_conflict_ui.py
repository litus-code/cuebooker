from pathlib import Path


def once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        return text
    if old not in text:
        raise SystemExit(f'{label} anchor missing')
    return text.replace(old, new, 1)

# API
api_path = Path('app/services/bookingCoreApi.ts')
api = api_path.read_text()
api = once(api,
'''  async function listActivities(workspaceId: string, bookingId: string, limit = 100) {''',
'''  async function setBookingArchived(workspaceId: string, bookingId: string, archived: boolean) {
    const rows = await $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/rpc/set_booking_archived`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        target_workspace_id: workspaceId,
        target_booking_id: bookingId,
        target_archived: archived
      }
    })
    const row = rows[0]
    if (!row) throw new Error('booking_archive_update_failed')
    return row
  }

  async function listActivities(workspaceId: string, bookingId: string, limit = 100) {''', 'archive API')
api = once(api,
'''    setBookingStatus,
    listActivities,''',
'''    setBookingStatus,
    setBookingArchived,
    listActivities,''', 'archive API return')
api_path.write_text(api)

# Inbox
path = Path('app/components/BookingCoreInbox.vue')
text = path.read_text()
text = once(text,
'''const updatingStatus = ref(false)
const realSearch = ref('')''',
'''const updatingStatus = ref(false)
const archiving = ref(false)
const archiveView = ref<'active' | 'archived'>('active')
const realSearch = ref('')''', 'inbox archive state')

# Add labels to the exact current copy blocks. Keep this idempotent.
if "active: 'Activos'" not in text:
    old_es = "  noDate: 'Sin fecha', noVenue: 'Sin sala definida', noContact: 'Sin contacto', noOffer: 'Sin oferta'\n} : {"
    new_es = "  noDate: 'Sin fecha', noVenue: 'Sin sala definida', noContact: 'Sin contacto', noOffer: 'Sin oferta',\n  active: 'Activos', archived: 'Archivados', archive: 'Archivar', restore: 'Restaurar'\n} : {"
    if old_es not in text:
        raise SystemExit('exact ES copy block missing')
    text = text.replace(old_es, new_es, 1)
if "active: 'Active'" not in text:
    old_en = "  noDate: 'No date', noVenue: 'No venue defined', noContact: 'No contact', noOffer: 'No offer'\n})"
    new_en = "  noDate: 'No date', noVenue: 'No venue defined', noContact: 'No contact', noOffer: 'No offer',\n  active: 'Active', archived: 'Archived', archive: 'Archive', restore: 'Restore'\n})"
    if old_en not in text:
        raise SystemExit('exact EN copy block missing')
    text = text.replace(old_en, new_en, 1)

needle = '''  return props.bookings.filter(booking => {
    if (realStatusFilter.value !== 'all' && booking.status !== realStatusFilter.value) return false'''
replacement = '''  return props.bookings.filter(booking => {
    if (archiveView.value === 'active' && booking.archived_at) return false
    if (archiveView.value === 'archived' && !booking.archived_at) return false
    if (realStatusFilter.value !== 'all' && booking.status !== realStatusFilter.value) return false'''
text = once(text, needle, replacement, 'visible archive filter')

focus_old = '''    realSearch.value = ''
    realStatusFilter.value = 'all'
    selectedBookingId.value = value'''
focus_new = '''    realSearch.value = ''
    realStatusFilter.value = 'all'
    archiveView.value = props.bookings.find(item => item.id === value)?.archived_at ? 'archived' : 'active'
    selectedBookingId.value = value'''
text = once(text, focus_old, focus_new, 'focus archive view')

insert_before = '''function formatDate(value: string | null) {'''
archive_fn = '''async function toggleArchive() {
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

function formatDate(value: string | null) {'''
text = once(text, insert_before, archive_fn, 'archive action')

filters_old = '''      <div class="core-inbox__filters">
        <button type="button" :class="{ active: realStatusFilter === 'all' }" @click="realStatusFilter = 'all'">{{ locale === 'es' ? 'Todos' : 'All' }} · {{ bookings.length }}</button>'''
filters_new = '''      <div class="core-inbox__filters core-inbox__filters--archive">
        <button type="button" :class="{ active: archiveView === 'active' }" @click="archiveView = 'active'">{{ copy.active }} · {{ bookings.filter(item => !item.archived_at).length }}</button>
        <button type="button" :class="{ active: archiveView === 'archived' }" @click="archiveView = 'archived'">{{ copy.archived }} · {{ bookings.filter(item => !!item.archived_at).length }}</button>
      </div>
      <div class="core-inbox__filters">
        <button type="button" :class="{ active: realStatusFilter === 'all' }" @click="realStatusFilter = 'all'">{{ locale === 'es' ? 'Todos' : 'All' }} · {{ visibleBookings.length }}</button>'''
text = once(text, filters_old, filters_new, 'archive filter UI')

editor_anchor = '''            <BookingCoreEditor :workspace-id="workspaceId" :booking="selectedBooking" :locale="locale" @saved="handleBookingSaved" />'''
editor_new = '''            <BookingCoreEditor :workspace-id="workspaceId" :booking="selectedBooking" :locale="locale" @saved="handleBookingSaved" />
            <button class="core-inbox__archive" type="button" :disabled="archiving" @click="toggleArchive">{{ selectedBooking.archived_at ? copy.restore : copy.archive }}</button>'''
text = once(text, editor_anchor, editor_new, 'archive button')

facts_anchor = '''        </dl>

        <BookingCoreOperations'''
facts_new = '''        </dl>

        <BookingCoreConflictNotice
          :workspace-id="workspaceId"
          :booking="selectedBooking"
          :bookings="bookings"
          :locale="locale"
          :refresh-key="activities.length"
        />

        <BookingCoreOperations'''
text = once(text, facts_anchor, facts_new, 'conflict notice')

css_anchor = '''.core-inbox__status { align-self:flex-start; padding:7px 9px; border:1px solid var(--cue-border); font:700 9px monospace; text-transform:uppercase; }'''
css_new = '''.core-inbox__status { align-self:flex-start; padding:7px 9px; border:1px solid var(--cue-border); font:700 9px monospace; text-transform:uppercase; }
.core-inbox__archive { min-height:31px; padding:0 9px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.core-inbox__archive:hover { border-color:var(--cue-accent); color:var(--cue-text); }
.core-inbox__archive:disabled { opacity:.5; cursor:wait; }
.core-inbox__filters--archive { padding-bottom:2px; }'''
text = once(text, css_anchor, css_new, 'archive css')
path.write_text(text)

# Workspace: archived bookings are not active metrics/attention/calendar projections.
ws_path = Path('app/pages/workspace.vue')
ws = ws_path.read_text()
ws = ws.replace("{{ cueCoreLoading ? '…' : realBookings.length }}", "{{ cueCoreLoading ? '…' : realBookings.filter(item => !item.archived_at).length }}", 1)
ws = ws.replace(':bookings="realBookings"\n          :locale="preferences.locale.value"\n          :refresh-key="bookingCoreOperationsRevision"', ':bookings="realBookings.filter(item => !item.archived_at)"\n          :locale="preferences.locale.value"\n          :refresh-key="bookingCoreOperationsRevision"', 1)
ws = ws.replace("realBookings.value.filter(booking => booking.status === 'confirmed'", "realBookings.value.filter(booking => !booking.archived_at && booking.status === 'confirmed'")
ws = ws.replace("realBookings.value.filter(item => item.status === 'confirmed'", "realBookings.value.filter(item => !item.archived_at && item.status === 'confirmed'")
ws = ws.replace("realBookings.value.filter(booking => booking.event_date === selectedDate.value", "realBookings.value.filter(booking => !booking.archived_at && booking.event_date === selectedDate.value")
ws_path.write_text(ws)
