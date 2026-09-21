# CUE ID — Creator 3D V1 first authored slice

Updated: 21 September 2026  
Status: ACTIVE AUTHORING TARGET

## 1. Goal

Produce the first genuinely usable CUE ID avatar for the creator.

This asset is not a mannequin, benchmark mesh or CSS placeholder. It is the first visual-quality authored character that should make CUE ID feel like an actual avatar system.

The target is stylized-realistic, editorial and club-aware rather than cartoon, game-like or photoreal.

## 2. Narrow first slice

Do not author the full catalogue yet.

The first GLB must support exactly this practical slice:

- base: neutral
- build: regular
- skins: skin-03, skin-05
- faces: face-03, face-04
- hairs: textured-crop, curly-crop, locs
- facial hair: none, short-beard
- tops: oversized-tee, bomber
- bottoms: wide-trouser, cargo
- footwear: technical-sneaker, boot
- accessory: none
- poses: neutral, relaxed
- material: matte
- accent: lime

This is enough to validate that one authored person can change identity without becoming a different character.

## 3. Character direction

The neutral/regular reference character must read as:

- adult;
- human and believable;
- not over-muscular;
- not mannequin-like;
- not perfectly symmetrical;
- not influencer-glossy;
- not game/cartoon;
- not bald as a default presentation;
- credible in an electronic-music press/editorial context.

The body, face and garments should feel authored as one character system.

## 4. Geometry and runtime budget

Target:

- 18k–28k triangles total preferred;
- 35k hard ceiling;
- max 4 materials;
- 1–3 texture sets preferred;
- 1024 textures preferred;
- compressed GLB 450–850 KB preferred;
- 1 MB hard ceiling.

Hair and garments must be optimized for Android mid-range as well as desktop.

## 5. Shared rig

One shared rig.

Required rig regions:

- root
- head
- upperArm.L / upperArm.R
- forearm.L / forearm.R
- thigh.L / thigh.R
- foot.L / foot.R

Neutral and relaxed poses must work on the same rig.

No separate male/female rigs.

## 6. Morphs

Reference face:

- face-03 = zero/reference face

Required face morph:

- face-04

Recommended export alias:

```text
cue_face_04
```

The face morph must preserve character identity and topology.

Base/build morphs from V2 remain orthogonal and compatible with this asset family, but this first visual slice is reviewed only on neutral + regular.

## 7. Visibility groups

Each selectable part is a stable node or node group.

Recommended aliases:

```text
cue_hair_textured_crop
cue_hair_curly_crop
cue_hair_locs

cue_facial_short_beard

cue_top_oversized_tee
cue_top_bomber

cue_bottom_wide_trouser
cue_bottom_cargo

cue_footwear_technical_sneaker
cue_footwear_boot
```

Only the selected node group should be visible.

Garments share the body rig and must not depend on runtime scaling hacks.

## 8. Skin treatment

Use one authored skin surface/material slot.

The first semantic tones are:

```text
skin-03  #b9805f
skin-05  #67402f
```

These tones modify the authored body material. They are not separate materials, preserving the material budget.

Skin quality comes from the authored material/texture/normal/roughness treatment; the semantic tone only controls complexion.

## 9. Creator manifest block

The GLB is connected through the optional creator binding block in the production manifest.

Example shape:

```json
{
  "bindings": {
    "creator": {
      "capabilities": {
        "skins": ["skin-03", "skin-05"],
        "faces": ["face-03", "face-04"],
        "hairs": ["textured-crop", "curly-crop", "locs"],
        "facialHair": ["none", "short-beard"],
        "tops": ["oversized-tee", "bomber"],
        "bottoms": ["wide-trouser", "cargo"],
        "footwear": ["technical-sneaker", "boot"]
      },
      "faces": {
        "face-04": "cue_face_04"
      },
      "skins": {
        "skin-03": "#b9805f",
        "skin-05": "#67402f"
      },
      "hairs": {
        "textured-crop": ["cue_hair_textured_crop"],
        "curly-crop": ["cue_hair_curly_crop"],
        "locs": ["cue_hair_locs"]
      },
      "facialHair": {
        "short-beard": ["cue_facial_short_beard"]
      },
      "tops": {
        "oversized-tee": ["cue_top_oversized_tee"],
        "bomber": ["cue_top_bomber"]
      },
      "bottoms": {
        "wide-trouser": ["cue_bottom_wide_trouser"],
        "cargo": ["cue_bottom_cargo"]
      },
      "footwear": {
        "technical-sneaker": ["cue_footwear_technical_sneaker"],
        "boot": ["cue_footwear_boot"]
      }
    }
  }
}
```

