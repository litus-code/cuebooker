<script setup lang="ts">
const auth = useCueAuth()
const { locale } = useCuePreferences()
const accountType = ref<'dj' | 'agency'>('dj')
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
      profileNote: 'Después podrás completar tu ficha profesional y, si quieres, empezar CUE ID. Todo esto es opcional y podrás retomarlo más tarde desde tu workspace.',
      saving: 'Guardando…', submit: 'Crear workspace', genericError: 'No se pudo completar la configuración.',
      pageTitle: 'Configura tu cuenta | Cuebooker'
    }
  : {
      kicker: 'ACCOUNT SETUP / 01', title: 'How do you work?',
      body: 'This defines the private identity that will manage calendars and bookings.',
      dj: 'DJ / ARTIST', djBody: 'I manage my own project and calendar.',
      agency: 'AGENCY', agencyBody: 'I manage a roster and its booking operations.',
      yourName: 'Your name', artistName: 'Artist name', agencyName: 'Agency name', slug: 'Identifier',
      profileNote: 'Afterwards you can complete your professional profile and, if you want, start CUE ID. Both are optional and can be resumed later from your workspace.',
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

      <CueIdTeaser v-if="accountType === 'dj'" :artist-name="entityName" compact />

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
.onboarding-form { display:grid; gap:16px; margin-top:18px; padding:26px; border:1px solid var(--cue-border); background:var(--cue-surface); box-shadow:0 24px 80px var(--cue-shadow); }
label { display:grid; gap:7px; }
label span { color:var(--cue-muted); font:700 11px/1.2 monospace; text-transform:uppercase; letter-spacing:.1em; }
input { min-height:48px; padding:0 14px; border:1px solid var(--cue-border); background:var(--cue-bg); color:var(--cue-text); font:inherit; }
.onboarding-submit { min-height:50px; border:0; background:var(--cue-toggle); color:var(--cue-toggle-ink); font-weight:800; cursor:pointer; }
.onboarding-error { margin:0; padding:12px; border:1px solid #8b3434; color:#d65757; }
.profile-note { margin:0; padding:14px; border-left:2px solid var(--cue-toggle); background:color-mix(in srgb,var(--cue-toggle) 7%,var(--cue-bg)); color:var(--cue-muted); font-size:13px; line-height:1.5; }
@media (max-width:700px) { .onboarding-page { padding:20px; } .type-grid { grid-template-columns:1fr; } .onboarding-form { padding:20px; } .onboarding-panel { margin-top:4vh; } }
</style>
