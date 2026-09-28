import { createBookingCoreApi } from '../services/bookingCoreApi'

export function useBookingCore() {
  const config = useRuntimeConfig()
  const auth = useCueAuth()

  const api = createBookingCoreApi({
    baseUrl: String(config.public.supabaseUrl || ''),
    publishableKey: String(config.public.supabasePublishableKey || ''),
    accessToken: () => auth.session.value?.access_token,
    userId: () => auth.session.value?.user.id
  })

  return api
}
