import type {
  CueIdBottomId,
  CueIdCreatorConfigV1,
  CueIdFaceId,
  CueIdFacialHairId,
  CueIdFootwearId,
  CueIdHairId,
  CueIdSkinId,
  CueIdTopId
} from './cueIdCreator.ts'
import type { CueIdProductionManifest } from './cueIdProductionManifest.ts'

export type CueIdCreator3dBindingIssue = {
  field: 'face' | 'hair' | 'facialHair' | 'top' | 'bottom' | 'footwear' | 'skin'
  message: string
}

export type CueIdResolvedCreator3dBindings = {
  morphs: Array<{ name: string; weight: number }>
  hairNodes: string[]
  facialHairNodes: string[]
  topNodes: string[]
  bottomNodes: string[]
  footwearNodes: string[]
  skinMaterial: string
}

const REFERENCE_FACE: CueIdFaceId = 'face-03'

function hasNodes(nodes: string[] | undefined) {
  return Boolean(nodes?.length)
}

export function validateCueIdCreator3dBindings(
  manifest: CueIdProductionManifest
): CueIdCreator3dBindingIssue[] {
  const creator = manifest.bindings.creator
  if (!creator) {
    return [{
      field: 'face',
      message: 'CUE ID creator 3D bindings are not declared'
    }]
  }

  const issues: CueIdCreator3dBindingIssue[] = []

  for (const face of creator.capabilities.faces) {
    if (face === REFERENCE_FACE) continue
    if (!creator.faces?.[face]) {
      issues.push({
        field: 'face',
        message: `Creator face binding "${face}" is missing`
      })
    }
  }

  for (const hair of creator.capabilities.hairs) {
    if (!hasNodes(creator.hairs?.[hair])) {
      issues.push({
        field: 'hair',
        message: `Creator hair binding "${hair}" is missing`
      })
    }
  }

  for (const facialHair of creator.capabilities.facialHair) {
    if (facialHair === 'none') continue
    if (!hasNodes(creator.facialHair?.[facialHair])) {
      issues.push({
        field: 'facialHair',
        message: `Creator facial-hair binding "${facialHair}" is missing`
      })
    }
  }

  for (const top of creator.capabilities.tops) {
    if (!hasNodes(creator.tops?.[top])) {
      issues.push({
        field: 'top',
        message: `Creator top binding "${top}" is missing`
      })
    }
  }

  for (const bottom of creator.capabilities.bottoms) {
    if (!hasNodes(creator.bottoms?.[bottom])) {
      issues.push({
        field: 'bottom',
        message: `Creator bottom binding "${bottom}" is missing`
      })
    }
  }

  for (const footwear of creator.capabilities.footwear) {
    if (!hasNodes(creator.footwear?.[footwear])) {
      issues.push({
        field: 'footwear',
        message: `Creator footwear binding "${footwear}" is missing`
      })
    }
  }

  for (const skin of creator.capabilities.skins) {
    if (!creator.skins?.[skin]) {
      issues.push({
        field: 'skin',
        message: `Creator skin binding "${skin}" is missing`
      })
    }
  }

  return issues
}

export function isCueIdCreator3dReady(manifest: CueIdProductionManifest) {
  return validateCueIdCreator3dBindings(manifest).length === 0
}

export function resolveCueIdCreator3dBindings(
  config: CueIdCreatorConfigV1,
  manifest: CueIdProductionManifest
): CueIdResolvedCreator3dBindings | null {
  const creator = manifest.bindings.creator
  if (!creator || !isCueIdCreator3dReady(manifest)) return null

  if (
    !creator.capabilities.skins.includes(config.skin)
    || !creator.capabilities.faces.includes(config.face)
    || !creator.capabilities.hairs.includes(config.hair)
    || !creator.capabilities.facialHair.includes(config.facialHair)
    || !creator.capabilities.tops.includes(config.top)
    || !creator.capabilities.bottoms.includes(config.bottom)
    || !creator.capabilities.footwear.includes(config.footwear)
  ) {
    return null
  }

  const morphs: CueIdResolvedCreator3dBindings['morphs'] = []

  if (config.face !== REFERENCE_FACE) {
    const faceMorph = creator.faces?.[config.face]
    if (!faceMorph) return null
    morphs.push({ name: faceMorph, weight: 1 })
  }

  const skinMaterial = creator.skins?.[config.skin]
  const hairNodes = creator.hairs?.[config.hair]
  const facialHairNodes = config.facialHair === 'none'
    ? []
    : creator.facialHair?.[config.facialHair]
  const topNodes = creator.tops?.[config.top]
  const bottomNodes = creator.bottoms?.[config.bottom]
  const footwearNodes = creator.footwear?.[config.footwear]

  if (
    !skinMaterial
    || !hairNodes?.length
    || (config.facialHair !== 'none' && !facialHairNodes?.length)
    || !topNodes?.length
    || !bottomNodes?.length
    || !footwearNodes?.length
  ) {
    return null
  }

  return {
    morphs,
    hairNodes: [...hairNodes],
    facialHairNodes: [...facialHairNodes],
    topNodes: [...topNodes],
    bottomNodes: [...bottomNodes],
    footwearNodes: [...footwearNodes],
    skinMaterial
  }
}
