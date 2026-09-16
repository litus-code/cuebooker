from pathlib import Path

path = Path('app/pages/workspace.vue')
text = path.read_text()

def replace_once(old: str, new: str):
    global text
    if old not in text:
        raise SystemExit(f'Anchor not found: {old[:100]!r}')
    text = text.replace(old, new, 1)

replace_once(
    "const availability = useAvailability()\n",
    "const availability = useAvailability()\nconst bookingCore = useBookingCore()\n"
)

replace_once(
    "const selectedDemoBookingId = ref('')\n",
    "const selectedDemoBookingId = ref('')\nconst bookingCoreWorkspaceId = ref('')\nconst realBookings = ref<any[]>([])\nconst cueOpen = ref(false)\nconst cueCoreLoading = ref(false)\nconst cueMessage = ref('')\n"
)

replace_once(
    "const manageableAgency = computed(() => organizations.value.find(item => item.type === 'agency' && ['owner', 'admin'].includes(item.role)))\n",
    "const manageableAgency = computed(() => organizations.value.find(item => item.type === 'agency' && ['owner', 'admin'].includes(item.role)))\nconst ownerAgency = computed(() => organizations.value.find(item => item.type === 'agency' && item.role === 'owner'))\n"
)

anchor = "function slugify(value: string) {\n  return value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')\n}\n\n"
insert = anchor + "const cueEntryCopy = computed(() => preferences.locale.value === 'es' ? {\n  eyebrow: 'CUE / CAPTURA RÁPIDA',\n  title: 'REGISTRA LO QUE ACABA DE PASAR.',\n  body: 'Una llamada, un WhatsApp o una conversación. Guárdalo ahora y completa el booking cuando avance.',\n  saved: 'CUE guardado. El booking ya forma parte de tu workspace.'\n} : {\n  eyebrow: 'CUE / QUICK CAPTURE',\n  title: 'SAVE WHAT JUST HAPPENED.',\n  body: 'A call, WhatsApp or conversation. Capture it now and complete the booking as it moves forward.',\n  saved: 'CUE saved. The booking is now part of your workspace.'\n})\n\nasync function loadRealBookings() {\n  if (!bookingCoreWorkspaceId.value) { realBookings.value = []; return }\n  realBookings.value = await bookingCore.listBookings(bookingCoreWorkspaceId.value)\n}\n\nasync function ensureBookingCoreWorkspace() {\n  if (!selectedArtistId.value) return\n  cueCoreLoading.value = true\n  try {\n    const workspaces = await bookingCore.listWorkspaces()\n    let resolvedWorkspaceId = ''\n\n    for (const workspace of workspaces) {\n      const workspaceArtists = await bookingCore.listWorkspaceArtists(workspace.id)\n      if (workspaceArtists.some(item => item.artist_id === selectedArtistId.value)) {\n        resolvedWorkspaceId = workspace.id\n        break\n      }\n    }\n\n    if (!resolvedWorkspaceId) {\n      if (ownerAgency.value) {\n        resolvedWorkspaceId = await bookingCore.ensureBookingWorkspace({ organizationId: ownerAgency.value.id })\n      } else if (selectedArtist.value?.role === 'owner') {\n        resolvedWorkspaceId = await bookingCore.ensureBookingWorkspace({ artistId: selectedArtistId.value })\n      }\n    }\n\n    bookingCoreWorkspaceId.value = resolvedWorkspaceId\n    await loadRealBookings()\n  } catch (error: any) {\n    // Legacy manager/admin accounts may need the owner to bootstrap once.\n    // Do not block the existing workspace while that transition is incomplete.\n    bookingCoreWorkspaceId.value = ''\n    realBookings.value = []\n    console.warn('[booking-core] workspace bootstrap unavailable', error?.message || error)\n  } finally {\n    cueCoreLoading.value = false\n  }\n}\n\nasync function handleCueCreated() {\n  cueOpen.value = false\n  cueMessage.value = cueEntryCopy.value.saved\n  await loadRealBookings()\n  window.setTimeout(() => { cueMessage.value = '' }, 4500)\n}\n\n"
replace_once(anchor, insert)

