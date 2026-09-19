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
  kind: 'base',
  glbPath: '/cue-id/benchmarks/rigged-figure.glb',
  fallbackPath: null,
  compressedBytes: 50_116,
  triangles: 0,
  materials: 0,
  textures: [],
  supportedTiers: ['full', 'reduced']
}
