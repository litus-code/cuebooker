<script setup lang="ts">
import es from '../../content/es/home.json'
import en from '../../content/en/home.json'

const { locale, theme, setLocale, setTheme } = useCuePreferences()
const baseCopy = computed(() => locale.value === 'es' ? es : en)
const menuOpen = ref(false)
const navHidden = ref(false)
const backToTopVisible = ref(false)
const lastScrollY = ref(0)
let scrollDirection = 0
let scrollDistance = 0
const heroImage = `${useRuntimeConfig().app.baseURL}club-hero.webp`
const activeRole = ref<'artist' | 'manager'>('artist')
const shareMode = ref<'profile' | 'website' | 'qr'>('profile')
const router = useRouter()
const analytics = useAnalytics()

const p = computed(() => locale.value === 'es' ? {
  nav: { system: 'Cómo funciona', distribution: 'Distribución', identity: 'CUE ID', login: 'Iniciar sesión', signup: 'Crear cuenta' },
  hero: {
    eyebrow: 'PARA QUIEN MUEVE LA NOCHE',
    title: 'Que la música siga avanzando.',
    accent: 'El booking ya está ocurriendo.',
    body: 'Solicitudes, conversaciones y fechas en tu espacio de trabajo. Tú decides el siguiente paso.',
    flow: { channels: ['Instagram · 22:47', 'WhatsApp · 23:12', 'Formulario web · 00:06'], label: 'CUEBOOKER / NUEVA SOLICITUD', booking: 'Warehouse 23 / Barcelona', detail: '18 oct · Techno · 1.200 €', status: 'Pendiente de decisión' },
    primary: 'Abrir mi espacio',
    secondary: 'Cómo funciona',
    note: 'Hecho para DJs, managers y las personas que hacen posible cada noche.'
  },
  ticker: ['Reservas', 'Conversaciones', 'Calendario', 'Perfil de artista', 'Automatización', 'CUE ID'],
  system: {
    title: 'La noche es la parte visible. Cuebooker gestiona todo lo que la hace posible.',
    body: 'Cada solicitud, respuesta, fecha, contacto y decisión vive dentro del mismo sistema. Menos trabajo disperso. Más espacio para lo que realmente mueve tu carrera.',
    cards: [
      ['01 / CAPTURA', 'Cada oportunidad entra con contexto.', 'Fecha, caché, lugar y contacto, desde el primer mensaje.'],
      ['02 / AVANCE', 'Cada conversación sabe cuál es su siguiente paso.', 'Responde, haz seguimiento, bloquea una fecha, confirma el bolo o archiva la oportunidad sin perder el contexto.'],
      ['03 / AIRE', 'El trabajo repetitivo empieza a desaparecer.', 'Automatiza la parte mecánica mientras tú mantienes el control de las decisiones que marcan tu carrera.']
    ]
  },
  stage: {
    kicker: 'UNA ÚNICA SUPERFICIE DE TRABAJO',
    title: 'Tus reservas no son un problema de hojas de cálculo.',
    body: 'Son un flujo de señales, personas, fechas y decisiones. Cuebooker les da un lugar donde aterrizar, un estado por el que avanzar y un historial en el que confiar.',
    points: [['Solicitudes', 'Recibe el briefing antes de que empiece el intercambio interminable de mensajes.'], ['Actividad', 'Mantén juntos el hilo, la decisión y la siguiente acción.'], ['Calendario', 'Consulta tu disponibilidad real antes de comprometerte.']],
    workspace: 'cuebooker / espacio de trabajo',
    greeting: 'Buenas tardes, Litus',
    week: 'Tu semana, sin ruido.',
    newBooking: '+ Nueva reserva',
    metrics: [['Solicitudes abiertas', '08', false], ['Fechas bloqueadas', '04', true], ['Confirmadas', '12', false]],
    bookings: [['Warehouse 23 / Barcelona', '18 oct · Techno · 1.200 €', 'Nueva', 'lime'], ['Club Mondo / Madrid', '02 nov · Peak time · 1.800 €', 'Pendiente', 'red'], ['Pulse Room / Berlín', '16 nov · Closing set · 2.100 €', 'Confirmada', 'blue']]
  },
  manifesto: { kicker: 'LA FORMA CUEBOOKER DE HACERLO', title: 'Tú pones la energía. El sistema soporta el peso.', body: 'Tú sigues decidiendo qué encaja contigo, con quién quieres trabajar y hacia dónde quieres llevar tu sonido. Cuebooker despeja el trabajo repetitivo que rodea esas decisiones.' },
  control: {
    title: 'Más ayuda. Más control.',
    body: 'El asistente aparece cuando el proceso se repite. El artista sigue presente cuando la decisión es personal.',
    assistant: 'LA CAPA ASISTENTE',
    assistantTitle: 'Mensajes que saben para qué están ahí.',
    assistantBody: 'Mantén viva la conversación sin convertir cada respuesta en otra pequeña tarea que recordar.',
    human: 'LA CAPA HUMANA',
    humanTitle: 'Toma la decisión cuando importa.',
    artist: 'Soy artista',
    manager: 'Gestiono artistas',
    artistBody: 'Crea un perfil que se parezca a ti, recibe mejores solicitudes y mantén fechas, contactos y decisiones en un único espacio de trabajo.',
    managerBody: 'Trabaja con varios artistas sin perder el hilo. Mantén solicitudes, disponibilidad, contactos y seguimientos dentro del mismo espacio.',
    artistFeatures: ['Perfil público con una vía clara para contratarte', 'Visibilidad del calendario antes de comprometerte', 'Historial de reservas que crece contigo'],
    managerFeatures: ['Cambia de artista sin cambiar de sistema', 'Controla el estado de cada oportunidad', 'Dale contexto al artista, no más trabajo administrativo']
  },
  distribution: {
    heading: 'Tu web, tu bio o una pegatina en la cabina.',
    body: 'No necesitas rehacer tu web ni pedirle a la gente que busque cómo contactarte. Cuebooker se adapta a la forma en la que ya compartes tu música.',
    profile: 'VISIBILIDAD DEL PERFIL', profileTitle: 'Tu perfil, público cuando tú decides.', profileBody: 'Compártelo para recibir solicitudes o mantenlo privado mientras lo preparas.',
    link: 'ENLACE SOCIAL', linkTitle: 'Un enlace para Instagram, bio y redes.', linkBody: 'Publica una URL única en Instagram, TikTok, SoundCloud, WhatsApp o donde quieras.',
    iframe: 'IFRAME', iframeTitle: '¿Ya tienes web? El formulario entra dentro.', iframeBody: 'Inserta el widget de Cuebooker en tu propia web. Tu imagen sigue siendo tuya y el flujo de booking funciona por detrás.',
    label: 'VISIBILIDAD DEL PERFIL', live: 'Público', private: 'Privado', dj: 'ARTISTA / CIUDAD', name: 'Tu nombre', sound: 'Tus estilos',
    copy: 'Copiar enlace', instagram: 'Compartir en Instagram', qr: 'Descargar QR',
    kicker: 'UNA RUTA PARA CADA ARTISTA', title: 'Una misma puerta, estés donde estés.', detail: 'Da igual desde dónde llegue un promotor. La información entra completa y tú la gestionas desde el mismo espacio.',
    items: [['Perfil público', 'Para quien todavía no tiene web.'], ['Enlace compartible', 'Para Instagram, redes, mensajes y newsletters.'], ['Widget embebible', 'Para quien ya tiene una web propia.'], ['QR de booking', 'Para carteles, flyers, tarjetas y eventos.']]
  },
  identity: { kicker: 'PERFIL DE ARTISTA', title: 'Tu perfil también tiene presencia.', body: 'CUE ID será la firma visual de tu perfil. El avatar y la personalización están en beta, para que tu identidad crezca sin convertirse en una plantilla.', profile: 'Perfil de artista', active: 'BETA · EN EVOLUCIÓN' },
  closing: { title: 'Haz espacio para la parte que solo tú puedes hacer.', body: 'Cuebooker es la capa de trabajo entre la oportunidad y la noche. Empieza con tu próxima reserva.', cta: 'Crear mi espacio de trabajo' }
} : {
  nav: { system: 'How it works', distribution: 'Distribution', identity: 'CUE ID', login: 'Sign in', signup: 'Create account' },
  hero: {
    eyebrow: 'FOR THE PEOPLE WHO MOVE THE NIGHT',
    title: 'Let the music keep moving.',
    accent: 'Booking is already happening.',
    body: 'Requests, conversations and dates in your workspace. You decide what happens next.',
    flow: { channels: ['Instagram · 22:47', 'WhatsApp · 23:12', 'Web form · 00:06'], label: 'CUEBOOKER / NEW REQUEST', booking: 'Warehouse 23 / Barcelona', detail: '18 Oct · Techno · €1,200', status: 'Waiting for your decision' },
    primary: 'Open my workspace',
    secondary: 'How it works',
    note: 'Made for DJs, managers and the people who make every night happen.'
  },
  ticker: ['Bookings', 'Conversations', 'Calendar', 'Artist profile', 'Automation', 'CUE ID'],
  system: {
    title: 'The night is what people see. Cuebooker handles everything that makes it possible.',
    body: 'Every request, reply, date, contact and decision lives in one system. Less scattered work. More room for what moves your career.',
    cards: [
      ['01 / CAPTURE', 'Every opportunity arrives with context.', 'Date, fee, venue and contact details, from the first message.'],
      ['02 / MOVE FORWARD', 'Every conversation knows its next step.', 'Reply, follow up, hold a date, confirm the gig or archive the opportunity without losing context.'],
      ['03 / AIR', 'Repetitive work starts to disappear.', 'Automate the mechanical part while you keep control of the decisions that shape your career.']
    ]
  },
  stage: {
    kicker: 'ONE WORKSPACE FOR THE WHOLE OPERATION',
    title: 'Your bookings are not a spreadsheet problem.',
    body: 'They are a flow of signals, people, dates and decisions. Cuebooker gives them somewhere to land, a status to move through and a history you can trust.',
    points: [['Requests', 'Receive the briefing before the endless message exchange starts.'], ['Activity', 'Keep the thread, decision and next action together.'], ['Calendar', 'Check your real availability before committing.']],
    workspace: 'cuebooker / workspace',
    greeting: 'Good afternoon, Litus',
    week: 'Your week, without the noise.',
    newBooking: '+ New booking',
    metrics: [['Open requests', '08', false], ['Held dates', '04', true], ['Confirmed', '12', false]],
    bookings: [['Warehouse 23 / Barcelona', '18 Oct · Techno · €1,200', 'New', 'lime'], ['Club Mondo / Madrid', '02 Nov · Peak time · €1,800', 'Pending', 'red'], ['Pulse Room / Berlin', '16 Nov · Closing set · €2,100', 'Confirmed', 'blue']]
  },
  manifesto: { kicker: 'THE CUEBOOKER WAY', title: 'You bring the energy. The system carries the weight.', body: 'You still decide what fits, who you work with and where you want to take your sound. Cuebooker clears the repetitive work around those decisions.' },
  control: {
    title: 'More help. More control.',
    body: 'The assistant appears when a process repeats. The artist stays present when the decision is personal.',
    assistant: 'THE ASSISTANT LAYER', assistantTitle: 'Messages that know what they are for.', assistantBody: 'Keep the conversation alive without turning every reply into another small task to remember.',
    human: 'THE HUMAN LAYER', humanTitle: 'Make the call when it matters.', artist: 'I am an artist', manager: 'I manage artists',
    artistBody: 'Create a profile that feels like you, receive better requests and keep dates, contacts and decisions in one workspace.',
    managerBody: 'Work with several artists without losing the thread. Keep requests, availability, contacts and follow-ups in the same place.',
    artistFeatures: ['A public profile with a clear route to hire you', 'Calendar visibility before you commit', 'A booking history that grows with you'],
    managerFeatures: ['Switch artists without switching systems', 'Track the state of every opportunity', 'Give the artist context, not more admin']
  },
  distribution: {
    heading: 'Your website, your bio or a sticker in the booth.',
    body: 'You do not need to rebuild your website or make people search for how to contact you. Cuebooker fits the way you already share your music.',
    profile: 'PROFILE VISIBILITY', profileTitle: 'Your profile, public when you decide.', profileBody: 'Share it to receive requests or keep it private while you prepare it.',
    link: 'SOCIAL LINK', linkTitle: 'One link for Instagram, bio and social.', linkBody: 'Publish one URL on Instagram, TikTok, SoundCloud, WhatsApp or anywhere else.',
    iframe: 'IFRAME', iframeTitle: 'Already have a website? Put the form inside it.', iframeBody: 'Embed the Cuebooker widget in your own site. Your image stays yours and the booking flow runs behind it.',
    label: 'PROFILE VISIBILITY', live: 'Public', private: 'Private', dj: 'ARTIST / CITY', name: 'Your name', sound: 'Your styles',
    copy: 'Copy link', instagram: 'Share on Instagram', qr: 'Download QR',
    kicker: 'A ROUTE FOR EVERY ARTIST', title: 'One entry point, wherever you are.', detail: 'Wherever a promoter comes from, the details arrive complete and you manage them in the same workspace.',
    items: [['Public profile', 'For artists without a website.'], ['Shareable link', 'For Instagram, social, messages and newsletters.'], ['Embeddable widget', 'For artists with their own website.'], ['Booking QR', 'For posters, flyers, cards and events.']]
  },
  identity: { kicker: 'ARTIST PROFILE', title: 'Your profile has a presence too.', body: 'CUE ID will be the visual signature of your profile. Avatar and personalisation are in beta, so your identity can grow without becoming a template.', profile: 'Artist profile', active: 'BETA · EVOLVING' },
  closing: { title: 'Make room for the part only you can do.', body: 'Cuebooker is the working layer between the opportunity and the night. Start with your next booking.', cta: 'Create my workspace' }
})

