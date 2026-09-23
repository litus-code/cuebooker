<script setup lang="ts">
import type { CoreBooking, Hold, NextMove } from '../domain/bookingCore'

const props = defineProps<{
  workspaceId: string
  booking: CoreBooking
  locale: 'es' | 'en'
}>()

const emit = defineEmits<{ changed: [] }>()
const bookingCore = useBookingCore()
const nextMoves = ref<NextMove[]>([])
const holds = ref<Hold[]>([])
const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const nextLabel = ref('')
const nextDue = ref('')
const autoCompleteOnReply = ref(false)
const holdDate = ref('')
const holdExpires = ref('')
const holdPriority = ref('')

const copy = computed(() => props.locale === 'es' ? {
  eyebrow: 'SEGUIMIENTO',
  nextMove: 'Próxima acción',
  nextHelp: 'Tu siguiente tarea sobre este booking. Sirve para no perder el hilo; no cambia su estado.',
  noNext: 'No hay ninguna próxima acción definida.',
  nextPlaceholder: 'Ej. Confirmar horario con Héctor',
  due: 'Cuándo',
  saveNext: 'Guardar próxima acción',
  complete: 'Hecho',
  autoReply: 'Marcar como hecha cuando llegue una respuesta',
  autoReplyHint: 'Cuebooker la cerrará solo cuando entre una respuesta real en este booking.',
  autoReplyActive: 'Se cerrará al recibir respuesta',
  hold: 'Reservar fecha (hold)',
  holdHelp: 'Bloquea provisionalmente la fecha de este booking mientras se negocia. El hold aparece en Calendario.',
  noHold: 'No hay fechas reservadas provisionalmente.',
  holdDate: 'Fecha',
  expires: 'Caduca',
  priority: 'Prioridad',
  createHold: 'Reservar fecha',
  release: 'Liberar fecha',
  convert: 'Confirmar booking',
  saving: 'Guardando…',
  invalidNext: 'Escribe el siguiente paso.',
  invalidHold: 'El hold necesita una fecha.',
  error: 'No se ha podido actualizar la operativa.'
} : {
  eyebrow: 'FOLLOW-UP',
  nextMove: 'Next action',
  nextHelp: 'Your next task for this booking. It keeps the thread moving without changing booking status.',
  noNext: 'No next action has been defined.',
  nextPlaceholder: 'E.g. Confirm schedule with Hector',
  due: 'When',
  saveNext: 'Save next action',
  complete: 'Done',
  autoReply: 'Mark as done when a reply arrives',
  autoReplyHint: 'Cuebooker will close it only when a real reply arrives in this booking.',
  autoReplyActive: 'Will close when a reply arrives',
  hold: 'Reserve date (hold)',
  holdHelp: 'Provisionally blocks this booking date while it is negotiated. The hold appears in Calendar.',
  noHold: 'No dates are provisionally reserved.',
  holdDate: 'Date',
  expires: 'Expires',
  priority: 'Priority',
  createHold: 'Reserve date',
  release: 'Release date',
  convert: 'Confirm booking',
  saving: 'Saving…',
  invalidNext: 'Enter a next move.',
  invalidHold: 'A hold needs a date.',
  error: 'Operations could not be updated.'
})

const activeNextMove = computed(() => nextMoves.value.find(item => !item.completed_at) || null)
const activeHolds = computed(() => holds.value.filter(item => item.status === 'active'))

function localDateTime(value: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  }).format(new Date(value))
}

function dateOnly(value: string) {
  return new Intl.DateTimeFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(`${value}T12:00:00`))
}

async function load() {
  if (!props.workspaceId || !props.booking.id) return
  loading.value = true
  errorMessage.value = ''
  try {
    const [moves, holdRows] = await Promise.all([
      bookingCore.listNextMoves(props.workspaceId, props.booking.id, true),
      bookingCore.listHolds(props.workspaceId, props.booking.id, true)
    ])
    nextMoves.value = moves
    holds.value = holdRows
  } catch (error: any) {
    errorMessage.value = error?.message || copy.value.error
  } finally {
    loading.value = false
  }
}

watch(() => [props.workspaceId, props.booking.id], () => {
  if (!holdDate.value && props.booking.event_date) holdDate.value = props.booking.event_date
  autoCompleteOnReply.value = false
  void load()
}, { immediate: true })

watch(() => props.booking.event_date, (nextDate, previousDate) => {
  if (!nextDate) return
  if (!holdDate.value || holdDate.value === previousDate) holdDate.value = nextDate
})

