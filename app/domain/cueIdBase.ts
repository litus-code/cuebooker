import type { CueIdConfigV1 } from './cueId'

export type CueIdBaseNodeScale = [number, number, number]

export type CueIdBaseDefinition = {
  rootScale: CueIdBaseNodeScale
  nodes: Record<string, CueIdBaseNodeScale>
}

const neutral: CueIdBaseDefinition = {
  rootScale: [1, 1, 1],
  nodes: {}
}

const masculine: CueIdBaseDefinition = {
  rootScale: [1, 1, 1],
  nodes: {
    clavicle: [1.035, 1, 1.015],
    torso: [1.025, 1, 1.01],
    tee_volume: [1.025, 1, 1.01],
    outfit_tank: [1.015, 1, 1.005],
    outfit_hoodie: [1.02, 1, 1.01],
    outfit_bomber: [1.025, 1, 1.01],
    shoulder_left: [1.035, 1, 1.02],
    shoulder_right: [1.035, 1, 1.02],
    waist: [0.995, 1, 1],
    hips: [0.985, 1, 0.995]
  }
}

const feminine: CueIdBaseDefinition = {
  rootScale: [1, 1, 1],
  nodes: {
    clavicle: [0.98, 1, 0.995],
    torso: [0.99, 1, 1],
    tee_volume: [0.99, 1, 1],
    outfit_tank: [0.99, 1, 1],
    outfit_hoodie: [0.99, 1, 1],
    outfit_bomber: [0.99, 1, 1],
    shoulder_left: [0.985, 1, 1],
    shoulder_right: [0.985, 1, 1],
    waist: [0.985, 1, 0.995],
    hips: [1.025, 1, 1.015]
  }
}

export const CUE_ID_BASES: Record<CueIdConfigV1['base'], CueIdBaseDefinition> = {
  masculine,
  feminine,
  neutral
}
