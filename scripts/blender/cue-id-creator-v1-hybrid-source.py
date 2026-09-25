# CUE ID Creator 3D V1 hybrid quality prototype.
#
# High-detail head + lightweight full body + fitted MHCLO assets. This prototype
# exists to validate the visual/runtime architecture before lab admission.

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

ASSETS = {
    "hair": ["short01.mhclo", "short02.mhclo"],
    "eyes": ["low-poly.mhclo"],
    "eyebrows": ["eyebrow002.mhclo", "eyebrow001.mhclo"],
    "top": ["toigo_basic_tucked_t-shirt.mhclo", "elvs_crude_t-shirt_male.mhclo"],
    "bottom": ["toigo_wool_pants.mhclo", "cortu_cargo_pants.mhclo"],
    "footwear": ["shoes04.mhclo", "shoes03.mhclo", "shoes01.mhclo"],
}

FUTURE_VARIANTS = {
    "top.tank": ["toigo_keyhole_tank_top.mhclo", "toigo_camisole_top.mhclo"],
    "bottom.shorts": ["cortu_jeans_shorts.mhclo"],
}


def arg(flag):
    if "--" not in sys.argv:
        return None
    extra = sys.argv[sys.argv.index("--") + 1:]
    try:
        return extra[extra.index(flag) + 1]
    except (ValueError, IndexError):
        return None


def mpfb(suffix, symbol):
    for name in list(sys.modules):
        if name.endswith(suffix):
            module = importlib.import_module(name)
            if hasattr(module, symbol):
                return getattr(module, symbol)
    raise RuntimeError("MPFB symbol unavailable: " + suffix + "." + symbol)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def install_packs(packs, LocationService, AssetService):
    root = LocationService.get_user_data()
    for pack in packs:
        if not os.path.exists(pack):
            raise RuntimeError("Asset pack not found: " + pack)
        with zipfile.ZipFile(pack, "r") as archive:
            archive.extractall(root)
    AssetService.update_all_asset_lists()


def find_asset(AssetService, subdir, candidates):
    for filename in candidates:
        path = AssetService.find_asset_absolute_path(filename, asset_subdir=subdir)
        if path:
            return path, filename
    raise RuntimeError(f"No asset found in {subdir}: {candidates}")


def require_targets(TargetService, targets):
    missing = [x["target"] for x in targets if TargetService.target_full_path(x["target"]) is None]
    if missing:
        raise RuntimeError("Missing targets: " + ", ".join(missing))


def create_face04(human, TargetService):
    require_targets(TargetService, FACE_04_TARGETS)
    TargetService.bulk_load_targets(human, FACE_04_TARGETS)
    if not human.data.shape_keys:
        raise RuntimeError("face-04 did not create shape keys")
    key = human.shape_key_add(name="cue_face_04", from_mix=True)
    for block in list(human.data.shape_keys.key_blocks):
        if block.name not in {"Basis", "cue_face_04"}:
            human.shape_key_remove(block)
    key.value = 0.0
    key.slider_min = 0.0
    key.slider_max = 1.0


def body_vertex_indices(obj):
    group = obj.vertex_groups.get("body")
    if not group:
        return set(range(len(obj.data.vertices)))
    result = set()
    for vertex in obj.data.vertices:
        if any(member.group == group.index for member in vertex.groups):
            result.add(vertex.index)
    return result


def add_mask(obj, name, indices, invert=False):
    group = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
    group.add(sorted(indices), 1.0, "REPLACE")
    modifier = obj.modifiers.new(name=name, type="MASK")
    modifier.vertex_group = name
    modifier.invert_vertex_group = invert
    return modifier


