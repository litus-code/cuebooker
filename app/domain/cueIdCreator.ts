import {
  DEFAULT_CUE_ID_CONFIG,
  type CueIdAccessoryId,
  type CueIdBaseId,
  type CueIdBuildId,
  type CueIdConfigV1,
  type CueIdMaterialId,
  type CueIdPoseId
} from './cueId.ts'

export type CueIdSkinId =
  | 'skin-01'
  | 'skin-02'
  | 'skin-03'
  | 'skin-04'
  | 'skin-05'
  | 'skin-06'

export type CueIdFaceId =
  | 'face-01'
  | 'face-02'
  | 'face-03'
  | 'face-04'
  | 'face-05'
  | 'face-06'

export type CueIdHairId =
  | 'buzz'
  | 'textured-crop'
  | 'curly-crop'
  | 'curtains'
  | 'bob'
  | 'tied-back'
  | 'locs'
  | 'long-natural'

export type CueIdFacialHairId =
  | 'none'
  | 'stubble'
  | 'short-beard'
  | 'moustache'

export type CueIdTopId =
  | 'oversized-tee'
  | 'fitted-tee'
  | 'tank'
  | 'hoodie'
  | 'bomber'

export type CueIdBottomId =
  | 'wide-trouser'
  | 'straight-trouser'
  | 'cargo'
  | 'denim'

export type CueIdFootwearId =
  | 'technical-sneaker'
  | 'minimal-sneaker'
  | 'boot'

export type CueIdCreatorConfigV1 = {
  schemaVersion: 1
  enabled: boolean
  base: CueIdBaseId
  build: CueIdBuildId
  skin: CueIdSkinId
  face: CueIdFaceId
  hair: CueIdHairId
  facialHair: CueIdFacialHairId
  top: CueIdTopId
  bottom: CueIdBottomId
  footwear: CueIdFootwearId
  accessory: CueIdAccessoryId
  pose: CueIdPoseId
  material: CueIdMaterialId
  accent: 'lime' | 'red' | null
}

export type CueIdCreatorOption<T extends string | null> = {
  id: T
  label: { es: string; en: string }
}

export const DEFAULT_CUE_ID_CREATOR_CONFIG: CueIdCreatorConfigV1 = {
  schemaVersion: 1,
  enabled: true,
  base: 'neutral',
  build: 'regular',
  skin: 'skin-03',
  face: 'face-03',
  hair: 'textured-crop',
  facialHair: 'none',
  top: 'oversized-tee',
  bottom: 'wide-trouser',
  footwear: 'technical-sneaker',
  accessory: null,
  pose: 'neutral',
  material: 'matte',
  accent: 'lime'
}

