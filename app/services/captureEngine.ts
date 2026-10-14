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
  fallbackReason?: 'rate_limit' | 'provider_error'
}

type CaptureEngineDependencies = {
  analyzeText: (input: SmartCaptureTextInput) => Promise<SmartCaptureResult>
  analyzeAudio: (input: SmartCaptureAudioInput) => Promise<SmartCaptureResult>
  interpretText: (raw: string, locale: 'es' | 'en') => CueInterpretation
}

export type CaptureEngineAudioInput = SmartCaptureAudioInput & {
  fallbackTranscript?: string
}

export function captureFailure(error: unknown) {
  const failure = error as { status?: number; statusCode?: number; data?: { error?: string; transcript?: unknown }; response?: { status?: number } } | null
  const code = failure?.data?.error
  const rateLimited = (failure?.statusCode || failure?.status || failure?.response?.status) === 429
    || code === 'smart_capture_rate_limited' || code === 'smart_capture_monthly_limit_reached'
  const transcript = typeof failure?.data?.transcript === 'string' && failure.data.transcript.length <= 20000 ? failure.data.transcript.trim() : ''
  return { rateLimited, transcript }
}

function localAnalysis(dependencies: CaptureEngineDependencies, text: string, locale: 'es' | 'en', rateLimited = false): CaptureEngineAnalysis {
  const result = localInterpretationToSmartCapture(text, locale, dependencies.interpretText(text, locale))
  if (rateLimited) {
    result.summary = locale === 'es' ? 'IA no disponible · detección básica' : 'AI unavailable · basic detection'
    result.warnings.unshift(locale === 'es' ? 'La IA ha alcanzado el límite de uso. He conservado el texto y usado la detección básica. Revisa los datos.' : 'AI has reached its usage limit. Your text is preserved and basic detection was used. Review the details.')
  }
  return { result, method: 'local_parser', fallbackReason: rateLimited ? 'rate_limit' : 'provider_error' }
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
    } catch (error) {
      return localAnalysis(dependencies, input.text, input.locale, captureFailure(error).rateLimited)
    }
  }

  async function analyzeAudio(input: CaptureEngineAudioInput): Promise<CaptureEngineAnalysis> {
    try {
      return {
        result: await dependencies.analyzeAudio(input),
        method: 'smart_audio'
      }
    } catch (audioError) {
      const failure = captureFailure(audioError)
      const fallbackTranscript = failure.transcript || input.fallbackTranscript?.trim() || ''
      if (!fallbackTranscript) throw audioError
      // Preserve server text and never repeat extraction after a 429.
      if (failure.transcript || failure.rateLimited) return localAnalysis(dependencies, fallbackTranscript, input.locale, failure.rateLimited)

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
      } catch (textError) {
        return localAnalysis(dependencies, fallbackTranscript, input.locale, captureFailure(textError).rateLimited)
      }
    }
  }

  return {
    analyzeText,
    analyzeAudio
  }
}
