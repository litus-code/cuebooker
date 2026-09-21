# CUE ID Creator 3D V1 authoring bootstrap.
#
# This produces an editable MPFB-based source.blend only.
# It deliberately does NOT create placeholder hair/clothes/footwear and it is not
# eligible for CUE_ID_CREATOR_3D_LAB_CANDIDATE until the authored slice is complete.
#
# Run inside Blender with MPFB 2.x enabled:
# blender --background --python scripts/blender/cue-id-creator-v1-bootstrap.py -- \
#   --output /absolute/path/source.blend

import bpy
import importlib
import json
import math
import os
import sys

from mathutils import Vector


FACE_03_TARGETS = [
    {"target": "head-oval", "value": 0.16},
    {"target": "l-cheek-bones-incr", "value": 0.08},
    {"target": "r-cheek-bones-incr", "value": 0.07},
    {"target": "chin-width-decr", "value": 0.07},
    {"target": "chin-prominent-decr", "value": 0.04},
    {"target": "nose-scale-horiz-decr", "value": 0.05},
    {"target": "mouth-scale-horiz-incr", "value": 0.04},
    {"target": "asym-cheek-1-l", "value": 0.025},
    {"target": "asym-mouth-1-r", "value": 0.018},
    {"target": "asym-nose-2-l", "value": 0.012},
]

FACE_04_TARGETS = [
    {"target": "chin-width-incr", "value": 0.10},
    {"target": "chin-prominent-incr", "value": 0.07},
    {"target": "nose-point-down", "value": 0.055},
    {"target": "nose-scale-depth-incr", "value": 0.045},
    {"target": "mouth-upperlip-volume-incr", "value": 0.055},
    {"target": "l-cheek-bones-decr", "value": 0.045},
    {"target": "r-cheek-bones-decr", "value": 0.040},
]

MISSING_AUTHORED_NODES = [
    "cue_hair_textured_crop",
    "cue_hair_curly_crop",
    "cue_hair_locs",
    "cue_facial_short_beard",
    "cue_top_oversized_tee",
    "cue_top_bomber",
    "cue_bottom_wide_trouser",
    "cue_bottom_cargo",
    "cue_footwear_technical_sneaker",
    "cue_footwear_boot",
]


def argv_value(flag):
    if "--" not in sys.argv:
        return None
    extra = sys.argv[sys.argv.index("--") + 1 :]
    try:
        index = extra.index(flag)
    except ValueError:
        return None
    return extra[index + 1] if index + 1 < len(extra) else None


def dynamic_import(package_suffix, symbol):
    for module_name in list(sys.modules):
        if module_name.endswith(package_suffix):
            module = importlib.import_module(module_name)
            if hasattr(module, symbol):
                return getattr(module, symbol)
    raise RuntimeError(
        "MPFB is not loaded. Install and enable the official MPFB Blender extension "
        "before running this authoring bootstrap."
    )


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.armatures):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def require_targets(TargetService, stack):
    missing = []
    for entry in stack:
        if TargetService.target_full_path(entry["target"]) is None:
            missing.append(entry["target"])
    if missing:
        raise RuntimeError("Missing bundled MPFB targets: " + ", ".join(missing))


def set_material_color(material, hex_color):
    value = hex_color.lstrip("#")
    rgb = tuple(int(value[i : i + 2], 16) / 255.0 for i in (0, 2, 4))
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = 0.58
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.045


def ensure_body_material(human):
    material = bpy.data.materials.get("cue_mat_body") or bpy.data.materials.new("cue_mat_body")
    set_material_color(material, "#b9805f")
    if human.data.materials:
        human.data.materials[0] = material
    else:
        human.data.materials.append(material)

    textile = bpy.data.materials.get("cue_mat_textile") or bpy.data.materials.new("cue_mat_textile")
    textile.use_nodes = True
    textile_bsdf = textile.node_tree.nodes.get("Principled BSDF")
    if textile_bsdf:
        textile_bsdf.inputs["Base Color"].default_value = (0.055, 0.055, 0.06, 1.0)
        textile_bsdf.inputs["Roughness"].default_value = 0.72


def create_face_04(human, TargetService):
    require_targets(TargetService, FACE_04_TARGETS)
    TargetService.bulk_load_targets(human, FACE_04_TARGETS)

    if not human.data.shape_keys:
        raise RuntimeError("MPFB face-04 target mix did not create shape keys")

    cue_face = human.shape_key_add(name="cue_face_04", from_mix=True)
    keys = human.data.shape_keys.key_blocks

    for key in list(keys):
        if key.name not in {"Basis", "cue_face_04"}:
            human.shape_key_remove(key)

    cue_face.value = 0.0
    cue_face.slider_min = 0.0
    cue_face.slider_max = 1.0


def reset_pose(rig):
    for bone in rig.pose.bones:
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.location = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)


