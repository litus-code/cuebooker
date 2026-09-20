# CUE ID — Source Asset Package V2

Updated: 19 September 2026
Status: PRODUCTION HANDOFF SPECIFICATION

## 1. Purpose

This package defines exactly what the authored CUE ID V2 source asset must contain before Cuebooker treats it as an integration candidate.

It is designed for an external or internal 3D artist working in Blender, Maya, Cinema 4D or equivalent DCC software.

The DCC tool is not part of the product contract.

## 2. Required deliverables

Every V2 candidate delivery must include:

- editable source DCC file;
- exported medium GLB;
- optional light/high derived GLBs if already produced;
- texture source files;
- exported compressed texture files used by the GLB;
- static review renders;
- manifest metadata sheet;
- ownership/license statement;
- short export notes.

## 3. Recommended package layout

```text
cue-id-v2/
├── source/
│   └── cue-id-club-minimal-v2.<dcc>
├── export/
│   ├── cue-id-club-minimal-v2-medium.glb
│   ├── cue-id-club-minimal-v2-light.glb        # optional
│   └── cue-id-club-minimal-v2-high.glb         # optional
├── textures/
│   ├── cue-id-v2-basecolor.*
│   ├── cue-id-v2-roughness.*
│   ├── cue-id-v2-normal.*                      # optional
│   └── cue-id-v2-ao.*                          # optional
├── renders/
│   ├── feminine-neutral-portrait.webp
│   ├── neutral-neutral-portrait.webp
│   ├── masculine-neutral-portrait.webp
│   ├── feminine-editorial-portrait.webp
│   ├── neutral-editorial-portrait.webp
│   ├── masculine-editorial-portrait.webp
│   ├── neutral-square.webp
│   └── editorial-transparent.png
└── manifest/
    ├── asset-metadata.json
    ├── bindings.md
    └── license.txt
```

## 4. Source scene requirements

The editable source scene must:

- use real-world-consistent scale;
- have a clean origin/root;
- avoid unapplied destructive transforms where they complicate export;
- keep production meshes clearly separated from concept/reference objects;
- remove hidden junk geometry before handoff;
- avoid non-exportable modifiers unless they are intentionally baked;
- contain no copyrighted third-party assets without explicit licensing.

## 5. Shared rig

Preferred V2 architecture is one shared humanoid rig.

Minimum required deformation areas:

- root/pelvis;
- spine/chest;
- neck/head;
- left/right clavicle;
- upper arm;
- forearm;
- hand;
- thigh;
- shin;
- foot.

No facial rig is required.

No finger animation rig is required for V1.

The tee must deform with the same rig and must not require a second independent pose system.

## 6. Base morphs

The source asset must support:

- feminine;
- masculine;
- neutral.

Preferred implementation:

- neutral as authored reference mesh;
- feminine and masculine as shape keys / blend shapes;
- or three topology-compatible body variants if morphs are unsuitable.

All three bases must remain compatible with:

- the same skeleton;
- the same editorial tee;
- the same pose set;
- the same material system.

## 7. Build morphs

Required builds:

- slim;
- regular;
- strong.

Preferred implementation:

- regular as reference;
- slim and strong as authored body morphs;
- clothing deformation/morphs authored to match.

Build must not override base identity.

## 8. First production outfit

Only one outfit is mandatory for the first V2 production candidate:

**Editorial club tee**

Requirements:

- structured but natural silhouette;
- slightly dropped or relaxed shoulder;
- believable sleeve opening;
- readable hem;
- no logos;
- no fake tour graphics;
- no fashion-brand imitation;
- compatible with all three bases/builds.

Tank, hoodie and bomber are deliberately deferred until the tee passes.

## 9. Head and face

The head must be authored, not placeholder geometry.

Required readable planes:

- forehead;
- brow/eye socket;
- cheek;
- nose bridge/plane;
- jaw;
- chin;
- ear placement.

Do not use photoreal eyeballs.

Do not rely on hair to create head identity.

A no-hair/no-accessory review render must be supplied.

## 10. Hands

Hands may remain simplified but must include:

- palm volume;
- thumb separation;
- wrist taper;
- believable neutral orientation.

Individual finger rigging is not required.

## 11. Footwear

