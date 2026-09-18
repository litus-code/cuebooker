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
const widgetUrl = computed(() => `${publicUrl.value}?embed=1&booking=1&src=website`)
const widgetCode = computed(() => `<iframe src="${widgetUrl.value}" title="Cuebooker booking" loading="lazy" style="width:100%;height:760px;border:0;" sandbox="allow-scripts allow-forms allow-same-origin"></iframe>`)

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'PERFIL PÚBLICO', title: 'Tu puerta de entrada.',
  body: 'Comparte tu perfil donde ya está tu gente. Cada solicitud termina en el mismo Booking Core, venga de donde venga.',
  published: 'Perfil publicado', unpublished: 'Perfil privado', accepting: 'Aceptar solicitudes', closed: 'Booking cerrado',
  preview: 'Vista previa', copyBooking: 'Copiar enlace de solicitud', copied: 'Copiado', live: 'Abrir perfil',
  publishHint: 'Publicar hace visible tu ficha. Abrir booking permite recibir solicitudes sin que el promotor tenga que registrarse.',
  share: 'Distribución', shareTitle: 'Lleva tu booking a los canales que ya utilizas.',
  shareBody: 'No necesitas crear formularios distintos. Cuebooker genera una entrada adaptada a cada canal y conserva su procedencia.',
  bookingClosedHint: 'Activa “Aceptar solicitudes” para usar las entradas que llevan directamente al formulario.',
  profileGroup: 'Perfil', bookingGroup: 'Solicitudes directas', embedGroup: 'Tu web',
  publicProfile: 'Perfil público', directBooking: 'Solicitud directa', widget: 'Widget web',
  instagram: 'Instagram', whatsapp: 'WhatsApp Business', website: 'Enlace web', epk: 'EPK', qr: 'QR', email: 'Email', linkInBio: 'Link in bio',
  profileDesc: 'Tu landing pública como artista. Úsala como perfil profesional o presentación.',
  bookingDesc: 'Comparte este enlace cuando ya estás hablando con un promotor y quieres pasar la conversación a una solicitud estructurada.',
  instagramDesc: 'Para bio, stories, DM o enlaces del perfil. Las entradas quedan atribuidas a Instagram.',
  whatsappDesc: 'Para el perfil de WhatsApp Business, respuestas rápidas o conversaciones con promotores.',
  websiteDesc: 'Enlace directo desde botones o CTAs de tu web actual.',
  widgetDesc: 'Código para incrustar el formulario de Cuebooker dentro de tu propia web.',
  epkDesc: 'Añádelo a tu EPK para convertir una presentación en una vía directa de booking.',
  qrDesc: 'Entrada preparada para QR. La generación visual del código llegará en el siguiente bloque.',
  emailDesc: 'Inclúyelo en firma, propuestas o respuestas de booking por email.',
  linkInBioDesc: 'Para servicios de link-in-bio u otras páginas de enlaces.',
  copyLink: 'Copiar enlace', copyCode: 'Copiar código', prepared: 'Preparado', attribution: 'Procedencia',
  profileStatus: 'Visible para cualquiera con el enlace', bookingStatus: 'Entra directamente al formulario', widgetStatus: 'Se incrusta en tu web'
} : {
  eyebrow: 'PUBLIC PROFILE', title: 'Your booking front door.',
  body: 'Share your profile where your audience already is. Every enquiry lands in the same Booking Core, regardless of where it starts.',
  published: 'Profile published', unpublished: 'Profile private', accepting: 'Accept enquiries', closed: 'Booking closed',
  preview: 'Preview', copyBooking: 'Copy enquiry link', copied: 'Copied', live: 'Open profile',
  publishHint: 'Publishing makes your profile visible. Opening booking lets promoters send enquiries without creating an account.',
  share: 'Distribution', shareTitle: 'Bring booking into the channels you already use.',
  shareBody: 'You do not need separate forms. Cuebooker gives each channel its own entry point while keeping attribution.',
  bookingClosedHint: 'Turn on “Accept enquiries” to use entry points that open the booking form directly.',
  profileGroup: 'Profile', bookingGroup: 'Direct enquiries', embedGroup: 'Your website',
  publicProfile: 'Public profile', directBooking: 'Direct enquiry', widget: 'Website widget',
  instagram: 'Instagram', whatsapp: 'WhatsApp Business', website: 'Website link', epk: 'EPK', qr: 'QR', email: 'Email', linkInBio: 'Link in bio',
  profileDesc: 'Your public artist landing page. Use it as a professional profile or presentation.',
  bookingDesc: 'Share this when you are already talking to a promoter and want to turn the conversation into a structured enquiry.',
  instagramDesc: 'For bio, stories, DMs or profile links. Enquiries stay attributed to Instagram.',
  whatsappDesc: 'For WhatsApp Business profile links, quick replies or promoter conversations.',
  websiteDesc: 'Direct booking link for buttons or CTAs on your existing website.',
  widgetDesc: 'Embed code for placing the Cuebooker form inside your own website.',
  epkDesc: 'Add it to your EPK so a presentation can turn directly into a booking enquiry.',
  qrDesc: 'Entry point prepared for QR. Visual QR generation comes in the next block.',
  emailDesc: 'Use it in your signature, proposals or booking email replies.',
  linkInBioDesc: 'For link-in-bio services or other link pages.',
  copyLink: 'Copy link', copyCode: 'Copy code', prepared: 'Ready', attribution: 'Attribution',
  profileStatus: 'Visible to anyone with the link', bookingStatus: 'Opens the booking form directly', widgetStatus: 'Embeds inside your website'
})

