import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_CUE_ID_CONFIG } from '../app/domain/cueId.ts'
import {
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
