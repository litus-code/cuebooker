import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CUE_ID_STYLIZED_CREATOR_CATALOGUE,
  CUE_ID_STYLIZED_CUEBOOKER_BASICS,
  DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
  cloneCueIdStylizedCreatorConfig,
  isCueIdStylizedCreatorConfigV1,
  normalizeCueIdStylizedPiercings
} from '../app/domain/cueIdStylizedCreator.ts'

test('stylized creator default config stays inside the catalogue', () => {
  const config = DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG
  const catalogue = CUE_ID_STYLIZED_CREATOR_CATALOGUE

  assert.equal(config.schemaVersion, 1)
  assert.ok(catalogue.bodies.includes(config.body))
  assert.ok(catalogue.expressions.includes(config.expression))
  assert.ok(catalogue.eyeColors.includes(config.eyeColor))
  assert.ok(catalogue.contactLenses.includes(config.contactLens))
  assert.ok(catalogue.hairs.includes(config.hair))
  assert.ok(catalogue.hairColors.includes(config.hairColor))
  assert.ok(catalogue.facialHair.includes(config.facialHair))
  assert.ok(catalogue.headwear.includes(config.headwear))
  assert.ok(catalogue.faceAccessories.includes(config.faceAccessory))
  assert.ok(catalogue.earAccessories.includes(config.earAccessory))
  assert.ok(catalogue.gloves.includes(config.gloves))
  assert.ok(catalogue.tops.includes(config.top))
  assert.ok(catalogue.bottoms.includes(config.bottom))
  assert.ok(catalogue.onePieces.includes(config.onePiece))
  assert.ok(catalogue.footwear.includes(config.footwear))
})

test('stylized creator supports the agreed first accessory set', () => {
  const catalogue = CUE_ID_STYLIZED_CREATOR_CATALOGUE

  assert.deepEqual(catalogue.headwear, ['none', 'cap', 'beanie', 'top-hat'])
  assert.deepEqual(catalogue.faceAccessories, ['none', 'mask'])
  assert.deepEqual(catalogue.earAccessories, ['none', 'headphones'])
  assert.deepEqual(catalogue.gloves, ['none', 'short-gloves', 'long-gloves'])
})

test('stylized creator validator rejects unknown accessory ids', () => {
  assert.equal(isCueIdStylizedCreatorConfigV1(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG), true)

  assert.equal(
    isCueIdStylizedCreatorConfigV1({
      ...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
      headwear: 'cowboy-hat'
    }),
    false
  )

  assert.equal(
    isCueIdStylizedCreatorConfigV1({
      ...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
      earAccessory: 'unknown'
    }),
    false
  )
})

test('piercings stay multi-select, unique and capped at three', () => {
  assert.deepEqual(
    normalizeCueIdStylizedPiercings(['ear', 'septum', 'ear', 'eyebrow', 'nostril']),
    ['ear', 'septum', 'eyebrow']
  )
})

test('stylized clone does not share piercing state', () => {
  const clone = cloneCueIdStylizedCreatorConfig()
  clone.piercings.push('septum')
  clone.headwear = 'cap'

  assert.deepEqual(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG.piercings, [])
  assert.equal(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG.headwear, 'none')
})

test('Cuebooker Basics uses a small symbol and avoids branding the default trousers', () => {
  assert.deepEqual(
    CUE_ID_STYLIZED_CUEBOOKER_BASICS.tops.tee,
    { mark: 'cuebooker-symbol', placement: 'left-chest' }
  )
  assert.deepEqual(
    CUE_ID_STYLIZED_CUEBOOKER_BASICS.bottoms['wide-trouser'],
    { mark: 'none', placement: null }
  )
  assert.deepEqual(
    CUE_ID_STYLIZED_CUEBOOKER_BASICS.headwear.cap,
    { mark: 'cuebooker-symbol', placement: 'front-center-small' }
  )
})
