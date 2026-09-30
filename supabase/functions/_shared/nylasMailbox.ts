export type MailboxProvider = 'google' | 'microsoft' | 'imap';
export type NylasConfig = { apiUri: string; apiKey: string; clientId: string; callbackUri: string };
export function normalizeMailboxEmail(value: unknown): string {
 const email = String(value || '').trim().toLowerCase();
 if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('invalid_email');
 return email;
}
export function validateNylasConfig(config: NylasConfig) {
 if (!['https://api.us.nylas.com','https://api.eu.nylas.com'].includes(config.apiUri)) throw new Error('invalid_provider_configuration');
 const callback = new URL(config.callbackUri);
 if (callback.protocol !== 'https:' || callback.username || callback.password || callback.search || callback.hash) throw new Error('invalid_callback');
 if (!config.apiKey || !config.clientId) throw new Error('mailbox_not_configured');
}
export function mailboxAuthorizationUrl(config: NylasConfig, input: {email: string;provider: MailboxProvider;state: string}) {
 validateNylasConfig(config);
 if (!['google','microsoft','imap'].includes(input.provider)) throw new Error('invalid_provider');
 const url = new URL('/v3/connect/auth',config.apiUri);
 const fields = {client_id:config.clientId,redirect_uri:config.callbackUri,response_type:'code',access_type:'online',provider:input.provider,login_hint:normalizeMailboxEmail(input.email),state:input.state};
 for (const [name,value] of Object.entries(fields)) url.searchParams.set(name,value);
 // Email access only; no calendar or contacts scopes.
 if (input.provider==='google') url.searchParams.set('scope','openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send');
 if (input.provider==='microsoft') url.searchParams.set('scope','openid email User.Read offline_access Mail.ReadWrite Mail.Send');
 return url.href;
}
export function createNylasMailbox(config: NylasConfig, request: typeof fetch = fetch) {
 validateNylasConfig(config);
 async function call(path: string, init: RequestInit = {}) {
  const response = await request(`${config.apiUri}${path}`,{...init,headers:{Authorization:`Bearer ${config.apiKey}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(15000)});
  if (!response.ok) throw new Error(response.status===401 || response.status===403 ? 'mailbox_reconnect_required' : response.status===404 ? 'mailbox_not_found' : 'mailbox_provider_unavailable');
  return response.status===204 ? null : await response.json();
 }
 return {
  async exchange(code: string) {
   const result=await call('/v3/connect/token',{method:'POST',body:JSON.stringify({client_id:config.clientId,client_secret:config.apiKey,grant_type:'authorization_code',code,redirect_uri:config.callbackUri,code_verifier:'nylas'})});
   if(typeof result?.grant_id!=='string'||!result.grant_id)throw new Error('invalid_provider_response');
   return result.grant_id as string;
  },
  async grant(id: string) {
   const result=await call(`/v3/grants/${encodeURIComponent(id)}`);
   const data=result?.data;
   if (!data || !['google','microsoft','imap'].includes(data.provider)) throw new Error('invalid_provider_response');
   return {email:normalizeMailboxEmail(data.email),provider:data.provider as MailboxProvider,status:data.blocked?'invalid':String(data.grant_status || '')};
  },
  async disconnect(id: string) { await call(`/v3/grants/${encodeURIComponent(id)}`,{method:'DELETE'}); }
 };
}
