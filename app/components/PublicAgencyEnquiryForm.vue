<script setup lang="ts">
import type { AgencyCatalogArtist } from '../domain/agencyCatalog'
import { safeAgencyImage } from '../domain/agencyCatalog'
const props=withDefaults(defineProps<{artists:AgencyCatalogArtist[];locale:'es'|'en';submitting?:boolean;sent?:boolean;error?:string;preview?:boolean}>(),{submitting:false,sent:false,error:'',preview:false})
const emit=defineEmits<{submit:[payload:{artistSlug:string|null;contactName:string;contactEmail:string;initialMessage:string;website:string}]}>()
const form=reactive({artistSlug:'',contactName:'',contactEmail:'',initialMessage:'',website:''})
const es=computed(()=>props.locale==='es')
const artistPickerOpen=ref(false)
const selectedArtist=computed(()=>props.artists.find(artist=>artist.slug===form.artistSlug)||null)
function artistImage(artist:AgencyCatalogArtist){return safeAgencyImage(artist.imageUrl||artist.coverUrl)||''}
function chooseArtist(slug:string){form.artistSlug=slug;artistPickerOpen.value=false}
const message=computed(()=>props.error||(es.value?'No se pudo enviar. Inténtalo de nuevo.':'Could not send. Please try again.'))
function send(){
 if(props.preview||props.submitting||props.sent||!form.contactName.trim()||!/^\S+@\S+\.\S+$/.test(form.contactEmail.trim())||!form.initialMessage.trim())return
 emit('submit',{artistSlug:form.artistSlug||null,contactName:form.contactName.trim(),contactEmail:form.contactEmail.trim(),initialMessage:form.initialMessage.trim(),website:form.website})
}
</script>
<template>
 <form class="agency-enquiry" @submit.prevent="send">
  <p v-if="sent" class="agency-enquiry__success" role="status">{{ es?'Consulta enviada. El equipo de la agencia ya la ha recibido.':'Enquiry sent. The agency team has received it.' }}</p>
  <p v-if="preview" class="agency-enquiry__privacy">{{ es?'Vista previa: el formulario no enviará una solicitud.':'Preview only: this form will not send an enquiry.' }}</p>
   <div class="agency-enquiry__field"><span id="agency-enquiry-artist-label">{{ es?'Artista (opcional)':'Artist (optional)' }}</span><div class="agency-enquiry__artist-picker" @keydown.esc.stop.prevent="artistPickerOpen=false"><button type="button" class="agency-enquiry__artist-trigger" role="combobox" aria-labelledby="agency-enquiry-artist-label" aria-haspopup="listbox" aria-controls="agency-enquiry-artist-options" :aria-expanded="artistPickerOpen" @click="artistPickerOpen=!artistPickerOpen"><img v-if="selectedArtist&&artistImage(selectedArtist)" :src="artistImage(selectedArtist)" :alt="''"><span v-else class="agency-enquiry__artist-mark" aria-hidden="true">{{ selectedArtist ? selectedArtist.name.slice(0,2).toUpperCase() : 'CB' }}</span><span class="agency-enquiry__artist-choice">{{ selectedArtist?.name || (es?'Consulta general a la agencia':'General agency enquiry') }}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button><div v-if="artistPickerOpen" id="agency-enquiry-artist-options" class="agency-enquiry__artist-options" role="listbox" aria-labelledby="agency-enquiry-artist-label"><button type="button" role="option" :aria-selected="!form.artistSlug" @click="chooseArtist('')"><span class="agency-enquiry__artist-mark" aria-hidden="true">CB</span><span class="agency-enquiry__artist-choice">{{ es?'Consulta general a la agencia':'General agency enquiry' }}</span><span v-if="!form.artistSlug" class="agency-enquiry__artist-check" aria-hidden="true">✓</span></button><button v-for="artist in artists" :key="artist.id" type="button" role="option" :aria-selected="form.artistSlug===artist.slug" @click="chooseArtist(artist.slug)"><img v-if="artistImage(artist)" :src="artistImage(artist)" :alt="''" loading="lazy"><span v-else class="agency-enquiry__artist-mark" aria-hidden="true">{{ artist.name.slice(0,2).toUpperCase() }}</span><span class="agency-enquiry__artist-choice">{{ artist.name }}</span><span v-if="form.artistSlug===artist.slug" class="agency-enquiry__artist-check" aria-hidden="true">✓</span></button></div></div></div>
   <div class="agency-enquiry__row">
    <label class="agency-enquiry__field"><span>{{ es?'Tu nombre':'Your name' }}</span><input v-model="form.contactName" required maxlength="160" autocomplete="name"></label>
    <label class="agency-enquiry__field"><span>{{ es?'Email de respuesta':'Reply email' }}</span><input v-model="form.contactEmail" required maxlength="320" type="email" autocomplete="email"></label>
   </div>
   <label class="agency-enquiry__field"><span>{{ es?'¿Qué tienes en mente?':'What are you looking for?' }}</span><textarea v-model="form.initialMessage" required maxlength="10000" rows="5" :placeholder="es?'Cuéntanos brevemente sobre la fecha, el evento o tu idea…':'Tell us briefly about the date, event or idea…'"></textarea></label>
   <label class="agency-enquiry__honeypot" aria-hidden="true">Website<input v-model="form.website" tabindex="-1" autocomplete="off"></label>
   <p v-if="error" class="agency-enquiry__error" role="alert">{{ message }}</p>
   <p class="agency-enquiry__privacy">{{ es?'El equipo de la agencia recibirá tus datos para responder a esta consulta.':'The agency team will receive your details to reply to this enquiry.' }}</p>
   <button class="agency-enquiry__submit" type="submit" :disabled="preview || submitting">{{ submitting?(es?'Enviando…':'Sending…'):(es?'Enviar consulta':'Send enquiry') }} <span aria-hidden="true">↗</span></button>
 </form>
