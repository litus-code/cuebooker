import type { CoreBooking } from './bookingCore'

export type AgencyRosterArtist = { id: string; roster_active?: boolean }

export function resolveAgencyArtist(requestedId: string | undefined, roster: AgencyRosterArtist[]) {
  return requestedId && roster.some(item => item.id === requestedId && item.roster_active !== false) ? requestedId : ''
}

export function filterRosterBookings(bookings: CoreBooking[], roster: AgencyRosterArtist[], selectedIds?: string[]) {
  const active = new Set(roster.filter(item => item.roster_active !== false).map(item => item.id))
  const selected = selectedIds ? new Set(selectedIds) : null
  return bookings.filter(booking => active.has(booking.artist_id) && (!selected || selected.has(booking.artist_id)))
}

export function agencyActiveBookingCount(bookings: CoreBooking[]) {
  return bookings.filter(item => !item.archived_at && ['new', 'in_conversation', 'waiting_response'].includes(item.status)).length
}
