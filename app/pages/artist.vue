<script setup lang="ts">
import { createId, type BookingAttachment } from '../domain/booking'

const { locale, setLocale } = useCuePreferences()
const { submit } = useBookingDemo()
const requestOpen = ref(false)
const sending = ref(false)
const sentBookingId = ref('')
const attachments = ref<BookingAttachment[]>([])
const form = reactive({
  name: '', email: '', phone: '', event: '', venue: '', city: 'Barcelona',
  date: '2026-10-24', capacity: '', offer: '', schedule: '', message: ''
})

const text = computed(() => locale.value === 'es' ? {
  back: 'Volver', demo: 'Perfil ficticio · flujo funcional', city: 'Berlín',
  available: 'Disponible · 24 OCT 2026', about: 'Techno físico, tensión mecánica y ritmos de Detroit. Nara Voss construye sesiones largas para salas oscuras y pistas cercanas.',
  listen: 'Escuchar', live: 'Directo', dates: 'Fechas', epk: 'EPK', request: 'Solicitar fecha',
  title: 'Cuéntanos la fecha. Sin registrarte.', intro: 'Los datos llegan ordenados al DJ. Recibirás su respuesta en tu correo y podrás continuar desde un enlace seguro.',
  name: 'Tu nombre', email: 'Email de respuesta', phone: 'Teléfono opcional', event: 'Evento', venue: 'Sala', cityLabel: 'Ciudad', date: 'Fecha', capacity: 'Aforo', offer: 'Oferta', schedule: 'Horario propuesto', message: 'Mensaje para el DJ', files: 'Adjuntar rider, propuesta o información', send: 'Enviar solicitud', sending: 'Guardando solicitud',
  privacy: 'Demo local: los datos se guardan únicamente en este navegador. En el producto real se enviarán de forma segura al artista.',
  sent: 'Solicitud enviada', sentBody: 'Así de simple debería ser para el promotor. Ahora puedes comprobar cómo continúa el seguimiento desde su enlace.', promoterView: 'Ver seguimiento del promotor'
} : {
  back: 'Back', demo: 'Fictional profile · functional flow', city: 'Berlin',
  available: 'Available · 24 OCT 2026', about: 'Physical techno, mechanical tension and Detroit rhythms. Nara Voss builds long sets for dark rooms and close dancefloors.',
  listen: 'Listen', live: 'Live', dates: 'Dates', epk: 'EPK', request: 'Request a date',
  title: 'Tell us about the date. No account required.', intro: 'The DJ receives structured details. Their reply reaches your email and you can continue through a secure link.',
  name: 'Your name', email: 'Reply email', phone: 'Optional phone', event: 'Event', venue: 'Venue', cityLabel: 'City', date: 'Date', capacity: 'Capacity', offer: 'Offer', schedule: 'Proposed schedule', message: 'Message for the DJ', files: 'Attach rider, proposal or information', send: 'Send request', sending: 'Saving request',
  privacy: 'Local demo: data is stored only in this browser. The real product will send it securely to the artist.',
  sent: 'Request sent', sentBody: 'This is how simple it should feel for the promoter. Now check how the follow-up continues through the secure link.', promoterView: 'View promoter follow-up'
})

function selectFiles(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files || [])
  attachments.value = files.map(file => ({ id: createId('attachment'), name: file.name, type: file.type || 'application/octet-stream', size: file.size }))
}

async function sendRequest() {
  sending.value = true
  try {
    const booking = await submit({
      artistId: 'nara-voss', artistName: 'Nara Voss',
      promoter: { name: form.name, email: form.email, phone: form.phone },
      event: { name: form.event, venue: form.venue, city: form.city, date: form.date, capacity: form.capacity, offer: form.offer, schedule: form.schedule },
      message: form.message,
      attachments: attachments.value
    })
    sentBookingId.value = booking.id
  } finally {
    sending.value = false
  }
}

function openRequest() {
  requestOpen.value = true
  nextTick(() => document.querySelector('#request')?.scrollIntoView({ behavior: 'smooth' }))
}

