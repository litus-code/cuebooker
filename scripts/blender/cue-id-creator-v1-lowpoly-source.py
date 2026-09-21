# CUE ID Creator 3D V1 low-poly authored canonical source.
#
# Builds the first dressed canonical CUE ID authoring source from the official
# CC0 MakeHuman system topology male1591. The upstream topology name is authoring
# provenance only. Runtime/export object aliases remain CUE ID semantic names.
#
# This is still a lab authoring source, not a production catalogue asset.

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

VISIBLE_ALIASES = [
    "cue_body",
    "cue_eyes",
    "cue_hair_textured_crop",
    "cue_top_oversized_tee",
    "cue_bottom_wide_trouser",
    "cue_footwear_technical_sneaker",
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


def install_system_assets(asset_pack, LocationService, AssetService):
    if not asset_pack or not os.path.exists(asset_pack):
        raise RuntimeError("Official MakeHuman system asset pack is required")
    data_dir = LocationService.get_user_data()
    with zipfile.ZipFile(asset_pack, "r") as archive:
        archive.extractall(data_dir)
    AssetService.update_all_asset_lists()


def require_targets(TargetService, stack):
    missing = [
        entry["target"]
        for entry in stack
        if TargetService.target_full_path(entry["target"]) is None
    ]
    if missing:
        raise RuntimeError("Missing MPFB targets: " + ", ".join(missing))


def make_material(name, color, roughness=0.6, metallic=0.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    material.diffuse_color = color
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        if "Subsurface Weight" in bsdf.inputs and name == "cue_mat_body":
            bsdf.inputs["Subsurface Weight"].default_value = 0.035
    return material


def assign_only_material(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)


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
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def create_pose_action(rig, name, rotations):
    for bone in rig.pose.bones:
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.location = (0.0, 0.0, 0.0)

    for bone_name, rotation_deg in rotations.items():
        bone = rig.pose.bones.get(bone_name)
        if not bone:
            raise RuntimeError(f"Required rig bone not found: {bone_name}")
        bone.rotation_mode = "XYZ"
        bone.rotation_euler = tuple(math.radians(value) for value in rotation_deg)

    action = bpy.data.actions.get(name) or bpy.data.actions.new(name=name)
    rig.animation_data_create()
    rig.animation_data.action = action

    for bone in rig.pose.bones:
        bone.keyframe_insert(data_path="rotation_euler", frame=1, group=bone.name)
        bone.keyframe_insert(data_path="location", frame=1, group=bone.name)

    rig.animation_data.action = None
    for bone in rig.pose.bones:
        bone.rotation_euler = (0.0, 0.0, 0.0)
        bone.location = (0.0, 0.0, 0.0)

    return action


def add_face04_proxy_morph(human, proxy, HumanService, TargetService):
    base_coords = [vertex.co.copy() for vertex in proxy.data.vertices]

    require_targets(TargetService, FACE_04_TARGETS)
    TargetService.bulk_load_targets(human, FACE_04_TARGETS)
    HumanService.refit(human)

    face04_coords = [vertex.co.copy() for vertex in proxy.data.vertices]
    if len(face04_coords) != len(base_coords):
        raise RuntimeError("Proxy topology changed while generating cue_face_04")

    if human.data.shape_keys:
        for key in human.data.shape_keys.key_blocks:
            if key.name != "Basis":
                key.value = 0.0
    TargetService.bake_targets(human)
    HumanService.refit(human)

    for vertex, coord in zip(proxy.data.vertices, base_coords):
        vertex.co = coord

    if proxy.data.shape_keys:
        while proxy.data.shape_keys and len(proxy.data.shape_keys.key_blocks) > 0:
            proxy.shape_key_remove(proxy.data.shape_keys.key_blocks[-1])

    proxy.shape_key_add(name="Basis", from_mix=False)
    face_key = proxy.shape_key_add(name="cue_face_04", from_mix=False)
    for index, coord in enumerate(face04_coords):
        face_key.data[index].co = coord
    face_key.value = 0.0
    face_key.slider_min = 0.0
    face_key.slider_max = 1.0


def copy_weights(source, target, source_indices):
    group_map = {}
    for source_group in source.vertex_groups:
        group_map[source_group.index] = target.vertex_groups.new(name=source_group.name)

    for new_index, source_index in enumerate(source_indices):
        source_vertex = source.data.vertices[source_index]
        for membership in source_vertex.groups:
            target_group = group_map.get(membership.group)
            if target_group:
                target_group.add([new_index], membership.weight, "REPLACE")


def derived_shell(source, rig, name, face_predicate, transform, material,
                  solidify=0.0, subdiv=0):
    selected_polygons = []
    used = set()

    for polygon in source.data.polygons:
        center = sum((source.data.vertices[i].co for i in polygon.vertices), Vector()) / len(polygon.vertices)
        if face_predicate(center):
            selected_polygons.append(tuple(polygon.vertices))
            used.update(polygon.vertices)

    if not selected_polygons:
        raise RuntimeError(f"No source faces selected for {name}")

    source_indices = sorted(used)
    remap = {old: new for new, old in enumerate(source_indices)}
    vertices = [
        tuple(transform(
            source.data.vertices[source_index].co.copy(),
            source.data.vertices[source_index].normal.copy(),
            source_index,
        ))
        for source_index in source_indices
    ]
    faces = [tuple(remap[index] for index in polygon) for polygon in selected_polygons]

    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.parent = rig

    for polygon in mesh.polygons:
        polygon.use_smooth = True

    copy_weights(source, obj, source_indices)

    armature = obj.modifiers.new(name="cue_armature", type="ARMATURE")
    armature.object = rig

    if solidify > 0.0:
        modifier = obj.modifiers.new(name="cue_thickness", type="SOLIDIFY")
        modifier.thickness = solidify
        modifier.offset = 0.25

    if subdiv > 0:
        modifier = obj.modifiers.new(name="cue_subdivision", type="SUBSURF")
        modifier.subdivision_type = "CATMULL_CLARK"
        modifier.levels = subdiv
        modifier.render_levels = subdiv

    assign_only_material(obj, material)
    return obj


def create_authored_parts(body, rig, textile_material, hair_material):
    head_center = Vector((0.0, -0.115, 1.545))

    def hair_predicate(center):
        # Keep a compact crown + temple crop. The lower-front head must remain skin.
        crown = center.z > 1.585
        side_crop = center.z > 1.515 and center.y > -0.155
        return abs(center.x) < 0.17 and (crown or side_crop)

    def hair_transform(coord, normal, index):
        relative = coord - head_center
        direction = relative.normalized() if relative.length > 0.0001 else Vector((0.0, 0.0, 1.0))
        result = coord + direction * 0.010
        result.z += 0.004 + 0.003 * math.sin(index * 2.173)
        return result

    hair = derived_shell(
        body, rig, "cue_hair_textured_crop",
        hair_predicate, hair_transform, hair_material,
        solidify=0.0045, subdiv=0,
    )

    torso_center = Vector((0.0, -0.105, 1.075))

    def tee_predicate(center):
        if not 0.80 < center.z < 1.405:
            return False

        # A compact crew-neck opening instead of slicing the garment horizontally
        # across the clavicles.
        if center.z > 1.305 and abs(center.x) < 0.115 and center.y < 0.025:
            return False

        torso = abs(center.x) < 0.315
        short_sleeve = 1.045 < center.z < 1.335 and abs(center.x) < 0.455
        return torso or short_sleeve

    def tee_transform(coord, normal, _index):
        relative = coord - torso_center
        lower_extra = min(max((1.05 - coord.z) / 0.25, 0.0), 1.0)
        sleeve_extra = min(max((abs(coord.x) - 0.24) / 0.17, 0.0), 1.0)
        relative.x *= 1.105 + 0.055 * lower_extra + 0.035 * sleeve_extra
        relative.y *= 1.18 + 0.035 * sleeve_extra
        result = torso_center + relative
        result += normal * 0.012
        if coord.z < 0.88:
            result.z -= 0.026
        return result

    tee = derived_shell(
        body, rig, "cue_top_oversized_tee",
        tee_predicate, tee_transform, textile_material,
        solidify=0.010, subdiv=0,
    )

    def pants_predicate(center):
        return 0.065 < center.z < 0.93 and abs(center.x) < 0.31

    def pants_transform(coord, normal, _index):
        side = -1.0 if coord.x < 0.0 else 1.0
        leg_center_x = side * 0.112
        relative_x = coord.x - leg_center_x
        lower_blend = min(max((0.78 - coord.z) / 0.58, 0.0), 1.0)
        hip_blend = min(max((coord.z - 0.72) / 0.20, 0.0), 1.0)
        x_scale = 1.14 + 0.20 * lower_blend + 0.04 * hip_blend
        y_center = -0.105
        result = coord.copy()
        result.x = leg_center_x + relative_x * x_scale
        result.y = y_center + (coord.y - y_center) * (1.16 + 0.08 * lower_blend)
        result += normal * 0.013
        if coord.z < 0.14:
            result.z -= 0.010
        return result

    pants = derived_shell(
        body, rig, "cue_bottom_wide_trouser",
        pants_predicate, pants_transform, textile_material,
        solidify=0.010, subdiv=0,
    )

    def shoe_predicate(center):
        return center.z < 0.175

    def shoe_transform(coord, normal, _index):
        side = -1.0 if coord.x < 0.0 else 1.0
        center = Vector((side * 0.118, -0.15, 0.065))
        relative = coord - center
        relative.x *= 1.14
        relative.y *= 1.25
        relative.z *= 1.12
        result = center + relative
        result.y -= 0.012
        result.z += 0.004
        result += normal * 0.010
        return result

    shoes = derived_shell(
        body, rig, "cue_footwear_technical_sneaker",
        shoe_predicate, shoe_transform, textile_material,
        solidify=0.009, subdiv=0,
    )

    return [hair, tee, pants, shoes]


def setup_review_scene(body, rig):
    minimum, maximum = evaluated_bounds(body)
    center = (minimum + maximum) * 0.5
    height = maximum.z - minimum.z

    camera_data = bpy.data.cameras.new("cue_review_camera")
    camera = bpy.data.objects.new("cue_review_camera", camera_data)
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    for name, relative, energy, size_factor in [
        ("cue_review_key", (-0.70, -1.15, 0.45), 115.0, 1.9),
        ("cue_review_fill", (0.85, -0.55, 0.15), 55.0, 2.4),
        ("cue_review_rim", (0.0, 0.85, 0.42), 90.0, 1.8),
    ]:
        data = bpy.data.lights.new(name=name, type="AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = height * size_factor
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = (
            center.x + relative[0] * height,
            center.y + relative[1] * height,
            center.z + relative[2] * height,
        )
        look_at(obj, center)

    world = bpy.data.worlds.new("cue_review_world")
    bpy.context.scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background:
        background.inputs["Color"].default_value = (0.010, 0.012, 0.016, 1.0)
        background.inputs["Strength"].default_value = 0.12

    return camera, minimum, maximum


def render_preview(output_path, body, rig, portrait=False):
    camera, minimum, maximum = setup_review_scene(body, rig)
    center = (minimum + maximum) * 0.5
    height = maximum.z - minimum.z

    if portrait:
        target = Vector((center.x, center.y, maximum.z - height * 0.18))
        camera.location = (
            center.x + height * 0.12,
            center.y - height * 0.74,
            target.z + height * 0.02,
        )
        camera.data.lens = 72
    else:
        target = center
        camera.location = (
            center.x + height * 0.13,
            center.y - height * 1.72,
            center.z + height * 0.02,
        )
        camera.data.lens = 58

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

    bpy.data.objects.remove(camera, do_unlink=True)
    for name in ("cue_review_key", "cue_review_fill", "cue_review_rim"):
        obj = bpy.data.objects.get(name)
        if obj:
            bpy.data.objects.remove(obj, do_unlink=True)


def configure_viewport(body):
    minimum, maximum = evaluated_bounds(body)
    center = (minimum + maximum) * 0.5
    height = maximum.z - minimum.z
    for screen in bpy.data.screens:
        for area in screen.areas:
            if area.type != "VIEW_3D":
                continue
            space = area.spaces.active
            if hasattr(space, "region_3d"):
                space.region_3d.view_location = center
                space.region_3d.view_distance = height * 0.72


def material_names(objects):
    result = set()
    for obj in objects:
        if obj.type != "MESH":
            continue
        for slot in obj.material_slots:
            if slot.material:
                result.add(slot.material.name)
    return sorted(result)


def write_report(output, body, eyes, authored_parts, rig):
    visible = [body, eyes] + authored_parts
    stats = {
        obj.name: {
            "vertices": len(obj.data.vertices),
            "triangles": triangle_count(obj),
        }
        for obj in visible
    }
    total_triangles = sum(item["triangles"] for item in stats.values())
    materials = material_names(visible)

    report = {
        "status": "canonical_lowpoly_authoring_source",
        "productionReady": False,
        "labCandidateReady": False,
        "upstreamTopology": "male1591",
        "runtimeBodyAlias": "cue_body",
        "visibleAliases": [obj.name for obj in visible],
        "trianglesByObject": stats,
        "totalVisibleTriangles": total_triangles,
        "materials": materials,
        "materialCount": len(materials),
        "shapeKeys": (
            [key.name for key in body.data.shape_keys.key_blocks]
            if body.data.shape_keys
            else []
        ),
        "actions": sorted(action.name for action in bpy.data.actions),
        "rig": rig.name,
        "notes": [
            "Canonical visual combination only.",
            "Derived garment and hair meshes are first-pass authored shells and require visual refinement.",
            "Remaining first-slice variants are intentionally not authored yet.",
            "Production catalogue remains untouched.",
        ],
    }

    report_path = os.path.splitext(output)[0] + ".lowpoly-report.json"
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print("[CUE ID lowpoly] report")
    print(json.dumps(report, indent=2))


def main():
    output = argv_value("--output")
    asset_pack = argv_value("--asset-pack")
    if not output or not asset_pack:
        raise SystemExit("Require --output and --asset-pack")

    HumanService = dynamic_import("mpfb.services.humanservice", "HumanService")
    TargetService = dynamic_import("mpfb.services.targetservice", "TargetService")
    AssetService = dynamic_import("mpfb.services.assetservice", "AssetService")
    LocationService = dynamic_import("mpfb.services.locationservice", "LocationService")

    clear_scene()
    install_system_assets(asset_pack, LocationService, AssetService)

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
    human.name = "cue_authoring_source"

    require_targets(TargetService, FACE_03_TARGETS)
    TargetService.bulk_load_targets(human, FACE_03_TARGETS)
    TargetService.bake_targets(human)

    rig = HumanService.add_builtin_rig(human, "game_engine")
    rig.name = "cue_rig"

    proxy_path = AssetService.find_asset_absolute_path(
        "male1591.proxy",
        asset_subdir="proxymeshes",
    )
    if not proxy_path:
        raise RuntimeError("male1591.proxy not found in official system assets")

    body = HumanService.add_mhclo_asset(
        proxy_path,
        human,
        asset_type="Proxymeshes",
        subdiv_levels=0,
        material_type="NONE",
        set_up_rigging=True,
        interpolate_weights=True,
    )
    body.name = "cue_body"

    eye_path = AssetService.find_asset_absolute_path(
        "low-poly.mhclo",
        asset_subdir="eyes",
    )
    if not eye_path:
        raise RuntimeError("low-poly eye asset not found in official system assets")

    eyes = HumanService.add_mhclo_asset(
        eye_path,
        human,
        asset_type="Eyes",
        subdiv_levels=0,
        material_type="PROCEDURAL_EYES",
        set_up_rigging=True,
        interpolate_weights=True,
    )
    eyes.name = "cue_eyes"
    if eyes.data.materials:
        eyes.data.materials[0].name = "cue_mat_eye"

    add_face04_proxy_morph(human, body, HumanService, TargetService)

    body_subdiv = body.modifiers.new(name="cue_body_subdivision", type="SUBSURF")
    body_subdiv.subdivision_type = "CATMULL_CLARK"
    body_subdiv.levels = 1
    body_subdiv.render_levels = 1

    body_material = make_material("cue_mat_body", (0.34, 0.17, 0.095, 1.0), 0.60)
    textile_material = make_material("cue_mat_textile", (0.012, 0.014, 0.018, 1.0), 0.79)
    hair_material = make_material("cue_mat_hair", (0.004, 0.0035, 0.003, 1.0), 0.86)

    assign_only_material(body, body_material)
    human.data.materials.clear()
    human.data.materials.append(body_material)

    authored_parts = create_authored_parts(body, rig, textile_material, hair_material)

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
    relaxed = create_pose_action(
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

    human.hide_render = True
    human.hide_viewport = True
    rig.hide_render = True

    # Review the authored silhouette in the source rest pose. The actions stay
    # embedded for runtime switching, but the canonical still must expose fit
    # and clipping problems rather than hiding them behind a crossed-arm pose.
    rig.animation_data_create()
    rig.animation_data.action = None
    bpy.context.scene.frame_set(1)

    output = os.path.abspath(output)
    output_dir = os.path.dirname(output)
    os.makedirs(output_dir, exist_ok=True)

    render_preview(
        os.path.join(output_dir, "canonical-preview-full.png"),
        body,
        rig,
        portrait=False,
    )
    render_preview(
        os.path.join(output_dir, "canonical-preview-portrait.png"),
        body,
        rig,
        portrait=True,
    )

    configure_viewport(body)
    rig.hide_viewport = True

    body["cue_id_source_topology"] = "male1591"
    body["cue_id_source_license"] = "CC0"
    body["cue_id_authoring_stage"] = "canonical-lowpoly-v1"
    body["cue_id_production_ready"] = False

    bpy.ops.wm.save_as_mainfile(filepath=output)
    write_report(output, body, eyes, authored_parts, rig)

    print(f"[CUE ID lowpoly] saved {output}")


if __name__ == "__main__":
    main()
