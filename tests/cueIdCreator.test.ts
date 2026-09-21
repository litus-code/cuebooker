import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CUE_ID_CREATOR_CATALOGUE,
  DEFAULT_CUE_ID_CREATOR_CONFIG,
  cloneCueIdCreatorConfig,
  cueIdCreatorToRuntimeConfig,
  isCueIdCreatorConfigV1
} from '../app/domain/cueIdCreator.ts'

test('CUE ID creator default config stays inside the creator catalogue', () => {
  const config = DEFAULT_CUE_ID_CREATOR_CONFIG

  assert.equal(config.schemaVersion, 1)
  assert.ok(CUE_ID_CREATOR_CATALOGUE.bases.some(item => item.id === config.base))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.builds.some(item => item.id === config.build))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.skins.some(item => item.id === config.skin))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.faces.some(item => item.id === config.face))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.hairs.some(item => item.id === config.hair))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.facialHair.some(item => item.id === config.facialHair))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.tops.some(item => item.id === config.top))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.bottoms.some(item => item.id === config.bottom))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.footwear.some(item => item.id === config.footwear))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.accessories.some(item => item.id === config.accessory))
  assert.ok(CUE_ID_CREATOR_CATALOGUE.poses.some(item => item.id === config.pose))
})

test('CUE ID creator clone is independent from the default config', () => {
  const clone = cloneCueIdCreatorConfig()
  clone.hair = 'locs'
  clone.bottom = 'cargo'

  assert.equal(DEFAULT_CUE_ID_CREATOR_CONFIG.hair, 'textured-crop')
  assert.equal(DEFAULT_CUE_ID_CREATOR_CONFIG.bottom, 'wide-trouser')
  assert.equal(clone.hair, 'locs')
  assert.equal(clone.bottom, 'cargo')
})

test('creator base and build remain independent dimensions', () => {
  const feminineStrong = cueIdCreatorToRuntimeConfig({
    ...DEFAULT_CUE_ID_CREATOR_CONFIG,
    base: 'feminine',
    build: 'strong'
  })
  const masculineSlim = cueIdCreatorToRuntimeConfig({
    ...DEFAULT_CUE_ID_CREATOR_CONFIG,
    base: 'masculine',
    build: 'slim'
  })

  assert.equal(feminineStrong.base, 'feminine')
  assert.equal(feminineStrong.build, 'strong')
  assert.equal(masculineSlim.base, 'masculine')
  assert.equal(masculineSlim.build, 'slim')
})

test('creator config validator rejects incomplete or out-of-catalogue drafts', () => {
  assert.equal(isCueIdCreatorConfigV1(DEFAULT_CUE_ID_CREATOR_CONFIG), true)
  assert.equal(isCueIdCreatorConfigV1({ schemaVersion: 1 }), false)
  assert.equal(
    isCueIdCreatorConfigV1({
      ...DEFAULT_CUE_ID_CREATOR_CONFIG,
      hair: 'unknown-hair'
    }),
    false
  )
  assert.equal(
    isCueIdCreatorConfigV1({
      ...DEFAULT_CUE_ID_CREATOR_CONFIG,
      accessory: 'unknown-accessory'
    }),
    false
  )
})

test('creator top maps to the legacy runtime outfit without widening production semantics', () => {
  const cases = [
    ['oversized-tee', 'tee'],
    ['fitted-tee', 'tee'],
    ['tank', 'tank'],
    ['hoodie', 'hoodie'],
    ['bomber', 'bomber']
  ] as const

  for (const [top, expectedOutfit] of cases) {
    const runtime = cueIdCreatorToRuntimeConfig({
      ...DEFAULT_CUE_ID_CREATOR_CONFIG,
      top
    })
    assert.equal(runtime.outfit, expectedOutfit)
  }
})

test('creator-only appearance fields do not change the legacy runtime contract', () => {
  const baseline = cueIdCreatorToRuntimeConfig(DEFAULT_CUE_ID_CREATOR_CONFIG)
  const changed = cueIdCreatorToRuntimeConfig({
    ...DEFAULT_CUE_ID_CREATOR_CONFIG,
    skin: 'skin-06',
    face: 'face-06',
    hair: 'long-natural',
    facialHair: 'short-beard',
    bottom: 'denim',
    footwear: 'boot'
  })

  assert.deepEqual(changed, baseline)
})

