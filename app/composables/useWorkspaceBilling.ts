import type { CuePlan } from '../domain/entitlements'

export type WorkspaceBillingStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'paused'

export type WorkspaceBillingState = {
  workspaceId: string
  plan: CuePlan
  status: WorkspaceBillingStatus
  provider: 'stripe' | null
  providerCustomerId: string | null
  providerSubscriptionId: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

type WorkspaceBillingRow = {
  workspace_id: string
  plan_code: string
  status: WorkspaceBillingStatus
  provider: 'stripe' | null
  provider_customer_id: string | null
  provider_subscription_id: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
}

function resolvedPlan(row: WorkspaceBillingRow | null): CuePlan {
  if (!row) return 'free'
  const paidState = row.status === 'active' || row.status === 'trialing' || row.status === 'past_due'
  if (!paidState) return 'free'
  if (row.plan_code === 'artist_pro' || row.plan_code === 'agency') return row.plan_code
  return 'free'
}

export function useWorkspaceBilling() {
  const config = useRuntimeConfig()
  const auth = useCueAuth()
  const supabaseUrl = computed(() => String(config.public.supabaseUrl || '').replace(/\/$/, ''))
  const publishableKey = computed(() => String(config.public.supabasePublishableKey || ''))

  function headers() {
    const token = auth.session.value?.access_token
    if (!token) throw new Error('authentication_required')
    return {
      apikey: publishableKey.value,
      Authorization: `Bearer ${token}`
    }
  }

  async function load(workspaceId: string): Promise<WorkspaceBillingState> {
    if (!workspaceId) throw new Error('workspace_required')
    const rows = await $fetch<WorkspaceBillingRow[]>(`${supabaseUrl.value}/rest/v1/workspace_billing`, {
      headers: headers(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        select: 'workspace_id,plan_code,status,provider,provider_customer_id,provider_subscription_id,current_period_end,cancel_at_period_end',
        limit: '1'
      }
    })

    const row = rows[0] || null
    return {
      workspaceId,
      plan: resolvedPlan(row),
      status: row?.status || 'active',
      provider: row?.provider || null,
      providerCustomerId: row?.provider_customer_id || null,
      providerSubscriptionId: row?.provider_subscription_id || null,
      currentPeriodEnd: row?.current_period_end || null,
      cancelAtPeriodEnd: Boolean(row?.cancel_at_period_end)
    }
  }

  return { load }
}
