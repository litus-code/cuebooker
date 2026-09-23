<script setup lang="ts">
import es from '../../content/es/home.json'
import en from '../../content/en/home.json'

const { locale, theme, setLocale, setTheme } = useCuePreferences()
const baseCopy = computed(() => locale.value === 'es' ? es : en)
const menuOpen = ref(false)
const navHidden = ref(false)
const backToTopVisible = ref(false)
const lastScrollY = ref(0)
let restoreMenuFocus = true
let scrollDirection = 0
let scrollDistance = 0
const heroImage = `${useRuntimeConfig().app.baseURL}club-hero.webp`
const demoStep = ref(0)
const shareTab = ref(0)
const router = useRouter()
const analytics = useAnalytics()

const p = computed(() => locale.value === 'es' ? {
  "nav": {
    "system": "Cómo funciona",
    "distribution": "Comparte tu perfil",
    "identity": "CUE ID",
    "login": "Iniciar sesión",
    "signup": "Crear cuenta"
  },
  "hero": {
    "eyebrow": "PARA QUIEN MUEVE LA NOCHE",
    "title": "Que la música siga avanzando.",
    "accent": "El booking ya está ocurriendo.",
    "body": "Tu próxima fecha merece toda tu atención. Reúne solicitudes, conversaciones y calendario en un mismo espacio.",
    "primary": "Crear mi espacio",
    "secondary": "Ver cómo funciona",
    "note": "Hecho para DJs, managers y quienes hacen posible cada noche."
  },
  "work": {
    "label": "01 / DETRÁS DEL SET",
    "title": "Hay mucho que no se ve.",
    "intro": "Preparar música. Cuidar tu sonido. Encontrar tu sitio.",
    "body": "Y, entre todo eso, responder propuestas y cuadrar fechas. Cuebooker te ayuda con el booking para que puedas dedicarle tiempo a lo que te mueve.",
    "steps": [
      "La propuesta",
      "La fecha",
      "Tu decisión"
    ],
    "descriptions": [
      "Fecha, lugar, caché y contacto. Empieza con el contexto que necesitas.",
      "Consulta tu calendario antes de comprometerte. Cada fecha, en su sitio.",
      "Revisa la propuesta y decide cómo seguir. La última palabra es tuya."
    ],
    "demo": "Demo interactiva · Datos ficticios",
    "workspace": "TU ESPACIO DE TRABAJO",
    "request": "Solicitud de booking",
    "status": [
      "Por revisar",
      "Disponibilidad",
      "Pendiente de tu decisión"
    ],
    "venue": "Sala de ejemplo / Barcelona",
    "date": "18 OCT",
    "fee": "Caché propuesto",
    "amount": "1.200 €",
    "set": "Horario",
    "time": "01:00 — 03:00",
    "contact": "Contacto",
    "promoter": "Promotor de ejemplo",
    "month": "OCTUBRE / EJEMPLO",
    "available": "18 oct · Sin reservas en este ejemplo",
    "decision": "Tú eliges el siguiente paso.",
    "options": [
      "Responder",
      "Proponer otra fecha",
      "Rechazar"
    ],
    "note": "Esta vista explica el proceso. No envía mensajes ni crea reservas.",
    "next": "Siguiente paso",
    "restart": "Volver a la propuesta"
  },
  "share": {
    "label": "02 / COMPARTE TU PERFIL",
    "title": "Tu web, tu bio o una pegatina en la cabina.",
    "body": "Que sepan dónde encontrarte. Y cómo proponerte una fecha.",
    "tabs": [
      "Tu perfil",
      "En tu web",
      "Tu QR"
    ],
    "titles": [
      "Un enlace que habla de ti.",
      "Tu web sigue siendo tuya.",
      "De la cabina a tu próxima fecha."
    ],
    "descriptions": [
      "Compártelo en Instagram, WhatsApp o donde compartas tu música. Tu perfil reúne tu presentación y el formulario de booking.",
      "Incrusta el formulario con un iframe. El promotor te envía la propuesta sin salir de tu página.",
      "Pon tu QR en una tarjeta, un flyer o una pegatina. Quien lo escanee llegará a tu enlace de booking."
    ],
    "privacy": "Público o privado. Tú decides cuándo compartir tu perfil.",
    "preview": "VISTA PREVIA ILUSTRATIVA",
    "artist": "Tu nombre artístico",
    "sound": "Tu música. Tu recorrido.",
    "form": "Proponer una fecha",
    "embed": "TU WEB / BOOKING",
    "fields": [
      "Fecha del evento",
      "Sala o evento",
      "Email de contacto"
    ],
    "qr": "TU QR DE BOOKING",
    "qrNote": "Tu enlace, también fuera de la pantalla.",
    "cta": "Crear mi perfil"
  },
  "control": {
    "label": "03 / A TU MANERA",
    "title": "Tu sonido tiene criterio.\nTus decisiones también.",
    "body": "Hay propuestas que encajan contigo y otras que no. Eso lo decides tú.",
    "support": "Cuebooker te ayuda a mantener el seguimiento y el contexto de cada conversación.",
    "left": "Tu espacio reúne",
    "right": "Tú decides",
    "tasks": [
      "Solicitudes y conversaciones",
      "Fechas y disponibilidad",
      "Historial de cada propuesta"
    ],
    "decisions": [
      "Qué propuesta encaja contigo",
      "Qué condiciones aceptar",
      "Cuándo confirmar una fecha"
    ]
  },
  "identity": {
    "label": "04 / CUE ID",
    "title": "Un perfil que se parezca a ti.",
    "body": "Tu música, tu recorrido y tu forma de presentarte.",
    "beta": "BETA · EN EVOLUCIÓN",
    "detail": "Estamos desarrollando el avatar personalizado de CUE ID. Una forma más de expresar quién está detrás del sonido.",
    "visual": "TU IDENTIDAD\nTIENE SU ESPACIO.",
    "caption": "Avatar personalizado en desarrollo"
  },
  "closing": {
    "title": "Hay mucho trabajo detrás de lo que haces.",
    "accent": "Dale su espacio.",
    "cta": "Crear mi espacio",
    "footer": "Hecho para las personas que están detrás del sonido."
  }
} : {
  "nav": {
    "system": "How it works",
    "distribution": "Share your profile",
    "identity": "CUE ID",
    "login": "Sign in",
    "signup": "Create account"
  },
  "hero": {
    "eyebrow": "FOR THE PEOPLE WHO MOVE THE NIGHT",
    "title": "Let the music keep moving.",
    "accent": "Booking is already happening.",
    "body": "Your next date deserves your attention. Keep requests, conversations and your calendar in one workspace.",
    "primary": "Create my workspace",
    "secondary": "See how it works",
    "note": "Made for DJs, managers and the people who make every night happen."
  },
  "work": {
    "label": "01 / BEHIND THE SET",
    "title": "There is a lot you do not see.",
    "intro": "Preparing music. Shaping your sound. Finding your place.",
    "body": "And in between, answering proposals and arranging dates. Cuebooker helps with booking so you can spend time on what moves you.",
    "steps": [
      "The proposal",
      "The date",
      "Your decision"
    ],
    "descriptions": [
      "Date, venue, fee and contact. Start with the context you need.",
      "Check your calendar before committing. Every date in its place.",
      "Review the proposal and decide what comes next. The final say is yours."
    ],
    "demo": "Interactive demo · Fictional data",
    "workspace": "YOUR WORKSPACE",
    "request": "Booking request",
    "status": [
      "To review",
      "Availability",
      "Waiting for your decision"
    ],
    "venue": "Example venue / Barcelona",
    "date": "18 OCT",
    "fee": "Proposed fee",
    "amount": "€1,200",
    "set": "Time",
    "time": "01:00 — 03:00",
    "contact": "Contact",
    "promoter": "Example promoter",
    "month": "OCTOBER / EXAMPLE",
    "available": "18 Oct · No bookings in this example",
    "decision": "You choose the next step.",
    "options": [
      "Reply",
      "Suggest another date",
      "Decline"
    ],
    "note": "This view explains the process. It does not send messages or create bookings.",
    "next": "Next step",
    "restart": "Back to the proposal"
  },
  "share": {
    "label": "02 / SHARE YOUR PROFILE",
    "title": "Your website, your bio or a sticker in the booth.",
    "body": "Let them find you. And propose a date.",
    "tabs": [
      "Your profile",
      "Your website",
      "Your QR"
    ],
    "titles": [
      "A link that speaks for you.",
      "Your website stays yours.",
      "From the booth to your next date."
    ],
    "descriptions": [
      "Share it on Instagram, WhatsApp or wherever you share your music. Your profile brings your introduction and booking form together.",
      "Embed the form with an iframe. A promoter can send a proposal without leaving your website.",
      "Put your QR on a card, flyer or sticker. Scanning it takes people to your booking link."
    ],
    "privacy": "Public or private. You decide when to share your profile.",
    "preview": "ILLUSTRATIVE PREVIEW",
    "artist": "Your artist name",
    "sound": "Your music. Your story.",
    "form": "Propose a date",
    "embed": "YOUR WEBSITE / BOOKING",
    "fields": [
      "Event date",
      "Venue or event",
      "Contact email"
    ],
    "qr": "YOUR BOOKING QR",
    "qrNote": "Your link, beyond the screen.",
    "cta": "Create my profile"
  },
  "control": {
    "label": "03 / YOUR WAY",
    "title": "Your sound has a point of view.\nSo do your decisions.",
    "body": "Some proposals fit you. Others do not. You decide.",
    "support": "Cuebooker helps you keep track of every conversation and its context.",
    "left": "Your workspace brings together",
    "right": "You decide",
    "tasks": [
      "Requests and conversations",
      "Dates and availability",
      "The history of each proposal"
    ],
    "decisions": [
      "Which proposal fits you",
      "Which terms to accept",
      "When to confirm a date"
    ]
  },
  "identity": {
    "label": "04 / CUE ID",
    "title": "A profile that feels like you.",
    "body": "Your music, your story and how you present yourself.",
    "beta": "BETA · EVOLVING",
    "detail": "We are developing the personalised CUE ID avatar. Another way to express who is behind the sound.",
    "visual": "YOUR IDENTITY\nHAS ITS SPACE.",
    "caption": "Personalised avatar in development"
  },
  "closing": {
    "title": "There is a lot of work behind what you do.",
    "accent": "Give it space.",
    "cta": "Create my workspace",
    "footer": "Made for the people behind the sound."
  }
})