test('CUE ID creator UI uses the creator config and runtime adapter', async () => {
  const source = await import('node:fs/promises')
  const component = await source.readFile(
    new URL('../app/components/CueIdCreator.vue', import.meta.url),
    'utf8'
  )

  assert.match(component, /CueIdCreatorConfigV1/)
  assert.match(component, /cueIdCreatorToRuntimeConfig\(props\.modelValue\)/)
  assert.match(component, /case 'skin'/)
  assert.match(component, /case 'face'/)
  assert.match(component, /case 'hair'/)
  assert.match(component, /case 'facialHair'/)
  assert.match(component, /case 'top'/)
  assert.match(component, /case 'bottom'/)
  assert.match(component, /case 'footwear'/)
  assert.match(component, /case 'pose'/)
  assert.doesNotMatch(component, /case 'material'/)
  assert.doesNotMatch(component, /case 'accent'/)
  assert.match(component, /optionVisualClass/)
  assert.match(component, /normalizeOptionVisualToken/)
  assert.match(component, /activeStep\.value\.toLowerCase\(\)/)
  assert.match(component, /value === 'null'/)
  assert.match(component, /creator__option-visual--skin/)
  assert.match(component, /creator__option-visual--hair/)
  assert.match(component, /creator__option-visual--top/)
  assert.match(component, /creator__option-visual--bottom/)
  assert.match(component, /creator__option-visual--footwear/)
  assert.match(component, /previewClasses/)
  assert.match(component, /creator__preview--base-/)
  assert.match(component, /creator__preview--build-/)
  assert.match(component, /creator__semantic-preview/)
  assert.match(component, /creator__semantic-neck/)
  assert.match(component, /creator__semantic-arm--left/)
  assert.match(component, /creator__semantic-arm--right/)
  assert.match(component, /creator__preview--skin-/)
  assert.match(component, /creator__preview--hair-/)
  assert.match(component, /creator__preview--top-/)
  assert.match(component, /creator__preview--bottom-/)
  assert.match(component, /creator__preview--footwear-/)
  assert.match(component, /creator__preview--face-/)
  assert.match(component, /creator__preview--facial-hair-/)
  assert.match(component, /creator__preview--accessory-/)
  assert.match(component, /creator__preview--pose-/)
  assert.match(component, /--creator-body-scale/)
  assert.match(component, /creator__preview--build-slim/)
  assert.match(component, /creator__preview--build-strong/)
  assert.match(component, /creator__preview--base-feminine/)
  assert.match(component, /creator__preview--base-masculine/)
  assert.doesNotMatch(component, /mix-blend-mode:screen/)
  assert.match(component, /creator__option-visual--relaxed::before/)
  assert.doesNotMatch(component, /\.creator__option-visual--relaxed\{transform:/)
  assert.match(component, /DRAFT_STORAGE_KEY/)
  assert.match(component, /isCueIdCreatorConfigV1/)
  assert.match(component, /localStorage\.setItem/)
  assert.match(component, /localStorage\.removeItem/)
  assert.match(component, /goPrevious/)
  assert.match(component, /goNext/)
  assert.match(component, /creator__progress/)
  assert.match(component, /creator__step-actions/)
  assert.match(component, /steps\.length/)
  assert.doesNotMatch(component, /{ id: 'material' as const/)
  assert.doesNotMatch(component, /{ id: 'accent' as const/)
  assert.match(component, /viewMode/)
  assert.match(component, /reviewBody/)
  assert.match(component, /finalBodyLab/)
  assert.match(component, /finalBodyProduction/)
  assert.doesNotMatch(component, /copy\.finalBody/)
  assert.match(component, /openReview/)
  assert.match(component, /closeReview/)
  assert.match(component, /creator__review-card/)
  assert.match(component, /creator__review-stage/)
  assert.match(component, /creator__review-tags/)
  assert.match(component, /selectedLabel/)
  assert.match(component, /getCueIdCreatorAssetStatusForConfig/)
  assert.match(component, /getCueIdCreatorVisualCoverage/)
  assert.match(component, /getCueIdCreatorRepresentation/)
  assert.match(component, /activeStepVisibleInAsset/)
  assert.match(component, /activeRepresentation/)
  assert.match(component, /shared_runtime_variant/)
  assert.match(component, /creator__coverage-note/)
  assert.doesNotMatch(component, /avatar de producción/)
  assert.doesNotMatch(component, /asset authored pendiente/i)
  assert.doesNotMatch(component, /fixture actual/i)
  assert.match(component, /assetStatus\.value\.source === 'lab_candidate'/)
  assert.match(component, /assetStatus\.assetVersion/)
  assert.match(component, /creatorUsesLabFixture/)
  assert.doesNotMatch(component, /creator__asset-status/)
  assert.doesNotMatch(component, /gatePerformance/)
  assert.doesNotMatch(component, /gatePackage/)
  assert.doesNotMatch(component, /gateMobile/)
  assert.match(component, /:interactive="!creatorUsesLabFixture"/)
  assert.match(component, /:show-placeholder-figure="!creatorUsesLabFixture"/)
  assert.doesNotMatch(component, /:lab-asset="creatorUsesLabFixture \? 'candidate' : null"/)
  assert.match(component, /v-if="creatorUsesLabFixture"/)
  assert.doesNotMatch(component, /v-if="isLastStep"[\s\S]*creator__review-button/)
  assert.doesNotMatch(component, /case 'outfit'/)
})
