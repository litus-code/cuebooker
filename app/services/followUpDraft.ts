import type { Activity, Contact, CoreBooking } from '../domain/bookingCore'

export type FollowUpDraft = {
  subject: string
  body: string
}

const STALE_WAITING_MS = 72 * 60 * 60 * 1000

function latestDirectionalActivity(activities: Activity[]) {
  return activities
    .filter(activity => activity.direction === 'inbound' || activity.direction === 'outbound')
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0] || null
}

export function shouldSuggestFollowUp(
  booking: CoreBooking,
  activities: Activity[],
  now = new Date(),
  staleWaitingMs = STALE_WAITING_MS
) {
  if (booking.archived_at || booking.status !== 'waiting_response') return false
  const latest = latestDirectionalActivity(activities)
  if (!latest || latest.direction !== 'outbound') return false
  const latestAt = new Date(latest.occurred_at).getTime()
  return Number.isFinite(latestAt) && now.getTime() - latestAt >= staleWaitingMs
}

function formatDate(value: string | null, locale: 'es' | 'en') {
  if (!value) return ''
  const parsed = new Date(`${value}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-GB', {
    day: 'numeric',
    month: 'long'
  }).format(parsed)
}

export function buildFollowUpDraft(
  booking: CoreBooking,
  contact: Contact | null,
  activities: Activity[],
  locale: 'es' | 'en'
): FollowUpDraft {
  const latestOutbound = [...activities]
    .filter(activity => activity.direction === 'outbound')
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0] || null

  const previousSubject = typeof latestOutbound?.metadata?.subject === 'string'
    ? latestOutbound.metadata.subject.trim()
    : ''

  const context = booking.event_name?.trim()
    || booking.venue_name?.trim()
    || (locale === 'es' ? 'el booking' : 'the booking')

  const eventDate = formatDate(booking.event_date, locale)
  const name = contact?.name?.trim() || ''

  if (locale === 'es') {
    const subject = previousSubject
      ? (/^re:/i.test(previousSubject) ? previousSubject : `Re: ${previousSubject}`)
      : `Seguimiento · ${context}`

    const greeting = name ? `Hola ${name},` : 'Hola,'
    const dateContext = eventDate ? ` del ${eventDate}` : ''
    return {
      subject,
      body: `${greeting}

Te escribo para hacer seguimiento sobre ${context}${dateContext}. Cuando puedas, dime cómo lo tenéis y vemos el siguiente paso.

Gracias.`
    }
  }

  const subject = previousSubject
    ? (/^re:/i.test(previousSubject) ? previousSubject : `Re: ${previousSubject}`)
    : `Follow-up · ${context}`

  const greeting = name ? `Hi ${name},` : 'Hi,'
  const dateContext = eventDate ? ` on ${eventDate}` : ''
  return {
    subject,
    body: `${greeting}

Just following up on ${context}${dateContext}. When you have a moment, let me know where things stand and we can take the next step from there.

Thanks.`
  }
}
