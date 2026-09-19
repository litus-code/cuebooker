# CUE ID — Production Asset Brief V2

Updated: 19 September 2026
Status: READY FOR ART-DIRECTED ASSET PRODUCTION

## 1. Why V2 exists

The first procedural Club Minimal candidate proved the runtime, semantic configuration model, quality ladder and performance envelope.

It failed the visual acceptance gate on a real phone.

The failure was not primarily polygon count. It was authorship.

The figure read as:

- assembled procedural primitives;
- low-poly mannequin;
- technical prototype;
- visually weaker than Cuebooker's product/brand ambition.

Therefore the next production candidate must be authored as an art asset first and optimized second.

The procedural generator remains a technical fixture only.

## 2. Product objective

The production CUE ID should feel credible beside:

- a professional DJ press portrait;
- an editorial club poster;
- a record sleeve;
- an artist booking profile;
- a promoter-facing EPK.

It must not feel like a game avatar, metaverse character, Bitmoji, Sims-style customizer, faceless stock mannequin, cyberpunk mascot, superhero or generic low-poly NFT figure.

## 3. Visual target

The strongest direction is **editorial sculptural human**.

Key qualities:

- recognisably human at first glance;
- intentionally stylised rather than simplified by technical limitation;
- subtle asymmetry;
- believable weight distribution;
- contemporary fashion silhouette;
- authored hands, shoulders, head and footwear;
- facial planes without facial realism;
- controlled material breakup;
- readable at 320–430 px mobile stage size.

The figure should look designed when viewed as a still image. If the still image does not work, 3D interaction does not rescue it.

## 4. Proportions

- adult human proportions;
- slightly elongated editorial proportion;
- head around 1:7.5–1:8 body relationship;
- no oversized head;
- no hyper-muscular shoulder width;
- no extreme waist;
- hands large enough to read naturally at mobile size;
- feet with clear shoe volume rather than block termination.

Silhouette must remain attractive without accessories.

## 5. Head

The head is the highest-priority authored area.

Required:

- clear forehead, cheek, jaw and chin planes;
- human skull volume;
- restrained nose plane;
- eye region implied by form, not uncanny realistic eyeballs;
- ears simplified but intentionally placed;
- no permanent smile;
- no blank sphere or capsule head.

Optional V1 face treatment:

- shallow sculptural eye sockets;
- subtle nose bridge;
- minimal mouth plane;
- no facial animation.

The goal is presence, not likeness.

## 6. Body and joints

The body should be one coherent sculptural form or a topology that visually behaves like one.

Avoid visible primitive assembly at neck/clavicle, shoulder/upper arm, elbow, wrist/hand, waist/pelvis, hip/thigh, knee and ankle/shoe.

## 7. Wardrobe system

V2 should launch with one excellent default outfit before expanding.

Recommended first production outfit: **Editorial club tee**.

- structured oversized/regular tee;
- slightly dropped shoulder;
- believable sleeve volume;
- clean hem;
- no fake print;
- no branding dependency;
- dark graphite/black textile;
- one restrained accent seam/panel.

After that asset passes: tank, hoodie, bomber.

Do not produce four mediocre outfits in parallel. One excellent tee is more valuable than a complete weak wardrobe.

## 8. Hands

- mitten-level topology is acceptable;
- thumb separation should be visible;
- palm/wrist taper must read naturally;
- fingers do not need articulation in V1;
- avoid paddle hands and spheres.

## 9. Footwear

Default should read as contemporary minimal club footwear: sneaker/technical shoe hybrid, visible ankle opening, heel/mid-foot/toe progression, no giant sole, no branded copy.

## 10. Base / build semantics

Keep current semantic contract:

base: masculine | feminine | neutral
build: slim | regular | strong

Preferred implementation:

- one shared rig;
- authored shape keys / blend shapes or compatible mesh variants;
- clothing follows the same body semantics;
- no arbitrary per-node scale hacks in the final production asset if authored morphs are available.

The semantic API remains stable even if implementation changes.

## 11. Pose

Production asset should support neutral, relaxed, focused and editorial.

Neutral is not T-pose. Weight rests slightly on one leg, shoulders are not perfectly mirrored, elbows are not locked and hands remain believable.

## 12. Materials

Preferred production materials:

1. skin/sculptural body;
2. textile;
3. dark technical;
4. accent.

Target PBR feel: matte graphite, coated textile, soft rubber, subtle satin only where useful.

Avoid glossy plastic skin, chrome body, latex, bloom-dependent neon and high-frequency micro-detail.

## 13. Texture strategy

Production V2 may use textures when they materially improve authorship.

Preferred:

- one shared 1024 atlas;
- baked AO;
- restrained roughness variation;
- optional normal map for garment folds / shoe construction;
- KTX2/Basis when pipeline is ready.

Do not use textures to fake bad silhouette. No 4K maps.

## 14. Geometry budget

Preferred mobile/auto production target:

- 18k–28k triangles;
- <= 4 materials;
- 1–3 texture sets;
- 1024 preferred;
- compressed GLB 450–850 KB preferred;
- 1 MB hard ceiling.

A 25k authored figure is preferable to a 10k procedural mannequin.

Spend geometry first on head, shoulder/torso silhouette, hands, garment edges/folds that affect silhouette, shoe, then knees/elbows only as needed.

## 15. Quality tiers

Create one source asset, then derive medium, light and high variants if needed.

Current runtime policy remains:

full -> medium
reduced -> medium
static -> static representation

High stays review/reference only until Tier A proves it.

## 16. Static representation

The static render is a first-class deliverable.

Required review renders:

- front 3/4;
- neutral;
- editorial;
- mobile portrait crop;
- square artist-card crop;
- transparent-background export.

