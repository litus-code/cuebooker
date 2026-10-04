import test from 'node:test';
import assert from 'node:assert/strict';
import {base64url,sealGmail,openGmail,gmailAuthorization,exchangeGmail,createGmailMailbox,gmailMessage,GMAIL_SCOPES} from '../supabase/functions/_shared/gmailMailbox.ts';
import {mailboxMessage} from '../supabase/functions/_shared/mailboxMessage.ts';
const config={clientId:'test-client',clientSecret:'private-client-secret',encryptionKey:base64url(new Uint8Array(32).fill(8)),callbackUri:'https://test.invalid/functions/v1/connected-mailbox'};
const token=()=>({accessToken:'private-access',refreshToken:'private-refresh',expiresAt:Date.now()+3600000,reauthAt:Date.now()+7*86400000});
const mock=(fn:(url:string,options:RequestInit)=>Promise<Response>)=>fn as typeof fetch;
test('Gmail credentials authenticate both ciphertext and tenant context',async()=>{
 const cipher=await sealGmail(token(),config.encryptionKey,'workspace:user:email');assert.equal(cipher.includes('private'),false);
 assert.equal((await openGmail<any>(cipher,config.encryptionKey,'workspace:user:email')).refreshToken,'private-refresh');
 await assert.rejects(openGmail(cipher,config.encryptionKey,'other-user'),{message:'mailbox_credentials_unavailable'});
 await assert.rejects(openGmail(cipher+'x',config.encryptionKey,'workspace:user:email'));
});
test('Gmail OAuth uses offline PKCE and minimal scopes without client secret',async()=>{
 const auth=await gmailAuthorization(config,'DJ@EXAMPLE.INVALID','a'.repeat(64)),url=new URL(auth.url);
 assert.equal(url.origin,'https://accounts.google.com');assert.equal(url.searchParams.get('scope'),GMAIL_SCOPES.join(' '));assert.equal(url.searchParams.get('access_type'),'offline');assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.equal(url.href.includes(config.clientSecret),false);assert.equal(url.href.includes(auth.verifier),false);
 assert.equal(url.searchParams.get('code_challenge'),base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(auth.verifier)))));
});
test('code exchange rejects partial consent and requires refresh token',async()=>{
 let body='';const request=mock(async(_url,options)=>{body=String(options.body);return Response.json({access_token:'access',refresh_token:'refresh',expires_in:3600,scope:GMAIL_SCOPES.join(' ')});});
 const t=await exchangeGmail(config,'code','verifier',request);assert.equal(t.refreshToken,'refresh');assert.equal(new URLSearchParams(body).get('code_verifier'),'verifier');
 await assert.rejects(exchangeGmail(config,'code','verifier',mock(async()=>Response.json({access_token:'access',refresh_token:'refresh',expires_in:3600,scope:GMAIL_SCOPES[0]}))),{message:'mailbox_scopes_required'});
});
test('expired testing grant fails closed before provider access',async()=>{
 let marked=0,calls=0;const t={...token(),reauthAt:Date.now()-1};
 const api=createGmailMailbox(config,{read:async()=>t,write:async()=>{},reauth:async()=>{marked++;}},mock(async()=>{calls++;throw new Error('should not read');}));
 await assert.rejects(api.grant(''),{message:'mailbox_reconnect_required'});assert.equal(marked,1);assert.equal(calls,0);
});
test('refresh invalid_grant marks reconnection, does not expose provider details',async()=>{
 let marked=0;const api=createGmailMailbox(config,{read:async()=>({...token(),expiresAt:0}),write:async()=>{},reauth:async()=>{marked++;}},mock(async()=>Response.json({error:'invalid_grant',description:'private'},{status:400})));
 await assert.rejects(api.grant(''),{message:'mailbox_reconnect_required'});assert.equal(marked,1);
});
test('refresh preserves seven-day deadline instead of extending authorization',async()=>{
 const t={...token(),expiresAt:0};let saved:any;const api=createGmailMailbox(config,{read:async()=>t,write:async value=>{saved=value;},reauth:async()=>{}},mock(async url=>Response.json(url.includes('/token')?{access_token:'new',expires_in:3600}:{emailAddress:'a@b.invalid',historyId:'123'})));
 await api.grant('');assert.equal(saved.reauthAt,t.reauthAt);assert.equal(saved.refreshToken,t.refreshToken);
});
const message={id:'m1',threadId:'t1',internalDate:String(Date.now()),labelIds:['INBOX'],payload:{mimeType:'multipart/alternative',headers:[{name:'From',value:'"Doe, Jane" <jane@example.invalid>'},{name:'To',value:'dj@example.invalid'},{name:'Subject',value:'Booking'}],parts:[{mimeType:'text/plain',body:{data:base64url(new TextEncoder().encode('Fee <500> & booking\nNueva fecha'))}},{mimeType:'application/pdf',filename:'private.pdf',body:{data:'bad'}}]}};
test('Gmail MIME mapping preserves literal text, quoted sender and ignores attachments',()=>{
 const mapped=gmailMessage(message),plain=mailboxMessage(mapped,'dj@example.invalid');assert.equal(plain.from,'jane@example.invalid');assert.equal(plain.senderName,'Doe, Jane');assert.equal(plain.body,'Fee <500> & booking\nNueva fecha');assert.deepEqual(mapped.folders,['INBOX']);
});
test('Gmail reply sets thread ID and RFC headers and preserves original subject',async()=>{
 const calls:any[]=[];const api=createGmailMailbox(config,{email:'dj@example.invalid',read:async()=>token(),write:async()=>{},reauth:async()=>{}},mock(async(url,options)=>{calls.push({url,options});return Response.json(url.includes('/send')?{id:'sent',threadId:'thread'}:{threadId:'thread',payload:{headers:[{name:'Message-ID',value:'<original@example.invalid>'},{name:'References',value:'<previous@example.invalid>'},{name:'Subject',value:'Oferta de actuación'}]}});}));
 await api.send('',{to:'contact@example.invalid',subject:'different',bodyText:'Sí, gracias',replyToMessageId:'parent'});
 const payload=JSON.parse(calls[1].options.body);assert.equal(payload.threadId,'thread');const raw=new TextDecoder().decode(Uint8Array.from(atob(payload.raw.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0)));
 assert.match(raw,/In-Reply-To: <original@example.invalid>/);assert.match(raw,/References: <previous@example.invalid> <original@example.invalid>/);assert.equal(raw.includes('different'),false);
});
test('ambiguous send is attempted once, and header injection is rejected before network',async()=>{
 let calls=0;const api=createGmailMailbox(config,{email:'dj@example.invalid',read:async()=>token(),write:async()=>{},reauth:async()=>{}},mock(async()=>{calls++;throw new Error('private network detail');}));
 await assert.rejects(api.send('',{to:'contact@example.invalid',subject:'test',bodyText:'reply'}),{message:'mailbox_provider_unavailable'});assert.equal(calls,1);
 await assert.rejects(api.send('',{to:'contact@example.invalid',subject:'test\r\nBcc: evil@example.invalid',bodyText:'reply'}));assert.equal(calls,1);
});
