import { createCaptureEngine } from '../services/captureEngine'
import { interpretCueText } from '../services/cueInterpreter'

export function useCaptureEngine() {
  const smartCapture = useSmartCapture()

  return createCaptureEngine({
    analyzeText: smartCapture.analyzeText,
    analyzeAudio: smartCapture.analyzeAudio,
    interpretText: interpretCueText
  })
}
