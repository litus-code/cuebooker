import type { CueIdConfigV1 } from '../domain/cueId'

export type FeeBasis = 'event' | 'set' | 'hour'
export type ArtistImageStyle = 'photo' | 'artwork' | 'duotone'
export type ArtistVisualMode = 'photo' | 'artwork' | 'cue_id'

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
  cover_image_path: string | null
  cover_position_y: number
  artist_image_path: string | null
  artist_cutout_path: string | null
  artist_image_style: ArtistImageStyle
  artist_image_position_x: number
  artist_image_position_y: number
  artist_image_scale: number
  visual_mode: ArtistVisualMode
  cue_id_config: CueIdConfigV1
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
  artist: Omit<ArtistProfessionalProfile,
    | 'id'
    | 'slug'
    | 'artist_image_path'
    | 'artist_cutout_path'
    | 'artist_image_style'
    | 'artist_image_position_x'
    | 'artist_image_position_y'
    | 'artist_image_scale'
  >
  booking: Omit<ArtistBookingProfile, 'artist_id'>
}

export type ArtistVisualInput = {
  artist_image_path: string | null
  artist_cutout_path: string | null
  artist_image_style: ArtistImageStyle
  artist_image_position_x: number
  artist_image_position_y: number
  artist_image_scale: number
}

const artistSelect = 'id,stage_name,slug,bio,city,country_code,timezone,languages,primary_genres,secondary_genres,performance_formats,event_types,years_active,website_url,instagram_url,soundcloud_url,mixcloud_url,youtube_url,spotify_url,cover_image_path,cover_position_y,artist_image_path,artist_cutout_path,artist_image_style,artist_image_position_x,artist_image_position_y,artist_image_scale,visual_mode,cue_id_config'

