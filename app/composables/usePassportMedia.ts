import { createPassportMediaApi } from '../services/passportMediaApi'

export function usePassportMedia() {
  const config = useRuntimeConfig()
  const auth = useCueAuth()

  return createPassportMediaApi({
    baseUrl: String(config.public.supabaseUrl || ''),
    publishableKey: String(config.public.supabasePublishableKey || ''),
    accessToken: () => auth.session.value?.access_token,
    userId: () => auth.session.value?.user.id
  })
}
