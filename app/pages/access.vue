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
const messageTone = ref<'info' | 'warning'>('info')
const errorMessage = ref('')
const passwordVisible = ref(false)

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
      forgot: '¿Has olvidado la contraseña?', showPassword: 'Mostrar contraseña', hidePassword: 'Ocultar contraseña', backToSignin: 'Volver a entrar', resetSubmit: 'Enviar enlace',
      processing: 'Procesando…', signinSubmit: 'Entrar al workspace', signupSubmit: 'Crear cuenta',
      confirmation: 'Revisa tu correo para continuar. Si ya habías iniciado un registro con este email, confirmaremos esa cuenta existente. Si no recuerdas la contraseña, puedes restablecerla.',
      resetConfirmation: 'Si existe una cuenta con ese email, recibirás un enlace para cambiar la contraseña.',
      configError: 'Este entorno todavía no tiene configurada la conexión pública con Supabase.',
      signupTimeout: 'El envío del correo está tardando más de lo esperado. Revisa tu bandeja de entrada y spam; si no llega en unos minutos, vuelve a intentarlo.',
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
      forgot: 'Forgot your password?', showPassword: 'Show password', hidePassword: 'Hide password', backToSignin: 'Back to sign in', resetSubmit: 'Send reset link',
      processing: 'Processing…', signinSubmit: 'Open workspace', signupSubmit: 'Create account',
      confirmation: 'Check your email to continue. If you had already started registration with this email, we will confirm that existing account. If you do not remember the password, you can reset it.',
      resetConfirmation: 'If an account exists for that email, you will receive a link to change the password.',
      configError: 'This environment does not have the public Supabase connection configured yet.',
      signupTimeout: 'The confirmation email is taking longer than expected. Check your inbox and spam; if it does not arrive within a few minutes, try again.',
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
  messageTone.value = 'info'
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
      messageTone.value = 'info'
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
      messageTone.value = 'info'
      message.value = copy.value.confirmation
      return
    }
    await navigateTo(auth.accountDestination())
  } catch (error: any) {
    const raw = String(error?.data?.msg || error?.data?.message || error?.message || '').toLowerCase()
    const status = Number(error?.statusCode || error?.status || error?.response?.status || 0)

    if (
      mode.value === 'signup'
      && (status === 504 || raw.includes('504') || raw.includes('request_timeout') || raw.includes('context deadline exceeded'))
    ) {
      messageTone.value = 'warning'
      message.value = copy.value.signupTimeout
      return
    }

    errorMessage.value = copy.value.genericError
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
        <label v-if="mode !== 'forgot'">
          <span>{{ copy.password }}</span>
          <div class="access-password">
            <input
              v-model="password"
              :type="passwordVisible ? 'text' : 'password'"
              :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'"
              minlength="8"
              required
            />
            <button
              class="access-password__toggle"
              type="button"
              :aria-label="passwordVisible ? copy.hidePassword : copy.showPassword"
              :title="passwordVisible ? copy.hidePassword : copy.showPassword"
              @click="passwordVisible = !passwordVisible"
            >
              <svg v-if="!passwordVisible" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/>
                <circle cx="12" cy="12" r="2.7"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path d="m3 3 18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16.6 16.6 0 0 1-2.7 3.3M6.2 6.2C3.8 7.8 2.5 12 2.5 12s3.5 6 9.5 6c1.2 0 2.3-.2 3.3-.6M9.9 9.9A3 3 0 0 0 14.1 14.1"/>
              </svg>
            </button>
          </div>
        </label>
        <NuxtLink
          v-if="mode === 'signin'"
          class="access-link"
          to="/access?mode=forgot"
          @click="message = ''; errorMessage = ''"
        >{{ copy.forgot }}</NuxtLink>
        <p v-if="errorMessage" class="access-message access-message--error">{{ errorMessage }}</p>
        <p v-if="message" class="access-message" :class="`access-message--${messageTone}`">{{ message }}</p>
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
.access-password{position:relative;display:grid}.access-password input{width:100%;box-sizing:border-box;padding-right:48px}.access-password__toggle{position:absolute;top:50%;right:8px;display:grid;place-items:center;width:36px;height:36px;padding:0;border:0;background:transparent;color:var(--cue-muted);cursor:pointer;transform:translateY(-50%)}.access-password__toggle:hover,.access-password__toggle:focus-visible{color:var(--cue-accent)}.access-password__toggle svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.access-submit { min-height:50px; border:0; background:var(--cue-toggle); color:var(--cue-toggle-ink); font:800 14px/1 sans-serif; cursor:pointer; }
.access-submit:disabled { opacity:.45; cursor:not-allowed; }
.access-link { justify-self:end; padding:0; border:0; background:transparent; color:var(--cue-muted); cursor:pointer; font:700 11px/1.2 monospace; text-decoration:underline; text-underline-offset:3px; }
.access-link:hover,.access-link:focus-visible { color:var(--cue-accent); }
.access-link--back { justify-self:start; }
.access-message {
  margin:0;
  padding:13px 14px 13px 16px;
  border:1px solid var(--cue-border);
  border-left-width:3px;
  color:var(--cue-text);
  font-size:.9rem;
  line-height:1.45;
}
.access-message--info {
  border-color:rgba(70,144,255,.34);
  border-left-color:#4690ff;
  background:rgba(70,144,255,.09);
  color:#b9d5ff;
}
.access-message--warning {
  border-color:rgba(218,164,63,.38);
  border-left-color:#daa43f;
  background:rgba(218,164,63,.10);
  color:#f0cf8b;
}
.access-message--error {
  border-color:rgba(214,87,87,.36);
  border-left-color:#d65757;
  background:rgba(214,87,87,.10);
  color:#efa5a5;
}
.access-privacy { margin:0; color:var(--cue-muted); font-size:12px; line-height:1.55; }
.access-privacy a { color:var(--cue-accent); }
@media (max-width:620px) { .access-page { padding:12px 18px 18px; } .access-panel { margin-top:8px; padding:22px; } }
</style>
