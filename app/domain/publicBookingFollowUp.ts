export type PublicBookingFollowUpStatus =
  | 'new'
  | 'in_conversation'
  | 'waiting_response'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'

export type PublicBookingFollowUpMessage = {
  id: string
  direction: 'inbound' | 'outbound' | 'internal'
  channel: 'booking_form' | 'email' | 'secure_link' | 'message' | string
  body: string
  occurredAt: string
}

export type PublicBookingFollowUp = {
  artist: {
    stageName: string
    slug: string
  }
  contact: {
    name: string
  }
  booking: {
    status: PublicBookingFollowUpStatus
    eventName?: string | null
    venueName?: string | null
    city?: string | null
    countryCode?: string | null
    eventDate?: string | null
    offerAmountMinor?: number | null
    currency?: string | null
    archived?: boolean
  }
  messages: PublicBookingFollowUpMessage[]
}

export type PublicBookingFollowUpReplyResult = {
  accepted: true
  created: boolean
  followUp: PublicBookingFollowUp
}
