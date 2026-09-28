<script setup lang="ts">
import type { BetaAnalyticsSummary, BetaAnalyticsUser } from '../composables/useProductTelemetry'

definePageMeta({ ssr: false })

const auth = useCueAuth()
const telemetry = useProductTelemetry()
const router = useRouter()

const days = ref(30)
const loading = ref(true)
const authorized = ref(false)
const errorMessage = ref('')
const activeTab = ref<'overview' | 'users'>('overview')
const summary = ref<BetaAnalyticsSummary | null>(null)
const users = ref<BetaAnalyticsUser[]>([])
const selectedUser = ref<BetaAnalyticsUser | null>(null)
const query = ref('')
const accountFilter = ref<'all' | 'artist' | 'agency' | 'unknown'>('all')
const activityFilter = ref<'all' | 'active' | 'inactive' | 'pending'>('all')

const filteredUsers = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return users.value.filter(user => {
    if (needle && ![user.display_name, user.email, user.account_type].some(value => String(value || '').toLowerCase().includes(needle))) return false
    if (accountFilter.value !== 'all' && !user.account_type.includes(accountFilter.value)) return false
    if (activityFilter.value === 'pending' && user.onboarding_completed) return false
    if (activityFilter.value === 'active' && !isRecent(user.last_activity, days.value)) return false
    if (activityFilter.value === 'inactive' && isRecent(user.last_activity, days.value)) return false
    return true
  })
})

const smartApplyRate = computed(() => {
  const total = summary.value?.smart_capture_results || 0
  return total ? Math.round(((summary.value?.smart_capture_applied || 0) / total) * 100) : 0
})

const automationCompletionRate = computed(() => {
  const total = summary.value?.automations_created || 0
  return total ? Math.round(((summary.value?.automations_completed || 0) / total) * 100) : 0
})

function isRecent(value: string | null, windowDays: number) {
  if (!value) return false
  const ts = Date.parse(value)
  return Number.isFinite(ts) && Date.now() - ts <= windowDays * 86400000
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value))
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

async function loadDashboard() {
  loading.value = true
  errorMessage.value = ''
  try {
    await auth.initialize()
    if (!auth.signedIn.value) {
      await router.replace('/login')
      return
    }

    authorized.value = await telemetry.isInternalAdmin()
    if (!authorized.value) return

    const [nextSummary, nextUsers] = await Promise.all([
      telemetry.getBetaSummary(days.value),
      telemetry.getBetaUsers(days.value)
    ])
    summary.value = nextSummary
    users.value = nextUsers
  } catch (error: any) {
    errorMessage.value = String(error?.data?.message || error?.message || 'No se ha podido cargar Beta Analytics.')
  } finally {
    loading.value = false
  }
}

watch(days, () => { void loadDashboard() })
onMounted(() => { void loadDashboard() })
</script>

