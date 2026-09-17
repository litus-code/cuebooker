from pathlib import Path

path = Path('app/pages/workspace.vue')
text = path.read_text()

text = text.replace("import type { CoreBooking } from '../domain/bookingCore'", "import type { CoreBooking, Hold } from '../domain/bookingCore'", 1)

anchor = "const realBookings = ref<CoreBooking[]>([])\n"
if "const realHolds = ref<Hold[]>([])" not in text:
    if anchor not in text: raise SystemExit('real bookings state anchor missing')
    text = text.replace(anchor, anchor + "const realHolds = ref<Hold[]>([])\n", 1)

old = """      blocks: blocks.value.filter(block => block.starts_at.slice(0, 10) === date)\n    }"""
new = """      blocks: blocks.value.filter(block => block.starts_at.slice(0, 10) === date),\n      holds: realHolds.value.filter(hold => hold.status === 'active' && hold.event_date === date)\n    }"""
if "holds: realHolds.value.filter" not in text:
    if old not in text: raise SystemExit('month cell anchor missing')
    text = text.replace(old, new, 1)

anchor = """const dayBlocks = computed(() => blocks.value\n  .filter(block => block.starts_at.slice(0, 10) === selectedDate.value)\n  .sort((a, b) => a.starts_at.localeCompare(b.starts_at)))\n"""
insert = anchor + """const selectedDayCoreHolds = computed(() => realHolds.value\n  .filter(hold => hold.status === 'active' && hold.event_date === selectedDate.value)\n  .sort((a, b) => (a.starts_at || a.event_date).localeCompare(b.starts_at || b.event_date)))\nconst selectedDayTimedCoreHolds = computed(() => selectedDayCoreHolds.value.filter(hold => hold.starts_at && hold.ends_at))\nconst selectedDayDateOnlyCoreHolds = computed(() => selectedDayCoreHolds.value.filter(hold => !hold.starts_at || !hold.ends_at))\n"""
if "selectedDayCoreHolds" not in text:
    if anchor not in text: raise SystemExit('day blocks anchor missing')
    text = text.replace(anchor, insert, 1)

text = text.replace("const holdCount = computed(() => blocks.value.filter(block => block.status === 'hold').length)", "const holdCount = computed(() => blocks.value.filter(block => block.status === 'hold').length + realHolds.value.filter(hold => hold.status === 'active').length)", 1)
text = text.replace("const occupiedDays = computed(() => new Set(blocks.value.map(block => block.starts_at.slice(0, 10))).size)", "const occupiedDays = computed(() => new Set([...blocks.value.map(block => block.starts_at.slice(0, 10)), ...realHolds.value.filter(hold => hold.status === 'active').map(hold => hold.event_date)]).size)", 1)

anchor = """async function loadRealBookings() {\n  if (!bookingCoreWorkspaceId.value) { realBookings.value = []; return }\n  realBookings.value = await bookingCore.listBookings(bookingCoreWorkspaceId.value)\n}\n"""
insert = anchor + """\nasync function loadRealHolds() {\n  if (!bookingCoreWorkspaceId.value) { realHolds.value = []; return }\n  realHolds.value = await bookingCore.listHolds(bookingCoreWorkspaceId.value, undefined, true)\n}\n"""
if "async function loadRealHolds" not in text:
    if anchor not in text: raise SystemExit('load bookings anchor missing')
    text = text.replace(anchor, insert, 1)

text = text.replace("    await loadRealBookings()\n  } catch (error: any) {", "    await Promise.all([loadRealBookings(), loadRealHolds()])\n  } catch (error: any) {", 1)
text = text.replace("    realBookings.value = []\n    console.warn('[booking-core]", "    realBookings.value = []\n    realHolds.value = []\n    console.warn('[booking-core]", 1)

old = """function handleBookingCoreOperationsChanged() {\n  bookingCoreOperationsRevision.value += 1\n}\n"""
new = """async function handleBookingCoreOperationsChanged() {\n  bookingCoreOperationsRevision.value += 1\n  await loadRealHolds()\n}\n"""
if old in text:
    text = text.replace(old, new, 1)

anchor = """function blockStyle(block: AvailabilityBlock) {\n  const start = Number(block.starts_at.slice(11, 13)) * 60 + Number(block.starts_at.slice(14, 16))\n  const end = Number(block.ends_at.slice(11, 13)) * 60 + Number(block.ends_at.slice(14, 16))\n  return { top: `${start * .8}px`, height: `${Math.max((end - start) * .8, 42)}px` }\n}\n"""
insert = anchor + """\nfunction coreHoldStyle(hold: Hold) {\n  if (!hold.starts_at || !hold.ends_at) return {}\n  const startDate = new Date(hold.starts_at)\n  const endDate = new Date(hold.ends_at)\n  const start = startDate.getHours() * 60 + startDate.getMinutes()\n  const end = endDate.getHours() * 60 + endDate.getMinutes()\n  return { top: `${start * .8}px`, height: `${Math.max((end - start) * .8, 42)}px` }\n}\n\nfunction coreHoldLabel(hold: Hold) {\n  const booking = realBookings.value.find(item => item.id === hold.booking_id)\n  return booking?.venue_name || booking?.event_name || (preferences.locale.value === 'es' ? 'Hold de booking' : 'Booking hold')\n}\n\nfunction coreHoldExpiry(hold: Hold) {\n  if (!hold.expires_at) return ''\n  return new Intl.DateTimeFormat(dateLocale.value, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(hold.expires_at))\n}\n"""
if "function coreHoldStyle" not in text:
    if anchor not in text: raise SystemExit('block style anchor missing')
    text = text.replace(anchor, insert, 1)

