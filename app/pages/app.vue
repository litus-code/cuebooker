<script setup lang="ts">
const { locale, setLocale } = useCuePreferences()
const text = computed(() => locale.value === 'es' ? {
  eyebrow: 'WORKSPACE / PRÓXIMA FASE', title: 'Aquí llega la solicitud.',
  body: 'La solicitud del promotor entrará en la bandeja del artista o agencia con fecha, sala, aforo, oferta y mensaje. Desde aquí podrán responder por email, cambiar el estado y confirmar la fecha en el calendario.',
  note: 'Este workspace todavía no forma parte de la primera entrega comercial. Lo mostraremos como flujo funcional en la siguiente fase.',
  back: 'Volver a la web comercial'
} : {
  eyebrow: 'WORKSPACE / NEXT PHASE', title: 'The request arrives here.',
  body: 'The promoter request enters the artist or agency inbox with date, venue, capacity, offer and message. From here they can reply by email, change its status and confirm the date in the calendar.',
  note: 'This workspace is not part of the first commercial delivery yet. It will become a functional flow in the next phase.',
  back: 'Back to the commercial website'
})
</script>

<template>
  <main class="workspace-handoff">
    <header><NuxtLink to="/">CUEBOOKER<span>/</span></NuxtLink><div><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div></header>
    <section><p class="eyebrow">{{ text.eyebrow }}</p><h1>{{ text.title }}</h1><p>{{ text.body }}</p><aside>{{ text.note }}</aside><NuxtLink class="button button--primary" to="/">{{ text.back }} <span>↗</span></NuxtLink></section>
  </main>
</template>
