<script setup lang="ts">
type Audience = 'dj' | 'agency'
const props = defineProps<{ audience: Audience }>()
const { locale } = useCuePreferences()
const analytics = useAnalytics()
const isAgency = computed(() => props.audience === 'agency')
const copy = computed(() => {
  const es = locale.value === 'es'
  const common = es
    ? { home: 'Inicio', login: 'Acceder', how: 'Cómo funciona', access: 'Crear mi espacio', back: 'Volver a Cuebooker', example: 'Representación ilustrativa. Los datos son ficticios.', emailStatus: 'Disponible según configuración de la beta. La activación y el alcance se verifican durante el acceso.', other: 'También para', identity: 'Cuebooker', footer: 'Reservados todos los derechos.', contact: 'Contacto', privacy: 'Privacidad', terms: 'Aviso legal', cookies: 'Cookies', see: 'Ver cómo funciona' }
    : { home: 'Home', login: 'Sign in', how: 'How it works', access: 'Create my workspace', back: 'Back to Cuebooker', example: 'Illustrative representation. Details are fictional.', emailStatus: 'Availability depends on beta configuration. Activation and scope are verified during onboarding.', other: 'Also for', identity: 'Cuebooker', footer: 'All rights reserved.', contact: 'Contact', privacy: 'Privacy', terms: 'Legal notice', cookies: 'Cookies', see: 'See how it works' }
  const subject = props.audience === 'agency'
    ? (es ? {
      tag: 'CUEBOOKER / MANAGERS & AGENCIES',
      top: 'TU ROSTER.', accent: 'UN SOLO ESPACIO.',
      lead: 'Gestiona las oportunidades de tus artistas, conserva cada conversación y organiza el seguimiento de sus fechas.',
      create: 'CREAR ESPACIO DE AGENCIA',
      problemTag: '01 / EL RETO',
      problemTitle: 'Cada artista tiene sus fechas. Cada propuesta, su historia.',
      problemBody: 'Correos, llamadas y mensajes llegan por diferentes canales. Cuebooker conserva el contexto de los bookings dentro del workspace de cada artista.',
      workTitle: 'Una operación ordenada por artista.',
      cards: [
        { number: '01', title: 'Roster', body: 'Organiza tus artistas en un workspace y consulta el contexto de cada uno.' },
        { number: '02', title: 'Booking Core', body: 'Solicitudes, actividad, condiciones y próximas acciones conectadas.' },
        { number: '03', title: 'Fechas', body: 'Revisa holds y confirmaciones en el contexto del artista correspondiente.' }
      ],
      smartTag: 'SMART EMAIL CAPTURE',
      smartTitle: 'El correo entra. La oferta no se pierde.',
      smartBody: 'En buzones autorizados, el análisis asistido identifica posibles propuestas de contratación y prepara una solicitud con los datos disponibles para su revisión. Los mensajes que no son ofertas no generan solicitudes.',
      emailDetail: 'Contacto principal · Artista · Fecha · Venue · Condiciones',
      emailNon: 'Sin intención de booking → sin solicitud',
      showcaseTitle: 'Un perfil para cada artista.',
      showcaseBody: 'Comparte las fichas públicas y sus formularios de solicitud. El promotor no necesita registrarse.',
      closing: 'CADA ARTISTA. CADA OPORTUNIDAD. BAJO CONTROL.',
      counterpart: 'DJ', counterpartLink: '/dj'
    } : {
      tag: 'CUEBOOKER / MANAGERS & AGENCIES',
      top: 'YOUR ROSTER.', accent: 'ONE WORKSPACE.',
      lead: 'Manage opportunities across artists, retain the context of every conversation and follow each booking.',
      create: 'CREATE AGENCY WORKSPACE',
      problemTag: '01 / THE CHALLENGE', problemTitle: 'Every artist has dates. Every request has a history.',
      problemBody: 'Emails, calls and messages arrive through different channels. Cuebooker keeps the booking context inside each artist workspace.',
      workTitle: 'Organised around every artist.',
      cards: [
        { number: '01', title: 'Roster', body: 'Keep your artists together while maintaining separate operational context.' },
        { number: '02', title: 'Booking Core', body: 'Requests, activity, conditions and next actions stay connected.' },
        { number: '03', title: 'Dates', body: 'Check holds and confirmations in the relevant artist context.' }
      ],
      smartTag: 'SMART EMAIL CAPTURE', smartTitle: 'The email arrives. The offer stays visible.',
      smartBody: 'For authorised inboxes, assisted analysis identifies possible booking offers and prepares a request from available information for review. Unrelated messages do not create requests.',
      emailDetail: 'Primary contact · Artist · Date · Venue · Terms',
      emailNon: 'Not a booking → no request',
      showcaseTitle: 'A profile for every artist.', showcaseBody: 'Share public artist pages and enquiry forms. Promoters do not need an account.',
      closing: 'EVERY ARTIST. EVERY OPPORTUNITY. IN CONTROL.',
      counterpart: 'DJ', counterpartLink: '/dj'
    })
    : (es ? {
      tag: 'CUEBOOKER / FOR DJs',
      top: 'TU PERFIL.', accent: 'TU PRÓXIMO BOOKING.',
      lead: 'Comparte tu perfil y recibe solicitudes desde Instagram, WhatsApp, tu web, un QR o un enlace directo. Todas llegan a tu espacio de booking.',
      create: 'CREAR MI PERFIL',
      problemTag: '01 / EL PROBLEMA',
      problemTitle: '¿Dónde quedó la conversación de ese bolo?',
      problemBody: 'La fecha cambia por WhatsApp. El caché se habla por teléfono. Cuebooker te permite registrar lo ocurrido y seguir la propuesta sin perder el hilo.',
      workTitle: 'Del primer contacto al booking.',
      cards: [
        { number: '01', title: '+ CUE', body: 'Registra lo que ha pasado por texto y revisa la información antes de guardar la oportunidad.' },
        { number: '02', title: 'Seguimiento', body: 'Guarda la conversación, las condiciones y la siguiente acción en una solicitud.' },
        { number: '03', title: 'Calendario', body: 'Distingue una propuesta pendiente, un hold y una fecha confirmada.' }
      ],
      smartTag: 'SMART EMAIL CAPTURE', smartTitle: 'Tu correo recibe. Cuebooker organiza.',
      smartBody: 'Cuando el buzón está autorizado y configurado, la IA analiza correos entrantes, detecta posibles ofertas, extrae los datos disponibles y prepara una solicitud. Si el mensaje no trata de una contratación, no crea ninguna.',
      emailDetail: 'Contacto principal · Fecha · Venue · Caché (si consta)',
      emailNon: 'Correo no relacionado → sin solicitud',
      showcaseTitle: 'Un perfil. Muchas formas de recibir bookings.',
      showcaseBody: 'Tu ficha pública incluye un formulario preparado para que los promotores contacten contigo sin registrarse. Decide dónde distribuirla.',
      shareTag: '02 / DISTRIBUCIÓN', shareTitle: 'Comparte tu booking donde ya te encuentran.', shareBody: 'La misma ficha pública y su formulario, accesibles desde los canales que ya utilizas.', shareChannels: [
        { title: 'Instagram', body: 'Coloca tu enlace de booking en la bio o compártelo por mensaje directo.' },
        { title: 'WhatsApp Business', body: 'Incluye el enlace en tus mensajes de bienvenida o ausencia configurados en WhatsApp Business.' },
        { title: 'Tu página web', body: 'Inserta el widget o enlaza al formulario desde tu sitio.' },
        { title: 'Código QR', body: 'Comparte un QR que lleve directamente a tu ficha de booking.' },
        { title: 'Enlace directo', body: 'Cópialo y envíalo a promotores por cualquier canal.' }
      ], shareNote: 'WhatsApp e Instagram no se conectan automáticamente: puedes distribuir el enlace desde sus propias herramientas.',
      closing: 'TU PRÓXIMO BOOKING MERECE ESTAR EN SU SITIO.',
      counterpart: 'Manager / Agency', counterpartLink: '/agency'
    } : {
      tag: 'CUEBOOKER / FOR DJs', top: 'YOUR PROFILE.', accent: 'YOUR NEXT BOOKING.',
      lead: 'Share your profile and receive booking requests from Instagram, WhatsApp, your website, a QR code or a direct link. Keep them together in one booking workspace.',
      create: 'CREATE MY PROFILE',
      problemTag: '01 / THE PROBLEM', problemTitle: 'Where did that gig conversation go?',
      problemBody: 'The date changes on WhatsApp. The fee is agreed over the phone. Cuebooker lets you capture what happened and keep the follow-up together.',
      workTitle: 'From first contact to booking.',
      cards: [
        { number: '01', title: '+ CUE', body: 'Capture what happened in text and review the details before saving the opportunity.' },
        { number: '02', title: 'Follow-up', body: 'Keep messages, terms and the next action attached to one request.' },
        { number: '03', title: 'Calendar', body: 'Know the difference between a pending request, a hold and a confirmed date.' }
      ],
      smartTag: 'SMART EMAIL CAPTURE', smartTitle: 'Your inbox receives. Cuebooker organises.',
      smartBody: 'With an authorised, configured inbox, AI analyses incoming emails, identifies possible offers, extracts available data and prepares a request. Unrelated messages do not create one.',
      emailDetail: 'Primary contact · Date · Venue · Fee (if stated)',
      emailNon: 'Unrelated email → no request',
      showcaseTitle: 'One profile. Many ways to receive bookings.',
      showcaseBody: 'Your public artist page includes a booking enquiry form. Promoters can contact you without signing up. Choose where to share it.',
      shareTag: '02 / DISTRIBUTION', shareTitle: 'Put your booking link where people find you.', shareBody: 'One public artist page and enquiry form, accessible from the channels you already use.', shareChannels: [
        { title: 'Instagram', body: 'Add your booking link to your bio or share it in direct messages.' },
        { title: 'WhatsApp Business', body: 'Include the link in greeting or away messages configured in WhatsApp Business.' },
        { title: 'Your website', body: 'Embed the widget or link directly to the booking form.' },
        { title: 'QR code', body: 'Share a QR that takes promoters to your booking page.' },
        { title: 'Direct link', body: 'Copy your link and send it to any promoter.' }
      ], shareNote: 'Instagram and WhatsApp are not automatically integrated: share the link using their own tools.',
      closing: 'YOUR NEXT BOOKING DESERVES ITS OWN PLACE.',
      counterpart: 'Manager / Agency', counterpartLink: '/agency'
    })
  return { ...common, ...subject }
})
const imageUrl = `${useRuntimeConfig().app.baseURL}club-hero.webp`
useHead(() => ({
  htmlAttrs: { lang: locale.value },
  title: `${isAgency.value ? 'Agency' : 'DJ'} | Cuebooker`,
  meta: [{ name: 'description', content: copy.value.lead }, { property: 'og:description', content: copy.value.lead }]
}))
function trackSignup(area: string) {
  analytics.track('signup_click', { placement: `landing_${props.audience}_${area}`, audience: props.audience })
}
</script>

