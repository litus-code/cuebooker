import type {
  CuePassportMedia,
  CuePassportMediaSource,
  CuePassportMediaStatus,
  CuePassportMediaType
} from '../domain/cuePassportMedia'

type PassportMediaApiOptions = {
  baseUrl: string
  publishableKey: string
  accessToken: () => string | null | undefined
  userId: () => string | null | undefined
}

export type CreatePassportMediaInput = {
  workspaceId: string
  bookingId: string
  source: CuePassportMediaSource
  mediaType: CuePassportMediaType
  status?: CuePassportMediaStatus
  externalId?: string | null
  permalink?: string | null
  mediaUrl?: string | null
  thumbnailUrl?: string | null
  caption?: string | null
  capturedAt?: string | null
  suggestedMatchScore?: number | null
  metadata?: Record<string, unknown>
}

function httpUrl(value: string | null | undefined) {
  const candidate = value?.trim()
  if (!candidate) return null
  try {
    const parsed = new URL(candidate)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('invalid_media_url')
    return parsed.toString()
  } catch (error) {
    if (error instanceof Error && error.message === 'invalid_media_url') throw error
    throw new Error('invalid_media_url')
  }
}

export function createPassportMediaApi(options: PassportMediaApiOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '')

  function authHeaders(prefer?: string) {
    const token = options.accessToken()
    if (!token) throw new Error('authentication_required')
    return {
      apikey: options.publishableKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    }
  }

  function currentUserId() {
    const userId = options.userId()
    if (!userId) throw new Error('authentication_required')
    return userId
  }

  async function listWorkspaceMedia(workspaceId: string) {
    return $fetch<CuePassportMedia[]>(`${baseUrl}/rest/v1/passport_media`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        select: 'id,workspace_id,booking_id,source,media_type,status,external_id,permalink,media_url,thumbnail_url,caption,captured_at,suggested_match_score,metadata,created_by,created_at,updated_at',
        order: 'captured_at.desc.nullslast,created_at.desc'
      }
    })
  }

  async function createMedia(input: CreatePassportMediaInput) {
    const rows = await $fetch<CuePassportMedia[]>(`${baseUrl}/rest/v1/passport_media`, {
      method: 'POST',
      headers: authHeaders('return=representation'),
      body: {
        workspace_id: input.workspaceId,
        booking_id: input.bookingId,
        source: input.source,
        media_type: input.mediaType,
        status: input.status || 'suggested',
        external_id: input.externalId || null,
        permalink: httpUrl(input.permalink),
        media_url: httpUrl(input.mediaUrl),
        thumbnail_url: httpUrl(input.thumbnailUrl),
        caption: input.caption || null,
        captured_at: input.capturedAt || null,
        suggested_match_score: input.suggestedMatchScore ?? null,
        metadata: input.metadata || {},
        created_by: currentUserId()
      }
    })

    const row = rows[0]
    if (!row) throw new Error('passport_media_create_failed')
    return row
  }

  async function updateStatus(workspaceId: string, mediaId: string, status: CuePassportMediaStatus) {
    const rows = await $fetch<CuePassportMedia[]>(`${baseUrl}/rest/v1/passport_media`, {
      method: 'PATCH',
      headers: authHeaders('return=representation'),
      query: {
        id: `eq.${mediaId}`,
        workspace_id: `eq.${workspaceId}`
      },
      body: { status }
    })

    const row = rows[0]
    if (!row) throw new Error('passport_media_update_failed')
    return row
  }

  return {
    listWorkspaceMedia,
    createMedia,
    updateStatus
  }
}
