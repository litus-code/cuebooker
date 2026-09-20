import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CUE_ID_CREATOR_CATALOGUE,
  DEFAULT_CUE_ID_CREATOR_CONFIG,
  cloneCueIdCreatorConfig,
  cueIdCreatorToRuntimeConfig
} from '../app/domain/cueIdCreator.ts'

test('CUE ID creator default config stays inside the creator catalogue', () => {
  const config = DEFAULT_CUE_ID_CREATOR_CONFIG

  assert.equal(config.schemaVersion, 1)
  assert.ok(CUE_ID_CREATOR_CATALOGUE.bases.some(item => item.id === config.base))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.builds.some(item => item.id === config.build))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.skins.some(item => item.id === config.skin))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.faces.some(item => item.id === config.face))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.hairs.some(item => item.id === config.hair))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.facialHair.some(item => item.id === config.facialHair))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.tops.some(item => item.id === config.top))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.bottoms.some(item => item.id === config.bottom))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.footwear.some(item => item.id === config.footwear))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.accessories.some(item => item.id === config.accessory))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.poses.some(item => item.id === config.pose))
})

test('CUE ID creator clone is independent from the default config', () => {
  const clone = cloneCueIdCreatorConfig()
  clone.hair = 'locs'
  clone.bottom = 'cargo'

  assert.equal(DEFAULT_CUE_ID_CREATOR_CONFIG.hair, 'textured-crop')
  assert.equal(DEFAULT_CUE_ID_CREATOR_CONFIG.bottom, 'wide-trouser')
  assert.equal(clone.hair, 'locs')
  assert.equal(clone.bottom, 'cargo')
})

test('creator base and build remain independent dimensions', () => {
  const feminineStrong = cueIdCreatorToRuntimeConfig({
    ...DEFAULT_CUE_ID_CREATOR_CONFIG,
    base: 'feminine',
    build: 'strong'
  })
  const masculineSlim = cueIdCreatorToRuntimeConfig({
    ...DEFAULT_CUE_ID_CREATOR_CONFIG,
    base: 'masculine',
    build: 'slim'
  })

  assert.equal(feminineStrong.base, 'feminine')
  assert.equal(feminineStrong.build, 'strong')
  assert.equal(masculineSlim.base, 'masculine')
  assert.equal(masculineSlim.build, 'slim')
})

test('creator top maps to the legacy runtime outfit without widening production semantics', () => {
  const cases = [
    ['oversized-tee', 'tee'],
    ['fitted-tee', 'tee'],
    ['tank', 'tank'],
    ['hoodie', 'hoodie'],
    ['bomber', 'bomber']
  ] as const

  for (const [top, expectedOutfit] of cases) {
    const runtime = cueIdCreatorToRuntimeConfig({
      ...DEFAULT_CUE_ID_CREATOR_CONFIG,
      top
    })
    assert.equal(runtime.outfit, expectedOutfit)
  }
})

test('creator-only appearance fields do not change the legacy runtime contract', () => {
  const baseline = cueIdCreatorToRuntimeConfig(DEFAULT_CUE_ID_CREATOR_CONFIG)
  const changed = cueIdCreatorToRuntimeConfig({
    ...DEFAULT_CUE_ID_CREATOR_CONFIG,
    skin: 'skin-06',
    face: 'face-06',
    hair: 'long-natural',
    facialHair: 'short-beard',
    bottom: 'denim',
    footwear: 'boot'
  })

  assert.deepEqual(changed, baseline)
})

test('CUE ID creator UI uses the creator config and runtime adapter', async () => {
  const source = await import('node:fs/promises')
  const component = await source.readFile(
    new URL('../app/components/CueIdCreator.vue', import.meta.url),
    'utf8'
  )

  assert.match(component, /CueIdCreatorConfigV1/)
  assert.match(component, /cueIdCreatorToRuntimeConfig\(modelValue\)/)
  assert.match(component, /case 'skin'/)
  assert.match(component, /case 'face'/)
  assert.match(component, /case 'hair'/)
  assert.match(component, /case 'facialHair'/)
  assert.match(component, /case 'top'/)
  assert.match(component, /case 'bottom'/)
  assert.match(component, /case 'footwear'/)
  assert.match(component, /optionVisualClass/)
  assert.match(component, /creator__option-visual--skin/)
  assert.match(component, /creator__option-visual--hair/)
  assert.match(component, /creator__option-visual--top/)
  assert.match(component, /creator__option-visual--bottom/)
  assert.match(component, /creator__option-visual--footwear/)
  assert.doesNotMatch(component, /case 'outfit'/)
})
