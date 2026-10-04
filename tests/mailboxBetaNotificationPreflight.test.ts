import test from 'node:test';
import assert from 'node:assert/strict';
import {betaNotificationPreflight} from '../scripts/mailbox-beta-notification-preflight.ts';
const env:Record<string,string>={SUPABASE_URL:'https://lycprjeuuynfzwskycwv.supabase.co',SUPABASE_SECRET_KEYS:'{"default":"sb_secret_fictional"}',CUEBOOKER_BETA_NOTIFICATIONS_ENABLED:'true',BREVO_API_KEY:'fictional-provider',CUEBOOKER_FROM_EMAIL:'sender@example.invalid',CUEBOOKER_BETA_ADMIN_EMAIL:'admin@example.invalid'};
const request=(body:unknown,key='sb_secret_fictional')=>new Request('https://test.invalid',{method:'POST',headers:{apikey:key},body:JSON.stringify(body)});
test('preflight denies user keys and production before provider access',async()=>{
 let calls=0;const fetcher=(async()=>{calls++;throw Error('unexpected')}) as typeof fetch;
 for(const key of ['','sb_publishable_test','sb_secret_wrong'])assert.equal((await betaNotificationPreflight(n=>env[n],fetcher)(request({action:'send-test'},key))).status,401);
 assert.equal((await betaNotificationPreflight(n=>n==='SUPABASE_URL'?'https://qlocooqfdzehogbwcbhr.supabase.co':env[n],fetcher)(request({action:'send-test'}))).status,403);assert.equal(calls,0);
});
test('test email uses only configured admin and fixed test copy',async()=>{
 const handler=betaNotificationPreflight(n=>env[n],(async(url:any,init:any)=>{assert.equal(url,'https://api.brevo.com/v3/smtp/email');const body=JSON.parse(init.body);assert.deepEqual(body.to,[{email:env.CUEBOOKER_BETA_ADMIN_EMAIL}]);assert.match(body.subject,/STAGING/);assert.equal(body.headers.idempotencyKey,'cuebooker-beta-admin-test-20261004');return Response.json({messageId:'<test@example.invalid>'},{status:201});}) as typeof fetch);
 const r=await handler(request({action:'send-test',to:'attacker@example.invalid'}));assert.deepEqual(await r.json(),{accepted:true,messageId:'<test@example.invalid>'});
});
test('delivery diagnostic filters recipients and removes private provider fields',async()=>{
 const handler=betaNotificationPreflight(n=>env[n],(async(url:any,init:any)=>{assert.match(url,/statistics\/events\?messageId=/);assert.equal(init.method,'GET');return Response.json({events:[{email:env.CUEBOOKER_BETA_ADMIN_EMAIL,event:'delivered',date:'2026-10-04',secret:'private-body'},{email:'other@example.invalid',event:'opened'}]});}) as typeof fetch);
 const r=await handler(request({action:'delivery',messageId:'<test@example.invalid>'}));assert.deepEqual(await r.json(),{events:[{event:'delivered',date:'2026-10-04'}]});
});
test('provider errors never disclose credentials or response bodies',async()=>{
 const handler=betaNotificationPreflight(n=>env[n],(async()=>new Response('private-provider-body',{status:401})) as typeof fetch);
 const r=await handler(request({action:'send-test'}));assert.deepEqual(await r.json(),{error:'provider_request_failed',status:401});
});
