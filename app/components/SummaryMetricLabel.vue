<script setup lang="ts">
const props = defineProps<{ label: string }>()
const parts = computed(() => props.label.match(/^(\S+)([\s\S]*)$/) || ['', '', props.label])
</script>

<template>
  <span class="summary-metric-label"><em>{{ parts[1] }}</em>{{ parts[2] }}</span>
</template>

<style scoped>
.summary-metric-label em { color:var(--cue-accent); font-style:normal; }
</style>
