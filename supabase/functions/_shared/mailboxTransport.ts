import {createNylasMailbox} from './nylasMailbox.ts';
import {createGmailMailbox,openGmail,sealGmail} from './gmailMailbox.ts';
import type {GmailTokens,GmailConfig} from './gmailMailbox.ts';
export type MailboxDb=<T>(path:string,init?:RequestInit)=>Promise<T>;
export function gmailConfig(env:(name:string)=>string|undefined):GmailConfig{return {clientId:env('GMAIL_CLIENT_ID')||'',clientSecret:env('GMAIL_CLIENT_SECRET')||'',encryptionKey:env('GMAIL_TOKEN_ENCRYPTION_KEY')||'',callbackUri:`${env('SUPABASE_URL')}/functions/v1/connected-mailbox`};}
export function gmailCredentialContext(row:{workspace_id:string;user_id:string;email:string}){return `gmail:${row.workspace_id}:${row.user_id}:${row.email}`;}
export function mailboxTransport(row:{id:string;workspace_id:string;user_id:string;email:string;transport?:string},env:(name:string)=>string|undefined,db:MailboxDb){
 if(row.transport!=='gmail')return createNylasMailbox({apiUri:env('NYLAS_API_URI')||'https://api.us.nylas.com',apiKey:env('NYLAS_API_KEY')||'',clientId:env('NYLAS_CLIENT_ID')||'',callbackUri:`${env('SUPABASE_URL')}/functions/v1/connected-mailbox`});
 const config=gmailConfig(env),path=`gmail_mailbox_credentials?connection_id=eq.${row.id}`,aad=gmailCredentialContext(row);
 return createGmailMailbox(config,{email:row.email,
  read:async()=>{const values=await db<Array<{token_ciphertext:string;reauth_required:boolean}>>(`${path}&select=token_ciphertext,reauth_required&limit=1`);if(!values[0]||values[0].reauth_required)throw new Error('mailbox_reconnect_required');return openGmail<GmailTokens>(values[0].token_ciphertext,config.encryptionKey,aad);},
  write:async tokens=>{await db(path,{method:'PATCH',body:JSON.stringify({token_ciphertext:await sealGmail(tokens,config.encryptionKey,aad),access_expires_at:new Date(tokens.expiresAt).toISOString()})});},
  reauth:async()=>{await db(path,{method:'PATCH',body:JSON.stringify({reauth_required:true})});}
 });
}
