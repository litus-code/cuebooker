import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('CUE ID keeps the minimal TresJS dependency surface', async () => {
  const raw = await readFile(new URL('../package.json', import.meta.url), 'utf8')
  const pkg = JSON.parse(raw) as { dependencies?: Record<string, string> }
  const dependencies = pkg.dependencies || {}

  assert.ok(dependencies['@tresjs/core'])
  assert.ok(dependencies.three)
  assert.equal(dependencies['@tresjs/nuxt'], undefined)
})
