<script setup lang="ts">
defineProps<{ compact?: boolean }>()

const { locale, theme, setLocale, setTheme } = useCuePreferences()
const appearanceLabel = computed(() => locale.value === 'es' ? 'Cambiar apariencia' : 'Change appearance')
</script>

<template>
  <div class="cue-preferences-control" :class="{ 'cue-preferences-control--compact': compact }">
    <div class="cue-segmented" :aria-label="locale === 'es' ? 'Idioma' : 'Language'">
      <button :class="{ active: locale === 'es' }" type="button" @click="setLocale('es')">ES</button>
      <button :class="{ active: locale === 'en' }" type="button" @click="setLocale('en')">EN</button>
    </div>
    <button class="cue-theme-toggle" type="button" :aria-label="appearanceLabel" :title="appearanceLabel" @click="setTheme(theme === 'dark' ? 'light' : 'dark')">
      <span :class="{ light: theme === 'light' }" />
    </button>
  </div>
</template>

<style scoped>
.cue-preferences-control { display:flex; align-items:center; gap:7px; }
.cue-segmented { display:flex; gap:2px; padding:3px; border:1px solid var(--cue-border); border-radius:999px; background:var(--cue-surface); }
.cue-segmented button { min-width:34px; min-height:32px; padding:0 9px; border:0; border-radius:999px; background:transparent; color:var(--cue-muted); cursor:pointer; font-size:9px; font-weight:900; }
.cue-segmented button.active { background:var(--cue-toggle); color:var(--cue-toggle-ink); box-shadow:0 0 18px color-mix(in srgb,var(--cue-toggle) 28%,transparent); }
.cue-theme-toggle { width:40px; height:40px; padding:9px; border:1px solid var(--cue-border); border-radius:50%; background:var(--cue-surface); color:var(--cue-muted); cursor:pointer; }
.cue-theme-toggle span { position:relative; display:block; width:100%; height:100%; border:1px solid currentColor; border-radius:50%; }
.cue-theme-toggle span::after { position:absolute; top:-18%; left:42%; width:100%; height:100%; border-radius:50%; background:var(--cue-surface); content:''; }
.cue-theme-toggle span.light { border-color:var(--cue-toggle); background:var(--cue-toggle); box-shadow:0 0 14px color-mix(in srgb,var(--cue-toggle) 35%,transparent); }
.cue-theme-toggle span.light::after { display:none; }
.cue-theme-toggle:hover { border-color:var(--cue-toggle); color:var(--cue-toggle); }
.cue-preferences-control--compact .cue-segmented button { min-width:31px; min-height:30px; }
.cue-preferences-control--compact .cue-theme-toggle { width:36px; height:36px; }
</style>
