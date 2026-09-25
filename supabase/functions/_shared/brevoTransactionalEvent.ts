export type BrevoDeliveryStatus =
  | 'accepted'
  | 'delivered'
  | 'deferred'
  | 'soft_bounce'
  | 'hard_bounce'
  | 'blocked'
  | 'spam'
  | 'invalid'
  | 'error'

export function normalizeBrevoEvent(event: string) {
  return event.trim().toLowerCase().replaceAll('-', '_').replaceAll(' ', '_')
}

export function brevoDeliveryStatus(event: string): BrevoDeliveryStatus | null {
  const key = normalizeBrevoEvent(event)
  if (key === 'delivered') return 'delivered'
  if (key === 'deferred') return 'deferred'
  if (key === 'soft_bounce' || key === 'softbounce') return 'soft_bounce'
  if (key === 'hard_bounce' || key === 'hardbounce') return 'hard_bounce'
  if (key === 'blocked') return 'blocked'
  if (key === 'spam') return 'spam'
  if (key === 'invalid' || key === 'invalid_email') return 'invalid'
  if (key === 'error') return 'error'
  if (key === 'request' || key === 'sent') return 'accepted'
  return null
}

export function isBrevoFailureStatus(status: BrevoDeliveryStatus | null) {
  return status === 'soft_bounce'
    || status === 'hard_bounce'
    || status === 'blocked'
    || status === 'spam'
    || status === 'invalid'
    || status === 'error'
}

export function isBrevoOpenEvent(event: string) {
  const key = normalizeBrevoEvent(event)
  return key === 'opened'
    || key === 'unique_opened'
    || key === 'proxy_open'
    || key === 'unique_proxy_open'
}
