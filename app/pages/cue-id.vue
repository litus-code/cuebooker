<script setup lang="ts">
import {
  cloneCueIdStylizedCreatorConfig,
  cloneValidCueIdStylizedCreatorConfig,
  cueIdStylizedCreatorConfigsEqual,
  DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
  parseCueIdStylizedCreatorConfigV1,
  type CueIdStylizedCreatorConfigV1
} from '../domain/cueIdStylizedCreator'
import { CUE_ID_WORKSPACE_SECTIONS, type CueIdWorkspaceSection } from '../domain/cueIdWorkspace'

const preferences = useCuePreferences()
const route = useRoute()
const router = useRouter()
const fromOnboarding = computed(() => route.query.from === 'onboarding')
const fromWorkspace = computed(() => route.query.from === 'workspace')
const exitTarget = computed(() =>
  fromOnboarding.value
    ? '/workspace?view=profile&setup=profile'
    : fromWorkspace.value
      ? '/workspace?view=cue-id'
      : '/'
)
const cueIdConfig = ref(cloneCueIdStylizedCreatorConfig(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG))
const savedConfig = ref(cloneCueIdStylizedCreatorConfig(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG))
const saveState = ref<'idle' | 'saved' | 'reset' | 'invalid' | 'storage-error'>('idle')
const LAB_DRAFT_KEY = 'cuebooker:cue-id:stylized-v1:lab-draft'
const leaveDialogOpen = ref(false)
const pendingLeaveTarget = ref('')
let allowNextRouteLeave = false

function cueSectionFromQuery(value: unknown): CueIdWorkspaceSection {
  return typeof value === 'string' && CUE_ID_WORKSPACE_SECTIONS.includes(value as CueIdWorkspaceSection)
    ? value as CueIdWorkspaceSection
    : 'identity'
}

const cueSection = computed(() => cueSectionFromQuery(route.query.section))

function handleSectionChange(section: CueIdWorkspaceSection) {
  void router.replace({ query: { ...route.query, section } }).catch(() => {})
}

function openLeaveDialog(target = exitTarget.value) {
  pendingLeaveTarget.value = fromWorkspace.value ? exitTarget.value : target
  leaveDialogOpen.value = true
}

async function leaveWithoutSaving() {
  const target = pendingLeaveTarget.value || exitTarget.value
  leaveDialogOpen.value = false
  allowNextRouteLeave = true
  try {
    await navigateTo(target)
  } finally {
    allowNextRouteLeave = false
  }
}

async function saveAndLeave() {
  saveLabDraft(cueIdConfig.value)
  if (saveState.value === 'invalid' || saveState.value === 'storage-error') return
  const target = pendingLeaveTarget.value || exitTarget.value
  leaveDialogOpen.value = false
  allowNextRouteLeave = true
  try {
    await navigateTo(target)
  } finally {
    allowNextRouteLeave = false
  }
}

async function requestExit() {
  if (dirty.value) {
    openLeaveDialog(exitTarget.value)
    return
  }
  await navigateTo(exitTarget.value)
}

const dirty = computed(() =>
  !cueIdStylizedCreatorConfigsEqual(cueIdConfig.value, savedConfig.value)
)

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return
  event.preventDefault()
  event.returnValue = ''
}

