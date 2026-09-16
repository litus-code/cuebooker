type ProgressInfo = {
  status?: string
  progress?: number
}

type RawImageLike = {
  data: Uint8ClampedArray | Uint8Array
  width: number
  height: number
  channels: number
}

type BackgroundRemovalPipeline = (input: Blob) => Promise<RawImageLike[]>

const TRANSFORMERS_MODULE = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/+esm'
const MODEL_ID = 'Xenova/modnet'

let pipelinePromise: Promise<BackgroundRemovalPipeline> | null = null

function rawImageToPngBlob(image: RawImageLike): Promise<Blob> {
  if (!import.meta.client) throw new Error('background_removal_client_only')
  if (image.channels !== 4) throw new Error('background_removal_invalid_output')

  const canvas = document.createElement('canvas')
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('background_removal_canvas_unavailable')

  const data = image.data instanceof Uint8ClampedArray
    ? image.data
    : new Uint8ClampedArray(image.data)

  context.putImageData(new ImageData(data, image.width, image.height), 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('background_removal_png_failed'))
    }, 'image/png')
  })
}

export function useArtistBackgroundRemoval() {
  const progress = ref(0)
  const loadingModel = ref(false)
  const processing = ref(false)

  async function getPipeline() {
    if (!import.meta.client) throw new Error('background_removal_client_only')

    if (!pipelinePromise) {
      loadingModel.value = true
      progress.value = 0

      pipelinePromise = (async () => {
        const module = await import(/* @vite-ignore */ TRANSFORMERS_MODULE) as {
          pipeline: (
            task: string,
            model: string,
            options: Record<string, unknown>
          ) => Promise<BackgroundRemovalPipeline>
        }

        return module.pipeline('background-removal', MODEL_ID, {
          dtype: 'fp32',
          progress_callback: (info: ProgressInfo) => {
            if (info.status === 'progress_total' && typeof info.progress === 'number') {
              progress.value = Math.max(0, Math.min(100, Math.round(info.progress)))
            }
          }
        })
      })()
        .catch(error => {
          pipelinePromise = null
          throw error
        })
        .finally(() => {
          loadingModel.value = false
        })
    }

    return pipelinePromise
  }

  async function removeBackground(source: Blob) {
    processing.value = true
    try {
      const segmenter = await getPipeline()
      const output = await segmenter(source)
      const image = output[0]
      if (!image) throw new Error('background_removal_empty_output')
      return await rawImageToPngBlob(image)
    } finally {
      processing.value = false
    }
  }

  return {
    progress,
    loadingModel,
    processing,
    removeBackground
  }
}
