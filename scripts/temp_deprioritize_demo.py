from pathlib import Path

path = Path('app/pages/workspace.vue')
text = path.read_text()

def rep(old: str, new: str, label: str):
    global text
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'{label} anchor missing')
    text = text.replace(old, new, 1)

rep(
"const bookingCoreOperationsRevision = ref(0)\nconst realBookingFocusId = ref('')",
"const bookingCoreOperationsRevision = ref(0)\nconst realBookingFocusId = ref('')\nconst showSampleMode = ref(false)",
'demo state')

rep(
'''          <aside class="panel next-panel">
            <p class="eyebrow">{{ copy.sampleEyebrow }}</p>
            <h2>{{ copy.sampleTitle }}</h2>
            <p>{{ copy.sampleBody }}</p>
            <button type="button" @click="activeView = 'bookings'">{{ copy.openBookings }}</button>
          </aside>''',
'''          <aside class="panel next-panel">
            <p class="eyebrow">{{ cueEntryCopy.eyebrow }}</p>
            <h2>{{ preferences.locale.value === 'es' ? '¿HA PASADO ALGO?' : 'DID SOMETHING HAPPEN?' }}</h2>
            <p>{{ cueEntryCopy.body }}</p>
            <button type="button" :disabled="!bookingCoreWorkspaceId" @click="cueOpen = true">+ CUE</button>
          </aside>''',
'overview cue card')

rep(
'''        <BookingCoreInbox
          v-if="bookingCoreWorkspaceId && realBookings.length"''',
'''        <BookingCoreInbox
          v-if="bookingCoreWorkspaceId"''',
'real inbox empty state')

rep(
'''        <aside id="sample-mode" class="demo-notice" :class="{ 'tour-focus': tourStep === 0 }">''',
'''        <aside v-if="!showSampleMode" class="demo-launch">
          <div><span>{{ preferences.locale.value === 'es' ? 'DEMO / OPCIONAL' : 'DEMO / OPTIONAL' }}</span><strong>{{ preferences.locale.value === 'es' ? '¿Quieres explorar con datos simulados?' : 'Want to explore with sample data?' }}</strong></div>
          <button type="button" @click="showSampleMode = true">{{ preferences.locale.value === 'es' ? 'Abrir demo' : 'Open demo' }}</button>
        </aside>

        <aside v-if="showSampleMode" id="sample-mode" class="demo-notice" :class="{ 'tour-focus': tourStep === 0 }">''',
'demo launcher')

rep(
'''          <div class="demo-notice__actions"><button class="guide-action" type="button" @click="startTour">{{ copy.guidedTour }}</button><button v-if="demoActiveBookings.length" type="button" @click="clearSampleBookings">{{ copy.removeSamples }}</button><button v-else type="button" @click="restoreSampleBookings">{{ copy.restoreSamples }}</button></div>''',
'''          <div class="demo-notice__actions"><button class="guide-action" type="button" @click="startTour">{{ copy.guidedTour }}</button><button v-if="demoActiveBookings.length" type="button" @click="clearSampleBookings">{{ copy.removeSamples }}</button><button v-else type="button" @click="restoreSampleBookings">{{ copy.restoreSamples }}</button><button type="button" @click="showSampleMode = false">{{ preferences.locale.value === 'es' ? 'Cerrar demo' : 'Close demo' }}</button></div>''',
'close demo')

rep(
'''        <div class="booking-toolbar-row">''',
'''        <div v-if="showSampleMode" class="booking-toolbar-row">''',
'hide demo toolbar')
rep(
'''        <div class="booking-workspace demo-booking-workspace">''',
'''        <div v-if="showSampleMode" class="booking-workspace demo-booking-workspace">''',
'hide demo workspace')

rep(
'''        <div v-if="historyItems.length" class="history-tools">''',
'''        <div v-if="showSampleMode && historyItems.length" class="history-tools">''',
'hide demo history tools')
rep(
'''        <div v-if="paginatedHistoryItems.length" class="history-list">''',
'''        <div v-if="showSampleMode && paginatedHistoryItems.length" class="history-list">''',
'hide demo history list')
rep(
'''        <div v-if="filteredHistoryItems.length > historyPageSize" class="history-pagination" aria-label="Pagination">''',
'''        <div v-if="showSampleMode && filteredHistoryItems.length > historyPageSize" class="history-pagination" aria-label="Pagination">''',
'hide demo history pagination')
rep(
'''        <p v-if="!paginatedHistoryItems.length" class="workspace-empty">{{ copy.historyEmpty }}</p>''',
'''        <p v-if="showSampleMode && !paginatedHistoryItems.length" class="workspace-empty">{{ copy.historyEmpty }}</p>''',
'hide demo history empty')

css_anchor = '''.demo-notice { display: flex; justify-content: space-between; align-items: center; gap: 28px; padding: 20px 22px; border: 1px solid #665f18; background: #17170d; }'''
css_new = '''.demo-launch { display:flex; align-items:center; justify-content:space-between; gap:18px; margin:14px 0 18px; padding:12px 14px; border:1px dashed var(--cue-border); background:transparent; }
.demo-launch div { min-width:0; }
.demo-launch span { display:block; color:var(--cue-muted); font:700 8px monospace; letter-spacing:.1em; }
.demo-launch strong { display:block; margin-top:4px; color:var(--cue-muted); font-size:11px; }
.demo-launch button { flex:0 0 auto; min-height:34px; padding:0 11px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.demo-launch button:hover { border-color:var(--cue-accent); color:var(--cue-accent); }
.demo-notice { display: flex; justify-content: space-between; align-items: center; gap: 28px; padding: 20px 22px; border: 1px solid #665f18; background: #17170d; }'''
rep(css_anchor, css_new, 'demo launcher css')

mobile_anchor = '''@media (max-width: 760px) {'''
if mobile_anchor in text and '.demo-launch { align-items:stretch; flex-direction:column;' not in text:
    text = text.replace(mobile_anchor, mobile_anchor + "\n  .demo-launch { align-items:stretch; flex-direction:column; }\n  .demo-launch button { width:100%; }", 1)

path.write_text(text)
