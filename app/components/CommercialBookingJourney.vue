<script setup lang="ts">
import type es from '../../content/es/landings.json'
defineProps<{ copy: typeof es; title?: string }>()
const selected = ref(0)
</script>
<template><section class="cl-journey"><div class="cl-shell cl-section"><p class="cl-eyebrow">BOOKING / WORKFLOW</p><h2>{{ title || copy.journeyTitle }}</h2><p class="cl-lead">{{ copy.journeyBody }}</p><div class="cl-step-list"><button v-for="(step, i) in copy.steps" :key="step" :aria-pressed="selected === i" @click="selected = i"><span class="cl-index">0{{ i + 1 }}</span>{{ step }}</button></div><div class="cl-step-detail" aria-live="polite"><span class="cl-outline-number" aria-hidden="true">0{{ selected + 1 }}</span><div><h3>{{ copy.steps[selected] }}</h3><p>{{ copy.stepBodies[selected] }}</p><p class="cl-note">{{ copy.example }}</p></div></div></div></section></template>
