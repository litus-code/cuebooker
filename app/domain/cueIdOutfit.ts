import type { CueIdConfigV1 } from './cueId'

export type CueIdVisibilityDefinition = {
  nodes: string[]
}

export const CUE_ID_OUTFITS: Record<CueIdConfigV1['outfit'], CueIdVisibilityDefinition> = {
  tee: {
    nodes: ['tee_volume', 'accent_seam']
  },
  tank: {
    nodes: ['outfit_tank', 'outfit_tank_accent']
  },
  hoodie: {
    nodes: ['outfit_hoodie', 'outfit_hood', 'outfit_hoodie_accent']
  },
  bomber: {
    nodes: ['outfit_bomber', 'outfit_bomber_collar', 'outfit_bomber_accent']
  }
}

export const CUE_ID_OUTFIT_NODES = Array.from(
  new Set(Object.values(CUE_ID_OUTFITS).flatMap(definition => definition.nodes))
)
