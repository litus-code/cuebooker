<script setup lang="ts">
import { agencyAssignableRoles, canChangeAgencyMember, canManageAgencyTeam } from '../domain/agencyTeam'
import type { AgencyInvitation, AgencyTeamMember, AgencyTeamRole } from '../domain/agencyTeam'
const props=defineProps<{workspaceId:string;role:string;userId:string;locale:'es'|'en';demo?:boolean}>()
const api=useAgencyTeam()
const es=computed(()=>props.locale==='es')
const members=ref<AgencyTeamMember[]>([]), invitations=ref<AgencyInvitation[]>([])
const loading=ref(false),busy=ref(false),error=ref(''),notice=ref(''),email=ref(''),inviteRole=ref<AgencyTeamRole>('manager'),inviteLink=ref('')
const draftRoles=ref<Record<string,AgencyTeamRole>>({})
const roles=computed(()=>agencyAssignableRoles(props.role))
const pending=computed(()=>invitations.value.filter(i=>!i.accepted_at&&!i.revoked_at&&Date.parse(i.expires_at)>Date.now()))
let sequence=0
function roleName(role:string){return ({owner:'Owner',admin:'Admin',manager:'Manager',editor:'Editor',viewer:'Viewer'} as Record<string,string>)[role]||role}
function message(e:any){
 const raw=String(e?.data?.message||e?.message||'')
 if(raw.includes('already_member')) return es.value?'Esta persona ya forma parte del equipo.':'This person is already a member.'
 if(raw.includes('invitation_limit')) return es.value?'Hay 50 invitaciones pendientes. Revoca alguna antes de crear otra.':'There are 50 pending invitations. Revoke one first.'
 return es.value?'No se pudo completar la operación. Vuelve a intentarlo.':'The operation failed. Please retry.'
}
async function load(){
 const seq=++sequence;error.value='';loading.value=true
 try {
  if(props.demo){
   if(!members.value.length)members.value=[{user_id:'demo-owner',display_name:'Litus',email:'owner@example.invalid',role:'owner'},{user_id:'demo-manager',display_name:'Alex',email:'manager@example.invalid',role:'manager'}]
  } else {
   const [m,i]=await Promise.all([api.listMembers(props.workspaceId),api.listInvitations(props.workspaceId)])
   if(seq!==sequence)return
   members.value=m;invitations.value=i
  }
  draftRoles.value=Object.fromEntries(members.value.map(m=>[m.user_id,m.role]))
 }catch(e){if(seq===sequence)error.value=message(e)}finally{if(seq===sequence)loading.value=false}
}
watch(()=>[props.workspaceId,props.role],()=>{members.value=[];invitations.value=[];inviteLink.value='';if(canManageAgencyTeam(props.role)&&props.workspaceId)void load()},{immediate:true})
async function create(){
 if(busy.value||!email.value.trim()||!roles.value.includes(inviteRole.value as any))return
 busy.value=true;error.value='';notice.value='';inviteLink.value=''
 try{
  if(props.demo){invitations.value.unshift({id:crypto.randomUUID(),email:email.value.trim(),role:inviteRole.value,expires_at:new Date(Date.now()+604800000).toISOString(),accepted_at:null,revoked_at:null});notice.value=es.value?'Invitación simulada. Esta preview no concede acceso ni envía correo.':'Simulated invitation. This preview does not grant access or send email.'}
  else{const i=await api.createInvitation(props.workspaceId,email.value,inviteRole.value);inviteLink.value=`${window.location.origin}/agency-invite#token=${i.token}`;await load();notice.value=es.value?'Enlace creado. Compártelo con la persona invitada. Caduca en 7 días.':'Link created. Share it with the invited person. It expires in 7 days.'}
  email.value=''
 }catch(e){error.value=message(e)}finally{busy.value=false}
}
async function change(member:AgencyTeamMember,remove=false){
 if(busy.value||!canChangeAgencyMember(props.role,props.userId,member))return
 if(remove&&!window.confirm(es.value?`Retirar el acceso de ${member.display_name||member.email} a toda la agencia. Sus bookings y actividad se conservan.`:`Remove ${member.display_name||member.email}'s access to the agency. Bookings and activity remain.`))return
 busy.value=true;error.value='';notice.value=''
 try{
  const role=remove?null:draftRoles.value[member.user_id]
  if(props.demo){if(remove)members.value=members.value.filter(m=>m.user_id!==member.user_id);else member.role=role!}
  else{await api.manageMember(props.workspaceId,member.user_id,role);await load()}
  notice.value=es.value?'Permisos actualizados.':'Permissions updated.'
 }catch(e){error.value=message(e)}finally{busy.value=false}
}
async function revoke(invitation:AgencyInvitation){
 if(busy.value)return
 busy.value=true;error.value=''
 try{if(!props.demo)await api.revokeInvitation(invitation.id);invitation.revoked_at=new Date().toISOString();notice.value=es.value?'Invitación revocada.':'Invitation revoked.'}catch(e){error.value=message(e)}finally{busy.value=false}
}
async function copyLink(){try{await navigator.clipboard.writeText(inviteLink.value);notice.value=es.value?'Enlace copiado.':'Link copied.'}catch{notice.value=es.value?'Selecciona y copia el enlace del campo.':'Select and copy the link below.'}}
</script>
<template>
 <section v-if="canManageAgencyTeam(role)" class="agency-team" aria-labelledby="agency-team-title">
  <header><span>AGENCY / {{ es?'EQUIPO':'TEAM' }}</span><h2 id="agency-team-title">{{ es?'Trabaja con tu equipo.':'Work with your team.' }}</h2><p>{{ es?'Los permisos de esta beta se aplican a todo el roster. Owner y Admin gestionan equipo y artistas; Manager opera bookings y perfiles; Editor opera bookings; Viewer consulta.':'Beta permissions cover the entire roster. Owner and Admin manage team and artists; Manager operates bookings and profiles; Editor operates bookings; Viewer reads.' }}</p></header>
  <p v-if="loading" role="status">{{ es?'Cargando equipo…':'Loading team…' }}</p>
  <p v-if="error" role="alert" class="agency-team__error">{{ error }} <button type="button" :disabled="loading||busy" @click="load">{{ es?'Reintentar':'Retry' }}</button></p>
  <p v-if="notice" role="status">{{ notice }}</p>
  <div class="agency-team__members"><article v-for="member in members" :key="member.user_id"><div><h3>{{ member.display_name||member.email }}</h3><p>{{ member.email }}</p></div><div v-if="canChangeAgencyMember(role,userId,member)" class="agency-team__controls"><select v-model="draftRoles[member.user_id]" :aria-label="`${es?'Rol de':'Role for'} ${member.display_name||member.email}`" :disabled="busy"><option v-for="r in roles" :key="r" :value="r">{{ roleName(r) }}</option></select><button type="button" :disabled="busy||draftRoles[member.user_id]===member.role" @click="change(member)">{{ es?'Guardar':'Save' }}</button><button type="button" :disabled="busy" @click="change(member,true)">{{ es?'Retirar acceso':'Remove access' }}</button></div><span v-else>{{ roleName(member.role) }}{{ member.user_id===userId ? (es?' · Tú':' · You'):'' }}</span></article></div>
  <form class="agency-team__invite" @submit.prevent="create"><h3>{{ es?'Invitar a una persona':'Invite a person' }}</h3><label>Email<input v-model="email" type="email" autocomplete="email" required maxlength="254" :disabled="busy"></label><label>{{ es?'Permisos para todo el roster':'Permissions for the entire roster' }}<select v-model="inviteRole" :disabled="busy"><option v-for="r in roles" :key="r" :value="r">{{ roleName(r) }}</option></select></label><button type="submit" :disabled="busy||loading">{{ busy?'…':es?'Crear enlace de invitación':'Create invitation link' }}</button><p>{{ es?'La persona debe aceptar con este correo verificado. Cuebooker no envía esta invitación automáticamente.':'The person must accept with this verified email. Cuebooker does not send this invitation automatically.' }}</p></form>
  <div v-if="inviteLink" class="agency-team__link"><label>{{ es?'Enlace de invitación':'Invitation link' }}<input :value="inviteLink" readonly @focus="($event.target as HTMLInputElement).select()"></label><button type="button" @click="copyLink">{{ es?'Copiar enlace':'Copy link' }}</button></div>
  <section v-if="pending.length"><h3>{{ es?'Invitaciones pendientes':'Pending invitations' }}</h3><article v-for="i in pending" :key="i.id"><div><p>{{ i.email }} · {{ roleName(i.role) }}</p><small>{{ es?'Caduca':'Expires' }} {{ new Date(i.expires_at).toLocaleDateString(locale) }}</small></div><button v-if="i.role!=='admin'||role==='owner'" type="button" :disabled="busy" @click="revoke(i)">{{ es?'Revocar':'Revoke' }}</button></article></section>
 </section>
