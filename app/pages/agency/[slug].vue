<script setup lang="ts">
import type { AgencyCatalog } from '../../domain/agencyCatalog'
import { submitPublicAgencyEnquiry, submitPublicBookingRequest } from '../../services/publicBookingIngressApi'
import type { PublicBookingRequestInput } from '../../domain/publicArtistProfile'

const route=useRoute(),config=useRuntimeConfig(),preferences=useCuePreferences()
const agency=ref<AgencyCatalog|null>(null),loading=ref(true),error=ref<'not_found'|'failed'|''>('')
const es=computed(()=>preferences.locale.value==='es')
const enquirySubmitting=ref(false),enquirySent=ref(false),enquiryError=ref('')
let sequence=0
async function load(){
 const current=++sequence;loading.value=true;error.value='';agency.value=null
 try{
  const slug=String(route.params.slug||'').toLowerCase()
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>120){error.value='not_found';return}
  const response=await fetch(`${String(config.public.supabaseUrl).replace(/\/$/,'')}/functions/v1/get-public-artist-profile?agency=${encodeURIComponent(slug)}`)
  if(!response.ok){if(current===sequence)error.value=response.status===404?'not_found':'failed';return}
  const result=await response.json();if(current===sequence)agency.value=result.agency
 }catch{if(current===sequence)error.value='failed'}finally{if(current===sequence)loading.value=false}
}
async function submitEnquiry(payload:{artistSlug:string|null;contactName:string;contactEmail:string;initialMessage:string;website:string}){
 if(!agency.value||enquirySubmitting.value||enquirySent.value)return
 enquirySubmitting.value=true;enquiryError.value=''
 const supabaseUrl=String(config.public.supabaseUrl||'')
 const requestId=crypto.randomUUID()
 try{
  if(payload.artistSlug){
   const bookingInput:PublicBookingRequestInput={
    artistSlug:payload.artistSlug,requestId,contactName:payload.contactName,contactEmail:payload.contactEmail,
    initialMessage:payload.initialMessage,entrySource:'agency_catalog',locale:preferences.locale.value==='en'?'en':'es',website:payload.website
   }
   await submitPublicBookingRequest(supabaseUrl,bookingInput)
  }else{
   await submitPublicAgencyEnquiry(supabaseUrl,{
    agencySlug:agency.value.slug,requestId,contactName:payload.contactName,contactEmail:payload.contactEmail,
    initialMessage:payload.initialMessage,website:payload.website
   })
  }
  enquirySent.value=true
 }catch(error){
  const code=(error as Error)?.message||''
  enquiryError.value=code.includes('429')||code.includes('rate_limited')
   ? (es.value?'Has enviado varios intentos. Espera un momento y vuelve a probar.':'Several attempts were made. Wait a moment and try again.')
   : (es.value?'No se pudo enviar. Tus datos siguen aquí; inténtalo de nuevo.':'Could not send the enquiry. Your details are still here; please try again.')
 }finally{enquirySubmitting.value=false}
}
onMounted(load)
watch(()=>route.params.slug,()=>{enquirySent.value=false;enquiryError.value='';load()})
useHead(()=>({title:agency.value?`${agency.value.name} · Artist roster | Cuebooker`:'Agency | Cuebooker',meta:[{name:'description',content:agency.value?.tagline||agency.value?.bio?.slice(0,160)||''},{name:'robots',content:agency.value?'index,follow':'noindex,nofollow'}]}))
</script>
<template><main><div class="public-agency-preferences"><CuePreferencesControl compact /></div><section v-if="loading" class="public-agency-state" aria-busy="true"><CueBrand decorative /><p>{{ es?'Cargando agencia…':'Loading agency…' }}</p></section><section v-else-if="error||!agency" class="public-agency-state"><h1>{{ error==='not_found'?(es?'Esta agencia no está publicada.':'This agency is not published.'):(es?'No se pudo cargar la agencia.':'Could not load the agency.') }}</h1><button v-if="error==='failed'" type="button" @click="load">{{ es?'Reintentar':'Retry' }}</button><NuxtLink to="/">Cuebooker</NuxtLink></section><PublicAgencyProfile v-else :agency="agency" :locale="preferences.locale.value" :enquiry-submitting="enquirySubmitting" :enquiry-sent="enquirySent" :enquiry-error="enquiryError" @submit-enquiry="submitEnquiry" /></main></template>
<style scoped>.public-agency-state{min-height:70vh;display:grid;align-content:center;justify-items:center;gap:20px;padding:24px;background:var(--cue-bg);color:var(--cue-text)}.public-agency-state :deep(svg){width:180px}.public-agency-state a{color:var(--cue-accent)}.public-agency-preferences{position:absolute;top:83px;right:20px;z-index:5}</style>