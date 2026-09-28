import type { CueIdConfigV1 } from './cueId'

export type CueIdVisibilityDefinition = {
  nodes: string[]
}

export const CUE_ID_OUTFITS: Record<CueIdConfigV1['outfit'], CueIdVisibilityDefinition> = {
  tee: {
    nodes: [
      'tee_volume',
      'accent_seam',
      'outfit_tee_sleeve_left',
      'outfit_tee_sleeve_right'
    ]
  },
  tank: {
    nodes: ['outfit_tank', 'outfit_tank_accent']
  },
  hoodie: {
    nodes: [
      'outfit_hoodie',
      'outfit_hood',
      'outfit_hoodie_accent',
      'outfit_hoodie_upper_sleeve_left',
      'outfit_hoodie_upper_sleeve_right',
      'outfit_hoodie_forearm_sleeve_left',
      'outfit_hoodie_forearm_sleeve_right'
    ]
  },
  bomber: {
    nodes: [
      'outfit_bomber',
      'outfit_bomber_collar',
      'outfit_bomber_accent',
      'outfit_bomber_upper_sleeve_left',
      'outfit_bomber_upper_sleeve_right',
      'outfit_bomber_forearm_sleeve_left',
      'outfit_bomber_forearm_sleeve_right'
    ]
  }
}

export const CUE_ID_OUTFIT_NODES = Array.from(
  new Set(Object.values(CUE_ID_OUTFITS).flatMap(definition => definition.nodes))
)