The first candidate must include authored footwear, not geometric placeholders.

Minimum read:

- ankle opening;
- heel;
- mid-foot;
- toe;
- sole thickness.

## 12. Pose set

Required poses:

- neutral;
- relaxed;
- focused;
- editorial.

Preferred delivery is named animation clips.

Clip naming may be DCC-specific in source, but a mapping sheet must identify the semantic equivalent.

Neutral must not be T-pose.

## 13. Materials

Preferred material slots:

- body / sculptural skin;
- textile;
- technical dark;
- accent.

Keep total production material count <= 4.

Use physically plausible roughness/metalness values.

Accent must occupy a small visual area.

## 14. Textures

Preferred:

- one shared 1024 atlas where practical;
- baked AO;
- roughness detail;
- optional normal map only where it materially improves garment/head/shoe read.

Hard rules:

- no 4K textures;
- no texture larger than 2048;
- no alpha-heavy hair cards in V2 first candidate;
- no unique texture set for tiny accessories.

## 15. Geometry target

Medium production target:

- preferred 18k–28k triangles;
- hard ceiling 35k;
- <= 4 materials;
- <= 6 textures;
- <= 1 MB compressed GLB.

Geometry priority:

1. head;
2. shoulder/torso silhouette;
3. hands;
4. tee silhouette/folds;
5. footwear;
6. knees/elbows only as needed.

## 16. Static review renders

Before GLB integration, provide still renders at product-like framing.

Mandatory:

- feminine regular neutral;
- neutral regular neutral;
- masculine regular neutral;
- feminine regular editorial;
- neutral regular editorial;
- masculine regular editorial.

Also provide:

- one square crop;
- one transparent editorial export;
- one no-accessory/no-hair concept check.

## 17. Mobile review framing

Review at approximately:

- 390 px viewport width;
- portrait stage;
- full body visible;
- no diagnostics overlay;
- DPR 1 equivalent visual sharpness.

The asset should not require desktop zoom to look credible.

## 18. Export requirements

GLB export must:

- embed or correctly reference only approved assets;
- preserve animation clips/morphs needed by the manifest;
- avoid unnecessary cameras/lights unless explicitly required;
- avoid unused meshes/materials/textures;
- use predictable root transform;
- load cleanly with Three GLTFLoader;
- avoid custom extensions unless explicitly approved.

## 19. Metadata handoff

asset-metadata.json must include:

- assetVersion;
- source tool/version;
- triangle count;
- vertex count;
- material count;
- texture count;
- largest texture dimension;
- uncompressed source size;
- exported GLB bytes;
- available morphs;
- available clips;
- known limitations.

## 20. Bindings handoff

bindings.md must map the authored asset to Cuebooker semantics.

At minimum identify:

- base morphs/variants;
- build morphs;
- tee mesh;
- pose clips;
- material slots;
- accent slot;
- rig root;
- head bone;
- arm/forearm bones;
- leg/foot bones.

These source names are not persisted product data. They are consumed into the application-owned production manifest.

## 21. Ownership

Delivery must include explicit confirmation that Cuebooker has the rights required to ship, modify, optimize and render the asset in product and exported static media.

Do not integrate uncertain-license assets.

## 22. Acceptance sequence

1. still-image art review;
2. three-base review;
3. tee fit review;
4. mobile still review;
5. source package completeness;
6. GLB export inspection;
7. production manifest validation;
8. runtime benchmark;
9. static/interactive parity;
10. catalogue promotion decision.

## 23. Non-goals for first source package

Do not require:

- hair catalogue;
- multiple outfits;
- facial animation;
- finger animation;
- physics cloth;
- dynamic hair;
- skin customization sliders;
- tattoos;
- jewelry catalogue;
- procedural body editor.

The first source package exists to prove one excellent authored identity family.

## 24. Pose clip evaluation convention

For V2 semantic pose clips, the final frame of each named clip is the authored target pose.

The production renderer resolves the semantic clip name through the manifest and evaluates that clip at its final frame.

This convention allows clips to contain a short authored transition if useful while keeping the product stage deterministic and on-demand after the pose has been applied.

Required semantic clips remain:

- neutral;
- relaxed;
- focused;
- editorial.

Do not depend on continuous animation for identity correctness.

## 25. GLB inspection workflow

