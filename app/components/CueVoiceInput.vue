<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  locale: 'es' | 'en'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  captured: [value: string]
  audioCaptured: [audio: Blob, filename: string, fallbackTranscript: string]
}>()

const supported = ref(false)
const recording = ref(false)
const processing = ref(false)
const elapsed = ref(0)
const errorMessage = ref('')
const mode = ref<'recorder' | 'speech' | 'none'>('none')

let recorder: MediaRecorder | null = null
let stream: MediaStream | null = null
let chunks: Blob[] = []
let timer: ReturnType<typeof window.setInterval> | null = null
let recognition: any = null
let fallbackBase = ''
let fallbackCommitted = ''
let fallbackStopped = false
let shadowRecognition: any = null
let shadowTranscript = ''

const copy = computed(() => props.locale === 'es' ? {
  start: 'Contarlo por voz',
  stop: 'Parar y analizar',
  recording: 'Grabando',
  processing: 'Procesando audio…',
  hint: 'Habla con naturalidad. Puedes parar cuando termines.',
  fallbackHint: 'Dictado en directo. Al parar, Cuebooker intentará convertirlo en booking.',
  error: 'No he podido acceder al micrófono. Puedes seguir escribiendo.'
} : {
  start: 'Tell it by voice',
  stop: 'Stop and analyse',
  recording: 'Recording',
  processing: 'Processing audio…',
  hint: 'Speak naturally. Stop when you are done.',
  fallbackHint: 'Live dictation. When you stop, Cuebooker will try to turn it into a booking.',
  error: 'I could not access the microphone. You can keep typing.'
})

onMounted(() => {
  const hasRecorder = Boolean(window.MediaRecorder && navigator.mediaDevices?.getUserMedia)
  const browser = window as any
  const hasSpeech = Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition)

  mode.value = hasRecorder ? 'recorder' : hasSpeech ? 'speech' : 'none'
  supported.value = mode.value !== 'none'
})

function formatElapsed() {
  const minutes = Math.floor(elapsed.value / 60)
  const seconds = elapsed.value % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function preferredMimeType() {
  const candidates = [
    'audio/mp4',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus'
  ]
  return candidates.find(type => MediaRecorder.isTypeSupported(type)) || ''
}

function createShadowRecognition() {
  const browser = window as any
  const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition
  if (!Recognition) return null

  const instance = new Recognition()
  instance.lang = props.locale === 'es' ? 'es-ES' : 'en-US'
  instance.continuous = true
  instance.interimResults = false
  instance.onresult = (event: any) => {
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      if (!event.results[index].isFinal) continue
      const transcript = String(event.results[index][0]?.transcript || '').trim()
      if (transcript) shadowTranscript = [shadowTranscript, transcript].filter(Boolean).join(' ')
    }
  }
  instance.onerror = () => {}
  instance.onend = () => {
    if (recording.value && shadowRecognition === instance) {
      try { instance.start() } catch {}
    }
  }
  return instance
}

function startShadowRecognition() {
  shadowTranscript = ''
  shadowRecognition = createShadowRecognition()
  try { shadowRecognition?.start?.() } catch { shadowRecognition = null }
}

function stopShadowRecognition() {
  const instance = shadowRecognition
  shadowRecognition = null
  try { instance?.stop?.() } catch {}
}

function stopTracks() {
  stream?.getTracks().forEach(track => track.stop())
  stream = null
}

function clearTimer() {
  if (timer) window.clearInterval(timer)
  timer = null
}

async function startRecorder() {
  if (recording.value || processing.value) return
  errorMessage.value = ''
  chunks = []
  elapsed.value = 0

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    })

    const mimeType = preferredMimeType()
    recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)

    recorder.ondataavailable = event => {
      if (event.data?.size) chunks.push(event.data)
    }

    recorder.onerror = () => {
      errorMessage.value = copy.value.error
      recording.value = false
      processing.value = false
      clearTimer()
      stopShadowRecognition()
      stopTracks()
      chunks = []
      recorder = null
    }

    recorder.onstop = () => {
      recording.value = false
      clearTimer()
      stopShadowRecognition()
      stopTracks()

      const finalType = recorder?.mimeType || mimeType || 'audio/webm'
      const audio = new Blob(chunks, { type: finalType })
      chunks = []
      recorder = null

      if (!audio.size) {
        processing.value = false
        errorMessage.value = copy.value.error
        return
      }

      processing.value = true
      const extension = finalType.includes('mp4') ? 'm4a'
        : finalType.includes('ogg') ? 'ogg'
          : finalType.includes('mpeg') ? 'mp3'
            : 'webm'
      emit('audioCaptured', audio, `cuebooker-capture.${extension}`, shadowTranscript.trim())
    }

    recorder.start(1000)
    recording.value = true
    startShadowRecognition()
    timer = window.setInterval(() => {
      elapsed.value += 1
      if (elapsed.value >= 300) stopRecorder()
    }, 1000)
  } catch {
    errorMessage.value = copy.value.error
    recording.value = false
    processing.value = false
    clearTimer()
    stopTracks()
  }
}