function attributedBookingUrl(source: string) {
  return `${publicUrl.value}?booking=1&src=${encodeURIComponent(source)}`
}

const shareLinks = computed(() => [
  {
    key: 'profile', group: 'profile', label: copy.value.publicProfile, description: copy.value.profileDesc,
    value: publicUrl.value, needsBooking: false, action: copy.value.copyLink, meta: copy.value.profileStatus
  },
  {
    key: 'booking', group: 'booking', label: copy.value.directBooking, description: copy.value.bookingDesc,
    value: bookingUrl.value, needsBooking: true, action: copy.value.copyLink, meta: copy.value.bookingStatus
  },
  {
    key: 'instagram', group: 'booking', label: copy.value.instagram, description: copy.value.instagramDesc,
    value: attributedBookingUrl('instagram'), needsBooking: true, action: copy.value.copyLink, meta: `${copy.value.attribution}: instagram`
  },
  {
    key: 'whatsapp', group: 'booking', label: copy.value.whatsapp, description: copy.value.whatsappDesc,
    value: attributedBookingUrl('whatsapp'), needsBooking: true, action: copy.value.copyLink, meta: `${copy.value.attribution}: whatsapp`
  },
  {
    key: 'email', group: 'booking', label: copy.value.email, description: copy.value.emailDesc,
    value: attributedBookingUrl('email'), needsBooking: true, action: copy.value.copyLink, meta: `${copy.value.attribution}: email`
  },
  {
    key: 'epk', group: 'booking', label: copy.value.epk, description: copy.value.epkDesc,
    value: attributedBookingUrl('epk'), needsBooking: true, action: copy.value.copyLink, meta: `${copy.value.attribution}: epk`
  },
  {
    key: 'link_in_bio', group: 'booking', label: copy.value.linkInBio, description: copy.value.linkInBioDesc,
    value: attributedBookingUrl('link_in_bio'), needsBooking: true, action: copy.value.copyLink, meta: `${copy.value.attribution}: link_in_bio`
  },
  {
    key: 'qr', group: 'booking', label: copy.value.qr, description: copy.value.qrDesc,
    value: attributedBookingUrl('qr'), needsBooking: true, action: copy.value.copyLink, meta: `${copy.value.attribution}: qr`
  },
  {
    key: 'website', group: 'embed', label: copy.value.website, description: copy.value.websiteDesc,
    value: attributedBookingUrl('website'), needsBooking: true, action: copy.value.copyLink, meta: `${copy.value.attribution}: website`
  },
  {
    key: 'widget', group: 'embed', label: copy.value.widget, description: copy.value.widgetDesc,
    value: widgetCode.value, needsBooking: true, action: copy.value.copyCode, meta: copy.value.widgetStatus
  }
])

const shareGroups = computed(() => [
  { key: 'profile', title: copy.value.profileGroup, items: shareLinks.value.filter(item => item.group === 'profile') },
  { key: 'booking', title: copy.value.bookingGroup, items: shareLinks.value.filter(item => item.group === 'booking') },
  { key: 'embed', title: copy.value.embedGroup, items: shareLinks.value.filter(item => item.group === 'embed') }
])

function checkboxValue(event: Event) {
  return (event.currentTarget as HTMLInputElement).checked
}

function changePublished(event: Event) {
  emit('updatePublished', checkboxValue(event))
}

function changeAcceptingRequests(event: Event) {
  emit('updateAcceptingRequests', checkboxValue(event))
}