<template>
  <main class="beta-analytics">
    <header class="beta-analytics__topbar">
      <NuxtLink class="beta-analytics__brand" to="/workspace" aria-label="Volver al workspace">
        <CueBrand decorative />
      </NuxtLink>
      <div class="beta-analytics__topbar-meta">
        <span>INTERNAL / BETA</span>
        <strong>Analytics</strong>
      </div>
      <NuxtLink class="beta-analytics__back" to="/workspace">Volver al workspace</NuxtLink>
    </header>

    <section v-if="loading" class="beta-analytics__loading" aria-busy="true">
      <CueBrand class="beta-analytics__loading-logo" decorative />
      <div class="beta-analytics__pulse" aria-hidden="true"><i /><i /><i /></div>
    </section>

    <section v-else-if="!authorized" class="beta-analytics__gate">
      <p>INTERNAL ACCESS</p>
      <h1>Esta vista está reservada al equipo de Cuebooker.</h1>
      <span>La cuenta actual no tiene permisos de analytics interno.</span>
      <NuxtLink to="/workspace">Volver al workspace</NuxtLink>
    </section>

    <section v-else class="beta-analytics__content">
      <div class="beta-analytics__hero">
        <div>
          <p>BETA ANALYTICS</p>
          <h1>QUÉ ESTÁ PASANDO<br>EN CUEBOOKER.</h1>
          <span>Datos operativos para validar uso real antes de monetizar.</span>
        </div>

        <label class="beta-analytics__window">
          <span>PERIODO</span>
          <select v-model.number="days">
            <option :value="7">7 días</option>
            <option :value="30">30 días</option>
            <option :value="90">90 días</option>
          </select>
        </label>
      </div>

      <nav class="beta-analytics__tabs" aria-label="Beta analytics">
        <button type="button" :class="{ active: activeTab === 'overview' }" @click="activeTab = 'overview'">Overview</button>
        <button type="button" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'">Usuarios <small>{{ users.length }}</small></button>
      </nav>

      <p v-if="errorMessage" class="beta-analytics__error">{{ errorMessage }}</p>

      <template v-if="activeTab === 'overview' && summary">
        <section class="beta-analytics__kpis">
          <article><span>Usuarios totales</span><strong>{{ summary.users_total }}</strong><small>+{{ summary.users_new }} en {{ summary.window_days }}d</small></article>
          <article><span>Activos</span><strong>{{ summary.active_users }}</strong><small>Actividad operacional</small></article>
          <article><span>Onboarding</span><strong>{{ summary.onboarding_completed }}</strong><small>Completados</small></article>
          <article><span>Bookings</span><strong>{{ summary.bookings_created }}</strong><small>{{ summary.bookings_confirmed }} confirmados</small></article>
        </section>

        <section class="beta-analytics__features">
          <article>
            <header><span>SMART CUE</span><strong>{{ summary.smart_capture_started }}</strong></header>
            <div class="beta-analytics__feature-grid">
              <p><b>{{ summary.smart_capture_results }}</b><span>Resultados</span></p>
              <p><b>{{ summary.smart_capture_applied }}</b><span>Aplicados</span></p>
              <p><b>{{ summary.smart_capture_discarded }}</b><span>Descartados</span></p>
              <p><b>{{ smartApplyRate }}%</b><span>Apply rate</span></p>
            </div>
          </article>

          <article>
            <header><span>EVENT MEDIA</span><strong>{{ summary.media_linked }}</strong></header>
            <div class="beta-analytics__feature-grid beta-analytics__feature-grid--two">
              <p><b>{{ summary.media_linked }}</b><span>Media vinculada</span></p>
              <p><b>{{ summary.media_failures }}</b><span>Errores</span></p>
            </div>
          </article>

          <article>
            <header><span>AUTOMATIZACIONES</span><strong>{{ summary.automations_created }}</strong></header>
            <div class="beta-analytics__feature-grid beta-analytics__feature-grid--three">
              <p><b>{{ summary.automations_created }}</b><span>Creadas</span></p>
              <p><b>{{ summary.automations_completed }}</b><span>Completadas</span></p>
              <p><b>{{ automationCompletionRate }}%</b><span>Completion</span></p>
            </div>
          </article>
        </section>
      </template>

      <template v-else-if="activeTab === 'users'">
        <section class="beta-analytics__users-tools">
          <label>
            <span>BUSCAR</span>
            <input v-model="query" type="search" placeholder="Nombre o email">
          </label>
          <label>
            <span>TIPO</span>
            <select v-model="accountFilter">
              <option value="all">Todos</option>
              <option value="artist">Artist</option>
              <option value="agency">Agency</option>
              <option value="unknown">Sin clasificar</option>
            </select>
          </label>
          <label>
            <span>ESTADO</span>
            <select v-model="activityFilter">
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
              <option value="pending">Onboarding pendiente</option>
            </select>
          </label>
        </section>

        <section class="beta-analytics__users">
          <div class="beta-analytics__table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Tipo</th>
                  <th>Alta</th>
                  <th>Onboarding</th>
                  <th>Bookings</th>
                  <th>Smart CUE</th>
                  <th>Media</th>
                  <th>Autom.</th>
                  <th>Última actividad</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in filteredUsers" :key="user.user_id" tabindex="0" @click="selectedUser = user" @keydown.enter="selectedUser = user">
                  <td><strong>{{ user.display_name || 'Sin nombre' }}</strong><small>{{ user.email }}</small></td>
                  <td><span class="beta-analytics__type">{{ user.account_type }}</span></td>
                  <td>{{ formatDate(user.registered_at) }}</td>
                  <td><span :class="['beta-analytics__status', user.onboarding_completed ? 'is-ok' : 'is-pending']">{{ user.onboarding_completed ? 'Completo' : 'Pendiente' }}</span></td>
                  <td>{{ user.bookings }}</td>
                  <td>{{ user.smart_cue }}</td>
                  <td>{{ user.media }}</td>
                  <td>{{ user.automations }}</td>
                  <td>{{ formatDateTime(user.last_activity) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p v-if="!filteredUsers.length" class="beta-analytics__empty">No hay usuarios que coincidan con estos filtros.</p>
        </section>
      </template>
    </section>

    <div v-if="selectedUser" class="beta-user-backdrop" @click.self="selectedUser = null">
      <aside class="beta-user-panel" role="dialog" aria-modal="true">
        <header>
          <div>
            <span>USUARIO / BETA</span>
            <h2>{{ selectedUser.display_name || 'Sin nombre' }}</h2>
            <p>{{ selectedUser.email }}</p>
          </div>
          <button type="button" aria-label="Cerrar" @click="selectedUser = null">×</button>
        </header>
        <div class="beta-user-panel__meta">
          <p><span>Tipo</span><strong>{{ selectedUser.account_type }}</strong></p>
          <p><span>Alta</span><strong>{{ formatDate(selectedUser.registered_at) }}</strong></p>
          <p><span>Onboarding</span><strong>{{ selectedUser.onboarding_completed ? 'Completo' : 'Pendiente' }}</strong></p>
          <p><span>Última actividad</span><strong>{{ formatDateTime(selectedUser.last_activity) }}</strong></p>
        </div>
        <div class="beta-user-panel__usage">
          <article><strong>{{ selectedUser.bookings }}</strong><span>Bookings</span></article>
          <article><strong>{{ selectedUser.smart_cue }}</strong><span>Smart CUE</span></article>
          <article><strong>{{ selectedUser.media }}</strong><span>Media</span></article>
          <article><strong>{{ selectedUser.automations }}</strong><span>Automatizaciones</span></article>
        </div>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.beta-analytics{min-height:100dvh;background:var(--cue-bg);color:var(--cue-text)}
.beta-analytics__topbar{position:sticky;z-index:20;top:0;display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:18px;min-height:64px;padding:0 24px;border-bottom:1px solid var(--cue-border);background:color-mix(in srgb,var(--cue-bg) 92%,transparent);backdrop-filter:blur(18px)}
.beta-analytics__brand{display:flex;width:118px;color:inherit;text-decoration:none}.beta-analytics__brand :deep(svg){width:100%;height:auto}
.beta-analytics__topbar-meta{display:flex;align-items:baseline;gap:9px}.beta-analytics__topbar-meta span{color:var(--cue-accent);font:800 8px monospace;letter-spacing:.12em}.beta-analytics__topbar-meta strong{font-size:11px;text-transform:uppercase}
.beta-analytics__back{color:var(--cue-muted);font:800 8px monospace;text-transform:uppercase;text-decoration:none}.beta-analytics__back:hover{color:var(--cue-accent)}
.beta-analytics__content{width:min(1440px,calc(100% - 48px));margin:0 auto;padding:52px 0 80px}
.beta-analytics__hero{display:flex;justify-content:space-between;align-items:end;gap:24px;padding-bottom:34px}.beta-analytics__hero p{margin:0 0 12px;color:var(--cue-accent);font:900 9px monospace;letter-spacing:.16em}.beta-analytics__hero h1{margin:0;font-size:clamp(40px,6vw,84px);line-height:.86;letter-spacing:-.055em}.beta-analytics__hero>div>span{display:block;margin-top:18px;color:var(--cue-muted);font-size:12px}
.beta-analytics__window{display:grid;gap:7px;min-width:140px}.beta-analytics__window span,.beta-analytics__users-tools label>span{color:var(--cue-muted);font:800 8px monospace;letter-spacing:.08em}.beta-analytics__window select,.beta-analytics__users-tools input,.beta-analytics__users-tools select{min-height:42px;border:1px solid var(--cue-border);border-radius:var(--cue-radius-control);background:var(--cue-surface);color:var(--cue-text);padding:0 11px}
.beta-analytics__tabs{display:flex;border-bottom:1px solid var(--cue-border);margin-bottom:22px}.beta-analytics__tabs button{min-height:48px;padding:0 18px;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--cue-muted);cursor:pointer;font:900 9px monospace;text-transform:uppercase}.beta-analytics__tabs button.active{border-color:var(--cue-accent);color:var(--cue-accent)}.beta-analytics__tabs small{margin-left:5px;opacity:.7}
.beta-analytics__kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid var(--cue-border)}.beta-analytics__kpis article{display:grid;gap:8px;min-height:150px;padding:22px;border-right:1px solid var(--cue-border)}.beta-analytics__kpis article:last-child{border-right:0}.beta-analytics__kpis span{color:var(--cue-muted);font:800 8px monospace;text-transform:uppercase}.beta-analytics__kpis strong{font-size:44px;line-height:1}.beta-analytics__kpis small{color:var(--cue-muted);font-size:9px}
.beta-analytics__features{display:grid;grid-template-columns:1.25fr .8fr .95fr;gap:14px;margin-top:14px}.beta-analytics__features>article{border:1px solid var(--cue-border);background:var(--cue-surface)}.beta-analytics__features header{display:flex;justify-content:space-between;align-items:center;padding:17px 18px;border-bottom:1px solid var(--cue-border)}.beta-analytics__features header span{color:var(--cue-accent);font:900 9px monospace;letter-spacing:.08em}.beta-analytics__features header strong{font-size:24px}
.beta-analytics__feature-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}.beta-analytics__feature-grid--two{grid-template-columns:repeat(2,minmax(0,1fr))}.beta-analytics__feature-grid--three{grid-template-columns:repeat(3,minmax(0,1fr))}.beta-analytics__feature-grid p{display:grid;gap:8px;margin:0;padding:18px;border-right:1px solid var(--cue-border)}.beta-analytics__feature-grid p:last-child{border-right:0}.beta-analytics__feature-grid b{font-size:25px}.beta-analytics__feature-grid span{color:var(--cue-muted);font:700 8px monospace;text-transform:uppercase}
.beta-analytics__users-tools{display:grid;grid-template-columns:minmax(260px,1fr) 180px 220px;gap:10px;margin-bottom:12px}.beta-analytics__users-tools label{display:grid;gap:6px}.beta-analytics__users{border:1px solid var(--cue-border);background:var(--cue-surface)}.beta-analytics__table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:1040px}th,td{padding:13px 14px;border-bottom:1px solid var(--cue-border);text-align:left;font-size:10px}th{position:sticky;top:0;background:var(--cue-raised);color:var(--cue-muted);font:800 8px monospace;text-transform:uppercase}tbody tr{cursor:pointer}tbody tr:hover,tbody tr:focus{outline:none;background:color-mix(in srgb,var(--cue-accent) 5%,transparent)}td strong,td small{display:block}td small{margin-top:3px;color:var(--cue-muted);font-size:8px}.beta-analytics__type,.beta-analytics__status{display:inline-flex;padding:4px 6px;border:1px solid var(--cue-border);border-radius:999px;font:800 7px monospace;text-transform:uppercase}.beta-analytics__status.is-ok{border-color:color-mix(in srgb,var(--cue-accent) 55%,var(--cue-border));color:var(--cue-accent)}.beta-analytics__status.is-pending{color:var(--cue-muted)}.beta-analytics__empty{margin:0;padding:22px;color:var(--cue-muted);font-size:10px}
.beta-analytics__loading,.beta-analytics__gate{display:grid;place-items:center;align-content:center;gap:16px;min-height:calc(100dvh - 64px);text-align:center}.beta-analytics__loading-logo{width:min(220px,52vw)}.beta-analytics__pulse{display:flex;gap:6px}.beta-analytics__pulse i{width:6px;height:6px;border-radius:50%;background:var(--cue-accent);opacity:.25;animation:beta-pulse .9s ease-in-out infinite alternate}.beta-analytics__pulse i:nth-child(2){animation-delay:.15s}.beta-analytics__pulse i:nth-child(3){animation-delay:.3s}@keyframes beta-pulse{to{opacity:1;transform:translateY(-2px)}}.beta-analytics__gate{padding:30px}.beta-analytics__gate p{margin:0;color:var(--cue-accent);font:900 9px monospace}.beta-analytics__gate h1{max-width:760px;margin:0;font-size:clamp(34px,6vw,70px);line-height:.9}.beta-analytics__gate span{color:var(--cue-muted)}.beta-analytics__gate a{color:var(--cue-accent);font:800 9px monospace;text-transform:uppercase}.beta-analytics__error{padding:12px;border:1px solid #7d3434;color:#ff9b9b}
.beta-user-backdrop{position:fixed;z-index:80;inset:0;display:flex;justify-content:flex-end;background:rgba(0,0,0,.7);backdrop-filter:blur(4px)}.beta-user-panel{width:min(520px,100%);height:100%;overflow:auto;border-left:1px solid var(--cue-border);background:var(--cue-bg);color:var(--cue-text)}.beta-user-panel>header{display:flex;justify-content:space-between;gap:16px;padding:26px;border-bottom:1px solid var(--cue-border)}.beta-user-panel>header span{color:var(--cue-accent);font:900 8px monospace;letter-spacing:.1em}.beta-user-panel h2{margin:8px 0 4px;font-size:32px}.beta-user-panel header p{margin:0;color:var(--cue-muted);font-size:10px}.beta-user-panel header button{align-self:start;border:0;background:transparent;color:var(--cue-text);cursor:pointer;font-size:28px}.beta-user-panel__meta{display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--cue-border)}.beta-user-panel__meta p{display:grid;gap:6px;margin:0;padding:18px;border-right:1px solid var(--cue-border);border-bottom:1px solid var(--cue-border)}.beta-user-panel__meta p:nth-child(2n){border-right:0}.beta-user-panel__meta span{color:var(--cue-muted);font:800 8px monospace;text-transform:uppercase}.beta-user-panel__meta strong{font-size:11px}.beta-user-panel__usage{display:grid;grid-template-columns:1fr 1fr;padding:20px;gap:8px}.beta-user-panel__usage article{display:grid;gap:7px;padding:18px;border:1px solid var(--cue-border);background:var(--cue-surface)}.beta-user-panel__usage strong{font-size:30px}.beta-user-panel__usage span{color:var(--cue-muted);font:800 8px monospace;text-transform:uppercase}
@media(max-width:900px){.beta-analytics__content{width:min(100% - 28px,1440px);padding-top:30px}.beta-analytics__hero{align-items:start;flex-direction:column}.beta-analytics__window{width:100%}.beta-analytics__kpis{grid-template-columns:1fr 1fr}.beta-analytics__kpis article:nth-child(2){border-right:0}.beta-analytics__kpis article:nth-child(-n+2){border-bottom:1px solid var(--cue-border)}.beta-analytics__features{grid-template-columns:1fr}.beta-analytics__users-tools{grid-template-columns:1fr 1fr}.beta-analytics__users-tools label:first-child{grid-column:1/-1}}
@media(max-width:620px){.beta-analytics__topbar{grid-template-columns:1fr auto;padding:0 14px}.beta-analytics__topbar-meta{display:none}.beta-analytics__back{font-size:7px}.beta-analytics__hero h1{font-size:44px}.beta-analytics__kpis{grid-template-columns:1fr}.beta-analytics__kpis article{min-height:120px;border-right:0;border-bottom:1px solid var(--cue-border)}.beta-analytics__features .beta-analytics__feature-grid{grid-template-columns:1fr 1fr}.beta-analytics__feature-grid p:nth-child(2n){border-right:0}.beta-analytics__users-tools{grid-template-columns:1fr}.beta-analytics__users-tools label:first-child{grid-column:auto}.beta-user-panel__meta,.beta-user-panel__usage{grid-template-columns:1fr}.beta-user-panel__meta p{border-right:0}.beta-user-panel__usage{padding:14px}}
@media(prefers-reduced-motion:reduce){.beta-analytics__pulse i{animation:none;opacity:.7}}
</style>
