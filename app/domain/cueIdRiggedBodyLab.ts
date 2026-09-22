import type { CueIdStylizedBodyId } from './cueIdStylizedCreator.ts'

export type CueIdRiggedBodyLabAsset = {
  body: CueIdStylizedBodyId
  version: 'v10'
  glbPath: string
  semanticNodes: {
    skin: string
    hair: string
    underwear: string
  }
  sourceHair: 'fade' | 'tied-back'
  qa: {
    shoulders: true
    elbows: true
    hips: true
    knees: true
  }
  productionReady: false
  bytes: number
  sha256: string
}

export const CUE_ID_RIGGED_BODY_LAB_ASSETS: Record<
  CueIdStylizedBodyId,
  CueIdRiggedBodyLabAsset
> = {
  male: {
    body: 'male',
    version: 'v10',
    glbPath: '/cue-id/lab/bodies/cueid-male-body-master-v1-rigged-v10.glb',
    semanticNodes: {
      skin: 'cue_male_skin',
      hair: 'cue_male_hair',
      underwear: 'cue_male_underwear'
    },
    sourceHair: 'fade',
    qa: {
      shoulders: true,
      elbows: true,
      hips: true,
      knees: true
    },
    productionReady: false,
    bytes: 24085652,
    sha256: '141dbf541b2aafbfd17aab1e99a0f32a8e088aef2677dfb9122f80821b6052fb'
  },
  female: {
    body: 'female',
    version: 'v10',
    glbPath: '/cue-id/lab/bodies/cueid-female-body-master-v1-rigged-v10.glb',
    semanticNodes: {
      skin: 'cue_female_skin',
      hair: 'cue_female_hair',
      underwear: 'cue_female_underwear'
    },
    sourceHair: 'tied-back',
    qa: {
      shoulders: true,
      elbows: true,
      hips: true,
      knees: true
    },
    productionReady: false,
    bytes: 29097972,
    sha256: '8f314f2280d79a6024a2acc6cba95759375d2442b8d9416f628fc93875de580f'
  }
}

export function getCueIdRiggedBodyLabAsset(body: CueIdStylizedBodyId) {
  return CUE_ID_RIGGED_BODY_LAB_ASSETS[body]
}
