<script setup lang="ts">
import type { ConnectedMailbox } from '../services/connectedMailboxApi'
const config = useRuntimeConfig()
const { locale } = useCuePreferences()
const allowed = ref(config.public.appEnv === 'staging')
const scenario = ref<'new' | 'connected' | 'email' | 'form' | 'received'>('new')
const notice = ref('')
const es = computed(() => locale.value === 'es')
const demoConnections = computed<ConnectedMailbox[]>(() => ['connected', 'email'].includes(scenario.value) ? [{ id: 'fictional', email: 'dj@example.invalid', provider: 'demo', status: 'connected', connectedAt: '', background: { enabled: scenario.value === 'email', processor: 'demo', since: null } }] : [])
function simulateAction(id: string) {
  const destinations: Record<string, string> = es.value
    ? { profile: 'Abriría la edición del perfil.', mailbox: 'Abriría Ajustes en Tu correo en Cuebooker.', form: 'Abriría los controles de publicación y booking del perfil.', share: 'Copiaría el enlace de booking.', booking: 'Abriría el formulario de primera solicitud.' }
    : { profile: 'Would open the profile editor.', mailbox: 'Would open Your email in Cuebooker in Settings.', form: 'Would open profile publishing and booking controls.', share: 'Would copy the booking link.', booking: 'Would open the first enquiry form.' }
  notice.value = destinations[id] || ''
}
onMounted(() => {
  allowed.value = config.public.appEnv === 'staging' && (window.location.hostname.startsWith('pr-') || ['localhost', '127.0.0.1', 'staging.cuebooker.com'].includes(window.location.hostname))
})
useHead({ title: 'DJ setup preview | Cuebooker', meta: [{ name: 'robots', content: 'noindex,nofollow' }] })
</script>

<template>
  <main v-if="allowed" class="preview-page">
    <header><CueBrand /><CuePreferencesControl compact /></header>
    <p class="preview-notice">{{ es ? 'PREVIEW / SIMULACIÓN. No guarda datos, conecta buzones ni crea solicitudes reales.' : 'PREVIEW / SIMULATION. Does not save data, connect mailboxes or create real enquiries.' }}</p>
    <nav :aria-label="es ? 'Escenarios de preparación' : 'Setup scenarios'">
      <button v-for="item in ([{id:'new',es:'Nuevo DJ',en:'New DJ'},{id:'connected',es:'Correo sin detección',en:'Email without detection'},{id:'email',es:'Correo preparado',en:'Email ready'},{id:'form',es:'Formulario público',en:'Public form'},{id:'received',es:'Primera solicitud',en:'First enquiry'}] as const)" :key="item.id" type="button" :aria-pressed="scenario === item.id" @click="scenario = item.id; notice = ''">{{ es ? item.es : item.en }}</button>
    </nav>
    <IndividualSetupPanel v-if="scenario !== 'received'" workspace-id="preview-only" :locale="locale" :revision="0" :profile-ready="scenario !== 'new'" :published="scenario === 'form'" :accepting-requests="scenario === 'form'" booking-url="https://example.invalid/dj?booking=1" :demo-connections="demoConnections" @action="simulateAction" />
    <p v-else>{{ es ? 'La primera solicitud ya existe: el workspace muestra su resumen habitual sin onboarding.' : 'The first enquiry exists: the workspace shows its normal overview without onboarding.' }}</p>
    <p v-if="notice" role="status">{{ notice }}</p>
  </main>
</template>

<style scoped>
.preview-page{box-sizing:border-box;max-width:1000px;margin:auto;padding:24px 16px;color:var(--cue-text)}
.preview-page header{display:flex;justify-content:space-between;align-items:center;gap:16px}
.preview-notice{padding:16px;border-left:3px solid var(--cue-accent);background:var(--cue-surface);color:var(--cue-muted);font:700 12px/1.5 monospace}
.preview-page nav{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}
.preview-page nav button{min-height:44px;padding:10px 14px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-control,8px);background:var(--cue-surface);color:var(--cue-text);font:inherit;cursor:pointer}
.preview-page nav button[aria-pressed="true"]{border-color:var(--cue-accent)}
.preview-page button:focus-visible{outline:2px solid var(--cue-accent);outline-offset:3px}
</style>
