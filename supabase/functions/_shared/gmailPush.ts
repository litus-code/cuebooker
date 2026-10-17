import {normalizeMailboxEmail} from './nylasMailbox.ts';
let cached:{keys:JsonWebKey[];until:number}|null=null;
function decode(value:string){return Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));}
export async function verifyGmailPush(token:string,audience:string,serviceAccount:string,request:typeof fetch=fetch){
 try{
  if(!audience||!serviceAccount||token.length>10000)throw new Error();
  const [head,body,signature,...extra]=token.split('.');if(extra.length||!signature)throw new Error();
  const header=JSON.parse(new TextDecoder().decode(decode(head))),claims=JSON.parse(new TextDecoder().decode(decode(body)));
  if(header.alg!=='RS256'||typeof header.kid!=='string')throw new Error();
  const now=Math.floor(Date.now()/1000);
  if(!['accounts.google.com','https://accounts.google.com'].includes(claims.iss)||claims.aud!==audience||claims.email!==serviceAccount||claims.email_verified!==true||!Number.isFinite(claims.exp)||claims.exp<=now||!Number.isFinite(claims.iat)||claims.iat>now+60||claims.exp-claims.iat>7200)throw new Error();
  // Always fetch trusted Google's keys. Token-supplied jku/x5u are ignored.
  if(!cached||cached.until<Date.now()){
   const response=await request('https://www.googleapis.com/oauth2/v3/certs',{signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error();
   const value=await response.json();if(!Array.isArray(value.keys))throw new Error();cached={keys:value.keys,until:Date.now()+300000};
  }
  const jwk=cached.keys.find((k:any)=>k.kid===header.kid&&k.kty==='RSA'&&k.alg==='RS256');if(!jwk)throw new Error();
  const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(signature),new TextEncoder().encode(`${head}.${body}`)))throw new Error();
 }catch{throw new Error('unauthorized');}
}
export function gmailPushPayload(value:any,subscription:string){
 if(!subscription||value?.subscription!==subscription||typeof value.message?.data!=='string'||value.message.data.length>2048||typeof value.message.messageId!=='string')throw new Error('invalid_notification');
 try{const payload=JSON.parse(new TextDecoder().decode(decode(value.message.data)));
 if(!/^[0-9]{1,30}$/.test(payload.historyId))throw new Error();
 return {email:normalizeMailboxEmail(payload.emailAddress),historyId:payload.historyId as string};
 }catch{throw new Error('invalid_notification');}
}
