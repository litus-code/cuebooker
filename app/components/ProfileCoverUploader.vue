<script setup lang="ts">
const props = withDefaults(defineProps<{
  imageUrl?: string
  positionY?: number
  disabled?: boolean
  uploading?: boolean
  title: string
  hint: string
  chooseLabel: string
  changeLabel: string
  removeLabel: string
  positionLabel: string
  uploadingLabel: string
}>(), {
  imageUrl: '',
  positionY: 50,
  disabled: false,
  uploading: false
})

const emit = defineEmits<{
  select: [file: File]
  remove: []
  'update:positionY': [value: number]
}>()

const input = ref<HTMLInputElement | null>(null)
const dragging = ref(false)

const coverSource = computed(() => props.imageUrl || '/images/profile/cuebooker-default-cover.webp')

function openPicker() {
  if (!props.disabled && !props.uploading) input.value?.click()
}

function selectFile(file?: File) {
  if (file && !props.disabled && !props.uploading) emit('select', file)
}

function onInput(event: Event) {
  const target = event.target as HTMLInputElement
  selectFile(target.files?.[0])
  target.value = ''
}

function onDrop(event: DragEvent) {
  dragging.value = false
  selectFile(event.dataTransfer?.files?.[0])
}
</script>

<template>
  <section
    class="cover-uploader"
    :class="{ 'cover-uploader--dragging': dragging, 'cover-uploader--custom': imageUrl }"
    @dragenter.prevent="dragging = true"
    @dragover.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <img :src="coverSource" alt="" :style="{ objectPosition: `50% ${positionY}%` }">
    <div class="cover-uploader__shade" />
    <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" tabindex="-1" @change="onInput">

    <div class="cover-uploader__intro">
      <span>PORTADA / 16:9</span>
      <h3>{{ title }}</h3>
      <p>{{ hint }}</p>
      <button type="button" :disabled="disabled || uploading" @click="openPicker">
        <i aria-hidden="true">＋</i>
        {{ uploading ? uploadingLabel : (imageUrl ? changeLabel : chooseLabel) }}
      </button>
    </div>

    <div v-if="imageUrl" class="cover-uploader__controls">
      <label>
        <span>{{ positionLabel }}</span>
        <input
          type="range"
          min="0"
          max="100"
          :value="positionY"
          :disabled="disabled || uploading"
          @input="emit('update:positionY', Number(($event.target as HTMLInputElement).value))"
        >
      </label>
      <button type="button" :disabled="disabled || uploading" @click="emit('remove')">{{ removeLabel }}</button>
    </div>
  </section>
</template>

<style scoped>
.cover-uploader { position: relative; min-height: clamp(300px, 38vw, 470px); overflow: hidden; border: 1px solid var(--cue-border); background: #090909; color: #f4f2ed; isolation: isolate; }
.cover-uploader > img { position: absolute; z-index: -2; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease, filter .35s ease; }
.cover-uploader__shade { position: absolute; z-index: -1; inset: 0; background: linear-gradient(90deg,rgba(0,0,0,.88) 0%,rgba(0,0,0,.46) 54%,rgba(0,0,0,.28) 100%),linear-gradient(0deg,rgba(0,0,0,.78),transparent 45%); }
.cover-uploader > input { position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.cover-uploader__intro { display: grid; align-content: center; justify-items: start; min-height: inherit; max-width: 560px; padding: clamp(28px,6vw,70px); }
.cover-uploader__intro > span { color: #ceff54; font: 700 10px/1.2 monospace; letter-spacing: .15em; }
.cover-uploader__intro h3 { margin: 12px 0 10px; font-size: clamp(2rem,5vw,4.6rem); line-height: .88; letter-spacing: -.06em; text-transform: uppercase; }
.cover-uploader__intro p { max-width: 460px; margin: 0 0 24px; color: #c3c3c3; line-height: 1.5; }
.cover-uploader__intro button { display: inline-flex; align-items: center; gap: 11px; min-height: 48px; padding: 0 18px; border: 1px solid #ceff54; background: rgba(0,0,0,.65); color: #f4f2ed; cursor: pointer; font-weight: 900; }
.cover-uploader__intro button i { display: grid; place-items: center; width: 27px; height: 27px; border-radius: 50%; background: #ceff54; color: #090909; font-size: 19px; font-style: normal; }
.cover-uploader button:disabled { cursor: not-allowed; opacity: .55; }
.cover-uploader__controls { position: absolute; right: 18px; bottom: 18px; left: 18px; display: flex; align-items: end; gap: 18px; padding: 14px 16px; border: 1px solid rgba(255,255,255,.22); background: rgba(5,5,5,.86); backdrop-filter: blur(14px); }
.cover-uploader__controls label { display: grid; flex: 1; gap: 7px; }
.cover-uploader__controls label span { color: #bbb; font: 700 9px/1.2 monospace; letter-spacing: .12em; text-transform: uppercase; }
.cover-uploader__controls input { width: 100%; accent-color: #ceff54; }
.cover-uploader__controls button { min-height: 38px; padding: 0 14px; border: 1px solid #555; background: transparent; color: #eee; cursor: pointer; font-weight: 800; }
.cover-uploader--dragging { outline: 3px solid #ceff54; outline-offset: -3px; }
.cover-uploader--dragging > img { transform: scale(1.035); filter: brightness(1.15); }

@media (max-width: 680px) {
  .cover-uploader { min-height: 420px; }
  .cover-uploader__intro { align-content: start; padding: 30px 22px 116px; }
  .cover-uploader__intro h3 { font-size: 3rem; }
  .cover-uploader__controls { right: 10px; bottom: 10px; left: 10px; align-items: stretch; flex-direction: column; gap: 10px; }
  .cover-uploader__controls button { width: 100%; }
}
</style>
