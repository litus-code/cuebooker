<script setup lang="ts">
import es from '../../content/es/home.json'
import en from '../../content/en/home.json'

const { locale, theme, setLocale, setTheme } = useCuePreferences()
const copy = computed(() => locale.value === 'es' ? es : en)
const menuOpen = ref(false)
const searchState = ref<'idle' | 'searching' | 'found'>('idle')
const activeRole = ref(0)
const pilotProfile = ref<number>()
const discoveryVisible = ref(false)
const pilotCtaVisible = ref(true)
const backToTopVisible = ref(false)
const router = useRouter()
const activeRoleData = computed(() => copy.value.access.roles[activeRole.value] ?? copy.value.access.roles[0]!)

const networkLabel = computed(() => {
  if (searchState.value === 'searching') return copy.value.hero.networkSearching
  if (searchState.value === 'found') return copy.value.hero.networkFound
  return copy.value.hero.networkIdle
})

function scrollTo(id: string) {
  menuOpen.value = false
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
}

function updateBackToTop() {
  backToTopVisible.value = window.scrollY > Math.max(520, window.innerHeight * 0.7)
}

let pilotObserver: IntersectionObserver | undefined

onMounted(() => {
  updateBackToTop()
  window.addEventListener('scroll', updateBackToTop, { passive: true })

  const earlyAccess = document.querySelector('#early-access')
  if (earlyAccess) {
    pilotObserver = new IntersectionObserver(([entry]) => {
      pilotCtaVisible.value = !entry?.isIntersecting
    }, { threshold: 0.08 })
    pilotObserver.observe(earlyAccess)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateBackToTop)
  pilotObserver?.disconnect()
})

function openPilot(profile?: number) {
  pilotProfile.value = profile
  scrollTo('#early-access')
}

function discoverArtists() {
  searchState.value = 'searching'
  discoveryVisible.value = false
  window.setTimeout(() => {
    searchState.value = 'found'
    discoveryVisible.value = true
  }, 550)
}

useHead(() => ({
  htmlAttrs: { lang: locale.value },
  title: copy.value.seo.title,
  meta: [{ name: 'description', content: copy.value.seo.description }]
}))
</script>

