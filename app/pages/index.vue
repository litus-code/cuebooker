<script setup lang="ts">
import es from '../../content/es/home.json'
import en from '../../content/en/home.json'

const { locale } = useCuePreferences()
const p = computed(() => locale.value === 'es' ? es : en)
const analytics = useAnalytics()
const heroImage = `${useRuntimeConfig().app.baseURL}club-hero.webp`
const menuOpen = ref(false)
const demoStep = ref(0)
const menuButton = ref<HTMLButtonElement>()
const mobileMenu = ref<HTMLElement>()
const reducedMotion = ref(true)
let motionQuery: MediaQueryList | undefined
let previousOverflow = ''

function trackSignup(placement: string) {
  analytics.track('signup_click', { placement })
}
function updateMotion() {
  reducedMotion.value = motionQuery?.matches ?? true
}
function closeMenu(restoreFocus = true) {
  menuOpen.value = false
  if (restoreFocus) nextTick(() => menuButton.value?.focus())
}
function scrollTo(id: string) {
  closeMenu(false)
  nextTick(() => {
    const target = document.getElementById(id)
    target?.focus({ preventScroll: true })
    target?.scrollIntoView({ behavior: reducedMotion.value ? 'auto' : 'smooth' })
  })
}
function onMenuKey(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu()
    return
  }
  if (event.key !== 'Tab') return
  const items = mobileMenu.value?.querySelectorAll<HTMLElement>('a, button')
  const first = items?.[0]
  const last = items?.[items.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
function selectStep(index: number) {
  demoStep.value = index
}
function stepKeys(event: KeyboardEvent, index: number) {
  const count = p.value.work.steps.length
  let next = index
  if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = count - 1
  else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % count
  else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index + count - 1) % count
  else return
  event.preventDefault()
  selectStep(next)
  nextTick(() => document.getElementById(`step-${next}`)?.focus())
}
function handleResize() {
  if (window.innerWidth > 1100 && menuOpen.value) {
    closeMenu(false)
    nextTick(() => document.querySelector<HTMLElement>('.home-nav-links a')?.focus())
  }
}
watch(menuOpen, async open => {
  if (!import.meta.client) return
  if (open) {
    previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    await nextTick()
    mobileMenu.value?.querySelector<HTMLElement>('button')?.focus()
  } else {
    document.documentElement.style.overflow = previousOverflow
  }
})
onMounted(() => {
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotion()
  motionQuery.addEventListener('change', updateMotion)
  window.addEventListener('resize', handleResize)
})
onBeforeUnmount(() => {
  motionQuery?.removeEventListener('change', updateMotion)
  window.removeEventListener('resize', handleResize)
  if (menuOpen.value) document.documentElement.style.overflow = previousOverflow
})
useHead(() => ({
  htmlAttrs: { lang: locale.value },
  title: p.value.seo.title,
  link: [{ rel: 'canonical', href: 'https://cuebooker.com/' }],
  meta: [
    { name: 'description', content: p.value.seo.description },
    { property: 'og:title', content: p.value.seo.title },
    { property: 'og:description', content: p.value.seo.description },
    { property: 'og:url', content: 'https://cuebooker.com/' },
    { name: 'twitter:title', content: p.value.seo.title },
    { name: 'twitter:description', content: p.value.seo.description }
  ]
}))
</script>

