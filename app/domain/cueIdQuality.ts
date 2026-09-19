import type { CueIdCandidateQuality } from './cueIdAssets'
import type { CueIdRuntimeDecision } from './cueIdRuntime'

export type CueIdQualityMode = 'auto' | CueIdCandidateQuality

export function selectCueIdCandidateQuality(
  decision: Pick<CueIdRuntimeDecision, 'tier' | 'reason'>
): CueIdCandidateQuality {
  if (decision.tier === 'full') return 'medium'
  if (decision.tier === 'reduced') return 'medium'
  return 'light'
}