def create_pose_action(rig, name, rotations):
    reset_pose(rig)
    for bone_name, rotation_deg in rotations.items():
        bone = rig.pose.bones.get(bone_name)
        if not bone:
            raise RuntimeError(f"Required game-engine rig bone not found: {bone_name}")
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = tuple(math.radians(value) for value in rotation_deg)

    action = bpy.data.actions.get(name) or bpy.data.actions.new(name=name)
    rig.animation_data_create()
    rig.animation_data.action = action

    for bone in rig.pose.bones:
        bone.keyframe_insert(data_path="rotation_euler", frame=1, group=bone.name)
        bone.keyframe_insert(data_path="location", frame=1, group=bone.name)

    rig.animation_data.action = None
    reset_pose(rig)
    return action


def triangle_count(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    try:
        mesh.calc_loop_triangles()
        return len(mesh.loop_triangles)
    finally:
        evaluated.to_mesh_clear()


def evaluated_bounds(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    try:
        coords = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
        if not coords:
            raise RuntimeError("Cannot frame an empty evaluated mesh")
        minimum = Vector((
            min(value.x for value in coords),
            min(value.y for value in coords),
            min(value.z for value in coords),
        ))
        maximum = Vector((
            max(value.x for value in coords),
            max(value.y for value in coords),
            max(value.z for value in coords),
        ))
        return minimum, maximum
    finally:
        evaluated.to_mesh_clear()


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def configure_saved_viewport(human):
    minimum, maximum = evaluated_bounds(human)
    center = (minimum + maximum) * 0.5
    height = max(maximum.z - minimum.z, 0.1)

    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type != "VIEW_3D":
                continue
            space = area.spaces.active
            if not hasattr(space, "region_3d"):
                continue
            space.region_3d.view_location = center
            space.region_3d.view_distance = height * 0.72


def ensure_review_camera_and_lights(human):
    minimum, maximum = evaluated_bounds(human)
    center = (minimum + maximum) * 0.5
    height = max(maximum.z - minimum.z, 0.1)

    camera_data = bpy.data.cameras.get("cue_review_camera") or bpy.data.cameras.new("cue_review_camera")
    camera = bpy.data.objects.get("cue_review_camera")
    if camera is None:
        camera = bpy.data.objects.new("cue_review_camera", camera_data)
        bpy.context.collection.objects.link(camera)
    camera.data = camera_data
    bpy.context.scene.camera = camera

    light_specs = [
        ("cue_review_key", (-0.75, -1.2, 0.45), 950.0, 3.0),
        ("cue_review_fill", (0.9, -0.65, 0.18), 520.0, 3.4),
        ("cue_review_rim", (0.0, 0.95, 0.48), 780.0, 2.6),
    ]

    for name, relative, energy, size in light_specs:
        data = bpy.data.lights.get(name) or bpy.data.lights.new(name=name, type="AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = height * size
        light = bpy.data.objects.get(name)
        if light is None:
            light = bpy.data.objects.new(name, data)
            bpy.context.collection.objects.link(light)
        light.data = data
        light.location = (
            center.x + relative[0] * height,
            center.y + relative[1] * height,
            center.z + relative[2] * height,
        )
        look_at(light, center)

    world = bpy.context.scene.world
    if world is None:
        world = bpy.data.worlds.new("cue_review_world")
        bpy.context.scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background:
        background.inputs["Color"].default_value = (0.012, 0.014, 0.018, 1.0)
        background.inputs["Strength"].default_value = 0.30

    return camera, minimum, maximum


def render_review_preview(output, human, portrait=False):
    camera, minimum, maximum = ensure_review_camera_and_lights(human)
    center = (minimum + maximum) * 0.5
    height = max(maximum.z - minimum.z, 0.1)

    if portrait:
        target = Vector((center.x, center.y, maximum.z - height * 0.16))
        camera.location = (
            center.x + height * 0.11,
            center.y - height * 0.72,
            target.z + height * 0.02,
        )
        camera.data.lens = 74
    else:
        target = center
        camera.location = (
            center.x + height * 0.12,
            center.y - height * 1.70,
            center.z + height * 0.04,
        )
        camera.data.lens = 58

    look_at(camera, target)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 768
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.filepath = output
    bpy.ops.render.render(write_still=True)


def mesh_surface_breakdown(human, ObjectService):
    body_vertices = set(ObjectService.get_vertex_indexes_for_vertex_group(human, "body"))
    if not body_vertices:
        raise RuntimeError("MPFB basemesh is missing the expected body vertex group")

    human.data.calc_loop_triangles()
    body_triangles = 0
    helper_triangles = 0

    for triangle in human.data.loop_triangles:
        if all(index in body_vertices for index in triangle.vertices):
            body_triangles += 1
        else:
            helper_triangles += 1

    return {
        "bodySurfaceVertices": len(body_vertices),
        "helperVertices": len(human.data.vertices) - len(body_vertices),
        "bodySurfaceTriangles": body_triangles,
        "helperTriangles": helper_triangles,
        "rawMeshTriangles": body_triangles + helper_triangles,
        "evaluatedTriangles": triangle_count(human),
    }


def write_report(output, human, rig, macro, ObjectService):
    surface = mesh_surface_breakdown(human, ObjectService)

    report = {
        "status": "authoring_bootstrap_only",
        "source": "MPFB official extension + MakeHuman core basemesh/targets",
        "sourceAssetLicense": "CC0 core graphical assets; MPFB extension code remains GPL",
        "output": os.path.abspath(output),
        "bodyObject": human.name,
        "rigObject": rig.name,
        "rigType": "game_engine",
        "vertices": len(human.data.vertices),
        "triangles": surface["evaluatedTriangles"],
        "surfaceBreakdown": surface,
        "shapeKeys": (
            [key.name for key in human.data.shape_keys.key_blocks]
            if human.data.shape_keys
            else []
        ),
        "actions": sorted(action.name for action in bpy.data.actions),
        "bones": sorted(bone.name for bone in rig.data.bones),
        "macro": macro,
        "face03BakedTargets": FACE_03_TARGETS,
        "face04MorphTargets": FACE_04_TARGETS,
        "missingAuthoredNodes": MISSING_AUTHORED_NODES,
        "productionReady": False,
        "labCandidateReady": False,
        "notes": [
            "This file is an editable human authoring base, not the CUE ID final avatar.",
            "Hair, facial hair, garments and footwear remain intentionally uncreated.",
            "Retopology/optimization and visual review are still required before GLB export.",
            "Do not wire this source.blend directly into CUE_ID_CREATOR_3D_LAB_CANDIDATE.",
        ],
    }

    report_path = os.path.splitext(os.path.abspath(output))[0] + ".bootstrap-report.json"
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print("[CUE ID Creator 3D V1] bootstrap report")
    print(json.dumps(report, indent=2))


def main():
    output = argv_value("--output")
    if not output:
        raise SystemExit("Missing --output /absolute/path/source.blend")

    HumanService = dynamic_import("mpfb.services.humanservice", "HumanService")
    TargetService = dynamic_import("mpfb.services.targetservice", "TargetService")
    ObjectService = dynamic_import("mpfb.services.objectservice", "ObjectService")

    clear_scene()

    macro = TargetService.get_default_macro_info_dict()
    macro.update(
        {
            "gender": 0.50,
            "age": 0.46,
            "muscle": 0.43,
            "weight": 0.48,
            "height": 0.54,
            "proportions": 0.53,
        }
    )

    human = HumanService.create_human(
        macro_detail_dict=macro,
        scale=0.1,
        feet_on_ground=True,
    )
    human.name = "cue_body"

    require_targets(TargetService, FACE_03_TARGETS)
    TargetService.bulk_load_targets(human, FACE_03_TARGETS)
    TargetService.bake_targets(human)

    create_face_04(human, TargetService)
    ensure_body_material(human)

    rig = HumanService.add_builtin_rig(human, "game_engine")
    rig.name = "cue_rig"

    required_bones = {
        "Root",
        "head",
        "upperarm_l",
        "upperarm_r",
        "lowerarm_l",
        "lowerarm_r",
        "thigh_l",
        "thigh_r",
        "foot_l",
        "foot_r",
    }
    missing_bones = sorted(required_bones - set(rig.data.bones.keys()))
    if missing_bones:
        raise RuntimeError("Missing required rig regions: " + ", ".join(missing_bones))

    create_pose_action(
        rig,
        "cue_pose_neutral",
        {
            "upperarm_l": (0.0, 0.0, -48.0),
            "upperarm_r": (0.0, 0.0, 48.0),
            "lowerarm_l": (0.0, 0.0, -5.0),
            "lowerarm_r": (0.0, 0.0, 5.0),
        },
    )
    create_pose_action(
        rig,
        "cue_pose_relaxed",
        {
            "upperarm_l": (4.0, -4.0, -55.0),
            "upperarm_r": (-3.0, 5.0, 51.0),
            "lowerarm_l": (0.0, -7.0, -13.0),
            "lowerarm_r": (0.0, 6.0, 10.0),
            "thigh_l": (0.0, 0.0, 1.5),
            "thigh_r": (0.0, 0.0, -2.0),
        },
    )

    human["cue_id_authoring_stage"] = "creator-3d-v1-bootstrap"
    human["cue_id_visual_review_required"] = True
    human["cue_id_production_ready"] = False

    output = os.path.abspath(output)
    output_dir = os.path.dirname(output)
    os.makedirs(output_dir, exist_ok=True)

    render_review_preview(os.path.join(output_dir, "source-preview-full.png"), human, portrait=False)
    render_review_preview(os.path.join(output_dir, "source-preview-portrait.png"), human, portrait=True)
    configure_saved_viewport(human)

    bpy.ops.wm.save_as_mainfile(filepath=output)
    write_report(output, human, rig, macro, ObjectService)

    print(f"[CUE ID Creator 3D V1] saved editable authoring base: {output}")


if __name__ == "__main__":
    main()