const roleBody = computed(() => activeRole.value === 'artist' ? p.value.control.artistBody : p.value.control.managerBody)
const roleFeatures = computed(() => activeRole.value === 'artist' ? p.value.control.artistFeatures : p.value.control.managerFeatures)

function toggleMenu() {
  navHidden.value = false
  menuOpen.value = !menuOpen.value
}
function scrollTo(id: string) {
  menuOpen.value = false
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
}
function auth(mode: 'signin' | 'signup', placement: string) {
  analytics.track(mode === 'signup' ? 'signup_click' : 'login_click', { placement })
  router.push('/access?mode=' + mode)
}
function openApp(placement: string) {
  analytics.track('cta_click', { cta_name: 'workspace', placement, destination: '/app' })
  router.push('/app')
}
function closeMenuOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') menuOpen.value = false
}
function handleScroll() {
  // Clamp Safari overscroll before comparing direction.
  const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
  const currentY = Math.min(maxY, Math.max(0, window.scrollY))
  const delta = currentY - lastScrollY.value
  lastScrollY.value = currentY
  backToTopVisible.value = currentY > 520
  if (menuOpen.value || currentY < 80) {
    navHidden.value = false
    scrollDistance = 0
    scrollDirection = 0
    return
  }
  if (delta === 0) return
  const direction = Math.sign(delta)
  if (direction !== scrollDirection) scrollDistance = 0
  scrollDirection = direction
  scrollDistance += Math.abs(delta)
  // Keep the current state through tiny events, including momentum scrolling.
  if (scrollDistance >= (direction > 0 ? 24 : 12)) {
    navHidden.value = direction > 0
    scrollDistance = 0
  }
}
watch(menuOpen, open => {
  if (import.meta.client) document.documentElement.classList.toggle('mobile-menu-open', open)
  navHidden.value = false
  scrollDirection = 0
  scrollDistance = 0
  if (import.meta.client) lastScrollY.value = Math.max(0, window.scrollY)
})
onMounted(() => {
  lastScrollY.value = window.scrollY
  handleScroll()
  window.addEventListener('keydown', closeMenuOnEscape)
  window.addEventListener('scroll', handleScroll, { passive: true })
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', closeMenuOnEscape)
  window.removeEventListener('scroll', handleScroll)
  document.documentElement.classList.remove('mobile-menu-open')
})
useHead(() => ({ htmlAttrs: { lang: locale.value }, title: baseCopy.value.seo.title, meta: [{ name: 'description', content: baseCopy.value.seo.description }] }))
</script>

