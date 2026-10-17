import test from 'node:test';
import assert from 'node:assert/strict';
import {base64url,openGmail} from '../supabase/functions/_shared/gmailMailbox.ts';
let handler:(request:Request)=>Promise<Response>;
const workspace='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',user='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',email='dj@example.invalid';
const env:Record<string,string>={SUPABASE_URL:'https://lycprjeuuynfzwskycwv.supabase.co',SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'private-service',CUEBOOKER_MAILBOX_ENABLED:'true',CUEBOOKER_MAILBOX_RETURN_URL:'https://pr-96.cuebooker-staging.pages.dev/workspace/',GMAIL_CLIENT_ID:'client',GMAIL_CLIENT_SECRET:'private-client',GMAIL_TOKEN_ENCRYPTION_KEY:base64url(new Uint8Array(32).fill(7))};
;(globalThis as any).Deno={env:{get:(key:string)=>env[key]},serve:(fn:any)=>{handler=fn}};
await import('../supabase/functions/connected-mailbox/index.ts');
const original=globalThis.fetch;
const req=(action:string,extra:any={})=>new Request('https://edge.invalid',{method:'POST',headers:{Authorization:'Bearer test-user-session'},body:JSON.stringify({action,workspaceId:workspace,...extra})});
test('approved Gmail connection reserves before OAuth and stores encrypted PKCE',async()=>{
 const calls:string[]=[];let cipher='',stateHash='';
 globalThis.fetch=(async(url:any,init:any)=>{calls.push(String(url));if(url.includes('/auth/v1/user'))return Response.json({id:user});if(url.includes('workspace_members'))return Response.json([{role:'owner'}]);if(url.includes('/mailbox_connections?'))return Response.json([]);if(url.includes('rpc/mailbox_beta_command')){const b=JSON.parse(init.body);assert.equal(b.target_action,'reserve');assert.equal(b.target_provider,'google');stateHash=b.target_state;return Response.json({reserved:true});}if(url.includes('/mailbox_oauth_states?')){const b=JSON.parse(init.body);assert.equal(b.transport,'gmail');cipher=b.verifier_ciphertext;return Response.json([]);}throw new Error('unexpected access');}) as typeof fetch;
 try{const response=await handler(req('connect',{email}));assert.equal(response.status,200);const result=await response.json(),target=new URL(result.authorizationUrl);assert.equal(target.origin,'https://accounts.google.com');const verifier=await openGmail<string>(cipher,env.GMAIL_TOKEN_ENCRYPTION_KEY,`oauth:${stateHash}`);assert.equal(target.href.includes(verifier),false);assert.equal(calls.some(v=>v.includes('nylas')),false);}finally{globalThis.fetch=original;}
});
test('new Gmail route fails closed without keys instead of falling back to Nylas',async()=>{
 const key=env.GMAIL_CLIENT_SECRET;delete env.GMAIL_CLIENT_SECRET;let external=0;
 globalThis.fetch=(async(url:any)=>{if(url.includes('/auth/v1/user'))return Response.json({id:user});if(url.includes('workspace_members'))return Response.json([{role:'owner'}]);external++;throw new Error('unexpected provider access');}) as typeof fetch;
 try{const response=await handler(req('connect',{email}));assert.equal(response.status,503);assert.equal((await response.json()).error,'mailbox_not_configured');assert.equal(external,0);}finally{env.GMAIL_CLIENT_SECRET=key;globalThis.fetch=original;}
});
test('unapproved Gmail admission never contacts Google or stores a verifier',async()=>{
 globalThis.fetch=(async(url:any)=>{if(url.includes('/auth/v1/user'))return Response.json({id:user});if(url.includes('workspace_members'))return Response.json([{role:'owner'}]);if(url.includes('/mailbox_connections?'))return Response.json([]);if(url.includes('rpc/mailbox_beta_command'))return Response.json({error:'mailbox_beta_approval_required'});throw new Error('unexpected provider access');}) as typeof fetch;
 try{const response=await handler(req('connect',{email}));assert.equal(response.status,409);assert.equal((await response.json()).error,'mailbox_beta_approval_required');}finally{globalThis.fetch=original;}
});
test('Gmail completion binds the approved identity and saves only encrypted tokens atomically',async()=>{
 const {sealGmail,GMAIL_SCOPES}=await import('../supabase/functions/_shared/gmailMailbox.ts');
 const state='a'.repeat(64),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(state))),b=>b.toString(16).padStart(2,'0')).join('');
 const cipher=await sealGmail('fictional-verifier',env.GMAIL_TOKEN_ENCRYPTION_KEY,`oauth:${hash}`);let saved:any;
 globalThis.fetch=(async(url:any,init:any)=>{
  if(url.includes('/auth/v1/user'))return Response.json({id:user});if(url.includes('workspace_members'))return Response.json([{role:'owner'}]);
  if(url.includes('rpc/mailbox_beta_command'))return Response.json({transport:'gmail',expected_email:email,provider:'google',verifier_ciphertext:cipher});
  if(url==='https://oauth2.googleapis.com/token')return Response.json({access_token:'private-access',refresh_token:'private-refresh',expires_in:3600,scope:GMAIL_SCOPES.join(' ')});
  if(url.includes('/users/me/profile'))return Response.json({emailAddress:email,historyId:'123'});
  if(url.includes('rpc/complete_gmail_mailbox')){saved=JSON.parse(init.body);return Response.json({connected:true,connectionId:'saved-connection'});}
  throw new Error('unexpected access');
 }) as typeof fetch;
 try{const response=await handler(req('complete',{state,code:'fictional-code'}));assert.equal(response.status,200);assert.equal(saved.target_actor,user);assert.equal(saved.target_workspace,workspace);assert.equal(saved.target_email,email);assert.equal(JSON.stringify(saved).includes('private-refresh'),false);const decrypted=await openGmail<any>(saved.target_ciphertext,env.GMAIL_TOKEN_ENCRYPTION_KEY,`gmail:${workspace}:${user}:${email}`);assert.equal(decrypted.refreshToken,'private-refresh');}finally{globalThis.fetch=original;}
});
test('Google account mismatch cannot complete a connection even after a valid token exchange',async()=>{
 const {sealGmail,GMAIL_SCOPES}=await import('../supabase/functions/_shared/gmailMailbox.ts');
 const state='a'.repeat(64),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(state))),b=>b.toString(16).padStart(2,'0')).join(''),cipher=await sealGmail('verifier',env.GMAIL_TOKEN_ENCRYPTION_KEY,`oauth:${hash}`);let writes=0;
 globalThis.fetch=(async(url:any)=>{if(url.includes('/auth/v1/user'))return Response.json({id:user});if(url.includes('workspace_members'))return Response.json([{role:'owner'}]);if(url.includes('rpc/mailbox_beta_command'))return Response.json({transport:'gmail',expected_email:email,provider:'google',verifier_ciphertext:cipher});if(url.includes('/token'))return Response.json({access_token:'private-access',refresh_token:'private-refresh',expires_in:3600,scope:GMAIL_SCOPES.join(' ')});if(url.includes('/profile'))return Response.json({emailAddress:'other@example.invalid'});writes++;throw new Error('unexpected connection write');}) as typeof fetch;
 try{const response=await handler(req('complete',{state,code:'fictional-code'}));assert.equal(response.status,400);assert.equal((await response.json()).error,'account_mismatch');assert.equal(writes,0);}finally{globalThis.fetch=original;}
});

