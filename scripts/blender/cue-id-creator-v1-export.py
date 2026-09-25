# Run inside Blender:
# blender --background source.blend --python scripts/blender/cue-id-creator-v1-export.py -- --output /absolute/path/creator-v1.glb

import bpy
import json
import os
import sys

REQUIRED_OBJECT_GROUPS = {
    "hair.textured-crop": ["cue_hair_textured_crop"],
    "hair.curly-crop": ["cue_hair_curly_crop"],
    "hair.locs": ["cue_hair_locs"],
    "facialHair.short-beard": ["cue_facial_short_beard"],
    "top.oversized-tee": ["cue_top_oversized_tee"],
    "top.bomber": ["cue_top_bomber"],
    "bottom.wide-trouser": ["cue_bottom_wide_trouser"],
    "bottom.cargo": ["cue_bottom_cargo"],
    "footwear.technical-sneaker": ["cue_footwear_technical_sneaker"],
    "footwear.boot": ["cue_footwear_boot"],
}

REQUIRED_MATERIALS = ["cue_mat_body", "cue_mat_textile"]
REQUIRED_ACTIONS = ["cue_pose_neutral", "cue_pose_relaxed"]
REQUIRED_SHAPE_KEYS = ["cue_face_04"]

MAX_TRIANGLES = 35000
PREFERRED_TRIANGLES = 28000
MAX_MATERIALS = 4
MAX_TEXTURE_DIMENSION = 2048


def argv_value(flag):
    argv = sys.argv
    if "--" not in argv:
        return None
    extra = argv[argv.index("--") + 1 :]
    try:
        index = extra.index(flag)
    except ValueError:
        return None
    return extra[index + 1] if index + 1 < len(extra) else None


def mesh_objects():
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def triangle_count():
    total = 0
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for obj in mesh_objects():
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        try:
            mesh.calc_loop_triangles()
            total += len(mesh.loop_triangles)
        finally:
            evaluated.to_mesh_clear()
    return total


def material_names():
    names = set()
    for obj in mesh_objects():
        for slot in obj.material_slots:
            if slot.material:
                names.add(slot.material.name)
    return sorted(names)


def texture_dimensions():
    result = []
    for image in bpy.data.images:
        if image.source == "VIEWER":
            continue
        width, height = image.size[:]
        if width and height:
            result.append({
                "name": image.name,
                "width": int(width),
                "height": int(height),
            })
    return result


def shape_key_names():
    names = set()
    for obj in mesh_objects():
        keys = obj.data.shape_keys
        if not keys:
            continue
        for key in keys.key_blocks:
            if key.name != "Basis":
                names.add(key.name)
    return sorted(names)


def action_names():
    return sorted(action.name for action in bpy.data.actions)


def require_object_groups(issues):
    available = set(bpy.data.objects.keys())
    for semantic, aliases in REQUIRED_OBJECT_GROUPS.items():
        if not any(alias in available for alias in aliases):
            issues.append(f"missing object group for {semantic}: expected one of {aliases}")


def validate():
    issues = []
    warnings = []

    objects = set(bpy.data.objects.keys())
    require_object_groups(issues)

    materials = material_names()
    for required in REQUIRED_MATERIALS:
        if required not in materials:
            issues.append(f"missing required material: {required}")

    actions = action_names()
    for required in REQUIRED_ACTIONS:
        if required not in actions:
            issues.append(f"missing required action: {required}")

    shapes = shape_key_names()
    for required in REQUIRED_SHAPE_KEYS:
        if required not in shapes:
            issues.append(f"missing required shape key: {required}")

    triangles = triangle_count()
    if triangles > MAX_TRIANGLES:
        issues.append(f"triangle budget exceeded: {triangles} > {MAX_TRIANGLES}")
    elif triangles > PREFERRED_TRIANGLES:
        warnings.append(f"triangle count above preferred target: {triangles} > {PREFERRED_TRIANGLES}")

    if len(materials) > MAX_MATERIALS:
        issues.append(f"material budget exceeded: {len(materials)} > {MAX_MATERIALS}")

    textures = texture_dimensions()
    for texture in textures:
        if max(texture["width"], texture["height"]) > MAX_TEXTURE_DIMENSION:
            issues.append(
                f"texture too large: {texture['name']} "
                f"{texture['width']}x{texture['height']} > {MAX_TEXTURE_DIMENSION}"
            )

    armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if len(armatures) != 1:
        issues.append(f"expected exactly one shared armature, found {len(armatures)}")

    report = {
        "objects": sorted(objects),
        "triangles": triangles,
        "materials": materials,
        "shapeKeys": shapes,
        "actions": actions,
        "textures": textures,
        "issues": issues,
        "warnings": warnings,
    }

    return report


def ensure_export_visibility():
    selected = {
        "cue_hair_textured_crop",
        "cue_top_oversized_tee",
        "cue_bottom_wide_trouser",
        "cue_footwear_technical_sneaker",
    }

    optional_nodes = {
        node
        for aliases in REQUIRED_OBJECT_GROUPS.values()
        for node in aliases
    }

    for name in optional_nodes:
        obj = bpy.data.objects.get(name)
        if obj:
            visible = name in selected
            obj.hide_viewport = not visible
            obj.hide_render = not visible


def export_glb(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)

    ensure_export_visibility()

    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=False,
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
    output = argv_value("--output")
    if not output:
        raise SystemExit("Missing --output /absolute/path/creator-v1.glb")

    report = validate()
    print("[CUE ID Creator 3D V1] pre-export report")
    print(json.dumps(report, indent=2))

    if report["issues"]:
        raise SystemExit(
            "CUE ID Creator 3D V1 export blocked:\n- "
            + "\n- ".join(report["issues"])
        )

    export_glb(os.path.abspath(output))
    print(f"[CUE ID Creator 3D V1] exported {os.path.abspath(output)}")


if __name__ == "__main__":
    main()
