import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { handleCampaignAnalytics } from '../_shared/campaignAnalyticsIngress.ts'
import { consumePublicRateLimit, publicRateLimitKey } from '../_shared/publicRateLimit.ts'
const url=Deno.env.get('SUPABASE_URL') || ''
const key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
async function serviceJson<T>(endpoint:string,init:RequestInit):Promise<T>{
 const result=await fetch(endpoint,{...init,headers:{apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'}})
 if(!result.ok)throw new Error('analytics_backend_unavailable')
 return result.json()
}
Deno.serve(request=>handleCampaignAnalytics(request,{
 async limit(req){
  const hash=await publicRateLimitKey(req,key,'campaign-client')
  // Fail closed if the gateway provides no trusted client address.
  if(!hash)return {allowed:false,retryAfterSeconds:60}
  return consumePublicRateLimit(serviceJson,url,key,'campaign_client',hash,200,3600)
 },
 async persist(operation,body){
  const rpc=operation==='withdraw'?'revoke_campaign_consent':'record_campaign_event'
  const payload=operation==='withdraw'?{visitor_token:body.visitor_token}:{visitor_token:body.visitor_token,event_key:body.event_key,event_name:body.event_name,dimensions:body.dimensions}
  return serviceJson(`${url}/rest/v1/rpc/${rpc}`,{method:'POST',body:JSON.stringify(payload)})
 }
}))