def make_head_source(human, rig):
    neck = rig.data.bones.get("neck_01")
    if not neck:
        raise RuntimeError("neck_01 missing from game-engine rig")

    cut_z = neck.tail_local.z - 0.035
    head = human.copy()
    head.data = human.data.copy()
    head.name = "cue_head"
    bpy.context.collection.objects.link(head)

    body_indices = body_vertex_indices(head)
    visible = {
        index for index in body_indices
        if head.data.vertices[index].co.z >= cut_z - 0.035
    }
    if not visible:
        raise RuntimeError("High-detail head selection is empty")

    add_mask(head, "cue_head_visible", visible, invert=False)
    head["cue_id_head_cut_z"] = float(cut_z)
    return head, cut_z


def hide_proxy_head(proxy, cut_z):
    hidden = {
        vertex.index for vertex in proxy.data.vertices
        if vertex.co.z >= cut_z - 0.012
    }
    if not hidden:
        raise RuntimeError("Proxy head mask selection is empty")
    add_mask(proxy, "cue_hide_proxy_head", hidden, invert=True)


def remove_garment_masks_from_proxy(proxy):
    removed = []
    for modifier in list(proxy.modifiers):
        if modifier.type == "MASK" and (
            modifier.name.startswith("Delete.")
            or modifier.name == "Delete"
        ):
            removed.append(modifier.name)
            proxy.modifiers.remove(modifier)
    return removed


