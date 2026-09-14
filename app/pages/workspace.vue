<script setup lang="ts">
const auth = useCueAuth()
const availability = useAvailability()

type WorkspaceView = 'overview' | 'bookings' | 'calendar'
type ManagedArtist = { id: string; stage_name: string; slug: string; role: 'owner' | 'manager' | 'editor' }
type ManagedOrganization = { id: string; name: string; slug: string; type: 'agency' | 'promoter'; role: 'owner' | 'admin' | 'member' }

const activeView = ref<WorkspaceView>('overview')
const artists = ref<ManagedArtist[]>([])
const organizations = ref<ManagedOrganization[]>([])
const selectedArtistId = ref('')
const blocks = ref<AvailabilityBlock[]>([])
const monthCursor = ref(new Date().toISOString().slice(0, 7) + '-01')
const selectedDate = ref(new Date().toISOString().slice(0, 10))
const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const editorOpen = ref(false)
const startTime = ref('18:00')
const endTime = ref('20:00')
const blockStatus = ref<AvailabilityStatus>('unavailable')
const blockLabel = ref('')
const editingBlockId = ref<string | null>(null)
const rosterArtistName = ref('')
const rosterArtistSlug = ref('')
const rosterSubmitting = ref(false)

const manageableAgency = computed(() => organizations.value.find(item => item.type === 'agency' && ['owner', 'admin'].includes(item.role)))
const selectedArtist = computed(() => artists.value.find(item => item.id === selectedArtistId.value))
const monthLabel = computed(() => new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${monthCursor.value}T12:00:00Z`)))
const selectedDateLabel = computed(() => new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${selectedDate.value}T12:00:00Z`)))
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
    return {
      date,
      number: day.getUTCDate(),
      current: day.getUTCMonth() === cursor.getUTCMonth(),
      blocks: blocks.value.filter(block => block.starts_at.slice(0, 10) === date)
    }
  })
})

const dayBlocks = computed(() => blocks.value
  .filter(block => block.starts_at.slice(0, 10) === selectedDate.value)
  .sort((a, b) => a.starts_at.localeCompare(b.starts_at)))
const upcomingBlocks = computed(() => blocks.value
  .filter(block => block.ends_at >= new Date().toISOString())
  .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  .slice(0, 4))
const holdCount = computed(() => blocks.value.filter(block => block.status === 'hold').length)
const confirmedCount = computed(() => blocks.value.filter(block => block.status === 'confirmed').length)
const occupiedDays = computed(() => new Set(blocks.value.map(block => block.starts_at.slice(0, 10))).size)
const validTimeRange = computed(() => endTime.value > startTime.value)
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
  try {
    blocks.value = await availability.listBlocks(selectedArtistId.value, monthRange.value.from, monthRange.value.to)
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'No se pudo cargar la disponibilidad.'
  }
}

function changeMonth(offset: number) {
  const date = new Date(`${monthCursor.value}T12:00:00Z`)
  date.setUTCMonth(date.getUTCMonth() + offset)
  monthCursor.value = date.toISOString().slice(0, 7) + '-01'
  selectedDate.value = monthCursor.value
  closeEditor()
}

function selectDay(date: string) {
  selectedDate.value = date
  if (date.slice(0, 7) !== monthCursor.value.slice(0, 7)) monthCursor.value = `${date.slice(0, 7)}-01`
  closeEditor()
}

