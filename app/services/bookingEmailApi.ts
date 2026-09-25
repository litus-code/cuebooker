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
}

export type SentBookingEmail = {
  id: string
  status: 'sent'
  to: string
  providerMessageId: string | null
}

export function createBookingEmailApi(options: BookingEmailApiOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '')

  async function sendBookingEmail(input: SendBookingEmailInput) {
    const token = options.accessToken()
    if (!token) throw new Error('authentication_required')

    const response = await fetch(`${baseUrl}/functions/v1/send-booking-email`, {
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
        bodyText: input.bodyText.trim()
      })
    })

    const payload = await response.json().catch(() => ({})) as SentBookingEmail & { error?: string }
    if (!response.ok) throw new Error(payload.error || 'email_send_failed')
    return payload as SentBookingEmail
  }

  return { sendBookingEmail }
}
