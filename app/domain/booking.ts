export type BookingStatus = 'new' | 'your_reply' | 'waiting_promoter' | 'confirmed' | 'closed'
export type BookingActor = 'promoter' | 'artist'

export interface BookingAttachment {
  id: string
  name: string
  type: string
  size: number
}

export interface BookingMessage {
  id: string
  actor: BookingActor
  body: string
  createdAt: string
  attachments: BookingAttachment[]
}

export interface BookingContact {
  name: string
  email: string
  phone?: string
}

export interface BookingEvent {
  name: string
  venue: string
  city: string
  date: string
  capacity: string
  offer: string
  schedule?: string
}

export interface Booking {
  id: string
  artistId: string
  artistName: string
  promoter: BookingContact
  event: BookingEvent
  status: BookingStatus
  archived: boolean
  source: 'booking_link' | 'manual'
  createdAt: string
  updatedAt: string
  messages: BookingMessage[]
}

export interface NewBookingInput {
  artistId: string
  artistName: string
  promoter: BookingContact
  event: BookingEvent
  message: string
  attachments: BookingAttachment[]
}

export const bookingStatuses: BookingStatus[] = [
  'new',
  'your_reply',
  'waiting_promoter',
  'confirmed',
  'closed'
]

export const statusTone: Record<BookingStatus, string> = {
  new: 'lime',
  your_reply: 'violet',
  waiting_promoter: 'orange',
  confirmed: 'mint',
  closed: 'muted'
}

export function createId(prefix: string) {
  const value = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}-${value}`
}

export function createBooking(input: NewBookingInput): Booking {
  const now = new Date().toISOString()
  return {
    id: createId('booking'),
    artistId: input.artistId,
    artistName: input.artistName,
    promoter: input.promoter,
    event: input.event,
    status: 'new',
    archived: false,
    source: 'booking_link',
    createdAt: now,
    updatedAt: now,
    messages: [{
      id: createId('message'),
      actor: 'promoter',
      body: input.message,
      createdAt: now,
      attachments: input.attachments
    }]
  }
}
