import type { AgencyCatalog } from '../domain/agencyCatalog'
export function useAgencyCatalog() {
 const config=useRuntimeConfig(),auth=useCueAuth()
 function rpc<T>(name:string,body:Record<string,unknown>) {
  if(!auth.session.value?.access_token) throw new Error('authentication_required')
  return $fetch<T>(`${String(config.public.supabaseUrl).replace(/\/$/,'')}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:String(config.public.supabasePublishableKey),Authorization:`Bearer ${auth.session.value.access_token}`},body})
 }
 return { load:(workspaceId:string)=>rpc<AgencyCatalog>('get_agency_catalog',{target_workspace_id:workspaceId}),save:(workspaceId:string,settings:AgencyCatalog,visibleIds:string[])=>rpc<AgencyCatalog>('save_agency_catalog',{target_workspace_id:workspaceId,settings,published:settings.published,visible_artist_ids:visibleIds}) }
}
