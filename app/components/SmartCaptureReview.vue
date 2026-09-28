<script setup lang="ts">
import type { SmartCaptureConfidence, SmartCaptureResult } from '../domain/smartCapture'

const props = defineProps<{
  result: SmartCaptureResult
  locale: 'es' | 'en'
}>()

const emit = defineEmits<{ apply: []; discard: [] }>()

const copy = computed(() => props.locale === 'es' ? {
  title: 'Esto es lo que he entendido',
  subtitle: 'Nada se aplicará hasta que lo confirmes.',
  high: 'Alta', medium: 'Media', low: 'Baja', unknown: 'Sin confirmar',
  source: 'Canal', contact: 'Contacto', email: 'Email', phone: 'Teléfono',
  counterparty: 'Sala / promotor', kind: 'Tipo', event: 'Evento', venue: 'Sala',
  city: 'Ciudad', country: 'País', date: 'Fecha', start: 'Inicio', end: 'Fin',
  timezone: 'Zona horaria', offer: 'Oferta', feeBasis: 'Base del fee',
  next: 'Próxima acción', due: 'Cuándo', conditions: 'Condiciones detectadas',
  missing: 'Falta por concretar', warnings: 'Revisar',
  evidence: 'Lo he sacado de', apply: 'Aplicar al booking', discard: 'Descartar'
} : {
  title: 'This is what I understood',
  subtitle: 'Nothing will be applied until you confirm it.',
  high: 'High', medium: 'Medium', low: 'Low', unknown: 'Unconfirmed',
  source: 'Channel', contact: 'Contact', email: 'Email', phone: 'Phone',
  counterparty: 'Venue / promoter', kind: 'Type', event: 'Event', venue: 'Venue',
  city: 'City', country: 'Country', date: 'Date', start: 'Start', end: 'End',
  timezone: 'Timezone', offer: 'Offer', feeBasis: 'Fee basis',
  next: 'Next action', due: 'When', conditions: 'Detected conditions',
  missing: 'Still missing', warnings: 'Review',
  evidence: 'Evidence', apply: 'Apply to booking', discard: 'Discard'
})

function confidenceLabel(value: SmartCaptureConfidence) {
  return copy.value[value]
}

function money() {
  const amount = props.result.offer.amountMinor.value
  if (amount == null) return null
  const currency = props.result.offer.currency.value || 'EUR'
  try {
    return new Intl.NumberFormat(props.locale === 'es' ? 'es-ES' : 'en-GB', {
      style: 'currency',
      currency
    }).format(amount / 100)
  } catch {
    return `${amount / 100} ${currency}`
  }
}

const rows = computed(() => {
  const r = props.result
  return [
    { label: copy.value.source, field: r.source },
    { label: copy.value.contact, field: r.contact.name },
    { label: copy.value.email, field: r.contact.email },
    { label: copy.value.phone, field: r.contact.phone },
    { label: copy.value.counterparty, field: r.counterparty.name },
    { label: copy.value.kind, field: r.counterparty.kind },
    { label: copy.value.event, field: r.event.name },
    { label: copy.value.venue, field: r.event.venueName },
    { label: copy.value.city, field: r.event.city },
    { label: copy.value.country, field: r.event.countryCode },
    { label: copy.value.date, field: r.event.eventDate },
    { label: copy.value.start, field: r.event.startTime },
    { label: copy.value.end, field: r.event.endTime },
    { label: copy.value.timezone, field: r.event.timezone },
    { label: copy.value.offer, field: { ...r.offer.amountMinor, value: money() } },
    { label: copy.value.feeBasis, field: r.offer.feeBasis },
    { label: copy.value.next, field: r.nextAction.label },
    { label: copy.value.due, field: r.nextAction.dueAt }
  ].filter(item => item.field.value != null && String(item.field.value).trim() !== '')
})
</script>