function toIsoOrNull(value: string) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

async function setNextMove() {
  const label = nextLabel.value.trim()
  if (!label) { errorMessage.value = copy.value.invalidNext; return }
  saving.value = true
  errorMessage.value = ''
  try {
    await bookingCore.setNextMove({
      workspaceId: props.workspaceId,
      bookingId: props.booking.id,
      label,
      dueAt: toIsoOrNull(nextDue.value),
      completionTrigger: autoCompleteOnReply.value ? 'inbound_activity' : 'manual'
    })
    nextLabel.value = ''
    nextDue.value = ''
    autoCompleteOnReply.value = false
    await load()
    emit('changed')
  } catch (error: any) {
    errorMessage.value = error?.message || copy.value.error
  } finally {
    saving.value = false
  }
}

async function completeNextMove() {
  if (!activeNextMove.value) return
  saving.value = true
  try {
    await bookingCore.completeNextMove(props.workspaceId, activeNextMove.value.id)
    await load()
    emit('changed')
  } catch (error: any) {
    errorMessage.value = error?.message || copy.value.error
  } finally {
    saving.value = false
  }
}

async function createHold() {
  if (!holdDate.value) { errorMessage.value = copy.value.invalidHold; return }
  const priority = holdPriority.value ? Number(holdPriority.value) : null
  saving.value = true
  errorMessage.value = ''
  try {
    await bookingCore.createHold({
      workspaceId: props.workspaceId,
      bookingId: props.booking.id,
      eventDate: holdDate.value,
      expiresAt: toIsoOrNull(holdExpires.value),
      priority: priority && Number.isInteger(priority) ? priority : null
    })
    holdDate.value = ''
    holdExpires.value = ''
    holdPriority.value = ''
    await load()
    emit('changed')
  } catch (error: any) {
    errorMessage.value = error?.message || copy.value.error
  } finally {
    saving.value = false
  }
}

async function releaseHold(hold: Hold) {
  saving.value = true
  try {
    await bookingCore.releaseHold(props.workspaceId, hold.id)
    await load()
    emit('changed')
  } catch (error: any) {
    errorMessage.value = error?.message || copy.value.error
  } finally {
    saving.value = false
  }
}

