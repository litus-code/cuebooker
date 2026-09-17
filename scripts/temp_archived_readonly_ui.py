from pathlib import Path

path = Path('app/components/BookingCoreInbox.vue')
text = path.read_text()

def rep(old, new, label):
    global text
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'{label} anchor missing')
    text = text.replace(old, new, 1)

rep(
"  active: 'Activos', archived: 'Archivados', archive: 'Archivar', restore: 'Restaurar'",
"  active: 'Activos', archived: 'Archivados', archive: 'Archivar', restore: 'Restaurar', archivedReadOnly: 'Booking archivado. La traza se conserva en modo lectura.'",
'es readonly copy')
rep(
"  active: 'Active', archived: 'Archived', archive: 'Archive', restore: 'Restore'",
"  active: 'Active', archived: 'Archived', archive: 'Archive', restore: 'Restore', archivedReadOnly: 'Archived booking. Its trace is preserved in read-only mode.'",
'en readonly copy')
rep(
"const selectedBooking = computed(() => props.bookings.find(item => item.id === selectedBookingId.value) || visibleBookings.value[0] || props.bookings[0] || null)",
"const selectedBooking = computed(() => visibleBookings.value.find(item => item.id === selectedBookingId.value) || visibleBookings.value[0] || null)",
'selected visible booking')
rep(
'''            <BookingCoreEditor :workspace-id="workspaceId" :booking="selectedBooking" :locale="locale" @saved="handleBookingSaved" />
            <button class="core-inbox__archive" type="button" :disabled="archiving" @click="toggleArchive">{{ selectedBooking.archived_at ? copy.restore : copy.archive }}</button>
            <label class="core-inbox__status core-inbox__status-control"><span>{{ copy.status }}</span><select :value="selectedBooking.status" :disabled="updatingStatus" @change="changeStatus"><option v-for="(label, status) in statusLabels" :key="status" :value="status">{{ label }}</option></select></label>''',
'''            <BookingCoreEditor v-if="!selectedBooking.archived_at" :workspace-id="workspaceId" :booking="selectedBooking" :locale="locale" @saved="handleBookingSaved" />
            <button class="core-inbox__archive" type="button" :disabled="archiving" @click="toggleArchive">{{ selectedBooking.archived_at ? copy.restore : copy.archive }}</button>
            <label v-if="!selectedBooking.archived_at" class="core-inbox__status core-inbox__status-control"><span>{{ copy.status }}</span><select :value="selectedBooking.status" :disabled="updatingStatus" @change="changeStatus"><option v-for="(label, status) in statusLabels" :key="status" :value="status">{{ label }}</option></select></label>''',
'archived header actions')
rep(
'''        <BookingCoreConflictNotice
          :workspace-id="workspaceId"''',
'''        <p v-if="selectedBooking.archived_at" class="core-inbox__readonly">{{ copy.archivedReadOnly }}</p>

        <BookingCoreConflictNotice
          v-if="!selectedBooking.archived_at"
          :workspace-id="workspaceId"''',
'archived read only notice')
rep(
'''        <BookingCoreOperations
          :workspace-id="workspaceId"''',
'''        <BookingCoreOperations
          v-if="!selectedBooking.archived_at"
          :workspace-id="workspaceId"''',
'hide archived operations')
rep(
'''        <BookingActivityComposer
          :workspace-id="workspaceId"''',
'''        <BookingActivityComposer
          v-if="!selectedBooking.archived_at"
          :workspace-id="workspaceId"''',
'hide archived composer')
rep(
'''.core-inbox__archive:disabled { opacity:.5; cursor:wait; }
.core-inbox__filters--archive { padding-bottom:2px; }''',
'''.core-inbox__archive:disabled { opacity:.5; cursor:wait; }
.core-inbox__readonly { margin:14px 0 0; padding:10px 12px; border:1px solid var(--cue-border); background:var(--cue-raised); color:var(--cue-muted); font-size:11px; line-height:1.45; }
.core-inbox__filters--archive { padding-bottom:2px; }''',
'archived readonly css')

path.write_text(text)
