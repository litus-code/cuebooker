<script setup lang="ts">
withDefaults(defineProps<{tone?:'info'|'success'|'warning'|'error';title?:string}>(),{tone:'info'})
</script>
<template>
 <div class="mailbox-status" :class="`mailbox-status--${tone}`" :role="tone==='error'?'alert':'status'">
  <svg class="mailbox-status__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><template v-if="tone==='success'"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></template><template v-else><circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/></template></svg>
  <div><strong v-if="title">{{title}}</strong><slot /></div>
 </div>
</template>
<style scoped>
.mailbox-status{--notice:#679cdc;display:flex;align-items:flex-start;gap:10px;padding:12px 14px;margin:12px 0;border:1px solid color-mix(in srgb,var(--notice) 30%,transparent);border-left:4px solid var(--notice);border-radius:var(--cue-radius-control,12px);background:color-mix(in srgb,var(--notice) 10%,var(--cue-bg));color:var(--cue-text);font-size:13px;line-height:1.5}.mailbox-status--success{--notice:#83bd89}.mailbox-status--warning{--notice:#d9a84e}.mailbox-status--error{--notice:#e65e6a}.mailbox-status__icon{width:20px;height:20px;flex-shrink:0;color:var(--notice);margin-top:1px}.mailbox-status>div{min-width:0}.mailbox-status strong{display:block;margin-bottom:4px}.mailbox-status :deep(p){margin:0;color:var(--cue-text);font-size:13px;line-height:1.5}.mailbox-status :deep(p+p){margin-top:8px}.mailbox-status :deep(a){color:inherit;text-decoration:underline;text-underline-offset:3px}
</style>
