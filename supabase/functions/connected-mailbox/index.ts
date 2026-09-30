import { createNylasMailbox, mailboxAuthorizationUrl, normalizeMailboxEmail } from '../_shared/nylasMailbox.ts';
import type { MailboxProvider, NylasConfig } from '../_shared/nylasMailbox.ts';
const headers={'Access-Control-Allow-Origin':'https://pr-96.cuebooker-staging.pages.dev','Access-Control-Allow-Headers':'authorization, apikey, content-type','Access-Control-Allow-Methods':'POST, GET, OPTIONS','Cache-Control':'no-store','Referrer-Policy':'no-referrer'};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...headers,'Content-Type':'application/json'}});
const uuid=(value:unknown)=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
async function hash(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),v=>v.toString(16).padStart(2,'0')).join('');}
type Connection={id:string;email:string;provider:MailboxProvider;grant_id:string;status:string;connected_at:string};
type OAuthState={workspace_id:string;user_id:string;expected_email:string;provider:MailboxProvider};
Deno.serve(async(request:Request)=>{
 if(request.method==='OPTIONS')return new Response('ok',{headers});
 const supabaseUrl=Deno.env.get('SUPABASE_URL')||'',serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||'',anonKey=Deno.env.get('SUPABASE_ANON_KEY')||'';
 const config:NylasConfig={apiUri:Deno.env.get('NYLAS_API_URI')||'https://api.us.nylas.com',apiKey:Deno.env.get('NYLAS_API_KEY')||'',clientId:Deno.env.get('NYLAS_CLIENT_ID')||'',callbackUri:`${supabaseUrl}/functions/v1/connected-mailbox`};
 const returnUrl=Deno.env.get('CUEBOOKER_MAILBOX_RETURN_URL')||'';
 const configured=Deno.env.get('CUEBOOKER_MAILBOX_ENABLED')==='true'&&Boolean(config.apiKey&&config.clientId&&returnUrl);
 async function db<T>(path:string,init:RequestInit={}):Promise<T>{
  const response=await fetch(`${supabaseUrl}/rest/v1/${path}`,{...init,headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',Prefer:'return=representation',...(init.headers||{})},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('mailbox_storage_failed');
  const text=await response.text();return (text?JSON.parse(text):null) as T;
 }
 async function member(workspace:string,user:string){
  const rows=await db<Array<{role:string}>>(`workspace_members?workspace_id=eq.${workspace}&user_id=eq.${user}&select=role&limit=1`);
  if(!rows[0]||!['owner','admin','manager','editor'].includes(rows[0].role))throw new Error('workspace_access_denied');
 }
 function back(status:string){
  const target=new URL(returnUrl);
  if(target.origin!=='https://pr-96.cuebooker-staging.pages.dev'||target.pathname!=='/workspace/'||target.search||target.hash)throw new Error('invalid_return_url');
  target.searchParams.set('mailbox',status);
  return new Response(null,{status:303,headers:{...headers,Location:target.href}});
 }
 if(request.method==='GET'){
  if(!configured)return json({error:'mailbox_not_configured'},503);
  try{
   const params=new URL(request.url).searchParams,state=params.get('state')||'';
   if(!/^[0-9a-f]{64}$/.test(state))return json({error:'invalid_oauth_state'},400);
   if(params.has('error'))return back('cancelled');
   const code=params.get('code');if(!code||code.length>4096)return back('failed');
   // Finish only with the initiating user's authenticated session in Cuebooker.
   // A hosted callback alone must never bind a mailbox to another user's workspace.
   const response=back('authorize'),target=new URL(response.headers.get('Location')!);
   target.hash=new URLSearchParams({mailbox_code:code,mailbox_state:state}).toString();
   return new Response(null,{status:303,headers:{...headers,Location:target.href}});
  }catch{return json({error:'mailbox_connection_failed'},400);}
 }
 if(request.method!=='POST')return json({error:'method_not_allowed'},405);
 try{
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer\s+/i,'').trim();
  if(!token)return json({error:'authentication_required'},401);
  const response=await fetch(`${supabaseUrl}/auth/v1/user`,{headers:{apikey:anonKey,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(10000)});
  if(!response.ok)return json({error:'authentication_required'},401);
  const user=await response.json();if(!uuid(user?.id))return json({error:'authentication_required'},401);
  let input;try{input=await request.json();}catch{return json({error:'invalid_json'},400);}
  if(!uuid(input?.workspaceId))return json({error:'invalid_workspace'},400);
  const workspace=input.workspaceId,userId=user.id;
  await member(workspace,userId);
  const path=`mailbox_connections?workspace_id=eq.${workspace}&user_id=eq.${userId}`;
  if(input.action==='status'){
   const connections=await db<Connection[]>(`${path}&status=eq.connected&select=id,email,provider,grant_id,status,connected_at&order=connected_at.desc&limit=5`);
   const safe=await Promise.all(connections.map(async(row)=>{
    let status='unknown';
    if(configured){try{const grant=await createNylasMailbox(config).grant(row.grant_id);status=grant.status==='valid'?'connected':'reconnect_required';}catch(error){if(['mailbox_reconnect_required','mailbox_not_found'].includes((error as Error).message))status='reconnect_required';}}
    return {id:row.id,email:row.email,provider:row.provider,status,connectedAt:row.connected_at};
   }));
   return json({configured,connections:safe});
  }
  if(!configured)return json({error:'mailbox_not_configured'},503);
  back('check');
  if(input.action==='complete'){
   const state=String(input.state||''),code=String(input.code||'');
   if(!/^[0-9a-f]{64}$/.test(state)||!code||code.length>4096)return json({error:'invalid_oauth_state'},400);
   const rows=await db<OAuthState[]>(`mailbox_oauth_states?state_hash=eq.${await hash(state)}&user_id=eq.${userId}&workspace_id=eq.${workspace}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}`,{method:'DELETE'});
   const pending=rows[0];if(!pending)return json({error:'invalid_oauth_state'},400);
   const provider=createNylasMailbox(config),grantId=await provider.exchange(code),grant=await provider.grant(grantId);
   if(grant.email!==pending.expected_email||grant.provider!==pending.provider)return json({error:'account_mismatch'},400);
   if(grant.status!=='valid')return json({error:'mailbox_reconnect_required'},400);
   await member(workspace,userId);
   await db('mailbox_connections?on_conflict=workspace_id,user_id,email',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({workspace_id:workspace,user_id:userId,email:grant.email,provider:grant.provider,grant_id:grantId,status:'connected',connected_at:new Date().toISOString()})});
   return json({connected:true});
  }
  if(input.action==='connect'){
   const email=normalizeMailboxEmail(input.email),provider=input.provider as MailboxProvider;
   if(!['google','microsoft','imap'].includes(provider))return json({error:'invalid_provider'},400);
   const existing=await db<Connection[]>(`${path}&status=eq.connected&select=id,email&limit=5`);
   if(existing.length>=5&&!existing.some(row=>row.email===email))return json({error:'mailbox_limit'},409);
   const now=new Date().toISOString();
   await db(`mailbox_oauth_states?expires_at=lt.${encodeURIComponent(now)}`,{method:'DELETE'});
   const pending=await db<OAuthState[]>(`mailbox_oauth_states?workspace_id=eq.${workspace}&user_id=eq.${userId}&select=state_hash&limit=10`);
   if(pending.length>=10)return json({error:'mailbox_attempt_limit'},429);
   const state=Array.from(crypto.getRandomValues(new Uint8Array(32)),v=>v.toString(16).padStart(2,'0')).join('');
   const authorizationUrl=mailboxAuthorizationUrl(config,{email,provider,state});
   await db('mailbox_oauth_states',{method:'POST',body:JSON.stringify({state_hash:await hash(state),workspace_id:workspace,user_id:userId,expected_email:email,provider,expires_at:new Date(Date.now()+600000).toISOString()})});
   return json({authorizationUrl});
  }
  if(input.action==='disconnect'){
   if(!uuid(input.connectionId))return json({error:'invalid_connection'},400);
   const rows=await db<Connection[]>(`${path}&id=eq.${input.connectionId}&select=id,grant_id,status&limit=1`);
   if(!rows[0])return json({error:'connection_not_found'},404);
   if(rows[0].status==='connected'){
    try{await createNylasMailbox(config).disconnect(rows[0].grant_id);}catch(error){if((error as Error).message!=='mailbox_not_found')throw error;}
    await db(`${path}&id=eq.${input.connectionId}`,{method:'PATCH',body:JSON.stringify({status:'disconnected'})});
   }
   return json({disconnected:true});
  }
  return json({error:'invalid_action'},400);
 }catch(error){
  const name=(error as Error).message;
  const allowed=['workspace_access_denied','invalid_email','invalid_provider','invalid_provider_configuration','invalid_callback','invalid_return_url','mailbox_reconnect_required','mailbox_not_found','mailbox_provider_unavailable','mailbox_not_configured','invalid_oauth_state','account_mismatch'];
  return json({error:allowed.includes(name)?name:'mailbox_operation_failed'},name==='workspace_access_denied'?403:400);
 }
});
