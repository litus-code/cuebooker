import { mkdir, writeFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import { createCueIdSculptReviewDraft } from './cue-id-sculpt-review.mjs'
import { createCueIdMobileReviewDraft } from './cue-id-mobile-review.mjs'
import { createCueIdPerformanceReviewDraft } from './cue-id-performance-review.mjs'

function ensureVersion(version) {
  if (!version || !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version)) {
    throw new Error('asset version must use x.y.z format')
  }
}

async function writeNew(path, content) {
  try {
    await access(path)
    throw new Error(`Refusing to overwrite existing file: ${path}`)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  await writeFile(path, content, 'utf8')
}

export async function scaffoldCueIdV2Package(rootDir, version) {
  ensureVersion(version)

  const root = join(rootDir, `cue-id-v2-${version}`)
  const dirs = {
    source: join(root, 'source'),
    export: join(root, 'export'),
    textures: join(root, 'textures'),
    renders: join(root, 'renders'),
    manifest: join(root, 'manifest')
  }

  await Promise.all(Object.values(dirs).map(dir => mkdir(dir, { recursive: true })))

  const manifest = {
    manifestVersion: 1,
    family: 'club_minimal',
    assetVersion: version,
    glbPath: `/cue-id/production/cue-id-club-minimal-${version}.glb`,
    static: { variants: {} },
    metrics: {
      compressedBytes: 0,
      triangles: 0,
      materials: 0,
      textures: 0,
      largestTextureDimension: 0
    },
    supportedTiers: ['full', 'reduced'],
    capabilities: {
      bases: ['feminine', 'masculine', 'neutral'],
      builds: ['slim', 'regular', 'strong'],
      outfits: ['tee'],
      accessories: [null],
      poses: ['neutral', 'relaxed', 'focused', 'editorial'],
      materials: ['matte'],
      accents: ['lime', 'red', null]
    },
    bindings: {
      morphs: {},
      poses: {},
      outfits: {},
      accessories: {},
      materials: {}
    }
  }

  const evidence = {
    assetVersion: version,
    visualReview: false,
    mobileReview: false,
    performance: {
      full: null,
      reduced: null
    }
  }

  const sculptReview = createCueIdSculptReviewDraft(version)
  const mobileReview = createCueIdMobileReviewDraft(version)
  const performanceReview = createCueIdPerformanceReviewDraft(version)

  const metadata = {
    assetVersion: version,
    sourceTool: null,
    sourceToolVersion: null,
    triangles: null,
    vertices: null,
    materials: null,
    textures: null,
    largestTextureDimension: null,
    sourceBytes: null,
    exportedGlbBytes: null,
    morphTargets: [],
    animationClips: [],
    knownLimitations: []
  }

  const bindings = `# CUE ID V2 bindings review — ${version}

Do not fill bindings from naming convention alone. Confirm every target against the authored asset.

## Bases
- feminine -> 
- neutral -> reference/default
- masculine -> 

## Builds
- slim -> 
- regular -> reference/default
- strong -> 

## Outfit
- tee nodes -> 

## Poses
- neutral -> 
- relaxed -> 
- focused -> 
- editorial -> 

## Materials
- body -> 
- textile -> 
- technical -> 
- accent -> 

## Rig aliases
- root -> 
- head -> 
- upperArm.L / upperArm.R -> 
- forearm.L / forearm.R -> 
- thigh.L / thigh.R -> 
- foot.L / foot.R -> 

## Review checklist
- [ ] feminine / neutral / masculine reviewed on regular build
- [ ] slim / strong reviewed independently on all three bases
- [ ] tee deformation reviewed on all bases/builds
- [ ] no-accessory identity reads correctly
- [ ] neutral / relaxed / focused / editorial poses reviewed
- [ ] mobile still reviewed at ~390 px
- [ ] package inspector run
- [ ] static render plan generated
- [ ] static renders exported and reviewed
- [ ] static finalizer run
- [ ] package validator run
- [ ] full performance measured
- [ ] reduced performance measured
- [ ] intake assessor run
`

  const sculptSpec = `# CUE ID V2 sculpt / rig production spec — ${version}

## Canonical baseline
- base: neutral
- build: regular
- outfit: tee
- accessory: none
- pose: neutral
- material: matte

Base and build are independent semantic dimensions.

Required regular-base gate:
- feminine + regular
- neutral + regular
- masculine + regular

All three must use the same apparent height, camera, lighting, tee, shoes and neutral pose.

Do not use:
- feminine = slim shorthand
- masculine = strong shorthand
- hairstyle/accessories to rescue base identity
- uniform object scale for build
- gender-coded pose variants

Build review matrix:
- feminine: slim / regular / strong
- neutral: slim / regular / strong
- masculine: slim / regular / strong

Sculpt priorities:
1. head / jaw / neck
2. shoulder / clavicle
3. tee shoulder / sleeve
4. hand / thumb / wrist
5. pelvis / hip
6. knee / ankle
7. footwear

Head:
- sculptural facial planes
- shallow eye sockets
- restrained nose and mouth planes
- shaved/minimal scalp for baseline review
- no photoreal skin dependency

Rig:
- one shared skeleton preferred
- root/pelvis, spine, neck/head
- clavicle, upper arm, forearm, hand L/R
- thigh, lower leg, foot L/R
- finger bones optional

Required pose clips:
- neutral
- relaxed
- focused
- editorial

Final frame of each clip is the product target.

Hard reject if:
- feminine regular reads slim by construction
- masculine regular reads strong by construction
- neutral reads unfinished
- base identity collapses across build morphs
- head needs styling to work
- tee hides anatomy rather than fitting it
- mobile-size still reads as mannequin/game avatar

Full production reference:
docs/CUE_ID_SCULPT_SPEC_V2.md
`

  const readme = `# CUE ID V2 asset package ${version}

This folder is a working handoff scaffold, not an approved production asset.

Expected flow:

1. Put the editable DCC source in source/
2. Export the authored GLB into export/
3. Put approved texture files in textures/
4. Follow SCULPT_SPEC.md for base/build/rig/pose production
5. Complete sculpt-review.draft.json gate by gate
6. Complete mobile-review.draft.json on real devices
7. Record measured full/reduced timings in performance-review.draft.json
8. Run cue-id:inspect
9. Review and fill manifest/bindings.md
10. Run cue-id:plan-static
11. Export static renders into renders/ and the app public target path
12. Run cue-id:finalize-static
13. Run cue-id:validate-package
14. Complete visual/mobile/performance evidence
15. Run cue-id:assess
16. Run cue-id:propose-promotion
17. Human review before catalogue admission

The production catalogue must never be modified automatically.
`

  await Promise.all([
    writeNew(join(dirs.manifest, 'manifest.draft.json'), JSON.stringify(manifest, null, 2) + '\n'),
    writeNew(join(dirs.manifest, 'evidence.draft.json'), JSON.stringify(evidence, null, 2) + '\n'),
    writeNew(join(dirs.manifest, 'asset-metadata.draft.json'), JSON.stringify(metadata, null, 2) + '\n'),
    writeNew(join(dirs.manifest, 'sculpt-review.draft.json'), JSON.stringify(sculptReview, null, 2) + '\n'),
    writeNew(join(dirs.manifest, 'mobile-review.draft.json'), JSON.stringify(mobileReview, null, 2) + '\n'),
    writeNew(join(dirs.manifest, 'performance-review.draft.json'), JSON.stringify(performanceReview, null, 2) + '\n'),
    writeNew(join(dirs.manifest, 'bindings.md'), bindings),
    writeNew(join(root, 'SCULPT_SPEC.md'), sculptSpec),
    writeNew(join(root, 'README.md'), readme)
  ])

  return { root, dirs }
}
