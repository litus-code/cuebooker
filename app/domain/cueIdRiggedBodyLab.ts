import type { CueIdStylizedBodyId } from './cueIdStylizedCreator.ts'

export type CueIdRiggedBodyLabAsset = {
  body: CueIdStylizedBodyId
  version: 'v2'
  glbPath: string
  semanticNodes: {
    skin: string
    hair?: string
    underwear: string
  }
  sourceHair: null
  qa: {
    shoulders: true
    elbows: true
    hips: true
    knees: true
  }
  productionReady: false
  bytes: number
  sha256?: string
}

export const CUE_ID_RIGGED_BODY_LAB_ASSETS: Record<
  CueIdStylizedBodyId,
  CueIdRiggedBodyLabAsset
> = {
  male: {
    body: 'male',
    version: 'v2',
    glbPath: '/cue-id/lab/bodies/cueid-male-body-bald-master-v2.glb',
    semanticNodes: {
      skin: 'cue_male_skin',
      underwear: 'cue_male_underwear'
    },
    sourceHair: null,
    qa: {
      shoulders: true,
      elbows: true,
      hips: true,
      knees: true
    },
    productionReady: false,
    bytes: 15173184
  },
  female: {
    body: 'female',
    version: 'v2',
    glbPath: '/cue-id/lab/bodies/cueid-female-body-bald-master-v2.glb',
    semanticNodes: {
      skin: 'cue_female_skin',
      underwear: 'cue_female_underwear'
    },
    sourceHair: null,
    qa: {
      shoulders: true,
      elbows: true,
      hips: true,
      knees: true
    },
    productionReady: false,
    bytes: 12857980
  }
}

export function getCueIdRiggedBodyLabAsset(body: CueIdStylizedBodyId) {
  return CUE_ID_RIGGED_BODY_LAB_ASSETS[body]
}
