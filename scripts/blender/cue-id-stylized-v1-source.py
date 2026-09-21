# CUE ID Stylized Avatar V1 visual prototype.
#
# Purpose: prove the intentional stylized art direction without MakeHuman.
# Geometry is built from low-poly authored primitives on one shared skeleton.
# This is lab evidence only, not production.

import bpy
import math
import os
import sys

from mathutils import Vector


EXPRESSIONS = (
    "neutral",
    "smile",
    "focused",
    "confident",
    "playful",
)


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


def material(name, color, roughness=0.72, metallic=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name=name)
    mat.use_nodes = True
    mat.diffuse_color = color
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
    return mat


def apply_transform(obj):
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    obj.select_set(False)


def set_material(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def shade(obj, smooth):
    for polygon in obj.data.polygons:
        polygon.use_smooth = smooth


def bevel(obj, width, segments=1):
    modifier = obj.modifiers.new(name="cue_bevel", type="BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)


def create_cube(name, location, scale, mat, bevel_width=0.0, smooth=False):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    apply_transform(obj)
    if bevel_width > 0:
        bevel(obj, bevel_width, segments=1)
    set_material(obj, mat)
    shade(obj, smooth)
    return obj


def create_ico(name, location, scale, mat, subdivisions=2, smooth=True):
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=subdivisions,
        radius=1.0,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    apply_transform(obj)
    set_material(obj, mat)
    shade(obj, smooth)
    return obj


def create_cylinder_between(name, a, b, radius, mat, vertices=10, smooth=False):
    start = Vector(a)
    end = Vector(b)
    midpoint = (start + end) * 0.5
    direction = end - start
    length = direction.length

    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=length,
        location=midpoint,
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    apply_transform(obj)
    set_material(obj, mat)
    shade(obj, smooth)
    return obj


def create_armature():
    data = bpy.data.armatures.new("cue_rig_data")
    rig = bpy.data.objects.new("cue_rig", data)
    bpy.context.collection.objects.link(rig)

    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    bones = {}

    def bone(name, head, tail, parent=None):
        edit = data.edit_bones.new(name)
        edit.head = head
        edit.tail = tail
        if parent:
            edit.parent = bones[parent]
            edit.use_connect = False
        bones[name] = edit

    bone("root", (0, 0, 0.03), (0, 0, 0.15))
    bone("pelvis", (0, 0, 0.98), (0, 0, 1.12), "root")
    bone("spine", (0, 0, 1.12), (0, 0, 1.48), "pelvis")
    bone("neck", (0, 0, 1.48), (0, 0, 1.67), "spine")
    bone("head", (0, 0, 1.67), (0, 0, 1.98), "neck")

    for side, sign in (("l", 1.0), ("r", -1.0)):
        shoulder = (sign * 0.30, 0.0, 1.47)
        elbow = (sign * 0.35, 0.0, 1.15)
        wrist = (sign * 0.32, -0.005, 0.87)
        hand_end = (sign * 0.31, -0.02, 0.72)

        bone(f"upperarm_{side}", shoulder, elbow, "spine")
        bone(f"lowerarm_{side}", elbow, wrist, f"upperarm_{side}")
        bone(f"hand_{side}", wrist, hand_end, f"lowerarm_{side}")

        hip = (sign * 0.12, 0.0, 1.00)
        knee = (sign * 0.13, 0.0, 0.57)
        ankle = (sign * 0.13, -0.005, 0.16)
        toe = (sign * 0.13, -0.20, 0.08)

        bone(f"thigh_{side}", hip, knee, "pelvis")
        bone(f"shin_{side}", knee, ankle, f"thigh_{side}")
        bone(f"foot_{side}", ankle, toe, f"shin_{side}")

    bpy.ops.object.mode_set(mode="OBJECT")
    rig.select_set(False)
    return rig


def rigid_bind(obj, rig, bone_name):
    group = obj.vertex_groups.new(name=bone_name)
    group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")

    modifier = obj.modifiers.new(name="cue_armature", type="ARMATURE")
    modifier.object = rig

    obj.parent = rig
    obj.matrix_parent_inverse = rig.matrix_world.inverted()


def create_ribbon(name, vertices, faces, mat):
    mesh = bpy.data.meshes.new(name + "_mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    set_material(obj, mat)
    return obj


def create_mouth(rig, dark_mat):
    y = -0.196
    z = 1.825
    xs = (-0.060, 0.0, 0.060)
    vertices = []
    for x in xs:
        vertices.extend([
            (x, y, z + 0.005),
            (x, y, z - 0.005),
        ])
    faces = [
        (0, 2, 3, 1),
        (2, 4, 5, 3),
    ]
    mouth = create_ribbon("cue_mouth", vertices, faces, dark_mat)
    rigid_bind(mouth, rig, "head")

    basis = mouth.shape_key_add(name="Basis")

    def add_expression(name, top_offsets, bottom_offsets):
        key = mouth.shape_key_add(name="cue_expression_" + name)
        for column in range(3):
            for row in range(2):
                index = column * 2 + row
                dz = top_offsets[column] if row == 0 else bottom_offsets[column]
                key.data[index].co.z += dz

    add_expression("smile", (0.018, -0.003, 0.018), (0.018, -0.006, 0.018))
    add_expression("focused", (-0.008, -0.002, -0.008), (-0.010, -0.004, -0.010))
    add_expression("confident", (0.015, 0.002, -0.004), (0.013, -0.002, -0.006))
    add_expression("playful", (-0.002, 0.012, 0.022), (-0.004, 0.006, 0.018))
    return mouth


def create_brows(rig, dark_mat):
    y = -0.188
    z = 1.985
    vertices = [
        (-0.125, y, z - 0.004), (-0.045, y, z + 0.005),
        (-0.045, y, z + 0.018), (-0.125, y, z + 0.010),
        (0.045, y, z + 0.005), (0.125, y, z - 0.004),
        (0.125, y, z + 0.010), (0.045, y, z + 0.018),
    ]
    faces = [(0, 1, 2, 3), (4, 5, 6, 7)]
    brows = create_ribbon("cue_brows", vertices, faces, dark_mat)
    rigid_bind(brows, rig, "head")
    brows.shape_key_add(name="Basis")

    def key(name):
        return brows.shape_key_add(name="cue_expression_" + name)

    smile = key("smile")
    for i in range(8):
        smile.data[i].co.z += 0.006

    focused = key("focused")
    for i in (1, 2, 4, 7):
        focused.data[i].co.z -= 0.018
    for i in (0, 3, 5, 6):
        focused.data[i].co.z += 0.005

    confident = key("confident")
    for i in range(4):
        confident.data[i].co.z += 0.018

    playful = key("playful")
    for i in range(4, 8):
        playful.data[i].co.z += 0.026
    for i in range(0, 4):
        playful.data[i].co.z -= 0.004

    return brows


def join_objects(name, objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    result = objects[0]
    result.name = name
    result.select_set(False)
    return result


def create_character(rig):
    skin = material("cue_mat_skin", (0.50, 0.29, 0.20, 1.0), 0.62)
    hair = material("cue_mat_hair", (0.020, 0.016, 0.014, 1.0), 0.80)
    textile = material("cue_mat_textile", (0.010, 0.011, 0.014, 1.0), 0.82)
    eye_white = material("cue_mat_eye_white", (0.90, 0.91, 0.90, 1.0), 0.40)
    eye_iris = material("cue_mat_eye_iris", (0.035, 0.025, 0.018, 1.0), 0.34)

    visible = []

    neck = create_cylinder_between(
        "cue_neck", (0, 0, 1.50), (0, 0, 1.72), 0.095, skin, vertices=10, smooth=True
    )
    rigid_bind(neck, rig, "neck")
    visible.append(neck)

    head = create_ico(
        "cue_head",
        (0, -0.006, 1.885),
        (0.205, 0.175, 0.245),
        skin,
        subdivisions=3,
        smooth=True,
    )
    rigid_bind(head, rig, "head")
    visible.append(head)

    for side, sign in (("l", 1.0), ("r", -1.0)):
        ear = create_ico(
            f"cue_ear_{side}",
            (sign * 0.205, -0.005, 1.89),
            (0.035, 0.025, 0.055),
            skin,
            subdivisions=1,
            smooth=True,
        )
        rigid_bind(ear, rig, "head")
        visible.append(ear)

    nose = create_cube(
        "cue_nose",
        (0, -0.174, 1.895),
        (0.030, 0.028, 0.045),
        skin,
        bevel_width=0.012,
        smooth=False,
    )
    nose.rotation_euler.x = math.radians(8)
    apply_transform(nose)
    rigid_bind(nose, rig, "head")
    visible.append(nose)

    for side, sign in (("l", 1.0), ("r", -1.0)):
        sclera = create_ico(
            f"cue_eye_white_{side}",
            (sign * 0.075, -0.162, 1.935),
            (0.052, 0.018, 0.034),
            eye_white,
            subdivisions=2,
            smooth=True,
        )
        iris = create_ico(
            f"cue_eye_iris_{side}",
            (sign * 0.075, -0.178, 1.935),
            (0.021, 0.010, 0.021),
            eye_iris,
            subdivisions=2,
            smooth=True,
        )
        rigid_bind(sclera, rig, "head")
        rigid_bind(iris, rig, "head")
        visible.extend([sclera, iris])

    mouth = create_mouth(rig, hair)
    brows = create_brows(rig, hair)
    visible.extend([mouth, brows])

    hair_clumps = []
    clump_specs = [
        ((-0.12, -0.015, 2.075), (0.095, 0.095, 0.075)),
        ((-0.045, -0.040, 2.105), (0.095, 0.10, 0.078)),
        ((0.045, -0.045, 2.105), (0.095, 0.10, 0.078)),
        ((0.12, -0.020, 2.070), (0.095, 0.095, 0.075)),
        ((-0.145, 0.015, 2.020), (0.070, 0.080, 0.085)),
        ((0.145, 0.015, 2.020), (0.070, 0.080, 0.085)),
        ((-0.075, 0.045, 2.115), (0.090, 0.090, 0.070)),
        ((0.075, 0.045, 2.115), (0.090, 0.090, 0.070)),
    ]
    for index, (location, scale) in enumerate(clump_specs):
        clump = create_ico(
            f"cue_hair_clump_{index}",
            location,
            scale,
            hair,
            subdivisions=1,
            smooth=False,
        )
        hair_clumps.append(clump)

    hair_obj = join_objects("cue_hair_crop", hair_clumps)
    rigid_bind(hair_obj, rig, "head")
    visible.append(hair_obj)

    torso = create_cube(
        "cue_top_tee",
        (0, 0.0, 1.31),
        (0.31, 0.17, 0.31),
        textile,
        bevel_width=0.055,
        smooth=False,
    )
    rigid_bind(torso, rig, "spine")
    visible.append(torso)

    pelvis = create_cube(
        "cue_bottom_waist",
        (0, 0.0, 0.98),
        (0.24, 0.155, 0.13),
        textile,
        bevel_width=0.035,
        smooth=False,
    )
    rigid_bind(pelvis, rig, "pelvis")
    visible.append(pelvis)

    for side, sign in (("l", 1.0), ("r", -1.0)):
        shoulder = Vector((sign * 0.30, 0.0, 1.47))
        elbow = Vector((sign * 0.35, 0.0, 1.15))
        wrist = Vector((sign * 0.32, -0.005, 0.87))
        upper_mid = shoulder.lerp(elbow, 0.42)

        sleeve = create_cylinder_between(
            f"cue_top_tee_sleeve_{side}",
            shoulder,
            upper_mid,
            0.115,
            textile,
            vertices=8,
            smooth=False,
        )
        rigid_bind(sleeve, rig, f"upperarm_{side}")
        visible.append(sleeve)

        upper_skin = create_cylinder_between(
            f"cue_upperarm_skin_{side}",
            upper_mid,
            elbow,
            0.078,
            skin,
            vertices=10,
            smooth=True,
        )
        rigid_bind(upper_skin, rig, f"upperarm_{side}")
        visible.append(upper_skin)

        forearm = create_cylinder_between(
            f"cue_forearm_skin_{side}",
            elbow,
            wrist,
            0.070,
            skin,
            vertices=10,
            smooth=True,
        )
        rigid_bind(forearm, rig, f"lowerarm_{side}")
        visible.append(forearm)

        hand = create_ico(
            f"cue_hand_{side}",
            (sign * 0.315, -0.015, 0.79),
            (0.062, 0.050, 0.105),
            skin,
            subdivisions=2,
            smooth=True,
        )
        rigid_bind(hand, rig, f"hand_{side}")
        visible.append(hand)

        hip = Vector((sign * 0.12, 0.0, 1.00))
        knee = Vector((sign * 0.13, 0.0, 0.57))
        ankle = Vector((sign * 0.13, -0.005, 0.16))

        upper_pant = create_cylinder_between(
            f"cue_bottom_wide_upper_{side}",
            hip,
            knee,
            0.125,
            textile,
            vertices=8,
            smooth=False,
        )
        rigid_bind(upper_pant, rig, f"thigh_{side}")
        visible.append(upper_pant)

        lower_pant = create_cylinder_between(
            f"cue_bottom_wide_lower_{side}",
            knee,
            Vector((ankle.x, ankle.y, ankle.z + 0.05)),
            0.115,
            textile,
            vertices=8,
            smooth=False,
        )
        rigid_bind(lower_pant, rig, f"shin_{side}")
        visible.append(lower_pant)

        shoe = create_cube(
            f"cue_footwear_minimal_sneaker_{side}",
            (sign * 0.13, -0.105, 0.095),
            (0.105, 0.165, 0.070),
            textile,
            bevel_width=0.035,
            smooth=False,
        )
        rigid_bind(shoe, rig, f"foot_{side}")
        visible.append(shoe)

    return {
        "visible": visible,
        "mouth": mouth,
        "brows": brows,
        "materials": {
            "skin": skin,
            "hair": hair,
            "textile": textile,
            "eyeWhite": eye_white,
            "eyeIris": eye_iris,
        },
    }


def set_expression(character, expression):
    morph_name = None if expression == "neutral" else "cue_expression_" + expression

    for obj in (character["mouth"], character["brows"]):
        keys = obj.data.shape_keys
        if not keys:
            continue
        for block in keys.key_blocks:
            if block.name == "Basis":
                continue
            block.value = 1.0 if block.name == morph_name else 0.0


def create_pose_actions(rig):
    rig.animation_data_create()

    for name in ("cue_pose_relaxed", "cue_pose_neutral"):
        action = bpy.data.actions.new(name=name)
        rig.animation_data.action = action

        for bone in rig.pose.bones:
            bone.rotation_mode = "XYZ"
            bone.rotation_euler = (0.0, 0.0, 0.0)
            bone.location = (0.0, 0.0, 0.0)

        if name == "cue_pose_neutral":
            for side, direction in (("l", 1.0), ("r", -1.0)):
                upper = rig.pose.bones.get(f"upperarm_{side}")
                if upper:
                    upper.rotation_euler.y = math.radians(2.0 * direction)

        for bone in rig.pose.bones:
            bone.keyframe_insert(data_path="rotation_euler", frame=1, group=bone.name)
            bone.keyframe_insert(data_path="location", frame=1, group=bone.name)

    rig.animation_data.action = bpy.data.actions.get("cue_pose_relaxed")


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def setup_review_scene():
    world = bpy.data.worlds.new("cue_stylized_world")
    bpy.context.scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background:
        background.inputs["Color"].default_value = (0.018, 0.019, 0.023, 1.0)
        background.inputs["Strength"].default_value = 0.24

    light_specs = [
        ("Key", (-2.6, -3.5, 4.0), 750.0, 3.0),
        ("Fill", (2.7, -2.0, 2.6), 420.0, 3.6),
        ("Rim", (0.0, 2.3, 3.5), 620.0, 2.8),
    ]
    for name, location, energy, size in light_specs:
        data = bpy.data.lights.new(name=name, type="AREA")
        data.energy = energy
        data.shape = "DISK"
        data.size = size
        obj = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(obj)
        obj.location = location
        look_at(obj, (0.0, 0.0, 1.15))


def render(path, portrait=False):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 768
    scene.render.resolution_y = 1024
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    camera_data = bpy.data.cameras.new("Camera")
    camera = bpy.data.objects.new("Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    scene.camera = camera

    if portrait:
        camera.location = (0.0, -3.0, 1.90)
        target = (0.0, 0.0, 1.90)
        camera.data.lens = 72
    else:
        camera.location = (0.0, -5.4, 1.12)
        target = (0.0, 0.0, 1.10)
        camera.data.lens = 58

    look_at(camera, target)
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)

    bpy.data.objects.remove(camera, do_unlink=True)
    bpy.data.cameras.remove(camera_data)


def triangle_report():
    result = {}
    total = 0
    depsgraph = bpy.context.evaluated_depsgraph_get()

    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        evaluated = obj.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        try:
            mesh.calc_loop_triangles()
            count = len(mesh.loop_triangles)
            result[obj.name] = count
            total += count
        finally:
            evaluated.to_mesh_clear()

    return total, result


def main():
    output = arg("--output")
    if not output:
        raise SystemExit("Require --output /absolute/path/source-stylized.blend")

    clear_scene()
    rig = create_armature()
    character = create_character(rig)
    create_pose_actions(rig)
    setup_review_scene()

    output = os.path.abspath(output)
    output_dir = os.path.dirname(output)
    os.makedirs(output_dir, exist_ok=True)

    set_expression(character, "neutral")
    render(os.path.join(output_dir, "stylized-full.png"), portrait=False)

    for expression in EXPRESSIONS:
        set_expression(character, expression)
        render(
            os.path.join(output_dir, f"stylized-face-{expression}.png"),
            portrait=True,
        )

    set_expression(character, "neutral")
    total_triangles, by_object = triangle_report()

    bpy.ops.wm.save_as_mainfile(filepath=output)

    report_path = os.path.splitext(output)[0] + ".stylized-report.json"
    import json
    report = {
        "status": "stylized_visual_prototype",
        "productionReady": False,
        "labCandidateReady": False,
        "body": "male",
        "expressionMorphs": [
            "cue_expression_smile",
            "cue_expression_focused",
            "cue_expression_confident",
            "cue_expression_playful",
        ],
        "defaultExpression": "neutral",
        "defaultOutfit": {
            "top": "tee",
            "topColor": "black",
            "bottom": "wide-trouser",
            "bottomColor": "black",
            "footwear": "minimal-sneaker",
            "footwearColor": "black",
        },
        "triangles": total_triangles,
        "trianglesByObject": by_object,
        "materials": [
            "cue_mat_skin",
            "cue_mat_hair",
            "cue_mat_textile",
            "cue_mat_eye_white",
            "cue_mat_eye_iris",
        ],
        "notes": [
            "This prototype is intentionally stylized and does not use MakeHuman.",
            "Rigid segmented limbs avoid the deformation failures of the realistic experiments.",
            "Eye materials are separate in the visual prototype and will be atlased/merged before runtime admission.",
            "Female body and modular variants follow only after the male art direction is accepted.",
            "Production remains untouched.",
        ],
    }
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print("[CUE ID stylized] report")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
