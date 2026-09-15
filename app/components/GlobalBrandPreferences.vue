<script setup lang="ts">
const route = useRoute()
const isHome = computed(() => route.path === '/')
const isWorkspace = computed(() => route.path === '/workspace' || route.path === '/app')
</script>

<template>
  <header v-if="!isHome && !isWorkspace" class="global-brand-preferences">
    <NuxtLink class="global-brand-preferences__brand" to="/" aria-label="Cuebooker">
      <img src="/cuebooker-icon.png" alt="" />
      <span>cuebooker</span>
    </NuxtLink>
    <CuePreferencesControl compact />
  </header>
</template>

<style>
.access-brand,.onboarding-brand { display:none !important; }
.global-brand-preferences { align-items:center; display:flex; justify-content:space-between; min-height:66px; padding:10px 24px; position:relative; z-index:40; border-bottom:1px solid var(--cue-line,#303030); }
.global-brand-preferences__brand { align-items:center; color:var(--cue-text,#f2f0eb); display:inline-flex; font-size:15px; font-weight:900; gap:9px; letter-spacing:.01em; text-decoration:none; text-transform:lowercase; }
.global-brand-preferences__brand img { display:block; height:42px; width:42px; object-fit:contain; }
.workspace-header .brand { display:inline-flex !important; align-items:center; gap:8px; width:max-content; min-height:44px; font-size:0 !important; letter-spacing:0 !important; }
.workspace-header .brand::before { content:''; display:block; width:42px; height:42px; background:url('/cuebooker-icon.png') center/contain no-repeat; }
.workspace-header .brand::after { content:'cuebooker'; color:var(--cue-text,#f2f0eb); font:900 15px/1 Arial,Helvetica,sans-serif; letter-spacing:.01em; text-transform:lowercase; }
.workspace-header .brand span { display:none !important; }
.workspace .history-view button,.workspace .history-view a { text-decoration:none !important; text-underline-offset:0 !important; }
.workspace .history-view button:hover,.workspace .history-view a:hover { color:var(--cue-accent,#E8FF2F); }
@media (max-width:720px) { .global-brand-preferences { min-height:60px; padding:8px 14px; } .global-brand-preferences__brand { font-size:13px; } .global-brand-preferences__brand img { height:36px; width:36px; } .workspace-header .brand::before { width:34px; height:34px; } .workspace-header .brand::after { font-size:13px; } }
</style>
