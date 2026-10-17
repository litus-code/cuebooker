type ProductTelemetryPayload = Record<string, string | number | boolean | null | undefined>

type BetaAnalyticsSummary = {
  window_days: number
  users_total: number
  users_new: number
  active_users: number
  onboarding_completed: number
  bookings_created: number
  bookings_confirmed: number
  smart_capture_started: number
  smart_capture_results: number
  smart_capture_applied: number
  smart_capture_discarded: number
  media_linked: number
  media_failures: number
  automations_created: number
  automations_completed: number
}

type BetaAnalyticsUser = {
  user_id: string
  email: string
  display_name: string | null
  onboarding_completed: boolean
  account_type: string
  registered_at: string
  bookings: number
  smart_cue: number
  media: number
  automations: number
  last_activity: string | null
}

export function useProductTelemetry() {
  const config = useRuntimeConfig()
  const auth = useCueAuth()
  const analytics = useAnalytics()

  const baseUrl = computed(() => String(config.public.supabaseUrl || '').replace(/\/$/, ''))
  const publishableKey = computed(() => String(config.public.supabasePublishableKey || ''))

  function headers() {
    const token = auth.session.value?.access_token || ''
    return {
      apikey: publishableKey.value,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async function record(
    eventName: string,
    payload: ProductTelemetryPayload = {},
    workspaceId: string | null = null
  ) {
    if (!import.meta.client || analytics.consent.value !== 'granted' || !auth.session.value?.access_token || !baseUrl.value || !publishableKey.value) return false
    try {
      await $fetch(`${baseUrl.value}/rest/v1/rpc/record_product_analytics_event`, {
        method: 'POST',
        headers: headers(),
        body: {
          target_workspace_id: workspaceId,
          target_event_name: eventName,
          target_properties: payload
        }
      })
      return true
    } catch {
      return false
    }
  }

  async function isInternalAdmin() {
    if (!auth.session.value?.access_token || !baseUrl.value || !publishableKey.value) return false
    try {
      return await $fetch<boolean>(`${baseUrl.value}/rest/v1/rpc/is_internal_admin`, {
        method: 'POST',
        headers: headers(),
        body: {}
      })
    } catch {
      return false
    }
  }

  async function getBetaSummary(days = 30) {
    return $fetch<BetaAnalyticsSummary>(`${baseUrl.value}/rest/v1/rpc/get_beta_analytics_summary`, {
      method: 'POST',
      headers: headers(),
      body: { window_days: days }
    })
  }

  async function getBetaUsers(days = 30) {
    return $fetch<BetaAnalyticsUser[]>(`${baseUrl.value}/rest/v1/rpc/get_beta_analytics_users`, {
      method: 'POST',
      headers: headers(),
      body: { window_days: days }
    })
  }

  async function getCampaignFunnel(filters: Record<string,string | null>) {
    return $fetch<import('../domain/campaignAnalytics').CampaignReport>(`${baseUrl.value}/rest/v1/rpc/get_campaign_funnel`, {
      method: 'POST', headers: headers(), body: filters
    })
  }

  return {
    getCampaignFunnel,
    record,
    isInternalAdmin,
    getBetaSummary,
    getBetaUsers
  }
}

export type { BetaAnalyticsSummary, BetaAnalyticsUser, ProductTelemetryPayload }
