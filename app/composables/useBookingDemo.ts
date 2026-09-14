import { createBooking, createId, type Booking, type BookingActor, type BookingAttachment, type BookingStatus, type NewBookingInput } from '../domain/booking'
import { createBookingRepository } from '../repositories/bookingRepository.client'
import type { Ref } from 'vue'

function demoBookings(profileArtistName?: string): Booking[] {
  // Fictional records used only to demonstrate the local prototype.
  const now = new Date()
  const make = (days: number, status: BookingStatus, artistName: string, venue: string, city: string): Booking => {
    const createdAt = new Date(now.getTime() - days * 86400000).toISOString()
    const eventDate = new Date(now)
    eventDate.setUTCDate(eventDate.getUTCDate() + days + 3)
    const resolvedArtistName = profileArtistName || artistName
    return {
      id: createId('booking'), artistId: resolvedArtistName.toLowerCase().replaceAll(' ', '-'), artistName: resolvedArtistName,
      promoter: { name: 'Promotor Ejemplo', email: 'solicitud@cuebooker.test' },
      event: { name: `${venue} Night`, venue, city, date: eventDate.toISOString().slice(0, 10), capacity: '1.200', offer: '2.400 €', schedule: '02:00–04:00' },
      status, archived: status === 'rejected', source: 'booking_link', createdAt, updatedAt: createdAt,
      messages: [{ id: createId('message'), actor: 'promoter', body: `Hola, queremos contar con ${resolvedArtistName} para nuestra fecha en ${venue}. ¿Podemos revisar disponibilidad y condiciones?`, createdAt, attachments: [] }]
    }
  }
  return [
    make(0, 'new', 'Nara Voss', 'Nitsa Club', 'Barcelona'),
    make(2, 'waiting_promoter', 'Nara Voss', 'Mondo Disko', 'Madrid'),
    make(4, 'confirmed', 'Nulla', 'Pulse Festival', 'Girona'),
    make(8, 'rejected', 'Mila Rho', 'Razzmatazz', 'Barcelona')
  ]
}

export function useBookingDemo(namespace: string | Ref<string | undefined> = 'public-demo', profileArtistName?: string | Ref<string | undefined>) {
  const bookings = ref<Booking[]>([])
  const ready = ref(false)

  function currentNamespace() {
    return typeof namespace === 'string' ? namespace : (namespace.value || '')
  }

  function repository() {
    return createBookingRepository(currentNamespace())
  }

  function preferenceKey() {
    return `cuebooker.samples.dismissed.${currentNamespace()}`
  }

  function currentArtistName() {
    if (!profileArtistName) return undefined
    return typeof profileArtistName === 'string' ? profileArtistName : profileArtistName.value
  }

  async function refresh() {
    if (!import.meta.client || !currentNamespace()) return
    ready.value = false
    const scopedRepository = repository()
    let records = await scopedRepository.list()
    const samplesDismissed = localStorage.getItem(preferenceKey()) === 'true'
    if (!records.length && !samplesDismissed) {
      records = demoBookings(currentArtistName())
      await Promise.all(records.map(record => scopedRepository.save(record)))
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
      if (migrated) await Promise.all(records.map(record => scopedRepository.save(record)))
    }
    bookings.value = records
    ready.value = true
  }

  async function submit(input: NewBookingInput) {
    const booking = createBooking(input)
    await repository().save(booking)
    await refresh()
    return booking
  }

  async function update(booking: Booking) {
    booking.updatedAt = new Date().toISOString()
    await repository().save(booking)
    await refresh()
    return booking
  }

  async function setStatus(id: string, status: BookingStatus) {
    const booking = await repository().get(id)
    if (!booking) return
    booking.status = status
    if (status === 'confirmed') booking.archived = false
    if (status === 'rejected') booking.archived = true
    return update(booking)
  }

  async function markOpened(id: string) {
    const booking = await repository().get(id)
    if (!booking || booking.status !== 'new') return
    booking.status = 'in_review'
    return update(booking)
  }

  async function addMessage(id: string, actor: BookingActor, body: string, attachments: BookingAttachment[] = []) {
    const booking = await repository().get(id)
    if (!booking || !body.trim()) return
    booking.messages.push({ id: createId('message'), actor, body: body.trim(), createdAt: new Date().toISOString(), attachments })
    booking.status = actor === 'artist' ? 'waiting_promoter' : 'in_review'
    return update(booking)
  }

  async function setArchived(id: string, archived: boolean) {
    const booking = await repository().get(id)
    if (!booking) return
    booking.archived = archived
    if (!archived && booking.status === 'rejected') booking.status = 'in_review'
    return update(booking)
  }

  async function clearSamples() {
    if (!currentNamespace()) return
    localStorage.setItem(preferenceKey(), 'true')
    await repository().clear()
    bookings.value = []
    ready.value = true
  }

  async function restoreSamples() {
    if (!currentNamespace()) return
    localStorage.removeItem(preferenceKey())
    await refresh()
  }

  onMounted(refresh)
  if (typeof namespace !== 'string') watch(namespace, refresh)

  return { bookings, ready, refresh, submit, setStatus, markOpened, addMessage, setArchived, clearSamples, restoreSamples }
}