async function convertHold(hold: Hold) {
  saving.value = true
  try {
    await bookingCore.convertHold(props.workspaceId, hold.id)
    await load()
    emit('changed')
  } catch (error: any) {
    errorMessage.value = error?.message || copy.value.error
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="core-ops">
    <div class="core-ops__eyebrow">{{ copy.eyebrow }}</div>
    <div class="core-ops__grid">
      <section>
        <header><strong>{{ copy.nextMove }}</strong><small>{{ copy.nextHelp }}</small></header>
        <div v-if="loading" class="core-ops__empty">…</div>
        <div v-else-if="activeNextMove" class="core-ops__current">
          <div>
            <strong>{{ activeNextMove.label }}</strong>
            <small>{{ activeNextMove.due_at ? localDateTime(activeNextMove.due_at) : '—' }}</small>
            <em v-if="activeNextMove.completion_trigger === 'inbound_activity'" class="core-ops__automation">{{ copy.autoReplyActive }}</em>
          </div>
          <button type="button" :disabled="saving" @click="completeNextMove">{{ copy.complete }}</button>
        </div>
        <p v-else class="core-ops__empty">{{ copy.noNext }}</p>
        <form class="core-ops__form" @submit.prevent="setNextMove">
          <label class="core-ops__form-main"><span>{{ copy.nextMove }}</span><input v-model="nextLabel" :placeholder="copy.nextPlaceholder" maxlength="240"></label>
          <label class="core-ops__auto-reply">
            <input v-model="autoCompleteOnReply" type="checkbox">
            <span><strong>{{ copy.autoReply }}</strong><small>{{ copy.autoReplyHint }}</small></span>
          </label>
          <div class="core-ops__form-row">
            <label><span>{{ copy.due }}</span><input v-model="nextDue" type="datetime-local"></label>
            <button type="submit" :disabled="saving">{{ saving ? copy.saving : copy.saveNext }}</button>
          </div>
        </form>
      </section>

      <section class="core-ops__hold-box">
        <header class="core-ops__hold-heading">
          <span><strong>{{ copy.hold }}</strong><small>{{ copy.holdHelp }}</small></span>
          <b v-if="activeHolds.length">{{ activeHolds.length }}</b>
        </header>
        <div v-if="activeHolds.length" class="core-ops__holds">
          <article v-for="hold in activeHolds" :key="hold.id">
            <div><strong>{{ dateOnly(hold.event_date) }}</strong><small>{{ hold.expires_at ? `${copy.expires}: ${localDateTime(hold.expires_at)}` : '—' }}</small></div>
            <span v-if="hold.priority">P{{ hold.priority }}</span>
            <div class="core-ops__hold-actions"><button type="button" :disabled="saving" @click="releaseHold(hold)">{{ copy.release }}</button></div>
          </article>
        </div>
        <p v-else-if="!loading" class="core-ops__empty">{{ copy.noHold }}</p>
        <form class="core-ops__form core-ops__form--hold" @submit.prevent="createHold">
          <div class="core-ops__form-row core-ops__form-row--hold">
            <label><span>{{ copy.holdDate }}</span><input v-model="holdDate" type="date"></label>
            <label><span>{{ copy.expires }}</span><input v-model="holdExpires" type="datetime-local"></label>
          </div>
          <button type="submit" :disabled="saving">{{ saving ? copy.saving : copy.createHold }}</button>
        </form>
      </section>
    </div>
    <p v-if="errorMessage" class="core-ops__error">{{ errorMessage }}</p>
  </section>
</template>

<style scoped>
.core-ops { margin-top:16px; padding-top:16px; border-top:1px solid var(--cue-border); }
.core-ops__eyebrow { margin-bottom:9px; color:var(--cue-muted); font:700 9px/1.2 monospace; letter-spacing:.11em; }
.core-ops__grid { display:grid; grid-template-columns:1fr 1fr; gap:0; border:1px solid var(--cue-border); border-radius:var(--cue-radius-lg); background:color-mix(in srgb,var(--cue-raised) 56%,transparent); overflow:hidden; }
.core-ops__grid > section, .core-ops__hold-box { min-width:0; border:0; background:transparent; }
.core-ops__grid > section + section { border-left:1px solid var(--cue-border); }
.core-ops__grid header { padding:12px 13px 8px; border-bottom:0; font-size:11px; text-transform:uppercase; letter-spacing:.05em; }
.core-ops__hold-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:12px 13px 8px; border-bottom:0; }
.core-ops__hold-heading > span { display:grid; gap:5px; }
.core-ops__hold-heading strong { font-size:11px; text-transform:uppercase; letter-spacing:.05em; }
.core-ops__hold-heading small { max-width:430px; color:var(--cue-muted); font-size:9px; line-height:1.4; }
.core-ops__hold-heading b { color:var(--cue-accent); font:700 10px monospace; }
.core-ops__grid header small { display:block; margin-top:5px; max-width:430px; color:var(--cue-muted); font-size:9px; line-height:1.4; letter-spacing:0; text-transform:none; font-weight:400; }
.core-ops__current, .core-ops__holds article { display:flex; align-items:center; justify-content:space-between; gap:10px; margin:0 12px; padding:10px 0; border-bottom:1px solid var(--cue-border); }
.core-ops__current > div, .core-ops__holds article > div:first-child { min-width:0; }
.core-ops__current strong, .core-ops__current small, .core-ops__holds strong, .core-ops__holds small { display:block; }
.core-ops__automation { display:inline-block; margin-top:6px; padding:3px 6px; border:1px solid color-mix(in srgb,var(--cue-primary) 55%,var(--cue-border)); border-radius:var(--cue-radius-xs); color:var(--cue-primary); font:800 7px monospace; font-style:normal; text-transform:uppercase; }
.core-ops__current strong, .core-ops__holds strong { font-size:12px; }
.core-ops__current small, .core-ops__holds small { margin-top:4px; color:var(--cue-muted); font-size:10px; }
.core-ops button { min-height:var(--cue-control-compact); padding:0 10px; border:1px solid var(--cue-border); border-radius:var(--cue-radius-md); background:transparent; color:var(--cue-text); cursor:pointer; font:700 9px monospace; text-transform:uppercase; }
.core-ops button:hover { border-color:var(--cue-primary); }
.core-ops button:disabled { opacity:.45; cursor:wait; }
.core-ops__form { display:grid; gap:10px; padding:10px 12px 13px; }
.core-ops__form-main { min-width:0; }
.core-ops__auto-reply { display:grid; grid-template-columns:18px minmax(0,1fr); align-items:start; gap:9px; width:100%; box-sizing:border-box; padding:3px 0 2px; border:0; background:transparent; cursor:pointer; }
.core-ops__auto-reply input { appearance:none; -webkit-appearance:none; width:18px; height:18px; min-width:18px; min-height:18px; margin:0; padding:0; border:1px solid var(--cue-border); border-radius:var(--cue-radius-xs); background:var(--cue-surface); cursor:pointer; }
.core-ops__auto-reply input:checked { border-color:var(--cue-primary); background:var(--cue-primary); box-shadow:inset 0 0 0 4px var(--cue-surface); }
.core-ops__auto-reply input:focus-visible { outline:2px solid var(--cue-primary); outline-offset:2px; }
.core-ops__auto-reply > span { display:block; min-width:0; width:auto; }
.core-ops__auto-reply strong { display:block; color:var(--cue-text); font-size:10px; line-height:1.35; overflow-wrap:normal; word-break:normal; }
.core-ops__auto-reply small { display:block; margin-top:4px; color:var(--cue-muted); font-size:9px; line-height:1.4; overflow-wrap:normal; word-break:normal; }
.core-ops__form-row { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px; align-items:end; }
.core-ops__form-row--hold { grid-template-columns:1fr 1fr; }
.core-ops__form--hold > button { justify-self:start; }
.core-ops__form label span { display:block; margin-bottom:5px; color:var(--cue-muted); font:700 8px monospace; text-transform:uppercase; }
.core-ops__form input { width:100%; min-height:var(--cue-control-standard); box-sizing:border-box; border:1px solid color-mix(in srgb,var(--cue-border) 88%,transparent); border-radius:var(--cue-radius-md); background:var(--cue-surface); color:var(--cue-text); padding:0 10px; font-size:11px; }
.core-ops__form > button { align-self:end; background:var(--cue-primary); color:var(--cue-primary-ink); border-color:var(--cue-primary); }
.core-ops__empty { margin:0; padding:12px; color:var(--cue-muted); font-size:11px; }
.core-ops__holds article > span { color:var(--cue-primary); font:700 9px monospace; }
.core-ops__hold-actions { display:flex; gap:5px; }
.core-ops__error { margin:8px 0 0; color:var(--cue-status-rejected); font-size:11px; }
@media (max-width:900px) {
  .core-ops__grid { grid-template-columns:1fr; }
  .core-ops__grid > section + section { border-left:0; border-top:1px solid var(--cue-border); }
}
@media (max-width:560px) {
  .core-ops__form { gap:12px; padding:12px; }
  .core-ops__form-row, .core-ops__form-row--hold { grid-template-columns:1fr; }
  .core-ops__form > button, .core-ops__form-row > button { width:100%; }
  .core-ops__current, .core-ops__holds article { align-items:flex-start; flex-wrap:wrap; }
  .core-ops__hold-actions { width:100%; }

  .core-ops__auto-reply {
    display:grid !important;
    grid-template-columns:20px minmax(0,1fr) !important;
    align-items:start !important;
    gap:10px !important;
    width:100% !important;
    min-width:0 !important;
    min-height:0 !important;
    height:auto !important;
    box-sizing:border-box !important;
    padding:4px 0 2px !important;
  }

  .core-ops__auto-reply input[type="checkbox"] {
    appearance:none !important;
    -webkit-appearance:none !important;
    display:block !important;
    grid-column:1 !important;
    width:20px !important;
    height:20px !important;
    min-width:20px !important;
    min-height:20px !important;
    max-width:20px !important;
    max-height:20px !important;
    padding:0 !important;
    margin:0 !important;
    border:1px solid var(--cue-border) !important;
    border-radius:var(--cue-radius-xs) !important;
    background:var(--cue-surface) !important;
    box-shadow:none !important;
  }

  .core-ops__auto-reply input[type="checkbox"]:checked {
    border-color:var(--cue-primary) !important;
    background:var(--cue-primary) !important;
    box-shadow:inset 0 0 0 4px var(--cue-surface) !important;
  }

  .core-ops__auto-reply > span {
    grid-column:2 !important;
    width:auto !important;
    min-width:0 !important;
    max-width:none !important;
    margin:0 !important;
  }

  .core-ops__auto-reply strong {
    font-size:11px !important;
    line-height:1.3 !important;
    overflow-wrap:normal !important;
    word-break:normal !important;
  }

  .core-ops__auto-reply small {
    margin-top:5px !important;
    font-size:10px !important;
    line-height:1.4 !important;
    overflow-wrap:normal !important;
    word-break:normal !important;
  }
}
</style>