function stopRecorder() {
  if (!recording.value || !recorder) return
  processing.value = true
  stopShadowRecognition()
  recorder.stop()
}

function createFallbackRecognition() {
  const browser = window as any
  const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition
  if (!Recognition) return null

  const instance = new Recognition()
  instance.lang = props.locale === 'es' ? 'es-ES' : 'en-US'
  instance.continuous = true
  instance.interimResults = true

  instance.onresult = (event: any) => {
    let finalChunk = ''
    let interimChunk = ''
    for (let index = event.resultIndex; index < event.results.length; index += 1) {
      const transcript = String(event.results[index][0]?.transcript || '').trim()
      if (!transcript) continue
      if (event.results[index].isFinal) finalChunk += `${transcript} `
      else interimChunk += `${transcript} `
    }
    if (finalChunk.trim()) {
      fallbackCommitted = [fallbackCommitted, finalChunk.trim()].filter(Boolean).join(' ')
    }
    const value = [fallbackBase, fallbackCommitted, interimChunk.trim()].filter(Boolean).join(' ')
    emit('update:modelValue', value)
  }

  instance.onerror = () => {
    recording.value = false
    errorMessage.value = copy.value.error
  }

  instance.onend = () => {
    if (recording.value && !fallbackStopped) {
      try { instance.start(); return } catch {}
    }
    recording.value = false
    const value = [fallbackBase, fallbackCommitted].filter(Boolean).join(' ').trim()
    if (value) {
      emit('update:modelValue', value)
      emit('captured', value)
    }
  }

  return instance
}

function startFallback() {
  if (recording.value) return
  fallbackBase = props.modelValue.trim()
  fallbackCommitted = ''
  fallbackStopped = false
  errorMessage.value = ''
  recognition = createFallbackRecognition()
  if (!recognition) return

  recording.value = true
  elapsed.value = 0
  timer = window.setInterval(() => { elapsed.value += 1 }, 1000)
  try {
    recognition.start()
  } catch {
    recording.value = false
    clearTimer()
    errorMessage.value = copy.value.error
  }
}

function stopFallback() {
  fallbackStopped = true
  clearTimer()
  recognition?.stop?.()
}

function start() {
  if (mode.value === 'recorder') void startRecorder()
  else if (mode.value === 'speech') startFallback()
}

function stop() {
  if (mode.value === 'recorder') stopRecorder()
  else stopFallback()
}

function setProcessing(value: boolean) {
  processing.value = value
}

defineExpose({ setProcessing })

onBeforeUnmount(() => {
  clearTimer()
  fallbackStopped = true
  recognition?.abort?.()
  try { shadowRecognition?.abort?.() } catch {}
  shadowRecognition = null
  if (recorder && recorder.state !== 'inactive') recorder.stop()
  stopTracks()
})
</script>

<template>
  <div v-if="supported" class="cue-voice">
    <button
      type="button"
      :class="{ active: recording }"
      :disabled="processing && !recording"
      @click="recording ? stop() : start()"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11v1a7 7 0 0 0 14 0v-1M12 19v3M9 22h6"/></svg>
      <span>{{ recording ? copy.stop : processing ? copy.processing : copy.start }}</span>
      <i v-if="recording">{{ copy.recording }} · {{ formatElapsed() }}</i>
    </button>
    <p v-if="recording">{{ copy.hint }}</p>
    <p v-else-if="mode === 'speech'">{{ copy.fallbackHint }}</p>
    <p v-if="errorMessage" class="cue-voice__error">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.cue-voice { display:grid; gap:7px; }
.cue-voice button { display:flex; align-items:center; gap:8px; min-height:44px; width:max-content; max-width:100%; padding:0 13px; border:1px solid #485135; background:rgba(206,255,84,.035); color:#ceff54; cursor:pointer; font:800 9px monospace; text-transform:uppercase; }
.cue-voice button:hover { border-color:#ceff54; }
.cue-voice button.active { border-color:#ceff54; background:rgba(206,255,84,.09); }
.cue-voice button:disabled { opacity:.5; cursor:wait; }
.cue-voice svg { width:15px; height:15px; flex:0 0 auto; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
.cue-voice i { color:#aebd84; font-size:8px; font-style:normal; text-transform:none; }
.cue-voice p { margin:0; color:#8f8f8f; font-size:9px; line-height:1.4; }
.cue-voice .cue-voice__error { color:#ff9b9b; }
</style>
