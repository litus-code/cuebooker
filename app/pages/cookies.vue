<script setup lang="ts">
const { locale } = useCuePreferences()
const info = useLegalInfo()
const analytics = useAnalytics()

useHead(() => ({
  title: locale.value === 'es' ? 'Política de cookies | Cuebooker' : 'Cookie policy | Cuebooker',
  meta: [{ name: 'robots', content: 'index,follow' }]
}))
</script>

<template>
  <LegalPageShell>
    <div v-if="locale === 'es'">
      <p class="legal-kicker">LEGAL / COOKIES</p>
      <h1>Política de cookies</h1>
      <p class="legal-lead">Cuebooker no carga analítica hasta que la aceptas. Puedes cambiar tu elección cuando quieras.</p>

      <section><h2>Qué utilizamos</h2><p>Utilizamos almacenamiento local y una cookie necesaria para recordar tu preferencia de forma consistente entre la web y el Workspace. Si aceptas la analítica, Google Tag Manager puede cargar Google Analytics y sus identificadores de medición.</p></section>

      <section><h2>Detalle</h2><table><thead><tr><th>Elemento</th><th>Finalidad</th><th>Duración</th><th>Tipo</th></tr></thead><tbody><tr><td>cuebooker:analytics-consent:v2</td><td>Recordar localmente si aceptaste o rechazaste la analítica.</td><td>Hasta que borres los datos del navegador o cambies la elección.</td><td>Almacenamiento local necesario.</td></tr><tr><td>cuebooker.analytics-consent.v2</td><td>Mantener la misma elección entre la web y el Workspace.</td><td>1 año.</td><td>Cookie necesaria.</td></tr><tr><td>_ga</td><td>Distinguir visitantes y generar estadísticas agregadas.</td><td>Hasta 2 años.</td><td>Analítica opcional.</td></tr><tr><td>_ga_*</td><td>Mantener el estado de sesión de medición.</td><td>Hasta 2 años.</td><td>Analítica opcional.</td></tr></tbody></table></section>

      <section><h2>Gestionar el consentimiento</h2><p>Puedes aceptar, rechazar o modificar tu elección desde el botón siguiente. Rechazar la analítica no impide utilizar Cuebooker.</p><button type="button" class="legal-cookie-button" @click="analytics.openPreferences">Configurar cookies</button></section>

      <section><h2>Cookies de terceros</h2><p>Cuando se active Google Analytics después del consentimiento, Google podrá tratar información técnica de navegación conforme a sus propias condiciones. La configuración final del contenedor se revisará antes del lanzamiento comercial.</p></section>

      <p class="legal-meta">Responsable: {{ info.owner }} · Contacto: {{ info.email }} · Última actualización: {{ info.lastUpdatedEs }}</p>
    </div>

    <div v-else>
      <p class="legal-kicker">LEGAL / COOKIES</p>
      <h1>Cookie policy</h1>
      <p class="legal-lead">Cuebooker does not load analytics until you accept it. You can change your choice at any time.</p>
      <section><h2>What we use</h2><p>We use necessary local storage and a necessary cookie to keep your preference consistent between the website and Workspace. If you accept analytics, Google Tag Manager may load Google Analytics and its measurement identifiers.</p></section>
      <section><h2>Details</h2><table><thead><tr><th>Item</th><th>Purpose</th><th>Duration</th><th>Type</th></tr></thead><tbody><tr><td>cuebooker:analytics-consent:v2</td><td>Remember locally whether analytics was accepted or rejected.</td><td>Until browser data is deleted or the choice is changed.</td><td>Necessary local storage.</td></tr><tr><td>cuebooker.analytics-consent.v2</td><td>Keep the same choice between the website and Workspace.</td><td>1 year.</td><td>Necessary cookie.</td></tr><tr><td>_ga</td><td>Distinguish visitors and produce aggregated statistics.</td><td>Up to 2 years.</td><td>Optional analytics.</td></tr><tr><td>_ga_*</td><td>Maintain measurement session state.</td><td>Up to 2 years.</td><td>Optional analytics.</td></tr></tbody></table></section>
      <section><h2>Manage consent</h2><p>You can accept, reject or change your choice below. Rejecting analytics does not prevent you from using Cuebooker.</p><button type="button" class="legal-cookie-button" @click="analytics.openPreferences">Cookie settings</button></section>
      <section><h2>Third-party cookies</h2><p>When Google Analytics is enabled after consent, Google may process technical browsing information under its own terms. The final container configuration will be reviewed before commercial launch.</p></section>
      <p class="legal-meta">Controller: {{ info.owner }} · Contact: {{ info.email }} · Last updated: {{ info.lastUpdatedEn }}</p>
    </div>
  </LegalPageShell>
</template>

<style scoped>
.legal-cookie-button {
  min-height: 46px;
  margin-top: 12px;
  padding: 0 20px;
  border: 1px solid var(--cue-accent);
  border-radius: 999px;
  background: var(--cue-accent);
  color: var(--cue-accent-ink);
  font: inherit;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}
</style>
