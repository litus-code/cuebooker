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
    return theme.value === 'light'
      ? '/cuebooker-icon-light-v2.png'
      : '/cuebooker-icon-dark-v2.png'
  }

  return theme.value === 'light'
    ? '/cuebooker-header-light-v2.png'
    : '/cuebooker-header-dark-v2.png'
})
</script>

<template>
  <span class="cue-brand" :class="`cue-brand--${variant}`" :aria-hidden="decorative || undefined">
    <img :key="src" :src="src" :alt="alt" width="384" height="128">
  </span>
</template>

<style>
.cue-brand {
  display: inline-flex;
  line-height: 0;
  overflow: visible;
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
  height: 64px;
  width: 192px;
}

.cue-brand--icon {
  height: 58px;
  width: 58px;
}

.cue-brand--icon img {
  height: 58px;
  width: 58px;
}

@media (max-width: 720px) {
  .cue-brand--wordmark {
    height: 48px;
    width: 144px;
  }

  .cue-brand--icon,
  .cue-brand--icon img {
    height: 48px;
    width: 48px;
  }
}
</style>
