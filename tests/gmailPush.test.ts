import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyGmailPush,gmailPushPayload} from '../supabase/functions/_shared/gmailPush.ts';
import {base64url} from '../supabase/functions/_shared/gmailMailbox.ts';
const encode=(value:any)=>base64url(new TextEncoder().encode(JSON.stringify(value)));
test('PubSub validates RSA signature, exact audience and trusted service-account identity',async()=>{
 const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'test-kid',alg:'RS256'};
 const audience='https://test.invalid/functions/v1/gmail-mailbox-events',account='push@test-project.iam.gserviceaccount.com',now=Math.floor(Date.now()/1000);
 async function signed(fields:any={}){const body=encode({iss:'https://accounts.google.com',aud:audience,email:account,email_verified:true,iat:now,exp:now+3600,...fields}),head=encode({alg:'RS256',kid:'test-kid'}),content=`${head}.${body}`;return `${content}.${base64url(new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(content))))}`;}
 let calls=0;const request=(async(url:any)=>{calls++;assert.equal(url,'https://www.googleapis.com/oauth2/v3/certs');return Response.json({keys:[jwk]});}) as typeof fetch;
 await verifyGmailPush(await signed(),audience,account,request);
 for(const invalid of [{aud:'other'},{email:'attacker@example.invalid'},{email_verified:false},{exp:now-1},{iat:now+1000}])await assert.rejects(verifyGmailPush(await signed(invalid),audience,account,request),{message:'unauthorized'});
 const valid=await signed();await assert.rejects(verifyGmailPush(valid.slice(0,-10)+'AAAAAAAAAA',audience,account,request));assert.equal(calls,1);
});
test('push accepts only configured subscription and metadata, not PubSub ID as Gmail message ID',()=>{
 const value={subscription:'projects/test/subscriptions/incoming',message:{messageId:'delivery-only',data:encode({emailAddress:'DJ@EXAMPLE.INVALID',historyId:'1234'})}};
 assert.deepEqual(gmailPushPayload(value,value.subscription),{email:'dj@example.invalid',historyId:'1234'});
 assert.throws(()=>gmailPushPayload(value,'different'));assert.throws(()=>gmailPushPayload({...value,message:{...value.message,data:encode({emailAddress:'dj@example.invalid',historyId:'malformed'})}},value.subscription));
});
