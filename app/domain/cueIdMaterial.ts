import type { CueIdConfigV1 } from './cueId'

export type CueIdPbrSurface = {
  roughness: number
  metalness: number
}

export type CueIdMaterialPreset = {
  body: CueIdPbrSurface
  mid: CueIdPbrSurface
  dark: CueIdPbrSurface
  accent: CueIdPbrSurface
}

export const CUE_ID_MATERIAL_PRESETS: Record<CueIdConfigV1['material'], CueIdMaterialPreset> = {
  matte: {
    body: { roughness: 0.82, metalness: 0.02 },
    mid: { roughness: 0.80, metalness: 0.03 },
    dark: { roughness: 0.86, metalness: 0.02 },
    accent: { roughness: 0.72, metalness: 0.02 }
  },
  satin: {
    body: { roughness: 0.48, metalness: 0.10 },
    mid: { roughness: 0.44, metalness: 0.12 },
    dark: { roughness: 0.52, metalness: 0.08 },
    accent: { roughness: 0.40, metalness: 0.12 }
  }
}

export const CUE_ID_ACCENT_COLORS: Record<CueIdConfigV1['accent'], string> = {
  lime: '#ceff54',
  red: '#ff4545',
  none: '#737a72'
}
