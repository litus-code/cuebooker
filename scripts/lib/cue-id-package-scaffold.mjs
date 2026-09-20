import { mkdir, writeFile, access } from 'node:fs/promises'
import { join } from 'node:path'

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
    visualReview: false,
    mobileReview: false,
    performance: {
      full: null,
      reduced: null
    }
  }

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

  const readme = `# CUE ID V2 asset package ${version}

This folder is a working handoff scaffold, not an approved production asset.

Expected flow:

1. Put the editable DCC source in source/
2. Export the authored GLB into export/
3. Put approved texture files in textures/
4. Run cue-id:inspect
5. Review and fill manifest/bindings.md
6. Run cue-id:plan-static
7. Export static renders into renders/ and the app public target path
8. Run cue-id:finalize-static
9. Run cue-id:validate-package
10. Complete visual/mobile/performance evidence
11. Run cue-id:assess
12. Run cue-id:propose-promotion
13. Human review before catalogue admission

The production catalogue must never be modified automatically.
`

  await Promise.all([
    writeNew(join(dirs.manifest, 'manifest.draft.json'), JSON.stringify(manifest, null, 2) + '\n'),
    writeNew(join(dirs.manifest, 'evidence.draft.json'), JSON.stringify(evidence, null, 2) + '\n'),
    writeNew(join(dirs.manifest, 'asset-metadata.draft.json'), JSON.stringify(metadata, null, 2) + '\n'),
    writeNew(join(dirs.manifest, 'bindings.md'), bindings),
    writeNew(join(root, 'README.md'), readme)
  ])

  return { root, dirs }
}
