<script setup lang="ts">
const route = useRoute()
const auth = useCueAuth()
const { locale } = useCuePreferences()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const displayName = ref('')
const message = ref('')
const errorMessage = ref('')
const copy = computed(() => locale.value === 'es' ? {
  kicker: 'CUENTA / WORKSPACE PRIVADO', signinTitle: 'Vuelve a tu booking.', signupTitle: 'Crea tu espacio de trabajo.',
  signinBody: 'Accede a tu calendario, solicitudes y configuración privada.', signupBody: 'Elige después si gestionas tu propio proyecto como DJ o trabajas como agencia.',
  accessType: 'Tipo de acceso', signin: 'Entrar', signup: 'Crear cuenta', name: 'Nombre', password: 'Contraseña',
  processing: 'Procesando…', enterWorkspace: 'Entrar al workspace', createAccount: 'Crear cuenta',
  confirmation: 'Cuenta creada. Revisa tu correo para confirmar el acceso antes de continuar.',
  genericError: 'No se pudo completar el acceso.', unconfigured: 'Este entorno todavía no tiene configurada la conexión pública con Supabase.'
} : {
  kicker: 'ACCOUNT / PRIVATE WORKSPACE', signinTitle: 'Back to your bookings.', signupTitle: 'Create your workspace.',
  signinBody: 'Access your calendar, requests and private settings.', signupBody: 'Choose whether you manage your own DJ project or work as an agency.',
  accessType: 'Access type', signin: 'Sign in', signup: 'Create account', name: 'Name', password: 'Password',
  processing: 'Processing…', enterWorkspace: 'Enter workspace', createAccount: 'Create account',
  confirmation: 'Account created. Check your email to confirm access before continuing.',
  genericError: 'Access could not be completed.', unconfigured: 'This environment does not have a public Supabase connection configured yet.'
})

watch(() => route.query.mode, (requestedMode) => {
  mode.value = requestedMode === 'signup' ? 'signup' : 'signin'
}, { immediate: true })

onMounted(async () => {
  const refCode = typeof route.query.ref === 'string' ? route.query.ref : ''
  auth.captureReferral(refCode, route.fullPath)
  await auth.initialize()
  if (auth.signedIn.value) {
    if (!auth.profile.value) await auth.fetchProfile()
    await navigateTo(auth.accountDestination())
  }
})

async function submit() {
  errorMessage.value = ''
  message.value = ''

  try {
    if (mode.value === 'signin') {
      await auth.signIn(email.value, password.value)
      await navigateTo(auth.accountDestination())
      return
    }

    const result = await auth.signUp(email.value, password.value, displayName.value)
    if (result.emailConfirmationRequired) {
      message.value = copy.value.confirmation
      return
    }
    await navigateTo('/onboarding')
  } catch (error: any) {
    errorMessage.value = error?.data?.msg || error?.data?.message || error?.message || copy.value.genericError
  }
}

useHead(() => ({ title: locale.value === 'es' ? 'Acceso | CueBooker' : 'Access | CueBooker', htmlAttrs: { lang: locale.value } }))
</script>

<template>
  <main class="access-page">
    <header class="access-header"><NuxtLink class="access-brand" to="/">CUEBOOKER<span>/</span></NuxtLink><CuePreferencesControl compact /></header>

    <section class="access-panel">
      <p class="access-kicker">{{ copy.kicker }}</p>
      <h1>{{ mode === 'signin' ? copy.signinTitle : copy.signupTitle }}</h1>
      <p class="access-copy">
        {{ mode === 'signin'
          ? copy.signinBody
          : copy.signupBody }}
      </p>

      <div class="access-tabs" role="tablist" :aria-label="copy.accessType">
        <button :class="{ active: mode === 'signin' }" type="button" @click="mode = 'signin'">{{ copy.signin }}</button>
        <button :class="{ active: mode === 'signup' }" type="button" @click="mode = 'signup'">{{ copy.signup }}</button>
      </div>

      <form class="access-form" @submit.prevent="submit">
        <label v-if="mode === 'signup'">
          <span>{{ copy.name }}</span>
          <input v-model="displayName" autocomplete="name" minlength="2" required />
        </label>
        <label>
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="email" required />
        </label>
        <label>
          <span>{{ copy.password }}</span>
          <input v-model="password" type="password" :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'" minlength="8" required />
        </label>

        <p v-if="errorMessage" class="access-message access-message--error">{{ errorMessage }}</p>
        <p v-if="message" class="access-message">{{ message }}</p>

        <button class="access-submit" type="submit" :disabled="auth.loading.value || !auth.configured.value">
          {{ auth.loading.value ? copy.processing : mode === 'signin' ? copy.enterWorkspace : copy.createAccount }}
        </button>
      </form>

      <p v-if="!auth.configured.value" class="access-message access-message--error">
        {{ copy.unconfigured }}
      </p>

    </section>
  </main>
</template>

<style scoped>
.access-page { min-height: 100vh; padding: 28px; background: var(--cue-bg); color: var(--cue-text); }
.access-header { display: flex; align-items: center; justify-content: space-between; }
.access-brand { color: inherit; text-decoration: none; font-weight: 900; letter-spacing: .08em; }
.access-brand span { color: var(--cue-toggle); }
.access-panel { width: min(560px, 100%); margin: 24px auto 0; padding: 32px; border: 1px solid var(--cue-border); background: var(--cue-surface); }
.access-kicker { margin: 0 0 18px; color: var(--cue-accent); font: 700 12px/1.2 monospace; letter-spacing: .12em; }
h1 { margin: 0; font-size: clamp(2.3rem, 7vw, 4.8rem); line-height: .92; text-transform: uppercase; }
.access-copy { color: var(--cue-muted); line-height: 1.55; }
.access-tabs { display: grid; grid-template-columns: 1fr 1fr; gap: 3px; margin: 28px 0 20px; padding: 3px; border: 1px solid var(--cue-border); border-radius: 999px; background: #0d0d0d; }
.access-tabs button { padding: 12px; border: 0; border-radius: 999px; background: transparent; color: #777; cursor: pointer; }
.access-tabs button.active { background: var(--cue-toggle); color: #070707; font-weight: 800; }
.access-form { display: grid; gap: 16px; }
label { display: grid; gap: 7px; }
label span { color: var(--cue-muted); font: 700 11px/1.2 monospace; text-transform: uppercase; letter-spacing: .1em; }
input { min-height: 48px; padding: 0 14px; border: 1px solid var(--cue-border); background: var(--cue-bg); color: var(--cue-text); font: inherit; }
.access-submit { min-height: 50px; border: 0; background: var(--cue-toggle); color: #070707; font: 800 14px/1 sans-serif; cursor: pointer; }
.access-submit:disabled { opacity: .45; cursor: not-allowed; }
.access-message { margin: 0; padding: 12px; border: 1px solid var(--cue-border); color: var(--cue-text); font-size: .9rem; }
.access-message--error { border-color: #8b3434; color: #ffadad; }
@media (max-width: 620px) { .access-page { padding: 18px; } .access-panel { margin-top: 20px; padding: 22px; } }
</style>
