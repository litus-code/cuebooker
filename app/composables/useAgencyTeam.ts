import { createAgencyTeamApi } from '../services/agencyTeamApi'
export function useAgencyTeam() {
 const config=useRuntimeConfig(),auth=useCueAuth()
 return createAgencyTeamApi({baseUrl:String(config.public.supabaseUrl||''),publishableKey:String(config.public.supabasePublishableKey||''),accessToken:()=>auth.session.value?.access_token})
}