def make_material(name, color, roughness=0.72, metallic=0.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = color
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return material


def assign_single_material(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)


def normalize_export_materials(body, head, eyes, brows, hair, top, bottom, shoes):
    body_material = None
    for obj in (body, head):
        if obj.data.materials:
            body_material = obj.data.materials[0]
            break
    if body_material is None:
        body_material = make_material(
            "cue_mat_body",
            (0.36, 0.19, 0.12, 1.0),
            roughness=0.56,
        )
    body_material.name = "cue_mat_body"
    assign_single_material(body, body_material)
    assign_single_material(head, body_material)

    eye_material = eyes.data.materials[0] if eyes.data.materials else None
    if eye_material is None:
        eye_material = make_material(
            "cue_mat_eye",
            (0.78, 0.80, 0.78, 1.0),
            roughness=0.32,
        )
    eye_material.name = "cue_mat_eye"
    assign_single_material(eyes, eye_material)

    hair_material = make_material(
        "cue_mat_hair",
        (0.012, 0.010, 0.009, 1.0),
        roughness=0.82,
    )
    assign_single_material(hair, hair_material)
    assign_single_material(brows, hair_material)

    textile_material = make_material(
        "cue_mat_textile",
        (0.008, 0.009, 0.011, 1.0),
        roughness=0.78,
    )
    assign_single_material(top, textile_material)
    assign_single_material(bottom, textile_material)
    assign_single_material(shoes, textile_material)

    return {
        "body": body_material.name,
        "eye": eye_material.name,
        "hair": hair_material.name,
        "textile": textile_material.name,
    }


def prune_and_limit_images(max_dimension=2048):
    for material in list(bpy.data.materials):
        if material.users == 0:
            bpy.data.materials.remove(material)

    resized = []
    removed = []
    for image in list(bpy.data.images):
        if image.source == "VIEWER":
            continue
        if image.users == 0:
            removed.append(image.name)
            bpy.data.images.remove(image)
            continue

        width, height = image.size[:]
        largest = max(width, height)
        if largest > max_dimension:
            scale = max_dimension / float(largest)
            new_width = max(1, int(round(width * scale)))
            new_height = max(1, int(round(height * scale)))
            image.scale(new_width, new_height)
            resized.append({
                "name": image.name,
                "from": [int(width), int(height)],
                "to": [new_width, new_height],
            })

    return {"resized": resized, "removed": removed}


def add_asset(HumanService, path, human, asset_type, material_type="GAMEENGINE"):
    obj = HumanService.add_mhclo_asset(
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
    if not obj:
        raise RuntimeError("Could not add asset: " + path)
    return obj


def reset_pose(rig):
    for bone in rig.pose.bones:
        bone.rotation_mode = "QUATERNION"
        bone.rotation_quaternion.identity()
        bone.location = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)


def key_pose(rig, action_name):
    action = bpy.data.actions.new(name=action_name)
    rig.animation_data_create()
    rig.animation_data.action = action
    for bone in rig.pose.bones:
        bone.keyframe_insert(data_path="rotation_quaternion", frame=1, group=bone.name)
        bone.keyframe_insert(data_path="location", frame=1, group=bone.name)
    rig.animation_data.action = None
    return action


def create_neutral_action(rig):
    reset_pose(rig)
    return key_pose(rig, "cue_pose_neutral")


def create_relaxed_action(rig):
    reset_pose(rig)
    rig.animation_data_create()
    action = bpy.data.actions.new(name="cue_pose_relaxed")
    rig.animation_data.action = action

    helpers = []
    for side in ("l", "r"):
        lower = rig.pose.bones.get("lowerarm_" + side)
        thigh = rig.pose.bones.get("thigh_" + side)
        if not lower or not thigh:
            raise RuntimeError("Missing limb chain: " + side)

        sign = 1.0 if thigh.head.x >= 0.0 else -1.0
        hip = thigh.head.copy()
        knee = thigh.tail.copy()
        elbow = lower.head.copy()

        hand_local = Vector((
            hip.x + sign * 0.11,
            hip.y - 0.025,
            hip.z * 0.57 + knee.z * 0.43,
        ))
        pole_local = Vector((
            elbow.x + sign * 0.09,
            elbow.y + 0.30,
            elbow.z - 0.025,
        ))

        hand_target = bpy.data.objects.new("cue_ik_hand_" + side, None)
        pole_target = bpy.data.objects.new("cue_ik_elbow_" + side, None)
        bpy.context.collection.objects.link(hand_target)
        bpy.context.collection.objects.link(pole_target)
        hand_target.location = rig.matrix_world @ hand_local
        pole_target.location = rig.matrix_world @ pole_local
        helpers.extend([hand_target, pole_target])

        ik = lower.constraints.new(type="IK")
        ik.name = "cue_relaxed_ik_" + side
        ik.target = hand_target
        ik.pole_target = pole_target
        ik.chain_count = 2
        ik.use_tail = True
        ik.iterations = 64

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

    for obj in helpers:
        if obj.name in bpy.data.objects:
            bpy.data.objects.remove(obj, do_unlink=True)

    rig.animation_data.action = None
    reset_pose(rig)
    return action


def evaluated_bounds(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    try:
        points = [evaluated.matrix_world @ vertex.co for vertex in mesh.vertices]
        return (
            Vector((min(v.x for v in points), min(v.y for v in points), min(v.z for v in points))),
            Vector((max(v.x for v in points), max(v.y for v in points), max(v.z for v in points))),
        )
    finally:
        evaluated.to_mesh_clear()


def evaluated_bounds_many(objects):
    values = [evaluated_bounds(obj) for obj in objects if obj and obj.type == "MESH"]
    return (
        Vector((
            min(v[0].x for v in values),
            min(v[0].y for v in values),
            min(v[0].z for v in values),
        )),
        Vector((
            max(v[1].x for v in values),
            max(v[1].y for v in values),
            max(v[1].z for v in values),
        )),
    )


def triangle_count(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    try:
        mesh.calc_loop_triangles()
        return len(mesh.loop_triangles)
    finally:
        evaluated.to_mesh_clear()


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_preview(path, visible, portrait=False):
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

    world = bpy.context.scene.world or bpy.data.worlds.new("cue_review_world")
    bpy.context.scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background:
        background.inputs["Color"].default_value = (0.012, 0.014, 0.018, 1.0)
        background.inputs["Strength"].default_value = 0.18

    if portrait:
        target = Vector((center.x, center.y, maximum.z - height * 0.17))
        camera.location = (center.x + height * 0.08, center.y - height * 0.60, target.z + height * 0.015)
        camera.data.lens = 78
    else:
        target = center
        camera.location = (center.x + height * 0.10, center.y - height * 1.62, center.z + height * 0.025)
        camera.data.lens = 62

    look_at(camera, target)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 768
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

    for name in ("cue_review_camera", "cue_review_key", "cue_review_fill", "cue_review_rim"):
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)


def validate_future_assets(AssetService):
    found = {}
    for semantic, candidates in FUTURE_VARIANTS.items():
        found[semantic] = [
            filename
            for filename in candidates
            if AssetService.find_asset_absolute_path(filename, asset_subdir="clothes")
        ]
    return found


def write_report(output, visible, rig, selected, removed_masks, future, material_map, image_cleanup):
    stats = {
        obj.name: {
            "vertices": len(obj.data.vertices),
            "triangles": triangle_count(obj),
            "materials": [slot.material.name for slot in obj.material_slots if slot.material],
        }
        for obj in visible
    }
    materials = sorted({
        material
        for item in stats.values()
        for material in item["materials"]
    })
    report = {
        "status": "hybrid_quality_prototype",
        "productionReady": False,
        "labCandidateReady": False,
        "architecture": "high-detail masked head + male1591 full lightweight body",
        "selectedAssets": selected,
        "futureVariantAssetsFound": future,
        "proxyGarmentMasksRemoved": removed_masks,
        "canonicalMaterialMap": material_map,
        "imageCleanup": image_cleanup,
        "trianglesByObject": stats,
        "totalVisibleTriangles": sum(item["triangles"] for item in stats.values()),
        "materials": materials,
        "materialCount": len(materials),
        "actions": sorted(action.name for action in bpy.data.actions),
        "shapeKeys": sorted({
            key.name
            for obj in visible
            if obj.data.shape_keys
            for key in obj.data.shape_keys.key_blocks
            if key.name != "Basis"
        }),
        "rig": rig.name,
        "notes": [
            "Full lightweight body remains available below garments for tank/shorts variants.",
            "Garment delete masks are deliberately removed from cue_body in this prototype.",
            "High-detail face is isolated as cue_head and keeps cue_face_04.",
            "Canonical review outfit is forced to plain black/dark materials.",
            "Canonical top prefers the clean basic T-shirt over the rejected crude/torn T-shirt asset.",
            "Canonical bottom prefers clean wool trousers over the cargo variant.",
            "Production catalogue remains untouched.",
        ],
    }
    path = os.path.splitext(output)[0] + ".hybrid-report.json"
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")
    print("[CUE ID hybrid]", json.dumps(report, indent=2))


def main():
    output = arg("--output")
    packs_arg = arg("--asset-packs")
    if not output or not packs_arg:
        raise SystemExit("Require --output and --asset-packs")

    Human = mpfb("mpfb.services.humanservice", "HumanService")
    Target = mpfb("mpfb.services.targetservice", "TargetService")
    Asset = mpfb("mpfb.services.assetservice", "AssetService")
    Location = mpfb("mpfb.services.locationservice", "LocationService")

    clear_scene()
    install_packs([p for p in packs_arg.split(os.pathsep) if p], Location, Asset)

    macro = Target.get_default_macro_info_dict()
    macro.update({
        "gender": 0.50,
        "age": 0.46,
        "muscle": 0.43,
        "weight": 0.48,
        "height": 0.54,
        "proportions": 0.53,
    })

    human = Human.create_human(macro_detail_dict=macro, scale=0.1, feet_on_ground=True)
    human.name = "cue_authoring_source"

    require_targets(Target, FACE_03_TARGETS)
    Target.bulk_load_targets(human, FACE_03_TARGETS)
    Target.bake_targets(human)
    create_face04(human, Target)

    rig = Human.add_builtin_rig(human, "game_engine")
    rig.name = "cue_rig"

    proxy_path = Asset.find_asset_absolute_path("male1591.proxy", asset_subdir="proxymeshes")
    if not proxy_path:
        raise RuntimeError("male1591.proxy not found")
    body = Human.add_mhclo_asset(
        proxy_path,
        human,
        asset_type="Proxymeshes",
        subdiv_levels=0,
        material_type="NONE",
        set_up_rigging=True,
        interpolate_weights=True,
    )
    body.name = "cue_body"

    skin_path, skin_name = find_asset(
        Asset,
        "skins",
        ["young_caucasian_male2.mhmat", "young_caucasian_male.mhmat"],
    )
    Human.set_character_skin(
        skin_path,
        human,
        bodyproxy=body,
        skin_type="GAMEENGINE",
        material_instances=False,
    )

    head, cut_z = make_head_source(human, rig)
    hide_proxy_head(body, cut_z)

    selected = {"skin": skin_name, "proxy": "male1591.proxy"}

    eye_path, eye_name = find_asset(Asset, "eyes", ASSETS["eyes"])
    eyes = add_asset(Human, eye_path, human, "Eyes", material_type="GAMEENGINE")
    eyes.name = "cue_eyes"
    selected["eyes"] = eye_name

    brow_path, brow_name = find_asset(Asset, "eyebrows", ASSETS["eyebrows"])
    brows = add_asset(Human, brow_path, human, "Eyebrows")
    brows.name = "cue_eyebrows"
    selected["eyebrows"] = brow_name

    hair_path, hair_name = find_asset(Asset, "hair", ASSETS["hair"])
    hair = add_asset(Human, hair_path, human, "Hair")
    hair.name = "cue_hair_textured_crop"
    selected["hair"] = hair_name

    top_path, top_name = find_asset(Asset, "clothes", ASSETS["top"])
    top = add_asset(Human, top_path, human, "Clothes")
    top.name = "cue_top_oversized_tee"
    selected["top"] = top_name

    bottom_path, bottom_name = find_asset(Asset, "clothes", ASSETS["bottom"])
    bottom = add_asset(Human, bottom_path, human, "Clothes")
    bottom.name = "cue_bottom_wide_trouser"
    selected["bottom"] = bottom_name

    shoe_path, shoe_name = find_asset(Asset, "clothes", ASSETS["footwear"])
    shoes = add_asset(Human, shoe_path, human, "Clothes")
    shoes.name = "cue_footwear_technical_sneaker"
    selected["footwear"] = shoe_name

    # Canonical CUE ID baseline: four materials maximum for the first lab export.
    material_map = normalize_export_materials(
        body,
        head,
        eyes,
        brows,
        hair,
        top,
        bottom,
        shoes,
    )

    removed_masks = remove_garment_masks_from_proxy(body)

    create_neutral_action(rig)
    relaxed = create_relaxed_action(rig)

    human.hide_viewport = True
    human.hide_render = True
    rig.hide_render = True

    visible = [body, head, eyes, brows, hair, top, bottom, shoes]

    rig.animation_data_create()
    rig.animation_data.action = relaxed
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()

    output = os.path.abspath(output)
    os.makedirs(os.path.dirname(output), exist_ok=True)

    render_preview(os.path.join(os.path.dirname(output), "hybrid-preview-full.png"), visible, False)
    render_preview(os.path.join(os.path.dirname(output), "hybrid-preview-portrait.png"), visible, True)

    future = validate_future_assets(Asset)
    image_cleanup = prune_and_limit_images(2048)

    body["cue_id_authoring_stage"] = "hybrid-quality-prototype"
    body["cue_id_full_skin_for_variants"] = True
    head["cue_id_high_detail_head"] = True

    bpy.ops.wm.save_as_mainfile(filepath=output)
    write_report(
        output,
        visible,
        rig,
        selected,
        removed_masks,
        future,
        material_map,
        image_cleanup,
    )

    print("[CUE ID hybrid] saved", output)


if __name__ == "__main__":
    main()
