import type { Booking } from '../domain/booking'

const DATABASE = 'cuebooker-demo'
const STORE = 'bookings'
const VERSION = 1

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase()
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE, mode)
    const request = run(transaction.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
  })
}

export const bookingRepository = {
  async list() {
    const bookings = await withStore<Booking[]>('readonly', store => store.getAll())
    return bookings.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },
  get(id: string) {
    return withStore<Booking | undefined>('readonly', store => store.get(id))
  },
  async save(booking: Booking) {
    await withStore<IDBValidKey>('readwrite', store => store.put(booking))
    return booking
  }
}
