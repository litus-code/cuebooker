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
        <span>HEADER / PHOTO</span>
        <h3>{{ title }}</h3>
        <p>{{ hint }}</p>
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
  display:grid;
  align-content:end;
  justify-items:start;
  box-sizing:border-box;
  min-height:inherit;
  width:min(620px,72%);
  padding:clamp(22px,4vw,46px);
}
.cover-uploader__intro>span {
  color:var(--cue-accent);
  font:800 8px/1 monospace;
  letter-spacing:.12em;
}
.cover-uploader__intro h3 {
  max-width:560px;
  margin:12px 0 8px;
  font-size:clamp(2rem,4vw,4.2rem);
  line-height:.9;
  letter-spacing:-.05em;
  text-transform:uppercase;
}
.cover-uploader__intro p {
  max-width:520px;
  margin:0 0 20px;
  color:#b1b1b1;
  font-size:12px;
  line-height:1.5;
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
  .cover-uploader__stage { min-height:250px; }
  .cover-uploader__intro {
    width:86%;
    padding:20px 18px;
  }
  .cover-uploader__intro h3 { font-size:clamp(1.8rem,10vw,3rem); }
  .cover-uploader__actions { width:100%; }
  .cover-uploader__actions button { flex:1; }
}
</style>
