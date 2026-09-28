export type CueIdLoadableGlb = {
  glbPath: string
  compressedBytes: number
}

export type CueIdGlbLoadResult = {
  buffer: ArrayBuffer
  bytes: number
  loadMs: number
  declaredBytes: number
  version: number
}

export class CueIdAssetLoadError extends Error {
  code:
    | 'asset_timeout'
    | 'asset_http_error'
    | 'asset_too_large'
    | 'asset_invalid_glb'
    | 'asset_length_mismatch'

  constructor(code: CueIdAssetLoadError['code'], message: string) {
    super(message)
    this.name = 'CueIdAssetLoadError'
    this.code = code
  }
}

const GLB_MAGIC = 0x46546c67
const GLB_VERSION = 2
const GLB_HEADER_BYTES = 12

function validateGlb(buffer: ArrayBuffer) {
  if (buffer.byteLength < GLB_HEADER_BYTES) {
    throw new CueIdAssetLoadError('asset_invalid_glb', 'GLB is smaller than the required 12-byte header')
  }

  const view = new DataView(buffer)
  const magic = view.getUint32(0, true)
  const version = view.getUint32(4, true)
  const declaredBytes = view.getUint32(8, true)

  if (magic !== GLB_MAGIC || version !== GLB_VERSION) {
    throw new CueIdAssetLoadError('asset_invalid_glb', 'Asset is not a supported GLB v2 file')
  }

  if (declaredBytes !== buffer.byteLength) {
    throw new CueIdAssetLoadError(
      'asset_length_mismatch',
      `GLB declared ${declaredBytes} bytes but received ${buffer.byteLength}`
    )
  }

  return { version, declaredBytes }
}

function concatChunks(chunks: Uint8Array[], totalBytes: number) {
  const merged = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged.buffer
}

export async function loadCueIdGlbBuffer(
  asset: CueIdLoadableGlb,
  options: {
    fetchImpl?: typeof fetch
    timeoutMs?: number
    signal?: AbortSignal
  } = {}
): Promise<CueIdGlbLoadResult> {
  const fetchImpl = options.fetchImpl || fetch
  const timeoutMs = options.timeoutMs ?? 12_000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort('timeout'), timeoutMs)
  const startedAt = performance.now()

  const abortFromParent = () => controller.abort(options.signal?.reason)
  options.signal?.addEventListener('abort', abortFromParent, { once: true })

  try {
    const response = await fetchImpl(asset.glbPath, {
      signal: controller.signal,
      cache: 'force-cache'
    })

    if (!response.ok) {
      throw new CueIdAssetLoadError(
        'asset_http_error',
        `GLB request failed with HTTP ${response.status}`
      )
    }

    const contentLength = Number(response.headers.get('content-length') || 0)
    if (contentLength > asset.compressedBytes) {
      throw new CueIdAssetLoadError(
        'asset_too_large',
        `GLB response exceeds catalogue size: ${contentLength} > ${asset.compressedBytes}`
      )
    }

    let buffer: ArrayBuffer

    if (response.body) {
      const reader = response.body.getReader()
      const chunks: Uint8Array[] = []
      let totalBytes = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value) continue

        totalBytes += value.byteLength
        if (totalBytes > asset.compressedBytes) {
          await reader.cancel('asset_too_large')
          throw new CueIdAssetLoadError(
            'asset_too_large',
            `GLB stream exceeds catalogue size: ${totalBytes} > ${asset.compressedBytes}`
          )
        }
        chunks.push(value)
      }

      buffer = concatChunks(chunks, totalBytes)
    } else {
      buffer = await response.arrayBuffer()
      if (buffer.byteLength > asset.compressedBytes) {
        throw new CueIdAssetLoadError(
          'asset_too_large',
          `GLB response exceeds catalogue size: ${buffer.byteLength} > ${asset.compressedBytes}`
        )
      }
    }

    const header = validateGlb(buffer)

    return {
      buffer,
      bytes: buffer.byteLength,
      loadMs: Math.max(0, Math.round(performance.now() - startedAt)),
      declaredBytes: header.declaredBytes,
      version: header.version
    }
  } catch (error) {
    if (error instanceof CueIdAssetLoadError) throw error

    if (controller.signal.aborted) {
      throw new CueIdAssetLoadError('asset_timeout', 'GLB loading was aborted or timed out')
    }

    throw error
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener('abort', abortFromParent)
  }
}
