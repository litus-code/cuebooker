import type {
  CueIdStylizedBodyId,
  CueIdStylizedExpressionId
} from './cueIdStylizedCreator.ts'

export const CUE_ID_RIG_BONES = [
  'root',
  'hips',
  'spine',
  'chest',
  'upper-chest',
  'neck',
  'head',
  'shoulder-l',
  'upper-arm-l',
  'lower-arm-l',
  'hand-l',
  'shoulder-r',
  'upper-arm-r',
  'lower-arm-r',
  'hand-r',
  'upper-leg-l',
  'lower-leg-l',
  'foot-l',
  'toe-l',
  'upper-leg-r',
  'lower-leg-r',
  'foot-r',
  'toe-r'
] as const

export type CueIdRigBoneName = typeof CUE_ID_RIG_BONES[number]

export const CUE_ID_EXPRESSION_MORPHS: Record<
  CueIdStylizedExpressionId,
  string | null
> = {
  neutral: null,
  smile: 'cue_expression_smile',
  focused: 'cue_expression_focused',
  confident: 'cue_expression_confident',
  playful: 'cue_expression_playful'
}

/**
 * Male and female use the exact same public rig contract.
 * Geometry and skin weights may differ, but runtime bone names never do.
 */
export const CUE_ID_RIG_CONTRACT: Record<
  CueIdStylizedBodyId,
  readonly CueIdRigBoneName[]
> = {
  male: CUE_ID_RIG_BONES,
  female: CUE_ID_RIG_BONES
}

export const CUE_ID_ATTACHMENT_BONES = {
  headwear: 'head',
  faceAccessory: 'head',
  earAccessory: 'head',
  neckAccessory: 'neck',
  torsoAccessory: 'chest',
  leftHand: 'hand-l',
  rightHand: 'hand-r'
} as const satisfies Record<string, CueIdRigBoneName>

export function getCueIdExpressionMorph(
  expression: CueIdStylizedExpressionId
) {
  return CUE_ID_EXPRESSION_MORPHS[expression]
}
