import type { CueIdCreatorConfigV1 } from './cueIdCreator'
import type { CueIdCreatorAssetSource } from './cueIdCreatorAssetStatus'
import type { CueIdCreatorVisualStep } from './cueIdCreatorVisualCoverage'
import { getCueIdCreatorVisualCoverage } from './cueIdCreatorVisualCoverage'

export type CueIdCreatorRepresentationStatus =
  | 'exact'
  | 'shared_runtime_variant'
  | 'not_authored'

export type CueIdCreatorRepresentation = {
  status: CueIdCreatorRepresentationStatus
  runtimeSemantic: string | null
}

export function getCueIdCreatorRepresentation(
  config: CueIdCreatorConfigV1,
  step: CueIdCreatorVisualStep,
  source: CueIdCreatorAssetSource
): CueIdCreatorRepresentation {
  if (source === 'lab_candidate') {
    return {
      status: 'exact',
      runtimeSemantic: String(config[step] ?? 'none')
    }
  }

  const coverage = getCueIdCreatorVisualCoverage(source)
  if (!coverage[step]) {
    return {
      status: 'not_authored',
      runtimeSemantic: null
    }
  }

  if (
    step === 'top'
    && (config.top === 'oversized-tee' || config.top === 'fitted-tee')
  ) {
    return {
      status: 'shared_runtime_variant',
      runtimeSemantic: 'tee'
    }
  }

  return {
    status: 'exact',
    runtimeSemantic: String(config[step] ?? 'none')
  }
}
