import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CUE_ID_STYLIZED_CREATOR_CATALOGUE,
  CUE_ID_STYLIZED_CUEBOOKER_BASICS,
  DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
  cloneCueIdStylizedCreatorConfig,
  cueIdStylizedCreatorConfigsEqual,
  isCueIdStylizedCreatorConfigV1,
  normalizeCueIdStylizedPiercings
} from '../app/domain/cueIdStylizedCreator.ts'
import {
  CUE_ID_BODY_SEMANTIC_NODES,
  CUE_ID_BODY_SOURCE_HAIR,
  CUE_ID_SKIN_TONES,
  resolveCueIdBodySemanticState
} from '../app/domain/cueIdBodyMaterials.ts'

test('stylized creator default config stays inside the catalogue', () => {
  const config = DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG
  const catalogue = CUE_ID_STYLIZED_CREATOR_CATALOGUE

  assert.equal(config.schemaVersion, 1)
  assert.ok(catalogue.bodies.includes(config.body))
  assert.ok(catalogue.skins.includes(config.skin))
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
  assert.ok(catalogue.torsoAccessories.includes(config.torsoAccessory))
  assert.ok(catalogue.neckAccessories.includes(config.neckAccessory))
  assert.ok(catalogue.makeup.includes(config.makeup))
  assert.ok(catalogue.nails.includes(config.nails))
  assert.ok(catalogue.tops.includes(config.top))
  assert.ok(catalogue.bottoms.includes(config.bottom))
  assert.ok(catalogue.onePieces.includes(config.onePiece))
  assert.ok(catalogue.footwear.includes(config.footwear))
})

test('male and female use one shared unrestricted catalogue', () => {
  const catalogue = CUE_ID_STYLIZED_CREATOR_CATALOGUE

  assert.deepEqual(catalogue.bodies, ['male', 'female'])
  assert.deepEqual(
    catalogue.hairs,
    ['bald', 'shaved', 'mohawk', 'fade', 'crop', 'curly', 'bob', 'tied-back', 'locs']
  )
  assert.deepEqual(
    catalogue.hairColors,
    ['black', 'dark-brown', 'brown', 'blond', 'platinum', 'red', 'blue']
  )
  assert.ok(catalogue.bottoms.includes('skirt'))
  assert.ok(catalogue.torsoAccessories.includes('harness'))
  assert.ok(catalogue.faceAccessories.includes('venetian-mask'))
  assert.ok(catalogue.tops.includes('mesh-top'))
  assert.ok(catalogue.onePieces.includes('bodysuit'))
  assert.ok(catalogue.footwear.includes('platform-boot'))
  assert.ok(catalogue.footwear.includes('vans-style'))
})

test('stylized creator supports club and festival accessories', () => {
  const catalogue = CUE_ID_STYLIZED_CREATOR_CATALOGUE

  assert.deepEqual(catalogue.headwear, ['none', 'cap', 'beanie', 'top-hat', 'festival-hood'])
  assert.ok(catalogue.faceAccessories.includes('venetian-mask'))
  assert.ok(catalogue.faceAccessories.includes('festival-goggles'))
  assert.deepEqual(catalogue.earAccessories, ['none', 'headphones', 'in-ear'])
  assert.ok(catalogue.gloves.includes('arm-sleeves'))
  assert.deepEqual(catalogue.torsoAccessories, ['none', 'harness'])
})

test('stylized creator validator rejects unknown accessory ids', () => {
  assert.equal(isCueIdStylizedCreatorConfigV1(DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG), true)

  assert.equal(
    isCueIdStylizedCreatorConfigV1({
      ...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
      headwear: 'unknown-hat'
    }),
    false
  )

  assert.equal(
    isCueIdStylizedCreatorConfigV1({
      ...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
      torsoAccessory: 'unknown'
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

test('creator config equality ignores object key order and piercing selection order', () => {
  const left = {
    ...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
    piercings: ['septum', 'ear'] as const
  }
  const right = {
    accessoryColor: DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG.accessoryColor,
    ...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
    piercings: ['ear', 'septum'] as const
  }

  assert.equal(
    cueIdStylizedCreatorConfigsEqual(
      { ...left, piercings: [...left.piercings] },
      { ...right, piercings: [...right.piercings] }
    ),
    true
  )

  assert.equal(
    cueIdStylizedCreatorConfigsEqual(
      { ...left, piercings: [...left.piercings] },
      { ...right, piercings: [...right.piercings], hair: 'mohawk' }
    ),
    false
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

test('body material controller exposes six skin tones', () => {
  assert.deepEqual(Object.keys(CUE_ID_SKIN_TONES), [
    'skin-01',
    'skin-02',
    'skin-03',
    'skin-04',
    'skin-05',
    'skin-06'
  ])

  for (const tone of Object.values(CUE_ID_SKIN_TONES)) {
    assert.match(tone.color, /^#[0-9a-f]{6}$/i)
    assert.ok(tone.tintStrength > 0 && tone.tintStrength <= 1)
  }
})

test('semantic body nodes stay predictable for both bodies', () => {
  assert.deepEqual(CUE_ID_BODY_SEMANTIC_NODES.male, {
    skin: 'cue_male_skin',
    hair: 'cue_male_hair',
    underwear: 'cue_male_underwear'
  })
  assert.deepEqual(CUE_ID_BODY_SEMANTIC_NODES.female, {
    skin: 'cue_female_skin',
    hair: 'cue_female_hair',
    underwear: 'cue_female_underwear'
  })
})

test('source hair visibility follows each approved body master', () => {
  assert.equal(CUE_ID_BODY_SOURCE_HAIR.male, 'fade')
  assert.equal(CUE_ID_BODY_SOURCE_HAIR.female, 'tied-back')

  const male = resolveCueIdBodySemanticState({
    ...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
    body: 'male',
    hair: 'fade'
  })
  assert.equal(male.sourceHairVisible, true)
  assert.equal(male.underwearVisible, true)

  const female = resolveCueIdBodySemanticState({
    ...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
    body: 'female',
    hair: 'tied-back'
  })
  assert.equal(female.sourceHairVisible, true)
  assert.equal(female.underwearVisible, true)

  const bald = resolveCueIdBodySemanticState({
    ...DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG,
    body: 'female',
    hair: 'bald'
  })
  assert.equal(bald.sourceHairVisible, false)
})
