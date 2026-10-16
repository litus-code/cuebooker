<script setup lang="ts">
import type es from '../../content/es/landings.json'
defineProps<{ copy: typeof es }>()
const { locale } = useCuePreferences()
const spanish = computed(() => locale.value !== 'en')
</script>

<template>
  <section class="cl-email-feature" aria-labelledby="smart-email-heading">
    <div class="cl-shell cl-section">
      <div class="cl-email-intro">
        <p class="cl-eyebrow">{{ copy.emailStatus }}</p>
        <h2 id="smart-email-heading">{{ copy.emailTitle }}</h2>
        <p class="cl-lead">{{ copy.emailBody }}</p>
      </div>

      <div class="cl-email-showcase">
        <article class="cl-email-demo-inbox">
          <div class="cl-email-demo-bar"><span class="cl-email-demo-dot" /><span>{{ spanish ? '01 / EMAIL RECIBIDO' : '01 / EMAIL RECEIVED' }}</span><span>INBOX</span></div>
          <div class="cl-email-demo-message">
            <span class="cl-email-demo-label">{{ spanish ? 'ASUNTO' : 'SUBJECT' }}</span>
            <h3>Booking request · Barcelona</h3>
            <p>{{ spanish ? 'Hola, nos gustaría contar con tu proyecto para un evento el 21 de noviembre en Barcelona. ¿Podemos hablar de condiciones?' : 'Hello, we would love to book your act for an event on November 21 in Barcelona. Could we discuss the terms?' }}</p>
            <div class="cl-email-attachments"><span>{{ spanish ? 'ARCHIVOS DEL CORREO' : 'EMAIL ATTACHMENTS' }}</span><div><span><b>PDF</b> Tech Rider.pdf</span><span><b>JPG</b> Lineup.jpg</span></div></div>
          </div>
        </article>

        <div class="cl-email-demo-bridge" aria-hidden="true">
          <span>{{ spanish ? 'CUEBOOKER ANALIZA' : 'CUEBOOKER ANALYSES' }}</span>
          <svg viewBox="0 0 48 48" fill="none"><path d="M6 24h34m-12-12 12 12-12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>

        <article class="cl-email-demo-request">
          <div class="cl-email-demo-bar"><span class="cl-email-demo-dot" /><span>{{ spanish ? '02 / SOLICITUD PREPARADA' : '02 / REQUEST PREPARED' }}</span><span>CUEBOOKER</span></div>
          <h3>{{ spanish ? 'Nueva oportunidad de booking' : 'New booking opportunity' }}</h3>
          <dl>
            <div><dt>{{ spanish ? 'Localidad' : 'Location' }}</dt><dd>Barcelona</dd></div>
            <div><dt>{{ spanish ? 'Fecha' : 'Date' }}</dt><dd>{{ spanish ? '21 de noviembre' : 'November 21' }}</dd></div>
            <div><dt>{{ spanish ? 'Artista' : 'Artist' }}</dt><dd>{{ spanish ? 'Por determinar' : 'To be confirmed' }}</dd></div>
            <div><dt>{{ spanish ? 'Caché' : 'Fee' }}</dt><dd>{{ spanish ? 'No indicado' : 'Not provided' }}</dd></div>
          </dl>
          <div class="cl-email-attachments cl-email-request-attachments"><span>{{ spanish ? 'DOCUMENTOS ASOCIADOS' : 'LINKED DOCUMENTS' }}</span><div><span><b>PDF</b> Tech Rider.pdf</span><span><b>JPG</b> Lineup.jpg</span></div></div>
          <div class="cl-email-review"><span class="cl-email-demo-dot" />{{ spanish ? 'Lista para revisar · Tú decides' : 'Ready for review · You decide' }}</div>
        </article>
      </div>
      <p class="cl-note">{{ copy.example }}</p>
      <p class="cl-note cl-email-availability">{{ copy.emailNote }}</p>
    </div>
  </section>
</template>
