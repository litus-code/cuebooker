export type CueIdDeviceTier = 'full' | 'reduced' | 'static'

export type CueIdAssetBudget = {
  maxCompressedBytes: number
  maxTriangles: number
  maxMaterials: number
  maxTextures: number
  maxTextureDimension: number
}

export type CueIdAssetDescriptor = {
  id: string
  family: 'club_minimal'
  purpose: 'production' | 'candidate' | 'benchmark'
  artDirection: 'club_minimal_v1' | 'external_benchmark'
  kind: 'base' | 'outfit' | 'accessory'
  glbPath: string
  fallbackPath?: string | null
  compressedBytes: number
  triangles: number
  materials: number
  textures: Array<{
    width: number
    height: number
    format: 'webp' | 'ktx2' | 'png' | 'jpg'
  }>
  supportedTiers: CueIdDeviceTier[]
  attribution?: {
    creator: string
    license: string
    source: string
  } | null
}

export const CUE_ID_ASSET_BUDGETS: Record<'base' | 'outfit' | 'accessory', CueIdAssetBudget> = {
  base: {
    maxCompressedBytes: 1_000_000,
    maxTriangles: 35_000,
    maxMaterials: 4,
    maxTextures: 6,
    maxTextureDimension: 2048
  },
  outfit: {
    maxCompressedBytes: 450_000,
    maxTriangles: 16_000,
    maxMaterials: 3,
    maxTextures: 4,
    maxTextureDimension: 2048
  },
  accessory: {
    maxCompressedBytes: 180_000,
    maxTriangles: 6_000,
    maxMaterials: 2,
    maxTextures: 2,
    maxTextureDimension: 1024
  }
}

export type CueIdAssetHeadroom = {
  bytesRemaining: number
  trianglesRemaining: number
  materialsRemaining: number
  texturesRemaining: number
  byteUsageRatio: number
  triangleUsageRatio: number
}

export function getCueIdAssetHeadroom(asset: CueIdAssetDescriptor): CueIdAssetHeadroom {
  const budget = CUE_ID_ASSET_BUDGETS[asset.kind]

  return {
    bytesRemaining: Math.max(0, budget.maxCompressedBytes - asset.compressedBytes),
    trianglesRemaining: Math.max(0, budget.maxTriangles - asset.triangles),
    materialsRemaining: Math.max(0, budget.maxMaterials - asset.materials),
    texturesRemaining: Math.max(0, budget.maxTextures - asset.textures.length),
    byteUsageRatio: asset.compressedBytes / budget.maxCompressedBytes,
    triangleUsageRatio: asset.triangles / budget.maxTriangles
  }
}

export type CueIdAssetValidationIssue = {
  field: 'compressedBytes' | 'triangles' | 'materials' | 'textures' | 'textureDimension' | 'supportedTiers'
  message: string
}

export function validateCueIdAsset(asset: CueIdAssetDescriptor): CueIdAssetValidationIssue[] {
  const budget = CUE_ID_ASSET_BUDGETS[asset.kind]
  const issues: CueIdAssetValidationIssue[] = []

  if (asset.compressedBytes > budget.maxCompressedBytes) {
    issues.push({
      field: 'compressedBytes',
      message: `${asset.id}: compressed GLB exceeds ${budget.maxCompressedBytes} bytes`
    })
  }

  if (asset.triangles > budget.maxTriangles) {
    issues.push({
      field: 'triangles',
      message: `${asset.id}: triangle count exceeds ${budget.maxTriangles}`
    })
  }

  if (asset.materials > budget.maxMaterials) {
    issues.push({
      field: 'materials',
      message: `${asset.id}: material count exceeds ${budget.maxMaterials}`
    })
  }

  if (asset.textures.length > budget.maxTextures) {
    issues.push({
      field: 'textures',
      message: `${asset.id}: texture count exceeds ${budget.maxTextures}`
    })
  }

  const oversizedTexture = asset.textures.find(texture =>
    Math.max(texture.width, texture.height) > budget.maxTextureDimension
  )

  if (oversizedTexture) {
    issues.push({
      field: 'textureDimension',
      message: `${asset.id}: texture exceeds ${budget.maxTextureDimension}px`
    })
  }

  if (asset.purpose === 'production' && asset.artDirection !== 'club_minimal_v1') {
    issues.push({
      field: 'supportedTiers',
      message: `${asset.id}: production assets must use club_minimal_v1 art direction`
    })
  }

  if (!asset.supportedTiers.length || asset.supportedTiers.includes('static')) {
    issues.push({
      field: 'supportedTiers',
      message: `${asset.id}: GLB assets must target interactive tiers only`
    })
  }

  return issues
}

export function assertCueIdAsset(asset: CueIdAssetDescriptor) {
  const issues = validateCueIdAsset(asset)
  if (issues.length) {
    throw new Error(issues.map(issue => issue.message).join('; '))
  }
  return asset
}

// Intentionally empty until a real art-directed asset is accepted.
// Do not add placeholders here just to make the catalogue look populated.
export const CUE_ID_ASSETS: CueIdAssetDescriptor[] = []


export const CUE_ID_BENCHMARK_ASSET: CueIdAssetDescriptor = {
  id: 'khronos-rigged-figure-benchmark',
  family: 'club_minimal',
  purpose: 'benchmark',
  artDirection: 'external_benchmark',
  kind: 'base',
  glbPath: '/cue-id/benchmarks/rigged-figure.glb',
  fallbackPath: null,
  compressedBytes: 50_116,
  triangles: 0,
  materials: 0,
  textures: [],
  supportedTiers: ['full', 'reduced'],
  attribution: {
    creator: 'Cesium',
    license: 'CC-BY-4.0',
    source: 'KhronosGroup/glTF-Sample-Assets/Models/RiggedFigure'
  }
}


export type CueIdCandidateQuality = 'light' | 'medium' | 'high'

export const CUE_ID_CANDIDATE_ASSETS: Record<CueIdCandidateQuality, CueIdAssetDescriptor> = {
  light: {
    id: 'club-minimal-candidate-light-v1',
    family: 'club_minimal',
    purpose: 'candidate',
    artDirection: 'club_minimal_v1',
    kind: 'base',
    glbPath: '/cue-id/candidates/club-minimal-candidate-v1.glb',
    fallbackPath: null,
    compressedBytes: 66_100,
    triangles: 4_400,
    materials: 4,
    textures: [],
    supportedTiers: ['full', 'reduced'],
    attribution: null
  },
  medium: {
    id: 'club-minimal-candidate-medium-v1',
    family: 'club_minimal',
    purpose: 'candidate',
    artDirection: 'club_minimal_v1',
    kind: 'base',
    glbPath: '/cue-id/candidates/club-minimal-candidate-medium-v1.glb',
    fallbackPath: null,
    compressedBytes: 109_260,
    triangles: 9_456,
    materials: 4,
    textures: [],
    supportedTiers: ['full', 'reduced'],
    attribution: null
  },
  high: {
    id: 'club-minimal-candidate-high-v1',
    family: 'club_minimal',
    purpose: 'candidate',
    artDirection: 'club_minimal_v1',
    kind: 'base',
    glbPath: '/cue-id/candidates/club-minimal-candidate-high-v1.glb',
    fallbackPath: null,
    compressedBytes: 210_488,
    triangles: 22_560,
    materials: 4,
    textures: [],
    supportedTiers: ['full', 'reduced'],
    attribution: null
  }
}

export const CUE_ID_CANDIDATE_ASSET = CUE_ID_CANDIDATE_ASSETS.light
