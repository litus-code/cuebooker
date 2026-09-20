import type {
  CueIdAccessoryId,
  CueIdBaseId,
  CueIdBuildId,
  CueIdConfigV1,
  CueIdMaterialId,
  CueIdOutfitId,
  CueIdPoseId
} from './cueId.ts'

export type CueIdStaticVariantKey =
  `${CueIdBaseId}__${CueIdBuildId}__${CueIdOutfitId}__${string}__${CueIdPoseId}__${CueIdMaterialId}__${string}`

export type CueIdStaticVariant = {
  portrait: string
  square: string
}

export type CueIdStaticVariantCapabilities = {
  bases: CueIdBaseId[]
  builds: CueIdBuildId[]
  outfits: CueIdOutfitId[]
  accessories: CueIdAccessoryId[]
  poses: CueIdPoseId[]
  materials: CueIdMaterialId[]
  accents: Array<'lime' | 'red' | null>
}

function token(value: string | null) {
  return value ?? 'none'
}

export function createCueIdStaticVariantKey(
  config: Pick<
    CueIdConfigV1,
    'base' | 'build' | 'outfit' | 'accessory' | 'pose' | 'material' | 'accent'
  >
): CueIdStaticVariantKey {
  return [
    config.base,
    config.build,
    config.outfit,
    token(config.accessory),
    config.pose,
    config.material,
    token(config.accent)
  ].join('__') as CueIdStaticVariantKey
}

export function listCueIdRequiredStaticVariantKeys(
  capabilities: CueIdStaticVariantCapabilities
): CueIdStaticVariantKey[] {
  const keys: CueIdStaticVariantKey[] = []

  for (const base of capabilities.bases) {
    for (const build of capabilities.builds) {
      for (const outfit of capabilities.outfits) {
        for (const accessory of capabilities.accessories) {
          for (const pose of capabilities.poses) {
            for (const material of capabilities.materials) {
              for (const accent of capabilities.accents) {
                keys.push(createCueIdStaticVariantKey({
                  base,
                  build,
                  outfit,
                  accessory,
                  pose,
                  material,
                  accent
                }))
              }
            }
          }
        }
      }
    }
  }

  return keys
}

export type CueIdStaticRenderPlanEntry = {
  key: CueIdStaticVariantKey
  portrait: string
  square: string
}

export function createCueIdStaticRenderPlan(
  capabilities: CueIdStaticVariantCapabilities,
  options: {
    assetVersion: string
    basePath?: string
  }
): CueIdStaticRenderPlanEntry[] {
  const basePath = (options.basePath || '/cue-id/production/static').replace(/\/$/, '')

  return listCueIdRequiredStaticVariantKeys(capabilities).map(key => ({
    key,
    portrait: `${basePath}/${options.assetVersion}/${key}-portrait.webp`,
    square: `${basePath}/${options.assetVersion}/${key}-square.webp`
  }))
}
