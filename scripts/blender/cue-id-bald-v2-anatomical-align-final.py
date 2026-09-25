# CUE ID CUE ID V2 final anatomical rig alignment pass.
#
# Blender 5.2.2:
# blender --background --python scripts/blender/cue-id-bald-v2-anatomical-align.py -- \
#   --input /abs/cueid-male-body-bald-master-v2-rigged.blend \
#   --body male \
#   --output /abs/cueid-male-body-bald-master-v2-rigged-aligned.blend
#
# This pass refines joint placement for the new bald V2 proportions BEFORE
# doing any localized weight polish. It keeps the shared cue_rig contract and
# existing QA actions/weights, and only updates the armature rest pose.

import bpy
import json
import os
import sys
from mathutils import Vector


def arg(flag):
    if "--" not in sys.argv:
        return None
    values = sys.argv[sys.argv.index("--") + 1:]
    try:
        index = values.index(flag)
    except ValueError:
        return None
    return values[index + 1] if index + 1 < len(values) else None


def mesh_objects():
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def find_rig():
    rig = bpy.data.objects.get("cue_rig")
    if rig and rig.type == "ARMATURE":
        return rig
    rigs = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
    if len(rigs) != 1:
        raise RuntimeError(f"Expected one cue rig, found {len(rigs)}")
    return rigs[0]


def combined_bounds(objects):
    coords = []
    for obj in objects:
        coords.extend(obj.matrix_world @ Vector(corner) for corner in obj.bound_box)
    if not coords:
        raise RuntimeError("No mesh bounds available")
    minimum = Vector((
        min(p.x for p in coords),
        min(p.y for p in coords),
        min(p.z for p in coords),
    ))
    maximum = Vector((
        max(p.x for p in coords),
        max(p.y for p in coords),
        max(p.z for p in coords),
    ))
    return minimum, maximum


def point(minimum, maximum, x, y, z):
    size = maximum - minimum
    center = (minimum + maximum) * 0.5
    return Vector((
        center.x + x * size.x,
        center.y + y * size.y,
        minimum.z + z * size.z,
    ))


# V2-specific anatomical proportions.
# x = half-width normalized offset from center
# y = depth offset
# z = height normalized from feet -> scalp
PROFILE = {
    "male": {
        "hips_z": 0.485,
        "spine_z": 0.575,
        "chest_z": 0.665,
        "upper_chest_z": 0.748,
        "neck_z": 0.815,
        "head_z": 0.955,
        "shoulder_x": 0.220,
        "shoulder_z": 0.752,
        "elbow_x": 0.335,
        "elbow_z": 0.600,
        "wrist_x": 0.372,
        "wrist_z": 0.485,
        "hand_x": 0.372,
        "hand_z": 0.430,
        "hip_x": 0.105,
        "knee_x": 0.095,
        "knee_z": 0.285,
        "ankle_x": 0.095,
        "ankle_z": 0.070,
        "foot_y": -0.075,
        "foot_z": 0.035,
        "toe_y": -0.180,
        "toe_z": 0.020,
    },
    "female": {
        "hips_z": 0.495,
        "spine_z": 0.585,
        "chest_z": 0.675,
        "upper_chest_z": 0.755,
        "neck_z": 0.820,
        "head_z": 0.955,
        "shoulder_x": 0.210,
        "shoulder_z": 0.755,
        "elbow_x": 0.325,
        "elbow_z": 0.605,
        "wrist_x": 0.362,
        "wrist_z": 0.495,
        "hand_x": 0.365,
        "hand_z": 0.440,
        "hip_x": 0.115,
        "knee_x": 0.105,
        "knee_z": 0.290,
        "ankle_x": 0.100,
        "ankle_z": 0.075,
        "foot_y": -0.072,
        "foot_z": 0.037,
        "toe_y": -0.175,
        "toe_z": 0.020,
    },
}


def set_bone(edit_bones, name, head=None, tail=None):
    bone = edit_bones.get(name)
    if not bone:
        raise RuntimeError(f"Missing bone: {name}")
    if head is not None:
        bone.head = head
    if tail is not None:
        bone.tail = tail
    if (bone.tail - bone.head).length < 0.005:
        bone.tail.z += 0.01
    return bone


