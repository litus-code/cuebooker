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
  | 'buzz'
  | 'crop'
  | 'curly'
  | 'bob'
  | 'locs'

export type CueIdStylizedHairColorId =
  | 'black'
  | 'brown'
  | 'blond'
  | 'red'
  | 'platinum'

export type CueIdStylizedFacialHairId =
  | 'none'
  | 'stubble'
  | 'moustache'
  | 'beard'

export type CueIdStylizedPiercingId =
  | 'ear'
  | 'septum'
  | 'nostril'
  | 'eyebrow'

export type CueIdStylizedTopId =
  | 'tee'
  | 'tank'
  | 'sweatshirt'
  | 'hoodie'
  | 'bomber'

export type CueIdStylizedBottomId =
  | 'wide-trouser'
  | 'straight-trouser'
  | 'cargo'
  | 'shorts'
  | 'denim'

export type CueIdStylizedOnePieceId = 'none' | 'jumpsuit'

export type CueIdStylizedFootwearId =
  | 'minimal-sneaker'
  | 'technical-sneaker'
  | 'boot'

export type CueIdStylizedGarmentColorId =
  | 'black'
  | 'white'
  | 'charcoal'
  | 'lime'
  | 'red'
  | 'purple'

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
  top: CueIdStylizedTopId
  topColor: CueIdStylizedGarmentColorId
  bottom: CueIdStylizedBottomId
  bottomColor: CueIdStylizedGarmentColorId
  onePiece: CueIdStylizedOnePieceId
  onePieceColor: CueIdStylizedGarmentColorId
  footwear: CueIdStylizedFootwearId
  footwearColor: CueIdStylizedGarmentColorId
}

export const DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG: CueIdStylizedCreatorConfigV1 = {
  schemaVersion: 1,
  enabled: true,
  body: 'male',
  skin: 'skin-03',
  expression: 'neutral',
  eyeColor: 'dark',
  contactLens: 'none',
  hair: 'crop',
  hairColor: 'black',
  facialHair: 'none',
  piercings: [],
  top: 'tee',
  topColor: 'black',
  bottom: 'wide-trouser',
  bottomColor: 'black',
  onePiece: 'none',
  onePieceColor: 'black',
  footwear: 'minimal-sneaker',
  footwearColor: 'black'
}

export const CUE_ID_STYLIZED_CREATOR_CATALOGUE = {
  bodies: ['male', 'female'] as const,
  skins: ['skin-01', 'skin-02', 'skin-03', 'skin-04', 'skin-05', 'skin-06'] as const,
  expressions: ['neutral', 'smile', 'focused', 'confident', 'playful'] as const,
  eyeColors: ['blue', 'green', 'hazel', 'dark'] as const,
  contactLenses: ['none', 'ice', 'white', 'red'] as const,
  hairs: ['buzz', 'crop', 'curly', 'bob', 'locs'] as const,
  hairColors: ['black', 'brown', 'blond', 'red', 'platinum'] as const,
  facialHair: ['none', 'stubble', 'moustache', 'beard'] as const,
  piercings: ['ear', 'septum', 'nostril', 'eyebrow'] as const,
  tops: ['tee', 'tank', 'sweatshirt', 'hoodie', 'bomber'] as const,
  bottoms: ['wide-trouser', 'straight-trouser', 'cargo', 'shorts', 'denim'] as const,
  onePieces: ['none', 'jumpsuit'] as const,
  footwear: ['minimal-sneaker', 'technical-sneaker', 'boot'] as const,
  garmentColors: ['black', 'white', 'charcoal', 'lime', 'red', 'purple'] as const
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
    && includes(catalogue.tops, config.top)
    && includes(catalogue.garmentColors, config.topColor)
    && includes(catalogue.bottoms, config.bottom)
    && includes(catalogue.garmentColors, config.bottomColor)
    && includes(catalogue.onePieces, config.onePiece)
    && includes(catalogue.garmentColors, config.onePieceColor)
    && includes(catalogue.footwear, config.footwear)
    && includes(catalogue.garmentColors, config.footwearColor)
}

export function cloneCueIdStylizedCreatorConfig(
  config: CueIdStylizedCreatorConfigV1 = DEFAULT_CUE_ID_STYLIZED_CREATOR_CONFIG
): CueIdStylizedCreatorConfigV1 {
  return {
    ...config,
    piercings: [...config.piercings]
  }
}
