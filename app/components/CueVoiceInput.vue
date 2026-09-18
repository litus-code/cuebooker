<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  locale: 'es' | 'en'
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  captured: [value: string]
}>()

const supported = ref(false)
const listening = ref(false)
const errorMessage = ref('')
let recognition: any = null
let baseText = ''
let committedText = ''
let interimText = ''
let failed = false
let manuallyStopped = false

const copy = computed(() => props.locale === 'es' ? {
  start: 'Hablar',
  stop: 'Parar',
  listening: 'Escuchando… sigue hablando hasta pulsar Parar.',
  error: 'No he podido usar el micrófono. Puedes seguir escribiendo.'
} : {
  start: 'Speak',
  stop: 'Stop',
  listening: 'Listening… keep speaking until you press Stop.',
  error: 'I could not use the microphone. You can keep typing.'
})

onMounted(() => {
  const browser = window as any
  supported.value = Boolean(browser.SpeechRecognition || browser.webkitSpeechRecognition)
})

function createRecognition() {
  const browser = window as any
  const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition
  if (!Recognition) return null

  const instance = new Recognition()
  instance.lang = props.locale === 'es' ? 'es-ES' : 'en-US'
  instance.continuous = true
  instance.interimResults = true
  instance.maxAlternatives = 1

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
      committedText = [committedText.trim(), finalChunk.trim()].filter(Boolean).join(' ')
    }

    interimText = interimChunk.trim()
    const nextValue = [baseText.trim(), committedText.trim(), interimText].filter(Boolean).join(' ')
    emit('update:modelValue', nextValue)
  }

  instance.onerror = (event: any) => {
    const benign = event?.error === 'no-speech' || event?.error === 'aborted'
    if (!benign) {
      failed = true
      errorMessage.value = copy.value.error
    }
  }

  instance.onend = () => {
    if (listening.value && !manuallyStopped && !failed) {
      try {
        recognition?.start?.()
        return
      } catch {
        // Fall through and finish the capture.
      }
    }

    listening.value = false
    const finalValue = [baseText.trim(), committedText.trim()].filter(Boolean).join(' ')
    if (!failed && finalValue.trim()) {
      emit('update:modelValue', finalValue.trim())
      emit('captured', finalValue.trim())
    }
  }

  return instance
}

function start() {
  if (!supported.value || listening.value) return
  errorMessage.value = ''
  baseText = props.modelValue
  committedText = ''
  interimText = ''
  failed = false
  manuallyStopped = false
  recognition = createRecognition()
  if (!recognition) return
  listening.value = true
  try {
    recognition.start()
  } catch {
    failed = true
    listening.value = false
    errorMessage.value = copy.value.error
  }
}

function stop() {
  manuallyStopped = true
  recognition?.stop?.()
}

onBeforeUnmount(() => {
  manuallyStopped = true
  recognition?.abort?.()
})
</script>

<template>
  <div v-if="supported" class="cue-voice">
    <button type="button" :class="{ active: listening }" @click="listening ? stop() : start()">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11v1a7 7 0 0 0 14 0v-1M12 19v3M9 22h6"/></svg>
      <span>{{ listening ? copy.stop : copy.start }}</span>
      <i v-if="listening">{{ copy.listening }}</i>
    </button>
    <p v-if="errorMessage">{{ errorMessage }}</p>
  </div>
</template>

<style scoped>
.cue-voice { display:flex; align-items:center; gap:10px; margin-top:-5px; padding-bottom:10px; }
.cue-voice button { display:flex; align-items:center; gap:7px; min-height:34px; padding:0 11px; border:1px solid #3b3b3b; background:transparent; color:#c3c3c3; cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.cue-voice button:hover { border-color:#ceff54; color:#ceff54; }
.cue-voice button.active { border-color:#ceff54; background:rgba(206,255,84,.08); color:#ceff54; }
.cue-voice svg { width:14px; height:14px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
.cue-voice i { color:#8f8f8f; font-size:8px; font-style:normal; }
.cue-voice p { margin:0; color:#ff9b9b; font-size:10px; line-height:1.35; }
</style>