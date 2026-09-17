from pathlib import Path

workspace = Path('app/pages/workspace.vue')
text = workspace.read_text()
text = text.replace("const showSampleMode = ref(false)", "const showSampleMode = ref(route.query.demo === '1')", 1)

old_demo = '''        <aside v-if="!showSampleMode" class="demo-launch">
          <div><span>{{ preferences.locale.value === 'es' ? 'DEMO / OPCIONAL' : 'DEMO / OPTIONAL' }}</span><strong>{{ preferences.locale.value === 'es' ? '¿Quieres explorar con datos simulados?' : 'Want to explore with sample data?' }}</strong></div>
          <button type="button" @click="showSampleMode = true">{{ preferences.locale.value === 'es' ? 'Abrir demo' : 'Open demo' }}</button>
        </aside>

'''
if old_demo in text:
    text = text.replace(old_demo, '', 1)

old_inbox = '''          :focus-booking-id="realBookingFocusId"
          @operations-changed="handleBookingCoreOperationsChanged"
        />'''
new_inbox = '''          :focus-booking-id="realBookingFocusId"
          @operations-changed="handleBookingCoreOperationsChanged"
          @cue-requested="cueOpen = true"
        />'''
if '@cue-requested="cueOpen = true"' not in text:
    if old_inbox not in text:
        raise SystemExit('workspace inbox anchor not found')
    text = text.replace(old_inbox, new_inbox, 1)
workspace.write_text(text)

inbox = Path('app/components/BookingCoreInbox.vue')
content = inbox.read_text()
content = content.replace("const emit = defineEmits<{ operationsChanged: [] }>()", "const emit = defineEmits<{ operationsChanged: []; cueRequested: [] }>()", 1)
content = content.replace("  empty: 'Todavía no hay bookings reales.',", "  empty: 'Todavía no hay bookings reales.', emptyTitle: 'Tu primer booking empieza con un CUE.', emptyBody: 'Si te llaman, te escriben o aparece una oportunidad, guárdala en segundos. No necesitas tener todos los datos.', emptyAction: '+ CUE',", 1)
content = content.replace("  empty: 'No real bookings yet.',", "  empty: 'No real bookings yet.', emptyTitle: 'Your first booking starts with a CUE.', emptyBody: 'If someone calls, messages you or an opportunity appears, save it in seconds. You do not need every detail yet.', emptyAction: '+ CUE',", 1)
old_empty = '''    <p v-if="!bookings.length" class="core-inbox__empty">{{ copy.empty }}</p>'''
new_empty = '''    <div v-if="!bookings.length" class="core-inbox__zero">
      <span>{{ copy.empty }}</span>
      <strong>{{ copy.emptyTitle }}</strong>
      <p>{{ copy.emptyBody }}</p>
      <button type="button" @click="emit('cueRequested')">{{ copy.emptyAction }}</button>
    </div>'''
if old_empty not in content:
    raise SystemExit('inbox empty anchor not found')
content = content.replace(old_empty, new_empty, 1)
css_anchor = ".core-inbox__empty { margin:0; padding:18px; color:var(--cue-muted); font-size:12px; }"
css = '''.core-inbox__zero { display:grid; justify-items:start; gap:8px; padding:clamp(24px,5vw,48px); }
.core-inbox__zero > span { color:var(--cue-accent); font:700 9px monospace; letter-spacing:.09em; text-transform:uppercase; }
.core-inbox__zero > strong { max-width:520px; font-size:clamp(22px,3vw,38px); line-height:1; text-transform:uppercase; }
.core-inbox__zero > p { max-width:560px; margin:0; color:var(--cue-muted); font-size:12px; line-height:1.5; }
.core-inbox__zero > button { min-height:40px; margin-top:6px; padding:0 16px; border:1px solid var(--cue-accent); background:var(--cue-accent); color:#090909; cursor:pointer; font:800 10px monospace; }
'''
if '.core-inbox__zero {' not in content:
    if css_anchor not in content:
        raise SystemExit('inbox css anchor not found')
    content = content.replace(css_anchor, css + css_anchor, 1)
inbox.write_text(content)
