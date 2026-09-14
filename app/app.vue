<script setup lang="ts">
const route = useRoute()
const showHomeAccountActions = computed(() => route.path === '/')
</script>

<template>
  <NuxtPage />
  <AnalyticsConsentBanner />

  <nav v-if="showHomeAccountActions" class="home-account-actions" aria-label="Acceso a cuenta">
    <NuxtLink to="/access">Iniciar sesión</NuxtLink>
    <NuxtLink class="home-account-actions__primary" to="/access?mode=signup">Crear cuenta</NuxtLink>
  </nav>
</template>

<style>
.home-account-actions {
  align-items: center;
  display: flex;
  gap: 10px;
  position: fixed;
  right: max(235px, 17vw);
  top: 16px;
  z-index: 60;
}
.home-account-actions a {
  color: var(--cue-muted);
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .08em;
  padding: 10px 12px;
  text-decoration: none;
  text-transform: uppercase;
}
.home-account-actions a:hover { color: var(--cue-text); }
.home-account-actions__primary {
  background: var(--cue-accent);
  color: var(--cue-accent-ink) !important;
}
.hero {
  padding-top: clamp(34px, 4.2vw, 62px) !important;
}
.hero h1 {
  margin-top: 24px !important;
}
@media (max-width: 1020px) {
  .home-account-actions {
    bottom: 18px;
    left: 18px;
    right: auto;
    top: auto;
  }
  .home-account-actions a {
    background: var(--cue-raised);
    border: 1px solid var(--cue-border);
  }
  .home-account-actions__primary {
    background: var(--cue-accent) !important;
    border-color: var(--cue-accent) !important;
  }
}
@media (max-width: 720px) {
  .hero { padding-top: 42px !important; }
  .home-account-actions { bottom: 10px; left: 10px; }
  .home-account-actions a { font-size: 8px; padding: 9px 10px; }
}
</style>
