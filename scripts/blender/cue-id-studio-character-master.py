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


SOURCE_COLLECTIONS = {
    "male": "Body Male - Stylized",
    "female": "Body Female - Stylized",
}
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


def smoothstep(value):
    value = max(0.0, min(1.0, value))
    return value * value * (3.0 - 2.0 * value)


def stylize_head_proportions(body, eyes, body_type):
    minimum, maximum = local_bounds(body)
    height = maximum.z - minimum.z
    neck_z = minimum.z + height * 0.755
    full_head_z = minimum.z + height * 0.815
    center_y = (minimum.y + maximum.y) * 0.5
    head_xy_scale = 1.12 if body_type == "male" else 1.13
    head_z_scale = 1.07 if body_type == "male" else 1.075

    for vertex in body.data.vertices:
        z = vertex.co.z
        if z <= neck_z:
            continue

        weight = smoothstep((z - neck_z) / max(full_head_z - neck_z, 0.0001))
        xy_scale = 1.0 + (head_xy_scale - 1.0) * weight
        z_scale = 1.0 + (head_z_scale - 1.0) * weight

        vertex.co.x *= xy_scale
        vertex.co.y = center_y + (vertex.co.y - center_y) * xy_scale
        vertex.co.z = neck_z + (vertex.co.z - neck_z) * z_scale

    for eye in eyes:
        center = eye.location.copy()
        eye.location.x = center.x * head_xy_scale
        eye.location.y = center_y + (center.y - center_y) * head_xy_scale
        eye.location.z = neck_z + (center.z - neck_z) * head_z_scale
        eye.scale.x *= 1.08
        eye.scale.y *= 1.04
        eye.scale.z *= 1.08

    body.data.update()


def object_center(obj):
    minimum, maximum = world_bounds(obj)
    return (minimum + maximum) * 0.5


def object_size(obj):
    minimum, maximum = world_bounds(obj)
    return maximum - minimum


def extract_shell(body, name, predicate, material, offset, decimate_ratio=0.62):
    source = body.data
    source.update()

    selected = [polygon for polygon in source.polygons if predicate(polygon)]
    if not selected:
        raise RuntimeError("No source faces selected for " + name)

    vertex_map = {}
    vertices = []
    faces = []

    for polygon in selected:
        face = []
        for source_index in polygon.vertices:
            if source_index not in vertex_map:
                source_vertex = source.vertices[source_index]
                vertex_map[source_index] = len(vertices)
                vertices.append(
                    source_vertex.co + source_vertex.normal.normalized() * offset
                )
            face.append(vertex_map[source_index])
        faces.append(tuple(face))

    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.matrix_world = body.matrix_world.copy()
    set_single_material(obj, material)
    smooth(obj)

    if decimate_ratio < 1.0:
        modifier = obj.modifiers.new(name="cue_shell_decimate", type="DECIMATE")
        modifier.decimate_type = "COLLAPSE"
        modifier.ratio = decimate_ratio
        modifier.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.modifier_apply(modifier=modifier.name)
        obj.select_set(False)

    solidify = obj.modifiers.new(name="cue_shell_solidify", type="SOLIDIFY")
    solidify.thickness = offset * 0.34
    solidify.offset = 0.0
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=solidify.name)
    obj.select_set(False)

    return obj


def create_clothing_shells(body, textile):
    minimum, maximum = local_bounds(body)
    height = maximum.z - minimum.z

    def normalized_center(polygon):
        center = sum(
            (body.data.vertices[index].co for index in polygon.vertices),
            Vector(),
        ) / len(polygon.vertices)
        return center, (center.z - minimum.z) / height

    def tee_predicate(polygon):
        center, z = normalized_center(polygon)
        x = abs(center.x) / height
        if not (0.49 <= z <= 0.735):
            return False

        torso = x <= 0.145
        sleeve = 0.145 < x <= 0.255 and z >= 0.625

        if z >= 0.695 and x <= 0.062:
            return False
        return torso or sleeve

    def trouser_predicate(polygon):
        center, z = normalized_center(polygon)
        x = abs(center.x) / height
        return 0.075 <= z <= 0.505 and x <= 0.145

    def footwear_predicate(polygon):
        center, z = normalized_center(polygon)
        x = abs(center.x) / height
        return z <= 0.090 and x <= 0.145

    offset = height * 0.0075

    top = extract_shell(
        body,
        "cue_top_tee",
        tee_predicate,
        textile,
        offset,
        decimate_ratio=0.60,
    )
    bottom = extract_shell(
        body,
        "cue_bottom_wide_trouser",
        trouser_predicate,
        textile,
        offset,
        decimate_ratio=0.56,
    )
    footwear = extract_shell(
        body,
        "cue_footwear_minimal_sneaker",
        footwear_predicate,
        textile,
        offset * 1.15,
        decimate_ratio=0.64,
    )

    return [top, bottom, footwear]


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


