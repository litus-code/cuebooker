import type { CoreBooking, Hold } from '../domain/bookingCore'

function instantTimeInZone(value: string | null | undefined, timezone: string | null | undefined) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value.slice(11, 16) || null
  if (!timezone) return value.slice(11, 16) || null

  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).formatToParts(parsed)
    const hour = parts.find(part => part.type === 'hour')?.value
    const minute = parts.find(part => part.type === 'minute')?.value
    return hour && minute ? `${hour}:${minute}` : null
  } catch {
    return value.slice(11, 16) || null
  }
}

export function holdMatchesBookingSchedule(booking: CoreBooking, hold: Hold) {
  if (hold.event_date !== (booking.event_date || '')) return false
  if (!hold.starts_at && !hold.ends_at) return true

  const timezone = hold.event_timezone || booking.event_timezone
  const holdStart = instantTimeInZone(hold.starts_at, timezone)
  const holdEnd = instantTimeInZone(hold.ends_at, timezone)
  const bookingStart = booking.start_time?.slice(0, 5) || null
  const bookingEnd = booking.end_time?.slice(0, 5) || null

  if (!bookingStart && !bookingEnd) return true
  return holdStart === bookingStart && holdEnd === bookingEnd
}
