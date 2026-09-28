import { access } from 'node:fs/promises'
import { join } from 'node:path'

function toPublicFilePath(publicDir, assetPath) {
  if (typeof assetPath !== 'string' || !assetPath.startsWith('/')) {
    throw new Error(`Static asset path must be application-owned: ${assetPath}`)
  }

  return join(publicDir, assetPath.replace(/^\/+/, ''))
}

export async function finalizeCueIdStaticVariants({
  manifest,
  plan,
  publicDir
}) {
  if (!manifest?.capabilities || !manifest?.assetVersion) {
    throw new Error('manifest must contain assetVersion and capabilities')
  }

  if (!plan || plan.assetVersion !== manifest.assetVersion || !Array.isArray(plan.entries)) {
    throw new Error('static render plan does not match manifest assetVersion')
  }

  const variants = {}
  const missing = []

  for (const entry of plan.entries) {
    const portraitFile = toPublicFilePath(publicDir, entry.portrait)
    const squareFile = toPublicFilePath(publicDir, entry.square)

    try {
      await access(portraitFile)
    } catch {
      missing.push(entry.portrait)
    }

    try {
      await access(squareFile)
    } catch {
      missing.push(entry.square)
    }

    variants[entry.key] = {
      portrait: entry.portrait,
      square: entry.square
    }
  }

  if (missing.length) {
    throw new Error(
      `CUE ID static finalization found ${missing.length} missing render files:\n${missing.join('\n')}`
    )
  }

  return {
    ...manifest,
    static: {
      ...(manifest.static || {}),
      variants
    }
  }
}
