export type WorkspaceView = 'overview' | 'bookings' | 'calendar' | 'history' | 'profile' | 'passport' | 'cue-id'

export const WORKSPACE_VIEWS: readonly WorkspaceView[] = [
  'overview',
  'bookings',
  'calendar',
  'history',
  'profile',
  'passport',
  'cue-id'
]

export function normalizeWorkspaceView(value: unknown): WorkspaceView | null {
  return typeof value === 'string' && WORKSPACE_VIEWS.includes(value as WorkspaceView)
    ? value as WorkspaceView
    : null
}

export function explicitWorkspaceViewFromQuery(value: unknown, booking?: unknown): WorkspaceView | null {
  const view = normalizeWorkspaceView(value)
  if (view) return view
  if (typeof booking === 'string' && booking.trim()) return 'bookings'
  return null
}

export function workspaceViewFromQuery(value: unknown, booking?: unknown): WorkspaceView {
  return explicitWorkspaceViewFromQuery(value, booking) || 'overview'
}
