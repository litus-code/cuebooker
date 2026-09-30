<script setup lang="ts">
import type { ActivityDirection, ActivityType, CoreBooking } from '../domain/bookingCore'

const props = defineProps<{
  workspaceId: string
  booking: CoreBooking
  locale: 'es' | 'en'
  initialSubject?: string
  suggestedFollowUp?: { subject: string; body: string } | null
  suggestedRetryEmail?: { subject: string; body: string; recipientChanged: boolean } | null
}>()

const emit = defineEmits<{ created: [] }>()
const bookingCore = useBookingCore()
const bookingEmail = useBookingEmail()
const mailboxApi = useConnectedMailbox()
const mailboxes = ref<Array<{id:string;email:string;status:string}>>([])
const senderId = ref('')
const senderLoading = ref(false)
const senderError = ref(false)
const sendUncertain = ref(false)
let sendRequestId = ''
let mailboxGeneration = 0
const analytics = useAnalytics()
const { can: canEntitlement } = useCueEntitlements()
const type = ref<ActivityType>('email')
const direction = ref<ActivityDirection>('outbound')
const subject = ref('')
watch(()=>props.initialSubject,value=>{if(value&&!subject.value)subject.value=/^re:/i.test(value)?value:`Re: ${value}`},{immediate:true})
const body = ref('')
const channelDrafts = reactive<Record<'email' | 'whatsapp' | 'instagram' | 'phone' | 'note', string>>({
  email: '',
  whatsapp: '',
  instagram: '',
  phone: '',
  note: ''
})
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
watch(() => [props.workspaceId,props.booking.id], async ([workspace,booking]) => {
 const generation=++mailboxGeneration
 senderLoading.value=true;senderError.value=false
 mailboxes.value=[];senderId.value=''
 try {const result=await mailboxApi.status(workspace,booking);if(generation===mailboxGeneration){mailboxes.value=result.connections.filter(c=>c.status==='connected');senderId.value=result.linkedConnectionIds?.[0]||mailboxes.value[0]?.id||''}}
 catch {if(generation===mailboxGeneration){senderError.value=true;errorMessage.value=props.locale==='es'?'No se pudo comprobar tu correo. Recarga antes de enviar.':'Could not check your mailbox. Reload before sending.'}}
 finally {if(generation===mailboxGeneration)senderLoading.value=false}
},{immediate:true})
watch(() => props.booking.id,()=>{sendRequestId='';sendUncertain.value=false;subject.value='';body.value=''})


const copy = computed(() => props.locale === 'es' ? {
  title: 'Responder o añadir una nota',
  help: 'Responde por email. Las notas son internas; otros canales permiten registrar una interacción manual.',
  note: 'Nota', phone: 'Llamada', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram',
  inbound: 'Me contactaron', outbound: 'Contacté yo', internal: 'Interna',
  placeholder: 'Ej. Héctor confirma que el horario llega mañana.',
  emailPlaceholder: 'Escribe el email que quieres enviar desde este booking.',
  subject: 'Asunto del email',
  subjectPlaceholder: 'Re: booking / fecha / condiciones',
  save: 'Añadir a Activity', sendEmail: 'Enviar email', saving: 'Guardando…', sending: 'Enviando…', required: 'Escribe qué ha pasado.', subjectRequired: 'Añade un asunto para enviar el email.',
  saved: 'Interacción guardada en Activity.',
  saveError: 'No se ha podido guardar la interacción.',
  sent: 'Email enviado al proveedor y guardado en Activity. El estado de entrega se actualizará en el hilo.',
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
  title: 'Reply or add a note',
  help: 'Reply by email. Notes are internal; other channels let you manually record an interaction.',
  note: 'Note', phone: 'Call', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram',
  inbound: 'They contacted me', outbound: 'I contacted them', internal: 'Internal',
  placeholder: 'E.g. Hector confirms the schedule arrives tomorrow.',
  emailPlaceholder: 'Write the email you want to send from this booking.',
  subject: 'Email subject',
  subjectPlaceholder: 'Re: booking / date / terms',
  save: 'Add to Activity', sendEmail: 'Send email', saving: 'Saving…', sending: 'Sending…', required: 'Write what happened.', subjectRequired: 'Add a subject before sending the email.',
  saved: 'Interaction saved to Activity.',
  saveError: 'The interaction could not be saved.',
  sent: 'Email sent to the provider and saved to Activity. Delivery status will update in the thread.',
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
  { value: 'email', label: copy.value.email },
  { value: 'note', label: copy.value.note }
])

