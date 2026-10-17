import test from 'node:test'
import assert from 'node:assert/strict'
import { agencyAssignableRoles, canChangeAgencyMember, canManageAgencyTeam, validAgencyInviteToken } from '../app/domain/agencyTeam.ts'
import { createAgencyTeamApi } from '../app/services/agencyTeamApi.ts'

test('agency team protects owners, self and admins from peer administration',()=>{
 const owner={user_id:'owner',display_name:null,email:'a@example.invalid',role:'owner' as const}
 const admin={...owner,user_id:'admin',role:'admin' as const}
 const manager={...owner,user_id:'manager',role:'manager' as const}
 assert.equal(canChangeAgencyMember('owner','owner',owner),false)
 assert.equal(canChangeAgencyMember('admin','other',admin),false)
 assert.equal(canChangeAgencyMember('owner','owner',admin),true)
 assert.equal(canChangeAgencyMember('admin','admin',manager),true)
 assert.equal(canChangeAgencyMember('manager','other',manager),false)
 assert.equal(canManageAgencyTeam('viewer'),false)
 assert.deepEqual(agencyAssignableRoles('manager'),[])
 assert.equal(agencyAssignableRoles('admin').includes('admin'),false)
 assert.equal(agencyAssignableRoles('owner').includes('admin'),true)
})
test('invitation destination only recognizes full opaque tokens',()=>{
 assert.equal(validAgencyInviteToken('a'.repeat(64)),true)
 for(const token of [null,undefined,'', 'a'.repeat(63),'G'.repeat(64),'https://other.invalid'])assert.equal(validAgencyInviteToken(token),false)
})
test('team adapter preserves authenticated command contracts and defaults review to no mutation',async()=>{
 const calls:any[]=[]
 const original=(globalThis as any).$fetch
 ;(globalThis as any).$fetch=async(url:string,options:any)=>{calls.push({url,...options});return {}}
 try{
  const api=createAgencyTeamApi({baseUrl:'https://staging.invalid/',publishableKey:'public-key',accessToken:()=> 'session-token'})
  await api.createInvitation('agency',' PERSON@EXAMPLE.INVALID ','manager')
  await api.reviewInvitation('a'.repeat(64))
  await api.reviewInvitation('a'.repeat(64),true)
  await api.manageMember('agency','member',null)
  assert.equal(calls[0].url,'https://staging.invalid/rest/v1/rpc/create_agency_invitation')
  assert.equal(calls[0].body.invite_email,'person@example.invalid')
  assert.equal(calls[0].headers.Authorization,'Bearer session-token')
  assert.equal(calls[1].body.accept_invitation,false)
  assert.equal(calls[2].body.accept_invitation,true)
  assert.equal(calls[3].body.new_role,null)
  assert.throws(()=>createAgencyTeamApi({baseUrl:'x',publishableKey:'p',accessToken:()=>null}).listMembers('a'),/authentication_required/)
 }finally{(globalThis as any).$fetch=original}
})
