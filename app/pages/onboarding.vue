<script setup lang="ts">
const auth = useCueAuth()
const analytics = useAnalytics()
const billingIntent = useBillingIntent()
const { locale } = useCuePreferences()
const accountType = ref<'dj' | 'agency'>('dj')
const cueIdNextStep = ref<'now' | 'later'>('later')
const displayName = ref('')
const entityName = ref('')
const entitySlug = ref('')
const errorMessage = ref('')
const submitting = ref(false)

const copy = computed(() => locale.value === 'es'
  ? {
      kicker: 'CONFIGURACIÓN DE CUENTA / 01', title: '¿Cómo trabajas?',
      body: 'Esto define la identidad privada que administrará calendario y bookings.',
      dj: 'DJ / ARTISTA', djBody: 'Gestiono mi propio proyecto y calendario.',
      agency: 'AGENCIA', agencyBody: 'Gestiono un roster y su operativa de booking.',
      yourName: 'Tu nombre', artistName: 'Nombre artístico', agencyName: 'Nombre de la agencia', slug: 'Identificador',
      cueIdTitle: 'Tu CUE ID',
      cueIdBody: 'Decide si quieres empezar tu identidad visual 3D al terminar el registro o entrar directamente al workspace.',
      cueIdNow: 'Crear mi CUE ID ahora',
      cueIdNowBody: 'Ir al Creator después de crear tu workspace.',
      cueIdLater: 'Hacerlo más tarde',
      cueIdLaterBody: 'Entrar al workspace y crear tu CUE ID cuando quieras.',
      profileNote: 'Después podrás completar tu ficha profesional. CUE ID también seguirá disponible desde tu workspace.',
      planIntent: 'Plan seleccionado', planPending: 'La activación de pago se realizará después de crear el workspace.',
      saving: 'Guardando…', submit: 'Crear workspace', genericError: 'No se pudo completar la configuración.',
      pageTitle: 'Configura tu cuenta | Cuebooker'
    }
  : {
      kicker: 'ACCOUNT SETUP / 01', title: 'How do you work?',
      body: 'This defines the private identity that will manage calendars and bookings.',
      dj: 'DJ / ARTIST', djBody: 'I manage my own project and calendar.',
      agency: 'AGENCY', agencyBody: 'I manage a roster and its booking operations.',
      yourName: 'Your name', artistName: 'Artist name', agencyName: 'Agency name', slug: 'Identifier',
      cueIdTitle: 'Your CUE ID',
      cueIdBody: 'Choose whether to start your 3D visual identity after registration or go straight to the workspace.',
      cueIdNow: 'Create my CUE ID now',
      cueIdNowBody: 'Open the Creator after your workspace is created.',
      cueIdLater: 'Do it later',
      cueIdLaterBody: 'Enter the workspace and create your CUE ID whenever you want.',
      profileNote: 'Afterwards you can complete your professional profile. CUE ID will also remain available from your workspace.',
      planIntent: 'Selected plan', planPending: 'Paid activation will happen after the workspace is created.',
      saving: 'Saving…', submit: 'Create workspace', genericError: 'Setup could not be completed.',
      pageTitle: 'Set up your account | Cuebooker'
    })

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

watch(entityName, value => { entitySlug.value = slugify(value) })

onMounted(async () => {
  billingIntent.initialize()
  if (billingIntent.plan.value === 'agency') accountType.value = 'agency'
  await auth.initialize()
  if (!auth.signedIn.value) {
    await navigateTo('/access')
    return
  }
  if (!auth.profile.value) await auth.fetchProfile()
  if (auth.profile.value?.onboarding_completed) {
    await navigateTo('/workspace')
    return
  }
  displayName.value = auth.profile.value?.display_name || ''
})

async function submit() {
  errorMessage.value = ''
  submitting.value = true
  try {
    await auth.completeOnboarding({
      accountType: accountType.value,
      displayName: displayName.value,
      entityName: entityName.value,
      entitySlug: entitySlug.value
    })
    analytics.track('onboarding_completed', {
      account_type: accountType.value,
      cue_id_next_step: accountType.value === 'dj' ? cueIdNextStep.value : null
    })
    if (accountType.value === 'dj' && cueIdNextStep.value === 'now') {
      await navigateTo('/cue-id?from=onboarding')
      return
    }
    await navigateTo('/workspace?setup=profile')
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || copy.value.genericError
  } finally {
    submitting.value = false
  }
}

