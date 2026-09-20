import type { CueIdConfigV1 } from './cueId'
import type { CueIdProductionManifest } from './cueIdProductionManifest.ts'
import { isCueIdProductionInteractiveReady } from './cueIdProductionManifest.ts'

export type CueIdResolvedProductionBindings = {
  morphs: Array<{ name: string; weight: number }>
  poseClip: string
  outfitNodes: string[]
  accessoryNodes: string[]
  materials: {
    body: string
    textile: string
    technical?: string
    accent?: string
  }
}

export function resolveCueIdProductionBindings(
  config: CueIdConfigV1,
  manifest: CueIdProductionManifest
): CueIdResolvedProductionBindings | null {
  if (!isCueIdProductionInteractiveReady(manifest)) return null

  const morphs: CueIdResolvedProductionBindings['morphs'] = []
  const morphBindings = manifest.bindings.morphs || {}

  if (config.base !== 'neutral') {
    const name = morphBindings[`base.${config.base}`]
    if (!name) return null
    morphs.push({ name, weight: 1 })
  }

  if (config.build !== 'regular') {
    const name = morphBindings[`build.${config.build}`]
    if (!name) return null
    morphs.push({ name, weight: 1 })
  }

  const poseClip = manifest.bindings.poses?.[config.pose]
  const outfitNodes = manifest.bindings.outfits?.[config.outfit]
  const bodyMaterial = manifest.bindings.materials?.body
  const textileMaterial = manifest.bindings.materials?.textile

  if (!poseClip || !outfitNodes?.length || !bodyMaterial || !textileMaterial) {
    return null
  }

  const accessoryNodes = config.accessory
    ? manifest.bindings.accessories?.[config.accessory] || []
    : []

  if (config.accessory && !accessoryNodes.length) {
    return null
  }

  return {
    morphs,
    poseClip,
    outfitNodes: [...outfitNodes],
    accessoryNodes: [...accessoryNodes],
    materials: {
      body: bodyMaterial,
      textile: textileMaterial,
      technical: manifest.bindings.materials?.technical,
      accent: manifest.bindings.materials?.accent
    }
  }
}