<template>
  <div class="audience-landing">
    <a class="skip" href="#main">{{ locale === 'es' ? 'Saltar al contenido' : 'Skip to content' }}</a>
    <header class="nav">
      <div class="shell nav-inner">
        <NuxtLink to="/" class="logo" :aria-label="copy.home"><CueBrand /></NuxtLink>
        <nav :aria-label="copy.identity">
          <NuxtLink to="/">{{ copy.home }}</NuxtLink>
          <a href="#how">{{ copy.how }}</a>
          <NuxtLink to="/access?mode=signin">{{ copy.login }}</NuxtLink>
        </nav>
        <CuePreferencesControl compact />
      </div>
    </header>
    <main id="main">
      <section class="hero" :style="{ '--hero-image': `url(${imageUrl})` }" aria-labelledby="landing-title">
        <div class="shell hero-inner">
          <div class="hero-content">
            <p class="eyebrow">{{ copy.tag }}</p>
            <h1 id="landing-title">{{ copy.top }} <em>{{ copy.accent }}</em></h1>
            <p class="lead">{{ copy.lead }}</p>
            <div class="actions">
              <NuxtLink to="/access?mode=signup" class="action primary" @click="trackSignup('hero')">{{ copy.create }} <span aria-hidden="true">↗</span></NuxtLink>
              <a href="#how" class="action secondary">{{ copy.see }}</a>
            </div>
          </div>
          <span class="hero-mark" aria-hidden="true">C /</span>
        </div>
      </section>
      <section id="how" class="shell section" aria-labelledby="problem-heading">
        <p class="eyebrow">{{ copy.problemTag }}</p>
        <div class="split">
          <h2 id="problem-heading">{{ copy.problemTitle }}</h2>
          <p class="section-lead">{{ copy.problemBody }}</p>
        </div>
        <h3 class="section-subhead">{{ copy.workTitle }}</h3>
        <div class="cards">
          <article v-for="item in copy.cards" :key="item.number" class="feature">
            <span class="number">{{ item.number }}</span>
            <h4>{{ item.title }}</h4>
            <p>{{ item.body }}</p>
          </article>
        </div>
      </section>
      <section class="email-band" aria-labelledby="email-heading">
        <div class="shell email-layout">
          <div>
            <p class="eyebrow">{{ copy.smartTag }}</p>
            <h2 id="email-heading">{{ copy.smartTitle }}</h2>
            <p class="section-lead">{{ copy.smartBody }}</p>
            <p class="small-note">{{ copy.emailStatus }}</p>
          </div>
          <div class="email-visual">
            <div class="email-top"><span class="signal" />{{ locale === 'es' ? 'CORREO ENTRANTE' : 'INCOMING EMAIL' }}</div>
            <div class="email-stage">
              <span class="number">01 / {{ locale === 'es' ? 'DETECCIÓN' : 'DETECTION' }}</span>
              <strong>{{ locale === 'es' ? 'Posible oferta de booking' : 'Possible booking enquiry' }}</strong>
            </div>
            <div class="email-stage success">
              <span class="number">02 / BOOKING CORE</span>
              <strong>{{ locale === 'es' ? 'Solicitud preparada para revisión' : 'Request ready for review' }}</strong>
              <p>{{ copy.emailDetail }}</p>
            </div>
            <div class="email-muted">{{ copy.emailNon }}</div>
            <p class="disclaimer">{{ copy.example }}</p>
          </div>
        </div>
      </section>
      <section v-if="!isAgency" class="shell section distribution" aria-labelledby="distribution-heading">
        <div class="distribution-head">
          <p class="eyebrow">{{ copy.shareTag }}</p>
          <h2 id="distribution-heading">{{ copy.shareTitle }}</h2>
          <p class="section-lead">{{ copy.shareBody }}</p>
        </div>
        <div class="distribution-grid">
          <article v-for="(channel, index) in copy.shareChannels" :key="channel.title" class="distribution-card">
            <span class="number">0{{ index + 1 }}</span>
            <h3>{{ channel.title }}</h3>
            <p>{{ channel.body }}</p>
          </article>
        </div>
        <p class="small-note">{{ copy.shareNote }}</p>
      </section>
      <section class="shell section identity">
        <div>
          <p class="eyebrow">{{ locale === 'es' ? 'PERFIL PÚBLICO' : 'PUBLIC PROFILE' }}</p>
          <h2>{{ copy.showcaseTitle }}</h2>
          <p class="section-lead">{{ copy.showcaseBody }}</p>
        </div>
        <div class="profile-art" aria-hidden="true"><span>CUE / ARTIST</span><div class="pulse" /><strong>{{ locale === 'es' ? 'TU PERFIL' : 'YOUR PROFILE' }}</strong></div>
      </section>
      <section class="close">
        <div class="shell close-inner">
          <p class="eyebrow">CUEBOOKER / BOOKING MANAGEMENT</p>
          <h2>{{ copy.closing }}</h2>
          <NuxtLink to="/access?mode=signup" class="action dark" @click="trackSignup('closing')">{{ copy.create }} <span aria-hidden="true">↗</span></NuxtLink>
          <p class="switch">{{ copy.other }} <NuxtLink :to="copy.counterpartLink">{{ copy.counterpart }} →</NuxtLink></p>
        </div>
      </section>
    </main>
    <footer class="footer"><div class="shell footer-inner"><NuxtLink to="/" class="footer-brand"><CueBrand /></NuxtLink><span>© {{ new Date().getFullYear() }} Cuebooker</span><NuxtLink to="/privacidad">{{ copy.privacy }}</NuxtLink><NuxtLink to="/aviso-legal">{{ copy.terms }}</NuxtLink><NuxtLink to="/cookies">{{ copy.cookies }}</NuxtLink><a href="mailto:contact@cuebooker.com">{{ copy.contact }}</a></div></footer>
  </div>
