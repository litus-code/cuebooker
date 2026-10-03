<script setup lang="ts">
const props = defineProps<{ id: string; label: string }>()
const root = ref<HTMLElement | null>(null)
const open = ref(false)

function onPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false
}

function onKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeyDown)
})
</script>

<template>
  <span ref="root" class="cue-info">
    <button
      class="cue-info__trigger"
      type="button"
      :aria-label="label"
      :aria-describedby="id"
      :aria-expanded="open"
      @click.stop="open = !open"
    >i</button>
    <span :id="id" class="cue-info__popup" :class="{ 'is-open': open }" role="tooltip">
      <slot />
    </span>
  </span>
</template>

<style scoped>
.cue-info{position:relative;display:inline-flex;flex:none;vertical-align:middle}
.cue-info__trigger{display:grid;place-items:center;width:30px;height:30px;min-height:30px;padding:0;border:1px solid var(--cue-border);border-radius:50%;background:transparent;color:var(--cue-muted);font:700 14px/1 Arial,sans-serif;cursor:pointer}
.cue-info__trigger:hover,.cue-info__trigger:focus-visible,.cue-info__trigger[aria-expanded=true]{border-color:var(--cue-accent);color:var(--cue-accent)}
.cue-info__trigger:focus-visible{outline:2px solid var(--cue-accent);outline-offset:3px}
.cue-info__popup{position:absolute;z-index:80;top:calc(100% + 8px);left:0;display:block;box-sizing:border-box;width:min(330px,calc(100vw - 40px));padding:14px 16px;border:1px solid var(--cue-border);border-radius:12px;background:var(--cue-surface);color:var(--cue-text);box-shadow:0 12px 32px #0008;font:400 13px/1.55 Arial,sans-serif;text-align:left;opacity:0;visibility:hidden;transition:opacity .14s ease,visibility .14s ease;pointer-events:none}
.cue-info__trigger:hover+.cue-info__popup,.cue-info__trigger:focus-visible+.cue-info__popup,.cue-info__popup.is-open{opacity:1;visibility:visible;pointer-events:auto}
.cue-info__popup :deep(p){margin:0;color:var(--cue-muted);font:inherit}
.cue-info__popup :deep(p+p){margin-top:8px}
@media(max-width:600px){.cue-info__trigger{width:34px;height:34px;min-height:34px}.cue-info__popup{width:min(330px,calc(100vw - 32px));padding:14px}}
@media(prefers-reduced-motion:reduce){.cue-info__popup{transition:none}}
</style>
