import type { CueIdConfigV1 } from './cueId'
import type { CueIdDeviceTier } from './cueIdAssets'
import type { CueIdProductionAdmission } from './cueIdProductionAdmission.ts'
import { validateCueIdProductionAdmission } from './cueIdProductionAdmission.ts'
import type { CueIdProductionManifest } from './cueIdProductionManifest.ts'
import { createCueIdStaticVariantKey } from './cueIdStaticVariants.ts'

export type CueIdResolvedProductionAsset = {
  manifest: CueIdProductionManifest
  representation: 'interactive' | 'static'
  staticPath: string
}

function supportsConfig(manifest: CueIdProductionManifest, config: CueIdConfigV1) {
  return manifest.family === config.family
    && manifest.capabilities.bases.includes(config.base)
    && manifest.capabilities.builds.includes(config.build)
    && manifest.capabilities.outfits.includes(config.outfit)
    && manifest.capabilities.accessories.includes(config.accessory)
    && manifest.capabilities.poses.includes(config.pose)
    && manifest.capabilities.materials.includes(config.material)
    && manifest.capabilities.accents.includes(config.accent)
}

export function resolveCueIdAsset(
  config: CueIdConfigV1,
  tier: CueIdDeviceTier,
  admissions: CueIdProductionAdmission[]
): CueIdResolvedProductionAsset | null {
  if (!config.enabled) return null

  const candidates = admissions
    .filter(admission => validateCueIdProductionAdmission(admission).length === 0)
    .filter(admission => supportsConfig(admission.manifest, config))
    .sort((a, b) =>
      b.manifest.assetVersion.localeCompare(
        a.manifest.assetVersion,
        undefined,
        { numeric: true }
      )
    )

  const staticKey = createCueIdStaticVariantKey(config)

  for (const admission of candidates) {
    const manifest = admission.manifest
    const staticVariant = manifest.static.variants[staticKey]

    if (!staticVariant) continue

    if (tier === 'static') {
      return {
        manifest,
        representation: 'static',
        staticPath: staticVariant.portrait
      }
    }

    const canRenderInteractively =
      admission.stage === 'interactive_approved'
      && manifest.supportedTiers.includes(tier)

    return {
      manifest,
      representation: canRenderInteractively ? 'interactive' : 'static',
      staticPath: staticVariant.portrait
    }
  }

  return null
}
