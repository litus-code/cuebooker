# CUE ID Creator 3D V1 quality authoring source.
#
# This replaces the rejected procedural-shell visual experiment with the intended
# MPFB asset pipeline: high-detail MakeHuman basemesh, fitted MHCLO garments,
# real body-part assets, game-export skin material and an IK-authored relaxed pose.
#
# Lab authoring only. Never wire directly to production.

import bpy
import importlib
import json
import math
import os
import sys
import zipfile

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

AUTHORING_ASSETS = {
    "hair": ["short01.mhclo", "short02.mhclo", "short03.mhclo"],
    "eyes": ["low-poly.mhclo", "high-poly.mhclo"],
    "eyebrows": ["eyebrow002.mhclo", "eyebrow001.mhclo"],
    "top": ["elvs_crude_t-shirt_male.mhclo", "toigo_basic_tucked_t-shirt.mhclo"],
    "bottom": ["cortu_cargo_pants.mhclo", "toigo_wool_pants.mhclo", "toigo_harem_pants.mhclo"],
    "footwear": ["shoes04.mhclo", "shoes03.mhclo", "shoes01.mhclo"],
}

FUTURE_VARIANT_ASSETS = {
    "tank": ["toigo_keyhole_tank_top.mhclo", "toigo_camisole_top.mhclo"],
    "shorts": ["cortu_jeans_shorts.mhclo"],
}


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
    raise RuntimeError(f"MPFB symbol unavailable: {package_suffix}.{symbol}")


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.armatures,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.materials,
    ):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def install_asset_packs(asset_packs, LocationService, AssetService):
    data_dir = LocationService.get_user_data()
    for pack in asset_packs:
        if not pack or not os.path.exists(pack):
            raise RuntimeError(f"Required asset pack not found: {pack}")
        with zipfile.ZipFile(pack, "r") as archive:
            archive.extractall(data_dir)
    AssetService.update_all_asset_lists()


def find_first_asset(AssetService, subdir, candidates):
    for filename in candidates:
        path = AssetService.find_asset_absolute_path(filename, asset_subdir=subdir)
        if path:
            return path, filename
    raise RuntimeError(
        f"Could not find any asset in {subdir}: {', '.join(candidates)}"
    )


def require_targets(TargetService, stack):
    missing = [
        entry["target"]
        for entry in stack
        if TargetService.target_full_path(entry["target"]) is None
    ]
    if missing:
        raise RuntimeError("Missing MPFB targets: " + ", ".join(missing))


def create_face04(human, TargetService):
    require_targets(TargetService, FACE_04_TARGETS)
    TargetService.bulk_load_targets(human, FACE_04_TARGETS)

    if not human.data.shape_keys:
        raise RuntimeError("MPFB face-04 target mix did not create shape keys")

    face_key = human.shape_key_add(name="cue_face_04", from_mix=True)
    keys = human.data.shape_keys.key_blocks

    for key in list(keys):
        if key.name not in {"Basis", "cue_face_04"}:
            human.shape_key_remove(key)

    face_key.value = 0.0
    face_key.slider_min = 0.0
    face_key.slider_max = 1.0


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
            raise RuntimeError(f"Cannot frame empty mesh {obj.name}")
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


def evaluated_bounds_many(objects):
    bounds = [evaluated_bounds(obj) for obj in objects if obj and obj.type == "MESH"]
    if not bounds:
        raise RuntimeError("Cannot frame an empty visible object set")
    return (
        Vector((
            min(item[0].x for item in bounds),
            min(item[0].y for item in bounds),
            min(item[0].z for item in bounds),
        )),
        Vector((
            max(item[1].x for item in bounds),
            max(item[1].y for item in bounds),
            max(item[1].z for item in bounds),
        )),
    )


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def reset_pose(rig):
    for bone in rig.pose.bones:
        bone.rotation_mode = "QUATERNION"
        bone.rotation_quaternion.identity()
        bone.location = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)


