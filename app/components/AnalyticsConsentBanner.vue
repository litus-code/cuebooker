<script setup lang="ts">
const analytics = useAnalytics()
const { locale } = useCuePreferences()

onMounted(() => analytics.init())

const visible = computed(() => analytics.initialized.value && (analytics.consent.value === 'unknown' || analytics.preferencesOpen.value))
const canClose = computed(() => analytics.consent.value !== 'unknown' && analytics.preferencesOpen.value)
const copy = computed(() => locale.value === 'es'
  ? {
      label: 'Preferencias de cookies',
      title: 'Cookies opcionales',
      body: 'Usamos analítica para entender cómo se usa Cuebooker. No cargamos analítica hasta que aceptes y rechazarla no limita el servicio.',
      reject: 'Rechazar',
      accept: 'Aceptar',
      privacy: 'Privacidad',
      cookies: 'Política de cookies',
      close: 'Cerrar preferencias'
    }
  : {
      label: 'Cookie preferences',
      title: 'Optional cookies',
      body: 'We use analytics to understand how Cuebooker is used. Analytics does not load until you accept, and rejecting it does not limit the service.',
      reject: 'Reject',
      accept: 'Accept',
      privacy: 'Privacy',
      cookies: 'Cookie policy',
      close: 'Close preferences'
    })
</script>

<template>
  <aside v-if="visible" class="analytics-consent" :aria-label="copy.label">
    <button v-if="canClose" class="analytics-consent__close" type="button" :aria-label="copy.close" @click="analytics.closePreferences">×</button>
    <div class="analytics-consent__copy">
      <strong>{{ copy.title }}</strong>
      <p>{{ copy.body }}</p>
      <nav :aria-label="locale === 'es' ? 'Información legal' : 'Legal information'">
        <NuxtLink to="/privacidad">{{ copy.privacy }}</NuxtLink>
        <NuxtLink to="/cookies">{{ copy.cookies }}</NuxtLink>
      </nav>
    </div>
    <div class="analytics-consent__actions">
      <button class="analytics-consent__button" type="button" @click="analytics.deny">{{ copy.reject }}</button>
      <button class="analytics-consent__button" type="button" @click="analytics.accept">{{ copy.accept }}</button>
    </div>
  </aside>
</template>

<style scoped>
.analytics-consent {
  position:fixed;
  z-index:1400;
  right:0;
  bottom:0;
  left:0;
  display:flex;
  width:100%;
  max-width:none;
  margin:0;
  padding:18px max(24px,4vw);
  gap:22px;
  align-items:center;
  justify-content:space-between;
  border:1px solid var(--cue-toggle,#e8ff2f);
  border-right:0;
  border-bottom:0;
  border-left:0;
  border-radius:0;
  background:color-mix(in srgb,var(--cue-surface,#101010) 96%,transparent);
  color:var(--cue-text,#f2f0eb);
  box-shadow:0 -18px 60px var(--cue-shadow,rgba(0,0,0,.35)),0 0 24px color-mix(in srgb,var(--cue-toggle,#e8ff2f) 12%,transparent);
  backdrop-filter:blur(18px);
}
.analytics-consent__copy { min-width:0; }
.analytics-consent__copy strong { display:block; margin-bottom:6px; font-size:15px; }
.analytics-consent__copy p { margin:0; max-width:760px; color:var(--cue-muted,#aaa); font-size:13px; line-height:1.45; }
.analytics-consent__copy nav { display:flex; gap:14px; margin-top:7px; }
.analytics-consent__copy a { color:var(--cue-text,#f2f0eb); font-size:11px; }
.analytics-consent__actions { display:grid; grid-template-columns:1fr 1fr; flex-shrink:0; gap:8px; min-width:230px; }
.analytics-consent__button {
  min-height:44px;
  padding:0 16px;
  border:1px solid var(--cue-toggle,#e8ff2f);
  border-radius:999px;
  background:transparent;
  color:var(--cue-text,#f2f0eb);
  font:inherit;
  font-size:12px;
  font-weight:900;
  cursor:pointer;
  transition:transform .18s ease,background .18s ease,color .18s ease;
}
.analytics-consent__button:hover,
.analytics-consent__button:focus-visible {
  background:var(--cue-toggle,#e8ff2f);
  color:var(--cue-toggle-ink,#070707);
}
.analytics-consent__close {
  position:absolute;
  top:8px;
  right:12px;
  display:grid;
  place-items:center;
  width:36px;
  height:36px;
  padding:0;
  border:0;
  background:transparent;
  color:var(--cue-text,#f2f0eb);
  font-size:25px;
  cursor:pointer;
}
@media (hover:hover) and (pointer:fine) {
  .analytics-consent__button:hover { transform:translateY(-2px); }
}
@media (max-width:680px) {
  .analytics-consent {
    right:12px;
    left:12px;
    bottom:max(12px,env(safe-area-inset-bottom));
    width:auto;
    border:1px solid var(--cue-toggle,#e8ff2f);
    border-radius:16px;
    align-items:stretch;
    flex-direction:column;
    gap:14px;
    padding:16px;
  }
  .analytics-consent__copy { padding-right:24px; }
  .analytics-consent__actions { width:100%; min-width:0; }
}
</style>
