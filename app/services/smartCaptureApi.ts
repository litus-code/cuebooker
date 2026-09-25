import type {
  SmartCaptureAudioInput,
  SmartCaptureResult,
  SmartCaptureTextInput
} from '../domain/smartCapture'

type SmartCaptureApiOptions = {
  baseUrl: string
  publishableKey: string
  accessToken: () => string | null | undefined
}

export function createSmartCaptureApi(options: SmartCaptureApiOptions) {
  const baseUrl = options.baseUrl.replace(/\/$/, '')

  function headers(contentType?: string) {
    const token = options.accessToken()
    if (!token) throw new Error('authentication_required')
    return {
      apikey: options.publishableKey,
      Authorization: `Bearer ${token}`,
      ...(contentType ? { 'Content-Type': contentType } : {})
    }
  }

  async function analyzeText(input: SmartCaptureTextInput) {
    return $fetch<SmartCaptureResult>(`${baseUrl}/functions/v1/smart-capture`, {
      method: 'POST',
      headers: headers('application/json'),
      body: {
        mode: 'text',
        workspaceId: input.workspaceId,
        artistId: input.artistId,
        locale: input.locale,
        text: input.text
      }
    })
  }

  async function analyzeAudio(input: SmartCaptureAudioInput) {
    const form = new FormData()
    form.set('mode', 'audio')
    form.set('workspaceId', input.workspaceId)
    form.set('artistId', input.artistId)
    form.set('locale', input.locale)
    form.set('audio', input.audio, input.filename || 'cuebooker-capture.webm')

    return $fetch<SmartCaptureResult>(`${baseUrl}/functions/v1/smart-capture`, {
      method: 'POST',
      headers: headers(),
      body: form
    })
  }

  return { analyzeText, analyzeAudio }
}
