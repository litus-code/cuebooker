<script setup lang="ts">
const auth = useCueAuth()
const availability = useAvailability()

type ManagedArtist = { id: string; stage_name: string; slug: string; role: 'owner' | 'manager' | 'editor' }
type ManagedOrganization = { id: string; name: string; slug: string; type: 'agency' | 'promoter'; role: 'owner' | 'admin' | 'member' }

const artists = ref<ManagedArtist[]>([])
const organizations = ref<ManagedOrganization[]>([])
const selectedArtistId = ref('')
const blocks = ref<AvailabilityBlock[]>([])
const monthCursor = ref(new Date().toISOString().slice(0, 7) + '-01')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const loading = ref(true)
const errorMessage = ref('')
const newStart = ref('18:00')
const newEnd = ref('23:00')
const newStatus = ref<AvailabilityStatus>('unavailable')
const newLabel = ref('')
const editingBlockId = ref<string | null>(null)
const rosterArtistName = ref('')
const rosterArtistSlug = ref('')
const rosterSubmitting = ref(false)

const manageableAgency = computed(() => organizations.value.find(item => item.type === 'agency' && ['owner', 'admin'].includes(item.role)))
const monthLabel = computed(() => new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${monthCursor.value}T12:00:00Z`)))
const monthRange = computed(() => {
  const start = new Date(`${monthCursor.value}T00:00:00Z`)
  const end = new Date(start)
  end.setUTCMonth(end.getUTCMonth() + 1)
  return { from: start.toISOString(), to: end.toISOString() }
})

const monthCells = computed(() => {
  const cursor = new Date(`${monthCursor.value}T12:00:00Z`)
  const first = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), 1, 12))
  const offset = (first.getUTCDay() + 6) % 7
  const start = new Date(first)
  start.setUTCDate(first.getUTCDate() - offset)

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start)
    day.setUTCDate(start.getUTCDate() + index)
    const date = day.toISOString().slice(0, 10)
    return { date, number: day.getUTCDate(), current: day.getUTCMonth() === cursor.getUTCMonth(), blocks: blocks.value.filter(block => block.starts_at.slice(0, 10) === date) }
  })
})

const dayBlocks = computed(() => blocks.value.filter(block => block.starts_at.slice(0, 10) === selectedDate.value))
const hours = Array.from({ length: 24 }, (_, index) => `${String(index).padStart(2, '0')}:00`)

onMounted(async () => {
  await auth.initialize()
  if (!auth.signedIn.value) return navigateTo('/access')
  if (!auth.profile.value) await auth.fetchProfile()
  if (!auth.profile.value?.onboarding_completed) return navigateTo('/onboarding')
  await loadWorkspaceIdentity()
  loading.value = false
})

watch([selectedArtistId, monthCursor], async () => {
  if (selectedArtistId.value) await loadBlocks()
})

watch(rosterArtistName, value => { rosterArtistSlug.value = slugify(value) })

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

async function loadWorkspaceIdentity() {
  try {
    const [artistRows, organizationRows] = await Promise.all([availability.listArtists(), availability.listOrganizations()])
    artists.value = artistRows
    organizations.value = organizationRows
    if (!selectedArtistId.value || !artists.value.some(item => item.id === selectedArtistId.value)) selectedArtistId.value = artists.value[0]?.id || ''
    if (selectedArtistId.value) await loadBlocks()
  } catch (error: any) {
    errorMessage.value = error?.message || 'No se pudo cargar el workspace.'
  }
}

async function addFirstRosterArtist() {
  if (!manageableAgency.value) return
  errorMessage.value = ''
  rosterSubmitting.value = true
  try {
    const artistId = await availability.addAgencyArtist({ organizationId: manageableAgency.value.id, artistName: rosterArtistName.value, artistSlug: rosterArtistSlug.value })
    rosterArtistName.value = ''
    rosterArtistSlug.value = ''
    await loadWorkspaceIdentity()
    selectedArtistId.value = artistId
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'No se pudo añadir el artista.'
  } finally {
    rosterSubmitting.value = false
  }
}

async function loadBlocks() {
  if (!selectedArtistId.value) return
  blocks.value = await availability.listBlocks(selectedArtistId.value, monthRange.value.from, monthRange.value.to)
}

function changeMonth(offset: number) {
  const date = new Date(`${monthCursor.value}T12:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + offset)
  monthCursor.value = date.toISOString().slice(0, 7) + '-01'
  selectedDate.value = monthCursor.value
  cancelEdit()
}

function startEdit(block: AvailabilityBlock) {
  editingBlockId.value = block.id
  selectedDate.value = block.starts_at.slice(0, 10)
  newStart.value = block.starts_at.slice(11, 16)
  newEnd.value = block.ends_at.slice(11, 16)
  newStatus.value = block.status
  newLabel.value = block.label || ''
}

