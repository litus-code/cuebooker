<script setup lang="ts">
const route = useRoute()
const auth = useCueAuth()
const analytics = useAnalytics()
const billingIntent = useBillingIntent()
const { locale } = useCuePreferences()

const mode = ref<'signin' | 'signup' | 'forgot'>('signin')
const email = ref('')
const password = ref('')
const displayName = ref('')
const message = ref('')
const errorMessage = ref('')

const copy = computed(() => locale.value === 'es'
  ? {
      kicker: 'CUENTA / WORKSPACE PRIVADO',
      signinTitle: 'Vuelve a tu booking.',
      signupTitle: 'Crea tu espacio de trabajo.',
      forgotTitle: 'Recupera tu acceso.',
      signinBody: 'Accede a tu calendario, solicitudes y configuración privada.',
      signupBody: 'Elige después si gestionas tu propio proyecto como DJ o trabajas como agencia.',
      forgotBody: 'Introduce tu email y te enviaremos un enlace para definir una nueva contraseña.',
      signinTab: 'Entrar', signupTab: 'Crear cuenta', name: 'Nombre', email: 'Email', password: 'Contraseña',
      forgot: '¿Has olvidado la contraseña?', backToSignin: 'Volver a entrar', resetSubmit: 'Enviar enlace',
      processing: 'Procesando…', signinSubmit: 'Entrar al workspace', signupSubmit: 'Crear cuenta',
      confirmation: 'Cuenta creada. Revisa tu correo para confirmar el acceso antes de continuar.',
      resetConfirmation: 'Si existe una cuenta con ese email, recibirás un enlace para cambiar la contraseña.',
      configError: 'Este entorno todavía no tiene configurada la conexión pública con Supabase.',
      genericError: 'No se pudo completar el acceso.', title: 'Acceso | Cuebooker'
    }
  : {
      kicker: 'ACCOUNT / PRIVATE WORKSPACE',
      signinTitle: 'Back to your bookings.', signupTitle: 'Create your workspace.',
      forgotTitle: 'Recover your access.',
      signinBody: 'Access your calendar, requests and private settings.',
      signupBody: 'Next, choose whether you manage your own DJ project or work as an agency.',
      forgotBody: 'Enter your email and we will send a link to set a new password.',
      signinTab: 'Sign in', signupTab: 'Create account', name: 'Name', email: 'Email', password: 'Password',
      forgot: 'Forgot your password?', backToSignin: 'Back to sign in', resetSubmit: 'Send reset link',
      processing: 'Processing…', signinSubmit: 'Open workspace', signupSubmit: 'Create account',
      confirmation: 'Account created. Check your email to confirm access before continuing.',
      resetConfirmation: 'If an account exists for that email, you will receive a link to change the password.',
      configError: 'This environment does not have the public Supabase connection configured yet.',
      genericError: 'Access could not be completed.', title: 'Access | Cuebooker'
    })

watch(() => route.query.mode, (requestedMode) => {
  mode.value = requestedMode === 'signup' ? 'signup' : requestedMode === 'forgot' ? 'forgot' : 'signin'
}, { immediate: true })

watch(() => route.query.plan, value => {
  billingIntent.capture(value)
})