<template>
  <main class="commercial-home">
    <nav class="cp-nav" :class="{ 'cp-nav--hidden': navHidden }">
      <div class="cp-wrap cp-nav-inner">
        <NuxtLink class="cp-brand" to="/" aria-label="Cuebooker"><CueBrand /></NuxtLink>
        <div class="cp-nav-links">
          <a href="#system" @click.prevent="scrollTo('#system')">{{ p.nav.system }}</a>
          <a href="#distribution" @click.prevent="scrollTo('#distribution')">{{ p.nav.distribution }}</a>
          <a href="#cue-id" @click.prevent="scrollTo('#cue-id')">{{ p.nav.identity }}</a>
        </div>
        <div class="cp-nav-actions">
          <div class="cp-locale"><button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div>
          <button class="cp-theme" type="button" :aria-label="locale === 'es' ? 'Cambiar apariencia' : 'Change appearance'" @click="setTheme(theme === 'dark' ? 'light' : 'dark')"><span /></button>
          <NuxtLink class="cp-login" to="/access?mode=signin" @click="analytics.track('login_click', { placement: 'header' })">{{ p.nav.login }}</NuxtLink>
          <NuxtLink class="cp-cta cp-cta--nav" to="/access?mode=signup" @click="analytics.track('signup_click', { placement: 'header' })">{{ p.nav.signup }}</NuxtLink>
          <button class="cp-menu" :class="{ 'is-open': menuOpen }" type="button" :aria-label="locale === 'es' ? (menuOpen ? 'Cerrar menú' : 'Abrir menú') : (menuOpen ? 'Close menu' : 'Open menu')" :aria-expanded="menuOpen" aria-controls="cp-mobile-menu" @click="toggleMenu"><span /><span /></button>
        </div>
      </div>
    </nav>
    <Teleport to="body">
      <div id="cp-mobile-menu" class="cp-mobile-menu cp-mobile-menu--portal" :class="{ open: menuOpen }">
        <div class="cp-mobile-nav-links">
          <a href="#system" @click.prevent="scrollTo('#system')">{{ p.nav.system }}</a>
          <a href="#distribution" @click.prevent="scrollTo('#distribution')">{{ p.nav.distribution }}</a>
          <a href="#cue-id" @click.prevent="scrollTo('#cue-id')">{{ p.nav.identity }}</a>
        </div>
        <div class="cp-mobile-auth">
          <NuxtLink class="cp-mobile-login" to="/access?mode=signin" @click="menuOpen = false">{{ p.nav.login }}</NuxtLink>
          <NuxtLink class="cp-cta cp-mobile-signup" to="/access?mode=signup" @click="menuOpen = false">{{ p.nav.signup }}</NuxtLink>
        </div>
      </div>
    </Teleport>

    <section id="top" class="cp-hero" :style="{ '--hero-image': `url(${heroImage})` }">
      <div class="cp-hero-overlay" />
      <div class="cp-wrap cp-hero-content">
        <p class="cp-eyebrow">{{ p.hero.eyebrow }}</p>
        <h1>{{ p.hero.title }}</h1>
        <p class="cp-hero-accent">{{ p.hero.accent }}</p>
        <p class="cp-hero-lead">{{ p.hero.body }}</p>
        <div class="cp-hero-actions">
          <button class="cp-cta" type="button" @click="auth('signup', 'hero')">{{ p.hero.primary }} <span class="cp-arrow" aria-hidden="true" /></button>
          <button class="cp-cta cp-cta--ghost" type="button" @click="scrollTo('#system')">{{ p.hero.secondary }}</button>
        </div>
        <p class="cp-hero-note"><span class="cp-live-dot" />{{ p.hero.note }}</p>
      </div>
    </section>

    <div class="cp-ticker" aria-hidden="true"><div class="cp-ticker-track"><span v-for="(item, index) in [...p.ticker, ...p.ticker]" :key="index">{{ item }}</span></div></div>

    <section id="system" class="cp-section">
      <div class="cp-wrap">
        <div class="cp-section-head"><h2>{{ p.system.title }}</h2><p>{{ p.system.body }}</p></div>
        <div class="cp-booking-proof">
          <p class="cp-kicker">{{ locale === 'es' ? 'DEL ENLACE A TU PRÓXIMA FECHA' : 'FROM YOUR LINK TO YOUR NEXT DATE' }}</p>
          <div class="cp-hero-flow">
            <div class="cp-hero-signals"><span v-for="channel in (locale === 'es' ? ['Enlace en tu bio', 'Formulario en tu web', 'QR en la cabina'] : ['Link in your bio', 'Form on your website', 'QR in the booth'])" :key="channel">{{ channel }}</span></div>
            <div class="cp-hero-flow-line" aria-hidden="true" />
            <div class="cp-hero-request"><div class="cp-hero-request-head"><span>{{ p.hero.flow.label }}</span><b>{{ p.hero.flow.status }}</b></div><strong>{{ p.hero.flow.booking }}</strong><small>{{ p.hero.flow.detail }}</small></div>
          </div>
          <p class="cp-demo-caption">{{ locale === 'es' ? 'Ejemplo ilustrativo · Datos ficticios' : 'Illustrative example · Fictional data' }}</p>
        </div>
        <div class="cp-signal-grid"><article v-for="card in p.system.cards" :key="card[0]" class="cp-signal-card"><span class="cp-signal-number">{{ card[0] }}</span><h3>{{ card[1] }}</h3><p>{{ card[2] }}</p></article></div>
      </div>
    </section>

    <section id="start" class="cp-product-stage cp-section">
      <div class="cp-wrap cp-stage-grid">
        <div class="cp-stage-copy"><p class="cp-kicker">{{ p.stage.kicker }}</p><h2>{{ p.stage.title }}</h2><p>{{ p.stage.body }}</p><div class="cp-stage-points"><div v-for="point in p.stage.points" :key="point[0]" class="cp-stage-point"><b>{{ point[0] }}</b><span>{{ point[1] }}</span></div></div></div>
        <div class="cp-app-window" aria-label="Cuebooker workspace preview">
          <div class="cp-window-top"><span /><span /><span /><b>{{ p.stage.workspace }}</b></div>
          <div class="cp-app-body"><aside class="cp-app-side"><div class="cp-side-brand">Cuebooker</div><div class="cp-side-item active">Resumen</div><div class="cp-side-item">Reservas <small>12</small></div><div class="cp-side-item">Calendario</div><div class="cp-side-item">Actividad</div><div class="cp-side-item">Perfil de artista</div><div class="cp-side-item">Ajustes</div></aside><div class="cp-app-main"><div class="cp-app-heading"><div><h3>{{ p.stage.greeting }}</h3><p>{{ p.stage.week }}</p></div><button class="cp-mini-button" type="button" @click="openApp('workspace_preview')">{{ p.stage.newBooking }}</button></div><div class="cp-metrics"><div v-for="metric in p.stage.metrics" :key="metric[0]" class="cp-metric"><small>{{ metric[0] }}</small><strong :class="{ lime: metric[2] }">{{ metric[1] }}</strong></div></div><div class="cp-booking-list"><div v-for="booking in p.stage.bookings" :key="booking[0]" class="cp-booking"><span class="cp-booking-bar" :class="booking[3]" /><div><b>{{ booking[0] }}</b><span>{{ booking[1] }}</span></div><em>{{ booking[2] }}</em></div></div></div></div>
        </div>
      </div>
    </section>

    <section class="cp-manifesto cp-section"><div class="cp-wrap cp-manifesto-grid"><div><p class="cp-kicker">{{ p.manifesto.kicker }}</p><h2>{{ p.manifesto.title }}</h2></div><p>{{ p.manifesto.body }}</p></div></section>

    <section id="control" class="cp-control cp-section"><div class="cp-wrap"><div class="cp-section-head"><h2>{{ p.control.title }}</h2><p>{{ p.control.body }}</p></div><div class="cp-control-grid"><article class="cp-control-card"><p class="cp-kicker">{{ p.control.assistant }}</p><h3>{{ p.control.assistantTitle }}</h3><p>{{ p.control.assistantBody }}</p><div class="cp-chat"><div class="cp-bubble">{{ locale === 'es' ? 'Nueva solicitud recibida. Fecha, sala y caché listos para revisar.' : 'New request received. Date, venue and fee ready to review.' }}</div><div class="cp-bubble you">{{ locale === 'es' ? 'Bloquea la fecha y pide el technical rider.' : 'Hold the date and request the technical rider.' }}</div><div class="cp-bubble">{{ locale === 'es' ? 'Hecho. Seguimiento programado. Tú mantienes el control.' : 'Done. Follow-up scheduled. You keep control.' }}</div></div></article><article class="cp-control-card"><p class="cp-kicker">{{ p.control.human }}</p><h3>{{ p.control.humanTitle }}</h3><div class="cp-toggle"><button :class="{ active: activeRole === 'artist' }" @click="activeRole = 'artist'">{{ p.control.artist }}</button><button :class="{ active: activeRole === 'manager' }" @click="activeRole = 'manager'">{{ p.control.manager }}</button></div><p class="cp-role-copy">{{ roleBody }}</p><div class="cp-role-features"><div v-for="feature in roleFeatures" :key="feature">{{ feature }}</div></div></article></div></div></section>

    <section id="distribution" class="cp-section"><div class="cp-wrap"><div class="cp-section-head"><h2>{{ p.distribution.heading }}</h2><p>{{ p.distribution.body }}</p></div><div class="cp-signal-grid"><article class="cp-signal-card cp-channel-card"><span class="cp-signal-number">01 / {{ p.distribution.profile }}</span><span class="cp-channel-icon cp-channel-icon--profile" aria-hidden="true" /><h3>{{ p.distribution.profileTitle }}</h3><p>{{ p.distribution.profileBody }}</p></article><article class="cp-signal-card cp-channel-card"><span class="cp-signal-number">02 / {{ p.distribution.link }}</span><span class="cp-channel-icon cp-channel-icon--link" aria-hidden="true" /><h3>{{ p.distribution.linkTitle }}</h3><p>{{ p.distribution.linkBody }}</p></article><article class="cp-signal-card cp-channel-card"><span class="cp-signal-number">03 / {{ p.distribution.iframe }}</span><span class="cp-channel-icon cp-channel-icon--iframe" aria-hidden="true" /><h3>{{ p.distribution.iframeTitle }}</h3><p>{{ p.distribution.iframeBody }}</p></article></div><div class="cp-distribution-detail"><div class="cp-distribution-ui"><div class="cp-share-header"><span>{{ p.distribution.label }}</span><div class="cp-share-visibility"><span class="cp-share-live"><i />{{ p.distribution.live }}</span><span class="cp-share-private">{{ p.distribution.private }}</span></div></div><div class="cp-share-preview"><div class="cp-share-avatar">CUE<small>ID 001</small></div><div><span>{{ p.distribution.dj }}</span><h3>{{ p.distribution.name }}</h3><p>{{ p.distribution.sound }}</p></div><span class="cp-arrow cp-share-arrow" aria-hidden="true" /></div><div class="cp-share-actions"><button :class="{ active: shareMode === 'profile' }" @click="shareMode = 'profile'">{{ p.distribution.copy }}</button><button :class="{ active: shareMode === 'website' }" @click="shareMode = 'website'">{{ p.distribution.instagram }}</button><button :class="{ active: shareMode === 'qr' }" @click="shareMode = 'qr'">{{ p.distribution.qr }}</button></div></div><div class="cp-distribution-copy"><p class="cp-kicker">{{ p.distribution.kicker }}</p><h3>{{ p.distribution.title }}</h3><p>{{ p.distribution.detail }}</p><div class="cp-distribution-list"><div v-for="item in p.distribution.items" :key="item[0]"><b>{{ item[0] }}</b><span>{{ item[1] }}</span></div></div></div></div></div></section>

    <section id="cue-id" class="cp-cue-id cp-section"><div class="cp-wrap cp-cue-grid"><div class="cp-cue-copy"><p class="cp-kicker">{{ p.identity.kicker }}</p><h2>{{ p.identity.title }}</h2><p>{{ p.identity.body }}</p><span class="cp-beta-note">{{ p.identity.active }}</span></div><div class="cp-cue-card"><div class="cp-cue-ring"><span>CUE<br />ID 001</span></div><div class="cp-cue-meta"><span>{{ p.identity.profile }}</span><span>{{ p.identity.active }}</span></div></div></div></section>

    <section class="cp-closing cp-section"><div class="cp-wrap cp-closing-inner"><h2>{{ p.closing.title }}</h2><div><p>{{ p.closing.body }}</p><button class="cp-cta" type="button" @click="auth('signup', 'closing')">{{ p.closing.cta }} <span class="cp-arrow" aria-hidden="true" /></button></div></div></section>
    <Transition name="cp-float"><button v-if="backToTopVisible" class="cp-back-top" type="button" :aria-label="locale === 'es' ? 'Volver arriba' : 'Back to top'" @click="scrollTo('#top')"><span class="cp-up-arrow" aria-hidden="true" /></button></Transition>
    <footer class="cp-footer"><div class="cp-wrap"><span class="cp-brand"><CueBrand /></span><span>{{ locale === 'es' ? 'Hecho para las personas que están detrás del sonido.' : 'Made for the people behind the sound.' }}</span><span>© 2026 Cuebooker</span></div></footer>
  </main>
