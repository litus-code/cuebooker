import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CLUB_MINIMAL_CATALOGUE,
  DEFAULT_CUE_ID_CONFIG,
  cloneCueIdConfig
} from '../app/domain/cueId.ts'
import { toPublicCueIdConfig } from '../app/domain/publicArtistProfile.ts'

test('CUE ID default config stays inside the Club Minimal V1 catalogue', () => {
  const config = DEFAULT_CUE_ID_CONFIG

  assert.equal(config.schemaVersion, 1)
  assert.equal(config.family, 'club_minimal')
  assert.ok(CLUB_MINIMAL_CATALOGUE.bases.some(item => item.id === config.base))
  assert.ok(CLUB_MINIMAL_CATALOGUE.builds.some(item => item.id === config.build))
  assert.ok(CLUB_MINIMAL_CATALOGUE.outfits.some(item => item.id === config.outfit))
  assert.ok(CLUB_MINIMAL_CATALOGUE.accessories.some(item => item.id === config.accessory))
  assert.ok(CLUB_MINIMAL_CATALOGUE.poses.some(item => item.id === config.pose))
  assert.ok(CLUB_MINIMAL_CATALOGUE.materials.some(item => item.id === config.material))
})

test('CUE ID config clone is independent from the source object', () => {
  const clone = cloneCueIdConfig(DEFAULT_CUE_ID_CONFIG)
  clone.pose = 'editorial'
  clone.accent = 'red'

  assert.equal(DEFAULT_CUE_ID_CONFIG.pose, 'neutral')
  assert.equal(DEFAULT_CUE_ID_CONFIG.accent, 'lime')
  assert.equal(clone.pose, 'editorial')
  assert.equal(clone.accent, 'red')
})

test('Club Minimal keeps the first catalogue intentionally bounded', () => {
  assert.equal(CLUB_MINIMAL_CATALOGUE.bases.length, 3)
  assert.equal(CLUB_MINIMAL_CATALOGUE.builds.length, 3)
  assert.ok(CLUB_MINIMAL_CATALOGUE.outfits.length <= 4)
  assert.ok(CLUB_MINIMAL_CATALOGUE.accessories.length <= 4)
  assert.ok(CLUB_MINIMAL_CATALOGUE.poses.length <= 4)
  assert.ok(CLUB_MINIMAL_CATALOGUE.materials.length <= 2)
})


test('public CUE ID projection excludes private/editor-only flags', () => {
  const publicConfig = toPublicCueIdConfig(DEFAULT_CUE_ID_CONFIG)

  assert.equal(publicConfig.schemaVersion, 1)
  assert.equal(publicConfig.family, 'club_minimal')
  assert.equal('enabled' in publicConfig, false)
  assert.deepEqual(Object.keys(publicConfig).sort(), [
    'accent',
    'accessory',
    'base',
    'build',
    'family',
    'material',
    'outfit',
    'pose',
    'schemaVersion'
  ].sort())
})


test('CUE ID performance contract keeps public rendering static-first by default', async () => {
  const source = await import('node:fs/promises')
  const component = await source.readFile(new URL('../app/components/PublicArtistProfile.vue', import.meta.url), 'utf8')

  assert.match(component, /:interactive="false"/)
})


test('CUE ID renderer only uses continuous frames until the real asset becomes ready', async () => {
  const source = await import('node:fs/promises')
  const component = await source.readFile(
    new URL('../app/components/CueIdScene.client.vue', import.meta.url),
    'utf8'
  )

  assert.match(component, /:render-mode="ready \? 'on-demand' : 'always'"/)
  assert.match(component, /emit\('labAssetLoaded', metrics\)/)
  assert.match(component, /ready\.value = true/)
})


test('CUE ID scene falls back on WebGL context loss', async () => {
  const source = await import('node:fs/promises')
  const component = await source.readFile(
    new URL('../app/components/CueIdScene.client.vue', import.meta.url),
    'utf8'
  )

  assert.match(component, /webglcontextlost/)
  assert.match(component, /event\.preventDefault\(\)/)
  assert.match(component, /emit\('failed'\)/)
  assert.match(component, /removeEventListener\('webglcontextlost'/)
})


test('CUE ID static fallback keeps a complete editorial body silhouette', async () => {
  const source = await import('node:fs/promises')
  const component = await source.readFile(
    new URL('../app/components/CueIdStage.vue', import.meta.url),
    'utf8'
  )

  for (const className of [
    'cue-id-stage__head',
    'cue-id-stage__neck',
    'cue-id-stage__torso',
    'cue-id-stage__arm',
    'cue-id-stage__hand',
    'cue-id-stage__pelvis',
    'cue-id-stage__leg'
  ]) {
    assert.match(component, new RegExp(className))
  }

  assert.match(component, /cue-id-stage--outfit-hoodie/)
  assert.match(component, /cue-id-stage--outfit-bomber/)
  assert.match(component, /cue-id-stage--outfit-tank/)
})
