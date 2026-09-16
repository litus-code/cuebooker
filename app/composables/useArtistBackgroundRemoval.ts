type ProgressInfo = {
  status?: string
  progress?: number
}

type RawImageLike = {
  toBlob: (type?: string, quality?: number) => Promise<Blob>
}

type BackgroundRemovalPipeline = (input: Blob) => Promise<RawImageLike[]>

const TRANSFORMERS_MODULE = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.0.1'
const MODEL_ID = 'Xenova/modnet'

let pipelinePromise: Promise<BackgroundRemovalPipeline> | null = null

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
          dtype: 'q8',
          progress_callback: (info: ProgressInfo) => {
            if (typeof info.progress === 'number') {
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
      return await image.toBlob('image/png')
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