<template>
  <main class="site-shell">
    <header class="site-header">
      <a class="brand" href="#top" @click.prevent="scrollTo('#top')">CUEBOOKER<span>/</span></a>
      <p class="live-status"><i /> {{ copy.prototype }}</p>
      <button class="menu-trigger" :aria-expanded="menuOpen" aria-label="Abrir menú" @click="menuOpen = !menuOpen"><span /><span /></button>
      <nav class="site-nav" :class="{ 'site-nav--open': menuOpen }">
        <a href="#problem" @click.prevent="scrollTo('#problem')">{{ copy.nav.problem }}</a>
        <a href="#product" @click.prevent="scrollTo('#product')">{{ copy.nav.product }}</a>
        <a href="#roles" @click.prevent="scrollTo('#roles')">{{ copy.nav.roles }}</a>
        <a href="#early-access" @click.prevent="scrollTo('#early-access')">{{ copy.nav.earlyAccess }}</a>
      </nav>
      <div class="header-controls">
        <div class="locale-control" aria-label="Idioma">
          <button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button>
          <button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
        </div>
        <div class="theme-control" aria-label="Apariencia">
          <button v-for="value in ['dark', 'light'] as const" :key="value" :class="{ active: theme === value }" :aria-pressed="theme === value" @click="setTheme(value)">{{ value.toUpperCase() }}</button>
        </div>
      </div>
    </header>

    <section id="top" class="hero section-pad">
      <div class="hero__meta mono"><span>22:47:16</span><span>BARCELONA<br>41.3874° N</span></div>
      <div class="hero__copy">
        <p class="eyebrow">{{ copy.hero.eyebrow }}</p>
        <h1>{{ copy.hero.titleTop }}<br><em><span v-for="word in copy.hero.titleBottom.split(' ')" :key="word">{{ word }}</span></em></h1>
        <p class="lead">{{ copy.hero.body }}</p>
        <ul class="hero__proofs">
          <li v-for="proof in copy.hero.proofs" :key="proof"><i />{{ proof }}</li>
        </ul>
        <div class="hero__actions">
          <button class="button button--primary" @click="router.push('/artist')">{{ copy.hero.primaryCta }} <span>↗</span></button>
          <button class="text-button" @click="scrollTo('#problem')">{{ copy.hero.secondaryCta }} ↓</button>
        </div>
      </div>
      <CueNetwork :state="searchState" :label="networkLabel" />
      <p class="hero__edge mono">ARTIST → AVAILABILITY → REQUEST → CONFIRMED</p>
    </section>

    <section id="problem" class="problem section-pad">
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

    <section id="product" class="connected section-pad">
      <div class="section-mark mono">{{ copy.flow.index }}</div>
      <div class="section-heading">
        <p class="eyebrow">{{ copy.flow.eyebrow }}</p>
        <h2>{{ copy.flow.title }}</h2>
        <p>{{ copy.flow.body }}</p>
      </div>
      <ol class="flow-line"><li v-for="(step, index) in copy.flow.steps" :key="step"><span>{{ String(index + 1).padStart(2, '0') }}</span>{{ step }}</li></ol>
    </section>

    <section class="integrations section-pad">
      <div class="section-mark mono">{{ copy.integrations.index }}</div>
      <div class="section-heading"><p class="eyebrow">{{ copy.integrations.eyebrow }}</p><h2>{{ copy.integrations.title }}</h2><p>{{ copy.integrations.body }}</p></div>
      <div class="integration-grid"><article v-for="(item, index) in copy.integrations.items" :key="item.name"><span class="mono">0{{ index + 1 }} / {{ item.label }}</span><div class="integration-visual" :class="`integration-visual--${index + 1}`"><i /><i /><i /></div><h3>{{ item.name }}</h3><p>{{ item.body }}</p></article></div>
      <p class="integration-note"><i />{{ copy.integrations.note }}</p>
    </section>

    <section id="roles" class="roles section-pad">
      <div class="section-mark mono">{{ copy.roles.index }}</div>
      <div class="section-heading"><p class="eyebrow">{{ copy.roles.eyebrow }}</p><h2>{{ copy.roles.title }}</h2></div>
      <div class="role-grid"><article v-for="(item, index) in copy.roles.items" :key="item.name"><span class="mono">0{{ index + 1 }}</span><p class="eyebrow">{{ item.name }}</p><h3>{{ item.headline }}</h3><p>{{ item.body }}</p></article></div>
    </section>

    <section class="discovery section-pad">
      <div class="section-mark mono">{{ copy.search.index }}</div>
      <div class="section-heading discovery__heading">
        <p class="eyebrow">{{ copy.search.eyebrow }}</p>
        <h2>{{ copy.search.title }}</h2>
        <p>{{ copy.search.body }}</p>
      </div>
      <form class="search-panel" @submit.prevent="discoverArtists">
        <label>{{ copy.search.where }}<input type="text" value="Barcelona"></label>
        <label>{{ copy.search.when }}<input type="text" value="24 OCT 2026"></label>
        <label>{{ copy.search.sound }}<input type="text" value="Techno"></label>
        <label class="range-field">{{ copy.search.budget }}<output>1.500 €</output><input type="range" min="300" max="3000" value="1500"></label>
        <button class="button button--primary" type="submit">{{ searchState === 'searching' ? copy.search.searching : copy.search.button }} <span>↗</span></button>
      </form>
      <div class="results" :class="{ 'results--visible': discoveryVisible }" aria-live="polite">
        <header><strong>{{ copy.search.resultCount }}</strong><span>{{ copy.search.visibility }}</span></header>
        <p class="demo-note">{{ copy.search.resultHint }}</p>
        <div class="artist-grid">
          <article v-for="(artist, index) in copy.search.artists" :key="artist.name" class="artist-result" :class="{ active: index === 0 }">
            <div class="artist-result__visual"><span>0{{ index + 1 }} / PROFILE</span><i /></div>
            <p class="mono">{{ artist.city }}</p>
            <h3>{{ artist.name }}</h3>
            <p>{{ artist.sound }}</p>
            <span class="availability"><i />{{ copy.search.available }}</span>
            <details><summary>{{ copy.search.why }}</summary><ul><li v-for="reason in copy.search.reasons" :key="reason">{{ reason }}</li></ul></details>
            <NuxtLink class="artist-link" to="/artist">{{ copy.search.request }} <span>↗</span></NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <section class="access-model section-pad">
      <div class="section-mark mono">{{ copy.access.index }}</div>
      <div class="section-heading">
        <p class="eyebrow">{{ copy.access.eyebrow }}</p>
        <h2>{{ copy.access.title }}</h2>
        <p>{{ copy.access.body }}</p>
      </div>
      <div class="access-demo">
        <div class="access-tabs" role="tablist" :aria-label="copy.access.selectorLabel">
          <button v-for="(role, index) in copy.access.roles" :key="role.name" :class="{ active: activeRole === index }" role="tab" :aria-selected="activeRole === index" @click="activeRole = index">{{ role.name }}</button>
        </div>
        <article class="access-card">
          <div class="access-card__top"><span class="mono">{{ activeRoleData.label }}</span><strong>{{ activeRoleData.account }}</strong></div>
          <h3>{{ activeRoleData.headline }}</h3>
          <ol><li v-for="(step, index) in activeRoleData.steps" :key="step"><span>{{ String(index + 1).padStart(2, '0') }}</span>{{ step }}</li></ol>
          <button class="button button--primary" @click="openPilot(activeRole + 1)">{{ activeRoleData.cta }} <span>↗</span></button>
        </article>
        <aside><i /> <span><strong>{{ copy.access.demoTitle }}</strong>{{ copy.access.demoNote }}</span></aside>
      </div>
    </section>

    <section class="demo-reality section-pad">
      <div class="section-mark mono">{{ copy.demo.index }}</div>
      <div class="section-heading"><p class="eyebrow">{{ copy.demo.eyebrow }}</p><h2>{{ copy.demo.title }}</h2><p>{{ copy.demo.body }}</p></div>
      <div class="demo-reality__grid"><article><strong>{{ copy.demo.currentTitle }}</strong><ul><li v-for="item in copy.demo.current" :key="item"><span>✓</span>{{ item }}</li></ul></article><article><strong>{{ copy.demo.realTitle }}</strong><ul><li v-for="item in copy.demo.real" :key="item"><span>○</span>{{ item }}</li></ul><p class="demo-reality__note">{{ copy.demo.realNote }}</p></article></div>
    </section>

    <section id="early-access" class="early-access section-pad">
      <div class="early-access__copy">
        <p class="eyebrow">{{ copy.cta.eyebrow }}</p>
        <h2>{{ copy.cta.title }}</h2>
        <p>{{ copy.cta.body }}</p>
        <div class="early-access__actions"><NuxtLink class="button button--primary" to="/artist">{{ copy.cta.demoButton }} <span>↗</span></NuxtLink></div>
        <small>{{ copy.cta.note }}</small>
      </div>
      <ClientOnly>
        <BrevoPilotForm :copy="copy.cta.form" :locale="locale" :profile="pilotProfile" />
        <template #fallback><div class="pilot-form pilot-form--loading">{{ copy.cta.form.loading }}</div></template>
      </ClientOnly>
    </section>

    <div class="floating-actions" aria-label="Accesos rápidos">
      <Transition name="floating-control">
        <button v-if="backToTopVisible" class="back-to-top" type="button" :aria-label="copy.cta.topButton" @click="scrollTo('#top')">
          <span>↑</span>
        </button>
      </Transition>
      <Transition name="floating-control">
        <button v-if="pilotCtaVisible" class="pilot-float" type="button" @click="openPilot()">
          <span><small>{{ copy.cta.floatLabel }}</small><strong>{{ copy.cta.floatButton }}</strong></span>
          <i>↓</i>
        </button>
      </Transition>
    </div>

    <footer class="site-footer"><span>CUEBOOKER / 2026</span><span>RAW · MECHANICAL · HUMAN</span><a :href="`mailto:${copy.cta.email}`">{{ copy.cta.email }}</a></footer>
  </main>
</template>
