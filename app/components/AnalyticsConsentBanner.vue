<script setup lang="ts">
const analytics = useAnalytics()
const showSettings = ref(false)
const analyticsEnabled = ref(false)
const marketingEnabled = ref(false)

const visible = computed(() => analytics.enabled.value && (!analytics.hasDecision.value || analytics.preferencesOpen.value))

watch(visible, (isVisible) => {
  if (!isVisible) return
  analyticsEnabled.value = analytics.consent.value?.analytics ?? false
  marketingEnabled.value = analytics.consent.value?.marketing ?? false
  showSettings.value = analytics.preferencesOpen.value
})

const save = () => analytics.savePreferences(analyticsEnabled.value, marketingEnabled.value)
</script>

<template>
  <div v-if="visible" class="privacy-overlay">
    <aside class="privacy-panel" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
      <template v-if="!showSettings">
        <div class="privacy-copy">
          <p class="privacy-kicker">PRIVACIDAD</p>
          <h2 id="privacy-title">Tu privacidad, bajo control</h2>
          <p>Usamos tecnologías necesarias para que CueBooker funcione y, solo con tu permiso, analítica para entender cómo se utiliza la plataforma y mejorarla.</p>
          <p class="privacy-links"><NuxtLink to="/politica-de-cookies">Política de cookies</NuxtLink> · <NuxtLink to="/privacidad">Política de privacidad</NuxtLink></p>
        </div>
        <div class="privacy-actions">
          <button class="privacy-button" type="button" @click="analytics.acceptAll">Aceptar todas</button>
          <button class="privacy-button privacy-button--secondary" type="button" @click="analytics.rejectOptional">Rechazar opcionales</button>
          <button class="privacy-button privacy-button--text" type="button" @click="showSettings = true">Configurar</button>
        </div>
      </template>

      <template v-else>
        <div class="privacy-copy">
          <p class="privacy-kicker">PREFERENCIAS</p>
          <h2 id="privacy-title">Preferencias de privacidad</h2>
          <p>Puedes cambiar estas opciones cuando quieras desde “Preferencias de cookies”.</p>
        </div>
        <div class="privacy-options">
          <div class="privacy-option">
            <div><strong>Necesarias</strong><p>Imprescindibles para seguridad, sesión y funcionamiento básico.</p></div>
            <span class="privacy-required">Siempre activas</span>
          </div>
          <label class="privacy-option">
            <div><strong>Analíticas</strong><p>Nos permiten medir el uso de CueBooker y mejorar el producto.</p></div>
            <input v-model="analyticsEnabled" type="checkbox" />
          </label>
          <label class="privacy-option">
            <div><strong>Marketing</strong><p>Reservadas para medición de campañas cuando estos servicios estén habilitados.</p></div>
            <input v-model="marketingEnabled" type="checkbox" />
          </label>
        </div>
        <div class="privacy-actions privacy-actions--settings">
          <button class="privacy-button" type="button" @click="save">Guardar preferencias</button>
          <button v-if="!analytics.hasDecision.value" class="privacy-button privacy-button--secondary" type="button" @click="analytics.rejectOptional">Rechazar opcionales</button>
          <button v-else class="privacy-button privacy-button--text" type="button" @click="analytics.closePreferences">Cancelar</button>
        </div>
      </template>
    </aside>
  </div>
</template>

<style scoped>
.privacy-overlay { position: fixed; inset: 0; z-index: 1000; display: grid; place-items: end center; padding: 20px; background: rgba(0,0,0,.32); }
.privacy-panel { width: min(920px, 100%); padding: 24px; border: 1px solid rgba(255,255,255,.18); border-radius: 16px; background: rgba(12,12,14,.98); color: #fff; box-shadow: 0 24px 80px rgba(0,0,0,.55); }
.privacy-kicker { margin: 0 0 8px; font-size: .72rem; letter-spacing: .18em; opacity: .55; }
h2 { margin: 0 0 10px; font-size: clamp(1.35rem, 3vw, 2rem); }
.privacy-copy > p:not(.privacy-kicker) { max-width: 720px; margin: 0; color: rgba(255,255,255,.72); line-height: 1.55; }
.privacy-links { margin-top: 12px !important; font-size: .82rem; }
.privacy-links a { color: #fff; }
.privacy-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
.privacy-button { min-height: 44px; padding: 0 18px; border: 1px solid #fff; border-radius: 999px; background: #fff; color: #0c0c0e; font: inherit; font-weight: 700; cursor: pointer; }
.privacy-button--secondary { background: transparent; color: #fff; border-color: rgba(255,255,255,.5); }
.privacy-button--text { background: transparent; color: #fff; border-color: transparent; text-decoration: underline; }
.privacy-options { display: grid; gap: 10px; margin-top: 22px; }
.privacy-option { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 16px; border: 1px solid rgba(255,255,255,.12); border-radius: 12px; }
.privacy-option strong { display: block; margin-bottom: 4px; }
.privacy-option p { margin: 0; color: rgba(255,255,255,.62); font-size: .85rem; line-height: 1.4; }
.privacy-option input { width: 22px; height: 22px; flex: 0 0 auto; accent-color: white; }
.privacy-required { flex: 0 0 auto; font-size: .78rem; color: rgba(255,255,255,.65); }
@media (max-width: 680px) { .privacy-overlay { padding: 10px; } .privacy-panel { padding: 18px; max-height: calc(100vh - 20px); overflow: auto; } .privacy-actions { flex-direction: column; } .privacy-button { width: 100%; } .privacy-option { align-items: flex-start; } }
</style>
