from pathlib import Path

# API
api_path = Path('app/services/bookingCoreApi.ts')
api = api_path.read_text()
api = api.replace("  SetNextMoveInput,\n", "  SetNextMoveInput,\n  UpdateBookingDetailsInput,\n", 1)

anchor = """  async function setBookingStatus(workspaceId: string, bookingId: string, status: CoreBookingStatus) {"""
fn = """  async function updateBookingDetails(input: UpdateBookingDetailsInput) {\n    if (input.offerAmountMinor != null && (!Number.isSafeInteger(input.offerAmountMinor) || input.offerAmountMinor < 0)) {\n      throw new Error('invalid_offer_amount_minor')\n    }\n\n    const rows = await $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/rpc/update_booking_details`, {\n      method: 'POST',\n      headers: authHeaders(),\n      body: {\n        target_workspace_id: input.workspaceId,\n        target_booking_id: input.bookingId,\n        next_event_name: normalizedText(input.eventName),\n        next_venue_name: normalizedText(input.venueName),\n        next_city: normalizedText(input.city),\n        next_country_code: countryCode(input.countryCode),\n        next_event_date: input.eventDate || null,\n        next_start_time: input.startTime || null,\n        next_end_time: input.endTime || null,\n        next_event_timezone: normalizedText(input.eventTimezone),\n        next_offer_amount_minor: input.offerAmountMinor ?? null,\n        next_currency: currency(input.currency),\n        next_fee_basis: normalizedText(input.feeBasis)\n      }\n    })\n    const row = rows[0]\n    if (!row) throw new Error('booking_details_update_failed')\n    return row\n  }\n\n"""
if "async function updateBookingDetails" not in api:
    if anchor not in api: raise SystemExit('setBookingStatus anchor missing')
    api = api.replace(anchor, fn + anchor, 1)

ret = """    createManualBooking,\n    setBookingStatus,"""
if "    updateBookingDetails,\n" not in api:
    if ret not in api: raise SystemExit('api return anchor missing')
    api = api.replace(ret, "    createManualBooking,\n    updateBookingDetails,\n    setBookingStatus,", 1)
api_path.write_text(api)

# Inbox
path = Path('app/components/BookingCoreInbox.vue')
text = path.read_text()

handler_anchor = """async function handleOperationsChanged() {\n  await loadActivity()\n  emit('operationsChanged')\n}\n"""
handler_insert = handler_anchor + """\nasync function handleBookingSaved() {\n  await loadActivity()\n  emit('operationsChanged')\n}\n\nasync function handleActivityCreated() {\n  await loadActivity()\n}\n"""
if "async function handleBookingSaved" not in text:
    if handler_anchor not in text: raise SystemExit('handler anchor missing')
    text = text.replace(handler_anchor, handler_insert, 1)

header_anchor = """          <label class=\"core-inbox__status core-inbox__status-control\"><span>{{ copy.status }}</span><select :value=\"selectedBooking.status\" :disabled=\"updatingStatus\" @change=\"changeStatus\"><option v-for=\"(label, status) in statusLabels\" :key=\"status\" :value=\"status\">{{ label }}</option></select></label>"""
header_new = """          <div class=\"core-inbox__header-actions\">\n            <BookingCoreEditor :workspace-id=\"workspaceId\" :booking=\"selectedBooking\" :locale=\"locale\" @saved=\"handleBookingSaved\" />\n            <label class=\"core-inbox__status core-inbox__status-control\"><span>{{ copy.status }}</span><select :value=\"selectedBooking.status\" :disabled=\"updatingStatus\" @change=\"changeStatus\"><option v-for=\"(label, status) in statusLabels\" :key=\"status\" :value=\"status\">{{ label }}</option></select></label>\n          </div>"""
if "class=\"core-inbox__header-actions\"" not in text:
    if header_anchor not in text: raise SystemExit('header status anchor missing')
    text = text.replace(header_anchor, header_new, 1)

activity_anchor = """        <section class=\"core-inbox__activity\">"""
activity_new = """        <BookingActivityComposer\n          :workspace-id=\"workspaceId\"\n          :booking=\"selectedBooking\"\n          :locale=\"locale\"\n          @created=\"handleActivityCreated\"\n        />\n\n        <section class=\"core-inbox__activity\">"""
if "<BookingActivityComposer" not in text:
    if activity_anchor not in text: raise SystemExit('activity section anchor missing')
    text = text.replace(activity_anchor, activity_new, 1)

css_anchor = ".core-inbox__status { align-self:flex-start; padding:7px 9px; border:1px solid var(--cue-border); font:700 9px monospace; text-transform:uppercase; }\n"
css = ".core-inbox__header-actions { display:flex; align-items:flex-start; gap:7px; flex-wrap:wrap; justify-content:flex-end; }\n"
if ".core-inbox__header-actions {" not in text:
    if css_anchor not in text: raise SystemExit('css anchor missing')
    text = text.replace(css_anchor, css + css_anchor, 1)

path.write_text(text)
