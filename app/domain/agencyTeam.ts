export type AgencyTeamRole = 'owner' | 'admin' | 'manager' | 'editor' | 'viewer'
export type AgencyTeamMember = { user_id: string; display_name: string | null; email: string; role: AgencyTeamRole }
export type AgencyInvitation = { id: string; email: string; role: AgencyTeamRole; expires_at: string; accepted_at: string | null; revoked_at: string | null }
export const AGENCY_INVITE_STORAGE = 'cuebooker.agency.invitation'
export function canManageAgencyTeam(role: string) { return role === 'owner' || role === 'admin' }
export function canChangeAgencyMember(actor: string, selfId: string, member: AgencyTeamMember) {
  return canManageAgencyTeam(actor) && member.user_id !== selfId && member.role !== 'owner' && (member.role !== 'admin' || actor === 'owner')
}
export function agencyAssignableRoles(actor: string): Exclude<AgencyTeamRole, 'owner'>[] {
  return actor === 'owner' ? ['admin','manager','editor','viewer'] : actor === 'admin' ? ['manager','editor','viewer'] : []
}
export function validAgencyInviteToken(token: unknown): token is string { return typeof token === 'string' && /^[a-f0-9]{64}$/.test(token) }
