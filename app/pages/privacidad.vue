<script setup lang="ts">
useHead({ title: 'Política de privacidad | CueBooker', meta: [{ name: 'robots', content: 'index,follow' }] })
</script>

<template>
  <main class="legal-page">
    <NuxtLink to="/">← CueBooker</NuxtLink>
    <h1>Política de privacidad</h1>
    <p class="legal-note">Versión inicial · Última actualización: septiembre de 2026</p>

    <h2>1. Responsable del tratamiento</h2>
    <p>Esta página deja preparada la estructura legal de CueBooker. Antes de la publicación definitiva deberán completarse los datos identificativos y de contacto del responsable del tratamiento.</p>

    <h2>2. Datos que tratamos</h2>
    <p>CueBooker podrá tratar datos de cuenta y perfil, datos profesionales aportados por artistas, agencias o promotores, información necesaria para gestionar solicitudes de booking, datos técnicos y de seguridad y, cuando exista consentimiento, datos de uso y analítica.</p>

    <h2>3. Finalidades y bases jurídicas</h2>
    <p>Los datos se tratarán para prestar y asegurar el servicio, gestionar cuentas y relaciones de booking, atender solicitudes, cumplir obligaciones legales y mejorar CueBooker. La base jurídica dependerá de cada tratamiento: ejecución del servicio, obligación legal, interés legítimo cuando proceda o consentimiento para tratamientos opcionales como la analítica.</p>

    <h2>4. Destinatarios y proveedores</h2>
    <p>Podrán intervenir proveedores tecnológicos necesarios para operar CueBooker. Antes del lanzamiento se documentarán los encargados de tratamiento, su finalidad, ubicación y, cuando corresponda, las garantías aplicables a transferencias internacionales.</p>

    <h2>5. Conservación</h2>
    <p>Los datos se conservarán durante el tiempo necesario para prestar el servicio y cumplir las finalidades descritas, y posteriormente durante los plazos exigidos para atender responsabilidades legales. Se definirá una política de retención específica antes del lanzamiento.</p>

    <h2>6. Derechos</h2>
    <p>Las personas usuarias podrán solicitar acceso, rectificación, supresión, oposición, limitación y portabilidad cuando resulten aplicables, así como retirar un consentimiento sin afectar a la licitud del tratamiento previo.</p>

    <h2>7. Seguridad</h2>
    <p>CueBooker aplicará medidas técnicas y organizativas orientadas a proteger los datos frente a acceso, alteración, pérdida o divulgación no autorizados.</p>

    <h2>8. Cambios</h2>
    <p>La política podrá actualizarse cuando cambien el producto, los tratamientos o los proveedores. Los cambios materiales se comunicarán cuando resulte necesario.</p>

    <div class="legal-warning"><strong>Estado:</strong> base de producto preparada para revisión jurídica. No sustituye la versión legal definitiva ni debe publicarse como definitiva hasta completar identidad del responsable, contacto, proveedores, transferencias, retención y procedimientos de derechos.</div>
  </main>
</template>

<style scoped>
.legal-page { max-width: 820px; margin: 0 auto; padding: 56px 22px 100px; color: #f4f4f4; line-height: 1.7; }
.legal-page a { color: inherit; } h1 { margin: 32px 0 4px; font-size: clamp(2rem, 6vw, 3.6rem); } h2 { margin-top: 36px; font-size: 1.15rem; } p { color: rgba(255,255,255,.72); } .legal-note { font-size: .85rem; } .legal-warning { margin-top: 48px; padding: 18px; border: 1px solid rgba(255,255,255,.16); border-radius: 12px; color: rgba(255,255,255,.72); }
</style>
