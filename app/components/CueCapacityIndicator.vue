<script setup lang="ts">
import type { CueEntitlement, CuePlanLimits } from '../domain/entitlements'

const props = defineProps<{
  used: number
  limitKey: keyof CuePlanLimits
  upgradeEntitlement: CueEntitlement
  label: string
}>()

const entitlements = useCueEntitlements()
const state = computed(() => entitlements.capacity(props.limitKey, props.used))
const unlimited = computed(() => state.value.limit === null)
</script>

<template>
  <div class="cue-capacity" :class="{ 'cue-capacity--reached': state.reached }">
    <span>{{ label }}</span>
    <strong>{{ unlimited ? '∞' : `${state.used} / ${state.limit}` }}</strong>
    <CuePlanBadge v-if="!entitlements.can(upgradeEntitlement)" :entitlement="upgradeEntitlement" />
  </div>
</template>

<style scoped>
.cue-capacity{
  display:flex;
  align-items:center;
  gap:7px;
  min-height:28px;
  padding:0 8px;
  border:1px solid var(--cue-border);
  border-radius:var(--cue-radius-control);
  background:var(--cue-bg);
}
.cue-capacity>span{
  color:var(--cue-muted);
  font:700 7px/1 monospace;
  letter-spacing:.07em;
  text-transform:uppercase;
}
.cue-capacity>strong{
  color:var(--cue-text);
  font:900 9px/1 monospace;
}
.cue-capacity--reached>strong{color:var(--cue-accent)}
</style>
