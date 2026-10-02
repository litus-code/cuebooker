import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { consumePublicRateLimit, publicRateLimitKey } from "../_shared/publicRateLimit.ts";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
function json(body:unknown,status=200,headers:HeadersInit={}){return new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json","Cache-Control":"no-store",...headers}})}
function requiredEnv(name:string){const value=Deno.env.get(name)?.trim();if(!value)throw new Error(`missing_${name.toLowerCase()}`);return value}
async function serviceJson<T>(url:string,init:RequestInit,key:string):Promise<T>{
 const response=await fetch(url,{...init,headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json",...(init.headers||{})}});
 const text=await response.text();if(!response.ok)throw new Error(`supabase_${response.status}:${text.slice(0,300)}`);return(text?JSON.parse(text):null) as T;
}
function normalize(payload:Record<string,unknown>){
 const agencySlug=typeof payload.agencySlug==="string"?payload.agencySlug.trim().toLowerCase():"";
 const requestId=typeof payload.requestId==="string"?payload.requestId.trim().toLowerCase():"";
 const contactName=typeof payload.contactName==="string"?payload.contactName.trim():"";
 const contactEmail=typeof payload.contactEmail==="string"?payload.contactEmail.trim().toLowerCase():"";
 const initialMessage=typeof payload.initialMessage==="string"?payload.initialMessage.trim():"";
 if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(agencySlug)||agencySlug.length>120)throw new Error("invalid_payload");
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(requestId))throw new Error("invalid_payload");
 if(!contactName||contactName.length>160||!initialMessage||initialMessage.length>10000)throw new Error("invalid_payload");
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)||contactEmail.length>320)throw new Error("invalid_payload");
 return{agencySlug,requestId,contactName,contactEmail,initialMessage};
}
async function sha256Hex(value:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,"0")).join("")}
function dispatchNotificationEmails(supabaseUrl:string,serviceKey:string){
 const task=fetch(`${supabaseUrl.replace(/\/$/,"")}/functions/v1/dispatch-notification-emails`,{
  method:"POST",headers:{Authorization:`Bearer ${serviceKey}`,"Content-Type":"application/json"},body:JSON.stringify({limit:10})
 }).then(async response=>{if(!response.ok)throw new Error(`notification_dispatch_${response.status}`)}).catch(error=>console.error("agency-enquiry-notification-dispatch",error));
 EdgeRuntime.waitUntil(task);
}
Deno.serve(async request=>{
 if(request.method==="OPTIONS")return new Response(null,{status:204,headers:corsHeaders});
 if(request.method!=="POST")return json({error:"method_not_allowed"},405);
 const length=Number(request.headers.get("content-length")||"0");if(Number.isFinite(length)&&length>16384)return json({error:"payload_too_large"},413);
 let raw:unknown;try{raw=await request.json()}catch{return json({error:"invalid_json"},400)}
 if(!raw||typeof raw!=="object"||Array.isArray(raw))return json({error:"invalid_request"},400);
 const fields=raw as Record<string,unknown>;
 if(typeof fields.website==="string"&&fields.website.trim())return json({accepted:true,created:false},202);
 try{
  const payload=normalize(fields),supabaseUrl=requiredEnv("SUPABASE_URL").replace(/\/$/,""),serviceKey=requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const clientKey=await publicRateLimitKey(request,serviceKey,"public-agency-enquiry-client");
  const contactKey=await publicRateLimitKey(request,serviceKey,"public-agency-enquiry-contact",`${payload.agencySlug}\n${payload.contactEmail}`);
  const decisions=await Promise.all([
   consumePublicRateLimit(serviceJson,supabaseUrl,serviceKey,"public_agency_enquiry_client",clientKey,12,600),
   consumePublicRateLimit(serviceJson,supabaseUrl,serviceKey,"public_agency_enquiry_contact",contactKey,4,3600)
  ]);
  const blocked=decisions.filter(item=>!item.allowed);if(blocked.length)return json({error:"rate_limited"},429,{"Retry-After":String(Math.max(...blocked.map(item=>item.retryAfterSeconds),1))});
  const fingerprint=await sha256Hex(JSON.stringify({agencySlug:payload.agencySlug,contactName:payload.contactName,contactEmail:payload.contactEmail,initialMessage:payload.initialMessage}));
  const rows=await serviceJson<Array<{booking_id:string;created:boolean}>>(`${supabaseUrl}/rest/v1/rpc/create_public_agency_enquiry`,{
   method:"POST",body:JSON.stringify({target_agency_slug:payload.agencySlug,target_idempotency_key:payload.requestId,target_request_fingerprint:fingerprint,contact_name:payload.contactName,contact_email:payload.contactEmail,initial_message:payload.initialMessage})
  },serviceKey);
  const result=rows?.[0];if(!result?.booking_id)throw new Error("agency_enquiry_missing_result");
  if(result.created)dispatchNotificationEmails(supabaseUrl,serviceKey);
  return json({accepted:true,created:Boolean(result.created),reference:result.booking_id},result.created?201:200);
 }catch(error){
  const message=error instanceof Error?error.message:String(error);
  if(message.includes("public_agency_unavailable"))return json({error:"agency_unavailable"},404);
  if(message.includes("idempotency_key_reused"))return json({error:"request_id_reused"},409);
  if(message.includes("invalid_"))return json({error:"invalid_request"},400);
  console.error("submit-agency-enquiry",error);return json({error:"agency_enquiry_failed"},500);
 }
});
