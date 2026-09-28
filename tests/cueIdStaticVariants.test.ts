import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_CUE_ID_CONFIG } from '../app/domain/cueId.ts'
import {
  createCueIdStaticRenderPlan,
  createCueIdStaticVariantKey,
  listCueIdRequiredStaticVariantKeys
} from '../app/domain/cueIdStaticVariants.ts'

test('creates a deterministic static key from the full visible semantic config', () => {
  assert.equal(
    createCueIdStaticVariantKey(DEFAULT_CUE_ID_CONFIG),
    'neutral__regular__tee__none__neutral__matte__lime'
  )
})

test('distinguishes base, build, pose, material, accent and accessory states', () => {
  const base = createCueIdStaticVariantKey(DEFAULT_CUE_ID_CONFIG)
  const feminine = createCueIdStaticVariantKey({
    ...DEFAULT_CUE_ID_CONFIG,
    base: 'feminine'
  })
  const strong = createCueIdStaticVariantKey({
    ...DEFAULT_CUE_ID_CONFIG,
    build: 'strong'
  })
  const editorial = createCueIdStaticVariantKey({
    ...DEFAULT_CUE_ID_CONFIG,
    pose: 'editorial'
  })
  const satin = createCueIdStaticVariantKey({
    ...DEFAULT_CUE_ID_CONFIG,
    material: 'satin'
  })
  const red = createCueIdStaticVariantKey({
    ...DEFAULT_CUE_ID_CONFIG,
    accent: 'red'
  })
  const glasses = createCueIdStaticVariantKey({
    ...DEFAULT_CUE_ID_CONFIG,
    accessory: 'glasses'
  })

  assert.equal(new Set([base, feminine, strong, editorial, satin, red, glasses]).size, 7)
})

test('enumerates every declared static semantic combination exactly once', () => {
  const keys = listCueIdRequiredStaticVariantKeys({
    bases: ['feminine', 'masculine', 'neutral'],
    builds: ['slim', 'regular', 'strong'],
    outfits: ['tee'],
    accessories: [null],
    poses: ['neutral', 'relaxed', 'focused', 'editorial'],
    materials: ['matte'],
    accents: ['lime', 'red', null]
  })

  assert.equal(keys.length, 108)
  assert.equal(new Set(keys).size, 108)
})


test('creates deterministic portrait and square render paths for every semantic key', () => {
  const plan = createCueIdStaticRenderPlan({
    bases: ['neutral'],
    builds: ['regular'],
    outfits: ['tee'],
    accessories: [null],
    poses: ['neutral', 'editorial'],
    materials: ['matte'],
    accents: ['lime', null]
  }, {
    assetVersion: '2.0.0'
  })

  assert.equal(plan.length, 4)
  assert.deepEqual(plan[0], {
    key: 'neutral__regular__tee__none__neutral__matte__lime',
    portrait: '/cue-id/production/static/2.0.0/neutral__regular__tee__none__neutral__matte__lime-portrait.webp',
    square: '/cue-id/production/static/2.0.0/neutral__regular__tee__none__neutral__matte__lime-square.webp'
  })
})

test('supports an application-owned custom static base path without changing semantic keys', () => {
  const [entry] = createCueIdStaticRenderPlan({
    bases: ['feminine'],
    builds: ['regular'],
    outfits: ['tee'],
    accessories: [null],
    poses: ['editorial'],
    materials: ['matte'],
    accents: ['red']
  }, {
    assetVersion: '2.1.0',
    basePath: '/assets/cue-id/static/'
  })

  assert.equal(entry.key, 'feminine__regular__tee__none__editorial__matte__red')
  assert.equal(
    entry.portrait,
    '/assets/cue-id/static/2.1.0/feminine__regular__tee__none__editorial__matte__red-portrait.webp'
  )
})
