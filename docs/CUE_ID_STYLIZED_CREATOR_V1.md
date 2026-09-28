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

## 8. Accessories

Accessories are separate semantic slots rather than one generic accessory field.

Headwear:

```text
none
cap
beanie
top-hat
```

Face accessory:

```text
none
mask
```

Ear accessory:

```text
none
headphones
```

Hands:

```text
none
short-gloves
long-gloves
```

Rules:

- one active value per accessory slot;
- piercings remain independent and multi-select;
- selecting an accessory must never silently overwrite the persisted hair, piercing or clothing choice;
- when two authored meshes physically conflict, the Creator marks the unsupported combination rather than mutating another slot;
- headwear may use hair-fit variants internally while preserving the selected hair semantic;
- the first authored V1 coverage does not require `top-hat + headphones` simultaneously.

Recommended aliases:

```text
cue_headwear_cap
cue_headwear_beanie
cue_headwear_top_hat
cue_face_mask
cue_ears_headphones
cue_gloves_short
cue_gloves_long
```

## 9. Skin

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

## 10. Clothing

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

## 11. Canonical default

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
headwear: none
face accessory: none
ear accessory: none
gloves: none
top: tee
top colour: black
bottom: wide-trouser
bottom colour: black
one-piece: none
footwear: minimal-sneaker
footwear colour: black
pose: relaxed-standing
```

## 12. Runtime model

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

cue_headwear_cap
cue_headwear_beanie
cue_headwear_top_hat
cue_face_mask
cue_ears_headphones
cue_gloves_short
cue_gloves_long

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

## 13. Material strategy

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

Piercings and hard accessories use `cue_mat_detail`. Fabric accessories should reuse `cue_mat_textile` where possible.

### Cuebooker Basics branding

The default clothing family is called `Cuebooker Basics`.

Branding must read as a small signature, not as branded merchandise.

Default treatment:

- black tee: small Cuebooker symbol on the left chest;
- sweatshirt / hoodie: small symbol on the left chest;
- bomber: small symbol on the sleeve;
- cap / beanie: small front symbol;
- wide and straight trousers: no visible logo by default;
- cargo may use a tiny pocket mark;
- use the symbol/isotype rather than the full `cuebooker` wordmark at avatar scale.

The branding is garment metadata. It is not another runtime material and it is not a required user-facing customization field.

## 14. Performance

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

### Authored body source

V1 uses the CC0 Blender Human Base Meshes stylized male/female bodies as the character-design source.

Measured source body:

```text
14,106 vertices
28,200 triangles
```

The first runtime topology starts from a 50% reduction applied before expression authoring:

```text
7,856 evaluated vertices
15,700 evaluated triangles
```

A 35% reduction was tested at 11,950 triangles but rejected as the default because facial planes, ears and hands lose too much definition.

The unmodified source remains an authoring reference and is not the runtime mesh.

## 15. V1 acceptance gate

The first stylized avatar is accepted only when:

1. both male and female body models read as the same CUE ID art family;
2. neutral face looks intentionally stylized rather than unfinished;
3. all five expressions remain recognisable as the same character;
4. all four natural eye colours are clearly visible;
5. all five hair colours work on the same hair material;
6. hair does not obscure the face by accident;
7. facial hair attaches cleanly;
8. ear, septum, nostril and eyebrow piercings align correctly;
9. cap, beanie, top hat, mask, headphones and both glove variants align correctly in their supported combinations;
10. black tee + black wide trousers is visually clean and the small Cuebooker mark is legible without dominating the outfit;
11. tank and shorts expose body geometry without holes;
12. no body/garment/accessory clipping is visible at product size;
13. relaxed standing pose has shoulders down and arms naturally beside the body;
14. the active avatar remains inside the V1 performance budget;
15. public Artist Profile remains static-first.

## 16. Scope control

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

## 17. Migration from previous experiments

The following are deprecated as visual directions:

- full realistic MakeHuman source;
- male1591-only low-poly mannequin;
- procedural body-derived clothing shells;
- hybrid realistic-head / low-poly-body prototype.

They may remain in the repo as authoring research until cleanup, but none may enter
`CUE_ID_CREATOR_3D_LAB_CANDIDATE` or `CUE_ID_PRODUCTION_CATALOGUE`.

Production remains untouched.


## 18. Current visual prototype status

The Blender primitive-based stylized prototype generated on 21 September 2026 is technical evidence only.

It proves:

- the five-expression morph pipeline;
- the basic material and render workflow;
- a low geometry budget;
- deterministic CI generation.

It is rejected as the final art direction because the body still reads as assembled geometric primitives rather than the approved soft-caricature character family.

Do not spend further iterations polishing that primitive silhouette.

The next authored character must target the approved reference characteristics:

- larger expressive head, but not chibi;
- softer continuous torso and limbs;
- readable large eyes;
- natural relaxed hands and arms;
- clean black Cuebooker Basics outfit;
- male and female members of the same visual family;
- modular hair, facial hair, piercings, clothing and accessories from the semantic catalogue above.

Production remains untouched.