</template>
<style scoped>
.agency-team{min-width:0;padding:28px 0;border-top:1px solid var(--cue-border)}.agency-team header>span{font:700 10px monospace;letter-spacing:.12em;color:var(--cue-accent)}.agency-team h2{margin:10px 0;font-size:clamp(1.7rem,3vw,2.6rem);letter-spacing:-.04em}.agency-team p{color:var(--cue-muted);font-size:13px;line-height:1.6;overflow-wrap:anywhere}.agency-team article{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:18px 0;border-bottom:1px solid var(--cue-border)}.agency-team h3{margin:0;font-size:14px}.agency-team article p{margin:5px 0}.agency-team__controls{display:flex;flex-wrap:wrap;gap:8px}.agency-team button,.agency-team select,.agency-team input{min-height:40px;box-sizing:border-box;border:1px solid var(--cue-border);padding:8px 12px;background:var(--cue-surface);color:var(--cue-text);font:inherit;font-size:12px;max-width:100%}.agency-team button{cursor:pointer}.agency-team button:disabled{opacity:.45;cursor:default}.agency-team label{display:grid;gap:8px;font-size:12px;min-width:0}.agency-team__invite{display:grid;gap:16px;margin:32px 0}.agency-team__invite>button{justify-self:start;background:var(--cue-accent);color:#080808;border:0;font-weight:700}.agency-team__link{display:grid;gap:12px;margin-bottom:24px}.agency-team__link input{width:100%}.agency-team__error{border-left:3px solid #e65e6a;padding:12px;background:color-mix(in srgb,#e65e6a 8%,var(--cue-bg))}@media(max-width:680px){.agency-team article{align-items:start;flex-direction:column;gap:12px}.agency-team__controls{width:100%}.agency-team__controls select{flex:1}}
</style>
