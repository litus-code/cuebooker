import type { CueIdConfigV1 } from './cueId'

export type CueIdBuildNodeScale = [number, number, number]

export type CueIdBuildDefinition = {
  rootScale: CueIdBuildNodeScale
  nodes: Record<string, CueIdBuildNodeScale>
}

const regular: CueIdBuildDefinition = {
  rootScale: [1, 1, 1],
  nodes: {}
}

const slim: CueIdBuildDefinition = {
  rootScale: [1, 1, 1],
  nodes: {
    clavicle: [0.95, 1, 0.96],
    torso: [0.94, 1, 0.96],
    tee_volume: [0.95, 1, 0.97],
    outfit_tee_sleeve_left: [0.94, 1, 0.95],
    outfit_tee_sleeve_right: [0.94, 1, 0.95],
    outfit_hoodie_upper_sleeve_left: [0.94, 1, 0.95],
    outfit_hoodie_upper_sleeve_right: [0.94, 1, 0.95],
    outfit_hoodie_forearm_sleeve_left: [0.93, 1, 0.95],
    outfit_hoodie_forearm_sleeve_right: [0.93, 1, 0.95],
    outfit_bomber_upper_sleeve_left: [0.94, 1, 0.95],
    outfit_bomber_upper_sleeve_right: [0.94, 1, 0.95],
    outfit_bomber_forearm_sleeve_left: [0.93, 1, 0.95],
    outfit_bomber_forearm_sleeve_right: [0.93, 1, 0.95],
    shoulder_left: [0.94, 0.98, 0.95],
    shoulder_right: [0.94, 0.98, 0.95],
    upper_arm_left: [0.92, 1, 0.94],
    upper_arm_right: [0.92, 1, 0.94],
    forearm_left: [0.92, 1, 0.94],
    forearm_right: [0.92, 1, 0.94],
    waist: [0.95, 1, 0.97],
    hips: [0.95, 1, 0.97],
    hip_joint_left: [0.94, 1, 0.96],
    hip_joint_right: [0.94, 1, 0.96],
    thigh_left: [0.93, 1, 0.95],
    thigh_right: [0.93, 1, 0.95],
    shin_left: [0.93, 1, 0.95],
    shin_right: [0.93, 1, 0.95]
  }
}

const strong: CueIdBuildDefinition = {
  rootScale: [1, 1, 1],
  nodes: {
    clavicle: [1.08, 1.01, 1.04],
    torso: [1.07, 1, 1.04],
    tee_volume: [1.08, 1, 1.04],
    outfit_tee_sleeve_left: [1.09, 1, 1.06],
    outfit_tee_sleeve_right: [1.09, 1, 1.06],
    outfit_hoodie_upper_sleeve_left: [1.09, 1, 1.06],
    outfit_hoodie_upper_sleeve_right: [1.09, 1, 1.06],
    outfit_hoodie_forearm_sleeve_left: [1.07, 1, 1.05],
    outfit_hoodie_forearm_sleeve_right: [1.07, 1, 1.05],
    outfit_bomber_upper_sleeve_left: [1.10, 1, 1.07],
    outfit_bomber_upper_sleeve_right: [1.10, 1, 1.07],
    outfit_bomber_forearm_sleeve_left: [1.08, 1, 1.05],
    outfit_bomber_forearm_sleeve_right: [1.08, 1, 1.05],
    shoulder_left: [1.10, 1.04, 1.06],
    shoulder_right: [1.10, 1.04, 1.06],
    upper_arm_left: [1.08, 1, 1.06],
    upper_arm_right: [1.08, 1, 1.06],
    forearm_left: [1.06, 1, 1.04],
    forearm_right: [1.06, 1, 1.04],
    waist: [1.05, 1, 1.03],
    hips: [1.06, 1, 1.04],
    hip_joint_left: [1.07, 1, 1.05],
    hip_joint_right: [1.07, 1, 1.05],
    thigh_left: [1.07, 1, 1.05],
    thigh_right: [1.07, 1, 1.05],
    shin_left: [1.04, 1, 1.03],
    shin_right: [1.04, 1, 1.03]
  }
}

export const CUE_ID_BUILDS: Record<CueIdConfigV1['build'], CueIdBuildDefinition> = {
  slim,
  regular,
  strong
}
