import type { CueIdConfigV1 } from './cueId'
import type { CueIdDeviceTier } from './cueIdAssets'
import type { CueIdProductionManifest } from './cueIdProductionManifest'
import { validateCueIdProductionManifest } from './cueIdProductionManifest'

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
  manifests: CueIdProductionManifest[]
): CueIdResolvedProductionAsset | null {
  if (!config.enabled) return null

  const candidates = manifests
    .filter(manifest => validateCueIdProductionManifest(manifest).length === 0)
    .filter(manifest => supportsConfig(manifest, config))
    .sort((a, b) => b.assetVersion.localeCompare(a.assetVersion, undefined, { numeric: true }))

  for (const manifest of candidates) {
    if (tier === 'static') {
      return {
        manifest,
        representation: 'static',
        staticPath: manifest.static.portrait
      }
    }

    if (manifest.supportedTiers.includes(tier)) {
      return {
        manifest,
        representation: 'interactive',
        staticPath: manifest.static.portrait
      }
    }
  }

  return null
}