def create_neutral_action(rig):
    reset_pose(rig)
    action = bpy.data.actions.new(name="cue_pose_neutral")
    rig.animation_data_create()
    rig.animation_data.action = action
    for bone in rig.pose.bones:
        bone.keyframe_insert(data_path="rotation_quaternion", frame=1, group=bone.name)
        bone.keyframe_insert(data_path="location", frame=1, group=bone.name)
    rig.animation_data.action = None
    return action


def create_relaxed_ik_action(rig):
    reset_pose(rig)
    rig.animation_data_create()
    action = bpy.data.actions.new(name="cue_pose_relaxed")
    rig.animation_data.action = action

    helper_objects = []

    for side in ("l", "r"):
        upper = rig.pose.bones.get(f"upperarm_{side}")
        lower = rig.pose.bones.get(f"lowerarm_{side}")
        thigh = rig.pose.bones.get(f"thigh_{side}")
        if not upper or not lower or not thigh:
            raise RuntimeError(f"Missing game-engine limb chain for {side}")

        sign = 1.0 if thigh.head.x >= 0.0 else -1.0
        hip = thigh.head.copy()
        knee = thigh.tail.copy()

        hand_target_local = Vector((
            hip.x + sign * 0.115,
            hip.y - 0.035,
            hip.z * 0.54 + knee.z * 0.46,
        ))
        elbow_rest = lower.head.copy()
        pole_local = Vector((
            elbow_rest.x + sign * 0.10,
            elbow_rest.y + 0.32,
            elbow_rest.z - 0.03,
        ))

        target = bpy.data.objects.new(f"cue_ik_hand_{side}", None)
        pole = bpy.data.objects.new(f"cue_ik_elbow_{side}", None)
        bpy.context.collection.objects.link(target)
        bpy.context.collection.objects.link(pole)
        target.location = rig.matrix_world @ hand_target_local
        pole.location = rig.matrix_world @ pole_local
        helper_objects.extend([target, pole])

        constraint = lower.constraints.new(type="IK")
        constraint.name = f"cue_relaxed_ik_{side}"
        constraint.target = target
        constraint.pole_target = pole
        constraint.chain_count = 2
        constraint.use_tail = True
        constraint.iterations = 64

    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()

    bpy.ops.nla.bake(
        frame_start=1,
        frame_end=1,
        only_selected=False,
        visual_keying=True,
        clear_constraints=True,
        clear_parents=False,
        use_current_action=True,
        clean_curves=False,
        bake_types={"POSE"},
    )

    for helper in helper_objects:
        if helper.name in bpy.data.objects:
            bpy.data.objects.remove(helper, do_unlink=True)

    rig.animation_data.action = None
    reset_pose(rig)
    return action


def add_asset(HumanService, path, human, asset_type, material_type="GAMEENGINE"):
    asset = HumanService.add_mhclo_asset(
        path,
        human,
        asset_type=asset_type,
        subdiv_levels=0,
        material_type=material_type,
        set_up_rigging=True,
        interpolate_weights=True,
        import_subrig=False,
        import_weights=True,
    )
    if not asset:
        raise RuntimeError(f"MPFB did not create asset: {path}")
    return asset


def setup_review_scene(visible):
    minimum, maximum = evaluated_bounds_many(visible)
    center = (minimum + maximum) * 0.5
    height = max(maximum.z - minimum.z, 0.1)

    camera_data = bpy.data.cameras.new("cue_review_camera")
    camera = bpy.data.objects.new("cue_review_camera", camera_data)
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    for name, relative, energy, size_factor in [
        ("cue_review_key", (-0.70, -1.10, 0.42), 180.0, 1.5),
        ("cue_review_fill", (0.82, -0.48, 0.10), 80.0, 2.0),
        ("cue_review_rim", (0.0, 0.82, 0.36), 125.0, 1.5),
    ]:
        data = bpy.data.lights.new(name=name, type="AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = height * size_factor
        light = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(light)
        light.location = (
            center.x + relative[0] * height,
            center.y + relative[1] * height,
            center.z + relative[2] * height,
        )
        look_at(light, center)

    world = bpy.data.worlds.new("cue_review_world")
    bpy.context.scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background:
        background.inputs["Color"].default_value = (0.012, 0.014, 0.018, 1.0)
        background.inputs["Strength"].default_value = 0.18

    return camera, minimum, maximum


def cleanup_review_scene():
    for name in (
        "cue_review_camera",
        "cue_review_key",
        "cue_review_fill",
        "cue_review_rim",
    ):
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)


