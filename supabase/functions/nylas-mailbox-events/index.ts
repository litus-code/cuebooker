import {boundedNotificationBody,nylasIncomingNotification,verifyNylasSignature} from '../_shared/nylasIncomingNotification.ts';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export function createNylasEventsHandler(options:{secret:()=>string;enqueue:(notification:NonNullable<ReturnType<typeof nylasIncomingNotification>>)=>Promise<{error?:string;accepted?:boolean;duplicate?:boolean}>}){
 return async(request:Request)=>{
  if(request.method==='GET'){
   const challenge=new URL(request.url).searchParams.get('challenge');
   if(!challenge||challenge.length>512||/[\u0000-\u001f]/.test(challenge))return json({error:'invalid_challenge'},400);
   return new Response(challenge,{headers:{'Content-Type':'text/plain','Cache-Control':'no-store'}});
  }
  if(request.method!=='POST')return json({error:'method_not_allowed'},405);
  const secret=options.secret();if(!secret)return json({error:'mailbox_webhook_not_configured'},503);
  // Fail closed on compressed content until provider compression is explicitly tested.
  if(request.headers.get('content-encoding')&&!['identity'].includes(request.headers.get('content-encoding')!))return json({error:'unsupported_content_encoding'},415);
  try{
   const bytes=await boundedNotificationBody(request);
   if(!await verifyNylasSignature(bytes,request.headers.get('x-nylas-signature'),secret))return json({error:'invalid_signature'},401);
   let payload:unknown;try{payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes))}catch{return json({error:'invalid_notification'},400)}
   const notification=nylasIncomingNotification(payload);if(!notification)return json({received:true});
   const result=await options.enqueue(notification);
   if(result.error)throw new Error('mailbox_queue_unavailable');
   // Do not reveal mailbox IDs, existence, permissions or duplicate state to callers.
   return json({received:true});
  }catch(e){
   const code=(e as Error).message;
   if(code==='mailbox_notification_too_large')return json({error:code},413);
   if(code==='invalid_mailbox_notification')return json({error:'invalid_notification'},400);
   console.warn('nylas_mailbox_notification_failed');return json({error:'mailbox_queue_unavailable'},503);
  }
 };
}
if(typeof Deno!=='undefined')Deno.serve(createNylasEventsHandler({
 secret:()=>Deno.env.get('NYLAS_WEBHOOK_SECRET')||'',
 enqueue:async notification=>{
  const url=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  if(!url||!key)throw new Error('mailbox_queue_unavailable');
  const response=await fetch(`${url}/rest/v1/rpc/enqueue_mailbox_incoming`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(notification),signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw new Error('mailbox_queue_unavailable');return await response.json();
 }
}));
