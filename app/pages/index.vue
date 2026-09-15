<script setup lang="ts">
import es from '../../content/es/home.json'
import en from '../../content/en/home.json'

const { locale, theme, setLocale, setTheme } = useCuePreferences()
const copy = computed(() => locale.value === 'es' ? es : en)
const menuOpen = ref(false)
const searchState = ref<'idle' | 'searching' | 'found'>('idle')
const discoveryBudget = ref(1500)
const activeRole = ref(0)
const discoveryVisible = ref(false)
const backToTopVisible = ref(false)
const router = useRouter()
const activeRoleData = computed(() => copy.value.access.roles[activeRole.value] ?? copy.value.access.roles[0]!)
const discoveryArtists = computed(() => copy.value.search.artists
  .map((artist, index) => ({ ...artist, fee: [900, 1400, 2200][index] ?? 1500 }))
  .filter(artist => artist.fee <= discoveryBudget.value))
const formattedBudget = computed(() => new Intl.NumberFormat(locale.value === 'es' ? 'es-ES' : 'en-GB', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(discoveryBudget.value))
const discoveryCount = computed(() => locale.value === 'es'
  ? `${discoveryArtists.value.length} ${discoveryArtists.value.length === 1 ? 'artista disponible' : 'artistas disponibles'}`
  : `${discoveryArtists.value.length} available ${discoveryArtists.value.length === 1 ? 'artist' : 'artists'}`)
const noDiscoveryResults = computed(() => locale.value === 'es'
  ? 'No hay artistas de esta demo dentro del presupuesto seleccionado.'
  : 'No demo artists match the selected budget.')

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

onMounted(() => {
  updateBackToTop()
  window.addEventListener('scroll', updateBackToTop, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateBackToTop)
})

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
      <button class="menu-trigger" :aria-expanded="menuOpen" aria-label="Abrir menú" @click="menuOpen = !menuOpen"><span /><span /></button>
      <nav class="site-nav" :class="{ 'site-nav--open': menuOpen }">
        <a href="#problem" @click.prevent="scrollTo('#problem')">{{ copy.nav.problem }}</a>
        <a href="#product" @click.prevent="scrollTo('#product')">{{ copy.nav.product }}</a>
        <a href="#roles" @click.prevent="scrollTo('#roles')">{{ copy.nav.roles }}</a>
        <a href="#try" @click.prevent="scrollTo('#try')">{{ copy.nav.tryProduct }}</a>
      </nav>
      <div class="header-controls">
        <div class="locale-control" aria-label="Idioma">
          <button :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button>
          <button :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button>
        </div>
        <button class="appearance-toggle" :aria-label="locale === 'es' ? 'Cambiar apariencia' : 'Change appearance'" :title="locale === 'es' ? 'Cambiar apariencia' : 'Change appearance'" @click="setTheme(theme === 'dark' ? 'light' : 'dark')"><span /></button>
        <NuxtLink class="header-login" to="/access">{{ copy.nav.login }}</NuxtLink>
        <NuxtLink class="header-signup" to="/access?mode=signup">{{ copy.nav.signup }}</NuxtLink>
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
          <button class="button button--primary" @click="router.push('/access?mode=signup')">{{ copy.hero.primaryCta }} <span class="arrow arrow--ne" aria-hidden="true" /></button>
          <button class="text-button" @click="scrollTo('#product')">{{ copy.hero.secondaryCta }} <span class="arrow arrow--down" aria-hidden="true" /></button>
        </div>
      </div>
      <CueNetwork :state="searchState" :label="networkLabel" />
      <p class="hero__edge mono">ARTIST <span class="arrow arrow--right" aria-hidden="true" /> AVAILABILITY <span class="arrow arrow--right" aria-hidden="true" /> REQUEST <span class="arrow arrow--right" aria-hidden="true" /> CONFIRMED</p>
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
      <ol class="flow-line">
        <li v-for="(step, index) in copy.flow.steps" :key="step.name">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <strong>{{ step.name }}</strong>
          <p>{{ step.detail }}</p>
        </li>
      </ol>
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
          <NuxtLink class="button button--primary" :to="activeRoleData.route">{{ activeRoleData.cta }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink>
        </article>
        <aside><i /> <span><strong>{{ copy.access.demoTitle }}</strong>{{ copy.access.demoNote }}</span></aside>
      </div>
    </section>

    <section id="try" class="demo-reality section-pad">
      <div class="section-mark mono">{{ copy.demo.index }}</div>
      <div class="section-heading"><p class="eyebrow">{{ copy.demo.eyebrow }}</p><h2>{{ copy.demo.title }}</h2><p>{{ copy.demo.body }}</p></div>
      <div class="demo-reality__grid"><article><strong>{{ copy.demo.currentTitle }}</strong><ul><li v-for="item in copy.demo.current" :key="item"><span>✓</span>{{ item }}</li></ul></article><article><strong>{{ copy.demo.realTitle }}</strong><ul><li v-for="item in copy.demo.real" :key="item"><span>○</span>{{ item }}</li></ul><p class="demo-reality__note">{{ copy.demo.realNote }}</p></article></div>
      <div class="demo-reality__actions">
        <NuxtLink class="button button--primary" to="/access?mode=signup">{{ copy.demo.panelButton }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink>
        <NuxtLink class="button button--ghost" to="/artist">{{ copy.demo.requestButton }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink>
      </div>
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
        <label class="range-field">{{ copy.search.budget }}<output>{{ formattedBudget }}</output><input v-model.number="discoveryBudget" type="range" min="300" max="3000" step="100"></label>
        <button class="button button--primary" type="submit">{{ searchState === 'searching' ? copy.search.searching : copy.search.button }} <span class="arrow arrow--ne" aria-hidden="true" /></button>
      </form>
      <div class="results" :class="{ 'results--visible': discoveryVisible }" aria-live="polite">
        <header><strong>{{ discoveryCount }}</strong><span>{{ copy.search.visibility }}</span></header>
        <p class="demo-note">{{ copy.search.resultHint }}</p>
        <div class="artist-grid">
          <article v-for="(artist, index) in discoveryArtists" :key="artist.name" class="artist-result" :class="{ active: index === 0 }">
            <div class="artist-result__visual"><span>0{{ index + 1 }} / PROFILE</span><i /></div>
            <p class="mono">{{ artist.city }}</p>
            <h3>{{ artist.name }}</h3>
            <p>{{ artist.sound }}</p>
            <span class="availability"><i />{{ copy.search.available }}</span>
            <details><summary>{{ copy.search.why }}</summary><ul><li v-for="reason in copy.search.reasons" :key="reason">{{ reason }}</li></ul></details>
            <NuxtLink class="artist-link" to="/artist">{{ copy.search.request }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink>
          </article>
          <p v-if="!discoveryArtists.length" class="discovery-empty">{{ noDiscoveryResults }}</p>
        </div>
      </div>
    </section>

    <section class="product-entry section-pad">
      <p class="eyebrow">{{ copy.entry.eyebrow }}</p>
      <h2>{{ copy.entry.title }}</h2>
      <p>{{ copy.entry.body }}</p>
      <div class="product-entry__actions">
        <NuxtLink class="button button--primary" to="/access?mode=signup">{{ copy.nav.signup }} <span class="arrow arrow--ne" aria-hidden="true" /></NuxtLink>
        <NuxtLink class="text-button" to="/access">{{ copy.nav.login }}</NuxtLink>
      </div>
    </section>

    <section id="feedback" class="early-access section-pad">
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