useHead(() => ({ title: copy.value.pageTitle, htmlAttrs: { lang: locale.value } }))
</script>

<template>
  <main class="onboarding-page">
    <NuxtLink class="onboarding-brand" to="/" aria-label="Cuebooker"><CueBrand /></NuxtLink>

    <section class="onboarding-panel">
      <div class="onboarding-heading">
        <p class="onboarding-kicker">{{ copy.kicker }}</p>
        <h1>{{ copy.title }}</h1>
        <p class="onboarding-copy">{{ copy.body }}</p>
      </div>

      <div class="type-grid">
        <button type="button" :class="{ active: accountType === 'dj' }" @click="accountType = 'dj'">
          <strong>{{ copy.dj }}</strong>
          <span>{{ copy.djBody }}</span>
        </button>
        <button type="button" :class="{ active: accountType === 'agency' }" @click="accountType = 'agency'">
          <strong>{{ copy.agency }}</strong>
          <span>{{ copy.agencyBody }}</span>
        </button>
      </div>

      <template v-if="accountType === 'dj'">
        <CueIdTeaser :artist-name="entityName" compact />
        <section class="cue-id-choice" aria-labelledby="cue-id-choice-title">
          <div class="cue-id-choice__heading">
            <p id="cue-id-choice-title">{{ copy.cueIdTitle }}</p>
            <span>{{ copy.cueIdBody }}</span>
          </div>
          <div class="cue-id-choice__grid" role="group" :aria-label="copy.cueIdTitle">
            <button
              type="button"
              :class="{ active: cueIdNextStep === 'now' }"
              :aria-pressed="cueIdNextStep === 'now'"
              @click="cueIdNextStep = 'now'"
            >
              <strong>{{ copy.cueIdNow }}</strong>
              <span>{{ copy.cueIdNowBody }}</span>
            </button>
            <button
              type="button"
              :class="{ active: cueIdNextStep === 'later' }"
              :aria-pressed="cueIdNextStep === 'later'"
              @click="cueIdNextStep = 'later'"
            >
              <strong>{{ copy.cueIdLater }}</strong>
              <span>{{ copy.cueIdLaterBody }}</span>
            </button>
          </div>
        </section>
      </template>

      <aside v-if="billingIntent.plan.value && billingIntent.plan.value !== 'free'" class="billing-intent">
        <span>{{ copy.planIntent }}</span>
        <strong>{{ billingIntent.plan.value === 'artist_pro' ? 'ARTIST PRO' : 'AGENCY' }}</strong>
        <small>{{ copy.planPending }}</small>
      </aside>

      <form class="onboarding-form" @submit.prevent="submit">
        <label><span>{{ copy.yourName }}</span><input v-model="displayName" minlength="2" autocomplete="name" required /></label>
        <label><span>{{ accountType === 'dj' ? copy.artistName : copy.agencyName }}</span><input v-model="entityName" minlength="2" required /></label>
        <label><span>{{ copy.slug }}</span><input v-model="entitySlug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required /></label>
        <p class="profile-note">{{ copy.profileNote }}</p>
        <p v-if="errorMessage" class="onboarding-error">{{ errorMessage }}</p>
        <button class="onboarding-submit" type="submit" :disabled="submitting">{{ submitting ? copy.saving : copy.submit }}</button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.onboarding-page { min-height:100vh; padding:28px; background:var(--cue-bg); color:var(--cue-text); }
