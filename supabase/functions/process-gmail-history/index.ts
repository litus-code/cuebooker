import {mailboxTransport,gmailConfig} from '../_shared/mailboxTransport.ts';
import {gmailConfigured} from '../_shared/gmailMailbox.ts';
import {processGmailHistory} from '../_shared/processGmailHistory.ts';
const json=(value:unknown,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
Deno.serve(async(request:Request)=>{
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 const secret=Deno.env.get('MAILBOX_WORKER_SECRET')||'',actual=request.headers.get('authorization')||'',expected=`Bearer ${secret}`;
 let diff=actual.length^expected.length;for(let i=0;i<expected.length;i++)diff|=(actual.charCodeAt(i)||0)^expected.charCodeAt(i);
 if(!secret||diff)return json({error:'unauthorized'},401);
 const topic=Deno.env.get('GMAIL_PUBSUB_TOPIC')||'';
 if(Deno.env.get('CUEBOOKER_MAILBOX_ENABLED')!=='true'||Deno.env.get('CUEBOOKER_MAILBOX_BACKGROUND_ENABLED')!=='true'||!gmailConfigured(gmailConfig(n=>Deno.env.get(n)))||!topic)return json({error:'mailbox_background_unavailable'},503);
 const base=Deno.env.get('SUPABASE_URL')||'',key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'';
 async function db<T>(path:string,init:RequestInit={}):Promise<T>{const response=await fetch(`${base}/rest/v1/${path}`,{...init,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json',Prefer:'return=representation'},signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('mailbox_storage_failed');const text=await response.text();return (text?JSON.parse(text):null) as T;}
 const rpc=<T>(name:string,payload:unknown={})=>db<T>(`rpc/${name}`,{method:'POST',body:JSON.stringify(payload)});
 try{
  const job=await rpc<any>('claim_gmail_watch');if(!job)return json({processed:0});
  const c=job.connection,w=job.watch;
  const authorized=()=>rpc<boolean>('authorize_gmail_watch',{target_connection:c.id,target_revision:c.background_analysis_revision});
  const outcome=await processGmailHistory({connection:c,watch:w,topic},{authorized,provider:mailboxTransport(c,n=>Deno.env.get(n),db),
   enqueue:message=>rpc('enqueue_mailbox_incoming',{target_grant:c.grant_id,target_event:`gmail:${message.id}`,target_message:message.id,target_thread:message.thread_id,target_date:new Date(message.date*1000).toISOString()}),
   save:patch=>rpc<void>('complete_gmail_watch',{target_connection:c.id,target_revision:c.background_analysis_revision,target_lease:w.lease_token,target_patch:patch})
  });
  return json({processed:1,outcome});
 }catch{return json({error:'mailbox_history_unavailable'},503);}
});
