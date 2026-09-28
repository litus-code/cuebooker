# CUE ID — Production Asset Contract V2

Updated: 19 September 2026
Status: TECHNICAL CONTRACT FOR THE NEXT AUTHORED ASSET

## 1. Goal

The production CUE ID asset must plug into Cuebooker without making product state depend on Blender, Three.js node names or the rejected procedural generator.

Product state remains semantic:

- base
- build
- outfit
- accessory
- pose
- material
- accent

The asset layer translates those semantics into implementation-specific mesh, rig, morph and material bindings.

## 2. Product data must not know DCC internals

Never persist or expose as product meaning:

- Blender object names;
- bone UUIDs;
- mesh UUIDs;
- Three.js object IDs;
- morph target indexes;
- animation clip indexes;
- material UUIDs;
- camera transforms;
- arbitrary file paths supplied by the browser.

Those values belong only to an application-owned asset manifest.

## 3. Manifest identity

Every accepted production family must provide an application-owned manifest with:

- manifestVersion;
- family;
- assetVersion;
- GLB path;
- static fallback paths;
- geometry/material/texture metadata;
- supported runtime tiers;
- semantic capabilities;
- semantic bindings.

Conceptual shape:

```ts
type CueIdProductionManifest = {
  manifestVersion: 1
  family: 'club_minimal'
  assetVersion: string
  glbPath: string
  static: {
    variants: Partial<Record<CueIdStaticVariantKey, {
      portrait: string
      square: string
    }>>
    editorialTransparent?: string | null
  }
  metrics: {
    compressedBytes: number
    triangles: number
    materials: number
    textures: number
    largestTextureDimension: number
  }
  supportedTiers: Array<'full' | 'reduced'>
  capabilities: {
    bases: Array<'feminine' | 'masculine' | 'neutral'>
    builds: Array<'slim' | 'regular' | 'strong'>
    outfits: string[]
    accessories: Array<string | null>
    poses: Array<'neutral' | 'relaxed' | 'focused' | 'editorial'>
    materials: Array<'matte' | 'satin'>
    accents: Array<'lime' | 'red' | null>
  }
  bindings: CueIdAssetBindings
}
```

## 4. Bindings are implementation detail

Bindings map product semantics to the authored asset.

Examples:

- base -> morph target or compatible mesh variant;
- build -> morph target;
- outfit -> visibility set / outfit mesh;
- pose -> animation clip or baked rig transform set;
- material -> application material preset / material slot mapping;
- accent -> material slot or vertex/material parameter;
- accessory -> visibility set / accessory mesh.

The product API does not care which mechanism is used.

## 5. Preferred V2 mechanism

For the first authored V2 asset, prefer:

- one shared humanoid skeleton;
- one authored base body topology where feasible;
- authored morphs/shape keys for base and build;
- one production-quality tee mesh compatible with all bases/builds;
- baked pose clips or a small stable bone transform map;
- shared PBR material slots;
- optional accessory meshes parented to the rig.

Avoid recreating body identity through dozens of arbitrary per-node scales.

## 6. Stable semantic aliases

Cuebooker owns stable aliases, not DCC names.

Example aliases:

- body;
- outfit.primary;
- accessory.headphones;
- accessory.cap;
- accessory.glasses;
- material.body;
- material.textile;
- material.technical;
- material.accent;
- rig.root;
- rig.head;
- rig.upper_arm.left;
- rig.upper_arm.right;
- rig.forearm.left;
- rig.forearm.right.

The manifest maps those aliases to the actual exported asset.

## 7. Morph contract

If morphs are used, they must be addressed by semantic key through the manifest.

Required conceptual morphs:

- base.feminine;
- base.masculine;
- base.neutral/reference;
- build.slim;
- build.strong;

Regular and neutral may be reference/default values rather than explicit morphs.

Morphs must be compatible with the shared tee and rig.

## 8. Pose contract

Required semantic poses:

- neutral;
- relaxed;
- focused;
- editorial.

Preferred export:

- named animation clips mapped in the manifest;
- or stable authored bone transforms if clips provide no benefit.

Pose implementation must move clothing consistently with the body. The renderer must not need parallel hand-maintained sleeve rotations as in the technical fixture.

## 9. Material contract

Target slots:

- body/sculptural;
- textile;
- technical dark;
- accent.

Material names inside the GLB are not product API.

The manifest maps application semantic slots to exported material slots.

Accent must remain optional and restrained.

## 10. Static contract

Every production asset version must ship with static output derived from the same accepted authored source asset.

Static output is keyed by the complete visible semantic configuration:

```text
base + build + outfit + accessory + pose + material + accent
```

Key example:

```text
neutral__regular__tee__none__neutral__matte__lime
```

For every configuration declared by manifest capabilities, the manifest must provide:

- one portrait static render;
- one square static render.

No fallback is allowed between base, build, pose, accessory, material or accent states.

All static paths must be application-owned and versioned with the same `assetVersion`.

`editorialTransparent` remains optional and is not a substitute for semantic static coverage.

## 11. Compatibility validation

Before an asset can enter the production catalogue, validation must prove:

- every declared binding resolves;
- required semantic options are supported;
- no required mesh/material binding is missing;
- morph targets produce valid bounds;
- pose clips exist and are loadable;
- static outputs match the same assetVersion;
- geometry/material/texture budgets pass;
- reduced tier can load the asset within its performance gate.

## 12. Runtime boundary

CueIdScene.client.vue should eventually consume a resolved production manifest, not import fixture-specific base/build/outfit node maps.

Target boundary:

```text
CueIdConfigV1
      |
      v
resolveCueIdAsset(config, runtimeTier)
      |
      v
CueIdProductionManifest + resolved semantic bindings
      |
      v
CueIdScene.client.vue
```

This keeps TresJS replaceable and keeps product meaning renderer-agnostic.

## 13. Fixture separation

The current procedural candidate remains allowed to use its existing node-map implementation because it is a test fixture.

Do not force V2 production art to adopt those node names.

Do not migrate fixture-specific semantics into persisted product data.

## 14. Promotion gate

Only after visual approval, real-device mobile review, package validation and the required performance gate may an authored V2 asset be proposed for production-catalogue admission.

Until then:

- production catalogue stays empty;
- /cue-id may continue to use the technical fixture;
- Artist Profile persistence remains semantic and stable;
- static-approved and interactive-approved remain explicit admission stages;
- production remains untouched.
