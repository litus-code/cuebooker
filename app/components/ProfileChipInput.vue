<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  limit?: number
  removeLabel?: string
}>(), {
  placeholder: '',
  limit: 20,
  removeLabel: 'Remove'
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const draft = ref('')
const input = ref<HTMLInputElement | null>(null)

const chips = computed(() => props.modelValue
  .split(',')
  .map(value => value.trim())
  .filter(Boolean))

function commitDraft() {
  const candidates = draft.value.split(',').map(value => value.trim()).filter(Boolean)
  if (!candidates.length) return

  const values = [...chips.value]
  for (const candidate of candidates) {
    if (values.length >= props.limit) break
    if (!values.some(value => value.localeCompare(candidate, undefined, { sensitivity: 'accent' }) === 0)) values.push(candidate)
  }
  emit('update:modelValue', values.join(', '))
  draft.value = ''
}

function removeChip(index: number) {
  emit('update:modelValue', chips.value.filter((_, chipIndex) => chipIndex !== index).join(', '))
  nextTick(() => input.value?.focus())
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' || event.key === ',') {
    event.preventDefault()
    commitDraft()
    return
  }
  if (event.key === 'Backspace' && !draft.value && chips.value.length) removeChip(chips.value.length - 1)
}
</script>

<template>
  <div class="chip-input" @click="input?.focus()">
    <span v-for="(chip, index) in chips" :key="`${chip}-${index}`" class="chip">
      {{ chip }}
      <button type="button" :aria-label="`${removeLabel} ${chip}`" @click.stop="removeChip(index)">×</button>
    </span>
    <input
      v-if="chips.length < limit"
      ref="input"
      v-model="draft"
      :placeholder="chips.length ? '' : placeholder"
      @blur="commitDraft"
      @keydown="handleKeydown"
    >
  </div>
</template>

<style scoped>
.chip-input { display:flex; flex-wrap:wrap; align-items:center; gap:7px; min-height:46px; box-sizing:border-box; padding:7px; border:1px solid var(--cue-border); background:var(--cue-surface); cursor:text; }
.chip-input:focus-within { border-color:#e8ff2f; }
.chip { display:inline-flex; align-items:center; gap:7px; min-height:30px; padding:0 5px 0 10px; background:color-mix(in srgb,var(--cue-toggle) 14%,var(--cue-raised)); color:var(--cue-text); font-size:13px; font-weight:700; }
.chip button { display:grid; place-items:center; width:24px; height:24px; padding:0; border:0; background:transparent; color:var(--cue-muted); cursor:pointer; font-size:18px; line-height:1; }
.chip button:hover, .chip button:focus-visible { color:var(--cue-text); }
input { flex:1 1 150px; min-width:100px; min-height:30px; padding:0 5px; border:0; outline:0; background:transparent; color:var(--cue-text); font:inherit; }
</style>
