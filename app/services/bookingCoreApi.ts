import type {
  Activity,
  Contact,
  CoreBooking,
  CoreBookingStatus,
  Counterparty,
  CreateActivityInput,
  CreateBookingInput,
  CreateContactInput,
  CreateCounterpartyInput,
  CreateHoldInput,
  CreateManualBookingInput,
  Hold,
  NextMove,
  SetNextMoveInput,
  UpdateBookingDetailsInput,
  Workspace,
  WorkspaceMembership
} from '../domain/bookingCore'

type BookingCoreApiOptions = {
  baseUrl: string
  publishableKey: string
  accessToken: () => string | null | undefined
  userId: () => string | null | undefined
}

export type WorkspaceArtist = {
  workspace_id: string
  artist_id: string
  created_by: string
  created_at: string
}

export type EnsureBookingWorkspaceInput =
  | { organizationId: string; artistId?: never }
  | { organizationId?: never; artistId: string }

function normalizedText(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function countryCode(value: string | null | undefined) {
  const normalized = normalizedText(value)?.toUpperCase() || null
  if (normalized && !/^[A-Z]{2}$/.test(normalized)) throw new Error('invalid_country_code')
  return normalized
}

function currency(value: string | null | undefined) {
  const normalized = normalizedText(value)?.toUpperCase() || null
  if (normalized && !/^[A-Z]{3}$/.test(normalized)) throw new Error('invalid_currency')
  return normalized
}

export function createBookingCoreApi(options: BookingCoreApiOptions) {
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

  function currentUserId() {
    const userId = options.userId()
    if (!userId) throw new Error('authentication_required')
    return userId
  }

  async function ensureBookingWorkspace(input: EnsureBookingWorkspaceInput) {
    const organizationId = 'organizationId' in input ? input.organizationId : null
    const artistId = 'artistId' in input ? input.artistId : null
    if ((!organizationId && !artistId) || (organizationId && artistId)) {
      throw new Error('exactly_one_legacy_identity_required')
    }

    return $fetch<string>(`${baseUrl}/rest/v1/rpc/ensure_booking_workspace`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        target_organization_id: organizationId,
        target_artist_id: artistId
      }
    })
  }

  async function listWorkspaceMemberships() {
    const userId = currentUserId()
    return $fetch<WorkspaceMembership[]>(`${baseUrl}/rest/v1/workspace_members`, {
      headers: authHeaders(),
      query: {
        user_id: `eq.${userId}`,
        select: 'workspace_id,user_id,role,created_at',
        order: 'created_at.asc'
      }
    })
  }

  async function listWorkspaces() {
    const memberships = await listWorkspaceMemberships()
    if (!memberships.length) return [] as Array<Workspace & { role: WorkspaceMembership['role'] }>

    const ids = memberships.map(item => item.workspace_id)
    const rows = await $fetch<Workspace[]>(`${baseUrl}/rest/v1/workspaces`, {
      headers: authHeaders(),
      query: {
        id: `in.(${ids.join(',')})`,
        select: 'id,kind,name,created_by,created_at,updated_at',
        order: 'created_at.asc'
      }
    })

    return rows.map(workspace => ({
      ...workspace,
      role: memberships.find(item => item.workspace_id === workspace.id)?.role || 'viewer'
    }))
  }

  async function listWorkspaceArtists(workspaceId: string) {
    return $fetch<WorkspaceArtist[]>(`${baseUrl}/rest/v1/workspace_artists`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        select: 'workspace_id,artist_id,created_by,created_at',
        order: 'created_at.asc'
      }
    })
  }

  async function listContacts(workspaceId: string) {
    return $fetch<Contact[]>(`${baseUrl}/rest/v1/contacts`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        select: 'id,workspace_id,name,email,phone,role_label,notes,created_by,created_at,updated_at',
        order: 'name.asc'
      }
    })
  }

  async function createContact(input: CreateContactInput) {
    const rows = await $fetch<Contact[]>(`${baseUrl}/rest/v1/contacts`, {
      method: 'POST',
      headers: authHeaders('return=representation'),
      body: {
        workspace_id: input.workspaceId,
        name: input.name.trim(),
        email: normalizedText(input.email),
        phone: normalizedText(input.phone),
        role_label: normalizedText(input.roleLabel),
        notes: normalizedText(input.notes),
        created_by: currentUserId()
      }
    })
    const row = rows[0]
    if (!row) throw new Error('contact_create_failed')
    return row
  }

  async function listCounterparties(workspaceId: string) {
    return $fetch<Counterparty[]>(`${baseUrl}/rest/v1/counterparties`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        select: 'id,workspace_id,kind,name,city,country_code,website_url,created_by,created_at,updated_at',
        order: 'name.asc'
      }
    })
  }

  async function createCounterparty(input: CreateCounterpartyInput) {
    const rows = await $fetch<Counterparty[]>(`${baseUrl}/rest/v1/counterparties`, {
      method: 'POST',
      headers: authHeaders('return=representation'),
      body: {
        workspace_id: input.workspaceId,
        kind: input.kind,
        name: input.name.trim(),
        city: normalizedText(input.city),
        country_code: countryCode(input.countryCode),
        website_url: normalizedText(input.websiteUrl),
        created_by: currentUserId()
      }
    })
    const row = rows[0]
    if (!row) throw new Error('counterparty_create_failed')
    return row
  }

  async function listBookings(workspaceId: string, limit = 50, artistId?: string) {
    return $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/bookings`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        ...(artistId ? { artist_id: `eq.${artistId}` } : {}),
        select: 'id,workspace_id,artist_id,primary_contact_id,counterparty_id,source,status,event_name,venue_name,city,country_code,event_date,start_time,end_time,event_timezone,offer_amount_minor,currency,fee_basis,archived_at,created_by,created_at,updated_at',
        order: 'updated_at.desc',
        limit: String(Math.min(Math.max(limit, 1), 100))
      }
    })
  }

  async function createBooking(input: CreateBookingInput) {
    if (input.offerAmountMinor != null && (!Number.isSafeInteger(input.offerAmountMinor) || input.offerAmountMinor < 0)) {
      throw new Error('invalid_offer_amount_minor')
    }

    const rows = await $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/bookings`, {
      method: 'POST',
      headers: authHeaders('return=representation'),
      body: {
        workspace_id: input.workspaceId,
        artist_id: input.artistId,
        primary_contact_id: input.primaryContactId || null,
        counterparty_id: input.counterpartyId || null,
        source: input.source,
        status: input.status || 'new',
        event_name: normalizedText(input.eventName),
        venue_name: normalizedText(input.venueName),
        city: normalizedText(input.city),
        country_code: countryCode(input.countryCode),
        event_date: input.eventDate || null,
        start_time: input.startTime || null,
        end_time: input.endTime || null,
        event_timezone: normalizedText(input.eventTimezone),
        offer_amount_minor: input.offerAmountMinor ?? null,
        currency: currency(input.currency),
        fee_basis: normalizedText(input.feeBasis),
        created_by: currentUserId()
      }
    })
    const row = rows[0]
    if (!row) throw new Error('booking_create_failed')
    return row
  }

  async function createManualBooking(input: CreateManualBookingInput) {
    if (input.offerAmountMinor != null && (!Number.isSafeInteger(input.offerAmountMinor) || input.offerAmountMinor < 0)) {
      throw new Error('invalid_offer_amount_minor')
    }

    const rows = await $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/rpc/create_manual_booking`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        target_workspace_id: input.workspaceId,
        target_artist_id: input.artistId,
        target_source: input.source,
        existing_contact_id: input.existingContactId || null,
        contact_name: normalizedText(input.contactName),
        contact_email: normalizedText(input.contactEmail),
        contact_phone: normalizedText(input.contactPhone),
        existing_counterparty_id: input.existingCounterpartyId || null,
        counterparty_kind: input.counterpartyKind || 'other',
        counterparty_name: normalizedText(input.counterpartyName),
        event_name: normalizedText(input.eventName),
        venue_name: normalizedText(input.venueName),
        event_city: normalizedText(input.city),
        event_country_code: countryCode(input.countryCode),
        event_date: input.eventDate || null,
        offer_amount_minor: input.offerAmountMinor ?? null,
        offer_currency: currency(input.currency),
        initial_note: normalizedText(input.initialNote)
      }
    })

    const row = rows[0]
    if (!row) throw new Error('manual_booking_create_failed')
    return row
  }

  async function updateBookingDetails(input: UpdateBookingDetailsInput) {
    if (input.offerAmountMinor != null && (!Number.isSafeInteger(input.offerAmountMinor) || input.offerAmountMinor < 0)) {
      throw new Error('invalid_offer_amount_minor')
    }

    const rows = await $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/rpc/update_booking_details`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        target_workspace_id: input.workspaceId,
        target_booking_id: input.bookingId,
        next_event_name: normalizedText(input.eventName),
        next_venue_name: normalizedText(input.venueName),
        next_city: normalizedText(input.city),
        next_country_code: countryCode(input.countryCode),
        next_event_date: input.eventDate || null,
        next_start_time: input.startTime || null,
        next_end_time: input.endTime || null,
        next_event_timezone: normalizedText(input.eventTimezone),
        next_offer_amount_minor: input.offerAmountMinor ?? null,
        next_currency: currency(input.currency),
        next_fee_basis: normalizedText(input.feeBasis)
      }
    })
    const row = rows[0]
    if (!row) throw new Error('booking_details_update_failed')
    return row
  }

  async function setBookingStatus(workspaceId: string, bookingId: string, status: CoreBookingStatus) {
    const rows = await $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/rpc/set_booking_status`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        target_workspace_id: workspaceId,
        target_booking_id: bookingId,
        target_status: status
      }
    })
    const row = rows[0]
    if (!row) throw new Error('booking_status_update_failed')
    return row
  }

  async function setBookingArchived(workspaceId: string, bookingId: string, archived: boolean) {
    const rows = await $fetch<CoreBooking[]>(`${baseUrl}/rest/v1/rpc/set_booking_archived`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        target_workspace_id: workspaceId,
        target_booking_id: bookingId,
        target_archived: archived
      }
    })
    const row = rows[0]
    if (!row) throw new Error('booking_archive_update_failed')
    return row
  }

  async function listActivities(workspaceId: string, bookingId: string, limit = 100) {
    return $fetch<Activity[]>(`${baseUrl}/rest/v1/activities`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        booking_id: `eq.${bookingId}`,
        select: 'id,workspace_id,booking_id,type,direction,contact_id,actor_user_id,body,metadata,visibility,occurred_at,created_by,created_at',
        order: 'occurred_at.asc',
        limit: String(Math.min(Math.max(limit, 1), 200))
      }
    })
  }

  async function listWorkspaceActivities(workspaceId: string, bookingIds: string[] = [], limit = 200) {
    if (!bookingIds.length) return [] as Activity[]
    return $fetch<Activity[]>(`${baseUrl}/rest/v1/activities`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        booking_id: `in.(${bookingIds.join(',')})`,
        select: 'id,workspace_id,booking_id,type,direction,contact_id,actor_user_id,body,metadata,visibility,occurred_at,created_by,created_at',
        order: 'occurred_at.desc',
        limit: String(Math.min(Math.max(limit, 1), 500))
      }
    })
  }

  async function createActivity(input: CreateActivityInput) {
    const userId = currentUserId()
    const rows = await $fetch<Activity[]>(`${baseUrl}/rest/v1/activities`, {
      method: 'POST',
      headers: authHeaders('return=representation'),
      body: {
        workspace_id: input.workspaceId,
        booking_id: input.bookingId,
        type: input.type,
        direction: input.direction ?? null,
        contact_id: input.contactId || null,
        actor_user_id: userId,
        body: normalizedText(input.body),
        metadata: input.metadata || {},
        visibility: input.visibility || 'workspace',
        occurred_at: input.occurredAt || new Date().toISOString(),
        created_by: userId
      }
    })
    const row = rows[0]
    if (!row) throw new Error('activity_create_failed')
    return row
  }

  async function listNextMoves(workspaceId: string, bookingId?: string, activeOnly = true) {
    return $fetch<NextMove[]>(`${baseUrl}/rest/v1/next_moves`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        ...(bookingId ? { booking_id: `eq.${bookingId}` } : {}),
        ...(activeOnly ? { completed_at: 'is.null' } : {}),
        select: 'id,workspace_id,booking_id,label,due_at,assignee_user_id,completed_at,created_by,created_at,updated_at',
        order: activeOnly ? 'due_at.asc.nullslast,created_at.asc' : 'created_at.desc'
      }
    })
  }

  async function setNextMove(input: SetNextMoveInput) {
    const rows = await $fetch<NextMove[]>(`${baseUrl}/rest/v1/rpc/set_booking_next_move`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        target_workspace_id: input.workspaceId,
        target_booking_id: input.bookingId,
        next_label: input.label.trim(),
        next_due_at: input.dueAt || null,
        next_assignee_user_id: input.assigneeUserId || null
      }
    })
    const row = rows[0]
    if (!row) throw new Error('next_move_create_failed')
    return row
  }

  async function completeNextMove(workspaceId: string, nextMoveId: string) {
    const rows = await $fetch<NextMove[]>(`${baseUrl}/rest/v1/rpc/complete_booking_next_move`, {
      method: 'POST',
      headers: authHeaders(),
      body: { target_workspace_id: workspaceId, target_next_move_id: nextMoveId }
    })
    const row = rows[0]
    if (!row) throw new Error('next_move_complete_failed')
    return row
  }

  async function listHolds(workspaceId: string, bookingId?: string, activeOnly = true) {
    return $fetch<Hold[]>(`${baseUrl}/rest/v1/holds`, {
      headers: authHeaders(),
      query: {
        workspace_id: `eq.${workspaceId}`,
        ...(bookingId ? { booking_id: `eq.${bookingId}` } : {}),
        ...(activeOnly ? { status: 'eq.active' } : {}),
        select: 'id,workspace_id,booking_id,event_date,starts_at,ends_at,event_timezone,expires_at,priority,status,released_at,converted_at,created_by,created_at,updated_at',
        order: 'event_date.asc,priority.asc.nullslast,created_at.asc'
      }
    })
  }

  async function createHold(input: CreateHoldInput) {
    if (input.priority != null && (!Number.isInteger(input.priority) || input.priority < 1 || input.priority > 9)) {
      throw new Error('invalid_hold_priority')
    }
    const rows = await $fetch<Hold[]>(`${baseUrl}/rest/v1/rpc/create_booking_hold`, {
      method: 'POST',
      headers: authHeaders(),
      body: {
        target_workspace_id: input.workspaceId,
        target_booking_id: input.bookingId,
        hold_event_date: input.eventDate,
        hold_starts_at: input.startsAt || null,
        hold_ends_at: input.endsAt || null,
        hold_event_timezone: normalizedText(input.eventTimezone),
        hold_expires_at: input.expiresAt || null,
        hold_priority: input.priority ?? null
      }
    })
    const row = rows[0]
    if (!row) throw new Error('hold_create_failed')
    return row
  }

  async function releaseHold(workspaceId: string, holdId: string) {
    const rows = await $fetch<Hold[]>(`${baseUrl}/rest/v1/rpc/release_booking_hold`, {
      method: 'POST',
      headers: authHeaders(),
      body: { target_workspace_id: workspaceId, target_hold_id: holdId }
    })
    const row = rows[0]
    if (!row) throw new Error('hold_release_failed')
    return row
  }

  async function convertHold(workspaceId: string, holdId: string) {
    const rows = await $fetch<Hold[]>(`${baseUrl}/rest/v1/rpc/convert_booking_hold`, {
      method: 'POST',
      headers: authHeaders(),
      body: { target_workspace_id: workspaceId, target_hold_id: holdId }
    })
    const row = rows[0]
    if (!row) throw new Error('hold_convert_failed')
    return row
  }

  return {
    ensureBookingWorkspace,
    listWorkspaceMemberships,
    listWorkspaces,
    listWorkspaceArtists,
    listContacts,
    createContact,
    listCounterparties,
    createCounterparty,
    listBookings,
    createBooking,
    createManualBooking,
    updateBookingDetails,
    setBookingStatus,
    setBookingArchived,
    listActivities,
    listWorkspaceActivities,
    createActivity,
    listNextMoves,
    setNextMove,
    completeNextMove,
    listHolds,
    createHold,
    releaseHold,
    convertHold
  }
}
