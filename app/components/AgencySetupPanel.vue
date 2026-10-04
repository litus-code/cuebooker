<script setup lang="ts">
import { agencySetupProgress, type AgencySetupInput } from '../domain/agencySetup'

const props = withDefaults(defineProps<{
  workspaceId: string
  artists: Array<{ id: string; roster_active?: boolean }>
  locale: 'es' | 'en'
  revision?: number
  canCapture?: boolean
  demoState?: AgencySetupInput
}>(), { revision: 0, canCapture: true })
const emit = defineEmits<{
  settings: [section: 'agency' | 'mailbox']
  addArtist: []
  editArtist: [id: string]
  capture: []
}>()
const bookings = useBookingCore()
const catalog = useAgencyCatalog()
const profiles = useArtistProfile()
const mailbox = useConnectedMailbox()
const loading = ref(true)
const error = ref(false)
const mailboxUnknown = ref(false)
const snapshot = ref<AgencySetupInput | null>(null)
const progress = computed(() => snapshot.value ? agencySetupProgress(snapshot.value) : null)
const es = computed(() => props.locale === 'es')
let generation = 0

async function load() {
  const turn = ++generation
  loading.value = true
  error.value = false
  snapshot.value = null
  mailboxUnknown.value = false
  if (props.demoState) {
    snapshot.value = props.demoState
    loading.value = false
    return
  }
  if (!props.workspaceId) { loading.value = false; return }
  try {
    // The exit condition is workspace-wide and includes archived and unassigned bookings.
    const existing = await bookings.listBookings(props.workspaceId, 1)
    if (turn !== generation) return
    if (existing.length) {
      snapshot.value = { agency: { name: '', bio: null, contactEmail: null }, artist: null, receivingReady: false, hasBooking: true }
      return
    }
    const firstArtist = props.artists.find(artist => artist.roster_active !== false)
    const [savedCatalog, savedArtist, savedMailbox] = await Promise.all([
      catalog.load(props.workspaceId),
      firstArtist ? profiles.getProfile(firstArtist.id, false) : Promise.resolve(null),
      mailbox.status(props.workspaceId).catch(() => null)
    ])
    if (turn !== generation) return
    mailboxUnknown.value = !savedMailbox
    snapshot.value = {
      agency: { name: savedCatalog.name, bio: savedCatalog.bio, contactEmail: savedCatalog.contactEmail },
      artist: savedArtist ? { id: savedArtist.artist.id, name: savedArtist.artist.stage_name, bio: savedArtist.artist.bio, city: savedArtist.artist.city, genres: savedArtist.artist.primary_genres } : null,
      receivingReady: Boolean(savedMailbox?.connections.some(connection => connection.status === 'connected') || savedCatalog.published && savedCatalog.artists.some(artist => artist.eligible && artist.catalogVisible)),
      hasBooking: false
    }
  } catch {
    if (turn === generation) error.value = true
  } finally {
    if (turn === generation) loading.value = false
  }
}
watch(() => [props.workspaceId, props.artists.map(artist => `${artist.id}:${artist.roster_active}`).join('|'), props.revision, props.demoState], load, { immediate: true, deep: true })
onBeforeUnmount(() => { generation++ })

const steps = computed(() => [
  { id: 'agency', done: progress.value?.agencyReady, title: es.value ? 'Completa los datos de tu agencia' : 'Complete your agency details', body: es.value ? 'Añade la presentación y el correo de contacto. No necesitas publicar el catálogo.' : 'Add a bio and contact email. Publishing the catalog is not required.', action: es.value ? 'Datos de agencia' : 'Agency details' },
  { id: 'artist', done: progress.value?.artistReady, title: es.value ? 'Añade y prepara tu primer artista' : 'Add and prepare your first artist', body: es.value ? 'Completa su nombre, ciudad, presentación y géneros. Su ficha puede seguir privada.' : 'Complete their name, city, bio and genres. The profile can remain private.', action: progress.value?.artistId ? (es.value ? 'Completar ficha' : 'Complete profile') : (es.value ? 'Añadir artista' : 'Add artist') },
  { id: 'receiving', done: progress.value?.receivingReady, title: es.value ? 'Prepara la entrada de solicitudes' : 'Set up incoming enquiries', body: es.value ? 'Selecciona los artistas y publica la página de agencia para compartir su enlace, o conecta tu correo. Este paso es opcional si gestionas las solicitudes manualmente.' : 'Select artists and publish your agency page to share its link, or connect your email. This step is optional if you manage enquiries manually.', action: es.value ? 'Página y enlace de agencia' : 'Agency page and link' }
])
function act(step: string) {
  if (step === 'agency' || step === 'receiving') emit('settings', 'agency')
  else if (progress.value?.artistId) emit('editArtist', progress.value.artistId)
  else emit('addArtist')
}
</script>

