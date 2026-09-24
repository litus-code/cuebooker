<script setup lang="ts">
import type { CueEntitlement } from '../domain/entitlements'
import { CUE_PLANS } from '../domain/entitlements'

const props = withDefaults(defineProps<{
  entitlement: CueEntitlement
  title: string
  description: string
  actionLabel?: string
  showWhenAvailable?: boolean
}>(), {
  actionLabel: '',
  showWhenAvailable: false
})

const emit = defineEmits<{ action: [] }>()
const analytics = useAnalytics()
const entitlements = useCueEntitlements()
const visible = computed(() => props.showWhenAvailable || !entitlements.can(props.entitlement))
const targetPlan = computed(() => CUE_PLANS[entitlements.minimumPlan(props.entitlement)].label)
const trackedVisible = ref(false)

watch(visible, isVisible => {
  if (!isVisible || trackedVisible.value) return
  trackedVisible.value = true
  analytics.track('upgrade_prompt_viewed', {
    entitlement: props.entitlement,
    target_plan: entitlements.minimumPlan(props.entitlement)
  })
}, { immediate: true })

function handleAction() {
  analytics.track('upgrade_prompt_action', {
    entitlement: props.entitlement,
    target_plan: entitlements.minimumPlan(props.entitlement)
  })
  emit('action')
}
</script>

<template>
  <aside v-if="visible" class="cue-upgrade-prompt">
    <div>
      <span>{{ targetPlan }}</span>
      <CuePlanBadge :entitlement="entitlement" />
    </div>
    <strong>{{ title }}</strong>
    <p>{{ description }}</p>
    <button v-if="actionLabel" type="button" @click="handleAction">{{ actionLabel }}</button>
  </aside>
</template>

<style scoped>
.cue-upgrade-prompt{
  display:grid;
  gap:7px;
  padding:11px 12px;
  border:1px dashed color-mix(in srgb,var(--cue-accent) 40%,var(--cue-border));
  border-radius:var(--cue-radius-control);
  background:color-mix(in srgb,var(--cue-accent) 3%,var(--cue-bg));
}
.cue-upgrade-prompt>div{display:flex;align-items:center;gap:8px}
.cue-upgrade-prompt>div>span{color:var(--cue-muted);font:800 7px/1 monospace;letter-spacing:.08em;text-transform:uppercase}
.cue-upgrade-prompt>strong{font-size:11px}
.cue-upgrade-prompt>p{margin:0;color:var(--cue-muted);font-size:10px;line-height:1.45}
.cue-upgrade-prompt>button{justify-self:start;min-height:34px;padding:0 10px;border:1px solid var(--cue-accent);border-radius:var(--cue-radius-control);background:transparent;color:var(--cue-accent);cursor:pointer;font:800 8px/1 monospace;text-transform:uppercase}
</style>
