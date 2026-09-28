import { createSmartCaptureApi } from '../services/smartCaptureApi'

export function useSmartCapture() {
  const config = useRuntimeConfig()
  const auth = useCueAuth()

  return createSmartCaptureApi({
    baseUrl: String(config.public.supabaseUrl || ''),
    publishableKey: String(config.public.supabasePublishableKey || ''),
    accessToken: () => auth.session.value?.access_token
  })
}
