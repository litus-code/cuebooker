import {verifyGmailPush,gmailPushPayload} from '../_shared/gmailPush.ts';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async(request:Request)=>{
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 const base=Deno.env.get('SUPABASE_URL')||'',service=Deno.env.get('GMAIL_PUSH_SERVICE_ACCOUNT')||'',subscription=Deno.env.get('GMAIL_PUBSUB_SUBSCRIPTION')||'';
 if(Deno.env.get('CUEBOOKER_MAILBOX_BACKGROUND_ENABLED')!=='true'||!service||!subscription)return json({error:'mailbox_background_unavailable'},503);
 try{await verifyGmailPush((request.headers.get('authorization')||'').replace(/^Bearer /,''),`${base}/functions/v1/gmail-mailbox-events`,service);}catch{return json({error:'unauthorized'},401);}
 try{
  if(Number(request.headers.get('content-length')||0)>8192)return json({error:'invalid_notification'},400);
  const text=await request.text();if(text.length>8192)return json({error:'invalid_notification'},400);
  const event=gmailPushPayload(JSON.parse(text),subscription),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
  const response=await fetch(`${base}/rest/v1/rpc/enqueue_gmail_history`,{method:'POST',headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({target_email:event.email,target_history:event.historyId}),signal:AbortSignal.timeout(10000)});
  if(!response.ok)return json({error:'mailbox_storage_unavailable'},503);
  return json({accepted:true});
 }catch{return json({error:'invalid_notification'},400);}
});
