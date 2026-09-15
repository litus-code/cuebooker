<script setup lang="ts">
const route = useRoute()
const isHome = computed(() => route.path === '/')
const isWorkspace = computed(() => route.path === '/workspace' || route.path === '/app')
</script>

<template>
  <header v-if="!isHome && !isWorkspace" class="global-brand-preferences">
    <NuxtLink class="global-brand-preferences__brand" to="/" aria-label="Cuebooker">
      <img src="/cuebooker-header.png" alt="Cuebooker" />
    </NuxtLink>
    <CuePreferencesControl compact />
  </header>
</template>

<style>
.access-brand,.onboarding-brand { display:none !important; }
.global-brand-preferences { align-items:center; display:flex; justify-content:space-between; min-height:66px; padding:10px 24px; position:relative; z-index:40; border-bottom:1px solid var(--cue-line,#303030); }
.global-brand-preferences__brand { align-items:center; display:inline-flex; text-decoration:none; }
.global-brand-preferences__brand img { display:block; height:42px; width:auto; max-width:220px; object-fit:contain; }
.workspace-header .brand { display:inline-flex !important; align-items:center; width:190px; min-height:44px; font-size:0 !important; letter-spacing:0 !important; background:url('/cuebooker-header.png') left center/contain no-repeat; }
.workspace-header .brand::before,.workspace-header .brand::after,.workspace-header .brand span { display:none !important; }
.workspace .history-view button,.workspace .history-view a { text-decoration:none !important; text-underline-offset:0 !important; }
.workspace .history-view button:hover,.workspace .history-view a:hover { color:var(--cue-accent,#E8FF2F); }
@media (max-width:720px) { .global-brand-preferences { min-height:60px; padding:8px 14px; } .global-brand-preferences__brand img { height:34px; max-width:175px; } .workspace-header .brand { width:158px; min-height:38px; } }
</style>
