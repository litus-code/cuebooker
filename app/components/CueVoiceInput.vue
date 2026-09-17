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
let latestText = ''
let failed = false

const copy = computed(() => props.locale === 'es' ? {
  start: 'Hablar',
  stop: 'Parar',
  listening: 'Escuchando…',
  error: 'No he podido usar el micrófono. Puedes seguir escribiendo.'
} : {
  start: 'Speak',
  stop: 'Stop',
  listening: 'Listening…',
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
  instance.continuous = false
  instance.interimResults = true
  instance.maxAlternatives = 1

  instance.onresult = (event: any) => {
    let transcript = ''
    for (let index = 0; index < event.results.length; index += 1) {
      transcript += `${event.results[index][0]?.transcript || ''} `
    }
    const spoken = transcript.trim()
    if (!spoken) return
    latestText = [baseText.trim(), spoken].filter(Boolean).join(' ')
    emit('update:modelValue', latestText)
  }

  instance.onerror = () => {
    failed = true
    listening.value = false
    errorMessage.value = copy.value.error
  }

  instance.onend = () => {
    listening.value = false
    if (!failed && latestText.trim()) emit('captured', latestText.trim())
  }

  return instance
}

function start() {
  if (!supported.value || listening.value) return
  errorMessage.value = ''
  baseText = props.modelValue
  latestText = props.modelValue
  failed = false
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
  recognition?.stop?.()
}

onBeforeUnmount(() => recognition?.abort?.())
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