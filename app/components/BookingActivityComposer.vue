<script setup lang="ts">
import type { ActivityDirection, ActivityType, CoreBooking } from '../domain/bookingCore'

const props = defineProps<{
  workspaceId: string
  booking: CoreBooking
  locale: 'es' | 'en'
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
  title: 'Registrar actividad',
  note: 'Nota', phone: 'Llamada', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram',
  inbound: 'Entrante', outbound: 'Saliente', internal: 'Interna',
  placeholder: 'Ej. Héctor confirma que el horario llega mañana.',
  emailPlaceholder: 'Escribe el email que quieres enviar desde este booking.',
  subject: 'Asunto del email',
  subjectPlaceholder: 'Re: booking / fecha / condiciones',
  save: 'Añadir a Activity', sendEmail: 'Enviar email', saving: 'Guardando…', sending: 'Enviando…', required: 'Escribe qué ha pasado.', subjectRequired: 'Añade un asunto para enviar el email.',
  sent: 'Email enviado y guardado en Activity.',
  noContactEmail: 'Este booking necesita un contacto con email antes de poder enviar.',
  providerMissing: 'El proveedor de email todavía no está configurado en staging.',
  replyDomainMissing: 'El dominio de respuestas de email todavía no está configurado en staging.',
  sendError: 'No se ha podido enviar el email.'
} : {
  title: 'Log activity',
  note: 'Note', phone: 'Call', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram',
  inbound: 'Inbound', outbound: 'Outbound', internal: 'Internal',
  placeholder: 'E.g. Hector confirms the schedule arrives tomorrow.',
  emailPlaceholder: 'Write the email you want to send from this booking.',
  subject: 'Email subject',
  subjectPlaceholder: 'Re: booking / date / terms',
  save: 'Add to Activity', sendEmail: 'Send email', saving: 'Saving…', sending: 'Sending…', required: 'Write what happened.', subjectRequired: 'Add a subject before sending the email.',
  sent: 'Email sent and saved to Activity.',
  noContactEmail: 'This booking needs a contact with an email before sending.',
  providerMissing: 'The email provider is not configured in staging yet.',
  replyDomainMissing: 'The email reply domain is not configured in staging yet.',
  sendError: 'The email could not be sent.'
})

const types = computed<Array<{ value: ActivityType; label: string }>>(() => [
  { value: 'note', label: copy.value.note },
  { value: 'phone', label: copy.value.phone },
  { value: 'whatsapp', label: copy.value.whatsapp },
  { value: 'email', label: copy.value.email },
  { value: 'instagram', label: copy.value.instagram }
])

const sendsRealEmail = computed(() => type.value === 'email' && direction.value === 'outbound')

watch(type, value => {
  successMessage.value = ''
  errorMessage.value = ''
  if (value === 'note') direction.value = 'internal'
  else if (direction.value === 'internal') direction.value = 'inbound'
})

watch(direction, () => {
  successMessage.value = ''
  errorMessage.value = ''
})

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
      <strong>{{ copy.title }}</strong>
      <div class="activity-composer__types">
        <button v-for="item in types" :key="item.value" type="button" :class="{ active: type === item.value }" @click="type = item.value">{{ item.label }}</button>
      </div>
    </div>
    <div class="activity-composer__body" :class="{ 'activity-composer__body--email': sendsRealEmail }">
      <input v-if="sendsRealEmail" v-model="subject" class="activity-composer__subject" :aria-label="copy.subject" :placeholder="copy.subjectPlaceholder" maxlength="300">
      <textarea v-model="body" rows="2" :placeholder="sendsRealEmail ? copy.emailPlaceholder : copy.placeholder" />
      <select v-if="type !== 'note'" v-model="direction" aria-label="Direction"><option value="inbound">{{ copy.inbound }}</option><option value="outbound">{{ copy.outbound }}</option></select>
      <button class="activity-composer__save" type="submit" :disabled="saving">{{ saving ? (sendsRealEmail ? copy.sending : copy.saving) : (sendsRealEmail ? copy.sendEmail : copy.save) }}</button>
    </div>
    <p v-if="errorMessage" class="activity-composer__error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="activity-composer__success" aria-live="polite">{{ successMessage }}</p>
  </form>
</template>

<style scoped>
.activity-composer { margin-top:16px; border:1px solid var(--cue-border); background:var(--cue-raised); }
.activity-composer__top { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 10px; border-bottom:1px solid var(--cue-border); }
.activity-composer__top > strong { font:700 9px monospace; text-transform:uppercase; letter-spacing:.08em; }
.activity-composer__types { display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end; }
.activity-composer__types button { min-height:28px; padding:0 8px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; }
.activity-composer__types button.active { border-color:var(--cue-accent); color:var(--cue-accent); }
.activity-composer__body { display:grid; grid-template-columns:minmax(0,1fr) 105px auto; gap:7px; padding:9px; }
.activity-composer__body--email { grid-template-columns:minmax(0,1fr) 105px auto; }
.activity-composer__subject { grid-column:1 / -1; min-height:36px; }
.activity-composer textarea, .activity-composer select, .activity-composer__subject { box-sizing:border-box; border:1px solid var(--cue-border); background:var(--cue-surface); color:var(--cue-text); padding:8px 9px; font-size:11px; }
.activity-composer textarea { resize:vertical; min-height:54px; }
.activity-composer select { min-height:36px; }
.activity-composer__save { min-height:36px; align-self:end; padding:0 11px; border:1px solid var(--cue-accent); background:var(--cue-accent); color:#080808; cursor:pointer; font:700 8px monospace; text-transform:uppercase; }
.activity-composer__error, .activity-composer__success { margin:0; padding:0 9px 9px; font-size:10px; }
.activity-composer__error { color:#ff7c7c; }
.activity-composer__success { color:var(--cue-accent); }
@media (max-width:680px) { .activity-composer__top { align-items:flex-start; flex-direction:column; } .activity-composer__types { justify-content:flex-start; } .activity-composer__body, .activity-composer__body--email { grid-template-columns:1fr; } .activity-composer__subject { grid-column:1; } }
</style>