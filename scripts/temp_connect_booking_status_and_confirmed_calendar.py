from pathlib import Path

# --- bookingCoreApi.ts ---
api_path = Path('app/services/bookingCoreApi.ts')
api = api_path.read_text()
api = api.replace("  CoreBooking,\n", "  CoreBooking,\n  CoreBookingStatus,\n", 1)

anchor = """  async function listActivities(workspaceId: string, bookingId: string, limit = 100) {"""
fn = """  async function setBookingStatus(workspaceId: string, bookingId: string, status: CoreBookingStatus) {\n    const rows = await $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/rpc/set_booking_status`, {\n      method: 'POST',\n      headers: authHeaders(),\n      body: {\n        target_workspace_id: workspaceId,\n        target_booking_id: bookingId,\n        target_status: status\n      }\n    })\n    const row = rows[0]\n    if (!row) throw new Error('booking_status_update_failed')\n    return row\n  }\n\n"""
if "async function setBookingStatus" not in api:
    if anchor not in api: raise SystemExit('api activity anchor missing')
    api = api.replace(anchor, fn + anchor, 1)

ret_anchor = """    createManualBooking,\n    listActivities,"""
ret_new = """    createManualBooking,\n    setBookingStatus,\n    listActivities,"""
if "    setBookingStatus,\n" not in api:
    if ret_anchor not in api: raise SystemExit('api return anchor missing')
    api = api.replace(ret_anchor, ret_new, 1)
api_path.write_text(api)

# --- BookingCoreInbox.vue ---
inbox_path = Path('app/components/BookingCoreInbox.vue')
inbox = inbox_path.read_text()
state_anchor = "const loadingActivity = ref(false)\n"
if "const updatingStatus = ref(false)" not in inbox:
    if state_anchor not in inbox: raise SystemExit('inbox state anchor missing')
    inbox = inbox.replace(state_anchor, state_anchor + "const updatingStatus = ref(false)\n", 1)

fn_anchor = """async function handleOperationsChanged() {\n  await loadActivity()\n  emit('operationsChanged')\n}\n"""
fn_new = fn_anchor + """\nasync function changeStatus(event: Event) {\n  if (!selectedBooking.value) return\n  const status = (event.target as HTMLSelectElement).value as CoreBookingStatus\n  if (status === selectedBooking.value.status) return\n  updatingStatus.value = true\n  try {\n    await bookingCore.setBookingStatus(props.workspaceId, selectedBooking.value.id, status)\n    await loadActivity()\n    emit('operationsChanged')\n  } catch (error: any) {\n    window.alert(error?.message === 'confirmed_booking_requires_date'\n      ? (props.locale === 'es' ? 'Para confirmar el booking primero necesitas una fecha.' : 'A booking needs a date before it can be confirmed.')\n      : (error?.message || 'Booking status could not be updated.'))\n  } finally {\n    updatingStatus.value = false\n  }\n}\n"""
if "async function changeStatus" not in inbox:
    if fn_anchor not in inbox: raise SystemExit('inbox operations handler missing')
    inbox = inbox.replace(fn_anchor, fn_new, 1)

old = """          <strong class=\"core-inbox__status\">{{ statusLabels[selectedBooking.status] }}</strong>"""
new = """          <label class=\"core-inbox__status core-inbox__status-control\"><span>{{ copy.status }}</span><select :value=\"selectedBooking.status\" :disabled=\"updatingStatus\" @change=\"changeStatus\"><option v-for=\"(label, status) in statusLabels\" :key=\"status\" :value=\"status\">{{ label }}</option></select></label>"""
if old not in inbox: raise SystemExit('inbox status template missing')
inbox = inbox.replace(old, new, 1)

css_anchor = ".core-inbox__status { align-self:flex-start; padding:7px 9px; border:1px solid var(--cue-border); font:700 9px monospace; text-transform:uppercase; }\n"
css_new = css_anchor + ".core-inbox__status-control { display:grid; gap:4px; padding:6px 8px; }\n.core-inbox__status-control > span { color:var(--cue-muted); font:700 7px monospace; letter-spacing:.08em; }\n.core-inbox__status-control select { border:0; outline:0; background:transparent; color:var(--cue-text); font:700 9px monospace; text-transform:uppercase; cursor:pointer; }\n"
if ".core-inbox__status-control {" not in inbox:
    if css_anchor not in inbox: raise SystemExit('inbox status css missing')
    inbox = inbox.replace(css_anchor, css_new, 1)
