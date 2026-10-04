import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchMailboxBetaNotification,betaNotificationText} from '../supabase/functions/_shared/mailboxBetaNotifications.ts';
import {mailboxBetaAdmin} from '../supabase/functions/mailbox-beta-admin/index.ts';
const id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',workspace='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',user='cccccccc-cccc-cccc-cccc-cccccccccccc';
const notice={claimed:true,id,kind:'approved' as const,email:'pilot@example.invalid',recipient:'verified@example.invalid',locale:'es' as const,workspaceId:workspace,userId:user};
const env:Record<string,string>={SUPABASE_URL:'https://lycprjeuuynfzwskycwv.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'private-service',BREVO_API_KEY:'private-brevo',CUEBOOKER_FROM_EMAIL:'sender@example.invalid',CUEBOOKER_BETA_ADMIN_EMAIL:'admin@example.invalid',CUEBOOKER_BETA_NOTIFICATIONS_ENABLED:'true',CUEBOOKER_MAILBOX_RETURN_URL:'https://pr-96.cuebooker-staging.pages.dev/workspace/'};
const getEnv=(key:string)=>env[key];
test('disabled or incomplete notification configuration does not claim or send',async()=>{
 let calls=0;const db:any=async()=>{calls++;throw Error('unexpected')};const fetcher:any=async()=>{calls++;throw Error('unexpected')};
 for(const missing of ['CUEBOOKER_BETA_NOTIFICATIONS_ENABLED','BREVO_API_KEY','CUEBOOKER_FROM_EMAIL','CUEBOOKER_BETA_ADMIN_EMAIL']){
  const result=await dispatchMailboxBetaNotification(id,key=>key===missing?'':getEnv(key),db,'https://cuebooker.com/workspace/',fetcher);assert.equal(result.notification,'queued');
 }assert.equal(calls,0);
});
test('approved notice goes to verified account email, not caller-selected mailbox; request goes only to admin',async()=>{
 for(const kind of ['approved','requested'] as const){let claims=0,updates=0,sends=0;
  const db:any=async(path:string,init:any)=>{if(path.startsWith('rpc/')){claims++;assert.deepEqual(JSON.parse(init.body),{target_notification:id});return {...notice,kind};}updates++;assert.match(path,/state=eq.sending/);assert.equal(JSON.parse(init.body).state,'sent');};
  const fetcher:any=async(url:string,init:any)=>{sends++;assert.equal(url,'https://api.brevo.com/v3/smtp/email');assert.equal(init.redirect,'error');const body=JSON.parse(init.body);assert.equal(body.to[0].email,kind==='requested'?env.CUEBOOKER_BETA_ADMIN_EMAIL:notice.recipient);assert.equal(body.headers.idempotencyKey,id);assert.ok(body.textContent.includes(notice.email));return Response.json({messageId:'private-message-id'},{status:201});};
  assert.equal((await dispatchMailboxBetaNotification(id,getEnv,db,'https://cuebooker.com/workspace/',fetcher)).notification,'sent');assert.equal(claims,1);assert.equal(updates,1);assert.equal(sends,1);
 }
});
test('duplicate claim never causes another send and ambiguous delivery is retained',async()=>{
 let claimed=true,sends=0;const updates:string[]=[];
 const db:any=async(path:string,init:any)=>{if(path.startsWith('rpc/')){const result={...notice,claimed};claimed=false;return result;}updates.push(JSON.parse(init.body).state);};
 const fetcher:any=async()=>{sends++;throw new Error('contains-private-provider-body')};
 assert.equal((await dispatchMailboxBetaNotification(id,getEnv,db,'https://cuebooker.com/workspace/',fetcher)).notification,'uncertain');
 assert.equal((await dispatchMailboxBetaNotification(id,getEnv,db,'https://cuebooker.com/workspace/',fetcher)).notification,'unchanged');assert.equal(sends,1);assert.deepEqual(updates,['uncertain']);
});
test('email instructions are localized and explain seven days without claiming Gmail is enabled',()=>{
 for(const locale of ['es','en'] as const){const text=betaNotificationText({...notice,locale},'https://cuebooker.com/workspace/').textContent;assert.match(text,locale==='es'?/siete días/:/seven days/);assert.match(text,locale==='es'?/Cuando esté habilitada/:/When Google connection is enabled/);assert.match(text,locale==='es'?/no autoriza automáticamente/:/does not authorize/)}
});
test('admin endpoint denies every user key before any DB or email access',async()=>{
 let calls=0;const handler=mailboxBetaAdmin(getEnv,(async()=>{calls++;throw Error('unexpected')}) as typeof fetch);
 for(const headers of [{},{Authorization:'Bearer anonymous'},{Authorization:'Bearer normal-user'},{apikey:'sb_publishable_fictional'}]){const response=await handler(new Request('https://edge.invalid',{method:'POST',headers,body:'{}'}));assert.equal(response.status,401)}assert.equal(calls,0);
});
test('review requires Google test user confirmation; trusted review cannot override notification recipient',async()=>{
 let calls=0;
 const handler=mailboxBetaAdmin(key=>key==='CUEBOOKER_BETA_NOTIFICATIONS_ENABLED'?'false':getEnv(key),(async(url:any,init:any)=>{calls++;assert.match(url,/rpc\/review_mailbox_beta_access$/);assert.deepEqual(JSON.parse(init.body),{target_workspace:workspace,target_actor:user,target_status:'approved',target_google_added:true});return Response.json({status:'approved',notificationId:id});}) as typeof fetch);
 const request=(body:object)=>new Request('https://edge.invalid',{method:'POST',headers:{Authorization:'Bearer private-service'},body:JSON.stringify(body)});
 const denied=await handler(request({action:'review',workspaceId:workspace,userId:user,status:'approved',googleTestUserAdded:false}));assert.equal(denied.status,400);assert.equal(calls,0);
 const approved=await handler(request({action:'review',workspaceId:workspace,userId:user,status:'approved',googleTestUserAdded:true,to:'attacker@example.invalid'}));assert.deepEqual(await approved.json(),{status:'approved',notification:'queued'});assert.equal(calls,1);
});
test('current platform secret can administer but malformed configuration and injected claims cannot',async()=>{
 const config={...env,SUPABASE_SECRET_KEYS:JSON.stringify({default:'sb_secret_fictional'})};let calls=0;
 const handler=mailboxBetaAdmin(n=>config[n],(async()=>{calls++;return Response.json({status:'rejected'});}) as typeof fetch);
 const response=await handler(new Request('https://edge.invalid',{method:'POST',headers:{apikey:'sb_secret_fictional'},body:JSON.stringify({action:'review',workspaceId:workspace,userId:user,status:'rejected'})}));assert.equal(response.status,200);assert.equal(calls,1);
});

test('service-only drain is bounded and dispatches only queued database IDs',async()=>{
 const paths:string[]=[];
 const handler=mailboxBetaAdmin(key=>key==='CUEBOOKER_BETA_NOTIFICATIONS_ENABLED'?'false':getEnv(key),(async(url:any)=>{paths.push(String(url));return Response.json([{id}]);}) as typeof fetch);
 const response=await handler(new Request('https://edge.invalid',{method:'POST',headers:{Authorization:'Bearer private-service'},body:JSON.stringify({action:'drain',limit:10000,notificationId:'caller-injection'})}));
 assert.deepEqual(await response.json(),{processed:1,outcomes:[{notification:'queued'}]});
 assert.equal(paths.length,1);assert.match(paths[0],/state=eq.queued&select=id&order=created_at.asc&limit=10$/);
});