onMounted(async () => {
  billingIntent.initialize()
  billingIntent.capture(route.query.plan)
  const refCode = typeof route.query.ref === 'string' ? route.query.ref : ''
  auth.captureReferral(refCode, route.fullPath)
  await auth.initialize()
  if (auth.signedIn.value && mode.value === 'signin') {
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
    if (mode.value === 'forgot') {
      if (!import.meta.client) return
      const redirectTo = new URL('/reset-password', window.location.origin).toString()
      await auth.requestPasswordReset(email.value, redirectTo)
      message.value = copy.value.resetConfirmation
      return
    }
    analytics.track('signup_started', { surface: 'access' })
    const result = await auth.signUp(email.value, password.value, displayName.value)
    analytics.track('signup_completed', {
      surface: 'access',
      email_confirmation_required: result.emailConfirmationRequired
    })
    if (result.emailConfirmationRequired) {
      message.value = copy.value.confirmation
      return
    }
    await navigateTo('/onboarding')
  } catch (error: any) {
    errorMessage.value = error?.data?.msg || error?.data?.message || error?.message || copy.value.genericError
  }
}

useHead(() => ({ title: copy.value.title, htmlAttrs: { lang: locale.value } }))
</script>

<template>
  <main class="access-page">
    <section class="access-panel">
      <p class="access-kicker">{{ copy.kicker }}</p>
      <h1>{{ mode === 'signin' ? copy.signinTitle : mode === 'signup' ? copy.signupTitle : copy.forgotTitle }}</h1>
      <p class="access-copy">{{ mode === 'signin' ? copy.signinBody : mode === 'signup' ? copy.signupBody : copy.forgotBody }}</p>
      <div v-if="mode !== 'forgot'" class="access-tabs" role="tablist" :aria-label="locale === 'es' ? 'Tipo de acceso' : 'Access type'">
        <button :class="{ active: mode === 'signin' }" type="button" @click="mode = 'signin'">{{ copy.signinTab }}</button>
        <button :class="{ active: mode === 'signup' }" type="button" @click="mode = 'signup'">{{ copy.signupTab }}</button>
      </div>
      <form class="access-form" @submit.prevent="submit">
        <label v-if="mode === 'signup'"><span>{{ copy.name }}</span><input v-model="displayName" autocomplete="name" minlength="2" required /></label>
        <label><span>{{ copy.email }}</span><input v-model="email" type="email" autocomplete="email" required /></label>
        <label v-if="mode !== 'forgot'"><span>{{ copy.password }}</span><input v-model="password" type="password" :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'" minlength="8" required /></label>
        <button v-if="mode === 'signin'" class="access-link" type="button" @click="mode = 'forgot'; message = ''; errorMessage = ''">{{ copy.forgot }}</button>
        <p v-if="errorMessage" class="access-message access-message--error">{{ errorMessage }}</p>
        <p v-if="message" class="access-message">{{ message }}</p>
        <p v-if="mode === 'signup'" class="access-privacy">
          {{ locale === 'es' ? 'Usaremos tus datos para crear y gestionar tu cuenta.' : 'We will use your data to create and manage your account.' }}
          <NuxtLink to="/privacidad">{{ locale === 'es' ? 'Consulta la política de privacidad.' : 'Read the privacy policy.' }}</NuxtLink>
        </p>
        <button class="access-submit" type="submit" :disabled="auth.loading.value || !auth.configured.value">{{ auth.loading.value ? copy.processing : mode === 'signin' ? copy.signinSubmit : mode === 'signup' ? copy.signupSubmit : copy.resetSubmit }}</button>
        <button v-if="mode === 'forgot'" class="access-link access-link--back" type="button" @click="mode = 'signin'; message = ''; errorMessage = ''">{{ copy.backToSignin }}</button>
      </form>
      <p v-if="!auth.configured.value" class="access-message access-message--error">{{ copy.configError }}</p>
    </section>
  </main>
</template>

<style scoped>
.access-page { min-height:calc(100vh - 64px); padding:20px 28px 28px; background:var(--cue-bg); color:var(--cue-text); }
.access-panel { width:min(560px,100%); margin:8px auto 0; padding:32px; border:1px solid var(--cue-border); background:var(--cue-surface); box-shadow:0 24px 80px var(--cue-shadow); }
.access-kicker { margin:0 0 18px; color:var(--cue-accent); font:700 12px/1.2 monospace; letter-spacing:.12em; }
h1 { margin:0; font-size:clamp(2.3rem,7vw,4.8rem); line-height:.92; text-transform:uppercase; }
.access-copy { color:var(--cue-muted); line-height:1.55; }
.access-tabs { display:grid; grid-template-columns:1fr 1fr; margin:28px 0 20px; border:1px solid var(--cue-border); background:var(--cue-bg); }
.access-tabs button { padding:12px; border:0; background:transparent; color:var(--cue-muted); cursor:pointer; }
.access-tabs button.active { background:var(--cue-toggle); color:var(--cue-toggle-ink); font-weight:800; }
.access-form { display:grid; gap:16px; }
label { display:grid; gap:7px; }
label span { color:var(--cue-muted); font:700 11px/1.2 monospace; text-transform:uppercase; letter-spacing:.1em; }
input { min-height:48px; padding:0 14px; border:1px solid var(--cue-border); background:var(--cue-bg); color:var(--cue-text); font:inherit; }
.access-submit { min-height:50px; border:0; background:var(--cue-toggle); color:var(--cue-toggle-ink); font:800 14px/1 sans-serif; cursor:pointer; }
.access-submit:disabled { opacity:.45; cursor:not-allowed; }
.access-link { justify-self:end; padding:0; border:0; background:transparent; color:var(--cue-muted); cursor:pointer; font:700 11px/1.2 monospace; text-decoration:underline; text-underline-offset:3px; }
.access-link:hover,.access-link:focus-visible { color:var(--cue-accent); }
.access-link--back { justify-self:start; }
.access-message { margin:0; padding:12px; border:1px solid var(--cue-border); color:var(--cue-text); font-size:.9rem; }
.access-message--error { border-color:#8b3434; color:#d65757; }
.access-privacy { margin:0; color:var(--cue-muted); font-size:12px; line-height:1.55; }
.access-privacy a { color:var(--cue-accent); }
@media (max-width:620px) { .access-page { padding:12px 18px 18px; } .access-panel { margin-top:8px; padding:22px; } }
</style>
