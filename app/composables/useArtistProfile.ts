export type FeeBasis = 'event' | 'set' | 'hour'

export type ArtistProfessionalProfile = {
  id: string
  stage_name: string
  slug: string
  bio: string | null
  city: string | null
  country_code: string | null
  timezone: string | null
  languages: string[]
  primary_genres: string[]
  secondary_genres: string[]
  performance_formats: string[]
  event_types: string[]
  years_active: number | null
  website_url: string | null
  instagram_url: string | null
  soundcloud_url: string | null
  mixcloud_url: string | null
  youtube_url: string | null
  spotify_url: string | null
}

export type ArtistBookingProfile = {
  artist_id: string
  fee_basis: FeeBasis | null
  fee_min: number | null
  fee_typical: number | null
  currency: string
  set_duration_minutes: number | null
  accepts_travel: boolean
  travel_regions: string[]
  equipment_notes: string | null
  technical_rider_url: string | null
  hospitality_rider_url: string | null
}

export type ArtistProfileRecord = {
  artist: ArtistProfessionalProfile
  booking: ArtistBookingProfile | null
}

export type ArtistProfileInput = {
  artist: Omit<ArtistProfessionalProfile, 'id' | 'slug'>
  booking: Omit<ArtistBookingProfile, 'artist_id'>
}

export function useArtistProfile() {
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

  async function getProfile(artistId: string): Promise<ArtistProfileRecord> {
    const [artists, bookingProfiles] = await Promise.all([
      $fetch<ArtistProfessionalProfile[]>(`${supabaseUrl.value}/rest/v1/artists`, {
        headers: headers(),
        query: {
          id: `eq.${artistId}`,
          select: 'id,stage_name,slug,bio,city,country_code,timezone,languages,primary_genres,secondary_genres,performance_formats,event_types,years_active,website_url,instagram_url,soundcloud_url,mixcloud_url,youtube_url,spotify_url',
          limit: '1'
        }
      }),
      $fetch<ArtistBookingProfile[]>(`${supabaseUrl.value}/rest/v1/artist_booking_profiles`, {
        headers: headers(),
        query: {
          artist_id: `eq.${artistId}`,
          select: 'artist_id,fee_basis,fee_min,fee_typical,currency,set_duration_minutes,accepts_travel,travel_regions,equipment_notes,technical_rider_url,hospitality_rider_url',
          limit: '1'
        }
      })
    ])

    if (!artists[0]) throw new Error('artist_not_found_or_forbidden')
    return { artist: artists[0], booking: bookingProfiles[0] || null }
  }

  async function saveProfile(artistId: string, input: ArtistProfileInput): Promise<ArtistProfileRecord> {
    const artists = await $fetch<ArtistProfessionalProfile[]>(`${supabaseUrl.value}/rest/v1/artists`, {
      method: 'PATCH',
      headers: { ...headers(), Prefer: 'return=representation' },
      query: { id: `eq.${artistId}` },
      body: input.artist
    })

    if (!artists[0]) throw new Error('artist_not_found_or_forbidden')

    const bookingProfiles = await $fetch<ArtistBookingProfile[]>(`${supabaseUrl.value}/rest/v1/artist_booking_profiles`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=representation' },
      query: { on_conflict: 'artist_id' },
      body: { artist_id: artistId, ...input.booking }
    })

    if (!bookingProfiles[0]) throw new Error('artist_booking_profile_not_saved')
    return { artist: artists[0], booking: bookingProfiles[0] }
  }

  return { getProfile, saveProfile }
}
