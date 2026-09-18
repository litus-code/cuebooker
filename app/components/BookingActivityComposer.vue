<script setup lang="ts">
import type { ActivityDirection, ActivityType, CoreBooking } from '../domain/bookingCore'

const props = defineProps<{
  workspaceId: string
  booking: CoreBooking
  locale: 'es' | 'en'
  suggestedFollowUp?: { subject: string; body: string } | null
  suggestedRetryEmail?: { subject: string; body: string; recipientChanged: boolean } | null
}>()

const emit = defineEmits<{ created: [] }>()
const bookingCore = useBookingCore()
const bookingEmail = useBookingEmail()
const type = ref<ActivityType>('note')
const direction = ref<ActivityDirection>('internal')
const subject = ref('')
const body = ref('')
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const copy = computed(() => props.locale === 'es' ? {
  title: 'Registrar interacción',
  help: 'Nota guarda memoria interna. Llamada, WhatsApp e Instagram registran una conversación. Email envía desde Cuebooker.',
  note: 'Nota', phone: 'Llamada', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram',
  inbound: 'Me contactaron', outbound: 'Contacté yo', internal: 'Interna',
  placeholder: 'Ej. Héctor confirma que el horario llega mañana.',
  emailPlaceholder: 'Escribe el email que quieres enviar desde este booking.',
  subject: 'Asunto del email',
  subjectPlaceholder: 'Re: booking / fecha / condiciones',
  save: 'Añadir a Activity', sendEmail: 'Enviar email', saving: 'Guardando…', sending: 'Enviando…', required: 'Escribe qué ha pasado.', subjectRequired: 'Añade un asunto para enviar el email.',
  sent: 'Email enviado y guardado en Activity.',
  noContactEmail: 'Este booking necesita un contacto con email antes de poder enviar.',
  providerMissing: 'El proveedor de email todavía no está configurado en staging.',
  replyDomainMissing: 'El dominio de respuestas de email todavía no está configurado en staging.',
  sendError: 'No se ha podido enviar el email.',
  prepareFollowUp: 'Preparar seguimiento',
  followUpHint: 'Cuebooker ha preparado un borrador. Revísalo antes de enviarlo.',
  prepareRetry: 'Preparar reintento',
  retryHint: 'El último email falló. Cuebooker puede recuperar el mismo mensaje para que lo revises y decidas si reenviarlo.',
  retryUpdatedRecipient: 'El email del contacto ha cambiado desde el envío fallido. El reintento usará el email actualizado.'
} : {
  title: 'Log interaction',
  help: 'Note keeps internal memory. Call, WhatsApp and Instagram log a conversation. Email sends from Cuebooker.',
  note: 'Note', phone: 'Call', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram',
  inbound: 'They contacted me', outbound: 'I contacted them', internal: 'Internal',
  placeholder: 'E.g. Hector confirms the schedule arrives tomorrow.',
  emailPlaceholder: 'Write the email you want to send from this booking.',
  subject: 'Email subject',
  subjectPlaceholder: 'Re: booking / date / terms',
  save: 'Add to Activity', sendEmail: 'Send email', saving: 'Saving…', sending: 'Sending…', required: 'Write what happened.', subjectRequired: 'Add a subject before sending the email.',
  sent: 'Email sent and saved to Activity.',
  noContactEmail: 'This booking needs a contact with an email before sending.',
  providerMissing: 'The email provider is not configured in staging yet.',
  replyDomainMissing: 'The email reply domain is not configured in staging yet.',
  sendError: 'The email could not be sent.',
  prepareFollowUp: 'Prepare follow-up',
  followUpHint: 'Cuebooker prepared a draft. Review it before sending.',
  prepareRetry: 'Prepare retry',
  retryHint: 'The latest email failed. Cuebooker can restore the same message so you can review it and decide whether to resend.',
  retryUpdatedRecipient: 'The contact email changed after the failed send. The retry will use the updated email.'
})