<template>
  <div class="commercial-home home-v2">
    <a class="home-skip" href="#top" @click.prevent="scrollTo('top')">{{ p.nav.skip }}</a>
    <header class="home-header">
      <nav class="cp-wrap home-navigation" :aria-label="p.nav.label">
        <NuxtLink class="home-brand" to="/" aria-label="Cuebooker"><CueBrand /></NuxtLink>
        <div class="home-nav-links">
          <a href="#product" @click.prevent="scrollTo('product')">{{ p.nav.product }}</a>
          <a href="#audience" @click.prevent="scrollTo('audience')">{{ p.nav.audience }}</a>
          <a href="#system" @click.prevent="scrollTo('system')">{{ p.nav.system }}</a>
        </div>
        <div class="home-nav-actions">
          <div class="home-desktop-preferences"><CuePreferencesControl compact /></div>
          <NuxtLink class="home-login" to="/access?mode=signin" @click="analytics.track('login_click', { placement: 'header' })">{{ p.nav.login }}</NuxtLink>
          <NuxtLink class="cp-cta home-nav-signup" to="/access?mode=signup" @click="trackSignup('header')">{{ p.nav.signup }}</NuxtLink>
          <button ref="menuButton" class="home-menu-toggle" type="button" :aria-label="p.nav.open" :aria-expanded="menuOpen" aria-controls="home-mobile-menu" @click="menuOpen = true">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 17h18" /></svg>
          </button>
        </div>
      </nav>
    </header>
    <Teleport to="body">
      <div v-if="menuOpen" id="home-mobile-menu" ref="mobileMenu" class="home-mobile-menu" role="dialog" aria-modal="true" :aria-label="p.nav.label" @keydown="onMenuKey">
        <div class="home-mobile-tools">
          <CuePreferencesControl />
          <button type="button" :aria-label="p.nav.close" @click="closeMenu()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" /></svg></button>
        </div>
        <nav :aria-label="p.nav.label">
          <a href="#product" @click.prevent="scrollTo('product')">{{ p.nav.product }}</a>
          <a href="#audience" @click.prevent="scrollTo('audience')">{{ p.nav.audience }}</a>
          <a href="#system" @click.prevent="scrollTo('system')">{{ p.nav.system }}</a>
          <NuxtLink to="/access?mode=signin" @click="closeMenu(false)">{{ p.nav.login }}</NuxtLink>
          <NuxtLink class="home-mobile-signup" to="/access?mode=signup" @click="closeMenu(false); trackSignup('mobile-menu')">{{ p.nav.signup }}</NuxtLink>
        </nav>
      </div>
    </Teleport>

    <main>
      <section id="top" tabindex="-1" class="home-hero" aria-labelledby="hero-title" :style="{ '--hero-image': `url(${heroImage})` }">
        <div class="home-hero-overlay" aria-hidden="true" />
        <div class="cp-wrap home-hero-layout">
          <div class="home-hero-content">
            <p class="cp-eyebrow">{{ p.hero.eyebrow }}</p>
            <h1 id="hero-title">{{ p.hero.title }} <em>{{ p.hero.accent }}</em></h1>
            <p class="home-lead">{{ p.hero.body }}</p>
            <div class="home-actions">
              <NuxtLink class="cp-cta" to="/access?mode=signup" @click="trackSignup('hero')">{{ p.hero.primary }}<span class="cp-arrow" aria-hidden="true" /></NuxtLink>
              <a class="cp-cta cp-cta--ghost" href="#system" @click.prevent="scrollTo('system')">{{ p.hero.secondary }}</a>
            </div>
            <p class="home-hero-note">{{ p.hero.note }}</p>
          </div>
        <!-- Replace this signature with a verified spot player when the licensed final asset is available. -->
        <p class="home-hero-signature">{{ p.hero.signature }}</p>
        <ol class="home-hero-route" :aria-label="p.work.title"><li v-for="(step, i) in p.work.steps" :key="step"><span>0{{ i + 1 }}</span>{{ step }}</li></ol>
        </div>
      </section>

      <section class="home-section cp-wrap" aria-labelledby="problem-title">
        <div class="home-section-intro"><p class="cp-kicker">{{ p.problem.label }}</p><h2 id="problem-title">{{ p.problem.title }}</h2><p class="home-lead">{{ p.problem.body }}</p></div>
        <HomeBookingContext :copy="p.problem" />
      </section>

      <section id="system" tabindex="-1" class="home-section cp-wrap" aria-labelledby="system-title">
        <div class="home-section-intro"><p class="cp-kicker">{{ p.work.label }}</p><h2 id="system-title">{{ p.work.title }}</h2><p class="home-lead">{{ p.work.body }}</p></div>
        <div class="ed-work">
          <div class="ed-steps" role="tablist" aria-orientation="vertical" :aria-label="p.nav.system">
            <button v-for="(step, i) in p.work.steps" :id="`step-${i}`" :key="step" type="button" role="tab" :tabindex="demoStep === i ? 0 : -1" :aria-selected="demoStep === i" aria-controls="booking-demo" :class="{ selected: demoStep === i }" @keydown="stepKeys($event, i)" @click="selectStep(i)"><span class="ed-index">0{{ i + 1 }}</span><span><strong>{{ step }}</strong><small>{{ p.work.descriptions[i] }}</small></span><span class="cp-arrow" aria-hidden="true" /></button>
          </div>
          <div id="booking-demo" class="ed-console" role="tabpanel" tabindex="0" :aria-labelledby="`step-${demoStep}`" aria-describedby="demo-disclaimer">
            <div class="ed-console-bar"><span class="ed-indicator" aria-hidden="true" />{{ p.work.workspace }}<span class="ed-demo-tag">DEMO</span></div>
            <div class="ed-console-body">
              <div class="ed-console-heading"><span>{{ p.work.request }}</span><span class="ed-status">{{ p.work.status[demoStep] }}</span></div>
              <h3>{{ p.work.venue }}</h3>
              <div v-if="demoStep === 0" class="ed-request-data"><div class="ed-date"><b>18</b><span>OCT</span></div><dl><div><dt>{{ p.work.fee }}</dt><dd>{{ p.work.amount }}</dd></div><div><dt>{{ p.work.set }}</dt><dd>{{ p.work.time }}</dd></div><div><dt>{{ p.work.contact }}</dt><dd>{{ p.work.promoter }}</dd></div></dl></div>
              <div v-else-if="demoStep === 1" class="home-demo-review"><p>{{ p.work.review }}</p><ul><li v-for="item in p.work.reviewItems" :key="item">{{ item }}</li></ul></div>
              <div v-else-if="demoStep === 2" class="home-demo-followup"><p>{{ p.work.followUp }}</p><p>{{ p.work.hold }}</p></div>
              <div v-else class="ed-calendar"><p class="ed-mono">{{ p.work.month }}</p><div class="ed-days"><span v-for="day in 31" :key="day" :class="{ chosen: day === 18 }">{{ day }}</span></div><p class="ed-available">{{ p.work.confirmed }}</p></div>
              <button class="ed-next" type="button" @click="selectStep((demoStep + 1) % p.work.steps.length)">{{ demoStep === p.work.steps.length - 1 ? p.work.restart : p.work.next }}<span class="cp-arrow" aria-hidden="true" /></button>
            </div>
            <div id="demo-disclaimer" class="ed-demo-foot"><strong>{{ p.work.demo }}</strong><p>{{ p.work.note }}</p></div>
          </div>
        </div>
      </section>

      <section id="product" tabindex="-1" class="home-section home-product" aria-labelledby="product-title">
        <div class="cp-wrap"><p class="cp-kicker">{{ p.features.label }}</p><h2 id="product-title">{{ p.features.title }}</h2><p class="home-lead">{{ p.features.body }}</p>
          <div class="home-card-grid"><article v-for="(feature, i) in p.features.items" :key="feature.title" class="home-card home-feature-card"><span class="home-mono">0{{ i + 1 }}</span><div class="home-feature-symbol" aria-hidden="true"><svg v-if="i === 0" viewBox="0 0 120 90"><rect x="10" y="10" width="100" height="70" rx="5"/><path d="M10 27h100M26 44h12m9 0h45M26 60h12m9 0h30"/></svg><svg v-else-if="i === 1" viewBox="0 0 120 90"><circle cx="25" cy="45" r="12"/><circle cx="95" cy="45" r="12"/><path d="M37 45h46m-9-8 9 8-9 8M25 33V12h70v21"/></svg><svg v-else viewBox="0 0 120 90"><rect x="15" y="15" width="90" height="65" rx="5"/><path d="M15 32h90M35 8v14m50-14v14M35 46h10m10 0h10m10 0h10M35 62h10m10 0h10"/><rect x="72" y="56" width="16" height="14" rx="2"/></svg></div><h3>{{ feature.title }}</h3><p>{{ feature.text }}</p></article></div>
        </div>
      </section>

      <section id="audience" tabindex="-1" class="home-section cp-wrap" aria-labelledby="audience-title">
        <p class="cp-kicker">{{ p.audience.label }}</p><h2 id="audience-title">{{ p.audience.title }}</h2>
        <div class="home-card-grid home-audience-grid"><article v-for="(role, i) in p.audience.items" :key="role.title" class="home-card"><span class="home-mono">{{ i === 0 ? 'DJ / SOLO' : 'MANAGER / AGENCY' }}</span><h3>{{ role.title }}</h3><p>{{ role.text }}</p><NuxtLink class="cp-cta" :class="{ 'cp-cta--ghost': i === 1 }" to="/access?mode=signup" @click="trackSignup(i === 0 ? 'audience-dj' : 'audience-agency')">{{ role.cta }}<span class="cp-arrow" aria-hidden="true" /></NuxtLink></article></div>
        <p class="home-audience-note">{{ p.audience.note }}</p>
      </section>

      <section class="home-section cp-wrap home-extensions" aria-labelledby="extensions-title">
        <p class="cp-kicker">{{ p.extensions.label }}</p><h2 id="extensions-title">{{ p.extensions.title }}</h2>
        <HomeEcosystem :copy="p.extensions" @signup="trackSignup('ecosystem-profile')" />
      </section>

      <section class="home-closing" aria-labelledby="closing-title"><div class="cp-wrap"><p class="cp-kicker">CUEBOOKER / BOOKING WORKSPACE</p><h2 id="closing-title">{{ p.closing.title }}</h2><p>{{ p.closing.body }}</p><NuxtLink class="cp-cta" to="/access?mode=signup" @click="trackSignup('closing')">{{ p.closing.cta }}<span class="cp-arrow" aria-hidden="true" /></NuxtLink></div></section>
    </main>
    <footer class="home-footer cp-wrap">
      <div><span class="home-brand"><CueBrand /></span><p>{{ p.closing.footer }}</p></div>
      <nav :aria-label="p.legal.label"><a href="mailto:contacto@cuebooker.com">{{ p.legal.contact }}</a><NuxtLink to="/privacidad">{{ p.legal.privacy }}</NuxtLink><NuxtLink to="/cookies">{{ p.legal.cookies }}</NuxtLink><NuxtLink to="/aviso-legal">{{ p.legal.notice }}</NuxtLink><button type="button" @click="analytics.openPreferences">{{ p.legal.settings }}</button></nav>
      <span>© 2026 Cuebooker</span>
    </footer>
  </div>
