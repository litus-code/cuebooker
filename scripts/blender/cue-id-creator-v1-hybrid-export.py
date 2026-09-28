# CUE ID Creator 3D V1 hybrid lab export gate.
#
# Exports the inspected canonical hybrid slice only. This intentionally excludes
# the hidden high-detail authoring basemesh and does not promote anything to the
# production catalogue.

import bpy
import json
import os
import sys


REQUIRED_MESHES = [
    "cue_body",
    "cue_head",
    "cue_eyes",
    "cue_eyebrows",
    "cue_hair_textured_crop",
    "cue_top_oversized_tee",
    "cue_bottom_wide_trouser",
    "cue_footwear_technical_sneaker",
]

REQUIRED_MATERIALS = {
    "cue_mat_body",
    "cue_mat_eye",
    "cue_mat_hair",
    "cue_mat_textile",
}

REQUIRED_ACTIONS = {
    "cue_pose_neutral",
    "cue_pose_relaxed",
}

MAX_TRIANGLES = 35000
PREFERRED_TRIANGLES = 28000
MAX_MATERIALS = 4
MAX_TEXTURE_DIMENSION = 2048


def arg(flag):
    if "--" not in sys.argv:
        return None
    extra = sys.argv[sys.argv.index("--") + 1:]
    try:
        return extra[extra.index(flag) + 1]
    except (ValueError, IndexError):
        return None


def required_objects():
    missing = [name for name in REQUIRED_MESHES if bpy.data.objects.get(name) is None]
    rig = bpy.data.objects.get("cue_rig")
    if rig is None or rig.type != "ARMATURE":
        missing.append("cue_rig")
    if missing:
        raise RuntimeError("Missing hybrid export objects: " + ", ".join(missing))
    return [bpy.data.objects[name] for name in REQUIRED_MESHES], rig


def triangle_count(objects):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    total = 0
    by_object = {}
    for obj in objects:
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        try:
            mesh.calc_loop_triangles()
            count = len(mesh.loop_triangles)
            by_object[obj.name] = count
            total += count
        finally:
            evaluated.to_mesh_clear()
    return total, by_object


def material_names(objects):
    result = set()
    for obj in objects:
        for slot in obj.material_slots:
            if slot.material:
                result.add(slot.material.name)
    return result


def texture_dimensions():
    result = []
    for image in bpy.data.images:
        if image.source == "VIEWER" or image.users == 0:
            continue
        width, height = image.size[:]
        if width and height:
            result.append({
                "name": image.name,
                "width": int(width),
                "height": int(height),
            })
    return result


def shape_keys(objects):
    result = set()
    for obj in objects:
        keys = obj.data.shape_keys
        if not keys:
            continue
        for key in keys.key_blocks:
            if key.name != "Basis":
                result.add(key.name)
    return result


def validate(objects, rig):
    issues = []
    warnings = []

    triangles, by_object = triangle_count(objects)
    materials = material_names(objects)
    actions = set(action.name for action in bpy.data.actions)
    shapes = shape_keys(objects)
    textures = texture_dimensions()

    if triangles > MAX_TRIANGLES:
        issues.append(f"triangle budget exceeded: {triangles} > {MAX_TRIANGLES}")
    elif triangles > PREFERRED_TRIANGLES:
        warnings.append(f"triangle count above preferred target: {triangles} > {PREFERRED_TRIANGLES}")

    missing_materials = sorted(REQUIRED_MATERIALS - materials)
    if missing_materials:
        issues.append("missing canonical materials: " + ", ".join(missing_materials))

    if len(materials) > MAX_MATERIALS:
        issues.append(f"material budget exceeded: {len(materials)} > {MAX_MATERIALS}")

    missing_actions = sorted(REQUIRED_ACTIONS - actions)
    if missing_actions:
        issues.append("missing actions: " + ", ".join(missing_actions))

    if "cue_face_04" not in shapes:
        issues.append("missing cue_face_04 morph")

    for texture in textures:
        if max(texture["width"], texture["height"]) > MAX_TEXTURE_DIMENSION:
            issues.append(
                f"texture too large: {texture['name']} "
                f"{texture['width']}x{texture['height']} > {MAX_TEXTURE_DIMENSION}"
            )

    report = {
        "status": "hybrid_lab_export_gate",
        "productionReady": False,
        "labCandidateReady": False,
        "objects": [obj.name for obj in objects],
        "rig": rig.name,
        "triangles": triangles,
        "trianglesByObject": by_object,
        "materials": sorted(materials),
        "shapeKeys": sorted(shapes),
        "actions": sorted(actions),
        "textures": textures,
        "issues": issues,
        "warnings": warnings,
        "notes": [
            "The hidden cue_authoring_source is intentionally excluded from the GLB.",
            "This artifact is lab evidence only until the visual acceptance gate passes.",
            "Production catalogue remains untouched.",
        ],
    }
    return report


def export_glb(output, objects, rig):
    bpy.ops.object.select_all(action="DESELECT")

    for obj in objects + [rig]:
        obj.hide_set(False)
        obj.hide_viewport = False
        obj.hide_render = False
        obj.select_set(True)

    bpy.context.view_layer.objects.active = rig
    os.makedirs(os.path.dirname(output), exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath=output,
        export_format="GLB",
        use_selection=True,
        export_apply=False,
        export_animations=True,
        export_morph=True,
        export_morph_normal=True,
        export_morph_tangent=False,
        export_yup=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
    )


def main():
    output = arg("--output")
    if not output:
        raise SystemExit("Require --output /absolute/path/creator-v1-hybrid.glb")

    objects, rig = required_objects()
    report = validate(objects, rig)

    report_path = os.path.splitext(os.path.abspath(output))[0] + ".export-report.json"
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print("[CUE ID hybrid export] report")
    print(json.dumps(report, indent=2))

    if report["issues"]:
        raise SystemExit(
            "Hybrid lab export blocked:\n- " + "\n- ".join(report["issues"])
        )

    export_glb(os.path.abspath(output), objects, rig)
    print("[CUE ID hybrid export] exported", os.path.abspath(output))


if __name__ == "__main__":
    main()