def render_preview(output_path, visible, portrait=False):
    cleanup_review_scene()
    camera, minimum, maximum = setup_review_scene(visible)
    center = (minimum + maximum) * 0.5
    height = max(maximum.z - minimum.z, 0.1)

    if portrait:
        target = Vector((center.x, center.y, maximum.z - height * 0.17))
        camera.location = (
            center.x + height * 0.08,
            center.y - height * 0.60,
            target.z + height * 0.015,
        )
        camera.data.lens = 78
    else:
        target = center
        camera.location = (
            center.x + height * 0.10,
            center.y - height * 1.62,
            center.z + height * 0.025,
        )
        camera.data.lens = 62

    look_at(camera, target)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 768
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.filepath = output_path
    bpy.ops.render.render(write_still=True)


def configure_viewport(visible):
    minimum, maximum = evaluated_bounds_many(visible)
    center = (minimum + maximum) * 0.5
    height = max(maximum.z - minimum.z, 0.1)
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type != "VIEW_3D":
                continue
            space = area.spaces.active
            if hasattr(space, "region_3d"):
                space.region_3d.view_location = center
                space.region_3d.view_distance = height * 0.72


def validate_future_variants(AssetService):
    result = {}
    for variant, candidates in FUTURE_VARIANT_ASSETS.items():
        found = []
        for filename in candidates:
            path = AssetService.find_asset_absolute_path(filename, asset_subdir="clothes")
            if path:
                found.append(filename)
        result[variant] = found
    return result


def write_report(output, visible, rig, selected_assets, future_assets):
    stats = {
        obj.name: {
            "vertices": len(obj.data.vertices),
            "triangles": triangle_count(obj),
            "materials": [
                slot.material.name
                for slot in obj.material_slots
                if slot.material
            ],
        }
        for obj in visible
    }
    total_triangles = sum(item["triangles"] for item in stats.values())
    materials = sorted({
        material
        for item in stats.values()
        for material in item["materials"]
    })

    report = {
        "status": "quality_authoring_source",
        "productionReady": False,
        "labCandidateReady": False,
        "bodyTopology": "MakeHuman Homunculus basemesh",
        "selectedAssets": selected_assets,
        "futureVariantAssetsFound": future_assets,
        "trianglesByObject": stats,
        "totalVisibleTriangles": total_triangles,
        "materials": materials,
        "materialCount": len(materials),
        "actions": sorted(action.name for action in bpy.data.actions),
        "rig": rig.name,
        "architectureNotes": [
            "This pass uses MPFB/MHCLO fitted assets instead of body-derived procedural shells.",
            "The high-detail basemesh is retained for face and visible skin quality.",
            "Garment delete groups are valid only for the currently equipped canonical outfit.",
            "Before runtime variant switching, body coverage must become garment-aware rather than a globally baked union.",
            "Tank/shorts assets are validated separately so future exposed shoulders and legs remain supported.",
            "Production catalogue remains untouched.",
        ],
    }

    report_path = os.path.splitext(output)[0] + ".quality-report.json"
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print("[CUE ID quality] report")
    print(json.dumps(report, indent=2))