Every authored GLB should be inspected before manifest bindings are authored.

Command:

```bash
npm run cue-id:inspect -- path/to/cue-id-v2.glb
```

To also create a manifest draft:

```bash
npm run cue-id:inspect -- path/to/cue-id-v2.glb --manifest-draft /tmp/cue-id-manifest.json --asset-version 2.0.0
```

The inspector reports:

- GLB version and byte size;
- triangle count derived from accessors;
- scene/node/mesh/skin counts;
- discovered node names;
- discovered morph target names;
- animation clip names;
- material names;
- texture/image counts;
- per-mesh morph target inventory.

The manifest draft intentionally leaves semantic bindings empty.

Do not auto-map names such as `base_feminine` or `pose_editorial` into production bindings purely by naming convention. A human review must confirm that each discovered target/clip/node actually represents the intended product semantic.

The inspector is an audit aid, not an asset-approval shortcut.

## 26. Package validation workflow

After the manifest bindings have been reviewed manually, validate the package against the actual GLB:

```bash
npm run cue-id:validate-package -- path/to/cue-id-v2.glb path/to/manifest.json
```

The validator checks:

- manifest byte count against the GLB;
- manifest triangle count against the GLB;
- material count;
- texture count;
- every morph binding resolves to a discovered morph target;
- every pose binding resolves to a discovered animation clip;
- every outfit/accessory binding resolves to an exported node;
- every semantic material binding resolves to an exported material;
- outfit/accessory visibility bindings do not reuse the same node.

A package must pass this command before catalogue admission.

This validator complements, but does not replace, visual review or runtime benchmarking.

## 27. Semantic static render matrix

Static CUE ID output must represent the exact visible semantic configuration, not a generic portrait for the whole asset version.

Static variant key:

```text
<base>__<build>__<outfit>__<accessory|none>__<pose>__<material>__<accent|none>
```

Example:

```text
feminine__regular__tee__none__editorial__matte__red
```

For every configuration declared in manifest capabilities, the package must provide:

- portrait static render;
- square static render.

Rules:

- no fallback from one base to another;
- no fallback from strong/slim to regular;
- no fallback from one pose to another;
- no fallback from selected accessory to none;
- no material/accent substitution;
- paths must be application-owned;
- renders should be generated in batch from the same authored asset and semantic configuration used by the interactive renderer.

`cue-id:validate-package` checks semantic static coverage before catalogue admission.

## 28. Static render planning workflow

After a manifest draft defines its semantic capabilities, generate the deterministic static render plan:

```bash
npm run cue-id:plan-static -- path/to/manifest.json
```

Optional output file:

```bash
npm run cue-id:plan-static -- path/to/manifest.json --output /tmp/cue-id-static-plan.json
```

The plan contains:

- the complete semantic variant key;
- proposed portrait path;
- proposed square path;
- total render count.

Default path format:

```text
/cue-id/production/static/<assetVersion>/<semantic-key>-portrait.webp
/cue-id/production/static/<assetVersion>/<semantic-key>-square.webp
```

The planner does not mutate the manifest and does not claim that the files exist.

Workflow:

1. define capabilities;
2. generate the static render plan;
3. render/export the listed variants from the authored asset;
4. review the outputs;
5. populate `static.variants` only with real approved files;
6. run `cue-id:validate-package`.

This keeps static coverage deterministic without bypassing visual approval.

## 29. Static render finalization workflow

After the planned portrait/square renders have actually been exported into the application public directory, finalize the manifest:

```bash
npm run cue-id:finalize-static -- path/to/manifest.json path/to/static-plan.json --output path/to/finalized-manifest.json
```

Optional public directory override:

```bash
npm run cue-id:finalize-static -- manifest.json plan.json --output finalized.json --public-dir public
```

The finalizer:

- requires the plan `assetVersion` to match the manifest;
- checks every planned portrait file exists physically;
- checks every planned square file exists physically;
- refuses to finalize if any file is missing;
- writes `static.variants` only after all planned files are present.

This prevents planned URLs from being mistaken for delivered assets.

Recommended static sequence:

```text
cue-id:plan-static
  -> render/export actual files
  -> visual review
  -> cue-id:finalize-static
  -> cue-id:validate-package
```

