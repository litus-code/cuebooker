<script setup lang="ts">
import es from '../../content/es/home.json'
import en from '../../content/en/home.json'

const { locale, theme, setLocale, setTheme } = useCuePreferences()
const copy = computed(() => locale.value === 'es' ? es : en)
const menuOpen = ref(false)
const activeRole = ref(0)
const backToTopVisible = ref(false)
const router = useRouter()
const analytics = useAnalytics()
let sectionObserver: IntersectionObserver | null = null
const seenSections = new Set<string>()

function trackCta(name: string, placement: string, destination?: string) {
  analytics.track('cta_click', {
    cta_name: name,
    placement,
    destination: destination || null
  })
}

function trackAuth(kind: 'signup' | 'login', placement: string) {
  analytics.track(kind === 'signup' ? 'signup_click' : 'login_click', { placement })
}

const activeRoleData = computed(() => copy.value.access.roles[activeRole.value] ?? copy.value.access.roles[0]!)
function scrollTo(id: string) {
  menuOpen.value = false
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
}

function updateBackToTop() {
  backToTopVisible.value = window.scrollY > Math.max(520, window.innerHeight * 0.7)
}

onMounted(() => {
  updateBackToTop()
  window.addEventListener('scroll', updateBackToTop, { passive: true })
  window.addEventListener('keydown', closeMenuOnEscape)

  sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting || entry.intersectionRatio < 0.3) continue
      const section = (entry.target as HTMLElement).dataset.analyticsSection
      if (!section || seenSections.has(section) || analytics.consent.value !== 'granted') continue
      if (analytics.track('section_view', { section })) seenSections.add(section)
    }
  }, { threshold: [0.3] })

  document.querySelectorAll<HTMLElement>('[data-analytics-section]').forEach(section => sectionObserver?.observe(section))
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateBackToTop)
  window.removeEventListener('keydown', closeMenuOnEscape)
  sectionObserver?.disconnect()
  sectionObserver = null
  document.documentElement.classList.remove('mobile-menu-open')
})

function closeMenuOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') menuOpen.value = false
}

watch(menuOpen, open => {
  if (import.meta.client) document.documentElement.classList.toggle('mobile-menu-open', open)
})

useHead(() => ({
  htmlAttrs: { lang: locale.value },
  title: copy.value.seo.title,
  meta: [{ name: 'description', content: copy.value.seo.description }]
}))
</script>