async function copyLink(key: string, value: string) {
  if (!import.meta.client || !props.published) return
  await navigator.clipboard.writeText(value)
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
        {{ copiedKey === 'booking-main' ? copy.copied : copy.copyBooking }}
      </button>
      <button type="button" :disabled="!published" :aria-expanded="shareOpen" @click="shareOpen = !shareOpen">
        {{ copy.share }} <span class="arrow arrow--ne" aria-hidden="true" />
      </button>
      <a v-if="published" :href="publicUrl" target="_blank" rel="noopener noreferrer">{{ copy.live }} <span class="arrow arrow--ne" aria-hidden="true" /></a>
    </div>

    <div v-if="shareOpen" class="public-profile-controls__share">
      <div class="public-profile-controls__share-intro">
        <strong>{{ copy.shareTitle }}</strong>
        <p>{{ copy.shareBody }}</p>
        <small v-if="!acceptingRequests">{{ copy.bookingClosedHint }}</small>
      </div>

      <div class="public-profile-controls__groups">
        <section v-for="group in shareGroups" :key="group.key" class="public-profile-controls__group">
          <h3>{{ group.title }}</h3>
          <div class="public-profile-controls__share-grid">
            <article v-for="link in group.items" :key="link.key" class="public-profile-controls__channel">
              <div>
                <span class="public-profile-controls__channel-title"><i aria-hidden="true">{{ ({ profile: 'ID', booking: 'REQ', instagram: 'IG', whatsapp: 'WA', email: '@', epk: 'EPK', link_in_bio: 'BIO', qr: 'QR', website: 'WEB', widget: '&lt;&gt;' } as Record<string,string>)[link.key] }}</i>{{ link.label }}</span>
                <p>{{ link.description }}</p>
                <small>{{ link.meta }}</small>
              </div>
              <button
                type="button"
                :disabled="!published || (link.needsBooking && !acceptingRequests)"
                @click="copyLink(link.key, link.value)"
              >
                {{ copiedKey === link.key ? copy.copied : link.action }}
              </button>
            </article>
          </div>
        </section>
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
.public-profile-controls__actions button:focus-visible, .public-profile-controls__actions a:focus-visible, .public-profile-controls__channel button:focus-visible { outline: 2px solid var(--cue-accent); outline-offset: 2px; }
.public-profile-controls__share { grid-column:1 / -1; display:grid; grid-template-columns:minmax(190px,.22fr) minmax(0,.78fr); gap:18px; padding-top:18px; border-top:1px solid var(--cue-border); }
.public-profile-controls__share-intro > strong { display: block; font-size: 15px; line-height: 1.15; text-transform: uppercase; }
.public-profile-controls__share-intro p { margin: 8px 0; color: var(--cue-muted); font-size: 12px; line-height: 1.5; }
.public-profile-controls__share-intro small { color: var(--cue-dim); font-size: 10px; line-height: 1.4; }
.public-profile-controls__groups { display: grid; gap: 22px; }
.public-profile-controls__group h3 { margin:0 0 12px; color:var(--cue-accent); font:900 11px/1.2 monospace; letter-spacing:.12em; text-transform:uppercase; }
.public-profile-controls__share-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.public-profile-controls__channel { display: flex; flex-direction: column; justify-content: space-between; min-width: 0; min-height: 138px; padding: 14px; border: 1px solid var(--cue-border); background: var(--cue-bg); }
.public-profile-controls__channel-title { display:flex; align-items:center; gap:9px; font:900 11px/1.2 monospace; text-transform:uppercase; }
.public-profile-controls__channel-title i { display:grid; place-items:center; min-width:32px; height:32px; padding:0 6px; border:1px solid color-mix(in srgb,var(--cue-accent) 55%,var(--cue-border)); color:var(--cue-accent); font:900 8px/1 monospace; font-style:normal; }
.public-profile-controls__channel p { margin: 8px 0 10px; color: var(--cue-muted); font-size: 11px; line-height: 1.45; }
.public-profile-controls__channel small { display: block; color: var(--cue-dim); font: 9px/1.3 monospace; }
.public-profile-controls__channel button { align-self: flex-start; min-height: 34px; margin-top: 14px; padding: 0 10px; border: 1px solid var(--cue-border); background: transparent; color: var(--cue-text); cursor: pointer; font: 800 9px/1 monospace; text-transform: uppercase; }
.public-profile-controls__channel button:hover:not(:disabled) { border-color: var(--cue-accent); color: var(--cue-accent); }
.public-profile-controls__channel button:disabled { cursor: default; opacity: .4; }
@media (max-width: 760px) {
  .public-profile-controls { grid-template-columns: 1fr; padding: 16px; }
  .public-profile-controls__actions, .public-profile-controls__share { grid-column: 1; }
  .public-profile-controls__share { grid-template-columns: 1fr; }
}
@media (max-width: 520px) {
  .public-profile-controls__share-grid { grid-template-columns: 1fr; }
  .public-profile-controls__channel { min-height: 0; }
}
</style>
