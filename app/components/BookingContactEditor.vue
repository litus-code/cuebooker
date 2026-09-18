<script setup lang="ts">
import type { Contact } from '../domain/bookingCore'

const props = defineProps<{
  workspaceId: string
  contact: Contact
  locale: 'es' | 'en'
}>()

const emit = defineEmits<{ saved: [contact: Contact] }>()
const bookingCore = useBookingCore()
const open = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const form = reactive({
  name: '',
  email: '',
  phone: '',
  roleLabel: '',
  notes: ''
})

const copy = computed(() => props.locale === 'es' ? {
  edit: 'Editar contacto', title: 'Contacto', intro: 'Estos datos pertenecen a la persona y se reutilizan en sus bookings.',
  name: 'Nombre', email: 'Email', phone: 'Teléfono', role: 'Rol / cargo', notes: 'Notas',
  cancel: 'Cancelar', save: 'Guardar contacto', saving: 'Guardando…',
  required: 'El contacto necesita un nombre.', invalidEmail: 'Revisa el formato del email.',
  error: 'No he podido guardar el contacto.'
} : {
  edit: 'Edit contact', title: 'Contact', intro: 'These details belong to the person and are reused across their bookings.',
  name: 'Name', email: 'Email', phone: 'Phone', role: 'Role / title', notes: 'Notes',
  cancel: 'Cancel', save: 'Save contact', saving: 'Saving…',
  required: 'The contact needs a name.', invalidEmail: 'Check the email format.',
  error: 'I could not save the contact.'
})

function sync() {
  form.name = props.contact.name || ''
  form.email = props.contact.email || ''
  form.phone = props.contact.phone || ''
  form.roleLabel = props.contact.role_label || ''
  form.notes = props.contact.notes || ''
  errorMessage.value = ''
}

function show() {
  sync()
  open.value = true
}

function close() {
  if (saving.value) return
  open.value = false
  errorMessage.value = ''
}

async function save() {
  errorMessage.value = ''
  if (!form.name.trim()) {
    errorMessage.value = copy.value.required
    return
  }
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errorMessage.value = copy.value.invalidEmail
    return
  }

  saving.value = true
  try {
    const updated = await bookingCore.updateContact({
      workspaceId: props.workspaceId,
      contactId: props.contact.id,
      name: form.name,
      email: form.email,
      phone: form.phone,
      roleLabel: form.roleLabel,
      notes: form.notes
    })
    open.value = false
    emit('saved', updated)
  } catch {
    errorMessage.value = copy.value.error
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <button class="contact-editor-entry" type="button" @click="show">{{ copy.edit }}</button>

  <div v-if="open" class="contact-editor-backdrop" @click.self="close">
    <form class="contact-editor" role="dialog" aria-modal="true" @submit.prevent="save">
      <header>
        <div>
          <span>CUE / CONTACT</span>
          <h3>{{ copy.title }}</h3>
          <p>{{ copy.intro }}</p>
        </div>
        <button type="button" aria-label="Close" @click="close">×</button>
      </header>

      <div class="contact-editor__grid">
        <label><span>{{ copy.name }}</span><input v-model="form.name" autocomplete="name"></label>
        <label><span>{{ copy.email }}</span><input v-model="form.email" type="email" autocomplete="email"></label>
        <label><span>{{ copy.phone }}</span><input v-model="form.phone" type="tel" autocomplete="tel"></label>
        <label><span>{{ copy.role }}</span><input v-model="form.roleLabel"></label>
        <label class="contact-editor__notes"><span>{{ copy.notes }}</span><textarea v-model="form.notes" rows="3" /></label>
      </div>

      <p v-if="errorMessage" class="contact-editor__error">{{ errorMessage }}</p>

      <footer>
        <button type="button" :disabled="saving" @click="close">{{ copy.cancel }}</button>
        <button class="primary" type="submit" :disabled="saving">{{ saving ? copy.saving : copy.save }}</button>
      </footer>
    </form>
  </div>
</template>

<style scoped>
.contact-editor-entry { margin-top:5px; padding:0; border:0; background:transparent; color:var(--cue-accent); cursor:pointer; font:800 8px monospace; text-transform:uppercase; }
.contact-editor-backdrop { position:fixed; z-index:110; inset:0; display:grid; place-items:center; padding:18px; background:rgba(0,0,0,.74); backdrop-filter:blur(5px); }
.contact-editor { width:min(640px,100%); max-height:90dvh; overflow:auto; border:1px solid var(--cue-border); background:var(--cue-surface); color:var(--cue-text); }
.contact-editor > header { display:flex; justify-content:space-between; gap:16px; padding:20px; border-bottom:1px solid var(--cue-border); }
.contact-editor > header span { color:var(--cue-accent); font:800 9px monospace; letter-spacing:.1em; }
.contact-editor > header h3 { margin:6px 0; font-size:24px; }
.contact-editor > header p { margin:0; color:var(--cue-muted); font-size:12px; }
.contact-editor > header > button { align-self:start; border:0; background:transparent; color:var(--cue-text); cursor:pointer; font-size:24px; }
.contact-editor__grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; padding:20px; }
.contact-editor label { display:grid; gap:6px; }
.contact-editor label span { color:var(--cue-muted); font:800 8px monospace; text-transform:uppercase; }
.contact-editor input, .contact-editor textarea { width:100%; box-sizing:border-box; border:1px solid var(--cue-border); background:var(--cue-raised); color:var(--cue-text); padding:10px 11px; }
.contact-editor__notes { grid-column:1 / -1; }
.contact-editor__error { margin:0 20px 16px; color:#ff9b9b; font-size:11px; }
.contact-editor footer { display:flex; justify-content:flex-end; gap:8px; padding:16px 20px; border-top:1px solid var(--cue-border); }
.contact-editor footer button { min-height:40px; padding:0 14px; border:1px solid var(--cue-border); background:transparent; color:var(--cue-text); cursor:pointer; font:800 9px monospace; text-transform:uppercase; }
.contact-editor footer .primary { border-color:var(--cue-accent); background:var(--cue-accent); color:#090909; }
@media (max-width:600px) {
  .contact-editor-backdrop { align-items:end; padding:0; }
  .contact-editor { width:100%; border-right:0; border-bottom:0; border-left:0; }
  .contact-editor__grid { grid-template-columns:1fr; }
  .contact-editor__notes { grid-column:auto; }
  .contact-editor footer { display:grid; grid-template-columns:1fr; }
}
</style>