onMounted(() => {
  try {
    const raw = window.localStorage.getItem(LAB_DRAFT_KEY)
    if (raw) {
      const restored = parseCueIdStylizedCreatorConfigV1(raw)
      if (restored) {
        cueIdConfig.value = restored
        savedConfig.value = cloneCueIdStylizedCreatorConfig(restored)
      } else {
        window.localStorage.removeItem(LAB_DRAFT_KEY)
      }
    }
  } catch {
    saveState.value = 'storage-error'
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

function saveLabDraft(value: CueIdStylizedCreatorConfigV1) {
  const saved = cloneValidCueIdStylizedCreatorConfig(value)
  if (!saved) {
    saveState.value = 'invalid'
    window.setTimeout(() => {
      saveState.value = 'idle'
    }, 2200)
    return
  }

  try {
    window.localStorage.setItem(LAB_DRAFT_KEY, JSON.stringify(saved))
    savedConfig.value = saved
    saveState.value = 'saved'
  } catch {
    saveState.value = 'storage-error'
  }

  window.setTimeout(() => {
    saveState.value = 'idle'
  }, saveState.value === 'storage-error' ? 2600 : 1800)
}

function resetLabDraft() {
  if (!window.confirm(copy.value.resetConfirm)) return

  const initial = cloneCueIdStylizedCreatorConfig(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG)
  cueIdConfig.value = initial
  savedConfig.value = cloneCueIdStylizedCreatorConfig(initial)

  try {
    window.localStorage.removeItem(LAB_DRAFT_KEY)
    saveState.value = 'reset'
  } catch {
    saveState.value = 'storage-error'
  }

  window.setTimeout(() => {
    saveState.value = 'idle'
  }, saveState.value === 'storage-error' ? 2600 : 1800)
}

const copy = computed(() => preferences.locale.value === 'es' ? {
  back: 'Volver',
  continueWorkspace: 'Continuar al workspace',
  backProfile: 'Volver',
  lab: 'BETA / LAB',
  status: 'CUE ID · CREATOR V1 LAB',
  saved: 'Draft guardado en este dispositivo',
  reset: 'CUE ID restablecido al estado inicial',
  invalid: 'No se ha guardado: la configuración no es válida',
  storageError: 'No se ha podido acceder al almacenamiento local de este navegador',
  leave: 'Tienes cambios sin guardar en CUE ID.',
  leaveBody: 'Puedes guardarlos antes de volver a Perfil o salir sin guardar.',
  leaveCancel: 'Seguir editando',
  leaveDiscard: 'Salir sin guardar',
  leaveSave: 'Guardar y volver',
  resetConfirm: '¿Restablecer CUE ID? Se eliminará el draft guardado en este dispositivo.'
} : {
  back: 'Back',
  continueWorkspace: 'Continue to workspace',
  backProfile: 'Back',
  lab: 'BETA / LAB',
  status: 'CUE ID · CREATOR V1 LAB',
  saved: 'Draft saved on this device',
  reset: 'CUE ID reset to initial state',
  invalid: 'Not saved: the configuration is invalid',
  storageError: 'Local browser storage could not be accessed',
  leave: 'You have unsaved CUE ID changes.',
  leaveBody: 'Save them before returning to Profile or leave without saving.',
  leaveCancel: 'Keep editing',
  leaveDiscard: 'Leave without saving',
  leaveSave: 'Save and go back',
  resetConfirm: 'Reset CUE ID? The draft saved on this device will be deleted.'
})

onBeforeRouteLeave((to) => {
  if (allowNextRouteLeave || !dirty.value) return true
  openLeaveDialog(to.fullPath)
  return false
})

useHead(() => ({
  title: 'CUE ID creator | CueBooker',
  htmlAttrs: { lang: preferences.locale.value },
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
}))
</script>

<template>
  <main class="cue-id-page">
    <header class="cue-id-page__header">
      <NuxtLink class="brand" to="/" aria-label="CueBooker">
        <CueBrand />
      </NuxtLink>

      <div class="cue-id-page__status" aria-label="CUE ID lab status">
        <span>{{ copy.lab }}</span>
        <strong>{{ copy.status }}</strong>
      </div>

      <div class="cue-id-page__header-actions">
        <CuePreferencesControl compact />
        <button class="cue-id-page__back" type="button" @click="requestExit">VOLVER</button>
      </div>
    </header>

    <CueIdStylizedWorkspace
      v-model="cueIdConfig"
      :locale="preferences.locale.value"
      :dirty="dirty"
      :section="cueSection"
      @section-change="handleSectionChange"
      @save="saveLabDraft"
      @reset="resetLabDraft"
    />

    <p
      v-if="saveState !== 'idle'"
      class="cue-id-page__saved"
      role="status"
      aria-live="polite"
    >
      {{ saveState === 'reset' ? copy.reset : saveState === 'invalid' ? copy.invalid : saveState === 'storage-error' ? copy.storageError : copy.saved }}
    </p>

    <div v-if="leaveDialogOpen" class="cue-id-page__leave-backdrop" @click.self="leaveDialogOpen = false">
      <section class="cue-id-page__leave-modal" role="dialog" aria-modal="true" aria-labelledby="cue-id-leave-title">
        <div class="cue-id-page__leave-kicker"><span>CUE ID</span><small>BETA</small></div>
        <h2 id="cue-id-leave-title">{{ copy.leave }}</h2>
        <p>{{ copy.leaveBody }}</p>
        <div class="cue-id-page__leave-actions">
          <button type="button" class="cue-id-page__leave-cancel" @click="leaveDialogOpen = false">{{ copy.leaveCancel }}</button>
          <button type="button" class="cue-id-page__leave-discard" @click="leaveWithoutSaving">{{ copy.leaveDiscard }}</button>
          <button type="button" class="cue-id-page__leave-save" @click="saveAndLeave">{{ copy.leaveSave }}</button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
:global(body){margin:0;background:var(--cue-bg)}
.cue-id-page{min-height:100vh;padding:0 28px 54px;background:var(--cue-bg);color:var(--cue-text);font-family:Arial,Helvetica,sans-serif}
.cue-id-page__header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;min-height:68px;border-bottom:1px solid var(--cue-border)}
.brand{color:inherit;text-decoration:none}
.cue-id-page__status{display:flex;align-items:center;gap:10px;color:var(--cue-muted);font:700 9px/1.2 monospace;letter-spacing:.08em}.cue-id-page__status span{color:var(--cue-accent)}.cue-id-page__status strong{font:inherit}
.cue-id-page__header-actions{display:flex;justify-content:flex-end;align-items:center;gap:14px}.cue-id-page__back{padding:0;border:0;background:transparent;color:var(--cue-muted);font:700 11px/1.2 monospace;text-transform:uppercase;letter-spacing:.08em;cursor:pointer}
.cue-id-page__saved{position:fixed;right:20px;bottom:20px;z-index:10;margin:0;padding:10px 13px;border:1px solid var(--cue-border);border-radius:10px;background:var(--cue-surface);color:var(--cue-text);font:700 11px/1.3 monospace;box-shadow:0 10px 30px rgba(0,0,0,.22)}
.cue-id-page__leave-backdrop{position:fixed;inset:0;z-index:60;display:grid;place-items:center;padding:20px;background:rgba(0,0,0,.72);backdrop-filter:blur(8px)}
.cue-id-page__leave-modal{width:min(520px,100%);padding:22px;border:1px solid var(--cue-border);border-radius:18px;background:var(--cue-surface);box-shadow:0 28px 80px rgba(0,0,0,.5)}
.cue-id-page__leave-kicker{display:flex;align-items:center;gap:8px}.cue-id-page__leave-kicker span{color:var(--cue-accent);font:800 10px/1 monospace;letter-spacing:.16em}.cue-id-page__leave-kicker small{padding:4px 6px;border:1px solid color-mix(in srgb,var(--cue-accent) 45%,var(--cue-border));border-radius:999px;color:var(--cue-accent);font:800 8px/1 monospace}
.cue-id-page__leave-modal h2{margin:18px 0 8px;font-size:clamp(1.45rem,5vw,2rem);line-height:1.05;text-transform:uppercase}.cue-id-page__leave-modal p{margin:0;color:var(--cue-muted);line-height:1.55}
.cue-id-page__leave-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:22px}.cue-id-page__leave-actions button{min-height:46px;padding:10px 13px;border:1px solid var(--cue-border);border-radius:10px;background:transparent;color:var(--cue-text);font-weight:900;cursor:pointer}.cue-id-page__leave-cancel{grid-column:1/-1}.cue-id-page__leave-discard{color:var(--cue-muted)!important}.cue-id-page__leave-save{border-color:var(--cue-accent)!important;background:var(--cue-accent)!important;color:#101010!important}
@media(max-width:760px){.cue-id-page{padding:0 14px 30px}.cue-id-page__header{grid-template-columns:1fr auto;min-height:62px}.cue-id-page__status{display:none}.cue-id-page__header-actions{gap:9px}.cue-id-page__back{font-size:10px;white-space:nowrap}.cue-id-page__saved{right:14px;bottom:14px;left:14px;text-align:center}.cue-id-page__leave-backdrop{align-items:end;padding:12px}.cue-id-page__leave-modal{padding:18px;border-radius:16px}.cue-id-page__leave-actions{grid-template-columns:1fr}.cue-id-page__leave-cancel{grid-column:auto}}
</style>
