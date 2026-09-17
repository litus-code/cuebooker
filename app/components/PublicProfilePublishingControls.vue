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

const copiedKey = ref('')
const shareOpen = ref(false)
const publicUrl = computed(() => import.meta.client
  ? `${window.location.origin}/${props.slug}`
  : `https://cuebooker.com/${props.slug}`)
const bookingUrl = computed(() => `${publicUrl.value}?booking=1`)

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'PERFIL PÚBLICO', title: 'Tu puerta de entrada.',
  body: 'Comparte tu perfil donde ya está tu gente. El booking vive aquí y las solicitudes entran al mismo board.',
  published: 'Perfil publicado', unpublished: 'Perfil privado', accepting: 'Aceptar solicitudes', closed: 'Booking cerrado',
  preview: 'Vista previa', copy: 'Copiar enlace de booking', copied: 'Copiado', live: 'Abrir perfil',
  publishHint: 'Publicar hace visible la ficha. Abrir booking permite que te envíen solicitudes sin registrarse.',
  share: 'Compartir / atribución', shareTitle: 'Un mismo booking. Distintas puertas de entrada.',
  shareBody: 'Cada enlace apunta al mismo formulario y solo añade la procedencia para saber desde dónde llegó la visita.',
  publicProfile: 'Perfil público', directBooking: 'Booking directo',
  instagram: 'Instagram', whatsapp: 'WhatsApp', website: 'Web', epk: 'EPK', qr: 'QR', email: 'Email', linkInBio: 'Link in bio',
  bookingClosedHint: 'Abre “Aceptar solicitudes” para copiar enlaces que llevan directamente al formulario.'
} : {
  eyebrow: 'PUBLIC PROFILE', title: 'Your booking front door.',
  body: 'Share your profile where your audience already is. Booking lives here and every enquiry reaches the same board.',
  published: 'Profile published', unpublished: 'Profile private', accepting: 'Accept enquiries', closed: 'Booking closed',
  preview: 'Preview', copy: 'Copy booking link', copied: 'Copied', live: 'Open profile',
  publishHint: 'Publishing makes the profile visible. Opening booking lets promoters send enquiries without an account.',
  share: 'Share / attribution', shareTitle: 'One booking flow. Different entry points.',
  shareBody: 'Every link reaches the same form and only adds attribution so you know where the visit came from.',
  publicProfile: 'Public profile', directBooking: 'Direct booking',
  instagram: 'Instagram', whatsapp: 'WhatsApp', website: 'Website', epk: 'EPK', qr: 'QR', email: 'Email', linkInBio: 'Link in bio',
  bookingClosedHint: 'Open “Accept enquiries” to copy links that focus directly on the booking form.'
})

const shareLinks = computed(() => [
  { key: 'profile', label: copy.value.publicProfile, url: publicUrl.value, needsBooking: false },
  { key: 'booking', label: copy.value.directBooking, url: bookingUrl.value, needsBooking: true },
  { key: 'instagram', label: copy.value.instagram, url: attributedBookingUrl('instagram'), needsBooking: true },
  { key: 'whatsapp', label: copy.value.whatsapp, url: attributedBookingUrl('whatsapp'), needsBooking: true },
  { key: 'website', label: copy.value.website, url: attributedBookingUrl('website'), needsBooking: true },
  { key: 'epk', label: copy.value.epk, url: attributedBookingUrl('epk'), needsBooking: true },
  { key: 'qr', label: copy.value.qr, url: attributedBookingUrl('qr'), needsBooking: true },
  { key: 'email', label: copy.value.email, url: attributedBookingUrl('email'), needsBooking: true },
  { key: 'link_in_bio', label: copy.value.linkInBio, url: attributedBookingUrl('link_in_bio'), needsBooking: true }
])

function attributedBookingUrl(source: string) {
  return `${publicUrl.value}?booking=1&src=${encodeURIComponent(source)}`
}

function checkboxValue(event: Event) {
  return (event.currentTarget as HTMLInputElement).checked
}

