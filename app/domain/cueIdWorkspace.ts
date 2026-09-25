import type {
  CueIdStylizedBodyId,
  CueIdStylizedCreatorConfigV1,
  CueIdStylizedExpressionId,
  CueIdStylizedHairId
} from './cueIdStylizedCreator.ts'

export type CueIdWorkspaceSection =
  | 'identity'
  | 'hair'
  | 'face'
  | 'outfit'
  | 'footwear'
  | 'accessories'

export const CUE_ID_WORKSPACE_SECTIONS: readonly CueIdWorkspaceSection[] = [
  'identity',
  'hair',
  'face',
  'outfit',
  'footwear',
  'accessories'
] as const

export type CueIdPreviewTarget = {
  body: CueIdStylizedBodyId
  expression?: CueIdStylizedExpressionId
  hair?: CueIdStylizedHairId
}

export function cueIdExpressionPreviewTarget(
  config: CueIdStylizedCreatorConfigV1,
  expression: CueIdStylizedExpressionId
): CueIdPreviewTarget {
  return {
    body: config.body,
    expression,
    hair: config.hair
  }
}

export function cueIdHairPreviewTarget(
  config: CueIdStylizedCreatorConfigV1,
  hair: CueIdStylizedHairId
): CueIdPreviewTarget {
  return {
    body: config.body,
    expression: config.expression,
    hair
  }
}

/**
 * Preview tiles must always render the body being edited.
 * The catalogue is shared, but its visual preview never mixes male/female in
 * one editing session.
 */
export function cueIdPreviewBodyForConfig(
  config: CueIdStylizedCreatorConfigV1
): CueIdStylizedBodyId {
  return config.body
}

export function cueIdSwitchBody(
  config: CueIdStylizedCreatorConfigV1,
  body: CueIdStylizedBodyId
): CueIdStylizedCreatorConfigV1 {
  return {
    ...config,
    body,
    piercings: [...config.piercings]
  }
}
