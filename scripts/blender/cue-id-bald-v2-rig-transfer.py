# CUE ID V2 neutral-bald body rig transfer.
#
# Reuses the accepted V10 rig contract/actions and transfers the accepted V10
# vertex-group weighting pattern onto the new neutral-bald V2 semantic masters.
# It deliberately does not author hair or facial morphs.
#
# Blender 5.2.2:
# blender --background --python scripts/blender/cue-id-bald-v2-rig-transfer.py -- \
#   --source-rigged /abs/cueid-male-body-master-v1-rigged-v10.glb \
#   --target /abs/cueid-male-body-bald-master-v2-semantic.glb \
#   --body male \
#   --output /abs/cueid-male-body-bald-master-v2-rigged.blend

import bpy
import json
import os
import sys

from mathutils import Vector
from mathutils.kdtree import KDTree


REQUIRED_ACTIONS = {
    "cue_pose_neutral",
    "cue_pose_relaxed",
    "cue_check_shoulders",
    "cue_check_elbows",
    "cue_check_hips",
    "cue_check_knees",
    "cue_check_neck_head",
}

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


def arg(flag):
    if "--" not in sys.argv:
        return None
    values = sys.argv[sys.argv.index("--") + 1:]
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


def armatures():
    return [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]


def find_named_mesh(name):
    candidates = [obj for obj in mesh_objects() if obj.name == name]
    if candidates:
        return candidates[0]
    candidates = [obj for obj in mesh_objects() if obj.name.startswith(name)]
    if candidates:
        return candidates[0]
    return None


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


def normalize_point(point, minimum, maximum):
    size = maximum - minimum
    return Vector((
        (point.x - minimum.x) / size.x if size.x else 0.5,
        (point.y - minimum.y) / size.y if size.y else 0.5,
        (point.z - minimum.z) / size.z if size.z else 0.5,
    ))


def denormalize_point(point, minimum, maximum):
    size = maximum - minimum
    return Vector((
        minimum.x + point.x * size.x,
        minimum.y + point.y * size.y,
        minimum.z + point.z * size.z,
    ))


def validate_rig(rig):
    names = {bone.name for bone in rig.data.bones}
    missing = [name for name in RIG_BONES if name not in names]
    if missing:
        raise RuntimeError("Source V10 rig is missing bones: " + ", ".join(missing))


def retarget_rig_rest_pose(rig, source_min, source_max, target_min, target_max):
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    for bone in rig.data.edit_bones:
        head_world = rig.matrix_world @ bone.head
        tail_world = rig.matrix_world @ bone.tail
        head_n = normalize_point(head_world, source_min, source_max)
        tail_n = normalize_point(tail_world, source_min, source_max)
        new_head_world = denormalize_point(head_n, target_min, target_max)
        new_tail_world = denormalize_point(tail_n, target_min, target_max)
        bone.head = rig.matrix_world.inverted() @ new_head_world
        bone.tail = rig.matrix_world.inverted() @ new_tail_world

    bpy.ops.object.mode_set(mode="OBJECT")


def source_vertex_weights(source_obj, vertex):
    result = []
    for membership in vertex.groups:
        if membership.weight <= 0:
            continue
        group = source_obj.vertex_groups[membership.group]
        result.append((group.name, membership.weight))
    return result


def transfer_weights_normalized(source_obj, target_obj, source_bounds, target_bounds):
    source_min, source_max = source_bounds
    target_min, target_max = target_bounds

    tree = KDTree(len(source_obj.data.vertices))
    source_weight_cache = {}

    for vertex in source_obj.data.vertices:
        world = source_obj.matrix_world @ vertex.co
        normalized = normalize_point(world, source_min, source_max)
        tree.insert(normalized, vertex.index)
        source_weight_cache[vertex.index] = source_vertex_weights(source_obj, vertex)

    tree.balance()

    all_group_names = sorted({
        name
        for weights in source_weight_cache.values()
        for name, _ in weights
    })

    for name in all_group_names:
        if target_obj.vertex_groups.get(name) is None:
            target_obj.vertex_groups.new(name=name)

    assigned = 0
    for vertex in target_obj.data.vertices:
        world = target_obj.matrix_world @ vertex.co
        normalized = normalize_point(world, target_min, target_max)
        _, source_index, _ = tree.find(normalized)
        weights = source_weight_cache[source_index]

        if weights:
            assigned += 1

        for group_name, weight in weights:
            group = target_obj.vertex_groups[group_name]
            group.add([vertex.index], weight, "REPLACE")

    return {
        "vertices": len(target_obj.data.vertices),
        "weightedVertices": assigned,
        "weightedPct": round(
            (assigned / len(target_obj.data.vertices) * 100.0)
            if target_obj.data.vertices else 0.0,
            3,
        ),
        "vertexGroups": all_group_names,
    }


