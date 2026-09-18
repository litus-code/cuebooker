import type { Activity, CoreBooking } from '../domain/bookingCore'

export type BookingAttentionSignalKind = 'new_booking' | 'reply_received' | 'stale_waiting' | 'delivery_failed'

export interface BookingAttentionSignal {
  id: string
  bookingId: string
  kind: BookingAttentionSignalKind
  occurredAt: string
}

const DEFAULT_STALE_WAITING_MS = 72 * 60 * 60 * 1000

export function deriveBookingAttentionSignals(
  bookings: CoreBooking[],
  activities: Activity[],
  now = new Date(),
  staleWaitingMs = DEFAULT_STALE_WAITING_MS
): BookingAttentionSignal[] {
  const latestDirectional = new Map<string, Activity>()

  for (const activity of activities) {
    if (activity.direction !== 'inbound' && activity.direction !== 'outbound') continue
    const current = latestDirectional.get(activity.booking_id)
    if (!current || new Date(activity.occurred_at).getTime() > new Date(current.occurred_at).getTime()) {
      latestDirectional.set(activity.booking_id, activity)
    }
  }

  const signals: BookingAttentionSignal[] = []

  for (const booking of bookings) {
    if (booking.archived_at) continue
    if (booking.status === 'confirmed' || booking.status === 'rejected' || booking.status === 'cancelled') continue

    if (booking.status === 'new') {
      signals.push({
        id: `new-${booking.id}`,
        bookingId: booking.id,
        kind: 'new_booking',
        occurredAt: booking.created_at
      })
      continue
    }

    const latest = latestDirectional.get(booking.id)

    if (booking.status === 'in_conversation') {
      signals.push({
        id: `reply-${booking.id}`,
        bookingId: booking.id,
        kind: 'reply_received',
        occurredAt: latest?.direction === 'inbound' ? latest.occurred_at : booking.updated_at
      })
      continue
    }

    if (booking.status === 'waiting_response') {
      const occurredAt = latest?.direction === 'outbound' ? latest.occurred_at : booking.updated_at
      const occurredTime = new Date(occurredAt).getTime()
      if (Number.isFinite(occurredTime) && now.getTime() - occurredTime >= staleWaitingMs) {
        signals.push({
          id: `waiting-${booking.id}`,
          bookingId: booking.id,
          kind: 'stale_waiting',
          occurredAt
        })
      }
    }
  }

  const priority: Record<BookingAttentionSignalKind, number> = {
    reply_received: 0,
    new_booking: 1,
    stale_waiting: 2
  }

  return signals.sort((a, b) => {
    const byPriority = priority[a.kind] - priority[b.kind]
    if (byPriority !== 0) return byPriority
    return new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  })
}


export type BookingEmailDeliveryAttention = {
  id: string
  booking_id: string
  delivery_status: string | null
  bounced_at: string | null
  last_delivery_event_at: string | null
}

const FAILED_DELIVERY_STATES = new Set(['soft_bounce', 'hard_bounce', 'blocked', 'spam', 'invalid', 'error'])

export function deriveEmailDeliveryAttentionSignals(
  bookings: CoreBooking[],
  messages: BookingEmailDeliveryAttention[]
): BookingAttentionSignal[] {
  const activeBookingIds = new Set(
    bookings
      .filter(booking =>
        !booking.archived_at
        && booking.status !== 'rejected'
        && booking.status !== 'cancelled'
      )
      .map(booking => booking.id)
  )

  const latestFailureByBooking = new Map<string, BookingEmailDeliveryAttention>()

  for (const message of messages) {
    if (!activeBookingIds.has(message.booking_id)) continue
    if (!message.delivery_status || !FAILED_DELIVERY_STATES.has(message.delivery_status)) continue

    const current = latestFailureByBooking.get(message.booking_id)
    const messageTime = new Date(message.bounced_at || message.last_delivery_event_at || 0).getTime()
    const currentTime = current
      ? new Date(current.bounced_at || current.last_delivery_event_at || 0).getTime()
      : Number.NEGATIVE_INFINITY

    if (!current || messageTime > currentTime) latestFailureByBooking.set(message.booking_id, message)
  }

  return [...latestFailureByBooking.values()]
    .map(message => ({
      id: `delivery-${message.id}`,
      bookingId: message.booking_id,
      kind: 'delivery_failed' as const,
      occurredAt: message.bounced_at || message.last_delivery_event_at || new Date(0).toISOString()
    }))
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
}
