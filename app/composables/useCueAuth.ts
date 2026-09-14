type CueUser = {
  id: string
  email?: string
}

type CueProfile = {
  user_id: string
  display_name: string | null
  onboarding_completed: boolean
}

type CueSession = {
  access_token: string
  refresh_token: string
  expires_at: number
  user: CueUser
}

type AuthResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: CueUser
}

type ReferralSnapshot = {
  code: string
  landingPath: string
  firstSeenAt: string
}

const SESSION_KEY = 'cuebooker.auth.session.v1'
const REFERRAL_KEY = 'cuebooker.referral.first-touch.v1'

function normalizeSession(payload: AuthResponse): CueSession | null {
  if (!payload.access_token || !payload.refresh_token || !payload.user) return null

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (payload.expires_in || 3600),
    user: payload.user
  }
}

export function useCueAuth() {
  const config = useRuntimeConfig()
  const session = useState<CueSession | null>('cue-auth-session', () => null)
  const profile = useState<CueProfile | null>('cue-auth-profile', () => null)
  const initialized = useState<boolean>('cue-auth-initialized', () => false)
  const loading = useState<boolean>('cue-auth-loading', () => false)

  const supabaseUrl = computed(() => String(config.public.supabaseUrl || '').replace(/\/$/, ''))
  const publishableKey = computed(() => String(config.public.supabasePublishableKey || ''))
  const configured = computed(() => Boolean(supabaseUrl.value && publishableKey.value))
  const signedIn = computed(() => Boolean(session.value?.access_token))

  function baseHeaders(withAuth = false) {
    const headers: Record<string, string> = {
      apikey: publishableKey.value,
      'Content-Type': 'application/json'
    }

    if (withAuth && session.value?.access_token) {
      headers.Authorization = `Bearer ${session.value.access_token}`
    }

    return headers
  }

  function saveSession(next: CueSession | null) {
    session.value = next
    if (!import.meta.client) return

    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next))
    else localStorage.removeItem(SESSION_KEY)
  }

  async function refreshSession() {
    if (!configured.value || !session.value?.refresh_token) {
      saveSession(null)
      profile.value = null
      return null
    }

    try {
      const payload = await $fetch<AuthResponse>(`${supabaseUrl.value}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: baseHeaders(),
        body: { refresh_token: session.value.refresh_token }
      })
      const next = normalizeSession(payload)
      saveSession(next)
      return next
    } catch {
      saveSession(null)
      profile.value = null
      return null
    }
  }

  async function ensureFreshSession() {
    if (!session.value) return null
    const refreshThreshold = Math.floor(Date.now() / 1000) + 60
    if (session.value.expires_at <= refreshThreshold) return refreshSession()
    return session.value
  }

  async function fetchProfile() {
    const current = await ensureFreshSession()
    if (!current) {
      profile.value = null
      return null
    }

    const rows = await $fetch<CueProfile[]>(`${supabaseUrl.value}/rest/v1/profiles`, {
      headers: baseHeaders(true),
      query: {
        user_id: `eq.${current.user.id}`,
        select: 'user_id,display_name,onboarding_completed',
        limit: '1'
      }
    })

    profile.value = rows[0] || null
    return profile.value
  }

  async function initialize() {
    if (initialized.value || !import.meta.client) return
    initialized.value = true

    if (!configured.value) return

    const stored = localStorage.getItem(SESSION_KEY)
    if (!stored) return

    try {
      session.value = JSON.parse(stored) as CueSession
      const current = await ensureFreshSession()
      if (current) await fetchProfile()
    } catch {
      saveSession(null)
      profile.value = null
    }
  }

  async function signIn(email: string, password: string) {
    if (!configured.value) throw new Error('supabase_not_configured')
    loading.value = true

    try {
      const payload = await $fetch<AuthResponse>(`${supabaseUrl.value}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: baseHeaders(),
        body: { email: email.trim(), password }
      })
      const next = normalizeSession(payload)
      if (!next) throw new Error('invalid_session_response')
      saveSession(next)
      await persistReferralAttribution()
      await fetchProfile()
      return next
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string, displayName: string) {
    if (!configured.value) throw new Error('supabase_not_configured')
    loading.value = true

    try {
      const payload = await $fetch<AuthResponse>(`${supabaseUrl.value}/auth/v1/signup`, {
        method: 'POST',
        headers: baseHeaders(),
        body: {
          email: email.trim(),
          password,
          data: { display_name: displayName.trim() }
        }
      })
      const next = normalizeSession(payload)
      if (next) {
        saveSession(next)
        await persistReferralAttribution()
        await fetchProfile()
      }
      return { session: next, emailConfirmationRequired: !next }
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    try {
      if (configured.value && session.value?.access_token) {
        await $fetch(`${supabaseUrl.value}/auth/v1/logout`, {
          method: 'POST',
          headers: baseHeaders(true)
        })
      }
    } finally {
      saveSession(null)
      profile.value = null
    }
  }

  function captureReferral(code: string | null | undefined, landingPath: string) {
    if (!import.meta.client || !code) return
    if (localStorage.getItem(REFERRAL_KEY)) return

    const normalized = code.trim().toLowerCase()
    if (!/^[a-z0-9][a-z0-9_-]{1,63}$/.test(normalized)) return

    const snapshot: ReferralSnapshot = {
      code: normalized,
      landingPath: landingPath.slice(0, 512),
      firstSeenAt: new Date().toISOString()
    }
    localStorage.setItem(REFERRAL_KEY, JSON.stringify(snapshot))
  }

  async function persistReferralAttribution() {
    if (!import.meta.client || !session.value) return
    const raw = localStorage.getItem(REFERRAL_KEY)
    if (!raw) return

    let snapshot: ReferralSnapshot
    try {
      snapshot = JSON.parse(raw) as ReferralSnapshot
    } catch {
      return
    }

    const existing = await $fetch<Array<{ user_id: string }>>(`${supabaseUrl.value}/rest/v1/referral_attributions`, {
      headers: baseHeaders(true),
      query: { user_id: `eq.${session.value.user.id}`, select: 'user_id', limit: '1' }
    })
    if (existing.length) return

    const sources = await $fetch<Array<{ id: string }>>(`${supabaseUrl.value}/rest/v1/referral_sources`, {
      headers: baseHeaders(true),
      query: { code: `eq.${snapshot.code}`, active: 'eq.true', select: 'id', limit: '1' }
    })

    await $fetch(`${supabaseUrl.value}/rest/v1/referral_attributions`, {
      method: 'POST',
      headers: { ...baseHeaders(true), Prefer: 'return=minimal' },
      body: {
        user_id: session.value.user.id,
        source_id: sources[0]?.id || null,
        raw_ref: snapshot.code,
        landing_path: snapshot.landingPath,
        first_seen_at: snapshot.firstSeenAt
      }
    })
  }

  async function completeOnboarding(input: {
    accountType: 'dj' | 'agency'
    displayName: string
    entityName: string
    entitySlug: string
  }) {
    const current = await ensureFreshSession()
    if (!current) throw new Error('authentication_required')

    const result = await $fetch(`${supabaseUrl.value}/rest/v1/rpc/complete_onboarding`, {
      method: 'POST',
      headers: baseHeaders(true),
      body: {
        account_type: input.accountType,
        display_name: input.displayName.trim(),
        entity_name: input.entityName.trim(),
        entity_slug: input.entitySlug.trim().toLowerCase()
      }
    })

    await fetchProfile()
    return result
  }

  function accountDestination() {
    return profile.value?.onboarding_completed ? '/workspace' : '/onboarding'
  }

  return {
    session: readonly(session),
    profile: readonly(profile),
    loading: readonly(loading),
    initialized: readonly(initialized),
    configured,
    signedIn,
    initialize,
    fetchProfile,
    signIn,
    signUp,
    signOut,
    captureReferral,
    persistReferralAttribution,
    completeOnboarding,
    accountDestination
  }
}
