import type { PublicBookingFollowUp, PublicBookingFollowUpReplyResult } from '../domain/publicBookingFollowUp'

type FollowUpResponse = { followUp: PublicBookingFollowUp }
type ErrorResponse = { error?: string }

function functionUrl(supabaseUrl: string) {
  const base = supabaseUrl.replace(/\/$/, '')
  if (!base) throw new Error('public_api_not_configured')
  return `${base}/functions/v1/booking-follow-up`
}

async function publicRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const payload = await response.json().catch(() => null) as (T & ErrorResponse) | null
  if (!response.ok) {
    const error = new Error(payload?.error || `public_api_${response.status}`)
    ;(error as Error & { status?: number }).status = response.status
    throw error
  }
  return payload as T
}

export function getPublicBookingFollowUp(supabaseUrl: string, token: string) {
  const url = new URL(functionUrl(supabaseUrl))
  url.searchParams.set('token', token)
  return publicRequest<FollowUpResponse>(url.toString()).then(result => result.followUp)
}

export function replyPublicBookingFollowUp(
  supabaseUrl: string,
  input: { token: string; requestId: string; bodyText: string }
) {
  return publicRequest<PublicBookingFollowUpReplyResult>(functionUrl(supabaseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
}
