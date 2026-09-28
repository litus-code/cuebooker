# CUE ID V2 proxy auto-weight rebuild.
#
# Rebuilds body skinning from the approved V2 geometry/rig using a decimated
# proxy mesh + Blender automatic weights, then transfers those weights back
# to the high-res skin and underwear. Intended to replace the bad V10
# nearest-neighbour weight transfer visible in shoulder/elbow QA.
#
# Blender 5.2.2:
# blender --background --python scripts/blender/cue-id-v2-proxy-auto-weights.py -- \
#   --input /abs/male-final-approved-v2.blend \
#   --body male \
#   --output /abs/male-v2-weighted-candidate.blend

import bpy
import json
import os
import sys


def arg(flag):
    if "--" not in sys.argv:
        return None
    vals = sys.argv[sys.argv.index("--") + 1:]
    try:
        i = vals.index(flag)
    except ValueError:
        return None
    return vals[i + 1] if i + 1 < len(vals) else None


def clear_pose_and_action(rig):
    if rig.animation_data:
        rig.animation_data.action = None
        for track in rig.animation_data.nla_tracks:
            track.mute = True
    for pb in rig.pose.bones:
        pb.location = (0.0, 0.0, 0.0)
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
        pb.scale = (1.0, 1.0, 1.0)
    bpy.context.scene.frame_set(1)
    bpy.context.view_layer.update()


def find_mesh(prefix):
    exact = bpy.data.objects.get(prefix)
    if exact and exact.type == "MESH":
        return exact
    matches = [o for o in bpy.context.scene.objects if o.type == "MESH" and o.name.startswith(prefix)]
    if not matches:
        raise RuntimeError(f"Mesh not found: {prefix}")
    return matches[0]


def bone_group_names(rig):
    return [b.name for b in rig.data.bones if b.use_deform]


def clear_bone_groups(obj, bone_names):
    wanted = set(bone_names)
    for group in list(obj.vertex_groups):
        if group.name in wanted:
            obj.vertex_groups.remove(group)


def ensure_groups(obj, names):
    existing = {g.name for g in obj.vertex_groups}
    for name in names:
        if name not in existing:
            obj.vertex_groups.new(name=name)


def remove_armature_modifiers(obj):
    for mod in list(obj.modifiers):
        if mod.type == "ARMATURE":
            obj.modifiers.remove(mod)


def make_proxy(skin, target_faces):
    proxy = skin.copy()
    proxy.data = skin.data.copy()
    proxy.name = "_CUE_WEIGHT_PROXY"
    proxy.data.name = "_CUE_WEIGHT_PROXY_DATA"
    bpy.context.collection.objects.link(proxy)

    remove_armature_modifiers(proxy)
    proxy.parent = None
    proxy.matrix_parent_inverse.identity()
    proxy.animation_data_clear()
    proxy.vertex_groups.clear()

    face_count = max(1, len(proxy.data.polygons))
    ratio = min(1.0, max(0.03, target_faces / face_count))

    if ratio < 0.999:
        mod = proxy.modifiers.new("CUE_PROXY_DECIMATE", "DECIMATE")
        mod.decimate_type = "COLLAPSE"
        mod.ratio = ratio
        mod.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = proxy
        proxy.select_set(True)
        bpy.ops.object.modifier_apply(modifier=mod.name)
        proxy.select_set(False)

    return proxy


def automatic_weight(proxy, rig):
    bpy.ops.object.select_all(action="DESELECT")
    proxy.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig

    try:
        bpy.ops.object.parent_set(type="ARMATURE_AUTO")
    except RuntimeError as exc:
        raise RuntimeError(f"Automatic weighting failed on proxy: {exc}")

    # Confirm useful coverage.
    bone_names = {b.name for b in rig.data.bones if b.use_deform}
    proxy_groups = {g.name for g in proxy.vertex_groups}
    missing = sorted(bone_names - proxy_groups)
    if missing:
        raise RuntimeError("Proxy auto-weight missing deform groups: " + ", ".join(missing))


