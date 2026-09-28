import type { CueIdCreatorConfigV1 } from './cueIdCreator'
import type { CueIdCreatorAssetSource } from './cueIdCreatorAssetStatus'

export type CueIdCreatorVisualStep = keyof Pick<
  CueIdCreatorConfigV1,
  | 'base'
  | 'build'
  | 'skin'
  | 'face'
  | 'hair'
  | 'facialHair'
  | 'top'
  | 'bottom'
  | 'footwear'
  | 'accessory'
  | 'pose'
  | 'material'
  | 'accent'
>

const LAB_VISUAL_STEPS: CueIdCreatorVisualStep[] = [
  'base',
  'build',
  'skin',
  'face',
  'hair',
  'facialHair',
  'top',
  'bottom',
  'footwear',
  'accessory',
  'pose',
  'material',
  'accent'
]

const PRODUCTION_V2_VISUAL_STEPS: CueIdCreatorVisualStep[] = [
  'base',
  'build',
  'top',
  'accessory',
  'pose',
  'material',
  'accent'
]

export function getCueIdCreatorVisualCoverage(
  source: CueIdCreatorAssetSource
): Record<CueIdCreatorVisualStep, boolean> {
  const supported = new Set(
    source === 'lab_candidate'
      ? LAB_VISUAL_STEPS
      : PRODUCTION_V2_VISUAL_STEPS
  )

  return {
    base: supported.has('base'),
    build: supported.has('build'),
    skin: supported.has('skin'),
    face: supported.has('face'),
    hair: supported.has('hair'),
    facialHair: supported.has('facialHair'),
    top: supported.has('top'),
    bottom: supported.has('bottom'),
    footwear: supported.has('footwear'),
    accessory: supported.has('accessory'),
    pose: supported.has('pose'),
    material: supported.has('material'),
    accent: supported.has('accent')
  }
}
