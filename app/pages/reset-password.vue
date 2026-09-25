<script setup lang="ts">
const auth = useCueAuth()
const { locale } = useCuePreferences()

const ready = ref(false)
const invalid = ref(false)
const saving = ref(false)
const completed = ref(false)
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')

const copy = computed(() => locale.value === 'es' ? {
  kicker: 'CUENTA / RECUPERACIÓN',
  title: 'Define una nueva contraseña.',
  body: 'Este enlace solo sirve para recuperar tu cuenta. Cuando guardes la nueva contraseña, volverás a iniciar sesión normalmente.',
  password: 'Nueva contraseña',
  confirm: 'Repite la contraseña',
  save: 'Guardar nueva contraseña',
  saving: 'Guardando…',
  mismatch: 'Las contraseñas no coinciden.',
  short: 'La contraseña debe tener al menos 8 caracteres.',
  invalid: 'Este enlace de recuperación no es válido o ha caducado.',
  requestAgain: 'Solicitar otro enlace',
  success: 'Contraseña actualizada. Ya puedes volver a entrar con la nueva contraseña.',
  signin: 'Volver a entrar',
  generic: 'No se pudo actualizar la contraseña. Solicita un enlace nuevo e inténtalo otra vez.',
  titleMeta: 'Nueva contraseña | Cuebooker'
} : {
  kicker: 'ACCOUNT / RECOVERY',
  title: 'Set a new password.',
  body: 'This link is only for account recovery. After saving the new password, sign in normally again.',
  password: 'New password',
  confirm: 'Repeat password',
  save: 'Save new password',
  saving: 'Saving…',
  mismatch: 'The passwords do not match.',
  short: 'The password must contain at least 8 characters.',
  invalid: 'This recovery link is invalid or has expired.',
  requestAgain: 'Request another link',
  success: 'Password updated. You can now sign in with your new password.',
  signin: 'Back to sign in',
  generic: 'The password could not be updated. Request a new link and try again.',
  titleMeta: 'New password | Cuebooker'
})

onMounted(async () => {
  try {
    const consumed = await auth.consumePasswordRecoveryFromUrl()
    if (!consumed) await auth.initialize()
    ready.value = consumed || auth.session.value?.recovery === true
    invalid.value = !ready.value
  } catch {
    ready.value = false
    invalid.value = true
  }
})

async function submit() {
  errorMessage.value = ''
  if (password.value.length < 8) {
    errorMessage.value = copy.value.short
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = copy.value.mismatch
    return
  }

  saving.value = true
  try {
    await auth.setRecoveredPassword(password.value)
    await auth.signOut()
    password.value = ''
    confirmPassword.value = ''
    completed.value = true
    ready.value = false
  } catch {
    errorMessage.value = copy.value.generic
  } finally {
    saving.value = false
  }
}

useHead(() => ({ title: copy.value.titleMeta, htmlAttrs: { lang: locale.value } }))
</script>

<template>
  <main class="reset-page">
    <section class="reset-panel">
      <p class="reset-kicker">{{ copy.kicker }}</p>
      <h1>{{ copy.title }}</h1>
      <p class="reset-copy">{{ copy.body }}</p>

      <div v-if="completed" class="reset-state reset-state--success">
        <p>{{ copy.success }}</p>
        <NuxtLink to="/access?mode=signin">{{ copy.signin }}</NuxtLink>
      </div>

      <div v-else-if="invalid" class="reset-state reset-state--error">
        <p>{{ copy.invalid }}</p>
        <NuxtLink to="/access?mode=forgot">{{ copy.requestAgain }}</NuxtLink>
      </div>

      <form v-else-if="ready" class="reset-form" @submit.prevent="submit">
        <label>
          <span>{{ copy.password }}</span>
          <input v-model="password" type="password" autocomplete="new-password" minlength="8" required>
        </label>
        <label>
          <span>{{ copy.confirm }}</span>
          <input v-model="confirmPassword" type="password" autocomplete="new-password" minlength="8" required>
        </label>
        <p v-if="errorMessage" class="reset-message">{{ errorMessage }}</p>
        <button type="submit" :disabled="saving">
          {{ saving ? copy.saving : copy.save }}
        </button>
      </form>

      <div v-else class="reset-loading" aria-busy="true">•••</div>
    </section>
  </main>
</template>

<style scoped>
.reset-page{
  min-height:calc(100vh - 64px);
  padding:20px 28px 28px;
  background:var(--cue-bg);
  color:var(--cue-text);
}
.reset-panel{
  width:min(560px,100%);
  box-sizing:border-box;
  margin:8px auto 0;
  padding:32px;
  border:1px solid var(--cue-border);
  background:var(--cue-surface);
  box-shadow:0 24px 80px var(--cue-shadow);
}
.reset-kicker{
  margin:0 0 18px;
  color:var(--cue-accent);
  font:700 12px/1.2 monospace;
  letter-spacing:.12em;
}
h1{
  margin:0;
  font-size:clamp(2.3rem,7vw,4.8rem);
  line-height:.92;
  text-transform:uppercase;
}
.reset-copy{
  margin:16px 0 26px;
  color:var(--cue-muted);
  line-height:1.55;
}
.reset-form{
  display:grid;
  gap:16px;
}
label{
  display:grid;
  gap:7px;
}
label span{
  color:var(--cue-muted);
  font:700 11px/1.2 monospace;
  text-transform:uppercase;
  letter-spacing:.1em;
}
input{
  min-height:48px;
  padding:0 14px;
  border:1px solid var(--cue-border);
  background:var(--cue-bg);
  color:var(--cue-text);
  font:inherit;
}
.reset-form>button{
  min-height:50px;
  border:0;
  background:var(--cue-toggle);
  color:var(--cue-toggle-ink);
  cursor:pointer;
  font:800 14px/1 sans-serif;
}
.reset-form>button:disabled{opacity:.45;cursor:not-allowed}
.reset-message{
  margin:0;
  padding:12px;
  border:1px solid #8b3434;
  color:#d65757;
  font-size:.9rem;
}
.reset-state{
  display:grid;
  gap:14px;
  padding:16px;
  border:1px solid var(--cue-border);
}
.reset-state p{margin:0;line-height:1.5}
.reset-state a{
  justify-self:start;
  color:var(--cue-accent);
  font:800 11px/1.2 monospace;
  text-decoration:none;
}
.reset-state--error{border-color:#8b3434}
.reset-state--error p{color:#d65757}
.reset-loading{padding:22px 0;color:var(--cue-muted);letter-spacing:.3em}
@media (max-width:620px){
  .reset-page{padding:12px 18px 18px}
  .reset-panel{margin-top:8px;padding:22px}
}
</style>
