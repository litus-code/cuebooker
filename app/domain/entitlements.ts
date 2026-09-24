export type CuePlan = 'free' | 'artist_pro' | 'agency'

export type CueEntitlement =
  | 'booking.core'
  | 'booking.unlimited'
  | 'booking.history_full'
  | 'profile.public'
  | 'booking_form.public'
  | 'calendar.basic'
  | 'notifications.basic'
  | 'capture.manual'
  | 'capture.smart_extended'
  | 'automation.advanced'
  | 'passport.basic'
  | 'passport.advanced'
  | 'passport.media'
  | 'passport.export'
  | 'cue_id.basic'
  | 'cue_id.advanced'
  | 'analytics.advanced'
  | 'distribution.basic'
  | 'distribution.advanced'
  | 'branding.custom'
  | 'integrations.advanced'
  | 'data.export'
  | 'workspace.multi_artist'
  | 'workspace.team'
  | 'workspace.roles'
  | 'workspace.shared_inbox'
  | 'workspace.roster_calendar'
  | 'workspace.roster_reporting'
  | 'workspace.agency_templates'

export type CuePlanLimits = {
  activeBookings: number | null
  monthlyCaptures: number | null
  historyDays: number | null
  smartCaptureMonthly: number | null
  passportMediaItems: number | null
  artists: number | null
  teamMembers: number | null
}

export type CuePlanDefinition = {
  id: CuePlan
  label: string
  entitlements: ReadonlySet<CueEntitlement>
  limits: CuePlanLimits
}

const FREE_ENTITLEMENTS: CueEntitlement[] = [
  'booking.core',
  'profile.public',
  'booking_form.public',
  'calendar.basic',
  'notifications.basic',
  'capture.manual',
  'passport.basic',
  'cue_id.basic',
  'distribution.basic'
]

const PRO_ENTITLEMENTS: CueEntitlement[] = [
  ...FREE_ENTITLEMENTS,
  'booking.unlimited',
  'booking.history_full',
  'capture.smart_extended',
  'automation.advanced',
  'passport.advanced',
  'passport.media',
  'passport.export',
  'cue_id.advanced',
  'analytics.advanced',
  'distribution.advanced',
  'branding.custom',
  'integrations.advanced',
  'data.export'
]

const AGENCY_ENTITLEMENTS: CueEntitlement[] = [
  ...PRO_ENTITLEMENTS,
  'workspace.multi_artist',
  'workspace.team',
  'workspace.roles',
  'workspace.shared_inbox',
  'workspace.roster_calendar',
  'workspace.roster_reporting',
  'workspace.agency_templates'
]

export const CUE_PLANS: Record<CuePlan, CuePlanDefinition> = {
  free: {
    id: 'free',
    label: 'Free',
    entitlements: new Set(FREE_ENTITLEMENTS),
    limits: {
      activeBookings: 5,
      monthlyCaptures: 10,
      historyDays: 90,
      smartCaptureMonthly: 10,
      passportMediaItems: 0,
      artists: 1,
      teamMembers: 1
    }
  },
  artist_pro: {
    id: 'artist_pro',
    label: 'Artist Pro',
    entitlements: new Set(PRO_ENTITLEMENTS),
    limits: {
      activeBookings: null,
      monthlyCaptures: null,
      historyDays: null,
      smartCaptureMonthly: null,
      passportMediaItems: 250,
      artists: 1,
      teamMembers: 1
    }
  },
  agency: {
    id: 'agency',
    label: 'Agency',
    entitlements: new Set(AGENCY_ENTITLEMENTS),
    limits: {
      activeBookings: null,
      monthlyCaptures: null,
      historyDays: null,
      smartCaptureMonthly: null,
      passportMediaItems: 2_000,
      artists: null,
      teamMembers: null
    }
  }
}

export function hasCueEntitlement(plan: CuePlan, entitlement: CueEntitlement) {
  return CUE_PLANS[plan].entitlements.has(entitlement)
}

export function cuePlanLimit<K extends keyof CuePlanLimits>(plan: CuePlan, key: K) {
  return CUE_PLANS[plan].limits[key]
}

export function cueMinimumPlan(entitlement: CueEntitlement): CuePlan {
  if (CUE_PLANS.free.entitlements.has(entitlement)) return 'free'
  if (CUE_PLANS.artist_pro.entitlements.has(entitlement)) return 'artist_pro'
  return 'agency'
}

export function cuePlanBadge(entitlement: CueEntitlement) {
  const plan = cueMinimumPlan(entitlement)
  if (plan === 'free') return null
  return plan === 'artist_pro' ? 'PRO' : 'AGENCY'
}

export type CueEntitlementOverride = Partial<Record<CueEntitlement, boolean>>

export function resolveCueEntitlement(
  plan: CuePlan,
  entitlement: CueEntitlement,
  override?: CueEntitlementOverride
) {
  if (override && entitlement in override) return Boolean(override[entitlement])
  return hasCueEntitlement(plan, entitlement)
}
