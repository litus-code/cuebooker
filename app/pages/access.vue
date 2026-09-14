<script setup lang="ts">
const route = useRoute()
const auth = useCueAuth()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const displayName = ref('')
const message = ref('')
const errorMessage = ref('')

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
      message.value = 'Cuenta creada. Revisa tu correo para confirmar el acceso antes de continuar.'
      return
    }
    await navigateTo('/onboarding')
  } catch (error: any) {
    errorMessage.value = error?.data?.msg || error?.data?.message || error?.message || 'No se pudo completar el acceso.'
  }
}

useHead({ title: 'Acceso | CueBooker' })
</script>

<template>
  <main class="access-page">
    <NuxtLink class="access-brand" to="/">CUEBOOKER<span>/</span></NuxtLink>

    <section class="access-panel">
      <p class="access-kicker">ACCOUNT / PRIVATE WORKSPACE</p>
      <h1>{{ mode === 'signin' ? 'Vuelve a tu booking.' : 'Crea tu espacio de trabajo.' }}</h1>
      <p class="access-copy">
        {{ mode === 'signin'
          ? 'Accede a tu calendario, solicitudes y configuración privada.'
          : 'Elige después si gestionas tu propio proyecto como DJ o trabajas como agencia.' }}
      </p>

      <div class="access-tabs" role="tablist" aria-label="Tipo de acceso">
        <button :class="{ active: mode === 'signin' }" type="button" @click="mode = 'signin'">Entrar</button>
        <button :class="{ active: mode === 'signup' }" type="button" @click="mode = 'signup'">Crear cuenta</button>
      </div>

      <form class="access-form" @submit.prevent="submit">
        <label v-if="mode === 'signup'">
          <span>Nombre</span>
          <input v-model="displayName" autocomplete="name" minlength="2" required />
        </label>
        <label>
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="email" required />
        </label>
        <label>
          <span>Contraseña</span>
          <input v-model="password" type="password" :autocomplete="mode === 'signin' ? 'current-password' : 'new-password'" minlength="8" required />
        </label>

        <p v-if="errorMessage" class="access-message access-message--error">{{ errorMessage }}</p>
        <p v-if="message" class="access-message">{{ message }}</p>

        <button class="access-submit" type="submit" :disabled="auth.loading.value || !auth.configured.value">
          {{ auth.loading.value ? 'Procesando…' : mode === 'signin' ? 'Entrar al workspace' : 'Crear cuenta' }}
        </button>
      </form>

      <p v-if="!auth.configured.value" class="access-message access-message--error">
        Este entorno todavía no tiene configurada la conexión pública con Supabase.
      </p>

      <NuxtLink class="access-demo" to="/app">Abrir demo sin cuenta</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.access-page { min-height: 100vh; padding: 28px; background: #070707; color: #f2f0eb; }
.access-brand { color: inherit; text-decoration: none; font-weight: 900; letter-spacing: .08em; }
.access-brand span { color: #e8ff2f; }
.access-panel { width: min(560px, 100%); margin: 9vh auto 0; padding: 32px; border: 1px solid #292929; background: #101010; }
.access-kicker { margin: 0 0 18px; color: #e8ff2f; font: 700 12px/1.2 monospace; letter-spacing: .12em; }
h1 { margin: 0; font-size: clamp(2.3rem, 7vw, 4.8rem); line-height: .92; text-transform: uppercase; }
.access-copy { color: #aaa; line-height: 1.55; }
.access-tabs { display: grid; grid-template-columns: 1fr 1fr; margin: 28px 0 20px; border: 1px solid #292929; }
.access-tabs button { padding: 12px; border: 0; background: transparent; color: #aaa; cursor: pointer; }
.access-tabs button.active { background: #e8ff2f; color: #070707; font-weight: 800; }
.access-form { display: grid; gap: 16px; }
label { display: grid; gap: 7px; }
label span { color: #aaa; font: 700 11px/1.2 monospace; text-transform: uppercase; letter-spacing: .1em; }
input { min-height: 48px; padding: 0 14px; border: 1px solid #333; background: #070707; color: #fff; font: inherit; }
.access-submit { min-height: 50px; border: 0; background: #e8ff2f; color: #070707; font: 800 14px/1 sans-serif; cursor: pointer; }
.access-submit:disabled { opacity: .45; cursor: not-allowed; }
.access-message { margin: 0; padding: 12px; border: 1px solid #3b3b3b; color: #ddd; font-size: .9rem; }
.access-message--error { border-color: #8b3434; color: #ffadad; }
.access-demo { display: inline-block; margin-top: 22px; color: #aaa; }
@media (max-width: 620px) { .access-page { padding: 20px; } .access-panel { margin-top: 7vh; padding: 22px; } }
</style>
