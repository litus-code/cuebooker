import { agencyMediaExtension } from '../domain/agencyCatalog'
import type { AgencyCatalog } from '../domain/agencyCatalog'
export function useAgencyCatalog() {
 const config=useRuntimeConfig(),auth=useCueAuth()
 function rpc<T>(name:string,body:Record<string,unknown>) {
  if(!auth.session.value?.access_token) throw new Error('authentication_required')
  return $fetch<T>(`${String(config.public.supabaseUrl).replace(/\/$/,'')}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:String(config.public.supabasePublishableKey),Authorization:`Bearer ${auth.session.value.access_token}`},body})
 }
 async function upload(workspaceId:string,slot:'cover'|'logo',file:File) {
  const extension=agencyMediaExtension(file)
  if(!/^[0-9a-f-]{36}$/.test(workspaceId))throw new Error('invalid_workspace')
  const token=auth.session.value?.access_token
  if(!token)throw new Error('authentication_required')
  const path=`agency/${workspaceId}/${slot==='cover'?'covers':'logos'}/${crypto.randomUUID()}.${extension}`
  const response=await fetch(`${String(config.public.supabaseUrl).replace(/\/$/,'')}/storage/v1/object/artist-media/${path}`,{method:'POST',headers:{apikey:String(config.public.supabasePublishableKey),Authorization:`Bearer ${token}`,'Content-Type':file.type,'x-upsert':'false'},body:file})
  if(!response.ok)throw new Error('agency_media_upload_failed')
  return path
 }
 return { upload, load:(workspaceId:string)=>rpc<AgencyCatalog>('get_agency_catalog',{target_workspace_id:workspaceId}),save:(workspaceId:string,settings:AgencyCatalog,visibleIds:string[])=>rpc<AgencyCatalog>('save_agency_catalog',{target_workspace_id:workspaceId,settings,published:settings.published,visible_artist_ids:visibleIds}) }
}
