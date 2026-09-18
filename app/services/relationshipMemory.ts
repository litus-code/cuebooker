import type { CoreBooking } from '../domain/bookingCore'

export type RelationshipMemory = {
  previousBookings: CoreBooking[]
  relationshipBookings: CoreBooking[]
  confirmedCount: number
  lastPreviousBooking: CoreBooking | null
  lastConfirmedFeeBooking: CoreBooking | null
  cities: string[]
}

function relationshipTimestamp(booking: CoreBooking) {
  if (booking.event_date) return new Date(`${booking.event_date}T12:00:00Z`).getTime()
  return new Date(booking.updated_at).getTime()
}

export function sameBookingRelationship(current: CoreBooking, item: CoreBooking) {
  if (current.counterparty_id) return item.counterparty_id === current.counterparty_id
  if (current.primary_contact_id) return item.primary_contact_id === current.primary_contact_id
  return false
}

function isHistoricallyBeforeCurrent(current: CoreBooking, item: CoreBooking) {
  if (!current.event_date || !item.event_date) return true
  return item.event_date < current.event_date
}

export function deriveRelationshipMemory(current: CoreBooking, bookings: CoreBooking[]): RelationshipMemory {
  const previousBookings = bookings
    .filter(item => item.id !== current.id)
    .filter(item => sameBookingRelationship(current, item))
    .sort((a, b) => relationshipTimestamp(b) - relationshipTimestamp(a))

  const relationshipBookings = [current, ...previousBookings]
  const historicalPrevious = previousBookings.filter(item => isHistoricallyBeforeCurrent(current, item))
  const lastPreviousBooking = historicalPrevious[0] || null
  const lastConfirmedFeeBooking = historicalPrevious.find(item =>
    item.status === 'confirmed'
    && item.offer_amount_minor != null
    && Boolean(item.currency)
  ) || null

  const cities = Array.from(
    new Set(
      relationshipBookings
        .map(item => item.city?.trim())
        .filter(Boolean)
    )
  ).slice(0, 4) as string[]

  return {
    previousBookings,
    relationshipBookings,
    confirmedCount: relationshipBookings.filter(item => item.status === 'confirmed').length,
    lastPreviousBooking,
    lastConfirmedFeeBooking,
    cities
  }
}
