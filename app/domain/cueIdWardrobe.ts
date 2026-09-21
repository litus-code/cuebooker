import type {
  CueIdStylizedBodyId,
  CueIdStylizedBottomId,
  CueIdStylizedFaceAccessoryId,
  CueIdStylizedFootwearId,
  CueIdStylizedHeadwearId,
  CueIdStylizedOnePieceId,
  CueIdStylizedTopId,
  CueIdStylizedTorsoAccessoryId
} from './cueIdStylizedCreator.ts'

export type CueIdWardrobeLayer =
  | 'body'
  | 'underwear'
  | 'base'
  | 'outer'
  | 'overlay'
  | 'head'
  | 'face'
  | 'feet'

export type CueIdCoverageZone =
  | 'chest'
  | 'abdomen'
  | 'back'
  | 'pelvis'
  | 'upper-leg'
  | 'lower-leg'
  | 'upper-arm'
  | 'lower-arm'
  | 'feet'
  | 'head'
  | 'face'

export type CueIdModestyRule =
  | 'keep-underwear'
  | 'hide-bra'
  | 'hide-brief'
  | 'hide-all-underwear'

export type CueIdBodyFitMap = Record<CueIdStylizedBodyId, string | null>

export type CueIdWardrobeAsset = {
  id: string
  category:
    | 'top'
    | 'bottom'
    | 'one-piece'
    | 'footwear'
    | 'torso-accessory'
    | 'headwear'
    | 'face-accessory'
  layer: CueIdWardrobeLayer
  fits: CueIdBodyFitMap
  coverage: CueIdCoverageZone[]
  modestyRule: CueIdModestyRule
  colorable: boolean
  allowWithHarness: boolean
  allowWithOuterwear: boolean
}

function both(id: string): CueIdBodyFitMap {
  return {
    male: `${id}_male_fit`,
    female: `${id}_female_fit`
  }
}