## 30. Unified intake assessment

Once GLB, finalized manifest and review/performance evidence exist, run:

```bash
npm run cue-id:assess -- path/to/asset.glb path/to/manifest.json --evidence path/to/evidence.json
```

Evidence example:

```json
{
  "assetVersion": "2.0.0",
  "visualReview": true,
  "mobileReview": true,
  "performance": {
    "full": 790,
    "reduced": 1210
  }
}
```

The assessor reports three independent readiness states:

- package ready;
- static ready;
- interactive ready.

Possible summary states:

- `package_invalid`;
- `package_valid_review_pending`;
- `static_ready_interactive_pending`;
- `interactive_ready`.

The assessor does not mutate catalogue state. It is a pre-admission report only.

## 31. Promotion proposal workflow

After intake assessment reaches a promotable state, generate a non-destructive catalogue proposal:

```bash
npm run cue-id:propose-promotion -- path/to/asset.glb path/to/manifest.json --evidence path/to/evidence.json
```

Optional stage override:

```bash
npm run cue-id:propose-promotion -- asset.glb manifest.json --evidence evidence.json --stage static_approved
```

Optional output file:

```bash
npm run cue-id:propose-promotion -- asset.glb manifest.json --evidence evidence.json --output proposal.json
```

Rules:

- `auto` selects `interactive_approved` only when every interactive gate passes;
- otherwise `auto` selects `static_approved` when static admission passes;
- forced interactive promotion fails if interactive readiness is incomplete;
- no proposal is created before visual/mobile review passes;
- the command never edits the production catalogue.

The proposal is a human-reviewed handoff artifact, not an automatic publication mechanism.

## 32. Package scaffold workflow

Start a new authored asset package with:

```bash
npm run cue-id:scaffold-package -- --version 2.0.0 --output-dir /path/to/work
```

The scaffold creates:

```text
cue-id-v2-2.0.0/
├── source/
├── export/
├── textures/
├── renders/
├── manifest/
│   ├── manifest.draft.json
│   ├── evidence.draft.json
│   ├── asset-metadata.draft.json
│   ├── sculpt-review.draft.json
│   ├── mobile-review.draft.json
│   ├── performance-review.draft.json
│   └── bindings.md
└── README.md
```

Important behavior:

- version must use `x.y.z` format;
- manifest bindings start empty;
- static variants start empty;
- visual/mobile/performance evidence starts incomplete;
- existing files are never overwritten;
- the scaffold is a working package, not an approval artifact.

## 33. Sculpt review gate artifact

The working package now includes a machine-readable sculpt review draft:

`manifest/sculpt-review.draft.json`

Assess it with:

```bash
npm run cue-id:assess-sculpt -- path/to/sculpt-review.draft.json
```

The review is ordered through:

- Gate A: three regular bases under identical conditions;
- Gate B: independent slim/regular/strong builds across all bases;
- Gate C: tee fit/deformation;
- Gate D: pose parity and grounding;
- Gate E: product-size visual readability only.

A gate marked `pass` must:

- have every required check set to true;
- contain at least one evidence reference;
- follow all previous gates in sequence.

The assessor reports:

- `ready`;
- structural/check issues;
- failed gates;
- pending gates;
- next gate.

This review artifact does not set `visualReview` automatically. Final production evidence remains an explicit human decision.

## 34. Sculpt review to visual evidence proposal

Once Gates A–E are all passed with evidence, generate a non-destructive visual evidence proposal:

```bash
npm run cue-id:propose-visual-evidence -- path/to/sculpt-review.json path/to/evidence.json
```

Optional output:

```bash
npm run cue-id:propose-visual-evidence -- sculpt-review.json evidence.json --output evidence.proposal.json
```

Rules:

- sculpt review must be fully ready;
- review and evidence `assetVersion` must match;
- evidence must be versioned;
- only `visualReview` is promoted to true;
- `mobileReview` is preserved unchanged;
- performance evidence is preserved unchanged;
- reviewed gate evidence references are copied into `reviewEvidence.sculpt`;
- the source evidence file is never mutated.

This bridges structured human sculpt approval into the intake evidence model without bypassing separate mobile or performance gates.

## 35. Separate real-device mobile review

Product-size visual review and real-device mobile review are separate gates.

