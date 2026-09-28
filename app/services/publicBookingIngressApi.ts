import type {
  PublicArtistProfile,
  PublicBookingRequestInput,
  PublicBookingRequestResult
} from '../domain/publicArtistProfile'

type PublicArtistResponse = { artist: PublicArtistProfile }
type PublicErrorResponse = { error?: string }

function functionUrl(supabaseUrl: string, name: string) {
  const base = supabaseUrl.replace(/\/$/, '')
  if (!base) throw new Error('public_api_not_configured')
  return `${base}/functions/v1/${name}`
}

async function publicRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const payload = await response.json().catch(() => null) as (T & PublicErrorResponse) | null
  if (!response.ok) {
    const error = new Error(payload?.error || `public_api_${response.status}`)
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }
  return payload as T
}

export function getPublicArtistProfile(supabaseUrl: string, slug: string) {
  const url = new URL(functionUrl(supabaseUrl, 'get-public-artist-profile'))
  url.searchParams.set('slug', slug)
  return publicRequest<PublicArtistResponse>(url.toString()).then(result => result.artist)
}

export function submitPublicBookingRequest(supabaseUrl: string, input: PublicBookingRequestInput) {
  return publicRequest<PublicBookingRequestResult>(functionUrl(supabaseUrl, 'submit-booking-request'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
}
