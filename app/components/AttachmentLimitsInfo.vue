<script setup lang="ts">
import {computed,ref} from 'vue'
const props=withDefaults(defineProps<{locale:'es'|'en';maxBytes?:number;maxFiles?:number;perFile?:boolean}>(),{maxBytes:5*1024*1024,maxFiles:5,perFile:false})
const details=ref<HTMLDetailsElement|null>(null)
const title=computed(()=>props.locale==='es'?'Formatos y límites de los adjuntos':'Attachment formats and limits')
const limit=computed(()=>props.locale==='es'
 ? `Hasta ${props.maxFiles} archivos. Máximo: ${props.maxBytes/1048576} MiB ${props.perFile?'por archivo':'en total'}.`
 : `Up to ${props.maxFiles} files. Maximum: ${props.maxBytes/1048576} MiB ${props.perFile?'per file':'total'}.`)
function close(){if(details.value){details.value.open=false;details.value.querySelector('summary')?.focus()}}
</script>
<template>
  <details ref="details" class="attachment-limits" @keydown.esc.prevent="close">
    <summary :aria-label="title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".8" fill="currentColor" stroke="none"/></svg></summary>
    <div class="attachment-limits__panel"><strong>{{ title }}</strong><p>{{ locale==='es'?'Formatos admitidos: PDF, PNG y JPG.':'Supported formats: PDF, PNG and JPG.' }}</p><p>{{ limit }}</p></div>
  </details>
</template>
<style scoped>
.attachment-limits {flex-shrink:0}
.attachment-limits summary {display:grid;place-items:center;list-style:none;width:44px;height:44px;border-radius:50%;color:var(--cue-muted);cursor:pointer}
.attachment-limits summary::-webkit-details-marker {display:none}
.attachment-limits summary:focus-visible {outline:2px solid var(--cue-accent);outline-offset:2px}
.attachment-limits[open] summary {color:var(--cue-text);background:var(--cue-surface)}
.attachment-limits__panel {position:absolute;inset-inline-start:0;top:calc(100% + 4px);z-index:12;box-sizing:border-box;width:min(340px,100%);padding:12px 14px;border:1px solid var(--cue-border);border-radius:12px;background:var(--cue-raised);color:var(--cue-text);box-shadow:0 8px 24px #0003;font-size:12px;line-height:1.5;overflow-wrap:anywhere}
.attachment-limits__panel strong {font-size:12px}
.attachment-limits__panel p {margin:6px 0 0}
</style>
