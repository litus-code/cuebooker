import test from 'node:test'
import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url)
test('agency landing and public slug use sibling page entries rather than a parent that shadows the catalogue', async () => {
  await access(new URL('app/pages/agency/index.vue', root))
  await access(new URL('app/pages/agency/[slug].vue', root))
  await assert.rejects(access(new URL('app/pages/agency.vue', root)))
})
test('Cloudflare agency fallback preserves slug URLs without swallowing the prerendered landing or redirecting to clean HTML paths', async () => {
  const rules = (await readFile(new URL('public/_redirects', root), 'utf8')).trim().split('\n').map(line => {
    const [from, to, status] = line.split(/\s+/)
    return { pattern: new RegExp('^' + from.replace(':slug', '[^/]+') + '$'), to, status }
  })
  for (const path of ['/agency', '/agency/']) assert.equal(rules.find(r => r.pattern.test(path)), undefined)
  for (const path of ['/agency/example-agency', '/agency/example-agency/']) {
    const matched = rules.find(r => r.pattern.test(path))
    assert.equal(matched?.status, '200')
    assert.equal(matched?.to, '/200')
    assert.doesNotMatch(matched!.to, /\.html$/)
  }
  assert.equal(rules.find(r => r.pattern.test('/agency/example/unknown-child')), undefined)
})