Tier C should feel like the same identity, not a CSS approximation of a different character.

## 17. Mobile acceptance gate

Required real-device review:

- iPhone class device;
- representative Android mid-range device;
- <=430 px viewport;
- reduced tier;
- DPR 1;
- no diagnostics covering figure.

At minimum verify head read, shoulder continuity, hands, garment read, full silhouette, metadata balance and no dependency on high DPR.

## 18. Visual acceptance gate

Reject if any of the following are true:

- low-poly is the first impression;
- the figure looks like a mannequin;
- joints read as separate pieces;
- head looks generic/placeholder;
- clothing looks painted onto anatomy;
- accessories are required to create personality;
- it feels juvenile beside an established DJ portrait;
- it relies on glow/scene effects to look finished;
- mobile framing makes it feel small or cheap.

Pass only when the still itself feels like finished art direction.

## 19. Technical asset contract

Final delivery should provide source DCC file, exported GLB, documented node/bone names, material list, triangle count, texture dimensions, compressed byte size, ownership/license confirmation and static review renders.

Application code must map semantic names through the asset catalogue rather than depending directly on DCC-specific naming.

## 20. Integration order

1. art concept stills;
2. approved sculpt/model;
3. neutral + editorial static renders;
4. mobile product-size review;
5. optimized GLB;
6. runtime performance check;
7. semantic mapping;
8. Artist Profile integration;
9. static generation/export;
10. production catalogue promotion.

## 21. Definition of done

A production CUE ID V2 candidate is done when visual acceptance passes on real mobile, medium stays within budget, the semantic config drives it, static matches interactive identity, runtime stays lazy/isolated, operational bundles do not regress, and CUE_ID_ASSETS can receive it without caveats.

Until then the production catalogue remains empty.
## 22. Three first-class bases

CUE ID V2 launches with three first-class bases:

- feminine
- masculine
- neutral

These are not cosmetic variants and not a later extension. They are part of the core identity system.

All three bases must share the same art-direction quality level, product status, default outfit availability, pose set, accessory catalogue, material language and review criteria.

No base may feel secondary, experimental or fallback-like.

## 23. Base design principles

The base system defines structural reading, not stereotype.

The feminine base must avoid sexualised or reductive cues. No exaggerated chest, hyper-narrow waist, over-designed lips or glamour-avatar styling.

The masculine base must avoid heroic exaggeration. No bodybuilder shoulders, oversized jaw, comic-book chest or power-fantasy posture.

The neutral base must be a complete authored identity. It must not read as an unfinished midpoint or a masculine default with reduced features.

All three bases must read as credible professional artist identities within club culture.

## 24. Where base differentiation is allowed

Base differentiation should stay focused and restrained.

Primary differentiation zones:

- head structure;
- jaw and cheek planes;
- neck thickness;
- shoulder and upper torso width;
- ribcage to waist transition;
- pelvis and hip proportion;
- hand scale nuance.

Differences must remain legible without pushing caricature.

Hair, makeup, accessories or clothing should not be required to communicate base identity.

## 25. Head requirements across bases

Head authorship remains the highest-priority area for every base.

The three bases must share one visual family while allowing distinct structural reading.

Expected tendencies:

- feminine: slightly finer facial plane transitions, cleaner jaw taper and restrained softness without generic beauty-avatar cues;
- masculine: slightly firmer jaw, brow and cheek structure without hardening into aggression;
- neutral: balanced plane language with its own presence, not a diluted copy of either extreme.

All three must avoid blank placeholder heads, oversized eyes, fixed smiles and game-avatar facial clichés.

## 26. Clothing parity across bases

The first production outfit remains the editorial club tee.

This outfit must be reviewed on feminine, masculine and neutral before any wardrobe expansion.

The garment must preserve believable fit, readable silhouette, consistent shoulder treatment, credible sleeve behaviour and visible but restrained body identity under clothing.

If the first tee only works on one base, the asset is not ready.

## 27. Pose parity across bases

Every base must support the same pose set:

- neutral
- relaxed
- focused
- editorial

Pose language must remain equally professional across bases.

Do not encode gender stereotypes through pose. The feminine base must not become softer or more performative by default. The masculine base must not become more dominant by default. The neutral base must not become static or lifeless by default.

The pose system should express artistic presence, not social cliché.

## 28. Base x build interaction

The semantic API remains:

base: feminine | masculine | neutral
build: slim | regular | strong

Base and build must remain independent.

Expected reading rules:

- feminine + strong must still read feminine;
- masculine + slim must still read masculine;
- neutral + strong must still read neutral;
- changing build must not collapse one base into another.

The final asset should ideally implement this through authored morphs, shape keys or equivalent rig-compatible deformation rather than coarse node scaling.

## 29. Minimum review matrix

Before the production candidate can pass visual review, the following matrix must be checked at product size.

Bases:

- feminine
- masculine
- neutral

Builds:

- regular for all three bases
- slim and strong spot checks for all three bases

Outfit:

- editorial club tee

Poses:

- neutral
- editorial

This is the minimum acceptance matrix needed to validate whether the base system survives clothing and pose.

## 30. Rejection criteria for the base system

Reject the candidate if any of the following is true:

- the feminine base reads as a generic girl avatar;
- the masculine base reads as a heroic caricature;
- the neutral base reads as incomplete or default-male-lite;
- clothing erases base identity;
- accessories are needed to distinguish bases;
- the differences only appear in labels and not in the figure;
- one base looks materially weaker than the others;
- one base feels more production-ready than the others.

A pass requires all three bases to feel intentionally designed, equally credible and part of the same identity family.
