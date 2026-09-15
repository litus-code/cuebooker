<script setup lang="ts">
const route = useRoute()
const { locale, setLocale } = useCuePreferences()
const { bookings, ready, addMessage, setStatus } = useBookingDemo()
const reply = ref('')
const id = computed(() => typeof route.query.id === 'string' ? route.query.id : '')
const booking = computed(() => bookings.value.find(item => item.id === id.value))

const text = computed(() => locale.value === 'es' ? {
  demo: 'VISTA DEL PROMOTOR · ENLACE SEGURO SIMULADO', waiting: 'Cargando solicitud…', missing: 'Esta solicitud no existe en este navegador.', back: 'Volver al perfil',
  hello: 'Seguimiento de tu solicitud', intro: 'No necesitas instalar una app. Aquí puedes leer la respuesta del DJ, contestar y confirmar la fecha.', summary: 'Resumen', conversation: 'Conversación', reply: 'Responder', placeholder: 'Escribe tu respuesta…', send: 'Enviar respuesta', confirm: 'Aceptar y confirmar fecha', confirmed: 'Fecha confirmada', rejected: 'Solicitud rechazada', email: 'En el producto real llegarías aquí desde el botón incluido en el email de CueBooker.'
} : {
  demo: 'PROMOTER VIEW · SIMULATED SECURE LINK', waiting: 'Loading request…', missing: 'This request does not exist in this browser.', back: 'Back to artist',
  hello: 'Your request follow-up', intro: 'No app installation required. Read the DJ reply, answer and confirm the date here.', summary: 'Summary', conversation: 'Conversation', reply: 'Reply', placeholder: 'Write your reply…', send: 'Send reply', confirm: 'Accept and confirm date', confirmed: 'Date confirmed', rejected: 'Request rejected', email: 'In the real product, the CueBooker email button would bring you to this secure page.'
})

function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`))
}

async function sendReply() {
  if (!booking.value || !reply.value.trim()) return
  await addMessage(booking.value.id, 'promoter', reply.value)
  reply.value = ''
}

useHead(() => ({ title: locale.value === 'es' ? 'Seguimiento de solicitud | CueBooker' : 'Request follow-up | CueBooker', htmlAttrs: { lang: locale.value } }))
</script>

<template>
  <main class="promoter-page">
    <header class="profile-nav"><NuxtLink to="/" aria-label="Cuebooker"><CueBrand /></NuxtLink><p>{{ text.demo }}</p><div class="locale-control"><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div></header>
    <section v-if="!ready" class="promoter-state">{{ text.waiting }}</section>
    <section v-else-if="!booking" class="promoter-state"><p>{{ text.missing }}</p><NuxtLink class="button button--primary" to="/artist">{{ text.back }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink></section>
    <template v-else>
      <section class="promoter-hero"><p class="eyebrow">{{ booking.artistName }} / {{ booking.event.venue }}</p><h1>{{ text.hello }}</h1><p>{{ text.intro }}</p><aside><i />{{ text.email }}</aside></section>
      <section class="promoter-booking">
        <article class="promoter-summary"><p class="eyebrow">{{ text.summary }}</p><h2>{{ booking.event.name || booking.event.venue }}</h2><dl><div><dt>DJ</dt><dd>{{ booking.artistName }}</dd></div><div><dt>Fecha</dt><dd>{{ formatDate(booking.event.date) }}</dd></div><div><dt>Sala</dt><dd>{{ booking.event.venue }}</dd></div><div><dt>Ciudad</dt><dd>{{ booking.event.city }}</dd></div><div><dt>Oferta</dt><dd>{{ booking.event.offer }}</dd></div></dl><strong v-if="booking.status === 'confirmed'" class="confirmed-label">✓ {{ text.confirmed }}</strong><strong v-else-if="booking.status === 'rejected'" class="rejected-label">{{ text.rejected }}</strong><button v-else class="button button--primary" @click="setStatus(booking.id, 'confirmed')">{{ text.confirm }} <span>✓</span></button></article>
        <article class="promoter-thread"><p class="eyebrow">{{ text.conversation }}</p><div class="message-thread"><article v-for="message in booking.messages" :key="message.id" :class="`message message--${message.actor}`"><header><strong>{{ message.actor === 'artist' ? booking.artistName : booking.promoter.name }}</strong><time>{{ new Date(message.createdAt).toLocaleString(locale === 'es' ? 'es-ES' : 'en-GB') }}</time></header><p>{{ message.body }}</p><a v-for="file in message.attachments" :key="file.id" href="#" @click.prevent><span class="arrow arrow--right" aria-hidden="true" /> {{ file.name }}</a></article></div><form class="booking-reply" @submit.prevent="sendReply"><label>{{ text.reply }}<textarea v-model="reply" rows="5" :placeholder="text.placeholder" /></label><button class="button button--primary" :disabled="!reply.trim()">{{ text.send }} <span class="arrow arrow--ne" aria-hidden="true" /></button></form></article>
      </section>
    </template>
  </main>
</template>
