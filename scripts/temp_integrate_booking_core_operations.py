from pathlib import Path

path = Path('app/pages/workspace.vue')
text = path.read_text()

state_anchor = "const cueMessage = ref('')\n"
state_insert = state_anchor + "const bookingCoreOperationsRevision = ref(0)\n"
if "bookingCoreOperationsRevision" not in text:
    if state_anchor not in text:
        raise SystemExit('state anchor not found')
    text = text.replace(state_anchor, state_insert, 1)

cue_anchor = "  await loadRealBookings()\n  window.setTimeout(() => { cueMessage.value = '' }, 4500)\n}\n"
cue_insert = "  await loadRealBookings()\n  bookingCoreOperationsRevision.value += 1\n  window.setTimeout(() => { cueMessage.value = '' }, 4500)\n}\n\nfunction handleBookingCoreOperationsChanged() {\n  bookingCoreOperationsRevision.value += 1\n}\n"
if "function handleBookingCoreOperationsChanged" not in text:
    if cue_anchor not in text:
        raise SystemExit('cue handler anchor not found')
    text = text.replace(cue_anchor, cue_insert, 1)

summary_anchor = '''        </div>\n\n        <div class="overview-grid">'''
summary_insert = '''        </div>\n\n        <BookingCoreAttention\n          v-if="bookingCoreWorkspaceId"\n          :workspace-id="bookingCoreWorkspaceId"\n          :bookings="realBookings"\n          :locale="preferences.locale.value"\n          :refresh-key="bookingCoreOperationsRevision"\n          @changed="handleBookingCoreOperationsChanged"\n        />\n\n        <div class="overview-grid">'''
if '<BookingCoreAttention' not in text:
    if summary_anchor not in text:
        raise SystemExit('overview anchor not found')
    text = text.replace(summary_anchor, summary_insert, 1)

inbox_anchor = '''          :bookings="realBookings"\n          :locale="preferences.locale.value"\n        />'''
inbox_insert = '''          :bookings="realBookings"\n          :locale="preferences.locale.value"\n          @operations-changed="handleBookingCoreOperationsChanged"\n        />'''
if '@operations-changed="handleBookingCoreOperationsChanged"' not in text:
    if inbox_anchor not in text:
        raise SystemExit('inbox anchor not found')
    text = text.replace(inbox_anchor, inbox_insert, 1)

path.write_text(text)
