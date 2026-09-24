type PublicPublishingState = {
  publicProfileEnabled: boolean
  passportPublicEnabled: boolean
  passportPublicMilestoneIds: string[] | null
  passportPublicMediaIds: string[]
  acceptingRequests: boolean
  workspaceId: string | null
}

type ArtistPublicRow = {
  id: string
  public_profile_enabled: boolean
  passport_public_enabled: boolean
  passport_public_milestone_ids: string[] | null
  passport_public_media_ids: string[]
}

type ArtistBookingRouteRow = {
  artist_id: string
  workspace_id: string
  accepting_requests: boolean
}

export function usePublicArtistPublishing() {
  const config = useRuntimeConfig()
  const auth = useCueAuth()
  const supabaseUrl = computed(() => String(config.public.supabaseUrl || '').replace(/\/$/, ''))
  const publishableKey = computed(() => String(config.public.supabasePublishableKey || ''))

  function headers() {
    const token = auth.session.value?.access_token
    if (!token) throw new Error('authentication_required')
    return {
      apikey: publishableKey.value,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async function load(artistId: string): Promise<PublicPublishingState> {
    const [artists, routes] = await Promise.all([
      $fetch<ArtistPublicRow[]>(`${supabaseUrl.value}/rest/v1/artists`, {
        headers: headers(),
        query: { id: `eq.${artistId}`, select: 'id,public_profile_enabled,passport_public_enabled,passport_public_milestone_ids,passport_public_media_ids', limit: '1' }
      }),
      $fetch<ArtistBookingRouteRow[]>(`${supabaseUrl.value}/rest/v1/artist_booking_routes`, {
        headers: headers(),
        query: { artist_id: `eq.${artistId}`, select: 'artist_id,workspace_id,accepting_requests', limit: '1' }
      })
    ])

    if (!artists[0]) throw new Error('artist_not_found_or_forbidden')
    return {
      publicProfileEnabled: Boolean(artists[0].public_profile_enabled),
      passportPublicEnabled: Boolean(artists[0].passport_public_enabled),
      passportPublicMilestoneIds: artists[0].passport_public_milestone_ids ?? null,
      passportPublicMediaIds: artists[0].passport_public_media_ids || [],
      acceptingRequests: Boolean(routes[0]?.accepting_requests),
      workspaceId: routes[0]?.workspace_id || null
    }
  }

  async function setPublicProfileEnabled(artistId: string, enabled: boolean) {
    const rows = await $fetch<ArtistPublicRow[]>(`${supabaseUrl.value}/rest/v1/artists`, {
      method: 'PATCH',
      headers: { ...headers(), Prefer: 'return=representation' },
      query: { id: `eq.${artistId}`, select: 'id,public_profile_enabled,passport_public_enabled,passport_public_milestone_ids,passport_public_media_ids' },
      body: { public_profile_enabled: enabled }
    })
    if (!rows[0]) throw new Error('public_profile_not_updated')
    return Boolean(rows[0].public_profile_enabled)
  }

  async function setPassportPublicEnabled(artistId: string, enabled: boolean) {
    const rows = await $fetch<ArtistPublicRow[]>(`${supabaseUrl.value}/rest/v1/artists`, {
      method: 'PATCH',
      headers: { ...headers(), Prefer: 'return=representation' },
      query: { id: `eq.${artistId}`, select: 'id,public_profile_enabled,passport_public_enabled' },
      body: { passport_public_enabled: enabled }
    })
    if (!rows[0]) throw new Error('passport_public_visibility_not_updated')
    return Boolean(rows[0].passport_public_enabled)
  }

  async function setPassportPublicSettings(
    artistId: string,
    enabled: boolean,
    milestoneIds: string[] | null,
    mediaIds: string[]
  ) {
    const rows = await $fetch<ArtistPublicRow[]>(`${supabaseUrl.value}/rest/v1/artists`, {
      method: 'PATCH',
      headers: { ...headers(), Prefer: 'return=representation' },
      query: { id: `eq.${artistId}`, select: 'id,public_profile_enabled,passport_public_enabled,passport_public_milestone_ids,passport_public_media_ids' },
      body: {
        passport_public_enabled: enabled,
        passport_public_milestone_ids: milestoneIds,
        passport_public_media_ids: mediaIds
      }
    })
    if (!rows[0]) throw new Error('passport_public_selection_not_updated')
    return {
      enabled: Boolean(rows[0].passport_public_enabled),
      milestoneIds: rows[0].passport_public_milestone_ids ?? null,
      mediaIds: rows[0].passport_public_media_ids || []
    }
  }

  async function setAcceptingRequests(artistId: string, workspaceId: string, enabled: boolean) {
    const userId = auth.session.value?.user.id
    if (!userId) throw new Error('authentication_required')
    if (!workspaceId) throw new Error('booking_workspace_required')

    const rows = await $fetch<ArtistBookingRouteRow[]>(`${supabaseUrl.value}/rest/v1/artist_booking_routes`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=representation' },
      query: { on_conflict: 'artist_id', select: 'artist_id,workspace_id,accepting_requests' },
      body: {
        artist_id: artistId,
        workspace_id: workspaceId,
        accepting_requests: enabled,
        created_by: userId
      }
    })

    if (!rows[0]) throw new Error('booking_route_not_updated')
    return Boolean(rows[0].accepting_requests)
  }

  return { load, setPublicProfileEnabled, setPassportPublicEnabled, setPassportPublicSettings, setAcceptingRequests }
}
