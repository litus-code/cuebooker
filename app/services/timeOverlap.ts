export type MinuteInterval = { start: number; end: number }

export function timeToMinutes(value: string | null | undefined) {
  if (!value) return null
  const match = value.match(/(?:^|T)(\d{2}):(\d{2})/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

export function intervalsOverlap(
  aStart: number | null,
  aEnd: number | null,
  bStart: number | null,
  bEnd: number | null
) {
  // A booking/hold without a precise time is deliberately treated as a whole-day
  // commitment. Missing precision must not hide a possible double booking.
  if (aStart == null || aEnd == null || bStart == null || bEnd == null) return true
  if (aEnd <= aStart || bEnd <= bStart) return false
  return aStart < bEnd && bStart < aEnd
}

export function intervalForDate(
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
  targetDate: string
): MinuteInterval | null {
  if (!startsAt || !endsAt || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) return null

  const startDate = startsAt.slice(0, 10)
  const endDate = endsAt.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) return null
  if (startDate > targetDate || endDate < targetDate) return null

  const start = startDate < targetDate ? 0 : timeToMinutes(startsAt)
  const end = endDate > targetDate ? 24 * 60 : timeToMinutes(endsAt)
  if (start == null || end == null || end <= start) return null

  return { start, end }
}
