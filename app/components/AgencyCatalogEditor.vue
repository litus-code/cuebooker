<script setup lang="ts">
import type { PublicArtistProfile } from '../domain/publicArtistProfile'
import type { AgencyCatalog } from '../domain/agencyCatalog'
import { agencyCatalogPreview } from '../domain/agencyCatalog'
import { getPublicArtistProfile } from '../services/publicBookingIngressApi'
const props=withDefaults(defineProps<{workspaceId:string;role:string;locale:'es'|'en';demo?:boolean}>(),{demo:false})
const emit=defineEmits<{editArtist:[id:string]}>()
const api=useAgencyCatalog(),config=useRuntimeConfig()
const editable=computed(()=>['owner','admin'].includes(props.role))
const es=computed(()=>props.locale==='es')
const catalog=ref<AgencyCatalog|null>(null),visibleIds=ref<string[]>([]),loading=ref(false),saving=ref(false),error=ref(''),notice=ref('')
const savedPublished=ref(false)
const previewArtistId=ref('')
const demoProfile=computed<PublicArtistProfile|null>(()=>{
 const a=catalog.value?.artists.find(a=>a.id===previewArtistId.value)
 if(!props.demo||!a)return null
 return {stageName:a.name,slug:a.slug,bio:es.value?'Ficha ficticia para revisar el recorrido Agencia → Artista → Booking. Los datos no se publican.':'Fictional profile to review Agency → Artist → Booking. This data is not published.',city:a.city,countryCode:'ES',languages:['ES','EN'],primaryGenres:a.genres,secondaryGenres:[],performanceFormats:['DJ set'],eventTypes:['Club'],yearsActive:null,websiteUrl:null,instagramUrl:null,soundcloudUrl:null,mixcloudUrl:null,youtubeUrl:null,spotifyUrl:null,coverUrl:null,coverPositionY:50,artistImageUrl:null,artistCutoutUrl:null,artistImageStyle:'photo',artistImagePositionX:50,artistImagePositionY:50,artistImageScale:1,acceptingRequests:true,bookingManagedBy:catalog.value?.name||null}
})
const previewDialog=ref<HTMLDialogElement|null>(null)
const previewData=computed(()=>catalog.value ? agencyCatalogPreview(catalog.value,visibleIds.value) : null)
const publicUrl=computed(()=>catalog.value && import.meta.client ? `${window.location.origin}/agency/${catalog.value.slug}` : '')
const fields=[{id:'tagline',es:'Frase de portada',en:'Cover tagline',max:254},{id:'city',es:'Ciudad base',en:'Base city',max:254},{id:'coverUrl',es:'Imagen de portada · URL HTTPS',en:'Cover image · HTTPS URL',max:2048},{id:'logoUrl',es:'Logo · URL HTTPS',en:'Logo · HTTPS URL',max:2048},{id:'contactEmail',es:'Email público de booking',en:'Public booking email',max:254},{id:'instagramUrl',es:'Instagram · URL HTTPS',en:'Instagram · HTTPS URL',max:2048},{id:'websiteUrl',es:'Web · URL HTTPS',en:'Website · HTTPS URL',max:2048}] as const
async function load(){
 if(!editable.value)return
 loading.value=true;error.value=''
 try{
  catalog.value=props.demo ? {name:'CUE Test Agency',slug:'cue-test-agency',published:false,tagline:'Independent sounds. Shared direction.',bio:'Representamos artistas de club con una identidad propia. Conectamos su música con salas, festivales y proyectos que comparten nuestra visión.',city:'Barcelona / Madrid',coverUrl:null,logoUrl:null,contactEmail:'booking@example.invalid',instagramUrl:null,websiteUrl:null,artists:[{id:'demo-mara',name:'Mara Velt',slug:'mara-velt',city:'Barcelona',genres:['Techno'],catalogVisible:true,eligible:true,acceptingRequests:true},{id:'demo-nox',name:'Nox Arda',slug:'nox-arda',city:'Madrid',genres:['Electro'],catalogVisible:true,eligible:true,acceptingRequests:true}]} : await api.load(props.workspaceId)
  savedPublished.value=Boolean(catalog.value?.published)
  visibleIds.value=catalog.value?.artists.filter(a=>a.catalogVisible&&a.eligible).map(a=>a.id)||[]
 }catch{error.value=es.value?'No se pudo cargar la página de agencia.':'Could not load the agency page.'}finally{loading.value=false}
}
watch(()=>[props.workspaceId,props.role],load,{immediate:true})
async function save(){
 if(!editable.value||!catalog.value||saving.value)return
 saving.value=true;error.value='';notice.value=''
 try{
  if(!props.demo) catalog.value=await api.save(props.workspaceId,catalog.value,visibleIds.value)
  savedPublished.value=Boolean(catalog.value.published)
  notice.value=props.demo ? (es.value?'Simulación guardada en esta preview. No se ha publicado.':'Saved in this preview only. Nothing was published.') : es.value?'Página guardada.':'Page saved.'
 }catch(cause:any){ const raw=String(cause?.data?.message||cause?.message||'');error.value=raw.includes('catalog_publication_incomplete') ? (es.value?'Para publicar, añade presentación, email y al menos un artista preparado.':'Add a bio, email and at least one ready artist to publish.') : raw.includes('catalog_artist_not_ready') ? (es.value?'Hay una ficha que ya no está preparada. Recarga y revisa su perfil público y gestión del booking.':'An artist is no longer ready. Reload and check public profile and booking management.') : es.value?'No se pudo guardar. Revisa los campos y las URLs HTTPS.':'Could not save. Check the fields and HTTPS URLs.' }finally{saving.value=false}
}
async function openPreview(){
 if(!catalog.value)return
 previewArtistId.value=''
 error.value=''
 if(!props.demo) await Promise.all(catalog.value.artists.filter(a=>a.eligible&&visibleIds.value.includes(a.id)).map(async a=>{try{const profile=await getPublicArtistProfile(String(config.public.supabaseUrl),a.slug);a.imageUrl=profile.artistImageUrl;a.coverUrl=profile.coverUrl}catch{a.imageUrl=null;a.coverUrl=null}}))
 previewDialog.value?.showModal()
}
async function copyLink(){try{await navigator.clipboard.writeText(publicUrl.value);notice.value=es.value?'Enlace copiado.':'Link copied.'}catch{notice.value=publicUrl.value}}
</script>
<template>
 <section v-if="editable" class="agency-catalog-editor">
  <p class="agency-catalog-editor__label">AGENCY / {{ es ? 'PÁGINA PÚBLICA' : 'PUBLIC PAGE' }}</p><h3>{{ es ? 'Tu agencia, lista para compartir.' : 'Your agency, ready to share.' }}</h3><p>{{ es ? 'Presenta tu identidad y elige qué artistas muestras. Las solicitudes siguen llegando al Booking Core de tu agencia.' : 'Present your identity and choose featured artists. Requests enter your agency Booking Core.' }}</p>
  <p v-if="loading" role="status">{{ es ? 'Cargando página…' : 'Loading page…' }}</p><p v-if="error" role="alert" class="agency-catalog-editor__error">{{ error }} <button v-if="!catalog" type="button" @click="load">{{ es ? 'Reintentar' : 'Retry' }}</button></p>
  <form v-if="catalog" @submit.prevent="save">
   <div class="agency-catalog-editor__fields"><label v-for="field in fields" :key="field.id"><span>{{ es ? field.es : field.en }}</span><input v-model="catalog[field.id]" :type="field.id==='contactEmail'?'email':field.id.endsWith('Url')?'url':'text'" :maxlength="field.max" :placeholder="field.id.endsWith('Url')?'https://…':undefined"></label></div>
   <label><span>{{ es ? 'Presentación de la agencia' : 'About the agency' }}</span><textarea v-model="catalog.bio" maxlength="4000" rows="4" /></label>
   <fieldset><legend>{{ es ? 'Artistas del catálogo público' : 'Public catalogue artists' }}</legend><p>{{ es ? 'Primero activa su perfil público y confirma que tu agencia gestiona su booking. Las fichas incompletas o retiradas no se publican.' : 'Enable each public profile and confirm your agency manages its booking. Unready or retired profiles stay private.' }}</p><div v-for="artist in catalog.artists" :key="artist.id" class="agency-catalog-editor__artist"><label><input v-model="visibleIds" type="checkbox" :value="artist.id" :disabled="!artist.eligible"><span>{{ artist.name }}<small>{{ artist.eligible ? (es?'Ficha preparada':'Profile ready') : (es?'Revisar perfil público y gestión del booking':'Check public profile and booking management') }}</small></span></label><button type="button" @click="emit('editArtist',artist.id)">{{ es ? 'Editar ficha' : 'Edit record' }}</button></div><p v-if="!catalog.artists.length">{{ es ? 'Añade artistas desde tu roster.' : 'Add artists to your roster.' }}</p></fieldset>
   <label class="agency-catalog-editor__publish"><input v-model="catalog.published" type="checkbox"><span>{{ es ? 'Publicar la landing de agencia' : 'Publish the agency landing' }}<small>{{ es ? 'Tu presentación, contacto y selección de artistas serán públicos al guardar.' : 'Your bio, contact and artist selection become public when saved.' }}</small></span></label>
   <div class="agency-catalog-editor__actions"><button type="submit" :disabled="saving">{{ saving ? (es?'Guardando…':'Saving…') : (es?'Guardar página':'Save page') }}</button><button type="button" @click="openPreview">{{ es ? 'Vista previa' : 'Preview' }}</button><button v-if="savedPublished&&!demo" type="button" @click="copyLink">{{ es ? 'Copiar enlace' : 'Copy link' }}</button></div><p v-if="savedPublished&&!demo" class="agency-catalog-editor__url"><a :href="publicUrl" target="_blank" rel="noopener">{{ publicUrl }}</a></p><p v-if="notice" role="status">{{ notice }}</p>
  </form>
  <dialog ref="previewDialog" class="agency-catalog-preview"><div class="agency-catalog-preview__bar"><span>{{ es ? 'VISTA PREVIA · CONTENIDO SIN PUBLICAR' : 'PREVIEW · UNSAVED CONTENT' }}</span><button v-if="previewArtistId" type="button" @click="previewArtistId=''">← Roster</button><button type="button" @click="previewDialog?.close()">{{ es ? 'Cerrar' : 'Close' }} ×</button></div><PublicArtistProfile v-if="demoProfile" :profile="demoProfile" :locale="locale" preview /><PublicAgencyProfile v-else-if="previewData" :agency="previewData" :locale="locale" preview :demo="demo" @open-artist="previewArtistId=$event" /></dialog>
 </section>
