<script setup lang="ts">
import type { CueEntitlement } from '../domain/entitlements'
import { cuePlanBadge } from '../domain/entitlements'

const props = defineProps<{
  entitlement: CueEntitlement
}>()

const label = computed(() => cuePlanBadge(props.entitlement))
</script>

<template>
  <small v-if="label" class="cue-plan-badge" :class="`cue-plan-badge--${label.toLowerCase()}`">{{ label }}</small>
</template>

<style scoped>
.cue-plan-badge{
  display:inline-flex;
  align-items:center;
  min-height:18px;
  padding:0 6px;
  border:1px solid color-mix(in srgb,var(--cue-accent) 48%,var(--cue-border));
  border-radius:6px;
  color:var(--cue-accent);
  font:800 7px/1 monospace;
  letter-spacing:.08em;
  vertical-align:middle;
}
.cue-plan-badge--agency{
  border-color:color-mix(in srgb,var(--cue-text) 35%,var(--cue-border));
  color:var(--cue-text);
}
</style>
