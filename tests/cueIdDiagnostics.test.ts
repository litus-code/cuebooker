import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

test('CUE ID runtime diagnostics remain outside product surfaces', async () => {
  const [lab, creator, publicProfile, workspace] = await Promise.all([
    readFile(new URL('../app/pages/cue-id.vue', import.meta.url), 'utf8'),
    readFile(new URL('../app/components/CueIdCreator.vue', import.meta.url), 'utf8'),
    readFile(new URL('../app/components/PublicArtistProfile.vue', import.meta.url), 'utf8'),
    readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  ])

  assert.match(lab, /LAB \/ NOINDEX/)
  assert.match(creator, /:show-diagnostics="false"/)
  assert.doesNotMatch(publicProfile, /show-diagnostics/)
  assert.doesNotMatch(workspace, /show-diagnostics/)
})
