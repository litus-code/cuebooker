import type { BookingSource, CounterpartyKind } from './bookingCore'

export type SmartCaptureConfidence = 'high' | 'medium' | 'low' | 'unknown'

export type SmartCaptureField<T> = {
  value: T | null
  confidence: SmartCaptureConfidence
  evidence: string | null
}

export type SmartCaptureCondition = {
  category: 'travel' | 'hotel' | 'hospitality' | 'technical' | 'other'
  value: string
  confidence: SmartCaptureConfidence
  evidence: string | null
}

export type SmartCaptureResult = {
  transcript: string
  summary: string
  source: SmartCaptureField<BookingSource>
  contact: {
    name: SmartCaptureField<string>
    email: SmartCaptureField<string>
    phone: SmartCaptureField<string>
  }
  counterparty: {
    name: SmartCaptureField<string>
    kind: SmartCaptureField<CounterpartyKind>
  }
  event: {
    name: SmartCaptureField<string>
    venueName: SmartCaptureField<string>
    city: SmartCaptureField<string>
    countryCode: SmartCaptureField<string>
    eventDate: SmartCaptureField<string>
    startTime: SmartCaptureField<string>
    endTime: SmartCaptureField<string>
    timezone: SmartCaptureField<string>
  }
  offer: {
    amountMinor: SmartCaptureField<number>
    currency: SmartCaptureField<string>
    feeBasis: SmartCaptureField<string>
  }
  nextAction: {
    label: SmartCaptureField<string>
    dueAt: SmartCaptureField<string>
  }
  conditions: SmartCaptureCondition[]
  missingFields: string[]
  warnings: string[]
}

export type SmartCaptureTextInput = {
  workspaceId: string
  artistId: string
  locale: 'es' | 'en'
  text: string
}

export type SmartCaptureAudioInput = {
  workspaceId: string
  artistId: string
  locale: 'es' | 'en'
  audio: Blob
  filename?: string
}