test('automatic detection consent survives OAuth encrypted and cannot be added during completion',async()=>{
 const previous={...env};Object.assign(env,{CUEBOOKER_MAILBOX_BACKGROUND_ENABLED:'true',GMAIL_PUBSUB_TOPIC:'projects/fictional-project/topics/mail',GMAIL_PUBSUB_SUBSCRIPTION:'mail-push',GMAIL_PUSH_SERVICE_ACCOUNT:'push@example.invalid',MAILBOX_WORKER_SECRET:'fictional-worker',GROQ_API_KEY:'fictional-model'});
 const {sealGmail,GMAIL_SCOPES}=await import('../supabase/functions/_shared/gmailMailbox.ts');
 const state='c'.repeat(64),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(state))),b=>b.toString(16).padStart(2,'0')).join('');
 try{for(const consent of [false,true]){
  const cipher=await sealGmail(consent?{verifier:'verifier',backgroundProcessor:'groq-gpt-oss-20b-v1'}:'verifier',env.GMAIL_TOKEN_ENCRYPTION_KEY,`oauth:${hash}`);let tokenCipher='',started=0,watches=0;
  globalThis.fetch=(async(url:any,init:any)=>{
   if(url.includes('/auth/v1/user'))return Response.json({id:user});if(url.includes('workspace_members'))return Response.json([{role:'owner'}]);
   if(url.includes('rpc/mailbox_beta_command'))return Response.json({transport:'gmail',expected_email:email,provider:'google',verifier_ciphertext:cipher});
   if(url==='https://oauth2.googleapis.com/token')return Response.json({access_token:'access',refresh_token:'refresh',expires_in:3600,scope:GMAIL_SCOPES.join(' ')});
   if(url.includes('/users/me/profile'))return Response.json({emailAddress:email,historyId:'123'});
   if(url.includes('rpc/complete_gmail_mailbox')){tokenCipher=JSON.parse(init.body).target_ciphertext;return Response.json({connected:true,connectionId:'saved'});}
   if(url.includes('/mailbox_connections?'))return Response.json([{id:'saved',transport:'gmail',workspace_id:workspace,user_id:user,email,status:'connected'}]);
   if(url.includes('/gmail_mailbox_credentials?'))return Response.json([{token_ciphertext:tokenCipher,reauth_required:false}]);
   if(url.includes('/users/me/watch')){watches++;return Response.json({historyId:'124',expiration:String(Date.now()+86400000)});}
   if(url.includes('rpc/start_gmail_mailbox_detection')){started++;const body=JSON.parse(init.body);assert.equal(body.target_history,'124');assert.equal(body.target_actor,user);return Response.json({enabled:true});}
   throw new Error('unexpected access');
  }) as typeof fetch;
  const response=await handler(req('complete',{state,code:'code',backgroundProcessor:'groq-gpt-oss-20b-v1'}));assert.equal(response.status,200);assert.equal((await response.json()).detectionPending,undefined);assert.equal(started,consent?1:0);assert.equal(watches,consent?1:0);
 }}finally{for(const key of Object.keys(env))delete env[key];Object.assign(env,previous);globalThis.fetch=original;}
});
