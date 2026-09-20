# CUE ID — Sculpt / Rig Production Spec V2

Updated: 20 September 2026
Status: ARTIST PRODUCTION SPEC — SUBJECT TO VISUAL APPROVAL

## 1. Production baseline

Canonical reference state:

```text
family   club_minimal
base     neutral
build    regular
outfit   tee
accessory none
pose     neutral
material matte
```

All authored semantic changes are evaluated as deltas from this reference.

Do not use a feminine body as the slim reference.
Do not use a masculine body as the strong reference.
Do not use styling to communicate base identity.

## 2. Base and build must remain orthogonal

Required conceptual model:

```text
final body = regular neutral reference
           + selected base delta
           + selected build delta
```

Base controls structural identity.

Build controls body mass / volume class.

A build morph must preserve the selected base reading.
A base morph must not silently add a build change.

Required spot checks:

- feminine + slim;
- feminine + regular;
- feminine + strong;
- neutral + slim;
- neutral + regular;
- neutral + strong;
- masculine + slim;
- masculine + regular;
- masculine + strong.

Reject the sculpt if any build change causes one base to collapse visually into another.

## 3. Shared proportion envelope

All three regular bases should remain in the same editorial adult proportion family.

Target:

- approximately 7.5–8 heads tall;
- same apparent height in the canonical review state;
- same camera framing and floor contact;
- no heroic shoulder exaggeration;
- no glamour waist exaggeration;
- no childlike head scale;
- no hand or foot shrinkage used to feminise a base;
- no enlarged hands or jaw used to masculinise a base.

Small anatomical proportion differences are allowed where they support structural reading, but the three regular bases must feel like one product family.

## 4. Base-delta zones

Base differentiation should primarily be authored through:

### Head
- skull width/depth;
- brow plane;
- cheek plane;
- jaw taper;
- chin shape;
- neck transition.

### Upper body
- neck thickness;
- clavicle/shoulder relationship;
- shoulder breadth;
- upper-torso taper.

### Mid body
- ribcage-to-waist transition;
- pelvis proportion;
- hip transition.

### Extremities
- restrained hand-scale nuance;
- restrained limb proportion nuance only when needed.

Base differentiation should NOT be driven by:

- breast exaggeration;
- extreme waist reduction;
- glute exaggeration;
- bodybuilder chest;
- heroic deltoids;
- oversized jaw;
- pose attitude;
- hairstyle;
- makeup;
- accessories.

## 5. Build-delta rules

`regular` is the zero/reference build.

`slim` should reduce mass and volume while preserving:
- bone landmarks;
- head scale;
- base identity;
- limb length;
- hand/foot credibility.

`strong` should increase mass and structural volume while preserving:
- base identity;
- editorial proportion;
- natural joint transitions;
- non-bodybuilder silhouette.

Do not implement build by uniform object scale.

Prefer authored shape keys / blend shapes with local anatomical control.

## 6. Head production target

The head is the highest-priority sculpt area.

Required:
- authored cranial volume;
- readable forehead plane;
- readable cheek plane;
- authored jaw/chin;
- shallow eye sockets;
- restrained nose bridge/plane;
- minimal mouth plane;
- intentionally placed ears;
- smooth or effectively shaved scalp for the baseline review.

Avoid:
- realistic eyeball emphasis;
- permanent smile;
- beauty-avatar lips;
- gamer-character jaw;
- pore-level realism;
- photogrammetry look;
- blank mannequin capsule.

The head must work in a 390 px product viewport.

## 7. Topology priorities

Spend topology where silhouette and deformation need it:

1. head / jaw / neck;
2. shoulder / clavicle / upper arm;
3. tee shoulder and sleeve;
4. wrist / thumb / hand silhouette;
5. pelvis / hip transition;
6. knee / ankle;
7. shoe silhouette.

Avoid dense hidden topology with no product-size visual return.

The production target remains approximately 18k–28k triangles for the preferred mobile/auto asset, with 35k as the hard base ceiling.

## 8. Joint/deformation acceptance

Review deformation in at least:
- shoulder raise/forward rotation used by poses;
- elbow bend used by poses;
- wrist/hand orientation;
- hip weight shift;
- knee relaxation;
- ankle/foot contact.

Reject if:
- shoulder collapses;
- sleeve detaches visually from arm;
- elbow pinches into a primitive joint;
- wrist becomes tube-like;
- pelvis caves during weight shift;
- shoe loses floor contact.

