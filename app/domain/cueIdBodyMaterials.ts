import type { CueIdSkinId } from './cueIdCreator.ts'
import type {
  CueIdStylizedBodyId,
  CueIdStylizedCreatorConfigV1,
  CueIdStylizedHairId
} from './cueIdStylizedCreator.ts'

export type CueIdBodySemanticPart = 'skin' | 'hair' | 'underwear'

export type CueIdSkinTonePreset = {
  id: CueIdSkinId
  color: string
  roughness: number
  tintStrength: number
}

export const CUE_ID_SKIN_TONES: Record<CueIdSkinId, CueIdSkinTonePreset> = {
  'skin-01': { id: 'skin-01', color: '#f2c7ad', roughness: 0.66, tintStrength: 0.72 },
  'skin-02': { id: 'skin-02', color: '#e5aa84', roughness: 0.66, tintStrength: 0.72 },
  'skin-03': { id: 'skin-03', color: '#c98763', roughness: 0.67, tintStrength: 0.74 },
  'skin-04': { id: 'skin-04', color: '#a96848', roughness: 0.68, tintStrength: 0.76 },
  'skin-05': { id: 'skin-05', color: '#75472f', roughness: 0.69, tintStrength: 0.78 },
  'skin-06': { id: 'skin-06', color: '#482c21', roughness: 0.70, tintStrength: 0.80 }
}

export const CUE_ID_BODY_SEMANTIC_NODES: Record<
  CueIdStylizedBodyId,
  Record<CueIdBodySemanticPart, string>
> = {
  male: {
    skin: 'cue_male_skin',
    hair: 'cue_male_hair',
    underwear: 'cue_male_underwear'
  },
  female: {
    skin: 'cue_female_skin',
    hair: 'cue_female_hair',
    underwear: 'cue_female_underwear'
  }
}

/**
 * The Meshy body masters include one authored source hairstyle each.
 * These ids describe that source hair only. All other hairstyles are modular
 * assets layered on the same body and should hide the source-hair geometry.
 */
export const CUE_ID_BODY_SOURCE_HAIR: Record<CueIdStylizedBodyId, CueIdStylizedHairId> = {
  male: 'fade',
  female: 'tied-back'
}

export type CueIdBodySemanticState = {
  nodes: Record<CueIdBodySemanticPart, string>
  skinTone: CueIdSkinTonePreset
  sourceHairVisible: boolean
  underwearVisible: boolean
}

/**
 * Underwear is a technical modesty layer. It is visible when the current look
 * exposes the torso/pelvis and can be hidden by authored full-coverage garments.
 *
 * Until garment coverage metadata lands, keep it visible. Individual clothing
 * assets may later override this with semantic coverage flags.
 */
export function resolveCueIdBodySemanticState(
  config: CueIdStylizedCreatorConfigV1
): CueIdBodySemanticState {
  const sourceHair = CUE_ID_BODY_SOURCE_HAIR[config.body]

  return {
    nodes: CUE_ID_BODY_SEMANTIC_NODES[config.body],
    skinTone: CUE_ID_SKIN_TONES[config.skin],
    sourceHairVisible: config.hair === sourceHair,
    underwearVisible: true
  }
}

export function getCueIdSkinTone(id: CueIdSkinId) {
  return CUE_ID_SKIN_TONES[id]
}
