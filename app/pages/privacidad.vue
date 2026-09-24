<script setup lang="ts">
const { locale } = useCuePreferences()
const info = useLegalInfo()

useHead(() => ({
  title: locale.value === 'es' ? 'Política de privacidad | Cuebooker' : 'Privacy policy | Cuebooker',
  meta: [{ name: 'robots', content: 'index,follow' }]
}))
</script>

<template>
  <LegalPageShell>
    <div v-if="locale === 'es'">
      <p class="legal-kicker">LEGAL / PRIVACIDAD</p>
      <h1>Política de privacidad</h1>
      <p class="legal-lead">Esta política explica cómo trata Cuebooker los datos personales de artistas, managers, promotores y visitantes.</p>

      <section><h2>Responsable del tratamiento</h2><p><strong>{{ info.owner }}</strong>, NIF {{ info.taxId }}, con domicilio en {{ info.address }}. Contacto: <a :href="`mailto:${info.email}`">{{ info.email }}</a>.</p></section>

      <section><h2>Qué datos tratamos</h2><p>Podemos tratar datos identificativos y de contacto, credenciales de acceso, información profesional y artística, disponibilidad, solicitudes de booking, conversaciones, documentos adjuntos, datos técnicos de seguridad y preferencias de privacidad.</p></section>

      <section><h2>Para qué los utilizamos</h2><ul><li>Crear y administrar cuentas y espacios de trabajo.</li><li>Recibir, organizar y gestionar solicitudes de booking, holds, conversaciones, decisiones y eventos.</li><li>Publicar el perfil artístico y los medios de contacto elegidos por el usuario.</li><li>Enviar comunicaciones necesarias para prestar el servicio.</li><li>Prevenir abuso, fraude e incidencias de seguridad.</li><li>Medir el uso de Cuebooker cuando el visitante acepta la analítica.</li><li>Procesar información mediante Smart Capture cuando el usuario solicita expresamente esa función.</li></ul></section>

      <section><h2>Base jurídica</h2><p>Tratamos los datos necesarios para prestar Cuebooker y aplicar medidas precontractuales solicitadas por los usuarios. Utilizamos el interés legítimo para proteger el servicio y prevenir abusos. La analítica opcional se basa en el consentimiento, que puede retirarse en cualquier momento desde “Configurar cookies”.</p></section>

      <section><h2>Solicitudes dirigidas a artistas</h2><p>Cuando un promotor envía una propuesta, Cuebooker comunica sus datos al artista o al equipo destinatario para gestionar esa solicitud. El destinatario podrá actuar como responsable independiente respecto al uso posterior que realice de la información.</p></section>

      <section><h2>Proveedores</h2><p>Cuebooker utiliza proveedores tecnológicos para alojamiento, base de datos, autenticación, correo, seguridad, analítica y funciones asistidas. Entre ellos pueden encontrarse Supabase, Cloudflare, Brevo, Google y OpenAI, según las funciones activadas. Formalizaremos los acuerdos de tratamiento correspondientes antes del lanzamiento comercial.</p></section>

      <section><h2>Transferencias internacionales</h2><p>Algunos proveedores pueden tratar datos fuera del Espacio Económico Europeo. Cuando corresponda, se aplicarán decisiones de adecuación, cláusulas contractuales tipo u otras garantías admitidas por el RGPD.</p></section>

      <section><h2>Conservación</h2><p>Conservaremos los datos mientras la cuenta permanezca activa y durante el tiempo necesario para prestar el servicio. Tras la eliminación de una cuenta, los datos se suprimirán o bloquearán durante los plazos exigidos para atender obligaciones y responsabilidades legales. Los datos de analítica se conservarán según la configuración publicada en la política de cookies.</p></section>

      <section><h2>Derechos</h2><p>Puedes solicitar acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a <a :href="`mailto:${info.email}`">{{ info.email }}</a>. También puedes retirar un consentimiento sin afectar al tratamiento realizado previamente. Si consideras que tus derechos no han sido atendidos, puedes reclamar ante la <a href="https://www.aepd.es/" target="_blank" rel="noopener noreferrer">Agencia Española de Protección de Datos</a>.</p></section>

      <section><h2>Decisiones automatizadas y menores</h2><p>Cuebooker no adopta decisiones automatizadas con efectos jurídicos sobre los usuarios. El servicio no está dirigido a menores de 18 años.</p></section>

      <p class="legal-meta">Última actualización: {{ info.lastUpdatedEs }}</p>
    </div>

    <div v-else>
      <p class="legal-kicker">LEGAL / PRIVACY</p>
      <h1>Privacy policy</h1>
      <p class="legal-lead">This policy explains how Cuebooker processes personal data belonging to artists, managers, promoters and visitors.</p>

      <section><h2>Data controller</h2><p><strong>{{ info.owner }}</strong>, Spanish tax ID {{ info.taxId }}, located at {{ info.address }}. Contact: <a :href="`mailto:${info.email}`">{{ info.email }}</a>.</p></section>
      <section><h2>Data we process</h2><p>We may process identification and contact details, login credentials, professional and artistic information, availability, booking requests, conversations, attachments, technical security data and privacy preferences.</p></section>
      <section><h2>Purposes</h2><ul><li>Create and administer accounts and workspaces.</li><li>Manage booking requests, holds, conversations, decisions and events.</li><li>Publish the artist profile and the contact methods selected by the user.</li><li>Send communications required to provide the service.</li><li>Prevent abuse, fraud and security incidents.</li><li>Measure usage when the visitor accepts analytics.</li><li>Process information through Smart Capture when requested by the user.</li></ul></section>
      <section><h2>Legal basis</h2><p>Processing required to provide Cuebooker is based on the service relationship and pre-contractual measures requested by users. We rely on legitimate interests to protect the service. Optional analytics relies on consent and can be withdrawn through “Cookie settings”.</p></section>
      <section><h2>Requests sent to artists</h2><p>When a promoter submits a proposal, Cuebooker shares the information with the selected artist or team. That recipient may act as an independent controller for its subsequent use.</p></section>
      <section><h2>Providers and international transfers</h2><p>Cuebooker uses technology providers for hosting, database, authentication, email, security, analytics and assisted features. These may include Supabase, Cloudflare, Brevo, Google and OpenAI. Where data is processed outside the EEA, applicable adequacy decisions, standard contractual clauses or other GDPR safeguards will be used.</p></section>
      <section><h2>Retention</h2><p>Data is kept while the account remains active and for as long as needed to provide the service. After account closure, it will be deleted or restricted for the periods required to address legal duties and liabilities.</p></section>
      <section><h2>Your rights</h2><p>You may request access, rectification, erasure, objection, restriction and portability by emailing <a :href="`mailto:${info.email}`">{{ info.email }}</a>. You may also complain to the <a href="https://www.aepd.es/" target="_blank" rel="noopener noreferrer">Spanish Data Protection Agency</a>.</p></section>
      <section><h2>Automated decisions and minors</h2><p>Cuebooker does not make automated decisions producing legal effects. The service is not intended for anyone under 18.</p></section>
      <p class="legal-meta">Last updated: {{ info.lastUpdatedEn }}</p>
    </div>
  </LegalPageShell>
</template>