def create_curve_hair(name, points, radius, material):
    data = bpy.data.curves.new(name + "_curve", type="CURVE")
    data.dimensions = "3D"
    data.resolution_u = 4
    data.bevel_depth = radius
    data.bevel_resolution = 4

    spline = data.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for item, point in zip(spline.bezier_points, points):
        item.co = point
        item.handle_left_type = "AUTO"
        item.handle_right_type = "AUTO"

    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    set_single_material(obj, material)
    return obj


def create_hair(body, eye_centers, rig, hair_material, body_type):
    left, right = sorted(eye_centers, key=lambda item: item.x)
    midpoint = (left + right) * 0.5
    span = max(abs(right.x - left.x), 0.001)
    minimum, maximum = world_bounds(body)
    height = maximum.z - minimum.z

    hair_parts = []

    # Sculpted back/crown mass so the character reads cleanly from all angles.
    crown = create_uv_ellipsoid(
        "cue_hair_crown",
        (
            midpoint.x,
            midpoint.y + span * 0.28,
            midpoint.z + span * (1.10 if body_type == "male" else 1.12),
        ),
        (
            span * (1.55 if body_type == "male" else 1.72),
            span * (1.10 if body_type == "male" else 1.22),
            span * (0.86 if body_type == "male" else 1.00),
        ),
        hair_material,
        segments=28,
        rings=14,
    )
    rigid_bind(crown, rig, "head")
    hair_parts.append(crown)

    if body_type == "male":
        specs = [
            (-0.95, 1.35, 0.12, -0.34, 0.45),
            (-0.72, 1.52, -0.08, -0.22, 0.54),
            (-0.42, 1.66, -0.18, -0.08, 0.60),
            (-0.10, 1.72, -0.20, 0.02, 0.58),
            (0.20, 1.66, -0.16, 0.16, 0.54),
            (0.48, 1.55, -0.05, 0.28, 0.48),
            (0.76, 1.38, 0.12, 0.40, 0.42),
            (-1.02, 1.16, 0.28, -0.52, 0.30),
            (0.98, 1.14, 0.30, 0.52, 0.30),
            (-0.76, 0.98, 0.36, -0.60, 0.20),
            (0.72, 0.98, 0.36, 0.60, 0.20),
        ]
        radius = height * 0.0105
    else:
        specs = [
            (-1.00, 1.42, 0.12, -0.62, -0.18),
            (-0.78, 1.58, -0.06, -0.72, -0.28),
            (-0.50, 1.70, -0.18, -0.64, -0.36),
            (-0.20, 1.76, -0.18, -0.44, -0.42),
            (0.12, 1.72, -0.14, -0.18, -0.42),
            (0.42, 1.62, -0.04, 0.14, -0.38),
            (0.70, 1.48, 0.10, 0.42, -0.30),
            (0.94, 1.30, 0.20, 0.66, -0.18),
            (-1.05, 1.16, 0.34, -0.88, -0.42),
            (1.02, 1.14, 0.34, 0.88, -0.42),
            (-0.92, 0.88, 0.38, -0.82, -0.64),
            (0.88, 0.88, 0.38, 0.82, -0.64),
            (-0.62, 0.70, 0.30, -0.56, -0.70),
            (0.60, 0.70, 0.30, 0.56, -0.70),
        ]
        radius = height * 0.0100

    for index, (sx, sz, wave, tx, tz) in enumerate(specs):
        root = Vector((
            midpoint.x + span * sx,
            midpoint.y + span * 0.26,
            midpoint.z + span * sz,
        ))
        tip = Vector((
            midpoint.x + span * tx,
            midpoint.y - span * 0.12,
            midpoint.z + span * tz,
        ))
        points = []
        for step in range(6):
            t = step / 5.0
            point = root.lerp(tip, t)
            point.x += span * wave * math.sin(t * math.pi) * 0.28
            point.y -= span * 0.16 * math.sin(t * math.pi)
            point.z += span * 0.13 * math.sin(t * math.pi)
            points.append(point)

        strand = create_curve_hair(
            f"cue_hair_wave_{index:02d}",
            points,
            radius,
            hair_material,
        )
        rigid_bind(strand, rig, "head")
        hair_parts.append(strand)

    return hair_parts