type SlideGroup = 'booking' | 'sharing'
const playback = reactive({
  booking: { stopped: false, visible: false, progress: 0 },
  sharing: { stopped: false, visible: false, progress: 0 }
})
const reducedMotion = ref(true)
let slideObserver: IntersectionObserver | undefined
let slideTimer: ReturnType<typeof setInterval> | undefined
let motionQuery: MediaQueryList | undefined
function stopSlides(group: SlideGroup) {
  playback[group].stopped = true
  playback[group].progress = 0
}
function playSlides(group: SlideGroup) {
  playback[group].stopped = false
  playback[group].progress = 0
}
function selectSlide(group: SlideGroup, index: number) {
  stopSlides(group)
  if (group === 'booking') demoStep.value = index
  else shareTab.value = index
}
function slideKeys(event: KeyboardEvent, group: SlideGroup, index: number) {
  const vertical = group === 'booking'
  let next = index
  if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = 2
  else if (event.key === 'ArrowRight' || (vertical && event.key === 'ArrowDown')) next = (index + 1) % 3
  else if (event.key === 'ArrowLeft' || (vertical && event.key === 'ArrowUp')) next = (index + 2) % 3
  else return
  event.preventDefault()
  selectSlide(group, next)
  document.getElementById((group === 'booking' ? 'step-' : 'share-') + next)?.focus()
}
function updateMotion() {
  reducedMotion.value = motionQuery?.matches ?? true
  if (reducedMotion.value) {
    stopSlides('booking')
    stopSlides('sharing')
  }
}
function onMenuKey(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); menuOpen.value = false; return }
  if (event.key !== 'Tab') return
  const items = Array.from(document.querySelectorAll<HTMLElement>('#cp-mobile-menu a, #cp-mobile-menu button'))
  const first = items[0], last = items[items.length - 1]
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
function handleResize() {
  if (window.innerWidth > 850) menuOpen.value = false
}
onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotion()
  motionQuery.addEventListener('change', updateMotion)
  slideObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const group = (entry.target as HTMLElement).dataset.slideGroup as SlideGroup
      playback[group].visible = entry.isIntersecting
      playback[group].progress = 0
    }
  }, { threshold: 0.3 })
  document.querySelectorAll('[data-slide-group]').forEach(el => slideObserver?.observe(el))
  let previous = performance.now()
  slideTimer = setInterval(() => {
    const now = performance.now()
    const elapsed = Math.min(now - previous, 250)
    previous = now
    for (const group of ['booking', 'sharing'] as const) {
      const state = playback[group]
      if (document.hidden || menuOpen.value || !state.visible || state.stopped) continue
      state.progress += elapsed / 3000
      if (state.progress >= 1) {
        state.progress = 0
        if (group === 'booking') demoStep.value = (demoStep.value + 1) % 3
        else shareTab.value = (shareTab.value + 1) % 3
      }
    }
  }, 100)
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  if (slideTimer) clearInterval(slideTimer)
  slideObserver?.disconnect()
  motionQuery?.removeEventListener('change', updateMotion)
  window.removeEventListener('resize', handleResize)
})