`sculpt-review.draft.json` Gate E now means product-size visual readability only.

Real-device validation lives in:

`manifest/mobile-review.draft.json`

Assess it with:

```bash
npm run cue-id:assess-mobile -- path/to/mobile-review.json
```

A passing mobile review requires:

- iPhone-class device check;
- representative Android mid-range device check;
- <=430 px viewport;
- reduced tier;
- DPR 1 equivalent review;
- head/shoulder/hands/garment/full-silhouette readability;
- diagnostics not obscuring the figure;
- at least two evidence references, one for each device class.

After it passes, create a non-destructive mobile evidence proposal:

```bash
npm run cue-id:propose-mobile-evidence -- mobile-review.json evidence.json
```

That proposal:

- requires matching `assetVersion`;
- changes only `mobileReview` to true;
- preserves `visualReview`;
- preserves performance evidence;
- stores mobile evidence references;
- never mutates the source evidence file.

## 36. Structured performance review

Performance evidence now has its own versioned review artifact:

`manifest/performance-review.draft.json`

Assess it with:

```bash
npm run cue-id:assess-performance -- path/to/performance-review.json
```

The review records one accepted `totalReadyMs` measurement for each interactive tier:

- full;
- reduced.

Each measured tier requires at least one evidence reference.

The assessor uses the same runtime budgets as product code:

- full: <= 800 ms;
- reduced: <= 1500 ms.

After both tiers pass, generate a non-destructive evidence proposal:

```bash
npm run cue-id:propose-performance-evidence -- performance-review.json evidence.json
```

The proposal:

- requires matching `assetVersion`;
- writes only `performance.full` and `performance.reduced`;
- preserves visual review state;
- preserves mobile review state;
- stores measured timings, budgets and evidence refs;
- never mutates source evidence.

This keeps runtime measurement criteria aligned with `evaluateCueIdReadyPerformance(...)` rather than duplicating threshold logic in handoff documentation.

## 37. Separate performance review evidence

Runtime performance measurements are now tracked in their own versioned review artifact:

`manifest/performance-review.draft.json`

Assess it with:

```bash
npm run cue-id:assess-performance -- path/to/performance-review.json
```

The review keeps full and reduced measurements separate and reuses the existing runtime budgets:

- full: <= 800 ms total ready;
- reduced: <= 1500 ms total ready.

Each measured tier requires at least one evidence reference.

After both tiers pass, generate a non-destructive evidence proposal:

```bash
npm run cue-id:propose-performance-evidence -- performance-review.json evidence.json
```

That proposal:

- requires matching `assetVersion`;
- copies only passing full/reduced ready times;
- preserves visual review state;
- preserves mobile review state;
- stores the measured budgets and evidence refs;
- never mutates the source evidence file.

This keeps visual, mobile and runtime acceptance independent while feeding the same final intake evidence model.

## 38. Evidence version integrity

Every intake evidence file must declare the asset version it belongs to:

```json
{
  "assetVersion": "2.0.0"
}
```

`cue-id:assess` rejects evidence when:

- `assetVersion` is missing;
- evidence `assetVersion` differs from manifest `assetVersion`.

This guard applies even if visual, mobile and performance fields are otherwise passing.

The review-specific proposal commands already enforce this boundary before producing evidence candidates; the unified assessor now enforces it again at the final intake boundary.

## 39. Combined intake evidence proposal

Once sculpt, mobile and performance reviews are all ready, combine them into one versioned evidence proposal:

```bash
npm run cue-id:propose-evidence -- sculpt-review.json mobile-review.json performance-review.json evidence.json
```

Optional output:

```bash
npm run cue-id:propose-evidence -- sculpt-review.json mobile-review.json performance-review.json evidence.json --output evidence.complete.json
```

The combined proposal:

- requires one identical `assetVersion` across evidence, sculpt, mobile and performance reviews;
- validates every underlying review through its existing assessor;
- sets `visualReview: true` only through the sculpt bridge;
- sets `mobileReview: true` only through the mobile bridge;
- copies performance only through the performance bridge;
- preserves all review evidence references;
- adds `evidenceVersion: 1`;
- never mutates any source review/evidence file.

The resulting proposal is the intended input for `cue-id:assess`.