export const CUE_ID_CREATOR_CATALOGUE = {
  bases: [
    { id: 'feminine', label: { es: 'Femenina', en: 'Feminine' } },
    { id: 'neutral', label: { es: 'Neutra', en: 'Neutral' } },
    { id: 'masculine', label: { es: 'Masculina', en: 'Masculine' } }
  ] satisfies CueIdCreatorOption<CueIdBaseId>[],
  builds: [
    { id: 'slim', label: { es: 'Slim', en: 'Slim' } },
    { id: 'regular', label: { es: 'Regular', en: 'Regular' } },
    { id: 'strong', label: { es: 'Strong', en: 'Strong' } }
  ] satisfies CueIdCreatorOption<CueIdBuildId>[],
  skins: [
    { id: 'skin-01', label: { es: 'Piel 01', en: 'Skin 01' } },
    { id: 'skin-02', label: { es: 'Piel 02', en: 'Skin 02' } },
    { id: 'skin-03', label: { es: 'Piel 03', en: 'Skin 03' } },
    { id: 'skin-04', label: { es: 'Piel 04', en: 'Skin 04' } },
    { id: 'skin-05', label: { es: 'Piel 05', en: 'Skin 05' } },
    { id: 'skin-06', label: { es: 'Piel 06', en: 'Skin 06' } }
  ] satisfies CueIdCreatorOption<CueIdSkinId>[],
  faces: [
    { id: 'face-01', label: { es: 'Rostro 01', en: 'Face 01' } },
    { id: 'face-02', label: { es: 'Rostro 02', en: 'Face 02' } },
    { id: 'face-03', label: { es: 'Rostro 03', en: 'Face 03' } },
    { id: 'face-04', label: { es: 'Rostro 04', en: 'Face 04' } },
    { id: 'face-05', label: { es: 'Rostro 05', en: 'Face 05' } },
    { id: 'face-06', label: { es: 'Rostro 06', en: 'Face 06' } }
  ] satisfies CueIdCreatorOption<CueIdFaceId>[],
  hairs: [
    { id: 'buzz', label: { es: 'Buzz', en: 'Buzz' } },
    { id: 'textured-crop', label: { es: 'Crop texturizado', en: 'Textured crop' } },
    { id: 'curly-crop', label: { es: 'Rizo corto', en: 'Curly crop' } },
    { id: 'curtains', label: { es: 'Curtains', en: 'Curtains' } },
    { id: 'bob', label: { es: 'Bob', en: 'Bob' } },
    { id: 'tied-back', label: { es: 'Recogido', en: 'Tied back' } },
    { id: 'locs', label: { es: 'Locs', en: 'Locs' } },
    { id: 'long-natural', label: { es: 'Largo natural', en: 'Long natural' } }
  ] satisfies CueIdCreatorOption<CueIdHairId>[],
  facialHair: [
    { id: 'none', label: { es: 'Sin barba', en: 'None' } },
    { id: 'stubble', label: { es: 'Sombra', en: 'Stubble' } },
    { id: 'short-beard', label: { es: 'Barba corta', en: 'Short beard' } },
    { id: 'moustache', label: { es: 'Bigote', en: 'Moustache' } }
  ] satisfies CueIdCreatorOption<CueIdFacialHairId>[],
  tops: [
    { id: 'oversized-tee', label: { es: 'Tee oversized', en: 'Oversized tee' } },
    { id: 'fitted-tee', label: { es: 'Tee fitted', en: 'Fitted tee' } },
    { id: 'tank', label: { es: 'Tank', en: 'Tank' } },
    { id: 'hoodie', label: { es: 'Hoodie', en: 'Hoodie' } },
    { id: 'bomber', label: { es: 'Bomber', en: 'Bomber' } }
  ] satisfies CueIdCreatorOption<CueIdTopId>[],
  bottoms: [
    { id: 'wide-trouser', label: { es: 'Wide trouser', en: 'Wide trouser' } },
    { id: 'straight-trouser', label: { es: 'Straight trouser', en: 'Straight trouser' } },
    { id: 'cargo', label: { es: 'Cargo', en: 'Cargo' } },
    { id: 'denim', label: { es: 'Denim', en: 'Denim' } }
  ] satisfies CueIdCreatorOption<CueIdBottomId>[],
  footwear: [
    { id: 'technical-sneaker', label: { es: 'Sneaker técnica', en: 'Technical sneaker' } },
    { id: 'minimal-sneaker', label: { es: 'Sneaker minimal', en: 'Minimal sneaker' } },
    { id: 'boot', label: { es: 'Bota', en: 'Boot' } }
  ] satisfies CueIdCreatorOption<CueIdFootwearId>[],
  accessories: [
    { id: null, label: { es: 'Ninguno', en: 'None' } },
    { id: 'glasses', label: { es: 'Gafas', en: 'Glasses' } },
    { id: 'cap', label: { es: 'Gorra', en: 'Cap' } },
    { id: 'headphones', label: { es: 'Auriculares', en: 'Headphones' } }
  ] satisfies CueIdCreatorOption<CueIdAccessoryId>[],
  poses: [
    { id: 'neutral', label: { es: 'Neutral', en: 'Neutral' } },
    { id: 'relaxed', label: { es: 'Relajada', en: 'Relaxed' } },
    { id: 'focused', label: { es: 'Concentrada', en: 'Focused' } },
    { id: 'editorial', label: { es: 'Editorial', en: 'Editorial' } }
  ] satisfies CueIdCreatorOption<CueIdPoseId>[],
  materials: [
    { id: 'matte', label: { es: 'Mate', en: 'Matte' } },
    { id: 'satin', label: { es: 'Satinado', en: 'Satin' } }
  ] satisfies CueIdCreatorOption<CueIdMaterialId>[],
  accents: [
    { id: 'lime', label: { es: 'Lima', en: 'Lime' } },
    { id: 'red', label: { es: 'Rojo', en: 'Red' } },
    { id: null, label: { es: 'Sin acento', en: 'No accent' } }
  ] satisfies CueIdCreatorOption<'lime' | 'red' | null>[]
}

export function cloneCueIdCreatorConfig(
  config: CueIdCreatorConfigV1 = DEFAULT_CUE_ID_CREATOR_CONFIG
): CueIdCreatorConfigV1 {
  return { ...config }
}

export function cueIdCreatorToRuntimeConfig(config: CueIdCreatorConfigV1): CueIdConfigV1 {
  const outfit: CueIdConfigV1['outfit'] =
    config.top === 'hoodie'
      ? 'hoodie'
      : config.top === 'bomber'
        ? 'bomber'
        : config.top === 'tank'
          ? 'tank'
          : 'tee'

  return {
    ...DEFAULT_CUE_ID_CONFIG,
    enabled: config.enabled,
    base: config.base,
    build: config.build,
    outfit,
    accessory: config.accessory,
    pose: config.pose,
    material: config.material,
    accent: config.accent
  }
}


function catalogueHas<T extends string | null>(
  options: ReadonlyArray<CueIdCreatorOption<T>>,
  value: unknown
): value is T {
  return options.some(option => option.id === value)
}

export function isCueIdCreatorConfigV1(value: unknown): value is CueIdCreatorConfigV1 {
  if (!value || typeof value !== 'object') return false

  const config = value as Partial<Record<keyof CueIdCreatorConfigV1, unknown>>

  return config.schemaVersion === 1
    && typeof config.enabled === 'boolean'
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.bases, config.base)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.builds, config.build)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.skins, config.skin)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.faces, config.face)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.hairs, config.hair)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.facialHair, config.facialHair)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.tops, config.top)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.bottoms, config.bottom)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.footwear, config.footwear)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.accessories, config.accessory)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.poses, config.pose)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.materials, config.material)
    && catalogueHas(CUE_ID_CREATOR_CATALOGUE.accents, config.accent)
}
