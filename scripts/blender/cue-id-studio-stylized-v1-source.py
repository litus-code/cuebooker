# CUE ID Stylized Creator V1, Blender Studio authored-base prototype.
#
# Uses Blender Studio Human Base Meshes CC0 as an authoring source, reduces the
# runtime body before expression authoring, applies CUE ID proportions/materials,
# adds designed facial/hair details and rigs a relaxed standing pose.
#
# Evidence only until the visual acceptance gate passes.

import bpy
import json
import math
import os
import sys

from mathutils import Vector


SOURCE_COLLECTION = "Body Male - Stylized"
RUNTIME_DECIMATE_RATIO = 0.50
ART_GATE_STATIC = True
EXPRESSIONS = ("neutral", "smile", "focused", "confident", "playful")


def arg(flag):
    if "--" not in sys.argv:
        return None
    extra = sys.argv[sys.argv.index("--") + 1:]
    try:
        return extra[extra.index(flag) + 1]
    except (ValueError, IndexError):
        return None


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in list(bpy.data.collections):
        bpy.data.collections.remove(collection)


def append_collection(blend_path, name):
    before = set(bpy.data.collections.keys())
    directory = os.path.join(blend_path, "Collection")
    bpy.ops.wm.append(
        filepath=os.path.join(directory, name),
        directory=directory + os.sep,
        filename=name,
        link=False,
    )
    created = [
        collection
        for key, collection in bpy.data.collections.items()
        if key not in before
    ]
    exact = next((item for item in created if item.name == name), None)
    if exact:
        return exact
    if created:
        return created[-1]
    raise RuntimeError("Could not append Blender Studio collection: " + name)


def recursive_objects(collection):
    result = set(collection.objects)
    for child in collection.children:
        result.update(recursive_objects(child))
    return list(result)


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


def set_single_material(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)


def smooth(obj):
    for polygon in obj.data.polygons:
        polygon.use_smooth = True


def world_bounds(obj):
    points = [obj.matrix_world @ vertex.co for vertex in obj.data.vertices]
    return (
        Vector((
            min(point.x for point in points),
            min(point.y for point in points),
            min(point.z for point in points),
        )),
        Vector((
            max(point.x for point in points),
            max(point.y for point in points),
            max(point.z for point in points),
        )),
    )


def local_bounds(obj):
    points = [vertex.co for vertex in obj.data.vertices]
    return (
        Vector((
            min(point.x for point in points),
            min(point.y for point in points),
            min(point.z for point in points),
        )),
        Vector((
            max(point.x for point in points),
            max(point.y for point in points),
            max(point.z for point in points),
        )),
    )


def bounds_for(objects):
    values = [world_bounds(obj) for obj in objects if obj.type == "MESH"]
    return (
        Vector((
            min(value[0].x for value in values),
            min(value[0].y for value in values),
            min(value[0].z for value in values),
        )),
        Vector((
            max(value[1].x for value in values),
            max(value[1].y for value in values),
            max(value[1].z for value in values),
        )),
    )


def apply_runtime_decimation(body):
    modifier = body.modifiers.new(name="cue_runtime_decimate", type="DECIMATE")
    modifier.decimate_type = "COLLAPSE"
    modifier.ratio = RUNTIME_DECIMATE_RATIO
    modifier.use_collapse_triangulate = True

    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    body.select_set(False)


def smoothstep(value):
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def stylize_head_proportions(body):
    minimum, maximum = local_bounds(body)
    height = maximum.z - minimum.z
    neck_z = minimum.z + height * 0.765
    full_head_z = minimum.z + height * 0.815
    center_y = (minimum.y + maximum.y) * 0.5

    for vertex in body.data.vertices:
        z = vertex.co.z
        if z <= neck_z:
            continue

        weight = smoothstep((z - neck_z) / max(full_head_z - neck_z, 0.0001))
        xy_scale = 1.0 + 0.105 * weight
        z_scale = 1.0 + 0.055 * weight

        vertex.co.x *= xy_scale
        vertex.co.y = center_y + (vertex.co.y - center_y) * xy_scale
        vertex.co.z = neck_z + (vertex.co.z - neck_z) * z_scale


def object_center(obj):
    minimum, maximum = world_bounds(obj)
    return (minimum + maximum) * 0.5


