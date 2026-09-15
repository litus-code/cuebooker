<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'wordmark' | 'icon'
  decorative?: boolean
}>(), {
  variant: 'wordmark',
  decorative: false
})

const darkSrc = computed(() => props.variant === 'icon' ? '/cuebooker-icon.png' : '/cuebooker-header-dark-approved.png')
const lightSrc = computed(() => props.variant === 'icon' ? '/cuebooker-icon-light-approved.png' : '/cuebooker-header-light-approved.png')
const alt = computed(() => props.decorative ? '' : 'Cuebooker')
</script>

<template>
  <span class="cue-brand" :class="`cue-brand--${variant}`" :aria-hidden="decorative || undefined">
    <img class="cue-brand__dark" :src="darkSrc" :alt="alt">
    <img class="cue-brand__light" :src="lightSrc" :alt="alt">
  </span>
</template>

<style>
.cue-brand { display: inline-flex; line-height: 0; overflow: visible; }
.cue-brand img { display: block; height: auto; max-height: 100%; object-fit: contain; width: 100%; }
.cue-brand__light { display: none !important; }
:root[data-theme='light'] .cue-brand__dark { display: none !important; }
:root[data-theme='light'] .cue-brand__light { display: block !important; }
.cue-brand--wordmark { aspect-ratio: 430 / 148; width: 100%; }
.cue-brand--icon { aspect-ratio: 1; width: 100%; }

/* The dark PNG has a little more internal breathing room than the light one.
   Compensate only at render time so both themes keep the same visual presence. */
.cue-brand--wordmark .cue-brand__dark {
  transform: scale(1.055);
  transform-origin: left center;
}

.cue-brand--icon .cue-brand__dark {
  transform: scale(1.025);
  transform-origin: center;
}
</style>
