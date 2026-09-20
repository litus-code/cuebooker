import type {
  CueIdAccessoryId,
  CueIdBaseId,
  CueIdBuildId,
  CueIdFamilyId,
  CueIdMaterialId,
  CueIdOutfitId,
  CueIdPoseId
} from './cueId'
import type { CueIdDeviceTier } from './cueIdAssets'
import {
  listCueIdRequiredStaticVariantKeys,
  type CueIdStaticVariant,
  type CueIdStaticVariantKey
} from './cueIdStaticVariants.ts'

export type CueIdProductionManifestMetrics = {
  compressedBytes: number
  triangles: number
  materials: number
  textures: number
  largestTextureDimension: number
}

export type CueIdProductionStaticAssets = {
  variants: Partial<Record<CueIdStaticVariantKey, CueIdStaticVariant>>
  editorialTransparent?: string | null
}

export type CueIdProductionCapabilities = {
  bases: CueIdBaseId[]
  builds: CueIdBuildId[]
  outfits: CueIdOutfitId[]
  accessories: CueIdAccessoryId[]
  poses: CueIdPoseId[]
  materials: CueIdMaterialId[]
  accents: Array<'lime' | 'red' | null>
}

export type CueIdProductionBindings = {
  morphs?: Partial<Record<
    | `base.${CueIdBaseId}`
    | `build.${CueIdBuildId}`,
    string
  >>
  poses?: Partial<Record<CueIdPoseId, string>>
  outfits?: Partial<Record<CueIdOutfitId, string[]>>
  accessories?: Partial<Record<Exclude<CueIdAccessoryId, null>, string[]>>
  materials?: Partial<Record<'body' | 'textile' | 'technical' | 'accent', string>>
}

export type CueIdProductionManifest = {
  manifestVersion: 1
  family: CueIdFamilyId
  assetVersion: string
  glbPath: string
  static: CueIdProductionStaticAssets
  metrics: CueIdProductionManifestMetrics
  supportedTiers: Array<Exclude<CueIdDeviceTier, 'static'>>
  capabilities: CueIdProductionCapabilities
  bindings: CueIdProductionBindings
}

export type CueIdProductionManifestIssue = {
  field:
    | 'manifestVersion'
    | 'assetVersion'
    | 'glbPath'
    | 'static'
    | 'metrics'
    | 'supportedTiers'
    | 'capabilities'
  message: string
}

const REQUIRED_BASES: CueIdBaseId[] = ['feminine', 'masculine', 'neutral']
const REQUIRED_BUILDS: CueIdBuildId[] = ['slim', 'regular', 'strong']
const REQUIRED_POSES: CueIdPoseId[] = ['neutral', 'relaxed', 'focused', 'editorial']

function includesAll<T>(values: T[], required: T[]) {
  return required.every(value => values.includes(value))
}

export function validateCueIdProductionManifest(
  manifest: CueIdProductionManifest
): CueIdProductionManifestIssue[] {
  const issues: CueIdProductionManifestIssue[] = []

  if (manifest.manifestVersion !== 1) {
    issues.push({
      field: 'manifestVersion',
      message: 'CUE ID production manifest must use manifestVersion 1'
    })
  }

  if (!manifest.assetVersion.trim()) {
    issues.push({
      field: 'assetVersion',
      message: 'CUE ID production manifest requires an assetVersion'
    })
  }

  if (!manifest.glbPath.startsWith('/')) {
    issues.push({
      field: 'glbPath',
      message: 'CUE ID production GLB path must be application-owned'
    })
  }

  const requiredStaticKeys = listCueIdRequiredStaticVariantKeys(manifest.capabilities)
  const missingStaticKeys = requiredStaticKeys.filter(key => !manifest.static.variants[key])
  const invalidStaticPath = Object.values(manifest.static.variants).some(variant =>
    !variant
    || !variant.portrait.startsWith('/')
    || !variant.square.startsWith('/')
  )

  if (missingStaticKeys.length || invalidStaticPath) {
    issues.push({
      field: 'static',
      message: missingStaticKeys.length
        ? `CUE ID static variants are missing ${missingStaticKeys.length} supported semantic configurations`
        : 'CUE ID static variant paths must be application-owned'
    })
  }

  if (
    manifest.metrics.compressedBytes <= 0
    || manifest.metrics.compressedBytes > 1_000_000
    || manifest.metrics.triangles <= 0
    || manifest.metrics.triangles > 35_000
    || manifest.metrics.materials <= 0
    || manifest.metrics.materials > 4
    || manifest.metrics.textures < 0
    || manifest.metrics.textures > 6
    || manifest.metrics.largestTextureDimension < 0
    || manifest.metrics.largestTextureDimension > 2048
  ) {
    issues.push({
      field: 'metrics',
      message: 'CUE ID production asset exceeds the base asset budget'
    })
  }

  if (!manifest.supportedTiers.length || manifest.supportedTiers.includes('static' as never)) {
    issues.push({
      field: 'supportedTiers',
      message: 'CUE ID production GLB must target interactive tiers only'
    })
  }

  if (
    !includesAll(manifest.capabilities.bases, REQUIRED_BASES)
    || !includesAll(manifest.capabilities.builds, REQUIRED_BUILDS)
    || !includesAll(manifest.capabilities.poses, REQUIRED_POSES)
    || !manifest.capabilities.outfits.includes('tee')
    || !manifest.capabilities.materials.includes('matte')
  ) {
    issues.push({
      field: 'capabilities',
      message: 'CUE ID production manifest is missing required V2 semantic capabilities'
    })
  }

  return issues
}


export type CueIdProductionBindingIssue = {
  field: 'base' | 'build' | 'pose' | 'outfit' | 'material'
  message: string
}

export function validateCueIdProductionInteractiveBindings(
  manifest: CueIdProductionManifest
): CueIdProductionBindingIssue[] {
  const issues: CueIdProductionBindingIssue[] = []
  const morphs = manifest.bindings.morphs || {}
  const poses = manifest.bindings.poses || {}
  const outfits = manifest.bindings.outfits || {}
  const materials = manifest.bindings.materials || {}

  if (!morphs['base.feminine'] || !morphs['base.masculine']) {
    issues.push({
      field: 'base',
      message: 'Interactive CUE ID V2 requires feminine and masculine authored base bindings'
    })
  }

  if (!morphs['build.slim'] || !morphs['build.strong']) {
    issues.push({
      field: 'build',
      message: 'Interactive CUE ID V2 requires slim and strong authored build bindings'
    })
  }

  for (const pose of REQUIRED_POSES) {
    if (!poses[pose]) {
      issues.push({
        field: 'pose',
        message: `Interactive CUE ID V2 requires pose binding "${pose}"`
      })
    }
  }

  if (!outfits.tee?.length) {
    issues.push({
      field: 'outfit',
      message: 'Interactive CUE ID V2 requires an editorial tee binding'
    })
  }

  if (!materials.body || !materials.textile) {
    issues.push({
      field: 'material',
      message: 'Interactive CUE ID V2 requires body and textile material bindings'
    })
  }

  return issues
}

export function isCueIdProductionInteractiveReady(manifest: CueIdProductionManifest) {
  return validateCueIdProductionManifest(manifest).length === 0
    && validateCueIdProductionInteractiveBindings(manifest).length === 0
}

export function assertCueIdProductionManifest(manifest: CueIdProductionManifest) {
  const issues = validateCueIdProductionManifest(manifest)
  if (issues.length) {
    throw new Error(issues.map(issue => issue.message).join('; '))
  }
  return manifest
}
