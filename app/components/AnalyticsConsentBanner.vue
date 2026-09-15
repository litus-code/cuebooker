<script setup lang="ts">
const analytics = useAnalytics()
const { locale } = useCuePreferences()

const visible = computed(() => analytics.consent.value === 'unknown')
const copy = computed(() => locale.value === 'es'
  ? {
      label: 'Preferencias de cookies',
      title: 'Cookies opcionales',
      body: 'Usamos analítica para entender cómo se usa Cuebooker y mejorar el producto. No cargamos analítica hasta que aceptes.',
      reject: 'Rechazar',
      accept: 'Aceptar cookies'
    }
  : {
      label: 'Cookie preferences',
      title: 'Optional cookies',
      body: 'We use analytics to understand how Cuebooker is used and improve the product. Analytics does not load until you accept.',
      reject: 'Reject',
      accept: 'Accept cookies'
    })
</script>

<template>
  <aside v-if="visible" class="analytics-consent" :aria-label="copy.label">
    <div class="analytics-consent__copy">
      <strong>{{ copy.title }}</strong>
      <p>{{ copy.body }}</p>
    </div>
    <div class="analytics-consent__actions">
      <button class="analytics-consent__button analytics-consent__button--secondary" type="button" @click="analytics.deny">{{ copy.reject }}</button>
      <button class="analytics-consent__button" type="button" @click="analytics.accept">{{ copy.accept }}</button>
    </div>
  </aside>
</template>

<style scoped>
.analytics-consent { position:fixed; z-index:1200; right:20px; bottom:max(20px,env(safe-area-inset-bottom)); left:20px; display:flex; max-width:820px; margin:0 auto; padding:18px 20px; gap:22px; align-items:center; justify-content:space-between; border:1px solid var(--cue-toggle,#e8ff2f); border-radius:16px; background:rgba(10,10,10,.97); color:var(--cue-text,#f2f0eb); box-shadow:0 18px 60px rgba(0,0,0,.55),0 0 24px color-mix(in srgb,var(--cue-toggle,#e8ff2f) 12%,transparent); backdrop-filter:blur(18px); }
.analytics-consent__copy { min-width:0; }
.analytics-consent__copy strong { display:block; margin-bottom:6px; font-size:15px; }
.analytics-consent__copy p { margin:0; max-width:560px; color:var(--cue-muted,#aaa); font-size:13px; line-height:1.45; }
.analytics-consent__actions { display:flex; flex-shrink:0; gap:8px; }
.analytics-consent__button { min-height:42px; padding:0 16px; border:1px solid var(--cue-toggle,#e8ff2f); border-radius:999px; background:var(--cue-toggle,#e8ff2f); color:#070707; font:inherit; font-size:12px; font-weight:900; cursor:pointer; }
.analytics-consent__button--secondary { background:transparent; color:var(--cue-text,#f2f0eb); border-color:var(--cue-border,#303030); }
@media (max-width:680px) { .analytics-consent { right:12px; left:12px; bottom:max(12px,env(safe-area-inset-bottom)); align-items:stretch; flex-direction:column; gap:14px; padding:16px; } .analytics-consent__actions { width:100%; } .analytics-consent__button { flex:1; } }
</style>
