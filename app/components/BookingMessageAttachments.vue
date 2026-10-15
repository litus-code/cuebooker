<script setup lang="ts">
import type {ConversationAttachment} from '../domain/conversationAttachments'
defineProps<{files:ConversationAttachment[];warnings:Array<{id:string;text:string}>;locale:'es'|'en'}>()
const emit=defineEmits<{open:[id:string]}>()
</script>
<template>
  <section v-if="files.length || warnings.length" class="message-documents" :aria-label="locale==='es'?'Adjuntos de este mensaje':'Attachments for this message'">
    <strong>{{ locale==='es'?'Archivos adjuntos':'Attachments' }}</strong>
    <ul v-if="warnings.length" class="message-documents__warnings" role="status" aria-live="polite"><li v-for="warning in warnings" :key="warning.id">{{ warning.text }}</li></ul>
    <div class="message-documents__files">
      <button v-for="file in files" :key="file.id" type="button" @click="emit('open',file.id)">
        <span class="message-documents__type" aria-hidden="true">{{ /pdf$/i.test(file.file_name)?'PDF':'IMG' }}</span>
        <span class="message-documents__name">{{ file.file_name }}</span>
        <small>{{ Math.ceil(file.byte_size/1024) }} KB</small>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/></svg>
      </button>
    </div>
  </section>
</template>
<style scoped>
.message-documents {display:grid;gap:8px;min-width:0;margin-top:12px;padding-top:10px;border-top:1px solid var(--cue-border);font-size:12px}
.message-documents__warnings {display:grid;gap:6px;margin:0;padding:10px 12px 10px 28px;border-left:3px solid #d99b25;border-radius:8px;background:color-mix(in srgb,#d99b25 12%,var(--cue-surface));color:var(--cue-text);line-height:1.5;overflow-wrap:anywhere}
.message-documents__files {display:grid;gap:6px;min-width:0}
.message-documents button {display:flex;align-items:center;gap:8px;box-sizing:border-box;width:100%;min-width:0;min-height:44px;padding:10px;border:1px solid var(--cue-border);border-radius:9px;background:var(--cue-surface);color:var(--cue-text);text-align:left;cursor:pointer;font:inherit}
.message-documents button:hover {border-color:var(--cue-accent)}
.message-documents button:focus-visible {outline:2px solid var(--cue-accent);outline-offset:2px}
.message-documents__type {flex:none;font:700 10px monospace;color:var(--cue-accent)}
.message-documents__name {flex:1;min-width:0;overflow-wrap:anywhere}
.message-documents small {flex:none;color:var(--cue-muted);font-size:10px}
.message-documents svg {flex:none}
</style>
