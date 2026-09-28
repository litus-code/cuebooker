import {
  defineCueIdProductionCatalogue,
  getCueIdProductionManifests,
  type CueIdProductionAdmission
} from './cueIdProductionAdmission.ts'

// Intentionally empty until an authored V2 asset passes visual, mobile,
// compatibility and performance acceptance.
//
// The procedural Club Minimal fixture must never be registered here.
export const CUE_ID_PRODUCTION_CATALOGUE = defineCueIdProductionCatalogue(
  [] satisfies CueIdProductionAdmission[]
)

export const CUE_ID_PRODUCTION_MANIFESTS = getCueIdProductionManifests(
  CUE_ID_PRODUCTION_CATALOGUE
)
