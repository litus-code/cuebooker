<script setup lang="ts">
defineProps<{ copy: {
  outside: string; inside: string; panel: string; example: string; capture: string; note: string
  entries: { channel: string; context: string }[]
  fields: { label: string; value: string }[]
} }>()
</script>

<template>
  <figure class="booking-context">
    <div class="booking-context__columns">
      <div class="booking-context__sources">
        <p class="booking-context__eyebrow">{{ copy.outside }}</p>
        <ul><li v-for="(entry, i) in copy.entries" :key="entry.channel"><span class="booking-context__index">0{{ i + 1 }}</span><div><strong>{{ entry.channel }}</strong><span>{{ entry.context }}</span></div><svg viewBox="0 0 24 24" aria-hidden="true"><path v-if="i === 0" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm9 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm1-5h.01"/><path v-else-if="i === 1" d="M4 20l1-5a8 8 0 1 1 4 4Zm4-12c1 4 3 6 7 7"/><path v-else-if="i === 2" d="M3 5h18v14H3Zm0 0 9 8 9-8"/><path v-else-if="i === 3" d="m6 3 4 4-2 3c1 3 3 5 6 6l3-2 4 4c-3 6-17-2-18-11Z"/><path v-else d="M5 3h14v18H5Zm3 5h8M8 12h8m-8 4h5"/></svg></li></ul>
      </div>
      <div class="booking-context__bridge" aria-hidden="true"><span /></div>
      <div class="booking-context__record">
        <div class="booking-context__bar"><span>{{ copy.inside }}</span><i aria-hidden="true" /></div>
        <div class="booking-context__record-body"><CueBrand decorative /><h3>{{ copy.panel }}</h3><dl><div v-for="(field, i) in copy.fields" :key="field.label" :class="{ 'booking-context__next': i === copy.fields.length - 1 }"><dt>{{ field.label }}</dt><dd>{{ field.value }}</dd></div></dl></div>
        <p class="booking-context__example">{{ copy.example }}</p>
      </div>
    </div>
    <figcaption><strong>{{ copy.capture }}</strong><span>{{ copy.note }}</span></figcaption>
  </figure>
</template>

<style scoped>
.booking-context { margin: 48px 0 0; }
.booking-context__columns { display: grid; grid-template-columns: minmax(0, 1fr) 80px minmax(0, 1.1fr); align-items: center; }
.booking-context__eyebrow, .booking-context__bar, .booking-context__example { font: 11px/1.6 ui-monospace, monospace; letter-spacing: .07em; }
.booking-context__eyebrow { color: var(--cp-muted); margin: 0 0 20px; }
.booking-context__sources ul { margin: 0; padding: 0; list-style: none; }
.booking-context__sources li { display: grid; grid-template-columns: 28px 1fr 26px; align-items: center; gap: 16px; padding: 19px 0; border-top: 1px solid var(--cp-line); }
.booking-context__sources li:last-child { border-bottom: 1px solid var(--cp-line); }
.booking-context__index { color: var(--cp-muted); font: 11px ui-monospace, monospace; }
.booking-context__sources strong { display: block; color: var(--cp-paper); font-size: 21px; letter-spacing: -.02em; }
.booking-context__sources li div > span { display: block; margin-top: 5px; color: var(--cp-muted); font-size: 14px; }
.booking-context__sources svg { width: 24px; height: 24px; fill: none; stroke: var(--cp-muted); stroke-width: 1.4; stroke-linecap: round; stroke-linejoin: round; }
.booking-context__bridge { padding-inline: 16px; }
.booking-context__bridge span { display: block; height: 1px; background: var(--cp-lime); }
.booking-context__record { min-width: 0; border: 1px solid var(--cp-line); border-top: 2px solid var(--cp-lime); border-radius: 6px; background: var(--cp-panel); }
.booking-context__bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 24px; border-bottom: 1px solid var(--cp-line); color: var(--cp-muted); }
.booking-context__bar i { flex: 0 0 6px; height: 6px; border-radius: 50%; background: var(--cp-lime); }
.booking-context__record-body { padding: 28px; }
.booking-context__record-body :deep(.cue-brand) { width: 140px; height: 47px; }
.booking-context h3 { margin: 18px 0 24px; color: var(--cp-paper); font-size: clamp(25px, 2.7vw, 34px); line-height: 1.15; letter-spacing: -.035em; max-width: 380px; }
.booking-context dl { margin: 0; }
.booking-context dl div { display: grid; grid-template-columns: minmax(110px, .7fr) minmax(0, 1fr); gap: 20px; padding-block: 14px; border-top: 1px solid var(--cp-line); font-size: 14px; line-height: 1.5; }
.booking-context dt { color: var(--cp-muted); }
.booking-context dd { margin: 0; color: var(--cp-paper); }
.booking-context dl .booking-context__next { padding: 16px 12px; margin-top: 6px; background: var(--cp-panel-2); border-left: 2px solid var(--cp-lime); }
.booking-context__next dt { color: var(--cp-paper); }
.booking-context__example { padding: 14px 24px; margin: 0; border-top: 1px solid var(--cp-line); color: var(--cp-muted); }
.booking-context figcaption { display: grid; gap: 8px; padding-top: 28px; margin-top: 32px; border-top: 1px solid var(--cp-line); }
.booking-context figcaption strong { color: var(--cp-paper); font-weight: 500; font-size: 19px; line-height: 1.5; }
.booking-context figcaption > span { color: var(--cp-muted); font-size: 13px; line-height: 1.6; }
@media (max-width: 800px) {
  .booking-context { margin-top: 30px; }
  .booking-context__columns { grid-template-columns: 1fr; }
  .booking-context__bridge { display: flex; justify-content: center; padding: 16px 0; }
  .booking-context__bridge span { width: 1px; height: 24px; }
  .booking-context__record-body { padding: 24px; }
  .booking-context__sources strong { font-size: 19px; }
}
@media (max-width: 365px) {
  .booking-context dl div { grid-template-columns: 1fr; gap: 4px; }
  .booking-context__record-body { padding: 20px; }
  .booking-context__bar, .booking-context__example { padding-inline: 20px; font-size: 10px; }
}
</style>
