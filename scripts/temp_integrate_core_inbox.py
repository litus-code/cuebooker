from pathlib import Path

path = Path('app/pages/workspace.vue')
text = path.read_text()

old_import = "import type { FeeBasis } from '../composables/useArtistProfile'\n"
new_import = old_import + "import type { CoreBooking } from '../domain/bookingCore'\n"
if "import type { CoreBooking } from '../domain/bookingCore'" not in text:
    if old_import not in text:
        raise SystemExit('FeeBasis import anchor not found')
    text = text.replace(old_import, new_import, 1)

old_type = "const realBookings = ref<any[]>([])"
new_type = "const realBookings = ref<CoreBooking[]>([])"
if old_type in text:
    text = text.replace(old_type, new_type, 1)
elif new_type not in text:
    raise SystemExit('realBookings anchor not found')

anchor = '''        <p v-if="cueMessage" class="cue-entry-message">{{ cueMessage }}</p>\n\n        <aside id="sample-mode"'''
insertion = '''        <p v-if="cueMessage" class="cue-entry-message">{{ cueMessage }}</p>\n\n        <BookingCoreInbox\n          v-if="bookingCoreWorkspaceId && realBookings.length"\n          :workspace-id="bookingCoreWorkspaceId"\n          :bookings="realBookings"\n          :locale="preferences.locale.value"\n        />\n\n        <aside id="sample-mode"'''
if '<BookingCoreInbox' not in text:
    if anchor not in text:
        raise SystemExit('CUE message/sample anchor not found')
    text = text.replace(anchor, insertion, 1)

path.write_text(text)
