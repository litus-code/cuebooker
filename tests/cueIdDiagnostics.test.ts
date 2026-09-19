import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('CUE ID runtime diagnostics stay lab-only', async () => {
  const [lab, publicProfile, workspace] = await Promise.all([
    readFile(new URL('../app/pages/cue-id.vue', import.meta.url), 'utf8'),
    readFile(new URL('../app/components/PublicArtistProfile.vue', import.meta.url), 'utf8'),
    readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  ])

  assert.match(lab, /show-diagnostics/)
  assert.doesNotMatch(publicProfile, /show-diagnostics/)
  assert.doesNotMatch(workspace, /show-diagnostics/)
})
