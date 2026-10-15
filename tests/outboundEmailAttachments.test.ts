import test from 'node:test';
import assert from 'node:assert/strict';
import {validateEmailAttachments,prepareEmailAttachments,emailAttachmentMetadata,bytesBase64,EMAIL_ATTACHMENT_MAX_BYTES} from '../app/domain/emailAttachments.ts';
import {emailRequestJson} from '../supabase/functions/_shared/emailAttachmentRequest.ts';
import {createGmailMailbox,base64url} from '../supabase/functions/_shared/gmailMailbox.ts';
import {createNylasMailbox} from '../supabase/functions/_shared/nylasMailbox.ts';
const pdf=new TextEncoder().encode('%PDF-1.7\nContrato de prueba');
const attachment={name:'Contrato actuación.pdf',contentType:'application/pdf',size:pdf.length,contentBase64:bytesBase64(pdf)};
test('file contract rejects count, aggregate size, MIME spoofing, invalid base64 and header/path injection',async()=>{
 assert.deepEqual(validateEmailAttachments([attachment]),[attachment]);
 for(const value of [null,{},[null],[{...attachment,name:'../bad.pdf'}],[{...attachment,name:'bad\r\nBcc.pdf'}],[{...attachment,name:'bad.exe'}],[{...attachment,contentType:'image/png'}],[{...attachment,size:1}],[{...attachment,contentBase64:'bad!'}],[{...attachment,contentBase64:bytesBase64(new Uint8Array(pdf.length))}],Array(6).fill(attachment)])assert.throws(()=>validateEmailAttachments(value));
 assert.throws(()=>emailAttachmentMetadata([{name:'a.pdf',size:EMAIL_ATTACHMENT_MAX_BYTES},{name:'b.pdf',size:1}]));
 assert.deepEqual(await prepareEmailAttachments([new File([pdf],attachment.name,{type:'application/pdf'})]),[attachment]);
 await assert.rejects(prepareEmailAttachments([new File(['<html>fake</html>'],'fake.pdf',{type:'application/pdf'})]));
 const full=new Uint8Array(EMAIL_ATTACHMENT_MAX_BYTES);full.set(new TextEncoder().encode('%PDF-'));
 assert.equal(validateEmailAttachments([{...attachment,size:full.length,contentBase64:bytesBase64(full)}])[0].size,full.length);
});
test('streaming request cap applies without trusting Content-Length',async()=>{
 await assert.rejects(emailRequestJson(new Request('https://fixture.invalid',{method:'POST',headers:{'content-length':'9000000'},body:'{}'})),{message:'email_request_too_large'});
 const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(8*1024*1024+1));c.close()}});
 await assert.rejects(emailRequestJson(new Request('https://fixture.invalid',{method:'POST',body:stream,duplex:'half'} as any)),{message:'email_request_too_large'});
});
test('Gmail reply MIME preserves exact file bytes, Unicode name and original thread/headers',async()=>{
 let sent:any,calls=0;
 const api=createGmailMailbox({clientId:'fixture',clientSecret:'fixture',encryptionKey:base64url(new Uint8Array(32)),callbackUri:'https://fixture.invalid'},{email:'dj@example.invalid',read:async()=>({accessToken:'fixture',refreshToken:'fixture',expiresAt:Date.now()+3600000,reauthAt:Date.now()+86400000}),write:async()=>{},reauth:async()=>{}},(async(url:any,init:any)=>{
  calls++;if(String(url).includes('/send')){sent=JSON.parse(init.body);return Response.json({id:'sent',threadId:'thread'})}
  return Response.json({threadId:'thread',payload:{headers:[{name:'Subject',value:'Solicitud original'},{name:'Message-ID',value:'<parent@example.invalid>'}]}})
 }) as typeof fetch);
 await api.send('',{to:'promoter@example.invalid',subject:'Re: asunto',bodyText:'Adjunto contrato',replyToMessageId:'parent',attachments:[attachment]});
 assert.equal(calls,2);assert.equal(sent.threadId,'thread');
 const mime=Buffer.from(sent.raw,'base64url').toString();assert.match(mime,/In-Reply-To: <parent@example.invalid>/);assert.match(mime,/Content-Type: multipart\/mixed/);assert.match(mime,/filename\*=UTF-8''Contrato%20actuaci%C3%B3n.pdf/);
 assert.match(mime,/Content-Type: application\/pdf/);assert.ok(mime.includes(attachment.contentBase64));assert.deepEqual(Buffer.from(attachment.contentBase64,'base64'),Buffer.from(pdf));
 assert.ok(mime.split('\r\n').every(line=>line.length<998));
 await assert.rejects(api.send('',{to:'promoter@example.invalid',subject:'test',bodyText:'test',attachments:[{...attachment,name:'inject\n.pdf'}]}));assert.equal(calls,2);
});
test('Nylas receives the same validated document with its original reply target',async()=>{
 let payload:any;
 const api=createNylasMailbox({apiUri:'https://api.us.nylas.com',apiKey:'fixture',clientId:'fixture',callbackUri:'https://fixture.invalid'},(async(_url:any,init:any)=>{payload=JSON.parse(init.body);return Response.json({data:{id:'sent',thread_id:'thread'}})}) as typeof fetch);
 await api.send('grant',{to:'promoter@example.invalid',subject:'test',bodyText:'Contrato',replyToMessageId:'parent',attachments:[attachment]});
 assert.equal(payload.reply_to_message_id,'parent');assert.deepEqual(payload.attachments,[{filename:attachment.name,content_type:attachment.contentType,content:attachment.contentBase64}]);
});

test('both client send routes preserve files and flag transport uncertainty without retry',async()=>{
 const {createBookingEmailApi}=await import('../app/services/bookingEmailApi.ts');
 const {createConnectedMailboxApi}=await import('../app/services/connectedMailboxApi.ts');
 const oldFetch=globalThis.fetch;let calls=0;
 const options={baseUrl:'https://client-fixture.invalid',publishableKey:'public',accessToken:()=> 'fixture'};
 const email=createBookingEmailApi(options),connected=createConnectedMailboxApi(options);
 const input={workspaceId:'workspace',bookingId:'booking',connectionId:'connection',subject:'Reply',bodyText:'Contract',requestId:'request',attachments:[attachment]};
 try{
  globalThis.fetch=(async(_url:any,init:any)=>{calls++;assert.deepEqual(JSON.parse(init.body).attachments,[attachment]);return Response.json({status:'sent',attachmentStatus:{stored:1,pending:0}})}) as typeof fetch;
  await email.sendBookingEmail(input);await connected.send(input);assert.equal(calls,2);
  globalThis.fetch=(async()=>{calls++;throw new TypeError('network unavailable')}) as typeof fetch;
  await assert.rejects(email.sendBookingEmail(input),{message:'email_send_uncertain'});await assert.rejects(connected.send(input),{message:'email_send_uncertain'});assert.equal(calls,4);
 }finally{globalThis.fetch=oldFetch}
});
