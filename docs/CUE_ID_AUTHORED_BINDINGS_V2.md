# CUE ID — Authored Binding Handoff V2

Updated: 20 September 2026  
Status: AUTHORING HANDOFF CONTRACT

## 1. Purpose

This document tells the 3D artist and integration engineer exactly which semantic controls the first authored CUE ID asset must expose.

Cuebooker product state stays semantic. DCC names remain implementation detail and are mapped through the production manifest.

The first production candidate is deliberately narrow:

- one shared authored body family;
- three base identities;
- three builds;
- one editorial tee;
- one authored footwear baseline;
- four poses;
- matte body/textile treatment;
- optional restrained accent;
- no hair catalogue;
- no face preset catalogue;
- no bottom catalogue;
- no footwear catalogue.

Those later creator dimensions remain creator-side draft semantics until authored assets exist for them.

## 2. Canonical reference state

Reference state:

```text
family      club_minimal
base        neutral
build       regular
outfit      tee
accessory   none
pose        neutral
material    matte
accent      lime
```

Neutral + regular are the zero/reference body state.

Do not author an explicit neutral or regular morph unless the DCC pipeline technically requires it.

## 3. Required semantic bindings

The application-owned manifest must be able to resolve:

```text
base.feminine
base.masculine

build.slim
build.strong

pose.neutral
pose.relaxed
pose.focused
pose.editorial

outfit.tee

material.body
material.textile
```

Optional first-package bindings:

```text
material.technical
material.accent

accessory.headphones
accessory.cap
accessory.glasses
```

## 4. Recommended export naming

Cuebooker does not require these literal names, but using them reduces handoff ambiguity.

Morphs:

```text
cue_base_feminine
cue_base_masculine
cue_build_slim
cue_build_strong
```

Pose clips:

```text
cue_pose_neutral
cue_pose_relaxed
cue_pose_focused
cue_pose_editorial
```

Primary nodes:

```text
cue_body
cue_outfit_tee
cue_footwear
```

Optional accessory nodes:

```text
cue_accessory_headphones
cue_accessory_cap
cue_accessory_glasses
```

Material slots:

```text
cue_mat_body
cue_mat_textile
cue_mat_technical
cue_mat_accent
```

Rig aliases may use the studio's preferred DCC naming. The package bindings sheet must still identify:

```text
root
head
upperArm.L
upperArm.R
forearm.L
forearm.R
thigh.L
thigh.R
foot.L
foot.R
```

## 5. Example production manifest binding block

The final values must come from inspection of the exported GLB, not from this example.

```json
{
  "bindings": {
    "morphs": {
      "base.feminine": "cue_base_feminine",
      "base.masculine": "cue_base_masculine",
      "build.slim": "cue_build_slim",
      "build.strong": "cue_build_strong"
    },
    "poses": {
      "neutral": "cue_pose_neutral",
      "relaxed": "cue_pose_relaxed",
      "focused": "cue_pose_focused",
      "editorial": "cue_pose_editorial"
    },
    "outfits": {
      "tee": ["cue_outfit_tee"]
    },
    "accessories": {},
    "materials": {
      "body": "cue_mat_body",
      "textile": "cue_mat_textile",
      "technical": "cue_mat_technical",
      "accent": "cue_mat_accent"
    }
  }
}
```

## 6. Morph rules

Base and build morphs must be orthogonal.

Expected combination model:

```text
neutral regular reference
+ selected base morph
+ selected build morph
```

Examples that must work without corrective manual intervention:

```text
feminine + slim
feminine + strong
neutral + slim
neutral + strong
masculine + slim
masculine + strong
```

Reject the asset if base identity collapses when build changes.

## 7. Pose rules

Each semantic pose must resolve to one authored animation clip.

The production renderer evaluates the final frame of the clip as the deterministic target pose.

The same pose clip must work across all base/build combinations.

No gender-specific pose variants.

## 8. Outfit rule

The first production package requires only the editorial tee.

The tee must:

- share the body rig;
- deform correctly across all nine base/build combinations;
- remain a distinct mesh node or stable visibility group;
- not rely on runtime node-scale hacks.

The renderer currently expects an outfit visibility binding:

```json
{
  "outfits": {
    "tee": ["<exported tee node>"]
  }
}
```

## 9. Material rule

At minimum, the GLB must expose stable body and textile material slots.

The production renderer applies application-owned roughness/metalness treatment to these mapped slots.

Do not encode product semantics into arbitrary material UUIDs.

## 10. What must not enter persisted product state

Never persist:

- GLB node names;
- morph target indexes;
- material UUIDs;
- bone UUIDs;
- animation clip indexes;
- Blender object names;
- source file paths.

Only the application-owned manifest knows those values.

## 11. Inspection sequence

After the first GLB export:

```bash
npm run cue-id:inspect -- path/to/cue-id-v2.glb \
  --manifest-draft /tmp/cue-id-manifest.json \
  --asset-version 2.0.0
```

Then confirm every binding manually against the inspector output.

Do not fill the manifest from naming convention alone.

## 12. Gate before runtime integration

Before the authored GLB replaces the lab candidate:

1. Gate A regular bases passes.
2. Gate B builds passes.
3. Gate C tee deformation passes.
4. Gate D poses passes.
5. Gate E product-size visual review passes.
6. real-device mobile review passes.
7. GLB inspector passes.
8. package validator passes.
9. static variants are exported and finalized.
10. performance evidence passes required budgets.
11. intake assessment reaches a promotable state.
12. a human-reviewed promotion proposal is accepted.

Until then, `CUE_ID_PRODUCTION_CATALOGUE` remains empty.
