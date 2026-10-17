import { createConnectedMailboxApi } from '../services/connectedMailboxApi'
export function useConnectedMailbox(){
 const config=useRuntimeConfig(),auth=useCueAuth()
 return createConnectedMailboxApi({baseUrl:String(config.public.supabaseUrl||''),publishableKey:String(config.public.supabasePublishableKey||''),accessToken:()=>auth.session.value?.access_token})
}
