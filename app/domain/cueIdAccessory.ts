import type { CueIdConfigV1 } from './cueId'
import type { CueIdVisibilityDefinition } from './cueIdOutfit'

export const CUE_ID_ACCESSORIES: Record<
  Exclude<CueIdConfigV1['accessory'], null>,
  CueIdVisibilityDefinition
> = {
  headphones: {
    nodes: [
      'accessory_headphones_band',
      'accessory_headphones_cup_left',
      'accessory_headphones_cup_right'
    ]
  },
  cap: {
    nodes: ['accessory_cap_crown', 'accessory_cap_brim']
  },
  glasses: {
    nodes: [
      'accessory_glasses_left',
      'accessory_glasses_right',
      'accessory_glasses_bridge'
    ]
  }
}

export const CUE_ID_ACCESSORY_NODES = Array.from(
  new Set(Object.values(CUE_ID_ACCESSORIES).flatMap(definition => definition.nodes))
)

export function getCueIdAccessoryNodes(accessory: CueIdConfigV1['accessory']) {
  return accessory ? CUE_ID_ACCESSORIES[accessory].nodes : []
}