function cancelEdit() {
  editingBlockId.value = null
  newStart.value = '18:00'
  newEnd.value = '23:00'
  newStatus.value = 'unavailable'
  newLabel.value = ''
}

async function saveBlock() {
  if (!selectedArtistId.value) return
  errorMessage.value = ''
  const input = { startsAt: `${selectedDate.value}T${newStart.value}:00`, endsAt: `${selectedDate.value}T${newEnd.value}:00`, status: newStatus.value, label: newLabel.value }
  try {
    if (editingBlockId.value) await availability.updateBlock(editingBlockId.value, input)
    else await availability.createBlock({ artistId: selectedArtistId.value, ...input })
    cancelEdit()
    await loadBlocks()
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'No se pudo guardar el bloqueo.'
  }
}

async function removeBlock(id: string) {
  try {
    await availability.deleteBlock(id)
    if (editingBlockId.value === id) cancelEdit()
    await loadBlocks()
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'No se pudo eliminar el bloqueo.'
  }
}

async function logout() { await auth.signOut(); await navigateTo('/access') }
function time(value: string) { return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) }
useHead({ title: 'Workspace | CueBooker' })
</script>

<template>
  <main class="workspace-real">
    <header><NuxtLink to="/">CUEBOOKER<span>/</span></NuxtLink><p>PRIVATE WORKSPACE / CONNECTED</p><button type="button" @click="logout">Salir</button></header>

    <section class="workspace-heading">
      <div><p class="kicker">CALENDAR / PRIVATE</p><h1>Disponibilidad real.</h1><p>Estos datos están ligados a tu cuenta y nunca se exponen como detalles privados en Discovery.</p></div>
      <select v-if="artists.length" v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select>
    </section>

    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    <p v-if="loading" class="empty">Cargando workspace…</p>

    <section v-else-if="!artists.length" class="empty-card">
      <p class="kicker">ROSTER / FIRST ARTIST</p>
      <template v-if="manageableAgency">
        <h2>Añade el primer artista de {{ manageableAgency.name }}.</h2>
        <p>Al crearlo quedará asociado al roster y podrás gestionar su calendario inmediatamente.</p>
        <form class="roster-form" @submit.prevent="addFirstRosterArtist">
          <label><span>Nombre artístico</span><input v-model="rosterArtistName" minlength="1" required /></label>
          <label><span>Identificador</span><input v-model="rosterArtistSlug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
          <button class="save" type="submit" :disabled="rosterSubmitting">{{ rosterSubmitting ? 'Creando…' : 'Añadir artista' }}</button>
        </form>
      </template>
      <template v-else><h2>No hay un artista gestionable en esta cuenta.</h2><p>Tu cuenta todavía no tiene un artista o roster asignado.</p></template>
    </section>

    <template v-else>
      <section class="calendar-toolbar"><button type="button" @click="changeMonth(-1)">←</button><h2>{{ monthLabel }}</h2><button type="button" @click="changeMonth(1)">→</button></section>
      <section class="calendar-grid">
        <div v-for="label in ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']" :key="label" class="weekday">{{ label }}</div>
        <button v-for="cell in monthCells" :key="cell.date" type="button" class="day" :class="{ muted: !cell.current, selected: selectedDate === cell.date }" @click="selectedDate = cell.date; cancelEdit()">
          <span>{{ cell.number }}</span><i v-for="block in cell.blocks" :key="block.id" :class="`status status--${block.status}`" />
        </button>
      </section>

      <section class="day-layout">
        <div class="day-schedule">
          <div class="day-title"><div><p class="kicker">24H / DAY VIEW</p><h2>{{ selectedDate }}</h2></div><span>{{ dayBlocks.length }} bloques</span></div>
          <div class="hours">
            <div v-for="hour in hours" :key="hour" class="hour-row"><span>{{ hour }}</span></div>
            <article v-for="block in dayBlocks" :key="block.id" class="block-card" :class="{ editing: editingBlockId === block.id }">
              <div><strong>{{ block.label || 'Bloque privado' }}</strong><span>{{ time(block.starts_at) }}–{{ time(block.ends_at) }} · {{ block.status }}</span></div>
              <div class="block-actions"><button type="button" @click="startEdit(block)">Editar</button><button type="button" class="danger" @click="removeBlock(block.id)">Eliminar</button></div>
            </article>
          </div>
        </div>

        <form class="block-form" @submit.prevent="saveBlock">
          <p class="kicker">{{ editingBlockId ? 'EDIT BLOCK' : 'NEW BLOCK' }}</p><h2>{{ editingBlockId ? 'Editar horario' : 'Bloquear horario' }}</h2>
          <label><span>Etiqueta privada</span><input v-model="newLabel" maxlength="160" placeholder="Estudio, viaje, hold…" /></label>
          <div class="times"><label><span>Inicio</span><input v-model="newStart" type="time" required /></label><label><span>Fin</span><input v-model="newEnd" type="time" required /></label></div>
          <label><span>Estado</span><select v-model="newStatus"><option value="unavailable">No disponible</option><option value="hold">Hold</option><option value="confirmed">Confirmado</option></select></label>
          <button class="save" type="submit">{{ editingBlockId ? 'Guardar cambios' : 'Guardar bloqueo' }}</button>
          <button v-if="editingBlockId" class="cancel" type="button" @click="cancelEdit">Cancelar edición</button>
        </form>
      </section>
    </template>
  </main>