def create_face_details(body, eyes, rig, hair_material, detail_material):
    minimum, maximum = world_bounds(body)
    height = maximum.z - minimum.z

    eye_centers = []
    irises = []
    pupils = []
    highlights = []
    brows = []

    ordered = sorted(eyes, key=lambda item: object_center(item).x)

    for index, eye in enumerate(ordered):
        side = "l" if index == 0 else "r"
        eye.name = f"cue_eye_{side}"
        set_single_material(eye, detail_material)
        smooth(eye)

        center = object_center(eye)
        bounds_min, bounds_max = world_bounds(eye)
        size = bounds_max - bounds_min
        eye_centers.append(center)

        eye_span_reference = max(size.x, size.z)
        iris_radius = max(eye_span_reference * 0.115, height * 0.0105)
        front_y = bounds_min.y - height * 0.0025

        gaze_x = center.x + (-1.0 if index == 0 else 1.0) * height * 0.0032

        iris = create_uv_ellipsoid(
            f"cue_iris_{side}",
            (gaze_x, front_y, center.z),
            (iris_radius, height * 0.0032, iris_radius),
            hair_material,
            segments=14,
            rings=7,
        )
        rigid_bind(iris, rig, "head")
        irises.append(iris)

        pupil = create_uv_ellipsoid(
            f"cue_pupil_{side}",
            (gaze_x, front_y - height * 0.0020, center.z),
            (
                iris_radius * 0.44,
                height * 0.0022,
                iris_radius * 0.44,
            ),
            hair_material,
            segments=12,
            rings=6,
        )
        rigid_bind(pupil, rig, "head")
        pupils.append(pupil)

        highlight = create_uv_ellipsoid(
            f"cue_eye_highlight_{side}",
            (
                gaze_x - iris_radius * 0.28,
                front_y - height * 0.0042,
                center.z + iris_radius * 0.30,
            ),
            (
                iris_radius * 0.16,
                height * 0.0018,
                iris_radius * 0.16,
            ),
            detail_material,
            segments=10,
            rings=5,
        )
        rigid_bind(highlight, rig, "head")
        highlights.append(highlight)

        brow = create_uv_ellipsoid(
            f"cue_brow_{side}",
            (
                center.x,
                front_y - height * 0.008,
                center.z + height * 0.043,
            ),
            (
                height * 0.037,
                height * 0.006,
                height * 0.009,
            ),
            hair_material,
            segments=12,
            rings=6,
        )
        brow.rotation_euler.y = math.radians(-9 if index == 0 else 9)
        rigid_bind(brow, rig, "head")
        brows.append(brow)

    return eye_centers, irises, pupils, highlights, brows

def create_facial_hair(body, eye_centers, rig, hair_material, body_type):
    if body_type != "male":
        return []

    left, right = sorted(eye_centers, key=lambda item: item.x)
    midpoint = (left + right) * 0.5
    span = max(abs(right.x - left.x), 0.001)
    minimum, maximum = world_bounds(body)
    height = maximum.z - minimum.z

    parts = []
    # Moustache
    for side, sign in (("l", -1.0), ("r", 1.0)):
        points = [
            Vector((midpoint.x + sign * span * 0.04, midpoint.y - span * 0.40, midpoint.z - span * 0.54)),
            Vector((midpoint.x + sign * span * 0.24, midpoint.y - span * 0.43, midpoint.z - span * 0.58)),
            Vector((midpoint.x + sign * span * 0.43, midpoint.y - span * 0.38, midpoint.z - span * 0.62)),
        ]
        parts.append(create_curve_hair(
            "cue_moustache_" + side,
            points,
            height * 0.0042,
            hair_material,
        ))

    # Jaw beard, short and groomed rather than a large block.
    jaw_specs = [
        (-0.54, -0.62, -0.72),
        (-0.34, -0.70, -0.84),
        (-0.12, -0.74, -0.91),
        (0.12, -0.74, -0.91),
        (0.34, -0.70, -0.84),
        (0.54, -0.62, -0.72),
    ]
    for index, (x, z0, z1) in enumerate(jaw_specs):
        root = Vector((
            midpoint.x + span * x,
            midpoint.y - span * 0.27,
            midpoint.z + span * z0,
        ))
        tip = Vector((
            midpoint.x + span * x * 0.92,
            midpoint.y - span * 0.24,
            midpoint.z + span * z1,
        ))
        parts.append(create_curve_hair(
            f"cue_beard_{index:02d}",
            [root, root.lerp(tip, 0.48) + Vector((0.0, -span * 0.04, span * 0.03)), tip],
            height * 0.0038,
            hair_material,
        ))

    for part in parts:
        rigid_bind(part, rig, "head")

    return parts


