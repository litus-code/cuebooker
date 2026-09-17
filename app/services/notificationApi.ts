import type { CueNotification } from '../domain/notification'

type NotificationApiOptions = {
  baseUrl: string
  publishableKey: string
  accessToken: () => string | null | undefined
}

export function createNotificationApi(options: NotificationApiOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '')

  function authHeaders(prefer?: string) {
    const token = options.accessToken()
    if (!token) throw new Error('authentication_required')

    return {
      apikey: options.publishableKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    }
  }

  async function list(limit = 30) {
    return $fetch<CueNotification[]>(`${baseUrl}/rest/v1/notifications`, {
      headers: authHeaders(),
      query: {
        select: 'id,workspace_id,recipient_user_id,booking_id,activity_id,kind,dedupe_key,metadata,read_at,created_at',
        order: 'created_at.desc',
        limit: String(Math.min(Math.max(limit, 1), 100))
      }
    })
  }

  async function unreadCount() {
    const response = await $fetch.raw<CueNotification[]>(`${baseUrl}/rest/v1/notifications`, {
      method: 'GET',
      headers: authHeaders('count=exact'),
      query: {
        read_at: 'is.null',
        select: 'id',
        limit: '1'
      }
    })

    const range = response.headers.get('content-range') || ''
    const total = Number(range.split('/')[1])
    return Number.isFinite(total) ? total : 0
  }

  async function markRead(notificationId: string) {
    const id = notificationId.trim()
    if (!id) throw new Error('notification_id_required')

    const rows = await $fetch<CueNotification[]>(`${baseUrl}/rest/v1/notifications`, {
      method: 'PATCH',
      headers: authHeaders('return=representation'),
      query: {
        id: `eq.${id}`,
        select: 'id,workspace_id,recipient_user_id,booking_id,activity_id,kind,dedupe_key,metadata,read_at,created_at'
      },
      body: {
        read_at: new Date().toISOString()
      }
    })

    const row = rows[0]
    if (!row) throw new Error('notification_not_found')
    return row
  }

  async function markAllRead() {
    await $fetch(`${baseUrl}/rest/v1/notifications`, {
      method: 'PATCH',
      headers: authHeaders('return=minimal'),
      query: {
        read_at: 'is.null'
      },
      body: {
        read_at: new Date().toISOString()
      }
    })
  }

  return {
    list,
    unreadCount,
    markRead,
    markAllRead
  }
}
