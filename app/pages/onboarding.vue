<script setup lang="ts">
const auth = useCueAuth()
const accountType = ref<'dj' | 'agency'>('dj')
const displayName = ref('')
const entityName = ref('')
const entitySlug = ref('')
const errorMessage = ref('')
const submitting = ref(false)

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

watch(entityName, value => {
  entitySlug.value = slugify(value)
})

onMounted(async () => {
  await auth.initialize()
  if (!auth.signedIn.value) {
    await navigateTo('/access')
    return
  }

  if (!auth.profile.value) await auth.fetchProfile()
  if (auth.profile.value?.onboarding_completed) {
    await navigateTo('/app?mode=account')
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
    await navigateTo('/app?mode=account')
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'No se pudo completar la configuración.'
  } finally {
    submitting.value = false
  }
}

useHead({ title: 'Configura tu cuenta | CueBooker' })
</script>

<template>
  <main class="onboarding-page">
    <NuxtLink class="onboarding-brand" to="/">CUEBOOKER<span>/</span></NuxtLink>

    <section class="onboarding-panel">
      <p class="onboarding-kicker">ACCOUNT SETUP / 01</p>
      <h1>¿Cómo trabajas?</h1>
      <p class="onboarding-copy">Esto define la identidad privada que administrará calendario y bookings.</p>

      <div class="type-grid">
        <button type="button" :class="{ active: accountType === 'dj' }" @click="accountType = 'dj'">
          <strong>DJ / ARTISTA</strong>
          <span>Gestiono mi propio proyecto y calendario.</span>
        </button>
        <button type="button" :class="{ active: accountType === 'agency' }" @click="accountType = 'agency'">
          <strong>AGENCIA</strong>
          <span>Gestiono un roster y su operativa de booking.</span>
        </button>
      </div>

      <form class="onboarding-form" @submit.prevent="submit">
        <label>
          <span>Tu nombre</span>
          <input v-model="displayName" minlength="2" autocomplete="name" required />
        </label>
        <label>
          <span>{{ accountType === 'dj' ? 'Nombre artístico' : 'Nombre de la agencia' }}</span>
          <input v-model="entityName" minlength="2" required />
        </label>
        <label>
          <span>Identificador</span>
          <input v-model="entitySlug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required />
        </label>

        <p v-if="errorMessage" class="onboarding-error">{{ errorMessage }}</p>

        <button class="onboarding-submit" type="submit" :disabled="submitting">
          {{ submitting ? 'Guardando…' : 'Crear workspace' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.onboarding-page { min-height: 100vh; padding: 28px; background: #070707; color: #f2f0eb; }
.onboarding-brand { color: inherit; text-decoration: none; font-weight: 900; letter-spacing: .08em; }
.onboarding-brand span { color: #e8ff2f; }
.onboarding-panel { width: min(760px, 100%); margin: 7vh auto 0; }
.onboarding-kicker { margin: 0 0 18px; color: #e8ff2f; font: 700 12px/1.2 monospace; letter-spacing: .12em; }
h1 { margin: 0; font-size: clamp(2.6rem, 8vw, 5.5rem); line-height: .9; text-transform: uppercase; }
.onboarding-copy { max-width: 600px; color: #aaa; line-height: 1.55; }
.type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 30px 0; }
.type-grid button { min-height: 140px; padding: 20px; border: 1px solid #292929; background: #101010; color: #f2f0eb; text-align: left; cursor: pointer; }
.type-grid button.active { border-color: #e8ff2f; box-shadow: inset 0 0 0 1px #e8ff2f; }
.type-grid strong { display: block; margin-bottom: 10px; color: #e8ff2f; font: 800 13px/1.2 monospace; }
.type-grid span { color: #aaa; line-height: 1.45; }
.onboarding-form { display: grid; gap: 16px; padding: 26px; border: 1px solid #292929; background: #101010; }
label { display: grid; gap: 7px; }
label span { color: #aaa; font: 700 11px/1.2 monospace; text-transform: uppercase; letter-spacing: .1em; }
input { min-height: 48px; padding: 0 14px; border: 1px solid #333; background: #070707; color: #fff; font: inherit; }
.onboarding-submit { min-height: 50px; border: 0; background: #e8ff2f; color: #070707; font-weight: 800; cursor: pointer; }
.onboarding-error { margin: 0; padding: 12px; border: 1px solid #8b3434; color: #ffadad; }
@media (max-width: 700px) { .onboarding-page { padding: 20px; } .type-grid { grid-template-columns: 1fr; } .onboarding-form { padding: 20px; } }
</style>