def create_brand_mark(body, rig, detail_material):
    minimum, maximum = world_bounds(body)
    height = maximum.z - minimum.z
    front_y = minimum.y - height * 0.014
    center = Vector((
        -height * 0.078,
        front_y,
        minimum.z + height * 0.657,
    ))

    lime = make_material("cue_mat_logo_lime", (0.58, 0.92, 0.04, 1.0), 0.52)
    red = make_material("cue_mat_logo_red", (0.86, 0.03, 0.05, 1.0), 0.45)
    black = make_material("cue_mat_logo_vinyl", (0.008, 0.008, 0.010, 1.0), 0.34)

    parts = []

    vinyl = create_uv_ellipsoid(
        "cue_logo_vinyl",
        center,
        (height * 0.0105, height * 0.0022, height * 0.0105),
        black,
        segments=18,
        rings=8,
    )
    parts.append(vinyl)

    # Lime radial bars form the Cuebooker C.
    for index in range(24):
        angle = math.radians(42 + index * (276 / 23.0))
        x = center.x + math.cos(angle) * height * 0.015
        z = center.z + math.sin(angle) * height * 0.015
        bar = create_cube(
            f"cue_logo_bar_{index:02d}",
            (x, front_y - height * 0.0012, z),
            (height * 0.0012, height * 0.0015, height * 0.0040),
            lime,
            bevel=height * 0.0005,
        )
        bar.rotation_euler.y = -angle
        parts.append(bar)

    needle = create_cube(
        "cue_logo_needle",
        (
            center.x + height * 0.010,
            front_y - height * 0.002,
            center.z,
        ),
        (height * 0.014, height * 0.0017, height * 0.0012),
        red,
        bevel=height * 0.0006,
    )
    parts.append(needle)

    for part in parts:
        rigid_bind(part, rig, "spine")

    return parts

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


