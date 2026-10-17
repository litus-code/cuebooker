<script setup lang="ts">
const props=defineProps<{locale:'es'|'en'}>()
const es=computed(()=>props.locale==='es')
</script>
<template>
 <aside class="mailbox-beta-note" :aria-label="es?'Condiciones de la beta de correo':'Email beta conditions'">
  <h3>{{es?'Conexión de correo en beta':'Email connection beta'}}</h3>
  <p>{{es?'Acceso gratuito durante la beta, con plazas limitadas. Más adelante formará parte de un plan de pago. Te avisaremos antes de cualquier cambio y no te cobraremos automáticamente.':'Free access during the beta, with limited places. Later it will be part of a paid plan. We will notify you before any change and will not charge you automatically.'}}</p>
  <p>{{es?'El formulario de solicitudes y las respuestas desde el correo de Cuebooker siguen disponibles sin conectar tu buzón.':'The enquiry form and replies from Cuebooker’s email remain available without connecting your mailbox.'}}</p>
 </aside>
</template>
<style scoped>
.mailbox-beta-note{padding:14px 16px;margin:16px 0;border:1px solid var(--cp-line,var(--cue-border));border-left:3px solid #679cdc;border-radius:var(--cue-radius-control,10px);background:color-mix(in srgb,#679cdc 8%,transparent);color:var(--cp-paper,var(--cue-text))}.mailbox-beta-note h3{font-size:14px;line-height:1.4;margin:0 0 6px}.mailbox-beta-note p+p{margin-top:8px}.mailbox-beta-note p{font-size:13px;line-height:1.6;margin:0;color:var(--cp-muted,var(--cue-muted))}
</style>