</template>

<style scoped>
.home-v2 { overflow-wrap: break-word; }
html[data-theme='light'] .home-v2 :is(.cp-kicker, .cp-eyebrow, .home-mono, .selected .ed-index, .ed-status, .ed-next, .ed-available) {
  color: color-mix(in srgb, var(--cp-lime) 85%, var(--cp-paper));
}
.home-v2 :deep(:is(a, button, [tabindex='0']):focus-visible),
.home-mobile-menu :is(a, button):focus-visible { outline: 2px solid var(--cue-accent); outline-offset: 5px; }
.home-v2 section[tabindex='-1'] { scroll-margin-top: 100px; }
.home-skip { position: fixed; top: 8px; left: 16px; z-index: 200; padding: 14px 18px; background: var(--cp-lime); color: var(--cue-accent-ink); transform: translateY(-160%); }
.home-skip:focus { transform: none; }
.home-header { position: fixed; inset: 0 0 auto; z-index: 40; border-bottom: 1px solid var(--cp-line); background: color-mix(in srgb, var(--cp-black) 94%, transparent); backdrop-filter: blur(16px); }
.home-navigation { display: flex; align-items: center; justify-content: space-between; gap: 24px; min-height: 84px; }
.home-brand { display: inline-flex; color: var(--cp-lime); flex-shrink: 0; }
.home-brand :deep(.cue-brand) { width: 150px; }
.home-nav-links, .home-nav-actions { display: flex; align-items: center; gap: 20px; }
.home-nav-links a, .home-login { font-size: 12px; white-space: nowrap; }
.home-nav-links a:hover, .home-login:hover { color: var(--cp-lime); }
.home-nav-signup { font-size: 10px; }
.home-menu-toggle { display: none; }
.home-menu-toggle, .home-mobile-tools > button { width: 44px; height: 44px; padding: 10px; border: 1px solid var(--cue-border); border-radius: 50%; background: var(--cue-surface); color: var(--cue-text); cursor: pointer; }
.home-menu-toggle svg, .home-mobile-tools svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.5; }
.home-mobile-menu { position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column; gap: 28px; padding: 24px; overflow-y: auto; background: var(--cue-bg); color: var(--cue-text); }
.home-mobile-tools { display: flex; align-items: center; justify-content: space-between; }
.home-mobile-menu nav { display: grid; }
.home-mobile-menu nav a { display: flex; align-items: center; min-height: 64px; padding: 14px 8px; border-bottom: 1px solid var(--cue-border); color: var(--cue-text); text-decoration: none; font-size: 22px; font-weight: 700; }
.home-mobile-menu nav .home-mobile-signup { justify-content: center; margin-top: 24px; border-radius: 999px; background: var(--cue-accent); color: var(--cue-accent-ink); font-size: 16px; }
.home-hero { position: relative; isolation: isolate; min-height: min(880px, 100svh); display: grid; align-items: center; background: var(--cp-black); border-bottom: 1px solid var(--cp-lime); }
.home-hero::before { position: absolute; inset: 0; z-index: -2; content: ''; background: var(--hero-image) 74% center / cover no-repeat; }
.home-hero-overlay { position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, var(--cp-black), color-mix(in srgb, var(--cp-black) 90%, transparent) 30%, color-mix(in srgb, var(--cp-black) 20%, transparent) 72%), linear-gradient(0deg, var(--cp-black), transparent 40%); }
.home-hero-content { min-width: 0; padding-block: 152px 62px; }
.home-hero-signature { position: absolute; right: 0; bottom: 114px; max-width: 310px; margin: 0; color: var(--cp-paper); font-size: 14px; line-height: 1.65; text-align: right; }
.home-hero h1 { max-width: 1100px; margin: 26px 0; font-size: clamp(64px, 7.1vw, 102px); line-height: .9; letter-spacing: -.065em; }
.home-hero h1 em { display: block; color: var(--cp-lime); font-style: normal; }
.home-lead { max-width: 640px; color: var(--cp-muted); font-size: clamp(17px, 1.6vw, 21px); line-height: 1.6; }
.home-hero .home-lead { max-width: 530px; color: var(--cp-paper); }
.home-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }
.home-actions .cp-cta--ghost { background: var(--cp-black); }
.home-hero-note { color: var(--cp-muted); font-size: 13px; margin-top: 24px; }
.home-section { padding-block: 88px; border-bottom: 1px solid var(--cp-line); }
.home-section h2 { max-width: 850px; margin: 20px 0 24px; font-size: clamp(36px, 4.4vw, 64px); line-height: 1.04; letter-spacing: -.045em; text-wrap: balance; }
.home-section-intro { max-width: 780px; }
.home-mono { color: var(--cp-lime); font: 11px/1.5 ui-monospace, monospace; letter-spacing: .08em; }
.home-card-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-top: 40px; }
.home-card { position: relative; display: flex; flex-direction: column; align-items: start; padding: 32px; border: 1px solid var(--cp-line); border-radius: 8px; background: var(--cp-panel); }
.home-card h3 { margin: 24px 0 12px; font-size: 27px; line-height: 1.15; letter-spacing: -.03em; }
.home-card p { color: var(--cp-muted); font-size: 16px; line-height: 1.65; margin: 0; }
.home-card .cp-cta { margin-top: 28px; }
.home-product { background: repeating-linear-gradient(90deg, transparent 0 119px, color-mix(in srgb, var(--cp-line) 20%, transparent) 120px 121px), var(--cp-panel); }
.home-audience-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.home-audience-grid h3 { margin: 0; min-height: 106px; font-size: clamp(30px, 3.2vw, 44px); line-height: 1.12; max-width: 480px; }
.home-audience-grid p { margin: 0; max-width: 440px; }
.home-audience-grid .home-mono { align-self: start; }
.home-audience-grid .cp-cta { align-self: end; margin: 0; justify-self: start; }
.home-audience-note { max-width: 760px; margin-top: 24px; color: var(--cp-muted); font-size: 14px; line-height: 1.6; }
.home-extensions { padding-block: 80px; }
.home-extensions h2 { font-size: clamp(36px, 4.4vw, 64px); }
.home-closing { position: relative; overflow: hidden; padding-block: 100px; background: var(--cp-lime); color: var(--cue-accent-ink); }
.home-closing h2 { position: relative; max-width: 980px; font-size: clamp(46px, 7vw, 100px); line-height: .92; letter-spacing: -.055em; margin: 28px 0; }
.home-closing p:not(.cp-kicker) { position: relative; max-width: 620px; color: inherit; font-size: 18px; line-height: 1.6; margin-bottom: 30px; }
.home-footer { display: grid; gap: 28px; padding-block: 44px; color: var(--cp-muted); font-size: 12px; }
.home-footer p { line-height: 1.6; }
.home-footer nav { display: flex; flex-wrap: wrap; gap: 12px 24px; }
.home-footer nav a, .home-footer nav button { display: inline-flex; align-items: center; min-height: 44px; }
.home-footer button { padding: 0; border: 0; background: none; color: inherit; font: inherit; cursor: pointer; }
.home-demo-review, .home-demo-followup { min-height: 210px; color: var(--cp-paper); font-size: 16px; line-height: 1.6; }
.home-demo-review ul { padding-left: 20px; }
.home-demo-review li { padding-block: 6px; }
.home-demo-followup p { padding: 18px; border: 1px solid var(--cp-line); border-left: 2px solid var(--cp-lime); border-radius: 6px; }
.ed-work { display: grid; grid-template-columns: .8fr 1.2fr; gap: 60px; align-items: start; margin-top: 54px; }
.ed-steps { display: grid; }
.ed-steps button { display: grid; grid-template-columns: 32px 1fr 10px; gap: 18px; padding: 24px 16px; border: 0; border-top: 1px solid var(--cp-line); border-left: 2px solid transparent; background: none; color: var(--cp-muted); text-align: left; cursor: pointer; }
.ed-steps button:last-child { border-bottom: 1px solid var(--cp-line); }
.ed-steps button.selected { border-left-color: var(--cp-lime); background: linear-gradient(90deg, color-mix(in srgb, var(--cp-lime) 9%, transparent), transparent); color: var(--cp-paper); }
.ed-index { font: 12px ui-monospace, monospace; padding-top: 5px; }
.selected .ed-index { color: var(--cp-lime); }
.ed-steps strong { display: block; font-size: 24px; font-weight: 700; letter-spacing: -.025em; }
.ed-steps small { display: block; margin-top: 10px; line-height: 1.6; font-size: 14px; }
.ed-steps .cp-arrow { margin-top: 10px; opacity: 0; }
.ed-steps .selected .cp-arrow { opacity: 1; color: var(--cp-lime); }
.ed-console { border: 1px solid var(--cp-line); border-top: 3px solid var(--cp-lime); border-radius: 8px; background: var(--cp-panel); box-shadow: 0 28px 70px var(--cue-shadow), 0 0 60px color-mix(in srgb, var(--cp-lime) 5%, transparent); overflow: hidden; }
.ed-console-bar { display: flex; gap: 10px; align-items: center; padding: 18px 24px; border-bottom: 1px solid var(--cp-line); font: 10px ui-monospace, monospace; letter-spacing: .09em; }
.ed-indicator { width: 7px; height: 7px; border-radius: 50%; background: var(--cp-lime); }
.ed-demo-tag { margin-left: auto; color: var(--cp-muted); }
.ed-console-body { padding: 26px; min-height: 395px; }
.ed-console-heading { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 15px; font-size: 12px; color: var(--cp-muted); }
.ed-status { color: var(--cp-lime); text-align: right; }
.ed-console h3 { margin: 24px 0; font-size: 28px; line-height: 1.2; letter-spacing: -.03em; }
.ed-request-data { display: flex; gap: 24px; align-items: flex-start; min-height: 210px; }
.ed-date { display: grid; place-items: center; width: 94px; min-height: 108px; background: var(--cp-lime); color: var(--cue-accent-ink); border-radius: 10px; padding: 12px; flex-shrink: 0; }
.ed-date b { font-size: 44px; letter-spacing: -.05em; }
.ed-date span { font: 12px ui-monospace, monospace; }
.ed-request-data dl { margin: 0; flex: 1; }
.ed-request-data dl div { display: flex; justify-content: space-between; gap: 15px; border-bottom: 1px solid var(--cp-line); padding: 13px 0; font-size: 12px; }
.ed-request-data dt { color: var(--cp-muted); }
.ed-request-data dd { margin: 0; text-align: right; }
.ed-next { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 16px 0 0; border: 0; border-top: 1px solid var(--cp-line); background: none; color: var(--cp-lime); cursor: pointer; font-size: 13px; min-height: 48px; }
.ed-console .ed-demo-foot { padding: 18px 26px; margin: 0; font-size: 12px; line-height: 1.5; background: var(--cp-black); color: var(--cp-muted); }
.ed-calendar { min-height: 210px; }
.ed-calendar .ed-mono { font-size: 10px; margin: 0 0 10px; }
.ed-days { display: grid; grid-template-columns: repeat(7,1fr); gap: 4px; }
.ed-days span { display: grid; place-items: center; min-height: 28px; font: 11px ui-monospace,monospace; color: var(--cp-muted); }
.ed-days .chosen { background: var(--cp-lime); color: var(--cue-accent-ink); border-radius: 5px; }
.ed-calendar .ed-available { color: var(--cp-lime); font-size: 11px; }
.ed-console, .ed-work > * { min-width: 0; }
.ed-demo-foot strong { color: var(--cp-paper); font-weight: 500; }
.ed-demo-foot p { margin: 6px 0 0; }
/* Editorial rhythm and the existing technical/neon visual language. */
.home-hero-layout { position: relative; display: grid; grid-template-columns: 1fr; }
.home-hero-route { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px; margin: 0; padding: 24px 0 28px; border-top: 1px solid color-mix(in srgb, var(--cp-lime) 45%, var(--cp-line)); list-style: none; }
.home-hero-route li { display: flex; align-items: center; gap: 14px; color: var(--cp-paper); font-size: 13px; }
.home-hero-route span { color: var(--cp-lime); font: 11px ui-monospace, monospace; }
.home-feature-symbol { width: 100%; margin: 26px 0 10px; }
.home-feature-symbol svg { width: 120px; height: 90px; fill: none; stroke: var(--cp-lime); stroke-width: 1.5; }
.home-feature-card:first-child { background: var(--cp-lime); border-color: var(--cp-lime); color: var(--cue-accent-ink); }
.home-feature-card:first-child :is(p, .home-mono) { color: inherit; }
.home-feature-card:first-child svg { stroke: currentColor; }
.home-feature-card h3 { max-width: 310px; }
.home-feature-card:nth-child(2) { margin-top: 36px; }
.home-feature-card:nth-child(3) { margin-top: 72px; }
.home-audience-grid .home-card { display: grid; grid-template-rows: 18px 106px 1fr 48px; gap: 24px; min-height: 370px; padding: 32px; border-top: 2px solid var(--cp-line); }
.home-audience-grid .home-card:first-child { border-top: 2px solid var(--cp-lime); background: radial-gradient(ellipse at 90% 0, color-mix(in srgb, var(--cp-lime) 12%, transparent), transparent 60%), var(--cp-panel); }
.home-audience-grid .home-card:last-child { border-top: 2px solid var(--cp-muted); }
.home-closing::before { content: ''; position: absolute; width: 520px; height: 520px; right: -200px; top: -130px; border: 1px solid currentColor; border-radius: 50%; box-shadow: 0 0 0 40px color-mix(in srgb, var(--cue-accent-ink) 6%, transparent), 0 0 0 80px color-mix(in srgb, var(--cue-accent-ink) 5%, transparent); opacity: .4; }
.home-closing .cp-kicker { position: relative; color: inherit; }
.home-closing .cp-cta { position: relative; background: var(--cue-accent-ink); color: var(--cp-lime) !important; border-color: var(--cue-accent-ink); }
html[data-theme='light'] .home-v2 .home-feature-card:first-child .home-mono,
html[data-theme='light'] .home-v2 .home-closing .cp-kicker { color: var(--cue-accent-ink); }
html[data-theme='light'] .home-hero-route span { color: color-mix(in srgb, var(--cp-lime) 85%, var(--cp-paper)); }
@media (max-width: 1100px) {
  .home-nav-links, .home-desktop-preferences, .home-login { display: none; }
  .home-menu-toggle { display: inline-flex; }
  .home-nav-actions { gap: 12px; }
  .home-hero h1 { font-size: clamp(60px, 7.4vw, 82px); }
  .home-hero-signature { bottom: 104px; max-width: 260px; font-size: 12px; }
  .ed-work { gap: 28px; }
}
@media (max-width: 800px) {
  .home-navigation { min-height: 72px; gap: 12px; }
  .home-brand :deep(.cue-brand) { width: 120px; }
  .home-nav-signup { min-height: 44px; padding: 10px 14px; font-size: 10px; letter-spacing: .02em; }
  .home-hero { min-height: 0; }
  .home-hero-signature { position: static; max-width: 360px; padding-bottom: 24px; font-size: 12px; text-align: left; }
  .home-hero-layout { grid-template-columns: 1fr; gap: 0; }
  .home-hero-route { gap: 10px; padding-block: 20px; }
  .home-hero-route li { flex-direction: column; align-items: start; gap: 8px; font-size: 11px; }
  .home-hero::before { background-position: 68% center; }
  .home-hero-overlay { background: linear-gradient(90deg, color-mix(in srgb, var(--cp-black) 94%, transparent), color-mix(in srgb, var(--cp-black) 65%, transparent)), linear-gradient(0deg, var(--cp-black), transparent); }
  .home-hero-content { padding-block: 120px 20px; }
  .home-hero h1 { font-size: clamp(36px, 9.7vw, 72px); margin-block: 22px; max-width: none; }
  .home-hero .cp-eyebrow { max-width: 290px; font-size: 10px; line-height: 1.6; letter-spacing: .08em; }
  .home-hero .cp-eyebrow::before { flex-shrink: 0; width: 16px; }
  .home-lead { font-size: 17px; }
  .home-actions { gap: 10px; }
  .home-actions .cp-cta { min-height: 48px; font-size: 11px; }
  .home-section { padding-block: 56px; }
  .home-section h2 { font-size: clamp(34px, 8.6vw, 52px); }
  .home-card-grid, .home-audience-grid { grid-template-columns: 1fr; margin-top: 28px; }
  .home-card { padding: 24px; }
  .home-feature-card:nth-child(n) { margin-top: 0; }
  .home-feature-symbol { margin-block: 18px 0; }
  .home-audience-grid .home-card { min-height: 390px; padding: 24px; grid-template-rows: 18px 90px 1fr 48px; gap: 20px; }
  .home-audience-grid h3 { min-height: 90px; font-size: 32px; }
  .ed-work { grid-template-columns: 1fr; margin-top: 28px; gap: 28px; }
  .ed-steps button { padding-block: 18px; gap: 12px; }
  .ed-steps strong { font-size: 22px; }
  .ed-steps small { margin-top: 6px; }
  .ed-console-body { padding: 20px; min-height: 390px; }
  .ed-request-data { gap: 14px; }
  .ed-request-data dl div { display: block; padding-block: 8px; }
  .ed-request-data dd { margin-top: 4px; text-align: left; }
  .ed-date { width: 78px; }
  .ed-console h3 { font-size: 24px; }
  .home-closing { padding-block: 64px; }

}
@media (max-width: 365px) {
  .home-v2 .cp-wrap { width: calc(100% - 32px); }
  .home-brand :deep(.cue-brand) { width: 100px; }
  .home-nav-actions { gap: 6px; }
  .home-nav-signup { padding-inline: 10px; font-size: 9px; }
  .home-hero { min-height: 0; }
  .home-hero h1 { font-size: 33px; }
  .home-actions { display: grid; justify-items: start; }
  .home-actions .cp-cta { min-height: 44px; }
  .ed-console-heading { font-size: 11px; }
}
@media (prefers-reduced-motion: reduce) {
  .home-v2 .cp-cta { transition: none; }
  .home-v2 .cp-cta:hover { transform: none; }
}
</style>
