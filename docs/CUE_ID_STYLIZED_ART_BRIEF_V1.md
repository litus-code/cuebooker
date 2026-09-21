# CUE ID Stylized Art Brief V1

Status: canonical art brief for the first CUE ID stylized character family.

Use together with `docs/CUE_ID_STYLIZED_CREATOR_V1.md`.

## 1. Desired read

The character should feel like a premium stylized mobile avatar:

- recognisably adult;
- warm and expressive;
- soft caricature, not photoreal;
- larger head and eyes than realistic anatomy;
- believable shoulders, arms, hands and legs;
- clean silhouettes at small size;
- fashion-aware without looking like a toy;
- suitable for electronic-music artist identity;
- approachable without looking childish.

Reference feeling:

- soft 3D cartoon avatar creator;
- rounded facial design;
- sculpted hair masses;
- simplified clothes;
- natural relaxed standing posture.

Avoid:

- block-built torso or limbs;
- mannequin anatomy;
- chibi proportions;
- giant head / tiny body extremes;
- realistic skin pores;
- photoreal hair;
- uncanny eyes;
- T-pose or pseudo-T-pose;
- overly muscular anatomy;
- glossy mobile-game plastic.

## 2. Proportion target

Body height is approximately 5.5 to 6 heads.

The head is intentionally larger than realistic anatomy, but the torso and legs still read as adult.

Male base:

- softly broad shoulders;
- straight relaxed torso;
- moderate waist;
- hands reach around upper/mid thigh;
- legs slightly longer than the primitive prototype;
- no bodybuilder chest or arms.

Female base:

- same visual family and approximate overall height;
- softer shoulder line;
- moderate waist/hip differentiation;
- no exaggerated hourglass anatomy;
- same head/eye scale language as the male base.

Both bodies use one shared rig and compatible clothing anchors.

## 3. Face

The face is the main identity surface.

Required qualities:

- eyes visible at all times;
- large stylized irises;
- readable eyebrows;
- simple but dimensional nose;
- mouth has enough geometry for five expressions;
- cheek and jaw planes should be soft;
- ears remain readable for piercing placement;
- face must still look good without hair or facial hair.

The neutral expression should not look blank or surprised.

Default neutral:

- relaxed brows;
- eyes open naturally;
- mouth closed with a very slight friendly resting curve;
- no forced smile.

## 4. Expressions

Five V1 expressions:

```text
neutral
smile
focused
confident
playful
```

All expressions must remain the same person.

Expression language:

- `smile`: warm, visible mouth change, subtle cheek lift;
- `focused`: brows slightly lowered, mouth neutral;
- `confident`: slight asymmetric brow/mouth attitude;
- `playful`: light wink or asymmetric expression;
- do not use extreme emoji deformation.

## 5. Eyes and contacts

Natural colours:

```text
blue
green
hazel
dark
```

Contacts:

```text
none
ice
white
red
```

The iris must remain clearly visible in normal eye colours.

White contact lenses may intentionally reduce iris visibility, but the eyeball and eyelids must still read correctly.

## 6. Hair

Hair is authored as clean sculpted masses.

Initial styles:

```text
buzz
crop
curly
bob
locs
```

Requirements:

- no strand systems;
- no accidental face mask effect;
- eyebrows stay visible unless a style intentionally overlaps one side;
- hair must support hat-fit variants without changing the selected semantic style.

Colours:

```text
black
brown
blond
red
platinum
```

## 7. Facial details

Facial hair:

```text
none
stubble
moustache
beard
```

Piercings:

```text
ear
septum
nostril
eyebrow
```

Maximum three piercings simultaneously.

Piercings should be slightly oversized relative to real jewellery so they remain legible on mobile.

## 8. Clothing

Canonical base look:

```text
black tee
black wide trousers
dark minimal sneaker
```

Top silhouettes:

```text
tee
tank
sweatshirt
hoodie
bomber
```

Bottom silhouettes:

```text
wide-trouser
straight-trouser
cargo
shorts
denim
```

One-piece:

```text
jumpsuit
```

Clothing should feel like simplified real garments, not painted body geometry.

Use deliberate volume at:

- sleeves;
- waistbands;
- trouser hems;
- hoodie hood;
- bomber collar/cuffs;
- cargo pockets.

## 9. Cuebooker Basics

The default black clothing belongs to the `Cuebooker Basics` family.

The brand mark is a signature, not a billboard.

Use the Cuebooker symbol/isotype at small scale:

- tee: left chest;
- sweatshirt / hoodie: left chest;
- bomber: sleeve;
- cap / beanie: small front mark;
- cargo: optional tiny pocket mark;
- default wide trousers: no visible mark;
- sneakers: no required mark in V1.

Do not use the full Cuebooker wordmark on tiny avatar garments.

## 10. Accessories

Headwear:

```text
cap
beanie
top-hat
```

Face:

```text
mask
```

Ears:

```text
headphones
```

Hands:

```text
short-gloves
long-gloves
```

Headphones should read as DJ/music headphones, not gaming headsets.

The mask should feel club/editorial rather than medical.

Top hat is intentionally playful and can be more theatrical than the default wardrobe.

## 11. Pose

Canonical pose: `relaxed-standing`.

Requirements:

- shoulders down;
- arms naturally beside the torso;
- slight elbow bend;
- hands open and relaxed;
- no crossed hands;
- no arms floating away from the body;
- weight may shift subtly onto one leg;
- feet remain planted and readable.

The neutral authoring pose may exist internally, but it is not the presentation pose.

## 12. Material language

Target materials:

```text
cue_mat_skin
cue_mat_hair
cue_mat_textile
cue_mat_detail
```

Appearance:

- matte / soft;
- subtle roughness differences;
- no wet/glossy skin;
- hair slightly darker and smoother than textile;
- metal piercings may use the detail material with controlled metallic response;
- eyes may use the detail material/atlas rather than adding a fifth runtime material.

## 13. Mobile read

The avatar must work at approximately 390 px product width.

At that size the user must still read:

- expression;
- eye colour;
- hair silhouette;
- facial hair;
- major piercings;
- top/bottom silhouette;
- headwear/headphones;
- Cuebooker chest mark.

Do not depend on tiny texture details that disappear at mobile size.

## 14. Acceptance reference

Reject an asset if it looks technically correct but still reads as:

- Blender primitives;
- a generic low-poly NPC;
- an untouched base mesh;
- a realistic human with simplified textures;
- a toy for children;
- a game mascot unrelated to music/fashion identity.

Accept only when male and female feel like deliberately designed members of the same CUE ID character family.


## 15. Quality-first production rule

The approved male/female prototypes are the visual target.

Do not lower character quality to satisfy an early mobile triangle budget.

Production order:

1. build the best-looking authored master that matches the approved prototypes;
2. approve face, proportions, hair, clothing and silhouette;
3. rig and author expressions;
4. only then create runtime LODs and platform-specific optimizations.

The master may exceed the previous 20k/28k runtime targets.

Those numbers are no longer art-direction gates.

Optimization is acceptable only when the visual difference at product size is negligible.

If a reduction makes the character look cheap, generic, faceted, mannequin-like or visibly worse than the approved concept, reject the reduction and keep the higher-quality asset.

Web/mobile performance will be handled later through:

- LODs;
- mesh variants;
- texture atlases;
- compressed textures;
- lower-cost shadows/materials;
- static snapshots on low-end devices;
- device-tier quality settings.

The art master is never downgraded simply to hit a number.
