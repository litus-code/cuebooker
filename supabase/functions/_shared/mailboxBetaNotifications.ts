type Env = (name: string) => string | undefined;
type Database = <T>(path: string, init?: RequestInit) => Promise<T>;
type Notice = {claimed:boolean;id:string;kind:'requested'|'approved';email:string;recipient:string;locale:'es'|'en';workspaceId:string;userId:string};
const validEmail=(s:string)=>s.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export function betaNotificationText(notice:Notice,workspaceUrl:string){
 if(notice.kind==='requested')return {
  subject:'Cuebooker: solicitud de acceso a la beta de correo',
  textContent:`Un usuario ha solicitado acceso a la beta de correo.\n\nCorreo que quiere conectar: ${notice.email}\nWorkspace: ${notice.workspaceId}\nUsuario: ${notice.userId}\n\nAñade ese correo a los usuarios de prueba del proyecto Google antes de aprobar la solicitud. No basta con aprobar en Cuebooker.`
 };
 return notice.locale==='en'?{
  subject:'Cuebooker: email beta access approved',
  textContent:`Your email beta access has been approved for ${notice.email}.\n\nOpen Settings in Cuebooker. When Google connection is enabled, use that exact account. Google will display an unverified-app warning because this is a test application. Review the permissions before granting access. In Testing mode, authorization expires after seven days and you will need to reconnect. Connecting your mailbox does not authorize AI analysis automatically.\n\n${workspaceUrl}`
 }:{
  subject:'Cuebooker: acceso aprobado a la beta de correo',
  textContent:`Hemos aprobado tu acceso a la beta de correo para ${notice.email}.\n\nAbre Ajustes en Cuebooker. Cuando esté habilitada la conexión con Google, utiliza exactamente esa cuenta. Google mostrará un aviso de aplicación no verificada porque estamos en pruebas. Revisa los permisos antes de autorizar. En modo Testing la autorización caduca a los siete días y tendrás que reconectar. Conectar el buzón no autoriza automáticamente el análisis con IA.\n\n${workspaceUrl}`
 };
}

// Saved outbox, atomic claim before delivery. An uncertain attempt is never
// retried automatically, even beyond Brevo's short idempotency window.
export async function dispatchMailboxBetaNotification(id:string|undefined,getEnv:Env,db:Database,workspaceUrl:string|undefined,fetcher:typeof fetch=fetch){
 const api=getEnv('BREVO_API_KEY')?.trim()||'',sender=getEnv('CUEBOOKER_FROM_EMAIL')?.trim()||'',admin=getEnv('CUEBOOKER_BETA_ADMIN_EMAIL')?.trim()||'';
 if(!id||getEnv('CUEBOOKER_BETA_NOTIFICATIONS_ENABLED')!=='true'||!api||!validEmail(sender)||!validEmail(admin)||!workspaceUrl)return {notification:'queued' as const};
 const notice=await db<Notice>('rpc/claim_mailbox_beta_notification',{method:'POST',body:JSON.stringify({target_notification:id})});
 if(!notice.claimed)return {notification:'unchanged' as const};
 let state='uncertain';
 try{
  const recipient=notice.kind==='requested'?admin:notice.recipient;
  if(!validEmail(recipient)||!validEmail(notice.email))throw new Error('invalid_recipient');
  const response=await fetcher('https://api.brevo.com/v3/smtp/email',{
   method:'POST',redirect:'error',signal:AbortSignal.timeout(10000),
   headers:{'api-key':api,'Content-Type':'application/json','accept':'application/json'},
   body:JSON.stringify({sender:{email:sender,name:'Cuebooker'},to:[{email:recipient}],...betaNotificationText(notice,workspaceUrl),headers:{idempotencyKey:id}})
  });
  // Any successful API response means accepted, not proven inbox delivery.
  state=response.ok?'sent':(response.status>=400&&response.status<500?'failed':'uncertain');
 }catch{/* Do not log Brevo bodies, recipients, credentials or uncertain failures. */}
 try{await db(`mailbox_beta_notifications?id=eq.${id}&state=eq.sending`,{method:'PATCH',body:JSON.stringify({state,completed_at:new Date().toISOString()})});}
 catch{return {notification:'uncertain' as const};}
 return {notification:state};
}
