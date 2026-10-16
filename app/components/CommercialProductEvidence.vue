<script setup lang="ts">
import type es from '../../content/es/landings.json'
const props = defineProps<{ copy: typeof es; locale: 'es' | 'en'; agency?: boolean; labelledby?: string }>()
const { theme } = useCuePreferences()
const selected = ref(props.agency ? 2 : 0)
const views = ['conversation', 'calendar', 'roster']
const baseURL = useRuntimeConfig().app.baseURL
function navigate(event: KeyboardEvent, index: number) {
  const order = props.agency ? [2,0,1] : [0,1]
  const position = order.indexOf(index)
  let next = position
  if (event.key === 'ArrowRight') next = (position + 1) % order.length
  else if (event.key === 'ArrowLeft') next = (position + order.length - 1) % order.length
  else return
  const controls = (event.currentTarget as HTMLElement).parentElement
  event.preventDefault()
  selected.value = order[next]!
  nextTick(() => controls?.querySelectorAll<HTMLButtonElement>('button')[next]?.focus())
}
</script>
<template>
  <section class="cl-product-evidence cl-shell cl-section" :aria-labelledby="labelledby || 'product-evidence-title'" :class="{ 'cl-product-evidence--continuation': labelledby }">
    <div v-if="!labelledby" class="cl-section-head"><p class="cl-eyebrow">{{ copy.product.label }}</p><h2 id="product-evidence-title">{{ agency ? copy.product.agencyTitle : copy.product.title }}</h2><p class="cl-lead">{{ copy.product.intro }}</p></div>
    <div class="cl-evidence-controls" :aria-label="copy.product.label"><button v-for="i in (agency ? [2,0,1] : [0,1])" :key="i" type="button" :aria-pressed="selected === i" @click="selected = i" @keydown="navigate($event,i)">{{ copy.product.views[i] }}</button></div>
    <p class="cl-evidence-description" aria-live="polite">{{ copy.product.descriptions[selected] }}</p>
    <figure class="cl-evidence-frame"><a :href="`${baseURL}images/product/${views[selected]}-${theme}-${locale}.webp`" target="_blank" rel="noopener" :aria-label="`${copy.product.openImage}: ${copy.product.imageAlts[selected]}`"><img :src="`${baseURL}images/product/${views[selected]}-${theme}-${locale}.webp`" :alt="copy.product.imageAlts[selected]" width="1440" height="1050" loading="lazy"></a><figcaption>{{ copy.product.caption }} {{ copy.product.openImage }}.</figcaption></figure>
  </section>
</template>
