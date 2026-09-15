<script setup lang="ts">
const route = useRoute()
const { locale, theme, setLocale, setTheme } = useCuePreferences()
const isHome = computed(() => route.path === '/')
const isWorkspace = computed(() => route.path === '/workspace' || route.path === '/app')

function handleWorkspaceNavigation(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const button = target?.closest('.workspace-header nav button, .workspace .panel-heading button, .workspace .next-panel button')
  if (!button) return
  window.setTimeout(() => {
    const view = document.querySelector('.workspace .view')
    if (view) view.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 0)
}

onMounted(() => document.addEventListener('click', handleWorkspaceNavigation))
onBeforeUnmount(() => document.removeEventListener('click', handleWorkspaceNavigation))
</script>

<template>
  <header v-if="!isHome && !isWorkspace" class="global-brand-preferences">
    <NuxtLink class="global-brand-preferences__brand" to="/" aria-label="Cuebooker"><img src="/cuebooker-mark.svg" alt="" /><span>uebooker</span></NuxtLink>
    <div class="global-brand-preferences__controls" aria-label="Preferencias">
      <div class="global-brand-preferences__locale" aria-label="Idioma"><button type="button" :class="{ active: locale === 'es' }" @click="setLocale('es')">ES</button><button type="button" :class="{ active: locale === 'en' }" @click="setLocale('en')">EN</button></div>
      <button class="global-brand-preferences__theme" type="button" :aria-label="theme === 'dark' ? 'Usar tema claro' : 'Usar tema oscuro'" @click="setTheme(theme === 'dark' ? 'light' : 'dark')"><span aria-hidden="true">{{ theme === 'dark' ? '☼' : '◐' }}</span></button>
    </div>
  </header>
</template>

<style>
.access-brand, .onboarding-brand { display:none !important; }
.global-brand-preferences { align-items:center; display:flex; justify-content:space-between; min-height:66px; padding:10px 24px; position:relative; z-index:40; border-bottom:1px solid var(--cue-line,#303030); }
.global-brand-preferences__brand { align-items:center; color:var(--cue-text,#f2f0eb); display:inline-flex; font-size:15px; font-weight:900; gap:3px; letter-spacing:.01em; text-decoration:none; }
.global-brand-preferences__brand img { display:block; height:42px; width:42px; object-fit:contain; }
.global-brand-preferences__controls { align-items:center; display:flex; gap:8px; }
.global-brand-preferences__locale { align-items:center; border:1px solid var(--cue-line,#303030); display:flex; min-height:34px; padding:3px; }
.global-brand-preferences__locale button, .global-brand-preferences__theme { border:0; background:transparent; color:var(--cue-muted,#aaa); cursor:pointer; font:800 10px/1 monospace; min-height:28px; min-width:30px; }
.global-brand-preferences__locale button.active { background:#E8FF2F; color:#070707; }
.global-brand-preferences__theme { border:1px solid var(--cue-line,#303030); font-size:17px; }

.workspace-header .brand { display:inline-flex !important; align-items:center; gap:3px; width:max-content; min-height:44px; font-size:0 !important; letter-spacing:0 !important; }
.workspace-header .brand::before { content:''; display:block; width:42px; height:42px; background:url('/cuebooker-mark.svg') center/contain no-repeat; }
.workspace-header .brand::after { content:'uebooker'; color:var(--cue-text,#f2f0eb); font:900 15px/1 Arial,Helvetica,sans-serif; letter-spacing:.01em; text-transform:none; }
.workspace-header .brand span { display:none !important; }
.workspace .history-view button, .workspace .history-view a { text-decoration:none !important; text-underline-offset:0 !important; }
.workspace .history-view button:hover, .workspace .history-view a:hover { color:var(--cue-accent,#E8FF2F); }

@media (max-width:720px) {
  .global-brand-preferences { min-height:60px; padding:8px 14px; }
  .global-brand-preferences__brand { font-size:13px; }
  .global-brand-preferences__brand img { height:36px; width:36px; }
  .workspace-header .brand::before { width:34px; height:34px; }
  .workspace-header .brand::after { font-size:13px; }
}
</style>