The final manifest values must still come from GLB inspection. Names above are recommended aliases, not persisted product state.

## 10. Acceptance before catalogue expansion

Do not add more options until this slice proves all of these:

1. face-03 -> face-04 changes the same person, not a new character;
2. every hair reads naturally on the same head;
3. beard integrates with both reviewed faces;
4. oversized tee and bomber deform correctly;
5. wide trouser and cargo deform correctly;
6. both footwear options ground correctly;
7. neutral and relaxed poses read naturally;
8. skin tones preserve the authored skin material quality;
9. no visible mesh intersections at product size;
10. avatar remains readable around 390 px;
11. reduced-tier Android performance remains inside budget.

## 11. Static-first boundary

The existing V2 static-variant cartesian key is not expanded to all Creator dimensions.

That would create an unnecessary combinatorial explosion.

For the first authored Creator 3D slice:

- interactive validation happens in the noindex CUE ID lab;
- production catalogue remains empty;
- public Artist Profile stays static-first;
- a per-saved-avatar snapshot strategy must be defined before Creator 3D promotion to production.

Do not weaken the public static-first requirement to ship this asset early.


## 14. Scaffold command

Generate the first authored Creator 3D working package with:

```bash
npm run cue-id:scaffold-package -- \
  --version 3.0.0 \
  --profile creator-3d-v1 \
  --output-dir /path/to/work
```

This creates:

```text
cue-id-creator-3d-v1-3.0.0/
├── source/
├── export/
├── textures/
├── renders/
├── manifest/
│   ├── manifest.draft.json
│   ├── bindings.md
│   ├── evidence.draft.json
│   ├── asset-metadata.draft.json
│   ├── sculpt-review.draft.json
│   ├── mobile-review.draft.json
│   └── performance-review.draft.json
├── SCULPT_SPEC.md
└── README.md
```

The Creator profile deliberately generates a partial lab manifest:

- neutral base only;
- regular build only;
- neutral + relaxed poses;
- the first two skins/faces and narrow hair/garment/footwear slice;
- lab GLB path `/cue-id/lab/creator-v1.glb`.

The default scaffold behavior remains V2 when `--profile` is omitted.

## 12. Lab import flow

The first authored GLB does not enter the production catalogue.

Use the dedicated lab candidate slot:

`app/domain/cueIdCreator3dLabCandidate.ts`

Current state:

```ts
export const CUE_ID_CREATOR_3D_LAB_CANDIDATE = null
```

When the first real GLB exists:

1. place the GLB under an application-owned lab path, for example:

```text
/public/cue-id/lab/creator-v1.glb
```

2. inspect the exported GLB:

```bash
npm run cue-id:inspect -- public/cue-id/lab/creator-v1.glb \
  --manifest-draft /tmp/cue-id-creator-v1.json \
  --asset-version 3.0.0-lab
```

3. verify the actual exported morph, node, material and animation names;

4. build a partial `CueIdProductionManifest` for the authored slice;

5. assign that inspected manifest to `CUE_ID_CREATOR_3D_LAB_CANDIDATE`;

6. open `/cue-id`.

The Creator automatically:

- uses the authored GLB when the current config is covered by the partial manifest;
- falls back to the semantic lab preview when the selected option is not yet authored;
- remounts the stage when switching between authored and semantic lab representations;
- never adds the lab candidate to `CUE_ID_PRODUCTION_CATALOGUE`.

The lab renderer may resolve partial V2 bindings only when `labMode=true`.

Production resolution still requires normal production-wide manifest readiness.

## 13. Permissive authoring base option

A MakeHuman / MPFB core human asset is an acceptable starting point for the sculpt/retopology phase if it materially accelerates the first authored character.

Reason:

- MakeHuman core graphical assets are published as CC0;
- exported character output may be used and modified without forcing Cuebooker runtime/product code under the MakeHuman application license;
- third-party downloaded MakeHuman community assets must still be checked separately.

Use this only as a base mesh/source.

Do not ship an untouched generic MakeHuman character as CUE ID.

The character still needs:

- Cuebooker-specific sculpting and proportions;
- authored face identity;
- custom hair;
- club/editorial garments;
- shared rig cleanup;
- optimized topology;
- product-specific materials;
- CUE ID semantic node/morph naming during export;
- mobile/performance review.

The runtime has no dependency on MakeHuman or MPFB.
