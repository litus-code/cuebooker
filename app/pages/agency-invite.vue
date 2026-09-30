<script setup lang="ts">
import { AGENCY_INVITE_STORAGE, validAgencyInviteToken } from '../domain/agencyTeam'
const auth=useCueAuth(),api=useAgencyTeam(),route=useRoute(),router=useRouter()
const {locale}=useCuePreferences()
const es=computed(()=>locale.value==='es')
const busy=ref(true),error=ref(''),token=ref('')
const invitation=ref<{workspace_id:string;agency_name:string;role:string;accepted:boolean}|null>(null)
function failure(e:any){const raw=String(e?.data?.message||e?.message||'');return raw.includes('invitation_email_mismatch')?(es.value?'Accede con el correo al que se dirigió la invitación y verifica esa cuenta.':'Sign in with the invited email and verify that account.'):raw.includes('invitation_unavailable')?(es.value?'Esta invitación ha caducado, fue revocada o ya no está disponible. Pide un nuevo enlace.':'This invitation expired, was revoked or is unavailable. Request a new link.'):(es.value?'No se pudo cargar la invitación. Vuelve a intentarlo.':'Could not load the invitation. Please retry.')}
async function review(){
 busy.value=true;error.value=''
 try{if(auth.signedIn.value&&token.value)invitation.value=await api.reviewInvitation(token.value)}catch(e){error.value=failure(e)}finally{busy.value=false}
}
onMounted(async()=>{
 const incoming=new URLSearchParams(route.hash.slice(1)).get('token')
 if(validAgencyInviteToken(incoming)){token.value=incoming;sessionStorage.setItem(AGENCY_INVITE_STORAGE,incoming);await router.replace({hash:''})}
 else{const saved=sessionStorage.getItem(AGENCY_INVITE_STORAGE);if(validAgencyInviteToken(saved))token.value=saved}
 await auth.initialize()
 if(!token.value){error.value=es.value?'Abre el enlace original de la invitación.':'Open the original invitation link.';busy.value=false;return}
 await review()
})
async function accept(){
 if(busy.value||!invitation.value)return
 busy.value=true;error.value=''
 try{const result=await api.reviewInvitation(token.value,true);sessionStorage.removeItem(AGENCY_INVITE_STORAGE);await auth.fetchProfile();await navigateTo({path:'/workspace',query:{view:'overview',scope:'all',agency:result.workspace_id}})}catch(e){error.value=failure(e);busy.value=false}
}
async function switchAccount(){ await auth.signOut(); await navigateTo('/access') }
function leave(){sessionStorage.removeItem(AGENCY_INVITE_STORAGE);return navigateTo(auth.signedIn.value?auth.accountDestination():'/access')}
useHead({title:'Equipo Agency | Cuebooker',meta:[{name:'robots',content:'noindex,nofollow'},{name:'referrer',content:'no-referrer'}]})
</script>
<template>
 <main class="agency-invite"><section><NuxtLink to="/" aria-label="Cuebooker"><CueBrand class="agency-invite__brand" /></NuxtLink><span>AGENCY / {{ es?'INVITACIÓN':'INVITATION' }}</span><h1>{{ invitation?.agency_name||(es?'Únete al equipo.':'Join the team.') }}</h1><p v-if="busy" role="status">{{ es?'Comprobando invitación…':'Checking invitation…' }}</p><p v-if="error" role="alert">{{ error }}</p><template v-if="!busy&&token&&!auth.signedIn.value"><p>{{ es?'Entra o crea una cuenta con el correo invitado. Si debes verificar tu email, vuelve a abrir este enlace después.':'Sign in or create an account with the invited email. If you need to verify your email, reopen this link afterwards.' }}</p><NuxtLink to="/access?next=/agency-invite">{{ es?'Entrar o crear cuenta':'Sign in or create account' }}</NuxtLink></template><template v-if="invitation&&!busy"><p>{{ es?'Tu rol':'Your role' }}: {{ invitation.role }}. {{ es?'El acceso incluye todo el roster y los datos privados del workspace según este rol.':'Access covers the entire roster and private workspace data according to this role.' }}</p><button type="button" @click="accept">{{ invitation.accepted?(es?'Entrar a la agencia':'Open agency'):(es?'Aceptar invitación':'Accept invitation') }}</button></template><button v-if="error&&auth.signedIn.value" type="button" :disabled="busy" @click="switchAccount">{{ es?'Entrar con otra cuenta':'Sign in with another account' }}</button><button v-if="error&&auth.signedIn.value&&token" type="button" :disabled="busy" @click="review">{{ es?'Reintentar':'Retry' }}</button><button type="button" class="agency-invite__leave" :disabled="busy" @click="leave">{{ es?'Salir de la invitación':'Leave invitation' }}</button></section></main>
</template>
<style scoped>
.agency-invite{display:grid;place-items:center;min-height:100dvh;padding:24px;background:var(--cue-bg);color:var(--cue-text)}.agency-invite section{width:min(600px,100%);box-sizing:border-box;border:1px solid var(--cue-border);padding:clamp(24px,5vw,50px)}.agency-invite__brand{width:160px;height:52px;margin-bottom:36px}.agency-invite span{font:700 11px monospace;color:var(--cue-accent);letter-spacing:.12em}.agency-invite h1{font-size:clamp(2.5rem,6vw,4rem);letter-spacing:-.05em;line-height:1.05;overflow-wrap:anywhere}.agency-invite p{color:var(--cue-muted);line-height:1.6}.agency-invite button,.agency-invite section>a:not(:first-child){display:block;min-height:44px;padding:12px 18px;box-sizing:border-box;border:1px solid var(--cue-border);background:var(--cue-accent);color:#080808;cursor:pointer;text-decoration:none;font:700 13px Arial;margin-top:20px}.agency-invite .agency-invite__leave{background:transparent;color:var(--cue-text)}
</style>