## 9. Editorial tee fit

One tee must work across every base/build combination.

The tee should have:
- slightly dropped shoulder;
- authored sleeve volume;
- believable chest/upper-back clearance;
- stable neckline;
- clean hem;
- restrained folds;
- no painted-on body fit.

The garment may use corrective shapes where necessary.

Do not solve fit by hiding base/build identity under an oversized shapeless box.

## 10. Hands

Target:
- readable palm;
- visible thumb separation;
- natural wrist taper;
- grouped fingers are acceptable;
- no finger animation required for V2.

Hands must remain credible in all four semantic poses.

## 11. Footwear

Default footwear:
- contemporary minimal sneaker / technical shoe hybrid;
- readable heel, mid-foot and toe;
- visible ankle opening;
- moderate sole;
- no copied brand design.

Shoe and foot must preserve floor contact in every pose.

## 12. Rig contract

Preferred:
- one shared skeleton for all bases/builds;
- one root;
- consistent bone naming in DCC;
- no base-specific skeleton unless technically unavoidable.

Minimum useful authored hierarchy:
- root / pelvis;
- spine chain;
- neck / head;
- clavicle L/R;
- upper arm L/R;
- forearm L/R;
- hand L/R;
- thigh L/R;
- lower leg L/R;
- foot L/R.

Finger bones are optional for V2.

Application semantics are mapped through the manifest. DCC bone names are not persisted product data.

## 13. Pose targets

Required semantic poses:
- neutral;
- relaxed;
- focused;
- editorial.

Each clip's final frame is the product target.

### neutral
Professional standing state. Slight weight bias, unlocked elbows/knees, no T-pose stiffness.

### relaxed
More open weight distribution without slouching or casual caricature.

### focused
Slightly more intentional upper-body set, suitable for artist profile presence. Not aggressive.

### editorial
Stronger authored silhouette suitable for campaign/profile artwork. Not fashion-runway theatrical.

Pose language must be identical in intent across feminine, neutral and masculine bases.

## 14. Pose authoring rules

- same pose clip must work on every base/build;
- no gender-coded pose variants;
- no continuous idle animation required;
- final frame must be stable;
- feet must remain grounded;
- hands must not intersect torso/tee;
- garment must not visibly collapse.

Corrective shapes are allowed if required.

## 15. Material slots

Preferred semantic slots:
- body;
- textile;
- technical;
- accent.

Baseline review:
- matte body;
- graphite/black textile;
- dark technical shoe;
- restrained accent.

No lighting/glow trick may be required for the sculpt to read correctly.

## 16. Sculpt review sequence

### Gate A — regular bases only
Review:
- feminine + regular;
- neutral + regular;
- masculine + regular.

Same:
- neutral pose;
- tee;
- shoes;
- camera;
- light;
- matte treatment;
- no accessories;
- shaved/minimal scalp.

Required views:
- front;
- front 3/4;
- profile;
- back.

Do not proceed to build morph review until Gate A passes.

### Gate B — builds
For every base:
- slim;
- regular;
- strong.

Review front + 3/4 first.
Use profile when torso/pelvis depth changes need verification.

### Gate C — garment deformation
Review tee on all nine base/build combinations.

### Gate D — poses
Review neutral and editorial across all three regular bases.
Spot-check relaxed/focused and slim/strong combinations.

### Gate E — product-size still
Review at approximately 390 px viewport width before GLB integration.

## 17. Hard rejection conditions

Reject the candidate if:
- feminine regular is effectively a slim body;
- masculine regular is effectively a strong body;
- neutral reads as unfinished midpoint;
- build changes alter gender/base reading;
- head needs hair/glasses to feel authored;
- tee hides poor anatomy rather than fitting it;
- joints read assembled;
- hands read as paddles;
- footwear reads as blocks;
- mobile-size still reads as mannequin/game avatar;
- one base is visibly lower quality than another.

## 18. Deliverable checkpoint

Before runtime integration, provide:
- source DCC file;
- regular three-base turnaround;
- nine base/build review stills;
- tee-fit review;
- neutral/editorial pose review;
- mobile-size review still;
- optimized GLB candidate;
- asset metadata;
- reviewed semantic bindings.

Only after these pass should the package move into the existing Cuebooker inspect/validate/assess/promotion pipeline.
