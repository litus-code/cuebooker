# CUE ID shared humanoid rig bootstrap for approved semantic Meshy body masters.
#
# Blender 5.2.2:
# blender --background --python scripts/blender/cue-id-body-rig-v1.py -- \
#   --input /absolute/path/cueid-male-body-master-v1-semantic.glb \
#   --body male \
#   --output /absolute/path/cueid-male-body-master-v1-rigged.blend
#
# The script deliberately creates the shared rig and deformation proof only.
# Facial expression morphs are a separate pass and are not fabricated here.

import bpy
import json
import math
import os
import sys

from mathutils import Vector


RIG_BONES = [
    "root",
    "hips",
    "spine",
    "chest",
    "upper-chest",
    "neck",
    "head",
    "shoulder-l",
    "upper-arm-l",
    "lower-arm-l",
    "hand-l",
    "shoulder-r",
    "upper-arm-r",
    "lower-arm-r",
    "hand-r",
    "upper-leg-l",
    "lower-leg-l",
    "foot-l",
    "toe-l",
    "upper-leg-r",
    "lower-leg-r",
    "foot-r",
    "toe-r",
]

SEMANTIC_NAMES = {
    "male": {
        "skin": "cue_male_skin",
        "hair": "cue_male_hair",
        "underwear": "cue_male_underwear",
    },
    "female": {
        "skin": "cue_female_skin",
        "hair": "cue_female_hair",
        "underwear": "cue_female_underwear",
    },
}


def arg(flag):
    if "--" not in sys.argv:
        return None
    values = sys.argv[sys.argv.index("--") + 1 :]
    try:
        index = values.index(flag)
    except ValueError:
        return None
    return values[index + 1] if index + 1 < len(values) else None


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def import_glb(path):
    bpy.ops.import_scene.gltf(filepath=os.path.abspath(path))


def mesh_objects():
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def combined_bounds(objects):
    coords = []
    for obj in objects:
        coords.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    if not coords:
        raise RuntimeError("No mesh bounds available")
    minimum = Vector((
        min(point.x for point in coords),
        min(point.y for point in coords),
        min(point.z for point in coords),
    ))
    maximum = Vector((
        max(point.x for point in coords),
        max(point.y for point in coords),
        max(point.z for point in coords),
    ))
    return minimum, maximum


def normalized_point(minimum, maximum, x, y, z):
    size = maximum - minimum
    center = (minimum + maximum) * 0.5
    return Vector((
        center.x + x * size.x,
        center.y + y * size.y,
        minimum.z + z * size.z,
    ))


def create_bone(edit_bones, name, head, tail, parent=None, connected=False):
    bone = edit_bones.new(name)
    bone.head = head
    bone.tail = tail
    if (tail - head).length < 0.005:
        bone.tail.z += 0.01
    bone.parent = parent
    bone.use_connect = connected
    return bone


def create_shared_rig(minimum, maximum):
    armature_data = bpy.data.armatures.new("cue_rig_data")
    rig = bpy.data.objects.new("cue_rig", armature_data)
    bpy.context.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bones = armature_data.edit_bones

    root = create_bone(
        bones,
        "root",
        normalized_point(minimum, maximum, 0.0, 0.0, 0.01),
        normalized_point(minimum, maximum, 0.0, 0.0, 0.08),
    )
    hips = create_bone(
        bones,
        "hips",
        normalized_point(minimum, maximum, 0.0, 0.0, 0.48),
        normalized_point(minimum, maximum, 0.0, 0.0, 0.56),
        root,
    )
    spine = create_bone(
        bones,
        "spine",
        hips.tail,
        normalized_point(minimum, maximum, 0.0, 0.0, 0.64),
        hips,
        True,
    )
    chest = create_bone(
        bones,
        "chest",
        spine.tail,
        normalized_point(minimum, maximum, 0.0, 0.0, 0.72),
        spine,
        True,
    )
    upper_chest = create_bone(
        bones,
        "upper-chest",
        chest.tail,
        normalized_point(minimum, maximum, 0.0, 0.0, 0.79),
        chest,
        True,
    )
    neck = create_bone(
        bones,
        "neck",
        upper_chest.tail,
        normalized_point(minimum, maximum, 0.0, 0.0, 0.845),
        upper_chest,
        True,
    )
    head = create_bone(
        bones,
        "head",
        neck.tail,
        normalized_point(minimum, maximum, 0.0, 0.0, 0.965),
        neck,
        True,
    )

    for side, sign in (("l", 1.0), ("r", -1.0)):
        shoulder = create_bone(
            bones,
            f"shoulder-{side}",
            upper_chest.tail,
            normalized_point(minimum, maximum, 0.17 * sign, 0.0, 0.775),
            upper_chest,
        )
        upper_arm = create_bone(
            bones,
            f"upper-arm-{side}",
            shoulder.tail,
            normalized_point(minimum, maximum, 0.31 * sign, 0.0, 0.675),
            shoulder,
            True,
        )
        lower_arm = create_bone(
            bones,
            f"lower-arm-{side}",
            upper_arm.tail,
            normalized_point(minimum, maximum, 0.36 * sign, 0.0, 0.555),
            upper_arm,
            True,
        )
        create_bone(
            bones,
            f"hand-{side}",
            lower_arm.tail,
            normalized_point(minimum, maximum, 0.37 * sign, 0.0, 0.495),
            lower_arm,
            True,
        )

        upper_leg = create_bone(
            bones,
            f"upper-leg-{side}",
            normalized_point(minimum, maximum, 0.085 * sign, 0.0, 0.50),
            normalized_point(minimum, maximum, 0.09 * sign, 0.0, 0.285),
            hips,
        )
        lower_leg = create_bone(
            bones,
            f"lower-leg-{side}",
            upper_leg.tail,
            normalized_point(minimum, maximum, 0.09 * sign, 0.0, 0.085),
            upper_leg,
            True,
        )
        foot = create_bone(
            bones,
            f"foot-{side}",
            lower_leg.tail,
            normalized_point(minimum, maximum, 0.09 * sign, -0.06, 0.035),
            lower_leg,
            True,
        )
        create_bone(
            bones,
            f"toe-{side}",
            foot.tail,
            normalized_point(minimum, maximum, 0.09 * sign, -0.17, 0.025),
            foot,
            True,
        )

    bpy.ops.object.mode_set(mode="OBJECT")
    return rig


