<script setup lang="ts">
import {
  cloneCueIdStylizedCreatorConfig,
  cloneValidCueIdStylizedCreatorConfig,
  cueIdStylizedCreatorConfigsEqual,
  DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
  parseCueIdStylizedCreatorConfigV1,
  type CueIdStylizedCreatorConfigV1
} from '../domain/cueIdStylizedCreator'

const preferences = useCuePreferences()
const route = useRoute()
const fromOnboarding = computed(() => route.query.from === 'onboarding')
const exitTarget = computed(() => fromOnboarding.value ? '/workspace?setup=profile' : '/')
const cueIdConfig = ref(cloneCueIdStylizedCreatorConfig(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG))
const savedConfig = ref(cloneCueIdStylizedCreatorConfig(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG))
const saveState = ref<'idle' | 'saved' | 'reset' | 'invalid' | 'storage-error'>('idle')
const LAB_DRAFT_KEY = 'cuebooker:cue-id:stylized-v1:lab-draft'

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
  lab: 'LAB / NOINDEX',
  status: 'CUE ID · CREATOR V1 LAB',
  saved: 'Draft guardado en este dispositivo',
  reset: 'CUE ID restablecido al estado inicial',
  invalid: 'No se ha guardado: la configuración no es válida',
  storageError: 'No se ha podido acceder al almacenamiento local de este navegador',
  leave: 'Tienes cambios sin guardar en CUE ID. Si sales, se perderán.',
  resetConfirm: '¿Restablecer CUE ID? Se eliminará el draft guardado en este dispositivo.'
} : {
  back: 'Back',
  continueWorkspace: 'Continue to workspace',
  lab: 'LAB / NOINDEX',
  status: 'CUE ID · CREATOR V1 LAB',
  saved: 'Draft saved on this device',
  reset: 'CUE ID reset to initial state',
  invalid: 'Not saved: the configuration is invalid',
  storageError: 'Local browser storage could not be accessed',
  leave: 'You have unsaved CUE ID changes. Leaving will discard them.',
  resetConfirm: 'Reset CUE ID? The draft saved on this device will be deleted.'
})

onBeforeRouteLeave(() => {
  if (!dirty.value) return true
  return window.confirm(copy.value.leave)
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
        <NuxtLink :to="exitTarget">{{ fromOnboarding ? copy.continueWorkspace : copy.back }}</NuxtLink>
      </div>
    </header>

    <CueIdStylizedWorkspace
      v-model="cueIdConfig"
      :locale="preferences.locale.value"
      :dirty="dirty"
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
  </main>
</template>

<style scoped>
:global(body){margin:0;background:var(--cue-bg)}
.cue-id-page{min-height:100vh;padding:0 28px 54px;background:var(--cue-bg);color:var(--cue-text);font-family:Arial,Helvetica,sans-serif}
.cue-id-page__header{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;min-height:68px;border-bottom:1px solid var(--cue-border)}
.brand{color:inherit;text-decoration:none}
.cue-id-page__status{display:flex;align-items:center;gap:10px;color:var(--cue-muted);font:700 9px/1.2 monospace;letter-spacing:.08em}.cue-id-page__status span{color:var(--cue-accent)}.cue-id-page__status strong{font:inherit}
.cue-id-page__header-actions{display:flex;justify-content:flex-end;align-items:center;gap:14px}.cue-id-page__header-actions>a{color:var(--cue-muted);font:700 11px/1.2 monospace;text-decoration:none;text-transform:uppercase;letter-spacing:.08em}
.cue-id-page__saved{position:fixed;right:20px;bottom:20px;z-index:10;margin:0;padding:10px 13px;border:1px solid var(--cue-border);border-radius:10px;background:var(--cue-surface);color:var(--cue-text);font:700 11px/1.3 monospace;box-shadow:0 10px 30px rgba(0,0,0,.22)}
@media(max-width:760px){.cue-id-page{padding:0 14px 30px}.cue-id-page__header{grid-template-columns:1fr auto;min-height:62px}.cue-id-page__status{display:none}.cue-id-page__saved{right:14px;bottom:14px;left:14px;text-align:center}}
</style>
