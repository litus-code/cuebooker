<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'wordmark' | 'icon'
  decorative?: boolean
}>(), {
  variant: 'wordmark',
  decorative: false
})

const { theme } = useCuePreferences()
const alt = computed(() => props.decorative ? '' : 'Cuebooker')

const src = computed(() => {
  if (props.variant === 'icon') {
    return theme.value === 'light' ? '/logo-light.png' : '/logo-dark.png'
  }

  return theme.value === 'light' ? '/logo-full-light.png' : '/logo-full-dark.png'
})
</script>

<template>
  <span class="cue-brand" :class="`cue-brand--${variant}`" :aria-hidden="decorative || undefined">
    <img
      :key="src"
      :src="src"
      :alt="alt"
      :width="variant === 'icon' ? 64 : 192"
      height="64"
      decoding="async"
    >
  </span>
</template>

<style>
.cue-brand {
  display: inline-flex;
  line-height: 0;
}

.cue-brand img {
  display: block;
  height: 100%;
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
  width: 100%;
}

.cue-brand--wordmark {
  aspect-ratio: 3 / 1;
  height: 64px;
  width: 192px;
}

.cue-brand--icon {
  aspect-ratio: 1;
  height: 58px;
  width: 58px;
}

@media (max-width: 720px) {
  .cue-brand--wordmark {
    height: 48px;
    width: 144px;
  }

  .cue-brand--icon {
    height: 48px;
    width: 48px;
  }
}
</style>