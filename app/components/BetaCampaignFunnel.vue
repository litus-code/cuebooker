<script setup lang="ts">
import { campaignConversion, type CampaignReport } from '../domain/campaignAnalytics'
const telemetry = useProductTelemetry()
const { locale } = useCuePreferences()
const es = computed(()=>locale.value === 'es')
const today = new Date().toISOString().slice(0,10)
const start = ref(new Date(Date.now()-29*86400000).toISOString().slice(0,10))
const end = ref(today)
const source = ref(''), origin = ref(''), campaign = ref(''), referral = ref(''), dataset = ref('live')
const applied = ref('')
const report = ref<CampaignReport | null>(null), loading = ref(false), error = ref('')
const otherDataset = computed(() => report.value?.dataset === 'live' ? 'test' : 'live')
const otherEvents = computed(() => report.value?.available_datasets?.[otherDataset.value] ?? null)
const datasetName = (value: string) => value === 'test' ? (es.value ? 'Pruebas' : 'Test') : (es.value ? 'Real' : 'Live')
async function loadOtherDataset() { dataset.value = otherDataset.value; await load() }
const steps = computed<Record<string,string>>(()=> es.value ? {visit:'Visita',interest:'Interés',registration:'Registro',onboarding:'Configuración',publication:'Publicación',activation:'Primera solicitud'} : {visit:'Visit',interest:'Interest',registration:'Registration',onboarding:'Onboarding',publication:'Publication',activation:'First enquiry'})
const units = computed<Record<string,string>>(()=> es.value ? {visitors:'navegadores',users:'cuentas',workspaces:'workspaces'} : {visitors:'browsers',users:'accounts',workspaces:'workspaces'})
let request = 0
async function load() {
 const current = ++request
 error.value='';report.value=null;loading.value=true
 try {
  const to = new Date(end.value+'T00:00:00Z');to.setUTCDate(to.getUTCDate()+1)
  const appliedLabel = `${start.value} → ${end.value} UTC · source: ${source.value||'—'} · utm_source: ${origin.value.trim()||'—'} · utm_campaign: ${campaign.value.trim()||'—'} · ref: ${referral.value.trim()||'—'}`
  const next = await telemetry.getCampaignFunnel({from_at:new Date(start.value+'T00:00:00Z').toISOString(),to_at:to.toISOString(),filter_source:source.value||null,filter_utm_source:origin.value.trim()||null,filter_campaign:campaign.value.trim()||null,filter_ref:referral.value.trim()||null,filter_dataset:dataset.value})
  if (current===request) { report.value=next; applied.value=appliedLabel }
 } catch {
  if(current===request) error.value=es.value?'No se puede consultar el embudo. Comprueba permisos y si la migración de campaña está desplegada. No se sustituyen datos ausentes por cifras simuladas.':'The funnel cannot be queried. Check permissions and whether the campaign migration is deployed. Missing data is never replaced with simulated figures.'
 } finally { if(current===request) loading.value=false }
}
onMounted(load)
</script>
<template>
 <section class="campaign-funnel" :aria-label="es?'Embudo de campaña':'Campaign funnel'">
  <h2>{{ es?'De la visita a la primera solicitud':'From visit to first enquiry' }}</h2>
  <p>{{ es?'Solo analítica con consentimiento, desde su implantación. Las visitas y los clics son eventos; un visitante es un navegador con identificador aleatorio, no una persona. Las cuentas registradas son cuentas realmente creadas según el servidor; no significa que su email esté confirmado.':'Consented analytics only, since implementation. Visits and clicks are events; a visitor is a browser with a random identifier, not a person. Registered accounts are accounts actually created according to the server; this does not mean their email is confirmed.' }}</p>
  <form class="campaign-funnel__filters" @submit.prevent="load">
   <label>{{ es?'Desde (UTC)':'From (UTC)' }}<input v-model="start" type="date" required :max="end"></label>
   <label>{{ es?'Hasta, inclusive (UTC)':'Through, inclusive (UTC)' }}<input v-model="end" type="date" required :min="start" :max="today"></label>
   <label>{{ es?'Destino / source':'Destination / source' }}<select v-model="source"><option value="">{{ es?'Todos':'All' }}</option><option value="dj">DJ</option><option value="agency">Agency</option></select></label>
   <label>utm_source<input v-model="origin" maxlength="128" placeholder="instagram" pattern="[a-zA-Z0-9_.~\-]*"></label>
   <label>utm_campaign<input v-model="campaign" maxlength="128" placeholder="beta_launch" pattern="[a-zA-Z0-9_.~\-]*"></label>
   <label>{{ es?'Referencia / ref':'Referral / ref' }}<input v-model="referral" maxlength="128" pattern="[a-zA-Z0-9_.~\-]*"></label>
   <label>{{ es?'Conjunto de datos':'Dataset' }}<select v-model="dataset"><option value="live">{{ es?'Real':'Live' }}</option><option value="test">{{ es?'Pruebas (separado)':'Test (separate)' }}</option></select></label>
   <button :disabled="loading" type="submit">{{ loading ? (es?'Consultando…':'Loading…') : (es?'Aplicar filtros':'Apply filters') }}</button>
  </form>
  <p v-if="error" role="status">{{ error }}</p>
  <template v-if="report">
   <p class="campaign-funnel__dataset">{{ report.dataset === 'test' ? (es?'DATOS DE PRUEBA · EXCLUIDOS DEL CONJUNTO REAL':'TEST DATA · EXCLUDED FROM LIVE DATA') : (es?'DATOS REALES · NO INCLUYE PRUEBAS NI HISTÓRICO SIN ATRIBUCIÓN':'LIVE DATA · EXCLUDES TESTS AND UNATTRIBUTED HISTORY') }}</p>
   <p class="campaign-funnel__applied">{{ es?'Filtros aplicados:':'Applied filters:' }} {{ applied }}</p>
   <p v-if="report.collection_dataset" class="campaign-funnel__collection" role="status">{{ es?'Recogida actual para nuevos navegadores:':'Current collection for new browsers:' }} <strong>{{ datasetName(report.collection_dataset) }}</strong>. {{ es?'Cambiar el filtro solo consulta datos; no activa la recogida real ni reclasifica navegadores anteriores.':'Changing the filter only queries data; it does not activate live collection or reclassify existing browsers.' }}</p>
   <p v-else role="status">{{ es?'Esta versión del backend no informa del modo de recogida. Si no ves datos, consulta también el otro conjunto y verifica la configuración con un administrador.':'This backend version does not report collection mode. If no data appears, also check the other dataset and verify configuration with an administrator.' }}</p>
   <p v-if="!report.rows.some(row=>row.events)" role="status">{{ es?'Sin datos para estos filtros.':'No data for these filters.' }}</p>
   <p v-if="otherEvents !== null">{{ es?'Eventos del embudo en el otro conjunto con estos mismos filtros:':'Funnel events in the other dataset with these same filters:' }} {{ otherEvents }} ({{ datasetName(otherDataset) }}).</p>
   <button type="button" :disabled="loading" @click="loadOtherDataset">{{ es?'Consultar':'Query' }} {{ datasetName(otherDataset) }}</button>
   <div class="campaign-funnel__table" tabindex="0" role="region" :aria-label="es?'Métricas por paso':'Metrics by step'"><table><caption>{{ es?'Unidades por paso. — significa que la unidad no corresponde.':'Units per step. — means the unit does not apply.' }}</caption><thead><tr><th>{{ es?'Paso':'Step' }}</th><th>{{ es?'Eventos totales':'Total events' }}</th><th>{{ es?'Navegadores distintos':'Distinct browsers' }}</th><th>{{ es?'Cuentas registradas':'Registered accounts' }}</th><th>Workspaces</th></tr></thead><tbody>
    <tr v-for="row in report.rows" :key="row.step"><th scope="row">{{ steps[row.step] }}</th><td>{{ row.events }}</td><td>{{ ['visit','interest','registration'].includes(row.step)?row.visitors:'—' }}</td><td>{{ ['registration','onboarding'].includes(row.step)?row.users:'—' }}</td><td>{{ ['onboarding','publication','activation'].includes(row.step)?row.workspaces:'—' }}</td></tr>
   </tbody></table></div>
   <p v-if="report.registration_attempts" class="campaign-funnel__attempts">{{ es?'Envíos del formulario de registro:':'Registration form submissions:' }} {{ report.registration_attempts.events }} · {{ report.registration_attempts.visitors }} {{ es?'navegadores distintos. Son intentos, no cuentas creadas.':'distinct browsers. These are attempts, not created accounts.' }}</p>
   <p v-else>{{ es?'Los intentos de registro no se desglosan en esta versión del backend.':'Registration attempts are not broken down by this backend version.' }}</p>
   <p v-if="report.registration_confirmation" class="campaign-funnel__confirmation">{{ es?'Email de las cuentas registradas del periodo, estado actual:':'Email for accounts registered in this period, current status:' }} {{ report.registration_confirmation.confirmed }} {{ es?'confirmadas':'confirmed' }} · {{ report.registration_confirmation.pending }} {{ es?'pendientes de confirmar':'pending confirmation' }}. {{ es?'Confirmar el email después no crea otro registro.':'Confirming email later does not create another registration.' }}</p>
   <p v-else>{{ es?'Desglose de confirmación del email no disponible en esta versión del backend. No se deduce a partir de clics ni inicios de sesión.':'Email confirmation breakdown is unavailable in this backend version. It is not inferred from clicks or sign-ins.' }}</p>
   <p>{{ es?'Publicación: primer perfil o catálogo publicado por workspace. Activación: primera solicitud recibida por formulario público o importación real de correo; excluye capturas manuales. Cada workspace cuenta una vez, aunque la agencia tenga varios miembros.':'Publication: first profile or catalogue published per workspace. Activation: first enquiry received through the public form or actual email import; excludes manual captures. Each workspace counts once, even when an agency has several members.' }}</p>
   <h3>{{ es?'Conversiones observables':'Observable conversions' }}</h3>
   <ul class="campaign-funnel__conversions"><li v-for="item in report.conversions" :key="item.from_step"><strong>{{ steps[item.from_step] }} → {{ steps[item.to_step] }}</strong><span>{{ campaignConversion(item.numerator,item.denominator) === null ? (es?'Sin datos':'No data') : `${campaignConversion(item.numerator,item.denominator)}%` }} · {{ item.numerator }}/{{ item.denominator }} {{ units[item.unit] }}</span></li></ul>
   <p>{{ es?'Cada porcentaje compara la misma unidad en ambos pasos y exige orden temporal dentro del periodo. No une visitas a cuentas mediante emails: solo un token aleatorio vinculado al crear una cuenta permite esa relación. Configuración → publicación compara workspaces; registro → configuración compara cuentas. No es una conversión global de campaña ni atribución histórica.':'Each percentage compares the same unit at both steps and requires time order within the period. Visits are never joined to accounts by email: only a random token linked during account creation enables that relationship. Onboarding → publication compares workspaces; registration → onboarding compares accounts. This is not a global campaign conversion or historical attribution.' }}</p>
   <h3>{{ es?'Página, ubicación y audiencia de entrada':'Page, placement and entry audience' }}</h3>
   <p>{{ es?'DJ/Agency en el registro indica la ruta de entrada, no confirma el tipo de cuenta elegido después. El filtro source es ese destino; utm_source es el origen de campaña.':'DJ/Agency at registration is the entry route, not confirmation of the account type chosen afterwards. The source filter is that destination; utm_source is the campaign origin.' }}</p>
   <div class="campaign-funnel__table" tabindex="0" role="region" :aria-label="es?'Detalle de campaña':'Campaign detail'"><table><thead><tr><th>{{ es?'Paso':'Step' }}</th><th>{{ es?'Página':'Page' }}</th><th>{{ es?'Ubicación':'Placement' }}</th><th>source</th><th>{{ es?'Tipo elegido':'Chosen type' }}</th><th>{{ es?'Eventos':'Events' }}</th><th>{{ es?'Navegadores':'Browsers' }}</th><th>{{ es?'Cuentas':'Accounts' }}</th></tr></thead><tbody><tr v-for="(row,i) in report.breakdown" :key="i"><td>{{ steps[row.step] }}</td><td>{{ row.page }}</td><td>{{ row.placement }}</td><td>{{ row.audience }}</td><td>{{ row.account_type === 'unknown' ? (es?'Pendiente / sin datos':'Pending / no data') : row.account_type }}</td><td>{{ row.events }}</td><td>{{ row.visitors }}</td><td>{{ row.step === 'registration' ? row.users : '—' }}</td></tr></tbody></table></div>
  </template>
 </section>