def data_transfer_weights(source, target, bone_names):
    clear_bone_groups(target, bone_names)
    ensure_groups(target, bone_names)

    mod = target.modifiers.new("CUE_PROXY_WEIGHT_TRANSFER", "DATA_TRANSFER")
    mod.object = source
    mod.use_vert_data = True
    mod.data_types_verts = {"VGROUP_WEIGHTS"}
    mod.vert_mapping = "POLYINTERP_NEAREST"
    mod.layers_vgroup_select_src = "ALL"
    mod.layers_vgroup_select_dst = "NAME"
    mod.mix_mode = "REPLACE"
    mod.mix_factor = 1.0

    bpy.context.view_layer.objects.active = target
    target.select_set(True)
    bpy.ops.object.modifier_apply(modifier=mod.name)
    target.select_set(False)


def ensure_armature_modifier(obj, rig):
    mods = [m for m in obj.modifiers if m.type == "ARMATURE"]
    if mods:
        mod = mods[0]
        mod.object = rig
        for extra in mods[1:]:
            obj.modifiers.remove(extra)
    else:
        mod = obj.modifiers.new("CueRig", "ARMATURE")
        mod.object = rig
    obj.parent = rig
    obj.matrix_parent_inverse = rig.matrix_world.inverted()


def coverage(obj, bone_names):
    allowed = set(bone_names)
    weighted = 0
    max_groups = 0
    for v in obj.data.vertices:
        count = 0
        total = 0.0
        for membership in v.groups:
            name = obj.vertex_groups[membership.group].name
            if name in allowed and membership.weight > 1e-6:
                count += 1
                total += membership.weight
        if total > 1e-6:
            weighted += 1
        max_groups = max(max_groups, count)
    total_vertices = len(obj.data.vertices)
    return {
        "vertices": total_vertices,
        "weightedVertices": weighted,
        "weightedPct": round(100.0 * weighted / total_vertices, 3) if total_vertices else 0.0,
        "maxInfluencesObserved": max_groups,
    }


def main():
    inp = arg("--input")
    body = arg("--body")
    output = arg("--output")
    target_faces = int(arg("--proxy-faces") or "24000")

    if body not in {"male", "female"}:
        raise SystemExit("--body must be male or female")
    if not inp or not output:
        raise SystemExit("Require --input, --body and --output")

    bpy.ops.wm.open_mainfile(filepath=os.path.abspath(inp))

    rig = bpy.data.objects.get("cue_rig")
    if not rig or rig.type != "ARMATURE":
        raise RuntimeError("cue_rig armature not found")

    clear_pose_and_action(rig)
    rig.data.pose_position = "REST"

    skin = find_mesh(f"cue_{body}_skin")
    underwear = find_mesh(f"cue_{body}_underwear")
    bone_names = bone_group_names(rig)

    proxy = make_proxy(skin, target_faces)
    automatic_weight(proxy, rig)

    data_transfer_weights(proxy, skin, bone_names)
    ensure_armature_modifier(skin, rig)

    # Underwear follows the body surface; transfer the rebuilt body weights.
    data_transfer_weights(skin, underwear, bone_names)
    ensure_armature_modifier(underwear, rig)

    skin_cov = coverage(skin, bone_names)
    underwear_cov = coverage(underwear, bone_names)

    # Remove proxy after successful transfer.
    bpy.data.objects.remove(proxy, do_unlink=True)

    rig.data.pose_position = "POSE"
    clear_pose_and_action(rig)

    output = os.path.abspath(output)
    os.makedirs(os.path.dirname(output), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=output)

    report = {
        "status": "v2-proxy-auto-weight-candidate",
        "body": body,
        "input": os.path.abspath(inp),
        "output": output,
        "proxyTargetFaces": target_faces,
        "skinCoverage": skin_cov,
        "underwearCoverage": underwear_cov,
        "productionReady": False,
        "notes": [
            "Approved V2 geometry and rig alignment are preserved.",
            "Weights are rebuilt from a decimated clean proxy using Blender automatic weights.",
            "High-resolution skin receives interpolated proxy weights.",
            "Underwear receives weights from the rebuilt skin surface.",
            "Must pass shoulder/elbow/hip/knee/neck QA before acceptance.",
        ],
    }

    with open(os.path.splitext(output)[0] + ".weight-report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)
        f.write("\n")

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
