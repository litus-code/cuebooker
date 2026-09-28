<script setup lang="ts">
const { locale } = useCuePreferences()
const info = useLegalInfo()

useHead(() => ({
  title: locale.value === 'es' ? 'Aviso legal | Cuebooker' : 'Legal notice | Cuebooker',
  meta: [{ name: 'robots', content: 'index,follow' }]
}))
</script>

<template>
  <LegalPageShell>
    <div v-if="locale === 'es'">
      <p class="legal-kicker">LEGAL / TITULARIDAD</p>
      <h1>Aviso legal</h1>
      <p class="legal-lead">Información del titular y condiciones generales de acceso a Cuebooker.</p>

      <section><h2>Titular</h2><p><strong>{{ info.owner }}</strong><br>NIF: {{ info.taxId }}<br>Domicilio: {{ info.address }}<br>Email: <a :href="`mailto:${info.email}`">{{ info.email }}</a></p></section>
      <section><h2>Objeto</h2><p>Cuebooker ofrece herramientas para presentar perfiles artísticos y gestionar solicitudes, conversaciones, disponibilidad y procesos de booking. Las funciones identificadas como beta o próximamente pueden cambiar y todavía no forman parte de una oferta comercial definitiva.</p></section>
      <section><h2>Uso del sitio</h2><p>El usuario debe utilizar Cuebooker de forma lícita, aportar información veraz y respetar los derechos de terceros. No está permitido introducir código malicioso, intentar acceder a áreas restringidas ni utilizar el servicio para comunicaciones fraudulentas o abusivas.</p></section>
      <section><h2>Propiedad intelectual</h2><p>La marca, el diseño, el software y los contenidos propios de Cuebooker pertenecen a su titular o se utilizan con autorización. Los artistas conservan los derechos sobre los materiales que incorporan a sus perfiles y conceden únicamente los permisos necesarios para mostrarlos y prestar el servicio.</p></section>
      <section><h2>Disponibilidad y responsabilidad</h2><p>Trabajamos para mantener el servicio disponible y seguro, pero las versiones beta pueden contener errores o interrupciones. Cuebooker no garantiza la contratación de artistas ni responde de los acuerdos alcanzados directamente entre artistas, managers, promotores o salas.</p></section>
      <section><h2>Enlaces externos</h2><p>Los enlaces a servicios de terceros se facilitan como referencia. Cuebooker no controla sus contenidos, disponibilidad ni políticas.</p></section>
      <section><h2>Ley aplicable</h2><p>Este aviso se rige por la legislación española. Cualquier controversia se someterá a los juzgados que correspondan conforme a la normativa aplicable, respetando siempre los derechos de consumidores y usuarios.</p></section>
      <p class="legal-meta">Última actualización: {{ info.lastUpdatedEs }}</p>
    </div>

    <div v-else>
      <p class="legal-kicker">LEGAL / OWNERSHIP</p>
      <h1>Legal notice</h1>
      <p class="legal-lead">Information about the owner and the general conditions for accessing Cuebooker.</p>
      <section><h2>Owner</h2><p><strong>{{ info.owner }}</strong><br>Spanish tax ID: {{ info.taxId }}<br>Address: {{ info.address }}<br>Email: <a :href="`mailto:${info.email}`">{{ info.email }}</a></p></section>
      <section><h2>Purpose</h2><p>Cuebooker provides tools for artist profiles and for managing requests, conversations, availability and booking processes. Features marked beta or coming soon may change and are not yet part of a definitive commercial offer.</p></section>
      <section><h2>Use of the website</h2><p>Users must use Cuebooker lawfully, provide accurate information and respect third-party rights. Malicious code, unauthorised access attempts, fraud and abuse are prohibited.</p></section>
      <section><h2>Intellectual property</h2><p>The Cuebooker brand, design, software and original content belong to the owner or are used under licence. Artists retain rights over their materials and grant only the permissions needed to display them and provide the service.</p></section>
      <section><h2>Availability and liability</h2><p>We work to keep the service available and secure, but beta versions may contain errors or interruptions. Cuebooker does not guarantee artist engagements and is not responsible for agreements reached directly between artists, managers, promoters or venues.</p></section>
      <section><h2>External links</h2><p>Third-party links are provided for reference. Cuebooker does not control their content, availability or policies.</p></section>
      <section><h2>Applicable law</h2><p>This notice is governed by Spanish law. Disputes will be submitted to the competent courts under applicable law, always respecting consumer rights.</p></section>
      <p class="legal-meta">Last updated: {{ info.lastUpdatedEn }}</p>
    </div>
  </LegalPageShell>
</template>
