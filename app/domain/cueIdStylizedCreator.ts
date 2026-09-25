import type { CueIdSkinId } from './cueIdCreator.ts'

export type CueIdStylizedBodyId = 'male' | 'female'

export type CueIdStylizedExpressionId =
  | 'neutral'
  | 'smile'
  | 'focused'
  | 'confident'
  | 'playful'

export type CueIdStylizedEyeColorId =
  | 'blue'
  | 'green'
  | 'hazel'
  | 'dark'

export type CueIdStylizedContactLensId =
  | 'none'
  | 'ice'
  | 'white'
  | 'red'

export type CueIdStylizedHairId =
  | 'bald'
  | 'shaved'
  | 'mohawk'
  | 'fade'
  | 'crop'
  | 'curly'
  | 'bob'
  | 'tied-back'
  | 'locs'

export type CueIdStylizedHairColorId =
  | 'black'
  | 'dark-brown'
  | 'brown'
  | 'blond'
  | 'platinum'
  | 'red'
  | 'blue'

export type CueIdStylizedFacialHairId =
  | 'none'
  | 'stubble'
  | 'moustache'
  | 'short-beard'
  | 'full-beard'

export type CueIdStylizedPiercingId =
  | 'ear'
  | 'septum'
  | 'nostril'
  | 'eyebrow'

export type CueIdStylizedHeadwearId =
  | 'none'
  | 'cap'
  | 'beanie'
  | 'top-hat'
  | 'festival-hood'

export type CueIdStylizedFaceAccessoryId =
  | 'none'
  | 'mask'
  | 'venetian-mask'
  | 'sunglasses'
  | 'festival-goggles'

export type CueIdStylizedEarAccessoryId =
  | 'none'
  | 'headphones'
  | 'in-ear'

export type CueIdStylizedGlovesId =
  | 'none'
  | 'short-gloves'
  | 'long-gloves'
  | 'arm-sleeves'

export type CueIdStylizedTorsoAccessoryId =
  | 'none'
  | 'harness'

export type CueIdStylizedNeckAccessoryId =
  | 'none'
  | 'chain'
  | 'choker'
  | 'scarf'
  | 'bandana'

export type CueIdStylizedTopId =
  | 'tee'
  | 'tank'
  | 'sweatshirt'
  | 'hoodie'
  | 'bomber'
  | 'mesh-top'
  | 'festival-top'

export type CueIdStylizedBottomId =
  | 'wide-trouser'
  | 'straight-trouser'
  | 'cargo'
  | 'shorts'
  | 'skirt'
  | 'utility-trouser'
  | 'harem-trouser'
  | 'festival-wrap'

export type CueIdStylizedOnePieceId =
  | 'none'
  | 'jumpsuit'
  | 'bodysuit'
  | 'festival-outfit'

export type CueIdStylizedFootwearId =
  | 'vans-style'
  | 'technical-sneaker'
  | 'boot'
  | 'platform-boot'
  | 'sandal'

export type CueIdStylizedMakeupId =
  | 'none'
  | 'soft'
  | 'eyeliner'
  | 'club'
  | 'festival'

export type CueIdStylizedNailsId =
  | 'natural'
  | 'black'
  | 'red'
  | 'lime'
  | 'purple'
  | 'chrome'

export type CueIdStylizedGarmentColorId =
  | 'black'
  | 'white'
  | 'charcoal'
  | 'grey'
  | 'lime'
  | 'red'
  | 'purple'
  | 'blue'

export type CueIdStylizedCreatorConfigV1 = {
  schemaVersion: 1
  enabled: boolean
  body: CueIdStylizedBodyId
  skin: CueIdSkinId
  expression: CueIdStylizedExpressionId
  eyeColor: CueIdStylizedEyeColorId
  contactLens: CueIdStylizedContactLensId
  hair: CueIdStylizedHairId
  hairColor: CueIdStylizedHairColorId
  facialHair: CueIdStylizedFacialHairId
  piercings: CueIdStylizedPiercingId[]
  headwear: CueIdStylizedHeadwearId
  faceAccessory: CueIdStylizedFaceAccessoryId
  earAccessory: CueIdStylizedEarAccessoryId
  gloves: CueIdStylizedGlovesId
  torsoAccessory: CueIdStylizedTorsoAccessoryId
  neckAccessory: CueIdStylizedNeckAccessoryId
  makeup: CueIdStylizedMakeupId
  nails: CueIdStylizedNailsId
  top: CueIdStylizedTopId
  topColor: CueIdStylizedGarmentColorId
  bottom: CueIdStylizedBottomId
  bottomColor: CueIdStylizedGarmentColorId
  onePiece: CueIdStylizedOnePieceId
  onePieceColor: CueIdStylizedGarmentColorId
  footwear: CueIdStylizedFootwearId
  footwearColor: CueIdStylizedGarmentColorId
  accessoryColor: CueIdStylizedGarmentColorId
}

