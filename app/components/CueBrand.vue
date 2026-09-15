<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'wordmark' | 'icon'
  decorative?: boolean
}>(), {
  variant: 'wordmark',
  decorative: false
})

const { theme } = useCuePreferences()

const src = computed(() => {
  const suffix = props.variant === 'icon' ? 'icon' : 'header'
  return `/cuebooker-${suffix}-${theme.value}.png`
})

const alt = computed(() => props.decorative ? '' : 'Cuebooker')
</script>

<template>
  <span class="cue-brand" :class="`cue-brand--${variant}`" :aria-hidden="decorative || undefined">
    <img :src="src" :alt="alt">
  </span>
</template>

<style>
.cue-brand {
  display: inline-flex;
  line-height: 0;
}

.cue-brand img {
  display: block;
  height: auto;
  object-fit: contain;
  width: 100%;
}

.cue-brand--wordmark {
  aspect-ratio: 3 / 1;
  width: 100%;
}

.cue-brand--icon {
  aspect-ratio: 1;
  width: 100%;
}
</style>
