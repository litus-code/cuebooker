<script setup lang="ts">
import type { ConnectedMailbox } from '../services/connectedMailboxApi'

const props = defineProps<{
  workspaceId: string
  locale: 'es' | 'en'
  revision: number
  profileReady: boolean
  published: boolean
  acceptingRequests: boolean
  bookingUrl: string
  demoConnections?: ConnectedMailbox[]
}>()
const emit = defineEmits<{ action: [id: 'profile' | 'mailbox' | 'form' | 'share' | 'booking'] }>()
const mailbox = useConnectedMailbox()
const loading = ref(true)
const unknown = ref(false)
const connections = ref<ConnectedMailbox[]>([])
const es = computed(() => props.locale === 'es')
const connected = computed(() => connections.value.some(item => item.status === 'connected'))
// A connected account alone does not grant consent to automatic detection.
const detectionReady = computed(() => connections.value.some(item => item.status === 'connected' && item.background?.enabled))
const formReady = computed(() => props.published && props.acceptingRequests && Boolean(props.bookingUrl))
const receivingReady = computed(() => detectionReady.value || formReady.value)
let generation = 0
async function load() {
  const turn = ++generation
  loading.value = true
  unknown.value = false
  connections.value = []
  if (props.demoConnections) {
    connections.value = props.demoConnections
    loading.value = false
    return
  }
  if (!props.workspaceId) { loading.value = false; return }
  try {
    const saved = await mailbox.status(props.workspaceId)
    if (turn === generation) connections.value = saved.connections
  } catch {
    if (turn === generation) unknown.value = true
  } finally {
    if (turn === generation) loading.value = false
  }
}
watch(() => [props.workspaceId, props.revision, props.demoConnections], load, { immediate: true, deep: true })
onBeforeUnmount(() => { generation++ })
</script>

<template>
  <section class="individual-setup" aria-labelledby="individual-setup-title">
    <header><p>{{ es ? 'PRIMEROS PASOS / DJ' : 'GETTING STARTED / DJ' }}</p><h2 id="individual-setup-title">{{ es ? 'Prepara tu workspace' : 'Prepare your workspace' }}</h2><p>{{ es ? 'Elige cómo recibir tus solicitudes. Puedes trabajar con tu perfil privado y registrar una solicitud manual en cualquier momento.' : 'Choose how to receive enquiries. You can keep your profile private and record a manual enquiry at any time.' }}</p></header>
    <ol>
      <li :class="{ 'is-complete': profileReady }"><SetupStepMarker :complete="profileReady" index="01" /><div><small>{{ profileReady ? (es ? 'Completado' : 'Complete') : (es ? 'Pendiente' : 'Pending') }}</small><h3>{{ es ? 'Completa tu perfil' : 'Complete your profile' }}</h3><p>{{ es ? 'Añade tu información profesional. Completarla no publica tu perfil.' : 'Add your professional details. Completing them does not publish your profile.' }}</p><button type="button" @click="emit('action', 'profile')">{{ es ? 'Completar perfil' : 'Complete profile' }}</button></div></li>
      <li :class="{ 'is-complete': receivingReady }"><SetupStepMarker :complete="receivingReady" index="02" /><div><small>{{ receivingReady ? (es ? 'Preparado' : 'Ready') : (es ? 'Opcional' : 'Optional') }}</small><h3>{{ es ? 'Elige cómo recibir solicitudes' : 'Choose how to receive enquiries' }}</h3><p>{{ es ? 'Conecta el buzón donde recibes ofertas y autoriza la detección automática en Ajustes. Cuebooker crea las solicitudes detectadas y conserva la conversación en su booking. No necesitas publicar tu perfil.' : 'Connect the mailbox where you receive offers and authorize automatic detection in Settings. Cuebooker creates detected enquiries and keeps the conversation in their booking. Publishing your profile is not required.' }}</p>
        <p class="individual-setup__status" role="status">{{ loading ? (es ? 'Comprobando correo…' : 'Checking email…') : unknown ? (es ? 'No pudimos comprobar el correo. Puedes revisarlo en Ajustes o reintentar.' : 'We could not check email. Review it in Settings or retry.') : detectionReady ? (es ? 'Correo conectado y detección automática activada.' : 'Email connected and automatic detection enabled.') : connected ? (es ? 'Correo conectado. La detección automática aún no está activada.' : 'Email connected. Automatic detection is not enabled yet.') : (es ? 'No hay un buzón conectado.' : 'No mailbox connected.') }}</p>
        <div class="individual-setup__actions"><button type="button" @click="emit('action', 'mailbox')">{{ connected ? (es ? 'Revisar correo' : 'Review email') : (es ? 'Conectar correo' : 'Connect email') }}</button><button v-if="unknown" type="button" @click="load">{{ es ? 'Reintentar' : 'Retry' }}</button></div>
        <p>{{ es ? 'También puedes recibir solicitudes desde tu formulario público. Esta opción requiere publicar el perfil y activar el booking.' : 'You can also receive enquiries through your public form. This option requires publishing your profile and enabling booking requests.' }}</p><button type="button" @click="emit('action', 'form')">{{ formReady ? (es ? 'Revisar formulario' : 'Review form') : (es ? 'Configurar formulario público' : 'Set up public form') }}</button>
      </div></li>
      <li><SetupStepMarker :complete="false" index="03" /><div><small>{{ es ? 'Opcional / formulario público' : 'Optional / public form' }}</small><h3>{{ es ? 'Comparte tu enlace' : 'Share your link' }}</h3><p>{{ formReady ? (es ? 'Pon el enlace en tu bio, web o firma de correo para recibir solicitudes en Cuebooker.' : 'Add the link to your bio, website or email signature to receive enquiries in Cuebooker.') : (es ? 'Este paso solo hace falta si eliges el formulario público. Puedes omitirlo si trabajas por correo o registras solicitudes manualmente.' : 'This step is only needed if you choose the public form. Skip it when working through email or recording enquiries manually.') }}</p><template v-if="formReady"><button type="button" @click="emit('action', 'share')">{{ es ? 'Copiar enlace de booking' : 'Copy booking link' }}</button><code>{{ bookingUrl }}</code></template></div></li>
    </ol>
    <footer><p>{{ es ? 'Estos pasos desaparecerán cuando recibas o registres tu primera solicitud.' : 'These steps disappear when you receive or record your first enquiry.' }}</p><button type="button" :disabled="!workspaceId" @click="emit('action', 'booking')">{{ es ? 'Registrar primera solicitud' : 'Record first enquiry' }}</button></footer>
  </section>
