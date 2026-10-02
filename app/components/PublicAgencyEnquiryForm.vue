<script setup lang="ts">
import type { AgencyCatalogArtist } from '../domain/agencyCatalog'
const props=withDefaults(defineProps<{artists:AgencyCatalogArtist[];locale:'es'|'en';submitting?:boolean;sent?:boolean;error?:string}>(),{submitting:false,sent:false,error:''})
const emit=defineEmits<{submit:[payload:{artistSlug:string|null;contactName:string;contactEmail:string;initialMessage:string;website:string}]}>()
const form=reactive({artistSlug:'',contactName:'',contactEmail:'',initialMessage:'',website:''})
const es=computed(()=>props.locale==='es')
const message=computed(()=>props.error||(es.value?'No se pudo enviar. Inténtalo de nuevo.':'Could not send. Please try again.'))
function send(){
 if(props.submitting||props.sent||!form.contactName.trim()||!/^\S+@\S+\.\S+$/.test(form.contactEmail.trim())||!form.initialMessage.trim())return
 emit('submit',{artistSlug:form.artistSlug||null,contactName:form.contactName.trim(),contactEmail:form.contactEmail.trim(),initialMessage:form.initialMessage.trim(),website:form.website})
}
</script>
<template>
 <form class="agency-enquiry" @submit.prevent="send">
  <p v-if="sent" class="agency-enquiry__success" role="status">{{ es?'Consulta enviada. El equipo de la agencia ya la ha recibido.':'Enquiry sent. The agency team has received it.' }}</p>
  <template v-else>
   <label class="agency-enquiry__field"><span>{{ es?'Artista (opcional)':'Artist (optional)' }}</span><select v-model="form.artistSlug"><option value="">{{ es?'Consulta general a la agencia':'General agency enquiry' }}</option><option v-for="artist in artists" :key="artist.id" :value="artist.slug">{{ artist.name }}</option></select></label>
   <div class="agency-enquiry__row">
    <label class="agency-enquiry__field"><span>{{ es?'Tu nombre':'Your name' }}</span><input v-model="form.contactName" required maxlength="160" autocomplete="name"></label>
    <label class="agency-enquiry__field"><span>{{ es?'Email de respuesta':'Reply email' }}</span><input v-model="form.contactEmail" required maxlength="320" type="email" autocomplete="email"></label>
   </div>
   <label class="agency-enquiry__field"><span>{{ es?'¿Qué tienes en mente?':'What are you looking for?' }}</span><textarea v-model="form.initialMessage" required maxlength="10000" rows="5" :placeholder="es?'Cuéntanos brevemente sobre la fecha, el evento o tu idea…':'Tell us briefly about the date, event or idea…'"></textarea></label>
   <label class="agency-enquiry__honeypot" aria-hidden="true">Website<input v-model="form.website" tabindex="-1" autocomplete="off"></label>
   <p v-if="error" class="agency-enquiry__error" role="alert">{{ message }}</p>
   <p class="agency-enquiry__privacy">{{ es?'El equipo de la agencia recibirá tus datos para responder a esta consulta.':'The agency team will receive your details to reply to this enquiry.' }}</p>
   <button class="agency-enquiry__submit" type="submit" :disabled="submitting">{{ submitting?(es?'Enviando…':'Sending…'):(es?'Enviar consulta':'Send enquiry') }} <span aria-hidden="true">↗</span></button>
  </template>
 </form>
</template>
<style scoped>
.agency-enquiry{display:grid;gap:18px;max-width:720px;margin-top:30px}.agency-enquiry__row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.agency-enquiry__field{display:grid;gap:8px;color:var(--cue-text);font:700 12px/1.4 monospace;letter-spacing:.04em}.agency-enquiry input,.agency-enquiry select,.agency-enquiry textarea{width:100%;min-width:0;border:1px solid var(--cue-border);border-radius:12px;background:var(--cue-bg);color:var(--cue-text);padding:14px 15px;font:inherit;font-size:16px;line-height:1.5;letter-spacing:normal}.agency-enquiry textarea{resize:vertical;min-height:125px}.agency-enquiry input:focus,.agency-enquiry select:focus,.agency-enquiry textarea:focus{outline:2px solid var(--cue-accent);outline-offset:2px}.agency-enquiry__submit{justify-self:start;display:flex;align-items:center;gap:12px;border:0;border-radius:12px;padding:14px 20px;background:var(--cue-accent);color:#171b13;font:700 14px monospace;cursor:pointer}.agency-enquiry__submit:disabled{opacity:.6;cursor:wait}.agency-enquiry__privacy{margin:0;color:var(--cue-muted);font:12px/1.6 monospace}.agency-enquiry__error{margin:0;color:#ff808b}.agency-enquiry__success{border-left:3px solid var(--cue-accent);padding:16px;background:color-mix(in srgb,var(--cue-accent) 10%,transparent);line-height:1.5}.agency-enquiry__honeypot{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media(max-width:600px){.agency-enquiry__row{grid-template-columns:1fr}}
</style>