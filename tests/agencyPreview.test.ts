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


test('agency demo opens a local public artist profile preview', async () => {
  const page = await readFile(new URL('../app/pages/preview-agency.vue', import.meta.url), 'utf8')
  assert.match(page, /@preview="agencyPublicPreviewOpen = true"/)
  assert.match(page, /<PublicArtistProfile :profile="agencyPublicArtistPreview"/)
  assert.match(page, /agency-preview__public-artist-close/)
})
