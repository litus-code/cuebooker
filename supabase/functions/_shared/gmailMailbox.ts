import {normalizeMailboxEmail} from './nylasMailbox.ts';
export const GMAIL_SCOPES=['https://www.googleapis.com/auth/gmail.readonly','https://www.googleapis.com/auth/gmail.send'];
export type GmailConfig={clientId:string;clientSecret:string;callbackUri:string;encryptionKey:string};
export type GmailTokens={accessToken:string;refreshToken:string;expiresAt:number;reauthAt:number};
export function base64url(bytes:Uint8Array){return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');}
function unbase64(value:string){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
export function gmailConfigured(c:GmailConfig){try{const u=new URL(c.callbackUri);return Boolean(c.clientId&&c.clientSecret&&unbase64(c.encryptionKey).length===32&&u.protocol==='https:'&&!u.search&&!u.hash&&!u.username&&!u.password);}catch{return false;}}
export async function sealGmail(value:unknown,key:string,aad:string){
 const raw=unbase64(key);if(raw.length!==32)throw new Error('mailbox_not_configured');
 const secret=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt']),iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(aad)},secret,new TextEncoder().encode(JSON.stringify(value)));
 return `v1.${base64url(iv)}.${base64url(new Uint8Array(encrypted))}`;
}
export async function openGmail<T>(value:string,key:string,aad:string):Promise<T>{
 try{const [version,iv,data,...extra]=value.split('.');if(version!=='v1'||extra.length||unbase64(iv).length!==12)throw new Error();
 const secret=await crypto.subtle.importKey('raw',unbase64(key),'AES-GCM',false,['decrypt']);
 return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unbase64(iv),additionalData:new TextEncoder().encode(aad)},secret,unbase64(data))));
 }catch{throw new Error('mailbox_credentials_unavailable');}
}
export async function gmailAuthorization(c:GmailConfig,email:string,state:string){
 if(!gmailConfigured(c))throw new Error('mailbox_not_configured');
 if(!/^[0-9a-f]{64}$/.test(state))throw new Error('invalid_oauth_state');
 const verifier=base64url(crypto.getRandomValues(new Uint8Array(32))),challenge=base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier))));
 const url=new URL('https://accounts.google.com/o/oauth2/v2/auth');
 url.search=new URLSearchParams({client_id:c.clientId,redirect_uri:c.callbackUri,response_type:'code',access_type:'offline',prompt:'consent',scope:GMAIL_SCOPES.join(' '),login_hint:normalizeMailboxEmail(email),state,code_challenge:challenge,code_challenge_method:'S256'}).toString();
 return {url:url.href,verifier};
}
async function tokenRequest(c:GmailConfig,fields:Record<string,string>,request:typeof fetch){
 let response:Response;
 try{response=await request('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({...fields,client_id:c.clientId,client_secret:c.clientSecret}),signal:AbortSignal.timeout(15000)});}catch{throw new Error('mailbox_provider_unavailable');}
 const result=await response.json().catch(()=>null);
 if(!response.ok)throw new Error(result?.error==='invalid_grant'?'mailbox_reconnect_required':'mailbox_provider_unavailable');
 if(typeof result?.access_token!=='string'||!Number.isFinite(result.expires_in)||result.expires_in<=0)throw new Error('invalid_provider_response');
 return result;
}
export async function exchangeGmail(c:GmailConfig,code:string,verifier:string,request:typeof fetch=fetch):Promise<GmailTokens>{
 const r=await tokenRequest(c,{grant_type:'authorization_code',code,code_verifier:verifier,redirect_uri:c.callbackUri},request);
 if(typeof r.refresh_token!=='string'||!GMAIL_SCOPES.every(s=>String(r.scope||'').split(' ').includes(s)))throw new Error('mailbox_scopes_required');
 return {accessToken:r.access_token,refreshToken:r.refresh_token,expiresAt:Date.now()+r.expires_in*1000,reauthAt:Date.now()+7*86400000};
}
function header(message:any,name:string){return String(message.payload?.headers?.find((h:any)=>String(h.name).toLowerCase()===name.toLowerCase())?.value||'');}
function addresses(value:string){
 // Split outside quoted display names and angle-addresses; avoid splitting "Doe, Jane".
 const pieces=value.match(/(?:"(?:[^"\\]|\\.)*"|<[^>]*>|[^,])+/g)||[];
 return pieces.map(piece=>{const angle=piece.match(/<([^<>]+)>/),email=normalizeMailboxEmail(angle?angle[1]:piece.trim());return {email,name:angle?piece.slice(0,piece.indexOf('<')).trim().replace(/^"|"$/g,''):email};});
}
function plainBody(part:any,depth=0):string{
 if(depth>20)return '';
 if(part.filename)return '';
 if(part.mimeType==='text/plain'&&typeof part.body?.data==='string'&&part.body.data.length<=200000)return new TextDecoder().decode(unbase64(part.body.data));
 const children=Array.isArray(part.parts)?part.parts:[];
 const text=children.map((p:any)=>plainBody(p,depth+1)).filter(Boolean).join('\n');if(text)return text;
 if(part.mimeType==='text/html'&&typeof part.body?.data==='string'&&part.body.data.length<=200000)return new TextDecoder().decode(unbase64(part.body.data)).replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<br\s*\/?\s*>|<\/p>|<\/div>/gi,'\n').replace(/<[^>]*>/g,'');
 return '';
}
export function gmailMessage(message:any){
 if(typeof message.id!=='string'||typeof message.threadId!=='string'||!Number.isFinite(Number(message.internalDate)))throw new Error('invalid_provider_response');
 const body=plainBody(message.payload)||String(message.snippet||'');
 return {id:message.id,thread_id:message.threadId,from:addresses(header(message,'From')),to:addresses(header(message,'To')),subject:header(message,'Subject'),date:Math.floor(Number(message.internalDate)/1000),body:body.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'),folders:Array.isArray(message.labelIds)?message.labelIds:[],automation:{autoSubmitted:header(message,'Auto-Submitted'),contentType:header(message,'Content-Type'),listId:header(message,'List-ID'),listUnsubscribe:header(message,'List-Unsubscribe'),precedence:header(message,'Precedence')},threading:{inReplyTo:header(message,'In-Reply-To'),references:header(message,'References')}};
}
export function createGmailMailbox(c:GmailConfig,store:{email?:string;read:()=>Promise<GmailTokens>;write:(tokens:GmailTokens)=>Promise<void>;reauth:()=>Promise<void>},request:typeof fetch=fetch){
 async function access(){let t=await store.read();if(t.reauthAt<=Date.now()){await store.reauth();throw new Error('mailbox_reconnect_required');}
 if(t.expiresAt<=Date.now()+60000){try{const r=await tokenRequest(c,{grant_type:'refresh_token',refresh_token:t.refreshToken},request);t={...t,accessToken:r.access_token,refreshToken:r.refresh_token||t.refreshToken,expiresAt:Date.now()+r.expires_in*1000};await store.write(t);}catch(error){if((error as Error).message==='mailbox_reconnect_required')await store.reauth();throw error;}}
 return t.accessToken;
 }
 async function call(path:string,init:RequestInit={}){
 let response:Response;try{response=await request(`https://gmail.googleapis.com/gmail/v1/users/me${path}`,{...init,headers:{Authorization:`Bearer ${await access()}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(15000)});}catch(error){if((error as Error).message==='mailbox_reconnect_required')throw error;throw new Error('mailbox_provider_unavailable');}
 if(response.status===401){await store.reauth();throw new Error('mailbox_reconnect_required');}
 if(!response.ok)throw new Error(response.status===404?'mailbox_not_found':'mailbox_provider_unavailable');
 return response.status===204?null:response.json();
 }
 return {
  async grant(_id:string){const r=await call('/profile');return {email:normalizeMailboxEmail(r.emailAddress),provider:'google' as const,status:'valid',historyId:String(r.historyId)};},
  async message(_id:string,id:string){return gmailMessage(await call(`/messages/${encodeURIComponent(id)}?format=full`));},
  async messages(_id:string,threadId?:string,pageToken?:string){
   if(threadId){const r=await call(`/threads/${encodeURIComponent(threadId)}?format=full`);if(!Array.isArray(r.messages))throw new Error('invalid_provider_response');return {messages:r.messages.map(gmailMessage),nextCursor:null};}
   const q=new URLSearchParams({maxResults:'20',q:'newer_than:7d -in:spam -in:trash'});if(pageToken)q.set('pageToken',pageToken);
   const r=await call(`/messages?${q}`);if(r.messages!==undefined&&!Array.isArray(r.messages))throw new Error('invalid_provider_response');
   const messages=await Promise.all((r.messages||[]).map(async(m:any)=>gmailMessage(await call(`/messages/${encodeURIComponent(m.id)}?format=full`))));
   return {messages,nextCursor:typeof r.nextPageToken==='string'?r.nextPageToken:null};
  },
  async attachment(_grantId:string,messageId:string,attachmentId:string) {
   if(!/^[A-Za-z0-9_-]{1,512}$/.test(messageId)||!/^[A-Za-z0-9_-]{1,1024}$/.test(attachmentId))throw new Error('invalid_attachment_reference');
   const result=await call(`/messages/${encodeURIComponent(messageId)}/attachments/${encodeURIComponent(attachmentId)}`);
   if(typeof result?.data!=='string'||result.data.length>7500000)throw new Error('invalid_attachment_payload');
   const binary=atob(result.data.replace(/-/g,'+').replace(/_/g,'/'));
   if(binary.length>5242880)throw new Error('attachment_too_large');
   return Uint8Array.from(binary,c=>c.charCodeAt(0));
  },
  async inboxFolders(_id:string){return {inbox:['INBOX'],excluded:['SPAM','TRASH','SENT','DRAFT']};},
  async referencedMessages(reference:string){
   if(!/^<[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+>$/.test(reference)||reference.length>512)throw new Error('invalid_message');
   const q=new URLSearchParams({q:`rfc822msgid:${reference}`,maxResults:'5'});
   const result=await call(`/messages?${q}`);
   if(result.nextPageToken)throw new Error('ambiguous_mailbox_reference');
   if(result.messages!==undefined&&!Array.isArray(result.messages))throw new Error('invalid_provider_response');
   if(result.messages?.length>5)throw new Error('ambiguous_mailbox_reference');
   const ids:string[]=[];
   for(const item of result.messages||[]){
    if(typeof item.id!=='string'||!item.id||item.id.length>512)throw new Error('invalid_provider_response');
    const message=await call(`/messages/${encodeURIComponent(item.id)}?format=metadata&metadataHeaders=Message-ID`);
    if(header(message,'Message-ID').trim()===reference)ids.push(item.id);
   }
   return ids;
  },
  async send(_id:string,input:{to:string;subject:string;bodyText:string;replyToMessageId?:string}){
   const to=normalizeMailboxEmail(input.to);if(/[\r\n]/.test(to+input.subject))throw new Error('invalid_message');
   let threadId:string|undefined,subject=input.subject,references='',reply='';
   if(input.replyToMessageId){const parent=await call(`/messages/${encodeURIComponent(input.replyToMessageId)}?format=metadata&metadataHeaders=Message-ID&metadataHeaders=References&metadataHeaders=Subject`);threadId=parent.threadId;subject=header(parent,'Subject');reply=header(parent,'Message-ID');references=header(parent,'References');if(!/^<[^\s<>]+>$/.test(reply)||/[\r\n]/.test(subject+references)||references.length>4096)throw new Error('invalid_message');}
   let chunk='',words:string[]=[];for(const char of subject){if(new TextEncoder().encode(chunk+char).length>42){words.push(chunk);chunk='';}chunk+=char;}if(chunk||!words.length)words.push(chunk);
   const encodedSubject=words.map(word=>'=?UTF-8?B?'+btoa(Array.from(new TextEncoder().encode(word),b=>String.fromCharCode(b)).join(''))+'?=').join('\r\n ');
   const from=normalizeMailboxEmail(store.email||(await call('/profile')).emailAddress);
   const content=[`From: ${from}`,`To: ${to}`,`Subject: ${encodedSubject}`,'MIME-Version: 1.0','Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64',...(reply?[`In-Reply-To: ${reply}`,`References: ${references?references+' ':''}${reply}`]:[]),'',btoa(Array.from(new TextEncoder().encode(input.bodyText),b=>String.fromCharCode(b)).join('')).match(/.{1,76}/g)?.join('\r\n')||''].join('\r\n');
   // Never retry a send after an ambiguous response. Existing send-attempt ledger owns deduplication.
   const r=await call('/messages/send',{method:'POST',body:JSON.stringify({raw:base64url(new TextEncoder().encode(content)),...(threadId?{threadId}:{})})});
   if(!r?.id||!r.threadId)throw new Error('invalid_provider_response');
   return {id:r.id,thread_id:r.threadId,date:Math.floor(Date.now()/1000),subject};
  },
  async watch(topic:string){if(!/^projects\/[a-z][a-z0-9-]+\/topics\/[A-Za-z0-9._~-]+$/.test(topic))throw new Error('invalid_provider_configuration');const r=await call('/watch',{method:'POST',body:JSON.stringify({topicName:topic,labelIds:['INBOX'],labelFilterBehavior:'INCLUDE'})});if(!/^\d+$/.test(String(r.historyId))||!Number.isFinite(Number(r.expiration)))throw new Error('invalid_provider_response');return {historyId:String(r.historyId),expiresAt:new Date(Number(r.expiration)).toISOString()};},
  async stop(){await call('/stop',{method:'POST',body:'{}'});},
  async history(start:string,pageToken?:string){if(!/^\d+$/.test(start))throw new Error('invalid_message');const q=new URLSearchParams({startHistoryId:start,historyTypes:'messageAdded',maxResults:'20'});if(pageToken)q.set('pageToken',pageToken);return call(`/history?${q}`);},
  async disconnect(_id:string){const t=await store.read();try{await this.stop();}catch(error){if((error as Error).message!=='mailbox_reconnect_required')throw error;}
   const r=await request('https://oauth2.googleapis.com/revoke',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({token:t.refreshToken}),signal:AbortSignal.timeout(15000)});if(!r.ok&&r.status!==400)throw new Error('mailbox_provider_unavailable');
  }
 };
}
