export type ArtistImageStyle = 'photo' | 'artwork' | 'duotone'
export type ArtistVisualSource = 'portrait' | 'cue_id'
export type ArtistPresentationMode = 'photo' | 'artwork' | 'cue_id'

export function getArtistPresentationMode(
  source: ArtistVisualSource,
  style: ArtistImageStyle
): ArtistPresentationMode {
  if (source === 'cue_id') return 'cue_id'
  return style === 'photo' ? 'photo' : 'artwork'
}

export function getArtistPresentationSelection(
  mode: ArtistPresentationMode,
  currentStyle: ArtistImageStyle
): {
  visualSource: ArtistVisualSource
  artistImageStyle?: ArtistImageStyle
} {
  if (mode === 'cue_id') {
    return {
      visualSource: 'cue_id'
    }
  }

  if (mode === 'photo') {
    return {
      visualSource: 'portrait',
      artistImageStyle: 'photo'
    }
  }

  return {
    visualSource: 'portrait',
    artistImageStyle: currentStyle === 'duotone' ? 'duotone' : 'artwork'
  }
}