const sendsRealEmail = computed(() => type.value === 'email')

watch(type, (value, previousValue) => {
  successMessage.value = ''
  errorMessage.value = ''

  if (previousValue && previousValue in channelDrafts) {
    channelDrafts[previousValue as keyof typeof channelDrafts] = body.value
  }
  body.value = channelDrafts[value as keyof typeof channelDrafts] || ''

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
  channelDrafts.email = draft.body
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
  if (code === 'thread_mailbox_required') return props.locale==='es'?'Responde desde el buzón conectado a esta conversación.':'Reply from the mailbox linked to this conversation.'
  if (code === 'contact_email_required' || code === 'booking_contact_required') return copy.value.noContactEmail
  if (code === 'email_provider_not_configured') return copy.value.providerMissing
  if (code === 'email_reply_domain_not_configured') return copy.value.replyDomainMissing
  return copy.value.sendError
}

async function submit() {
  if (saving.value) return

  const submittedType = type.value
  const submittedDirection: ActivityDirection = submittedType === 'note' ? 'internal' : direction.value
  const submittedSubject = subject.value.trim()
  const text = body.value.trim()
  const submittedAsEmail = submittedType === 'email'

  if (!text) { errorMessage.value = copy.value.required; return }
  if (submittedAsEmail && !submittedSubject) { errorMessage.value = copy.value.subjectRequired; return }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    if (submittedAsEmail) {
      if(senderLoading.value||senderError.value||sendUncertain.value) return
      if(senderId.value){
       sendRequestId ||= crypto.randomUUID()
       await mailboxApi.send({workspaceId:props.workspaceId,bookingId:props.booking.id,connectionId:senderId.value,subject:submittedSubject,bodyText:text,requestId:sendRequestId})
       sendRequestId=''
      } else await bookingEmail.sendBookingEmail({
        workspaceId: props.workspaceId,
        bookingId: props.booking.id,
        contactId: props.booking.primary_contact_id,
        subject: submittedSubject,
        bodyText: text
      })
      subject.value = ''
      body.value = ''
      channelDrafts.email = ''
      successMessage.value = copy.value.sent
      analytics.track('booking_response_sent', { channel: 'email' })
      emit('created')
      return
    }

    await bookingCore.createActivity({
      workspaceId: props.workspaceId,
      bookingId: props.booking.id,
      type: submittedType,
      direction: submittedDirection,
      contactId: props.booking.primary_contact_id,
      body: text
    })
    body.value = ''
    channelDrafts[submittedType as keyof typeof channelDrafts] = ''
    successMessage.value = copy.value.saved
    emit('created')
  } catch (error: any) {
    if(['email_send_uncertain','email_send_already_attempted'].includes(error?.message)){
     sendUncertain.value=true
     errorMessage.value=props.locale==='es'?'No podemos confirmar el envío. Comprueba Enviados en tu correo antes de volver a enviar.':'Delivery could not be confirmed. Check Sent in your mailbox before sending again.'
     return
    }
    errorMessage.value = submittedAsEmail
      ? localEmailError(error?.message || '')
      : copy.value.saveError
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
        <details><summary>{{ locale === 'es' ? 'Registrar otro canal' : 'Log another channel' }}</summary><button v-for="channel in ['whatsapp','instagram','phone'] as const" :key="channel" type="button" :disabled="saving" @click="type=channel">{{ copy[channel] }} · {{ locale === 'es' ? 'manual' : 'manual' }}</button></details>
        <button v-for="item in types" :key="item.value" type="button" :class="{ active: type === item.value }" :disabled="saving" @click="type = item.value">{{ item.label }}</button>
      </div>
    </div>
    <div v-if="suggestedRetryEmail" class="activity-composer__suggestion activity-composer__suggestion--warning">
      <div><strong>{{ copy.prepareRetry }}</strong><small>{{ suggestedRetryEmail.recipientChanged ? copy.retryUpdatedRecipient : copy.retryHint }}</small></div>
      <button type="button" :disabled="saving" @click="applySuggestedRetry">{{ copy.prepareRetry }}</button>
    </div>
    <div v-else-if="suggestedFollowUp && canEntitlement('automation.advanced')" class="activity-composer__suggestion">
      <div>
        <strong>{{ copy.prepareFollowUp }} <CuePlanBadge entitlement="automation.advanced" /></strong>
        <small>{{ copy.followUpHint }}</small>
      </div>
      <button type="button" :disabled="saving" @click="applySuggestedFollowUp">{{ copy.prepareFollowUp }}</button>
    </div>
    <CueUpgradePrompt
      v-else-if="suggestedFollowUp"
      class="activity-composer__follow-up-pro"
      entitlement="automation.advanced"
      :title="locale === 'es' ? 'Follow-up preparado por Cuebooker' : 'Follow-up prepared by Cuebooker'"
      :description="locale === 'es'
        ? 'Artist Pro prepara el asunto y el mensaje cuando un booking lleva varios días esperando. Tú decides si editarlo y enviarlo.'
        : 'Artist Pro prepares the subject and message when a booking has been waiting for several days. You decide whether to edit and send it.'"
    />
    <div class="activity-composer__body" :class="{ 'activity-composer__body--email': sendsRealEmail }">
      <label v-if="sendsRealEmail" class="activity-composer__sender">{{ locale === 'es' ? 'Enviar desde' : 'Send from' }}
       <select v-model="senderId" :disabled="saving || senderLoading || !mailboxes.length"><option v-if="!mailboxes.length" value="">{{ locale === 'es' ? 'Cuebooker · correo de la plataforma' : 'Cuebooker · platform email' }}</option><option v-for="mailbox in mailboxes" :key="mailbox.id" :value="mailbox.id">{{ mailbox.email }}</option></select>
      </label>
      <input v-if="sendsRealEmail" v-model="subject" class="activity-composer__subject" :aria-label="copy.subject" :placeholder="copy.subjectPlaceholder" maxlength="300" :disabled="saving">
      <textarea v-model="body" rows="2" :placeholder="sendsRealEmail ? copy.emailPlaceholder : copy.placeholder" :disabled="saving" />
      <select v-if="type !== 'note' && type !== 'email'" v-model="direction" :aria-label="locale === 'es' ? 'Dirección' : 'Direction'" :disabled="saving"><option value="inbound">{{ copy.inbound }}</option><option value="outbound">{{ copy.outbound }}</option></select>
      <div v-else-if="type === 'email'" class="activity-composer__email-route">{{ locale === 'es' ? 'Tú → contacto' : 'You → contact' }}</div>
      <button class="activity-composer__save" type="submit" :disabled="saving || (sendsRealEmail && (senderLoading || senderError || sendUncertain))">{{ saving ? (sendsRealEmail ? copy.sending : copy.saving) : (sendsRealEmail ? copy.sendEmail : copy.save) }}</button>
    </div>
    <p v-if="errorMessage" class="activity-composer__error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="activity-composer__success" aria-live="polite">{{ successMessage }}</p>
  </form>
</template>

<style scoped>
.activity-composer__sender {grid-column:1 / -1;display:grid;gap:6px;font-size:11px;color:var(--cue-muted)}
.activity-composer details summary {cursor:pointer;font-size:10px;padding:8px}
.activity-composer { border-radius:var(--cue-radius-panel); margin-top:16px; border:1px solid var(--cue-border); background:var(--cue-raised); }
.activity-composer__top { display:flex; align-items:center; justify-content:space-between; gap:10px; padding:9px 10px; border-bottom:1px solid var(--cue-border); }
.activity-composer__intro { display:grid; gap:4px; max-width:430px; }
.activity-composer__intro > strong { font:700 9px monospace; text-transform:uppercase; letter-spacing:.08em; }
.activity-composer__intro > small { color:var(--cue-muted); font-size:9px; line-height:1.4; }
.activity-composer__types { display:flex; gap:4px; flex-wrap:wrap; justify-content:flex-end; }
.activity-composer__types button { min-height:var(--cue-button-sm); padding:0 12px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-control); background:transparent; color:var(--cue-muted); cursor:pointer; font:700 8px monospace; }
.activity-composer__types button.active { border-color:var(--cue-accent); color:var(--cue-accent); }
.activity-composer button:disabled,
.activity-composer input:disabled,
.activity-composer textarea:disabled,
.activity-composer select:disabled { opacity:.5; cursor:wait; }
.activity-composer > :deep(.activity-composer__follow-up-pro){margin:10px;border-radius:var(--cue-radius-control)}

.activity-composer__suggestion { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px; border-bottom:1px solid var(--cue-border); background:color-mix(in srgb,var(--cue-accent) 5%,transparent); }
.activity-composer__suggestion--warning { background:color-mix(in srgb,#ffb84d 7%,transparent); }
.activity-composer__suggestion--warning strong { color:#ffb84d; }
.activity-composer__suggestion--warning button { border-color:#ffb84d; color:#ffb84d; }
.activity-composer__suggestion > div { display:grid; gap:3px; }
.activity-composer__suggestion strong { color:var(--cue-accent); font:800 9px monospace; text-transform:uppercase; }
.activity-composer__suggestion small { color:var(--cue-muted); font-size:9px; line-height:1.4; }
.activity-composer__suggestion button { min-height:var(--cue-button-sm); padding:0 12px; border:1px solid var(--cue-accent); border-radius:var(--cue-radius-control); background:transparent; color:var(--cue-accent); cursor:pointer; font:800 8px monospace; text-transform:uppercase; }
.activity-composer__body { display:grid; grid-template-columns:minmax(0,1fr) 130px max-content; gap:14px; align-items:end; padding:14px 16px 16px; }
.activity-composer__body--email { grid-template-columns:minmax(0,1fr) 130px max-content; }
.activity-composer__subject { grid-column:1 / -1; min-height:36px; }
.activity-composer textarea, .activity-composer select, .activity-composer__subject { box-sizing:border-box; border:1px solid var(--cue-border); border-radius:var(--cue-radius-control); background:var(--cue-surface); color:var(--cue-text); padding:8px 10px; font-size:11px; }
.activity-composer__email-route { display:grid; place-items:center; min-height:var(--cue-button-md); padding:0 10px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-control); color:var(--cue-muted); font:800 8px monospace; text-transform:uppercase; }
.activity-composer textarea { resize:vertical; min-height:58px; }
.activity-composer select { width:100%; min-height:var(--cue-button-md); padding-inline:10px; }
.activity-composer__save { width:auto; min-width:0; height:var(--cue-button-sm); min-height:var(--cue-button-sm); align-self:end; justify-self:end; padding:0 12px; border:1px solid var(--cue-accent); border-radius:var(--cue-radius-control); background:var(--cue-accent); color:#080808; cursor:pointer; font:700 8px monospace; text-transform:uppercase; white-space:nowrap; }
.activity-composer__error, .activity-composer__success { margin:0; padding:0 9px 9px; font-size:10px; }
.activity-composer__error { color:#ff7c7c; }
.activity-composer__success { color:var(--cue-accent); }
@media (max-width:680px) {
  .activity-composer__top { align-items:flex-start; flex-direction:column; }
  .activity-composer__suggestion { align-items:flex-start; flex-direction:column; }
  .activity-composer__suggestion button,
  .activity-composer__types button { min-height:var(--cue-button-md); }
  .activity-composer__save { min-height:var(--cue-button-sm); }
  .activity-composer__types { width:100%; justify-content:flex-start; }
  .activity-composer__body, .activity-composer__body--email { grid-template-columns:1fr; }
  .activity-composer__subject { grid-column:1; }
  .activity-composer__save { width:auto; min-width:0; justify-self:start; }
}
</style>