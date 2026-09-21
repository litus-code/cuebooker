import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CUE_ID_WARDROBE_ASSETS,
  cueIdHarnessCompatibleWithTop,
  cueIdModestyForSelection,
  cueIdOuterwearCompatibleWithTop,
  cueIdWardrobeFitForBody,
  cueIdWardrobeIsSharedAcrossBodies,
  cueIdWardrobeSupportsBody
} from '../app/domain/cueIdWardrobe.ts'

test('every authored wardrobe item is shared across male and female bodies', () => {
  for (const asset of CUE_ID_WARDROBE_ASSETS) {
    assert.equal(cueIdWardrobeSupportsBody(asset.id, 'male'), true, asset.id)
    assert.equal(cueIdWardrobeSupportsBody(asset.id, 'female'), true, asset.id)
    assert.equal(cueIdWardrobeIsSharedAcrossBodies(asset.id), true, asset.id)
    assert.ok(cueIdWardrobeFitForBody(asset.id, 'male')?.endsWith('_male_fit'))
    assert.ok(cueIdWardrobeFitForBody(asset.id, 'female')?.endsWith('_female_fit'))
  }
})

test('mesh and festival tops keep the modesty layer', () => {
  assert.equal(
    cueIdModestyForSelection({
      top: 'mesh-top',
      bottom: 'festival-wrap',
      onePiece: 'none',
      torsoAccessory: 'harness'
    }),
    'keep-underwear'
  )

  assert.equal(
    cueIdModestyForSelection({
      top: 'festival-top',
      bottom: 'skirt',
      onePiece: 'none',
      torsoAccessory: 'harness'
    }),
    'keep-underwear'
  )
})

test('covered basics hide the relevant modesty layer', () => {
  assert.equal(
    cueIdModestyForSelection({
      top: 'tee',
      bottom: 'wide-trouser',
      onePiece: 'none',
      torsoAccessory: 'none'
    }),
    'hide-all-underwear'
  )

  assert.equal(
    cueIdModestyForSelection({
      top: 'tank',
      bottom: 'shorts',
      onePiece: 'none',
      torsoAccessory: 'none'
    }),
    'hide-all-underwear'
  )
})

test('one-piece garments own modesty behavior', () => {
  assert.equal(
    cueIdModestyForSelection({
      onePiece: 'jumpsuit'
    }),
    'hide-all-underwear'
  )

  assert.equal(
    cueIdModestyForSelection({
      onePiece: 'festival-outfit'
    }),
    'keep-underwear'
  )
})

test('harness compatibility is explicit per top', () => {
  assert.equal(cueIdHarnessCompatibleWithTop('mesh-top'), true)
  assert.equal(cueIdHarnessCompatibleWithTop('festival-top'), true)
  assert.equal(cueIdHarnessCompatibleWithTop('tee'), true)
  assert.equal(cueIdHarnessCompatibleWithTop('sweatshirt'), false)
  assert.equal(cueIdHarnessCompatibleWithTop('hoodie'), false)
})

test('outerwear compatibility is explicit per top', () => {
  assert.equal(cueIdOuterwearCompatibleWithTop('tee'), true)
  assert.equal(cueIdOuterwearCompatibleWithTop('mesh-top'), true)
  assert.equal(cueIdOuterwearCompatibleWithTop('bomber'), false)
  assert.equal(cueIdOuterwearCompatibleWithTop('hoodie'), false)
})