<template>
  <main class="site-shell">
    <header class="site-header">
      <a class="brand" href="#top" aria-label="Cuebooker" @click.prevent="scrollTo('#top')"><CueBrand /></a>
      <button class="menu-trigger" aria-controls="site-navigation" :aria-expanded="menuOpen" :aria-label="menuOpen ? (locale === 'es' ? 'Cerrar menú' : 'Close menu') : (locale === 'es' ? 'Abrir menú' : 'Open menu')" @click="menuOpen = !menuOpen"><span /><span /></button>
      <nav id="site-navigation" class="site-nav" :class="{ 'site-nav--open': menuOpen }">
        <a href="#problem" @click.prevent="scrollTo('#problem')">{{ copy.nav.problem }}</a>
        <a href="#product" @click.prevent="scrollTo('#product')">{{ copy.nav.product }}</a>
        <a href="#roles" @click.prevent="scrollTo('#roles')">{{ copy.nav.roles }}</a>
        <a href="#pricing" @click.prevent="scrollTo('#pricing')">{{ copy.nav.pricing }}</a>
        <a href="#try" @click.prevent="scrollTo('#try')">{{ copy.nav.tryProduct }}</a>
        <div class="mobile-menu-auth">
          <NuxtLink class="mobile-menu-login" to="/access" @click="menuOpen = false; trackAuth('login', 'mobile_menu')">{{ copy.nav.login }}</NuxtLink>
          <NuxtLink class="mobile-menu-signup" to="/access?mode=signup" @click="menuOpen = false; trackAuth('signup', 'mobile_menu')">{{ copy.nav.signup }}</NuxtLink>
        </div>
      </nav>
      <div class="header-controls">
        <div class="locale-control" aria-label="Idioma">
          <button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button>
          <button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
        </div>
        <button class="appearance-toggle" :aria-label="locale === 'es' ? 'Cambiar apariencia' : 'Change appearance'" :title="locale === 'es' ? 'Cambiar apariencia' : 'Change appearance'" @click="setTheme(theme === 'dark' ? 'light' : 'dark')"><span /></button>
        <NuxtLink class="header-login" to="/access" @click="trackAuth('login', 'header')">{{ copy.nav.login }}</NuxtLink>
        <NuxtLink class="header-signup" to="/access?mode=signup" @click="trackAuth('signup', 'header')">{{ copy.nav.signup }}</NuxtLink>
      </div>
    </header>

    <section id="top" class="hero section-pad" data-analytics-section="hero">
      <div class="hero__meta mono"><span>22:47:16</span><span>BARCELONA<br>41.3874° N</span></div>
      <div class="hero__copy">
        <p class="eyebrow">{{ copy.hero.eyebrow }}</p>
        <h1>{{ copy.hero.titleTop }}<br><em><span v-for="word in copy.hero.titleBottom.split(' ')" :key="word">{{ word }}</span></em></h1>
        <p class="lead">{{ copy.hero.body }}</p>
        <div class="hero__actions">
          <button class="button button--primary" @click="trackAuth('signup', 'hero'); trackCta('hero_primary', 'hero', '/access?mode=signup'); router.push('/access?mode=signup')">{{ copy.hero.primaryCta }} <span class="arrow arrow--ne" aria-hidden="true" /></button>
          <button class="text-button" @click="trackCta('see_how_it_works', 'hero', '#product'); scrollTo('#product')">{{ copy.hero.secondaryCta }} <span class="arrow arrow--down" aria-hidden="true" /></button>
        </div>
      </div>

      <div class="hero-capture" aria-label="Ejemplo de captura de booking">
        <div class="hero-capture__incoming">
          <span class="mono">WHATSAPP / 02:14</span>
          <p>“23 OCT · NITSA · 1.500 + HOTEL · FALTA HORARIO”</p>
        </div>
        <div class="hero-capture__pulse" aria-hidden="true"><i /><span>SMART CAPTURE</span></div>
        <div class="hero-capture__booking">
          <header><span class="mono">BOOKING</span><b>{{ locale === 'es' ? 'ESPERANDO RESPUESTA' : 'WAITING RESPONSE' }}</b></header>
          <strong>NITSA</strong>
          <dl>
            <div><dt>{{ locale === 'es' ? 'FECHA' : 'DATE' }}</dt><dd>23 OCT</dd></div>
            <div><dt>FEE</dt><dd>€1.500</dd></div>
            <div><dt>HOTEL</dt><dd>INCL.</dd></div>
            <div><dt>{{ locale === 'es' ? 'FALTA' : 'MISSING' }}</dt><dd>{{ locale === 'es' ? 'HORARIO' : 'SCHEDULE' }}</dd></div>
          </dl>
        </div>
        <div class="hero-capture__steps">
          <span v-for="(proof, index) in copy.hero.proofs" :key="proof"><i>{{ String(index + 1).padStart(2,'0') }}</i>{{ proof }}</span>
        </div>
      </div>

      <p class="hero__edge mono">INPUT <span class="arrow arrow--right" aria-hidden="true" /> CONTEXT <span class="arrow arrow--right" aria-hidden="true" /> BOOKING <span class="arrow arrow--right" aria-hidden="true" /> FOLLOW-UP</p>
    </section>

    <section id="problem" class="problem section-pad" data-analytics-section="problem">
      <div class="section-mark mono">{{ copy.problem.index }}</div>
      <div class="section-heading">
        <p class="eyebrow">{{ copy.problem.eyebrow }}</p>
        <h2>{{ copy.problem.title }}</h2>
        <p>{{ copy.problem.body }}</p>
      </div>
      <div class="chaos" aria-hidden="true">
        <div class="chaos__card chaos__card--instagram">INSTAGRAM<br><span>DM / 22:51</span></div>
        <div class="chaos__card chaos__card--whatsapp">WHATSAPP<br><span>“{{ copy.problem.quoteOne }}”</span></div>
        <div class="chaos__card chaos__card--mail">EMAIL<br><span>RE: {{ copy.problem.quoteTwo }}</span></div>
        <div class="chaos__card chaos__card--sheet">SHEET<br><span>{{ copy.problem.file }}</span></div>
      </div>
      <p class="problem__statement">{{ copy.problem.statement }}</p>
    </section>

    <section id="product" class="connected section-pad" data-analytics-section="product">
      <div class="section-mark mono">{{ copy.flow.index }}</div>
      <div class="section-heading">
        <p class="eyebrow">{{ copy.flow.eyebrow }}</p>
        <h2>{{ copy.flow.title }}</h2>
        <p>{{ copy.flow.body }}</p>
      </div>
      <ol class="flow-line">
        <li v-for="(step, index) in copy.flow.steps" :key="step.name">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ step.name }}</strong>
          <p>{{ step.detail }}</p>
        </li>
      </ol>
    </section>

    <section class="integrations section-pad" data-analytics-section="integrations">
      <div class="section-mark mono">{{ copy.integrations.index }}</div>
      <div class="section-heading"><p class="eyebrow">{{ copy.integrations.eyebrow }}</p><h2>{{ copy.integrations.title }}</h2><p>{{ copy.integrations.body }}</p></div>
      <div class="integration-grid"><article v-for="(item, index) in copy.integrations.items" :key="item.name"><span class="mono">0{{ index + 1 }} / {{ item.label }}</span><div class="integration-visual" :class="`integration-visual--${index + 1}`"><i /><i /><i /></div><h3>{{ item.name }}</h3><p>{{ item.body }}</p></article></div>
      <p class="integration-note"><i />{{ copy.integrations.note }}</p>
    </section>

    <section class="distribution section-pad" data-analytics-section="distribution">
      <div class="section-mark mono">{{ copy.distribution.index }}</div>
      <div class="section-heading">
        <p class="eyebrow">{{ copy.distribution.eyebrow }}</p>
        <h2>{{ copy.distribution.title }}</h2>
        <p>{{ copy.distribution.body }}</p>
      </div>
      <div class="distribution-grid">
        <article v-for="(item, index) in copy.distribution.channels" :key="item.name">
          <span class="mono">0{{ index + 1 }} / {{ item.label }}</span>
          <div class="distribution-signal" :class="`distribution-signal--${index + 1}`" aria-hidden="true">
            <i /><i /><i />
          </div>
          <h3>{{ item.name }}</h3>
          <p>{{ item.body }}</p>
        </article>
      </div>
      <p class="distribution-note">{{ copy.distribution.note }}</p>
    </section>

    <section class="identity-story section-pad" data-analytics-section="identity">
      <div class="section-mark mono">{{ copy.identity.index }}</div>
      <div class="section-heading">
        <p class="eyebrow">{{ copy.identity.eyebrow }}</p>
        <h2>{{ copy.identity.title }}</h2>
        <p>{{ copy.identity.body }}</p>
      </div>
      <div class="identity-grid">
        <article v-for="(item, index) in copy.identity.cards" :key="item.name" :class="{ active: index === 1 }">
          <span class="mono">{{ item.label }}</span>
          <strong>{{ item.name }}</strong>
          <p>{{ item.body }}</p>
        </article>
      </div>
      <div class="identity-status">
        <i />
        <span>{{ copy.identity.cueIdStatus }}</span>
      </div>
    </section>

    <section id="roles" class="roles section-pad" data-analytics-section="roles">
      <div class="section-mark mono">{{ copy.roles.index }}</div>
      <div class="section-heading"><p class="eyebrow">{{ copy.roles.eyebrow }}</p><h2>{{ copy.roles.title }}</h2></div>
      <div class="role-grid"><article v-for="(item, index) in copy.roles.items" :key="item.name"><span class="mono">0{{ index + 1 }}</span><p class="eyebrow">{{ item.name }}</p><h3>{{ item.headline }}</h3><p>{{ item.body }}</p></article></div>
    </section>

    <section class="access-model section-pad" data-analytics-section="access">
      <div class="section-mark mono">{{ copy.access.index }}</div>
      <div class="section-heading">
        <p class="eyebrow">{{ copy.access.eyebrow }}</p>
        <h2>{{ copy.access.title }}</h2>
        <p>{{ copy.access.body }}</p>
      </div>
      <div class="access-demo">
        <div class="access-tabs" role="tablist" :aria-label="copy.access.selectorLabel">
          <button v-for="(role, index) in copy.access.roles" :key="role.name" :class="{ active: activeRole === index }" role="tab" :aria-selected="activeRole === index" @click="activeRole = index; analytics.track('role_select', { role: role.name })">{{ role.name }}</button>
        </div>
        <article class="access-card">
          <div class="access-card__top"><span class="mono">{{ activeRoleData.label }}</span><strong>{{ activeRoleData.account }}</strong></div>
          <h3>{{ activeRoleData.headline }}</h3>
          <ol><li v-for="(step, index) in activeRoleData.steps" :key="step"><span>{{ String(index + 1).padStart(2, '0') }}</span>{{ step }}</li></ol>
          <NuxtLink class="button button--primary" :to="activeRoleData.route" @click="trackCta('role_access', 'access', activeRoleData.route)">{{ activeRoleData.cta }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink>
        </article>
        <aside><i /> <span><strong>{{ copy.access.demoTitle }}</strong>{{ copy.access.demoNote }}</span></aside>
      </div>
    </section>

    <section id="try" class="demo-reality section-pad" data-analytics-section="product_status">
      <div class="section-mark mono">{{ copy.demo.index }}</div>
      <div class="section-heading"><p class="eyebrow">{{ copy.demo.eyebrow }}</p><h2>{{ copy.demo.title }}</h2><p>{{ copy.demo.body }}</p></div>
      <div class="demo-reality__grid"><article><strong>{{ copy.demo.currentTitle }}</strong><ul><li v-for="item in copy.demo.current" :key="item"><span>✓</span>{{ item }}</li></ul></article><article><strong>{{ copy.demo.realTitle }}</strong><ul><li v-for="item in copy.demo.real" :key="item"><span>○</span>{{ item }}</li></ul><p class="demo-reality__note">{{ copy.demo.realNote }}</p></article></div>
      <div class="demo-reality__actions">
        <NuxtLink class="button button--primary" to="/access?mode=signup" @click="trackAuth('signup', 'product_status'); trackCta('product_signup', 'product_status', '/access?mode=signup')">{{ copy.demo.panelButton }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink>
        <NuxtLink class="button button--ghost" to="/artist" @click="trackCta('view_public_form', 'product_status', '/artist')">{{ copy.demo.requestButton }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink>
      </div>
    </section>

    <section id="pricing" class="pricing section-pad" data-analytics-section="pricing">
      <div class="section-mark mono">{{ copy.pricing.index }}</div>
      <div class="section-heading">
        <p class="eyebrow">{{ copy.pricing.eyebrow }}</p>
        <h2>{{ copy.pricing.title }}</h2>
        <p>{{ copy.pricing.body }}</p>
      </div>

      <div class="pricing-grid">
        <article
          v-for="plan in copy.pricing.plans"
          :key="plan.id"
          class="pricing-card"
          :class="{ 'pricing-card--featured': plan.id === 'artist_pro' }"
        >
          <header>
            <div>
              <span class="mono">{{ plan.id === 'free' ? 'FREE' : plan.id === 'artist_pro' ? 'PRO' : 'AGENCY' }}</span>
              <small v-if="plan.id === 'artist_pro'">{{ copy.pricing.recommended }}</small>
            </div>
            <strong>{{ plan.name }}</strong>
          </header>

          <div class="pricing-card__price">
            <b>{{ plan.price }}</b>
            <span>{{ plan.period }}</span>
          </div>
          <p>{{ plan.body }}</p>
          <em v-if="plan.annual">{{ plan.annual }}</em>

          <ul>
            <li v-for="feature in plan.features" :key="feature"><span>+</span>{{ feature }}</li>
          </ul>

          <NuxtLink
            class="button"
            :class="plan.id === 'artist_pro' ? 'button--primary' : 'button--ghost'"
            :to="`/access?mode=signup&plan=${plan.id}`"
            @click="trackAuth('signup', `pricing_${plan.id}`); trackCta(`pricing_${plan.id}`, 'pricing', `/access?mode=signup&plan=${plan.id}`)"
          >
            {{ plan.cta }} <span class="arrow arrow--ne" aria-hidden="true" />
          </NuxtLink>
        </article>
      </div>

      <div class="pricing-foot">
        <strong>{{ copy.pricing.founding }}</strong>
        <p>{{ copy.pricing.billingNote }}</p>
      </div>
    </section>

    <section class="product-entry section-pad" data-analytics-section="final_cta">
      <p class="eyebrow">{{ copy.entry.eyebrow }}</p>
      <h2>{{ copy.entry.title }}</h2>
      <p>{{ copy.entry.body }}</p>
      <div class="product-entry__actions">
        <NuxtLink class="button button--primary" to="/access?mode=signup" @click="trackAuth('signup', 'final_cta'); trackCta('final_signup', 'final_cta', '/access?mode=signup')">{{ copy.nav.signup }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink>
        <NuxtLink class="text-button" to="/access" @click="trackAuth('login', 'final_cta')">{{ copy.nav.login }}</NuxtLink>
      </div>
    </section>

    <section id="feedback" class="early-access section-pad" data-analytics-section="feedback">
      <div class="early-access__copy">
        <p class="eyebrow">{{ copy.feedback.eyebrow }}</p>
        <h2>{{ copy.feedback.title }}</h2>
        <p>{{ copy.feedback.body }}</p>
        <small>{{ copy.feedback.note }}</small>
      </div>
      <ClientOnly>
        <BrevoPilotForm :copy="copy.feedback.form" :locale="locale" />
        <template #fallback><div class="pilot-form pilot-form--loading">{{ copy.feedback.form.loading }}</div></template>
      </ClientOnly>
    </section>

    <div class="floating-actions" aria-label="Accesos rápidos">
      <Transition name="floating-control">
        <button v-if="backToTopVisible" class="back-to-top" type="button" :aria-label="copy.cta.topButton" @click="scrollTo('#top')">
          <span class="floating-arrow"><i class="arrow arrow--up" aria-hidden="true" /></span>
        </button>
      </Transition>
    </div>

    <footer class="site-footer"><span>CUEBOOKER / 2026</span><span>RAW · MECHANICAL · HUMAN</span><a :href="`mailto:${copy.cta.email}`">{{ copy.cta.email }}</a></footer>
  </main>
</template>
