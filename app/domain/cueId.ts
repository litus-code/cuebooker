export type CueIdFamilyId = 'club_minimal'
export type CueIdBaseId = 'masculine' | 'feminine' | 'neutral'
export type CueIdBuildId = 'slim' | 'regular' | 'strong'
export type CueIdOutfitId = 'tank' | 'tee' | 'hoodie' | 'bomber'
export type CueIdAccessoryId = 'headphones' | 'cap' | 'glasses' | null
export type CueIdPoseId = 'neutral' | 'relaxed' | 'focused' | 'editorial'
export type CueIdMaterialId = 'matte' | 'satin'

export type CueIdConfigV1 = {
  schemaVersion: 1
  enabled: boolean
  family: CueIdFamilyId
  base: CueIdBaseId
  build: CueIdBuildId
  outfit: CueIdOutfitId
  accessory: CueIdAccessoryId
  pose: CueIdPoseId
  material: CueIdMaterialId
  accent: 'lime' | 'red' | null
}

export type CueIdOption<T extends string | null> = {
  id: T
  label: { es: string; en: string }
  description?: { es: string; en: string }
}

export type CueIdCatalogue = {
  family: CueIdFamilyId
  bases: CueIdOption<CueIdBaseId>[]
  builds: CueIdOption<CueIdBuildId>[]
  outfits: CueIdOption<CueIdOutfitId>[]
  accessories: CueIdOption<CueIdAccessoryId>[]
  poses: CueIdOption<CueIdPoseId>[]
  materials: CueIdOption<CueIdMaterialId>[]
}

export const DEFAULT_CUE_ID_CONFIG: CueIdConfigV1 = {
  schemaVersion: 1,
  enabled: true,
  family: 'club_minimal',
  base: 'neutral',
  build: 'regular',
  outfit: 'tee',
  accessory: null,
  pose: 'neutral',
  material: 'matte',
  accent: 'lime'
}

export const CLUB_MINIMAL_CATALOGUE: CueIdCatalogue = {
  family: 'club_minimal',
  bases: [
    { id: 'masculine', label: { es: 'Masculina', en: 'Masculine' } },
    { id: 'feminine', label: { es: 'Femenina', en: 'Feminine' } },
    { id: 'neutral', label: { es: 'Neutra', en: 'Neutral' } }
  ],
  builds: [
    { id: 'slim', label: { es: 'Slim', en: 'Slim' } },
    { id: 'regular', label: { es: 'Regular', en: 'Regular' } },
    { id: 'strong', label: { es: 'Fuerte', en: 'Strong' } }
  ],
  outfits: [
    { id: 'tank', label: { es: 'Tank', en: 'Tank' } },
    { id: 'tee', label: { es: 'Camiseta', en: 'T-shirt' } },
    { id: 'hoodie', label: { es: 'Hoodie', en: 'Hoodie' } },
    { id: 'bomber', label: { es: 'Bomber', en: 'Bomber' } }
  ],
  accessories: [
    { id: null, label: { es: 'Ninguno', en: 'None' } },
    { id: 'headphones', label: { es: 'Auriculares', en: 'Headphones' } },
    { id: 'cap', label: { es: 'Gorra', en: 'Cap' } },
    { id: 'glasses', label: { es: 'Gafas', en: 'Glasses' } }
  ],
  poses: [
    { id: 'neutral', label: { es: 'Neutral', en: 'Neutral' } },
    { id: 'relaxed', label: { es: 'Relajada', en: 'Relaxed' } },
    { id: 'focused', label: { es: 'Concentrada', en: 'Focused' } },
    { id: 'editorial', label: { es: 'Editorial', en: 'Editorial' } }
  ],
  materials: [
    { id: 'matte', label: { es: 'Mate', en: 'Matte' } },
    { id: 'satin', label: { es: 'Satinado', en: 'Satin' } }
  ]
}

export function cloneCueIdConfig(config: CueIdConfigV1 = DEFAULT_CUE_ID_CONFIG): CueIdConfigV1 {
  return { ...config }
}
