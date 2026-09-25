import type { CueIdConfigV1 } from './cueId.ts'
import type { CueIdCreatorConfigV1 } from './cueIdCreator.ts'
import { resolveCueIdCreator3dBindings } from './cueIdCreator3dBindings.ts'
import type { CueIdProductionManifest } from './cueIdProductionManifest.ts'
import { resolveCueIdProductionBindings } from './cueIdProductionBindings.ts'

/**
 * Lab-only integration slot for the first real authored CUE ID Creator GLB.
 *
 * Keep this null until an actual inspected GLB + manifest exist.
 * This is intentionally separate from CUE_ID_PRODUCTION_CATALOGUE.
 */
export const CUE_ID_CREATOR_3D_LAB_CANDIDATE: CueIdProductionManifest | null = null

export function resolveCueIdCreator3dLabCandidate(
  creatorConfig: CueIdCreatorConfigV1,
  runtimeConfig: CueIdConfigV1,
  manifest: CueIdProductionManifest | null = CUE_ID_CREATOR_3D_LAB_CANDIDATE
): CueIdProductionManifest | null {
  if (!manifest) return null

  const runtimeBindings = resolveCueIdProductionBindings(
    runtimeConfig,
    manifest,
    { allowPartial: true }
  )
  if (!runtimeBindings) return null

  const creatorBindings = resolveCueIdCreator3dBindings(
    creatorConfig,
    manifest
  )
  if (!creatorBindings) return null

  return manifest
}
