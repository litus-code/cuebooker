type ProgressInfo = {
  status?: string
  progress?: number
}

type RawImageLike = {
  toBlob: (type?: string, quality?: number) => Promise<Blob>
}

type RawImageFactory = {
  fromBlob: (input: Blob) => Promise<unknown>
}

type BackgroundRemovalPipeline = (input: unknown) => Promise<RawImageLike[]>

const TRANSFORMERS_MODULE = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1'
const MODEL_ID = 'Xenova/modnet'

let pipelinePromise: Promise<BackgroundRemovalPipeline> | null = null
let rawImageFactoryPromise: Promise<RawImageFactory> | null = null

export function useArtistBackgroundRemoval() {
  const progress = ref(0)
  const loadingModel = ref(false)
  const processing = ref(false)
  const lastError = ref('')

  async function loadTransformersModule() {
    if (!import.meta.client) throw new Error('background_removal_client_only')

    const module = await import(/* @vite-ignore */ TRANSFORMERS_MODULE) as {
      pipeline: (
        task: string,
        model: string,
        options: Record<string, unknown>
      ) => Promise<BackgroundRemovalPipeline>
      RawImage: RawImageFactory
      env?: {
        allowLocalModels?: boolean
      }
    }

    if (module.env) module.env.allowLocalModels = false
    return module
  }

  async function getRawImageFactory() {
    if (!rawImageFactoryPromise) {
      rawImageFactoryPromise = loadTransformersModule()
        .then(module => module.RawImage)
        .catch(error => {
          rawImageFactoryPromise = null
          throw error
        })
    }
    return rawImageFactoryPromise
  }

  async function getPipeline() {
    if (!import.meta.client) throw new Error('background_removal_client_only')

    if (!pipelinePromise) {
      loadingModel.value = true
      progress.value = 0

      pipelinePromise = (async () => {
        const module = await loadTransformersModule()

        return module.pipeline('background-removal', MODEL_ID, {
          dtype: 'fp32',
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
    if (!import.meta.client) throw new Error('background_removal_client_only')

    processing.value = true
    progress.value = 0
    lastError.value = ''

    try {
      const [segmenter, RawImage] = await Promise.all([
        getPipeline(),
        getRawImageFactory()
      ])

      const input = await RawImage.fromBlob(source)
      const output = await segmenter(input)
      const image = output[0]
      if (!image) throw new Error('background_removal_empty_output')

      const cutout = await image.toBlob('image/png')
      if (!cutout.size) throw new Error('background_removal_empty_blob')

      progress.value = 100
      return cutout
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      lastError.value = message
      console.error('[CueBooker] Background removal failed:', error)
      throw error
    } finally {
      processing.value = false
    }
  }

  return {
    progress,
    loadingModel,
    processing,
    lastError,
    removeBackground
  }
}
