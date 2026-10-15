import type {EmailAttachment} from '../domain/emailAttachments'
type BookingEmailApiOptions = {
  baseUrl: string
  publishableKey: string
  accessToken: () => string | null | undefined
}

export type SendBookingEmailInput = {
  workspaceId: string
  bookingId: string
  contactId?: string | null
  subject: string
  bodyText: string
  requestId?: string
  attachments?: EmailAttachment[]
}

export type SentBookingEmail = {
  id: string
  status: 'sent'
  to: string
  providerMessageId: string | null
  attachmentStatus?: {stored:number;pending:number}
}

export function createBookingEmailApi(options: BookingEmailApiOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '')

  async function sendBookingEmail(input: SendBookingEmailInput) {
    const token = options.accessToken()
    if (!token) throw new Error('authentication_required')

    let response:Response
    try{response = await fetch(`${baseUrl}/functions/v1/send-booking-email`, {
      method: 'POST',
      headers: {
        apikey: options.publishableKey,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workspaceId: input.workspaceId,
        bookingId: input.bookingId,
        contactId: input.contactId || undefined,
        subject: input.subject.trim(),
        bodyText: input.bodyText.trim(),
        requestId: input.requestId,
        attachments: input.attachments
      })
    })}catch{throw new Error('email_send_uncertain')}

    const payload = await response.json().catch(() => null) as SentBookingEmail & { error?: string }
    if(!payload)throw new Error('email_send_uncertain')
    if (!response.ok) throw new Error(payload.error || 'email_send_uncertain')
    if(payload.status!=='sent')throw new Error('email_send_uncertain')
    return payload as SentBookingEmail
  }

  return { sendBookingEmail }
}