def validate_contract(rig):
    found = {bone.name for bone in rig.data.bones}
    missing = [name for name in RIG_BONES if name not in found]
    extra = sorted(found - set(RIG_BONES))
    if missing:
        raise RuntimeError("Missing required CUE ID bones: " + ", ".join(missing))
    return extra


def bind_automatic(meshes, rig):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type="ARMATURE_AUTO")


def reset_pose(rig):
    for bone in rig.pose.bones:
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.location = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)


def create_action(rig, name, rotations):
    reset_pose(rig)
    for bone_name, degrees in rotations.items():
        bone = rig.pose.bones.get(bone_name)
        if not bone:
            raise RuntimeError(f"Missing pose bone: {bone_name}")
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = tuple(math.radians(value) for value in degrees)

    action = bpy.data.actions.new(name=name)
    rig.animation_data_create()
    rig.animation_data.action = action

    for bone in rig.pose.bones:
        bone.keyframe_insert(data_path="rotation_euler", frame=1, group=bone.name)
        bone.keyframe_insert(data_path="location", frame=1, group=bone.name)

    rig.animation_data.action = None
    reset_pose(rig)
    return action


def vertex_group_coverage(obj):
    weighted = 0
    total = len(obj.data.vertices)
    for vertex in obj.data.vertices:
        if any(group.weight > 0 for group in vertex.groups):
            weighted += 1
    return {
        "vertices": total,
        "weightedVertices": weighted,
        "weightedPct": round((weighted / total * 100.0) if total else 0.0, 3),
        "vertexGroups": sorted(group.name for group in obj.vertex_groups),
    }


def save_and_export(output_blend, rig, meshes):
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(output_blend))

    output_glb = os.path.splitext(os.path.abspath(output_blend))[0] + ".glb"
    bpy.ops.object.select_all(action="DESELECT")
    for obj in [*meshes, rig]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = rig

    bpy.ops.export_scene.gltf(
        filepath=output_glb,
        export_format="GLB",
        use_selection=True,
        export_skins=True,
        export_animations=True,
        export_morph=True,
        export_yup=True,
    )
    return output_glb


def main():
    input_path = arg("--input")
    body = arg("--body")
    output = arg("--output")

    if body not in SEMANTIC_NAMES:
        raise SystemExit("--body must be male or female")
    if not input_path or not output:
        raise SystemExit("Require --input, --body and --output")

    clear_scene()
    import_glb(input_path)

    expected = SEMANTIC_NAMES[body]
    objects = {obj.name: obj for obj in mesh_objects()}
    missing = [name for name in expected.values() if name not in objects]
    if missing:
        raise RuntimeError(
            "Semantic GLB is missing required meshes: " + ", ".join(missing)
        )

    meshes = [objects[expected[key]] for key in ("skin", "hair", "underwear")]
    minimum, maximum = combined_bounds(meshes)
    rig = create_shared_rig(minimum, maximum)
    extra_bones = validate_contract(rig)

    bind_automatic(meshes, rig)

    create_action(rig, "cue_pose_neutral", {})
    create_action(
        rig,
        "cue_pose_relaxed",
        {
            "upper-arm-l": (0.0, -4.0, -3.0),
            "upper-arm-r": (0.0, 4.0, 3.0),
            "lower-arm-l": (0.0, 0.0, -3.0),
            "lower-arm-r": (0.0, 0.0, 3.0),
        },
    )
    create_action(
        rig,
        "cue_pose_rig_check",
        {
            "upper-arm-l": (0.0, -18.0, -12.0),
            "upper-arm-r": (0.0, 18.0, 12.0),
            "lower-arm-l": (0.0, 0.0, -28.0),
            "lower-arm-r": (0.0, 0.0, 28.0),
            "upper-leg-l": (7.0, 0.0, 2.0),
            "lower-leg-l": (-12.0, 0.0, 0.0),
            "neck": (0.0, 0.0, 5.0),
            "head": (0.0, 0.0, -8.0),
        },
    )

    coverage = {obj.name: vertex_group_coverage(obj) for obj in meshes}
    output_glb = save_and_export(output, rig, meshes)

    report = {
        "status": "rig-bootstrap",
        "body": body,
        "input": os.path.abspath(input_path),
        "outputBlend": os.path.abspath(output),
        "outputGlb": output_glb,
        "rig": rig.name,
        "bones": [bone.name for bone in rig.data.bones],
        "extraBones": extra_bones,
        "actions": sorted(action.name for action in bpy.data.actions),
        "semanticMeshes": [obj.name for obj in meshes],
        "weightCoverage": coverage,
        "expressionMorphsAuthored": False,
        "productionReady": False,
        "notes": [
            "Shared CUE ID skeleton contract is authored.",
            "Automatic weights are only accepted after deformation review.",
            "cue_pose_rig_check is a QA pose, not a product pose.",
            "Facial expression morphs are intentionally deferred until body deformation passes.",
            "Do not wire this output into production before visual rig review.",
        ],
    }

    report_path = os.path.splitext(os.path.abspath(output))[0] + ".rig-report.json"
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
