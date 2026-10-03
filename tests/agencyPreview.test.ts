import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('anonymous agency preview uses local fixtures while the real workspace keeps its auth flow', async () => {
  const page = await readFile(new URL('../app/pages/preview-agency.vue', import.meta.url), 'utf8')
  const component = await readFile(new URL('../app/components/AgencyWorkspace.vue', import.meta.url), 'utf8')
  const workspace = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  assert.match(page, /config\.public\.appEnv === 'staging'/)
  assert.match(page, /hostname\.startsWith\('pr-'\)/)
  assert.match(page, /noindex,nofollow/)
  assert.match(page, /:demo-data="demoData"/)
  assert.doesNotMatch(page, /useBookingCore\(|useCueAuth\(|\$fetch\(/)
  assert.match(component, /if \(props\.demoData\) \{/)
  assert.match(component, /if \(props\.demoData\) return/)
  assert.match(workspace, /const auth = useCueAuth\(\)/)
})


test('agency public enquiry preview shows the full form but cannot submit', async () => {
  const form = await readFile(new URL('../app/components/PublicAgencyEnquiryForm.vue', import.meta.url), 'utf8')
  assert.match(form, /v-if="preview" class="agency-enquiry__privacy"/)
  assert.match(form, /Tu nombre/)
  assert.match(form, /¿Qué tienes en mente\?/)
  assert.match(form, /:disabled="preview \|\| submitting"/)
  assert.match(form, /if\(props\.preview\|\|props\.submitting/)
})

test('agency profile preview has a dedicated share state and no meaningless save action', async () => {
  const page = await readFile(new URL('../app/pages/preview-agency.vue', import.meta.url), 'utf8')
  assert.match(page, /COMPARTIR PERFIL \/ ARTISTA/)
  assert.match(page, /agency-preview__share-status/)
  assert.match(page, /profileEditorSection !== 'distribution'/)
})

test('agency roster actions are grouped in an accessible menu and keep retirement confirmation', async () => {
  const component = await readFile(new URL('../app/components/AgencyWorkspace.vue', import.meta.url), 'utf8')
  assert.match(component, /class="agency-roster-menu"/)
  assert.match(component, /<summary :aria-label=/)
  assert.match(component, /role="menu"/)
  assert.match(component, /role="menuitem"/)
  assert.match(component, /Editar ficha/)
  assert.match(component, /Retirar del roster/)
  assert.match(component, /function closeRosterMenu/)
  assert.match(component, /function confirmRetire/)
})


test('agency artist profiles are agency-managed, not individually published', async () => {
  const profile = await readFile(new URL('../app/components/WorkspaceArtistProfile.vue', import.meta.url), 'utf8')
  const workspace = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const catalog = await readFile(new URL('../app/components/AgencyCatalogEditor.vue', import.meta.url), 'utf8')
  const agencyPage = await readFile(new URL('../app/components/PublicAgencyProfile.vue', import.meta.url), 'utf8')
  const migration = await readFile(new URL('../supabase/migrations/20261003200000_agency_managed_catalog_artists.sql', import.meta.url), 'utf8')
  assert.match(workspace, /:agency-managed="isAgency"/)
  const preview = await readFile(new URL('../app/pages/preview-agency.vue', import.meta.url), 'utf8')
  assert.match(preview, /<WorkspaceArtistProfile\s+:profile="agencyArtistProfile"\s+:agency-managed="true"/)
  assert.match(profile, /<section v-if="!agencyManaged" class="artist-workspace-profile__booking-band"/)

  assert.match(profile, /v-if="editable && !agencyManaged"/)
  assert.match(profile, /GESTIONADO POR LA AGENCIA/)
  assert.match(catalog, /Ficha lista para incluir/)
  assert.match(agencyPage, /:artists="agency\.artists"/)
  assert.doesNotMatch(agencyPage, /filter\(artist => artist\.acceptingRequests\)/)
  assert.doesNotMatch(migration, /public_profile_enabled/)
  assert.match(migration, /r\.workspace_id=wa\.workspace_id/)
})

test('agency demo opens a local public artist profile preview', async () => {
  const page = await readFile(new URL('../app/pages/preview-agency.vue', import.meta.url), 'utf8')
  assert.match(page, /@preview="agencyPublicPreviewOpen = true"/)
  assert.match(page, /<PublicArtistProfile :profile="agencyPublicArtistPreview"/)
  assert.match(page, /agency-preview__public-artist-close/)
})

test('public artist portfolios from agency catalogue stay managed by that agency', async () => {
  const agency = await readFile(new URL('../app/components/PublicAgencyProfile.vue', import.meta.url), 'utf8')
  const page = await readFile(new URL('../app/pages/[slug].vue', import.meta.url), 'utf8')
  const profile = await readFile(new URL('../app/components/PublicArtistProfile.vue', import.meta.url), 'utf8')
  const api = await readFile(new URL('../app/services/publicBookingIngressApi.ts', import.meta.url), 'utf8')
  const edge = await readFile(new URL('../supabase/functions/get-public-artist-profile/index.ts', import.meta.url), 'utf8')
  assert.match(agency, /src=agency&agency=\$\{agency\.slug\}/)
  assert.match(page, /getPublicAgencyProfile/)
  assert.match(page, /agency\.artists\.find\(artist => artist\.slug === slug\.value\)/)
  assert.match(page, /:agency-managed="agencyManaged"/)
  assert.match(profile, /v-else-if="agencyManaged" class="public-artist-profile__agency-return"/)
  assert.match(profile, /requestOpen && !agencyManaged/)
  assert.match(api, /url\.searchParams\.set\('agency', slug\)/)
  assert.match(edge, /agency RPC is the allowlist/)
  assert.match(edge, /bookingManagedBy: agency\.name/)
  assert.match(edge, /owns\(artist\.imagePath\)/)
})
test('clearing agency artist filter preserves the current operational tab', async () => {
  const preview = await readFile(new URL('../app/pages/preview-agency.vue', import.meta.url), 'utf8')
  const workspace = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const clear = preview.match(/function returnToAgency\(\) \{([^}]+)\}/)![1]
  assert.match(clear, /selectedArtistId.value = ''/)
  assert.doesNotMatch(clear, /view.value\s*=/)
  assert.match(workspace, /agencyGlobalQuery\(route.query, agencyViewForArtist\(activeView.value, false\)\)/)
})
test('agency preview navigation reacts to the selected language', async () => {
  const source = await readFile(new URL('../app/pages/preview-agency.vue', import.meta.url), 'utf8')
  const nav = source.match(/const nav = computed[^]*?\(\(\) => (\[[^]*?\])\)/)![1]
  const labels = (language:string) => Function('locale', `return ${nav}`)({value:language}).map((item:any)=>item.label)
  assert.deepEqual(labels('es'), ['Resumen','Reservas','Calendario','Actividad','Artistas','Ajustes'])
  assert.deepEqual(labels('en'), ['Overview','Bookings','Calendar','Activity','Artists','Settings'])
})
