import {dispatchMailboxBetaNotification} from '../_shared/mailboxBetaNotifications.ts';
import {mailboxReturnUrl} from '../_shared/mailboxReturnUrl.ts';
type Env=(name:string)=>string|undefined;
declare const Deno:{env:{get:Env};serve:(fn:(r:Request)=>Promise<Response>)=>void};
const uuid=(v:unknown)=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
function same(a:string,b:string){let result=a.length^b.length;for(let i=0;i<Math.max(a.length,b.length);i++)result|=(a.charCodeAt(i)||0)^(b.charCodeAt(i)||0);return result===0;}
export function mailboxBetaAdmin(getEnv:Env,fetcher:typeof fetch=fetch){return async(request:Request)=>{
 const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 if(request.method!=='POST')return reply({error:'method_not_allowed'},405);
 const service=getEnv('SUPABASE_SERVICE_ROLE_KEY')||'';
 let authorized=!!service&&same(request.headers.get('Authorization')||'',`Bearer ${service}`);
 try{const supplied=request.headers.get('apikey')||'',keys=JSON.parse(getEnv('SUPABASE_SECRET_KEYS')||'{}');authorized ||= !!supplied&&Object.values(keys).some(v=>typeof v==='string'&&v.startsWith('sb_secret_')&&same(v,supplied));}catch{}
 if(!authorized)return reply({error:'service_role_required'},401);
 const base=getEnv('SUPABASE_URL')||'';
 async function db<T>(path:string,init:RequestInit={}):Promise<T>{
  const response=await fetcher(`${base}/rest/v1/${path}`,{...init,headers:{apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json',Prefer:'return=representation'},signal:AbortSignal.timeout(10000)});
  if(!response.ok){const body=await response.json().catch(()=>({}));const allowed=['google_test_user_confirmation_required','beta_request_not_found','beta_review_locked','workspace_access_denied'];throw new Error(allowed.includes(body.message)?body.message:'beta_operation_failed');}
  const text=await response.text();return (text?JSON.parse(text):null) as T;
 }
 try{
  const input=await request.json();
  let result:any;
  if(input.action==='review'){
   if(!uuid(input.workspaceId)||!uuid(input.userId)||!['approved','rejected'].includes(input.status))return reply({error:'invalid_beta_review'},400);
   if(input.status==='approved'&&input.googleTestUserAdded!==true)return reply({error:'google_test_user_confirmation_required'},400);
   result=await db<any>('rpc/review_mailbox_beta_access',{method:'POST',body:JSON.stringify({target_workspace:input.workspaceId,target_actor:input.userId,target_status:input.status,target_google_added:input.googleTestUserAdded===true})});
  }else if(input.action==='drain'){
   const rows=await db<Array<{id:string}>>('mailbox_beta_notifications?state=eq.queued&select=id&order=created_at.asc&limit=10');
   const outcomes=[];
   for(const row of rows){try{outcomes.push(await dispatchMailboxBetaNotification(row.id,getEnv,db,mailboxReturnUrl(base,getEnv('CUEBOOKER_MAILBOX_RETURN_URL')||'')?.href,fetcher));}catch{outcomes.push({notification:'queued'});}}
   return reply({processed:rows.length,outcomes});
  }else if(input.action==='notify'&&uuid(input.notificationId))result={notificationId:input.notificationId};
  else return reply({error:'invalid_action'},400);
  // Notification problems must not undo a committed review.
  let notification:any={notification:'queued'};
  try{notification=await dispatchMailboxBetaNotification(result.notificationId,getEnv,db,mailboxReturnUrl(base,getEnv('CUEBOOKER_MAILBOX_RETURN_URL')||'')?.href,fetcher);}catch{}
  return reply({...(result.status?{status:result.status}:{}),...notification});
 }catch(error){const code=(error as Error).message;return reply({error:['google_test_user_confirmation_required','beta_request_not_found','beta_review_locked','workspace_access_denied'].includes(code)?code:'beta_operation_failed'},400);}
};}
if(typeof Deno!=='undefined')Deno.serve(mailboxBetaAdmin(n=>Deno.env.get(n)));