def main():
    output = argv_value("--output")
    packs_raw = argv_value("--asset-packs")
    if not output or not packs_raw:
        raise SystemExit("Require --output and --asset-packs")

    asset_packs = [item for item in packs_raw.split(os.pathsep) if item]

    HumanService = dynamic_import("mpfb.services.humanservice", "HumanService")
    TargetService = dynamic_import("mpfb.services.targetservice", "TargetService")
    AssetService = dynamic_import("mpfb.services.assetservice", "AssetService")
    LocationService = dynamic_import("mpfb.services.locationservice", "LocationService")

    clear_scene()
    install_asset_packs(asset_packs, LocationService, AssetService)

    macro = TargetService.get_default_macro_info_dict()
    macro.update({
        "gender": 0.50,
        "age": 0.46,
        "muscle": 0.43,
        "weight": 0.48,
        "height": 0.54,
        "proportions": 0.53,
    })

    human = HumanService.create_human(
        macro_detail_dict=macro,
        scale=0.1,
        feet_on_ground=True,
    )
    human.name = "cue_body"

    require_targets(TargetService, FACE_03_TARGETS)
    TargetService.bulk_load_targets(human, FACE_03_TARGETS)
    TargetService.bake_targets(human)
    create_face04(human, TargetService)

    rig = HumanService.add_builtin_rig(human, "game_engine")
    rig.name = "cue_rig"

    selected = {}

    skin_path, skin_name = find_first_asset(
        AssetService,
        "skins",
        ["young_caucasian_male2.mhmat", "young_caucasian_male.mhmat"],
    )
    HumanService.set_character_skin(
        skin_path,
        human,
        skin_type="GAMEENGINE",
        material_instances=False,
    )
    selected["skin"] = skin_name

    eye_path, eye_name = find_first_asset(AssetService, "eyes", AUTHORING_ASSETS["eyes"])
    eyes = add_asset(HumanService, eye_path, human, "Eyes", material_type="GAMEENGINE")
    eyes.name = "cue_eyes"
    selected["eyes"] = eye_name

    brow_path, brow_name = find_first_asset(
        AssetService,
        "eyebrows",
        AUTHORING_ASSETS["eyebrows"],
    )
    brows = add_asset(HumanService, brow_path, human, "Eyebrows")
    brows.name = "cue_eyebrows"
    selected["eyebrows"] = brow_name

    hair_path, hair_name = find_first_asset(AssetService, "hair", AUTHORING_ASSETS["hair"])
    hair = add_asset(HumanService, hair_path, human, "Hair")
    hair.name = "cue_hair_textured_crop"
    selected["hair"] = hair_name

    top_path, top_name = find_first_asset(AssetService, "clothes", AUTHORING_ASSETS["top"])
    top = add_asset(HumanService, top_path, human, "Clothes")
    top.name = "cue_top_oversized_tee"
    selected["top"] = top_name

    bottom_path, bottom_name = find_first_asset(
        AssetService,
        "clothes",
        AUTHORING_ASSETS["bottom"],
    )
    bottom = add_asset(HumanService, bottom_path, human, "Clothes")
    bottom.name = "cue_bottom_wide_trouser"
    selected["bottom"] = bottom_name

    shoe_path, shoe_name = find_first_asset(
        AssetService,
        "clothes",
        AUTHORING_ASSETS["footwear"],
    )
    shoes = add_asset(HumanService, shoe_path, human, "Clothes")
    shoes.name = "cue_footwear_technical_sneaker"
    selected["footwear"] = shoe_name

    neutral = create_neutral_action(rig)
    relaxed = create_relaxed_ik_action(rig)

    visible = [human, eyes, brows, hair, top, bottom, shoes]

    human["cue_id_authoring_stage"] = "quality-source-v1"
    human["cue_id_production_ready"] = False
    human["cue_id_body_strategy"] = "high-detail-visible-skin + fitted MHCLO garments"

    output = os.path.abspath(output)
    output_dir = os.path.dirname(output)
    os.makedirs(output_dir, exist_ok=True)

    rig.animation_data.action = relaxed
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()

    render_preview(
        os.path.join(output_dir, "quality-preview-full.png"),
        visible,
        portrait=False,
    )
    render_preview(
        os.path.join(output_dir, "quality-preview-portrait.png"),
        visible,
        portrait=True,
    )

    rig.animation_data.action = neutral
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()
    render_preview(
        os.path.join(output_dir, "quality-preview-neutral.png"),
        visible,
        portrait=False,
    )

    rig.animation_data.action = relaxed
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()
    configure_viewport(visible)

    future_assets = validate_future_variants(AssetService)
    bpy.ops.wm.save_as_mainfile(filepath=output)
    write_report(output, visible, rig, selected, future_assets)

    print(f"[CUE ID quality] saved {output}")


if __name__ == "__main__":
    main()