const types = computed<Array<{ value: ActivityType; label: string }>>(() => [
  { value: 'note', label: copy.value.note },
  { value: 'phone', label: copy.value.phone },
  { value: 'whatsapp', label: copy.value.whatsapp },
  { value: 'email', label: copy.value.email },
  { value: 'instagram', label: copy.value.instagram }
])

const sendsRealEmail = computed(() => type.value === 'email')

watch(type, value => {
  successMessage.value = ''
  errorMessage.value = ''
  if (value === 'note') direction.value = 'internal'
  else if (value === 'email') direction.value = 'outbound'
  else if (direction.value === 'internal') direction.value = 'inbound'
})

watch(direction, () => {
  successMessage.value = ''
  errorMessage.value = ''
})

function applyEmailDraft(draft: { subject: string; body: string } | null | undefined) {
  if (!draft) return
  type.value = 'email'
  direction.value = 'outbound'
  subject.value = draft.subject
  body.value = draft.body
  successMessage.value = ''
  errorMessage.value = ''
}

function applySuggestedFollowUp() {
  applyEmailDraft(props.suggestedFollowUp)
}

function applySuggestedRetry() {
  applyEmailDraft(props.suggestedRetryEmail)
}

function localEmailError(code: string) {
  if (code === 'contact_email_required' || code === 'booking_contact_required') return copy.value.noContactEmail
  if (code === 'email_provider_not_configured') return copy.value.providerMissing
  if (code === 'email_reply_domain_not_configured') return copy.value.replyDomainMissing
  return copy.value.sendError
}

