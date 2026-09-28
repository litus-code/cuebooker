import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  getArtistPresentationMode,
  getArtistPresentationSelection
} from '../app/domain/artistVisual.ts'

test('artist presentation is derived from source plus portrait treatment', () => {
  assert.equal(getArtistPresentationMode('cue_id', 'photo'), 'cue_id')
  assert.equal(getArtistPresentationMode('cue_id', 'duotone'), 'cue_id')
  assert.equal(getArtistPresentationMode('portrait', 'photo'), 'photo')
  assert.equal(getArtistPresentationMode('portrait', 'artwork'), 'artwork')
  assert.equal(getArtistPresentationMode('portrait', 'duotone'), 'artwork')
})

test('presentation selection keeps visual source authoritative', () => {
  assert.deepEqual(
    getArtistPresentationSelection('cue_id', 'duotone'),
    { visualSource: 'cue_id' }
  )
  assert.deepEqual(
    getArtistPresentationSelection('photo', 'duotone'),
    { visualSource: 'portrait', artistImageStyle: 'photo' }
  )
  assert.deepEqual(
    getArtistPresentationSelection('artwork', 'photo'),
    { visualSource: 'portrait', artistImageStyle: 'artwork' }
  )
  assert.deepEqual(
    getArtistPresentationSelection('artwork', 'duotone'),
    { visualSource: 'portrait', artistImageStyle: 'duotone' }
  )
})

test('application persistence no longer treats visual_mode as source of truth', async () => {
  const profile = await readFile(
    new URL('../app/composables/useArtistProfile.ts', import.meta.url),
    'utf8'
  )
  const editor = await readFile(
    new URL('../app/components/CueIdProfileEditor.vue', import.meta.url),
    'utf8'
  )
  const edge = await readFile(
    new URL('../supabase/functions/get-public-artist-profile/index.ts', import.meta.url),
    'utf8'
  )

  assert.match(profile, /visual_source/)
  assert.doesNotMatch(profile, /visual_mode/)
  assert.match(editor, /getArtistPresentationMode/)
  assert.match(editor, /getArtistPresentationSelection/)
  assert.match(edge, /visual_source/)
  assert.doesNotMatch(edge, /visual_mode/)
})
