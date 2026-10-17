<script setup lang="ts">
import type { AgencySetupInput } from '../domain/agencySetup'
const config = useRuntimeConfig()
const { locale } = useCuePreferences()
const allowed = ref(config.public.appEnv === 'staging')
const initial = (): AgencySetupInput => ({ agency: { name: 'CUE Test Agency', bio: null, contactEmail: null }, artist: null, receivingReady: false, hasBooking: false })
const demo = ref(initial())
const action = ref('')
const es = computed(() => locale.value === 'es')
function reset() { demo.value = initial(); action.value = '' }
function ready() {
  demo.value = { agency: { name: 'CUE Test Agency', bio: 'Agencia ficticia de música electrónica.', contactEmail: 'booking@example.invalid' }, artist: { id: 'demo-artist', name: 'Mara Velt', city: 'Barcelona', bio: 'Artista de demostración.', genres: ['Techno'] }, receivingReady: true, hasBooking: false }
  action.value = ''
}
function simulateSave() {
  if (action.value === 'agency') demo.value.agency = { name: 'CUE Test Agency', bio: 'Agencia ficticia de música electrónica.', contactEmail: 'booking@example.invalid' }
  else if (action.value === 'mailbox') demo.value.receivingReady = true
  else demo.value.artist = { id: 'demo-artist', name: 'Mara Velt', city: 'Barcelona', bio: 'Artista de demostración.', genres: ['Techno'] }
  action.value = ''
}
onMounted(() => {
  allowed.value = config.public.appEnv === 'staging' && (window.location.hostname.startsWith('pr-') || ['localhost', '127.0.0.1', 'staging.cuebooker.com'].includes(window.location.hostname))
})
useHead({ title: 'Agency setup preview | Cuebooker', meta: [{ name: 'robots', content: 'noindex,nofollow' }] })
</script>

<template>
  <main class="setup-preview">
    <template v-if="allowed">
      <header><NuxtLink to="/preview-agency/" aria-label="Cuebooker"><CueBrand /></NuxtLink><CuePreferencesControl compact /></header>
      <p class="setup-preview__notice">{{ es ? 'PREVIEW / SIMULACIÓN. Los botones no guardan datos, conectan correo ni crean reservas reales.' : 'PREVIEW / SIMULATION. Buttons do not save real data, connect email or create real bookings.' }}</p>
      <nav :aria-label="es ? 'Escenarios de preparación' : 'Setup scenarios'"><button type="button" @click="reset">{{ es ? 'Nueva agencia' : 'New agency' }}</button><button type="button" @click="ready">{{ es ? 'Preparación completa' : 'Setup complete' }}</button><button type="button" @click="ready(); demo.hasBooking = true">{{ es ? 'Primera solicitud recibida' : 'First enquiry received' }}</button></nav>
      <AgencySetupPanel workspace-id="preview-only" :artists="[]" :locale="locale" :demo-state="demo" @settings="action = $event" @add-artist="action = 'artist'" @edit-artist="action = 'artist'" @capture="demo.hasBooking = true; action = ''" />
      <section v-if="action" class="setup-preview__action" role="status"><p>{{ es ? 'En el workspace este botón abre la pantalla correspondiente. Aquí puedes simular que completas y guardas el paso.' : 'In the workspace this button opens the corresponding screen. Here you can simulate completing and saving this step.' }}</p><button type="button" @click="simulateSave">{{ es ? 'Simular paso guardado' : 'Simulate saved step' }}</button></section>
      <section v-if="demo.hasBooking" class="setup-preview__action"><h1>{{ es ? 'Tu agencia ya está operativa.' : 'Your agency is now operating.' }}</h1><p>{{ es ? 'La primera solicitud elimina el bloque de preparación y mantiene el resumen habitual de la agencia.' : 'The first enquiry removes setup and leaves the regular agency overview.' }}</p><NuxtLink to="/preview-agency/">{{ es ? 'Ver Resumen de Agencia' : 'View Agency Overview' }}</NuxtLink></section>
    </template>
    <p v-else>{{ es ? 'Esta preview solo está disponible en staging.' : 'This preview is only available in staging.' }}</p>
  </main>
</template>

<style scoped>
.setup-preview { box-sizing:border-box; max-width:1000px; margin:0 auto; padding:24px; color:var(--cue-text); }
.setup-preview header { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:28px; }
.setup-preview header a { max-width:200px; }
.setup-preview__notice { padding:16px; border-left:3px solid var(--cue-accent); background:var(--cue-surface); color:var(--cue-muted); font:700 12px/1.5 monospace; }
.setup-preview nav { display:flex; flex-wrap:wrap; gap:8px; margin:24px 0; }
.setup-preview button { min-height:44px; padding:10px 14px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-control,8px); background:var(--cue-surface); color:var(--cue-text); font-weight:800; cursor:pointer; }
.setup-preview__action { padding:20px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-panel,16px); background:var(--cue-surface); }
.setup-preview__action p { color:var(--cue-muted); line-height:1.5; }
@media(max-width:680px) { .setup-preview { padding:20px 12px; } .setup-preview header a { max-width:160px; } }
</style>