</template>

<style scoped>
/* Landing-only composition. Keep workspace styles untouched. */
.commercial-home .cp-hero {
  min-height: min(820px, 100svh);
  align-items: center;
  background: var(--cp-black);
}
.commercial-home .cp-hero::before {
  background: var(--hero-image) 68% center / cover no-repeat;
  opacity: 1;
}
.commercial-home .cp-hero::after { display: none; }
.cp-hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, var(--cp-black) 0%, color-mix(in srgb, var(--cp-black) 90%, transparent) 26%, color-mix(in srgb, var(--cp-black) 45%, transparent) 48%, transparent 72%), linear-gradient(0deg, var(--cp-black), transparent 28%);
}
.commercial-home .cp-hero-content { padding: 132px 0 58px; }
.commercial-home .cp-hero h1 {
  max-width: 650px;
  margin: 26px 0 22px;
  font-size: clamp(62px, 6.8vw, 98px);
  line-height: .98;
  letter-spacing: -.055em;
  text-wrap: balance;
}
.cp-hero-accent {
  max-width: 650px;
  margin: 0 0 20px;
  color: var(--cp-lime);
  font-size: clamp(23px, 2.4vw, 34px);
  font-weight: 750;
  line-height: 1.2;
  letter-spacing: -.025em;
}
.commercial-home .cp-hero-lead { max-width: 455px; font-size: 18px; line-height: 1.5; }
.commercial-home .cp-hero-actions { margin-top: 26px; }
.commercial-home .cp-hero-note { max-width: 430px; margin-top: 25px; line-height: 1.5; }
.commercial-home .cp-cta { min-height: 48px; box-shadow: 0 4px 0 color-mix(in srgb, var(--cp-lime) 45%, black), 0 14px 30px color-mix(in srgb, var(--cp-lime) 12%, transparent); }
.commercial-home .cp-cta--ghost { background: color-mix(in srgb, var(--cp-black) 78%, transparent); box-shadow: none; }
.commercial-home .cp-cta:active { transform: translateY(2px); }
.commercial-home .cp-section { scroll-margin-top: 88px; }
.commercial-home .cp-signal-card { border-radius: 16px; }
.commercial-home .cp-channel-card { padding-right: 28px; }
.commercial-home .cp-channel-icon { position: relative; inset: auto; margin: 20px 0; width: 58px; }
.commercial-home .cp-channel-card h3 { max-width: none; padding-right: 0; }
.commercial-home .cp-channel-card .cp-signal-number { padding-right: 0; }
.cp-booking-proof { padding: 28px 0; margin-bottom: 35px; border-block: 1px solid var(--cp-line); }
.commercial-home .cp-booking-proof .cp-hero-flow { max-width: 820px; border: 0; background: none; box-shadow: none; margin: 22px 0 14px; padding: 0; }
.commercial-home .cp-booking-proof .cp-hero-signals span { font-size: 11px; padding: 12px; }
.commercial-home .cp-booking-proof .cp-hero-request-head span,
.commercial-home .cp-booking-proof .cp-hero-request small { font-size: 10px; }
.commercial-home .cp-booking-proof .cp-hero-request-head b { font-size: 9px; }
.cp-demo-caption { color: var(--cp-muted); font-size: 11px; }
.commercial-home .cp-nav:has(:focus-visible) { transform: none; }
.cp-menu span { transition: transform .2s; }
.cp-menu.is-open span:first-child { transform: translateY(4px) rotate(45deg); }
.cp-menu.is-open span:last-child { transform: translateY(-4px) rotate(-45deg); }
.cp-mobile-menu--portal .cp-mobile-nav-links a { text-decoration: none; }
.cp-mobile-menu--portal { overscroll-behavior: contain; padding-bottom: max(24px, env(safe-area-inset-bottom)); }
:global(html.mobile-menu-open), :global(html.mobile-menu-open body) { overflow: hidden; }
:global(html[data-theme='light']) .cp-hero::before { opacity: .34; }
@media (max-width: 1100px) and (min-width: 851px) {
  .commercial-home .cp-hero h1 { max-width: 55%; font-size: 64px; }
  .cp-hero-accent { max-width: 55%; }
}
@media (max-width: 850px) {
  .commercial-home .cp-hero { min-height: auto; }
  .commercial-home .cp-hero::before { background-image: none; }
  .commercial-home .cp-hero-content { padding: 110px 0 48px; }
  .commercial-home .cp-hero h1 { max-width: 650px; font-size: clamp(48px, 9vw, 72px); }
  .cp-mobile-menu--portal { min-height: 0; }
}
@media (max-width: 520px) {
  .commercial-home .cp-hero-content { padding: 96px 0 38px; }
  .commercial-home .cp-hero h1 { font-size: clamp(43px, 11.7vw, 60px); margin: 22px 0 18px; }
  .cp-hero-accent { font-size: 25px; max-width: 320px; }
  .commercial-home .cp-hero-lead { font-size: 16px; }
  .commercial-home .cp-hero-note { font-size: 12px; }
  .commercial-home .cp-booking-proof .cp-hero-flow { grid-template-columns: 1fr; gap: 18px; }
  .commercial-home .cp-booking-proof .cp-hero-signals { grid-template-columns: repeat(3, 1fr); }
  .commercial-home .cp-booking-proof .cp-hero-signals span { font-size: 10px; transform: none; padding: 10px 7px; line-height: 1.4; }
  .cp-booking-proof .cp-hero-flow-line { display: none; }
  .commercial-home .cp-booking-proof .cp-hero-request strong { font-size: 20px; line-height: 1.25; }
}
@media (prefers-reduced-motion: reduce) {
  .commercial-home .cp-nav, .commercial-home .cp-cta, .cp-menu span { transition: none; }
  .cp-ticker-track { animation: none; }
}
</style>