<template>
  <section v-if="error || progress?.show" class="agency-setup" aria-labelledby="agency-setup-title" :aria-busy="loading">
    <header><div><p>{{ es ? 'PRIMEROS PASOS / AGENCIA' : 'GETTING STARTED / AGENCY' }}</p><h2 id="agency-setup-title">{{ es ? 'Prepara tu agencia' : 'Prepare your agency' }}</h2></div><span v-if="progress" role="status">{{ progress.completed }}/3</span></header>
    <p v-if="error" role="alert">{{ es ? 'No pudimos comprobar el progreso. Tus datos siguen guardados.' : 'We could not check progress. Your saved data is unchanged.' }} <button type="button" @click="load">{{ es ? 'Reintentar' : 'Retry' }}</button></p>
    <template v-else-if="progress">
      <ol>
        <li v-for="(step, index) in steps" :key="step.id" :class="{ 'is-complete': step.done }">
          <SetupStepMarker :complete="Boolean(step.done)" :index="String(index + 1).padStart(2, '0')" />
          <div><span class="agency-setup__status">{{ step.done ? (es ? 'Completado' : 'Complete') : step.id === 'receiving' ? (es ? 'Opcional' : 'Optional') : (es ? 'Pendiente' : 'Pending') }}</span><h3>{{ step.title }}</h3><p>{{ step.body }}</p>
            <div class="agency-setup__actions"><button type="button" @click="act(step.id)">{{ step.action }}</button><button v-if="step.id === 'receiving'" type="button" @click="emit('settings', 'mailbox')">{{ es ? 'Conectar correo' : 'Connect email' }}</button></div>
          </div>
        </li>
      </ol>
      <footer><p>{{ es ? 'También puedes empezar con una solicitud manual. Estos pasos desaparecerán cuando entre o registres tu primera reserva.' : 'You can also start with a manual enquiry. These steps disappear when your first booking arrives or you record it.' }}</p><button v-if="canCapture" class="agency-setup__primary" type="button" :disabled="!progress.canCapture" @click="emit('capture')">{{ es ? 'Registrar primera solicitud' : 'Record first enquiry' }}</button></footer>
      <p v-if="mailboxUnknown" class="agency-setup__hint">{{ es ? 'No pudimos comprobar la conexión de correo. Puedes revisarla en Ajustes.' : 'We could not check the email connection. Review it in Settings.' }}</p>
    </template>
  </section>
</template>

<style scoped>
.agency-setup { box-sizing:border-box; margin:0 0 24px; padding:24px; border:1px solid var(--cue-accent); border-radius:var(--cue-radius-panel,16px); background:var(--cue-surface); color:var(--cue-text); }
.agency-setup header { display:flex; align-items:start; justify-content:space-between; gap:16px; }
.agency-setup header p,.agency-setup__status { margin:0 0 8px; color:var(--cue-accent); font:800 10px/1.4 monospace; letter-spacing:.1em; text-transform:uppercase; }
.agency-setup h2 { margin:0; font-size:clamp(24px,5vw,36px); line-height:1.1; }
.agency-setup header>span { color:var(--cue-accent); font:800 18px/1.2 monospace; }
.agency-setup ol { display:grid; gap:14px; margin:24px 0; padding:0; list-style:none; }
.agency-setup li { display:grid; grid-template-columns:32px minmax(0,1fr); gap:12px; padding:18px 0; border-top:1px solid var(--cue-border); }
.agency-setup__number { color:var(--cue-muted); font:800 16px/1.3 monospace; }
.agency-setup .is-complete .agency-setup__number { color:var(--cue-accent); }
.agency-setup h3 { margin:6px 0; font-size:18px; line-height:1.3; }
.agency-setup .is-complete h3 { color:var(--cue-muted); }
.agency-setup .is-complete .agency-setup__status { opacity:.75; }
.agency-setup li p,.agency-setup footer p,.agency-setup__hint { color:var(--cue-muted); font-size:14px; line-height:1.5; }
.agency-setup__actions { display:flex; flex-wrap:wrap; gap:8px; }
.agency-setup button { min-height:44px; padding:10px 14px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-control,8px); background:transparent; color:var(--cue-text); font:inherit; font-weight:800; cursor:pointer; }
.agency-setup button:disabled { opacity:.5; cursor:not-allowed; }
.agency-setup button:focus-visible { outline:2px solid var(--cue-accent); outline-offset:3px; }
.agency-setup .agency-setup__primary { background:var(--cue-accent); border-color:var(--cue-accent); color:var(--cue-accent-ink); }
.agency-setup footer { border-top:1px solid var(--cue-border); padding-top:16px; }
@media(max-width:680px) { .agency-setup { padding:18px 16px; } .agency-setup__actions button,.agency-setup footer button { width:100%; } }
</style>
