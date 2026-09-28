/** Asset intake contract. Deliberately independent of the admitted production manifest. */
export const CUE_ID_MODULAR_CATEGORIES = ['hair', 'top', 'bottom', 'shoes', 'accessory'] as const
export const CUE_ID_BODY_REGIONS = [
  'head', 'neck', 'torso_upper', 'torso_lower', 'arms_upper', 'arms_lower',
  'hands', 'hips', 'legs_upper', 'legs_lower', 'feet'
] as const

export type CueIdModularCategory = typeof CUE_ID_MODULAR_CATEGORIES[number]
export type CueIdBodyRegion = typeof CUE_ID_BODY_REGIONS[number]
export type CueIdModularAsset = {
  id: string
  category: CueIdModularCategory
  label: string
  src: string
  thumbnail: string
  version: number
  bodyVariants: Array<'male' | 'female'>
  mount: { kind: 'skinned'; rig: 'cue_rig'; hideBodyRegions: CueIdBodyRegion[] }
    | { kind: 'rigid'; bone: string; position: [number, number, number]; rotation: [number, number, number]; scale: [number, number, number] }
  incompatibleWith?: string[]
  supportedTiers: Array<'full' | 'reduced'>
}

/** Empty until a reviewed GLB, thumbnail and body-region strategy exist. No UI consumes this yet. */
export const cueIdModularAssets: Record<string, CueIdModularAsset> = {}

const folders: Record<CueIdModularCategory, string> = {
  hair: 'hair', top: 'tops', bottom: 'bottoms', shoes: 'shoes', accessory: 'accessories'
}
const prefixes: Record<CueIdModularCategory, string> = {
  hair: 'hair', top: 'top', bottom: 'bottom', shoes: 'shoes', accessory: 'acc'
}
const regions = new Set<string>(CUE_ID_BODY_REGIONS)
const finiteVector = (value: unknown, length: number) => Array.isArray(value)
  && value.length === length && value.every(number => typeof number === 'number' && Number.isFinite(number))

export function validateCueIdModularRegistry(registry: Record<string, CueIdModularAsset>): string[] {
  const errors: string[] = []
  for (const [key, asset] of Object.entries(registry)) {
    if (!asset || !CUE_ID_MODULAR_CATEGORIES.includes(asset.category)) {
      errors.push(`${key}: invalid category`)
      continue
    }
    if (key !== asset.id || !new RegExp(`^${prefixes[asset.category]}(?:_[a-z0-9]+)+_\\d{2}$`).test(key)) {
      errors.push(`${key}: ID must match the registry key and semantic naming convention`)
    }
    if (!asset.label?.trim()) errors.push(`${key}: label required`)
    if (!Number.isInteger(asset.version) || asset.version < 1) errors.push(`${key}: positive version required`)
    const expected = `/cue-id/${folders[asset.category]}/${key}_v${asset.version}.glb`
    if (asset.src !== expected) errors.push(`${key}: expected ${expected}`)
    if (asset.thumbnail !== `/cue-id/thumbnails/${key}.webp`) errors.push(`${key}: thumbnail path mismatch`)
    if (!asset.bodyVariants?.length || asset.bodyVariants.some(value => !['male', 'female'].includes(value))) {
      errors.push(`${key}: bodyVariants must list male and/or female`)
    }
    if (!asset.supportedTiers?.length || asset.supportedTiers.some(value => !['full', 'reduced'].includes(value))) {
      errors.push(`${key}: supportedTiers must list full and/or reduced`)
    }
    if (asset.mount?.kind === 'skinned') {
      if (asset.mount.rig !== 'cue_rig' || !Array.isArray(asset.mount.hideBodyRegions) || asset.mount.hideBodyRegions.some(value => !regions.has(value))) {
        errors.push(`${key}: invalid shared rig or body region`)
      }
    } else if (asset.mount?.kind === 'rigid') {
      if (!asset.mount.bone?.trim() || !finiteVector(asset.mount.position, 3)
        || !finiteVector(asset.mount.rotation, 3) || !finiteVector(asset.mount.scale, 3)
        || asset.mount.scale.some(value => value <= 0)) errors.push(`${key}: invalid rigid mount`)
    } else errors.push(`${key}: mount kind required`)
    for (const target of asset.incompatibleWith || []) {
      if (target === key || !registry[target]) errors.push(`${key}: unknown or self incompatibleWith ${target}`)
    }
  }
  return errors
}