</template>

<style scoped>
.audience-landing{--acid:var(--cp-lime,var(--cue-accent,#b8f354));--ink:#101112;color:#f4f4f0;background:#101112;font-family:inherit;overflow:hidden}.shell{width:min(1200px,calc(100% - 48px));margin:auto}.skip{position:absolute;top:-90px;left:12px;z-index:100;padding:12px;background:var(--acid);color:#101112}.skip:focus{top:12px}.nav{position:relative;z-index:5;background:#101112;border-bottom:1px solid #343536}.nav-inner{min-height:80px;display:flex;align-items:center;justify-content:space-between;gap:20px}.logo,.footer-brand{display:inline-flex;max-width:145px;color:var(--acid)}.logo :deep(.cue-brand),.footer-brand :deep(.cue-brand){width:140px}.nav nav{display:flex;flex-wrap:wrap;gap:24px}.nav nav a,.footer a{color:inherit;text-decoration:none;font-size:13px}.nav nav a:hover,.footer a:hover{color:var(--acid)}.hero{position:relative;min-height:670px;background:linear-gradient(90deg,rgba(6,7,7,.82),rgba(6,7,7,.65),rgba(6,7,7,.82)),var(--hero-image) center/cover no-repeat}.hero-inner{min-height:670px;display:flex;align-items:center;justify-content:center;position:relative}.hero-content{position:relative;z-index:1;max-width:950px;padding:90px 0;margin-inline:auto;text-align:center}.eyebrow,.number{font-size:12px;letter-spacing:.15em;font-weight:700;color:var(--acid)}h1,h2,h3,h4,p{margin-top:0}h1{font-size:clamp(52px,7.5vw,112px);line-height:.99;letter-spacing:-.055em;max-width:920px;margin:20px 0 28px;text-transform:uppercase}h1 em{display:block;color:var(--acid);font-style:normal}.lead{font-size:clamp(18px,1.8vw,23px);line-height:1.55;max-width:670px;color:#e0e0da;margin-inline:auto}.actions{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-top:32px}.action{display:inline-flex;align-items:center;justify-content:space-between;gap:25px;padding:17px 24px;border-radius:999px;text-decoration:none;font-size:12px;letter-spacing:.08em;font-weight:750}.primary{background:var(--acid);color:#111}.secondary{border:1px solid #8b8b84;color:#fff}.hero-mark{position:absolute;bottom:32px;right:4px;font-weight:800;font-size:60px;opacity:.32;color:var(--acid)}.section{padding-top:105px;padding-bottom:112px;scroll-margin-top:25px}.split{display:grid;grid-template-columns:1.15fr .85fr;gap:60px;align-items:end}.section h2,.email-band h2,.identity h2{font-size:clamp(36px,4.4vw,68px);line-height:1.07;letter-spacing:-.045em;max-width:760px}.section-lead{color:#bdbdb7;font-size:18px;line-height:1.65}.distribution-head{max-width:820px;margin:0 auto 36px;text-align:center}.distribution-head h2{font-size:clamp(38px,4.4vw,68px);line-height:1.06;letter-spacing:-.045em}.distribution-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.distribution-card{min-height:215px;padding:28px;border:1px solid #353b31;background:#1a1e1a}.distribution-card h3{font-size:26px;margin:30px 0 13px}.distribution-card p{color:#bdbdb7;line-height:1.6;margin:0}.distribution>.small-note{text-align:center;margin-top:20px}.section-subhead{margin:64px 0 25px;font-size:24px;letter-spacing:-.025em}.cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}.feature{border:1px solid #343737;background:#1b1e1e;min-height:250px;padding:30px;display:flex;flex-direction:column}.feature h4{font-size:28px;margin:40px 0 12px}.feature p{line-height:1.6;color:#bdbdb7}.email-band{background:#1a1d1b;border-top:1px solid #333;border-bottom:1px solid #333;padding:105px 0}.email-layout{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}.small-note{font-size:12px;color:#b2b2aa;margin-top:20px;line-height:1.5}.email-visual{background:#101312;border:1px solid #4a4d39;box-shadow:0 24px 80px #0005;padding:28px;min-width:0}.email-top{font-size:11px;letter-spacing:.16em;color:#fff;padding-bottom:22px;border-bottom:1px solid #353b31}.signal{display:inline-block;width:8px;height:8px;background:var(--acid);border-radius:50%;margin-right:10px}.email-stage{padding:23px 0;border-bottom:1px solid #343a34}.email-stage strong{display:block;margin-top:13px;font-size:23px;letter-spacing:-.03em}.email-stage p{margin:13px 0 0;color:#d6d6ca;line-height:1.55}.success{background:linear-gradient(90deg,#242a1e,transparent);padding-left:18px}.email-muted{padding:22px 0;color:#b8b8b1;font-size:13px}.disclaimer{color:#999;font-size:11px;margin:0}.identity{display:grid;grid-template-columns:1fr 1fr;gap:65px;align-items:center}.profile-art{aspect-ratio:1.28;border:1px solid #44483d;background:radial-gradient(ellipse at 80% 20%,#515d1b,#1a2019 46%,#101112 85%);display:flex;flex-direction:column;justify-content:space-between;padding:26px;overflow:hidden}.profile-art span{font-size:12px;letter-spacing:.13em}.profile-art strong{font-size:clamp(34px,4.8vw,64px);line-height:1;color:var(--acid)}.pulse{height:70px;opacity:.45;background:repeating-linear-gradient(90deg,transparent 0 12px,var(--acid) 13px 15px,transparent 16px 26px);mask-image:linear-gradient(0deg,transparent,black,transparent)}.close{background:var(--acid);color:#111;padding:90px 0}.close .eyebrow{color:#343c05}.close h2{font-size:clamp(45px,6.1vw,86px);max-width:1060px;line-height:1.03;letter-spacing:-.055em}.dark{background:#111;color:white}.switch{margin:26px 0 0;font-size:13px}.switch a{color:#111;font-weight:700}.footer{background:#111;border-top:1px solid #3d3d3d}.footer-inner{min-height:94px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}.footer span{font-size:12px;color:#aaa}.audience-landing :is(a,button):focus-visible{outline:3px solid var(--acid);outline-offset:4px}@media(max-width:900px){.split,.email-layout,.identity{grid-template-columns:1fr;gap:28px}.hero,.hero-inner{min-height:600px}.cards,.distribution-grid{grid-template-columns:1fr}.feature{min-height:190px}.feature h4{margin-top:24px}.hero-mark{display:none}}@media(max-width:540px){.shell{width:calc(100% - 32px)}.nav-inner{min-height:74px;gap:8px}.logo :deep(.cue-brand){width:98px}.nav nav{gap:12px}.nav nav a{font-size:11px}.nav nav a:first-child{display:none}.hero,.hero-inner{min-height:640px}.hero-content{padding:62px 0}.lead{font-size:17px}.action{width:100%;justify-content:center}.section{padding-top:75px;padding-bottom:78px}.email-band{padding:75px 0}.email-visual{padding:18px}.footer-inner{padding:28px 0;justify-content:flex-start;gap:17px}.footer-brand{width:100%}.identity{gap:28px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
</style>