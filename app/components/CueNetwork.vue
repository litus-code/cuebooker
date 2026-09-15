<script setup lang="ts">
defineProps<{ state: 'idle' | 'searching' | 'found', label: string }>()
const nodes = [
  { label: 'BCN', type: 'city', x: 12, y: 27 },
  { label: 'NARA VOSS', type: 'artist', x: 36, y: 39 },
  { label: '24.10', type: 'date', x: 74, y: 20 },
  { label: 'MILA RHO', type: 'artist', x: 68, y: 63 },
  { label: 'BERLIN', type: 'city', x: 91, y: 79 },
  { label: 'MADRID', type: 'city', x: 20, y: 82 }
]
</script>

<template>
  <div class="network" :class="`network--${state}`" aria-live="polite">
    <div class="network__grid" />
    <svg class="network__lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M12 27 L36 39 L20 82 M36 39 L74 20 L68 63 L91 79 M20 82 L68 63" /></svg>
    <span v-for="node in nodes" :key="node.label" class="network__node" :class="`network__node--${node.type}`" :style="{ left: `${node.x}%`, top: `${node.y}%` }"><i />{{ node.label }}</span>
    <div class="network__core"><CueBrand variant="icon" decorative /></div>
    <p class="network__label"><i />{{ label }}</p>
  </div>
</template>
