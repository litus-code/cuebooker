import type { Booking } from '../domain/booking'

const DATABASE_PREFIX = 'cuebooker-bookings'
const STORE = 'bookings'
const VERSION = 1

function databaseName(namespace: string) {
  return `${DATABASE_PREFIX}-${namespace.replace(/[^a-z0-9-]/gi, '-').slice(0, 80)}`
}

function openDatabase(namespace: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName(namespace), VERSION)
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

async function withStore<T>(namespace: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase(namespace)
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE, mode)
    const request = run(transaction.objectStore(STORE))
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
  })
}

export function createBookingRepository(namespace = 'public-demo') {
  return {
    async list() {
      const bookings = await withStore<Booking[]>(namespace, 'readonly', store => store.getAll())
      return bookings.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    },
    get(id: string) {
      return withStore<Booking | undefined>(namespace, 'readonly', store => store.get(id))
    },
    async save(booking: Booking) {
      await withStore<IDBValidKey>(namespace, 'readwrite', store => store.put(booking))
      return booking
    },
    clear() {
      return withStore<undefined>(namespace, 'readwrite', store => store.clear())
    }
  }
}

export const bookingRepository = createBookingRepository()
