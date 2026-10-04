<script setup lang="ts">
defineProps<{ complete: boolean; index: string }>()
</script>

<template>
  <span class="setup-step-marker" aria-hidden="true">
    <svg v-if="complete" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" /><path d="m7 12 3 3 7-7" /></svg>
    <template v-else>{{ index }}</template>
  </span>
</template>

<style scoped>
.setup-step-marker{display:inline-flex;align-items:center;justify-content:center;width:28px;min-height:28px;color:var(--cue-muted);font:800 16px/1.3 monospace}
.setup-step-marker svg{display:block;width:24px;height:24px;color:var(--cue-accent);stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
</style>