async function submit() {
  const text = body.value.trim()
  if (!text) { errorMessage.value = copy.value.required; return }
  if (sendsRealEmail.value && !subject.value.trim()) { errorMessage.value = copy.value.subjectRequired; return }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    if (sendsRealEmail.value) {
      await bookingEmail.sendBookingEmail({
        workspaceId: props.workspaceId,
        bookingId: props.booking.id,
        contactId: props.booking.primary_contact_id,
        subject: subject.value,
        bodyText: text
      })
      subject.value = ''
      body.value = ''
      successMessage.value = copy.value.sent
      emit('created')
      return
    }

    await bookingCore.createActivity({
      workspaceId: props.workspaceId,
      bookingId: props.booking.id,
      type: type.value,
      direction: type.value === 'note' ? 'internal' : direction.value,
      contactId: props.booking.primary_contact_id,
      body: text
    })
    body.value = ''
    emit('created')
  } catch (error: any) {
    errorMessage.value = sendsRealEmail.value
      ? localEmailError(error?.message || '')
      : (error?.message || copy.value.required)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="activity-composer" @submit.prevent="submit">
    <div class="activity-composer__top">
      <div class="activity-composer__intro"><strong>{{ copy.title }}</strong><small>{{ copy.help }}</small></div>
      <div class="activity-composer__types">
        <button v-for="item in types" :key="item.value" type="button" :class="{ active: type === item.value }" @click="type = item.value">{{ item.label }}</button>
      </div>
    </div>
    <div v-if="suggestedRetryEmail" class="activity-composer__suggestion activity-composer__suggestion--warning">
      <div><strong>{{ copy.prepareRetry }}</strong><small>{{ suggestedRetryEmail.recipientChanged ? copy.retryUpdatedRecipient : copy.retryHint }}</small></div>
      <button type="button" @click="applySuggestedRetry">{{ copy.prepareRetry }}</button>
    </div>
    <div v-else-if="suggestedFollowUp" class="activity-composer__suggestion">
      <div><strong>{{ copy.prepareFollowUp }}</strong><small>{{ copy.followUpHint }}</small></div>
      <button type="button" @click="applySuggestedFollowUp">{{ copy.prepareFollowUp }}</button>
    </div>
    <div class="activity-composer__body" :class="{ 'activity-composer__body--email': sendsRealEmail }">
      <input v-if="sendsRealEmail" v-model="subject" class="activity-composer__subject" :aria-label="copy.subject" :placeholder="copy.subjectPlaceholder" maxlength="300">
      <textarea v-model="body" rows="2" :placeholder="sendsRealEmail ? copy.emailPlaceholder : copy.placeholder" />
      <select v-if="type !== 'note' && type !== 'email'" v-model="direction" aria-label="Direction"><option value="inbound">{{ copy.inbound }}</option><option value="outbound">{{ copy.outbound }}</option></select>
      <div v-else-if="type === 'email'" class="activity-composer__email-route">{{ locale === 'es' ? 'Tú → contacto' : 'You → contact' }}</div>
      <button class="activity-composer__save" type="submit" :disabled="saving">{{ saving ? (sendsRealEmail ? copy.sending : copy.saving) : (sendsRealEmail ? copy.sendEmail : copy.save) }}</button>
    </div>
    <p v-if="errorMessage" class="activity-composer__error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="activity-composer__success" aria-live="polite">{{ successMessage }}</p>
  </form>
</template>

<style scoped>
.activity-composer { margin-top:16px; border:1px solid var(--cue-border); background:var(--cue-raised); }
.activity-composer__top { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 10px; border-bottom:1px solid var(--cue-border); }
.activity-composer__intro { display:grid; gap:4px; max-width:430px; }
.activity-composer__intro > strong { font:700 9px monospace; text-transform:uppercase; letter-spacing:.08em; }
.activity-composer__intro > small { color:var(--cue-muted); font-size:9px; line-height:1.4; }
.activity-composer__types { display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end; }
.activity-composer__types button { min-height:28px; padding:0 8px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; }
.activity-composer__types button.active { border-color:var(--cue-accent); color:var(--cue-accent); }
.activity-composer__suggestion { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px; border-bottom:1px solid var(--cue-border); background:color-mix(in srgb,var(--cue-accent) 5%,transparent); }
.activity-composer__suggestion--warning { background:color-mix(in srgb,#ffb84d 7%,transparent); }
.activity-composer__suggestion--warning strong { color:#ffb84d; }
.activity-composer__suggestion--warning button { border-color:#ffb84d; color:#ffb84d; }
.activity-composer__suggestion > div { display:grid; gap:3px; }
.activity-composer__suggestion strong { color:var(--cue-accent); font:800 9px monospace; text-transform:uppercase; }
.activity-composer__suggestion small { color:var(--cue-muted); font-size:9px; line-height:1.4; }
.activity-composer__suggestion button { min-height:32px; padding:0 10px; border:1px solid var(--cue-accent); background:transparent; color:var(--cue-accent); cursor:pointer; font:800 8px monospace; text-transform:uppercase; }
.activity-composer__body { display:grid; grid-template-columns:minmax(0,1fr) 130px 150px; gap:8px; align-items:end; padding:10px; }
.activity-composer__body--email { grid-template-columns:minmax(0,1fr) 130px 150px; }
.activity-composer__subject { grid-column:1 / -1; min-height:36px; }
.activity-composer textarea, .activity-composer select, .activity-composer__subject { box-sizing:border-box; border:1px solid var(--cue-border); background:var(--cue-surface); color:var(--cue-text); padding:8px 9px; font-size:11px; }
.activity-composer__email-route { display:grid; place-items:center; min-height:42px; padding:0 10px; border:1px solid var(--cue-border); color:var(--cue-muted); font:800 8px monospace; text-transform:uppercase; }
.activity-composer textarea { resize:vertical; min-height:58px; }
.activity-composer select { width:100%; min-height:42px; padding-inline:10px; }
.activity-composer__save { width:100%; min-height:42px; align-self:end; padding:0 11px; border:1px solid var(--cue-accent); background:var(--cue-accent); color:#080808; cursor:pointer; font:700 8px monospace; text-transform:uppercase; }
.activity-composer__error, .activity-composer__success { margin:0; padding:0 9px 9px; font-size:10px; }
.activity-composer__error { color:#ff7c7c; }
.activity-composer__success { color:var(--cue-accent); }
@media (max-width:680px) { .activity-composer__top { align-items:flex-start; flex-direction:column; } .activity-composer__suggestion { align-items:flex-start; flex-direction:column; } .activity-composer__types { justify-content:flex-start; } .activity-composer__body, .activity-composer__body--email { grid-template-columns:1fr; } .activity-composer__subject { grid-column:1; } }
</style>