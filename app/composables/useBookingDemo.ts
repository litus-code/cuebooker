import { createBooking, createId, type Booking, type BookingActor, type BookingAttachment, type BookingStatus, type NewBookingInput } from '../domain/booking'
import { bookingRepository } from '../repositories/bookingRepository.client'

function demoBookings(): Booking[] {
  // Fictional records used only to demonstrate the local prototype.
  const now = new Date()
  const make = (days: number, status: BookingStatus, artistName: string, venue: string, city: string): Booking => {
    const createdAt = new Date(now.getTime() - days * 86400000).toISOString()
    return {
      id: createId('booking'), artistId: artistName.toLowerCase().replaceAll(' ', '-'), artistName,
      promoter: { name: 'Promotor Demo', email: 'booking@cuebooker.test' },
      event: { name: `${venue} Night`, venue, city, date: `2026-10-${String(18 + days).padStart(2, '0')}`, capacity: '1.200', offer: '2.400 €', schedule: '02:00–04:00' },
      status, archived: status === 'rejected', source: 'booking_link', createdAt, updatedAt: createdAt,
      messages: [{ id: createId('message'), actor: 'promoter', body: `Hola, queremos contar con ${artistName} para nuestra fecha en ${venue}. ¿Podemos revisar disponibilidad y condiciones?`, createdAt, attachments: [] }]
    }
  }
  return [
    make(0, 'new', 'Nara Voss', 'Nitsa Club', 'Barcelona'),
    make(2, 'waiting_promoter', 'Nara Voss', 'Mondo Disko', 'Madrid'),
    make(4, 'confirmed', 'Nulla', 'Pulse Festival', 'Girona'),
    make(8, 'rejected', 'Mila Rho', 'Razzmatazz', 'Barcelona')
  ]
}

export function useBookingDemo() {
  const bookings = useState<Booking[]>('cue-bookings', () => [])
  const ready = useState('cue-bookings-ready', () => false)

  async function refresh() {
    if (!import.meta.client) return
    let records = await bookingRepository.list()
    if (!records.length) {
      records = demoBookings()
      await Promise.all(records.map(bookingRepository.save))
    } else {
      let migrated = false
      records = records.map((record) => {
        const legacyStatus = record.status as string
        if (legacyStatus === 'your_reply') {
          migrated = true
          return { ...record, status: 'in_review' as const }
        }
        if (legacyStatus === 'closed') {
          migrated = true
          return { ...record, status: 'rejected' as const, archived: true }
        }
        return record
      })
      if (migrated) await Promise.all(records.map(bookingRepository.save))
    }
    bookings.value = records
    ready.value = true
  }

  async function submit(input: NewBookingInput) {
    const booking = createBooking(input)
    await bookingRepository.save(booking)
    await refresh()
    return booking
  }

  async function update(booking: Booking) {
    booking.updatedAt = new Date().toISOString()
    await bookingRepository.save(booking)
    await refresh()
    return booking
  }

  async function setStatus(id: string, status: BookingStatus) {
    const booking = await bookingRepository.get(id)
    if (!booking) return
    booking.status = status
    if (status === 'confirmed') booking.archived = false
    if (status === 'rejected') booking.archived = true
    return update(booking)
  }

  async function markOpened(id: string) {
    const booking = await bookingRepository.get(id)
    if (!booking || booking.status !== 'new') return
    booking.status = 'in_review'
    return update(booking)
  }

  async function addMessage(id: string, actor: BookingActor, body: string, attachments: BookingAttachment[] = []) {
    const booking = await bookingRepository.get(id)
    if (!booking || !body.trim()) return
    booking.messages.push({ id: createId('message'), actor, body: body.trim(), createdAt: new Date().toISOString(), attachments })
    booking.status = actor === 'artist' ? 'waiting_promoter' : 'in_review'
    return update(booking)
  }

  async function setArchived(id: string, archived: boolean) {
    const booking = await bookingRepository.get(id)
    if (!booking) return
    booking.archived = archived
    if (!archived && booking.status === 'rejected') booking.status = 'in_review'
    return update(booking)
  }

  onMounted(refresh)

  return { bookings, ready, refresh, submit, setStatus, markOpened, addMessage, setArchived }
}
