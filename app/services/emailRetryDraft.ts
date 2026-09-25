import type { Activity } from '../domain/bookingCore'
import type { BookingEmailMessage } from './bookingCoreApi'

export type RetryEmailDraft = {
  subject: string
  body: string
  recipientChanged: boolean
}

const FAILED_DELIVERY_STATES = new Set(['soft_bounce', 'hard_bounce', 'blocked', 'spam', 'invalid', 'error'])

export function buildFailedEmailRetryDraft(
  activities: Activity[],
  messages: BookingEmailMessage[],
  currentContactEmail: string | null | undefined
): RetryEmailDraft | null {
  const latestAttempt = [...messages]
    .filter(message => Boolean(message.delivery_status))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0] || null

  if (!latestAttempt?.delivery_status || !FAILED_DELIVERY_STATES.has(latestAttempt.delivery_status)) return null

  const activity = [...activities]
    .filter(item =>
      item.type === 'email'
      && item.direction === 'outbound'
      && item.metadata?.email_message_id === latestAttempt.id
    )
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())[0] || null

  if (!activity?.body?.trim()) return null

  const subject = typeof activity.metadata?.subject === 'string'
    ? activity.metadata.subject.trim()
    : ''

  if (!subject) return null

  const currentEmail = currentContactEmail?.trim().toLowerCase() || ''
  const failedEmail = latestAttempt.to_email.trim().toLowerCase()

  return {
    subject,
    body: activity.body.trim(),
    recipientChanged: Boolean(currentEmail && currentEmail !== failedEmail)
  }
}