def render(path, visible, portrait=False, angle_deg=0.0):
    minimum, maximum = bounds_for(visible)
    center = (minimum + maximum) * 0.5
    height = maximum.z - minimum.z

    camera_data = bpy.data.cameras.new("cue_camera")
    camera = bpy.data.objects.new("cue_camera", camera_data)
    bpy.context.collection.objects.link(camera)
    bpy.context.scene.camera = camera

    angle = math.radians(angle_deg)

    if portrait:
        target = Vector((center.x, center.y, maximum.z - height * 0.145))
        camera.data.lens = 76
        distance = height * 0.62
        camera.location = (
            center.x + math.sin(angle) * distance,
            center.y - math.cos(angle) * distance,
            target.z + height * 0.015,
        )
    else:
        target = Vector((center.x, center.y, minimum.z + height * 0.51))
        camera.data.lens = 58
        distance = height * 1.68
        camera.location = (
            center.x + math.sin(angle) * distance,
            center.y - math.cos(angle) * distance,
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


def export_glb(path, objects):
    bpy.ops.object.select_all(action="DESELECT")
    selectable = []

    for obj in objects:
        if obj.type not in {"MESH", "CURVE"}:
            continue

        if obj.type == "CURVE":
            duplicate = obj.copy()
            duplicate.data = obj.data.copy()
            bpy.context.collection.objects.link(duplicate)
            bpy.context.view_layer.objects.active = duplicate
            duplicate.select_set(True)
            bpy.ops.object.convert(target="MESH")
            duplicate.name = obj.name + "_export"
            obj.hide_render = True
            selectable.append(duplicate)
        else:
            obj.select_set(True)
            selectable.append(obj)

    bpy.context.view_layer.objects.active = selectable[0]
    os.makedirs(os.path.dirname(path), exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=False,
        export_morph=True,
        export_morph_normal=True,
        export_morph_tangent=False,
        export_yup=True,
        export_materials="EXPORT",
    )


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
    body_type = arg("--body") or "male"
    if body_type not in SOURCE_COLLECTIONS:
        raise SystemExit("--body must be male or female")
    if not blend_path or not output:
        raise SystemExit("Require --blend and --output")

    clear_scene()
    source = append_collection(
        os.path.abspath(blend_path),
        SOURCE_COLLECTIONS[body_type],
    )
    objects = recursive_objects(source)

    meshes = [obj for obj in objects if obj.type == "MESH"]
    body_candidates = [obj for obj in meshes if ".eye." not in obj.name.lower()]
    eyes = [obj for obj in meshes if ".eye." in obj.name.lower()]
    if len(body_candidates) != 1 or len(eyes) != 2:
        raise RuntimeError(
            f"Unexpected Blender Studio source objects: body={len(body_candidates)} eyes={len(eyes)}"
        )

    body = body_candidates[0]
    body.name = "cue_body_" + body_type
    stylize_head_proportions(body, eyes, body_type)
    smooth(body)

    skin_color = (0.52, 0.305, 0.205, 1.0) if body_type == "male" else (0.54, 0.325, 0.225, 1.0)
    skin = make_material("cue_mat_skin", skin_color, 0.60)
    hair = make_material("cue_mat_hair", (0.018, 0.014, 0.012, 1.0), 0.80)
    textile = make_material("cue_mat_textile", (0.008, 0.009, 0.012, 1.0), 0.78)
    detail = make_material("cue_mat_detail", (0.91, 0.92, 0.90, 1.0), 0.40)

    set_single_material(body, skin)
    clothing_parts = create_clothing_shells(body, textile)

    if ART_GATE_STATIC:
        rig = None
        bind_method = "pending_after_art_gate"
        neutral_action = None
        relaxed_action = None
    else:
        rig, height = create_rig(body)
        bind_method = auto_bind_body(body, rig)

    eye_centers, irises, pupils, highlights, brows = create_face_details(
        body,
        eyes,
        rig,
        hair,
        detail,
    )
    expression_meta = add_expression_keys(body, eye_centers)

    hair_parts = create_hair(body, eye_centers, rig, hair, body_type)
    facial_hair_parts = create_facial_hair(
        body,
        eye_centers,
        rig,
        hair,
        body_type,
    )
    brand_parts = create_brand_mark(body, rig, detail)

    if rig is not None:
        neutral_action, relaxed_action = create_relaxed_pose(rig, height)
        rig.animation_data_create()
        rig.animation_data.action = relaxed_action
        bpy.context.scene.frame_set(1)
        bpy.context.view_layer.update()

    visible = [
        body,
        *clothing_parts,
        *eyes,
        *irises,
        *pupils,
        *highlights,
        *brows,
        *hair_parts,
        *facial_hair_parts,
        *brand_parts,
    ]

    setup_scene()
    output = os.path.abspath(output)
    output_dir = os.path.dirname(output)
    os.makedirs(output_dir, exist_ok=True)

    set_expression(body, "neutral")

    turnaround = [
        ("front", 0.0, False),
        ("three-quarter", 35.0, False),
        ("side", 90.0, False),
        ("back", 180.0, False),
        ("close", 0.0, True),
    ]

    for label, angle, portrait in turnaround:
        render(
            os.path.join(output_dir, f"{body_type}-{label}.png"),
            visible,
            portrait=portrait,
            angle_deg=angle,
        )

    for expression in EXPRESSIONS:
        set_expression(body, expression)
        render(
            os.path.join(output_dir, f"{body_type}-expression-{expression}.png"),
            visible,
            portrait=True,
            angle_deg=0.0,
        )

    set_expression(body, "neutral")
    total, by_object = triangle_count(visible)

    body["cue_id_authoring_stage"] = "blender-studio-stylized-v1"
    body["cue_id_production_ready"] = False
    body["cue_id_source_license"] = "CC0"
    body["cue_id_source"] = "Blender Studio Human Base Meshes v1.4.1"

    bpy.ops.wm.save_as_mainfile(filepath=output)

    glb_path = os.path.splitext(output)[0] + ".glb"
    export_glb(glb_path, visible)

    report = {
        "status": "cue_id_character_master",
        "productionReady": False,
        "labCandidateReady": False,
        "source": "Blender Studio Human Base Meshes v1.4.1",
        "sourceLicense": "CC0",
        "body": body_type,
        "runtimeDecimateRatio": None,
        "masterQuality": True,
        "glb": os.path.basename(glb_path),
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
            "This master intentionally keeps the complete Blender Studio authored body; no runtime decimation is applied.",
            "Tee, wide trousers and minimal sneakers are separate body-derived shells for the art gate.",
            "The small chest mark is Cuebooker Basics branding.",
            "Hair uses sculpted cartoon clumps; no strand system is used.",
            "This render intentionally validates art before rigging; no IK or skinning is applied in the static art gate.",
            "Rigging starts only after face, hair, clothing read and proportions pass review.",
            "Male and female masters share the same art pipeline and visual family.",
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
