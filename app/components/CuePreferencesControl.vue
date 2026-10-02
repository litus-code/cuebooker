<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean; labels?: boolean }>(), { compact: false, labels: false })

const { locale, theme, setLocale, setTheme } = useCuePreferences()
const appearanceLabel = computed(() => locale.value === 'es'
  ? (theme.value === 'dark' ? 'Activar apariencia clara' : 'Activar apariencia oscura')
  : (theme.value === 'dark' ? 'Switch to light appearance' : 'Switch to dark appearance'))
const languageLabel = computed(() => locale.value === 'es' ? 'Idioma' : 'Language')
const themeLabel = computed(() => locale.value === 'es'
  ? (theme.value === 'dark' ? 'Oscura' : 'Clara')
  : (theme.value === 'dark' ? 'Dark' : 'Light'))
</script>

<template>
  <div class="cue-preferences-control" :class="{ 'cue-preferences-control--compact': compact, 'cue-preferences-control--labels': labels }">
    <div class="cue-preferences-group">
      <span v-if="labels" class="cue-preferences-label">{{ languageLabel }}</span>
      <div class="cue-segmented" :aria-label="languageLabel">
      <button :class="{ active: locale === 'es' }" type="button" :aria-pressed="locale === 'es'" aria-label="Español" @click="setLocale('es')">ES</button>
        <button :class="{ active: locale === 'en' }" type="button" :aria-pressed="locale === 'en'" aria-label="English" @click="setLocale('en')">EN</button>
      </div>
    </div>
    <div class="cue-preferences-group">
      <span v-if="labels" class="cue-preferences-label">{{ locale === 'es' ? 'Apariencia' : 'Appearance' }}</span>
      <div class="cue-theme-choice">
        <span v-if="labels" class="cue-theme-current">{{ themeLabel }}</span>
        <button class="cue-theme-toggle" type="button" :aria-label="appearanceLabel" :title="appearanceLabel" @click="setTheme(theme === 'dark' ? 'light' : 'dark')">
          <span :class="{ light: theme === 'light' }" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cue-preferences-control { display:flex; align-items:center; gap:7px; }
.cue-preferences-group{display:grid;gap:6px}
.cue-preferences-label{font:800 10px/1.3 monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--cue-accent)}
.cue-theme-choice{display:flex;align-items:center;gap:10px}
.cue-theme-current{min-width:40px;color:var(--cue-text);font-size:12px;font-weight:700}
.cue-preferences-control--labels{gap:20px}
.cue-preferences-control--labels .cue-preferences-group{align-items:flex-start}
.cue-segmented { display:flex; gap:2px; padding:3px; border:1px solid var(--cue-border); border-radius:999px; background:var(--cue-surface); }
.cue-segmented button { min-width:38px; min-height:36px; padding:0 9px; border:0; border-radius:999px; background:transparent; color:var(--cue-muted); cursor:pointer; font-size:9px; font-weight:900; }
.cue-segmented button.active { background:var(--cue-toggle); color:var(--cue-toggle-ink); box-shadow:0 0 18px color-mix(in srgb,var(--cue-toggle) 28%,transparent); }
.cue-theme-toggle { width:44px; height:44px; padding:9px; border:1px solid var(--cue-border); border-radius:50%; background:var(--cue-surface); color:var(--cue-muted); cursor:pointer; }
.cue-theme-toggle span { position:relative; display:block; width:100%; height:100%; border:1px solid currentColor; border-radius:50%; }
.cue-theme-toggle span::after { position:absolute; top:-18%; left:42%; width:100%; height:100%; border-radius:50%; background:var(--cue-surface); content:''; }
.cue-theme-toggle span.light { border-color:var(--cue-toggle); background:var(--cue-toggle); box-shadow:0 0 14px color-mix(in srgb,var(--cue-toggle) 35%,transparent); }
.cue-theme-toggle span.light::after { display:none; }
.cue-theme-toggle:hover { border-color:var(--cue-toggle); color:var(--cue-toggle); }
.cue-preferences-control--compact .cue-segmented button { min-width:38px; min-height:36px; }
.cue-preferences-control--compact .cue-theme-toggle { width:44px; height:44px; }
</style>