</template>

<style scoped>
.individual-setup{box-sizing:border-box;margin-bottom:24px;padding:24px;border:1px solid var(--cue-accent);border-radius:var(--cue-radius-panel,16px);background:var(--cue-surface);color:var(--cue-text)}
.individual-setup header>p:first-child,.individual-setup small{color:var(--cue-accent);font:800 10px/1.4 monospace;letter-spacing:.08em;text-transform:uppercase}
.individual-setup h2{margin:8px 0;font-size:clamp(24px,5vw,36px);line-height:1.1}
.individual-setup p{font-size:14px;line-height:1.5;color:var(--cue-muted)}
.individual-setup ol{list-style:none;padding:0;margin:24px 0}
.individual-setup li{display:grid;grid-template-columns:32px minmax(0,1fr);gap:12px;padding:20px 0;border-top:1px solid var(--cue-border)}
.individual-setup li>span{color:var(--cue-muted);font:800 16px/1.3 monospace}
.individual-setup .is-complete h3{color:var(--cue-muted)}
.individual-setup .is-complete small{opacity:.75}
.individual-setup h3{margin:6px 0;font-size:18px;line-height:1.3}
.individual-setup button{min-height:44px;padding:10px 14px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-control,8px);background:transparent;color:var(--cue-text);font:inherit;font-weight:800;cursor:pointer}
.individual-setup button:focus-visible{outline:2px solid var(--cue-accent);outline-offset:3px}
.individual-setup button:disabled{opacity:.5;cursor:not-allowed}
.individual-setup__actions{display:flex;flex-wrap:wrap;gap:8px}
.individual-setup code{display:block;margin-top:12px;font-size:12px;overflow-wrap:anywhere}
.individual-setup footer{border-top:1px solid var(--cue-border);padding-top:16px}
.individual-setup footer button{background:var(--cue-accent);color:var(--cue-accent-ink);border-color:var(--cue-accent)}
@media(max-width:680px){.individual-setup{padding:18px 16px}.individual-setup button{width:100%}}
</style>