</template>
<style scoped>
.agency-catalog-editor{border-top:1px solid var(--cue-border);padding:22px 0}.agency-catalog-editor__label{font:700 10px monospace;color:var(--cue-accent);letter-spacing:.12em}.agency-catalog-editor h3{font-size:25px;letter-spacing:-.04em;margin:10px 0}.agency-catalog-editor p{font-size:12px;line-height:1.6;color:var(--cue-muted)}.agency-catalog-editor__fields{display:grid;grid-template-columns:1fr 1fr;gap:14px}.agency-catalog-editor form>label,.agency-catalog-editor__fields>label{display:grid;gap:7px;margin:12px 0;font-size:12px}.agency-catalog-editor input:not([type=checkbox]),.agency-catalog-editor textarea{box-sizing:border-box;width:100%;min-width:0;padding:11px;border:1px solid var(--cue-border);background:var(--cue-bg);color:var(--cue-text);font:inherit}.agency-catalog-editor fieldset{margin:20px 0;padding:14px;border:1px solid var(--cue-border)}.agency-catalog-editor legend{font-size:12px}.agency-catalog-editor__artist{display:flex;align-items:center;gap:10px;justify-content:space-between;padding:12px 0;border-top:1px solid var(--cue-border)}.agency-catalog-editor__artist label,.agency-catalog-editor__publish{display:flex!important;gap:10px;align-items:start}.agency-catalog-editor small{display:block;font-size:10px;color:var(--cue-muted);margin-top:5px}.agency-catalog-editor button{min-height:38px;padding:9px 12px;border:1px solid var(--cue-border);background:var(--cue-surface);color:var(--cue-text);cursor:pointer}.agency-catalog-editor button:disabled{opacity:.5}.agency-catalog-editor__actions{display:flex;flex-wrap:wrap;gap:8px}.agency-catalog-editor__actions button:first-child{background:var(--cue-accent);color:#151a11}.agency-catalog-editor__url{overflow-wrap:anywhere}.agency-catalog-editor__url a{color:var(--cue-accent)}.agency-catalog-editor__error{color:#ed8989!important}.agency-catalog-preview{width:calc(100vw - 24px);max-width:1500px;height:calc(100dvh - 24px);max-height:none;padding:0;background:var(--cue-bg);color:var(--cue-text);border:1px solid var(--cue-border)}.agency-catalog-preview::backdrop{background:#000c}.agency-catalog-preview__bar{position:sticky;top:0;z-index:10;display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:var(--cue-bg);border-bottom:1px solid var(--cue-border);font:10px monospace}@media(max-width:600px){.agency-catalog-editor__fields{grid-template-columns:1fr}.agency-catalog-editor__artist{align-items:start}.agency-catalog-preview__bar{padding:10px}}
</style>
