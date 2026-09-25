export type VoiceCaptureMode = 'recorder' | 'speech' | 'none'

export function resolveVoiceCaptureMode(hasRecorder: boolean, hasSpeech: boolean): VoiceCaptureMode {
  if (hasRecorder) return 'recorder'
  if (hasSpeech) return 'speech'
  return 'none'
}
