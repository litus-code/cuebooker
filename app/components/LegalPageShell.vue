<script setup lang="ts">
const { locale } = useCuePreferences()
const analytics = useAnalytics()

const copy = computed(() => locale.value === 'es'
  ? {
      back: 'Volver a Cuebooker',
      privacy: 'Privacidad',
      cookies: 'Cookies',
      legal: 'Aviso legal',
      settings: 'Configurar cookies',
      contact: 'Contacto'
    }
  : {
      back: 'Back to Cuebooker',
      privacy: 'Privacy',
      cookies: 'Cookies',
      legal: 'Legal notice',
      settings: 'Cookie settings',
      contact: 'Contact'
    })
</script>

<template>
  <main class="legal-page">
    <header class="legal-page__header">
      <NuxtLink class="legal-page__brand" to="/" aria-label="Cuebooker"><CueBrand /></NuxtLink>
      <NuxtLink class="legal-page__back" to="/">{{ copy.back }}</NuxtLink>
    </header>

    <article class="legal-page__document">
      <slot />
    </article>

    <footer class="legal-page__footer">
      <a href="mailto:contacto@cuebooker.com">{{ copy.contact }}: contacto@cuebooker.com</a>
      <NuxtLink to="/privacidad">{{ copy.privacy }}</NuxtLink>
      <NuxtLink to="/cookies">{{ copy.cookies }}</NuxtLink>
      <NuxtLink to="/aviso-legal">{{ copy.legal }}</NuxtLink>
      <button type="button" @click="analytics.openPreferences">{{ copy.settings }}</button>
    </footer>
  </main>
</template>

<style scoped>
.legal-page {
  min-height: 100svh;
  background:
    radial-gradient(circle at 88% 8%, color-mix(in srgb, var(--cue-accent) 8%, transparent), transparent 30%),
    var(--cue-bg);
  color: var(--cue-text);
}
.legal-page__header {
  position: sticky;
  z-index: 20;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 82px;
  padding: 14px max(24px, 5vw);
  border-bottom: 1px solid var(--cue-border);
  background: color-mix(in srgb, var(--cue-bg) 92%, transparent);
  backdrop-filter: blur(18px);
}
.legal-page__brand {
  display: block;
  width: clamp(150px, 18vw, 220px);
}
.legal-page__back {
  color: var(--cue-muted);
  font-size: 13px;
  text-decoration: none;
}
.legal-page__document {
  width: min(900px, calc(100% - 48px));
  margin: 0 auto;
  padding: 80px 0 100px;
}
.legal-page__document :deep(.legal-kicker) {
  margin: 0 0 18px;
  color: var(--cue-accent);
  font: 700 12px/1.2 ui-monospace, monospace;
  letter-spacing: .13em;
}
.legal-page__document :deep(h1) {
  max-width: 800px;
  margin: 0 0 28px;
  font-size: clamp(44px, 7vw, 82px);
  line-height: .95;
  letter-spacing: -.055em;
}
.legal-page__document :deep(.legal-lead) {
  max-width: 760px;
  margin: 0 0 54px;
  color: var(--cue-muted);
  font-size: clamp(18px, 2.2vw, 24px);
  line-height: 1.5;
}
.legal-page__document :deep(section) {
  padding: 30px 0;
  border-top: 1px solid var(--cue-border);
}
.legal-page__document :deep(h2) {
  margin: 0 0 15px;
  font-size: clamp(23px, 3vw, 32px);
}
.legal-page__document :deep(p),
.legal-page__document :deep(li) {
  color: var(--cue-muted);
  font-size: 15px;
  line-height: 1.75;
}
.legal-page__document :deep(a) {
  color: var(--cue-accent);
}
.legal-page__document :deep(ul) {
  margin: 12px 0 0;
  padding-left: 20px;
}
.legal-page__document :deep(.legal-meta) {
  margin-top: 42px;
  color: var(--cue-muted);
  font: 12px/1.5 ui-monospace, monospace;
}
.legal-page__document :deep(table) {
  width: 100%;
  border-collapse: collapse;
  color: var(--cue-muted);
  font-size: 14px;
}
.legal-page__document :deep(th),
.legal-page__document :deep(td) {
  padding: 14px 12px;
  border: 1px solid var(--cue-border);
  text-align: left;
  vertical-align: top;
}
.legal-page__document :deep(th) {
  color: var(--cue-text);
}
.legal-page__footer {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 24px;
  padding: 28px max(24px, 5vw);
  border-top: 1px solid var(--cue-border);
  color: var(--cue-muted);
  font-size: 12px;
}
.legal-page__footer a,
.legal-page__footer button {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-decoration: none;
  cursor: pointer;
}
.legal-page__footer a:hover,
.legal-page__footer button:hover {
  color: var(--cue-accent);
}
@media (max-width: 600px) {
  .legal-page__header { min-height: 70px; }
  .legal-page__brand { width: 132px; }
  .legal-page__document {
    width: min(100% - 34px, 900px);
    padding: 54px 0 72px;
  }
  .legal-page__document :deep(h1) {
    font-size: clamp(40px, 13vw, 58px);
  }
  .legal-page__document :deep(table) {
    display: block;
    overflow-x: auto;
  }
  .legal-page__footer {
    flex-direction: column;
  }
}
</style>
