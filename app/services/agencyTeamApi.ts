import type { AgencyInvitation, AgencyTeamMember, AgencyTeamRole } from '../domain/agencyTeam'
export function createAgencyTeamApi(options: { baseUrl: string; publishableKey: string; accessToken: () => string | null | undefined }) {
 const url=options.baseUrl.replace(/\/$/,'')
 function headers() {
  const token=options.accessToken(); if(!token) throw new Error('authentication_required')
  return { apikey:options.publishableKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json' }
 }
 function rpc<T>(name:string,body:Record<string,unknown>) { return $fetch<T>(`${url}/rest/v1/rpc/${name}`,{method:'POST',headers:headers(),body}) }
 return {
  listMembers: (workspaceId:string) => rpc<AgencyTeamMember[]>('list_agency_team',{target_workspace_id:workspaceId}),
  listInvitations: (workspaceId:string) => $fetch<AgencyInvitation[]>(`${url}/rest/v1/workspace_invitations`,{headers:headers(),query:{workspace_id:`eq.${workspaceId}`,select:'id,email,role,expires_at,accepted_at,revoked_at',order:'created_at.desc',limit:100}}),
  createInvitation: (workspaceId:string,email:string,role:AgencyTeamRole) => rpc<{id:string;token:string;expires_at:string}>('create_agency_invitation',{target_workspace_id:workspaceId,invite_email:email.trim().toLowerCase(),invite_role:role}),
  reviewInvitation: (token:string,accept=false) => rpc<{workspace_id:string;agency_name:string;role:AgencyTeamRole;accepted:boolean}>('review_agency_invitation',{invite_token:token,accept_invitation:accept}),
  manageMember: (workspaceId:string,userId:string,role:AgencyTeamRole|null) => rpc<void>('manage_agency_member',{target_workspace_id:workspaceId,target_user_id:userId,new_role:role}),
  revokeInvitation: (id:string) => rpc<void>('revoke_agency_invitation',{target_invitation_id:id})
 }
}