def attach_to_rig(obj, rig):
    obj.parent = rig
    obj.matrix_parent_inverse = rig.matrix_world.inverted()
    modifier = obj.modifiers.get("CueRig")
    if modifier is None:
        modifier = obj.modifiers.new(name="CueRig", type="ARMATURE")
    modifier.object = rig


def remove_source_meshes(source_meshes):
    for obj in source_meshes:
        bpy.data.objects.remove(obj, do_unlink=True)


def mark_actions_persistent():
    for action in bpy.data.actions:
        action.use_fake_user = True


def save_and_export(output_blend, rig, target_meshes):
    output_blend = os.path.abspath(output_blend)
    os.makedirs(os.path.dirname(output_blend), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=output_blend)

    output_glb = os.path.splitext(output_blend)[0] + ".glb"
    bpy.ops.object.select_all(action="DESELECT")
    for obj in [rig, *target_meshes]:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = rig

    bpy.ops.export_scene.gltf(
        filepath=output_glb,
        export_format="GLB",
        use_selection=True,
        export_skins=True,
        export_animations=True,
        export_animation_mode="ACTIONS",
        export_morph=True,
        export_yup=True,
        export_optimize_animation_size=True,
    )
    return output_glb


def main():
    source_path = arg("--source-rigged")
    target_path = arg("--target")
    body = arg("--body")
    output = arg("--output")

    if body not in {"male", "female"}:
        raise SystemExit("--body must be male or female")
    if not source_path or not target_path or not output:
        raise SystemExit("Require --source-rigged, --target, --body and --output")

    clear_scene()

    import_glb(source_path)
    source_rigs = armatures()
    if len(source_rigs) != 1:
        raise RuntimeError(f"Expected one source armature, found {len(source_rigs)}")
    rig = source_rigs[0]
    rig.name = "cue_rig"
    validate_rig(rig)

    source_skin = find_named_mesh(f"cue_{body}_skin")
    source_underwear = find_named_mesh(f"cue_{body}_underwear")
    if not source_skin or not source_underwear:
        raise RuntimeError("Source V10 semantic skin/underwear meshes were not found")

    source_meshes = list(mesh_objects())
    source_bounds = combined_bounds([source_skin, source_underwear])

    # Keep source objects distinguishable after importing target.
    source_skin.name = f"_source_{body}_skin"
    source_underwear.name = f"_source_{body}_underwear"
    for obj in source_meshes:
        if obj not in {source_skin, source_underwear}:
            obj.name = "_source_" + obj.name

    import_glb(target_path)
    target_skin = find_named_mesh(f"cue_{body}_skin")
    target_underwear = find_named_mesh(f"cue_{body}_underwear")
    if not target_skin or not target_underwear:
        raise RuntimeError("Target V2 semantic skin/underwear meshes were not found")

    target_meshes = [target_skin, target_underwear]
    target_bounds = combined_bounds(target_meshes)

    coverage = {
        target_skin.name: transfer_weights_normalized(
            source_skin, target_skin, source_bounds, target_bounds
        ),
        target_underwear.name: transfer_weights_normalized(
            source_underwear, target_underwear, source_bounds, target_bounds
        ),
    }

    retarget_rig_rest_pose(rig, source_bounds[0], source_bounds[1], target_bounds[0], target_bounds[1])

    for obj in target_meshes:
        attach_to_rig(obj, rig)

    remove_source_meshes(source_meshes)
    mark_actions_persistent()

    found_actions = {action.name for action in bpy.data.actions}
    missing_actions = sorted(REQUIRED_ACTIONS - found_actions)

    output_glb = save_and_export(output, rig, target_meshes)

    report = {
        "status": "rig-transfer-v2-neutral-bald-candidate",
        "body": body,
        "sourceRigged": os.path.abspath(source_path),
        "targetSemantic": os.path.abspath(target_path),
        "outputBlend": os.path.abspath(output),
        "outputGlb": output_glb,
        "rig": rig.name,
        "bones": [bone.name for bone in rig.data.bones],
        "actions": sorted(found_actions),
        "missingRequiredActions": missing_actions,
        "semanticMeshes": [obj.name for obj in target_meshes],
        "weightTransfer": coverage,
        "hairEmbedded": False,
        "expressionMorphsAuthored": False,
        "productionReady": False,
        "notes": [
            "Uses the accepted V10 rig contract and action set as the source.",
            "Transfers V10 weight patterns in normalized body space onto the neutral-bald V2 topology.",
            "Retargets the V10 rest-bone positions to the V2 body bounds.",
            "No hair mesh is part of the V2 base-body contract.",
            "This output requires Blender visual QA before lab replacement.",
        ],
    }

    report_path = os.path.splitext(os.path.abspath(output))[0] + ".rig-report.json"
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
