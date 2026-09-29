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