replace_once(
    "    if (!selectedArtistId.value || !artists.value.some(item => item.id === selectedArtistId.value)) selectedArtistId.value = artists.value[0]?.id || ''\n    if (selectedArtistId.value) await Promise.all([loadBlocks(), loadArtistProfile()])\n",
    "    if (!selectedArtistId.value || !artists.value.some(item => item.id === selectedArtistId.value)) selectedArtistId.value = artists.value[0]?.id || ''\n    if (selectedArtistId.value) {\n      await Promise.all([loadBlocks(), loadArtistProfile()])\n      await ensureBookingCoreWorkspace()\n    }\n"
)

replace_once(
    "          <article class=\"summary-card summary-card--pending\"><span>{{ copy.realBookings }}</span><strong>—</strong><p>{{ copy.realBookingsBody }}</p></article>\n",
    "          <article class=\"summary-card summary-card--pending\"><span>{{ copy.realBookings }}</span><strong>{{ cueCoreLoading ? '…' : realBookings.length }}</strong><p>{{ bookingCoreWorkspaceId ? (preferences.locale.value === 'es' ? 'Bookings guardados en tu workspace.' : 'Bookings saved in your workspace.') : copy.realBookingsBody }}</p></article>\n"
)

booking_heading = "        </div>\n        <aside id=\"sample-mode\" class=\"demo-notice\" :class=\"{ 'tour-focus': tourStep === 0 }\">\n"
cue_bar = "        </div>\n\n        <section v-if=\"bookingCoreWorkspaceId\" class=\"cue-entry-bar\">\n          <div>\n            <span>{{ cueEntryCopy.eyebrow }}</span>\n            <strong>{{ cueEntryCopy.title }}</strong>\n            <p>{{ cueEntryCopy.body }}</p>\n          </div>\n          <button type=\"button\" @click=\"cueOpen = true\">+ CUE</button>\n        </section>\n        <p v-if=\"cueMessage\" class=\"cue-entry-message\">{{ cueMessage }}</p>\n\n        <aside id=\"sample-mode\" class=\"demo-notice\" :class=\"{ 'tour-focus': tourStep === 0 }\">\n"
replace_once(booking_heading, cue_bar)

component = "\n    <CueCapturePanel\n      :open=\"cueOpen\"\n      :workspace-id=\"bookingCoreWorkspaceId\"\n      :artist-id=\"selectedArtistId\"\n      :locale=\"preferences.locale.value\"\n      @close=\"cueOpen = false\"\n      @created=\"handleCueCreated\"\n    />\n"
replace_once("\n  </main>\n</template>", component + "\n  </main>\n</template>")

css = """
.cue-entry-bar { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-bottom: 14px; padding: 16px 18px; border: 1px solid color-mix(in srgb, var(--cue-accent) 48%, var(--cue-border)); background: color-mix(in srgb, var(--cue-accent) 5%, var(--cue-surface)); }
.cue-entry-bar > div { min-width: 0; }
.cue-entry-bar span { display: block; margin-bottom: 5px; color: var(--cue-accent); font: 700 9px/1.2 monospace; letter-spacing: .12em; }
.cue-entry-bar strong { display: block; font-size: 15px; }
.cue-entry-bar p { margin: 4px 0 0; max-width: 760px; color: var(--cue-muted); font-size: 12px; line-height: 1.4; }
.cue-entry-bar > button { min-width: 104px; min-height: 44px; padding: 0 18px; border: 0; background: var(--cue-accent); color: #090909; cursor: pointer; font-weight: 900; letter-spacing: .04em; }
.cue-entry-message { margin: -2px 0 14px; padding: 9px 12px; border-left: 2px solid var(--cue-mint); color: var(--cue-muted); font-size: 11px; }
@media (max-width: 760px) {
  .cue-entry-bar { align-items: stretch; gap: 10px; margin-bottom: 10px; padding: 11px 12px; }
  .cue-entry-bar span { font-size: 8px; }
  .cue-entry-bar strong { font-size: 12px; }
  .cue-entry-bar p { display: none; }
  .cue-entry-bar > button { min-width: 82px; min-height: 38px; padding: 0 12px; }
}
"""
idx = text.rfind('</style>')
if idx < 0:
    raise SystemExit('No style closing tag found')
text = text[:idx] + css + text[idx:]

path.write_text(text)
