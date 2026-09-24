import type { CoreBooking } from './bookingCore'

export type CuePassportMediaType = 'image' | 'video' | 'reel'
export type CuePassportMediaSource = 'manual' | 'instagram' | 'upload' | 'other'
export type CuePassportMediaStatus = 'suggested' | 'linked' | 'hidden'

export type CuePassportMedia = {
  id: string
  workspace_id: string
  booking_id: string
  source: CuePassportMediaSource
  media_type: CuePassportMediaType
  status: CuePassportMediaStatus
  external_id: string | null
  permalink: string | null
  media_url: string | null
  thumbnail_url: string | null
  caption: string | null
  captured_at: string | null
  suggested_match_score: number | null
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
  updated_at: string
}

export type CuePassportMediaCandidate = {
  externalId: string
  source: Exclude<CuePassportMediaSource, 'manual' | 'upload'>
  mediaType: CuePassportMediaType
  permalink?: string | null
  mediaUrl?: string | null
  thumbnailUrl?: string | null
  caption?: string | null
  capturedAt?: string | null
  metadata?: Record<string, unknown>
}

export type CuePassportMediaSuggestion = CuePassportMediaCandidate & {
  bookingId: string
  score: number
  reasons: string[]
}

function dateOnly(value?: string | null) {
  if (!value) return null
  const match = /^\d{4}-\d{2}-\d{2}/.exec(value)
  return match?.[0] || null
}

function dayDistance(a?: string | null, b?: string | null) {
  const left = dateOnly(a)
  const right = dateOnly(b)
  if (!left || !right) return null
  const aTime = new Date(`${left}T12:00:00Z`).getTime()
  const bTime = new Date(`${right}T12:00:00Z`).getTime()
  if (!Number.isFinite(aTime) || !Number.isFinite(bTime)) return null
  return Math.round(Math.abs(aTime - bTime) / 86_400_000)
}

function normalized(value?: string | null) {
  return value?.trim().toLocaleLowerCase() || ''
}

export function scoreCuePassportMediaCandidate(
  booking: CoreBooking,
  candidate: CuePassportMediaCandidate
): CuePassportMediaSuggestion {
  let score = 0
  const reasons: string[] = []

  const distance = dayDistance(booking.event_date, candidate.capturedAt)
  if (distance === 0) {
    score += 70
    reasons.push('same_day')
  } else if (distance === 1) {
    score += 45
    reasons.push('within_1_day')
  } else if (distance !== null && distance <= 3) {
    score += 20
    reasons.push('within_3_days')
  }

  const searchable = normalized([
    candidate.caption,
    String(candidate.metadata?.location || ''),
    String(candidate.metadata?.venue || '')
  ].filter(Boolean).join(' '))

  const city = normalized(booking.city)
  if (city && searchable.includes(city)) {
    score += 15
    reasons.push('city_match')
  }

  const venue = normalized(booking.venue_name)
  if (venue && searchable.includes(venue)) {
    score += 15
    reasons.push('venue_match')
  }

  return {
    ...candidate,
    bookingId: booking.id,
    score: Math.min(100, score),
    reasons
  }
}

export function suggestCuePassportMedia(
  bookings: CoreBooking[],
  candidates: CuePassportMediaCandidate[],
  minScore = 40
) {
  const confirmed = bookings.filter(booking =>
    booking.status === 'confirmed'
    && !booking.archived_at
    && Boolean(booking.event_date)
  )

  return candidates
    .flatMap(candidate => confirmed.map(booking => scoreCuePassportMediaCandidate(booking, candidate)))
    .filter(suggestion => suggestion.score >= minScore)
    .sort((a, b) => b.score - a.score)
}

export function linkedCuePassportMedia(media: CuePassportMedia[]) {
  return media.filter(item => item.status === 'linked')
}
