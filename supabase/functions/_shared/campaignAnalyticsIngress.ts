type Dependencies = {
 limit: (request: Request) => Promise<{allowed: boolean; retryAfterSeconds: number}>
 persist: (operation: 'event' | 'withdraw', body: Record<string,unknown>) => Promise<unknown>
}
const cors = {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey, content-type, authorization','Access-Control-Allow-Methods':'POST, OPTIONS'}
export async function handleCampaignAnalytics(request: Request, deps: Dependencies) {
 const response=(body: unknown,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{...cors,'Content-Type':'application/json',...headers}})
 if(request.method==='OPTIONS') return new Response(null,{status:204,headers:cors})
 if(request.method!=='POST') return response({error:'method_not_allowed'},405)
 try {
  // Bound actual bytes, including chunked requests without a Content-Length.
  const reader=request.body?.getReader(); if(!reader) return response({error:'invalid_request'},400)
  const chunks: Uint8Array[]=[];let length=0
  while(true) {const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>4096){await reader.cancel();return response({error:'payload_too_large'},413)}chunks.push(value)}
  const bytes=new Uint8Array(length);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
  let body: Record<string,unknown>
  try {body=JSON.parse(new TextDecoder().decode(bytes))} catch {return response({error:'invalid_request'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body)||typeof body.visitor_token!=='string'||!/^[a-f0-9]{64}$/.test(body.visitor_token)) return response({error:'invalid_request'},400)
  if(body.operation!=='event'&&body.operation!=='withdraw')return response({error:'invalid_request'},400)
  if(body.operation==='event' && (typeof body.event_key!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(body.event_key)||!['page_view','signup_click','signup_started'].includes(String(body.event_name))||!body.dimensions||typeof body.dimensions!=='object'||Array.isArray(body.dimensions))) return response({error:'invalid_request'},400)
  // Withdrawal does not consume a tracking budget or collect another event.
  if(body.operation==='event') { const limit=await deps.limit(request); if(!limit.allowed)return response({error:'rate_limited'},429,{'Retry-After':String(limit.retryAfterSeconds)}) }
  const accepted=await deps.persist(body.operation,body)
  return response({accepted:body.operation==='withdraw'||accepted===true})
 } catch {return response({error:'analytics_unavailable'},503)}
}
