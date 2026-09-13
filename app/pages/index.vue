<script setup lang="ts">
import es from '../../content/es/home.json'
import en from '../../content/en/home.json'

const { locale, theme, setLocale, setTheme } = useCuePreferences()
const copy = computed(() => locale.value === 'es' ? es : en)
const menuOpen = ref(false)
const city = ref('Barcelona')
const date = ref('24 OCT 2026')
const sound = ref('Techno')
const budget = ref(2400)
const searchState = ref<'idle' | 'searching' | 'found'>('idle')
const selectedArtist = ref(0)
const activeRole = ref(0)
const router = useRouter()
const activeRoleData = computed(() => copy.value.access.roles[activeRole.value] ?? copy.value.access.roles[0]!)

const artists = [
  { name: 'NARA VOSS', location: 'BERLIN', genres: 'TECHNO / HARDGROOVE', fee: '€€', match: '94%' },
  { name: 'MILA RHO', location: 'MADRID', genres: 'DETROIT / RAW', fee: '€€', match: '89%' },
  { name: 'NULLA', location: 'BARCELONA', genres: 'INDUSTRIAL / LIVE', fee: '€€€', match: '84%' }
]

const networkLabel = computed(() => {
  if (searchState.value === 'searching') return copy.value.hero.networkSearching
  if (searchState.value === 'found') return copy.value.hero.networkFound
  return copy.value.hero.networkIdle
})

async function discover() {
  searchState.value = 'searching'
  await new Promise(resolve => setTimeout(resolve, 720))
  searchState.value = 'found'
  await nextTick()
  document.querySelector('#results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollTo(id: string) {
  menuOpen.value = false
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' })
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

    <section id="product" class="discovery section-pad">
      <div class="section-mark mono">{{ copy.search.index }}</div>
      <div class="section-heading discovery__heading">
        <p class="eyebrow">{{ copy.search.eyebrow }}</p>
        <h2>{{ copy.search.title }}</h2>
        <p>{{ copy.search.body }}</p>
      </div>
      <form class="search-panel" @submit.prevent="discover">
        <label><span>{{ copy.search.where }}</span><input v-model="city"></label>
        <label><span>{{ copy.search.when }}</span><input v-model="date"></label>
        <label><span>{{ copy.search.sound }}</span><input v-model="sound"></label>
        <label class="range-field"><span>{{ copy.search.budget }}</span><output>€1K — €{{ (budget / 1000).toFixed(1) }}K</output><input v-model="budget" type="range" min="1200" max="5000" step="100"></label>
        <button class="button button--primary" :disabled="searchState === 'searching'">{{ searchState === 'searching' ? copy.search.searching : copy.search.button }} <span>↗</span></button>
      </form>

      <div id="results" class="results" :class="{ 'results--visible': searchState === 'found' }">
        <header><strong>{{ copy.search.resultCount }}</strong><span>{{ city }} / {{ sound }} / {{ date }}</span></header>
        <p class="demo-note">{{ copy.search.resultHint }}</p>
        <div class="artist-grid">
          <article v-for="(artist, index) in artists" :key="artist.name" class="artist-result" :class="{ active: selectedArtist === index }" @click="selectedArtist = index">
            <div class="artist-result__visual"><span>{{ String(index + 1).padStart(2, '0') }}</span><i /></div>
            <p class="mono">{{ artist.location }} / {{ artist.match }}</p>
            <h3>{{ artist.name }}</h3>
            <p>{{ artist.genres }} · {{ artist.fee }}</p>
            <strong class="availability"><i /> {{ copy.search.available }} · {{ date }}</strong>
            <details :open="selectedArtist === index"><summary>{{ copy.search.why }}</summary><ul><li v-for="reason in copy.search.reasons" :key="reason">{{ reason }}</li></ul></details>
            <NuxtLink class="artist-link" to="/artist">{{ copy.search.request }} <span>↗</span></NuxtLink>
          </article>
        </div>
      </div>
    </section>

    <section class="connected section-pad">
      <div class="section-mark mono">{{ copy.flow.index }}</div>
      <div class="section-heading">
        <p class="eyebrow">{{ copy.flow.eyebrow }}</p>
        <h2>{{ copy.flow.title }}</h2>
        <p>{{ copy.flow.body }}</p>
      </div>
      <ol class="flow-line"><li v-for="(step, index) in copy.flow.steps" :key="step"><span>{{ String(index + 1).padStart(2, '0') }}</span>{{ step }}</li></ol>
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
          <a class="button button--primary" :href="`mailto:${copy.cta.email}?subject=${encodeURIComponent(activeRoleData.mailSubject)}`">{{ activeRoleData.cta }} <span>↗</span></a>
        </article>
        <aside><i /> <span><strong>{{ copy.access.demoTitle }}</strong>{{ copy.access.demoNote }}</span></aside>
      </div>
    </section>

    <section id="early-access" class="early-access section-pad">
      <p class="eyebrow">{{ copy.cta.eyebrow }}</p>
      <h2>{{ copy.cta.title }}</h2>
      <p>{{ copy.cta.body }}</p>
      <a class="button button--primary" :href="`mailto:${copy.cta.email}?subject=CueBooker%20Early%20Access`">{{ copy.cta.button }} <span>↗</span></a>
      <small>{{ copy.cta.note }}</small>
    </section>

    <footer class="site-footer"><span>CUEBOOKER / 2026</span><span>RAW · MECHANICAL · HUMAN</span><a :href="`mailto:${copy.cta.email}`">{{ copy.cta.email }}</a></footer>
  </main>
</template>