useHead(() => ({
  htmlAttrs: { lang: locale.value },
  title: locale.value === 'es' ? 'Nara Voss · Solicitar booking | CueBooker' : 'Nara Voss · Request booking | CueBooker',
  meta: [{ name: 'description', content: locale.value === 'es' ? 'Consulta disponibilidad y envía una solicitud completa a Nara Voss.' : 'Check availability and send a complete request to Nara Voss.' }]
}))
</script>

<template>
  <main class="profile-page">
    <header class="profile-nav">
      <NuxtLink to="/">CUEBOOKER<span>/</span></NuxtLink>
      <p>{{ text.demo }}</p>
      <div class="locale-control"><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div>
    </header>

    <section class="profile-hero">
      <div class="profile-visual"><span>DEMO ARTIST / 01</span><i /></div>
      <div class="profile-copy">
        <p class="eyebrow">{{ text.city }} · TECHNO / HARDGROOVE</p>
        <h1>NARA<br><em>VOSS</em></h1>
        <strong class="availability"><i /> {{ text.available }}</strong>
        <p>{{ text.about }}</p>
        <nav><a href="#">{{ text.listen }}</a><a href="#">{{ text.live }}</a><a href="#">{{ text.dates }}</a><a href="#">{{ text.epk }}</a></nav>
        <button class="button button--primary" @click="openRequest">{{ text.request }} <span class="arrow arrow--ne" aria-hidden="true" /></button>
      </div>
    </section>

    <section v-if="requestOpen" id="request" class="request-demo">
      <p class="eyebrow">BOOKING LINK / NARA VOSS</p>
      <h2>{{ text.title }}</h2>
      <p class="request-demo__intro">{{ text.intro }}</p>

      <form v-if="!sentBookingId" @submit.prevent="sendRequest">
        <label>{{ text.name }}<input v-model="form.name" required autocomplete="name"></label>
        <label>{{ text.email }}<input v-model="form.email" required type="email" autocomplete="email"></label>
        <label>{{ text.phone }}<input v-model="form.phone" type="tel" autocomplete="tel"></label>
        <label>{{ text.event }}<input v-model="form.event" required placeholder="Brava Closing"></label>
        <label>{{ text.venue }}<input v-model="form.venue" required placeholder="Nitsa Club"></label>
        <label>{{ text.cityLabel }}<input v-model="form.city" required></label>
        <label>{{ text.date }}<input v-model="form.date" required type="date"></label>
        <label>{{ text.capacity }}<input v-model="form.capacity" required inputmode="numeric" placeholder="1.200"></label>
        <label>{{ text.offer }}<input v-model="form.offer" required placeholder="2.400 €"></label>
        <label>{{ text.schedule }}<input v-model="form.schedule" placeholder="02:00–04:00"></label>
        <label class="request-demo__message">{{ text.message }}<textarea v-model="form.message" required rows="5" placeholder="Contexto, propuesta, producción y cualquier dato que ayude a decidir."></textarea></label>
        <label class="file-field"><span>{{ text.files }}</span><input multiple type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip" @change="selectFiles"><small v-if="attachments.length">{{ attachments.map(file => file.name).join(' · ') }}</small></label>
        <p class="form-privacy">{{ text.privacy }}</p>
        <button class="button button--primary" :disabled="sending">{{ sending ? text.sending : text.send }} <span class="arrow arrow--ne" aria-hidden="true" /></button>
      </form>

      <div v-else class="request-success">
        <span class="success-signal">✓</span><strong>{{ text.sent }}</strong><p>{{ text.sentBody }}</p>
        <div><NuxtLink class="button button--primary" :to="`/request?id=${sentBookingId}`">{{ text.promoterView }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink></div>
      </div>
    </section>

    <NuxtLink class="profile-back" to="/"><span class="arrow arrow--left" aria-hidden="true" /> {{ text.back }}</NuxtLink>
  </main>
</template>