export const DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG: CueIdStylizedCreatorConfigV1 = {
  schemaVersion: 1,
  enabled: true,
  body: 'male',
  skin: 'skin-03',
  expression: 'neutral',
  eyeColor: 'dark',
  contactLens: 'none',
  hair: 'fade',
  hairColor: 'black',
  facialHair: 'none',
  piercings: [],
  headwear: 'none',
  faceAccessory: 'none',
  earAccessory: 'none',
  gloves: 'none',
  torsoAccessory: 'none',
  neckAccessory: 'none',
  makeup: 'none',
  nails: 'natural',
  top: 'tee',
  topColor: 'black',
  bottom: 'wide-trouser',
  bottomColor: 'black',
  onePiece: 'none',
  onePieceColor: 'black',
  footwear: 'vans-style',
  footwearColor: 'black',
  accessoryColor: 'black'
}

/**
 * One shared catalogue for every body.
 *
 * Body selection controls fitting and previews only. It must never filter which
 * hair, facial hair, makeup, garment, footwear or accessory the person may use.
 */
export const CUE_ID_STYLIZED_CREATOR_CATALOGUE = {
  bodies: ['male', 'female'] as const,
  skins: ['skin-01', 'skin-02', 'skin-03', 'skin-04', 'skin-05', 'skin-06'] as const,
  expressions: ['neutral', 'smile', 'focused', 'confident', 'playful'] as const,
  eyeColors: ['blue', 'green', 'hazel', 'dark'] as const,
  contactLenses: ['none', 'ice', 'white', 'red'] as const,
  hairs: ['bald', 'shaved', 'mohawk', 'fade', 'crop', 'curly', 'bob', 'tied-back', 'locs'] as const,
  hairColors: ['black', 'dark-brown', 'brown', 'blond', 'platinum', 'red', 'blue'] as const,
  facialHair: ['none', 'stubble', 'moustache', 'short-beard', 'full-beard'] as const,
  piercings: ['ear', 'septum', 'nostril', 'eyebrow'] as const,
  headwear: ['none', 'cap', 'beanie', 'top-hat', 'festival-hood'] as const,
  faceAccessories: ['none', 'mask', 'venetian-mask', 'sunglasses', 'festival-goggles'] as const,
  earAccessories: ['none', 'headphones', 'in-ear'] as const,
  gloves: ['none', 'short-gloves', 'long-gloves', 'arm-sleeves'] as const,
  torsoAccessories: ['none', 'harness'] as const,
  neckAccessories: ['none', 'chain', 'choker', 'scarf', 'bandana'] as const,
  makeup: ['none', 'soft', 'eyeliner', 'club', 'festival'] as const,
  nails: ['natural', 'black', 'red', 'lime', 'purple', 'chrome'] as const,
  tops: ['tee', 'tank', 'sweatshirt', 'hoodie', 'bomber', 'mesh-top', 'festival-top'] as const,
  bottoms: ['wide-trouser', 'straight-trouser', 'cargo', 'shorts', 'skirt', 'utility-trouser', 'harem-trouser', 'festival-wrap'] as const,
  onePieces: ['none', 'jumpsuit', 'bodysuit', 'festival-outfit'] as const,
  footwear: ['vans-style', 'technical-sneaker', 'boot', 'platform-boot', 'sandal'] as const,
  garmentColors: ['black', 'white', 'charcoal', 'grey', 'lime', 'red', 'purple', 'blue'] as const
}

function includes<T extends string>(
  values: readonly T[],
  value: unknown
): value is T {
  return typeof value === 'string' && values.includes(value as T)
}

export function normalizeCueIdStylizedPiercings(
  values: readonly CueIdStylizedPiercingId[]
): CueIdStylizedPiercingId[] {
  return [...new Set(values)].slice(0, 3)
}