function toggleMenu() {
  restoreMenuFocus = true
  navHidden.value = false
  menuOpen.value = !menuOpen.value
}
function scrollTo(id: string) {
  restoreMenuFocus = false
  menuOpen.value = false
  nextTick(() => {
    const target = document.querySelector<HTMLElement>(id)
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ behavior: reducedMotion.value ? 'auto' : 'smooth' })
  })
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
watch(menuOpen, async open => {
  if (import.meta.client) document.documentElement.classList.toggle('mobile-menu-open', open)
  navHidden.value = false
  scrollDirection = 0
  scrollDistance = 0
  if (import.meta.client) {
    lastScrollY.value = Math.max(0, window.scrollY)
    await nextTick()
    if (open) document.querySelector<HTMLElement>('#cp-mobile-menu button')?.focus()
    else if (restoreMenuFocus) document.querySelector<HTMLElement>('.cp-menu')?.focus({ preventScroll: true })
  }
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
  <main class="commercial-home" :inert="menuOpen">
    <a class="ed-skip" href="#top" @click.prevent="scrollTo('#top')">{{ locale === 'es' ? 'Saltar al contenido' : 'Skip to content' }}</a>
    <nav :aria-label="locale === 'es' ? 'Navegación principal' : 'Main navigation'" class="cp-nav" :class="{ 'cp-nav--hidden': navHidden }">
      <div class="cp-wrap cp-nav-inner">
        <NuxtLink class="cp-brand" to="/" aria-label="Cuebooker"><CueBrand /></NuxtLink>
        <div class="cp-nav-links">
          <a href="#system" @click.prevent="scrollTo('#system')">{{ p.nav.system }}</a>
          <a href="#distribution" @click.prevent="scrollTo('#distribution')">{{ p.nav.distribution }}</a>
          <a href="#cue-id" @click.prevent="scrollTo('#cue-id')">{{ p.nav.identity }}</a>
        </div>
        <div class="cp-nav-actions">
          <div class="cp-locale"><button aria-label="Español" :aria-pressed="locale === 'es'" :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button aria-label="English" :aria-pressed="locale === 'en'" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div>
          <button class="cp-theme" type="button" :aria-label="locale === 'es' ? (theme === 'dark' ? 'Activar apariencia clara' : 'Activar apariencia oscura') : (theme === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance')" @click="setTheme(theme === 'dark' ? 'light' : 'dark')"><span /></button>
          <NuxtLink class="cp-login" to="/access?mode=signin" @click="analytics.track('login_click', { placement: 'header' })">{{ p.nav.login }}</NuxtLink>
          <NuxtLink class="cp-cta cp-cta--nav" to="/access?mode=signup" @click="analytics.track('signup_click', { placement: 'header' })">{{ p.nav.signup }}</NuxtLink>
          <button class="cp-menu" :class="{ 'is-open': menuOpen }" type="button" :aria-label="locale === 'es' ? (menuOpen ? 'Cerrar menú' : 'Abrir menú') : (menuOpen ? 'Close menu' : 'Open menu')" :aria-expanded="menuOpen" aria-controls="cp-mobile-menu" @click="toggleMenu"><span /><span /></button>
        </div>
      </div>
    </nav>
    <Teleport to="body">
      <div v-if="menuOpen" role="dialog" aria-modal="true" :aria-label="locale === 'es' ? 'Menú de navegación' : 'Navigation menu'" @keydown="onMenuKey" id="cp-mobile-menu" class="cp-mobile-menu cp-mobile-menu--portal" :class="{ open: menuOpen }">
        <button class="ed-menu-close" @click="menuOpen = false">{{ locale === 'es' ? 'Cerrar menú' : 'Close menu' }} <span aria-hidden="true">×</span></button>
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

    <section tabindex="-1" id="top" class="cp-hero" :style="{ '--hero-image': `url(${heroImage})` }">
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


    <section tabindex="-1" id="system" class="ed-section cp-wrap">
      <div class="ed-intro"><p class="cp-kicker">{{ p.work.label }}</p><h2>{{ p.work.title }}</h2><p class="ed-deck">{{ p.work.intro }}</p><p>{{ p.work.body }}</p></div>
      <div class="ed-carousel" data-slide-group="booking" @pointerdown="stopSlides('booking')" @focusin="stopSlides('booking')">
<div class="ed-playback">
  <div class="ed-slide-badges" :aria-label="locale === 'es' ? 'Pasos de la demo' : 'Demo steps'">
    <button v-for="(step, i) in p.work.steps" :key="step" type="button" :class="{ active: demoStep === i }" :aria-label="step + ', ' + (i + 1) + (locale === 'es' ? ' de 3' : ' of 3')" :aria-current="demoStep === i ? 'step' : undefined" @click="selectSlide('booking', i)"><span aria-hidden="true" /></button>
  </div>
  <button class="ed-playback-toggle" type="button" :aria-label="playback.booking.stopped ? (locale === 'es' ? 'Reanudar pase automático' : 'Resume automatic slides') : (locale === 'es' ? 'Pausar pase automático' : 'Pause automatic slides')" @pointerdown.stop @focusin.stop @click="playback.booking.stopped ? playSlides('booking') : stopSlides('booking')">
    <svg v-if="playback.booking.stopped" class="ed-play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14M17 5v14" /></svg>
  </button>
</div>
<div class="ed-work">
        <div class="ed-steps" role="tablist" aria-orientation="vertical" :aria-label="p.nav.system">
          <button v-for="(step, i) in p.work.steps" :id="'step-'+i" :key="step" role="tab" :tabindex="demoStep === i ? 0 : -1" :aria-label="step + ', ' + (i + 1) + (locale === 'es' ? ' de 3' : ' of 3')" @keydown="slideKeys($event, 'booking', i)" :aria-selected="demoStep === i" aria-controls="booking-demo" :class="{ selected: demoStep === i }" @click="selectSlide('booking', i)"><span class="ed-index">0{{ i + 1 }}</span><span><strong>{{ step }}</strong><small>{{ p.work.descriptions[i] }}</small></span><span class="cp-arrow" aria-hidden="true" /></button>
        </div>
        <div id="booking-demo" tabindex="0" aria-live="off" class="ed-console" role="tabpanel" :aria-labelledby="'step-'+demoStep">
          <div class="ed-console-bar"><span class="ed-indicator" />{{ p.work.workspace }}<span class="ed-demo-tag">DEMO</span></div>
          <div class="ed-console-body">
            <div class="ed-console-heading"><span>{{ p.work.request }}</span><span class="ed-status">{{ p.work.status[demoStep] }}</span></div>
            <h3>{{ p.work.venue }}</h3>
            <div v-if="demoStep === 0" class="ed-request-data"><div class="ed-date"><b>18</b><span>OCT</span></div><dl><div><dt>{{ p.work.fee }}</dt><dd>{{ p.work.amount }}</dd></div><div><dt>{{ p.work.set }}</dt><dd>{{ p.work.time }}</dd></div><div><dt>{{ p.work.contact }}</dt><dd>{{ p.work.promoter }}</dd></div></dl></div>
            <div v-else-if="demoStep === 1" class="ed-calendar"><p class="ed-mono">{{ p.work.month }}</p><div class="ed-days"><span v-for="day in 31" :key="day" :class="{ chosen: day === 18 }">{{ day }}</span></div><p class="ed-available">{{ p.work.available }}</p></div>
            <div v-else class="ed-decision"><p>{{ p.work.decision }}</p><div v-for="option in p.work.options" :key="option" class="ed-option">{{ option }}<span class="cp-arrow" aria-hidden="true" /></div><small>{{ p.work.note }}</small></div>
          </div>
          <p class="ed-demo-foot">{{ p.work.demo }}</p>
        </div>
      </div></div>
    </section>

    <section tabindex="-1" id="distribution" class="ed-share ed-section">
      <div class="cp-wrap"><p class="cp-kicker">{{ p.share.label }}</p><h2>{{ p.share.title }}</h2><p class="ed-deck">{{ p.share.body }}</p>
        <div class="ed-carousel" data-slide-group="sharing" @pointerdown="stopSlides('sharing')" @focusin="stopSlides('sharing')">
<div class="ed-playback">
  <div class="ed-slide-badges" :aria-label="locale === 'es' ? 'Formas de compartir' : 'Ways to share'">
    <button v-for="(label, i) in p.share.tabs" :key="label" type="button" :class="{ active: shareTab === i }" :aria-label="label + ', ' + (i + 1) + (locale === 'es' ? ' de 3' : ' of 3')" :aria-current="shareTab === i ? 'step' : undefined" @click="selectSlide('sharing', i)"><span aria-hidden="true" /></button>
  </div>
  <button class="ed-playback-toggle" type="button" :aria-label="playback.sharing.stopped ? (locale === 'es' ? 'Reanudar pase automático' : 'Resume automatic slides') : (locale === 'es' ? 'Pausar pase automático' : 'Pause automatic slides')" @pointerdown.stop @focusin.stop @click="playback.sharing.stopped ? playSlides('sharing') : stopSlides('sharing')">
    <svg v-if="playback.sharing.stopped" class="ed-play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 5 11 7-11 7z" /></svg>
    <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14M17 5v14" /></svg>
  </button>
</div>
<div class="ed-share-layout">
          <div><div class="ed-tabs" role="tablist" :aria-label="p.nav.distribution"><button v-for="(label,i) in p.share.tabs" :id="'share-'+i" :key="label" role="tab" :tabindex="shareTab === i ? 0 : -1" :aria-label="label + ', ' + (i + 1) + (locale === 'es' ? ' de 3' : ' of 3')" @keydown="slideKeys($event, 'sharing', i)" :aria-selected="shareTab === i" aria-controls="share-preview" :class="{selected: shareTab === i}" @click="selectSlide('sharing', i)">{{ label }}</button></div>
            <h3>{{ p.share.titles[shareTab] }}</h3><p>{{ p.share.descriptions[shareTab] }}</p><p class="ed-privacy"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg>{{ p.share.privacy }}</p><button class="cp-cta" @click="auth('signup', 'share')">{{ p.share.cta }}<span class="cp-arrow" aria-hidden="true" /></button>
          </div>
          <div id="share-preview" tabindex="0" aria-live="off" class="ed-share-preview" role="tabpanel" :aria-labelledby="'share-'+shareTab">
            <span class="ed-mono">{{ p.share.preview }}</span>
            <div v-if="shareTab === 0" class="ed-profile"><div class="ed-profile-cover"><span>CUE / ARTIST</span><svg viewBox="0 0 320 70" aria-hidden="true"><path d="M0 35h20l5-12 8 25 8-34 8 42 9-55 9 62 8-40 9 23 9-12h24l8-18 8 42 8-50 8 58 8-35 8 19 8-25 8 18h22l8-25 8 45 8-62 8 70 8-43 8 28 8-18h34"/></svg></div><h4>{{ p.share.artist }}</h4><p>{{ p.share.sound }}</p><div class="ed-form-button">{{ p.share.form }}<span class="cp-arrow" aria-hidden="true" /></div></div>
            <div v-else-if="shareTab === 1" class="ed-embed"><div class="ed-browser-bar"><i /><i /><i /><span>{{ p.share.embed }}</span></div><h4>{{ p.share.form }}</h4><div v-for="field in p.share.fields" :key="field" class="ed-field">{{ field }}</div><div class="ed-code">&lt;iframe … /&gt;</div></div>
            <div v-else class="ed-sticker"><span class="ed-mono">CUEBOOKER / BOOKING</span><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M28 8H8v20M72 8h20v20M8 72v20h20M92 72v20H72M30 50h40M56 36l14 14-14 14"/></svg><h4>{{ p.share.qr }}</h4><p>{{ p.share.qrNote }}</p><small>{{ locale === 'es' ? 'Concepto de soporte · No es un QR escaneable' : 'Display concept · Not a scannable QR' }}</small></div>
          </div>
        </div>
      </div></div>
    </section>

    <section class="ed-section cp-wrap ed-control"><p class="cp-kicker">{{ p.control.label }}</p><h2>{{ p.control.title }}</h2><div class="ed-control-intro"><p class="ed-deck">{{ p.control.body }}</p><p>{{ p.control.support }}</p></div><div class="ed-responsibility"><div><h3>{{ p.control.left }}</h3><p v-for="item in p.control.tasks" :key="item">{{ item }}</p></div><div><h3>{{ p.control.right }}</h3><p v-for="item in p.control.decisions" :key="item">{{ item }}</p></div></div></section>

    <section tabindex="-1" id="cue-id" class="ed-section ed-identity cp-wrap"><div><p class="cp-kicker">{{ p.identity.label }}</p><h2>{{ p.identity.title }}</h2><p class="ed-deck">{{ p.identity.body }}</p><p>{{ p.identity.detail }}</p><span class="cp-beta-note">{{ p.identity.beta }}</span></div><div class="ed-identity-poster"><span class="ed-mono">CUE ID / ARTIST PROFILE</span><strong>{{ p.identity.visual }}</strong><span>{{ p.identity.caption }}</span><span class="ed-poster-corner" aria-hidden="true">C /</span></div></section>

    <section class="ed-closing"><div class="cp-wrap"><p>{{ p.closing.title }}</p><h2>{{ p.closing.accent }}</h2><button class="cp-cta" @click="auth('signup','closing')">{{ p.closing.cta }}<span class="cp-arrow" aria-hidden="true" /></button></div></section>
    <Transition name="cp-float"><button v-if="backToTopVisible && !menuOpen" class="cp-back-top" type="button" :aria-label="locale === 'es' ? 'Volver arriba' : 'Back to top'" @click="scrollTo('#top')"><span class="cp-up-arrow" aria-hidden="true" /></button></Transition>
    <footer class="cp-footer"><div class="cp-wrap"><span class="cp-brand"><CueBrand /></span><span>{{ p.closing.footer }}</span><span>© 2026 Cuebooker</span></div></footer>
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
:global(html[data-theme='light'] .commercial-home .cp-hero::before) { opacity: .34; }
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

<style scoped>
.ed-section { padding-top: 100px; padding-bottom: 100px; scroll-margin-top: 76px; }
.ed-section h2 { max-width: 920px; margin: 20px 0 28px; font-size: clamp(36px, 4.8vw, 68px); line-height: 1.04; letter-spacing: -.045em; text-wrap: balance; white-space: pre-line; }
.ed-section h3 { font-size: clamp(24px, 2.5vw, 34px); line-height: 1.16; letter-spacing: -.03em; }
.ed-section p { color: var(--cp-muted); font-size: 17px; line-height: 1.65; }
.ed-section .cp-kicker { color: var(--cp-lime); font-size: 10px; }
.ed-section .ed-deck { color: var(--cp-paper); font-size: clamp(20px, 2vw, 26px); line-height: 1.5; }
.ed-intro { max-width: 780px; }
.ed-intro > p:last-child { max-width: 640px; }
.ed-work { display: grid; grid-template-columns: .8fr 1.2fr; gap: 60px; align-items: center; margin-top: 54px; }
.ed-steps { display: grid; }
.ed-steps button { display: grid; grid-template-columns: 32px 1fr 10px; gap: 18px; padding: 26px 0; border: 0; border-top: 1px solid var(--cp-line); background: none; color: var(--cp-muted); text-align: left; cursor: pointer; }
.ed-steps button:last-child { border-bottom: 1px solid var(--cp-line); }
.ed-steps button.selected { color: var(--cp-paper); }
.ed-index { font: 12px ui-monospace, monospace; padding-top: 5px; }
.selected .ed-index { color: var(--cp-lime); }
.ed-steps strong { display: block; font-size: 24px; font-weight: 700; letter-spacing: -.025em; }
.ed-steps small { display: block; margin-top: 10px; line-height: 1.6; font-size: 14px; }
.ed-steps .cp-arrow { margin-top: 10px; opacity: 0; }
.ed-steps .selected .cp-arrow { opacity: 1; color: var(--cp-lime); }
.ed-console { border: 1px solid var(--cp-line); border-radius: 18px; background: var(--cp-panel); box-shadow: 0 28px 70px var(--cue-shadow); overflow: hidden; }
.ed-console-bar { display: flex; gap: 10px; align-items: center; padding: 18px 24px; border-bottom: 1px solid var(--cp-line); font: 10px ui-monospace, monospace; letter-spacing: .09em; }
.ed-indicator { width: 7px; height: 7px; border-radius: 50%; background: var(--cp-lime); }
.ed-demo-tag { margin-left: auto; color: var(--cp-muted); }
.ed-console-body { padding: 26px; min-height: 395px; }
.ed-console-heading { display: flex; justify-content: space-between; gap: 15px; font-size: 12px; color: var(--cp-muted); }
.ed-status { color: var(--cp-lime); text-align: right; }
.ed-console h3 { margin: 24px 0; font-size: 28px; }
.ed-request-data { display: flex; gap: 24px; align-items: flex-start; min-height: 210px; }
.ed-date { display: grid; place-items: center; width: 94px; min-height: 108px; background: var(--cp-lime); color: var(--cue-accent-ink); border-radius: 10px; padding: 12px; flex-shrink: 0; }
.ed-date b { font-size: 44px; letter-spacing: -.05em; }
.ed-date span { font: 12px ui-monospace, monospace; }
.ed-request-data dl { margin: 0; flex: 1; }
.ed-request-data dl div { display: flex; justify-content: space-between; gap: 15px; border-bottom: 1px solid var(--cp-line); padding: 13px 0; font-size: 12px; }
.ed-request-data dt { color: var(--cp-muted); }
.ed-request-data dd { margin: 0; text-align: right; }
.ed-next { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 16px 0 0; border: 0; border-top: 1px solid var(--cp-line); background: none; color: var(--cp-lime); cursor: pointer; font-size: 13px; }
.ed-console .ed-demo-foot { padding: 14px 26px; margin: 0; font-size: 10px; background: var(--cp-black); }
.ed-calendar { min-height: 210px; }
.ed-calendar .ed-mono { font-size: 10px; margin: 0 0 10px; }
.ed-days { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; }
.ed-days span { display: grid; place-items: center; min-height: 24px; font: 11px ui-monospace,monospace; color: var(--cp-muted); }
.ed-days .chosen { background: var(--cp-lime); color: var(--cue-accent-ink); border-radius: 5px; }
.ed-calendar .ed-available { color: var(--cp-lime); font-size: 11px; }
.ed-decision { min-height: 210px; }
.ed-decision > p { font-size: 14px; }
.ed-option { padding: 10px 0; display: flex; justify-content: space-between; border-bottom: 1px solid var(--cp-line); font-size: 13px; }
.ed-option .cp-arrow { width: 6px; height: 6px; }
.ed-decision small { display: block; color: var(--cp-muted); font-size: 10px; line-height: 1.4; margin: 12px 0; }
.ed-share { border-block: 1px solid var(--cp-line); background: var(--cp-panel); }
.ed-share h2 { max-width: 810px; }
.ed-share-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 90px; align-items: center; margin-top: 50px; }
.ed-tabs { display: flex; border-bottom: 1px solid var(--cp-line); gap: 22px; margin-bottom: 32px; }
.ed-tabs button { min-height: 44px; padding: 0 0 12px; border: 0; border-bottom: 2px solid transparent; color: var(--cp-muted); background: none; font-size: 13px; cursor: pointer; }
.ed-tabs button.selected { color: var(--cp-lime); border-bottom-color: var(--cp-lime); }
.ed-share-layout h3 { margin: 0 0 18px; }
.ed-share-layout .ed-privacy { display: flex; align-items: flex-start; gap: 10px; padding: 18px 0; font-size: 13px; }
.ed-privacy svg { width: 18px; height: 18px; flex-shrink: 0; margin-top: 3px; fill: none; stroke: var(--cp-lime); stroke-width: 1.5; }
.ed-share-preview { min-height: 420px; padding: 26px; background: var(--cp-black); border: 1px solid var(--cp-line); border-radius: 16px; }
.ed-mono { color: var(--cp-muted); font: 10px ui-monospace, monospace; letter-spacing: .1em; }
.ed-profile-cover { margin-top: 25px; height: 120px; padding: 20px; background: linear-gradient(130deg, color-mix(in srgb,var(--cp-lime) 15%,var(--cp-black)),var(--cp-black)); border-bottom: 1px solid var(--cp-lime); overflow: hidden; }
.ed-profile-cover span { color: var(--cp-lime); font: 10px ui-monospace,monospace; letter-spacing: .14em; }
.ed-profile-cover svg { width: 100%; height: 65px; fill: none; stroke: var(--cp-lime); stroke-width: 1; margin-top: 12px; }
.ed-share-preview h4 { font-size: 28px; margin: 24px 0 8px; letter-spacing: -.025em; }
.ed-share-preview p { margin-top: 0; font-size: 14px; }
.ed-form-button { display: flex; align-items: center; justify-content: space-between; padding: 16px; margin-top: 24px; background: var(--cp-lime); color: var(--cue-accent-ink); border-radius: 6px; font-size: 13px; }
.ed-browser-bar { display: flex; align-items: center; gap: 5px; border-bottom: 1px solid var(--cp-line); padding: 24px 0 14px; }
.ed-browser-bar i { width: 5px; height: 5px; border-radius: 50%; background: var(--cp-muted); }
.ed-browser-bar span { font: 9px ui-monospace,monospace; margin-left: 12px; color: var(--cp-muted); }
.ed-field { border: 1px solid var(--cp-line); border-radius: 5px; padding: 13px; margin-top: 10px; color: var(--cp-muted); font-size: 12px; }
.ed-code { margin-top: 16px; color: var(--cp-lime); font: 12px ui-monospace,monospace; }
.ed-sticker { text-align: center; padding: 26px 10px; }
.ed-sticker svg { display: block; width: 110px; margin: 24px auto; stroke: var(--cp-lime); fill: none; stroke-width: 3; }
.ed-sticker small { color: var(--cp-muted); font-size: 10px; }
.ed-control-intro { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; max-width: 1000px; }
.ed-responsibility { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; margin-top: 40px; }
.ed-responsibility > div { border-top: 2px solid var(--cp-line); padding-top: 22px; }
.ed-responsibility > div:last-child { border-color: var(--cp-lime); }
.ed-responsibility h3 { font-size: 18px; }
.ed-responsibility p { padding: 13px 0; margin: 0; border-bottom: 1px solid var(--cp-line); font-size: 15px; }
.ed-identity { display: grid; grid-template-columns: 1.1fr .9fr; gap: 100px; align-items: center; border-top: 1px solid var(--cp-line); }
.ed-identity-poster { position: relative; display: flex; flex-direction: column; justify-content: space-between; gap: 45px; min-height: 350px; padding: 32px; border: 1px solid var(--cp-line); border-left: 3px solid var(--cp-red); overflow: hidden; }
.ed-identity-poster strong { max-width: 290px; font-size: clamp(28px,3vw,44px); line-height: 1.05; letter-spacing: -.03em; white-space: pre-line; position: relative; z-index: 1; }
.ed-identity-poster > span:not(.ed-poster-corner) { font-size: 10px; color: var(--cp-muted); }
.ed-poster-corner { position: absolute; right: -12px; bottom: 35px; font-size: 130px; font-weight: 900; color: color-mix(in srgb,var(--cp-lime) 9%,transparent); }
.ed-closing { padding: 90px 0; background: color-mix(in srgb,var(--cp-lime) 5%,var(--cp-black)); border-top: 1px solid var(--cp-line); }
.ed-closing p { max-width: 600px; color: var(--cp-muted); font-size: clamp(20px,2.5vw,32px); }
.ed-closing h2 { margin: 18px 0 35px; font-size: clamp(52px,8vw,110px); line-height: 1; letter-spacing: -.055em; }
button:focus-visible, a:focus-visible { outline: 2px solid var(--cp-lime); outline-offset: 5px; }
@media (max-width: 850px) {
 .ed-section { padding-top: 60px; padding-bottom: 60px; }
 .ed-work,.ed-share-layout,.ed-identity { grid-template-columns: 1fr; gap: 30px; }
 .ed-control-intro,.ed-responsibility { gap: 30px; }
 .ed-work { margin-top: 30px; }
 .ed-share-layout { margin-top: 30px; }
 .ed-identity-poster { min-height: 280px; }
 .ed-closing { padding: 60px 0; }
}
@media (max-width: 520px) {
 .ed-section h2 { font-size: 37px; }
 .ed-section p { font-size: 15px; }
 .ed-section .ed-deck { font-size: 20px; }
 .ed-steps button { gap: 12px; padding: 20px 0; }
 .ed-steps strong { font-size: 22px; }
 .ed-console-body { padding: 20px; }
 .ed-console-heading { font-size: 10px; }
 .ed-console h3 { font-size: 24px; }
 .ed-request-data { gap: 14px; }
 .ed-date { width: 68px; }
 .ed-request-data dl div { display: block; padding: 8px 0; }
 .ed-request-data dd { text-align: left; margin-top: 5px; }
 .ed-console .ed-demo-foot { padding: 14px 20px; }
 .ed-share-preview { padding: 20px; }
 .ed-control-intro,.ed-responsibility { grid-template-columns: 1fr; gap: 20px; }
 .ed-control-intro > p { margin-top: 0; }
 .ed-tabs { gap: 22px; }
}
</style>
<style scoped>
.ed-skip { position:fixed; top:8px; left:12px; z-index:200; padding:14px 20px; background:var(--cue-accent); color:var(--cue-accent-ink); transform:translateY(-160%); }
.ed-skip:focus { transform:none; }
.ed-playback { display:flex; align-items:center; flex-wrap:wrap; gap:12px; margin-top:32px; }
.ed-playback button,.ed-menu-close { min-height:44px; padding:10px 18px; border:1px solid var(--cue-border); border-radius:6px; background:var(--cue-bg); color:var(--cue-text); cursor:pointer; font-size:14px; }
.ed-playback button:disabled { opacity:.55; cursor:default; }
.ed-playback > span { color:var(--cp-muted); font-size:13px; }
.ed-slide-badges { display:flex; align-items:center; gap:2px; }
.ed-slide-badges button { display:grid; place-items:center; width:44px; height:44px; padding:0; border:0; background:transparent; cursor:pointer; }
.ed-slide-badges button span { width:10px; height:10px; border:1px solid var(--cp-muted); border-radius:50%; background:transparent; transition:background .2s,width .2s,border-color .2s; }
.ed-slide-badges button.active span { width:22px; border-radius:10px; border-color:var(--cp-lime); background:var(--cp-lime); }
.ed-playback-toggle { display:grid; place-items:center; width:44px; height:44px; padding:0!important; border-radius:50%!important; }
.ed-playback-toggle svg { width:17px; height:17px; fill:none; stroke:currentColor; stroke-width:2; stroke-linecap:round; stroke-linejoin:round; }
.ed-playback-toggle .ed-play-icon { fill:currentColor; stroke:none; }
.ed-slide-badges button:focus-visible,.ed-playback-toggle:focus-visible { outline:2px solid var(--cp-lime); outline-offset:2px; }
.cp-mobile-menu--portal { grid-template-rows:auto 1fr auto; }
.ed-menu-close { justify-self:end; margin-top:16px; }
.ed-menu-close span { margin-left:14px; }
.cp-mobile-menu--portal a:focus-visible,.ed-menu-close:focus-visible { outline:2px solid var(--cue-accent); outline-offset:4px; }
.commercial-home .cp-locale button,.commercial-home .cp-theme,.commercial-home .cp-menu { min-width:44px; min-height:44px; }
.ed-next,.ed-tabs button { min-height:44px; }
.ed-demo-foot,.ed-console .ed-demo-foot,.ed-demo-caption,.ed-mono { font-size:12px; }
section:focus { outline:none; }
@media(max-width:520px) {
 .commercial-home .cp-brand { min-width:85px; max-width:105px; }
 .commercial-home .cp-nav-actions { gap:3px; }
}
@media(prefers-reduced-motion:reduce) {
 *,*::before,*::after { animation:none!important; transition:none!important; scroll-behavior:auto!important; }
}
</style>

<style scoped>
:global(html[data-theme='light'] .commercial-home) { --cp-lime:#5526cc; }
@media (max-width:520px) {
 .commercial-home .cp-nav-inner { gap:8px; }
 .commercial-home .cp-brand { min-width:80px; max-width:90px; }
 .ed-section h2,.ed-closing h2,.cp-hero h1 { overflow-wrap:anywhere; }
 .ed-console-heading { flex-wrap:wrap; }
 .ed-console,.ed-share-preview,.ed-work,.ed-share-layout > div { min-width:0; }
}
</style>