</template>
<style scoped>
.campaign-funnel{padding:24px;border:1px solid var(--cue-border);background:var(--cue-surface);min-width:0}.campaign-funnel h2{font-size:clamp(24px,3vw,40px);letter-spacing:-.035em}.campaign-funnel p{max-width:1000px;color:var(--cue-muted);font-size:13px;line-height:1.7}.campaign-funnel__filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-block:24px}.campaign-funnel label{display:grid;gap:8px;font-size:12px;min-width:0}.campaign-funnel input,.campaign-funnel select,.campaign-funnel button{min-height:44px;box-sizing:border-box;width:100%;border:1px solid var(--cue-border);border-radius:8px;padding:8px;background:var(--cue-bg);color:var(--cue-text);font:inherit;min-width:0}.campaign-funnel button{background:var(--cue-accent);color:var(--cue-accent-ink);font-weight:800;align-self:end;cursor:pointer}.campaign-funnel button:disabled{opacity:.6}.campaign-funnel__table{max-width:100%;overflow-x:auto}.campaign-funnel table{min-width:650px;width:100%;border-collapse:collapse;font-size:12px}.campaign-funnel th,.campaign-funnel td{text-align:left;border-bottom:1px solid var(--cue-border);padding:12px}.campaign-funnel caption{text-align:left;color:var(--cue-muted);padding:12px 0}.campaign-funnel__conversions{list-style:none;padding:0;display:grid;gap:12px}.campaign-funnel__conversions li{display:flex;justify-content:space-between;gap:12px;padding:12px;border:1px solid var(--cue-border);font-size:13px}.campaign-funnel__dataset{font-weight:800;color:var(--cue-accent)!important}.campaign-funnel__applied{overflow-wrap:anywhere}.campaign-funnel :focus-visible{outline:2px solid var(--cue-accent);outline-offset:3px}
@media(max-width:800px){.campaign-funnel__filters{grid-template-columns:1fr 1fr}.campaign-funnel{padding:16px}.campaign-funnel__conversions li{flex-direction:column}}
@media(max-width:450px){.campaign-funnel__filters{grid-template-columns:1fr}}
</style>
