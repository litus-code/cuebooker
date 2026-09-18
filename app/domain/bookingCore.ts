export type WorkspaceKind = 'solo' | 'agency'
export type WorkspaceRole = 'owner' | 'admin' | 'manager' | 'editor' | 'viewer'

export type CounterpartyKind = 'venue' | 'promoter' | 'agency' | 'festival' | 'brand' | 'other'
export type BookingSource = 'booking_form' | 'phone' | 'whatsapp' | 'email' | 'instagram' | 'in_person' | 'manager' | 'manual' | 'other'
export type BookingOriginChannel = 'phone' | 'whatsapp' | 'email' | 'instagram' | 'in_person' | 'booking_form' | 'other'
export type BookingCaptureMethod = 'manual' | 'public_form' | 'email_import' | 'share_extension' | 'api' | 'ai_capture' | 'system'
export type CoreBookingStatus = 'new' | 'in_conversation' | 'waiting_response' | 'confirmed' | 'rejected' | 'cancelled'
export type HoldStatus = 'active' | 'released' | 'converted'
export type ActivityType =
  | 'phone'
  | 'email'
  | 'whatsapp'
  | 'instagram'
  | 'note'
  | 'status_change'
  | 'hold_created'
  | 'hold_released'
  | 'hold_converted'
  | 'next_move_created'
  | 'next_move_completed'
  | 'system'
export type ActivityDirection = 'inbound' | 'outbound' | 'internal'
export type ActivityVisibility = 'workspace' | 'private'

export interface Workspace {
  id: string
  kind: WorkspaceKind
  name: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface WorkspaceMembership {
  workspace_id: string
  user_id: string
  role: WorkspaceRole
  created_at: string
}

export interface Contact {
  id: string
  workspace_id: string
  name: string
  email: string | null
  phone: string | null
  role_label: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Counterparty {
  id: string
  workspace_id: string
  kind: CounterpartyKind
  name: string
  city: string | null
  country_code: string | null
  website_url: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface CoreBooking {
  id: string
  workspace_id: string
  artist_id: string
  primary_contact_id: string | null
  counterparty_id: string | null
  /** Legacy compatibility field. Prefer origin_channel + capture_method in new logic. */
  source: BookingSource
  origin_channel: BookingOriginChannel
  capture_method: BookingCaptureMethod
  status: CoreBookingStatus
  event_name: string | null
  venue_name: string | null
  city: string | null
  country_code: string | null
  event_date: string | null
  start_time: string | null
  end_time: string | null
  event_timezone: string | null
  offer_amount_minor: number | null
  currency: string | null
  fee_basis: string | null
  archived_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  workspace_id: string
  booking_id: string
  type: ActivityType
  direction: ActivityDirection | null
  contact_id: string | null
  actor_user_id: string | null
  body: string | null
  metadata: Record<string, unknown>
  visibility: ActivityVisibility
  occurred_at: string
  created_by: string
  created_at: string
}

export interface NextMove {
  id: string
  workspace_id: string
  booking_id: string
  label: string
  due_at: string | null
  assignee_user_id: string | null
  completed_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface Hold {
  id: string
  workspace_id: string
  booking_id: string
  event_date: string
  starts_at: string | null
  ends_at: string | null
  event_timezone: string | null
  expires_at: string | null
  priority: number | null
  status: HoldStatus
  released_at: string | null
  converted_at: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface CreateContactInput {
  workspaceId: string
  name: string
  email?: string | null
  phone?: string | null
  roleLabel?: string | null
  notes?: string | null
}

export interface CreateCounterpartyInput {
  workspaceId: string
  kind: CounterpartyKind
  name: string
  city?: string | null
  countryCode?: string | null
  websiteUrl?: string | null
}

export interface CreateBookingInput {
  workspaceId: string
  artistId: string
  primaryContactId?: string | null
  counterpartyId?: string | null
  source: BookingSource
  originChannel?: BookingOriginChannel | null
  captureMethod?: BookingCaptureMethod | null
  status?: CoreBookingStatus
  eventName?: string | null
  venueName?: string | null
  city?: string | null
  countryCode?: string | null
  eventDate?: string | null
  startTime?: string | null
  endTime?: string | null
  eventTimezone?: string | null
  offerAmountMinor?: number | null
  currency?: string | null
  feeBasis?: string | null
}

export interface CreateManualBookingInput {
  workspaceId: string
  artistId: string
  source: BookingSource
  existingContactId?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  existingCounterpartyId?: string | null
  counterpartyKind?: CounterpartyKind
  counterpartyName?: string | null
  eventName?: string | null
  venueName?: string | null
  city?: string | null
  countryCode?: string | null
  eventDate?: string | null
  startTime?: string | null
  endTime?: string | null
  eventTimezone?: string | null
  offerAmountMinor?: number | null
  currency?: string | null
  feeBasis?: string | null
  initialNote?: string | null
  nextMoveLabel?: string | null
  nextMoveDueAt?: string | null
}

export interface UpdateBookingDetailsInput {
  workspaceId: string
  bookingId: string
  eventName?: string | null
  venueName?: string | null
  city?: string | null
  countryCode?: string | null
  eventDate?: string | null
  startTime?: string | null
  endTime?: string | null
  eventTimezone?: string | null
  offerAmountMinor?: number | null
  currency?: string | null
  feeBasis?: string | null
}

export interface CreateActivityInput {
  workspaceId: string
  bookingId: string
  type: ActivityType
  direction?: ActivityDirection | null
  contactId?: string | null
  body?: string | null
  metadata?: Record<string, unknown>
  visibility?: ActivityVisibility
  occurredAt?: string
}

export interface SetNextMoveInput {
  workspaceId: string
  bookingId: string
  label: string
  dueAt?: string | null
  assigneeUserId?: string | null
}

export interface CreateHoldInput {
  workspaceId: string
  bookingId: string
  eventDate: string
  startsAt?: string | null
  endsAt?: string | null
  eventTimezone?: string | null
  expiresAt?: string | null
  priority?: number | null
}
