import type { WorkspaceView } from './workspaceView'

export function agencyViewForArtist(current: WorkspaceView, hasArtist: boolean): WorkspaceView {
  if (current === 'roster') return 'overview'
  if (!hasArtist && ['profile', 'passport', 'cue-id'].includes(current)) return 'overview'
  return current
}

export function agencyGlobalQuery(query: Record<string, unknown>, view: WorkspaceView) {
  return { ...query, view, scope: 'all', artist: undefined, booking: undefined, setup: undefined }
}

export function canOperateAgency(role: string) {
  return ['owner', 'admin', 'manager', 'editor'].includes(role)
}
