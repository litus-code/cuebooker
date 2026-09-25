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
  <section class="cover-uploader" :class="{ 'cover-uploader--dragging': dragging }">
    <div
      class="cover-uploader__stage"
      @dragenter.prevent="dragging = true"
      @dragover.prevent="dragging = true"
      @dragleave.prevent="dragging = false"
      @drop.prevent="onDrop"
    >
      <img class="cover-uploader__background" :src="coverSource" alt="">
      <div class="cover-uploader__shade" />
      <input ref="input" type="file" accept="image/jpeg,image/png,image/webp" tabindex="-1" @change="onInput">

      <div class="cover-uploader__intro">
        <div>
          <span>HEADER / PHOTO</span>
          <strong>{{ imageUrl ? (changeLabel || title) : (chooseLabel || title) }}</strong>
          <small>{{ hint }}</small>
        </div>
        <div class="cover-uploader__actions">
          <button type="button" :disabled="disabled || uploading" @click="openPicker">
            {{ uploading ? uploadingLabel : (imageUrl ? changeLabel : chooseLabel) }}
          </button>
          <button
            v-if="imageUrl"
            type="button"
            class="cover-uploader__remove"
            :disabled="disabled || uploading"
            @click="emit('remove')"
          >
            {{ removeLabel }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.cover-uploader {
  overflow:hidden;
  border:1px solid var(--cue-border);
  border-radius:var(--cue-radius-panel);
  background:var(--cue-bg);
  color:var(--cue-text);
}
.cover-uploader__stage {
  position:relative;
  min-height:clamp(260px,32vw,430px);
  overflow:hidden;
  isolation:isolate;
}
.cover-uploader__background {
  position:absolute;
  z-index:-2;
  inset:0;
  width:100%;
  height:100%;
  object-fit:cover;
  object-position:center;
  transition:transform .3s ease,filter .3s ease;
}
.cover-uploader__shade {
  position:absolute;
  z-index:-1;
  inset:0;
  background:
    linear-gradient(90deg,rgba(0,0,0,.86) 0%,rgba(0,0,0,.52) 44%,rgba(0,0,0,.12) 100%),
    linear-gradient(0deg,rgba(0,0,0,.58),transparent 60%);
}
.cover-uploader__stage>input {
  position:absolute;
  width:1px;
  height:1px;
  opacity:0;
  pointer-events:none;
}
.cover-uploader__intro {
  position:absolute;
  right:0;
  bottom:0;
  left:0;
  display:flex;
  align-items:end;
  justify-content:space-between;
  gap:18px;
  padding:16px;
  background:linear-gradient(180deg,transparent,rgba(0,0,0,.86));
}
.cover-uploader__intro>div:first-child {
  display:grid;
  gap:5px;
  min-width:0;
}
.cover-uploader__intro span {
  color:var(--cue-accent);
  font:800 8px/1 monospace;
  letter-spacing:.12em;
}
.cover-uploader__intro strong {
  font-size:16px;
}
.cover-uploader__intro small {
  max-width:440px;
  color:#b1b1b1;
  font-size:10px;
  line-height:1.35;
}
.cover-uploader__actions {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.cover-uploader__actions button {
  min-height:42px;
  padding:0 15px;
  border:1px solid var(--cue-accent);
  border-radius:var(--cue-radius-control);
  background:var(--cue-accent);
  color:var(--cue-accent-ink);
  cursor:pointer;
  font:800 10px/1 monospace;
}
.cover-uploader__actions button:disabled {
  opacity:.5;
  cursor:not-allowed;
}
.cover-uploader__actions .cover-uploader__remove {
  border-color:rgba(255,255,255,.25);
  background:rgba(0,0,0,.3);
  color:#ddd;
}
.cover-uploader--dragging .cover-uploader__stage {
  outline:2px solid var(--cue-accent);
  outline-offset:-2px;
}
.cover-uploader--dragging .cover-uploader__background {
  transform:scale(1.025);
  filter:brightness(1.1);
}

@media (max-width:720px) {
  .cover-uploader__stage { min-height:220px; }
  .cover-uploader__intro {
    align-items:stretch;
    flex-direction:column;
    gap:10px;
    padding:12px;
  }
  .cover-uploader__intro small { display:none; }
  .cover-uploader__actions { width:100%; }
  .cover-uploader__actions button { flex:1; min-height:44px; }
}
</style>
