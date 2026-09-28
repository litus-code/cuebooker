# CUE ID V2 geometry-driven anatomical rig alignment.
# Uses the actual V2 mesh to derive limb/joint centers instead of fixed bbox offsets.
#
# Blender 5.2.2:
# blender --background --python scripts/blender/cue-id-bald-v2-landmark-align.py -- \
#   --input /abs/cueid-male-body-bald-master-v2-rigged.blend \
#   --body male \
#   --output /abs/cueid-male-body-bald-master-v2-landmark-aligned.blend

import bpy
import json
import math
import os
import sys
from statistics import median
from mathutils import Vector


def arg(flag):
    if "--" not in sys.argv:
        return None
    values = sys.argv[sys.argv.index("--") + 1:]
    try:
        i = values.index(flag)
    except ValueError:
        return None
    return values[i + 1] if i + 1 < len(values) else None


def mesh_objects():
    return [o for o in bpy.context.scene.objects if o.type == "MESH"]


def find_rig():
    rig = bpy.data.objects.get("cue_rig")
    if rig and rig.type == "ARMATURE":
        return rig
    rigs = [o for o in bpy.context.scene.objects if o.type == "ARMATURE"]
    if len(rigs) != 1:
        raise RuntimeError(f"Expected one armature, found {len(rigs)}")
    return rigs[0]


def world_vertices(objects):
    pts = []
    for obj in objects:
        mw = obj.matrix_world
        pts.extend(mw @ v.co for v in obj.data.vertices)
    if not pts:
        raise RuntimeError("No mesh vertices found")
    return pts


def bounds(points):
    mn = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    mx = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return mn, mx


def nz(point, mn, mx):
    return (point.z - mn.z) / max(mx.z - mn.z, 1e-8)


def slice_points(points, mn, mx, z0, z1):
    return [p for p in points if z0 <= nz(p, mn, mx) <= z1]


def center(points):
    if not points:
        raise RuntimeError("Empty landmark point set")
    return Vector((
        median([p.x for p in points]),
        median([p.y for p in points]),
        median([p.z for p in points]),
    ))


def side_cluster(points, side, center_x, min_abs_ratio, half_width):
    sign = 1 if side == "l" else -1
    cutoff = min_abs_ratio * half_width
    out = []
    for p in points:
        dx = p.x - center_x
        if sign * dx > cutoff:
            out.append(p)
    return out


def robust_joint(points, mn, mx, z0, z1, side, center_x, half_width, min_abs_ratio):
    band = slice_points(points, mn, mx, z0, z1)
    cluster = side_cluster(band, side, center_x, min_abs_ratio, half_width)
    if len(cluster) < 20:
        raise RuntimeError(f"Insufficient geometry for {side} joint {z0}-{z1}")
    return center(cluster)


def central_joint(points, mn, mx, z0, z1, center_x, half_width, max_abs_ratio=0.16):
    band = slice_points(points, mn, mx, z0, z1)
    selected = [p for p in band if abs(p.x - center_x) <= max_abs_ratio * half_width]
    if len(selected) < 20:
        selected = band
    return center(selected)


def set_bone(bones, name, head, tail):
    b = bones.get(name)
    if not b:
        raise RuntimeError(f"Missing bone: {name}")
    b.head = head
    b.tail = tail
    if (b.tail - b.head).length < 0.005:
        b.tail.z += 0.01
    return b


LANDMARKS = {
    "male": {
        "hips": (0.475, 0.505),
        "spine": (0.565, 0.595),
        "chest": (0.650, 0.685),
        "upper_chest": (0.725, 0.755),
        "neck": (0.800, 0.835),
        "head": (0.925, 0.975),
        "shoulder": (0.715, 0.755, 0.42),
        "elbow": (0.565, 0.625, 0.48),
        "wrist": (0.455, 0.515, 0.52),
        "hand": (0.400, 0.455, 0.54),
        "hip_side": (0.455, 0.515, 0.18),
        "knee": (0.255, 0.315, 0.18),
        "ankle": (0.055, 0.095, 0.14),
        "toe": (0.005, 0.040, 0.12),
    },
    "female": {
        "hips": (0.485, 0.515),
        "spine": (0.575, 0.605),
        "chest": (0.660, 0.695),
        "upper_chest": (0.735, 0.765),
        "neck": (0.805, 0.840),
        "head": (0.925, 0.975),
        "shoulder": (0.720, 0.760, 0.40),
        "elbow": (0.570, 0.630, 0.46),
        "wrist": (0.465, 0.525, 0.50),
        "hand": (0.410, 0.465, 0.52),
        "hip_side": (0.465, 0.525, 0.16),
        "knee": (0.260, 0.320, 0.16),
        "ankle": (0.060, 0.100, 0.13),
        "toe": (0.005, 0.040, 0.11),
    },
}


