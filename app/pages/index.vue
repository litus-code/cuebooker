<script setup lang="ts">
const form = reactive({ name: '', email: '', role: 'DJ independiente', message: '' })
const sending = ref(false)
const sent = ref(false)
const error = ref('')

async function submitLead() {
  sending.value = true
  error.value = ''
  try {
    await $fetch('/api/leads', { method: 'POST', body: form })
    sent.value = true
    form.name = ''
    form.email = ''
    form.message = ''
  } catch {
    error.value = 'No se ha podido enviar. Escríbeme directamente a contacto@carlesfar.com.'
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <main>
    <nav class="nav shell">
      <a class="brand" href="#inicio"><span class="brand-mark">C</span>CueBooker</a>
      <div class="nav-links"><a href="#problema">Qué resuelve</a><a href="#flujo">Cómo funciona</a><a href="#contacto">Hablar</a></div>
      <a class="nav-cta" href="#contacto">Quiero probarlo <span>↗</span></a>
    </nav>

    <section id="inicio" class="hero shell">
      <div class="hero-copy">
        <p class="eyebrow">PRIVATE BOOKING WORKSPACE</p>
        <h1>Tus fechas merecen un sistema.</h1>
        <p class="lead">CueBooker ordena tus consultas, protege tus tarifas y te muestra el siguiente paso desde el primer mensaje hasta el show confirmado.</p>
        <div class="actions"><a class="button button-lime" href="#contacto">Quiero probarlo <span>↗</span></a><a class="text-button" href="#flujo">Ver cómo funciona <span>↓</span></a></div>
        <p class="microcopy"><span class="pulse" /> Primera versión para DJs y managers</p>
      </div>
      <div class="hero-visual" aria-label="Vista previa del panel de CueBooker">
        <div class="orbit orbit-a" /><div class="orbit orbit-b" />
        <div class="mock back"><div class="mock-top"><span>CALENDARIO</span><span>2026</span></div><div class="calendar-grid"><i v-for="i in 28" :key="i" /></div></div>
        <div class="mock front"><div class="mock-top"><span>CUEBOOKER / SOLICITUDES</span><span class="green-dot" /></div><div class="mock-heading"><span>Buenas tardes, Litus</span><strong>3 acciones para hoy</strong></div><div class="stats"><div><small>Solicitudes</small><b>03</b><em>2 requieren respuesta</em></div><div><small>Confirmadas</small><b>08</b><em>Este mes</em></div><div><small>Disponibilidad</small><b>76%</b><em>Calendario</em></div></div><div class="request"><div class="request-title">Solicitudes que necesitan atención <span>ABRIR</span></div><div class="request-row"><span><b>Nitsa Club</b><small>17 OCT · BARCELONA</small></span><strong>NUEVA</strong><span>↗</span></div><div class="request-row"><span><b>Brava Events</b><small>02 NOV · MADRID</small></span><strong class="orange">NEED INFO</strong><span>↗</span></div><div class="request-row"><span><b>Pulse Festival</b><small>21 NOV · GIRONA</small></span><strong class="purple">CONFIRMADA</strong><span>↗</span></div></div></div>
        <div class="sticker">Cada consulta tiene un siguiente paso <span>↗</span></div>
      </div>
    </section>

    <section class="signal"><div><b>01</b><span>Recibe cada consulta</span></div><div><b>02</b><span>Decide el siguiente paso</span></div><div><b>03</b><span>Confirma sin perder contexto</span></div></section>

    <section id="problema" class="section light shell"><div class="section-head"><div><p class="eyebrow purple">EL PROBLEMA REAL</p><h2>No pierdes bookings por falta de talento.</h2></div><p>Los pierdes cuando la fecha está en WhatsApp, la tarifa en un email y el seguimiento en tu cabeza.</p></div><div class="problem-grid"><article><span>01</span><h3>Una consulta se pierde</h3><p>Mensajes, audios y capturas sin un siguiente paso visible.</p></article><article><span>02</span><h3>Una fecha se cruza</h3><p>Sin una agenda fiable, responder rápido también puede crear problemas.</p></article><article><span>03</span><h3>Una oportunidad se enfría</h3><p>Cuando tardas en contestar, el promotor busca a otro artista.</p></article></div></section>

    <section id="flujo" class="section dark shell"><div class="section-head"><div><p class="eyebrow">EL FLUJO</p><h2>Del primer mensaje al show confirmado.</h2></div><p>Un registro completo, un estado entendible y una acción pendiente en cada consulta.</p></div><div class="flow"><div class="flow-step"><b>01</b><div><h3>Entra la consulta</h3><p>El promotor envía fecha, ciudad, evento y mensaje.</p></div></div><div class="flow-step active"><b>02</b><div><h3>Revisas el contexto</h3><p>Ves disponibilidad, email, tarifa privada y detalles del evento.</p></div></div><div class="flow-step"><b>03</b><div><h3>Respondes por email</h3><p>Pides información, preparas una propuesta y mantienes el hilo.</p></div></div><div class="flow-step"><b>04</b><div><h3>Confirmas y archivas</h3><p>La fecha pasa al calendario y la consulta queda en el historial.</p></div></div></div></section>

    <section class="section audience shell"><div><p class="eyebrow purple">PARA TU FORMA DE TRABAJAR</p><h2>Empieza solo.<br />Crece con equipo.</h2></div><div class="audience-grid"><article><span>01</span><h3>DJ independiente</h3><p>Un enlace para recibir consultas, un panel para decidir y un calendario que puedes leer de un vistazo.</p><a href="#contacto">Quiero probarlo ↗</a></article><article><span>02</span><h3>Manager o agencia</h3><p>Una cuenta para varios perfiles, con cada solicitud en el lugar del artista correcto.</p><a href="#contacto">Hablar del proyecto ↗</a></article></div></section>

    <section id="contacto" class="contact shell"><div><p class="eyebrow">PRIMERA VERSIÓN</p><h2>Cuéntame cómo recibes tus bookings.</h2><p>Estoy preparando CueBooker con DJs y managers que trabajan con contrataciones reales. Déjame tus datos y te enseño el flujo.</p><p class="direct">También puedes escribir a <a href="mailto:contacto@carlesfar.com">contacto@carlesfar.com</a>.</p></div><form @submit.prevent="submitLead"><label>Tu nombre<input v-model="form.name" required autocomplete="name" placeholder="Litus" /></label><label>Email<input v-model="form.email" required type="email" autocomplete="email" placeholder="tu@email.com" /></label><label>Cómo trabajas<select v-model="form.role"><option>DJ independiente</option><option>Manager o agencia</option><option>Promotor / sala</option></select></label><label>Qué te gustaría resolver<textarea v-model="form.message" rows="4" placeholder="Cuéntame cómo recibes y gestionas tus consultas..."></textarea></label><button class="button button-lime" :disabled="sending">{{ sending ? 'Enviando...' : sent ? 'Solicitud recibida' : 'Quiero probarlo ↗' }}</button><p v-if="sent" class="form-success">Gracias. Te escribiré a tu email.</p><p v-if="error" class="form-error">{{ error }}</p></form></section>

    <footer class="footer shell"><span>CueBooker © 2026</span><span>Booking operations for artists</span><a href="#inicio">Arriba ↗</a></footer>
  </main>
</template>
