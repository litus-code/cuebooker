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
