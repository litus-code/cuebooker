export type NotificationKind =
  | 'booking_request_received'
  | 'promoter_reply_received'

export type CueNotification = {
  id: string
  workspace_id: string
  recipient_user_id: string
  booking_id: string
  activity_id: string | null
  kind: NotificationKind
  dedupe_key: string
  metadata: Record<string, unknown>
  read_at: string | null
  created_at: string
}
