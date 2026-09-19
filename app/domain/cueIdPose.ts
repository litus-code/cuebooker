import type { CueIdConfigV1 } from './cueId'

export type CueIdPoseNodeTransform = {
  rotation?: [number, number, number]
  position?: [number, number, number]
}

export type CueIdPoseDefinition = {
  rootRotation: [number, number, number]
  rootPosition: [number, number, number]
  nodes: Record<string, CueIdPoseNodeTransform>
}

const neutral: CueIdPoseDefinition = {
  rootRotation: [0, 0, 0],
  rootPosition: [0, 0, 0],
  nodes: {}
}

const relaxed: CueIdPoseDefinition = {
  rootRotation: [0, 0.10, -0.018],
  rootPosition: [0.015, -0.015, 0],
  nodes: {
    shoulder_left: { rotation: [0, 0, 0.035] },
    shoulder_right: { rotation: [0, 0, -0.025] },
    upper_arm_left: { rotation: [0.02, 0, 0.055] },
    outfit_tee_sleeve_left: { rotation: [0.02, 0, 0.055] },
    outfit_hoodie_upper_sleeve_left: { rotation: [0.02, 0, 0.055] },
    outfit_bomber_upper_sleeve_left: { rotation: [0.02, 0, 0.055] },
    forearm_left: { rotation: [0.04, 0.01, -0.08] },
    outfit_hoodie_forearm_sleeve_left: { rotation: [0.04, 0.01, -0.08] },
    outfit_bomber_forearm_sleeve_left: { rotation: [0.04, 0.01, -0.08] },
    upper_arm_right: { rotation: [-0.01, 0, -0.025] },
    outfit_tee_sleeve_right: { rotation: [-0.01, 0, -0.025] },
    outfit_hoodie_upper_sleeve_right: { rotation: [-0.01, 0, -0.025] },
    outfit_bomber_upper_sleeve_right: { rotation: [-0.01, 0, -0.025] },
    forearm_right: { rotation: [0.02, -0.01, 0.055] },
    outfit_hoodie_forearm_sleeve_right: { rotation: [0.02, -0.01, 0.055] },
    outfit_bomber_forearm_sleeve_right: { rotation: [0.02, -0.01, 0.055] },
    hips: { rotation: [0, 0, 0.018] },
    thigh_left: { rotation: [0, 0, -0.025] },
    thigh_right: { rotation: [0, 0, 0.035] },
    shin_left: { rotation: [0, 0, 0.012] },
    shin_right: { rotation: [0, 0, -0.018] }
  }
}

const focused: CueIdPoseDefinition = {
  rootRotation: [-0.018, -0.07, 0],
  rootPosition: [0, -0.01, 0.025],
  nodes: {
    head: { rotation: [-0.045, -0.04, 0] },
    clavicle: { rotation: [-0.025, 0, 0] },
    shoulder_left: { rotation: [-0.03, 0, 0.035] },
    shoulder_right: { rotation: [-0.035, 0, -0.035] },
    upper_arm_left: { rotation: [-0.03, 0, 0.07] },
    outfit_tee_sleeve_left: { rotation: [-0.03, 0, 0.07] },
    outfit_hoodie_upper_sleeve_left: { rotation: [-0.03, 0, 0.07] },
    outfit_bomber_upper_sleeve_left: { rotation: [-0.03, 0, 0.07] },
    upper_arm_right: { rotation: [-0.03, 0, -0.065] },
    outfit_tee_sleeve_right: { rotation: [-0.03, 0, -0.065] },
    outfit_hoodie_upper_sleeve_right: { rotation: [-0.03, 0, -0.065] },
    outfit_bomber_upper_sleeve_right: { rotation: [-0.03, 0, -0.065] },
    forearm_left: { rotation: [-0.10, 0.02, -0.11] },
    outfit_hoodie_forearm_sleeve_left: { rotation: [-0.10, 0.02, -0.11] },
    outfit_bomber_forearm_sleeve_left: { rotation: [-0.10, 0.02, -0.11] },
    forearm_right: { rotation: [-0.10, -0.02, 0.11] }
  }
}

const editorial: CueIdPoseDefinition = {
  rootRotation: [0, 0.22, 0.026],
  rootPosition: [0.025, -0.012, 0],
  nodes: {
    head: { rotation: [0.01, -0.10, -0.015] },
    clavicle: { rotation: [0, 0.035, 0.018] },
    shoulder_left: { rotation: [0, 0.02, 0.07] },
    shoulder_right: { rotation: [0, -0.02, -0.04] },
    upper_arm_left: { rotation: [0.03, 0, 0.10] },
    outfit_tee_sleeve_left: { rotation: [0.03, 0, 0.10] },
    outfit_hoodie_upper_sleeve_left: { rotation: [0.03, 0, 0.10] },
    outfit_bomber_upper_sleeve_left: { rotation: [0.03, 0, 0.10] },
    forearm_left: { rotation: [0.02, 0.02, -0.14] },
    outfit_hoodie_forearm_sleeve_left: { rotation: [0.02, 0.02, -0.14] },
    outfit_bomber_forearm_sleeve_left: { rotation: [0.02, 0.02, -0.14] },
    upper_arm_right: { rotation: [-0.015, 0, -0.045] },
    outfit_tee_sleeve_right: { rotation: [-0.015, 0, -0.045] },
    outfit_hoodie_upper_sleeve_right: { rotation: [-0.015, 0, -0.045] },
    outfit_bomber_upper_sleeve_right: { rotation: [-0.015, 0, -0.045] },
    forearm_right: { rotation: [0.03, -0.015, 0.07] },
    outfit_hoodie_forearm_sleeve_right: { rotation: [0.03, -0.015, 0.07] },
    outfit_bomber_forearm_sleeve_right: { rotation: [0.03, -0.015, 0.07] },
    hips: { rotation: [0, -0.025, -0.025] },
    thigh_left: { rotation: [0, 0, -0.035] },
    thigh_right: { rotation: [0, 0, 0.055] },
    shin_left: { rotation: [0, 0, 0.02] },
    shin_right: { rotation: [0, 0, -0.025] }
  }
}

export const CUE_ID_POSES: Record<CueIdConfigV1['pose'], CueIdPoseDefinition> = {
  neutral,
  relaxed,
  focused,
  editorial
}