export const CUE_ID_WARDROBE_ASSETS: CueIdWardrobeAsset[] = [
  {
    id: 'tee',
    category: 'top',
    layer: 'base',
    fits: both('tee'),
    coverage: ['chest', 'abdomen', 'back', 'upper-arm'],
    modestyRule: 'hide-bra',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'tank',
    category: 'top',
    layer: 'base',
    fits: both('tank'),
    coverage: ['chest', 'abdomen', 'back'],
    modestyRule: 'hide-bra',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'mesh-top',
    category: 'top',
    layer: 'base',
    fits: both('mesh-top'),
    coverage: ['chest', 'abdomen', 'back'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'festival-top',
    category: 'top',
    layer: 'base',
    fits: both('festival-top'),
    coverage: ['chest'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'sweatshirt',
    category: 'top',
    layer: 'base',
    fits: both('sweatshirt'),
    coverage: ['chest', 'abdomen', 'back', 'upper-arm', 'lower-arm'],
    modestyRule: 'hide-bra',
    colorable: true,
    allowWithHarness: false,
    allowWithOuterwear: true
  },
  {
    id: 'hoodie',
    category: 'top',
    layer: 'outer',
    fits: both('hoodie'),
    coverage: ['chest', 'abdomen', 'back', 'upper-arm', 'lower-arm'],
    modestyRule: 'hide-bra',
    colorable: true,
    allowWithHarness: false,
    allowWithOuterwear: false
  },
  {
    id: 'bomber',
    category: 'top',
    layer: 'outer',
    fits: both('bomber'),
    coverage: ['chest', 'back', 'upper-arm', 'lower-arm'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: false
  },
  {
    id: 'wide-trouser',
    category: 'bottom',
    layer: 'base',
    fits: both('wide-trouser'),
    coverage: ['pelvis', 'upper-leg', 'lower-leg'],
    modestyRule: 'hide-brief',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'straight-trouser',
    category: 'bottom',
    layer: 'base',
    fits: both('straight-trouser'),
    coverage: ['pelvis', 'upper-leg', 'lower-leg'],
    modestyRule: 'hide-brief',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'cargo',
    category: 'bottom',
    layer: 'base',
    fits: both('cargo'),
    coverage: ['pelvis', 'upper-leg', 'lower-leg'],
    modestyRule: 'hide-brief',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'shorts',
    category: 'bottom',
    layer: 'base',
    fits: both('shorts'),
    coverage: ['pelvis', 'upper-leg'],
    modestyRule: 'hide-brief',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'skirt',
    category: 'bottom',
    layer: 'base',
    fits: both('skirt'),
    coverage: ['pelvis', 'upper-leg'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'utility-trouser',
    category: 'bottom',
    layer: 'base',
    fits: both('utility-trouser'),
    coverage: ['pelvis', 'upper-leg', 'lower-leg'],
    modestyRule: 'hide-brief',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'harem-trouser',
    category: 'bottom',
    layer: 'base',
    fits: both('harem-trouser'),
    coverage: ['pelvis', 'upper-leg', 'lower-leg'],
    modestyRule: 'hide-brief',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'festival-wrap',
    category: 'bottom',
    layer: 'overlay',
    fits: both('festival-wrap'),
    coverage: ['pelvis', 'upper-leg'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'jumpsuit',
    category: 'one-piece',
    layer: 'base',
    fits: both('jumpsuit'),
    coverage: ['chest', 'abdomen', 'back', 'pelvis', 'upper-leg', 'lower-leg'],
    modestyRule: 'hide-all-underwear',
    colorable: true,
    allowWithHarness: false,
    allowWithOuterwear: true
  },
  {
    id: 'bodysuit',
    category: 'one-piece',
    layer: 'base',
    fits: both('bodysuit'),
    coverage: ['chest', 'abdomen', 'back', 'pelvis'],
    modestyRule: 'hide-all-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'festival-outfit',
    category: 'one-piece',
    layer: 'base',
    fits: both('festival-outfit'),
    coverage: ['chest', 'abdomen', 'back', 'pelvis', 'upper-leg'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'harness',
    category: 'torso-accessory',
    layer: 'overlay',
    fits: both('harness'),
    coverage: ['chest', 'back'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'cap',
    category: 'headwear',
    layer: 'head',
    fits: both('cap'),
    coverage: ['head'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'beanie',
    category: 'headwear',
    layer: 'head',
    fits: both('beanie'),
    coverage: ['head'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'top-hat',
    category: 'headwear',
    layer: 'head',
    fits: both('top-hat'),
    coverage: ['head'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'festival-hood',
    category: 'headwear',
    layer: 'head',
    fits: both('festival-hood'),
    coverage: ['head'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'mask',
    category: 'face-accessory',
    layer: 'face',
    fits: both('mask'),
    coverage: ['face'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'venetian-mask',
    category: 'face-accessory',
    layer: 'face',
    fits: both('venetian-mask'),
    coverage: ['face'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'sunglasses',
    category: 'face-accessory',
    layer: 'face',
    fits: both('sunglasses'),
    coverage: ['face'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'festival-goggles',
    category: 'face-accessory',
    layer: 'face',
    fits: both('festival-goggles'),
    coverage: ['face'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'vans-style',
    category: 'footwear',
    layer: 'feet',
    fits: both('vans-style'),
    coverage: ['feet'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'technical-sneaker',
    category: 'footwear',
    layer: 'feet',
    fits: both('technical-sneaker'),
    coverage: ['feet'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'boot',
    category: 'footwear',
    layer: 'feet',
    fits: both('boot'),
    coverage: ['feet'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'platform-boot',
    category: 'footwear',
    layer: 'feet',
    fits: both('platform-boot'),
    coverage: ['feet'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  },
  {
    id: 'sandal',
    category: 'footwear',
    layer: 'feet',
    fits: both('sandal'),
    coverage: ['feet'],
    modestyRule: 'keep-underwear',
    colorable: true,
    allowWithHarness: true,
    allowWithOuterwear: true
  }
]

export function getCueIdWardrobeAsset(id: string) {
  return CUE_ID_WARDROBE_ASSETS.find(asset => asset.id === id) ?? null
}

export function cueIdWardrobeFitForBody(
  id: string,
  body: CueIdStylizedBodyId
) {
  return getCueIdWardrobeAsset(id)?.fits[body] ?? null
}

export function cueIdModestyForSelection(selection: {
  top?: CueIdStylizedTopId
  bottom?: CueIdStylizedBottomId
  onePiece?: CueIdStylizedOnePieceId
  torsoAccessory?: CueIdStylizedTorsoAccessoryId
}) {
  if (selection.onePiece && selection.onePiece !== 'none') {
    return getCueIdWardrobeAsset(selection.onePiece)?.modestyRule ?? 'keep-underwear'
  }

  const rules = [
    selection.top ? getCueIdWardrobeAsset(selection.top)?.modestyRule : null,
    selection.bottom ? getCueIdWardrobeAsset(selection.bottom)?.modestyRule : null,
    selection.torsoAccessory && selection.torsoAccessory !== 'none'
      ? getCueIdWardrobeAsset(selection.torsoAccessory)?.modestyRule
      : null
  ].filter(Boolean) as CueIdModestyRule[]

  if (rules.includes('hide-all-underwear')) return 'hide-all-underwear'
  if (rules.includes('hide-bra') && rules.includes('hide-brief')) return 'hide-all-underwear'
  if (rules.includes('hide-bra')) return 'hide-bra'
  if (rules.includes('hide-brief')) return 'hide-brief'
  return 'keep-underwear'
}

export function cueIdWardrobeSupportsBody(
  id: string,
  body: CueIdStylizedBodyId
) {
  return Boolean(cueIdWardrobeFitForBody(id, body))
}

export function cueIdWardrobeIsSharedAcrossBodies(id: string) {
  const asset = getCueIdWardrobeAsset(id)
  return Boolean(asset?.fits.male && asset?.fits.female)
}

export function cueIdHarnessCompatibleWithTop(top: CueIdStylizedTopId) {
  return getCueIdWardrobeAsset(top)?.allowWithHarness ?? false
}

export function cueIdHarnessCompatibleWithSelection(selection: {
  top: CueIdStylizedTopId
  onePiece: CueIdStylizedOnePieceId
}) {
  if (selection.onePiece !== 'none') {
    return getCueIdWardrobeAsset(selection.onePiece)?.allowWithHarness ?? false
  }

  return cueIdHarnessCompatibleWithTop(selection.top)
}

export function cueIdOuterwearCompatibleWithTop(top: CueIdStylizedTopId) {
  return getCueIdWardrobeAsset(top)?.allowWithOuterwear ?? false
}

export type CueIdWardrobeIds = {
  tops: CueIdStylizedTopId
  bottoms: CueIdStylizedBottomId
  onePieces: CueIdStylizedOnePieceId
  footwear: CueIdStylizedFootwearId
  torsoAccessories: CueIdStylizedTorsoAccessoryId
  headwear: CueIdStylizedHeadwearId
  faceAccessories: CueIdStylizedFaceAccessoryId
}