inbox_path.write_text(inbox)

# --- workspace.vue ---
path = Path('app/pages/workspace.vue')
text = path.read_text()

# Month projection includes confirmed real bookings.
old = """      blocks: blocks.value.filter(block => block.starts_at.slice(0, 10) === date),\n      holds: realHolds.value.filter(hold => hold.status === 'active' && hold.event_date === date)\n    }"""
new = """      blocks: blocks.value.filter(block => block.starts_at.slice(0, 10) === date),\n      holds: realHolds.value.filter(hold => hold.status === 'active' && hold.event_date === date),\n      confirmedBookings: realBookings.value.filter(booking => booking.status === 'confirmed' && booking.event_date === date)\n    }"""
if "confirmedBookings: realBookings.value.filter" not in text:
    if old not in text: raise SystemExit('workspace month projection anchor missing')
    text = text.replace(old, new, 1)

anchor = """const selectedDayDateOnlyCoreHolds = computed(() => selectedDayCoreHolds.value.filter(hold => !hold.starts_at || !hold.ends_at))\n"""
insert = anchor + """const selectedDayConfirmedBookings = computed(() => realBookings.value.filter(booking => booking.status === 'confirmed' && booking.event_date === selectedDate.value))\nconst selectedDayTimedConfirmedBookings = computed(() => selectedDayConfirmedBookings.value.filter(booking => booking.start_time && booking.end_time))\nconst selectedDayDateOnlyConfirmedBookings = computed(() => selectedDayConfirmedBookings.value.filter(booking => !booking.start_time || !booking.end_time))\n"""
if "selectedDayConfirmedBookings" not in text:
    if anchor not in text: raise SystemExit('confirmed computed anchor missing')
    text = text.replace(anchor, insert, 1)

text = text.replace("const confirmedCount = computed(() => blocks.value.filter(block => block.status === 'confirmed').length)", "const confirmedCount = computed(() => blocks.value.filter(block => block.status === 'confirmed').length + realBookings.value.filter(booking => booking.status === 'confirmed').length)", 1)
old_occ = "const occupiedDays = computed(() => new Set([...blocks.value.map(block => block.starts_at.slice(0, 10)), ...realHolds.value.filter(hold => hold.status === 'active').map(hold => hold.event_date)]).size)"
new_occ = "const occupiedDays = computed(() => new Set([...blocks.value.map(block => block.starts_at.slice(0, 10)), ...realHolds.value.filter(hold => hold.status === 'active').map(hold => hold.event_date), ...realBookings.value.filter(booking => booking.status === 'confirmed' && booking.event_date).map(booking => booking.event_date as string)]).size)"
if old_occ in text: text = text.replace(old_occ, new_occ, 1)

old_handler = """async function handleBookingCoreOperationsChanged() {\n  bookingCoreOperationsRevision.value += 1\n  await loadRealHolds()\n}\n"""
new_handler = """async function handleBookingCoreOperationsChanged() {\n  bookingCoreOperationsRevision.value += 1\n  await Promise.all([loadRealBookings(), loadRealHolds()])\n}\n"""
if old_handler in text: text = text.replace(old_handler, new_handler, 1)

anchor = """function coreHoldExpiry(hold: Hold) {\n  if (!hold.expires_at) return ''\n  return new Intl.DateTimeFormat(dateLocale.value, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(hold.expires_at))\n}\n"""
insert = anchor + """\nfunction coreBookingLabel(booking: CoreBooking) {\n  return booking.venue_name || booking.event_name || (preferences.locale.value === 'es' ? 'Booking confirmado' : 'Confirmed booking')\n}\n\nfunction coreBookingTimeStyle(booking: CoreBooking) {\n  if (!booking.start_time || !booking.end_time) return {}\n  const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5))\n  const start = toMinutes(booking.start_time)\n  const end = toMinutes(booking.end_time)\n  return { top: `${start * .8}px`, height: `${Math.max((end - start) * .8, 42)}px` }\n}\n"""
if "function coreBookingTimeStyle" not in text:
    if anchor not in text: raise SystemExit('core hold expiry anchor missing')
    text = text.replace(anchor, insert, 1)