def main():
    input_path = arg("--input")
    output = arg("--output")
    body = arg("--body")

    if body not in LANDMARKS:
        raise SystemExit("--body must be male or female")
    if not input_path or not output:
        raise SystemExit("Require --input, --body and --output")

    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(input_path))
    rig = find_rig()

    meshes = [
        o for o in mesh_objects()
        if o.name.startswith(f"cue_{body}_skin") or o.name.startswith(f"cue_{body}_underwear")
    ]
    if len(meshes) < 2:
        raise RuntimeError("V2 skin/underwear meshes not found")

    points = world_vertices(meshes)
    mn, mx = bounds(points)
    center_x = (mn.x + mx.x) * 0.5
    half_width = (mx.x - mn.x) * 0.5
    cfg = LANDMARKS[body]

    hips_c = central_joint(points, mn, mx, *cfg["hips"], center_x, half_width)
    spine_c = central_joint(points, mn, mx, *cfg["spine"], center_x, half_width)
    chest_c = central_joint(points, mn, mx, *cfg["chest"], center_x, half_width)
    upper_c = central_joint(points, mn, mx, *cfg["upper_chest"], center_x, half_width)
    neck_c = central_joint(points, mn, mx, *cfg["neck"], center_x, half_width, 0.10)
    head_c = central_joint(points, mn, mx, *cfg["head"], center_x, half_width, 0.12)

    root_h = Vector((center_x, hips_c.y, mn.z + 0.01 * (mx.z - mn.z)))
    root_t = Vector((center_x, hips_c.y, mn.z + 0.08 * (mx.z - mn.z)))

    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    bones = rig.data.edit_bones

    set_bone(bones, "root", root_h, root_t)
    set_bone(bones, "hips", hips_c, spine_c)
    set_bone(bones, "spine", spine_c, chest_c)
    set_bone(bones, "chest", chest_c, upper_c)
    set_bone(bones, "upper-chest", upper_c, neck_c)
    set_bone(bones, "neck", neck_c, head_c)
    head_tail = Vector((head_c.x, head_c.y, mx.z - 0.025 * (mx.z - mn.z)))
    set_bone(bones, "head", head_c, head_tail)

    landmarks = {
        "center": {
            "hips": list(hips_c),
            "spine": list(spine_c),
            "chest": list(chest_c),
            "upper_chest": list(upper_c),
            "neck": list(neck_c),
            "head": list(head_c),
        }
    }

    for side in ("l", "r"):
        shoulder = robust_joint(points, mn, mx, cfg["shoulder"][0], cfg["shoulder"][1], side, center_x, half_width, cfg["shoulder"][2])
        elbow = robust_joint(points, mn, mx, cfg["elbow"][0], cfg["elbow"][1], side, center_x, half_width, cfg["elbow"][2])
        wrist = robust_joint(points, mn, mx, cfg["wrist"][0], cfg["wrist"][1], side, center_x, half_width, cfg["wrist"][2])
        hand = robust_joint(points, mn, mx, cfg["hand"][0], cfg["hand"][1], side, center_x, half_width, cfg["hand"][2])
        hip = robust_joint(points, mn, mx, cfg["hip_side"][0], cfg["hip_side"][1], side, center_x, half_width, cfg["hip_side"][2])
        knee = robust_joint(points, mn, mx, cfg["knee"][0], cfg["knee"][1], side, center_x, half_width, cfg["knee"][2])
        ankle = robust_joint(points, mn, mx, cfg["ankle"][0], cfg["ankle"][1], side, center_x, half_width, cfg["ankle"][2])

        toe_band = slice_points(points, mn, mx, cfg["toe"][0], cfg["toe"][1])
        toe_side = side_cluster(toe_band, side, center_x, cfg["toe"][2], half_width)
        # Toe target = forward-most median cluster near same side/foot.
        toe_side = sorted(toe_side, key=lambda p: p.y)[: max(20, len(toe_side)//3)]
        toe = center(toe_side)

        set_bone(bones, f"shoulder-{side}", upper_c, shoulder)
        set_bone(bones, f"upper-arm-{side}", shoulder, elbow)
        set_bone(bones, f"lower-arm-{side}", elbow, wrist)
        set_bone(bones, f"hand-{side}", wrist, hand)
        set_bone(bones, f"upper-leg-{side}", hip, knee)
        set_bone(bones, f"lower-leg-{side}", knee, ankle)
        set_bone(bones, f"foot-{side}", ankle, toe)

        toe_tail = Vector((toe.x, toe.y - 0.06 * (mx.y - mn.y), max(mn.z, toe.z - 0.005)))
        set_bone(bones, f"toe-{side}", toe, toe_tail)

        landmarks[side] = {
            "shoulder": list(shoulder),
            "elbow": list(elbow),
            "wrist": list(wrist),
            "hand": list(hand),
            "hip": list(hip),
            "knee": list(knee),
            "ankle": list(ankle),
            "toe": list(toe),
        }

    bpy.ops.object.mode_set(mode="OBJECT")
    rig.data.display_type = "STICK"
    rig.show_in_front = True

    output = os.path.abspath(output)
    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=output)

    report = {
        "status": "v2-landmark-alignment-candidate",
        "body": body,
        "output": output,
        "productionReady": False,
        "landmarks": landmarks,
        "notes": [
            "Joint centers are derived from actual V2 mesh geometry rather than fixed bounding-box percentages.",
            "This is the preferred alignment candidate after fixed-percentage alignment proved visually poor.",
            "Weights are not polished by this pass.",
        ],
    }
    report_path = os.path.splitext(output)[0] + ".landmark-report.json"
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2)
        handle.write("\n")

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
