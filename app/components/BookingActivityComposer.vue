<script setup lang="ts">
import type { ActivityDirection, ActivityType, CoreBooking } from '../domain/bookingCore'

const props = defineProps<{
  workspaceId: string
  booking: CoreBooking
  locale: 'es' | 'en'
}>()

const emit = defineEmits<{ created: [] }>()
const bookingCore = useBookingCore()
const type = ref<ActivityType>('note')
const direction = ref<ActivityDirection>('internal')
const body = ref('')
const saving = ref(false)
const errorMessage = ref('')

const copy = computed(() => props.locale === 'es' ? {
  title: 'Registrar actividad',
  note: 'Nota', phone: 'Llamada', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram',
  inbound: 'Entrante', outbound: 'Saliente', internal: 'Interna',
  placeholder: 'Ej. Héctor confirma que el horario llega mañana.',
  save: 'Añadir a Activity', saving: 'Guardando…', required: 'Escribe qué ha pasado.'
} : {
  title: 'Log activity',
  note: 'Note', phone: 'Call', whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram',
  inbound: 'Inbound', outbound: 'Outbound', internal: 'Internal',
  placeholder: 'E.g. Hector confirms the schedule arrives tomorrow.',
  save: 'Add to Activity', saving: 'Saving…', required: 'Write what happened.'
})

const types = computed<Array<{ value: ActivityType; label: string }>>(() => [
  { value: 'note', label: copy.value.note },
  { value: 'phone', label: copy.value.phone },
  { value: 'whatsapp', label: copy.value.whatsapp },
  { value: 'email', label: copy.value.email },
  { value: 'instagram', label: copy.value.instagram }
])

watch(type, value => {
  if (value === 'note') direction.value = 'internal'
  else if (direction.value === 'internal') direction.value = 'inbound'
})

async function submit() {
  const text = body.value.trim()
  if (!text) { errorMessage.value = copy.value.required; return }
  saving.value = true
  errorMessage.value = ''
  try {
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
    errorMessage.value = error?.message || copy.value.required
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
    <div class="activity-composer__body">
      <textarea v-model="body" rows="2" :placeholder="copy.placeholder" />
      <select v-if="type !== 'note'" v-model="direction" aria-label="Direction"><option value="inbound">{{ copy.inbound }}</option><option value="outbound">{{ copy.outbound }}</option></select>
      <button class="activity-composer__save" type="submit" :disabled="saving">{{ saving ? copy.saving : copy.save }}</button>
    </div>
    <p v-if="errorMessage" class="activity-composer__error">{{ errorMessage }}</p>
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
.activity-composer textarea, .activity-composer select { box-sizing:border-box; border:1px solid var(--cue-border); background:var(--cue-surface); color:var(--cue-text); padding:8px 9px; font-size:11px; }
.activity-composer textarea { resize:vertical; min-height:54px; }
.activity-composer select { min-height:36px; }
.activity-composer__save { min-height:36px; align-self:end; padding:0 11px; border:1px solid var(--cue-accent); background:var(--cue-accent); color:#080808; cursor:pointer; font:700 8px monospace; text-transform:uppercase; }
.activity-composer__error { margin:0; padding:0 9px 9px; color:#ff7c7c; font-size:10px; }
@media (max-width:680px) { .activity-composer__top { align-items:flex-start; flex-direction:column; } .activity-composer__types { justify-content:flex-start; } .activity-composer__body { grid-template-columns:1fr; } }
</style>