function changePublished(event: Event) {
  emit('updatePublished', checkboxValue(event))
}

function changeAcceptingRequests(event: Event) {
  emit('updateAcceptingRequests', checkboxValue(event))
}

async function copyLink(key: string, url: string) {
  if (!import.meta.client || !props.published) return
  await navigator.clipboard.writeText(url)
  copiedKey.value = key
  window.setTimeout(() => {
    if (copiedKey.value === key) copiedKey.value = ''
  }, 1800)
}

async function copyBookingLink() {
  if (!props.acceptingRequests) return
  await copyLink('booking-main', bookingUrl.value)
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
      <button type="button" :disabled="!published || !acceptingRequests" @click="copyBookingLink">
        {{ copiedKey === 'booking-main' ? copy.copied : copy.copy }}
      </button>
      <button type="button" :disabled="!published" :aria-expanded="shareOpen" @click="shareOpen = !shareOpen">
        {{ copy.share }} <span class="arrow arrow--se" aria-hidden="true" />
      </button>
      <a v-if="published" :href="publicUrl" target="_blank" rel="noopener noreferrer">{{ copy.live }} <span class="arrow arrow--ne" aria-hidden="true" /></a>
    </div>

    <div v-if="shareOpen" class="public-profile-controls__share">
      <div>
        <strong>{{ copy.shareTitle }}</strong>
        <p>{{ copy.shareBody }}</p>
        <small v-if="!acceptingRequests">{{ copy.bookingClosedHint }}</small>
      </div>
      <div class="public-profile-controls__share-grid">
        <button
          v-for="link in shareLinks"
          :key="link.key"
          type="button"
          :disabled="!published || (link.needsBooking && !acceptingRequests)"
          @click="copyLink(link.key, link.url)"
        >
          <span>{{ link.label }}</span>
          <small>{{ copiedKey === link.key ? copy.copied : link.url }}</small>
        </button>
      </div>
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
.public-profile-controls__actions button:focus-visible, .public-profile-controls__actions a:focus-visible, .public-profile-controls__share-grid button:focus-visible { outline: 2px solid var(--cue-accent); outline-offset: 2px; }
.public-profile-controls__share { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(230px, .32fr) minmax(0, .68fr); gap: 20px; padding-top: 18px; border-top: 1px solid var(--cue-border); }
.public-profile-controls__share > div:first-child > strong { display: block; font-size: 14px; text-transform: uppercase; }
.public-profile-controls__share > div:first-child p { margin: 7px 0; color: var(--cue-muted); font-size: 12px; line-height: 1.45; }
.public-profile-controls__share > div:first-child small { color: var(--cue-dim); font-size: 10px; line-height: 1.35; }
.public-profile-controls__share-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 7px; }
.public-profile-controls__share-grid button { min-width: 0; min-height: 56px; padding: 9px 11px; border: 1px solid var(--cue-border); background: var(--cue-bg); color: var(--cue-text); cursor: pointer; text-align: left; }
.public-profile-controls__share-grid button > span, .public-profile-controls__share-grid button > small { display: block; }
.public-profile-controls__share-grid button > span { font: 800 10px/1.2 monospace; text-transform: uppercase; }
.public-profile-controls__share-grid button > small { margin-top: 6px; overflow: hidden; color: var(--cue-muted); font: 9px/1.25 monospace; text-overflow: ellipsis; white-space: nowrap; }
.public-profile-controls__share-grid button:hover:not(:disabled) { border-color: var(--cue-accent); }
.public-profile-controls__share-grid button:disabled { cursor: default; opacity: .4; }
@media (max-width: 760px) {
  .public-profile-controls { grid-template-columns: 1fr; padding: 16px; }
  .public-profile-controls__actions, .public-profile-controls__share { grid-column: 1; }
  .public-profile-controls__share { grid-template-columns: 1fr; }
}
@media (max-width: 520px) {
  .public-profile-controls__share-grid { grid-template-columns: 1fr; }
}
</style>
