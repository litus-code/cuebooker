import { createNotificationApi } from '../services/notificationApi'

export function useNotifications() {
  const config = useRuntimeConfig()
  const auth = useCueAuth()

  return createNotificationApi({
    baseUrl: String(config.public.supabaseUrl || ''),
    publishableKey: String(config.public.supabasePublishableKey || ''),
    accessToken: () => auth.session.value?.access_token
  })
}
