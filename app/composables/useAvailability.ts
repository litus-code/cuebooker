export type AvailabilityStatus = 'unavailable' | 'hold' | 'confirmed'

export type AvailabilityBlock = {
  id: string
  artist_id: string
  starts_at: string
  ends_at: string
  status: AvailabilityStatus
  label: string | null
  note: string | null
  booking_reference: string | null
  created_by: string
}

type ArtistMembership = {
  artist_id: string
  role: 'owner' | 'manager' | 'editor'
}

type Artist = {
  id: string
  stage_name: string
  slug: string
}

export function useAvailability() {
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

  async function listArtists() {
    const userId = auth.session.value?.user.id
    if (!userId) throw new Error('authentication_required')

    const memberships = await $fetch<ArtistMembership[]>(`${supabaseUrl.value}/rest/v1/artist_members`, {
      headers: headers(),
      query: { user_id: `eq.${userId}`, select: 'artist_id,role' }
    })

    if (!memberships.length) return [] as Array<Artist & { role: ArtistMembership['role'] }>

    const ids = memberships.map(item => item.artist_id)
    const artists = await $fetch<Artist[]>(`${supabaseUrl.value}/rest/v1/artists`, {
      headers: headers(),
      query: { id: `in.(${ids.join(',')})`, select: 'id,stage_name,slug', order: 'stage_name.asc' }
    })

    return artists.map(artist => ({
      ...artist,
      role: memberships.find(item => item.artist_id === artist.id)?.role || 'editor'
    }))
  }

  async function listBlocks(artistId: string, from: string, to: string) {
    return $fetch<AvailabilityBlock[]>(`${supabaseUrl.value}/rest/v1/availability_blocks`, {
      headers: headers(),
      query: {
        artist_id: `eq.${artistId}`,
        starts_at: `lt.${to}`,
        ends_at: `gt.${from}`,
        select: 'id,artist_id,starts_at,ends_at,status,label,note,booking_reference,created_by',
        order: 'starts_at.asc'
      }
    })
  }

  async function createBlock(input: {
    artistId: string
    startsAt: string
    endsAt: string
    status: AvailabilityStatus
    label?: string
    note?: string
  }) {
    const userId = auth.session.value?.user.id
    if (!userId) throw new Error('authentication_required')

    const rows = await $fetch<AvailabilityBlock[]>(`${supabaseUrl.value}/rest/v1/availability_blocks`, {
      method: 'POST',
      headers: { ...headers(), Prefer: 'return=representation' },
      body: {
        artist_id: input.artistId,
        starts_at: input.startsAt,
        ends_at: input.endsAt,
        status: input.status,
        label: input.label?.trim() || null,
        note: input.note?.trim() || null,
        created_by: userId
      }
    })

    return rows[0]
  }

  async function deleteBlock(id: string) {
    await $fetch(`${supabaseUrl.value}/rest/v1/availability_blocks`, {
      method: 'DELETE',
      headers: { ...headers(), Prefer: 'return=minimal' },
      query: { id: `eq.${id}` }
    })
  }

  return { listArtists, listBlocks, createBlock, deleteBlock }
}