function openCreate(start = '18:00') {
  const startMinutes = Number(start.slice(0, 2)) * 60 + Number(start.slice(3, 5))
  const endMinutes = Math.min(startMinutes + 120, 23 * 60 + 59)
  startTime.value = start
  endTime.value = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`
  blockStatus.value = 'unavailable'
  blockLabel.value = ''
  editingBlockId.value = null
  editorOpen.value = true
}

function startEdit(block: AvailabilityBlock) {
  selectedDate.value = block.starts_at.slice(0, 10)
  startTime.value = block.starts_at.slice(11, 16)
  endTime.value = block.ends_at.slice(11, 16)
  blockStatus.value = block.status
  blockLabel.value = block.label || ''
  editingBlockId.value = block.id
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
  editingBlockId.value = null
}

async function saveBlock() {
  if (!selectedArtistId.value || !validTimeRange.value) return
  errorMessage.value = ''
  saving.value = true
  const input = {
    startsAt: `${selectedDate.value}T${startTime.value}:00`,
    endsAt: `${selectedDate.value}T${endTime.value}:00`,
    status: blockStatus.value,
    label: blockLabel.value
  }
  try {
    if (editingBlockId.value) await availability.updateBlock(editingBlockId.value, input)
    else await availability.createBlock({ artistId: selectedArtistId.value, ...input })
    closeEditor()
    await loadBlocks()
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'No se pudo guardar el horario.'
  } finally {
    saving.value = false
  }
}

async function removeBlock() {
  if (!editingBlockId.value || !window.confirm('¿Eliminar este horario? Esta acción no se puede deshacer.')) return
  saving.value = true
  try {
    await availability.deleteBlock(editingBlockId.value)
    closeEditor()
    await loadBlocks()
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'No se pudo eliminar el horario.'
  } finally {
    saving.value = false
  }
}

function blockStyle(block: AvailabilityBlock) {
  const start = Number(block.starts_at.slice(11, 13)) * 60 + Number(block.starts_at.slice(14, 16))
  const end = Number(block.ends_at.slice(11, 13)) * 60 + Number(block.ends_at.slice(14, 16))
  return { top: `${start * .8}px`, height: `${Math.max((end - start) * .8, 42)}px` }
}

function openUpcoming(block: AvailabilityBlock) {
  activeView.value = 'calendar'
  startEdit(block)
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(value))
}

function time(value: string) { return value.slice(11, 16) }
function statusLabel(status: AvailabilityStatus) { return status === 'confirmed' ? 'Confirmado' : status === 'hold' ? 'Hold' : 'No disponible' }
async function logout() { await auth.signOut(); await navigateTo('/access') }
useHead({ title: 'Workspace | CueBooker' })
</script>

<template>
  <main class="workspace">
    <header class="workspace-header">
      <NuxtLink class="brand" to="/">CUEBOOKER<span>/</span></NuxtLink>
      <nav aria-label="Workspace">
        <button :class="{ active: activeView === 'overview' }" type="button" @click="activeView = 'overview'">Resumen</button>
        <button :class="{ active: activeView === 'bookings' }" type="button" @click="activeView = 'bookings'">Bookings</button>
        <button :class="{ active: activeView === 'calendar' }" type="button" @click="activeView = 'calendar'">Calendario</button>
      </nav>
      <div class="account-actions">
        <span>{{ selectedArtist?.stage_name || 'Workspace privado' }}</span>
        <button type="button" @click="logout">Salir</button>
      </div>
    </header>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    <p v-if="loading" class="loading-message">Cargando workspace…</p>

    <section v-else-if="!artists.length" class="empty-card">
      <p class="eyebrow">ROSTER / PRIMER ARTISTA</p>
      <template v-if="manageableAgency">
        <h1>Añade el primer artista de {{ manageableAgency.name }}.</h1>
        <p>Quedará asociado al roster y podrás empezar a gestionar su actividad.</p>
        <form class="roster-form" @submit.prevent="addFirstRosterArtist">
          <label><span>Nombre artístico</span><input v-model="rosterArtistName" minlength="1" required></label>
          <label><span>Identificador</span><input v-model="rosterArtistSlug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required></label>
          <button class="primary-button" type="submit" :disabled="rosterSubmitting">{{ rosterSubmitting ? 'Creando…' : 'Añadir artista' }}</button>
        </form>
      </template>
      <template v-else>
        <h1>No hay un artista gestionable en esta cuenta.</h1>
        <p>Tu cuenta todavía no tiene un artista o roster asignado.</p>
      </template>
    </section>

    <template v-else>
      <section v-if="activeView === 'overview'" class="view overview-view">
        <div class="view-heading">
          <div>
            <p class="eyebrow">WORKSPACE / RESUMEN</p>
            <h1>Qué necesita tu atención.</h1>
            <p>Una entrada rápida a los bookings y fechas del artista, sin convertir el calendario en todo el producto.</p>
          </div>
          <label class="artist-select"><span>Artista</span><select v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
        </div>

        <div class="summary-grid">
          <article class="summary-card summary-card--pending"><span>Bookings nuevos</span><strong>—</strong><p>La bandeja conectada se incorpora en el siguiente bloque.</p></article>
          <article class="summary-card"><span>Holds este mes</span><strong>{{ holdCount }}</strong><p>Fechas pendientes de decisión.</p></article>
          <article class="summary-card"><span>Confirmados</span><strong>{{ confirmedCount }}</strong><p>Horarios confirmados este mes.</p></article>
          <article class="summary-card"><span>Días ocupados</span><strong>{{ occupiedDays }}</strong><p>Con al menos un horario registrado.</p></article>
        </div>

        <div class="overview-grid">
          <section class="panel agenda-panel">
            <div class="panel-heading"><div><p class="eyebrow">AGENDA / ESTE MES</p><h2>Próximos horarios</h2></div><button type="button" @click="activeView = 'calendar'">Ver calendario</button></div>
            <div v-if="upcomingBlocks.length" class="agenda-list">
              <button v-for="block in upcomingBlocks" :key="block.id" type="button" @click="openUpcoming(block)">
                <time>{{ shortDate(block.starts_at) }}</time>
                <span><strong>{{ block.label || 'Horario privado' }}</strong><small>{{ time(block.starts_at) }}–{{ time(block.ends_at) }}</small></span>
                <i :class="`status-dot status-dot--${block.status}`" />
              </button>
            </div>
            <div v-else class="panel-empty"><p>No hay horarios próximos registrados en este mes.</p><button type="button" @click="activeView = 'calendar'; openCreate()">Añadir horario</button></div>
          </section>

          <aside class="panel next-panel">
            <p class="eyebrow">PRODUCTO / SIGUIENTE BLOQUE</p>
            <h2>La bandeja de bookings será el centro.</h2>
            <p>Las solicitudes reales todavía no están conectadas a esta cuenta. Cuando lo estén, aquí aparecerán las conversaciones pendientes y sus siguientes acciones.</p>
            <button type="button" @click="activeView = 'bookings'">Ver estado de Bookings</button>
          </aside>
        </div>
      </section>

      <section v-else-if="activeView === 'bookings'" class="view bookings-view">
        <div class="view-heading">
          <div><p class="eyebrow">BOOKINGS / BANDEJA</p><h1>Solicitudes y conversaciones.</h1><p>Este será el espacio principal para revisar contactos, responder y decidir cada fecha.</p></div>
          <label class="artist-select"><span>Artista</span><select v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
        </div>
        <div class="bookings-shell">
          <aside class="booking-filters" aria-label="Filtros de bookings">
            <button class="active" type="button"><span>Nuevos</span><b>—</b></button>
            <button type="button"><span>En revisión</span><b>—</b></button>
            <button type="button"><span>Esperando</span><b>—</b></button>
            <button type="button"><span>Confirmados</span><b>—</b></button>
          </aside>
          <section class="booking-empty">
            <p class="eyebrow">ESTADO / PREPARADO</p>
            <h2>La interfaz está lista. Los bookings reales aún no.</h2>
            <p>Las solicitudes persistentes y sus conversaciones se conectarán en el siguiente bloque de producto. No mostramos registros ficticios dentro de tu cuenta privada.</p>
            <div class="empty-actions"><NuxtLink to="/app">Ver flujo con datos de prueba</NuxtLink><button type="button" @click="activeView = 'calendar'">Gestionar calendario</button></div>
          </section>
        </div>
      </section>

      <section v-else class="view calendar-view">
        <div class="view-heading calendar-heading">
          <div><p class="eyebrow">CALENDARIO / DISPONIBILIDAD</p><h1>Fechas y horarios.</h1><p>Abre un día para ver sus 24 horas. Pulsa una hora vacía para crear un horario o un bloque existente para editarlo.</p></div>
          <label class="artist-select"><span>Artista</span><select v-model="selectedArtistId"><option v-for="artist in artists" :key="artist.id" :value="artist.id">{{ artist.stage_name }}</option></select></label>
        </div>

        <div class="calendar-layout">
          <section class="month-panel panel">
            <div class="calendar-toolbar"><button type="button" aria-label="Mes anterior" @click="changeMonth(-1)">←</button><h2>{{ monthLabel }}</h2><button type="button" aria-label="Mes siguiente" @click="changeMonth(1)">→</button></div>
            <div class="calendar-grid">
              <div v-for="label in ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom']" :key="label" class="weekday">{{ label }}</div>
              <button v-for="cell in monthCells" :key="cell.date" type="button" class="day" :class="{ muted: !cell.current, selected: selectedDate === cell.date }" @click="selectDay(cell.date)">
                <span>{{ cell.number }}</span>
                <small v-if="cell.blocks.length">{{ cell.blocks.length }}</small>
                <i v-for="block in cell.blocks.slice(0, 3)" :key="block.id" :class="`status-dot status-dot--${block.status}`" />
              </button>
            </div>
            <div class="legend"><span><i class="status-dot status-dot--hold" />Hold</span><span><i class="status-dot status-dot--confirmed" />Confirmado</span><span><i class="status-dot status-dot--unavailable" />No disponible</span></div>
          </section>

          <section class="day-panel panel">
            <div class="day-heading"><div><p class="eyebrow">DÍA / 24 HORAS</p><h2>{{ selectedDateLabel }}</h2></div><button class="add-button" type="button" @click="openCreate()">Añadir</button></div>
            <div class="timeline" aria-label="Horario del día seleccionado">
              <button v-for="hour in hours" :key="hour" class="hour-row" type="button" :aria-label="`Añadir horario a las ${hour}`" @click="openCreate(hour)"><span>{{ hour }}</span></button>
              <button v-for="block in dayBlocks" :key="block.id" class="timeline-block" :class="`timeline-block--${block.status}`" :style="blockStyle(block)" type="button" @click.stop="startEdit(block)">
                <strong>{{ block.label || statusLabel(block.status) }}</strong><span>{{ time(block.starts_at) }}–{{ time(block.ends_at) }}</span>
              </button>
            </div>
          </section>
        </div>
      </section>
    </template>

    <div v-if="editorOpen" class="editor-backdrop" @click.self="closeEditor">
      <aside class="editor-panel" role="dialog" aria-modal="true" :aria-labelledby="editingBlockId ? 'editor-title-edit' : 'editor-title-new'">
        <div class="editor-heading"><div><p class="eyebrow">{{ editingBlockId ? 'EDITAR HORARIO' : 'NUEVO HORARIO' }}</p><h2 :id="editingBlockId ? 'editor-title-edit' : 'editor-title-new'">{{ selectedDateLabel }}</h2></div><button type="button" aria-label="Cerrar" @click="closeEditor">×</button></div>
        <form @submit.prevent="saveBlock">
          <label><span>Etiqueta privada</span><input v-model="blockLabel" maxlength="160" placeholder="Estudio, viaje, evento…"></label>
          <div class="time-fields"><label><span>Inicio</span><input v-model="startTime" type="time" required></label><label><span>Fin</span><input v-model="endTime" type="time" required></label></div>
          <p v-if="!validTimeRange" class="form-hint form-hint--error">La hora de fin debe ser posterior a la hora de inicio.</p>
          <label><span>Estado</span><select v-model="blockStatus"><option value="unavailable">No disponible</option><option value="hold">Hold</option><option value="confirmed">Confirmado</option></select></label>
          <button class="primary-button" type="submit" :disabled="saving || !validTimeRange">{{ saving ? 'Guardando…' : editingBlockId ? 'Guardar cambios' : 'Crear horario' }}</button>
          <button v-if="editingBlockId" class="delete-button" type="button" :disabled="saving" @click="removeBlock">Eliminar horario</button>
        </form>
      </aside>
    </div>
  </main>
</template>

<style scoped>
:global(body) { margin: 0; background: #070707; }
button, select, input { font: inherit; }
button, a, select { -webkit-tap-highlight-color: transparent; }
.workspace { min-height: 100vh; padding: 0 28px 64px; background: #070707; color: #f2f0eb; font-family: Arial, Helvetica, sans-serif; }
.workspace-header { position: sticky; z-index: 20; top: 0; display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; min-height: 72px; border-bottom: 1px solid #292929; background: rgba(7, 7, 7, .94); backdrop-filter: blur(12px); }
.brand { color: inherit; text-decoration: none; font-weight: 900; letter-spacing: .08em; }
.brand span, .eyebrow { color: #e8ff2f; }
.workspace-header nav { display: flex; gap: 4px; padding: 4px; border: 1px solid #292929; border-radius: 999px; background: #101010; }
.workspace-header nav button { min-height: 38px; padding: 0 18px; border: 0; border-radius: 999px; background: transparent; color: #8b8b8b; cursor: pointer; font-size: 13px; font-weight: 700; }
.workspace-header nav button.active { background: #e8ff2f; color: #070707; }
.account-actions { display: flex; justify-content: flex-end; align-items: center; gap: 16px; color: #8f8f8f; font-size: 12px; }
.account-actions button, .panel-heading button, .next-panel button, .panel-empty button, .empty-actions button, .empty-actions a { border: 0; background: transparent; color: #f2f0eb; cursor: pointer; font-weight: 700; text-decoration: underline; text-underline-offset: 4px; }
.view { width: min(1440px, 100%); margin: 0 auto; }
.view-heading { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; padding: clamp(46px, 7vw, 92px) 0 30px; }
.view-heading > div { max-width: 880px; }
.eyebrow { margin: 0; font: 700 10px/1.25 monospace; letter-spacing: .12em; text-transform: uppercase; }
h1 { max-width: 900px; margin: 10px 0 14px; font-size: clamp(3rem, 7vw, 7.2rem); line-height: .84; letter-spacing: -.065em; text-transform: uppercase; }
.view-heading > div > p:last-child, .empty-card > p, .next-panel > p, .booking-empty > p { max-width: 680px; margin: 0; color: #9b9b9b; font-size: 16px; line-height: 1.55; }
.artist-select, .roster-form label, .editor-panel label { display: grid; gap: 8px; }
.artist-select span, .roster-form label span, .editor-panel label span { color: #858585; font: 700 10px/1.2 monospace; letter-spacing: .08em; text-transform: uppercase; }
select, input { min-height: 46px; box-sizing: border-box; padding: 0 13px; border: 1px solid #383838; border-radius: 0; outline: none; background: #101010; color: #fff; }
select:focus, input:focus { border-color: #e8ff2f; }
.artist-select select { min-width: 220px; }
.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); border-top: 1px solid #292929; border-left: 1px solid #292929; }
.summary-card { min-height: 170px; padding: 22px; border-right: 1px solid #292929; border-bottom: 1px solid #292929; background: #0d0d0d; }
.summary-card > span { color: #8b8b8b; font: 700 10px monospace; letter-spacing: .09em; text-transform: uppercase; }
.summary-card strong { display: block; margin: 16px 0 8px; font-size: 54px; line-height: 1; }
.summary-card p { max-width: 220px; margin: 0; color: #777; font-size: 13px; line-height: 1.45; }
.summary-card--pending { background: #151515; }
.summary-card--pending strong { color: #686868; }
.overview-grid { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(300px, .75fr); gap: 20px; margin-top: 20px; }
.panel, .empty-card { border: 1px solid #292929; background: #0d0d0d; }
.panel-heading, .day-heading, .editor-heading { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
.panel-heading { padding: 22px; border-bottom: 1px solid #292929; }
.panel h2, .empty-card h1, .editor-panel h2 { margin: 7px 0 0; }
.agenda-list > button { display: grid; grid-template-columns: 78px 1fr auto; align-items: center; width: 100%; min-height: 82px; padding: 14px 22px; border: 0; border-bottom: 1px solid #242424; background: transparent; color: #f2f0eb; text-align: left; cursor: pointer; }
.agenda-list > button:hover { background: #141414; }
.agenda-list time { color: #e8ff2f; font: 700 12px monospace; text-transform: uppercase; }
.agenda-list strong, .agenda-list small { display: block; }
.agenda-list small { margin-top: 5px; color: #7d7d7d; font-size: 12px; }
.next-panel { padding: 24px; background: #e8ff2f; color: #090909; }
.next-panel .eyebrow, .next-panel > p { color: #222; }
.next-panel h2 { max-width: 360px; margin: 18px 0; font-size: clamp(1.8rem, 3vw, 3.2rem); line-height: .95; text-transform: uppercase; }
.next-panel button { margin-top: 28px; color: #090909; }
.panel-empty { padding: 32px 22px; color: #8c8c8c; }
.panel-empty button { padding: 0; color: #e8ff2f; }
.bookings-shell { display: grid; grid-template-columns: 260px minmax(0, 1fr); min-height: 470px; border: 1px solid #292929; background: #0d0d0d; }
.booking-filters { padding: 10px; border-right: 1px solid #292929; }
.booking-filters button { display: flex; justify-content: space-between; width: 100%; min-height: 50px; padding: 0 14px; border: 0; background: transparent; color: #848484; cursor: pointer; text-align: left; }
.booking-filters button.active { background: #181818; color: #fff; }
.booking-empty { display: grid; align-content: center; justify-items: start; max-width: 720px; padding: clamp(36px, 7vw, 92px); }
.booking-empty h2 { margin: 12px 0 18px; font-size: clamp(2.2rem, 5vw, 5rem); line-height: .92; text-transform: uppercase; }
.empty-actions { display: flex; gap: 24px; margin-top: 28px; }
.empty-actions a { padding: 14px 18px; background: #e8ff2f; color: #070707; text-decoration: none; }
.calendar-heading { padding-bottom: 26px; }
.calendar-layout { display: grid; grid-template-columns: minmax(580px, 1.35fr) minmax(390px, .65fr); gap: 20px; align-items: start; }
.month-panel { overflow: hidden; }
.calendar-toolbar { display: grid; grid-template-columns: 44px 1fr 44px; align-items: center; gap: 12px; min-height: 70px; padding: 0 14px; border-bottom: 1px solid #292929; }
.calendar-toolbar h2 { margin: 0; text-align: center; font-size: 18px; text-transform: capitalize; }
.calendar-toolbar button, .editor-heading > button { min-width: 42px; min-height: 42px; border: 1px solid #333; background: #131313; color: #fff; cursor: pointer; }
.calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border-left: 1px solid #292929; }
.weekday { padding: 11px 8px; border-right: 1px solid #292929; border-bottom: 1px solid #292929; color: #707070; font: 700 10px monospace; text-align: center; }
.day { position: relative; min-height: 82px; padding: 9px; border: 0; border-right: 1px solid #292929; border-bottom: 1px solid #292929; background: #0d0d0d; color: #fff; text-align: left; cursor: pointer; }
.day:hover { background: #151515; }
.day.muted { color: #505050; }
.day.selected { box-shadow: inset 0 0 0 1px #e8ff2f; background: #171717; }
.day small { position: absolute; top: 8px; right: 8px; color: #777; font: 9px monospace; }
.status-dot { display: inline-block; width: 7px; height: 7px; margin: 25px 4px 0 0; border-radius: 50%; background: #777; }
.agenda-list .status-dot, .legend .status-dot { margin: 0; }
.status-dot--hold { background: #e8ff2f; }
.status-dot--confirmed { background: #8ce99a; }
.status-dot--unavailable { background: #ff8585; }
.legend { display: flex; flex-wrap: wrap; gap: 16px; padding: 16px; color: #777; font-size: 11px; }
.legend span { display: flex; align-items: center; gap: 7px; }
.day-panel { position: sticky; top: 92px; overflow: hidden; }
.day-heading { align-items: center; padding: 18px; border-bottom: 1px solid #292929; }
.day-heading h2 { font-size: 20px; text-transform: capitalize; }
.add-button { min-height: 40px; padding: 0 16px; border: 0; background: #e8ff2f; color: #070707; cursor: pointer; font-weight: 800; }
.timeline { position: relative; height: 590px; overflow-y: auto; }
.hour-row { display: block; width: 100%; height: 48px; padding: 0 12px; border: 0; border-bottom: 1px solid #222; background: transparent; color: #666; text-align: left; cursor: crosshair; }
.hour-row:hover { background: #121212; color: #e8ff2f; }
.hour-row span { position: relative; top: -17px; padding-right: 7px; background: #0d0d0d; font: 10px monospace; }
.timeline-block { position: absolute; right: 12px; left: 58px; z-index: 2; overflow: hidden; min-height: 42px; padding: 8px 10px; border: 1px solid #666; background: #202020; color: #fff; text-align: left; cursor: pointer; }
.timeline-block strong, .timeline-block span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.timeline-block strong { font-size: 12px; }
.timeline-block span { margin-top: 3px; color: #aaa; font-size: 10px; }
.timeline-block--hold { border-color: #e8ff2f; background: #272a10; }
.timeline-block--confirmed { border-color: #8ce99a; background: #15281a; }
.timeline-block--unavailable { border-color: #ff8585; background: #291818; }
.editor-backdrop { position: fixed; z-index: 40; inset: 0; display: flex; justify-content: flex-end; background: rgba(0, 0, 0, .66); }
.editor-panel { width: min(460px, 100%); box-sizing: border-box; padding: 26px; overflow-y: auto; border-left: 1px solid #333; background: #101010; color: #f2f0eb; box-shadow: -30px 0 80px rgba(0, 0, 0, .45); }
.editor-heading { padding-bottom: 28px; }
.editor-panel form, .roster-form { display: grid; gap: 18px; }
.form-hint { margin: -8px 0 0; color: #888; font-size: 12px; }
.form-hint--error { color: #ff9b9b; }
.time-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.primary-button { min-height: 50px; border: 0; background: #e8ff2f; color: #070707; cursor: pointer; font-weight: 900; }
.delete-button { min-height: 46px; border: 1px solid #693737; background: transparent; color: #ff9b9b; cursor: pointer; }
.empty-card { max-width: 760px; margin: 70px auto; padding: clamp(26px, 6vw, 70px); }
.empty-card h1 { margin-bottom: 18px; font-size: clamp(2.4rem, 6vw, 5.5rem); line-height: .9; text-transform: uppercase; }
.roster-form { margin-top: 28px; }
.error-message, .loading-message { width: min(1440px, 100%); box-sizing: border-box; margin: 18px auto 0; padding: 13px 16px; }
.error-message { border: 1px solid #8b3434; color: #ffadad; }
.loading-message { color: #999; }

@media (max-width: 1040px) {
  .workspace-header { grid-template-columns: 1fr auto; }
  .workspace-header nav { position: fixed; right: 16px; bottom: 16px; left: 16px; z-index: 30; justify-content: stretch; box-shadow: 0 14px 40px #000; }
  .workspace-header nav button { flex: 1; }
  .account-actions span { display: none; }
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .overview-grid, .calendar-layout { grid-template-columns: 1fr; }
  .day-panel { position: static; }
}

@media (max-width: 680px) {
  .workspace { padding: 0 14px 100px; }
  .workspace-header { min-height: 62px; }
  .account-actions { gap: 8px; }
  .view-heading { display: block; padding: 38px 0 22px; }
  h1 { font-size: clamp(2.7rem, 16vw, 4.8rem); }
  .view-heading > div > p:last-child { font-size: 15px; }
  .artist-select { margin-top: 22px; }
  .artist-select select { width: 100%; min-width: 0; }
  .summary-grid { grid-template-columns: 1fr; }
  .summary-card { min-height: 132px; }
  .overview-grid { gap: 14px; }
  .bookings-shell { grid-template-columns: 1fr; }
  .booking-filters { display: grid; grid-template-columns: repeat(2, 1fr); border-right: 0; border-bottom: 1px solid #292929; }
  .booking-empty { padding: 34px 20px; }
  .empty-actions { align-items: flex-start; flex-direction: column; }
  .calendar-toolbar { min-height: 60px; }
  .weekday { padding: 9px 2px; font-size: 8px; }
  .day { min-height: 58px; padding: 6px; }
  .day small { display: none; }
  .status-dot { width: 5px; height: 5px; margin: 18px 2px 0 0; }
  .legend .status-dot { width: 7px; height: 7px; margin: 0; }
  .day-heading { align-items: flex-start; }
  .day-heading h2 { max-width: 210px; font-size: 17px; }
  .timeline { height: 520px; }
  .editor-panel { border-left: 0; }
  .time-fields { grid-template-columns: 1fr; }
}
</style>