.onboarding-brand { color:inherit; text-decoration:none; font-weight:900; letter-spacing:.08em; }
.onboarding-brand span { color:var(--cue-accent); }
.onboarding-panel { width:min(1040px,100%); margin:7vh auto 0; }
.onboarding-heading, .type-grid, .onboarding-form { width:min(760px,100%); margin-inline:auto; box-sizing:border-box; }
.onboarding-kicker { margin:0 0 18px; color:var(--cue-accent); font:700 12px/1.2 monospace; letter-spacing:.12em; }
h1 { margin:0; font-size:clamp(2.6rem,8vw,5.5rem); line-height:.9; text-transform:uppercase; }
.onboarding-copy { max-width:600px; color:var(--cue-muted); line-height:1.55; }
.type-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:30px; margin-bottom:30px; }
.type-grid button { min-height:140px; padding:20px; border:1px solid var(--cue-border); background:var(--cue-surface); color:var(--cue-text); text-align:left; cursor:pointer; }
.type-grid button.active { border-color:var(--cue-toggle); box-shadow:inset 0 0 0 1px var(--cue-toggle); background:color-mix(in srgb,var(--cue-toggle) 8%,var(--cue-surface)); }
.type-grid strong { display:block; margin-bottom:10px; color:var(--cue-accent); font:800 13px/1.2 monospace; }
.type-grid span { color:var(--cue-muted); line-height:1.45; }
.cue-id-choice { width:min(760px,100%); margin:16px auto 0; padding:20px; box-sizing:border-box; border:1px solid var(--cue-border); background:color-mix(in srgb,var(--cue-accent) 4%,var(--cue-surface)); }
.cue-id-choice__heading { display:grid; gap:6px; margin-bottom:14px; }
.cue-id-choice__heading p { margin:0; color:var(--cue-accent); font:800 11px/1.2 monospace; text-transform:uppercase; letter-spacing:.1em; }
.cue-id-choice__heading span { color:var(--cue-muted); font-size:13px; line-height:1.45; }
.cue-id-choice__grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.cue-id-choice__grid button { min-height:104px; padding:16px; border:1px solid var(--cue-border); background:var(--cue-bg); color:var(--cue-text); text-align:left; cursor:pointer; }
.cue-id-choice__grid button.active { border-color:var(--cue-toggle); box-shadow:inset 0 0 0 1px var(--cue-toggle); background:color-mix(in srgb,var(--cue-toggle) 8%,var(--cue-bg)); }
.cue-id-choice__grid strong { display:block; margin-bottom:7px; }
.cue-id-choice__grid span { color:var(--cue-muted); font-size:12px; line-height:1.4; }
.cue-id-choice button:focus-visible { outline:2px solid var(--cue-accent); outline-offset:2px; }
.billing-intent { width:min(760px,100%); margin:16px auto 0; box-sizing:border-box; display:grid; gap:6px; padding:14px 16px; border:1px solid color-mix(in srgb,var(--cue-accent) 40%,var(--cue-border)); background:color-mix(in srgb,var(--cue-accent) 4%,var(--cue-surface)); }
.billing-intent span { color:var(--cue-muted); font:800 8px/1 monospace; letter-spacing:.1em; text-transform:uppercase; }
.billing-intent strong { color:var(--cue-accent); font:900 14px/1.2 monospace; }
.billing-intent small { color:var(--cue-muted); font-size:10px; line-height:1.4; }
.onboarding-form { display:grid; gap:16px; margin-top:18px; padding:26px; border:1px solid var(--cue-border); background:var(--cue-surface); box-shadow:0 24px 80px var(--cue-shadow); }
label { display:grid; gap:7px; }
label span { color:var(--cue-muted); font:700 11px/1.2 monospace; text-transform:uppercase; letter-spacing:.1em; }
input { min-height:48px; padding:0 14px; border:1px solid var(--cue-border); background:var(--cue-bg); color:var(--cue-text); font:inherit; }
.onboarding-submit { min-height:50px; border:0; background:var(--cue-toggle); color:var(--cue-toggle-ink); font-weight:800; cursor:pointer; }
.onboarding-error { margin:0; padding:12px; border:1px solid #8b3434; color:#d65757; }
.profile-note { margin:0; padding:14px; border-left:2px solid var(--cue-toggle); background:color-mix(in srgb,var(--cue-toggle) 7%,var(--cue-bg)); color:var(--cue-muted); font-size:13px; line-height:1.5; }
@media (max-width:700px) { .onboarding-page { padding:20px; } .type-grid,.cue-id-choice__grid { grid-template-columns:1fr; } .onboarding-form { padding:20px; } .onboarding-panel { margin-top:4vh; } }
</style>