<template>
  <section class="smart-review" aria-live="polite">
    <header>
      <div>
        <span>SMART CAPTURE</span>
        <h3>{{ copy.title }}</h3>
        <p>{{ copy.subtitle }}</p>
      </div>
    </header>

    <p v-if="result.summary" class="smart-review__summary">{{ result.summary }}</p>

    <div v-if="rows.length" class="smart-review__fields">
      <article v-for="item in rows" :key="item.label">
        <div class="smart-review__field-top">
          <span>{{ item.label }}</span>
          <b :class="`confidence confidence--${item.field.confidence}`">{{ confidenceLabel(item.field.confidence) }}</b>
        </div>
        <strong>{{ item.field.value }}</strong>
        <small v-if="item.field.evidence"><i>{{ copy.evidence }}:</i> “{{ item.field.evidence }}”</small>
      </article>
    </div>

    <section v-if="result.conditions.length" class="smart-review__secondary">
      <h4>{{ copy.conditions }}</h4>
      <div class="smart-review__conditions">
        <span v-for="condition in result.conditions" :key="`${condition.category}-${condition.value}`">
          <b>{{ condition.category }}</b> · {{ condition.value }}
        </span>
      </div>
    </section>

    <section v-if="result.missingFields.length" class="smart-review__secondary">
      <h4>{{ copy.missing }}</h4>
      <p>{{ result.missingFields.join(' · ') }}</p>
    </section>

    <section v-if="result.warnings.length" class="smart-review__secondary smart-review__secondary--warning">
      <h4>{{ copy.warnings }}</h4>
      <p>{{ result.warnings.join(' · ') }}</p>
    </section>

    <footer>
      <button type="button" @click="emit('discard')">{{ copy.discard }}</button>
      <button type="button" class="primary" @click="emit('apply')">{{ copy.apply }}</button>
    </footer>
  </section>
</template>

<style scoped>
.smart-review { display:grid; gap:12px; margin:12px 0 4px; padding:14px; border:1px solid #526329; background:linear-gradient(180deg,rgba(206,255,84,.055),rgba(206,255,84,.018)); }
.smart-review header span { color:#ceff54; font:800 8px/1.2 monospace; letter-spacing:.12em; }
.smart-review h3 { margin:5px 0 2px; font-size:17px; }
.smart-review header p, .smart-review__summary { margin:0; color:#a6a6a6; font-size:10px; line-height:1.45; }
.smart-review__summary { padding:10px 0 2px; color:#d8d8d8; font-size:11px; }
.smart-review__fields { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
.smart-review__fields article { min-width:0; padding:10px; border:1px solid #33382b; background:#111; }
.smart-review__field-top { display:flex; align-items:center; justify-content:space-between; gap:8px; }
.smart-review__field-top > span { color:#919191; font:700 8px monospace; text-transform:uppercase; }
.smart-review__fields strong { display:block; margin-top:6px; overflow-wrap:anywhere; font-size:12px; }
.smart-review__fields small { display:block; margin-top:7px; color:#7f7f7f; font-size:8px; line-height:1.45; }
.smart-review__fields small i { color:#a0a0a0; font-style:normal; }
.confidence { flex:0 0 auto; padding:3px 5px; border:1px solid #444; color:#aaa; font:700 7px monospace; text-transform:uppercase; }
.confidence--high { border-color:#55d98d; color:#55d98d; }
.confidence--medium { border-color:#ffbf5f; color:#ffbf5f; }
.confidence--low { border-color:#ff7f69; color:#ff7f69; }
.confidence--unknown { border-color:#555; color:#888; }
.smart-review__secondary { padding-top:10px; border-top:1px solid #303326; }
.smart-review__secondary h4 { margin:0 0 7px; color:#ceff54; font:800 8px monospace; text-transform:uppercase; letter-spacing:.08em; }
.smart-review__secondary p { margin:0; color:#a4a4a4; font-size:10px; line-height:1.5; }
.smart-review__conditions { display:flex; flex-wrap:wrap; gap:5px; }
.smart-review__conditions span { padding:6px 7px; border:1px solid #34382a; color:#b9b9b9; font-size:9px; }
.smart-review__conditions b { color:#ceff54; font:700 8px monospace; text-transform:uppercase; }
.smart-review__secondary--warning h4 { color:#ffbf5f; }
.smart-review footer { display:grid; grid-template-columns:.8fr 1.2fr; gap:7px; padding-top:3px; }
.smart-review footer button { min-height:40px; border:1px solid #3d3d3d; background:transparent; color:#ddd; cursor:pointer; font:800 9px monospace; text-transform:uppercase; }
.smart-review footer .primary { border-color:#ceff54; background:#ceff54; color:#090909; }

@media (max-width:600px) {
  .smart-review { margin-inline:-2px; padding:12px; }
  .smart-review__fields { grid-template-columns:1fr; }
}
</style>