</template>

<style scoped>
.workspace-real { min-height: 100vh; padding: 24px; background: #070707; color: #f2f0eb; }
header { display: grid; grid-template-columns: 1fr auto auto; gap: 18px; align-items: center; padding-bottom: 18px; border-bottom: 1px solid #292929; }
header a { color: inherit; text-decoration: none; font-weight: 900; letter-spacing: .08em; } header a span, .kicker { color: #e8ff2f; }
header p, .kicker { margin: 0; font: 700 11px/1.2 monospace; letter-spacing: .1em; }
header button, .calendar-toolbar button { border: 1px solid #333; background: #101010; color: #fff; min-width: 42px; min-height: 38px; cursor: pointer; }
.workspace-heading { display: flex; justify-content: space-between; gap: 24px; align-items: end; padding: 52px 0 28px; }
h1 { margin: 8px 0; font-size: clamp(2.7rem, 7vw, 6rem); line-height: .9; text-transform: uppercase; } .workspace-heading > div > p:last-child { max-width: 680px; color: #999; }
select, input { min-height: 44px; padding: 0 12px; border: 1px solid #333; background: #101010; color: #fff; }
.calendar-toolbar { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; gap: 12px; margin: 14px 0; } .calendar-toolbar h2 { margin: 0; text-align: center; text-transform: uppercase; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); border-top: 1px solid #292929; border-left: 1px solid #292929; }
.weekday { padding: 10px; border-right: 1px solid #292929; border-bottom: 1px solid #292929; color: #777; font: 700 10px monospace; }
.day { min-height: 92px; padding: 10px; border: 0; border-right: 1px solid #292929; border-bottom: 1px solid #292929; background: #0d0d0d; color: #fff; text-align: left; cursor: pointer; } .day.muted { color: #555; } .day.selected { box-shadow: inset 0 0 0 1px #e8ff2f; }
.status { display: inline-block; width: 7px; height: 7px; margin: 24px 5px 0 0; border-radius: 50%; background: #777; } .status--hold { background: #e8ff2f; } .status--confirmed { background: #b5ffae; } .status--unavailable { background: #ff8585; }
.day-layout { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(280px, .7fr); gap: 20px; margin-top: 28px; }
.day-schedule, .block-form, .empty-card { border: 1px solid #292929; background: #101010; padding: 22px; } .day-title { display: flex; justify-content: space-between; align-items: end; } .day-title h2, .block-form h2, .empty-card h2 { margin: 8px 0; }
.hours { position: relative; margin-top: 18px; } .hour-row { height: 42px; border-top: 1px solid #222; } .hour-row span { color: #666; font: 10px monospace; }
.block-card { display: flex; justify-content: space-between; gap: 10px; margin: 8px 0; padding: 12px; border: 1px solid #343434; background: #171717; } .block-card.editing { border-color: #e8ff2f; } .block-card strong, .block-card span { display: block; } .block-card span { margin-top: 5px; color: #888; font-size: .85rem; }
.block-actions { display: flex; gap: 8px; } .block-actions button, .cancel { border: 1px solid #333; background: transparent; color: #ddd; cursor: pointer; } .block-actions .danger { color: #ff9c9c; }
.block-form, .roster-form { display: grid; gap: 16px; } .block-form { align-self: start; position: sticky; top: 20px; } .block-form label, .roster-form label { display: grid; gap: 7px; } .block-form label span, .roster-form label span { color: #888; font: 700 10px monospace; text-transform: uppercase; } .times { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; } .save { min-height: 48px; border: 0; background: #e8ff2f; color: #070707; font-weight: 900; cursor: pointer; } .cancel { min-height: 42px; }
.empty-card { max-width: 720px; } .empty-card > p { color: #999; } .roster-form { margin-top: 24px; }
.error { padding: 12px; border: 1px solid #8b3434; color: #ffadad; } .empty { color: #999; }
@media (max-width: 820px) { .workspace-real { padding: 16px; } header { grid-template-columns: 1fr auto; } header p { display: none; } .workspace-heading { display: block; padding-top: 36px; } .workspace-heading select { width: 100%; margin-top: 18px; } .day { min-height: 66px; } .weekday { padding: 7px 3px; text-align: center; } .day-layout { grid-template-columns: 1fr; } .block-form { position: static; } }
</style>