old = """                <small v-if=\"cell.blocks.length || cell.holds.length\">{{ cell.blocks.length + cell.holds.length }}</small>\n                <span v-if=\"cell.blocks.length || cell.holds.length\" class=\"day-statuses\"><i v-for=\"block in cell.blocks.slice(0, 2)\" :key=\"block.id\" :class=\"`status-dot status-dot--${block.status}`\" /><i v-if=\"cell.holds.length\" class=\"status-dot status-dot--hold\" /></span>"""
new = """                <small v-if=\"cell.blocks.length || cell.holds.length || cell.confirmedBookings.length\">{{ cell.blocks.length + cell.holds.length + cell.confirmedBookings.length }}</small>\n                <span v-if=\"cell.blocks.length || cell.holds.length || cell.confirmedBookings.length\" class=\"day-statuses\"><i v-for=\"block in cell.blocks.slice(0, 1)\" :key=\"block.id\" :class=\"`status-dot status-dot--${block.status}`\" /><i v-if=\"cell.holds.length\" class=\"status-dot status-dot--hold\" /><i v-if=\"cell.confirmedBookings.length\" class=\"status-dot status-dot--confirmed\" /></span>"""
if old not in text: raise SystemExit('month count template missing')
text = text.replace(old, new, 1)

anchor = """            <div v-if=\"selectedDayDateOnlyCoreHolds.length\" class=\"core-calendar-holds\">"""
replacement = """            <div v-if=\"selectedDayDateOnlyCoreHolds.length || selectedDayDateOnlyConfirmedBookings.length\" class=\"core-calendar-holds\">\n              <article v-for=\"booking in selectedDayDateOnlyConfirmedBookings\" :key=\"`confirmed-${booking.id}`\" class=\"core-calendar-confirmed\">\n                <i class=\"status-dot status-dot--confirmed\" />\n                <div><strong>{{ coreBookingLabel(booking) }}</strong><span>{{ preferences.locale.value === 'es' ? 'Confirmado · horario pendiente' : 'Confirmed · schedule pending' }}</span></div>\n              </article>"""
if anchor in text:
    text = text.replace(anchor, replacement, 1)

anchor = """              <button v-for=\"hold in selectedDayTimedCoreHolds\" :key=\"`core-hold-${hold.id}`\" class=\"timeline-block timeline-block--hold core-timeline-hold\" :style=\"coreHoldStyle(hold)\" type=\"button\" @click.stop=\"activeView = 'bookings'\">\n                <strong>{{ coreHoldLabel(hold) }}</strong><span>{{ hold.starts_at ? new Date(hold.starts_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) : '' }}–{{ hold.ends_at ? new Date(hold.ends_at).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' }) : '' }}</span>\n              </button>"""
insert = anchor + """\n              <button v-for=\"booking in selectedDayTimedConfirmedBookings\" :key=\"`core-confirmed-${booking.id}`\" class=\"timeline-block timeline-block--confirmed core-timeline-confirmed\" :style=\"coreBookingTimeStyle(booking)\" type=\"button\" @click.stop=\"activeView = 'bookings'\">\n                <strong>{{ coreBookingLabel(booking) }}</strong><span>{{ booking.start_time?.slice(0, 5) }}–{{ booking.end_time?.slice(0, 5) }}</span>\n              </button>"""
if "core-timeline-confirmed" not in text:
    if anchor not in text: raise SystemExit('timed hold template missing')
    text = text.replace(anchor, insert, 1)

style_anchor = ".core-timeline-hold { z-index:3; border-style:dashed !important; }\n"
if ".core-timeline-confirmed {" not in text:
    if style_anchor not in text: raise SystemExit('calendar hold style anchor missing')
    text = text.replace(style_anchor, style_anchor + ".core-calendar-confirmed { border-style:solid !important; }\n.core-timeline-confirmed { z-index:4; }\n", 1)

path.write_text(text)