</template>
<style scoped>
.agency-enquiry{display:grid;gap:18px;max-width:720px;margin-top:30px}.agency-enquiry__row{display:grid;grid-template-columns:1fr 1fr;gap:16px}.agency-enquiry__field{display:grid;gap:8px;color:var(--cue-text);font:700 12px/1.4 monospace;letter-spacing:.04em}.agency-enquiry input,.agency-enquiry select,.agency-enquiry textarea{width:100%;min-width:0;border:1px solid var(--cue-border);border-radius:12px;background:var(--cue-bg);color:var(--cue-text);padding:14px 15px;font:inherit;font-size:16px;line-height:1.5;letter-spacing:normal}.agency-enquiry textarea{resize:vertical;min-height:125px}.agency-enquiry input:focus,.agency-enquiry select:focus,.agency-enquiry textarea:focus{outline:2px solid var(--cue-accent);outline-offset:2px}.agency-enquiry__submit{justify-self:start;display:flex;align-items:center;gap:12px;border:0;border-radius:12px;padding:14px 20px;background:var(--cue-accent);color:#171b13;font:700 14px monospace;cursor:pointer}.agency-enquiry__submit:disabled{opacity:.6;cursor:wait}.agency-enquiry__privacy{margin:0;color:var(--cue-muted);font:12px/1.6 monospace}.agency-enquiry__error{margin:0;color:#ff808b}.agency-enquiry__success{border-left:3px solid var(--cue-accent);padding:16px;background:color-mix(in srgb,var(--cue-accent) 10%,transparent);line-height:1.5}.agency-enquiry__honeypot{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}@media(max-width:600px){.agency-enquiry__row{grid-template-columns:1fr}}

.agency-enquiry__artist-picker{position:relative}
.agency-enquiry__artist-trigger{display:flex;align-items:center;gap:12px;width:100%;min-height:58px;padding:8px 14px;border:1px solid var(--cue-border);border-radius:12px;background:var(--cue-bg);color:var(--cue-text);text-align:left;font:inherit;font-size:16px;letter-spacing:normal;cursor:pointer}
.agency-enquiry__artist-trigger:focus-visible,.agency-enquiry__artist-options button:focus-visible{outline:2px solid var(--cue-accent);outline-offset:2px}
.agency-enquiry__artist-trigger>img,.agency-enquiry__artist-options button>img,.agency-enquiry__artist-mark{display:grid;flex:0 0 40px;place-items:center;width:40px;height:40px;border:1px solid var(--cue-border);border-radius:50%;background:var(--cue-surface);color:var(--cue-accent);object-fit:cover;font:800 11px/1 monospace}
.agency-enquiry__artist-choice{flex:1;min-width:0;line-height:1.35}
.agency-enquiry__artist-trigger>svg{width:18px;height:18px;flex:none;fill:none;stroke:currentColor;stroke-width:1.8}
.agency-enquiry__artist-options{position:absolute;z-index:10;top:calc(100% + 8px);right:0;left:0;max-height:min(320px,45vh);overflow:auto;padding:6px;border:1px solid var(--cue-border);border-radius:14px;background:var(--cue-surface);box-shadow:0 16px 40px #0009}
.agency-enquiry__artist-options button{display:flex;align-items:center;gap:12px;width:100%;min-height:56px;padding:8px;border:0;border-radius:9px;background:transparent;color:var(--cue-text);text-align:left;font:inherit;cursor:pointer}
.agency-enquiry__artist-options button:hover,.agency-enquiry__artist-options button[aria-selected=true]{background:color-mix(in srgb,var(--cue-accent) 9%,var(--cue-surface))}
.agency-enquiry__artist-check{color:var(--cue-accent);font-weight:800}
</style>