export function useArtistProfile() {
  const config = useRuntimeConfig()
  const auth = useCueAuth()
  const supabaseUrl = computed(() => String(config.public.supabaseUrl || '').replace(/\/$/, ''))
  const publishableKey = computed(() => String(config.public.supabasePublishableKey || ''))
  const activeArtistId = useState<string>('artist-profile-active-id', () => '')
  const activeProfile = useState<ArtistProfileRecord | null>('artist-profile-active-record', () => null)

  function headers() {
    const token = auth.session.value?.access_token
    if (!token) throw new Error('authentication_required')
    return {
      apikey: publishableKey.value,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  function syncActiveProfile(record: ArtistProfileRecord) {
    activeArtistId.value = record.artist.id
    activeProfile.value = record
    return record
  }

  async function getProfile(artistId: string): Promise<ArtistProfileRecord> {
    const [artists, bookingProfiles] = await Promise.all([
      $fetch<ArtistProfessionalProfile[]>(`${supabaseUrl.value}/rest/v1/artists`, {
        headers: headers(),
        query: {
          id: `eq.${artistId}`,
          select: artistSelect,
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
    return syncActiveProfile({ artist: artists[0], booking: bookingProfiles[0] || null })
  }

  async function saveProfile(artistId: string, input: ArtistProfileInput): Promise<ArtistProfileRecord> {
    const artists = await $fetch<ArtistProfessionalProfile[]>(`${supabaseUrl.value}/rest/v1/artists`, {
      method: 'PATCH',
      headers: { ...headers(), Prefer: 'return=representation' },
      query: { id: `eq.${artistId}`, select: artistSelect },
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
    return syncActiveProfile({ artist: artists[0], booking: bookingProfiles[0] })
  }

  function storagePath(path: string) {
    return path.split('/').map(encodeURIComponent).join('/')
  }

  async function getMediaBlob(path: string) {
    const response = await fetch(`${supabaseUrl.value}/storage/v1/object/authenticated/artist-media/${storagePath(path)}`, {
      headers: headers()
    })
    if (!response.ok) throw new Error('artist_media_download_failed')
    return response.blob()
  }

  async function getMediaObjectUrl(path: string) {
    return URL.createObjectURL(await getMediaBlob(path))
  }

  function getCoverObjectUrl(path: string) {
    return getMediaObjectUrl(path)
  }

  function getArtistImageObjectUrl(path: string) {
    return getMediaObjectUrl(path)
  }

  function getArtistCutoutObjectUrl(path: string) {
    return getMediaObjectUrl(path)
  }

  async function uploadMedia(artistId: string, folder: 'covers' | 'portraits' | 'cutouts', file: Blob) {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    }
    const extension = extensions[file.type]
    if (!extension) throw new Error('artist_media_invalid_type')
    if (file.size > 8 * 1024 * 1024) throw new Error('artist_media_too_large')

    const path = `${artistId}/${folder}/${crypto.randomUUID()}.${extension}`
    const response = await fetch(`${supabaseUrl.value}/storage/v1/object/artist-media/${storagePath(path)}`, {
      method: 'POST',
      headers: {
        ...headers(),
        'Content-Type': file.type,
        'x-upsert': 'false'
      },
      body: file
    })
    if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'artist_media_upload_failed')
    return path
  }

  function uploadCover(artistId: string, file: File) {
    return uploadMedia(artistId, 'covers', file)
  }

  function uploadArtistImage(artistId: string, file: File) {
    return uploadMedia(artistId, 'portraits', file)
  }

  function uploadArtistCutout(artistId: string, file: Blob) {
    return uploadMedia(artistId, 'cutouts', file)
  }

  async function deleteMedia(path: string) {
    await $fetch(`${supabaseUrl.value}/storage/v1/object/artist-media`, {
      method: 'DELETE',
      headers: headers(),
      body: { prefixes: [path] }
    })
  }

  function deleteCover(path: string) {
    return deleteMedia(path)
  }

  function deleteArtistImage(path: string) {
    return deleteMedia(path)
  }

  function deleteArtistCutout(path: string) {
    return deleteMedia(path)
  }

  async function saveCover(artistId: string, coverImagePath: string | null, coverPositionY: number) {
    const rows = await $fetch<Array<{ cover_image_path: string | null; cover_position_y: number }>>(`${supabaseUrl.value}/rest/v1/artists`, {
      method: 'PATCH',
      headers: { ...headers(), Prefer: 'return=representation' },
      query: { id: `eq.${artistId}`, select: 'cover_image_path,cover_position_y' },
      body: { cover_image_path: coverImagePath, cover_position_y: coverPositionY }
    })
    if (!rows[0]) throw new Error('cover_not_saved')
    if (activeProfile.value?.artist.id === artistId) {
      activeProfile.value = {
        ...activeProfile.value,
        artist: { ...activeProfile.value.artist, ...rows[0] }
      }
    }
    return rows[0]
  }

  async function saveCueIdPresentation(artistId: string, visualMode: ArtistVisualMode, cueIdConfig: CueIdConfigV1) {
    const rows = await $fetch<ArtistProfessionalProfile[]>(`${supabaseUrl.value}/rest/v1/artists`, {
      method: 'PATCH',
      headers: { ...headers(), Prefer: 'return=representation' },
      query: {
        id: `eq.${artistId}`,
        select: artistSelect
      },
      body: {
        visual_mode: visualMode,
        cue_id_config: cueIdConfig
      }
    })
    if (!rows[0]) throw new Error('cue_id_not_saved')
    const record = syncActiveProfile({ artist: rows[0], booking: activeProfile.value?.booking || null })
    return record.artist
  }

  async function saveArtistVisual(artistId: string, visual: ArtistVisualInput) {
    const rows = await $fetch<ArtistProfessionalProfile[]>(`${supabaseUrl.value}/rest/v1/artists`, {
      method: 'PATCH',
      headers: { ...headers(), Prefer: 'return=representation' },
      query: {
        id: `eq.${artistId}`,
        select: artistSelect
      },
      body: visual
    })
    if (!rows[0]) throw new Error('artist_visual_not_saved')
    const record = syncActiveProfile({ artist: rows[0], booking: activeProfile.value?.booking || null })
    return record.artist
  }

  return {
    activeArtistId,
    activeProfile,
    getProfile,
    saveProfile,
    getMediaBlob,
    getCoverObjectUrl,
    getArtistImageObjectUrl,
    getArtistCutoutObjectUrl,
    uploadCover,
    uploadArtistImage,
    uploadArtistCutout,
    deleteCover,
    deleteArtistImage,
    deleteArtistCutout,
    saveCover,
    saveArtistVisual,
    saveCueIdPresentation
  }
}
