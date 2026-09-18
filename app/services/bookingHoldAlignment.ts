import type { CoreBooking, Hold } from '../domain/bookingCore'

function isoTime(value: string | null | undefined) {
  return value?.slice(11, 16) || null
}

export function holdMatchesBookingSchedule(booking: CoreBooking, hold: Hold) {
  if (hold.event_date !== (booking.event_date || '')) return false
  if (!hold.starts_at && !hold.ends_at) return true

  const holdStart = isoTime(hold.starts_at)
  const holdEnd = isoTime(hold.ends_at)
  const bookingStart = booking.start_time?.slice(0, 5) || null
  const bookingEnd = booking.end_time?.slice(0, 5) || null

  if (!bookingStart && !bookingEnd) return true
  return holdStart === bookingStart && holdEnd === bookingEnd
}