old = """                <small v-if=\"cell.blocks.length\">{{ cell.blocks.length }}</small>\n                <span v-if=\"cell.blocks.length\" class=\"day-statuses\"><i v-for=\"block in cell.blocks.slice(0, 3)\" :key=\"block.id\" :class=\"`status-dot status-dot--${block.status}`\" /></span>"""
new = """                <small v-if=\"cell.blocks.length || cell.holds.length\">{{ cell.blocks.length + cell.holds.length }}</small>\n                <span v-if=\"cell.blocks.length || cell.holds.length\" class=\"day-statuses\"><i v-for=\"block in cell.blocks.slice(0, 2)\" :key=\"block.id\" :class=\"`status-dot status-dot--${block.status}`\" /><i v-if=\"cell.holds.length\" class=\"status-dot status-dot--hold\" /></span>"""
if old not in text: raise SystemExit('month template anchor missing')
text = text.replace(old, new, 1)

anchor = """            <div class=\"timeline\" :aria-label=\"copy.selectedDaySchedule\">"""
insert = """            <div v-if=\"selectedDayDateOnlyCoreHolds.length\" class=\"core-calendar-holds\">\n              <article v-for=\"hold in selectedDayDateOnlyCoreHolds\" :key=\"hold.id\">\n                <i class=\"status-dot status-dot--hold\" />\n                <div><strong>{{ coreHoldLabel(hold) }}</strong><span>Hold · {{ hold.priority ? `P${hold.priority}` : (preferences.locale.value === 'es' ? 'Sin prioridad' : 'No priority') }}<template v-if=\"hold.expires_at\"> · {{ preferences.locale.value === 'es' ? 'Caduca' : 'Expires' }} {{ coreHoldExpiry(hold) }}</template></span></div>\n              </article>\n            </div>\n            <div class=\"timeline\" :aria-label=\"copy.selectedDaySchedule\">"""
if "class=\"core-calendar-holds\"" not in text:
    if anchor not in text: raise SystemExit('timeline anchor missing')
    text = text.replace(anchor, insert, 1)

anchor = """              <button v-for=\"block in dayBlocks\" :key=\"block.id\" class=\"timeline-block\" :class=\"`timeline-block--${block.status}`\" :style=\"blockStyle(block)\" type=\"button\" @click.stop=\"openCalendarBlock(block)\">\n                <strong>{{ block.label || statusLabel(block.status) }}</strong><span>{{ time(block.starts_at) }}–{{ time(block.ends_at) }}</span>\n              </button>"""
insert = anchor + """\n              <button v-for=\"hold in selectedDayTimedCoreHolds\" :key=\"`core-hold-${hold.id}`\" class=\"timeline-block timeline-block--hold core-timeline-hold\" :style=\"coreHoldStyle(hold)\" type=\"button\" @click.stop=\"activeView = 'bookings'\">\n                <strong>{{ coreHoldLabel(hold) }}</strong><span>{{ hold.starts_at ? new Date(hold.starts_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) : '' }}–{{ hold.ends_at ? new Date(hold.ends_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) : '' }}</span>\n              </button>"""
if "core-timeline-hold" not in text:
    if anchor not in text: raise SystemExit('day block template anchor missing')
    text = text.replace(anchor, insert, 1)

style_anchor = "</style>"
styles = """\n.core-calendar-holds { display:grid; gap:7px; padding:10px 12px; border-bottom:1px solid var(--cue-border); background:color-mix(in srgb, var(--cue-accent) 4%, var(--cue-surface)); }\n.core-calendar-holds article { display:flex; align-items:flex-start; gap:9px; padding:9px 10px; border:1px solid color-mix(in srgb, var(--cue-accent) 32%, var(--cue-border)); }\n.core-calendar-holds article > i { flex:0 0 auto; margin-top:4px; }\n.core-calendar-holds strong, .core-calendar-holds span { display:block; }\n.core-calendar-holds strong { font-size:11px; }\n.core-calendar-holds span { margin-top:3px; color:var(--cue-muted); font-size:9px; }\n.core-timeline-hold { z-index:3; border-style:dashed !important; }\n"""
if ".core-calendar-holds {" not in text:
    if style_anchor not in text: raise SystemExit('style close missing')
    text = text.replace(style_anchor, styles + style_anchor, 1)

path.write_text(text)
