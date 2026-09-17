<script setup lang="ts">
const props = withDefaults(defineProps<{
  slug: string
  published: boolean
  acceptingRequests: boolean
  saving?: boolean
  locale?: 'es' | 'en'
}>(), {
  saving: false,
  locale: 'es'
})

const emit = defineEmits<{
  preview: []
  updatePublished: [value: boolean]
  updateAcceptingRequests: [value: boolean]
}>()

const copied = ref(false)
const publicUrl = computed(() => `https://cuebooker.com/${props.slug}`)
const bookingUrl = computed(() => `${publicUrl.value}?booking=1`)
const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'PERFIL PÚBLICO', title: 'Tu puerta de entrada.',
  body: 'Comparte tu perfil donde ya está tu gente. El booking vive aquí y las solicitudes entran al mismo board.',
  published: 'Perfil publicado', unpublished: 'Perfil privado', accepting: 'Aceptar solicitudes', closed: 'Booking cerrado',
  preview: 'Vista previa', copy: 'Copiar enlace de booking', copied: 'Enlace copiado', live: 'Abrir perfil',
  publishHint: 'Publicar hace visible la ficha. Abrir booking permite que te envíen solicitudes sin registrarse.'
} : {
  eyebrow: 'PUBLIC PROFILE', title: 'Your booking front door.',
  body: 'Share your profile where your audience already is. Booking lives here and every enquiry reaches the same board.',
  published: 'Profile published', unpublished: 'Profile private', accepting: 'Accept enquiries', closed: 'Booking closed',
  preview: 'Preview', copy: 'Copy booking link', copied: 'Link copied', live: 'Open profile',
  publishHint: 'Publishing makes the profile visible. Opening booking lets promoters send enquiries without an account.'
})

function checkboxValue(event: Event) {
  return (event.currentTarget as HTMLInputElement).checked
}

function changePublished(event: Event) {
  emit('updatePublished', checkboxValue(event))
}

function changeAcceptingRequests(event: Event) {
  emit('updateAcceptingRequests', checkboxValue(event))
}

async function copyBookingLink() {
  if (!import.meta.client || !props.published) return
  await navigator.clipboard.writeText(bookingUrl.value)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1800)
}
</script>

<template>
  <section class="public-profile-controls">
    <div class="public-profile-controls__copy">
      <span>{{ copy.eyebrow }}</span>
      <strong>{{ copy.title }}</strong>
      <p>{{ copy.body }}</p>
      <small>{{ copy.publishHint }}</small>
    </div>

    <div class="public-profile-controls__settings">
      <label>
        <input :checked="published" type="checkbox" :disabled="saving" @change="changePublished">
        <span><strong>{{ published ? copy.published : copy.unpublished }}</strong><small>{{ publicUrl }}</small></span>
      </label>
      <label>
        <input :checked="acceptingRequests" type="checkbox" :disabled="saving || !published" @change="changeAcceptingRequests">
        <span><strong>{{ acceptingRequests ? copy.accepting : copy.closed }}</strong><small>Booking Core · public_form</small></span>
      </label>
    </div>

    <div class="public-profile-controls__actions">
      <button type="button" @click="emit('preview')">{{ copy.preview }}</button>
      <button type="button" :disabled="!published" @click="copyBookingLink">{{ copied ? copy.copied : copy.copy }}</button>
      <a v-if="published" :href="publicUrl" target="_blank" rel="noopener noreferrer">{{ copy.live }} <span class="arrow arrow--ne" aria-hidden="true" /></a>
    </div>
  </section>
</template>

<style scoped>
.public-profile-controls { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(300px, .8fr); gap: 24px; margin: 0 0 28px; padding: 22px; border: 1px solid var(--cue-border); background: var(--cue-surface); color: var(--cue-text); }
.public-profile-controls__copy > span { color: var(--cue-accent); font: 700 9px/1.2 monospace; letter-spacing: .1em; }
.public-profile-controls__copy > strong { display: block; margin-top: 8px; font-size: 22px; text-transform: uppercase; }
.public-profile-controls__copy p { max-width: 650px; margin: 8px 0; color: var(--cue-muted); font-size: 13px; line-height: 1.5; }
.public-profile-controls__copy small { color: var(--cue-dim); font-size: 11px; line-height: 1.4; }
.public-profile-controls__settings { display: grid; gap: 8px; }
.public-profile-controls__settings label { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 11px; min-height: 58px; padding: 8px 11px; border: 1px solid var(--cue-border); cursor: pointer; }
.public-profile-controls__settings input { width: 18px; height: 18px; accent-color: var(--cue-toggle); }
.public-profile-controls__settings strong, .public-profile-controls__settings small { display: block; }
.public-profile-controls__settings strong { font-size: 12px; }
.public-profile-controls__settings small { margin-top: 4px; overflow: hidden; color: var(--cue-muted); font: 9px/1.3 monospace; text-overflow: ellipsis; white-space: nowrap; }
.public-profile-controls__actions { grid-column: 1 / -1; display: flex; flex-wrap: wrap; gap: 9px; padding-top: 16px; border-top: 1px solid var(--cue-border); }
.public-profile-controls__actions button, .public-profile-controls__actions a { display: inline-flex; align-items: center; gap: 7px; min-height: 40px; padding: 0 13px; border: 1px solid var(--cue-border); background: transparent; color: var(--cue-text); cursor: pointer; font: 700 10px/1 monospace; text-decoration: none; text-transform: uppercase; }
.public-profile-controls__actions button:disabled { cursor: default; opacity: .4; }
.public-profile-controls__actions button:hover:not(:disabled), .public-profile-controls__actions a:hover { border-color: var(--cue-accent); color: var(--cue-accent); }
.public-profile-controls__actions button:focus-visible, .public-profile-controls__actions a:focus-visible { outline: 2px solid var(--cue-accent); outline-offset: 2px; }
@media (max-width: 760px) {
  .public-profile-controls { grid-template-columns: 1fr; padding: 16px; }
  .public-profile-controls__actions { grid-column: 1; }
}
</style>