export function isCueIdStylizedCreatorConfigV1(
  value: unknown
): value is CueIdStylizedCreatorConfigV1 {
  if (!value || typeof value !== 'object') return false

  const config = value as Partial<CueIdStylizedCreatorConfigV1>
  const catalogue = CUE_ID_STYLIZED_CREATOR_CATALOGUE

  return config.schemaVersion === 1
    && typeof config.enabled === 'boolean'
    && includes(catalogue.bodies, config.body)
    && includes(catalogue.skins, config.skin)
    && includes(catalogue.expressions, config.expression)
    && includes(catalogue.eyeColors, config.eyeColor)
    && includes(catalogue.contactLenses, config.contactLens)
    && includes(catalogue.hairs, config.hair)
    && includes(catalogue.hairColors, config.hairColor)
    && includes(catalogue.facialHair, config.facialHair)
    && Array.isArray(config.piercings)
    && config.piercings.length <= 3
    && config.piercings.every(piercing => includes(catalogue.piercings, piercing))
    && new Set(config.piercings).size === config.piercings.length
    && includes(catalogue.headwear, config.headwear)
    && includes(catalogue.faceAccessories, config.faceAccessory)
    && includes(catalogue.earAccessories, config.earAccessory)
    && includes(catalogue.gloves, config.gloves)
    && includes(catalogue.torsoAccessories, config.torsoAccessory)
    && includes(catalogue.neckAccessories, config.neckAccessory)
    && includes(catalogue.makeup, config.makeup)
    && includes(catalogue.nails, config.nails)
    && includes(catalogue.tops, config.top)
    && includes(catalogue.garmentColors, config.topColor)
    && includes(catalogue.bottoms, config.bottom)
    && includes(catalogue.garmentColors, config.bottomColor)
    && includes(catalogue.onePieces, config.onePiece)
    && includes(catalogue.garmentColors, config.onePieceColor)
    && includes(catalogue.footwear, config.footwear)
    && includes(catalogue.garmentColors, config.footwearColor)
    && includes(catalogue.garmentColors, config.accessoryColor)
}

export function cloneCueIdStylizedCreatorConfig(
  config: CueIdStylizedCreatorConfigV1 = DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG
): CueIdStylizedCreatorConfigV1 {
  return {
    ...config,
    piercings: [...config.piercings]
  }
}

export function parseCueIdStylizedCreatorConfigV1(
  raw: string
): CueIdStylizedCreatorConfigV1 | null {
  try {
    const parsed = JSON.parse(raw)
    return isCueIdStylizedCreatorConfigV1(parsed)
      ? cloneCueIdStylizedCreatorConfig(parsed)
      : null
  } catch {
    return null
  }
}

export function cloneValidCueIdStylizedCreatorConfig(
  value: unknown
): CueIdStylizedCreatorConfigV1 | null {
  return isCueIdStylizedCreatorConfigV1(value)
    ? cloneCueIdStylizedCreatorConfig(value)
    : null
}

export function cueIdStylizedCreatorConfigsEqual(
  a: CueIdStylizedCreatorConfigV1,
  b: CueIdStylizedCreatorConfigV1
) {
  const canonical = (config: CueIdStylizedCreatorConfigV1) => [
    config.schemaVersion,
    config.enabled,
    config.body,
    config.skin,
    config.expression,
    config.eyeColor,
    config.contactLens,
    config.hair,
    config.hairColor,
    config.facialHair,
    [...config.piercings].sort(),
    config.headwear,
    config.faceAccessory,
    config.earAccessory,
    config.gloves,
    config.torsoAccessory,
    config.neckAccessory,
    config.makeup,
    config.nails,
    config.top,
    config.topColor,
    config.bottom,
    config.bottomColor,
    config.onePiece,
    config.onePieceColor,
    config.footwear,
    config.footwearColor,
    config.accessoryColor
  ]

  return JSON.stringify(canonical(a)) === JSON.stringify(canonical(b))
}

export type CueIdStylizedBrandMarkId = 'none' | 'cuebooker-symbol'

export type CueIdStylizedBrandPlacementId =
  | 'left-chest'
  | 'sleeve'
  | 'front-center-small'
  | 'pocket'

export type CueIdStylizedBasicsBranding = {
  mark: CueIdStylizedBrandMarkId
  placement: CueIdStylizedBrandPlacementId | null
}

export const CUE_ID_STYLIZED_CUEBOOKER_BASICS = {
  tops: {
    tee: { mark: 'cuebooker-symbol', placement: 'left-chest' },
    sweatshirt: { mark: 'cuebooker-symbol', placement: 'left-chest' },
    hoodie: { mark: 'cuebooker-symbol', placement: 'left-chest' },
    bomber: { mark: 'cuebooker-symbol', placement: 'sleeve' }
  },
  bottoms: {
    'wide-trouser': { mark: 'none', placement: null },
    'straight-trouser': { mark: 'none', placement: null },
    cargo: { mark: 'cuebooker-symbol', placement: 'pocket' }
  },
  headwear: {
    cap: { mark: 'cuebooker-symbol', placement: 'front-center-small' },
    beanie: { mark: 'cuebooker-symbol', placement: 'front-center-small' },
    'top-hat': { mark: 'none', placement: null }
  }
} as const satisfies {
  tops: Partial<Record<CueIdStylizedTopId, CueIdStylizedBasicsBranding>>
  bottoms: Partial<Record<CueIdStylizedBottomId, CueIdStylizedBasicsBranding>>
  headwear: Partial<Record<Exclude<CueIdStylizedHeadwearId, 'none'>, CueIdStylizedBasicsBranding>>
}
