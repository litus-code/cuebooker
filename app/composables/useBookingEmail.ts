import { createBookingEmailApi } from '../services/bookingEmailApi'

export function useBookingEmail() {
  const config = useRuntimeConfig()
  const auth = useCueAuth()

  return createBookingEmailApi({
    baseUrl: String(config.public.supabaseUrl || ''),
    publishableKey: String(config.public.supabasePublishableKey || ''),
    accessToken: () => auth.session.value?.access_token
  })
}
