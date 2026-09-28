# CUE ID — Club Minimal V1 art direction

Updated: 19 September 2026
Status: visual principles retained; current procedural candidate rejected for production

## Objective

Any production CUE ID humanoid must read as a professional artist identity object, not as a game avatar.

It should sit naturally beside:

- real artist photography;
- club posters and record sleeves;
- booking/profile information;
- professional promoter-facing material.

The visual reference is closer to editorial sculpture, contemporary music artwork and industrial fashion photography than to character customizers, metaverse avatars or gaming skins.

## Core visual language

### Silhouette

The silhouette should be:

- human and immediately readable;
- slightly elongated rather than cartoon-proportioned;
- grounded and upright;
- calm rather than heroic;
- asymmetric enough to feel authored;
- recognisable at mobile size.

Avoid:

- oversized heads;
- exaggerated shoulders/waist;
- superhero stance;
- idle game-character T-pose feeling;
- kawaii/chibi proportions;
- hyper-muscular or hyper-sexualised anatomy.

### Head and face

V1 does not need facial realism.

Preferred:

- simplified facial planes;
- low-detail sculptural head;
- no lip-sync or facial rig;
- no uncanny realistic eyes;
- no ethnicity-specific caricature;
- no permanently visible smile/expression.

Identity should come mainly from:

- silhouette;
- pose;
- clothing;
- material;
- accessory;
- lighting/accent.

### Body

The three semantic builds remain:

```text
slim
regular
strong
```

These are silhouette adjustments, not body-rating categories.

They should remain close enough that:

- clothing can be reused;
- rigging remains consistent;
- there is no status implication;
- no body option feels like a joke or stereotype.

### Base presentation

The current semantic bases remain:

```text
masculine
feminine
neutral
```

They are visual starting points only.

Differences should be restrained and primarily structural/silhouette-based.

Outfit, pose, material and accessories must not be locked by base.

## Club Minimal wardrobe

The first wardrobe should feel plausible for working electronic artists without forcing one subculture.

### Tank

- clean sleeveless silhouette;
- no bodybuilding cut;
- useful for warm-club/festival contexts;
- matte textile first.

### Tee

- slightly structured oversized/regular club tee;
- no logos;
- no fake tour graphics;
- neutral enough to be the default.

### Hoodie

- architectural hood shape;
- avoid gamer/streetwear caricature;
- hood may be down by default;
- no oversized strings/details at V1.

### Bomber

- short technical jacket;
- restrained volume;
- industrial/fashion rather than military costume;
- no excessive pockets/zips.

## Accessories

### Headphones

Must read as professional DJ headphones, not gaming headset.

Avoid:

- RGB;
- boom mic;
- oversized ear cups;
- branded-copy silhouette.

### Cap

Minimal 5-panel/baseball hybrid is acceptable.

No logos or slogans.

### Glasses

Editorial, restrained.

Avoid novelty/festival eyewear as the default family.

### None

Must remain a first-class option.

The identity cannot depend on accessories to feel complete.

## Pose system

### Neutral

Default professional standing pose.

Not a T-pose.

Weight slightly shifted to one leg.

### Relaxed

Small hip/shoulder asymmetry.

Hands and arms remain believable without extreme gesture.

### Focused

Slight forward/head orientation.

Should read concentrated, not aggressive.

### Editorial

More directional silhouette suitable for artwork/profile hero use.

Still usable at mobile size.

## Materials

### Matte

Default.

Target:

- dark textile;
- soft rubber;
- coated fabric;
- graphite;
- muted skin-like/sculptural surface.

### Satin

Secondary.

Target:

- subtle highlight response;
- not chrome;
- not latex;
- not glossy plastic.

Chrome is not part of V1 until proven visually and technically.

## Accent

The Cuebooker accent is a signal, not the costume.

Allowed V1 accents:

```text
lime
red
none
```

Use on:

- seam;
- thin stripe;
- small material panel;
- light edge;
- restrained emissive cue.

Do not cover the entire humanoid in brand colour.

## Lighting

Default scene should use:

- soft ambient/environment contribution;
- one primary directional/key;
- one low-cost accent/rim only when the tier allows;
- no dynamic shadows in V1 default;
- no volumetric fog;
- no bloom dependency;
- no screen-space effects required for identity recognition.

The humanoid must remain legible if all decorative lighting is removed.

## Camera

Portrait/editorial framing.

Target composition:

- full figure or knees-up depending surface;
- slightly low/neutral eye line;
- no dramatic fisheye;
- no orbit controls in public profile;
- editor may later support subtle controlled rotation.

The static fallback and 3D scene should share a similar composition so transition does not feel like a layout change.

## Geometry targets

Base humanoid production target:

```text
preferred triangles: 18k–28k
hard ceiling: 35k
materials: 2–4
textures: 2–4 preferred, 6 max
texture dimension: 1024 preferred, 2048 max
compressed GLB: 450–850 KB preferred, 1 MB max
```

The preferred target is deliberately below the hard budget to leave room for outfit/accessory composition.

### Rig

V1 rig should be minimal:

- standard humanoid skeleton;
- no facial bones required;
- no finger animation requirement;
- one skeleton shared across build variants where possible;
- poses may be baked/static clips or semantic transforms.

## Texture strategy

Prefer:

- shared atlases;
- 1024 maps for mobile;
- KTX2/Basis where the final loader path supports it;
- baked AO/detail where useful;
- normal maps only when they materially improve the silhouette/material read.

Avoid:

- 4K textures;
- multiple unique maps for tiny accessories;
- alpha-heavy hair/fabric;
- high-frequency detail invisible at profile size.

## Tier behavior

### Tier A

May use:

- full base asset;
- selected outfit;
- selected accessory;
- satin material;
- subtle rim/accent light.

### Tier B

Must remain visually equivalent with:

- same identity/config;
- DPR 1;
- static/event-driven rendering;
- simplified material path;
- no expensive secondary effects;
- lower-resolution textures if asset pipeline supports variants.

### Tier C

Uses static render/fallback only.

Tier C is not a degraded identity. It is the same CUE ID represented without interactive 3D.

## Acceptance checklist

A candidate production humanoid is accepted only if all answers are yes:

1. Does it look credible beside a real DJ press photo?
2. Does it avoid game/avatar/metaverse language?
3. Can it represent an established artist without feeling juvenile?
4. Can a newer artist also use it without feeling excluded?
5. Does it avoid genre stereotypes?
6. Does it avoid gender/body caricature?
7. Is the silhouette readable on a phone?
8. Does it still work with no accessory?
9. Does it still work without bloom/post-processing?
10. Does it fit the preferred mobile geometry/texture budget?
11. Can the same semantic config degrade cleanly to Tier B/C?
12. Can Photo/Artwork remain equally valid alternatives?

If any answer is no, the asset is not ready for the product catalogue.
