import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { agencyActiveBookingCount, filterRosterBookings, resolveAgencyArtist } from '../app/domain/agencyRoster.ts'
import { workspaceViewFromQuery } from '../app/domain/workspaceView.ts'
import type { CoreBooking } from '../app/domain/bookingCore.ts'

const artists = [{ id: 'artist-a' }, { id: 'artist-b' }, { id: 'retired', roster_active: false }]
const booking = (id: string, artist_id: string, status: CoreBooking['status'] = 'new') => ({ id, artist_id, status, archived_at: null }) as CoreBooking

test('agency starts global, selects a valid artist and can return to all', () => {
  assert.equal(resolveAgencyArtist(undefined, artists), '')
  assert.equal(resolveAgencyArtist('artist-b', artists), 'artist-b')
  assert.equal(resolveAgencyArtist('retired', artists), '')
  assert.equal(resolveAgencyArtist('foreign', artists), '')
  assert.equal(workspaceViewFromQuery('roster'), 'roster')
})

test('global bookings and calendar filter across active roster without cross-artist leakage', () => {
  const rows = [booking('a', 'artist-a'), booking('b', 'artist-b', 'confirmed'), booking('r', 'retired'), booking('x', 'foreign')]
  assert.deepEqual(filterRosterBookings(rows, artists).map(item => item.id), ['a', 'b'])
  assert.deepEqual(filterRosterBookings(rows, artists, ['artist-a']).map(item => item.id), ['a'])
  assert.deepEqual(filterRosterBookings(rows, artists, ['artist-a', 'artist-b']).map(item => item.id), ['a', 'b'])
  assert.equal(agencyActiveBookingCount(filterRosterBookings(rows, artists)), 1)
})

test('agency onboarding lands in global overview; DJ retains the newer individual overview', async () => {
  const source = await readFile(new URL('../app/pages/onboarding.vue', import.meta.url), 'utf8')
  assert.match(source, /accountType\.value === 'agency' \? '\/workspace\?view=overview&scope=all&from=onboarding' : '\/workspace\?view=overview&from=onboarding'/)
})

test('roster creation is bridged atomically to Booking Core and retirement retains history', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260928202754_agency_roster_beta.sql', import.meta.url), 'utf8')
  assert.match(migration, /insert into public\.organization_artists/)
  assert.match(migration, /insert into public\.workspace_artists/)
  assert.match(migration, /roster_active boolean not null default true/)
  assert.doesNotMatch(migration, /delete from public\.artists/)
})

test('individual Profile, Passport and CUE ID require artist context; navigation uses aria-current', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  assert.match(source, /v-else-if="isAgencyGlobal" class="empty-card"/)
  assert.match(source, /Selecciona un artista para gestionar su perfil/)
  assert.match(source, /v-if="!isAgency" :title="copy\.profile"/)
  assert.match(source, /data-workspace-view="roster" :aria-current=/)
  assert.match(source, /const isAgencyGlobal = computed/)
})

test('new agency artist has one closed agency booking route, retirement closes it, existing routes are not transferred', async () => {
  const migration = await readFile(new URL('../supabase/migrations/20260929103000_agency_booking_route_contract.sql', import.meta.url), 'utf8')
  const workspace = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const publishing = await readFile(new URL('../app/composables/usePublicArtistPublishing.ts', import.meta.url), 'utf8')
  const publicProfile = await readFile(new URL('../supabase/functions/get-public-artist-profile/index.ts', import.meta.url), 'utf8')
  assert.match(migration, /insert into public\.artist_booking_routes \(artist_id, workspace_id, created_by\)/)
  assert.match(migration, /before update of roster_active on public\.workspace_artists/)
  assert.match(migration, /and not exists \(select 1 from public\.artist_booking_routes r/)
  assert.match(workspace, /publicProfileWorkspaceId\.value !== agencyWorkspaceId\.value/)
  assert.match(workspace, /isAgency\.value && !publicProfileWorkspaceId\.value/)
  assert.match(publishing, /booking_route_other_workspace/)
  assert.match(publicProfile, /bookingManagedBy/)
})