def object_size(obj):
    minimum, maximum = world_bounds(obj)
    return maximum - minimum


def create_uv_ellipsoid(name, location, scale, material, segments=16, rings=8):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=rings,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)
    set_single_material(obj, material)
    smooth(obj)
    return obj


def create_cube(name, location, scale, material, bevel_width=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    if bevel_width > 0.0:
        bevel = obj.modifiers.new(name="cue_bevel", type="BEVEL")
        bevel.width = bevel_width
        bevel.segments = 2
        bevel.limit_method = "ANGLE"
        bpy.ops.object.modifier_apply(modifier=bevel.name)

    obj.select_set(False)
    set_single_material(obj, material)
    smooth(obj)
    return obj


def create_torus_mark(name, location, scale, material):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=1.0,
        minor_radius=0.22,
        major_segments=16,
        minor_segments=6,
        location=location,
        rotation=(math.radians(90), 0.0, 0.0),
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.select_set(False)
    set_single_material(obj, material)
    smooth(obj)
    return obj


def create_material_zones(body, skin, textile):
    body.data.materials.clear()
    body.data.materials.append(skin)
    body.data.materials.append(textile)

    minimum, maximum = local_bounds(body)
    height = maximum.z - minimum.z

    for polygon in body.data.polygons:
        center = sum((body.data.vertices[index].co for index in polygon.vertices), Vector()) / len(polygon.vertices)
        z = (center.z - minimum.z) / height
        ax = abs(center.x) / height

        pants = 0.075 <= z <= 0.485 and ax < 0.19
        torso_tee = 0.485 < z <= 0.745 and ax < 0.19
        sleeve = 0.635 < z <= 0.755 and ax < 0.31

        neckline = z > 0.705 and ax < 0.075
        if neckline:
            torso_tee = False

        shoe = z < 0.070 and ax < 0.16

        polygon.material_index = 1 if (pants or torso_tee or sleeve or shoe) else 0


def add_expression_keys(body, eye_centers):
    if body.data.shape_keys:
        while len(body.data.shape_keys.key_blocks) > 1:
            body.shape_key_remove(body.data.shape_keys.key_blocks[-1])
    else:
        body.shape_key_add(name="Basis")

    minimum, maximum = local_bounds(body)
    height = maximum.z - minimum.z
    head_min_y = min(
        vertex.co.y
        for vertex in body.data.vertices
        if vertex.co.z > minimum.z + height * 0.76
    )

    eye_z = sum(center.z for center in eye_centers) / len(eye_centers)
    mouth_z = eye_z - height * 0.055

    mouth_indices = []
    upper_face_indices = []

    for vertex in body.data.vertices:
        co = vertex.co
        front = co.y <= head_min_y + height * 0.045

        if (
            front
            and abs(co.x) < height * 0.075
            and abs(co.z - mouth_z) < height * 0.030
        ):
            mouth_indices.append(vertex.index)

        if (
            front
            and abs(co.x) < height * 0.11
            and eye_z + height * 0.018 < co.z < eye_z + height * 0.075
        ):
            upper_face_indices.append(vertex.index)

    def key(name):
        return body.shape_key_add(name="cue_expression_" + name, from_mix=False)

    smile = key("smile")
    for index in mouth_indices:
        base = body.data.vertices[index].co
        factor = min(1.0, abs(base.x) / (height * 0.065))
        smile.data[index].co.z += height * (0.010 * factor - 0.0015 * (1.0 - factor))

    focused = key("focused")
    for index in mouth_indices:
        focused.data[index].co.z -= height * 0.002
    for index in upper_face_indices:
        base = body.data.vertices[index].co
        inner = max(0.0, 1.0 - abs(base.x) / (height * 0.10))
        focused.data[index].co.z -= height * 0.006 * inner

    confident = key("confident")
    for index in mouth_indices:
        base = body.data.vertices[index].co
        side = 1.0 if base.x > 0 else -0.25
        factor = min(1.0, abs(base.x) / (height * 0.065))
        confident.data[index].co.z += height * 0.008 * factor * side

    playful = key("playful")
    for index in mouth_indices:
        base = body.data.vertices[index].co
        side = 1.0 if base.x < 0 else 0.35
        factor = min(1.0, abs(base.x) / (height * 0.065))
        playful.data[index].co.z += height * 0.011 * factor * side

    return {
        "mouthVertexCount": len(mouth_indices),
        "upperFaceVertexCount": len(upper_face_indices),
    }


def create_rig(body):
    minimum, maximum = world_bounds(body)
    height = maximum.z - minimum.z
    center_y = (minimum.y + maximum.y) * 0.5

    data = bpy.data.armatures.new("cue_rig_data")
    rig = bpy.data.objects.new("cue_rig", data)
    bpy.context.collection.objects.link(rig)

    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    bones = {}

    def bone(name, head, tail, parent=None):
        item = data.edit_bones.new(name)
        item.head = head
        item.tail = tail
        if parent:
            item.parent = bones[parent]
            item.use_connect = False
        bones[name] = item

    z = lambda fraction: minimum.z + height * fraction

    bone("root", (0, center_y, z(0.02)), (0, center_y, z(0.12)))
    bone("pelvis", (0, center_y, z(0.46)), (0, center_y, z(0.54)), "root")
    bone("spine", (0, center_y, z(0.54)), (0, center_y, z(0.73)), "pelvis")
    bone("neck", (0, center_y, z(0.73)), (0, center_y, z(0.80)), "spine")
    bone("head", (0, center_y, z(0.80)), (0, center_y, z(0.97)), "neck")

    for side, sign in (("l", 1.0), ("r", -1.0)):
        shoulder = (sign * height * 0.165, center_y, z(0.725))
        elbow = (sign * height * 0.285, center_y, z(0.615))
        wrist = (sign * height * 0.365, center_y, z(0.505))
        hand_end = (sign * height * 0.405, center_y, z(0.445))

        bone(f"upperarm_{side}", shoulder, elbow, "spine")
        bone(f"lowerarm_{side}", elbow, wrist, f"upperarm_{side}")
        bone(f"hand_{side}", wrist, hand_end, f"lowerarm_{side}")

        hip = (sign * height * 0.065, center_y, z(0.47))
        knee = (sign * height * 0.072, center_y, z(0.255))
        ankle = (sign * height * 0.072, center_y, z(0.065))
        toe = (sign * height * 0.072, minimum.y - height * 0.085, z(0.025))

        bone(f"thigh_{side}", hip, knee, "pelvis")
        bone(f"shin_{side}", knee, ankle, f"thigh_{side}")
        bone(f"foot_{side}", ankle, toe, f"shin_{side}")

    bpy.ops.object.mode_set(mode="OBJECT")
    rig.select_set(False)

    return rig, height


def auto_bind_body(body, rig):
    bpy.ops.object.select_all(action="DESELECT")
    body.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig

    try:
        bpy.ops.object.parent_set(type="ARMATURE_AUTO")
        method = "ARMATURE_AUTO"
    except Exception:
        bpy.ops.object.select_all(action="DESELECT")
        body.select_set(True)
        rig.select_set(True)
        bpy.context.view_layer.objects.active = rig
        bpy.ops.object.parent_set(type="ARMATURE_ENVELOPE")
        method = "ARMATURE_ENVELOPE"

    body.select_set(False)
    rig.select_set(False)
    return method


def rigid_bind(obj, rig, bone_name):
    if rig is None:
        return

    group = obj.vertex_groups.get(bone_name) or obj.vertex_groups.new(name=bone_name)
    group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")

    modifier = obj.modifiers.get("cue_armature") or obj.modifiers.new(
        name="cue_armature",
        type="ARMATURE",
    )
    modifier.object = rig

    obj.parent = rig
    obj.matrix_parent_inverse = rig.matrix_world.inverted()


def reset_pose(rig):
    for bone in rig.pose.bones:
        bone.rotation_mode = "QUATERNION"
        bone.rotation_quaternion.identity()
        bone.location = (0.0, 0.0, 0.0)
        bone.scale = (1.0, 1.0, 1.0)


def key_current_pose(rig, name):
    action = bpy.data.actions.new(name=name)
    rig.animation_data_create()
    rig.animation_data.action = action
    for bone in rig.pose.bones:
        bone.keyframe_insert(data_path="rotation_quaternion", frame=1, group=bone.name)
        bone.keyframe_insert(data_path="location", frame=1, group=bone.name)
    rig.animation_data.action = None
    return action


def create_relaxed_pose(rig, height):
    reset_pose(rig)
    neutral = key_current_pose(rig, "cue_pose_neutral")

    reset_pose(rig)
    action = bpy.data.actions.new(name="cue_pose_relaxed")
    rig.animation_data_create()
    rig.animation_data.action = action
    helpers = []

    for side, sign in (("l", 1.0), ("r", -1.0)):
        lower = rig.pose.bones.get(f"lowerarm_{side}")
        if not lower:
            raise RuntimeError("Missing lower-arm bone for relaxed IK: " + side)

        target = bpy.data.objects.new(f"cue_hand_target_{side}", None)
        pole = bpy.data.objects.new(f"cue_elbow_pole_{side}", None)
        bpy.context.collection.objects.link(target)
        bpy.context.collection.objects.link(pole)

        target.location = Vector((
            sign * height * 0.135,
            -height * 0.018,
            height * 0.385,
        ))
        pole.location = Vector((
            sign * height * 0.30,
            height * 0.12,
            height * 0.57,
        ))
        helpers.extend([target, pole])

        constraint = lower.constraints.new(type="IK")
        constraint.name = f"cue_relaxed_ik_{side}"
        constraint.target = target
        constraint.pole_target = pole
        constraint.chain_count = 2
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

    for helper in helpers:
        if helper.name in bpy.data.objects:
            bpy.data.objects.remove(helper, do_unlink=True)

    rig.animation_data.action = None
    reset_pose(rig)
    return neutral, action


def create_hair(body, rig, hair_material):
    minimum, maximum = world_bounds(body)
    height = maximum.z - minimum.z
    head_center = Vector((
        0.0,
        (minimum.y + maximum.y) * 0.5,
        minimum.z + height * 0.885,
    ))

    specs = [
        (-0.085, -0.035, 0.080, 0.067, 0.047, 0.00),
        (-0.030, -0.052, 0.096, 0.073, 0.050, -0.10),
        (0.030, -0.052, 0.098, 0.073, 0.052, 0.08),
        (0.085, -0.035, 0.082, 0.066, 0.048, 0.14),
        (-0.105, 0.005, 0.064, 0.060, 0.056, -0.12),
        (0.105, 0.005, 0.066, 0.060, 0.056, 0.12),
        (-0.060, 0.035, 0.082, 0.062, 0.045, 0.08),
        (0.060, 0.035, 0.082, 0.062, 0.045, -0.08),
        (0.000, 0.055, 0.090, 0.065, 0.043, 0.00),
    ]

    clumps = []
    for index, (nx, ny, sx, sy, sz, rot) in enumerate(specs):
        location = (
            head_center.x + nx * height,
            head_center.y + ny * height,
            head_center.z + (0.070 if index < 4 else 0.055) * height,
        )
        clump = create_uv_ellipsoid(
            f"cue_hair_crop_{index}",
            location,
            (sx * height, sy * height, sz * height),
            hair_material,
            segments=12,
            rings=6,
        )
        clump.rotation_euler.z = rot
        rigid_bind(clump, rig, "head")
        clumps.append(clump)

    return clumps


def create_face_details(body, eyes, rig, hair_material, detail_material):
    minimum, maximum = world_bounds(body)
    height = maximum.z - minimum.z

    eye_centers = []
    irises = []
    brows = []

    ordered = sorted(eyes, key=lambda item: object_center(item).x)

    for index, eye in enumerate(ordered):
        eye.name = "cue_eye_l" if index == 0 else "cue_eye_r"
        set_single_material(eye, detail_material)
        smooth(eye)

        center = object_center(eye)
        size = object_size(eye)
        eye_centers.append(center)

        iris = create_uv_ellipsoid(
            "cue_iris_l" if index == 0 else "cue_iris_r",
            (
                center.x,
                center.y - max(size.y * 0.48, height * 0.002),
                center.z,
            ),
            (
                max(size.x * 0.23, height * 0.012),
                height * 0.004,
                max(size.z * 0.23, height * 0.012),
            ),
            hair_material,
            segments=14,
            rings=7,
        )
        rigid_bind(iris, rig, "head")
        irises.append(iris)

        brow = create_uv_ellipsoid(
            "cue_brow_l" if index == 0 else "cue_brow_r",
            (
                center.x,
                center.y - height * 0.028,
                center.z + height * 0.048,
            ),
            (
                height * 0.043,
                height * 0.007,
                height * 0.011,
            ),
            hair_material,
            segments=12,
            rings=6,
        )
        brow.rotation_euler.y = math.radians(-8 if index == 0 else 8)
        rigid_bind(brow, rig, "head")
        brows.append(brow)

        rigid_bind(eye, rig, "head")

    return eye_centers, irises, brows


def create_brand_mark(body, rig, detail_material):
    minimum, maximum = world_bounds(body)
    height = maximum.z - minimum.z
    front_y = minimum.y

    ring = create_torus_mark(
        "cue_brand_mark_disc",
        (-height * 0.080, front_y - height * 0.008, minimum.z + height * 0.655),
        (height * 0.011, height * 0.005, height * 0.011),
        detail_material,
    )
    rigid_bind(ring, rig, "spine")

    needle = create_cube(
        "cue_brand_mark_needle",
        (-height * 0.067, front_y - height * 0.010, minimum.z + height * 0.650),
        (height * 0.006, height * 0.0025, height * 0.0016),
        detail_material,
        bevel_width=height * 0.001,
    )
    needle.rotation_euler.y = math.radians(-28)
    rigid_bind(needle, rig, "spine")

    return [ring, needle]


def set_expression(body, expression):
    keys = body.data.shape_keys
    if not keys:
        return
    active = None if expression == "neutral" else "cue_expression_" + expression
    for key in keys.key_blocks:
        if key.name == "Basis":
            continue
        key.value = 1.0 if key.name == active else 0.0


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def setup_scene():
    world = bpy.data.worlds.new("cue_studio_world")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background:
        background.inputs["Color"].default_value = (0.015, 0.017, 0.021, 1.0)
        background.inputs["Strength"].default_value = 0.22
    bpy.context.scene.world = world


def render(path, visible, portrait=False):
    minimum, maximum = bounds_for(visible)
    center = (minimum + maximum) * 0.5
    height = maximum.z - minimum.z

    camera_data = bpy.data.cameras.new("cue_camera")
    camera = bpy.data.objects.new("cue_camera", camera_data)
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    if portrait:
        target = Vector((center.x, center.y, maximum.z - height * 0.145))
        camera.data.lens = 76
        camera.location = (
            center.x + height * 0.035,
            minimum.y - height * 0.62,
            target.z + height * 0.015,
        )
    else:
        target = Vector((center.x, center.y, minimum.z + height * 0.51))
        camera.data.lens = 58
        camera.location = (
            center.x + height * 0.055,
            minimum.y - height * 1.68,
            minimum.z + height * 0.53,
        )

    look_at(camera, target)

    lights = []
    for name, relative, energy, size_factor in [
        ("Key", (-0.60, -1.00, 0.42), 520.0, 0.85),
        ("Fill", (0.75, -0.55, 0.18), 260.0, 1.05),
        ("Rim", (0.05, 0.75, 0.44), 420.0, 0.75),
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
        look_at(light, target)
        lights.append(light)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 640
    scene.render.resolution_y = 800
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

    bpy.data.objects.remove(camera, do_unlink=True)
    bpy.data.cameras.remove(camera_data)
    for light in lights:
        data = light.data
        bpy.data.objects.remove(light, do_unlink=True)
        bpy.data.lights.remove(data)


def triangle_count(objects):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    total = 0
    by_object = {}
    for obj in objects:
        if obj.type != "MESH":
            continue
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


def main():
    blend_path = arg("--blend")
    output = arg("--output")
    if not blend_path or not output:
        raise SystemExit("Require --blend and --output")

    clear_scene()
    source = append_collection(os.path.abspath(blend_path), SOURCE_COLLECTION)
    objects = recursive_objects(source)

    meshes = [obj for obj in objects if obj.type == "MESH"]
    body_candidates = [obj for obj in meshes if ".eye." not in obj.name.lower()]
    eyes = [obj for obj in meshes if ".eye." in obj.name.lower()]
    if len(body_candidates) != 1 or len(eyes) != 2:
        raise RuntimeError(
            f"Unexpected Blender Studio source objects: body={len(body_candidates)} eyes={len(eyes)}"
        )

    body = body_candidates[0]
    body.name = "cue_body_male"
    apply_runtime_decimation(body)
    stylize_head_proportions(body)
    smooth(body)

    skin = make_material("cue_mat_skin", (0.54, 0.32, 0.23, 1.0), 0.60)
    hair = make_material("cue_mat_hair", (0.018, 0.014, 0.012, 1.0), 0.80)
    textile = make_material("cue_mat_textile", (0.008, 0.009, 0.012, 1.0), 0.78)
    detail = make_material("cue_mat_detail", (0.91, 0.92, 0.90, 1.0), 0.40)

    create_material_zones(body, skin, textile)

    if ART_GATE_STATIC:
        rig = None
        bind_method = "pending_after_art_gate"
        neutral_action = None
        relaxed_action = None
    else:
        rig, height = create_rig(body)
        bind_method = auto_bind_body(body, rig)

    eye_centers, irises, brows = create_face_details(
        body,
        eyes,
        rig,
        hair,
        detail,
    )
    expression_meta = add_expression_keys(body, eye_centers)

    hair_parts = create_hair(body, rig, hair)
    brand_parts = create_brand_mark(body, rig, detail)

    if rig is not None:
        neutral_action, relaxed_action = create_relaxed_pose(rig, height)
        rig.animation_data_create()
        rig.animation_data.action = relaxed_action
        bpy.context.scene.frame_set(1)
        bpy.context.view_layer.update()

    visible = [body, *eyes, *irises, *brows, *hair_parts, *brand_parts]

    setup_scene()
    output = os.path.abspath(output)
    output_dir = os.path.dirname(output)
    os.makedirs(output_dir, exist_ok=True)

    set_expression(body, "neutral")
    render(os.path.join(output_dir, "studio-stylized-full.png"), visible, False)

    for expression in EXPRESSIONS:
        set_expression(body, expression)
        render(
            os.path.join(output_dir, f"studio-stylized-face-{expression}.png"),
            visible,
            True,
        )

    set_expression(body, "neutral")
    total, by_object = triangle_count(visible)

    body["cue_id_authoring_stage"] = "blender-studio-stylized-v1"
    body["cue_id_production_ready"] = False
    body["cue_id_source_license"] = "CC0"
    body["cue_id_source"] = "Blender Studio Human Base Meshes v1.4.1"

    bpy.ops.wm.save_as_mainfile(filepath=output)

    report = {
        "status": "blender_studio_stylized_v1",
        "productionReady": False,
        "labCandidateReady": False,
        "source": "Blender Studio Human Base Meshes v1.4.1",
        "sourceLicense": "CC0",
        "body": "male",
        "runtimeDecimateRatio": RUNTIME_DECIMATE_RATIO,
        "bindMethod": bind_method,
        "expressionMeta": expression_meta,
        "expressionMorphs": [
            "cue_expression_smile",
            "cue_expression_focused",
            "cue_expression_confident",
            "cue_expression_playful",
        ],
        "defaultLook": {
            "expression": "neutral",
            "hair": "crop",
            "hairColor": "black",
            "top": "tee",
            "topColor": "black",
            "bottom": "straight-trouser",
            "bottomColor": "black",
            "footwearColor": "black",
            "brandFamily": "Cuebooker Basics",
        },
        "artGateStatic": ART_GATE_STATIC,
        "riggingPending": ART_GATE_STATIC,
        "actions": [
            action.name
            for action in (neutral_action, relaxed_action)
            if action is not None
        ],
        "triangles": total,
        "trianglesByObject": by_object,
        "materials": [
            "cue_mat_skin",
            "cue_mat_hair",
            "cue_mat_textile",
            "cue_mat_detail",
        ],
        "notes": [
            "Blender primitive body prototype is superseded by this authored-base route.",
            "Body is reduced before expression morph authoring.",
            "Black tee/trousers/shoes are material zones on the continuous body for the first art gate.",
            "The small chest mark is Cuebooker Basics branding.",
            "Hair uses sculpted cartoon clumps; no strand system is used.",
            "This render intentionally validates art before rigging; no IK or skinning is applied in the static art gate.",
            "Rigging starts only after face, hair, clothing read and proportions pass review.",
            "Female body and wardrobe variants follow after the male art gate passes.",
            "Production remains untouched.",
        ],
    }

    report_path = os.path.splitext(output)[0] + ".studio-report.json"
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print("[CUE ID Studio stylized] report")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
