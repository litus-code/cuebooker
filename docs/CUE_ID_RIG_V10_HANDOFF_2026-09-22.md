# CUE ID — Handoff rig 3D
Fecha: 22 septiembre 2026

## Estado general

La primera fase real de rigging de los bodies 3D de CUE ID queda cerrada a nivel de bootstrap compartido.

La versión elegida como baseline refinada de trabajo es:

**V10 — joint polish candidate**

V9 queda como fallback funcional anterior.

Importante:

- V10 NO se considera production-ready todavía.
- Sí se considera suficientemente estable para continuar desarrollo.
- No seguir iterando pesos manualmente salvo que una prenda, pose o caso real revele un problema concreto.
- Producción NO se toca.
- `/cue-id` sigue siendo laboratorio `noindex`.
- Public profile sigue static-first.
- Booking / Calendar / Activity no deben cargar 3D.
- ThreeJS sigue siendo el único runtime 3D.
- No conectar aún ningún asset a `CUE_ID_PRODUCTION_CATALOGUE`.

## Assets base

Male visual master:
- textured
- 351,918 tris

Female visual master:
- textured
- 466,744 tris

Semantic masters:
- `cueid-male-body-master-v1-semantic.glb`
- `cueid-female-body-master-v1-semantic.glb`

Semantic nodes:

Male:
- `cue_male_skin`
- `cue_male_hair`
- `cue_male_underwear`

Female:
- `cue_female_skin`
- `cue_female_hair`
- `cue_female_underwear`

Visual masters remain the source of truth.

## Rig contract

Shared bones:
- root
- hips
- spine
- chest
- upper-chest
- neck
- head
- shoulder-l
- upper-arm-l
- lower-arm-l
- hand-l
- shoulder-r
- upper-arm-r
- lower-arm-r
- hand-r
- upper-leg-l
- lower-leg-l
- foot-l
- toe-l
- upper-leg-r
- lower-leg-r
- foot-r
- toe-r

No extra bones.

## Weighting history

### Initial automatic Bone Heat
Rejected.

Male generated:
- skin 0%
- hair 0%
- underwear 100%

Cause:
`Bone Heat Weighting: failed to find solution`

### V3 / V4
Deterministic proximity weighting.

Coverage reached 100%, but visual deformation was rejected:
- torso exploded
- pelvis/thighs distorted
- shoulder/arm contamination

V4 also fixed Action persistence with `Fake User`.

### V5 / V6
Anatomical zone weighting introduced.

Improved torso, pelvis and legs, but shoulders, arms and wrists remained weak.

### V7
QA split into isolated diagnostic actions.

### V8
Segment-distance gated arms.

Rejected visually because chest/waist spikes and torso contamination remained.

### V9
Hard torso lock + arm capsules.

First usable shared male/female baseline.

### V10
Refines V9 around:
- shoulder / axilla
- forearm / wrist / hand
- pelvis / groin / upper-leg

V10 is the selected working baseline.

## Current QA actions

Persistent actions inside the `.blend`:
- `cue_pose_neutral`
- `cue_pose_relaxed`
- `cue_check_shoulders`
- `cue_check_elbows`
- `cue_check_hips`
- `cue_check_knees`
- `cue_check_neck_head`

Actions use Fake User so they survive reopening the `.blend`.

## Male QA — V10

Validated visually in Blender.

Shoulders:
- torso stable
- chest stable
- waist stable
- shoulder/arm transition improved
- minor axilla/shoulder stiffness remains

Status: **PASS as baseline**

Elbows:
- torso stable
- no major cross-contamination
- elbow deformation reasonable
- wrist / forearm still slightly rigid

Status: **PASS as baseline**

Hips:
- pelvis stable
- groin transition controlled
- boxer remains coherent
- upper-leg blending acceptable

Status: **PASS as baseline**

Knees:
- leg bends reasonably
- no major collapse
- silhouette remains usable

Status: **PASS as baseline**

## Female QA

V9 was validated visually across:
- shoulders
- elbows
- hips
- knees

All accepted as bootstrap-level.

Final V10 must still be regenerated and regression-checked on female before V10 exports are frozen as the shared final working baseline.

## Important nuance

"PASS" means:
- good enough to continue development
- no structural blocker
- acceptable bootstrap deformation

It does NOT mean:
- final AAA skinning
- production-ready
- garment-fit approved
- facial-ready
- clipping-free
- final animation quality

`productionReady` remains `false`.

## Remaining known rig refinements

Do not iterate these now unless a downstream feature exposes a real visible problem:
- shoulder / axilla transition
- wrist / final forearm transition
- pelvis / groin / upper-leg transition
- some bends remain slightly rigid

## Facial expressions

Still NOT authored.

Semantic target names remain:
- neutral = base
- `cue_expression_smile`
- `cue_expression_focused`
- `cue_expression_confident`
- `cue_expression_playful`

Do NOT fabricate these from body-bone rotations.

## Hair / underwear

Current source hair:
- male: `fade`
- female: `tied-back`

Hair is head/neck bound.

Underwear:
- male black boxer
- female black bralette + briefs

No floating Meshy lettering should return.

## Wardrobe and Creator constraints

Shared user-facing catalogue for male/female.

No:
- `maleClothes`
- `femaleClothes`
- `maleHair`
- `femaleHair`

Existing domain:
- `app/domain/cueIdWardrobe.ts`
- `app/domain/cueIdWorkspace.ts`
- `app/domain/cueIdStylizedCreator.ts`

Creator shows one body at a time.
Body switching preserves semantic config.
Do not reintroduce procedural mannequins.

# Recommended next phase

## Phase 1 — Freeze final V10 body outputs

Run V10 for both male and female.

Keep:
- `.blend`
- `.glb`
- `.rig-report.json`

Suggested names:
- `cueid-male-body-master-v1-rigged-v10.blend`
- `cueid-male-body-master-v1-rigged-v10.glb`
- `cueid-female-body-master-v1-rigged-v10.blend`
- `cueid-female-body-master-v1-rigged-v10.glb`

Do not overwrite visual masters.

## Phase 2 — Lab 3D integration

Use rigged GLBs only in lab / Creator stage.

Goals:
1. Load one rigged body at a time.
2. Male/female body switching.
3. Preserve semantic config on body switch.
4. Bind skin tone, hair visibility and underwear visibility.
5. Confirm neutral/idle rendering.
6. Confirm no 3D loading outside CUE ID lab/profile context.
7. Validate Android/mobile GPU/memory behavior.

Do not yet add full wardrobe fitting.

## Phase 3 — Real wardrobe fitting

Start only with:
- tee
- wide trouser
- vans-style footwear

Then:
- harness

Expand later.

## Phase 4 — Facial morphs

Only after body deformation and integration remain stable.

## Phase 5 — Performance

Keep high-quality masters.

Later create:
- reduced LOD
- static fallback
- mobile fallback

Device tiers remain:
- full
- reduced
- static

High remains lab-only.

# Do not do

- Do not merge PR #75.
- Do not touch production.
- Do not add current body assets to production catalogue.
- Do not claim rig is production-ready.
- Do not regenerate male/female visual masters unless there is a serious issue.
- Do not reintroduce native WebGL runtime.
- Do not reintroduce mannequin placeholder geometry.
- Do not make CUE ID required.
- Do not make sex-specific user-facing clothing/hair catalogues.
- Do not start broad garment fitting before final V10 body exports are frozen.

# Immediate next action

1. Run final V10 on female.
2. Quick regression: shoulders / elbows / hips / knees.
3. Freeze male + female V10 outputs.
4. Begin lab 3D integration with those V10 rigged GLBs.