def align_rig(rig, minimum, maximum, body):
    p = PROFILE[body]
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bones = rig.data.edit_bones

    # Central chain
    root = set_bone(
        bones, "root",
        head=point(minimum, maximum, 0.0, 0.0, 0.01),
        tail=point(minimum, maximum, 0.0, 0.0, 0.08),
    )
    hips = set_bone(
        bones, "hips",
        head=point(minimum, maximum, 0.0, 0.0, p["hips_z"]),
        tail=point(minimum, maximum, 0.0, 0.0, p["spine_z"]),
    )
    spine = set_bone(
        bones, "spine",
        head=hips.tail,
        tail=point(minimum, maximum, 0.0, 0.0, p["chest_z"]),
    )
    chest = set_bone(
        bones, "chest",
        head=spine.tail,
        tail=point(minimum, maximum, 0.0, 0.0, p["upper_chest_z"]),
    )
    upper_chest = set_bone(
        bones, "upper-chest",
        head=chest.tail,
        tail=point(minimum, maximum, 0.0, 0.0, p["neck_z"] - 0.018),
    )
    neck = set_bone(
        bones, "neck",
        head=upper_chest.tail,
        tail=point(minimum, maximum, 0.0, 0.0, p["neck_z"]),
    )
    set_bone(
        bones, "head",
        head=neck.tail,
        tail=point(minimum, maximum, 0.0, 0.0, p["head_z"]),
    )

    for side, sign in (("l", 1.0), ("r", -1.0)):
        shoulder = set_bone(
            bones, f"shoulder-{side}",
            head=upper_chest.tail,
            tail=point(minimum, maximum, p["shoulder_x"] * sign, 0.0, p["shoulder_z"]),
        )
        upper_arm = set_bone(
            bones, f"upper-arm-{side}",
            head=shoulder.tail,
            tail=point(minimum, maximum, p["elbow_x"] * sign, 0.0, p["elbow_z"]),
        )
        lower_arm = set_bone(
            bones, f"lower-arm-{side}",
            head=upper_arm.tail,
            tail=point(minimum, maximum, p["wrist_x"] * sign, 0.0, p["wrist_z"]),
        )
        set_bone(
            bones, f"hand-{side}",
            head=lower_arm.tail,
            tail=point(minimum, maximum, p["hand_x"] * sign, -0.01, p["hand_z"]),
        )

        upper_leg = set_bone(
            bones, f"upper-leg-{side}",
            head=point(minimum, maximum, p["hip_x"] * sign, 0.0, p["hips_z"] + 0.005),
            tail=point(minimum, maximum, p["knee_x"] * sign, 0.0, p["knee_z"]),
        )
        lower_leg = set_bone(
            bones, f"lower-leg-{side}",
            head=upper_leg.tail,
            tail=point(minimum, maximum, p["ankle_x"] * sign, 0.0, p["ankle_z"]),
        )
        foot = set_bone(
            bones, f"foot-{side}",
            head=lower_leg.tail,
            tail=point(minimum, maximum, p["ankle_x"] * sign, p["foot_y"], p["foot_z"]),
        )
        set_bone(
            bones, f"toe-{side}",
            head=foot.tail,
            tail=point(minimum, maximum, p["ankle_x"] * sign, p["toe_y"], p["toe_z"]),
        )

    bpy.ops.object.mode_set(mode="OBJECT")
    rig.data.display_type = "STICK"
    rig.show_in_front = True


def save(output):
    output = os.path.abspath(output)
    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=output)
    return output


def main():
    input_path = arg("--input")
    output = arg("--output")
    body = arg("--body")

    if body not in PROFILE:
        raise SystemExit("--body must be male or female")
    if not input_path or not output:
        raise SystemExit("Require --input, --body and --output")

    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(input_path))

    rig = find_rig()
    meshes = [
        obj for obj in mesh_objects()
        if obj.name in {f"cue_{body}_skin", f"cue_{body}_underwear"}
        or obj.name.startswith(f"cue_{body}_skin")
        or obj.name.startswith(f"cue_{body}_underwear")
    ]
    if len(meshes) < 2:
        raise RuntimeError("V2 skin/underwear meshes not found")

    minimum, maximum = combined_bounds(meshes)
    align_rig(rig, minimum, maximum, body)

    output_path = save(output)

    report = {
        "status": "v2-anatomical-alignment-final-candidate",
        "body": body,
        "input": os.path.abspath(input_path),
        "output": output_path,
        "displayType": rig.data.display_type,
        "productionReady": False,
        "notes": [
            "V2-specific rest-joint positions applied.",
            "Arms aligned to the closer neutral pose of the new Meshy masters.",
            "Shoulder, elbow, wrist, hip, knee, ankle and foot joints refined before weight polish.",
            "Existing weights and QA actions remain in the file and must be visually rechecked.",
        ],
    }

    report_path = os.path.splitext(output_path)[0] + ".alignment-report.json"
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
