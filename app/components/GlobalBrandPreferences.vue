<script setup lang="ts">
const route = useRoute()
const normalizedPath = computed(() => route.path.replace(/\/+$/, '') || '/')
const showGlobalHeader = computed(() => ['/access', '/onboarding'].includes(normalizedPath.value))
</script>

<template>
  <header v-if="showGlobalHeader" class="global-brand-preferences">
    <NuxtLink class="global-brand-preferences__brand" to="/" aria-label="Cuebooker">
      <CueBrand />
    </NuxtLink>
    <CuePreferencesControl compact />
  </header>
</template>

<style>
.access-brand,.onboarding-brand { display:none !important; }
.global-brand-preferences { align-items:center; display:flex; justify-content:space-between; min-height:66px; padding:10px 24px; position:relative; z-index:40; border-bottom:1px solid var(--cue-line,#303030); }
.global-brand-preferences__brand { align-items:center; display:inline-flex; text-decoration:none; }
.global-brand-preferences__brand { width:190px; }
.workspace-header .brand { display:inline-flex !important; align-items:center; width:190px; min-height:44px; }
.workspace .history-view button,.workspace .history-view a { text-decoration:none !important; text-underline-offset:0 !important; }
.workspace .history-view button:hover,.workspace .history-view a:hover { color:var(--cue-accent,#E8FF2F); }

@media (max-width:720px) {
  .global-brand-preferences { min-height:60px; padding:8px 14px; }
  .global-brand-preferences__brand { width:145px; }
  .workspace-header .brand { width:145px; min-height:38px; }
}
</style>
