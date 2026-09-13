<script setup lang="ts">
const { locale, setLocale } = useCuePreferences()
const requestOpen = ref(false)
const sent = ref(false)
const text = computed(() => locale.value === 'es' ? {
  back: 'Volver a descubrir', demo: 'Perfil ficticio para demostrar el flujo', city: 'Berlín',
  available: 'Disponible · 24 OCT 2026', about: 'Techno físico, tensión mecánica y ritmos de Detroit. Nara Voss construye sesiones largas para salas oscuras y pistas cercanas.',
  listen: 'Escuchar', live: 'Directo', dates: 'Fechas', epk: 'EPK',
  request: 'Solicitar booking', title: 'Solicitud para Nara Voss', venue: 'Sala o evento',
  capacity: 'Aforo', offer: 'Oferta', message: 'Mensaje', send: 'Preparar solicitud',
  sent: 'Solicitud preparada', sentBody: 'En el producto real se enviará al workspace del artista o agencia y el promotor recibirá las respuestas por email.'
} : {
  back: 'Back to discovery', demo: 'Fictional profile demonstrating the flow', city: 'Berlin',
  available: 'Available · 24 OCT 2026', about: 'Physical techno, mechanical tension and Detroit rhythms. Nara Voss builds long sets for dark rooms and close dancefloors.',
  listen: 'Listen', live: 'Live', dates: 'Dates', epk: 'EPK',
  request: 'Request booking', title: 'Request for Nara Voss', venue: 'Venue or event',
  capacity: 'Capacity', offer: 'Offer', message: 'Message', send: 'Prepare request',
  sent: 'Request prepared', sentBody: 'In the real product it will enter the artist or agency workspace and the promoter will receive replies by email.'
})
</script>

<template>
  <main class="profile-page">
    <header class="profile-nav">
      <NuxtLink to="/">CUEBOOKER<span>/</span></NuxtLink>
      <p>{{ text.demo }}</p>
      <div><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div>
    </header>
    <section class="profile-hero">
      <div class="profile-visual"><span>DEMO ARTIST / 01</span><i /></div>
      <div class="profile-copy">
        <p class="eyebrow">{{ text.city }} · TECHNO / HARDGROOVE</p>
        <h1>NARA<br><em>VOSS</em></h1>
        <strong class="availability"><i /> {{ text.available }}</strong>
        <p>{{ text.about }}</p>
        <nav><a href="#">{{ text.listen }}</a><a href="#">{{ text.live }}</a><a href="#">{{ text.dates }}</a><a href="#">{{ text.epk }}</a></nav>
        <button class="button button--primary" @click="requestOpen = true">{{ text.request }} <span>↗</span></button>
      </div>
    </section>
    <section v-if="requestOpen" class="request-demo">
      <p class="eyebrow">BOOKING REQUEST / DEMO</p>
      <h2>{{ text.title }}</h2>
      <form v-if="!sent" @submit.prevent="sent = true">
        <label>{{ text.venue }}<input value="Nitsa Club"></label>
        <label>{{ text.capacity }}<input value="1.200"></label>
        <label>{{ text.offer }}<input value="€2.400"></label>
        <label>{{ text.message }}<textarea rows="4">Saturday main room. Full technical rider and local transport included.</textarea></label>
        <button class="button button--primary">{{ text.send }} <span>↗</span></button>
      </form>
      <div v-else class="request-success"><strong>{{ text.sent }}</strong><p>{{ text.sentBody }}</p><NuxtLink to="/app">{{ locale === 'es' ? 'Ver dónde llega' : 'See where it arrives' }} ↗</NuxtLink></div>
    </section>
    <NuxtLink class="profile-back" to="/">← {{ text.back }}</NuxtLink>
  </main>
</template>
