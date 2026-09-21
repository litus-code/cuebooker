# CUE ID Stylized Avatar Creator V1

Status: canonical visual direction for CUE ID Creator.

This document supersedes the photoreal / semi-realistic MakeHuman visual target.
The previous Blender/MPFB experiments remain technical evidence only.

## 1. Visual direction

CUE ID uses a stylized 3D character.

Target look:

- low-poly / soft-caricature proportions;
- recognisable human anatomy without photorealism;
- simplified facial planes;
- readable eyes and eyebrows;
- sculpted hair masses rather than realistic strands;
- clean clothing silhouettes;
- matte / soft materials;
- subtle asymmetry;
- club/editorial attitude;
- friendly enough for profile identity without becoming childish;
- no skin pores, photoreal hair, realistic wrinkles or uncanny facial detail.

The character should look intentionally designed at 390 px mobile size.

## 2. Body model

V1 exposes two authored body models:

```text
male
female
```

Both models:

- use the same skeleton;
- share the same semantic slots;
- share compatible clothing anchors;
- use the same expression naming;
- use the same material system;
- have relaxed standing as the canonical pose.

No neutral third body is required for Stylized V1.

## 3. Facial expression system

V1 ships five expressions on the same face identity.

```text
neutral
smile
focused
confident
playful
```

Implementation target:

- morph targets / shape keys;
- expression must not swap the head mesh;
- eyes, brows and mouth participate;
- no exaggerated emoji-like deformation;
- expression must remain readable at profile-card size.

Recommended aliases:

```text
cue_expression_smile
cue_expression_focused
cue_expression_confident
cue_expression_playful
```

Neutral is the authored base and does not require a morph.

## 4. Eyes

Natural eye colours:

```text
blue
green
hazel
dark
```

Eye colour is a material parameter, not a duplicated eye mesh.

Optional contact-lens layer:

```text
none
ice
white
red
```

Contact lenses are deliberately stylized. They must not add another material.

## 5. Hair

Initial hair styles:

```text
buzz
crop
curly
bob
locs
```

Hair colours:

```text
black
brown
blond
red
platinum
```

Hair colour is a material parameter.

Hair meshes must keep the face readable. No style may permanently cover both eyes.

## 6. Facial hair

```text
none
stubble
moustache
beard
```

Facial hair is optional and independent from body model.

V1 does not block moustache or beard on the female body. The Creator should not encode unnecessary restrictions.

## 7. Piercings

Piercings are multi-select because combinations are part of personal identity.

Initial slots:

```text
ear
septum
nostril
eyebrow
```

Each piercing uses one small mesh attached to a stable head/face anchor.

Maximum simultaneous V1 piercings: 3.

## 8. Skin

Retain the existing six semantic skin tones:

```text
skin-01
skin-02
skin-03
skin-04
skin-05
skin-06
```

Skin tone changes the shared body material.

## 9. Clothing

Canonical default outfit:

```text
black tee
black wide trousers
dark sneaker
```

Top options:

```text
tee
tank
sweatshirt
hoodie
bomber
```

Bottom options:

```text
wide-trouser
straight-trouser
cargo
shorts
denim
```

One-piece options:

```text
none
jumpsuit
```

When a one-piece outfit is active, top and bottom stay persisted but are not rendered.

Garment colours:

```text
black
white
charcoal
lime
red
purple
```

Top and bottom may use independent colours.

Footwear:

```text
minimal-sneaker
technical-sneaker
boot
```

## 10. Canonical default

```text
body: male
skin: skin-03
expression: neutral
eyes: dark
contacts: none
hair: crop
hair colour: black
facial hair: none
piercings: []
top: tee
top colour: black
bottom: wide-trouser
bottom colour: black
one-piece: none
footwear: minimal-sneaker
footwear colour: black
pose: relaxed-standing
```

## 11. Runtime model

Use one shared skeleton.

Prefer semantic configuration over scene-graph persistence.

Persist IDs and colours only. Do not persist Blender node names.

Suggested runtime node aliases:

```text
cue_body_male
cue_body_female

cue_hair_buzz
cue_hair_crop
cue_hair_curly
cue_hair_bob
cue_hair_locs

cue_facial_stubble
cue_facial_moustache
cue_facial_beard

cue_piercing_ear
cue_piercing_septum
cue_piercing_nostril
cue_piercing_eyebrow

cue_top_tee
cue_top_tank
cue_top_sweatshirt
cue_top_hoodie
cue_top_bomber

cue_bottom_wide_trouser
cue_bottom_straight_trouser
cue_bottom_cargo
cue_bottom_shorts
cue_bottom_denim

cue_onepiece_jumpsuit

cue_footwear_minimal_sneaker
cue_footwear_technical_sneaker
cue_footwear_boot
```

## 12. Material strategy

Target four runtime materials maximum:

```text
cue_mat_skin
cue_mat_hair
cue_mat_textile
cue_mat_detail
```

Use parameters for:

- skin tone;
- eye colour;
- hair colour;
- top colour;
- bottom colour;
- one-piece colour;
- footwear colour where possible.

Piercings use `cue_mat_detail`.

## 13. Performance

Stylization exists partly to simplify rendering.

Visible-avatar target:

- preferred <= 20k triangles;
- hard <= 28k triangles;
- one armature;
- <= 4 materials;
- <= 4 active textures;
- max texture dimension 1024 for V1;
- no strand hair;
- no cloth simulation;
- no runtime IK;
- expressions via morph targets;
- Android reduced tier must still render the same identity.

The complete authoring library may contain more inactive meshes than the visible-avatar triangle target. Runtime metrics must measure the active configuration separately from total authoring-library geometry.

## 14. V1 acceptance gate

The first stylized avatar is accepted only when:

1. both male and female body models read as the same CUE ID art family;
2. neutral face looks intentionally stylized rather than unfinished;
3. all five expressions remain recognisable as the same character;
4. all four natural eye colours are clearly visible;
5. all five hair colours work on the same hair material;
6. hair does not obscure the face by accident;
7. facial hair attaches cleanly;
8. ear, septum, nostril and eyebrow piercings align correctly;
9. black tee + black wide trousers is visually clean;
10. tank and shorts expose body geometry without holes;
11. no body/garment clipping is visible at product size;
12. relaxed standing pose has shoulders down and arms naturally beside the body;
13. the active avatar remains inside the V1 performance budget;
14. public Artist Profile remains static-first.

## 15. Scope control

Do not add in V1:

- realistic skin shaders;
- photoreal hair;
- makeup editor;
- tattoos;
- body-height sliders;
- body-weight sliders;
- individual nose/eye/mouth sculpt sliders;
- hand gestures;
- animated emotes;
- cloth physics;
- more than two body models.

Those can be later additions after the base creator is visually accepted.

## 16. Migration from previous experiments

The following are deprecated as visual directions:

- full realistic MakeHuman source;
- male1591-only low-poly mannequin;
- procedural body-derived clothing shells;
- hybrid realistic-head / low-poly-body prototype.

They may remain in the repo as authoring research until cleanup, but none may enter
`CUE_ID_CREATOR_3D_LAB_CANDIDATE` or `CUE_ID_PRODUCTION_CATALOGUE`.

Production remains untouched.
