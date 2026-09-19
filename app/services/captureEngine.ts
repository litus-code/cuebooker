import type {
  SmartCaptureAudioInput,
  SmartCaptureConfidence,
  SmartCaptureField,
  SmartCaptureResult,
  SmartCaptureTextInput
} from '../domain/smartCapture'
import type { CueInterpretation } from './cueInterpreter'

export type CaptureEngineMethod =
  | 'smart_text'
  | 'smart_audio'
  | 'browser_transcript'
  | 'local_parser'

export type CaptureEngineAnalysis = {
  result: SmartCaptureResult
  method: CaptureEngineMethod
}

type CaptureEngineDependencies = {
  analyzeText: (input: SmartCaptureTextInput) => Promise<SmartCaptureResult>
  analyzeAudio: (input: SmartCaptureAudioInput) => Promise<SmartCaptureResult>
  interpretText: (raw: string, locale: 'es' | 'en') => CueInterpretation
}

export type CaptureEngineAudioInput = SmartCaptureAudioInput & {
  fallbackTranscript?: string
}

function field<T>(value: T | null, confidence: SmartCaptureConfidence = 'medium'): SmartCaptureField<T> {
  return {
    value,
    confidence: value == null ? 'unknown' : confidence,
    evidence: null
  }
}

export function localInterpretationToSmartCapture(
  raw: string,
  locale: 'es' | 'en',
  parsed: CueInterpretation
): SmartCaptureResult {
  const warning = locale === 'es'
    ? 'He recuperado algunos datos con confianza limitada. Revísalos antes de aplicarlos.'
    : 'I recovered some details with limited confidence. Review them before applying.'

  return {
    transcript: raw,
    summary: locale === 'es'
      ? 'Detección básica de respaldo'
      : 'Basic fallback detection',
    source: field(parsed.source || null),
    contact: {
      name: field(parsed.contactName || null),
      email: field<string>(null),
      phone: field<string>(null)
    },
    counterparty: {
      name: field(parsed.counterpartyName || null),
      kind: field(null)
    },
    event: {
      name: field<string>(null),
      venueName: field(parsed.venueName || null),
      city: field<string>(null),
      countryCode: field<string>(null),
      eventDate: field(parsed.eventDate || null),
      startTime: field(parsed.startTime || null),
      endTime: field(parsed.endTime || null),
      timezone: field<string>(null)
    },
    offer: {
      amountMinor: field(parsed.offerAmountMinor ?? null),
      currency: field(parsed.currency || null),
      feeBasis: field<string>(null)
    },
    nextAction: {
      label: field(parsed.nextMoveLabel || null),
      dueAt: field<string>(null)
    },
    conditions: [],
    missingFields: [],
    warnings: [warning]
  }
}

export function createCaptureEngine(dependencies: CaptureEngineDependencies) {
  async function analyzeText(input: SmartCaptureTextInput): Promise<CaptureEngineAnalysis> {
    try {
      return {
        result: await dependencies.analyzeText(input),
        method: 'smart_text'
      }
    } catch {
      return {
        result: localInterpretationToSmartCapture(
          input.text,
          input.locale,
          dependencies.interpretText(input.text, input.locale)
        ),
        method: 'local_parser'
      }
    }
  }

  async function analyzeAudio(input: CaptureEngineAudioInput): Promise<CaptureEngineAnalysis> {
    try {
      return {
        result: await dependencies.analyzeAudio(input),
        method: 'smart_audio'
      }
    } catch (audioError) {
      const fallbackTranscript = input.fallbackTranscript?.trim() || ''
      if (!fallbackTranscript) throw audioError

      try {
        return {
          result: await dependencies.analyzeText({
            workspaceId: input.workspaceId,
            artistId: input.artistId,
            locale: input.locale,
            text: fallbackTranscript
          }),
          method: 'browser_transcript'
        }
      } catch {
        return {
          result: localInterpretationToSmartCapture(
            fallbackTranscript,
            input.locale,
            dependencies.interpretText(fallbackTranscript, input.locale)
          ),
          method: 'local_parser'
        }
      }
    }
  }

  return {
    analyzeText,
    analyzeAudio
  }
}
