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

function creator3dV1Manifest(version) {
  return {
    manifestVersion: 1,
    family: 'club_minimal',
    assetVersion: version,
    glbPath: '/cue-id/lab/creator-v1.glb',
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
      bases: ['neutral'],
      builds: ['regular'],
      outfits: ['tee'],
      accessories: [null],
      poses: ['neutral', 'relaxed'],
      materials: ['matte'],
      accents: ['lime']
    },
    bindings: {
      morphs: {},
      poses: {},
      outfits: {},
      accessories: {},
      materials: {},
      creator: {
        capabilities: {
          skins: ['skin-03', 'skin-05'],
          faces: ['face-03', 'face-04'],
          hairs: ['textured-crop', 'curly-crop', 'locs'],
          facialHair: ['none', 'short-beard'],
          tops: ['oversized-tee', 'bomber'],
          bottoms: ['wide-trouser', 'cargo'],
          footwear: ['technical-sneaker', 'boot']
        },
        faces: {},
        skins: {
          'skin-03': '#b9805f',
          'skin-05': '#67402f'
        },
        hairs: {},
        facialHair: {},
        tops: {},
        bottoms: {},
        footwear: {}
      }
    }
  }
}

function creator3dV1Bindings(version) {
  return `# CUE ID Creator 3D V1 bindings review — ${version}

This is a lab authoring package, not a production admission package.

Canonical reviewed state:
- base: neutral
- build: regular
- skin: skin-03
- face: face-03
- hair: textured-crop
- facial hair: none
- top: oversized-tee
- bottom: wide-trouser
- footwear: technical-sneaker
- accessory: none
- pose: neutral
- material: matte
- accent: lime

Required first-slice aliases to inspect:
- cue_face_04
- cue_hair_textured_crop
- cue_hair_curly_crop
- cue_hair_locs
- cue_facial_short_beard
- cue_top_oversized_tee
- cue_top_bomber
- cue_bottom_wide_trouser
- cue_bottom_cargo
- cue_footwear_technical_sneaker
- cue_footwear_boot
- cue_pose_neutral
- cue_pose_relaxed
- cue_mat_body
- cue_mat_textile

Fill every binding from actual GLB inspection, never from assumption.

Full target:
docs/CUE_ID_CREATOR_3D_V1.md
`
}

function creator3dV1SculptSpec(version) {
  return `# CUE ID Creator 3D V1 sculpt spec — ${version}

## Reviewed baseline
- base: neutral
- build: regular
- skin: skin-03
- face: face-03
- hair: textured-crop
- facial hair: none
- top: oversized-tee
- bottom: wide-trouser
- footwear: technical-sneaker
- accessory: none
- pose: neutral
- material: matte

This is the first authored avatar slice, not the full V2 production matrix.

Visual target:
- adult and human;
- stylized-realistic;
- editorial / club-aware;
- believable at ~390 px;
- no mannequin anatomy;
- no perfect bilateral symmetry;
- no game/cartoon proportions;
- no bodybuilder default.

Required authored variants:
- skins: skin-03, skin-05
- faces: face-03 reference, face-04 morph
- hair: textured-crop, curly-crop, locs
- facial hair: none, short-beard
- tops: oversized-tee, bomber
- bottoms: wide-trouser, cargo
- footwear: technical-sneaker, boot
- poses: neutral, relaxed

One shared rig only.

Hard reject if:
- face morph looks like a different unrelated person;
- hair floats or clips through the head;
- garments use runtime scale hacks;
- limbs read cylindrical/mannequin-like;
- neutral pose reads as T-pose/rig test;
- silhouette loses human weight distribution;
- mobile product-size still reads as placeholder.

Budgets:
- 18k–28k triangles preferred
- 35k hard ceiling
- <=4 materials
- 1024 textures preferred
- compressed GLB 450–850 KB preferred
- 1 MB hard ceiling

Full target:
docs/CUE_ID_CREATOR_3D_V1.md
`
}

function creator3dV1Readme(version) {
  return `# CUE ID Creator 3D V1 lab package ${version}

This package is the first real authored avatar slice for the noindex /cue-id lab.

Flow:

1. Put the editable DCC source in source/
2. Author the neutral/regular human described in docs/CUE_ID_CREATOR_3D_V1.md
3. Export the GLB to export/creator-v1.glb
4. Copy the reviewed GLB to public/cue-id/lab/creator-v1.glb
5. Run cue-id:inspect against the exported GLB
6. Replace draft binding values with actual exported names
7. Wire the inspected partial manifest into CUE_ID_CREATOR_3D_LAB_CANDIDATE
8. Review /cue-id at desktop and mobile sizes
9. Run real-device reduced-tier review
10. Do not modify CUE_ID_PRODUCTION_CATALOGUE

The semantic/CSS preview remains fallback only.
`
}

export async function scaffoldCueIdV2Package(rootDir, version, options = {}) {
  ensureVersion(version)

  const profile = options.profile || 'v2'
  if (!['v2', 'creator-3d-v1'].includes(profile)) {
    throw new Error('unsupported CUE ID scaffold profile')
  }

  const root = join(
    rootDir,
    profile === 'creator-3d-v1'
      ? `cue-id-creator-3d-v1-${version}`
      : `cue-id-v2-${version}`
  )
  const dirs = {
    source: join(root, 'source'),
    export: join(root, 'export'),
    textures: join(root, 'textures'),
    renders: join(root, 'renders'),
    manifest: join(root, 'manifest')
  }

  await Promise.all(Object.values(dirs).map(dir => mkdir(dir, { recursive: true })))

  const manifest = profile === 'creator-3d-v1'
    ? creator3dV1Manifest(version)
    : {
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

  const bindings = profile === 'creator-3d-v1'
    ? creator3dV1Bindings(version)
    : `# CUE ID V2 bindings review — ${version}

Do not fill bindings from naming convention alone. Confirm every target against the authored asset.

Canonical reference:
- base: neutral
- build: regular
- outfit: tee
- accessory: none
- pose: neutral
- material: matte

Recommended export aliases are optional but preferred:
- cue_base_feminine
- cue_base_masculine
- cue_build_slim
- cue_build_strong
- cue_pose_neutral
- cue_pose_relaxed
- cue_pose_focused
- cue_pose_editorial
- cue_body
- cue_outfit_tee
- cue_footwear
- cue_mat_body
- cue_mat_textile
- cue_mat_technical
- cue_mat_accent

Full binding contract:
docs/CUE_ID_AUTHORED_BINDINGS_V2.md

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
- [ ] product-size still reviewed at ~390 px
- [ ] real-device iPhone-class review completed
- [ ] real-device Android mid-range review completed
- [ ] package inspector run
- [ ] static render plan generated
- [ ] static renders exported and reviewed
- [ ] static finalizer run
- [ ] package validator run
- [ ] full performance measured
- [ ] reduced performance measured
- [ ] intake assessor run
`

  const sculptSpec = profile === 'creator-3d-v1'
    ? creator3dV1SculptSpec(version)
    : `# CUE ID V2 sculpt / rig production spec — ${version}

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

Full production references:
docs/CUE_ID_SCULPT_SPEC_V2.md
docs/CUE_ID_AUTHORED_BINDINGS_V2.md
`

  const readme = profile === 'creator-3d-v1'
    ? creator3dV1Readme(version)
    : `# CUE ID V2 asset package ${version}

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
14. Generate combined evidence with cue-id:propose-evidence
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
