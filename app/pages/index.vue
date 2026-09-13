<script setup lang="ts">
import es from '../../content/es/home.json'
import en from '../../content/en/home.json'

const { locale, theme, setLocale, setTheme } = useCuePreferences()
const copy = computed(() => locale.value === 'es' ? es : en)
const menuOpen = ref(false)
const searchState = ref<'idle' | 'searching' | 'found'>('idle')
const activeRole = ref(0)
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
