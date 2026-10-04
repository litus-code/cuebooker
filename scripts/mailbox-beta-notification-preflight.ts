// Manual staging-only diagnostic. Uses existing private service authentication.
type Env=(name:string)=>string|undefined;
declare const Deno:{env:{get:Env};serve:(handler:(r:Request)=>Promise<Response>)=>void};
function same(a:string,b:string){let v=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)v|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return v===0;}
const email=(v:string)=>v.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export function betaNotificationPreflight(getEnv:Env,fetcher:typeof fetch=fetch){return async(request:Request)=>{
 const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
 const service=getEnv('SUPABASE_SERVICE_ROLE_KEY')||'';
 let authorized=!!service&&same(request.headers.get('Authorization')||'',`Bearer ${service}`);
 try{const supplied=request.headers.get('apikey')||'',keys=JSON.parse(getEnv('SUPABASE_SECRET_KEYS')||'{}');authorized ||= !!supplied&&Object.values(keys).some(v=>typeof v==='string'&&v.startsWith('sb_secret_')&&same(v,supplied));}catch{}
 if(!authorized)return reply({error:'service_role_required'},401);
 if(getEnv('SUPABASE_URL')!=='https://lycprjeuuynfzwskycwv.supabase.co')return reply({error:'staging_only'},403);
 const api=getEnv('BREVO_API_KEY')?.trim()||'',sender=getEnv('CUEBOOKER_FROM_EMAIL')?.trim()||'',admin=getEnv('CUEBOOKER_BETA_ADMIN_EMAIL')?.trim()||'';
 if(getEnv('CUEBOOKER_BETA_NOTIFICATIONS_ENABLED')!=='true'||!api||!email(sender)||!email(admin))return reply({error:'notification_not_configured',checks:{enabled:getEnv('CUEBOOKER_BETA_NOTIFICATIONS_ENABLED')==='true',apiConfigured:!!api,senderValid:email(sender),adminValid:email(admin)}},503);
 try{
  const input=await request.json();
  let url='https://api.brevo.com/v3/smtp/email',method='POST',body:string|undefined;
  if(input.action==='send-test'){
   body=JSON.stringify({sender:{email:sender,name:'Cuebooker'},to:[{email:admin}],subject:'[STAGING] Cuebooker: prueba de avisos de beta',textContent:'Este es un aviso de prueba de Cuebooker. Los avisos de solicitud de acceso a la beta de correo se enviarán a esta dirección. Esta prueba no solicita acceso, no aprueba usuarios ni conecta ningún buzón.',headers:{idempotencyKey:'cuebooker-beta-admin-test-20261004'}});
  }else if(input.action==='delivery'&&typeof input.messageId==='string'&&input.messageId.length<=254&&/^[\w@.<>+:-]+$/.test(input.messageId)){
   method='GET';url=`https://api.brevo.com/v3/smtp/statistics/events?messageId=${encodeURIComponent(input.messageId)}&limit=20`;
  }else return reply({error:'invalid_action'},400);
  const r=await fetcher(url,{method,body,redirect:'error',signal:AbortSignal.timeout(15000),headers:{'api-key':api,'Content-Type':'application/json',accept:'application/json'}});
  if(!r.ok)return reply({error:'provider_request_failed',status:r.status},502);
  const data=await r.json();
  if(method==='POST')return reply({accepted:true,messageId:typeof data.messageId==='string'?data.messageId:null});
  const allowed=['requests','delivered','opened','clicks','hardBounces','softBounces','blocked','invalid','error','deferred'];
  return reply({events:Array.isArray(data.events)?data.events.filter((e:any)=>e.email===admin).map((e:any)=>({event:allowed.includes(e.event)?e.event:'other',date:typeof e.date==='string'?e.date:null})):[]});
 }catch{return reply({error:'provider_request_uncertain'},502);}
};}
if(typeof Deno!=='undefined')Deno.serve(betaNotificationPreflight(n=>Deno.env.get(n)));
